const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { setupIpcHandlers } = require('./ipcHandlers'); // Import the IPC handlers setup function

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.isPackaged) {
    // Load the production build
    win.loadFile(path.join(__dirname, '../build/index.html'));
  } else {
    // Load the React app in development
    win.loadURL('http://localhost:3000');
  }
}

app.on('ready', () => {
  createWindow();
  setupIpcHandlers(); // Initialize IPC handlers
});
