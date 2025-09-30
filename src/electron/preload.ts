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
function chatCreate(name?: string): Promise<ChatRecord> {
  return ipcRenderer.invoke('chat-create', name);
}

function chatGet(chatId: number): Promise<ChatWithMessages | null> {
  return ipcRenderer.invoke('chat-get', chatId);
}

function chatGetAll(): Promise<ChatRecord[]> {
  return ipcRenderer.invoke('chat-get-all');
}

function chatUpdateName(chatId: number, name: string): Promise<ChatRecord> {
  return ipcRenderer.invoke('chat-update-name', chatId, name);
}

function chatDelete(chatId: number): Promise<void> {
  return ipcRenderer.invoke('chat-delete', chatId);
}

function chatSendMessage(chatId: number, content: string): Promise<{
  userMessage: MessageRecord;
  assistantMessage: MessageRecord;
  autoNamed: boolean;
}> {
  return ipcRenderer.invoke('chat-send-message', chatId, content);
}

function chatGetMessages(chatId: number): Promise<MessageRecord[]> {
  return ipcRenderer.invoke('chat-get-messages', chatId);
}

function chatGetMessageCount(chatId: number): Promise<number> {
  return ipcRenderer.invoke('chat-get-message-count', chatId);
}

function chatOnMessageStream(callback: (data: ChatMessageStreamData) => void): () => void {
  const listener = (_event: unknown, data: ChatMessageStreamData) => callback(data);
  ipcRenderer.on('chat-message-stream', listener);
  return () => ipcRenderer.removeListener('chat-message-stream', listener);
}


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
function saveScore(scoreData: CreateScoreRequest): Promise<ScoreRecord> {
  return ipcRenderer.invoke('save-score', scoreData);
}

function getHighScores(game: string, limit?: number): Promise<ScoreRecord[]> {
  return ipcRenderer.invoke('get-high-scores', game, limit);
}

function getAllHighScores(limit?: number): Promise<ScoreRecord[]> {
  return ipcRenderer.invoke('get-all-high-scores', limit);
}

function isHighScore(game: string, score: number): Promise<boolean> {
  return ipcRenderer.invoke('is-high-score', game, score);
}

function deleteScore(id: number): Promise<void> {
  return ipcRenderer.invoke('delete-score', id);
}

function clearScores(game?: string): Promise<void> {
  return ipcRenderer.invoke('clear-scores', game);
}


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

function llmListAvailable(): Promise<Array<ModelInfo>> {
  return ipcRenderer.invoke('llm-list-available');
}

function llmListInstalled(): Promise<Array<ModelInfo>> {
  return ipcRenderer.invoke('llm-list-installed');
}

function llmSelectFromDisk(): Promise<string | null> {
  return ipcRenderer.invoke('llm-select-from-disk');
}

function llmLoadModel(modelPath: string, config?: Partial<LLMConfig>): Promise<void> {
  return ipcRenderer.invoke('llm-load-model', modelPath, config);
}

function llmUnloadModel(): Promise<void> {
  return ipcRenderer.invoke('llm-unload-model');
}

function llmIsLoaded(): Promise<boolean> {
  return ipcRenderer.invoke('llm-is-loaded');
}

function llmGetCurrentModel(): Promise<string | null> {
  return ipcRenderer.invoke('llm-get-current-model');
}

function llmDownloadModel(modelInfo: ModelInfo): Promise<void> {
  return ipcRenderer.invoke('llm-download-model', modelInfo);
}

function llmDeleteModel(modelInfo: ModelInfo): Promise<void> {
  return ipcRenderer.invoke('llm-delete-model', modelInfo);
}

function llmUpdateConfig(config: Partial<LLMConfig>): Promise<void> {
  return ipcRenderer.invoke('llm-update-config', config);
}

function llmGetConfig(): Promise<LLMConfig> {
  return ipcRenderer.invoke('llm-get-config');
}

function llmGenerateResponse(prompt: string): Promise<string> {
  return ipcRenderer.invoke('llm-generate-response', prompt);
}

function llmOnDownloadProgress(callback: (progress: DownloadProgress) => void): () => void {
  const listener = (_event: Electron.IpcRendererEvent, progress: DownloadProgress): void => callback(progress);
  ipcRenderer.on('llm-download-progress', listener);
  return (): void => { ipcRenderer.removeListener('llm-download-progress', listener); };
}

function llmOnToken(callback: (token: string) => void): () => void {
  const listener = (_event: Electron.IpcRendererEvent, token: string): void => callback(token);
  ipcRenderer.on('llm-token', listener);
  return (): void => { ipcRenderer.removeListener('llm-token', listener); };
}

function llmGetModelsDirectory(): Promise<string> {
  return ipcRenderer.invoke('llm-get-models-directory');
}

function llmSetModelsDirectory(): Promise<string | null> {
  return ipcRenderer.invoke('llm-set-models-directory');
}

function llmScanFolder(folderPath?: string): Promise<Array<ModelInfo>> {
  return ipcRenderer.invoke('llm-scan-folder', folderPath);
}

interface NodeAPI {
	env: string | undefined;
}

const ChatApi = {
  chatCreate,
  chatGet,
  chatGetAll,
  chatUpdateName,
  chatDelete,
  chatSendMessage,
  chatGetMessages,
  chatGetMessageCount,
  chatOnMessageStream
};

const HighSCoresApi = {
  saveScore,
  getHighScores,
  getAllHighScores,
  isHighScore,
  deleteScore,
  clearScores
};

const LLMApi = {
  llmListAvailable,
  llmListInstalled,
  llmSelectFromDisk,
  llmLoadModel,
  llmUnloadModel,
  llmIsLoaded,
  llmGetCurrentModel,
  llmDownloadModel,
  llmDeleteModel,
  llmUpdateConfig,
  llmGetConfig,
  llmGenerateResponse,
  llmOnDownloadProgress,
  llmOnToken,
  llmGetModelsDirectory,
  llmSetModelsDirectory,
  llmScanFolder
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