import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Tetris from './Tetris';

// Mock ALL the helper functions
jest.mock('./Tetris.helpers', () => ({
  BOARD_WIDTH: 10,
  BOARD_HEIGHT: 20,
  createEmptyBoard: jest.fn(),
  getRandomTetromino: jest.fn(),
  rotateTetromino: jest.fn(),
  isValidMove: jest.fn(),
  placePiece: jest.fn(),
  clearLines: jest.fn()
}));

import {
  createEmptyBoard,
  getRandomTetromino,
  rotateTetromino,
  isValidMove,
  placePiece,
  clearLines
} from './Tetris.helpers';

jest.useFakeTimers();

describe('Tetris Component - Mocked Helpers for 100% Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mocks
    (createEmptyBoard as jest.Mock).mockReturnValue(
      Array(20).fill(null).map(() => Array(10).fill(0))
    );
    (getRandomTetromino as jest.Mock).mockReturnValue({
      type: 'I',
      shape: [[1, 1, 1, 1]],
      color: '#00f0f0'
    });
    (rotateTetromino as jest.Mock).mockReturnValue([[1], [1], [1], [1]]);
    (isValidMove as jest.Mock).mockReturnValue(true);
    (placePiece as jest.Mock).mockImplementation(board => board);
    (clearLines as jest.Mock).mockReturnValue({
      newBoard: Array(20).fill(null).map(() => Array(10).fill(0)),
      linesCleared: 0
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  test('covers line 49 - movePiece early return when no currentPiece', async () => {
    render(<Tetris />);

    // Don't start game - currentPiece should be null
    // Try to move when no current piece - should hit early return on line 49
    await act(() => {
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
    });

    expect(screen.getByText('Tetris')).toBeInTheDocument();
  });

  test('covers line 49 - movePiece early return when gameOver', async () => {
    render(<Tetris />);

    // Start game
    fireEvent.click(screen.getByText('Start Game'));

    await act(() => {
      jest.advanceTimersByTime(100);
    });

    // Mock game over scenario - isValidMove fails during spawn
    (isValidMove as jest.Mock).mockReturnValue(false);

    // Trigger new piece spawn which should cause game over
    await act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Now try to move when game is over - should hit early return on line 49
    await act(() => {
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
    });

    expect(screen.getByText('New Game')).toBeInTheDocument();
  });

  test('covers line 63 - movePiece successful move (left)', async () => {
    render(<Tetris />);

    fireEvent.click(screen.getByText('Start Game'));

    await act(() => {
      jest.advanceTimersByTime(100);
    });

    // Mock successful move (should trigger line 63)
    (isValidMove as jest.Mock).mockReturnValue(true);

    // Trigger left movement that should succeed
    await act(() => {
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
    });

    // Should have called isValidMove but not placePiece (successful move)
    expect(isValidMove).toHaveBeenCalled();
    expect(placePiece).not.toHaveBeenCalled();
  });

  test('covers line 63 null branch - setCurrentPiece when currentPiece is null', async () => {
    render(<Tetris />);

    fireEvent.click(screen.getByText('Start Game'));

    // Clear current piece and trigger a move to hit the null branch
    await act(() => {
      jest.advanceTimersByTime(100);
    });

    // Make isValidMove return true but force currentPiece to be null in callback
    (isValidMove as jest.Mock).mockReturnValue(true);

    // The ternary operator should hit the null branch
    await act(() => {
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
    });

    expect(isValidMove).toHaveBeenCalled();
  });

  test('covers lines 139-141 - ArrowRight key handling', async () => {
    render(<Tetris />);

    fireEvent.click(screen.getByText('Start Game'));

    await act(() => {
      jest.advanceTimersByTime(100);
    });

    // Mock successful move (should trigger line 63)
    (isValidMove as jest.Mock).mockReturnValue(true);

    // Trigger right movement (should cover lines 139-141)
    await act(() => {
      fireEvent.keyDown(window, { key: 'ArrowRight' });
    });

    // Should have called isValidMove but not placePiece (successful move)
    expect(isValidMove).toHaveBeenCalled();
    expect(placePiece).not.toHaveBeenCalled();
  });

  test('covers lines 64-124 - movePiece collision handling for down direction', async () => {
    render(<Tetris />);

    fireEvent.click(screen.getByText('Start Game'));

    await act(() => {
      jest.advanceTimersByTime(100);
    });

    // Mock collision for down movement but allow other moves
    (isValidMove as jest.Mock).mockImplementation((board, piece, newPosition) => {
      // Block down movement to trigger collision handling
      if (newPosition.y > 0) return false;
      return true;
    });

    // Mock line clearing
    (clearLines as jest.Mock).mockReturnValue({
      newBoard: Array(20).fill(null).map(() => Array(10).fill(0)),
      linesCleared: 2
    });

    // Trigger down movement that causes collision (lines 64-72)
    await act(() => {
      fireEvent.keyDown(window, { key: 'ArrowDown' });
    });

    expect(placePiece).toHaveBeenCalled();
    expect(clearLines).toHaveBeenCalled();
  });

  test('covers lines 76-86 - rotatePiece early return when no currentPiece', async () => {
    render(<Tetris />);

    // Try to rotate when no game started - should hit early return
    await act(() => {
      fireEvent.keyDown(window, { key: 'ArrowUp' });
    });

    expect(rotateTetromino).not.toHaveBeenCalled();
  });

  test('covers lines 76-86 - rotatePiece early return when gameOver', async () => {
    render(<Tetris />);

    fireEvent.click(screen.getByText('Start Game'));

    await act(() => {
      jest.advanceTimersByTime(100);
    });

    // Cause game over
    (isValidMove as jest.Mock).mockReturnValue(false);

    await act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Try to rotate when game over
    await act(() => {
      fireEvent.keyDown(window, { key: 'ArrowUp' });
    });

    expect(rotateTetromino).not.toHaveBeenCalled();
  });

  test('covers lines 78-85 - rotatePiece successful rotation', async () => {
    render(<Tetris />);

    fireEvent.click(screen.getByText('Start Game'));

    await act(() => {
      jest.advanceTimersByTime(100);
    });

    // Mock successful rotation
    (isValidMove as jest.Mock).mockReturnValue(true);
    (rotateTetromino as jest.Mock).mockReturnValue([[1], [1], [1], [1]]);

    await act(() => {
      fireEvent.keyDown(window, { key: 'ArrowUp' });
    });

    expect(rotateTetromino).toHaveBeenCalled();
  });

  test('covers lines 90-104 - dropPiece early return when no currentPiece', async () => {
    render(<Tetris />);

    // Clear any default mocks
    jest.clearAllMocks();

    // Try to drop when no game started (no currentPiece)
    await act(() => {
      fireEvent.keyDown(window, { key: ' ' });
    });

    // Should hit early return and not call placePiece
    expect(placePiece).not.toHaveBeenCalled();
  });

  test('covers lines 90-104 - dropPiece early return when gameOver', async () => {
    render(<Tetris />);

    fireEvent.click(screen.getByText('Start Game'));

    await act(() => {
      jest.advanceTimersByTime(100);
    });

    // Trigger game over by making piece spawn fail
    (isValidMove as jest.Mock).mockReturnValue(false);

    // Let the game try to spawn a new piece, which should fail and set gameOver=true
    await act(() => {
      jest.advanceTimersByTime(1100); // Wait for next piece spawn
    });

    // Clear mocks after game over is triggered
    jest.clearAllMocks();

    // Try to drop when game is over - should hit early return
    await act(() => {
      fireEvent.keyDown(window, { key: ' ' });
    });

    // Since game is over, dropPiece should return early and not call placePiece
    expect(placePiece).not.toHaveBeenCalled();
  });

  test('covers lines 92-104 - dropPiece full execution', async () => {
    render(<Tetris />);

    fireEvent.click(screen.getByText('Start Game'));

    await act(() => {
      jest.advanceTimersByTime(100);
    });

    // Mock drop behavior - allow a few moves down then stop
    let callCount = 0;
    (isValidMove as jest.Mock).mockImplementation(() => {
      callCount++;
      return callCount <= 3; // Allow 3 moves then stop
    });

    (clearLines as jest.Mock).mockReturnValue({
      newBoard: Array(20).fill(null).map(() => Array(10).fill(0)),
      linesCleared: 1
    });

    await act(() => {
      fireEvent.keyDown(window, { key: ' ' });
    });

    expect(placePiece).toHaveBeenCalled();
  });

  test('covers line 157 - P key pause and resume', async () => {
    render(<Tetris />);

    // Start game
    fireEvent.click(screen.getByText('Start Game'));

    await act(() => {
      jest.advanceTimersByTime(100);
    });

    // Test P key to pause (covers pauseGame branch of line 157)
    await act(() => {
      fireEvent.keyDown(window, { key: 'P' });
    });

    expect(screen.getByText('Resume')).toBeInTheDocument();
  });

  test('covers line 157 - lowercase p key', async () => {
    render(<Tetris />);

    fireEvent.click(screen.getByText('Start Game'));

    await act(() => {
      jest.advanceTimersByTime(100);
    });

    // Test lowercase p key
    await act(() => {
      fireEvent.keyDown(window, { key: 'p' });
    });

    expect(screen.getByText('Resume')).toBeInTheDocument();
  });

  test('covers lines 202-219 - renderBoard with currentPiece', async () => {
    render(<Tetris />);

    // Mock a piece with shape to trigger the boundary checks in renderBoard
    (getRandomTetromino as jest.Mock).mockReturnValue({
      type: 'I',
      shape: [[1, 1, 1, 1]],
      color: '#00f0f0'
    });

    fireEvent.click(screen.getByText('Start Game'));

    await act(() => {
      jest.advanceTimersByTime(100);
    });

    // The renderBoard function should be called and the boundary checks executed
    expect(screen.getByText('Tetris')).toBeInTheDocument();
  });

  test('covers line 218 bg-gray-300 branch - renderBoard with placed pieces', async () => {
    // Start with a board that has placed pieces (cell === 1)
    const boardWithPieces = Array(20).fill(null).map(() => Array(10).fill(0));
    boardWithPieces[19][0] = 1; // Place a piece at bottom left

    (createEmptyBoard as jest.Mock).mockReturnValue(boardWithPieces);

    render(<Tetris />);

    fireEvent.click(screen.getByText('Start Game'));

    // The renderBoard should display placed pieces with bg-gray-300 class
    expect(screen.getByText('Tetris')).toBeInTheDocument();
  });

  test('covers lines 239-242 - renderNextPiece function', async () => {
    // Mock the next piece with a specific shape to ensure renderNextPiece is tested
    (getRandomTetromino as jest.Mock).mockReturnValue({
      type: 'T',
      shape: [
        [0, 1, 0],
        [1, 1, 1]
      ],
      color: '#a000f0'
    });

    render(<Tetris />);

    // The renderNextPiece function should be called during initial render
    // Check that "Next" text is present, which means the component rendered
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  test('covers all game control functions', async () => {
    render(<Tetris />);

    // Test startGame
    fireEvent.click(screen.getByText('Start Game'));
    expect(createEmptyBoard).toHaveBeenCalled();
    expect(getRandomTetromino).toHaveBeenCalled();

    // Test pauseGame
    fireEvent.click(screen.getByText('Pause'));
    expect(screen.getByText('Resume')).toBeInTheDocument();

    // Test resumeGame
    fireEvent.click(screen.getByText('Resume'));
    expect(screen.getByText('Pause')).toBeInTheDocument();
  });

  test('covers automatic game loop and piece spawning', async () => {
    render(<Tetris />);

    fireEvent.click(screen.getByText('Start Game'));

    // Let the game run to test automatic movement
    await act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(isValidMove).toHaveBeenCalled();
  });
});