const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
	// Example: Send message to main process
	sendMessage: (message) => ipcRenderer.invoke('send-message', message),

	// Example: Get app version
	getVersion: () => ipcRenderer.invoke('get-version'),

	// Example: Platform info
	getPlatform: () => process.platform,

	// Example: Open external URL
	openExternal: (url) => ipcRenderer.invoke('open-external', url),

	// Window controls
	minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
	maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
	closeWindow: () => ipcRenderer.invoke('window-close'),
	isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

	// Window state events
	onMaximize: (callback) => ipcRenderer.on('window-maximized', callback),
	onUnmaximize: (callback) => ipcRenderer.on('window-unmaximized', callback),
	removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Expose a limited set of Node.js APIs
contextBridge.exposeInMainWorld('nodeAPI', {
	// Example: Get environment variables
	env: process.env.NODE_ENV
});
