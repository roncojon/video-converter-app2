// Import required modules at the top
const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const { execFile, spawn } = require('child_process'); // Use spawn for progress tracking
const {
  ffmpegPath,
  getBaseNameWithoutExt,
  getHlsArguments,
  getVideoResolution,
} = require('./ffmpegUtils');

function setupIpcHandlers() {
  // Handler for selecting a single file
  ipcMain.handle('select-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Videos', extensions: ['mp4'] }],
    });
    return canceled ? null : filePaths[0];
  });

  // Handler for selecting a folder
  ipcMain.handle('select-folder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return canceled ? null : filePaths[0];
  });

  // Handler for generating HLS for a single file
  ipcMain.handle('generate-hls', async (event, filePath, outputDir) => {
    return await convertVideoToHLS(event, filePath, outputDir);
  });

  // New handler for generating HLS for all videos in a folder
  ipcMain.handle('generate-hls-folder', async (event, folderPath, outputDir) => {
    const videoFiles = fs.readdirSync(folderPath).filter(file => path.extname(file).toLowerCase() === '.mp4');

    if (videoFiles.length === 0) {
      return 'No mp4 files found in the selected folder.';
    }

    for (const file of videoFiles) {
      const filePath = path.join(folderPath, file);
      try {
        await convertVideoToHLS(event, filePath, outputDir);
      } catch (error) {
        event.sender.send('conversion-progress', { error: `Failed to convert ${file}: ${error.message}` });
      }
    }

    return `All videos in ${folderPath} have been converted to HLS.`;
  });
}

// Define log file path
const logFilePath = path.join(__dirname, 'conversion_logs.txt');

// Helper function to write logs to file
function logToFile(message) {
  fs.appendFileSync(logFilePath, `${new Date().toISOString()} - ${message}\n`);
}

// Helper function to convert a video to HLS format
async function convertVideoToHLS(event, filePath, outputDir) {
  const resolutions = [
    { width: 426, height: 240, label: '240p' },
    { width: 640, height: 360, label: '360p' },
    { width: 854, height: 480, label: '480p' },
    { width: 1280, height: 720, label: '720p' },
    { width: 1920, height: 1080, label: '1080p' },
    { width: 2560, height: 1440, label: '1440p' }, // 2K
    { width: 3840, height: 2160, label: '2160p' }, // 4K
  ];

  const baseName = getBaseNameWithoutExt(filePath);
  const videoOutputDir = path.join(outputDir, baseName);
  fs.mkdirSync(videoOutputDir, { recursive: true });

  // Get the video resolution and log it
  const videoResolution = await getVideoResolution(filePath);
  const { width: videoWidth, height: videoHeight } = videoResolution;
  console.log("Detected video resolution:", videoResolution);
  // logToFile(`Detected video resolution: ${videoWidth}x${videoHeight}`);
  // Determine the smaller dimension for resolution filtering
  const minDimension = Math.min(videoWidth, videoHeight);

  // Filter resolutions to include all lower or matching resolutions based on the smaller dimension
  const applicableResolutions = resolutions.filter(res => Math.min(res.width, res.height) <= minDimension);

  // Use the closest applicable resolutions or fallback to the highest supported
  const selectedResolutions = applicableResolutions.length
    ? applicableResolutions
    : [resolutions[resolutions.length - 1]]; // Default to 4K for high-res videos

  console.log("Selected resolutions for conversion:", selectedResolutions);
  // logToFile(`Selected resolutions for conversion: ${selectedResolutions.map(res => res.label).join(', ')}`);

  const masterPlaylistPath = path.join(videoOutputDir, 'master.m3u8');
  const masterPlaylistLines = ['#EXTM3U'];

  for (const res of selectedResolutions) {
    const resOutputDir = path.join(videoOutputDir, res.label);
    fs.mkdirSync(resOutputDir, { recursive: true });

    const args = getHlsArguments(filePath, videoOutputDir, res.width, res.height, res.label);
    const ffmpegProcess = spawn(ffmpegPath, args);

    ffmpegProcess.stderr.on('data', (data) => {
      const output = data.toString();
      const match = output.match(/frame=\s*(\d+)/);
      if (match) {
        const frameCount = parseInt(match[1], 10);
        event.sender.send('conversion-progress', { resolution: res.label, frameCount });
      }
    });

    await new Promise((resolve, reject) => {
      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });
    });

    masterPlaylistLines.push(`#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=${res.width}x${res.height}`);
    masterPlaylistLines.push(`${res.label}/${res.label}.m3u8`);
  }

  fs.writeFileSync(masterPlaylistPath, masterPlaylistLines.join('\n'));
  return `Master playlist created at ${masterPlaylistPath}`;
}





module.exports = { setupIpcHandlers };
