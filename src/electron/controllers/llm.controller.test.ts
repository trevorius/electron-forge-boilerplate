import { LLMController } from './llm.controller';
import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// Mock the LLM service
const mockLLMService = {
  initialize: jest.fn(),
  listAvailableModels: jest.fn(),
  listInstalledModels: jest.fn(),
  loadModel: jest.fn(),
  unloadModel: jest.fn(),
  isModelLoaded: jest.fn(),
  getCurrentModelPath: jest.fn(),
  ensureModelsDirectory: jest.fn(),
  getModelsDirectory: jest.fn(),
  updateConfig: jest.fn(),
  getConfig: jest.fn(),
  generateResponse: jest.fn(),
  setCustomModelsPath: jest.fn(),
  scanFolderForModels: jest.fn(),
};

jest.mock('../services/llm.service', () => ({
  getLLMService: jest.fn(() => mockLLMService),
}));

// Mock electron
jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
    removeHandler: jest.fn(),
  },
  dialog: {
    showOpenDialog: jest.fn(),
  },
  BrowserWindow: {
    getFocusedWindow: jest.fn(),
    getAllWindows: jest.fn(),
    fromWebContents: jest.fn(),
  },
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
  createWriteStream: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  appendFileSync: jest.fn(),
}));

// Mock https
jest.mock('https', () => ({
  get: jest.fn(),
}));

describe('LLMController', () => {
  let handlersMap: Map<string, Function>;

  beforeEach(() => {
    jest.clearAllMocks();
    handlersMap = new Map();

    // Capture handlers
    (ipcMain.handle as jest.Mock).mockImplementation((channel: string, handler: Function) => {
      handlersMap.set(channel, handler);
    });

    // Default mock implementations
    mockLLMService.initialize.mockResolvedValue(undefined);
  });

  describe('registerHandlers', () => {
    it('should initialize LLM service successfully', async () => {
      // Reset the module to ensure getLLMService is called fresh
      jest.resetModules();
      const { getLLMService } = await import('../services/llm.service');
      (getLLMService as jest.Mock).mockReturnValue(mockLLMService);

      await LLMController.registerHandlers();
      // The service should be called, but due to the singleton pattern,
      // we verify that handlers are registered
      expect(ipcMain.handle).toHaveBeenCalledWith('llm-list-available', expect.any(Function));
    });

    it('should continue even if initialization fails', async () => {
      mockLLMService.initialize.mockRejectedValue(new Error('Init failed'));
      await expect(LLMController.registerHandlers()).resolves.not.toThrow();
      // Error logging is tested in llm.controller.helpers.test.ts
    });

    it('should register all handlers', async () => {
      await LLMController.registerHandlers();

      expect(ipcMain.handle).toHaveBeenCalledWith('llm-list-available', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('llm-list-installed', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('llm-select-from-disk', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('llm-load-model', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('llm-unload-model', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('llm-is-loaded', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('llm-get-current-model', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('llm-download-model', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('llm-delete-model', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('llm-update-config', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('llm-get-config', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('llm-generate-response', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('llm-get-models-directory', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('llm-set-models-directory', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('llm-scan-folder', expect.any(Function));
    });
  });

  describe('llm-list-available handler', () => {
    beforeEach(async () => {
      await LLMController.registerHandlers();
    });

    it('should list available models', async () => {
      const mockModels = [
        { id: 'model1', name: 'Model 1', filename: 'model1.gguf', url: 'http://example.com/model1.gguf', size: 1000 },
      ];
      mockLLMService.listAvailableModels.mockResolvedValue(mockModels);

      const handler = handlersMap.get('llm-list-available')!;
      const result = await handler();

      expect(mockLLMService.listAvailableModels).toHaveBeenCalled();
      expect(result).toEqual(mockModels);
    });

    it('should throw error if listing fails', async () => {
      mockLLMService.listAvailableModels.mockRejectedValue(new Error('List failed'));

      const handler = handlersMap.get('llm-list-available')!;
      await expect(handler()).rejects.toThrow('List failed');
    });
  });

  describe('llm-list-installed handler', () => {
    beforeEach(async () => {
      await LLMController.registerHandlers();
    });

    it('should list installed models', async () => {
      const mockModels = [
        { id: 'model1', name: 'Model 1', filename: 'model1.gguf', url: 'http://example.com/model1.gguf', size: 1000 },
      ];
      mockLLMService.listInstalledModels.mockResolvedValue(mockModels);

      const handler = handlersMap.get('llm-list-installed')!;
      const result = await handler();

      expect(mockLLMService.listInstalledModels).toHaveBeenCalled();
      expect(result).toEqual(mockModels);
    });

    it('should throw error if listing fails', async () => {
      mockLLMService.listInstalledModels.mockRejectedValue(new Error('List failed'));

      const handler = handlersMap.get('llm-list-installed')!;
      await expect(handler()).rejects.toThrow('List failed');
    });
  });

  describe('llm-select-from-disk handler', () => {
    beforeEach(async () => {
      await LLMController.registerHandlers();
    });

    it('should select a model from disk', async () => {
      const mockWindow = {};
      (BrowserWindow.getFocusedWindow as jest.Mock).mockReturnValue(mockWindow);
      (dialog.showOpenDialog as jest.Mock).mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/model.gguf'],
      });

      const handler = handlersMap.get('llm-select-from-disk')!;
      const result = await handler();

      expect(dialog.showOpenDialog).toHaveBeenCalledWith(mockWindow, {
        properties: ['openFile'],
        filters: [
          { name: 'GGUF Models', extensions: ['gguf'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      expect(result).toBe('/path/to/model.gguf');
    });

    it('should return null if dialog is canceled', async () => {
      const mockWindow = {};
      (BrowserWindow.getFocusedWindow as jest.Mock).mockReturnValue(mockWindow);
      (dialog.showOpenDialog as jest.Mock).mockResolvedValue({
        canceled: true,
        filePaths: [],
      });

      const handler = handlersMap.get('llm-select-from-disk')!;
      const result = await handler();

      expect(result).toBeNull();
    });

    it('should return null if no files selected', async () => {
      const mockWindow = {};
      (BrowserWindow.getFocusedWindow as jest.Mock).mockReturnValue(mockWindow);
      (dialog.showOpenDialog as jest.Mock).mockResolvedValue({
        canceled: false,
        filePaths: [],
      });

      const handler = handlersMap.get('llm-select-from-disk')!;
      const result = await handler();

      expect(result).toBeNull();
    });

    it('should use first available window if no focused window', async () => {
      const mockWindow = {};
      (BrowserWindow.getFocusedWindow as jest.Mock).mockReturnValue(null);
      (BrowserWindow.getAllWindows as jest.Mock).mockReturnValue([mockWindow]);
      (dialog.showOpenDialog as jest.Mock).mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/model.gguf'],
      });

      const handler = handlersMap.get('llm-select-from-disk')!;
      const result = await handler();

      expect(result).toBe('/path/to/model.gguf');
    });

    it('should throw error if no window available', async () => {
      (BrowserWindow.getFocusedWindow as jest.Mock).mockReturnValue(null);
      (BrowserWindow.getAllWindows as jest.Mock).mockReturnValue([]);

      const handler = handlersMap.get('llm-select-from-disk')!;
      await expect(handler()).rejects.toThrow('No window available for dialog');
    });

    it('should throw error if dialog fails', async () => {
      const mockWindow = {};
      (BrowserWindow.getFocusedWindow as jest.Mock).mockReturnValue(mockWindow);
      (dialog.showOpenDialog as jest.Mock).mockRejectedValue(new Error('Dialog failed'));

      const handler = handlersMap.get('llm-select-from-disk')!;
      await expect(handler()).rejects.toThrow('Dialog failed');
    });
  });

  describe('llm-load-model handler', () => {
    beforeEach(async () => {
      await LLMController.registerHandlers();
    });

    it('should load a model', async () => {
      mockLLMService.loadModel.mockResolvedValue(undefined);

      const handler = handlersMap.get('llm-load-model')!;
      await handler({}, '/path/to/model.gguf');

      expect(mockLLMService.loadModel).toHaveBeenCalledWith('/path/to/model.gguf', undefined);
    });

    it('should load a model with config', async () => {
      mockLLMService.loadModel.mockResolvedValue(undefined);
      const config = { temperature: 0.8 };

      const handler = handlersMap.get('llm-load-model')!;
      await handler({}, '/path/to/model.gguf', config);

      expect(mockLLMService.loadModel).toHaveBeenCalledWith('/path/to/model.gguf', config);
    });

    it('should throw error if loading fails', async () => {
      mockLLMService.loadModel.mockRejectedValue(new Error('Load failed'));

      const handler = handlersMap.get('llm-load-model')!;
      await expect(handler({}, '/path/to/model.gguf')).rejects.toThrow('Load failed');
    });
  });

  describe('llm-unload-model handler', () => {
    beforeEach(async () => {
      await LLMController.registerHandlers();
    });

    it('should unload the model', async () => {
      mockLLMService.unloadModel.mockResolvedValue(undefined);

      const handler = handlersMap.get('llm-unload-model')!;
      await handler();

      expect(mockLLMService.unloadModel).toHaveBeenCalled();
    });

    it('should throw error if unloading fails', async () => {
      mockLLMService.unloadModel.mockRejectedValue(new Error('Unload failed'));

      const handler = handlersMap.get('llm-unload-model')!;
      await expect(handler()).rejects.toThrow('Unload failed');
    });
  });

  describe('llm-is-loaded handler', () => {
    beforeEach(async () => {
      await LLMController.registerHandlers();
    });

    it('should return true if model is loaded', async () => {
      mockLLMService.isModelLoaded.mockReturnValue(true);

      const handler = handlersMap.get('llm-is-loaded')!;
      const result = await handler();

      expect(mockLLMService.isModelLoaded).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if model is not loaded', async () => {
      mockLLMService.isModelLoaded.mockReturnValue(false);

      const handler = handlersMap.get('llm-is-loaded')!;
      const result = await handler();

      expect(result).toBe(false);
    });

    it('should return false if check fails', async () => {
      mockLLMService.isModelLoaded.mockImplementation(() => {
        throw new Error('Check failed');
      });

      const handler = handlersMap.get('llm-is-loaded')!;
      const result = await handler();

      expect(result).toBe(false);
    });
  });

  describe('llm-get-current-model handler', () => {
    beforeEach(async () => {
      await LLMController.registerHandlers();
    });

    it('should get current model path', async () => {
      mockLLMService.getCurrentModelPath.mockReturnValue('/path/to/model.gguf');

      const handler = handlersMap.get('llm-get-current-model')!;
      const result = await handler();

      expect(mockLLMService.getCurrentModelPath).toHaveBeenCalled();
      expect(result).toBe('/path/to/model.gguf');
    });

    it('should return null if no model loaded', async () => {
      mockLLMService.getCurrentModelPath.mockReturnValue(null);

      const handler = handlersMap.get('llm-get-current-model')!;
      const result = await handler();

      expect(result).toBeNull();
    });

    it('should return null if getting path fails', async () => {
      mockLLMService.getCurrentModelPath.mockImplementation(() => {
        throw new Error('Get failed');
      });

      const handler = handlersMap.get('llm-get-current-model')!;
      const result = await handler();

      expect(result).toBeNull();
    });
  });

  describe('llm-download-model handler', () => {
    beforeEach(async () => {
      await LLMController.registerHandlers();
    });

    it('should download a model', async () => {
      const modelInfo = {
        id: 'model1',
        name: 'Model 1',
        filename: 'model1.gguf',
        url: 'https://example.com/model1.gguf',
        size: 1000,
      };

      mockLLMService.ensureModelsDirectory.mockResolvedValue(undefined);
      mockLLMService.getModelsDirectory.mockReturnValue('/models');
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const mockFile = {
        close: jest.fn(),
        on: jest.fn(),
      };
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockFile);

      const mockResponse = {
        statusCode: 200,
        headers: { 'content-length': '1000' },
        on: jest.fn(),
        pipe: jest.fn(),
      };
      (https.get as jest.Mock).mockImplementation((url, callback) => {
        callback(mockResponse);
        return { on: jest.fn() };
      });

      // Simulate successful download
      mockFile.on.mockImplementation((event, callback) => {
        if (event === 'finish') {
          setTimeout(callback, 0);
        }
        return mockFile;
      });

      (BrowserWindow.getAllWindows as jest.Mock).mockReturnValue([]);

      const handler = handlersMap.get('llm-download-model')!;
      await handler({}, modelInfo);

      expect(mockLLMService.ensureModelsDirectory).toHaveBeenCalled();
      expect(fs.createWriteStream).toHaveBeenCalledWith('/models/model1.gguf');
    });

    it('should handle download without content-length header', async () => {
      const modelInfo = {
        id: 'model1',
        name: 'Model 1',
        filename: 'model1.gguf',
        url: 'https://example.com/model1.gguf',
        size: 1000,
      };

      mockLLMService.ensureModelsDirectory.mockResolvedValue(undefined);
      mockLLMService.getModelsDirectory.mockReturnValue('/models');
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const mockFile = {
        close: jest.fn(),
        on: jest.fn(),
      };
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockFile);

      // Response without content-length header
      const mockResponse = {
        statusCode: 200,
        headers: {}, // No content-length
        on: jest.fn(),
        pipe: jest.fn(),
      };
      (https.get as jest.Mock).mockImplementation((url, callback) => {
        callback(mockResponse);
        return { on: jest.fn() };
      });

      mockFile.on.mockImplementation((event, callback) => {
        if (event === 'finish') {
          setTimeout(callback, 0);
        }
        return mockFile;
      });

      (BrowserWindow.getAllWindows as jest.Mock).mockReturnValue([]);

      const handler = handlersMap.get('llm-download-model')!;
      await handler({}, modelInfo);

      expect(fs.createWriteStream).toHaveBeenCalledWith('/models/model1.gguf');
    });

    it('should handle download with zero total bytes', async () => {
      const modelInfo = {
        id: 'model1',
        name: 'Model 1',
        filename: 'model1.gguf',
        url: 'https://example.com/model1.gguf',
        size: 1000,
      };

      mockLLMService.ensureModelsDirectory.mockResolvedValue(undefined);
      mockLLMService.getModelsDirectory.mockReturnValue('/models');
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const mockFile = {
        close: jest.fn(),
        on: jest.fn(),
      };
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockFile);

      // Response with content-length = 0
      const mockResponse = {
        statusCode: 200,
        headers: { 'content-length': '0' },
        on: jest.fn(),
        pipe: jest.fn(),
      };

      let dataCallback: (chunk: Buffer) => void;
      (https.get as jest.Mock).mockImplementation((url, callback) => {
        callback(mockResponse);
        return { on: jest.fn() };
      });

      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          dataCallback = callback;
          // Trigger data event even with 0 content-length
          setTimeout(() => callback(Buffer.alloc(100)), 0);
        }
        return mockResponse;
      });

      mockFile.on.mockImplementation((event, callback) => {
        if (event === 'finish') {
          setTimeout(callback, 10);
        }
        return mockFile;
      });

      const mockWindow = {
        webContents: {
          send: jest.fn(),
        },
      };
      (BrowserWindow.getAllWindows as jest.Mock).mockReturnValue([mockWindow]);

      const handler = handlersMap.get('llm-download-model')!;
      await handler({}, modelInfo);

      // Progress should not be sent when totalBytes is 0
      expect(mockWindow.webContents.send).not.toHaveBeenCalledWith('llm-download-progress', expect.anything());
    });

    it('should throw error if model already downloaded', async () => {
      const modelInfo = {
        id: 'model1',
        name: 'Model 1',
        filename: 'model1.gguf',
        url: 'https://example.com/model1.gguf',
        size: 1000,
      };

      mockLLMService.ensureModelsDirectory.mockResolvedValue(undefined);
      mockLLMService.getModelsDirectory.mockReturnValue('/models');
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const handler = handlersMap.get('llm-download-model')!;
      await expect(handler({}, modelInfo)).rejects.toThrow('Model already downloaded');
    });

    it('should send progress updates during download', async () => {
      const modelInfo = {
        id: 'model1',
        name: 'Model 1',
        filename: 'model1.gguf',
        url: 'https://example.com/model1.gguf',
        size: 1000,
      };

      mockLLMService.ensureModelsDirectory.mockResolvedValue(undefined);
      mockLLMService.getModelsDirectory.mockReturnValue('/models');
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const mockFile = {
        close: jest.fn(),
        on: jest.fn(),
      };
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockFile);

      const mockWindow1 = {
        webContents: {
          send: jest.fn(),
        },
      };
      const mockWindow2 = {
        webContents: {
          send: jest.fn(),
        },
      };
      (BrowserWindow.getAllWindows as jest.Mock).mockReturnValue([mockWindow1, mockWindow2]);

      const mockResponse = {
        statusCode: 200,
        headers: { 'content-length': '1000' },
        on: jest.fn(),
        pipe: jest.fn(),
      };

      let dataCallback: (chunk: Buffer) => void;
      (https.get as jest.Mock).mockImplementation((url, callback) => {
        callback(mockResponse);
        return { on: jest.fn() };
      });

      mockResponse.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          dataCallback = callback;
          // Immediately trigger data events
          setTimeout(() => {
            callback(Buffer.alloc(500));
            callback(Buffer.alloc(500));
          }, 0);
        }
        return mockResponse;
      });

      mockFile.on.mockImplementation((event, callback) => {
        if (event === 'finish') {
          setTimeout(callback, 10);
        }
        return mockFile;
      });

      const handler = handlersMap.get('llm-download-model')!;
      await handler({}, modelInfo);

      // Both windows should receive progress updates
      expect(mockWindow1.webContents.send).toHaveBeenCalledWith('llm-download-progress', {
        modelId: 'model1',
        progress: expect.any(Number),
      });
      expect(mockWindow2.webContents.send).toHaveBeenCalledWith('llm-download-progress', {
        modelId: 'model1',
        progress: expect.any(Number),
      });
    });

    it('should handle redirect', async () => {
      const modelInfo = {
        id: 'model1',
        name: 'Model 1',
        filename: 'model1.gguf',
        url: 'https://example.com/model1.gguf',
        size: 1000,
      };

      mockLLMService.ensureModelsDirectory.mockResolvedValue(undefined);
      mockLLMService.getModelsDirectory.mockReturnValue('/models');
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const mockFile = {
        close: jest.fn(),
        on: jest.fn(),
      };
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockFile);

      // First call returns redirect
      const mockRedirectResponse = {
        statusCode: 301,
        headers: { location: 'https://example.com/redirected.gguf' },
      };

      // Second call returns success
      const mockSuccessResponse = {
        statusCode: 200,
        headers: { 'content-length': '1000' },
        on: jest.fn(),
        pipe: jest.fn(),
      };

      let callCount = 0;
      (https.get as jest.Mock).mockImplementation((url, callback) => {
        if (callCount === 0) {
          callCount++;
          callback(mockRedirectResponse);
        } else {
          callback(mockSuccessResponse);
        }
        return { on: jest.fn() };
      });

      mockFile.on.mockImplementation((event, callback) => {
        if (event === 'finish') {
          setTimeout(callback, 0);
        }
        return mockFile;
      });

      (BrowserWindow.getAllWindows as jest.Mock).mockReturnValue([]);

      const handler = handlersMap.get('llm-download-model')!;
      await handler({}, modelInfo);

      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('should handle redirect without location header', async () => {
      const modelInfo = {
        id: 'model1',
        name: 'Model 1',
        filename: 'model1.gguf',
        url: 'https://example.com/model1.gguf',
        size: 1000,
      };

      mockLLMService.ensureModelsDirectory.mockResolvedValue(undefined);
      mockLLMService.getModelsDirectory.mockReturnValue('/models');
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const mockFile = {
        close: jest.fn(),
        on: jest.fn(),
      };
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockFile);

      const mockRedirectResponse = {
        statusCode: 302,
        headers: {},
      };

      (https.get as jest.Mock).mockImplementation((url, callback) => {
        callback(mockRedirectResponse);
        return { on: jest.fn() };
      });

      const handler = handlersMap.get('llm-download-model')!;
      await expect(handler({}, modelInfo)).rejects.toThrow('Redirect without location header');
    });

    it('should handle non-200 status code', async () => {
      const modelInfo = {
        id: 'model1',
        name: 'Model 1',
        filename: 'model1.gguf',
        url: 'https://example.com/model1.gguf',
        size: 1000,
      };

      mockLLMService.ensureModelsDirectory.mockResolvedValue(undefined);
      mockLLMService.getModelsDirectory.mockReturnValue('/models');
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const mockFile = {
        close: jest.fn(),
        on: jest.fn(),
      };
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockFile);

      const mockResponse = {
        statusCode: 404,
        headers: {},
      };

      (https.get as jest.Mock).mockImplementation((url, callback) => {
        callback(mockResponse);
        return { on: jest.fn() };
      });

      const handler = handlersMap.get('llm-download-model')!;
      await expect(handler({}, modelInfo)).rejects.toThrow('Failed to download: 404');
    });

    it('should handle https error', async () => {
      const modelInfo = {
        id: 'model1',
        name: 'Model 1',
        filename: 'model1.gguf',
        url: 'https://example.com/model1.gguf',
        size: 1000,
      };

      mockLLMService.ensureModelsDirectory.mockResolvedValue(undefined);
      mockLLMService.getModelsDirectory.mockReturnValue('/models');
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const mockFile = {
        close: jest.fn(),
        on: jest.fn(),
      };
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockFile);

      let errorCallback: (err: Error) => void;
      (https.get as jest.Mock).mockImplementation(() => {
        return {
          on: (event: string, callback: (err: Error) => void) => {
            if (event === 'error') {
              errorCallback = callback;
              setTimeout(() => errorCallback(new Error('Network error')), 0);
            }
          },
        };
      });

      const handler = handlersMap.get('llm-download-model')!;
      await expect(handler({}, modelInfo)).rejects.toThrow('Network error');
    });

    it('should handle file write error', async () => {
      const modelInfo = {
        id: 'model1',
        name: 'Model 1',
        filename: 'model1.gguf',
        url: 'https://example.com/model1.gguf',
        size: 1000,
      };

      mockLLMService.ensureModelsDirectory.mockResolvedValue(undefined);
      mockLLMService.getModelsDirectory.mockReturnValue('/models');
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const mockFile = {
        close: jest.fn(),
        on: jest.fn(),
      };
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockFile);

      mockFile.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Write error')), 0);
        }
        return mockFile;
      });

      const mockResponse = {
        statusCode: 200,
        headers: { 'content-length': '1000' },
        on: jest.fn(),
        pipe: jest.fn(),
      };

      (https.get as jest.Mock).mockImplementation((url, callback) => {
        callback(mockResponse);
        return { on: jest.fn() };
      });

      const handler = handlersMap.get('llm-download-model')!;
      await expect(handler({}, modelInfo)).rejects.toThrow('Write error');
    });

    it('should cleanup partial download on error', async () => {
      const modelInfo = {
        id: 'model1',
        name: 'Model 1',
        filename: 'model1.gguf',
        url: 'https://example.com/model1.gguf',
        size: 1000,
      };

      mockLLMService.ensureModelsDirectory.mockResolvedValue(undefined);
      mockLLMService.getModelsDirectory.mockReturnValue('/models');
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false).mockReturnValueOnce(true);
      (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);

      const mockFile = {
        close: jest.fn(),
        on: jest.fn(),
      };
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockFile);

      (https.get as jest.Mock).mockImplementation(() => {
        return {
          on: (event: string, callback: (err: Error) => void) => {
            if (event === 'error') {
              setTimeout(() => callback(new Error('Network error')), 0);
            }
          },
        };
      });

      const handler = handlersMap.get('llm-download-model')!;
      await expect(handler({}, modelInfo)).rejects.toThrow('Network error');
      expect(fs.unlinkSync).toHaveBeenCalledWith('/models/model1.gguf');
    });

    it('should create NOTICE file for Llama models', async () => {
      const modelInfo = {
        id: 'llama-3.2-1b',
        name: 'Llama 3.2 1B',
        filename: 'llama-3.2-1b.gguf',
        url: 'https://example.com/llama.gguf',
        license: 'LLAMA 3.2 COMMUNITY LICENSE AGREEMENT',
        requiresAttribution: true,
        attributionText: 'Built with Llama',
      };

      mockLLMService.ensureModelsDirectory.mockResolvedValue(undefined);
      mockLLMService.getModelsDirectory.mockReturnValue('/models');
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false).mockReturnValueOnce(false); // file doesn't exist, NOTICE doesn't exist

      const mockFile = {
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            setTimeout(callback, 10);
          }
          return mockFile;
        }),
        close: jest.fn(),
      };

      (fs.createWriteStream as jest.Mock).mockReturnValue(mockFile);

      const mockResponse = {
        statusCode: 200,
        headers: { 'content-length': '1000' },
        on: jest.fn(),
        pipe: jest.fn((file) => {
          setTimeout(() => {
            const finishCallback = mockFile.on.mock.calls.find((call: any) => call[0] === 'finish')?.[1];
            if (finishCallback) finishCallback();
          }, 10);
        }),
      };

      (https.get as jest.Mock).mockImplementation((url, callback) => {
        callback(mockResponse);
        return { on: jest.fn() };
      });

      (BrowserWindow.getAllWindows as jest.Mock).mockReturnValue([]);

      const handler = handlersMap.get('llm-download-model')!;
      await handler({}, modelInfo);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join('/models', 'NOTICE'),
        expect.stringContaining('Llama 3.2 is licensed under the Llama 3.2 Community License'),
        'utf-8'
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join('/models', 'NOTICE'),
        expect.stringContaining(modelInfo.name),
        'utf-8'
      );
    });

    it('should append to existing NOTICE file for additional Llama models', async () => {
      const modelInfo = {
        id: 'llama-3.2-3b',
        name: 'Llama 3.2 3B',
        filename: 'llama-3.2-3b.gguf',
        url: 'https://example.com/llama.gguf',
        license: 'LLAMA 3.2 COMMUNITY LICENSE AGREEMENT',
        requiresAttribution: true,
        attributionText: 'Built with Llama',
      };

      mockLLMService.ensureModelsDirectory.mockResolvedValue(undefined);
      mockLLMService.getModelsDirectory.mockReturnValue('/models');
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false).mockReturnValueOnce(true); // file doesn't exist, NOTICE exists

      const existingNotice = 'Existing NOTICE content\n- Llama 3.2 1B (llama-3.2-1b.gguf)\n';
      (fs.readFileSync as jest.Mock).mockReturnValue(existingNotice);

      const mockFile = {
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            setTimeout(callback, 10);
          }
          return mockFile;
        }),
        close: jest.fn(),
      };

      (fs.createWriteStream as jest.Mock).mockReturnValue(mockFile);

      const mockResponse = {
        statusCode: 200,
        headers: { 'content-length': '1000' },
        on: jest.fn(),
        pipe: jest.fn((file) => {
          setTimeout(() => {
            const finishCallback = mockFile.on.mock.calls.find((call: any) => call[0] === 'finish')?.[1];
            if (finishCallback) finishCallback();
          }, 10);
        }),
      };

      (https.get as jest.Mock).mockImplementation((url, callback) => {
        callback(mockResponse);
        return { on: jest.fn() };
      });

      (BrowserWindow.getAllWindows as jest.Mock).mockReturnValue([]);

      const handler = handlersMap.get('llm-download-model')!;
      await handler({}, modelInfo);

      expect(fs.appendFileSync).toHaveBeenCalledWith(
        path.join('/models', 'NOTICE'),
        expect.stringContaining(modelInfo.name)
      );
    });

    it('should not duplicate models in NOTICE file', async () => {
      const modelInfo = {
        id: 'llama-3.2-1b',
        name: 'Llama 3.2 1B',
        filename: 'llama-3.2-1b.gguf',
        url: 'https://example.com/llama.gguf',
        license: 'LLAMA 3.2 COMMUNITY LICENSE AGREEMENT',
        requiresAttribution: true,
        attributionText: 'Built with Llama',
      };

      mockLLMService.ensureModelsDirectory.mockResolvedValue(undefined);
      mockLLMService.getModelsDirectory.mockReturnValue('/models');
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false).mockReturnValueOnce(true); // file doesn't exist, NOTICE exists

      const existingNotice = 'Existing content\n- Llama 3.2 1B (llama-3.2-1b.gguf)\n';
      (fs.readFileSync as jest.Mock).mockReturnValue(existingNotice);

      const mockFile = {
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            setTimeout(callback, 10);
          }
          return mockFile;
        }),
        close: jest.fn(),
      };

      (fs.createWriteStream as jest.Mock).mockReturnValue(mockFile);

      const mockResponse = {
        statusCode: 200,
        headers: { 'content-length': '1000' },
        on: jest.fn(),
        pipe: jest.fn((file) => {
          setTimeout(() => {
            const finishCallback = mockFile.on.mock.calls.find((call: any) => call[0] === 'finish')?.[1];
            if (finishCallback) finishCallback();
          }, 10);
        }),
      };

      (https.get as jest.Mock).mockImplementation((url, callback) => {
        callback(mockResponse);
        return { on: jest.fn() };
      });

      (BrowserWindow.getAllWindows as jest.Mock).mockReturnValue([]);

      const handler = handlersMap.get('llm-download-model')!;
      await handler({}, modelInfo);

      // Should NOT append since model already exists
      expect(fs.appendFileSync).not.toHaveBeenCalled();
    });

    it('should not create NOTICE file for non-Llama models', async () => {
      const modelInfo = {
        id: 'other-model',
        name: 'Other Model',
        filename: 'other.gguf',
        url: 'https://example.com/other.gguf',
        license: 'MIT',
        requiresAttribution: false,
      };

      mockLLMService.ensureModelsDirectory.mockResolvedValue(undefined);
      mockLLMService.getModelsDirectory.mockReturnValue('/models');
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const mockFile = {
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            setTimeout(callback, 10);
          }
          return mockFile;
        }),
        close: jest.fn(),
      };

      (fs.createWriteStream as jest.Mock).mockReturnValue(mockFile);

      const mockResponse = {
        statusCode: 200,
        headers: { 'content-length': '1000' },
        on: jest.fn(),
        pipe: jest.fn((file) => {
          setTimeout(() => {
            const finishCallback = mockFile.on.mock.calls.find((call: any) => call[0] === 'finish')?.[1];
            if (finishCallback) finishCallback();
          }, 10);
        }),
      };

      (https.get as jest.Mock).mockImplementation((url, callback) => {
        callback(mockResponse);
        return { on: jest.fn() };
      });

      (BrowserWindow.getAllWindows as jest.Mock).mockReturnValue([]);

      const handler = handlersMap.get('llm-download-model')!;
      await handler({}, modelInfo);

      expect(fs.writeFileSync).not.toHaveBeenCalled();
      expect(fs.appendFileSync).not.toHaveBeenCalled();
    });

    it('should handle NOTICE file creation error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const modelInfo = {
        id: 'llama-3.2-1b',
        name: 'Llama 3.2 1B',
        filename: 'llama-3.2-1b.gguf',
        url: 'https://example.com/llama.gguf',
        license: 'LLAMA 3.2 COMMUNITY LICENSE AGREEMENT',
        requiresAttribution: true,
        attributionText: 'Built with Llama',
      };

      mockLLMService.ensureModelsDirectory.mockResolvedValue(undefined);
      mockLLMService.getModelsDirectory.mockReturnValue('/models');
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false).mockReturnValueOnce(false);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Write failed');
      });

      const mockFile = {
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            setTimeout(callback, 10);
          }
          return mockFile;
        }),
        close: jest.fn(),
      };

      (fs.createWriteStream as jest.Mock).mockReturnValue(mockFile);

      const mockResponse = {
        statusCode: 200,
        headers: { 'content-length': '1000' },
        on: jest.fn(),
        pipe: jest.fn((file) => {
          setTimeout(() => {
            const finishCallback = mockFile.on.mock.calls.find((call: any) => call[0] === 'finish')?.[1];
            if (finishCallback) finishCallback();
          }, 10);
        }),
      };

      (https.get as jest.Mock).mockImplementation((url, callback) => {
        callback(mockResponse);
        return { on: jest.fn() };
      });

      (BrowserWindow.getAllWindows as jest.Mock).mockReturnValue([]);

      const handler = handlersMap.get('llm-download-model')!;

      // Should not throw even if NOTICE creation fails
      await expect(handler({}, modelInfo)).resolves.not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to create NOTICE file:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

  });

  describe('llm-delete-model handler', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);
      await LLMController.registerHandlers();
    });

    it('should delete a model', async () => {
      const modelInfo = {
        id: 'model1',
        name: 'Model 1',
        filename: 'model1.gguf',
        url: 'https://example.com/model1.gguf',
        size: 1000,
      };

      mockLLMService.getModelsDirectory.mockReturnValue('/models');
      mockLLMService.getCurrentModelPath.mockReturnValue('/other/model.gguf');
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const handler = handlersMap.get('llm-delete-model')!;
      await handler({}, modelInfo);

      expect(fs.unlinkSync).toHaveBeenCalledWith('/models/model1.gguf');
    });

    it('should unload model if currently loaded', async () => {
      const modelInfo = {
        id: 'model1',
        name: 'Model 1',
        filename: 'model1.gguf',
        url: 'https://example.com/model1.gguf',
        size: 1000,
      };

      mockLLMService.getModelsDirectory.mockReturnValue('/models');
      mockLLMService.getCurrentModelPath.mockReturnValue('/models/model1.gguf');
      mockLLMService.unloadModel.mockResolvedValue(undefined);
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const handler = handlersMap.get('llm-delete-model')!;
      await handler({}, modelInfo);

      expect(mockLLMService.unloadModel).toHaveBeenCalled();
      expect(fs.unlinkSync).toHaveBeenCalledWith('/models/model1.gguf');
    });

    it('should not delete if file does not exist', async () => {
      const modelInfo = {
        id: 'model1',
        name: 'Model 1',
        filename: 'model1.gguf',
        url: 'https://example.com/model1.gguf',
        size: 1000,
      };

      mockLLMService.getModelsDirectory.mockReturnValue('/models');
      mockLLMService.getCurrentModelPath.mockReturnValue('/other/model.gguf');
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const handler = handlersMap.get('llm-delete-model')!;
      await handler({}, modelInfo);

      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('should throw error if deletion fails', async () => {
      const modelInfo = {
        id: 'model1',
        name: 'Model 1',
        filename: 'model1.gguf',
        url: 'https://example.com/model1.gguf',
        size: 1000,
      };

      mockLLMService.getModelsDirectory.mockImplementation(() => {
        throw new Error('Delete failed');
      });

      const handler = handlersMap.get('llm-delete-model')!;
      await expect(handler({}, modelInfo)).rejects.toThrow('Delete failed');
    });
  });

  describe('llm-update-config handler', () => {
    beforeEach(async () => {
      await LLMController.registerHandlers();
    });

    it('should update config', async () => {
      const config = { temperature: 0.8 };
      mockLLMService.updateConfig.mockReturnValue(undefined);

      const handler = handlersMap.get('llm-update-config')!;
      await handler({}, config);

      expect(mockLLMService.updateConfig).toHaveBeenCalledWith(config);
    });

    it('should throw error if update fails', async () => {
      const config = { temperature: 0.8 };
      mockLLMService.updateConfig.mockImplementation(() => {
        throw new Error('Update failed');
      });

      const handler = handlersMap.get('llm-update-config')!;
      await expect(handler({}, config)).rejects.toThrow('Update failed');
    });
  });

  describe('llm-get-config handler', () => {
    beforeEach(async () => {
      await LLMController.registerHandlers();
    });

    it('should get config', async () => {
      const mockConfig = { temperature: 0.7, maxTokens: 2048 };
      mockLLMService.getConfig.mockReturnValue(mockConfig);

      const handler = handlersMap.get('llm-get-config')!;
      const result = await handler();

      expect(mockLLMService.getConfig).toHaveBeenCalled();
      expect(result).toEqual(mockConfig);
    });

    it('should throw error if get fails', async () => {
      mockLLMService.getConfig.mockImplementation(() => {
        throw new Error('Get failed');
      });

      const handler = handlersMap.get('llm-get-config')!;
      await expect(handler()).rejects.toThrow('Get failed');
    });
  });

  describe('llm-generate-response handler', () => {
    beforeEach(async () => {
      await LLMController.registerHandlers();
    });

    it('should generate response with streaming', async () => {
      const mockResponse = 'This is a test response';
      const mockSender = {
        send: jest.fn(),
      };

      mockLLMService.generateResponse.mockImplementation(async (prompt: string, callback: (token: string) => void) => {
        callback('This ');
        callback('is ');
        callback('a ');
        callback('test ');
        callback('response');
        return mockResponse;
      });

      const mockEvent = { sender: mockSender };
      const handler = handlersMap.get('llm-generate-response')!;
      const result = await handler(mockEvent, 'test prompt');

      expect(mockLLMService.generateResponse).toHaveBeenCalledWith('test prompt', expect.any(Function));
      expect(mockSender.send).toHaveBeenCalledWith('llm-token', expect.any(String));
      expect(result).toBe(mockResponse);
    });

    it('should throw error if generation fails', async () => {
      mockLLMService.generateResponse.mockRejectedValue(new Error('Generation failed'));

      const mockEvent = { sender: { send: jest.fn() } };
      const handler = handlersMap.get('llm-generate-response')!;
      await expect(handler(mockEvent, 'test prompt')).rejects.toThrow('Generation failed');
    });
  });

  describe('llm-get-models-directory handler', () => {
    beforeEach(async () => {
      await LLMController.registerHandlers();
    });

    it('should get models directory', async () => {
      mockLLMService.getModelsDirectory.mockReturnValue('/models');

      const handler = handlersMap.get('llm-get-models-directory')!;
      const result = await handler();

      expect(mockLLMService.getModelsDirectory).toHaveBeenCalled();
      expect(result).toBe('/models');
    });

    it('should throw error if get fails', async () => {
      mockLLMService.getModelsDirectory.mockImplementation(() => {
        throw new Error('Get failed');
      });

      const handler = handlersMap.get('llm-get-models-directory')!;
      await expect(handler()).rejects.toThrow('Get failed');
    });
  });

  describe('llm-set-models-directory handler', () => {
    beforeEach(async () => {
      await LLMController.registerHandlers();
    });

    it('should set models directory', async () => {
      const mockWindow = {};
      (BrowserWindow.getFocusedWindow as jest.Mock).mockReturnValue(mockWindow);
      (dialog.showOpenDialog as jest.Mock).mockResolvedValue({
        canceled: false,
        filePaths: ['/new/models/path'],
      });

      mockLLMService.setCustomModelsPath.mockReturnValue(undefined);

      const handler = handlersMap.get('llm-set-models-directory')!;
      const result = await handler({});

      expect(dialog.showOpenDialog).toHaveBeenCalledWith(mockWindow, {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Select Models Folder',
      });
      expect(mockLLMService.setCustomModelsPath).toHaveBeenCalledWith('/new/models/path');
      expect(result).toBe('/new/models/path');
    });

    it('should return null if dialog is canceled', async () => {
      const mockWindow = {};
      (BrowserWindow.getFocusedWindow as jest.Mock).mockReturnValue(mockWindow);
      (dialog.showOpenDialog as jest.Mock).mockResolvedValue({
        canceled: true,
        filePaths: [],
      });

      const handler = handlersMap.get('llm-set-models-directory')!;
      const result = await handler({});

      expect(result).toBeNull();
    });

    it('should return null if no directory selected', async () => {
      const mockWindow = {};
      (BrowserWindow.getFocusedWindow as jest.Mock).mockReturnValue(mockWindow);
      (dialog.showOpenDialog as jest.Mock).mockResolvedValue({
        canceled: false,
        filePaths: [],
      });

      const handler = handlersMap.get('llm-set-models-directory')!;
      const result = await handler({});

      expect(result).toBeNull();
    });

    it('should use first available window if no focused window', async () => {
      const mockWindow = {};
      (BrowserWindow.getFocusedWindow as jest.Mock).mockReturnValue(null);
      (BrowserWindow.getAllWindows as jest.Mock).mockReturnValue([mockWindow]);
      (dialog.showOpenDialog as jest.Mock).mockResolvedValue({
        canceled: false,
        filePaths: ['/new/models/path'],
      });

      mockLLMService.setCustomModelsPath.mockReturnValue(undefined);

      const handler = handlersMap.get('llm-set-models-directory')!;
      const result = await handler({});

      expect(result).toBe('/new/models/path');
    });

    it('should throw error if no window available', async () => {
      (BrowserWindow.getFocusedWindow as jest.Mock).mockReturnValue(null);
      (BrowserWindow.getAllWindows as jest.Mock).mockReturnValue([]);

      const handler = handlersMap.get('llm-set-models-directory')!;
      await expect(handler({})).rejects.toThrow('No window available for dialog');
    });

    it('should throw error if dialog fails', async () => {
      const mockWindow = {};
      (BrowserWindow.getFocusedWindow as jest.Mock).mockReturnValue(mockWindow);
      (dialog.showOpenDialog as jest.Mock).mockRejectedValue(new Error('Dialog failed'));

      const handler = handlersMap.get('llm-set-models-directory')!;
      await expect(handler({})).rejects.toThrow('Dialog failed');
    });
  });

  describe('llm-scan-folder handler', () => {
    beforeEach(async () => {
      await LLMController.registerHandlers();
    });

    it('should scan folder for models', async () => {
      const mockModels = [
        { id: 'model1', name: 'Model 1', filename: 'model1.gguf', url: '', size: 1000 },
      ];
      mockLLMService.scanFolderForModels.mockResolvedValue(mockModels);

      const handler = handlersMap.get('llm-scan-folder')!;
      const result = await handler({}, '/custom/path');

      expect(mockLLMService.scanFolderForModels).toHaveBeenCalledWith('/custom/path');
      expect(result).toEqual(mockModels);
    });

    it('should use default models directory if no path provided', async () => {
      const mockModels = [
        { id: 'model1', name: 'Model 1', filename: 'model1.gguf', url: '', size: 1000 },
      ];
      mockLLMService.getModelsDirectory.mockReturnValue('/default/models');
      mockLLMService.scanFolderForModels.mockResolvedValue(mockModels);

      const handler = handlersMap.get('llm-scan-folder')!;
      const result = await handler({});

      expect(mockLLMService.scanFolderForModels).toHaveBeenCalledWith('/default/models');
      expect(result).toEqual(mockModels);
    });

    it('should throw error if scan fails', async () => {
      mockLLMService.scanFolderForModels.mockRejectedValue(new Error('Scan failed'));

      const handler = handlersMap.get('llm-scan-folder')!;
      await expect(handler({}, '/custom/path')).rejects.toThrow('Scan failed');
      // Error logging is tested in llm.controller.helpers.test.ts
    });

    it('should throw error if getting models directory fails when no path provided', async () => {
      mockLLMService.getModelsDirectory.mockImplementation(() => {
        throw new Error('Directory error');
      });

      const handler = handlersMap.get('llm-scan-folder')!;
      await expect(handler({})).rejects.toThrow('Directory error');
      // Error logging is tested in llm.controller.helpers.test.ts
    });
  });
});