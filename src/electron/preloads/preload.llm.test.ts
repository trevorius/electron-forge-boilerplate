// Mock ipcRenderer
const mockIpcRenderer = {
  invoke: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
};

jest.mock('electron', () => ({
  ipcRenderer: mockIpcRenderer,
}));

import { LLMApi, ModelInfo, LLMConfig } from './preload.llm';

describe('LLMApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockModel: ModelInfo = {
    id: 'test-model',
    name: 'Test Model',
    license: 'MIT',
    description: 'Test description',
    size: '1GB',
    url: 'https://example.com/model',
    filename: 'test.gguf',
    recommendedContext: 4096,
    type: 'llama',
  };

  const mockConfig: Partial<LLMConfig> = {
    contextSize: 8192,
    gpuLayers: 10,
    temperature: 0.7,
  };

  describe('llmListAvailable', () => {
    it('should invoke llm-list-available', async () => {
      mockIpcRenderer.invoke.mockResolvedValue([mockModel]);
      const result = await LLMApi.llmListAvailable();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-list-available');
      expect(result).toEqual([mockModel]);
    });
  });

  describe('llmListInstalled', () => {
    it('should invoke llm-list-installed', async () => {
      mockIpcRenderer.invoke.mockResolvedValue([mockModel]);
      const result = await LLMApi.llmListInstalled();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-list-installed');
      expect(result).toEqual([mockModel]);
    });
  });

  describe('llmSelectFromDisk', () => {
    it('should invoke llm-select-from-disk', async () => {
      mockIpcRenderer.invoke.mockResolvedValue('/path/to/model.gguf');
      const result = await LLMApi.llmSelectFromDisk();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-select-from-disk');
      expect(result).toBe('/path/to/model.gguf');
    });

    it('should return null when cancelled', async () => {
      mockIpcRenderer.invoke.mockResolvedValue(null);
      const result = await LLMApi.llmSelectFromDisk();
      expect(result).toBeNull();
    });
  });

  describe('llmLoadModel', () => {
    it('should invoke llm-load-model with path and config', async () => {
      mockIpcRenderer.invoke.mockResolvedValue(undefined);
      await LLMApi.llmLoadModel('/path/to/model.gguf', mockConfig);
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-load-model', '/path/to/model.gguf', mockConfig);
    });

    it('should invoke llm-load-model with path only', async () => {
      mockIpcRenderer.invoke.mockResolvedValue(undefined);
      await LLMApi.llmLoadModel('/path/to/model.gguf');
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-load-model', '/path/to/model.gguf', undefined);
    });
  });

  describe('llmUnloadModel', () => {
    it('should invoke llm-unload-model', async () => {
      mockIpcRenderer.invoke.mockResolvedValue(undefined);
      await LLMApi.llmUnloadModel();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-unload-model');
    });
  });

  describe('llmIsLoaded', () => {
    it('should invoke llm-is-loaded and return true', async () => {
      mockIpcRenderer.invoke.mockResolvedValue(true);
      const result = await LLMApi.llmIsLoaded();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-is-loaded');
      expect(result).toBe(true);
    });

    it('should invoke llm-is-loaded and return false', async () => {
      mockIpcRenderer.invoke.mockResolvedValue(false);
      const result = await LLMApi.llmIsLoaded();
      expect(result).toBe(false);
    });
  });

  describe('llmGetCurrentModel', () => {
    it('should invoke llm-get-current-model and return path', async () => {
      mockIpcRenderer.invoke.mockResolvedValue('/path/to/model.gguf');
      const result = await LLMApi.llmGetCurrentModel();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-get-current-model');
      expect(result).toBe('/path/to/model.gguf');
    });

    it('should return null when no model loaded', async () => {
      mockIpcRenderer.invoke.mockResolvedValue(null);
      const result = await LLMApi.llmGetCurrentModel();
      expect(result).toBeNull();
    });
  });

  describe('llmDownloadModel', () => {
    it('should invoke llm-download-model with model info', async () => {
      mockIpcRenderer.invoke.mockResolvedValue(undefined);
      await LLMApi.llmDownloadModel(mockModel);
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-download-model', mockModel);
    });
  });

  describe('llmDeleteModel', () => {
    it('should invoke llm-delete-model with model info', async () => {
      mockIpcRenderer.invoke.mockResolvedValue(undefined);
      await LLMApi.llmDeleteModel(mockModel);
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-delete-model', mockModel);
    });
  });

  describe('llmUpdateConfig', () => {
    it('should invoke llm-update-config with config', async () => {
      mockIpcRenderer.invoke.mockResolvedValue(undefined);
      await LLMApi.llmUpdateConfig(mockConfig);
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-update-config', mockConfig);
    });
  });

  describe('llmGetConfig', () => {
    it('should invoke llm-get-config and return config', async () => {
      const fullConfig: LLMConfig = {
        contextSize: 8192,
        gpuLayers: 10,
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
      };
      mockIpcRenderer.invoke.mockResolvedValue(fullConfig);
      const result = await LLMApi.llmGetConfig();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-get-config');
      expect(result).toEqual(fullConfig);
    });
  });

  describe('llmGenerateResponse', () => {
    it('should invoke llm-generate-response with prompt', async () => {
      mockIpcRenderer.invoke.mockResolvedValue('Generated response');
      const result = await LLMApi.llmGenerateResponse('Test prompt');
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-generate-response', 'Test prompt');
      expect(result).toBe('Generated response');
    });
  });

  describe('llmOnDownloadProgress', () => {
    it('should set up listener for download progress', () => {
      const callback = jest.fn();
      const unsubscribe = LLMApi.llmOnDownloadProgress(callback);

      expect(mockIpcRenderer.on).toHaveBeenCalledWith('llm-download-progress', expect.any(Function));

      // Simulate progress event
      const listener = mockIpcRenderer.on.mock.calls[0][1];
      const mockEvent = {} as Electron.IpcRendererEvent;
      const progress = { modelId: 'test', progress: 50 };
      listener(mockEvent, progress);

      expect(callback).toHaveBeenCalledWith(progress);

      // Test unsubscribe
      unsubscribe();
      expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith('llm-download-progress', listener);
    });
  });

  describe('llmOnToken', () => {
    it('should set up listener for token streaming', () => {
      const callback = jest.fn();
      const unsubscribe = LLMApi.llmOnToken(callback);

      expect(mockIpcRenderer.on).toHaveBeenCalledWith('llm-token', expect.any(Function));

      // Simulate token event
      const listener = mockIpcRenderer.on.mock.calls[0][1];
      const mockEvent = {} as Electron.IpcRendererEvent;
      const token = 'test token';
      listener(mockEvent, token);

      expect(callback).toHaveBeenCalledWith(token);

      // Test unsubscribe
      unsubscribe();
      expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith('llm-token', listener);
    });
  });

  describe('llmGetModelsDirectory', () => {
    it('should invoke llm-get-models-directory', async () => {
      mockIpcRenderer.invoke.mockResolvedValue('/path/to/models');
      const result = await LLMApi.llmGetModelsDirectory();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-get-models-directory');
      expect(result).toBe('/path/to/models');
    });
  });

  describe('llmSetModelsDirectory', () => {
    it('should invoke llm-set-models-directory and return new path', async () => {
      mockIpcRenderer.invoke.mockResolvedValue('/new/path/to/models');
      const result = await LLMApi.llmSetModelsDirectory();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-set-models-directory');
      expect(result).toBe('/new/path/to/models');
    });

    it('should return null when cancelled', async () => {
      mockIpcRenderer.invoke.mockResolvedValue(null);
      const result = await LLMApi.llmSetModelsDirectory();
      expect(result).toBeNull();
    });
  });

  describe('llmScanFolder', () => {
    it('should invoke llm-scan-folder with path', async () => {
      mockIpcRenderer.invoke.mockResolvedValue([mockModel]);
      const result = await LLMApi.llmScanFolder('/path/to/scan');
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-scan-folder', '/path/to/scan');
      expect(result).toEqual([mockModel]);
    });

    it('should invoke llm-scan-folder without path', async () => {
      mockIpcRenderer.invoke.mockResolvedValue([mockModel]);
      const result = await LLMApi.llmScanFolder();
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-scan-folder', undefined);
      expect(result).toEqual([mockModel]);
    });
  });
});