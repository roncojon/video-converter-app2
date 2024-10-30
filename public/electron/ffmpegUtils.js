// public/electron/ffmpegUtils.js

const path = require('path');
const { execFile, spawn } = require('child_process');
const fs = require('fs');

const ffmpegPath = path.resolve(__dirname, '../ffmpeg/ffmpeg.exe');
const ffprobePath = path.resolve(__dirname, '../ffmpeg/ffprobe.exe');

// Helper function to get the base name without extension
function getBaseNameWithoutExt(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

// Function to get HLS arguments for each resolution
function getHlsArguments(filePath, outputDir, width, height, resolutionLabel) {
  const outputPattern = path.join(outputDir, resolutionLabel, `${resolutionLabel}_%03d.ts`);
  const m3u8File = path.join(outputDir, resolutionLabel, `${resolutionLabel}.m3u8`);

  return [
    '-i', filePath,
    '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2`,
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

// New function to generate thumbnails and a .vtt file
function generateThumbnails(filePath, outputDir, interval = 5) {
  const baseName = getBaseNameWithoutExt(filePath);
  const thumbnailsDir = path.join(outputDir, baseName, 'thumbnails');
  const vttFilePath = path.join(outputDir, baseName, 'thumbnails.vtt');

  // Create the thumbnails directory if it doesn't exist
  fs.mkdirSync(thumbnailsDir, { recursive: true });

  const args = [
    '-i', filePath,
    '-vf', `fps=1/${interval},scale=160:-1`, // 1 frame per interval seconds, width 160, height auto
    path.join(thumbnailsDir, `${baseName}_%03d.jpg`)
  ];

  return new Promise((resolve, reject) => {
    execFile(ffmpegPath, args, (error) => {
      if (error) {
        reject(error);
      } else {
        // Generate .vtt file from the created thumbnails
        const files = fs.readdirSync(thumbnailsDir).filter(f => f.endsWith('.jpg')).sort();
        const vttContent = ['WEBVTT\n'];

        files.forEach((file, index) => {
          const timestamp = `${index * interval}`; // Calculate seconds based on interval
          const hours = String(Math.floor(timestamp / 3600)).padStart(2, '0');
          const minutes = String(Math.floor((timestamp % 3600) / 60)).padStart(2, '0');
          const seconds = String(timestamp % 60).padStart(2, '0');

          const nextTimestamp = `${(index + 1) * interval}`;
          const nextHours = String(Math.floor(nextTimestamp / 3600)).padStart(2, '0');
          const nextMinutes = String(Math.floor((nextTimestamp % 3600) / 60)).padStart(2, '0');
          const nextSeconds = String(nextTimestamp % 60).padStart(2, '0');

          vttContent.push(
            `${hours}:${minutes}:${seconds}.000 --> ${nextHours}:${nextMinutes}:${nextSeconds}.000`,
            path.join('thumbnails', file),
            ''
          );
        });

        fs.writeFileSync(vttFilePath, vttContent.join('\n'));
        resolve(vttFilePath);
      }
    });
  });
}

module.exports = {
  ffmpegPath,
  getBaseNameWithoutExt,
  getHlsArguments,
  getVideoResolution,
  generateThumbnails, // Export the new function
};
