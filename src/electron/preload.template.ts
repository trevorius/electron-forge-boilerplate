import { contextBridge, ipcRenderer } from 'electron';

// {{GENERATED_TYPES}}

interface NodeAPI {
	env: string | undefined;
}

// {{GENERATED_APIS}}

const electronAPI = {
	sendMessage: (message: string): Promise<void> => ipcRenderer.invoke('send-message', message),
	getVersion: (): Promise<string> => ipcRenderer.invoke('get-version'),
	getPlatform: (): string => process.platform,
	openExternal: (url: string): Promise<void> => ipcRenderer.invoke('open-external', url),

	// Window controls
	minimizeWindow: (): Promise<void> => ipcRenderer.invoke('window-minimize'),
	maximizeWindow: (): Promise<void> => ipcRenderer.invoke('window-maximize'),
	closeWindow: (): Promise<void> => ipcRenderer.invoke('window-close'),
	isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window-is-maximized'),

	// Window state events
	onMaximize: (callback: () => void): void => {
		ipcRenderer.on('window-maximized', callback);
	},
	onUnmaximize: (callback: () => void): void => {
		ipcRenderer.on('window-unmaximized', callback);
	},
	removeAllListeners: (channel: string): void => {
		ipcRenderer.removeAllListeners(channel);
	},

	// License window controls
	openLicenseWindow: (): Promise<void> => ipcRenderer.invoke('open-license-window'),
	closeLicenseWindow: (): Promise<void> => ipcRenderer.invoke('close-license-window'),
	getMainAppLocale: (): Promise<string> => ipcRenderer.invoke('get-main-app-locale'),

	// API endpoints from modules
  {{API_SPREADS}}
};

const nodeAPI: NodeAPI = {
	env: process.env.NODE_ENV
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
contextBridge.exposeInMainWorld('nodeAPI', nodeAPI);

// Base ElectronAPI interface that can be extended
interface BaseElectronAPI {
	sendMessage: (message: string) => Promise<void>;
	getVersion: () => Promise<string>;
	getPlatform: () => string;
	openExternal: (url: string) => Promise<void>;
	minimizeWindow: () => Promise<void>;
	maximizeWindow: () => Promise<void>;
	closeWindow: () => Promise<void>;
	isMaximized: () => Promise<boolean>;
	onMaximize: (callback: () => void) => void;
	onUnmaximize: (callback: () => void) => void;
	removeAllListeners: (channel: string) => void;
	openLicenseWindow: () => Promise<void>;
	closeLicenseWindow: () => Promise<void>;
	getMainAppLocale: () => Promise<string>;
}

// Extensible ElectronAPI type that can include additional APIs
type ElectronAPI = BaseElectronAPI & Record<string, unknown>;

declare global {
	interface Window {
		electronAPI: ElectronAPI;
		nodeAPI: NodeAPI;
	}
}