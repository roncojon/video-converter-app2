const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  generateHls: (filePath, outputPath) => ipcRenderer.invoke('generate-hls', filePath, outputPath),
  
  // Listen for progress updates
  onProgress: (callback) => ipcRenderer.on('conversion-progress', callback),
});
