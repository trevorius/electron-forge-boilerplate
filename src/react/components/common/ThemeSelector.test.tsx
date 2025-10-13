import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import ThemeSelector from './ThemeSelector';

// Mock react-i18next
const mockUseTranslation = jest.fn();
jest.mock('react-i18next', () => ({
  useTranslation: () => mockUseTranslation(),
}));

// Mock Button component
jest.mock('../ui/button', () => ({
  Button: ({ children, onClick, className, title }: any) => (
    <button onClick={onClick} className={className} title={title} data-testid="theme-button">
      {children}
    </button>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Moon: ({ className }: any) => <svg data-testid="moon-icon" className={className} />,
  Sun: ({ className }: any) => <svg data-testid="sun-icon" className={className} />,
}));

describe('ThemeSelector', () => {
  beforeEach(() => {
    // Reset mocks
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
      i18n: { language: 'en' },
    });

    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Reset document classes
    document.documentElement.className = '';
  });

  it('should render with moon icon initially (light theme)', () => {
    render(<ThemeSelector />);
    expect(screen.getByTestId('theme-button')).toBeInTheDocument();
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
  });

  it('should toggle to dark theme when clicked', () => {
    render(<ThemeSelector />);
    const button = screen.getByTestId('theme-button');

    fireEvent.click(button);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
  });

  it('should toggle back to light theme when clicked again', () => {
    render(<ThemeSelector />);
    const button = screen.getByTestId('theme-button');

    // Click to dark
    fireEvent.click(button);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Click to light
    fireEvent.click(button);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
  });

  it('should load saved theme from localStorage', () => {
    (Storage.prototype.getItem as jest.Mock).mockReturnValue('dark');

    render(<ThemeSelector />);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
  });

  it('should use system preference when no saved theme', () => {
    (Storage.prototype.getItem as jest.Mock).mockReturnValue(null);
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(<ThemeSelector />);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
  });

  it('should apply correct button styling', () => {
    render(<ThemeSelector />);
    const button = screen.getByTestId('theme-button');

    expect(button).toHaveClass('h-8', 'w-8', 'px-0');
  });

  it('should have correct title attribute', () => {
    render(<ThemeSelector />);
    const button = screen.getByTestId('theme-button');

    expect(button).toHaveAttribute('title', 'theme.switch');
  });
});
