import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

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

// Mock the components
jest.mock('./components/common/Navigation', () => {
  return {
    __esModule: true,
    default: function MockNavigation() {
      return <div data-testid="mock-navigation">Navigation</div>;
    }
  };
});

jest.mock('./components/layout/Game', () => {
  return {
    __esModule: true,
    default: function MockGame() {
      return <div data-testid="mock-game">Game Page</div>;
    }
  };
});

jest.mock('./components/layout/About', () => {
  return {
    __esModule: true,
    default: function MockAbout() {
      return <div data-testid="mock-about">About Page</div>;
    }
  };
});

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

  it('should render navigation and router container', () => {
    renderApp();

    expect(screen.getByTestId('mock-navigation')).toBeInTheDocument();
    const container = screen.getByTestId('mock-navigation').parentElement;
    expect(container).toHaveClass('relative');
  });

  it('should render Game component on home route by default', () => {
    renderApp();

    expect(screen.getByTestId('mock-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('mock-game')).toBeInTheDocument();
  });

  it('should have router structure', () => {
    const { container } = renderApp();

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toBeInTheDocument();
    expect(mainDiv).toHaveClass('relative');
  });

  it('should be a functional component that returns JSX', () => {
    const { container } = renderApp();
    expect(container.firstChild).toBeInTheDocument();
  });
});