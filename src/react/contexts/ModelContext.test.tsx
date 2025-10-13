import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ModelProvider, useModel } from './ModelContext';

// Test component to access context
const TestComponent = () => {
  const { currentModelInfo } = useModel();
  return (
    <div>
      {currentModelInfo?.requiresAttribution ? (
        <span data-testid="attribution-text">{currentModelInfo.attributionText}</span>
      ) : (
        <span data-testid="no-attribution">No Attribution</span>
      )}
    </div>
  );
};

describe('ModelContext', () => {
  let mockLlmIsLoaded: jest.Mock;
  let mockLlmGetCurrentModel: jest.Mock;
  let mockLlmListAvailable: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    mockLlmIsLoaded = jest.fn();
    mockLlmGetCurrentModel = jest.fn();
    mockLlmListAvailable = jest.fn();

    (window as any).electronAPI = {
      llmIsLoaded: mockLlmIsLoaded,
      llmGetCurrentModel: mockLlmGetCurrentModel,
      llmListAvailable: mockLlmListAvailable,
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should provide null model info when no model is loaded', async () => {
    mockLlmIsLoaded.mockResolvedValue(false);

    await act(async () => {
      render(
        <ModelProvider>
          <TestComponent />
        </ModelProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('no-attribution')).toBeInTheDocument();
    });
  });

  it('should provide attribution info for Llama models', async () => {
    mockLlmIsLoaded.mockResolvedValue(true);
    mockLlmGetCurrentModel.mockResolvedValue('/models/llama.gguf');
    mockLlmListAvailable.mockResolvedValue([
      {
        path: '/models/llama.gguf',
        requiresAttribution: true,
        attributionText: 'Built with Llama'
      }
    ]);

    await act(async () => {
      render(
        <ModelProvider>
          <TestComponent />
        </ModelProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('attribution-text')).toHaveTextContent('Built with Llama');
    });
  });

  it('should not provide attribution for models without requiresAttribution', async () => {
    mockLlmIsLoaded.mockResolvedValue(true);
    mockLlmGetCurrentModel.mockResolvedValue('/models/other.gguf');
    mockLlmListAvailable.mockResolvedValue([
      {
        path: '/models/other.gguf',
        requiresAttribution: false
      }
    ]);

    await act(async () => {
      render(
        <ModelProvider>
          <TestComponent />
        </ModelProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('no-attribution')).toBeInTheDocument();
    });
  });

  it('should handle errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockLlmIsLoaded.mockRejectedValue(new Error('API Error'));

    await act(async () => {
      render(
        <ModelProvider>
          <TestComponent />
        </ModelProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('no-attribution')).toBeInTheDocument();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to check current model:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('should throw error when useModel is used outside provider', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useModel must be used within a ModelProvider');

    consoleErrorSpy.mockRestore();
  });

  it('should update periodically when model changes', async () => {
    mockLlmIsLoaded.mockResolvedValue(false);

    await act(async () => {
      render(
        <ModelProvider>
          <TestComponent />
        </ModelProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('no-attribution')).toBeInTheDocument();
    });

    // Change mock to return loaded model
    mockLlmIsLoaded.mockResolvedValue(true);
    mockLlmGetCurrentModel.mockResolvedValue('/models/llama.gguf');
    mockLlmListAvailable.mockResolvedValue([
      {
        path: '/models/llama.gguf',
        requiresAttribution: true,
        attributionText: 'Built with Llama'
      }
    ]);

    // Advance timers to trigger the interval
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('attribution-text')).toHaveTextContent('Built with Llama');
    });
  });

  it('should handle null model path', async () => {
    mockLlmIsLoaded.mockResolvedValue(true);
    mockLlmGetCurrentModel.mockResolvedValue(null);

    await act(async () => {
      render(
        <ModelProvider>
          <TestComponent />
        </ModelProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('no-attribution')).toBeInTheDocument();
    });
  });

  it('should use default attribution text when not provided', async () => {
    mockLlmIsLoaded.mockResolvedValue(true);
    mockLlmGetCurrentModel.mockResolvedValue('/models/llama.gguf');
    mockLlmListAvailable.mockResolvedValue([
      {
        path: '/models/llama.gguf',
        requiresAttribution: true,
        // No attributionText provided
      }
    ]);

    await act(async () => {
      render(
        <ModelProvider>
          <TestComponent />
        </ModelProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('attribution-text')).toHaveTextContent('Built with Llama');
    });
  });
});
