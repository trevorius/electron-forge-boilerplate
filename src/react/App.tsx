import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/common/Navigation';
import { routes } from './routes';

function App() {
  return (
    <Router>
      <div className="relative">
        <Navigation />
        <Routes>
          {routes.map((route) => {
            const Component = route.component;
            return (
              <Route
                key={route.path}
                path={route.path}
                element={<Component />}
              />
            );
          })}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
