import { ipcMain, dialog, BrowserWindow } from 'electron';
import type { ModelInfo, LLMConfig } from '../services/llm.service';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { initializeLLMService, logScanFolderError, cleanupPartialDownload } from './llm.controller.helpers';

let llmServicePromise: Promise<any> | null = null;

async function getLLMService() {
  if (!llmServicePromise) {
    llmServicePromise = (async () => {
      const { getLLMService: getService } = await import('../services/llm.service');
      const service = getService();
      await initializeLLMService(service);
      return service;
    })();
  }
  return llmServicePromise;
}

export class LLMController {
  static async registerHandlers(): Promise<void> {

    // List available models from llms.json
    ipcMain.handle('llm-list-available', async (): Promise<ModelInfo[]> => {
      try {
        const llmService = await getLLMService();
        return await llmService.listAvailableModels();
      } catch (error) {
        console.error('Failed to list available models:', error);
        throw error;
      }
    });

    // List installed models
    ipcMain.handle('llm-list-installed', async (): Promise<ModelInfo[]> => {
      try {
        const llmService = await getLLMService();
        return await llmService.listInstalledModels();
      } catch (error) {
        console.error('Failed to list installed models:', error);
        throw error;
      }
    });

    // Select model from disk
    ipcMain.handle('llm-select-from-disk', async (): Promise<string | null> => {
      try {
        const mainWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
        if (!mainWindow) {
          throw new Error('No window available for dialog');
        }

        const result = await dialog.showOpenDialog(mainWindow, {
          properties: ['openFile'],
          filters: [
            { name: 'GGUF Models', extensions: ['gguf'] },
            { name: 'All Files', extensions: ['*'] },
          ],
        }) as unknown as { canceled: boolean; filePaths: string[] };

        if (result.canceled || result.filePaths.length === 0) {
          return null;
        }

        return result.filePaths[0];
      } catch (error) {
        console.error('Failed to select model from disk:', error);
        throw error;
      }
    });

    // Load model
    ipcMain.handle('llm-load-model', async (_event, modelPath: string, config?: Partial<LLMConfig>): Promise<void> => {
      try {
        const llmService = await getLLMService();
        await llmService.loadModel(modelPath, config);
      } catch (error) {
        console.error('Failed to load model:', error);
        throw error;
      }
    });

    // Unload model
    ipcMain.handle('llm-unload-model', async (): Promise<void> => {
      try {
        const llmService = await getLLMService();
        await llmService.unloadModel();
      } catch (error) {
        console.error('Failed to unload model:', error);
        throw error;
      }
    });

    // Check if model is loaded
    ipcMain.handle('llm-is-loaded', async (): Promise<boolean> => {
      try {
        const llmService = await getLLMService();
        return llmService.isModelLoaded();
      } catch (error) {
        console.error('Failed to check model status:', error);
        return false;
      }
    });

    // Get current model path
    ipcMain.handle('llm-get-current-model', async (): Promise<string | null> => {
      try {
        const llmService = await getLLMService();
        return llmService.getCurrentModelPath();
      } catch (error) {
        console.error('Failed to get current model:', error);
        return null;
      }
    });

    // Download model
    ipcMain.handle('llm-download-model', async (_event, modelInfo: ModelInfo): Promise<void> => {
      try {
        const llmService = await getLLMService();
        await llmService.ensureModelsDirectory();
        const modelsDir = llmService.getModelsDirectory();
        const filePath = path.join(modelsDir, modelInfo.filename);

        // Check if already downloaded
        if (fs.existsSync(filePath)) {
          throw new Error('Model already downloaded');
        }

        // Download the file
        await downloadFile(modelInfo.url, filePath, (progress) => {
          // Send progress updates to renderer
          const windows = BrowserWindow.getAllWindows();
          windows.forEach(win => {
            win.webContents.send('llm-download-progress', {
              modelId: modelInfo.id,
              progress,
            });
          });
        });

        // If this is a Llama model, create/update NOTICE file
        if (modelInfo.requiresAttribution) {
          createOrUpdateNoticeFile(modelsDir, modelInfo);
        }

        console.log('Model downloaded successfully:', filePath);
      } catch (error) {
        console.error('Failed to download model:', error);
        // Clean up partial download
        await cleanupPartialDownload(getLLMService, modelInfo.filename);
        throw error;
      }
    });

    // Delete model
    ipcMain.handle('llm-delete-model', async (_event, modelInfo: ModelInfo): Promise<void> => {
      try {
        const llmService = await getLLMService();
        const modelsDir = llmService.getModelsDirectory();
        const filePath = path.join(modelsDir, modelInfo.filename);

        // Unload if currently loaded
        if (llmService.getCurrentModelPath() === filePath) {
          await llmService.unloadModel();
        }

        // Delete file
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Model deleted successfully:', filePath);
        }
      } catch (error) {
        console.error('Failed to delete model:', error);
        throw error;
      }
    });

    // Update configuration
    ipcMain.handle('llm-update-config', async (_event, config: Partial<LLMConfig>): Promise<void> => {
      try {
        const llmService = await getLLMService();
        llmService.updateConfig(config);
      } catch (error) {
        console.error('Failed to update config:', error);
        throw error;
      }
    });

    // Get configuration
    ipcMain.handle('llm-get-config', async (): Promise<LLMConfig> => {
      try {
        const llmService = await getLLMService();
        return llmService.getConfig();
      } catch (error) {
        console.error('Failed to get config:', error);
        throw error;
      }
    });

    // Generate response with streaming support
    ipcMain.handle('llm-generate-response', async (event, prompt: string): Promise<string> => {
      try {
        const llmService = await getLLMService();
        const sender = event.sender;
        const response = await llmService.generateResponse(prompt, (token: string) => {
          // Send token to renderer process for streaming
          sender.send('llm-token', token);
        });
        return response;
      } catch (error) {
        console.error('Failed to generate response:', error);
        throw error;
      }
    });

    // Get models directory
    ipcMain.handle('llm-get-models-directory', async (): Promise<string> => {
      try {
        const llmService = await getLLMService();
        return llmService.getModelsDirectory();
      } catch (error) {
        console.error('Failed to get models directory:', error);
        throw error;
      }
    });

    // Set models directory
    ipcMain.handle('llm-set-models-directory', async (_event): Promise<string | null> => {
      try {
        const mainWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
        if (!mainWindow) {
          throw new Error('No window available for dialog');
        }

        const result = await dialog.showOpenDialog(mainWindow, {
          properties: ['openDirectory', 'createDirectory'],
          title: 'Select Models Folder',
        }) as unknown as { canceled: boolean; filePaths: string[] };

        if (result.canceled || result.filePaths.length === 0) {
          return null;
        }

        const llmService = await getLLMService();
        llmService.setCustomModelsPath(result.filePaths[0]);
        return result.filePaths[0];
      } catch (error) {
        console.error('Failed to set models directory:', error);
        throw error;
      }
    });

    // Scan folder for models
    ipcMain.handle('llm-scan-folder', async (_event, folderPath?: string): Promise<ModelInfo[]> => {
      try {
        const llmService = await getLLMService();
        const scanPath = folderPath || llmService.getModelsDirectory();
        return llmService.scanFolderForModels(scanPath);
      } catch (error) {
        logScanFolderError(error as Error);
        throw error;
      }
    });

    console.log('LLM service and handlers initialized');
  }
}

// Helper function to download files with progress tracking
function downloadFile(url: string, destPath: string, onProgress?: (progress: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    let downloadedBytes = 0;
    let totalBytes = 0;

    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(destPath);
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          return downloadFile(redirectUrl, destPath, onProgress).then(resolve).catch(reject);
        } else {
          return reject(new Error('Redirect without location header'));
        }
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        return reject(new Error(`Failed to download: ${response.statusCode}`));
      }

      totalBytes = parseInt(response.headers['content-length'] || '0', 10);

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (onProgress && totalBytes > 0) {
          const progress = (downloadedBytes / totalBytes) * 100;
          onProgress(progress);
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      fs.unlinkSync(destPath);
      reject(err);
    });

    file.on('error', (err) => {
      file.close();
      fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

// Helper function to create or update NOTICE file for Llama models
function createOrUpdateNoticeFile(modelsDir: string, modelInfo: ModelInfo): void {
  try {
    const noticePath = path.join(modelsDir, 'NOTICE');
    const noticeContent = `Llama 3.2 is licensed under the Llama 3.2 Community License, Copyright © Meta Platforms, Inc. All Rights Reserved.

This directory contains models distributed under the Llama 3.2 Community License Agreement.
For full license terms, visit: https://www.llama.com/llama3_2/license

Downloaded Models:
- ${modelInfo.name} (${modelInfo.filename})
  License: ${modelInfo.license}
  Downloaded: ${new Date().toISOString()}
`;

    // If NOTICE file exists, append to it; otherwise create it
    if (fs.existsSync(noticePath)) {
      const existingContent = fs.readFileSync(noticePath, 'utf-8');
      // Check if this model is already listed
      if (!existingContent.includes(modelInfo.filename)) {
        const modelEntry = `- ${modelInfo.name} (${modelInfo.filename})
  License: ${modelInfo.license}
  Downloaded: ${new Date().toISOString()}
`;
        fs.appendFileSync(noticePath, modelEntry);
      }
    } else {
      fs.writeFileSync(noticePath, noticeContent, 'utf-8');
    }

    console.log('NOTICE file created/updated:', noticePath);
  } catch (error) {
    console.error('Failed to create NOTICE file:', error);
    // Don't throw - this shouldn't fail the download
  }
}