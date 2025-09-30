import { initializeLLMService, logScanFolderError, logCleanupError } from './llm.controller.helpers';

describe('LLM Controller Helpers', () => {
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
});