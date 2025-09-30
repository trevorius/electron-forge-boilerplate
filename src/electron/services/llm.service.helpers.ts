import * as fs from 'fs';

/**
 * Helper functions for LLM Service
 * These are extracted for testability
 */

/**
 * Get model path if file exists, otherwise return undefined
 */
export function getModelPathIfExists(modelPath: string): string | undefined {
  return fs.existsSync(modelPath) ? modelPath : undefined;
}

/**
 * Get GPU mode description from strategy
 */
export function getGpuModeDescription(useGpu: boolean): string {
  return useGpu ? 'GPU' : 'CPU-only';
}

/**
 * Extract error message from error object or convert to string
 */
export function getErrorMessage(error: any): string {
  return error?.message || String(error);
}