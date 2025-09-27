import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Game from './Game';

// Mock the game components since we're testing the layout
jest.mock('../game/TicTacToe', () => {
  return {
    __esModule: true,
    default: function MockTicTacToe() {
      return <div data-testid="tictactoe-game">TicTacToe Game</div>;
    }
  };
});

jest.mock('../game/Tetris', () => {
  return {
    __esModule: true,
    default: function MockTetris() {
      return <div data-testid="tetris-game">Tetris Game</div>;
    }
  };
});

describe('Game Component', () => {
  test('renders game selection menu initially', () => {
    render(<Game />);

    expect(screen.getByText('Choose a Game')).toBeInTheDocument();
    expect(screen.getByText('Tic Tac Toe')).toBeInTheDocument();
    expect(screen.getByText('Tetris')).toBeInTheDocument();
  });

  test('renders TicTacToe game when selected', () => {
    render(<Game />);

    const ticTacToeButton = screen.getByText('Tic Tac Toe');
    fireEvent.click(ticTacToeButton);

    expect(screen.getByTestId('tictactoe-game')).toBeInTheDocument();
    expect(screen.getByText('← Back to Game Selection')).toBeInTheDocument();
  });

  test('renders Tetris game when selected', () => {
    render(<Game />);

    const tetrisButton = screen.getByText('Tetris');
    fireEvent.click(tetrisButton);

    expect(screen.getByTestId('tetris-game')).toBeInTheDocument();
    expect(screen.getByText('← Back to Game Selection')).toBeInTheDocument();
  });

  test('returns to game selection from TicTacToe', () => {
    render(<Game />);

    // Select TicTacToe
    const ticTacToeButton = screen.getByText('Tic Tac Toe');
    fireEvent.click(ticTacToeButton);

    // Go back
    const backButton = screen.getByText('← Back to Game Selection');
    fireEvent.click(backButton);

    // Should show game selection again
    expect(screen.getByText('Choose a Game')).toBeInTheDocument();
    expect(screen.getByText('Tic Tac Toe')).toBeInTheDocument();
    expect(screen.getByText('Tetris')).toBeInTheDocument();
  });

  test('returns to game selection from Tetris', () => {
    render(<Game />);

    // Select Tetris
    const tetrisButton = screen.getByText('Tetris');
    fireEvent.click(tetrisButton);

    // Go back
    const backButton = screen.getByText('← Back to Game Selection');
    fireEvent.click(backButton);

    // Should show game selection again
    expect(screen.getByText('Choose a Game')).toBeInTheDocument();
    expect(screen.getByText('Tic Tac Toe')).toBeInTheDocument();
    expect(screen.getByText('Tetris')).toBeInTheDocument();
  });

  test('applies correct styling classes to game selection', () => {
    const { container } = render(<Game />);
    const gameContainer = container.firstChild;

    expect(gameContainer).toHaveClass(
      'min-h-screen',
      'bg-gradient-to-br',
      'from-slate-900',
      'to-slate-800',
      'flex',
      'items-center',
      'justify-center',
      'p-4'
    );
  });

  test('applies correct styling classes to TicTacToe game view', () => {
    const { container } = render(<Game />);

    // Select TicTacToe
    const ticTacToeButton = screen.getByText('Tic Tac Toe');
    fireEvent.click(ticTacToeButton);

    const gameContainer = container.firstChild;
    expect(gameContainer).toHaveClass(
      'min-h-screen',
      'bg-gradient-to-br',
      'from-slate-900',
      'to-slate-800',
      'flex',
      'flex-col',
      'items-center',
      'justify-center',
      'p-4'
    );
  });

  test('applies correct styling classes to Tetris game view', () => {
    const { container } = render(<Game />);

    // Select Tetris
    const tetrisButton = screen.getByText('Tetris');
    fireEvent.click(tetrisButton);

    const gameContainer = container.firstChild;
    expect(gameContainer).toHaveClass(
      'min-h-screen',
      'bg-gradient-to-br',
      'from-slate-900',
      'to-slate-800',
      'flex',
      'flex-col',
      'items-center',
      'justify-center',
      'p-4'
    );
  });
});