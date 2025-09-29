# Routes and Pages Architecture Guide

This document provides comprehensive guidance on implementing routes and pages in the Electron React Boilerplate. It covers the type-safe routing system, component organization, and best practices for adding new pages.

← [Back to README](/README.md)

## Table of Contents

1. [Routing System Overview](#routing-system-overview)
2. [Route Definition Structure](#route-definition-structure)
3. [Component Organization](#component-organization)
4. [Adding New Routes](#adding-new-routes)
5. [Navigation Integration](#navigation-integration)
6. [Internationalization in Routes](#internationalization-in-routes)
7. [Best Practices](#best-practices)

## Routing System Overview

The application uses a centralized, type-safe routing system defined in `src/react/routes.tsx`. This approach provides:

- **Type Safety**: Full TypeScript support for route definitions
- **Centralized Configuration**: All routes defined in one location
- **Icon Integration**: Lucide icons for each route
- **i18n Support**: Internationalized route titles
- **Nested Routes**: Support for child routes and sub-navigation
- **Navbar Integration**: Automatic navbar generation from route configuration

### Key Features

```typescript
export interface Route {
  path: string;                    // URL path
  component: React.ComponentType;  // React component to render
  title: string;                   // i18n key for the title
  icon: LucideIcon;               // Lucide icon component
  exact?: boolean;                // Exact path matching
  children?: Route[];             // Nested routes
  inNavbar?: boolean;             // Show in navigation bar
}
```

## Route Definition Structure

### Basic Route

```typescript
{
  path: '/about',
  component: About,
  title: 'nav.about',
  icon: Info,
  inNavbar: true
}
```

### Route with Children

```typescript
{
  path: '/game',
  component: Game,
  title: 'nav.games',
  icon: Gamepad2,
  inNavbar: true,
  children: [
    {
      path: '/game/tetris',
      component: Tetris,
      title: 'nav.games_menu.tetris',
      icon: Gamepad2,
      inNavbar: false
    }
  ]
}
```

### Home Route (Exact Matching)

```typescript
{
  path: '/',
  component: Game,
  title: 'nav.home',
  icon: Home,
  exact: true,
  inNavbar: true
}
```

## Component Organization

Components are organized by purpose in the `src/react/components/` directory:

```
src/react/components/
├── common/              # Shared components across the app
│   ├── LanguageSelector.tsx
│   ├── Navbar.tsx
│   ├── Navigation.tsx
│   └── WindowControls.tsx
├── game/                # Game-specific components
│   ├── HighScores.tsx
│   ├── Tetris.tsx
│   ├── Tetris.helpers.tsx
│   └── TicTacToe.tsx
├── layout/              # Layout and page components
│   ├── About.tsx
│   └── Game.tsx
├── license/             # License-related components
│   ├── LicenseApp.tsx
│   └── LicenseApp.helpers.tsx
└── ui/                  # ShadcnUI components
    ├── button.tsx
    ├── card.tsx
    └── dialog.tsx
```

### Component Categories

- **Layout Components** (`layout/`): Top-level page components that define page structure
- **Game Components** (`game/`): Interactive game implementations with helpers
- **Common Components** (`common/`): Reusable components used across multiple pages
- **UI Components** (`ui/`): Base UI primitives from ShadcnUI

## Adding New Routes

### Step 1: Create the Component

Create your new component in the appropriate directory:

```typescript
// src/react/components/layout/Settings.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/card';

const Settings: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">
          {t('settings.title')}
        </h1>
        <Card className="p-6">
          {/* Your settings content */}
        </Card>
      </div>
    </div>
  );
};

export default Settings;
```

### Step 2: Add i18n Keys

Add internationalization keys to all supported languages:

```json
// src/react/locales/en/nav.json
{
  "settings": "Settings"
}

// src/react/locales/en/settings.json
{
  "title": "Application Settings"
}
```

### Step 3: Define the Route

Add the route to `src/react/routes.tsx`:

```typescript
import { Settings } from 'lucide-react';
import Settings from './components/layout/Settings';

export const routes: Route[] = [
  // ... existing routes
  {
    path: '/settings',
    component: Settings,
    title: 'nav.settings',
    icon: Settings,
    inNavbar: true
  }
];
```

### Step 4: Create Tests

Create comprehensive tests for your component:

```typescript
// src/react/components/layout/Settings.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import Settings from './Settings';
import { renderWithI18n } from '../../__mocks__/test-utils';

describe('Settings', () => {
  test('renders settings page with title', () => {
    renderWithI18n(<Settings />);
    expect(screen.getByText('Application Settings')).toBeInTheDocument();
  });

  test('renders settings card', () => {
    renderWithI18n(<Settings />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
```

## Navigation Integration

Routes are automatically integrated into the navigation system through the `Navigation.tsx` component. The navigation system:

1. **Filters Routes**: Only shows routes with `inNavbar: true`
2. **Renders Icons**: Uses the specified Lucide icon for each route
3. **Handles i18n**: Translates route titles using the i18n key
4. **Supports Dropdowns**: Creates dropdown menus for routes with children

### Navigation Component Integration

```typescript
// src/react/components/common/Navigation.tsx
const Navigation: React.FC = () => {
  const { t } = useTranslation();

  return (
    <nav className="flex space-x-4">
      {routes
        .filter(route => route.inNavbar)
        .map(route => (
          <NavItem
            key={route.path}
            path={route.path}
            title={t(route.title)}
            icon={route.icon}
            children={route.children}
          />
        ))}
    </nav>
  );
};
```

## Internationalization in Routes

All route titles use i18n keys for multi-language support:

### Naming Convention

- **Navigation Keys**: `nav.{route_name}`
- **Nested Routes**: `nav.{parent}.{child}`
- **Component Content**: `{component_name}.{key}`

### Example i18n Structure

```json
// English (en/nav.json)
{
  "home": "Home",
  "games": "Games",
  "games_menu": {
    "tetris": "Tetris",
    "tictactoe": "Tic Tac Toe"
  },
  "about": "About",
  "settings": "Settings"
}

// French (fr/nav.json)
{
  "home": "Accueil",
  "games": "Jeux",
  "games_menu": {
    "tetris": "Tetris",
    "tictactoe": "Morpion"
  },
  "about": "À propos",
  "settings": "Paramètres"
}
```

## Best Practices

### 1. Component Structure

```typescript
// Always follow this structure for new page components
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/card';

const ComponentName: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">
          {t('component.title')}
        </h1>
        {/* Component content */}
      </div>
    </div>
  );
};

export default ComponentName;
```

### 2. Route Organization

- **Layout Components**: Use for top-level pages (`/about`, `/settings`)
- **Game Components**: Use for interactive games (`/game/tetris`)
- **Nested Routes**: Group related functionality under parent routes

### 3. Icon Selection

Choose appropriate [Lucide icons](https://lucide.dev/) that represent the functionality:

```typescript
import {
  Home,      // Home page
  Info,      // About/Information
  Gamepad2,  // Games
  Settings,  // Settings/Configuration
  User,      // Profile/User
  FileText   // Documents/Reports
} from 'lucide-react';
```

### 4. Testing Requirements

- **Component Rendering**: Test that components render without errors
- **i18n Integration**: Verify internationalized text appears correctly
- **Navigation**: Test that routes are accessible through navigation
- **Accessibility**: Ensure proper heading structure and ARIA labels

### 5. Performance Considerations

- **Code Splitting**: Use dynamic imports for large components
- **Lazy Loading**: Implement lazy loading for routes with heavy content
- **Memoization**: Use `React.memo` for components that don't change frequently

```typescript
// Example of lazy loading for performance
import { lazy, Suspense } from 'react';

const Tetris = lazy(() => import('./components/game/Tetris'));

// In route definition
{
  path: '/game/tetris',
  component: () => (
    <Suspense fallback={<div>Loading...</div>}>
      <Tetris />
    </Suspense>
  ),
  title: 'nav.games_menu.tetris',
  icon: Gamepad2,
  inNavbar: false
}
```

## Framework Integration

### React Router Integration

The routes are integrated with React Router in `App.tsx`:

```typescript
// src/react/App.tsx
import { Routes, Route } from 'react-router-dom';
import routes from './routes';

function App() {
  return (
    <Routes>
      {routes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={<route.component />}
          {...(route.exact && { exact: route.exact })}
        />
      ))}
    </Routes>
  );
}
```

### Electron Window Integration

Routes work seamlessly with Electron's window management:

- **Deep Linking**: URLs are preserved when refreshing the app
- **Window State**: Navigation state is maintained across window operations
- **Menu Integration**: Routes can be triggered from Electron's native menu

← [Back to README](/README.md)