import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Maximize2 } from 'lucide-react';

declare global {
  interface Window {
    electronAPI: {
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      isMaximized: () => Promise<boolean>;
      onMaximize: (callback: () => void) => void;
      onUnmaximize: (callback: () => void) => void;
      removeAllListeners: (channel: string) => void;
      getPlatform: () => string;
    };
  }
}

const WindowControls: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [platform, setPlatform] = useState<string>('');

  useEffect(() => {
    // Check platform
    if (window.electronAPI && window.electronAPI.getPlatform) {
      setPlatform(window.electronAPI.getPlatform());

      // Check initial maximize state
      if (window.electronAPI.isMaximized) {
        window.electronAPI.isMaximized().then(setIsMaximized);
      }

      // Listen for maximize/unmaximize events
      const handleMaximize = () => setIsMaximized(true);
      const handleUnmaximize = () => setIsMaximized(false);

      if (window.electronAPI.onMaximize && window.electronAPI.onUnmaximize) {
        window.electronAPI.onMaximize(handleMaximize);
        window.electronAPI.onUnmaximize(handleUnmaximize);
      }

      return () => {
        if (window.electronAPI && window.electronAPI.removeAllListeners) {
          window.electronAPI.removeAllListeners('window-maximized');
          window.electronAPI.removeAllListeners('window-unmaximized');
        }
      };
    }
  }, []);

  const handleMinimize = () => {
    if (window.electronAPI && window.electronAPI.minimizeWindow) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI && window.electronAPI.maximizeWindow) {
      window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (window.electronAPI && window.electronAPI.closeWindow) {
      window.electronAPI.closeWindow();
    }
  };

  // On macOS, the traffic lights are handled by the system
  if (platform === 'darwin') {
    // Return empty div with enough space for macOS traffic lights
    return <div className="w-20 h-8 -webkit-app-region: drag" />;
  }

  // Custom controls for Windows/Linux
  return (
    <div className="flex items-center">
      <button
        onClick={handleMinimize}
        className="inline-flex items-center justify-center w-11 h-8 hover:bg-zinc-700/50 transition-colors"
        aria-label="Minimize"
      >
        <Minus className="h-3 w-3" />
      </button>
      <button
        onClick={handleMaximize}
        className="inline-flex items-center justify-center w-11 h-8 hover:bg-zinc-700/50 transition-colors"
        aria-label={isMaximized ? 'Restore' : 'Maximize'}
      >
        {isMaximized ? (
          <Square className="h-3 w-3" />
        ) : (
          <Maximize2 className="h-3 w-3" />
        )}
      </button>
      <button
        onClick={handleClose}
        className="inline-flex items-center justify-center w-11 h-8 hover:bg-red-600 transition-colors"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default WindowControls;