import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock CSS module directly
jest.mock('./App.module.css', () => ({
  __esModule: true,
  default: {
    'main-container': 'main-container'
  }
}), { virtual: true });

// Import before any other imports that might use mocks
import App from './App';

// Mock routes with proper TypeScript types
jest.mock('./routes', () => ({
  routes: [
    {
      path: '/',
      component: () => <div data-testid="mock-game">Game Page</div>,
      title: 'nav.home',
      icon: (): null => null,
      exact: true
    },
    {
      path: '/game',
      component: () => <div data-testid="mock-games">Games Page</div>,
      title: 'nav.games',
      icon: (): null => null,
      children: [
        {
          path: '/game/tetris',
          component: () => <div data-testid="mock-tetris">Tetris Page</div>,
          title: 'nav.games_menu.tetris',
          icon: (): null => null
        }
      ]
    },
    {
      path: '/about',
      component: () => <div data-testid="mock-about">About Page</div>,
      title: 'nav.about',
      icon: (): null => null
    }
  ]
}));

// Mock BrowserRouter to use MemoryRouter instead
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => {
      const { MemoryRouter } = actual;
      return <MemoryRouter>{children}</MemoryRouter>;
    }
  };
});

// Mock react-i18next
const mockUseTranslation = jest.fn();
jest.mock('react-i18next', () => ({
  useTranslation: () => mockUseTranslation()
}));

// Mock the Navbar component
jest.mock('./components/common/Navbar', () => {
  return {
    __esModule: true,
    default: function MockNavbar() {
      return <div data-testid="mock-navbar">Navbar</div>;
    }
  };
});

// Mock the ModelContext
jest.mock('./contexts/ModelContext', () => ({
  ModelProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useModel: () => ({ currentModelInfo: null })
}));

const renderApp = () => {
  return render(<App />);
};

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
      i18n: { language: 'en' }
    });
  });

  it('should render navbar and router container', () => {
    renderApp();

    expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
    const container = screen.getByTestId('mock-navbar').parentElement;
    expect(container).toHaveClass('fixed', 'inset-0', 'flex', 'flex-col', 'bg-background');
  });

  it('should render Game component on home route by default', () => {
    renderApp();

    expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-game')).toBeInTheDocument();
  });

  it('should have router structure with flex layout for scrolling', () => {
    const { container } = renderApp();

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toBeInTheDocument();
    expect(mainDiv).toHaveClass('fixed', 'inset-0', 'flex', 'flex-col', 'bg-background');

    // Check for the content wrapper with flex and overflow
    const contentWrapper = mainDiv.querySelector('.flex-1');
    expect(contentWrapper).toBeInTheDocument();
    expect(contentWrapper).toHaveClass('flex-1', 'overflow-auto');
  });

  it('should be a functional component that returns JSX', () => {
    const { container } = renderApp();
    expect(container.firstChild).toBeInTheDocument();
  });
});