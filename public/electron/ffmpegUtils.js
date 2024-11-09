// public/electron/ffmpegUtils.js

const path = require('path');
const { execFile } = require('child_process');
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

module.exports = {
  ffmpegPath,
  saveExtraInfo,
  getBaseNameWithoutExt,
  getHlsArguments,
  getVideoResolution,
  generateFrameImages,
  generateThumbnails // Export the new function
};

