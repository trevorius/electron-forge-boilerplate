import React from 'react';
import { routes } from './routes';
import { Home, Info } from 'lucide-react';

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Home: jest.fn(() => null),
  Info: jest.fn(() => null)
}));

// Mock the components
jest.mock('./components/layout/Game', () => {
  return {
    __esModule: true,
    default: function MockGame() {
      return <div>Game Component</div>;
    }
  };
});

jest.mock('./components/layout/About', () => {
  return {
    __esModule: true,
    default: function MockAbout() {
      return <div>About Component</div>;
    }
  };
});

describe('Routes Configuration', () => {
  it('should export an array of routes', () => {
    expect(Array.isArray(routes)).toBe(true);
    expect(routes.length).toBeGreaterThan(0);
  });

  it('should have correct route structure', () => {
    routes.forEach(route => {
      expect(route).toHaveProperty('path');
      expect(route).toHaveProperty('component');
      expect(route).toHaveProperty('title');
      expect(route).toHaveProperty('icon');
      expect(typeof route.path).toBe('string');
      expect(typeof route.component).toBe('function');
      expect(typeof route.title).toBe('string');
      expect(typeof route.icon).toBe('function');
    });
  });

  it('should have home route configured correctly', () => {
    const homeRoute = routes.find(route => route.path === '/');
    expect(homeRoute).toBeDefined();
    expect(homeRoute?.title).toBe('navigation.home');
    expect(homeRoute?.icon).toBe(Home);
    expect(homeRoute?.exact).toBe(true);
  });

  it('should have about route configured correctly', () => {
    const aboutRoute = routes.find(route => route.path === '/about');
    expect(aboutRoute).toBeDefined();
    expect(aboutRoute?.title).toBe('navigation.about');
    expect(aboutRoute?.icon).toBe(Info);
  });

  it('should have unique paths', () => {
    const paths = routes.map(route => route.path);
    const uniquePaths = [...new Set(paths)];
    expect(paths.length).toBe(uniquePaths.length);
  });

  it('should have translation keys for titles', () => {
    routes.forEach(route => {
      expect(route.title).toMatch(/^navigation\./);
    });
  });
});