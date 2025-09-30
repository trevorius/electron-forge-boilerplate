import { contextBridge, ipcRenderer } from 'electron';

/**
 * Chat Types and Interfaces
 * Shared between main and renderer processes
 */
interface ChatRecord {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MessageRecord {
  id: number;
  chatId: number;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
}

interface ChatWithMessages extends ChatRecord {
  messages: MessageRecord[];
}

interface ChatMessageStreamData {
  chatId: number;
  messageId: number;
  content: string;
  done: boolean;
}

/**
 * Chat API functions for preload script
 * These functions handle IPC communication for chat operations
 */

/**
 * Database Types and Interfaces
 * Shared between main and renderer processes
 */
interface ScoreRecord {
  id: number;
  name: string;
  score: number;
  game: string;
  createdAt: Date;
}

interface CreateScoreRequest {
  name: string;
  score: number;
  game: string;
}

/**
 * High Score API functions for preload script
 * These functions handle IPC communication for database operations
 */

export interface ModelInfo {
  id: string;
  name: string;
  license: string;
  description: string;
  size: string;
  url: string;
  filename: string;
  recommendedContext: number;
  type: string;
  installed?: boolean;
  path?: string;
}

export interface LLMConfig {
  contextSize: number;
  gpuLayers: number;
  temperature: number;
  topP: number;
  topK: number;
}

export interface DownloadProgress {
  modelId: string;
  progress: number;
}

interface NodeAPI {
	env: string | undefined;
}

const ChatApi = {
  chatCreate: (name?: string): Promise<ChatRecord> =>
    ipcRenderer.invoke('chat-create', name),

  chatGet: (chatId: number): Promise<ChatWithMessages | null> =>
    ipcRenderer.invoke('chat-get', chatId),

  chatGetAll: (): Promise<ChatRecord[]> =>
    ipcRenderer.invoke('chat-get-all'),

  chatUpdateName: (chatId: number, name: string): Promise<ChatRecord> =>
    ipcRenderer.invoke('chat-update-name', chatId, name),

  chatDelete: (chatId: number): Promise<void> =>
    ipcRenderer.invoke('chat-delete', chatId),

  chatSendMessage: (chatId: number, content: string): Promise<{
    userMessage: MessageRecord;
    assistantMessage: MessageRecord;
    autoNamed: boolean;
  }> =>
    ipcRenderer.invoke('chat-send-message', chatId, content),

  chatGetMessages: (chatId: number): Promise<MessageRecord[]> =>
    ipcRenderer.invoke('chat-get-messages', chatId),

  chatGetMessageCount: (chatId: number): Promise<number> =>
    ipcRenderer.invoke('chat-get-message-count', chatId),

  chatOnMessageStream: (callback: (data: ChatMessageStreamData) => void): (() => void) => {
    const listener = (_event: unknown, data: ChatMessageStreamData) => callback(data);
    ipcRenderer.on('chat-message-stream', listener);
    return () => ipcRenderer.removeListener('chat-message-stream', listener);
  }
};

const HighSCoresApi = {
  saveScore: (scoreData: CreateScoreRequest): Promise<ScoreRecord> =>
    ipcRenderer.invoke('save-score', scoreData),

  getHighScores: (game: string, limit?: number): Promise<ScoreRecord[]> =>
    ipcRenderer.invoke('get-high-scores', game, limit),

  getAllHighScores: (limit?: number): Promise<ScoreRecord[]> =>
    ipcRenderer.invoke('get-all-high-scores', limit),

  isHighScore: (game: string, score: number): Promise<boolean> =>
    ipcRenderer.invoke('is-high-score', game, score),

  deleteScore: (id: number): Promise<void> =>
    ipcRenderer.invoke('delete-score', id),

  clearScores: (game?: string): Promise<void> =>
    ipcRenderer.invoke('clear-scores', game)
};

const LLMApi = {
  // List all models defined in llms.json
  llmListAvailable: (): Promise<Array<ModelInfo>> => ipcRenderer.invoke('llm-list-available'),

  // List only installed models
  llmListInstalled: (): Promise<Array<ModelInfo>> => ipcRenderer.invoke('llm-list-installed'),

  // Open file dialog to select model from disk
  llmSelectFromDisk: (): Promise<string | null> => ipcRenderer.invoke('llm-select-from-disk'),

  // Load a model
  llmLoadModel: (modelPath: string, config?: Partial<LLMConfig>): Promise<void> =>
    ipcRenderer.invoke('llm-load-model', modelPath, config),

  // Unload current model
  llmUnloadModel: (): Promise<void> => ipcRenderer.invoke('llm-unload-model'),

  // Check if a model is currently loaded
  llmIsLoaded: (): Promise<boolean> => ipcRenderer.invoke('llm-is-loaded'),

  // Get current loaded model path
  llmGetCurrentModel: (): Promise<string | null> => ipcRenderer.invoke('llm-get-current-model'),

  // Download a model from llms.json
  llmDownloadModel: (modelInfo: ModelInfo): Promise<void> =>
    ipcRenderer.invoke('llm-download-model', modelInfo),

  // Delete a downloaded model
  llmDeleteModel: (modelInfo: ModelInfo): Promise<void> =>
    ipcRenderer.invoke('llm-delete-model', modelInfo),

  // Update LLM configuration
  llmUpdateConfig: (config: Partial<LLMConfig>): Promise<void> =>
    ipcRenderer.invoke('llm-update-config', config),

  // Get current LLM configuration
  llmGetConfig: (): Promise<LLMConfig> => ipcRenderer.invoke('llm-get-config'),

  // Generate response with streaming support
  llmGenerateResponse: (prompt: string): Promise<string> =>
    ipcRenderer.invoke('llm-generate-response', prompt),

  // Listen for download progress updates
  llmOnDownloadProgress: (callback: (progress: DownloadProgress) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: DownloadProgress): void => callback(progress);
    ipcRenderer.on('llm-download-progress', listener);
    return (): void => { ipcRenderer.removeListener('llm-download-progress', listener); };
  },

  // Listen for token streaming
  llmOnToken: (callback: (token: string) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, token: string): void => callback(token);
    ipcRenderer.on('llm-token', listener);
    return (): void => { ipcRenderer.removeListener('llm-token', listener); };
  },

  // Get models directory
  llmGetModelsDirectory: (): Promise<string> => ipcRenderer.invoke('llm-get-models-directory'),

  // Set models directory
  llmSetModelsDirectory: (): Promise<string | null> => ipcRenderer.invoke('llm-set-models-directory'),

  // Scan folder for models
  llmScanFolder: (folderPath?: string): Promise<Array<ModelInfo>> =>
    ipcRenderer.invoke('llm-scan-folder', folderPath)
};

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
  ...ChatApi,
  ...HighSCoresApi,
  ...LLMApi
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