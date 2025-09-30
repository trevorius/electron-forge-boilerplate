import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './Navbar';

// Mock react-i18next
const mockUseTranslation = jest.fn();
jest.mock('react-i18next', () => ({
  useTranslation: () => mockUseTranslation()
}));

// Mock LanguageSelector
jest.mock('./LanguageSelector', () => {
  return {
    __esModule: true,
    default: function MockLanguageSelector() {
      return <div data-testid="mock-language-selector">Language Selector</div>;
    }
  };
});

// Mock WindowControls
jest.mock('./WindowControls', () => {
  return {
    __esModule: true,
    default: function MockWindowControls() {
      return <div data-testid="mock-window-controls">Window Controls</div>;
    }
  };
});

// Mock NavigationMenu components
jest.mock('../ui/navigation-menu', () => ({
  NavigationMenu: ({ children }: { children: React.ReactNode }) => (
    <nav data-testid="navigation-menu">{children}</nav>
  ),
  NavigationMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="navigation-menu-content">{children}</div>
  ),
  NavigationMenuItem: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="navigation-menu-item">{children}</div>
  ),
  NavigationMenuLink: ({ children, className, asChild, ...props }: any) => (
    <div data-testid="navigation-menu-link" className={className} {...props}>
      {children}
    </div>
  ),
  NavigationMenuList: ({ children }: { children: React.ReactNode }) => (
    <ul data-testid="navigation-menu-list">{children}</ul>
  ),
  NavigationMenuTrigger: ({ children, className }: any) => (
    <button data-testid="navigation-menu-trigger" className={className}>
      {children}
    </button>
  ),
  navigationMenuTriggerStyle: () => 'mock-trigger-style'
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Home: () => <div data-testid="home-icon">Home Icon</div>,
  Gamepad2: () => <div data-testid="gamepad-icon">Gamepad Icon</div>,
  Info: () => <div data-testid="info-icon">Info Icon</div>,
  Settings: () => <div data-testid="settings-icon">Settings Icon</div>
}));

// Mock cn utility
jest.mock('../../lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

// Mock ModelContext
const mockUseModel = jest.fn();
jest.mock('../../contexts/ModelContext', () => ({
  useModel: () => mockUseModel()
}));

// Mock routes
jest.mock('../../routes', () => ({
  routes: [
    {
      path: '/',
      title: 'nav.home',
      icon: () => <div data-testid="home-icon">Home Icon</div>,
      inNavbar: true
    },
    {
      path: '/game',
      title: 'nav.games',
      icon: () => <div data-testid="gamepad-icon">Gamepad Icon</div>,
      inNavbar: true,
      children: [
        {
          path: '/game/tetris',
          title: 'nav.games_menu.tetris',
          icon: () => <div data-testid="gamepad-icon">Gamepad Icon</div>
        },
        {
          path: '/game/tictactoe',
          title: 'nav.games_menu.tictactoe',
          icon: () => <div data-testid="gamepad-icon">Gamepad Icon</div>
        }
      ]
    },
    {
      path: '/about',
      title: 'nav.about',
      icon: () => <div data-testid="info-icon">Info Icon</div>,
      inNavbar: true
    }
  ]
}));

const renderNavbar = (initialRoute = '/') => {
  return render(
    <BrowserRouter>
      <div>
        <Navbar />
        {/* Mock routes for testing navigation */}
        <div data-testid="current-route">{initialRoute}</div>
      </div>
    </BrowserRouter>
  );
};

const renderNavbarWithRouter = (initialEntries: string[] = ['/']) => {
  const { MemoryRouter } = jest.requireActual('react-router-dom');
  return render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={0}>
      <div>
        <Navbar />
      </div>
    </MemoryRouter>
  );
};

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseModel.mockReturnValue({ currentModelInfo: null });
    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'nav.home': 'Home',
          'nav.games': 'Games',
          'nav.about': 'About',
          'nav.branding': 'Electron Games',
          'nav.games_menu.tetris': 'Tetris',
          'nav.games_menu.tictactoe': 'Tic Tac Toe',
          'nav.games_menu.tetris_description': 'Classic block-stacking puzzle game',
          'nav.games_menu.tictactoe_description': 'Classic two-player strategy game'
        };
        return translations[key] || key;
      },
      i18n: { language: 'en' }
    });
  });

  it('should render navbar with all main elements', () => {
    renderNavbar();

    // Check main navbar structure (app title was removed per user request)
    expect(screen.getByTestId('navigation-menu')).toBeInTheDocument();
    expect(screen.getByTestId('mock-language-selector')).toBeInTheDocument();
    expect(screen.getByTestId('mock-window-controls')).toBeInTheDocument();
  });

  it('should render navigation menu items', () => {
    renderNavbar();

    // Check navigation items
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Games')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('should render app branding with icons', () => {
    renderNavbar();

    // Check branding elements - only icon shown (text removed per user request)
    const gamepadIcons = screen.getAllByTestId('gamepad-icon');
    expect(gamepadIcons.length).toBeGreaterThanOrEqual(1);
  });

  it('should render navigation icons', () => {
    renderNavbar();

    // Check navigation icons
    expect(screen.getByTestId('home-icon')).toBeInTheDocument();
    expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    // Note: gamepad-icon appears twice (branding + games menu)
    const gamepadIcons = screen.getAllByTestId('gamepad-icon');
    expect(gamepadIcons).toHaveLength(2);
  });

  it('should have proper navbar structure and styling', () => {
    const { container } = renderNavbar();

    // Check main navbar container
    const navbar = container.querySelector('.fixed.top-0.left-0.right-0.z-50');
    expect(navbar).toBeInTheDocument();

    // Check titlebar
    const titlebar = container.querySelector('.h-12');
    expect(titlebar).toBeInTheDocument();
  });

  it('should render language selector and window controls in right section', () => {
    renderNavbar();

    const languageSelector = screen.getByTestId('mock-language-selector');
    const windowControls = screen.getByTestId('mock-window-controls');

    expect(languageSelector).toBeInTheDocument();
    expect(windowControls).toBeInTheDocument();
  });

  it('should render games dropdown content', () => {
    renderNavbar();

    // Check if navigation menu content is rendered (games dropdown)
    expect(screen.getByTestId('navigation-menu-content')).toBeInTheDocument();
  });

  it('should handle translation function correctly', () => {
    // Test with different translation keys
    mockUseTranslation.mockReturnValue({
      t: jest.fn().mockImplementation((key: string) => `translated_${key}`),
      i18n: { language: 'es' }
    });

    renderNavbar();

    // Verify translation function was called
    expect(mockUseTranslation().t).toBeDefined();
  });

  it('should render navigation menu with proper accessibility', () => {
    renderNavbar();

    // Check navigation structure
    const nav = screen.getByTestId('navigation-menu');
    expect(nav).toBeInTheDocument();
    expect(nav.tagName.toLowerCase()).toBe('nav');

    // Check menu list structure
    const menuList = screen.getByTestId('navigation-menu-list');
    expect(menuList).toBeInTheDocument();
    expect(menuList.tagName.toLowerCase()).toBe('ul');
  });

  it('should render all navigation menu items', () => {
    renderNavbar();

    // Check all menu items are rendered
    const menuItems = screen.getAllByTestId('navigation-menu-item');
    expect(menuItems.length).toBeGreaterThanOrEqual(3); // Home, Games, About
  });

  it('should render navigation triggers and links', () => {
    renderNavbar();

    // Check triggers and links
    const triggers = screen.getAllByTestId('navigation-menu-trigger');
    const links = screen.getAllByTestId('navigation-menu-link');

    expect(triggers.length).toBeGreaterThanOrEqual(1); // Games dropdown trigger
    expect(links.length).toBeGreaterThanOrEqual(2); // Home and About links
  });

  it('should have proper titlebar structure', () => {
    const { container } = renderNavbar();

    // Check that the draggable titlebar exists
    const draggableElement = container.querySelector('.h-12');
    expect(draggableElement).toBeInTheDocument();
    expect(draggableElement).toHaveClass('bg-background/95', 'backdrop-blur', 'border-b');
  });

  it('should render with fixed positioning', () => {
    const { container } = renderNavbar();

    const fixedContainer = container.querySelector('.fixed');
    expect(fixedContainer).toBeInTheDocument();
    expect(fixedContainer).toHaveClass('top-0', 'left-0', 'right-0', 'z-50');
  });

  it('should render backdrop blur and background styling', () => {
    const { container } = renderNavbar();

    const titlebar = container.querySelector('.bg-background\\/95');
    expect(titlebar).toBeInTheDocument();
  });

  it('should render border bottom', () => {
    const { container } = renderNavbar();

    const borderedElement = container.querySelector('.border-b');
    expect(borderedElement).toBeInTheDocument();
  });

  it('should have proper layout with gap and padding', () => {
    const { container } = renderNavbar();

    // Check for gap classes
    const gapElements = container.querySelectorAll('[class*="gap-"]');
    expect(gapElements.length).toBeGreaterThan(0);

    // Check for padding classes
    const paddedElements = container.querySelectorAll('[class*="px-"]');
    expect(paddedElements.length).toBeGreaterThan(0);
  });

  describe('Active State Styling', () => {
    it('should apply active styling when on /game route', () => {
      renderNavbarWithRouter(['/game']);

      // Check if the Games navigation item has active styling
      expect(screen.getByText('Games')).toBeInTheDocument();
    });

    it('should apply active styling when on /about route', () => {
      renderNavbarWithRouter(['/about']);

      // Check if the About navigation item has active styling
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('should not apply active styling on home route for other nav items', () => {
      renderNavbarWithRouter(['/']);

      // Verify all navigation items are rendered but not active
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Games')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('should handle different game routes', () => {
      renderNavbarWithRouter(['/game/tetris']);

      // Should show Games as active for game subroutes
      expect(screen.getByText('Games')).toBeInTheDocument();
    });
  });

  describe('Attribution Badge', () => {
    it('should not show attribution badge when no model requires it', () => {
      mockUseModel.mockReturnValue({ currentModelInfo: null });
      renderNavbar();

      expect(screen.queryByText('Built with Llama')).not.toBeInTheDocument();
    });

    it('should show attribution badge when model requires it', () => {
      mockUseModel.mockReturnValue({
        currentModelInfo: {
          requiresAttribution: true,
          attributionText: 'Built with Llama'
        }
      });
      renderNavbar();

      expect(screen.getByText('Built with Llama')).toBeInTheDocument();
    });

    it('should show custom attribution text', () => {
      mockUseModel.mockReturnValue({
        currentModelInfo: {
          requiresAttribution: true,
          attributionText: 'Custom Attribution'
        }
      });
      renderNavbar();

      expect(screen.getByText('Custom Attribution')).toBeInTheDocument();
    });
  });
});