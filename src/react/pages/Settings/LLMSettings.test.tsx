import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import LLMSettings from './LLMSettings';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Download: () => <span>Download Icon</span>,
  Loader2: () => <span>Loader Icon</span>,
  CheckCircle: () => <span>CheckCircle Icon</span>,
  Trash2: () => <span>Trash Icon</span>,
  Upload: () => <span>Upload Icon</span>,
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
}));

describe('LLMSettings', () => {
  const mockModels = [
    {
      id: 'model1',
      name: 'Test Model 1',
      license: 'MIT',
      description: 'Test model description',
      size: '1GB',
      url: 'https://example.com/model1',
      filename: 'model1.gguf',
      recommendedContext: 4096,
      type: 'llama',
      installed: false,
    },
    {
      id: 'model2',
      name: 'Test Model 2',
      license: 'Apache-2.0',
      description: 'Another test model',
      size: '2GB',
      url: 'https://example.com/model2',
      filename: 'model2.gguf',
      recommendedContext: 8192,
      type: 'llama',
      installed: true,
      path: '/path/to/model2.gguf',
    },
  ];

  const mockScannedModels = [
    {
      id: 'scanned1',
      name: 'Scanned Model',
      license: 'MIT',
      description: 'Scanned from folder',
      size: '500MB',
      url: '',
      filename: 'scanned.gguf',
      recommendedContext: 2048,
      type: 'llama',
      path: '/models/scanned.gguf',
    },
  ];

  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    mockUnsubscribe = jest.fn();

    // Mock window.electronAPI
    global.window.electronAPI = {
      llmListAvailable: jest.fn().mockResolvedValue(mockModels),
      llmGetModelsDirectory: jest.fn().mockResolvedValue('/mock/models/dir'),
      llmScanFolder: jest.fn().mockResolvedValue(mockScannedModels),
      llmSetModelsDirectory: jest.fn().mockResolvedValue('/new/models/dir'),
      llmIsLoaded: jest.fn().mockResolvedValue(false),
      llmGetCurrentModel: jest.fn().mockResolvedValue(null),
      llmDownloadModel: jest.fn().mockResolvedValue(undefined),
      llmLoadModel: jest.fn().mockResolvedValue(undefined),
      llmUnloadModel: jest.fn().mockResolvedValue(undefined),
      llmDeleteModel: jest.fn().mockResolvedValue(undefined),
      llmSelectFromDisk: jest.fn().mockResolvedValue(null),
      llmOnDownloadProgress: jest.fn().mockReturnValue(mockUnsubscribe),
    } as any;

    jest.clearAllMocks();
  });

  afterEach(() => {
    delete (global.window as any).electronAPI;
  });

  it('should render component and load initial data', async () => {
    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('settings.llm.title')).toBeInTheDocument();
      expect(screen.getByText('settings.llm.description')).toBeInTheDocument();
    });

    expect(window.electronAPI.llmListAvailable).toHaveBeenCalled();
    expect(window.electronAPI.llmIsLoaded).toHaveBeenCalled();
    expect(window.electronAPI.llmGetCurrentModel).toHaveBeenCalled();
    expect(window.electronAPI.llmGetModelsDirectory).toHaveBeenCalled();
  });

  it('should display available models', async () => {
    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Model 1')).toBeInTheDocument();
      expect(screen.getByText('Test Model 2')).toBeInTheDocument();
    });
  });

  it('should display scanned models from folder', async () => {
    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('Scanned Model')).toBeInTheDocument();
    });
  });

  it('should show current model status when loaded', async () => {
    (window.electronAPI.llmIsLoaded as jest.Mock).mockResolvedValue(true);
    (window.electronAPI.llmGetCurrentModel as jest.Mock).mockResolvedValue('/path/to/model.gguf');

    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('settings.llm.current_model')).toBeInTheDocument();
      expect(screen.getByText('/path/to/model.gguf')).toBeInTheDocument();
      expect(screen.getByText('settings.llm.unload')).toBeInTheDocument();
    });
  });

  it('should handle model download', async () => {
    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Model 1')).toBeInTheDocument();
    });

    const downloadButtons = screen.getAllByText('settings.llm.download');
    await act(async () => {
      fireEvent.click(downloadButtons[0]);
    });

    expect(window.electronAPI.llmDownloadModel).toHaveBeenCalledWith(mockModels[0]);
  });

  it('should handle download progress updates', async () => {
    let progressCallback: (progress: any) => void = () => {};
    (window.electronAPI.llmOnDownloadProgress as jest.Mock).mockImplementation((cb) => {
      progressCallback = cb;
      return mockUnsubscribe;
    });

    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Model 1')).toBeInTheDocument();
    });

    // Simulate download progress
    act(() => {
      progressCallback({ modelId: 'model1', progress: 50 });
    });

    await waitFor(() => {
      expect(screen.getByText('settings.llm.downloading')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  it('should handle model load', async () => {
    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Model 2')).toBeInTheDocument();
    });

    const loadButtons = screen.getAllByText('settings.llm.load');
    // Click the last load button which should be for model2 in the available models section
    await act(async () => {
      fireEvent.click(loadButtons[loadButtons.length - 1]);
    });

    await waitFor(() => {
      expect(window.electronAPI.llmLoadModel).toHaveBeenCalledWith(
        '/path/to/model2.gguf',
        expect.objectContaining({
          contextSize: 10000,
          gpuLayers: -1,
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
        })
      );
    });
  });

  it('should not load model without path', async () => {
    const modelWithoutPath = { ...mockScannedModels[0] };
    delete modelWithoutPath.path;
    (window.electronAPI.llmScanFolder as jest.Mock).mockResolvedValue([modelWithoutPath]);

    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('Scanned Model')).toBeInTheDocument();
    });

    const loadButtons = screen.getAllByText('settings.llm.load');
    await act(async () => {
      fireEvent.click(loadButtons[0]);
    });

    expect(window.electronAPI.llmLoadModel).not.toHaveBeenCalled();
  });

  it('should handle model unload', async () => {
    (window.electronAPI.llmIsLoaded as jest.Mock).mockResolvedValue(true);
    (window.electronAPI.llmGetCurrentModel as jest.Mock).mockResolvedValue('/path/to/model.gguf');

    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('settings.llm.unload')).toBeInTheDocument();
    });

    const unloadButton = screen.getByText('settings.llm.unload');
    await act(async () => {
      fireEvent.click(unloadButton);
    });

    expect(window.electronAPI.llmUnloadModel).toHaveBeenCalled();
  });

  it('should handle model deletion with confirmation', async () => {
    global.confirm = jest.fn().mockReturnValue(true);

    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Model 2')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Trash Icon');
    await act(async () => {
      fireEvent.click(deleteButtons[0].parentElement!);
    });

    expect(global.confirm).toHaveBeenCalledWith('Delete Test Model 2?');
    expect(window.electronAPI.llmDeleteModel).toHaveBeenCalledWith(mockModels[1]);
  });

  it('should cancel model deletion when not confirmed', async () => {
    global.confirm = jest.fn().mockReturnValue(false);

    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Model 2')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Trash Icon');
    await act(async () => {
      fireEvent.click(deleteButtons[0].parentElement!);
    });

    expect(global.confirm).toHaveBeenCalled();
    expect(window.electronAPI.llmDeleteModel).not.toHaveBeenCalled();
  });

  it('should handle folder change', async () => {
    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('settings.llm.change_folder')).toBeInTheDocument();
    });

    const changeFolderButton = screen.getByText('settings.llm.change_folder');
    await act(async () => {
      fireEvent.click(changeFolderButton);
    });

    expect(window.electronAPI.llmSetModelsDirectory).toHaveBeenCalled();
  });

  it('should not change folder when dialog is cancelled', async () => {
    (window.electronAPI.llmSetModelsDirectory as jest.Mock).mockResolvedValue(null);

    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('settings.llm.change_folder')).toBeInTheDocument();
    });

    const changeFolderButton = screen.getByText('settings.llm.change_folder');
    await act(async () => {
      fireEvent.click(changeFolderButton);
    });

    expect(window.electronAPI.llmSetModelsDirectory).toHaveBeenCalled();
    expect(window.electronAPI.llmScanFolder).toHaveBeenCalledTimes(1); // Only initial call
  });

  it('should handle folder scan', async () => {
    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('settings.llm.scan_folder')).toBeInTheDocument();
    });

    const scanButton = screen.getByText('settings.llm.scan_folder');
    await act(async () => {
      fireEvent.click(scanButton);
    });

    expect(window.electronAPI.llmScanFolder).toHaveBeenCalledWith('/mock/models/dir');
  });

  it('should handle custom model selection from disk', async () => {
    (window.electronAPI.llmSelectFromDisk as jest.Mock).mockResolvedValue('/custom/model.gguf');

    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('settings.llm.select_file')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('settings.llm.select_file');
    await act(async () => {
      fireEvent.click(selectButton);
    });

    await waitFor(() => {
      expect(window.electronAPI.llmSelectFromDisk).toHaveBeenCalled();
      expect(window.electronAPI.llmLoadModel).toHaveBeenCalledWith('/custom/model.gguf');
    });
  });

  it('should not load custom model when selection is cancelled', async () => {
    (window.electronAPI.llmSelectFromDisk as jest.Mock).mockResolvedValue(null);

    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('settings.llm.select_file')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('settings.llm.select_file');
    await act(async () => {
      fireEvent.click(selectButton);
    });

    await waitFor(() => {
      expect(window.electronAPI.llmSelectFromDisk).toHaveBeenCalled();
    });

    expect(window.electronAPI.llmLoadModel).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (window.electronAPI.llmListAvailable as jest.Mock).mockRejectedValue(new Error('Load failed'));

    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load models:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle download errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (window.electronAPI.llmDownloadModel as jest.Mock).mockRejectedValue(new Error('Download failed'));

    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Model 1')).toBeInTheDocument();
    });

    const downloadButtons = screen.getAllByText('settings.llm.download');
    await act(async () => {
      fireEvent.click(downloadButtons[0]);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to download model:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle load errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (window.electronAPI.llmLoadModel as jest.Mock).mockRejectedValue(new Error('Load failed'));

    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Model 2')).toBeInTheDocument();
    });

    const loadButtons = screen.getAllByText('settings.llm.load');
    await act(async () => {
      fireEvent.click(loadButtons[0]);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load model:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle unload errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (window.electronAPI.llmIsLoaded as jest.Mock).mockResolvedValue(true);
    (window.electronAPI.llmGetCurrentModel as jest.Mock).mockResolvedValue('/path/to/model.gguf');
    (window.electronAPI.llmUnloadModel as jest.Mock).mockRejectedValue(new Error('Unload failed'));

    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('settings.llm.unload')).toBeInTheDocument();
    });

    const unloadButton = screen.getByText('settings.llm.unload');
    await act(async () => {
      fireEvent.click(unloadButton);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to unload model:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle delete errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    global.confirm = jest.fn().mockReturnValue(true);
    (window.electronAPI.llmDeleteModel as jest.Mock).mockRejectedValue(new Error('Delete failed'));

    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Model 2')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Trash Icon');
    await act(async () => {
      fireEvent.click(deleteButtons[0].parentElement!);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to delete model:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle custom model load errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (window.electronAPI.llmSelectFromDisk as jest.Mock).mockResolvedValue('/custom/model.gguf');
    (window.electronAPI.llmLoadModel as jest.Mock).mockRejectedValue(new Error('Load failed'));

    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('settings.llm.select_file')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('settings.llm.select_file');
    await act(async () => {
      fireEvent.click(selectButton);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load custom model:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle folder change errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (window.electronAPI.llmSetModelsDirectory as jest.Mock).mockRejectedValue(new Error('Change failed'));

    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('settings.llm.change_folder')).toBeInTheDocument();
    });

    const changeFolderButton = screen.getByText('settings.llm.change_folder');
    await act(async () => {
      fireEvent.click(changeFolderButton);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to change models folder:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle scan folder errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (window.electronAPI.llmScanFolder as jest.Mock).mockRejectedValueOnce([]).mockRejectedValue(new Error('Scan failed'));

    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('settings.llm.scan_folder')).toBeInTheDocument();
    });

    const scanButton = screen.getByText('settings.llm.scan_folder');
    await act(async () => {
      fireEvent.click(scanButton);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to scan models folder:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle model status check errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (window.electronAPI.llmIsLoaded as jest.Mock).mockRejectedValue(new Error('Check failed'));

    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to check model status:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle models folder load errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (window.electronAPI.llmGetModelsDirectory as jest.Mock).mockRejectedValue(new Error('Load failed'));

    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load models folder:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('should unsubscribe from download progress on unmount', async () => {
    const { unmount } = await act(async () => {
      return render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(window.electronAPI.llmOnDownloadProgress).toHaveBeenCalled();
    });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should disable buttons while loading', async () => {
    (window.electronAPI.llmIsLoaded as jest.Mock).mockResolvedValue(true);
    (window.electronAPI.llmGetCurrentModel as jest.Mock).mockResolvedValue('/path/to/model2.gguf');

    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Model 2')).toBeInTheDocument();
    });

    // Find the loaded button for model2 and check it's disabled
    const loadedButtons = screen.getAllByText('settings.llm.loaded');
    expect(loadedButtons[0]).toBeDisabled();
  });

  it('should show loaded state with correct variant for currently loaded model', async () => {
    (window.electronAPI.llmIsLoaded as jest.Mock).mockResolvedValue(true);
    (window.electronAPI.llmGetCurrentModel as jest.Mock).mockResolvedValue('/models/scanned.gguf');

    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('Scanned Model')).toBeInTheDocument();
    });

    // Find the button for scanned model which should show as loaded
    const loadedButtons = screen.getAllByText('settings.llm.loaded');
    expect(loadedButtons.length).toBeGreaterThan(0);

    // Check the button has the default variant (not outline)
    const button = loadedButtons[0].closest('button');
    expect(button).toHaveAttribute('data-variant', 'default');
    expect(button).toBeDisabled(); // Should be disabled when it's the current model
  });

  it('should display attribution badge for models with requiresAttribution', async () => {
    const llamaModel = {
      id: 'llama-3.2-1b',
      name: 'Llama 3.2 1B',
      license: 'LLAMA 3.2 COMMUNITY LICENSE AGREEMENT',
      licenseId: 'LLAMA-3.2-COMMUNITY-LICENSE-AGREEMENT',
      requiresAttribution: true,
      attributionText: 'Built with Llama',
      description: 'Llama model',
      size: '1.3GB',
      url: 'https://example.com/llama.gguf',
      filename: 'llama.gguf',
      recommendedContext: 10000,
      type: 'instruct',
      installed: true,
      path: '/models/llama.gguf',
    };

    (window as any).electronAPI = {
      llmListAvailable: jest.fn().mockResolvedValue([llamaModel]),
      llmListInstalled: jest.fn().mockResolvedValue([llamaModel]),
      llmIsLoaded: jest.fn().mockResolvedValue(true),
      llmGetCurrentModel: jest.fn().mockResolvedValue('/models/llama.gguf'),
      llmGetModelsDirectory: jest.fn().mockResolvedValue('/models'),
      llmScanFolder: jest.fn().mockResolvedValue([]),
      llmOnDownloadProgress: jest.fn().mockReturnValue(jest.fn()),
    };

    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.getByText('Built with Llama')).toBeInTheDocument();
    });
  });

  it('should not display attribution badge for models without requiresAttribution', async () => {
    const regularModel = {
      id: 'model1',
      name: 'Regular Model',
      license: 'MIT',
      description: 'Regular model',
      size: '1GB',
      url: 'https://example.com/model.gguf',
      filename: 'model.gguf',
      recommendedContext: 4096,
      type: 'llama',
      installed: true,
      path: '/models/model.gguf',
      requiresAttribution: false,
    };

    (window as any).electronAPI = {
      llmListAvailable: jest.fn().mockResolvedValue([regularModel]),
      llmListInstalled: jest.fn().mockResolvedValue([regularModel]),
      llmIsLoaded: jest.fn().mockResolvedValue(true),
      llmGetCurrentModel: jest.fn().mockResolvedValue('/models/model.gguf'),
      llmGetModelsDirectory: jest.fn().mockResolvedValue('/models'),
      llmScanFolder: jest.fn().mockResolvedValue([]),
      llmOnDownloadProgress: jest.fn().mockReturnValue(jest.fn()),
    };

    await act(async () => {
      render(<LLMSettings />);
    });

    await waitFor(() => {
      expect(screen.queryByText('Built with Llama')).not.toBeInTheDocument();
    });
  });
});