import React from 'react';
import { render, screen } from '@testing-library/react';
import About from './About';

// Mock react-i18next
const mockUseTranslation = jest.fn();
jest.mock('react-i18next', () => ({
  useTranslation: () => mockUseTranslation()
}));

// Mock package.json
const mockPackageInfo = {
  version: '0.0.0',
  author: 'trev-z-dev',
  license: 'MIT'
};

jest.doMock('../../../../package.json', () => mockPackageInfo, { virtual: true });

// Mock the UI components
jest.mock('../ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} data-testid="mock-card" {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={className} data-testid="mock-card-header" {...props}>{children}</div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 className={className} data-testid="mock-card-title" {...props}>{children}</h3>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={className} data-testid="mock-card-content" {...props}>{children}</div>
  )
}));

// Mock LanguageSelector
jest.mock('../common/LanguageSelector', () => {
  return {
    __esModule: true,
    default: function MockLanguageSelector() {
      return <div data-testid="mock-language-selector">Language Selector</div>;
    }
  };
});

describe('About', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: { [key: string]: string } = {
          'about.title': 'About',
          'about.description': 'A boilerplate React Electron app with ShadcnUI and Tailwind integrated. TypeScript, Jest tested.',
          'about.version': 'Version',
          'about.author': 'Author',
          'about.license': 'License'
        };
        return translations[key] || key;
      }
    });
  });

  it('should render with correct background styling', () => {
    const { container } = render(<About />);

    const aboutDiv = container.firstChild as HTMLElement;
    expect(aboutDiv).toBeInTheDocument();
    expect(aboutDiv).toHaveClass(
      'min-h-screen',
      'bg-gradient-to-br',
      'from-slate-900',
      'to-slate-800',
      'flex',
      'items-center',
      'justify-center',
      'p-4'
    );
  });

  it('should render the about card with correct structure', () => {
    render(<About />);

    expect(screen.getByTestId('mock-card')).toBeInTheDocument();
    expect(screen.getByTestId('mock-card-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-card-title')).toBeInTheDocument();
    expect(screen.getByTestId('mock-card-content')).toBeInTheDocument();
    expect(screen.getByTestId('mock-language-selector')).toBeInTheDocument();
  });

  it('should display translated about title', () => {
    render(<About />);

    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('should display translated description', () => {
    render(<About />);

    expect(screen.getByText('A boilerplate React Electron app with ShadcnUI and Tailwind integrated. TypeScript, Jest tested.')).toBeInTheDocument();
  });

  it('should display package information with translations', () => {
    render(<About />);

    expect(screen.getByText('Version:')).toBeInTheDocument();
    expect(screen.getByText('0.0.0')).toBeInTheDocument();
    expect(screen.getByText('Author:')).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByText('License:')).toBeInTheDocument();
    expect(screen.getByText('MIT')).toBeInTheDocument();
  });

  it('should have correct card styling', () => {
    render(<About />);

    const card = screen.getByTestId('mock-card');
    expect(card).toHaveClass(
      'w-full',
      'max-w-lg',
      'mx-auto',
      'bg-white/95',
      'dark:bg-slate-900/95',
      'backdrop-blur'
    );
  });

  it('should have correct title styling', () => {
    render(<About />);

    const title = screen.getByTestId('mock-card-title');
    expect(title).toHaveClass(
      'text-3xl',
      'font-bold',
      'bg-gradient-to-r',
      'from-blue-500',
      'to-purple-500',
      'bg-clip-text',
      'text-transparent'
    );
  });

  it('should render language selector in header', () => {
    render(<About />);

    const header = screen.getByTestId('mock-card-header');
    const languageSelector = screen.getByTestId('mock-language-selector');

    expect(header).toContainElement(languageSelector);
  });
});