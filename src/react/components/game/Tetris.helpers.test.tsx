import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  TETROMINOES,
  createEmptyBoard,
  getRandomTetromino,
  rotateTetromino,
  isValidMove,
  placePiece,
  clearLines,
  GamePiece,
  Position
} from './Tetris.helpers';

describe('Tetris Helper Functions', () => {
  describe('createEmptyBoard', () => {
    test('creates an empty board with correct dimensions', () => {
      const board = createEmptyBoard();
      expect(board.length).toBe(BOARD_HEIGHT);
      expect(board[0].length).toBe(BOARD_WIDTH);

      // Check all cells are empty (0)
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          expect(board[y][x]).toBe(0);
        }
      }
    });
  });

  describe('getRandomTetromino', () => {
    test('returns a valid tetromino', () => {
      const tetromino = getRandomTetromino();
      const validTypes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
      expect(validTypes).toContain(tetromino.type);
      expect(tetromino.shape).toBeDefined();
      expect(tetromino.color).toBeDefined();
    });

    test('returns different tetrominoes when called multiple times', () => {
      const tetrominoes = new Set();
      for (let i = 0; i < 50; i++) {
        tetrominoes.add(getRandomTetromino().type);
      }
      // Should have some variety (at least 3 different types in 50 calls)
      expect(tetrominoes.size).toBeGreaterThan(2);
    });
  });

  describe('rotateTetromino', () => {
    test('rotates I-piece correctly', () => {
      const horizontalI = [[1, 1, 1, 1]];
      const verticalI = rotateTetromino(horizontalI);
      const expected = [[1], [1], [1], [1]];
      expect(verticalI).toEqual(expected);
    });

    test('rotates T-piece correctly', () => {
      const originalT = [
        [0, 1, 0],
        [1, 1, 1]
      ];
      const rotatedT = rotateTetromino(originalT);
      const expected = [
        [1, 0],
        [1, 1],
        [1, 0]
      ];
      expect(rotatedT).toEqual(expected);
    });

    test('rotates O-piece (should remain the same)', () => {
      const originalO = [
        [1, 1],
        [1, 1]
      ];
      const rotatedO = rotateTetromino(originalO);
      expect(rotatedO).toEqual(originalO);
    });
  });

  describe('isValidMove', () => {
    let emptyBoard: number[][];
    let piece: GamePiece;

    beforeEach(() => {
      emptyBoard = createEmptyBoard();
      piece = {
        tetromino: TETROMINOES.I,
        position: { x: 0, y: 0 }
      };
    });

    test('allows valid move on empty board', () => {
      const position: Position = { x: 5, y: 10 };
      expect(isValidMove(emptyBoard, piece, position)).toBe(true);
    });

    test('rejects move outside left boundary', () => {
      const position: Position = { x: -1, y: 0 };
      expect(isValidMove(emptyBoard, piece, position)).toBe(false);
    });

    test('rejects move outside right boundary', () => {
      const position: Position = { x: BOARD_WIDTH, y: 0 };
      expect(isValidMove(emptyBoard, piece, position)).toBe(false);
    });

    test('rejects move outside bottom boundary', () => {
      const position: Position = { x: 0, y: BOARD_HEIGHT };
      expect(isValidMove(emptyBoard, piece, position)).toBe(false);
    });

    test('rejects move into occupied cell', () => {
      // Place something on the board
      emptyBoard[19][5] = 1;
      piece = {
        tetromino: TETROMINOES.I,
        position: { x: 5, y: 19 }
      };
      const position: Position = { x: 5, y: 19 };
      expect(isValidMove(emptyBoard, piece, position)).toBe(false);
    });

    test('allows move with piece partially above board', () => {
      const position: Position = { x: 5, y: -1 };
      expect(isValidMove(emptyBoard, piece, position)).toBe(true);
    });

    test('respects test mode collision flag', () => {
      (window as any).testForceCollision = true;
      const position: Position = { x: 5, y: 10 };
      expect(isValidMove(emptyBoard, piece, position)).toBe(false);
      delete (window as any).testForceCollision;
    });
  });

  describe('placePiece', () => {
    let board: number[][];
    let piece: GamePiece;

    beforeEach(() => {
      board = createEmptyBoard();
      piece = {
        tetromino: TETROMINOES.O, // 2x2 square
        position: { x: 5, y: 18 }
      };
    });

    test('places piece on board correctly', () => {
      const newBoard = placePiece(board, piece);

      // Original board should be unchanged
      expect(board[18][5]).toBe(0);

      // New board should have piece placed
      expect(newBoard[18][5]).toBe(1);
      expect(newBoard[18][6]).toBe(1);
      expect(newBoard[19][5]).toBe(1);
      expect(newBoard[19][6]).toBe(1);
    });

    test('does not place piece above board boundary', () => {
      piece.position = { x: 5, y: -1 };
      const newBoard = placePiece(board, piece);

      // Should only place the part that's within bounds
      expect(newBoard[0][5]).toBe(1);
      expect(newBoard[0][6]).toBe(1);
    });

    test('creates new board instance', () => {
      const newBoard = placePiece(board, piece);
      expect(newBoard).not.toBe(board);
    });
  });

  describe('clearLines', () => {
    test('clears no lines when board has no complete rows', () => {
      const board = createEmptyBoard();
      const result = clearLines(board);

      expect(result.linesCleared).toBe(0);
      expect(result.newBoard).toEqual(board);
    });

    test('clears one complete line', () => {
      const board = createEmptyBoard();
      // Fill the bottom row completely
      for (let x = 0; x < BOARD_WIDTH; x++) {
        board[BOARD_HEIGHT - 1][x] = 1;
      }

      const result = clearLines(board);
      expect(result.linesCleared).toBe(1);
      expect(result.newBoard.length).toBe(BOARD_HEIGHT);

      // Bottom row should now be empty
      for (let x = 0; x < BOARD_WIDTH; x++) {
        expect(result.newBoard[BOARD_HEIGHT - 1][x]).toBe(0);
      }
    });

    test('clears multiple complete lines', () => {
      const board = createEmptyBoard();
      // Fill bottom two rows completely
      for (let y = BOARD_HEIGHT - 2; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          board[y][x] = 1;
        }
      }

      const result = clearLines(board);
      expect(result.linesCleared).toBe(2);
      expect(result.newBoard.length).toBe(BOARD_HEIGHT);
    });

    test('adds empty rows to maintain board height after clearing lines', () => {
      const board = createEmptyBoard();
      // Fill bottom row completely
      for (let x = 0; x < BOARD_WIDTH; x++) {
        board[BOARD_HEIGHT - 1][x] = 1;
      }

      const result = clearLines(board);
      expect(result.newBoard.length).toBe(BOARD_HEIGHT);

      // Top row should be empty (newly added)
      for (let x = 0; x < BOARD_WIDTH; x++) {
        expect(result.newBoard[0][x]).toBe(0);
      }
    });

    test('handles test mode for line clearing', () => {
      (window as any).testForceClearLines = true;
      const board = createEmptyBoard();

      const result = clearLines(board);
      expect(result.linesCleared).toBe(2);
      expect(result.newBoard.length).toBe(BOARD_HEIGHT);

      delete (window as any).testForceClearLines;
    });

    test('covers the while loop that adds empty rows (line 164)', () => {
      // Create a board with some complete lines to trigger actual line clearing
      const board = createEmptyBoard();

      // Fill several complete rows
      for (let y = BOARD_HEIGHT - 3; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          board[y][x] = 1;
        }
      }

      // Make sure we're not in test mode
      delete (window as any).testForceClearLines;

      const result = clearLines(board);

      // Should have cleared 3 lines
      expect(result.linesCleared).toBe(3);

      // Board should still be the correct height
      expect(result.newBoard.length).toBe(BOARD_HEIGHT);

      // The while loop should have added 3 empty rows at the top
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          expect(result.newBoard[y][x]).toBe(0);
        }
      }
    });

    test('covers test mode in isValidMove (line 109)', () => {
      const board = createEmptyBoard();
      const piece: GamePiece = {
        tetromino: TETROMINOES.I,
        position: { x: 0, y: 0 }
      };

      // Set test mode flag
      (window as any).testForceCollision = true;

      // Should return false due to test mode, regardless of actual validity
      const position: Position = { x: 5, y: 10 };
      expect(isValidMove(board, piece, position)).toBe(false);

      // Clean up
      delete (window as any).testForceCollision;
    });

    test('covers test mode in clearLines (line 131)', () => {
      const board = createEmptyBoard();

      // Set test mode flag
      (window as any).testForceClearLines = true;

      const result = clearLines(board);

      // Should return test mode results
      expect(result.linesCleared).toBe(2);
      expect(result.newBoard.length).toBe(BOARD_HEIGHT);

      // Clean up
      delete (window as any).testForceClearLines;
    });
  });
});