import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageSelector from './LanguageSelector';

// Mock react-i18next
const mockChangeLanguage = jest.fn();
const mockUseTranslation = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => mockUseTranslation()
}));

// Mock the UI components
jest.mock('../ui/button', () => {
  const React = require('react');
  return {
    Button: React.forwardRef<HTMLButtonElement, any>(({ children, onClick, disabled, className, variant, title, ...props }, ref) => (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        className={className}
        title={title}
        data-testid="mock-button"
        data-variant={variant}
        {...props}
      >
        {children}
      </button>
    ))
  };
});

jest.mock('lucide-react', () => ({
  Languages: ({ className, ...props }: any) => (
    <svg className={className} data-testid="mock-languages-icon" {...props} />
  )
}));

describe('LanguageSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      i18n: {
        language: 'en',
        changeLanguage: mockChangeLanguage
      },
      t: (key: string) => {
        const translations: { [key: string]: string } = {
          'language.switch': 'Switch Language',
          'language.french': 'French',
          'language.english': 'English'
        };
        return translations[key] || key;
      }
    });
  });

  it('should render the language selector button', () => {
    render(<LanguageSelector />);

    const button = screen.getByTestId('mock-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'Switch Language');
    expect(screen.getByTestId('mock-languages-icon')).toBeInTheDocument();
  });

  it('should show French option when current language is English', () => {
    render(<LanguageSelector />);

    expect(screen.getByText('French')).toBeInTheDocument();
  });

  it('should show English option when current language is French', () => {
    mockUseTranslation.mockReturnValue({
      i18n: {
        language: 'fr',
        changeLanguage: mockChangeLanguage
      },
      t: (key: string) => {
        const translations: { [key: string]: string } = {
          'language.switch': 'Changer de langue',
          'language.french': 'Français',
          'language.english': 'Anglais'
        };
        return translations[key] || key;
      }
    });

    render(<LanguageSelector />);

    expect(screen.getByText('Anglais')).toBeInTheDocument();
  });

  it('should call changeLanguage with French when current language is English', async () => {
    const user = userEvent.setup();
    render(<LanguageSelector />);

    const button = screen.getByTestId('mock-button');
    await user.click(button);

    expect(mockChangeLanguage).toHaveBeenCalledWith('fr');
  });

  it('should call changeLanguage with English when current language is French', async () => {
    mockUseTranslation.mockReturnValue({
      i18n: {
        language: 'fr',
        changeLanguage: mockChangeLanguage
      },
      t: (key: string) => {
        const translations: { [key: string]: string } = {
          'language.switch': 'Changer de langue',
          'language.french': 'Français',
          'language.english': 'Anglais'
        };
        return translations[key] || key;
      }
    });

    const user = userEvent.setup();
    render(<LanguageSelector />);

    const button = screen.getByTestId('mock-button');
    await user.click(button);

    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
  });

  it('should handle button click with fireEvent', () => {
    render(<LanguageSelector />);

    const button = screen.getByTestId('mock-button');
    fireEvent.click(button);

    expect(mockChangeLanguage).toHaveBeenCalledWith('fr');
  });

  it('should render with correct variant and gap classes', () => {
    render(<LanguageSelector />);

    const button = screen.getByTestId('mock-button');
    expect(button).toHaveAttribute('data-variant', 'outline');
    expect(button).toHaveClass('gap-2');
  });
});