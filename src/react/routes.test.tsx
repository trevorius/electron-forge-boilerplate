import React from 'react';
import { routes } from './routes';
import { Home, Info, Gamepad2 } from 'lucide-react';

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Home: jest.fn(() => null),
  Info: jest.fn(() => null),
  Gamepad2: jest.fn(() => null)
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

jest.mock('./components/game/Tetris', () => {
  return {
    __esModule: true,
    default: function MockTetris() {
      return <div>Tetris Component</div>;
    }
  };
});

jest.mock('./components/game/TicTacToe', () => {
  return {
    __esModule: true,
    default: function MockTicTacToe() {
      return <div>TicTacToe Component</div>;
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
      expect(route).toHaveProperty('inNavbar');
      expect(typeof route.path).toBe('string');
      expect(typeof route.component).toBe('function');
      expect(typeof route.title).toBe('string');
      expect(typeof route.icon).toBe('function');
      expect(typeof route.inNavbar).toBe('boolean');
    });
  });

  it('should have home route configured correctly', () => {
    const homeRoute = routes.find(route => route.path === '/');
    expect(homeRoute).toBeDefined();
    expect(homeRoute?.title).toBe('nav.home');
    expect(homeRoute?.icon).toBe(Home);
    expect(homeRoute?.exact).toBe(true);
    expect(homeRoute?.inNavbar).toBe(true);
  });

  it('should have about route configured correctly', () => {
    const aboutRoute = routes.find(route => route.path === '/about');
    expect(aboutRoute).toBeDefined();
    expect(aboutRoute?.title).toBe('nav.about');
    expect(aboutRoute?.icon).toBe(Info);
    expect(aboutRoute?.inNavbar).toBe(true);
  });

  it('should have games route with children', () => {
    const gamesRoute = routes.find(route => route.path === '/game');
    expect(gamesRoute).toBeDefined();
    expect(gamesRoute?.title).toBe('nav.games');
    expect(gamesRoute?.icon).toBe(Gamepad2);
    expect(gamesRoute?.inNavbar).toBe(true);
    expect(gamesRoute?.children).toBeDefined();
    expect(Array.isArray(gamesRoute?.children)).toBe(true);
    expect(gamesRoute?.children?.length).toBeGreaterThan(0);
  });

  it('should have unique paths', () => {
    const allPaths: string[] = [];
    routes.forEach(route => {
      allPaths.push(route.path);
      if (route.children) {
        route.children.forEach(child => allPaths.push(child.path));
      }
    });
    const uniquePaths = [...new Set(allPaths)];
    expect(allPaths.length).toBe(uniquePaths.length);
  });

  it('should have translation keys for titles', () => {
    const checkTranslationKeys = (routesToCheck: any[]) => {
      routesToCheck.forEach(route => {
        expect(route.title).toMatch(/^nav\./);
        if (route.children) {
          checkTranslationKeys(route.children);
        }
      });
    };
    checkTranslationKeys(routes);
  });
});