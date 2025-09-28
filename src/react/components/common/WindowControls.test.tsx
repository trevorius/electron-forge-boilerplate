import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import WindowControls from './WindowControls';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Minus: () => <div data-testid="minus-icon">Minus</div>,
  Square: () => <div data-testid="square-icon">Square</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Maximize2: () => <div data-testid="maximize-icon">Maximize</div>
}));

describe('WindowControls', () => {
  let mockElectronAPI: any;
  let originalElectronAPI: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Store original electronAPI if it exists
    originalElectronAPI = (window as any).electronAPI;

    // Create fresh mock for each test
    mockElectronAPI = {
      minimizeWindow: jest.fn().mockResolvedValue(undefined),
      maximizeWindow: jest.fn().mockResolvedValue(undefined),
      closeWindow: jest.fn().mockResolvedValue(undefined),
      isMaximized: jest.fn().mockResolvedValue(false),
      onMaximize: jest.fn(),
      onUnmaximize: jest.fn(),
      removeAllListeners: jest.fn(),
      getPlatform: jest.fn().mockReturnValue('win32')
    };

    // Mock window.electronAPI
    (window as any).electronAPI = mockElectronAPI;
  });

  afterEach(() => {
    // Restore original electronAPI or delete if it didn't exist
    if (originalElectronAPI) {
      (window as any).electronAPI = originalElectronAPI;
    } else {
      delete (window as any).electronAPI;
    }
  });

  describe('Platform Detection', () => {
    it('should render macOS spacer for darwin platform', async () => {
      mockElectronAPI.getPlatform.mockReturnValue('darwin');

      let container: any;
      await act(async () => {
        const renderResult = render(<WindowControls />);
        container = renderResult.container;
      });

      // Should render spacer div for macOS
      const spacer = container.querySelector('.w-20.h-8');
      expect(spacer).toBeInTheDocument();

      // Should not render control buttons
      expect(screen.queryByTestId('minus-icon')).not.toBeInTheDocument();
    });

    it('should render custom controls for non-darwin platforms', async () => {
      mockElectronAPI.getPlatform.mockReturnValue('win32');

      await act(async () => {
        render(<WindowControls />);
      });

      expect(screen.getByTestId('minus-icon')).toBeInTheDocument();
      expect(screen.getByTestId('maximize-icon')).toBeInTheDocument();
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });
  });

  describe('Window State', () => {
    it('should show maximize icon when window is not maximized', async () => {
      mockElectronAPI.isMaximized.mockResolvedValue(false);

      await act(async () => {
        render(<WindowControls />);
      });

      expect(screen.getByTestId('maximize-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('square-icon')).not.toBeInTheDocument();
    });

    it('should show restore icon when window is maximized', async () => {
      mockElectronAPI.isMaximized.mockResolvedValue(true);

      await act(async () => {
        render(<WindowControls />);
      });

      expect(screen.getByTestId('square-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('maximize-icon')).not.toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should call minimizeWindow when minimize button is clicked', async () => {
      await act(async () => {
        render(<WindowControls />);
      });

      const minimizeButton = screen.getByLabelText('Minimize');

      act(() => {
        fireEvent.click(minimizeButton);
      });

      expect(mockElectronAPI.minimizeWindow).toHaveBeenCalledTimes(1);
    });

    it('should call maximizeWindow when maximize button is clicked', async () => {
      await act(async () => {
        render(<WindowControls />);
      });

      const maximizeButton = screen.getByLabelText('Maximize');

      act(() => {
        fireEvent.click(maximizeButton);
      });

      expect(mockElectronAPI.maximizeWindow).toHaveBeenCalledTimes(1);
    });

    it('should call closeWindow when close button is clicked', async () => {
      await act(async () => {
        render(<WindowControls />);
      });

      const closeButton = screen.getByLabelText('Close');

      act(() => {
        fireEvent.click(closeButton);
      });

      expect(mockElectronAPI.closeWindow).toHaveBeenCalledTimes(1);
    });

    it('should call maximizeWindow when restore button is clicked', async () => {
      mockElectronAPI.isMaximized.mockResolvedValue(true);

      await act(async () => {
        render(<WindowControls />);
      });

      const restoreButton = screen.getByLabelText('Restore');

      act(() => {
        fireEvent.click(restoreButton);
      });

      expect(mockElectronAPI.maximizeWindow).toHaveBeenCalledTimes(1);
    });

    it('should handle button clicks when methods are missing', async () => {
      (window as any).electronAPI = {
        getPlatform: jest.fn().mockReturnValue('win32'),
        isMaximized: jest.fn().mockResolvedValue(false),
        onMaximize: jest.fn(),
        onUnmaximize: jest.fn(),
        removeAllListeners: jest.fn(),
        // Missing window control methods
      };

      await act(async () => {
        render(<WindowControls />);
      });

      // These should not throw even without the methods
      const minimizeButton = screen.getByLabelText('Minimize');
      const maximizeButton = screen.getByLabelText('Maximize');
      const closeButton = screen.getByLabelText('Close');

      act(() => {
        fireEvent.click(minimizeButton);
        fireEvent.click(maximizeButton);
        fireEvent.click(closeButton);
      });

      // Should not crash
      expect(minimizeButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-labels on buttons', async () => {
      await act(async () => {
        render(<WindowControls />);
      });

      expect(screen.getByLabelText('Minimize')).toBeInTheDocument();
      expect(screen.getByLabelText('Maximize')).toBeInTheDocument();
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    it('should show restore label when maximized', async () => {
      mockElectronAPI.isMaximized.mockResolvedValue(true);

      await act(async () => {
        render(<WindowControls />);
      });

      expect(screen.getByLabelText('Restore')).toBeInTheDocument();
    });

    it('should render buttons as button elements', async () => {
      await act(async () => {
        render(<WindowControls />);
      });

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });
  });

  describe('Styling', () => {
    it('should apply correct CSS classes to buttons', async () => {
      await act(async () => {
        render(<WindowControls />);
      });

      const minimizeButton = screen.getByLabelText('Minimize');
      const maximizeButton = screen.getByLabelText('Maximize');
      const closeButton = screen.getByLabelText('Close');

      // Check common button classes
      [minimizeButton, maximizeButton, closeButton].forEach(button => {
        expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center', 'w-11', 'h-8');
      });

      // Check close button has red hover
      expect(closeButton).toHaveClass('hover:bg-red-600');
    });

    it('should have container with flex layout', async () => {
      const { container } = render(<WindowControls />);

      const flexContainer = container.querySelector('.flex.items-center');
      expect(flexContainer).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing electronAPI gracefully', () => {
      delete (window as any).electronAPI;

      expect(() => render(<WindowControls />)).not.toThrow();
    });

    it('should not crash when electronAPI methods are undefined', async () => {
      (window as any).electronAPI = {};

      await act(async () => {
        expect(() => render(<WindowControls />)).not.toThrow();
      });
    });

    it('should handle partial electronAPI object', async () => {
      (window as any).electronAPI = {
        getPlatform: jest.fn().mockReturnValue('win32'),
        // Missing other methods
      };

      await act(async () => {
        expect(() => render(<WindowControls />)).not.toThrow();
      });
    });

    it('should handle missing specific methods gracefully', async () => {
      (window as any).electronAPI = {
        getPlatform: jest.fn().mockReturnValue('win32'),
        isMaximized: undefined,
        onMaximize: undefined,
        onUnmaximize: undefined,
        removeAllListeners: undefined
      };

      await act(async () => {
        expect(() => render(<WindowControls />)).not.toThrow();
      });
    });

    it('should handle missing event listener methods', async () => {
      (window as any).electronAPI = {
        getPlatform: jest.fn().mockReturnValue('win32'),
        isMaximized: jest.fn().mockResolvedValue(false),
        // onMaximize and onUnmaximize are missing
        removeAllListeners: jest.fn(),
        minimizeWindow: jest.fn(),
        maximizeWindow: jest.fn(),
        closeWindow: jest.fn()
      };

      await act(async () => {
        expect(() => render(<WindowControls />)).not.toThrow();
      });
    });

    it('should handle clicks without electronAPI', async () => {
      delete (window as any).electronAPI;

      let container: any;
      await act(async () => {
        const renderResult = render(<WindowControls />);
        container = renderResult.container;
      });

      // Should render without controls since no platform detected
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Event Listeners', () => {
    it('should set up maximize/unmaximize listeners', async () => {
      await act(async () => {
        render(<WindowControls />);
      });

      expect(mockElectronAPI.onMaximize).toHaveBeenCalled();
      expect(mockElectronAPI.onUnmaximize).toHaveBeenCalled();
    });

    it('should clean up listeners on unmount', async () => {
      const { unmount } = await act(async () => {
        return render(<WindowControls />);
      });

      unmount();

      expect(mockElectronAPI.removeAllListeners).toHaveBeenCalledWith('window-maximized');
      expect(mockElectronAPI.removeAllListeners).toHaveBeenCalledWith('window-unmaximized');
    });

    it('should check initial maximize state', async () => {
      await act(async () => {
        render(<WindowControls />);
      });

      expect(mockElectronAPI.isMaximized).toHaveBeenCalled();
    });

    it('should handle maximize/unmaximize events properly', async () => {
      let maximizeCallback: () => void;
      let unmaximizeCallback: () => void;

      mockElectronAPI.onMaximize.mockImplementation((callback: () => void) => {
        maximizeCallback = callback;
      });
      mockElectronAPI.onUnmaximize.mockImplementation((callback: () => void) => {
        unmaximizeCallback = callback;
      });

      await act(async () => {
        render(<WindowControls />);
      });

      // Trigger the event callbacks to test the internal handlers
      await act(async () => {
        maximizeCallback!();
      });

      await act(async () => {
        unmaximizeCallback!();
      });

      // Verify the callbacks were set up
      expect(mockElectronAPI.onMaximize).toHaveBeenCalled();
      expect(mockElectronAPI.onUnmaximize).toHaveBeenCalled();
    });
  });

  describe('Icon Rendering', () => {
    it('should render correct icons for each button when not maximized', async () => {
      mockElectronAPI.isMaximized.mockResolvedValue(false);

      await act(async () => {
        render(<WindowControls />);
      });

      expect(screen.getByTestId('minus-icon')).toBeInTheDocument();
      expect(screen.getByTestId('maximize-icon')).toBeInTheDocument();
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('should render square icon when maximized', async () => {
      mockElectronAPI.isMaximized.mockResolvedValue(true);

      await act(async () => {
        render(<WindowControls />);
      });

      expect(screen.getByTestId('square-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('maximize-icon')).not.toBeInTheDocument();
    });
  });
});