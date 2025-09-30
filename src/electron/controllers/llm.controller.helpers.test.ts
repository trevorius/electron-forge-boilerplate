import { initializeLLMService, logScanFolderError, logCleanupError, cleanupPartialDownload } from './llm.controller.helpers';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs and path
jest.mock('fs');
jest.mock('path');

describe('LLM Controller Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('initializeLLMService', () => {
    it('should return success when initialization succeeds', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockService = {
        initialize: jest.fn().mockResolvedValue(undefined),
      };

      const result = await initializeLLMService(mockService);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockService.initialize).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('LLM service initialized successfully');

      consoleSpy.mockRestore();
    });

    it('should return failure when initialization fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Init failed');
      const mockService = {
        initialize: jest.fn().mockRejectedValue(testError),
      };

      const result = await initializeLLMService(mockService);

      expect(result.success).toBe(false);
      expect(result.error).toBe(testError);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to initialize LLM service:', testError);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('logScanFolderError', () => {
    it('should log scan folder error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Scan failed');

      logScanFolderError(testError);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to scan folder:', testError);

      consoleSpy.mockRestore();
    });
  });

  describe('logCleanupError', () => {
    it('should log cleanup error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Cleanup failed');

      logCleanupError(testError);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to clean up partial download:', testError);

      consoleSpy.mockRestore();
    });
  });

  describe('cleanupPartialDownload', () => {
    it('should clean up file when it exists', async () => {
      const mockService = {
        getModelsDirectory: jest.fn().mockReturnValue('/models'),
      };
      const getLLMServiceFn = jest.fn().mockResolvedValue(mockService);
      (path.join as jest.Mock).mockReturnValue('/models/model.gguf');
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);

      await cleanupPartialDownload(getLLMServiceFn, 'model.gguf');

      expect(getLLMServiceFn).toHaveBeenCalled();
      expect(mockService.getModelsDirectory).toHaveBeenCalled();
      expect(path.join).toHaveBeenCalledWith('/models', 'model.gguf');
      expect(fs.existsSync).toHaveBeenCalledWith('/models/model.gguf');
      expect(fs.unlinkSync).toHaveBeenCalledWith('/models/model.gguf');
    });

    it('should not delete file when it does not exist', async () => {
      const mockService = {
        getModelsDirectory: jest.fn().mockReturnValue('/models'),
      };
      const getLLMServiceFn = jest.fn().mockResolvedValue(mockService);
      (path.join as jest.Mock).mockReturnValue('/models/model.gguf');
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await cleanupPartialDownload(getLLMServiceFn, 'model.gguf');

      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('should handle error when getting LLM service fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Service unavailable');
      const getLLMServiceFn = jest.fn().mockRejectedValue(testError);

      await cleanupPartialDownload(getLLMServiceFn, 'model.gguf');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to clean up partial download:', testError);
      consoleSpy.mockRestore();
    });

    it('should handle error when getModelsDirectory fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Failed to get models directory');
      const mockService = {
        getModelsDirectory: jest.fn().mockImplementation(() => {
          throw testError;
        }),
      };
      const getLLMServiceFn = jest.fn().mockResolvedValue(mockService);

      await cleanupPartialDownload(getLLMServiceFn, 'model.gguf');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to clean up partial download:', testError);
      consoleSpy.mockRestore();
    });

    it('should handle error when unlinkSync fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Permission denied');
      const mockService = {
        getModelsDirectory: jest.fn().mockReturnValue('/models'),
      };
      const getLLMServiceFn = jest.fn().mockResolvedValue(mockService);
      (path.join as jest.Mock).mockReturnValue('/models/model.gguf');
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {
        throw testError;
      });

      await cleanupPartialDownload(getLLMServiceFn, 'model.gguf');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to clean up partial download:', testError);
      consoleSpy.mockRestore();
    });
  });
});