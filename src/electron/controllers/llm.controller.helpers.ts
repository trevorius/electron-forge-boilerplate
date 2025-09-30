/**
 * Helper functions for LLM Controller
 * These are extracted for testability
 */

/**
 * Initialize an LLM service instance
 * Returns the service whether initialization succeeds or fails
 */
export async function initializeLLMService(service: any): Promise<{ success: boolean; error?: Error }> {
  try {
    await service.initialize();
    console.log('LLM service initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Failed to initialize LLM service:', error);
    // Continue anyway - the service will try to initialize on first use
    return { success: false, error: error as Error };
  }
}

/**
 * Log an error for scan folder operation
 */
export function logScanFolderError(error: Error): void {
  console.error('Failed to scan folder:', error);
}

/**
 * Log an error for cleanup operation
 */
export function logCleanupError(error: Error): void {
  console.error('Failed to clean up partial download:', error);
}