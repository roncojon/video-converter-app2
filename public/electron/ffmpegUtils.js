const path = require('path');
const { execFile } = require('child_process');
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

module.exports = {
  ffmpegPath,
  getBaseNameWithoutExt,
  getHlsArguments,
  getVideoResolution,
};
