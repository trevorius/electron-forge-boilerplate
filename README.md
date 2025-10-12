# CharWeaver

An intelligent character generation and chat application built with Electron, React, and AI. Create detailed character personas with custom attributes and engage in immersive conversations powered by local LLM integration. All characters and chat histories are persisted locally in a secure database.

- [CharWeaver](#charweaver)
  - [🚀 Features](#-features)
  - [🎭 How It Works](#-how-it-works)
  - [📦 Installation](#-installation)
  - [🛠️ Development](#️-development)
    - [Start Development Server](#start-development-server)
    - [Available Scripts](#available-scripts)
  - [🏗️ Project Structure](#️-project-structure)
  - [💾 Database Architecture](#-database-architecture)
  - [🤖 AI Integration](#-ai-integration)
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
    - [Database \& AI](#database--ai)
    - [Development Tools](#development-tools)
  - [📝 Configuration Files](#-configuration-files)
  - [🤝 Contributing](#-contributing)
  - [📄 License](#-license)
  - [👨‍💻 Author](#-author)
  - [🔗 Links](#-links)

## 🚀 Features

- **🎭 Character Generation** - Create detailed character personas with customizable attributes and personalities
- **💬 AI-Powered Chat** - Engage in immersive conversations with your generated characters using local LLM integration
- **💾 Database Persistence** - All characters (personas) and chat histories are securely stored locally using Prisma ORM
- **🏷️ Genre Organization** - Organize chats by character and genre for easy retrieval
- **🌍 Multi-language Support** - Full internationalization with i18next (English, French)
- **🎨 Modern UI** - Beautiful interface built with ShadcnUI and Tailwind CSS
- **🔒 Privacy First** - All data stored locally, no cloud dependencies
- **⚡ Fast & Responsive** - Built on Electron, React 19, and Vite for optimal performance
- **🧪 Comprehensive Testing** - 100% test coverage target with Jest and React Testing Library

## 🎭 How It Works

1. **Define Your Character**: Specify attributes, personality traits, background, and other characteristics for your persona
2. **Generate**: The system creates a complete character profile based on your specifications
3. **Start Chatting**: Engage in conversations with your character, powered by local AI models
4. **Save & Organize**: All characters and chat sessions are automatically saved and organized by genre
5. **Resume Anytime**: Access your character library and continue previous conversations whenever you want

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/trev-z-dev/char-weaver.git
cd char-weaver

# Install dependencies
npm install

# Initialize database
npx prisma generate
npx prisma migrate dev
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
│   ├── preload.js     # Preload script (IPC bridge)
│   ├── controllers/   # Backend controllers for business logic
│   ├── services/      # Database and AI service layer
│   └── generated/     # Auto-generated preload types
├── react/             # React application
│   ├── components/    # React components
│   │   ├── character/ # Character creation and management
│   │   ├── chat/      # Chat interface components
│   │   ├── common/    # Shared components (Navbar, etc.)
│   │   ├── layout/    # Layout components
│   │   └── ui/        # ShadcnUI components
│   ├── lib/           # Utility libraries
│   ├── locales/       # i18n translation files
│   ├── styles/        # Global styles
│   ├── __mocks__/     # Jest mocks
│   ├── App.tsx        # Main App component
│   ├── routes.tsx     # Route definitions
│   └── index.tsx      # React entry point
├── prisma/            # Database schema and migrations
│   └── schema.prisma  # Database models (Character, Chat, Message)
└── llms.json          # LLM configuration
```

## 💾 Database Architecture

CharWeaver uses Prisma ORM with SQLite for local data persistence:

- **Characters (Personas)**: Store character definitions with attributes, personality traits, and metadata
- **Chats**: Organize conversations by character and genre
- **Messages**: Complete chat history with timestamps and context
- **Automatic Initialization**: Database and tables are created automatically on first run
- **Type Safety**: Full TypeScript integration with Prisma Client

See [Backend Architecture Guide](documentation/backend-architecture.doc.md) for detailed implementation patterns.

## 🤖 AI Integration

CharWeaver integrates with local LLM models using node-llama-cpp:

- **Local Processing**: All AI inference runs locally, ensuring privacy
- **Character-Aware**: AI responses are contextual to the character's personality and attributes
- **Persistent Context**: Chat history is maintained for coherent long-form conversations
- **Configurable Models**: Support for multiple LLM models via llms.json configuration
- **No API Keys Required**: Fully offline capability

## 🧪 Testing

The project maintains high test coverage standards:

- **Coverage Target**: 100% (enforced in jest.config.js)
- **Testing Strategy**: Unit tests, integration tests, helper function extraction, and mocked component tests
- **Framework**: Jest with React Testing Library
- **Database Testing**: In-memory SQLite for isolated test environments

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
| [Character System](documentation/character-system.doc.md) | Character generation and management patterns | Character creation, persona attributes, database persistence, character library |
| [Chat System](documentation/chat-system.doc.md) | AI chat implementation guide | LLM integration, message handling, context management, chat history |
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

### Database & AI

- **Prisma ORM** - Type-safe database client
- **SQLite** - Local database engine
- **node-llama-cpp** - Local LLM integration
- **React Markdown** - Markdown rendering for chat

### Development Tools

- **Jest 30** - Testing framework
- **React Testing Library** - Component testing
- **Electron Forge** - Packaging and distribution
- **Concurrently** - Parallel script execution

## 📝 Configuration Files

- `package.json` - Project metadata and scripts
- `vite.config.js` - Vite configuration
- `jest.config.js` - Jest testing configuration (100% coverage enforced)
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `prisma/schema.prisma` - Database schema definition
- `llms.json` - LLM model configuration
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

- [Repository](https://github.com/trev-z-dev/char-weaver)
- [Backend Architecture Guide](documentation/backend-architecture.doc.md)
- [Character System Documentation](documentation/character-system.doc.md)
- [Chat System Documentation](documentation/chat-system.doc.md)
- [Prisma Documentation](https://www.prisma.io/docs)
- [ShadcnUI Documentation](https://ui.shadcn.com/)
- [Electron Documentation](https://electronjs.org/)
