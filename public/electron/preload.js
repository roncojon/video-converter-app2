// public/electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  generateHls: (filePath, outputPath) => ipcRenderer.invoke('generate-hls', filePath, outputPath),
  generateHlsFolder: (folderPath, outputPath) => ipcRenderer.invoke('generate-hls-folder', folderPath, outputPath), // Ensure this line is present
  onProgress: (callback) => ipcRenderer.on('conversion-progress', callback),
});
