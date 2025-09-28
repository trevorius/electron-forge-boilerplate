import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LicenseModal from './LicenseModal';

// Mock react-i18next
const mockUseTranslation = jest.fn();
jest.mock('react-i18next', () => ({
  useTranslation: () => mockUseTranslation()
}));

// Mock the UI components
jest.mock('../ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, ...props }: any) => (
    <button
      onClick={onClick}
      className={className}
      data-testid="mock-button"
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  )
}));

jest.mock('../ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) => (
    <div data-testid="mock-dialog" data-open={open}>
      {open && (
        <>
          {children}
          <div onClick={() => onOpenChange && onOpenChange(false)} data-testid="dialog-overlay" />
        </>
      )}
    </div>
  ),
  DialogContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="mock-dialog-content" className={className}>
      {children}
    </div>
  ),
  DialogHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="mock-dialog-header" className={className}>
      {children}
    </div>
  ),
  DialogTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 data-testid="mock-dialog-title" className={className}>
      {children}
    </h2>
  )
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  X: ({ className, ...props }: any) => (
    <div data-testid="mock-x-icon" className={className} {...props}>X</div>
  )
}));

const mockOnClose = jest.fn();

describe('LicenseModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: { [key: string]: string } = {
          'license.title': 'License',
          'license.close': 'Close',
          'license.content': 'MIT License\n\nCopyright (c) 2025 trev-z-dev\n\nPermission is hereby granted...'
        };
        return translations[key] || key;
      }
    });
  });

  it('should render dialog when open is true', () => {
    render(<LicenseModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByTestId('mock-dialog')).toHaveAttribute('data-open', 'true');
    expect(screen.getByTestId('mock-dialog-content')).toBeInTheDocument();
    expect(screen.getByTestId('mock-dialog-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-dialog-title')).toBeInTheDocument();
  });

  it('should not render dialog content when open is false', () => {
    render(<LicenseModal isOpen={false} onClose={mockOnClose} />);

    expect(screen.getByTestId('mock-dialog')).toHaveAttribute('data-open', 'false');
    expect(screen.queryByTestId('mock-dialog-content')).not.toBeInTheDocument();
  });

  it('should display license title', () => {
    render(<LicenseModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('License')).toBeInTheDocument();
  });

  it('should display license content', () => {
    render(<LicenseModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/MIT License/)).toBeInTheDocument();
    expect(screen.getByText(/Copyright \(c\) 2025 trev-z-dev/)).toBeInTheDocument();
  });

  it('should render close buttons', () => {
    render(<LicenseModal isOpen={true} onClose={mockOnClose} />);

    // One text "Close" button in footer
    const textCloseButtons = screen.getAllByText('Close');
    expect(textCloseButtons).toHaveLength(1);

    // Header has icon button (X icon, no text)
    expect(screen.getByTestId('mock-x-icon')).toBeInTheDocument();

    // Total of 2 clickable buttons
    const allButtons = screen.getAllByTestId('mock-button');
    expect(allButtons).toHaveLength(2);
  });

  it('should render X icon in header close button', () => {
    render(<LicenseModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByTestId('mock-x-icon')).toBeInTheDocument();
  });

  it('should call onClose when header close button is clicked', async () => {
    const user = userEvent.setup();
    render(<LicenseModal isOpen={true} onClose={mockOnClose} />);

    // Header close button is the one with X icon (no text)
    const allButtons = screen.getAllByTestId('mock-button');
    const headerCloseButton = allButtons[0]; // First button is in header

    await user.click(headerCloseButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when footer close button is clicked', async () => {
    const user = userEvent.setup();
    render(<LicenseModal isOpen={true} onClose={mockOnClose} />);

    // Footer close button has "Close" text
    const footerCloseButton = screen.getByText('Close');

    await user.click(footerCloseButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when dialog overlay is clicked', async () => {
    const user = userEvent.setup();
    render(<LicenseModal isOpen={true} onClose={mockOnClose} />);

    const overlay = screen.getByTestId('dialog-overlay');
    await user.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should handle close actions with fireEvent', () => {
    render(<LicenseModal isOpen={true} onClose={mockOnClose} />);

    const footerCloseButton = screen.getByText('Close');
    fireEvent.click(footerCloseButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should have correct styling classes', () => {
    render(<LicenseModal isOpen={true} onClose={mockOnClose} />);

    const content = screen.getByTestId('mock-dialog-content');
    expect(content).toHaveClass('max-w-2xl', 'max-h-[80vh]', 'overflow-hidden', 'flex', 'flex-col');

    const title = screen.getByTestId('mock-dialog-title');
    expect(title).toHaveClass('text-2xl', 'font-bold');
  });
});