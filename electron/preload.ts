import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
    isMinimized: () => ipcRenderer.invoke('window:is-minimized')
  },
  socket: {
    createServer: (name: string, port: number, host?: string) => 
      ipcRenderer.invoke('socket:create-server', name, port, host),
    stopServer: (name: string) => 
      ipcRenderer.invoke('socket:stop-server', name),
    getSessions: (name: string) => 
      ipcRenderer.invoke('socket:get-sessions', name),
    getStatus: (name: string) => 
      ipcRenderer.invoke('socket:get-status', name),
    onConnection: (callback: (data: any) => void) => {
      ipcRenderer.on('socket:connection', (event, data) => callback(data))
    },
    onMessage: (callback: (data: any) => void) => {
      ipcRenderer.on('socket:message', (event, data) => callback(data))
    },
    onDisconnection: (callback: (data: any) => void) => {
      ipcRenderer.on('socket:disconnection', (event, data) => callback(data))
    },
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('socket:connection')
      ipcRenderer.removeAllListeners('socket:message')
      ipcRenderer.removeAllListeners('socket:disconnection')
    }
  }
})
