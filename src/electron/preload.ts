import { contextBridge, ipcRenderer } from 'electron';
import { createElectronAPI, createNodeAPI, ElectronAPI, NodeAPI } from './preload.helpers';

const electronAPI = createElectronAPI(ipcRenderer);
const nodeAPI = createNodeAPI(process.env.NODE_ENV);

contextBridge.exposeInMainWorld('electronAPI', electronAPI satisfies ElectronAPI);
contextBridge.exposeInMainWorld('nodeAPI', nodeAPI satisfies NodeAPI);

declare global {
	interface Window {
		electronAPI: ElectronAPI;
		nodeAPI: NodeAPI;
	}
}