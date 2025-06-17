<!-- "d:/_STORAGE FOR WIN 10/MalonNoporSite/videoCa2/video-converter-app/package.json": -->
{
  "name": "video-converter-app",
  "version": "0.1.0",
  "description": "A video converter application using Electron and React.",
  "author": "Your Name",
  "private": true,
  "homepage": ".",
  "main": "public/electron/electron.js",
  "dependencies": {
    "@dnd-kit/core": "^6.2.0",
    "@dnd-kit/modifiers": "^8.0.0",
    "@dnd-kit/sortable": "^9.0.0",
    "@testing-library/jest-dom": "^5.17.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0",
    "daisyui": "^4.12.13",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-scripts": "5.0.1",
    "uuid": "^11.0.3",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "concurrently \"react-scripts start\" \"electron .\"",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "electron-build": "electron-builder"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "autoprefixer": "^10.4.20",
    "concurrently": "^9.0.1",
    "electron": "^33.0.2",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14"
  },
  "build": {
    "appId": "com.yourcompany.video-converter-app",
    "productName": "Video Converter App",
    "directories": {
      "buildResources": "assets"
    },
    "files": [
      "build/**/*",
      "public/electron/**/*",
      "public/ffmpeg/**/*",
      "node_modules/**/*"
    ],
    "extraResources": [
      {
        "from": "public/ffmpeg",
        "to": "ffmpeg",
        "filter": [
          "**/*"
        ]
      }
    ],
    "extraMetadata": {
      "main": "public/electron/electron.js"
    },
    "win": {
      "target": [
        "portable"
      ]
    },
    "mac": {
      "target": "dmg"
    },
    "linux": {
      "target": "AppImage"
    }
  }
}


<!-- "d:/_STORAGE FOR WIN 10/MalonNoporSite/videoCa2/video-converter-app/postcss.config.js": -->
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}


<!-- "d:/_STORAGE FOR WIN 10/MalonNoporSite/videoCa2/video-converter-app/public/electron/electron.js": -->
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { setupIpcHandlers } = require('./ipcHandlers'); // Import the IPC handlers setup function

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 770,
    minWidth:700,
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.isPackaged) {
    // Load index.html from the build folder in production
    win.loadFile(path.join(app.getAppPath(), 'build', 'index.html'));
  } else {
    // Load the React development server in development
    win.loadURL('http://localhost:3000');
  }
  // win.webContents.setZoomFactor(0.85);
}

app.on('ready', () => {
  createWindow();
  setupIpcHandlers(); // Initialize IPC handlers
});


<!-- "d:/_STORAGE FOR WIN 10/MalonNoporSite/videoCa2/video-converter-app/public/electron/ffmpegUtils.js": -->
// public/electron/ffmpegUtils.js

const path = require('path');
const { execFile, execSync } = require('child_process');
const fs = require('fs');
const { app } = require('electron');

  const ffmpegPath = app.isPackaged 
  ? path.join(process.resourcesPath, 'ffmpeg', 'ffmpeg.exe') 
  : path.join(__dirname, '../ffmpeg/ffmpeg.exe');

const ffprobePath = app.isPackaged 
  ? path.join(process.resourcesPath, 'ffmpeg', 'ffprobe.exe') 
  : path.join(__dirname, '../ffmpeg/ffprobe.exe');
// Helper function to get the base name without extension
function getBaseNameWithoutExt(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

async function getTotalFrames(filePath) {
  try {
    // Run FFprobe to get video metadata
    const metadata = execSync(
      `"${ffprobePath}" -v error -select_streams v:0 -show_entries stream=duration,r_frame_rate -of csv=p=0 "${filePath}"`
    ).toString();

    console.log('FFprobe Output:', metadata); // Debugging: Check what FFprobe returns

    // Adjust parsing order based on the FFprobe output
    const [rFrameRate, duration] = metadata.trim().split(',');
    if (!duration || !rFrameRate) {
      throw new Error('Missing duration or frame rate in FFprobe output');
    }

    const [numerator, denominator] = rFrameRate.split('/').map(Number); // Parse frame rate
    if (!numerator || !denominator) {
      throw new Error('Invalid frame rate format');
    }

    const frameRate = numerator / denominator; // Calculate frame rate
    const totalFrames = Math.floor(parseFloat(duration) * frameRate); // Calculate total frames

    console.log(`Duration: ${duration}, Frame Rate: ${frameRate}, Total Frames: ${totalFrames}`);
    return totalFrames;
  } catch (error) {
    console.error('Error calculating total frames:', error.message);
    throw new Error('Failed to calculate total frames.');
  }
}



// Function to get HLS arguments for each resolution
function getHlsArguments(filePath, outputDir, width, height, resolutionLabel, cpuSelection) {
  const outputPattern = path.join(outputDir, resolutionLabel, `${resolutionLabel}_%03d.ts`);
  const m3u8File = path.join(outputDir, resolutionLabel, `${resolutionLabel}.m3u8`);

  return [
    '-i', filePath,
    '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2`,
    '-threads', cpuSelection ||'0',
    '-c:a', 'aac',                      // Audio codec for HLS compatibility
    '-ar', '32000',                     // Standard audio sample rate          !!RETURN TO 48K later
    '-b:a', '96k',                      // Lower audio bitrate to save bandwidth    !!IMPORTANT RETURN TO 128K later
    '-c:v', 'libx264',                  // Video codec optimized for HLS compatibility  
    '-profile:v', 'main',               // Suitable for compatibility with most devices
    '-preset', 'verySlow',                  // Fast encoding preset for speed over compression   !!IMPORTANT
    '-crf', '23',                       // Higher values till 28 will reduce file size while losing a bit of quality, and the opposite till 18
    '-sc_threshold', '0',               // Forces keyframes at scene changes only
    '-g', '48',                         // GOP size matching twice the frame rate (for 24fps video)
    '-keyint_min', '48',                // Minimum interval between keyframes
    '-hls_time', '6',                   // Shorter segment duration to reduce initial loading time
    '-hls_playlist_type', 'vod',        // Video on demand for non-live content
    '-hls_flags', 'independent_segments', // Allows each segment to decode independently
    '-hls_segment_filename', outputPattern, // Filename pattern for each segment
    '-f', 'hls',                        // HLS format for streaming
    m3u8File
  ];
}

// Function to get video resolution
async function getVideoResolution(filePath) {
  const args = [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height',
    '-of', 'json',
    filePath
  ];

  return new Promise((resolve, reject) => {
    execFile(ffprobePath, args, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        const { streams } = JSON.parse(stdout);
        if (streams && streams[0]) {
          const { width, height } = streams[0];
          resolve({ width, height });
        } else {
          reject(new Error("Could not retrieve video resolution"));
        }
      }
    });
  });
}

// Function to get video duration, max resolution, and HD flag, and save to extraInfo.txt
async function saveExtraInfo(filePath, outputDir) {
  const durationArgs = [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    filePath
  ];

  const resolutionArgs = [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height',
    '-of', 'json',
    filePath
  ];

  // Helper function to determine if a resolution is HD (720p or higher)
  function isHD(width, height) {
    return (width >= 1280 && height >= 720) || (width >= 720 && height >= 1280) ? 1 : 0;
  }

  return new Promise((resolve, reject) => {
    // Run ffprobe for duration
    execFile(ffprobePath, durationArgs, (durationError, durationStdout) => {
      if (durationError) {
        reject(durationError);
      } else {
        const duration = Math.ceil(parseFloat(durationStdout.trim()));

        // Run ffprobe for resolution
        execFile(ffprobePath, resolutionArgs, (resolutionError, resolutionStdout) => {
          if (resolutionError) {
            reject(resolutionError);
          } else {
            const { streams } = JSON.parse(resolutionStdout);
            if (streams && streams[0]) {
              const { width, height } = streams[0];
              const maxResolution = {
                width,
                height,
                label: `${height}p`
              };

              // Determine HD flag based on max resolution
              const HD = isHD(width, height);

              // Save information to extraInfo.txt
              const extraInfoPath = path.join(outputDir, 'extraInfo.txt');
              const extraInfoContent = [
                `durationInSeconds: ${duration}`,
                `maxResolution: { width: ${width}, height: ${height}, label: '${maxResolution.label}' }`,
                `HD: ${HD}`
              ].join('\n');
              fs.writeFileSync(extraInfoPath, extraInfoContent);
              resolve(extraInfoPath);
            } else {
              reject(new Error("Could not retrieve video resolution"));
            }
          }
        });
      }
    });
  });
}

// New function to generate thumbnails and a .vtt file
function generateFrameImages(filePath, outputDir, interval = 5) {
  const timedImagesDir = path.join(outputDir, 'timed_images'); // Store images in timed_images/thumbnails
  const vttFilePath = path.join(outputDir, 'timed_images', 'timed_images.vtt'); // Store .vtt in timed_images

  // Create the timed_images/thumbnails directory if it doesn't exist
  fs.mkdirSync(timedImagesDir, { recursive: true });

  // const baseName = getBaseNameWithoutExt(filePath);
  const args = [
    '-i', filePath,
    '-vf', `fps=1/${interval},scale=160:-1`, // 1 frame per interval seconds, width 160, height auto
    path.join(timedImagesDir, `thumb_%04d.jpg`) // Naming thumbnails as thumb_0001.jpg, thumb_0002.jpg, etc.
  ];

  return new Promise((resolve, reject) => {
    execFile(ffmpegPath, args, (error) => {
      if (error) {
        reject(error);
      } else {
        // Generate .vtt file from the created thumbnails
        const files = fs.readdirSync(timedImagesDir).filter(f => f.endsWith('.jpg')).sort();
        const vttContent = ['WEBVTT\n'];

        files.forEach((file, index) => {
          const timestamp = index * interval; // Calculate seconds based on interval
          const hours = String(Math.floor(timestamp / 3600)).padStart(2, '0');
          const minutes = String(Math.floor((timestamp % 3600) / 60)).padStart(2, '0');
          const seconds = String(timestamp % 60).padStart(2, '0');

          const nextTimestamp = (index + 1) * interval;
          const nextHours = String(Math.floor(nextTimestamp / 3600)).padStart(2, '0');
          const nextMinutes = String(Math.floor((nextTimestamp % 3600) / 60)).padStart(2, '0');
          const nextSeconds = String(nextTimestamp % 60).padStart(2, '0');

          vttContent.push(
            `${hours}:${minutes}:${seconds}.000 --> ${nextHours}:${nextMinutes}:${nextSeconds}.000`,
            path.join(file), // Use relative path for thumbnails
            ''
          );
        });

        fs.writeFileSync(vttFilePath, vttContent.join('\n'));
        resolve(vttFilePath);
      }
    });
  });
}

// New function to generate HD and low-resolution images from the frame at 40% of the video duration
async function generateThumbnails(filePath, outputDir) {
  // Get the video duration to calculate the 40% timestamp
  const durationArgs = [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    filePath
  ];

  const duration = await new Promise((resolve, reject) => {
    execFile(ffprobePath, durationArgs, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(Math.ceil(parseFloat(stdout.trim())));
      }
    });
  });

  const timestamp = Math.floor(duration * 0.4); // Calculate 40% of video duration

  // Create the thumbnails directory inside the outputDir
  const thumbnailsDir = path.join(outputDir, 'thumbnails');
  fs.mkdirSync(thumbnailsDir, { recursive: true });

  const hdImagePath = path.join(thumbnailsDir, 'hd_image.jpg');
  const lowResImagePath = path.join(thumbnailsDir, 'low_res_image.jpg');

  // Arguments for extracting HD image
  const hdArgs = [
    '-ss', `${timestamp}`,          // Seek to the timestamp (40% of video duration)
    '-i', filePath,
    '-frames:v', '1',               // Capture a single frame
    '-q:v', '2',                    // Set quality for HD (lower values are higher quality)
    hdImagePath
  ];

  // Arguments for extracting low-resolution image
  const lowResArgs = [
    '-ss', `${timestamp}`,
    '-i', filePath,
    '-frames:v', '1',
    '-vf', 'scale=640:-1',          // Resize to low resolution (e.g., 320px width)
    '-q:v', '5',                    // Set quality for lower resolution
    lowResImagePath
  ];

  // Run both processes to generate the images
  return Promise.all([
    new Promise((resolve, reject) => {
      execFile(ffmpegPath, hdArgs, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(hdImagePath);
        }
      });
    }),
    new Promise((resolve, reject) => {
      execFile(ffmpegPath, lowResArgs, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(lowResImagePath);
        }
      });
    })
  ]);
}

// Function to generate a preview video
function generatePreviewVideo(filePath, outputDir, previewDuration, startPercentage = 40) {
  // Create the preview output directory if it doesn't exist
  const previewDir = path.join(outputDir, 'preview');
  fs.mkdirSync(previewDir, { recursive: true });

  const previewFilePath = path.join(previewDir, 'preview.mp4');

  return new Promise((resolve, reject) => {
    // First, get the original video duration using FFprobe
    const durationArgs = [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath
    ];

    execFile(ffprobePath, durationArgs, (durationError, durationStdout) => {
      if (durationError) {
        reject(new Error(`Failed to retrieve video duration: ${durationError.message}`));
        return;
      }

      const duration = parseFloat(durationStdout.trim());
      const startTime = Math.floor(duration * (startPercentage / 100)); // Calculate start time based on the percentage

      const args = [
        '-ss', startTime,                 // Start time calculated from percentage of video duration
        '-i', filePath,                   // Input file
        '-t', previewDuration,            // Duration of the preview in seconds
        '-vf', 'scale=\'if(gt(a,1),-2,480)\':\'if(gt(a,1),480,-2)\'', // Dynamic scaling to handle both landscape and portrait
        '-an',                            // Remove audio
        '-c:v', 'libx264',                // Video codec optimized for HLS compatibility
        '-preset', 'verySlow',            // Slower preset for higher compression without quality loss
        '-crf', '22',                     // Higher values till 28 will reduce file size while losing a bit of quality, and the opposite till 18
        '-movflags', 'faststart',         // Allows playback to start faster
        previewFilePath                   // Output file path
      ];

      // Run FFmpeg with the arguments
      execFile(ffmpegPath, args, (error) => {
        if (error) {
          reject(new Error(`Failed to create preview video: ${error.message}`));
        } else {
          resolve(previewFilePath);
        }
      });
    });
  });
}


module.exports = {
  ffmpegPath,
  saveExtraInfo,
  getBaseNameWithoutExt,
  getHlsArguments,
  getVideoResolution,
  generateFrameImages,
  generateThumbnails, // Export the new function
  generatePreviewVideo,
  getTotalFrames 
};



<!-- "d:/_STORAGE FOR WIN 10/MalonNoporSite/videoCa2/video-converter-app/public/electron/ipcHandlers.js": -->
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
  ipcMain.handle('generate-hls', async (event, filePath, outputDir, cpuSelection, priorityLevel, onProgressEventName) => {
    console.log('generate-hlscpuSelectioncpuSelection:', cpuSelection)
    console.log('generate-hlspriorityLevelpriorityLevel:', priorityLevel)
    return await convertVideoToHLS(event, filePath, outputDir, cpuSelection, priorityLevel, onProgressEventName);
  });

  // New handler for generating HLS for all videos in a folder
  ipcMain.handle('generate-hls-folder', async (event, folderPath, outputDir, cpuSelection, priorityLevel, onProgressEventName) => {
    const videoFiles = fs.readdirSync(folderPath).filter(file => path.extname(file).toLowerCase() === '.mp4');

    if (videoFiles.length === 0) {
      return 'No mp4 files found in the selected folder.';
    }

    for (const file of videoFiles) {
      const filePath = path.join(folderPath, file);
        await convertVideoToHLS(event, filePath, outputDir, cpuSelection, priorityLevel, onProgressEventName);
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
async function convertVideoToHLS(event, filePath, outputDir, cpuSelection, priorityLevel, onProgressEventName) {
  const conversionProgress = onProgressEventName;
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
    const vttFilePath = await generateFrameImages(filePath, videoOutputDir, 5); // Adjust interval as desired
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
    const [hdImagePath, lowResImagePath] = await generateThumbnails(filePath, videoOutputDir);
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
  event.sender.send(conversionProgress, {
    videoName: path.basename(filePath), // Keep context for the UI
    percentage: 100,
    resolution: 'Completed', // Provide a clear final status
  });

  return `Master playlist, preview, VTT file, extra info, and frame images created at ${masterPlaylistPath}`;
}


module.exports = { setupIpcHandlers };


<!-- "d:/_STORAGE FOR WIN 10/MalonNoporSite/videoCa2/video-converter-app/public/electron/preload.js": -->
// public/electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  getCpuCount: () => ipcRenderer.invoke('get-cpu-count'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  generateHls: (filePath, outputPath, cpuSelection, priorityLevel, onProgressEventName) => ipcRenderer.invoke('generate-hls', filePath, outputPath, cpuSelection, priorityLevel, onProgressEventName),
  generateHlsFolder: (folderPath, outputPath, cpuSelection, priorityLevel, onProgressEventName) => ipcRenderer.invoke('generate-hls-folder', folderPath, outputPath, cpuSelection, priorityLevel, onProgressEventName), // Ensure this line is present
  onProgress: (eventName, callback) => ipcRenderer.on(eventName, callback),
  offProgress:(eventName, callback) => ipcRenderer.off(eventName, callback),
});


<!-- "d:/_STORAGE FOR WIN 10/MalonNoporSite/videoCa2/video-converter-app/public/index.html": -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="Web site created using create-react-app"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <!--
      manifest.json provides metadata used when your web app is installed on a
      user's mobile device or desktop. See https://developers.google.com/web/fundamentals/web-app-manifest/
    -->
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <!--
      Notice the use of %PUBLIC_URL% in the tags above.
      It will be replaced with the URL of the `public` folder during the build.
      Only files inside the `public` folder can be referenced from the HTML.

      Unlike "/favicon.ico" or "favicon.ico", "%PUBLIC_URL%/favicon.ico" will
      work correctly both with client-side routing and a non-root public URL.
      Learn how to configure a non-root public URL by running `npm run build`.
    -->
    <title>Mp4 to HLS Video Converter</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <!--
      This HTML file is a template.
      If you open it directly in the browser, you will see an empty page.

      You can add webfonts, meta tags, or analytics to this file.
      The build step will place the bundled scripts into the <body> tag.

      To begin the development, run `npm start` or `yarn start`.
      To create a production bundle, use `npm run build` or `yarn build`.
    -->
  </body>
</html>


<!-- "d:/_STORAGE FOR WIN 10/MalonNoporSite/videoCa2/video-converter-app/public/manifest.json": -->
{
  "short_name": "Mp4 to HLS Video Converter",
  "name": "Mp4 to HLS Video Converter",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "logo512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}


<!-- "d:/_STORAGE FOR WIN 10/MalonNoporSite/videoCa2/video-converter-app/src/App.css": -->
.App {
  text-align: center;
}

.App-logo {
  height: 40vmin;
  pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
  .App-logo {
    animation: App-logo-spin infinite 20s linear;
  }
}

.App-header {
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
}

.App-link {
  color: #61dafb;
}

@keyframes App-logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.tab-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}


<!-- "d:/_STORAGE FOR WIN 10/MalonNoporSite/videoCa2/video-converter-app/src/App.js": -->
import React from 'react';
import { TasksQueueContextProvider } from './contexts/TasksQueueContext';
import TasksQueue from './modules/TasksQueue/TasksQueue';
import ThemeSelector from './components/ThemeSelector';

const App = () => {
  return (
    <TasksQueueContextProvider>
      <div className="min-h-screen flex flex-col bg-base-200 p-4">
        {/* Header */}
        {/* <header className="mb-4">
          <h1 className="text-3xl font-bold text-center">Video Conversion App</h1>
        </header> */}

        <header className="flex justify-between items-center mb-4 pr-1">
          <div className=' w-1'></div>
          <h1 className="card-title text-2xl font-bold text-center mb-1">
            Mp4 to HLS Video Converter {/* - {taskId} */}
          </h1>
          <ThemeSelector />
        </header>

        {/* Task Queue */}
        <TasksQueue />

        {/* Add Task Button */}
        {/* <div className="flex justify-center mt-6">
          <button
            className="btn btn-primary"
            onClick={() =>
              document.dispatchEvent(new Event('add-task'))
            }
          >
            Add Task
          </button>
        </div> */}
      </div>
    </TasksQueueContextProvider>
  );
};

export default App;


<!-- "d:/_STORAGE FOR WIN 10/MalonNoporSite/videoCa2/video-converter-app/src/components/InfoIcon.js": -->
import React from 'react'

const InfoIcon = () => {
  return (
    <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    className="stroke-info h-6 w-6 shrink-0">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
  )
}

export default InfoIcon

<!-- "d:/_STORAGE FOR WIN 10/MalonNoporSite/videoCa2/video-converter-app/src/components/ThemeSelector.js": -->
import React from 'react'

const ThemeSelector = () => {
    return (
        <label className="swap swap-rotate">
            {/* this hidden checkbox controls the state */}
            <input type="checkbox" className="theme-controller" value="light" />

            {/* sun icon */}
            <svg
                className="swap-off h-10 w-10 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24">
                <path
                    d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
            </svg>

            {/* moon icon */}
            <svg
                className="swap-on h-10 w-10 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24">
                <path
                    d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
            </svg>
        </label>
    )
}

export default ThemeSelector

<!-- "d:/_STORAGE FOR WIN 10/MalonNoporSite/videoCa2/video-converter-app/src/contexts/SingleTaskSettingsContext.js": -->
// src/contexts/SingleTaskSettingsContext.js
import React, { createContext, useState } from 'react';

export const SingleTaskSettingsContext = createContext();

export function SettingsProvider({ children, taskId}) {

  const [taskEventNames, setTaskEventNames] = useState({
    eventNameSingleConversion: 'conversion-progress-' + taskId,
    eventNameFolderConversion: 'conversion-progress-folder-' + taskId
  });

  const [activeTab, setActiveTab] = useState("single");

  const [generalSettings, setGeneralSettings] = useState({
    cpuSelection: 0,
    priorityLevel: 'normal',
  });

  const [singleSettings, setSingleSettings] = useState({
    progress: {},
    selectedFile: null,
    outputFolder: null,
    outputText: null,
    converting: false
  });

  const [folderSettings, setFolderSettings] = useState({
    progress: {},
    selectedFolder: null,
    outputFolder: null,
    outputTextArray: null,
    converting: false
  });

  return (
    <SingleTaskSettingsContext.Provider
      value={{
        taskId,
        taskEventNames,
        activeTab,
        setActiveTab,
        generalSettings,
        setGeneralSettings,
        singleSettings,
        setSingleSettings,
        folderSettings,
        setFolderSettings,
      }}
    >
      {children}
    </SingleTaskSettingsContext.Provider>
  );
}


<!-- "d:/_STORAGE FOR WIN 10/MalonNoporSite/videoCa2/video-converter-app/src/contexts/TaskQueueContextExample.js": -->
 // Initial mock tasks for testing
 const initialTasks = {
    'task-1': {
      taskId: 'task-1',
      taskEventNames: {
        eventNameSingleConversion: 'conversion-progress-task-1',
        eventNameFolderConversion: 'conversion-progress-folder-task-1',
      },
      activeTab: 'single',
      generalSettings: {
        cpuSelection: 1,
        priorityLevel: 'high',
      },
      singleSettings: {
        progress: {},
        selectedFile: '/path/to/video1.mp4',
        outputFolder: '/output/folder1',
        outputText: null,
        converting: false,
      },
      folderSettings: {
        progress: {},
        selectedFolder: null,
        outputFolder: null,
        outputTextArray: null,
        converting: false,
      },
      status: 'queued',
    },
    'task-2': {
      taskId: 'task-2',
      taskEventNames: {
        eventNameSingleConversion: 'conversion-progress-task-2',
        eventNameFolderConversion: 'conversion-progress-folder-task-2',
      },
      activeTab: 'folder',
      generalSettings: {
        cpuSelection: 0,
        priorityLevel: 'normal',
      },
      singleSettings: {
        progress: {},
        selectedFile: '/path/to/video2.mp4',
        outputFolder: '/output/folder2',
        outputText: null,
        converting: true,
      },
      folderSettings: {
        progress: {},
        selectedFolder: '/input/folder2',
        outputFolder: '/output/folder2',
        outputTextArray: null,
        converting: true,
      },
      status: 'converting',
    },
    'task-3': {
      taskId: 'task-3',
      taskEventNames: {
        eventNameSingleConversion: 'conversion-progress-task-3',
        eventNameFolderConversion: 'conversion-progress-folder-task-3',
      },
      activeTab: 'single',
      generalSettings: {
        cpuSelection: 2,
        priorityLevel: 'low',
      },
      singleSettings: {
        progress: {},
        selectedFile: '/path/to/video3.mp4',
        outputFolder: '/output/folder3',
        outputText: null,
        converting: false,
      },
      folderSettings: {
        progress: {},
        selectedFolder: null,
        outputFolder: null,
        outputTextArray: null,
        converting: false,
      },
      status: 'queued',
    },
  };

<!-- "d:/_STORAGE FOR WIN 10/MalonNoporSite/videoCa2/video-converter-app/src/contexts/TasksQueueContext.js": -->
import React, { createContext, useState } from 'react';

export const TasksQueueContext = createContext();

export function TasksQueueContextProvider({ children }) {

  const [tasks, setTasks] = useState({});

  const addOrUpdateTask = (task) => {
    const { id } = task;
  
    if (!id) {
      console.error('Task ID is required to add or update a task.', task); // Log the task for debugging
      return;
    }
  
    setTasks((prevTasks) => ({
      ...prevTasks,
      [id]: task,
    }));
  };

  const removeTask = (taskId) => {
    setTasks((prevTasks) => {
      const updatedTasks = { ...prevTasks };
      delete updatedTasks[taskId];
      return updatedTasks;
    });
  };

  return (
    <TasksQueueContext.Provider
      value={{
        tasks,
        addOrUpdateTask,
        removeTask,
      }}
    >
      {children}
    </TasksQueueContext.Provider>
  );
}


<!-- "d:/_STORAGE FOR WIN 10/MalonNoporSite/videoCa2/video-converter-app/src/hooks/useFolderVideoConversion.js": -->
// src/hooks/useFolderVideoConversion.js
import { useContext } from 'react';
import { SingleTaskSettingsContext } from '../contexts/SingleTaskSettingsContext';
import { TasksQueueContext } from '../contexts/TasksQueueContext';

export const useFolderVideoConversion = () => {
  const { taskEventNames, generalSettings, folderSettings, setFolderSettings, taskId } =
    useContext(SingleTaskSettingsContext);
  const { tasks, addOrUpdateTask } = useContext(TasksQueueContext);

  // Destructure needed values from folderSettings
  const { selectedFolder, outputFolder, progress, converting } = folderSettings;
  // Derive outputTextArray from the global tasks object
  const outputTextArray = tasks[taskId]?.outputText;

  // Handler to select a folder with videos
  const handleSelectFolder = async () => {
    // Reset folder settings
    setFolderSettings({
      progress: {},
      selectedFolder: null,
      outputFolder: null,
      outputTextArray: null,
      converting: false,
    });
    const selectedFolderPath = await window.electronAPI.selectFolder();
    setFolderSettings((prevSettings) => ({
      ...prevSettings,
      selectedFolder: selectedFolderPath,
      outputFolder: prevSettings.outputFolder || selectedFolderPath,
    }));
  };

  // Handler to select the output folder
  const handleSelectOutputFolder = async () => {
    const selectedOutputPath = await window.electronAPI.selectFolder();
    setFolderSettings((prevSettings) => ({
      ...prevSettings,
      outputFolder: selectedOutputPath,
    }));
  };

  // Handler to confirm the folder conversion task
  const handleConfirmTask = () => {
    if (!selectedFolder || !outputFolder) {
      setFolderSettings((prevSettings) => ({
        ...prevSettings,
        outputTextArray: "Please select both a folder with videos and an output folder.",
      }));
      return;
    }

    // Indicate that confirmation is in progress.
    setFolderSettings((prevSettings) => ({
      ...prevSettings,
      converting: true,
    }));

    // Build the updated task using the existing taskId.
    const updatedTask = {
      id: taskId,
      taskEventNames,
      activeTab: 'folder',
      generalSettings,
      folderSettings,
      status: 'confirmed',
    };

    // Update the task in the global queue.
    addOrUpdateTask(updatedTask);
  };

  return {
    selectedFolder,
    outputFolder,
    progress,
    converting,
    outputTextArray,
    handleSelectFolder,
    handleSelectOutputFolder,
    handleConfirmTask,
  };
};


<!-- "d:/_STORAGE FOR WIN 10/MalonNoporSite/videoCa2/video-converter-app/src/hooks/useSingleVideoConversion.js": -->
// src/hooks/useSingleVideoConversion.js
import { useContext, useState } from 'react';
import { SingleTaskSettingsContext } from '../contexts/SingleTaskSettingsContext';
import { TasksQueueContext } from '../contexts/TasksQueueContext';

export const useSingleVideoConversion = () => {
  const { taskId, taskEventNames, generalSettings, singleSettings, setSingleSettings } =
    useContext(SingleTaskSettingsContext);
  const { tasks, addOrUpdateTask } = useContext(TasksQueueContext);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Destructure values from singleSettings
  const { selectedFile, outputFolder, progress } = singleSettings;
  const outputText = tasks[taskId]?.outputText;

  // Logic to handle file selection
  const handleSelectFile = async () => {
    // Reset settings
    setSingleSettings({
      progress: {},
      selectedFile: null,
      outputFolder: null,
      outputText: null,
      converting: false,
    });
    const selectedFilePath = await window.electronAPI.selectFile();
    setSingleSettings((prevSettings) => ({
      ...prevSettings,
      selectedFile: selectedFilePath,
      outputFolder:
        prevSettings.outputFolder ||
        selectedFilePath?.substring(0, selectedFilePath.lastIndexOf('/')) ||
        selectedFilePath?.substring(0, selectedFilePath.lastIndexOf('\\')),
    }));
  };

  // Logic to handle output folder selection
  const handleSelectFolder = async () => {
    const selectedFolderPath = await window.electronAPI.selectFolder();
    setSingleSettings((prevSettings) => ({
      ...prevSettings,
      outputFolder: selectedFolderPath,
    }));
  };

  // Logic to confirm the task and add it to the queue
  const handleConfirmTask = () => {
    // (Optional) guard clause: button should already be disabled if either is missing
    if (!selectedFile || !outputFolder) return;

    const updatedSettings = { ...singleSettings, converting: true };
    setIsConfirmed(true);
    setSingleSettings(updatedSettings);
    addOrUpdateTask({
      id: taskId,
      taskEventNames,
      generalSettings,
      singleSettings: updatedSettings,
      folderSettings: {}, // Not used for single conversion
      status: 'confirmed',
    });
  };

  return {
    isConfirmed,
    selectedFile,
    outputFolder,
    progress,
    outputText,
    handleSelectFile,
    handleSelectFolder,
    handleConfirmTask,
  };
};


<!-- "d:/_STORAGE FOR WIN 10/MalonNoporSite/videoCa2/video-converter-app/src/index.css": -->
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  scrollbar-width: thin; /* Firefox: lean scrollbar */
  scrollbar-color: #888 #f1f1f1; /* Scrollbar thumb and track color */
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

<!-- "d:/_STORAGE FOR WIN 10/MalonNoporSite/videoCa2/video-converter-app/src/index.js": -->
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import App from './App';
import { TasksQueueContextProvider } from './contexts/TasksQueueContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <TasksQueueContextProvider>
      <App />
    </TasksQueueContextProvider>
  </React.StrictMode>
);

reportWebVitals();


<!-- "d:/_STORAGE FOR WIN 10/MalonNoporSite/videoCa2/video-converter-app/src/reportWebVitals.js": -->
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;


<!-- "d:/_STORAGE FOR WIN 10/MalonNoporSite/videoCa2/video-converter-app/src/setupTests.js": -->
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';


<!-- "d:/_STORAGE FOR WIN 10/MalonNoporSite/videoCa2/video-converter-app/tailwind.config.js": -->
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Include your React components
  ],
  theme: {
    extend: {
      // fontSize: {
      //   sm: '0.8rem', // Customize the size as needed
      // },
    },
  },
  plugins: [
    require('daisyui'), // Add DaisyUI as a plugin
  ],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          "accent": "#92efb6", // Customize accent color
          // "accent-content": "#e9f2ed", // Accent content color

          "primary": "#e2e8f0", // slate-200 for primary buttons (light theme)
          "primary-content": "#1e293b", // slate-700 for text on primary buttons
        },
      },
      {
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          "accent-content": "#e9f2ed", // Accent content color
          "accent": "#169647", // Customize accent color

          "primary": "#334155", // slate-700 for primary buttons (dark theme)
          "primary-content": "#f1f5f9", // slate-200 for text on primary buttons
        },
      },
    ],
  },
}


