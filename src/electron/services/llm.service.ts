import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { getModelPathIfExists, getGpuModeDescription, getErrorMessage } from './llm.service.helpers';

// Dynamic import types
type Llama = any;
type LlamaModel = any;
type LlamaContext = any;
type LlamaChatSession = any;

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
  gpuLayers: number; // -1 for auto, 0 for CPU only, >0 for specific number
  temperature: number;
  topP: number;
  topK: number;
}

export class LLMService {
  private llama: Llama | null = null;
  private model: LlamaModel | null = null;
  private context: LlamaContext | null = null;
  private session: LlamaChatSession | null = null;
  private initialized: boolean = false;
  private currentModelPath: string | null = null;
  private config: LLMConfig = {
    contextSize: 10000,
    gpuLayers: -1, // Auto-detect
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
  };

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Use Function constructor to prevent TypeScript from transforming dynamic import to require()
      const dynamicImport = new Function('specifier', 'return import(specifier)');
      const { getLlama } = await dynamicImport('node-llama-cpp');
      this.llama = await getLlama();
      this.initialized = true;
      console.log('LLM service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize LLM service:', error);
      throw error;
    }
  }

  getModelsDirectory(): string {
    // Check for custom models directory
    const customPath = this.getCustomModelsPath();
    if (customPath) {
      return customPath;
    }

    // Default path
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      return path.join(process.cwd(), 'models');
    } else {
      return path.join(app.getPath('userData'), 'models');
    }
  }

  getCustomModelsPath(): string | null {
    const configPath = this.getConfigPath();
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return config.modelsPath || null;
      } catch (error) {
        console.error('Failed to read models config:', error);
        return null;
      }
    }
    return null;
  }

  setCustomModelsPath(modelsPath: string): void {
    const configPath = this.getConfigPath();
    const configDir = path.dirname(configPath);

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    const config = { modelsPath };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  private getConfigPath(): string {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      return path.join(process.cwd(), 'llm-config.json');
    } else {
      return path.join(app.getPath('userData'), 'llm-config.json');
    }
  }

  scanFolderForModels(folderPath: string): ModelInfo[] {
    if (!fs.existsSync(folderPath)) {
      return [];
    }

    const files = fs.readdirSync(folderPath);
    const ggufFiles = files.filter(file => file.endsWith('.gguf'));

    return ggufFiles.map(filename => {
      const filePath = path.join(folderPath, filename);
      const stats = fs.statSync(filePath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(1);

      return {
        id: `custom-${filename}`,
        name: filename.replace('.gguf', ''),
        license: 'Unknown',
        description: 'Custom model from local folder',
        size: `${sizeInMB}MB`,
        url: '',
        filename,
        recommendedContext: 10000,
        type: 'custom',
        installed: true,
        path: filePath
      };
    });
  }

  async ensureModelsDirectory(): Promise<void> {
    const modelsDir = this.getModelsDirectory();
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }
  }

  async listAvailableModels(): Promise<ModelInfo[]> {
    await this.ensureModelsDirectory();
    const modelsDir = this.getModelsDirectory();

    // Load llms.json from project root
    const isDev = process.env.NODE_ENV === 'development';
    const llmsConfigPath = isDev
      ? path.join(process.cwd(), 'llms.json')
      : path.join(app.getPath('userData'), 'llms.json');

    // In dev mode, use the local llms.json; in production, copy it to userData if missing
    if (!isDev && !fs.existsSync(llmsConfigPath)) {
      const defaultLlmsPath = path.join(process.resourcesPath, 'llms.json');
      if (fs.existsSync(defaultLlmsPath)) {
        fs.copyFileSync(defaultLlmsPath, llmsConfigPath);
      } else {
        throw new Error('llms.json not found');
      }
    }

    const llmsConfig = JSON.parse(fs.readFileSync(llmsConfigPath, 'utf-8'));

    return llmsConfig.models.map((model: any) => {
      const modelPath = path.join(modelsDir, model.filename);
      return {
        ...model,
        installed: fs.existsSync(modelPath),
        path: getModelPathIfExists(modelPath),
      };
    });
  }

  async listInstalledModels(): Promise<ModelInfo[]> {
    const models = await this.listAvailableModels();
    return models.filter(m => m.installed);
  }

  async loadModel(modelPath: string, config?: Partial<LLMConfig>): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Update config if provided
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Unload existing model if any
    if (this.model) {
      await this.unloadModel();
    }

    if (!fs.existsSync(modelPath)) {
      throw new Error(`Model file not found: ${modelPath}`);
    }

    // Try loading with decreasing context sizes and GPU layers if VRAM is insufficient
    const originalContextSize = this.config.contextSize;
    const originalGpuLayers = this.config.gpuLayers;
    const minContextSize = 2000;
    const contextSizeDecrement = 1000;
    let lastError: Error | null = null;

    // Strategy: Try different combinations of context size and GPU layers
    // 1. Original context size with GPU
    // 2. Reduced context sizes with GPU
    // 3. Original context size with CPU only
    // 4. Reduced context sizes with CPU only

    const strategies = [
      { useGpu: true, startContext: originalContextSize },
      { useGpu: false, startContext: originalContextSize },
    ];

    for (const strategy of strategies) {
      let contextSize = strategy.startContext;
      const gpuLayers = strategy.useGpu ? originalGpuLayers : 0;

      while (contextSize >= minContextSize) {
        try {
          console.log(`Attempting to load model with context size: ${contextSize}, GPU layers: ${gpuLayers} (${strategy.useGpu ? 'GPU' : 'CPU-only'})`);

          // Load the model with GPU settings
          this.model = await this.llama!.loadModel({
            modelPath,
            gpuLayers: gpuLayers,
          });

          // Create context with current context size
          this.context = await this.model.createContext({
            contextSize: contextSize,
          });

          // Create chat session
          const dynamicImport = new Function('specifier', 'return import(specifier)');
          const { LlamaChatSession } = await dynamicImport('node-llama-cpp');
          this.session = new LlamaChatSession({
            contextSequence: this.context.getSequence(),
          });

          // Update config with successful settings
          this.config.contextSize = contextSize;
          this.config.gpuLayers = gpuLayers;
          this.currentModelPath = modelPath;

          const adjustments = [];
          if (contextSize < originalContextSize) {
            adjustments.push(`context: ${contextSize} (reduced from ${originalContextSize})`);
          }
          if (gpuLayers !== originalGpuLayers) {
            adjustments.push(`mode: ${getGpuModeDescription(strategy.useGpu)}`);
          }

          if (adjustments.length > 0) {
            console.log(`Model loaded successfully with adjustments: ${adjustments.join(', ')}`);
          } else {
            console.log(`Model loaded successfully with context size: ${contextSize}`);
          }

          return; // Success, exit the function
        } catch (error: any) {
          const errorMessage = getErrorMessage(error);
          console.error(`Failed to load model with context size ${contextSize}, GPU layers ${gpuLayers}:`, errorMessage);
          lastError = error;

          // Clean up any partial loading
          if (this.context) {
            try {
              await this.context.dispose();
            } catch (e) {
              // Ignore cleanup errors
            }
            this.context = null;
          }
          if (this.model) {
            try {
              await this.model.dispose();
            } catch (e) {
              // Ignore cleanup errors
            }
            this.model = null;
          }

          // Check if error is related to VRAM/context size
          const isVramError = errorMessage.includes('VRAM') ||
                             errorMessage.includes('context size') ||
                             errorMessage.includes('too large') ||
                             errorMessage.includes('memory');

          if (!isVramError) {
            // Not a VRAM error, don't retry with smaller context
            // But continue to next strategy if available
            break;
          }

          // Reduce context size and try again
          contextSize -= contextSizeDecrement;

          if (contextSize >= minContextSize) {
            console.log(`Retrying with reduced context size: ${contextSize}`);
          }
        }
      }
    }

    // If we get here, all attempts failed
    this.model = null;
    this.context = null;
    this.session = null;
    this.currentModelPath = null;

    const errorMessage = getErrorMessage(lastError);
    throw new Error(
      `Failed to load model: Unable to load with any combination of settings. ` +
      `Tried context sizes from ${originalContextSize} down to ${minContextSize} with both GPU and CPU. ` +
      `Last error: ${errorMessage}`
    );
  }

  async unloadModel(): Promise<void> {
    if (this.session) {
      this.session = null;
    }
    if (this.context) {
      await this.context.dispose();
      this.context = null;
    }
    if (this.model) {
      await this.model.dispose();
      this.model = null;
    }
    this.currentModelPath = null;
    console.log('Model unloaded successfully');
  }

  isModelLoaded(): boolean {
    return this.model !== null && this.session !== null;
  }

  getCurrentModelPath(): string | null {
    return this.currentModelPath;
  }

  async generateResponse(prompt: string, onToken?: (token: string) => void): Promise<string> {
    if (!this.isModelLoaded()) {
      throw new Error('No model loaded. Please load a model first.');
    }

    try {
      let fullResponse = '';

      await this.session!.prompt(prompt, {
        temperature: this.config.temperature,
        topP: this.config.topP,
        topK: this.config.topK,
        onToken: (tokens: number[]) => {
          const tokenText = this.model!.detokenize(tokens);
          fullResponse += tokenText;
          if (onToken) {
            onToken(tokenText);
          }
        },
      });

      return fullResponse;
    } catch (error) {
      console.error('Failed to generate response:', error);
      throw error;
    }
  }

  updateConfig(config: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): LLMConfig {
    return { ...this.config };
  }

  async dispose(): Promise<void> {
    await this.unloadModel();
    this.llama = null;
    this.initialized = false;
  }
}

// Singleton instance
let llmService: LLMService | null = null;

export function getLLMService(): LLMService {
  if (!llmService) {
    llmService = new LLMService();
  }
  return llmService;
}