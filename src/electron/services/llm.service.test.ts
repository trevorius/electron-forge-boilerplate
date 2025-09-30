import { LLMService, getLLMService } from './llm.service';
import * as fs from 'fs';
import * as path from 'path';

// Mock electron
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn((name: string) => {
      if (name === 'userData') return '/mock/user/data';
      return '/mock/path';
    }),
  },
}));

// Mock fs module
jest.mock('fs');

// Mock path module methods we need
jest.mock('path', () => {
  const actualPath = jest.requireActual('path');
  return {
    ...actualPath,
    join: jest.fn((...args) => args.join('/')),
    dirname: jest.fn((p) => p.split('/').slice(0, -1).join('/')),
  };
});

describe('LLMService', () => {
  let service: LLMService;
  let mockGetLlama: jest.Mock;
  let mockLlama: any;
  let mockModel: any;
  let mockContext: any;
  let mockSession: any;
  let mockLlamaChatSession: jest.Mock;
  let originalFunction: typeof Function;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset NODE_ENV to 'test' for test isolation
    process.env.NODE_ENV = 'test';

    // Setup common mocks
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
    (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
    (fs.readFileSync as jest.Mock).mockReturnValue('{"models": []}');
    (fs.readdirSync as jest.Mock).mockReturnValue([]);
    (fs.statSync as jest.Mock).mockReturnValue({ size: 1024 * 1024 });
    (fs.copyFileSync as jest.Mock).mockReturnValue(undefined);

    // Mock process.resourcesPath for production mode tests
    Object.defineProperty(process, 'resourcesPath', {
      value: '/mock/resources',
      writable: true,
      configurable: true,
    });

    // Create mocks for llama objects
    mockSession = {
      prompt: jest.fn().mockResolvedValue(undefined),
    };

    mockContext = {
      getSequence: jest.fn().mockReturnValue({}),
      dispose: jest.fn().mockResolvedValue(undefined),
    };

    mockModel = {
      createContext: jest.fn().mockResolvedValue(mockContext),
      dispose: jest.fn().mockResolvedValue(undefined),
      detokenize: jest.fn((tokens: number[]) => 'token'),
    };

    mockLlama = {
      loadModel: jest.fn().mockResolvedValue(mockModel),
    };

    mockGetLlama = jest.fn().mockResolvedValue(mockLlama);
    mockLlamaChatSession = jest.fn().mockImplementation(() => mockSession);

    // Mock Function constructor for dynamic imports
    originalFunction = global.Function;
    global.Function = jest.fn().mockImplementation((arg1: string, arg2: string) => {
      if (arg1 === 'specifier' && arg2 === 'return import(specifier)') {
        return jest.fn().mockImplementation(async (specifier: string) => {
          if (specifier === 'node-llama-cpp') {
            return {
              getLlama: mockGetLlama,
              LlamaChatSession: mockLlamaChatSession,
            };
          }
          throw new Error(`Unknown module: ${specifier}`);
        });
      }
      return originalFunction(arg1, arg2);
    }) as any;

    service = new LLMService();
  });

  afterEach(() => {
    global.Function = originalFunction;
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await service.initialize();
      expect(global.Function).toHaveBeenCalled();
    });

    it('should not re-initialize if already initialized', async () => {
      await service.initialize();
      const firstCallCount = (global.Function as jest.Mock).mock.calls.length;

      await service.initialize();
      const secondCallCount = (global.Function as jest.Mock).mock.calls.length;

      expect(secondCallCount).toBe(firstCallCount);
    });

    it('should throw error if initialization fails', async () => {
      mockGetLlama.mockRejectedValue(new Error('Init failed'));

      await expect(service.initialize()).rejects.toThrow('Init failed');
    });
  });

  describe('getModelsDirectory', () => {
    it('should return custom path if exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({ modelsPath: '/custom/path' }));

      const result = service.getModelsDirectory();
      expect(result).toBe('/custom/path');
    });

    it('should return development path in dev mode', () => {
      process.env.NODE_ENV = 'development';
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = service.getModelsDirectory();
      expect(result).toContain('models');
    });

    it('should return userData path in production', () => {
      process.env.NODE_ENV = 'production';
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = service.getModelsDirectory();
      expect(result).toContain('/mock/user/data');
    });
  });

  describe('getCustomModelsPath', () => {
    it('should return custom path from config', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({ modelsPath: '/custom' }));

      const result = service.getCustomModelsPath();
      expect(result).toBe('/custom');
    });

    it('should return null if config does not have modelsPath', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({}));

      const result = service.getCustomModelsPath();
      expect(result).toBeNull();
    });

    it('should return null if config file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = service.getCustomModelsPath();
      expect(result).toBeNull();
    });

    it('should return null if config file is invalid', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');

      const result = service.getCustomModelsPath();
      expect(result).toBeNull();
    });
  });

  describe('setCustomModelsPath', () => {
    it('should write custom models path to config', () => {
      service.setCustomModelsPath('/new/path');

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify({ modelsPath: '/new/path' }, null, 2)
      );
    });

    it('should create config directory if it does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      service.setCustomModelsPath('/new/path');

      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });
  });

  describe('scanFolderForModels', () => {
    it('should return empty array if folder does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = service.scanFolderForModels('/fake/path');
      expect(result).toEqual([]);
    });

    it('should scan folder and return gguf files', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue(['model1.gguf', 'model2.gguf', 'readme.txt']);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 1024 * 1024 * 10 });

      const result = service.scanFolderForModels('/models');

      expect(result).toHaveLength(2);
      expect(result[0].filename).toBe('model1.gguf');
      expect(result[0].installed).toBe(true);
      expect(result[0].type).toBe('custom');
    });
  });

  describe('ensureModelsDirectory', () => {
    it('should create models directory if it does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await service.ensureModelsDirectory();

      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });

    it('should not create directory if it already exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await service.ensureModelsDirectory();

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('listAvailableModels', () => {
    it('should list available models in development mode', async () => {
      process.env.NODE_ENV = 'development';
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
        models: [
          { id: 'model1', filename: 'model1.gguf', name: 'Model 1' }
        ]
      }));

      const result = await service.listAvailableModels();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('model1');
    });

    it('should copy llms.json in production if missing', async () => {
      process.env.NODE_ENV = 'production';

      let callCount = 0;
      (fs.existsSync as jest.Mock).mockClear().mockImplementation((filePath: string) => {
        callCount++;
        if (callCount === 1) return false; // config file (for getCustomModelsPath)
        if (callCount === 2) return true;  // models dir exists
        if (callCount === 3) return false; // config file again (for getCustomModelsPath)
        if (callCount === 4) return false; // llmsConfigPath doesn't exist
        if (callCount === 5) return true;  // defaultLlmsPath exists
        return true; // default for any other calls
      });

      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
        models: []
      }));

      await service.listAvailableModels();

      expect(fs.copyFileSync).toHaveBeenCalledWith(
        '/mock/resources/llms.json',
        '/mock/user/data/llms.json'
      );
    });

    it('should throw error if llms.json not found in production', async () => {
      process.env.NODE_ENV = 'production';

      let callCount = 0;
      (fs.existsSync as jest.Mock).mockClear().mockImplementation((filePath: string) => {
        callCount++;
        if (callCount === 1) return false; // config file (for getCustomModelsPath)
        if (callCount === 2) return true;  // models dir exists
        if (callCount === 3) return false; // config file again (for getCustomModelsPath)
        if (callCount === 4) return false; // llmsConfigPath doesn't exist
        if (callCount === 5) return false; // defaultLlmsPath doesn't exist
        return true; // default
      });

      await expect(service.listAvailableModels()).rejects.toThrow('llms.json not found');
    });

    it('should mark models as installed if they exist', async () => {
      process.env.NODE_ENV = 'development'; // Use dev mode to simplify the test

      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
        models: [
          { id: 'model1', filename: 'model1.gguf', name: 'Model 1' }
        ]
      }));

      let callCount = 0;
      (fs.existsSync as jest.Mock).mockClear().mockImplementation((filePath: string) => {
        callCount++;
        if (callCount === 1) return false; // config file (for getCustomModelsPath)
        if (callCount === 2) return true;  // models dir
        if (callCount === 3) return false; // config file again (for getCustomModelsPath)
        if (callCount === 4) return true;  // model1 exists
        return true; // default
      });

      const result = await service.listAvailableModels();

      expect(result[0].installed).toBe(true);
      expect(result[0].path).toBeDefined();
    });
  });

  describe('listInstalledModels', () => {
    it('should return only installed models', async () => {
      process.env.NODE_ENV = 'development'; // Use dev mode to simplify the test

      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
        models: [
          { id: 'model1', filename: 'model1.gguf', name: 'Model 1' },
          { id: 'model2', filename: 'model2.gguf', name: 'Model 2' }
        ]
      }));

      let callCount = 0;
      (fs.existsSync as jest.Mock).mockClear().mockImplementation((filePath: string) => {
        callCount++;
        if (callCount === 1) return false; // config file (for getCustomModelsPath)
        if (callCount === 2) return true;  // models dir exists
        if (callCount === 3) return false; // config file again (for getCustomModelsPath)
        if (callCount === 4) return true;  // model1 installed check
        if (callCount === 5) return true;  // model1 path check
        if (callCount === 6) return false; // model2 installed check (no path check needed)
        return true; // default
      });

      const result = await service.listInstalledModels();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('model1');
    });
  });

  describe('loadModel', () => {
    beforeEach(async () => {
      await service.initialize();
      jest.clearAllMocks();
    });

    it('should load model successfully', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await service.loadModel('/model.gguf');

      expect(mockLlama.loadModel).toHaveBeenCalledWith({
        modelPath: '/model.gguf',
        gpuLayers: -1,
      });
      expect(mockModel.createContext).toHaveBeenCalled();
      expect(service.isModelLoaded()).toBe(true);
    });

    it('should initialize if not already initialized', async () => {
      const freshService = new LLMService();
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await freshService.loadModel('/model.gguf');

      expect(freshService.isModelLoaded()).toBe(true);
    });

    it('should update config if provided', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await service.loadModel('/model.gguf', { contextSize: 5000, temperature: 0.5 });

      expect(service.getConfig().contextSize).toBe(5000);
      expect(service.getConfig().temperature).toBe(0.5);
    });

    it('should throw error if model file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(service.loadModel('/missing.gguf')).rejects.toThrow('Model file not found');
    });

    it('should unload existing model before loading new one', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await service.loadModel('/model1.gguf');
      await service.loadModel('/model2.gguf');

      expect(mockModel.dispose).toHaveBeenCalled();
    });

    it('should retry with smaller context on VRAM error', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      mockLlama.loadModel
        .mockRejectedValueOnce(new Error('VRAM insufficient'))
        .mockResolvedValueOnce(mockModel);

      await service.loadModel('/model.gguf', { contextSize: 3000 });

      expect(mockLlama.loadModel).toHaveBeenCalledTimes(2);
    });

    it('should try CPU mode after GPU failures', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      mockLlama.loadModel
        .mockRejectedValueOnce(new Error('VRAM insufficient'))
        .mockRejectedValueOnce(new Error('VRAM insufficient'))
        .mockResolvedValueOnce(mockModel);

      await service.loadModel('/model.gguf', { contextSize: 3000 });

      // Should have tried multiple times with different settings
      expect(mockLlama.loadModel).toHaveBeenCalledWith(
        expect.objectContaining({ gpuLayers: -1 })
      );
      expect(mockLlama.loadModel).toHaveBeenCalledWith(
        expect.objectContaining({ gpuLayers: 0 })
      );
    });

    it('should throw error if non-VRAM error occurs', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      mockLlama.loadModel.mockRejectedValue(new Error('Invalid model format'));

      await expect(service.loadModel('/model.gguf')).rejects.toThrow();
    });

    it('should throw error after all strategies fail', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      mockLlama.loadModel.mockRejectedValue(new Error('VRAM insufficient'));

      await expect(service.loadModel('/model.gguf', { contextSize: 2000 })).rejects.toThrow(
        'Failed to load model: Unable to load with any combination of settings'
      );
    });

    it('should clean up on partial loading failure', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      mockModel.createContext
        .mockRejectedValueOnce(new Error('Context creation failed'))
        .mockResolvedValueOnce(mockContext);

      mockLlama.loadModel
        .mockResolvedValueOnce(mockModel)
        .mockResolvedValueOnce(mockModel);

      try {
        await service.loadModel('/model.gguf');
      } catch (e) {
        // Expected to fail eventually
      }

      expect(mockModel.dispose).toHaveBeenCalled();
    });

    it('should handle context dispose errors during cleanup', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // Create a context that fails to dispose
      const failingContext = {
        dispose: jest.fn().mockRejectedValue(new Error('Dispose failed')),
      };

      mockModel.createContext
        .mockResolvedValueOnce(failingContext)
        .mockRejectedValueOnce(new Error('Second attempt failed'));

      mockLlama.loadModel
        .mockResolvedValueOnce(mockModel)
        .mockRejectedValueOnce(new Error('Loading failed'));

      // Should not throw even though context.dispose() fails
      await expect(service.loadModel('/model.gguf')).rejects.toThrow();

      // Verify that dispose was called and failed silently
      expect(failingContext.dispose).toHaveBeenCalled();
    });
  });

  describe('unloadModel', () => {
    beforeEach(async () => {
      await service.initialize();
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      await service.loadModel('/model.gguf');
      jest.clearAllMocks();
    });

    it('should unload model successfully', async () => {
      await service.unloadModel();

      expect(mockContext.dispose).toHaveBeenCalled();
      expect(mockModel.dispose).toHaveBeenCalled();
      expect(service.isModelLoaded()).toBe(false);
    });

    it('should not throw if model is not loaded', async () => {
      await service.unloadModel();
      await expect(service.unloadModel()).resolves.not.toThrow();
    });
  });

  describe('isModelLoaded', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should return false when no model loaded', () => {
      expect(service.isModelLoaded()).toBe(false);
    });

    it('should return true when model is loaded', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      await service.loadModel('/model.gguf');

      expect(service.isModelLoaded()).toBe(true);
    });
  });

  describe('getCurrentModelPath', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should return null when no model loaded', () => {
      expect(service.getCurrentModelPath()).toBeNull();
    });

    it('should return model path when loaded', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      await service.loadModel('/model.gguf');

      expect(service.getCurrentModelPath()).toBe('/model.gguf');
    });
  });

  describe('generateResponse', () => {
    beforeEach(async () => {
      await service.initialize();
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      await service.loadModel('/model.gguf');
      jest.clearAllMocks();
    });

    it('should generate response successfully', async () => {
      mockSession.prompt.mockImplementation(async (_prompt: string, options: any) => {
        options.onToken([1, 2, 3]);
      });
      mockModel.detokenize.mockReturnValue('response');

      const result = await service.generateResponse('test prompt');

      expect(result).toBe('response');
      expect(mockSession.prompt).toHaveBeenCalledWith('test prompt', expect.any(Object));
    });

    it('should call onToken callback if provided', async () => {
      const onTokenCallback = jest.fn();
      mockSession.prompt.mockImplementation(async (_prompt: string, options: any) => {
        options.onToken([1, 2, 3]);
      });
      mockModel.detokenize.mockReturnValue('token');

      await service.generateResponse('test prompt', onTokenCallback);

      expect(onTokenCallback).toHaveBeenCalledWith('token');
    });

    it('should throw error if no model loaded', async () => {
      await service.unloadModel();

      await expect(service.generateResponse('test')).rejects.toThrow('No model loaded');
    });

    it('should throw error if generation fails', async () => {
      mockSession.prompt.mockRejectedValue(new Error('Generation failed'));

      await expect(service.generateResponse('test')).rejects.toThrow('Generation failed');
    });

    it('should use config values for generation', async () => {
      service.updateConfig({ temperature: 0.8, topP: 0.95, topK: 50 });

      await service.generateResponse('test');

      expect(mockSession.prompt).toHaveBeenCalledWith('test', expect.objectContaining({
        temperature: 0.8,
        topP: 0.95,
        topK: 50,
      }));
    });
  });

  describe('updateConfig', () => {
    it('should update config values', () => {
      service.updateConfig({ temperature: 0.8 });

      expect(service.getConfig().temperature).toBe(0.8);
    });

    it('should preserve other config values', () => {
      const originalTopP = service.getConfig().topP;
      service.updateConfig({ temperature: 0.8 });

      expect(service.getConfig().topP).toBe(originalTopP);
    });
  });

  describe('getConfig', () => {
    it('should return config', () => {
      const config = service.getConfig();

      expect(config).toHaveProperty('contextSize');
      expect(config).toHaveProperty('gpuLayers');
      expect(config).toHaveProperty('temperature');
      expect(config).toHaveProperty('topP');
      expect(config).toHaveProperty('topK');
    });

    it('should return a copy of config', () => {
      const config1 = service.getConfig();
      config1.temperature = 999;
      const config2 = service.getConfig();

      expect(config2.temperature).not.toBe(999);
    });
  });

  describe('dispose', () => {
    beforeEach(async () => {
      await service.initialize();
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      await service.loadModel('/model.gguf');
      jest.clearAllMocks();
    });

    it('should dispose service and unload model', async () => {
      await service.dispose();

      expect(mockModel.dispose).toHaveBeenCalled();
      expect(mockContext.dispose).toHaveBeenCalled();
    });

    it('should reset initialization state', async () => {
      await service.dispose();

      expect(service.isModelLoaded()).toBe(false);
    });
  });

  describe('getLLMService', () => {
    it('should return singleton instance', () => {
      const service1 = getLLMService();
      const service2 = getLLMService();

      expect(service1).toBe(service2);
    });
  });
});