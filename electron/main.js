const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const blockchainMonitor = require('./blockchainMonitor');

let mainWindow = null;

let eventMonitorBridge;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#0d0f11',
    titleBarStyle: 'hidden', // Frameless window
    titleBarOverlay: {
      color: '#0d0f11',
      symbolColor: '#ffffff',
      height: 40
    },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Set main window reference for blockchain monitor
  blockchainMonitor.setMainWindow(mainWindow);

  // In development, load from Vite dev server
  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools(); // Uncomment to debug
  } else {
    // In production, load the built html
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for blockchain monitoring
ipcMain.on('blockchain:start-monitoring', (event, { publicKey }) => {
  console.log('[Main] Starting blockchain monitoring for:', publicKey);
  blockchainMonitor.startPaymentMonitoring(publicKey);
  blockchainMonitor.startOperationMonitoring(publicKey);
});

ipcMain.on('blockchain:stop-monitoring', (event, { publicKey }) => {
  console.log('[Main] Stopping blockchain monitoring for:', publicKey);
  blockchainMonitor.stopPaymentMonitoring(publicKey);
  blockchainMonitor.stopOperationMonitoring(publicKey);
});

ipcMain.handle('blockchain:get-monitored-accounts', () => {
  return blockchainMonitor.getMonitoredAccounts();
});

ipcMain.handle('blockchain:get-active-streams', () => {
  return blockchainMonitor.getActiveStreamsCount();
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Stop all blockchain monitoring
  blockchainMonitor.stopAll();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Cleanup blockchain monitoring
  blockchainMonitor.stopAll();
});