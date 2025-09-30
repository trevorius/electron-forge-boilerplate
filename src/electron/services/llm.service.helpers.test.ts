import { getModelPathIfExists, getGpuModeDescription, getErrorMessage } from './llm.service.helpers';
import * as fs from 'fs';

jest.mock('fs');

describe('LLM Service Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getModelPathIfExists', () => {
    it('should return model path when file exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = getModelPathIfExists('/path/to/model.gguf');

      expect(result).toBe('/path/to/model.gguf');
      expect(fs.existsSync).toHaveBeenCalledWith('/path/to/model.gguf');
    });

    it('should return undefined when file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = getModelPathIfExists('/path/to/model.gguf');

      expect(result).toBeUndefined();
      expect(fs.existsSync).toHaveBeenCalledWith('/path/to/model.gguf');
    });
  });

  describe('getGpuModeDescription', () => {
    it('should return GPU when useGpu is true', () => {
      const result = getGpuModeDescription(true);
      expect(result).toBe('GPU');
    });

    it('should return CPU-only when useGpu is false', () => {
      const result = getGpuModeDescription(false);
      expect(result).toBe('CPU-only');
    });
  });

  describe('getErrorMessage', () => {
    it('should return error message when error has message property', () => {
      const error = new Error('Test error');
      const result = getErrorMessage(error);
      expect(result).toBe('Test error');
    });

    it('should convert error to string when error has no message property', () => {
      const error = { code: 'ERR_TEST' };
      const result = getErrorMessage(error);
      expect(result).toBe('[object Object]');
    });

    it('should handle string errors', () => {
      const error = 'String error';
      const result = getErrorMessage(error);
      expect(result).toBe('String error');
    });

    it('should handle null error', () => {
      const result = getErrorMessage(null);
      expect(result).toBe('null');
    });

    it('should handle undefined error', () => {
      const result = getErrorMessage(undefined);
      expect(result).toBe('undefined');
    });
  });
});