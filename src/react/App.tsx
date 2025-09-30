import { useState, useEffect } from 'react';
import { Route, HashRouter as Router, Routes } from 'react-router-dom';
import styles from './App.module.css';
import Navbar from './components/common/Navbar';
import { routes } from './routes';
import './styles/globals.css';

interface CurrentModelInfo {
  requiresAttribution?: boolean;
  attributionText?: string;
}

function App() {
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
    <Router>
      <div className="fixed inset-0 flex flex-col bg-background" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <Navbar currentModelInfo={currentModelInfo} />
        {/* Main content area with proper margin and scrolling */}
        <div className={`flex-1 overflow-auto ${styles['main-container']}`} style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <Routes>
            {routes.map((route) => {
              const Component = route.component;
              const routes_to_render = [
                <Route
                  key={route.path}
                  path={route.path}
                  element={<Component />}
                />
              ];

              // Add child routes
              if (route.children) {
                route.children.forEach((childRoute) => {
                  const ChildComponent = childRoute.component;
                  routes_to_render.push(
                    <Route
                      key={childRoute.path}
                      path={childRoute.path}
                      element={<ChildComponent />}
                    />
                  );
                });
              }

              return routes_to_render;
            })}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
