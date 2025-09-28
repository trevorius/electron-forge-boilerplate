import { Route, HashRouter as Router, Routes } from 'react-router-dom';
import styles from './App.module.css';
import Navbar from './components/common/Navbar';
import { routes } from './routes';
import './styles/globals.css';

function App() {
  return (
    <Router>
      <div className="fixed inset-0 flex flex-col bg-background" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <Navbar />
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
