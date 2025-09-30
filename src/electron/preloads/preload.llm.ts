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

export const LLMApi = {
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