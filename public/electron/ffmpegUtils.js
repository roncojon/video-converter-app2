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
    '-c:a', 'aac',                      // Audio codec for HLS compatibility
    '-ar', '48000',                     // Standard audio sample rate
    '-b:a', '96k',                      // Lower audio bitrate to save bandwidth
    '-c:v', 'libx264',                  // Video codec optimized for HLS compatibility
    '-profile:v', 'main',               // Suitable for compatibility with most devices
    '-preset', 'fast',                  // Fast encoding preset for speed over compression
    '-crf', '22',                       // Slightly lower quality factor for faster encoding
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

// New function to generate thumbnails and a .vtt file
function generateThumbnails(filePath, outputDir, interval = 5) {
  const timedImagesDir = path.join(outputDir, 'timed_images', 'thumbnails'); // Store images in timed_images/thumbnails
  const vttFilePath = path.join(outputDir, 'timed_images', 'thumbnails.vtt'); // Store .vtt in timed_images

  // Create the timed_images/thumbnails directory if it doesn't exist
  fs.mkdirSync(timedImagesDir, { recursive: true });

  const baseName = getBaseNameWithoutExt(filePath);
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
            path.join('thumbnails', file), // Use relative path for thumbnails
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
