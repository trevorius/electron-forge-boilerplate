import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CurrentModelInfo {
  requiresAttribution?: boolean;
  attributionText?: string;
}

interface ModelContextType {
  currentModelInfo: CurrentModelInfo | null;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const useModel = () => {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
};

interface ModelProviderProps {
  children: ReactNode;
}

export const ModelProvider: React.FC<ModelProviderProps> = ({ children }) => {
  const [currentModelInfo, setCurrentModelInfo] = useState<CurrentModelInfo | null>(null);

  useEffect(() => {
    // Check current model status on mount and set up interval
    const checkCurrentModel = async () => {
      try {
        const isLoaded = await window.electronAPI.llmIsLoaded();
        if (isLoaded) {
          const modelPath = await window.electronAPI.llmGetCurrentModel();
          if (modelPath) {
            // Get available models to check if it requires attribution
            const availableModels = await window.electronAPI.llmListAvailable();
            const currentModel = availableModels.find((m: any) => m.path === modelPath);

            if (currentModel?.requiresAttribution) {
              setCurrentModelInfo({
                requiresAttribution: true,
                attributionText: currentModel.attributionText || 'Built with Llama'
              });
            } else {
              setCurrentModelInfo(null);
            }
          } else {
            setCurrentModelInfo(null);
          }
        } else {
          setCurrentModelInfo(null);
        }
      } catch (error) {
        console.error('Failed to check current model:', error);
        setCurrentModelInfo(null);
      }
    };

    checkCurrentModel();

    // Check periodically for model changes
    const interval = setInterval(checkCurrentModel, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ModelContext.Provider value={{ currentModelInfo }}>
      {children}
    </ModelContext.Provider>
  );
};
