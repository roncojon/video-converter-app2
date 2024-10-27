const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  generateHls: (filePath, outputDir) => ipcRenderer.invoke('generate-hls', filePath, outputDir), // Update this line
});
