import React from 'react';
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
  handleGameOverLogic,
  handleGameOverDialogChange,
  handlePiecePlacement,
  calculateDropPosition,
  shouldGameEnd,
  canPieceMove,
  handlePauseResume,
  isPositionInBounds,
  calculateMovementDelta,
  handleFailedMovement,
  canPerformAction,
  createGameState,
  createPauseState,
  createResumeState,
  renderPieceOnBoard,
  highScoreDialogOnOpenChange,
  handlePlayerNameChange,
  handlePlayerNameKeyPress,
  handleHighScoreSkip,
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

  describe('New Helper Functions for Enhanced Testability', () => {
    describe('handleGameOverLogic', () => {
      test('returns true when spawn is invalid (game over)', () => {
        expect(handleGameOverLogic(false)).toBe(true);
      });

      test('returns false when spawn is valid (continue game)', () => {
        expect(handleGameOverLogic(true)).toBe(false);
      });
    });

    describe('shouldGameEnd', () => {
      test('returns true when piece cannot spawn', () => {
        const board = createEmptyBoard();
        // Block spawn position
        board[0][4] = 1;
        board[0][5] = 1;

        const piece: GamePiece = {
          tetromino: TETROMINOES.I,
          position: { x: 4, y: 0 }
        };

        expect(shouldGameEnd(board, piece)).toBe(true);
      });

      test('returns false when piece can spawn', () => {
        const board = createEmptyBoard();
        const piece: GamePiece = {
          tetromino: TETROMINOES.I,
          position: { x: 4, y: 0 }
        };

        expect(shouldGameEnd(board, piece)).toBe(false);
      });
    });

    describe('handlePiecePlacement', () => {
      test('places piece and calculates score correctly', () => {
        const board = createEmptyBoard();
        // Create a setup for line clearing
        for (let x = 0; x < BOARD_WIDTH - 1; x++) {
          board[BOARD_HEIGHT - 1][x] = 1;
        }

        const piece: GamePiece = {
          tetromino: TETROMINOES.I,
          position: { x: BOARD_WIDTH - 1, y: BOARD_HEIGHT - 1 }
        };

        const result = handlePiecePlacement(board, piece, 100, 2);

        expect(result.linesCleared).toBe(1);
        expect(result.scoreIncrease).toBe(200); // 1 line * 100 * level 2
        expect(result.newBoard).toHaveLength(BOARD_HEIGHT);
      });

      test('handles placement without line clearing', () => {
        const board = createEmptyBoard();
        const piece: GamePiece = {
          tetromino: TETROMINOES.O,
          position: { x: 4, y: 18 }
        };

        const result = handlePiecePlacement(board, piece, 0, 1);

        expect(result.linesCleared).toBe(0);
        expect(result.scoreIncrease).toBe(0);
        expect(result.newBoard[18][4]).toBe(1);
        expect(result.newBoard[18][5]).toBe(1);
      });
    });

    describe('calculateDropPosition', () => {
      test('calculates drop position on empty board', () => {
        const board = createEmptyBoard();
        const piece: GamePiece = {
          tetromino: TETROMINOES.I,
          position: { x: 4, y: 0 }
        };

        const dropPosition = calculateDropPosition(board, piece);
        expect(dropPosition.x).toBe(4);
        expect(dropPosition.y).toBe(BOARD_HEIGHT - 1); // Should drop to bottom
      });

      test('calculates drop position with obstacles', () => {
        const board = createEmptyBoard();
        // Place obstacle
        board[18][4] = 1;
        board[18][5] = 1;
        board[18][6] = 1;
        board[18][7] = 1;

        const piece: GamePiece = {
          tetromino: TETROMINOES.I,
          position: { x: 4, y: 0 }
        };

        const dropPosition = calculateDropPosition(board, piece);
        expect(dropPosition.x).toBe(4);
        expect(dropPosition.y).toBe(17); // Should stop above obstacle
      });

      test('handles piece already at bottom', () => {
        const board = createEmptyBoard();
        const piece: GamePiece = {
          tetromino: TETROMINOES.I,
          position: { x: 4, y: BOARD_HEIGHT - 1 }
        };

        const dropPosition = calculateDropPosition(board, piece);
        expect(dropPosition.x).toBe(4);
        expect(dropPosition.y).toBe(BOARD_HEIGHT - 1); // No movement needed
      });
    });
  });

  describe('Coverage Enhancement Helper Functions', () => {
    describe('canPieceMove', () => {
      test('returns true when piece exists and game not over', () => {
        const piece: GamePiece = {
          tetromino: TETROMINOES.I,
          position: { x: 4, y: 0 }
        };
        expect(canPieceMove(piece, false)).toBe(true);
      });

      test('returns false when no current piece', () => {
        expect(canPieceMove(null, false)).toBe(false);
      });

      test('returns false when game is over', () => {
        const piece: GamePiece = {
          tetromino: TETROMINOES.I,
          position: { x: 4, y: 0 }
        };
        expect(canPieceMove(piece, true)).toBe(false);
      });

      test('returns false when no piece and game over', () => {
        expect(canPieceMove(null, true)).toBe(false);
      });
    });

    describe('handlePauseResume', () => {
      test('calls pauseGame when isPlaying is true', () => {
        const pauseFn = jest.fn();
        const resumeFn = jest.fn();

        handlePauseResume(true, pauseFn, resumeFn);

        expect(pauseFn).toHaveBeenCalled();
        expect(resumeFn).not.toHaveBeenCalled();
      });

      test('calls resumeGame when isPlaying is false', () => {
        const pauseFn = jest.fn();
        const resumeFn = jest.fn();

        handlePauseResume(false, pauseFn, resumeFn);

        expect(pauseFn).not.toHaveBeenCalled();
        expect(resumeFn).toHaveBeenCalled();
      });
    });

    describe('isPositionInBounds', () => {
      test('returns true for valid position', () => {
        expect(isPositionInBounds(5, 10)).toBe(true);
      });

      test('returns false for x less than 0', () => {
        expect(isPositionInBounds(-1, 10)).toBe(false);
      });

      test('returns false for x greater than board width', () => {
        expect(isPositionInBounds(BOARD_WIDTH, 10)).toBe(false);
      });

      test('returns false for y less than 0', () => {
        expect(isPositionInBounds(5, -1)).toBe(false);
      });

      test('returns false for y greater than board height', () => {
        expect(isPositionInBounds(5, BOARD_HEIGHT)).toBe(false);
      });

      test('returns true for boundary positions', () => {
        expect(isPositionInBounds(0, 0)).toBe(true);
        expect(isPositionInBounds(BOARD_WIDTH - 1, BOARD_HEIGHT - 1)).toBe(true);
      });
    });

    describe('calculateMovementDelta', () => {
      test('returns correct delta for left movement', () => {
        expect(calculateMovementDelta('left')).toEqual({ x: -1, y: 0 });
      });

      test('returns correct delta for right movement', () => {
        expect(calculateMovementDelta('right')).toEqual({ x: 1, y: 0 });
      });

      test('returns correct delta for down movement', () => {
        expect(calculateMovementDelta('down')).toEqual({ x: 0, y: 1 });
      });
    });

    describe('handleFailedMovement', () => {
      const mockBoard = createEmptyBoard();
      const mockPiece: GamePiece = {
        tetromino: TETROMINOES.I,
        position: { x: 5, y: 10 }
      };

      test('returns shouldPlace true and placement result for down movement', () => {
        const result = handleFailedMovement('down', mockBoard, mockPiece, 100, 2);

        expect(result.shouldPlace).toBe(true);
        expect(result.placementResult).toBeDefined();
        expect(result.placementResult?.newBoard).toBeDefined();
        expect(result.placementResult?.scoreIncrease).toBeDefined();
        expect(result.placementResult?.linesCleared).toBeDefined();
      });

      test('returns shouldPlace false for left movement', () => {
        const result = handleFailedMovement('left', mockBoard, mockPiece, 100, 2);

        expect(result.shouldPlace).toBe(false);
        expect(result.placementResult).toBeUndefined();
      });

      test('returns shouldPlace false for right movement', () => {
        const result = handleFailedMovement('right', mockBoard, mockPiece, 100, 2);

        expect(result.shouldPlace).toBe(false);
        expect(result.placementResult).toBeUndefined();
      });
    });

    describe('canPerformAction', () => {
      const mockPiece: GamePiece = {
        tetromino: TETROMINOES.T,
        position: { x: 5, y: 5 }
      };

      test('returns true when piece exists and game is not over', () => {
        expect(canPerformAction(mockPiece, false)).toBe(true);
      });

      test('returns false when piece is null', () => {
        expect(canPerformAction(null, false)).toBe(false);
      });

      test('returns false when game is over', () => {
        expect(canPerformAction(mockPiece, true)).toBe(false);
      });

      test('returns false when piece is null and game is over', () => {
        expect(canPerformAction(null, true)).toBe(false);
      });
    });

    describe('createGameState', () => {
      test('creates correct initial game state', () => {
        const gameState = createGameState();

        expect(gameState.board).toEqual(createEmptyBoard());
        expect(gameState.score).toBe(0);
        expect(gameState.level).toBe(1);
        expect(gameState.lines).toBe(0);
        expect(gameState.gameOver).toBe(false);
        expect(gameState.isPlaying).toBe(true);
        expect(gameState.dropTime).toBe(1000);
        expect(gameState.currentPiece).toBe(null);
        expect(gameState.nextPiece).toBeDefined();
      });
    });

    describe('createPauseState', () => {
      test('creates correct pause state', () => {
        const pauseState = createPauseState();

        expect(pauseState.isPlaying).toBe(false);
      });
    });

    describe('createResumeState', () => {
      test('creates resume state with isPlaying true when game is not over', () => {
        const resumeState = createResumeState(false);

        expect(resumeState.isPlaying).toBe(true);
      });

      test('creates resume state with isPlaying false when game is over', () => {
        const resumeState = createResumeState(true);

        expect(resumeState.isPlaying).toBe(false);
      });
    });

    describe('renderPieceOnBoard', () => {
      const mockBoard = createEmptyBoard();

      test('returns original board when no current piece', () => {
        const result = renderPieceOnBoard(mockBoard, null);

        expect(result).toEqual(mockBoard);
        expect(result).not.toBe(mockBoard); // Should be a copy
      });

      test('renders piece on board within bounds', () => {
        const mockPiece: GamePiece = {
          tetromino: TETROMINOES.O, // 2x2 square
          position: { x: 4, y: 10 }
        };

        const result = renderPieceOnBoard(mockBoard, mockPiece);

        // Check that piece cells are marked as 2
        expect(result[10][4]).toBe(2);
        expect(result[10][5]).toBe(2);
        expect(result[11][4]).toBe(2);
        expect(result[11][5]).toBe(2);
      });

      test('handles piece positioned outside bounds gracefully', () => {
        const mockPiece: GamePiece = {
          tetromino: TETROMINOES.I,
          position: { x: -1, y: -1 } // Outside bounds
        };

        // This should not throw an error and should properly check bounds
        const result = renderPieceOnBoard(mockBoard, mockPiece);

        expect(result).toBeDefined();
        expect(result.length).toBe(BOARD_HEIGHT);
        expect(result[0].length).toBe(BOARD_WIDTH);
      });

      test('only renders piece cells within board boundaries', () => {
        const mockPiece: GamePiece = {
          tetromino: TETROMINOES.T,
          position: { x: BOARD_WIDTH - 1, y: BOARD_HEIGHT - 1 } // Near bottom-right edge
        };

        const result = renderPieceOnBoard(mockBoard, mockPiece);

        // Should handle boundary checks properly without errors
        expect(result).toBeDefined();
        expect(result.length).toBe(BOARD_HEIGHT);
      });

      test('renders complex piece shape correctly', () => {
        const mockPiece: GamePiece = {
          tetromino: TETROMINOES.T, // T-shape
          position: { x: 4, y: 10 }
        };

        const result = renderPieceOnBoard(mockBoard, mockPiece);

        // T-shape: [0,1,0], [1,1,1]
        expect(result[10][5]).toBe(2); // top center
        expect(result[11][4]).toBe(2); // bottom left
        expect(result[11][5]).toBe(2); // bottom center
        expect(result[11][6]).toBe(2); // bottom right
        expect(result[10][4]).toBe(0); // should remain empty
        expect(result[10][6]).toBe(0); // should remain empty
      });
    });
  });

  describe('handleGameOverDialogChange', () => {
    test('calls setShowGameOverDialog with the provided open state', () => {
      const mockSetShowGameOverDialog = jest.fn();

      // Test closing the dialog
      handleGameOverDialogChange(false, mockSetShowGameOverDialog);
      expect(mockSetShowGameOverDialog).toHaveBeenCalledWith(false);

      // Test opening the dialog
      handleGameOverDialogChange(true, mockSetShowGameOverDialog);
      expect(mockSetShowGameOverDialog).toHaveBeenCalledWith(true);

      expect(mockSetShowGameOverDialog).toHaveBeenCalledTimes(2);
    });

    test('returns undefined (void function)', () => {
      const mockSetShowGameOverDialog = jest.fn();
      const result = handleGameOverDialogChange(false, mockSetShowGameOverDialog);
      expect(result).toBeUndefined();
    });

    test('can be called with different state setter functions', () => {
      const mockSetter1 = jest.fn();
      const mockSetter2 = jest.fn();

      handleGameOverDialogChange(true, mockSetter1);
      handleGameOverDialogChange(false, mockSetter2);

      expect(mockSetter1).toHaveBeenCalledWith(true);
      expect(mockSetter2).toHaveBeenCalledWith(false);
    });
  });

  describe('High Score Helper Functions', () => {
    describe('highScoreDialogOnOpenChange', () => {
      test('is a void function that does nothing', () => {
        const result = highScoreDialogOnOpenChange();
        expect(result).toBeUndefined();
      });

      test('can be called multiple times without error', () => {
        expect(() => {
          highScoreDialogOnOpenChange();
          highScoreDialogOnOpenChange();
          highScoreDialogOnOpenChange();
        }).not.toThrow();
      });
    });

    describe('handlePlayerNameChange', () => {
      test('calls setPlayerName with the input value', () => {
        const mockSetPlayerName = jest.fn();
        const mockEvent = {
          target: { value: 'TestPlayer' }
        } as React.ChangeEvent<HTMLInputElement>;

        handlePlayerNameChange(mockEvent, mockSetPlayerName);
        expect(mockSetPlayerName).toHaveBeenCalledWith('TestPlayer');
      });

      test('handles empty string input', () => {
        const mockSetPlayerName = jest.fn();
        const mockEvent = {
          target: { value: '' }
        } as React.ChangeEvent<HTMLInputElement>;

        handlePlayerNameChange(mockEvent, mockSetPlayerName);
        expect(mockSetPlayerName).toHaveBeenCalledWith('');
      });

      test('handles input with spaces', () => {
        const mockSetPlayerName = jest.fn();
        const mockEvent = {
          target: { value: '  Player Name  ' }
        } as React.ChangeEvent<HTMLInputElement>;

        handlePlayerNameChange(mockEvent, mockSetPlayerName);
        expect(mockSetPlayerName).toHaveBeenCalledWith('  Player Name  ');
      });
    });

    describe('handlePlayerNameKeyPress', () => {
      test('calls saveHighScore when Enter key is pressed', () => {
        const mockSaveHighScore = jest.fn();
        const mockEvent = {
          key: 'Enter'
        } as React.KeyboardEvent<HTMLInputElement>;

        handlePlayerNameKeyPress(mockEvent, mockSaveHighScore);
        expect(mockSaveHighScore).toHaveBeenCalledTimes(1);
      });

      test('does not call saveHighScore for non-Enter keys', () => {
        const mockSaveHighScore = jest.fn();
        const mockEvent = {
          key: 'a'
        } as React.KeyboardEvent<HTMLInputElement>;

        handlePlayerNameKeyPress(mockEvent, mockSaveHighScore);
        expect(mockSaveHighScore).not.toHaveBeenCalled();
      });

      test('handles different key presses correctly', () => {
        const mockSaveHighScore = jest.fn();

        const testKeys = ['Space', 'Escape', 'Tab', 'ArrowUp', 'Shift'];
        testKeys.forEach(key => {
          const mockEvent = { key } as React.KeyboardEvent<HTMLInputElement>;
          handlePlayerNameKeyPress(mockEvent, mockSaveHighScore);
        });

        expect(mockSaveHighScore).not.toHaveBeenCalled();
      });

      test('handles Enter key case sensitivity', () => {
        const mockSaveHighScore = jest.fn();

        // Test lowercase 'enter' - should not trigger
        const lowerEvent = { key: 'enter' } as React.KeyboardEvent<HTMLInputElement>;
        handlePlayerNameKeyPress(lowerEvent, mockSaveHighScore);
        expect(mockSaveHighScore).not.toHaveBeenCalled();

        // Test correct case 'Enter' - should trigger
        const correctEvent = { key: 'Enter' } as React.KeyboardEvent<HTMLInputElement>;
        handlePlayerNameKeyPress(correctEvent, mockSaveHighScore);
        expect(mockSaveHighScore).toHaveBeenCalledTimes(1);
      });
    });

    describe('handleHighScoreSkip', () => {
      test('calls all three state setter functions with correct values', () => {
        const mockSetShowHighScoreDialog = jest.fn();
        const mockSetShowGameOverDialog = jest.fn();
        const mockSetPlayerName = jest.fn();

        handleHighScoreSkip(mockSetShowHighScoreDialog, mockSetShowGameOverDialog, mockSetPlayerName);

        expect(mockSetShowHighScoreDialog).toHaveBeenCalledWith(false);
        expect(mockSetShowGameOverDialog).toHaveBeenCalledWith(true);
        expect(mockSetPlayerName).toHaveBeenCalledWith('');
      });

      test('calls functions in the correct order', () => {
        const callOrder: string[] = [];
        const mockSetShowHighScoreDialog = jest.fn(() => callOrder.push('hideHighScore'));
        const mockSetShowGameOverDialog = jest.fn(() => callOrder.push('showGameOver'));
        const mockSetPlayerName = jest.fn(() => callOrder.push('clearName'));

        handleHighScoreSkip(mockSetShowHighScoreDialog, mockSetShowGameOverDialog, mockSetPlayerName);

        expect(callOrder).toEqual(['hideHighScore', 'showGameOver', 'clearName']);
      });

      test('returns undefined (void function)', () => {
        const mockSetShowHighScoreDialog = jest.fn();
        const mockSetShowGameOverDialog = jest.fn();
        const mockSetPlayerName = jest.fn();

        const result = handleHighScoreSkip(mockSetShowHighScoreDialog, mockSetShowGameOverDialog, mockSetPlayerName);
        expect(result).toBeUndefined();
      });
    });
  });
});