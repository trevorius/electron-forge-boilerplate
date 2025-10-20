# Electron React Boilerplate

A modern, feature-rich Electron application boilerplate with React, TypeScript, ShadcnUI, and Tailwind CSS integration. This project provides a solid foundation for building cross-platform desktop applications with comprehensive testing and development workflows.

- [Electron React Boilerplate](#electron-react-boilerplate)
  - [🚀 Features](#-features)
  - [📦 Installation](#-installation)
  - [🛠️ Development](#️-development)
    - [Start Development Server](#start-development-server)
    - [Available Scripts](#available-scripts)
  - [🏗️ Project Structure](#️-project-structure)
  - [🎮 Built-in Games](#-built-in-games)
    - [Tetris](#tetris)
    - [TicTacToe](#tictactoe)
  - [🧪 Testing](#-testing)
    - [Test Coverage Strategy](#test-coverage-strategy)
    - [Running Tests](#running-tests)
  - [⚡ Adding Features](#-adding-features)
    - [📄 Documentation Guides](#-documentation-guides)
    - [🎯 Feature Development Workflow](#-feature-development-workflow)
    - [📋 Quick Reference](#-quick-reference)
  - [🌍 Internationalization](#-internationalization)
  - [📱 Distribution](#-distribution)
    - [Supported Platforms](#supported-platforms)
    - [Building for Distribution](#building-for-distribution)
  - [🛠️ Technology Stack](#️-technology-stack)
    - [Core Technologies](#core-technologies)
    - [UI \& Styling](#ui--styling)
    - [Development Tools](#development-tools)
  - [📝 Configuration Files](#-configuration-files)
  - [🤝 Contributing](#-contributing)
  - [📄 License](#-license)
  - [👨‍💻 Author](#-author)
  - [🔗 Links](#-links)

## 🚀 Features

- **Electron** - Cross-platform desktop app framework
- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **ShadcnUI** - Beautiful, accessible component library
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and development server
- **Jest** - Comprehensive testing framework
- **i18next** - Internationalization support
- **React Router** - Client-side routing
- **Lucide Icons** - Beautiful icon library

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/trev-z-dev/electron-boilerplate.git
cd electron-boilerplate

# Install dependencies
npm install
```

## 🛠️ Development

### Start Development Server

```bash
# Start both Vite dev server and Electron in development mode
npm run dev

# Or start individually:
npm run dev:vite    # Start Vite dev server only
npm run dev:electron # Start Electron only (requires Vite server running)
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Electron using Electron Forge |
| `npm run dev` | Start development environment (Vite + Electron) |
| `npm run build` | Build the React application for production |
| `npm run preview` | Preview the production build |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run package` | Package the application |
| `npm run make` | Create distribution packages |
| `npm run publish` | Publish the application |

## 🏗️ Project Structure

``` text
src/
├── electron/           # Electron main process files
│   ├── main.js        # Main Electron process
│   └── preload.js     # Preload script
└── react/             # React application
    ├── components/    # React components
    │   ├── common/    # Shared components
    │   ├── game/      # Game components (TicTacToe, Tetris)
    │   ├── layout/    # Layout components
    │   └── ui/        # ShadcnUI components
    ├── lib/           # Utility libraries
    ├── locales/       # i18n translation files
    ├── styles/        # Global styles
    ├── __mocks__/     # Jest mocks
    ├── App.tsx        # Main App component
    ├── routes.tsx     # Route definitions
    └── index.tsx      # React entry point
```

## 🎮 Built-in Games

This boilerplate includes two fully-featured games to demonstrate the capabilities:

### Tetris

- Complete Tetris implementation with scoring, levels, and line clearing
- Comprehensive test coverage (99%+)
- Documented architecture in [`Tetris.doc.md`](src/react/components/game/Tetris.doc.md)
- Keyboard controls: Arrow keys for movement, Space for hard drop, P for pause

### TicTacToe

- Classic 3x3 grid game
- Player vs Player gameplay
- Win detection and game reset functionality

## 🧪 Testing

The project maintains high test coverage standards:

- **Coverage Target**: 99%+
- **Testing Strategy**: Unit tests, integration tests, and mocked component tests
- **Framework**: Jest with React Testing Library

### Test Coverage Strategy

When coverage targets cannot be achieved through traditional testing:

1. **Refactor complex logic into helper functions**
2. **Helper functions achieve 100% coverage easily**
3. **Focus on separation of concerns**
4. **Prefer unit testing of helpers over complex component mocking**

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## ⚡ Adding Features

This section provides comprehensive guides for extending the application with new functionality. Each guide includes implementation patterns, best practices, and testing strategies to maintain code quality and consistency.

### 📄 Documentation Guides

| Guide | Description | Focus Areas |
|-------|-------------|------------|
| [Routes and Pages](documentation/routes-and-pages.doc.md) | Complete guide for adding new routes and pages | Type-safe routing, component organization, navigation integration, i18n support |
| [Backend Architecture](documentation/backend-architecture.doc.md) | Comprehensive backend development guide | Database layer, service architecture, controllers, preload scripts, IPC communication |
| [Testing Strategies](documentation/testing-strategies.doc.md) | Advanced testing techniques for 100% coverage | Helper function extraction, edge case testing, mocking strategies, coverage analysis |
| [Release Compilation](documentation/release-compilation.doc.md) | Complete build and distribution guide | Production builds, cross-platform packaging, release automation, security hardening |

### 🎯 Feature Development Workflow

1. **Plan the Feature**: Review relevant documentation guides above
2. **Define Routes**: Follow [Routes and Pages Guide](documentation/routes-and-pages.doc.md) for frontend navigation
3. **Implement Backend**: Use [Backend Architecture Guide](documentation/backend-architecture.doc.md) for data layer and IPC
4. **Achieve Coverage**: Apply [Testing Strategies Guide](documentation/testing-strategies.doc.md) for comprehensive testing
5. **Build and Release**: Follow [Release Compilation Guide](documentation/release-compilation.doc.md) for production deployment
6. **Validate**: Run `npm run test:coverage` to ensure 100% coverage maintenance

### 📋 Quick Reference

- **New Page Component**: Extract complex logic to helpers for testability
- **Database Operations**: Use service layer with Prisma ORM and automatic initialization
- **IPC Communication**: Implement secure controller-preload-component patterns
- **Testing**: Target 100% coverage through helper function extraction and edge case testing
- **Release Builds**: Use `npm run build && npm run package && npm run make` for distribution
- **Internationalization**: Add i18n keys for all user-facing text

## 🌍 Internationalization

The application supports multiple languages using i18next:

- **English** (default)
- **French**
- Automatic language detection
- Easy to add new languages in `src/react/locales/`

## 📱 Distribution

### Supported Platforms

- **Windows** - Squirrel installer
- **macOS** - ZIP package
- **Linux** - DEB and RPM packages

### Building for Distribution

```bash
# Package the application
npm run package

# Create distribution packages for all platforms
npm run make
```

## 🛠️ Technology Stack

### Core Technologies

- **Electron 38** - Desktop app framework
- **React 19** - UI library
- **TypeScript 5** - Programming language
- **Vite 7** - Build tool

### UI & Styling

- **ShadcnUI** - Component library
- **Tailwind CSS 4** - CSS framework
- **Radix UI** - Accessible primitives
- **Lucide React** - Icon library

### Development Tools

- **Jest 30** - Testing framework
- **React Testing Library** - Component testing
- **Electron Forge** - Packaging and distribution
- **Concurrently** - Parallel script execution

## 📝 Configuration Files

- `package.json` - Project metadata and scripts
- `vite.config.js` - Vite configuration
- `jest.config.js` - Jest testing configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `CLAUDE.md` - Project-specific development rules

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass and maintain coverage targets
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

- **trev-z-dev**
- GitHub: [@trev-z-dev](https://github.com/trevorius)

## 🔗 Links

- [Repository](https://github.com/trev-z-dev/electron-boilerplate)
- [Navbar Implementation Documentation](src/react/components/common/Navbar.doc.md)
- [Tetris Game Documentation](src/react/components/game/Tetris.doc.md)
- [ShadcnUI Documentation](https://ui.shadcn.com/)
- [Electron Documentation](https://electronjs.org/)
