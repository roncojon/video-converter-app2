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
