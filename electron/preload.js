const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  toggleDevTools: () => ipcRenderer.send('toggle-dev-tools'),
  onMaximized: (callback) => ipcRenderer.on('window-maximized', (_event, value) => callback(value)),
})
