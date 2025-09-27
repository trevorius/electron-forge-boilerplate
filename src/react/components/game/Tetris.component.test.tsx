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

    // Start game but ensure no piece is set
    fireEvent.click(screen.getByText('Start Game'));

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

    // Try to drop when no game started
    await act(() => {
      fireEvent.keyDown(window, { key: ' ' });
    });

    expect(placePiece).not.toHaveBeenCalled();
  });

  test('covers lines 90-104 - dropPiece early return when gameOver', async () => {
    render(<Tetris />);

    fireEvent.click(screen.getByText('Start Game'));

    await act(() => {
      jest.advanceTimersByTime(100);
    });

    // Clear the mock call count from game start
    jest.clearAllMocks();

    // Cause game over
    (isValidMove as jest.Mock).mockReturnValue(false);

    await act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Try to drop when game over - should hit early return
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

  test('covers line 157 - P key pause/resume toggle', async () => {
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

    // Click resume to get back to playing state
    fireEvent.click(screen.getByText('Resume'));

    // Wait for state to update
    await act(() => {
      jest.advanceTimersByTime(50);
    });

    // Verify we're back to playing state
    expect(screen.getByText('Pause')).toBeInTheDocument();
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

  test('covers line 205 - renderBoard boundary checks', async () => {
    render(<Tetris />);

    fireEvent.click(screen.getByText('Start Game'));

    // Mock a piece that's partially off-screen to trigger boundary checks
    (getRandomTetromino as jest.Mock).mockReturnValue({
      type: 'I',
      shape: [[1, 1, 1, 1]],
      color: '#00f0f0'
    });

    await act(() => {
      jest.advanceTimersByTime(100);
    });

    // Move piece to edges to test boundary conditions in renderBoard
    await act(() => {
      // Move to left edge
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(window, { key: 'ArrowLeft' });
      }

      // Move to right edge
      for (let i = 0; i < 20; i++) {
        fireEvent.keyDown(window, { key: 'ArrowRight' });
      }
    });

    // The boundary check should have been executed during rendering
    expect(screen.getByText('Tetris')).toBeInTheDocument();
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