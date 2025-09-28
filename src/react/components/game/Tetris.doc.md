# Tetris Game Developer Documentation

[back to README](/README.md#tetris)

## Overview

This is a complete React-based Tetris implementation with TypeScript, featuring full game mechanics, comprehensive test coverage, and a clean separation of concerns between UI and game logic.

## Architecture

### Core Files

- **`Tetris.tsx`** - Main React component handling UI rendering and user interactions
- **`Tetris.helpers.tsx`** - Pure game logic functions (board management, collision detection, line clearing)
- **`Tetris.test.tsx`** - Integration tests for the component
- **`Tetris.helpers.test.tsx`** - Unit tests for helper functions
- **`Tetris.component.test.tsx`** - Mocked component tests for 100% coverage

### Design Principles

1. **Separation of Concerns**: UI logic is separate from game logic
2. **Pure Functions**: All game logic functions are pure and easily testable
3. **Comprehensive Testing**: Multiple test strategies for maximum coverage
4. **Mock-Friendly**: Core functions can be mocked for isolated testing

## Game Logic (Tetris.helpers.tsx)

### Constants

```typescript
BOARD_WIDTH = 10     // Standard Tetris board width
BOARD_HEIGHT = 20    // Standard Tetris board height
```

### Data Types

#### TetrominoType

```typescript
type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'
```

#### Tetromino

```typescript
interface Tetromino {
  type: TetrominoType;
  shape: number[][];  // 2D array representing piece shape
  color: string;      // CSS color for rendering
}
```

#### Position

```typescript
interface Position {
  x: number;  // Board column (0-9)
  y: number;  // Board row (0-19, top to bottom)
}
```

#### GamePiece

```typescript
interface GamePiece {
  tetromino: Tetromino;
  position: Position;
}
```

### Core Functions

#### `createEmptyBoard(): number[][]`

Creates a new empty game board filled with zeros.

**Returns**: 20x10 2D array where 0 = empty, 1 = filled

#### `getRandomTetromino(): Tetromino`

Selects a random tetromino piece from the 7 standard types.

**Returns**: Complete tetromino object with shape and color

#### `rotateTetromino(shape: number[][]): number[][]`

Rotates a tetromino shape 90 degrees clockwise.

**Algorithm**: Transposes matrix then reverses each row

- Input: `[[1,1,1,1]]` (horizontal I-piece)
- Output: `[[1],[1],[1],[1]]` (vertical I-piece)

#### `isValidMove(board: number[][], piece: GamePiece, newPosition: Position): boolean`

Checks if a piece can move to a new position without collision.

**Collision Detection**:

- Boundary checks (left: x >= 0, right: x < BOARD_WIDTH, bottom: y < BOARD_HEIGHT)
- Existing piece collision (checks board[y][x] !== 0)
- Allows pieces partially above board (y < 0) for spawning

**Special Features**:

- Test mode support via `window.testForceCollision` flag
- Line 118: Critical collision detection with existing pieces

#### `placePiece(board: number[][], piece: GamePiece): number[][]`

Places a piece on the board by setting occupied cells to 1.

**Returns**: New board instance (immutable)
**Boundary Handling**: Only places cells with y >= 0

#### `clearLines(board: number[][], position?: Position): {newBoard: number[][], linesCleared: number}`

Removes complete horizontal lines and adds empty rows at top.

**Algorithm**:

1. Filter out rows where every cell equals 1
2. Calculate lines cleared (BOARD_HEIGHT - remaining rows)
3. Add empty rows at top to maintain board height

**Special Features**:

- Test mode support via `window.testForceClearLines` flag
- Line 164: Critical loop for adding empty rows after clearing

## UI Component (Tetris.tsx)

### State Management

#### Game State

```typescript
const [board, setBoard] = useState<number[][]>()        // Current board state
const [currentPiece, setCurrentPiece] = useState<GamePiece | null>()  // Active falling piece
const [nextPiece, setNextPiece] = useState<Tetromino>() // Preview piece
const [score, setScore] = useState(0)                   // Player score
const [level, setLevel] = useState(1)                   // Game level
const [lines, setLines] = useState(0)                   // Lines cleared
const [gameOver, setGameOver] = useState(false)         // Game over flag
const [isPlaying, setIsPlaying] = useState(false)       // Game active flag
const [dropTime, setDropTime] = useState(1000)         // Auto-drop interval (ms)
```

### Key Functions

#### `spawnNewPiece()`

- Creates new piece from `nextPiece` at spawn position (center top)
- Generates next preview piece
- Checks for game over (spawn position blocked)

#### `movePiece(direction: 'left' | 'right' | 'down')`

- Validates movement with `isValidMove()`
- Updates piece position or places piece on collision
- Handles scoring and line clearing
- **Line 49**: Early return guards for null piece or game over
- **Lines 64-124**: Collision handling and piece placement logic

#### `rotatePiece()`

- Rotates current piece using `rotateTetromino()`
- Validates rotation with collision detection
- **Line 76**: Early return guards

#### `dropPiece()`

- Hard drop: moves piece to bottom instantly
- Calculates final position with collision detection
- Awards bonus points for hard drops
- **Lines 90-104**: Drop logic with early returns

### Game Loop

#### Automatic Falling

```typescript
useEffect(() => {
  if (isPlaying && currentPiece) {
    gameLoopRef.current = setInterval(() => {
      movePiece('down');
    }, dropTime);
  }
  // Cleanup interval
}, [isPlaying, currentPiece, dropTime, movePiece]);
```

#### Level Progression

```typescript
useEffect(() => {
  const newLevel = Math.floor(lines / 10) + 1;
  setLevel(newLevel);
  setDropTime(Math.max(50, 1000 - (newLevel - 1) * 50));
}, [lines]);
```

### Keyboard Controls

- **Arrow Keys**: Move left/right/down
- **Up Arrow**: Rotate piece
- **Spacebar**: Hard drop
- **P**: Pause/Resume toggle (**Line 157**)

### Rendering

#### `renderBoard()`

- Creates display board from game board + current piece
- **Line 205**: Boundary checks for current piece rendering
- Applies different colors for empty (gray-900), placed (gray-300), active (piece color)

#### `renderNextPiece()`

- Displays preview of next piece
- Smaller 6x6 pixel cells vs 30x30 for main board

## Testing Strategy

### Current Coverage Status

- **Statements**: 99.09% (Target: 100%)
- **Branches**: 94.8% (Target: 100%)
- **Functions**: 100%
- **Lines**: 100%

### Uncovered Areas (Tetris.tsx)

- **Line 49**: Early returns in `movePiece()`
- **Lines 64-124**: Collision handling in `movePiece()`
- **Line 157**: P key pause/resume logic
- **Line 205**: Boundary checks in `renderBoard()`

### Test Files Overview

#### `Tetris.helpers.test.tsx`

- **Unit tests** for pure game logic functions
- Tests all boundary conditions and edge cases
- Achieves 100% coverage of helper functions
- Uses test flags for forcing specific code paths

#### `Tetris.test.tsx`

- **Integration tests** for the full component
- Tests user interactions and game flow
- Real-world scenarios with actual game logic
- Timer management with `jest.useFakeTimers()`

#### `Tetris.component.test.tsx`

- **Mocked component tests** for 100% coverage
- Isolates component logic from game logic
- Targets specific uncovered lines
- Uses `jest.mock()` to control helper function behavior

### Mock Strategies

#### Helper Function Mocking

```typescript
jest.mock('./Tetris.helpers', () => ({
  createEmptyBoard: jest.fn(),
  getRandomTetromino: jest.fn(),
  isValidMove: jest.fn(),
  placePiece: jest.fn(),
  clearLines: jest.fn()
}));
```

#### Test Mode Flags

```typescript
// Force collision detection (Line 103-105 in helpers)
(window as any).testForceCollision = true;

// Force line clearing (Line 149-156 in helpers)
(window as any).testForceClearLines = true;
```

### Coverage Improvement Plan

#### Strategy 1: Enhanced Component Mocking

Focus on uncovered lines in `Tetris.tsx`:

1. **Line 49 Coverage**: Test early returns when `currentPiece` is null or `gameOver` is true
2. **Lines 64-124 Coverage**: Mock collision scenarios to trigger piece placement logic
3. **Line 157 Coverage**: Test P/p key pause/resume functionality
4. **Line 205 Coverage**: Test boundary conditions in board rendering

#### Strategy 2: Edge Case Integration Tests

Create specific scenarios that naturally trigger uncovered branches:

1. **Game Over Scenarios**: Fill board to trigger spawn failures
2. **Line Clearing**: Create board states that trigger complete rows
3. **Collision Scenarios**: Place pieces to test all collision types

#### Strategy 3: Refactoring for Testability

Move complex logic to helper functions:

1. **Game Loop Logic**: Extract automatic dropping logic
2. **Scoring Logic**: Extract score calculation logic
3. **Input Handling**: Extract keyboard input processing

## Game Mechanics

### Scoring System

- **Line Clear**: 100 points × level × lines cleared
- **Hard Drop**: +20 bonus points
- **Level Up**: Every 10 lines cleared

### Progression through levels

- **Level 1**: 1000ms drop time
- **Level 2**: 950ms drop time
- **Each Level**: -50ms (minimum 50ms at level 20+)

### Piece Generation

- 7 standard Tetris pieces (I, O, T, S, Z, J, L)
- Random selection with `Math.random()`
- Preview next piece shown in UI

### Collision Detection

- Boundary collision (walls, floor)
- Piece-to-piece collision
- Rotation collision checking
- Spawn position validation

## Development Guidelines

### Adding New Features

1. Add pure logic functions to `Tetris.helpers.tsx`
2. Write unit tests first
3. Update component to use new functions
4. Add integration tests for UI interactions

### Testing New Code

1. Achieve 100% line coverage with unit tests
2. Test edge cases and boundary conditions
3. Use mocks to isolate components under test
4. Add integration tests for user workflows

### Performance Considerations

- Game loop runs every 50-1000ms depending on level
- Board rendering optimized with React keys
- Immutable state updates for predictable behavior

## Future Enhancements

### Potential Features

- **Ghost Piece**: Show piece landing position
- **Hold Piece**: Reserve a piece for later use
- **Multi-player**: Network play capability
- **Sound Effects**: Audio feedback for actions
- **Animations**: Smooth piece movement and line clearing

### Code Quality Improvements

- **TypeScript Strict Mode**: Enable strict type checking
- **Performance Monitoring**: Add render performance metrics
- **Error Boundaries**: Graceful error handling
- **Accessibility**: ARIA labels and keyboard navigation

## Debugging Tools

### Test Flags

Set these on `window` object for testing:

```typescript
window.testForceCollision = true;    // Force collision detection
window.testForceClearLines = true;   // Force line clearing
```

### Development Mode

- React DevTools for state inspection
- Jest coverage reports for test gaps
- ESLint for code quality checking

---

*This documentation covers the complete Tetris implementation. For specific testing strategies to achieve 100% coverage, see the test files and coverage reports.*
