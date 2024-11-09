// Import required modules at the top
const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process'); // Use spawn for progress tracking
const {
  ffmpegPath,
  saveExtraInfo,
  getBaseNameWithoutExt,
  getHlsArguments,
  getVideoResolution,
  generateThumbnails, // Import the generateThumbnails function from ffmpegUtils.js
  generateFrameImages
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

// Helper function to convert a video to HLS format and generate thumbnails for .vtt
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

  // Check if the output folder already exists, and skip conversion if it does
  if (fs.existsSync(videoOutputDir)) {
    event.sender.send('conversion-progress', { message: `Skipping ${baseName}: output folder already exists.` });
    return `Skipped ${baseName} as the output folder already exists.`;
  }

  fs.mkdirSync(videoOutputDir, { recursive: true });

  // Get the video resolution and log it
  const videoResolution = await getVideoResolution(filePath);
  const { width: videoWidth, height: videoHeight } = videoResolution;
  console.log("Detected video resolution:", videoResolution);

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

  for (const res of applicableResolutions) {
    const resOutputDir = path.join(videoOutputDir, res.label);
    fs.mkdirSync(resOutputDir, { recursive: true });

    const args = getHlsArguments(filePath, videoOutputDir, res.width, res.height, res.label);
    const ffmpegProcess = spawn(ffmpegPath, args);
    // const ffmpegProcess = spawn(ffmpegPath, args, { priority: -20 }); // -20 is highest priority in Node.js
    
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

  // Generate Thumbnails and .vtt file
  try {
    const vttFilePath = await generateThumbnails(filePath, videoOutputDir, 5); // Adjust interval as desired
    event.sender.send('thumbnail-progress', { message: `Thumbnails and VTT file created: ${vttFilePath}` });
  } catch (error) {
    console.error("Error generating thumbnails:", error);
    logToFile(`Error generating thumbnails: ${error.message}`);
  }

  // Generate extraInfo.txt with video details
  try {
    const extraInfoPath = await saveExtraInfo(filePath, videoOutputDir);
    event.sender.send('extra-info-progress', { message: `Extra info saved to: ${extraInfoPath}` });
  } catch (error) {
    console.error("Error saving extra info:", error);
    logToFile(`Error saving extra info: ${error.message}`);
  }

  // Generate HD and low-resolution images from 40% of video duration
  try {
    const [hdImagePath, lowResImagePath] = await generateFrameImages(filePath, videoOutputDir);
    event.sender.send('frame-images-progress', {
      message: `HD and low-res images created at: ${hdImagePath}, ${lowResImagePath}`
    });
  } catch (error) {
    console.error("Error generating frame images:", error);
    logToFile(`Error generating frame images: ${error.message}`);
  }

  return `Master playlist, VTT file, extra info, and frame images created at ${masterPlaylistPath}`;
}

module.exports = { setupIpcHandlers };
