# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## test coverage requirements

- less than 100% coverage is not acceptable
- coverage thresholds are enforced at 100% for all metrics (branches, functions, lines, statements) in jest.config.js
- use `npm run test:coverage` to check coverage
- use `npm run test:watch` to run tests in watch mode during development

## test coverage strategy

When coverage targets cannot be achieved through traditional testing approaches:
1. **Refactor complex logic into helper functions** - Extract problematic lines from React components into pure helper functions
2. **Helper functions achieve 100% coverage easily** - Pure functions with predictable inputs/outputs are inherently testable
3. **Focus on separation of concerns** - Move business logic out of UI components into dedicated helper files
4. **Prefer unit testing of helpers over complex component mocking** - Helper functions can be tested in isolation without React timing issues

This approach has proven successful in achieving 99%+ coverage by moving untestable React component logic into testable pure functions.

## development commands

### testing
- `npm test` - run all tests
- `npm run test:watch` - run tests in watch mode
- `npm run test:coverage` - run tests with coverage report

### development
- `npm run dev` - start both Vite dev server and Electron concurrently
- `npm run dev:vite` - start Vite dev server only (React app at localhost:5173)
- `npm run dev:electron` - start Electron only (requires Vite server running)

### build and distribution
- `npm run build` - build React app for production
- `npm run package` - package Electron app
- `npm run make` - create distribution packages

## architecture

### electron structure
- **main process**: `src/electron/main.js` - Electron main process entry point
- **preload script**: `src/electron/preload.js` - secure bridge between main and renderer
- **react app**: `src/react/` - renderer process (UI)

### react application structure
- **routing**: centralized in `src/react/routes.tsx` with type-safe route definitions
- **components**: organized by purpose (common/, game/, layout/, ui/)
- **i18n**: internationalization with react-i18next, language files in `locales/`
- **mocking**: jest mocks in `__mocks__/` for UI components and external dependencies

### ui components
- **shadcn/ui**: component library with Button, Card, Dialog primitives
- **tailwind**: utility-first CSS with custom configuration
- **lucide-react**: icon library

### game architecture
- **tetris**: complete implementation with helper functions for testability (`Tetris.tsx` + `Tetris.helpers.tsx`)
- **tictactoe**: simple game component demonstrating component structure

## documentation standards

- document complex features in `.doc.md` files with comprehensive developer-oriented documentation
- documentation files should back link to README.md and be linked in README.md
- use `<fileName>.doc.md` naming for VSCode file nesting
