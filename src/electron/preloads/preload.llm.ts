import { ipcRenderer } from 'electron';

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

export const LLMApi = {
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