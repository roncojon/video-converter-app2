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
  ipcMain.handle('select-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Videos', extensions: ['mp4'] }],
    });
    return canceled ? null : filePaths[0];
  });

  ipcMain.handle('select-folder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return canceled ? null : filePaths[0];
  });

  ipcMain.handle('generate-hls', async (event, filePath, outputDir) => {
    const resolutions = [
      { width: 426, height: 240, label: '240p' },
      { width: 640, height: 360, label: '360p' },
      { width: 854, height: 480, label: '480p' },
      { width: 1280, height: 720, label: '720p' },
      { width: 1920, height: 1080, label: '1080p' },
    ];

    const baseName = getBaseNameWithoutExt(filePath);
    const videoOutputDir = path.join(outputDir, baseName);
    fs.mkdirSync(videoOutputDir, { recursive: true });

    const videoResolution = await getVideoResolution(filePath);
    const masterPlaylistPath = path.join(videoOutputDir, 'master.m3u8');
    const masterPlaylistLines = ['#EXTM3U'];

    for (const res of resolutions) {
      if (res.width <= videoResolution.width && res.height <= videoResolution.height) {
        const resOutputDir = path.join(videoOutputDir, res.label);
        fs.mkdirSync(resOutputDir, { recursive: true });

        const args = getHlsArguments(filePath, videoOutputDir, res.width, res.height, res.label);
        
        // Spawn the FFmpeg process to enable progress tracking
        const ffmpegProcess = spawn(ffmpegPath, args);
        
        // Listen for FFmpeg output for progress
        ffmpegProcess.stderr.on('data', (data) => {
          const output = data.toString();
          const match = output.match(/frame=\s*(\d+)/); // Example regex to capture frame count
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
    }

    fs.writeFileSync(masterPlaylistPath, masterPlaylistLines.join('\n'));
    return `Master playlist created at ${masterPlaylistPath}`;
  });
}

module.exports = { setupIpcHandlers };
