import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Navigation from './Navigation';

// Mock routes
jest.mock('../../routes', () => ({
  routes: [
    {
      path: '/',
      component: () => <div>Game</div>,
      title: 'navigation.home',
      icon: ({ className, ...props }: any) => <svg className={className} data-testid="mock-home-icon" {...props} />,
      exact: true
    },
    {
      path: '/about',
      component: () => <div>About</div>,
      title: 'navigation.about',
      icon: ({ className, ...props }: any) => <svg className={className} data-testid="mock-info-icon" {...props} />
    }
  ]
}));

// Mock react-i18next
const mockUseTranslation = jest.fn();
jest.mock('react-i18next', () => ({
  useTranslation: () => mockUseTranslation()
}));

// Mock the UI components
jest.mock('../ui/button', () => {
  const React = require('react');
  return {
    Button: React.forwardRef<HTMLButtonElement, any>(({ children, onClick, variant, className, ...props }, ref) => (
      <button
        ref={ref}
        onClick={onClick}
        className={className}
        data-testid="mock-button"
        data-variant={variant}
        {...props}
      >
        {children}
      </button>
    ))
  };
});


const renderWithRouter = (initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Navigation />
    </MemoryRouter>
  );
};

describe('Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: { [key: string]: string } = {
          'navigation.home': 'Home',
          'navigation.about': 'About'
        };
        return translations[key] || key;
      }
    });
  });

  it('should render navigation with home and about links', () => {
    renderWithRouter();

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByTestId('mock-home-icon')).toBeInTheDocument();
    expect(screen.getByTestId('mock-info-icon')).toBeInTheDocument();
  });

  it('should highlight home button when on home route', () => {
    renderWithRouter(['/']);

    const buttons = screen.getAllByTestId('mock-button');
    const homeButton = buttons.find(button => button.textContent?.includes('Home'));
    const aboutButton = buttons.find(button => button.textContent?.includes('About'));

    expect(homeButton).toHaveAttribute('data-variant', 'default');
    expect(aboutButton).toHaveAttribute('data-variant', 'outline');
  });

  it('should highlight about button when on about route', () => {
    renderWithRouter(['/about']);

    const buttons = screen.getAllByTestId('mock-button');
    const homeButton = buttons.find(button => button.textContent?.includes('Home'));
    const aboutButton = buttons.find(button => button.textContent?.includes('About'));

    expect(homeButton).toHaveAttribute('data-variant', 'outline');
    expect(aboutButton).toHaveAttribute('data-variant', 'default');
  });

  it('should have correct navigation structure', () => {
    const { container } = renderWithRouter();

    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass('fixed', 'top-4', 'left-4', 'z-10');

    const navDiv = nav?.querySelector('div');
    expect(navDiv).toHaveClass('flex', 'gap-2');
  });

  it('should render links with correct hrefs', () => {
    renderWithRouter();

    const homeLink = screen.getByText('Home').closest('a');
    const aboutLink = screen.getByText('About').closest('a');

    expect(homeLink).toHaveAttribute('href', '/');
    expect(aboutLink).toHaveAttribute('href', '/about');
  });

  it('should apply gap-2 class to buttons', () => {
    renderWithRouter();

    const buttons = screen.getAllByTestId('mock-button');
    buttons.forEach(button => {
      expect(button).toHaveClass('gap-2');
    });
  });
});