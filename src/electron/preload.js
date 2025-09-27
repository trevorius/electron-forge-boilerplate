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
	openExternal: (url) => ipcRenderer.invoke('open-external', url)
});

// Expose a limited set of Node.js APIs
contextBridge.exposeInMainWorld('nodeAPI', {
	// Example: Get environment variables
	env: process.env.NODE_ENV
});
