// public/electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  getCpuCount: () => ipcRenderer.invoke('get-cpu-count'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  generateHls: (filePath, outputPath, cpuSelection, priorityLevel) => ipcRenderer.invoke('generate-hls', filePath, outputPath, cpuSelection, priorityLevel),
  generateHlsFolder: (folderPath, outputPath, cpuSelection, priorityLevel) => ipcRenderer.invoke('generate-hls-folder', folderPath, outputPath, cpuSelection, priorityLevel), // Ensure this line is present
  onProgress: (callback) => ipcRenderer.on('conversion-progress', callback),
});
