# Testing Strategies and Coverage Guide

This document provides comprehensive guidance on achieving and maintaining 100% test coverage in the Electron React Boilerplate. It covers testing methodologies, helper function extraction patterns, edge case handling, and proven strategies for testing complex scenarios.

← [Back to README](/README.md)

## Table of Contents

1. [Coverage Requirements](#coverage-requirements)
2. [Helper Function Strategy](#helper-function-strategy)
3. [Testing Architecture](#testing-architecture)
4. [Edge Case Testing Patterns](#edge-case-testing-patterns)
5. [Mocking Strategies](#mocking-strategies)
6. [Component Testing Approaches](#component-testing-approaches)
7. [Service Layer Testing](#service-layer-testing)
8. [Controller Testing](#controller-testing)
9. [Coverage Analysis and Tools](#coverage-analysis-and-tools)
10. [Common Coverage Challenges and Solutions](#common-coverage-challenges-and-solutions)

## Coverage Requirements

The project enforces strict 100% coverage requirements across all metrics:

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 100,
    functions: 100,
    lines: 100,
    statements: 100
  }
}
```

### Coverage Commands

- `npm run test:coverage` - Generate coverage report
- `npm run test:watch` - Run tests in watch mode during development
- `npm test` - Run all tests once

### Coverage Philosophy

**Less than 100% coverage is not acceptable.** This strict requirement ensures:

- **Complete Code Understanding**: Every line must be intentionally tested
- **Edge Case Discovery**: Forces consideration of all execution paths
- **Refactoring Safety**: High confidence when making changes
- **Documentation Through Tests**: Tests serve as living documentation

## Helper Function Strategy

### Core Principle: Extract Complex Logic

When React components contain logic that's difficult to test directly, extract it into pure helper functions:

```typescript
// ❌ Difficult to test in component
const Tetris: React.FC = () => {
  const [gameState, setGameState] = useState(() => {
    // Complex initialization logic embedded in component
    const initialBoard = Array(20).fill(null).map(() => Array(10).fill(0));
    const piece = generateRandomPiece();
    return { board: initialBoard, currentPiece: piece, score: 0 };
  });

  const rotatePiece = () => {
    // Complex rotation logic embedded in component
    setGameState(prev => {
      const rotated = rotateMatrix(prev.currentPiece.shape);
      if (isValidPosition(prev.board, rotated, prev.currentPiece.position)) {
        return { ...prev, currentPiece: { ...prev.currentPiece, shape: rotated } };
      }
      return prev;
    });
  };

  // ... rest of component
};
```

```typescript
// ✅ Testable helper functions
// Tetris.helpers.ts
export const createInitialGameState = (): GameState => {
  const initialBoard = Array(20).fill(null).map(() => Array(10).fill(0));
  const piece = generateRandomPiece();
  return { board: initialBoard, currentPiece: piece, score: 0 };
};

export const rotatePieceIfValid = (gameState: GameState): GameState => {
  const rotated = rotateMatrix(gameState.currentPiece.shape);
  if (isValidPosition(gameState.board, rotated, gameState.currentPiece.position)) {
    return {
      ...gameState,
      currentPiece: { ...gameState.currentPiece, shape: rotated }
    };
  }
  return gameState;
};

// Tetris.tsx
const Tetris: React.FC = () => {
  const [gameState, setGameState] = useState(createInitialGameState);

  const rotatePiece = () => {
    setGameState(prev => rotatePieceIfValid(prev));
  };

  // ... rest of component
};
```

### Helper Function Testing

Helper functions achieve 100% coverage easily because they are pure functions:

```typescript
// Tetris.helpers.test.ts
describe('Tetris Helpers', () => {
  describe('createInitialGameState', () => {
    test('creates board with correct dimensions', () => {
      const state = createInitialGameState();
      expect(state.board).toHaveLength(20);
      expect(state.board[0]).toHaveLength(10);
    });

    test('initializes with zero score', () => {
      const state = createInitialGameState();
      expect(state.score).toBe(0);
    });

    test('includes a current piece', () => {
      const state = createInitialGameState();
      expect(state.currentPiece).toBeDefined();
      expect(state.currentPiece.shape).toBeDefined();
    });
  });

  describe('rotatePieceIfValid', () => {
    test('rotates piece when position is valid', () => {
      const gameState = createTestGameState();
      const result = rotatePieceIfValid(gameState);
      expect(result.currentPiece.shape).not.toEqual(gameState.currentPiece.shape);
    });

    test('does not rotate piece when position is invalid', () => {
      const gameState = createTestGameStateWithBlockedRotation();
      const result = rotatePieceIfValid(gameState);
      expect(result).toEqual(gameState);
    });
  });
});
```

## Testing Architecture

### Test File Organization

```
src/
├── electron/
│   ├── services/
│   │   ├── highScore.service.ts
│   │   └── highScore.service.test.ts
│   ├── controllers/
│   │   ├── highScore.controller.ts
│   │   └── highScore.controller.test.ts
│   ├── main.ts
│   └── main.test.ts
├── react/
│   ├── components/
│   │   ├── game/
│   │   │   ├── Tetris.tsx
│   │   │   ├── Tetris.helpers.ts
│   │   │   ├── Tetris.test.tsx
│   │   │   └── Tetris.helpers.test.ts
│   │   └── common/
│   │       ├── Navigation.tsx
│   │       └── Navigation.test.tsx
│   └── __mocks__/
│       ├── test-utils.tsx
│       └── electron.ts
```

### Test Utilities and Setup

Create reusable test utilities for consistent testing:

```typescript
// src/react/__mocks__/test-utils.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/i18n';

const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as renderWithProviders };
```

### Mock Strategy Framework

Create comprehensive mocks for external dependencies:

```typescript
// src/react/__mocks__/electron.ts
export const electronAPI = {
  saveScore: jest.fn(),
  getHighScores: jest.fn(),
  getAllHighScores: jest.fn(),
  isHighScore: jest.fn(),
  deleteScore: jest.fn(),
  clearScores: jest.fn(),
};

// Automatically mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: electronAPI,
  writable: true,
});
```

## Edge Case Testing Patterns

### 1. Error Boundary Testing

Test error conditions and recovery scenarios:

```typescript
describe('Error Handling', () => {
  test('handles database connection failure', async () => {
    const error = new Error('Database connection failed');
    mockPrismaInstance.$connect.mockRejectedValue(error);

    await expect(service.initialize()).rejects.toThrow('Database connection failed');
    expect(service['initialized']).toBe(false);
  });

  test('handles partial initialization failure', async () => {
    mockPrismaInstance.$connect.mockResolvedValue(undefined);
    mockPrismaInstance.$queryRaw.mockRejectedValue(new Error('Query failed'));
    mockPrismaInstance.$executeRaw.mockRejectedValue(new Error('Schema creation failed'));

    await expect(service.initialize()).rejects.toThrow('Schema creation failed');
  });
});
```

### 2. Boundary Value Testing

Test edge values and limits:

```typescript
describe('Boundary Values', () => {
  test('handles maximum score value', async () => {
    const maxScore = Number.MAX_SAFE_INTEGER;
    const result = await service.saveScore({
      name: 'Player',
      score: maxScore,
      game: 'tetris'
    });
    expect(result.score).toBe(maxScore);
  });

  test('handles empty high scores list', async () => {
    mockPrismaInstance.score.findMany.mockResolvedValue([]);
    const result = await service.getHighScores('nonexistent', 10);
    expect(result).toEqual([]);
  });

  test('handles zero limit request', async () => {
    const result = await service.getHighScores('tetris', 0);
    expect(mockPrismaInstance.score.findMany).toHaveBeenCalledWith({
      where: { game: 'tetris' },
      orderBy: { score: 'desc' },
      take: 0,
    });
  });
});
```

### 3. State Transition Testing

Test all possible state changes:

```typescript
describe('State Transitions', () => {
  test('service initialization states', async () => {
    // Initial state
    expect(service['initialized']).toBe(false);

    // During initialization
    const initPromise = service.initialize();
    expect(service['initialized']).toBe(false);

    // After successful initialization
    await initPromise;
    expect(service['initialized']).toBe(true);

    // Subsequent initialization calls
    await service.initialize();
    expect(mockPrismaInstance.$connect).toHaveBeenCalledTimes(1);
  });
});
```

## Mocking Strategies

### 1. File System Operations

Mock fs operations for database file handling:

```typescript
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  promises: {
    copyFile: jest.fn(),
  },
}));

describe('File System Operations', () => {
  test('creates directory when it does not exist', async () => {
    const mockFs = fs as jest.Mocked<typeof fs>;
    mockFs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);

    await service.initialize();

    expect(mockFs.mkdirSync).toHaveBeenCalledWith(
      expect.any(String),
      { recursive: true }
    );
  });
});
```

### 2. Electron API Mocking

Mock Electron-specific APIs:

```typescript
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn().mockReturnValue('/mock/userData'),
    whenReady: jest.fn(() => Promise.resolve()),
  },
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadURL: jest.fn(),
    on: jest.fn(),
    webContents: {
      setWindowOpenHandler: jest.fn(),
    },
  })),
  ipcMain: {
    handle: jest.fn(),
    removeHandler: jest.fn(),
  },
}));
```

### 3. Database Mocking

Create comprehensive Prisma client mocks:

```typescript
const createMockPrismaInstance = () => ({
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),
  score: {
    create: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
});

describe('Database Operations', () => {
  let mockPrismaInstance: ReturnType<typeof createMockPrismaInstance>;

  beforeEach(() => {
    mockPrismaInstance = createMockPrismaInstance();
    (PrismaClient as jest.Mock).mockImplementation(() => mockPrismaInstance);
  });
});
```

## Component Testing Approaches

### 1. Shallow vs Deep Testing

Use helper functions to enable focused testing:

```typescript
// Test component behavior through helpers
describe('Tetris Component', () => {
  test('renders game board correctly', () => {
    renderWithProviders(<Tetris />);
    expect(screen.getByTestId('tetris-board')).toBeInTheDocument();
  });

  test('displays current score', () => {
    renderWithProviders(<Tetris />);
    expect(screen.getByText(/score:/i)).toBeInTheDocument();
  });
});

// Test game logic through helpers
describe('Tetris Game Logic', () => {
  test('line clearing logic', () => {
    const boardWithFullLine = createBoardWithFullLine();
    const result = clearFullLines(boardWithFullLine);
    expect(result.linesCleared).toBe(1);
    expect(result.newBoard).not.toEqual(boardWithFullLine);
  });
});
```

### 2. User Interaction Testing

Test user interactions and their effects:

```typescript
describe('User Interactions', () => {
  test('handles piece rotation on key press', async () => {
    renderWithProviders(<Tetris />);
    const gameArea = screen.getByTestId('tetris-board');

    fireEvent.keyDown(gameArea, { key: 'ArrowUp' });

    // Verify the rotation occurred through visible changes
    await waitFor(() => {
      expect(screen.getByTestId('current-piece')).toHaveAttribute(
        'data-rotation', '1'
      );
    });
  });

  test('handles game pause', async () => {
    renderWithProviders(<Tetris />);

    fireEvent.keyDown(document, { key: ' ' });

    expect(screen.getByText(/paused/i)).toBeInTheDocument();
  });
});
```

## Service Layer Testing

### 1. Complete Method Coverage

Test every method and all execution paths:

```typescript
describe('HighScoreService Complete Coverage', () => {
  // Test successful operations
  test('successful score save', async () => {
    const scoreData = { name: 'Player', score: 1000, game: 'tetris' };
    const mockResult = { id: 1, ...scoreData, createdAt: new Date() };

    mockPrismaInstance.score.create.mockResolvedValue(mockResult);

    const result = await service.saveScore(scoreData);
    expect(result).toEqual(mockResult);
  });

  // Test error conditions
  test('score save failure', async () => {
    const scoreData = { name: 'Player', score: 1000, game: 'tetris' };
    const error = new Error('Database error');

    mockPrismaInstance.score.create.mockRejectedValue(error);

    await expect(service.saveScore(scoreData)).rejects.toThrow('Database error');
  });

  // Test edge cases
  test('handles empty name', async () => {
    const scoreData = { name: '', score: 1000, game: 'tetris' };

    await expect(service.saveScore(scoreData)).rejects.toThrow();
  });
});
```

### 2. Database State Testing

Test database initialization and state management:

```typescript
describe('Database State Management', () => {
  test('creates table when it does not exist', async () => {
    mockPrismaInstance.$queryRaw.mockRejectedValue(
      new Error('no such table: scores')
    );
    mockPrismaInstance.$executeRaw.mockResolvedValue(undefined);

    await service.initialize();

    expect(mockPrismaInstance.$executeRaw).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.stringContaining('CREATE TABLE IF NOT EXISTS')
      ])
    );
  });

  test('skips table creation when table exists', async () => {
    mockPrismaInstance.$queryRaw.mockResolvedValue([{ 1: 1 }]);

    await service.initialize();

    expect(mockPrismaInstance.$executeRaw).not.toHaveBeenCalled();
  });
});
```

## Controller Testing

### 1. IPC Handler Testing

Test IPC communication and error handling:

```typescript
describe('IPC Handler Coverage', () => {
  test('extracts and tests individual handlers', async () => {
    await HighScoreController.registerHandlers();

    const calls = mockIpcMain.handle.mock.calls;
    const saveScoreHandler = calls.find(call => call[0] === 'save-score')?.[1];

    expect(saveScoreHandler).toBeDefined();

    // Test successful case
    const scoreData = { name: 'Player', score: 1000, game: 'tetris' };
    mockHighScoreService.saveScore.mockResolvedValue(scoreData);

    const result = await saveScoreHandler({}, scoreData);
    expect(result).toEqual(scoreData);

    // Test error case
    mockHighScoreService.saveScore.mockRejectedValue(new Error('Failed'));
    await expect(saveScoreHandler({}, scoreData)).rejects.toThrow('Failed');
  });
});
```

### 2. Controller Lifecycle Testing

Test controller registration and cleanup:

```typescript
describe('Controller Lifecycle', () => {
  test('registers all handlers', async () => {
    await HighScoreController.registerHandlers();

    expect(mockIpcMain.handle).toHaveBeenCalledWith('save-score', expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith('get-high-scores', expect.any(Function));
    // ... all other handlers
    expect(mockIpcMain.handle).toHaveBeenCalledTimes(6);
  });

  test('removes all handlers', () => {
    HighScoreController.removeHandlers();

    expect(mockIpcMain.removeHandler).toHaveBeenCalledWith('save-score');
    expect(mockIpcMain.removeHandler).toHaveBeenCalledWith('get-high-scores');
    // ... all other handlers
    expect(mockIpcMain.removeHandler).toHaveBeenCalledTimes(6);
  });
});
```

## Coverage Analysis and Tools

### 1. Understanding Coverage Reports

```bash
npm run test:coverage
```

The coverage report shows:

- **Lines**: Percentage of code lines executed
- **Functions**: Percentage of functions called
- **Branches**: Percentage of conditional branches taken
- **Statements**: Percentage of statements executed

### 2. Identifying Uncovered Code

Look for specific line numbers in coverage reports:

```
File                     | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------------|---------|----------|---------|---------|-------------------
highScore.service.ts     |   99.12 |    95.45 |     100 |   99.09 | 84,89
main.ts                  |   98.33 |      100 |     100 |   98.28 | 152
```

Target these specific lines with focused tests:

```typescript
// Target line 84: directory creation
test('creates directory when missing', async () => {
  mockFs.existsSync.mockReturnValueOnce(false); // Directory doesn't exist
  await service.initialize();
  expect(mockFs.mkdirSync).toHaveBeenCalled();
});

// Target line 89: database file logging
test('logs database creation message', async () => {
  mockFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
  const consoleSpy = jest.spyOn(console, 'log');
  await service.initialize();
  expect(consoleSpy).toHaveBeenCalledWith('Creating new database at:', expect.any(String));
});
```

### 3. Branch Coverage Strategies

Ensure all conditional branches are tested:

```typescript
// Original code with multiple branches
const isHighScore = async (game: string, score: number): Promise<boolean> => {
  try {
    const topScores = await this.getHighScores(game, 10);
    if (topScores.length < 10) return true;
    return score > topScores[topScores.length - 1].score;
  } catch (error) {
    return false;
  }
};

// Test all branches
describe('isHighScore branches', () => {
  test('returns true when less than 10 scores exist', async () => {
    mockPrismaInstance.score.findMany.mockResolvedValue([mockScore]);
    expect(await service.isHighScore('tetris', 100)).toBe(true);
  });

  test('returns true when score beats lowest', async () => {
    const tenScores = Array(10).fill(mockScore);
    mockPrismaInstance.score.findMany.mockResolvedValue(tenScores);
    expect(await service.isHighScore('tetris', 1001)).toBe(true);
  });

  test('returns false when score does not beat lowest', async () => {
    const tenScores = Array(10).fill(mockScore);
    mockPrismaInstance.score.findMany.mockResolvedValue(tenScores);
    expect(await service.isHighScore('tetris', 500)).toBe(false);
  });

  test('returns false on error', async () => {
    mockPrismaInstance.score.findMany.mockRejectedValue(new Error('DB Error'));
    expect(await service.isHighScore('tetris', 1000)).toBe(false);
  });
});
```

## Common Coverage Challenges and Solutions

### 1. React Component State Updates

**Challenge**: Testing complex useState and useEffect interactions

**Solution**: Extract logic to helper functions

```typescript
// ❌ Hard to test
const Component = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await api.getData();
        setData(result);
      } catch (error) {
        setData({ error: error.message });
      }
    };
    fetchData();
  }, []);
};

// ✅ Testable
const processApiResponse = (result: any, error: any) => {
  if (error) return { error: error.message };
  return result;
};

const Component = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getData()
      .then(result => setData(processApiResponse(result, null)))
      .catch(error => setData(processApiResponse(null, error)));
  }, []);
};
```

### 2. Error Handling in Async Code

**Challenge**: Testing catch blocks and error paths

**Solution**: Mock rejections and verify error handling

```typescript
test('handles async errors correctly', async () => {
  const error = new Error('Async operation failed');
  mockAsyncFunction.mockRejectedValue(error);

  const result = await functionUnderTest();

  expect(result).toEqual({ error: 'Async operation failed' });
});
```

### 3. Platform-Specific Code

**Challenge**: Testing Electron app vs web behavior

**Solution**: Mock environment detection

```typescript
// Helper function for environment detection
export const getEnvironment = () => {
  return process.env.NODE_ENV || 'development';
};

export const getDatabasePath = () => {
  return getEnvironment() === 'production'
    ? path.join(app.getPath('userData'), 'database.db')
    : path.join(process.cwd(), 'prisma', 'database.db');
};

// Test both environments
describe('Environment-specific behavior', () => {
  test('uses userData path in production', () => {
    process.env.NODE_ENV = 'production';
    expect(getDatabasePath()).toContain('userData');
  });

  test('uses local path in development', () => {
    process.env.NODE_ENV = 'development';
    expect(getDatabasePath()).toContain('prisma');
  });
});
```

### 4. File System Operations

**Challenge**: Testing file operations without actual files

**Solution**: Comprehensive fs mocking

```typescript
import * as fs from 'fs';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  promises: {
    copyFile: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

test('handles file operations', async () => {
  const mockFs = fs as jest.Mocked<typeof fs>;

  // Test file doesn't exist
  mockFs.existsSync.mockReturnValue(false);

  // Test directory creation
  await service.ensureDatabaseExists();

  expect(mockFs.mkdirSync).toHaveBeenCalledWith(
    expect.any(String),
    { recursive: true }
  );
});
```

## Best Practices Summary

### 1. Test Structure
- **Arrange-Act-Assert**: Clear test structure
- **Single Responsibility**: One concept per test
- **Descriptive Names**: Tests as documentation
- **Complete Cleanup**: Proper beforeEach/afterEach

### 2. Coverage Strategy
- **Helper Function Extraction**: Move complex logic to testable functions
- **Edge Case Focus**: Test boundaries and error conditions
- **Branch Coverage**: Ensure all conditional paths are tested
- **Integration Points**: Test service-controller-component interactions

### 3. Maintenance
- **Regular Coverage Checks**: Run coverage on every change
- **Refactor for Testability**: Continuously improve code structure
- **Mock Maintenance**: Keep mocks synchronized with real implementations
- **Test Performance**: Ensure tests run quickly and reliably

### 4. Development Workflow
- **TDD Approach**: Write tests before or alongside code
- **Watch Mode**: Use `npm run test:watch` during development
- **Coverage Validation**: Verify 100% coverage before commits
- **Documentation**: Use tests as living documentation

This testing strategy ensures maintainable, reliable code with complete coverage while supporting rapid development and confident refactoring.

← [Back to README](/README.md)