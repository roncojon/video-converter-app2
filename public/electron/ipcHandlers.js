// public/electron/ipcHandlers.js
// Import required modules at the top
const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process'); // Use spawn for progress tracking
const {
  ffmpegPath,
  saveExtraInfo,
  getBaseNameWithoutExt,
  getHlsArguments,
  getVideoResolution,
  generateThumbnails, // Import the generateThumbnails function from ffmpegUtils.js
  generateFrameImages,
  generatePreviewVideo, // Import the generatePreviewVideo function
  getTotalFrames
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

  // Handler for obtaining the qtty of CPU cores
  ipcMain.handle('get-cpu-count', async () => {
    return os.cpus().length;
  });

  // Handler for selecting a folder
  ipcMain.handle('select-folder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return canceled ? null : filePaths[0];
  });

  // Handler for generating HLS for a single file
  ipcMain.handle('generate-hls', async (event, filePath, outputDir, cpuSelection, priorityLevel) => {
    console.log('generate-hlscpuSelectioncpuSelection:', cpuSelection)
    console.log('generate-hlspriorityLevelpriorityLevel:', priorityLevel)
    const isConvertingFolder = false;
    return await convertVideoToHLS(event, filePath, outputDir, cpuSelection, priorityLevel, isConvertingFolder);
  });

  // New handler for generating HLS for all videos in a folder
  ipcMain.handle('generate-hls-folder', async (event, folderPath, outputDir, cpuSelection, priorityLevel) => {
    const videoFiles = fs.readdirSync(folderPath).filter(file => path.extname(file).toLowerCase() === '.mp4');

    if (videoFiles.length === 0) {
      return 'No mp4 files found in the selected folder.';
    }

    for (const file of videoFiles) {
      const filePath = path.join(folderPath, file);
      try {
        const isConvertingFolder = true;
        await convertVideoToHLS(event, filePath, outputDir, cpuSelection, priorityLevel, isConvertingFolder);
      } catch (error) {
        event.sender.send(conversionProgress, { error: `Failed to convert ${file}: ${error.message}` });
      }
    }

    return `All videos in ${folderPath} have been converted to HLS.`;
  });

}

// // New handler for generating a preview video
// ipcMain.handle('generate-preview-video', async (event, filePath, outputDir, previewDuration) => {
//   try {
//     const previewPath = await generatePreviewVideo(filePath, outputDir, previewDuration);
//     return `Preview video created at ${previewPath}`;
//   } catch (error) {
//     return `Error generating preview video: ${error.message}`;
//   }
// });

// Define log file path
const logFilePath = path.join(__dirname, 'conversion_logs.txt');

// Helper function to write logs to file
function logToFile(message) {
  fs.appendFileSync(logFilePath, `${new Date().toISOString()} - ${message}\n`);
}

// Helper function to convert a video to HLS format and generate thumbnails for .vtt
async function convertVideoToHLS(event, filePath, outputDir, cpuSelection, priorityLevel, isConvertingFolder) {
  const conversionProgress = isConvertingFolder ? "conversion-progress-folder" : "conversion-progress";
  console.log('cpuSelectioncpuSelection:', cpuSelection)
  console.log('cpuSelectioncpuSelection:', cpuSelection)
  console.log('priorityLevelpriorityLevel:', priorityLevel)
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
    event.sender.send(conversionProgress, { message: `Skipping ${baseName}: output folder already exists.` });
    return `Skipped ${baseName} as the output folder already exists.`;
  }

  fs.mkdirSync(videoOutputDir, { recursive: true });
  // Priority mapping based on Windows priority values
  const priorityMapping = {
    low: 64,      // Low priority in Windows wmic
    normal: 32,   // Normal priority in Windows wmic
    high: 128     // High priority in Windows wmic
  };
  const priorityValue = priorityMapping[priorityLevel] || 32;
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
  const masterPlaylistPath = path.join(videoOutputDir, 'master.m3u8');
  const masterPlaylistLines = ['#EXTM3U'];

  const framesOfSingleResolution = await getTotalFrames(filePath);
  const totalFrames = framesOfSingleResolution * (selectedResolutions?.length || 0); // Dynamically calculate total frames
  let processedFrames = -framesOfSingleResolution;
  console.log('totalFrames', totalFrames)

  for (const res of selectedResolutions) {
    processedFrames += framesOfSingleResolution;
    const resOutputDir = path.join(videoOutputDir, res.label);
    fs.mkdirSync(resOutputDir, { recursive: true });

    // Get FFmpeg arguments with selected threads
    const args = getHlsArguments(filePath, videoOutputDir, res.width, res.height, res.label, cpuSelection);
    // args.unshift('-threads', cpuSelection); // Add thread count to FFmpeg arguments

    const ffmpegProcess = spawn(ffmpegPath, args/* , { priority } */);

    // Helper function to set process priority on Windows
    function setWindowsProcessPriority(pid, priority) {
      const wmicCommand = `wmic process where ProcessId=${pid} CALL setpriority ${priority}`;
      spawn('cmd', ['/c', wmicCommand], { windowsHide: true });
    }

    // Set priority after the process starts
    setWindowsProcessPriority(ffmpegProcess.pid, priorityValue);

    // ffmpegProcess.stderr.on('data', (data) => {
    //   const output = data.toString();
    //   const match = output.match(/frame=\s*(\d+)/);
    //   if (match) {
    //     const frameCount = parseInt(match[1], 10);
    //     event.sender.send(conversionProgress, { resolution: res.label, frameCount });
    //   }
    // });

    console.log('totalFrames', totalFrames)
    ffmpegProcess.stderr.on('data', (data) => {
      const output = data.toString();
      const match = output.match(/frame=\s*(\d+)/); // Extract frame count
      if (match) {
        const frameCount = parseInt(match[1], 10);
        const percentage = Math.min((((processedFrames + frameCount) / totalFrames) * 100).toFixed(2), 100); // Calculate completion percentage
        event.sender.send(conversionProgress, {
          videoName: path.basename(filePath), // Include the video name
          resolution: res.label,
          frameCount,
          percentage,
        });
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

  // Generate Preview Video
  try {
    const previewDuration = 5; // You can customize the preview duration or pass it as a parameter
    const startTimePercent = 40; // You can customize the preview duration or pass it as a parameter

    const previewPath = await generatePreviewVideo(filePath, videoOutputDir, previewDuration, startTimePercent);
    event.sender.send('preview-video-progress', { message: `Preview video created: ${previewPath}` });
  } catch (error) {
    console.error("Error generating preview video:", error);
    logToFile(`Error generating preview video: ${error.message}`);
  }

  return `Master playlist, preview, VTT file, extra info, and frame images created at ${masterPlaylistPath}`;
}


module.exports = { setupIpcHandlers };
