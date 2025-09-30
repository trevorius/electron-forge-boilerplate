import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Loader2, CheckCircle, Trash2, Upload } from 'lucide-react';

interface ModelInfo {
  id: string;
  name: string;
  license: string;
  licenseId?: string;
  requiresAttribution?: boolean;
  attributionText?: string;
  description: string;
  size: string;
  url: string;
  filename: string;
  recommendedContext: number;
  type: string;
  installed?: boolean;
  path?: string;
}

interface LLMConfig {
  contextSize: number;
  gpuLayers: number;
  temperature: number;
  topP: number;
  topK: number;
}

const LLMSettings: React.FC = () => {
  const { t } = useTranslation();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [scannedModels, setScannedModels] = useState<ModelInfo[]>([]);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<{ [key: string]: number }>({});
  const [modelsFolder, setModelsFolder] = useState<string>('');

  useEffect(() => {
    loadModels();
    checkModelStatus();
    loadModelsFolder();

    // Listen for download progress
    const unsubscribe = window.electronAPI.llmOnDownloadProgress((progress) => {
      setDownloading(prev => ({
        ...prev,
        [progress.modelId]: progress.progress
      }));
    });

    return unsubscribe;
  }, []);

  const loadModels = async () => {
    try {
      const availableModels = await window.electronAPI.llmListAvailable();
      setModels(availableModels);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const loadModelsFolder = async () => {
    try {
      const folder = await window.electronAPI.llmGetModelsDirectory();
      setModelsFolder(folder);
      await scanModelsFolder(folder);
    } catch (error) {
      console.error('Failed to load models folder:', error);
    }
  };

  const scanModelsFolder = async (folder?: string) => {
    try {
      const scanned = await window.electronAPI.llmScanFolder(folder);
      setScannedModels(scanned);
    } catch (error) {
      console.error('Failed to scan models folder:', error);
    }
  };

  const handleChangeFolder = async () => {
    try {
      const newFolder = await window.electronAPI.llmSetModelsDirectory();
      if (newFolder) {
        setModelsFolder(newFolder);
        await scanModelsFolder(newFolder);
      }
    } catch (error) {
      console.error('Failed to change models folder:', error);
    }
  };

  const checkModelStatus = async () => {
    try {
      const loaded = await window.electronAPI.llmIsLoaded();
      const current = await window.electronAPI.llmGetCurrentModel();
      setIsLoaded(loaded);
      setCurrentModel(current);
    } catch (error) {
      console.error('Failed to check model status:', error);
    }
  };

  const handleDownload = async (model: ModelInfo) => {
    setLoading(model.id);
    try {
      await window.electronAPI.llmDownloadModel(model);
      await loadModels();
    } catch (error) {
      console.error('Failed to download model:', error);
    } finally {
      setLoading(null);
      setDownloading(prev => {
        const newState = { ...prev };
        delete newState[model.id];
        return newState;
      });
    }
  };

  const handleLoad = async (model: ModelInfo) => {
    if (!model.path) return;
    setLoading(model.id);
    try {
      await window.electronAPI.llmLoadModel(model.path, {
        contextSize: 10000,
        gpuLayers: -1, // Auto GPU offloading
        temperature: 0.7,
        topP: 0.9,
        topK: 40
      });
      await checkModelStatus();
    } catch (error) {
      console.error('Failed to load model:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleUnload = async () => {
    setLoading('unload');
    try {
      await window.electronAPI.llmUnloadModel();
      await checkModelStatus();
    } catch (error) {
      console.error('Failed to unload model:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (model: ModelInfo) => {
    if (!confirm(`Delete ${model.name}?`)) return;
    setLoading(model.id);
    try {
      await window.electronAPI.llmDeleteModel(model);
      await loadModels();
      await checkModelStatus();
    } catch (error) {
      console.error('Failed to delete model:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleSelectFromDisk = async () => {
    try {
      const modelPath = await window.electronAPI.llmSelectFromDisk();
      if (modelPath) {
        setLoading('custom');
        await window.electronAPI.llmLoadModel(modelPath);
        await checkModelStatus();
        setLoading(null);
      }
    } catch (error) {
      console.error('Failed to load custom model:', error);
      setLoading(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('settings.llm.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('settings.llm.description')}</p>
        </div>
        {isLoaded && (
          <Button
            variant="outline"
            onClick={handleUnload}
            disabled={loading === 'unload'}
          >
            {loading === 'unload' ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {t('settings.llm.unload')}
          </Button>
        )}
      </div>

      {/* Current Model Status */}
      {isLoaded && currentModel && (
        <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <p className="font-medium">{t('settings.llm.current_model')}</p>
              <p className="text-sm text-muted-foreground">{currentModel}</p>
            </div>
            {(() => {
              const loadedModel = [...models, ...scannedModels].find(m => m.path === currentModel);
              return loadedModel?.requiresAttribution && (
                <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-md">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    {loadedModel.attributionText}
                  </span>
                </div>
              );
            })()}
          </div>
        </Card>
      )}

      {/* Models Folder Configuration */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{t('settings.llm.models_folder')}</h3>
              <p className="text-sm text-muted-foreground">{t('settings.llm.models_folder_description')}</p>
            </div>
            <Button
              variant="outline"
              onClick={handleChangeFolder}
            >
              {t('settings.llm.change_folder')}
            </Button>
          </div>
          {modelsFolder && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
              <code className="flex-1">{modelsFolder}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scanModelsFolder(modelsFolder)}
              >
                {t('settings.llm.scan_folder')}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Scanned Models from Folder */}
      {scannedModels.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Models in Folder</h2>
          <div className="grid gap-4">
            {scannedModels.map(model => (
              <Card key={model.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{model.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{model.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Size: {model.size}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleLoad(model)}
                    disabled={loading === model.id || (isLoaded && currentModel === model.path)}
                    size="sm"
                    variant={isLoaded && currentModel === model.path ? "default" : "outline"}
                  >
                    {loading === model.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {isLoaded && currentModel === model.path
                      ? t('settings.llm.loaded')
                      : t('settings.llm.load')
                    }
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Load Custom Model */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{t('settings.llm.custom_model')}</h3>
            <p className="text-sm text-muted-foreground">{t('settings.llm.custom_model_description')}</p>
          </div>
          <Button
            variant="outline"
            onClick={handleSelectFromDisk}
            disabled={loading === 'custom'}
          >
            <Upload className="h-4 w-4 mr-2" />
            {loading === 'custom' ? t('settings.llm.loading') : t('settings.llm.select_file')}
          </Button>
        </div>
      </Card>

      {/* Available Models */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t('settings.llm.available_models')}</h2>
        <div className="grid gap-4">
          {models.map(model => (
            <Card key={model.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{model.name}</h3>
                    <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                      {model.license}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{model.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Size: {model.size} • Context: {model.recommendedContext.toLocaleString()} tokens
                  </p>

                  {/* Download Progress */}
                  {downloading[model.id] !== undefined && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>{t('settings.llm.downloading')}</span>
                        <span>{Math.round(downloading[model.id])}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${downloading[model.id]}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {!model.installed ? (
                    <Button
                      onClick={() => handleDownload(model)}
                      disabled={loading === model.id || downloading[model.id] !== undefined}
                      size="sm"
                    >
                      {loading === model.id || downloading[model.id] !== undefined ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {t('settings.llm.download')}
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleLoad(model)}
                        disabled={loading === model.id || (isLoaded && currentModel === model.path)}
                        size="sm"
                        variant={isLoaded && currentModel === model.path ? "default" : "outline"}
                      >
                        {loading === model.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {isLoaded && currentModel === model.path
                          ? t('settings.llm.loaded')
                          : t('settings.llm.load')
                        }
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(model)}
                        disabled={loading === model.id || (isLoaded && currentModel === model.path)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LLMSettings;