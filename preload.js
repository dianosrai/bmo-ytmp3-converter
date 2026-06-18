const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  startDownload: (data) => ipcRenderer.invoke('start-download', data),
  cancelDownload: () => ipcRenderer.invoke('cancel-download'),
  showItemInFolder: (filePath) => ipcRenderer.invoke('show-item-in-folder', filePath),
  onDownloadProgress: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('download-progress', subscription);
    return () => ipcRenderer.removeListener('download-progress', subscription);
  },
  onDownloadLog: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('download-log', subscription);
    return () => ipcRenderer.removeListener('download-log', subscription);
  },
  closeWindow: () => ipcRenderer.send('close-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  setWindowHeight: (height) => ipcRenderer.send('set-window-height', height)
});
