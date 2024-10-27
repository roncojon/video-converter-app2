const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL('http://localhost:3000');
}

// Define ffmpeg and ffprobe paths
const ffmpegPath = path.resolve(__dirname, '../ffmpeg/ffmpeg.exe');
const ffprobePath = path.resolve(__dirname, '../ffmpeg/ffprobe.exe');

// Helper function to get the base name without extension
function getBaseNameWithoutExt(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

function getHlsArguments(filePath, outputDir, width, height, resolutionLabel) {
  const outputPattern = path.join(outputDir, resolutionLabel, `${resolutionLabel}_%03d.ts`);
  const m3u8File = path.join(outputDir, resolutionLabel, `${resolutionLabel}.m3u8`);

  return [
    '-i', filePath,
    '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2`, // Ensures scaling and padding for each resolution
    '-c:a', 'aac',
    '-ar', '48000',
    '-b:a', '128k',
    '-c:v', 'h264',
    '-profile:v', 'main',
    '-crf', '20',
    '-sc_threshold', '0',
    '-g', '48',
    '-keyint_min', '48',
    '-hls_time', '6',
    '-hls_playlist_type', 'vod',
    '-hls_segment_filename', outputPattern,
    '-hls_flags', 'independent_segments',
    '-f', 'hls',
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

// IPC handler to generate HLS streams with organized output structure
ipcMain.handle('generate-hls', async (event, filePath, outputDir) => {
  const resolutions = [
    { width: 426, height: 240, label: '240p' },
    { width: 640, height: 360, label: '360p' },
    { width: 854, height: 480, label: '480p' },
    { width: 1280, height: 720, label: '720p' },
    { width: 1920, height: 1080, label: '1080p' }
  ];

  // Get the base name of the input file to create a unique output folder
  const baseName = getBaseNameWithoutExt(filePath);
  const videoOutputDir = path.join(outputDir, baseName); // New directory for the video
  fs.mkdirSync(videoOutputDir, { recursive: true });

  // Call getVideoResolution directly to obtain resolution
  const videoResolution = await getVideoResolution(filePath);
  const masterPlaylistPath = path.join(videoOutputDir, 'master.m3u8');
  const masterPlaylistLines = ['#EXTM3U'];

  for (const res of resolutions) {
    if (res.width <= videoResolution.width && res.height <= videoResolution.height) {
      const resOutputDir = path.join(videoOutputDir, res.label);
      fs.mkdirSync(resOutputDir, { recursive: true });

      const args = getHlsArguments(filePath, videoOutputDir, res.width, res.height, res.label);
      await new Promise((resolve, reject) => {
        execFile(ffmpegPath, args, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      masterPlaylistLines.push(`#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=${res.width}x${res.height}`);
      masterPlaylistLines.push(`${res.label}/${res.label}.m3u8`);
    }
  }

  fs.writeFileSync(masterPlaylistPath, masterPlaylistLines.join('\n'));
  return `Master playlist created at ${masterPlaylistPath}`;
});

// IPC handler for selecting a file
ipcMain.handle('select-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Videos', extensions: ['mp4'] }],
  });
  if (canceled) {
    return null;
  } else {
    return filePaths[0];
  }
});

// IPC handler for selecting a folder
ipcMain.handle('select-folder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (canceled) {
    return null;
  } else {
    return filePaths[0];
  }
});

app.on('ready', createWindow);
