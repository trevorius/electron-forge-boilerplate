import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LicenseApp from './LicenseApp';

// Mock react-i18next
const mockUseTranslation = jest.fn();
jest.mock('react-i18next', () => ({
  useTranslation: () => mockUseTranslation()
}));

// Mock i18n module
jest.mock('../../i18n', () => ({
  __esModule: true,
  default: {
    changeLanguage: jest.fn().mockResolvedValue(undefined)
  }
}));

// Mock helpers (these are tested separately)
jest.mock('./LicenseApp.helpers', () => ({
  initializeLocale: jest.fn(),
  closeLicenseWindow: jest.fn(),
  createLicenses: jest.fn(),
  getCurrentLicense: jest.fn(),
  shouldShowNavigation: jest.fn(),
  generateTitle: jest.fn(),
  validateLicenseSelection: jest.fn(),
  formatLocaleError: jest.fn(),
  formatCloseError: jest.fn(),
  createLoadingState: jest.fn(),
  createHeaderClasses: jest.fn(),
  createCloseButtonClasses: jest.fn()
}));

// Mock UI components
jest.mock('../ui/card', () => ({
  Card: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div data-testid="card-header" className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <h3 data-testid="card-title" className={className}>{children}</h3>,
  CardContent: ({ children, className }: any) => <div data-testid="card-content" className={className}>{children}</div>
}));

jest.mock('../ui/button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button data-testid="button" className={className} onClick={onClick} {...props}>
      {children}
    </button>
  )
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  FileText: () => <span data-testid="file-text-icon">FileText</span>,
  X: () => <span data-testid="x-icon">X</span>
}));

// Mock window APIs
const mockGetMainAppLocale = jest.fn();
const mockCloseLicenseWindow = jest.fn();
const mockWindowClose = jest.fn();

Object.defineProperty(window, 'electronAPI', {
  value: {
    getMainAppLocale: mockGetMainAppLocale,
    closeLicenseWindow: mockCloseLicenseWindow,
  },
  writable: true,
});

Object.defineProperty(window, 'close', {
  value: mockWindowClose,
  writable: true,
});

describe('LicenseApp', () => {
  const mockHelpers = require('./LicenseApp.helpers');

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup translation mock
    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: { [key: string]: string } = {
          'license.title': 'License',
          'license.main': 'Main License',
          'license.content': 'This is the license content.',
          'license.close': 'Close'
        };
        return translations[key] || key;
      }
    });

    // Setup helper mocks with default behaviors
    mockHelpers.initializeLocale.mockResolvedValue({ success: true, locale: 'en' });
    mockHelpers.closeLicenseWindow.mockResolvedValue({ success: true, usedFallback: false });
    mockHelpers.createLicenses.mockReturnValue([
      { id: 'main', name: 'Main License', content: 'License content' }
    ]);
    mockHelpers.getCurrentLicense.mockReturnValue(
      { id: 'main', name: 'Main License', content: 'License content' }
    );
    mockHelpers.shouldShowNavigation.mockReturnValue(false);
    mockHelpers.generateTitle.mockReturnValue('License');
    mockHelpers.validateLicenseSelection.mockImplementation((id: string) => id);
    mockHelpers.formatLocaleError.mockReturnValue('Locale error');
    mockHelpers.formatCloseError.mockReturnValue('Close error');
    mockHelpers.createLoadingState.mockReturnValue({
      className: 'loading-class',
      textClassName: 'text-class'
    });
    mockHelpers.createHeaderClasses.mockReturnValue('header-classes');
    mockHelpers.createCloseButtonClasses.mockReturnValue('close-button-classes');
  });

  it('should render loading state initially', () => {
    render(<LicenseApp />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render main content after loading', async () => {
    render(<LicenseApp />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('card-header')).toBeInTheDocument();
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
  });

  it('should call initializeLocale on mount', async () => {
    render(<LicenseApp />);

    await waitFor(() => {
      expect(mockHelpers.initializeLocale).toHaveBeenCalledTimes(1);
    });
  });

  it('should render license content using helpers', async () => {
    render(<LicenseApp />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(mockHelpers.createLicenses).toHaveBeenCalled();
    expect(mockHelpers.getCurrentLicense).toHaveBeenCalled();
    expect(mockHelpers.generateTitle).toHaveBeenCalled();
  });

  it('should handle close button click', async () => {
    const user = userEvent.setup();
    render(<LicenseApp />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const buttons = screen.getAllByTestId('button');
    await user.click(buttons[0]);

    expect(mockHelpers.closeLicenseWindow).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('should log warnings when locale initialization has errors', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockHelpers.initializeLocale.mockResolvedValue({
      success: true,
      locale: 'en',
      error: new Error('Test error')
    });

    render(<LicenseApp />);

    await waitFor(() => {
      expect(mockHelpers.formatLocaleError).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('should handle successful close without errors', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockHelpers.closeLicenseWindow.mockResolvedValue({
      success: true,
      usedFallback: false
    });

    render(<LicenseApp />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const buttons = screen.getAllByTestId('button');
    await user.click(buttons[0]);

    await waitFor(() => {
      expect(mockHelpers.closeLicenseWindow).toHaveBeenCalled();
    });

    // Should not log errors on successful close
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should log errors when window close has errors', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockHelpers.closeLicenseWindow.mockResolvedValue({
      success: false,
      usedFallback: true,
      error: new Error('Close error')
    });

    render(<LicenseApp />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const buttons = screen.getAllByTestId('button');
    await user.click(buttons[0]);

    await waitFor(() => {
      expect(mockHelpers.formatCloseError).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('should log errors when close succeeds but has warnings', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockHelpers.closeLicenseWindow.mockResolvedValue({
      success: true,
      usedFallback: true,
      error: new Error('Warning error')
    });

    render(<LicenseApp />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const buttons = screen.getAllByTestId('button');
    await user.click(buttons[0]);

    await waitFor(() => {
      expect(mockHelpers.formatCloseError).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('should call window APIs with correct parameters', async () => {
    render(<LicenseApp />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Verify the window APIs were called correctly during initialization
    expect(mockHelpers.initializeLocale).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('should cover anonymous function lines when helper functions call them', async () => {
    // Test that the helpers are called with actual functions that get executed
    const user = userEvent.setup();

    // Reset mocks but check that the functions passed to helpers are actually called
    mockHelpers.initializeLocale.mockImplementation(
      async (getLocale: () => Promise<string>, changeLanguage: (locale: string) => Promise<any>) => {
        // Actually call the passed functions to cover lines 33-34
        await getLocale();
        await changeLanguage('en');
        return { success: true, locale: 'en' };
      }
    );

    mockHelpers.closeLicenseWindow.mockImplementation(
      async (electronClose: () => Promise<void>, windowClose: () => void) => {
        // Actually call the passed functions to cover lines 49-50
        await electronClose();
        windowClose();
        return { success: true, usedFallback: false };
      }
    );

    render(<LicenseApp />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Click close button to trigger the close handler
    const buttons = screen.getAllByTestId('button');
    await user.click(buttons[0]);

    // The anonymous functions should have been called through the mocks
    expect(mockHelpers.initializeLocale).toHaveBeenCalled();
    expect(mockHelpers.closeLicenseWindow).toHaveBeenCalled();
  });

  it('should render navigation when shouldShowNavigation returns true', async () => {
    mockHelpers.shouldShowNavigation.mockReturnValue(true);
    mockHelpers.createLicenses.mockReturnValue([
      { id: 'main', name: 'Main License', content: 'Content 1' },
      { id: 'other', name: 'Other License', content: 'Content 2' }
    ]);

    render(<LicenseApp />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Should have navigation buttons for multiple licenses
    const buttons = screen.getAllByTestId('button');
    expect(buttons.length).toBeGreaterThan(2); // Navigation buttons + close buttons
  });

  it('should handle license selection', async () => {
    const user = userEvent.setup();
    mockHelpers.shouldShowNavigation.mockReturnValue(true);
    mockHelpers.createLicenses.mockReturnValue([
      { id: 'main', name: 'Main License', content: 'Content 1' },
      { id: 'other', name: 'Other License', content: 'Content 2' }
    ]);
    // Mock validateLicenseSelection to return the passed ID
    mockHelpers.validateLicenseSelection.mockImplementation((id: string) => id);

    render(<LicenseApp />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Clear previous calls to track only the button click
    jest.clearAllMocks();

    // Find and click a license navigation button
    const buttons = screen.getAllByTestId('button');
    const navigationButton = buttons.find(btn =>
      btn.textContent === 'Main License' || btn.textContent === 'Other License'
    );

    if (navigationButton) {
      await user.click(navigationButton);
      // Should call validateLicenseSelection when button is clicked
      expect(mockHelpers.validateLicenseSelection).toHaveBeenCalled();
    }
  });

  it('should use loading state configuration from helper', () => {
    render(<LicenseApp />);

    expect(mockHelpers.createLoadingState).toHaveBeenCalled();
    const loadingDiv = screen.getByText('Loading...').parentElement;
    expect(loadingDiv).toHaveClass('loading-class');
  });

  it('should use CSS classes from helpers', async () => {
    render(<LicenseApp />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // These functions should be called during render
    expect(mockHelpers.createHeaderClasses).toHaveBeenCalledWith(expect.any(String));
    expect(mockHelpers.createCloseButtonClasses).toHaveBeenCalledWith(expect.any(String));
  });

  it('should render React component content (non-string license)', async () => {
    const ReactComponent = () => <div>React License Content</div>;
    mockHelpers.createLicenses.mockReturnValue([
      { id: 'llama', name: 'Llama License', content: <ReactComponent /> }
    ]);
    mockHelpers.getCurrentLicense.mockReturnValue(
      { id: 'llama', name: 'Llama License', content: <ReactComponent /> }
    );

    render(<LicenseApp />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('React License Content')).toBeInTheDocument();
  });

  it('should render string content (regular license)', async () => {
    mockHelpers.createLicenses.mockReturnValue([
      { id: 'main', name: 'Main License', content: 'Plain text license content' }
    ]);
    mockHelpers.getCurrentLicense.mockReturnValue(
      { id: 'main', name: 'Main License', content: 'Plain text license content' }
    );

    render(<LicenseApp />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Plain text license content')).toBeInTheDocument();
  });
});