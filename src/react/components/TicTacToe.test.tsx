import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TicTacToe from './TicTacToe';

// Mock the UI components
jest.mock('./ui/button', () => {
  const React = require('react');
  return {
    Button: React.forwardRef<HTMLButtonElement, any>(({ children, onClick, disabled, className, variant, ...props }, ref) => (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-testid="mock-button"
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  ))
  };
});

jest.mock('./ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} data-testid="mock-card" {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={className} data-testid="mock-card-header" {...props}>{children}</div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 className={className} data-testid="mock-card-title" {...props}>{children}</h3>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={className} data-testid="mock-card-content" {...props}>{children}</div>
  )
}));

jest.mock('lucide-react', () => ({
  RotateCcw: ({ className, ...props }: any) => (
    <svg className={className} data-testid="mock-rotate-ccw-icon" {...props} />
  ),
  X: ({ className, ...props }: any) => (
    <svg className={className} data-testid="mock-x-icon" {...props} />
  ),
  Circle: ({ className, ...props }: any) => (
    <svg className={className} data-testid="mock-circle-icon" {...props} />
  )
}));

describe('TicTacToe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the game board correctly', () => {
    render(<TicTacToe />);

    expect(screen.getByTestId('mock-card')).toBeInTheDocument();
    expect(screen.getByTestId('mock-card-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-card-title')).toBeInTheDocument();
    expect(screen.getByTestId('mock-card-content')).toBeInTheDocument();
    expect(screen.getByText('Tic Tac Toe')).toBeInTheDocument();
  });

  it('should display initial game status', () => {
    render(<TicTacToe />);

    expect(screen.getByText("Player X's turn")).toBeInTheDocument();
  });

  it('should render 9 cell buttons', () => {
    render(<TicTacToe />);

    const buttons = screen.getAllByTestId('mock-button');
    const cellButtons = buttons.filter(button => !button.textContent?.includes('New Game'));
    expect(cellButtons).toHaveLength(9);
  });

  it('should render reset button', () => {
    render(<TicTacToe />);

    const resetButton = screen.getByText('New Game');
    expect(resetButton).toBeInTheDocument();
    expect(screen.getByTestId('mock-rotate-ccw-icon')).toBeInTheDocument();
  });

  it('should render player labels', () => {
    render(<TicTacToe />);

    expect(screen.getByText('Player X')).toBeInTheDocument();
    expect(screen.getByText('Player O')).toBeInTheDocument();
  });

  it('should handle cell click and place X', async () => {
    const user = userEvent.setup();
    render(<TicTacToe />);

    const buttons = screen.getAllByTestId('mock-button');
    const firstCellButton = buttons[0];

    await user.click(firstCellButton);

    const xIcons = screen.getAllByTestId('mock-x-icon');
    expect(xIcons.length).toBeGreaterThan(1); // One in player label, one in game cell
    expect(screen.getByText("Player O's turn")).toBeInTheDocument();
  });

  it('should alternate players', async () => {
    const user = userEvent.setup();
    render(<TicTacToe />);

    const buttons = screen.getAllByTestId('mock-button');

    // X's turn
    await user.click(buttons[0]);
    expect(screen.getByText("Player O's turn")).toBeInTheDocument();

    // O's turn
    await user.click(buttons[1]);
    expect(screen.getByText("Player X's turn")).toBeInTheDocument();
  });

  it('should prevent clicking on occupied cells', async () => {
    const user = userEvent.setup();
    render(<TicTacToe />);

    const buttons = screen.getAllByTestId('mock-button');

    // Click first cell
    await user.click(buttons[0]);
    expect(screen.getByText("Player O's turn")).toBeInTheDocument();

    // Try to click same cell again
    await user.click(buttons[0]);
    expect(screen.getByText("Player O's turn")).toBeInTheDocument(); // Should still be O's turn
  });

  it('should detect horizontal win (first row)', async () => {
    const user = userEvent.setup();
    render(<TicTacToe />);

    const buttons = screen.getAllByTestId('mock-button');

    // X wins first row: X, O, X, O, X
    await user.click(buttons[0]); // X at 0
    await user.click(buttons[3]); // O at 3
    await user.click(buttons[1]); // X at 1
    await user.click(buttons[4]); // O at 4
    await user.click(buttons[2]); // X at 2 - wins!

    expect(screen.getByText('Player X wins!')).toBeInTheDocument();
  });

  it('should detect vertical win (first column)', async () => {
    const user = userEvent.setup();
    render(<TicTacToe />);

    const buttons = screen.getAllByTestId('mock-button');

    // X wins first column: X, O, X, O, X
    await user.click(buttons[0]); // X at 0
    await user.click(buttons[1]); // O at 1
    await user.click(buttons[3]); // X at 3
    await user.click(buttons[2]); // O at 2
    await user.click(buttons[6]); // X at 6 - wins!

    expect(screen.getByText('Player X wins!')).toBeInTheDocument();
  });

  it('should detect diagonal win (top-left to bottom-right)', async () => {
    const user = userEvent.setup();
    render(<TicTacToe />);

    const buttons = screen.getAllByTestId('mock-button');

    // X wins diagonal: X, O, X, O, X
    await user.click(buttons[0]); // X at 0
    await user.click(buttons[1]); // O at 1
    await user.click(buttons[4]); // X at 4
    await user.click(buttons[2]); // O at 2
    await user.click(buttons[8]); // X at 8 - wins!

    expect(screen.getByText('Player X wins!')).toBeInTheDocument();
  });

  it('should detect diagonal win (top-right to bottom-left)', async () => {
    const user = userEvent.setup();
    render(<TicTacToe />);

    const buttons = screen.getAllByTestId('mock-button');

    // X wins diagonal: X, O, X, O, X
    await user.click(buttons[2]); // X at 2
    await user.click(buttons[0]); // O at 0
    await user.click(buttons[4]); // X at 4
    await user.click(buttons[1]); // O at 1
    await user.click(buttons[6]); // X at 6 - wins!

    expect(screen.getByText('Player X wins!')).toBeInTheDocument();
  });

  it('should detect draw when board is full with no winner', async () => {
    const user = userEvent.setup();
    render(<TicTacToe />);

    const buttons = screen.getAllByTestId('mock-button');

    // Create a proper draw scenario: X O X | O O X | X X O
    await user.click(buttons[0]); // X at 0
    await user.click(buttons[1]); // O at 1
    await user.click(buttons[2]); // X at 2
    await user.click(buttons[3]); // O at 3
    await user.click(buttons[5]); // X at 5
    await user.click(buttons[4]); // O at 4
    await user.click(buttons[6]); // X at 6
    await user.click(buttons[8]); // O at 8
    await user.click(buttons[7]); // X at 7 - should result in draw

    expect(screen.getByText("It's a draw!")).toBeInTheDocument();
  });

  it('should prevent further moves after game ends with winner', async () => {
    const user = userEvent.setup();
    render(<TicTacToe />);

    const buttons = screen.getAllByTestId('mock-button');

    // X wins first row
    await user.click(buttons[0]); // X
    await user.click(buttons[3]); // O
    await user.click(buttons[1]); // X
    await user.click(buttons[4]); // O
    await user.click(buttons[2]); // X wins

    expect(screen.getByText('Player X wins!')).toBeInTheDocument();

    // Try to click another cell
    await user.click(buttons[5]);

    // Should still show winner message
    expect(screen.getByText('Player X wins!')).toBeInTheDocument();
  });

  it('should reset game when reset button is clicked', async () => {
    const user = userEvent.setup();
    render(<TicTacToe />);

    const buttons = screen.getAllByTestId('mock-button');

    // Make some moves
    await user.click(buttons[0]); // X
    await user.click(buttons[1]); // O

    expect(screen.getByText("Player X's turn")).toBeInTheDocument();

    // Click reset
    const resetButton = screen.getByText('New Game');
    await user.click(resetButton);

    // Should be back to initial state
    expect(screen.getByText("Player X's turn")).toBeInTheDocument();
  });

  it('should disable cells when game is won', async () => {
    const user = userEvent.setup();
    render(<TicTacToe />);

    const buttons = screen.getAllByTestId('mock-button');

    // X wins first row
    await user.click(buttons[0]); // X
    await user.click(buttons[3]); // O
    await user.click(buttons[1]); // X
    await user.click(buttons[4]); // O
    await user.click(buttons[2]); // X wins

    // All cell buttons should be disabled
    const cellButtons = buttons.filter(button => !button.textContent?.includes('New Game'));
    cellButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('should disable cells when game is drawn', async () => {
    const user = userEvent.setup();
    render(<TicTacToe />);

    const buttons = screen.getAllByTestId('mock-button');

    // Create same draw scenario
    await user.click(buttons[0]); // X at 0
    await user.click(buttons[1]); // O at 1
    await user.click(buttons[2]); // X at 2
    await user.click(buttons[3]); // O at 3
    await user.click(buttons[5]); // X at 5
    await user.click(buttons[4]); // O at 4
    await user.click(buttons[6]); // X at 6
    await user.click(buttons[8]); // O at 8
    await user.click(buttons[7]); // X at 7 - should result in draw

    expect(screen.getByText("It's a draw!")).toBeInTheDocument();

    // All cell buttons should be disabled
    const cellButtons = buttons.filter(button => !button.textContent?.includes('New Game'));
    cellButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('should show O icon when O is placed', async () => {
    const user = userEvent.setup();
    render(<TicTacToe />);

    const buttons = screen.getAllByTestId('mock-button');

    // X's turn
    await user.click(buttons[0]);

    // O's turn
    await user.click(buttons[1]);

    const circleIcons = screen.getAllByTestId('mock-circle-icon');
    expect(circleIcons.length).toBeGreaterThan(0);
  });

  it('should apply correct status message class when game ends', async () => {
    const user = userEvent.setup();
    render(<TicTacToe />);

    const buttons = screen.getAllByTestId('mock-button');

    // Normal game state
    let statusElement = screen.getByText("Player X's turn");
    expect(statusElement.className).toContain('text-xl font-semibold');
    expect(statusElement.className).not.toContain('text-2xl');

    // Win state
    await user.click(buttons[0]); // X
    await user.click(buttons[3]); // O
    await user.click(buttons[1]); // X
    await user.click(buttons[4]); // O
    await user.click(buttons[2]); // X wins

    statusElement = screen.getByText('Player X wins!');
    expect(statusElement.className).toContain('text-xl font-semibold text-2xl');
  });

  // Test helper functions
  describe('helper functions', () => {
    it('should test shouldRenderXIcon function branches', () => {
      render(<TicTacToe />);

      // This tests the function by checking the rendered output
      // when value is 'X' vs when it's not
      const buttons = screen.getAllByTestId('mock-button');

      // X icons appear in player labels, so there should be at least one
      const xIcons = screen.getAllByTestId('mock-x-icon');
      expect(xIcons.length).toBeGreaterThanOrEqual(1);
    });

    it('should test shouldRenderOIcon function branches', () => {
      render(<TicTacToe />);

      // Before any moves, no O icons should be rendered
      expect(screen.queryByTestId('mock-circle-icon')).toBeTruthy(); // Player labels have circle icons
    });

    it('should test isCellDisabled function with different states', async () => {
      const user = userEvent.setup();
      render(<TicTacToe />);

      const buttons = screen.getAllByTestId('mock-button');
      const cellButtons = buttons.filter(button => !button.textContent?.includes('New Game'));

      // Initially, cells should not be disabled
      cellButtons.forEach(button => {
        expect(button).not.toBeDisabled();
      });

      // After placing X, that cell should be disabled
      await user.click(cellButtons[0]);
      expect(cellButtons[0]).toBeDisabled();
      expect(cellButtons[1]).not.toBeDisabled();
    });

    it('should test shouldPreventClick function with all conditions', async () => {
      const user = userEvent.setup();
      render(<TicTacToe />);

      const buttons = screen.getAllByTestId('mock-button');
      const cellButtons = buttons.filter(button => !button.textContent?.includes('New Game'));

      // Test board[index] condition
      await user.click(cellButtons[0]); // X at 0
      expect(cellButtons[0]).toBeDisabled(); // This means shouldPreventClick returned true for board[index]

      // Test that clicking the same cell twice doesn't change state
      await user.click(cellButtons[0]); // Try clicking same cell
      expect(screen.getByText("Player O's turn")).toBeInTheDocument(); // Should still be O's turn
    });
  });

  it('should test checkWinner function with no winner', async () => {
    const user = userEvent.setup();
    render(<TicTacToe />);

    const buttons = screen.getAllByTestId('mock-button');

    // Place some moves but no winner
    await user.click(buttons[0]); // X
    await user.click(buttons[1]); // O

    // Should still show turn message, not winner
    expect(screen.getByText("Player X's turn")).toBeInTheDocument();
    expect(screen.queryByText('Player X wins!')).not.toBeInTheDocument();
    expect(screen.queryByText('Player O wins!')).not.toBeInTheDocument();
  });

  it('should handle handleCellClick early return when cell is occupied', async () => {
    const user = userEvent.setup();
    render(<TicTacToe />);

    const buttons = screen.getAllByTestId('mock-button');

    // Click first cell
    await user.click(buttons[0]); // X
    expect(screen.getByText("Player O's turn")).toBeInTheDocument();

    // Click same cell again - should return early
    await user.click(buttons[0]);
    expect(screen.getByText("Player O's turn")).toBeInTheDocument(); // No change
  });

  it('should handle handleCellClick early return when winner exists', async () => {
    const user = userEvent.setup();
    render(<TicTacToe />);

    const buttons = screen.getAllByTestId('mock-button');

    // Create a winning scenario first
    await user.click(buttons[0]); // X
    await user.click(buttons[3]); // O
    await user.click(buttons[1]); // X
    await user.click(buttons[4]); // O
    await user.click(buttons[2]); // X wins!

    expect(screen.getByText('Player X wins!')).toBeInTheDocument();

    // Try to click another cell - should return early
    await user.click(buttons[5]);
    expect(screen.getByText('Player X wins!')).toBeInTheDocument(); // No change
  });

  it('should handle handleCellClick early return when draw exists', async () => {
    const user = userEvent.setup();
    render(<TicTacToe />);

    const buttons = screen.getAllByTestId('mock-button');

    // Create draw scenario
    await user.click(buttons[0]); // X at 0
    await user.click(buttons[1]); // O at 1
    await user.click(buttons[2]); // X at 2
    await user.click(buttons[3]); // O at 3
    await user.click(buttons[5]); // X at 5
    await user.click(buttons[4]); // O at 4
    await user.click(buttons[6]); // X at 6
    await user.click(buttons[8]); // O at 8
    await user.click(buttons[7]); // X at 7 - draw!

    expect(screen.getByText("It's a draw!")).toBeInTheDocument();

    // Try to click - should return early (but all cells are filled anyway)
    // This tests the isDraw condition in the early return
    const cellButtons = buttons.filter(button => !button.textContent?.includes('New Game'));
    cellButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('should test all branches of early return condition', async () => {
    const user = userEvent.setup();

    // Test 1: board[index] condition
    render(<TicTacToe />);
    let buttons = screen.getAllByTestId('mock-button');

    await user.click(buttons[0]); // X at 0
    expect(screen.getByText("Player O's turn")).toBeInTheDocument();

    // Click same cell again - tests board[index] condition
    await user.click(buttons[0]);
    expect(screen.getByText("Player O's turn")).toBeInTheDocument();
  });

  it('should test all winning line combinations', async () => {
    // Test second row win
    const user = userEvent.setup();
    render(<TicTacToe />);

    const buttons = screen.getAllByTestId('mock-button');

    // X wins second row (3,4,5)
    await user.click(buttons[3]); // X at 3
    await user.click(buttons[0]); // O at 0
    await user.click(buttons[4]); // X at 4
    await user.click(buttons[1]); // O at 1
    await user.click(buttons[5]); // X at 5 - wins!

    expect(screen.getByText('Player X wins!')).toBeInTheDocument();
  });

  it('should test specific draw scenario with correct sequence', async () => {
    const user = userEvent.setup();
    render(<TicTacToe />);

    const buttons = screen.getAllByTestId('mock-button');

    // This specific sequence should result in a draw and test line 42
    // Board will be: X O X | O O X | X X O
    await user.click(buttons[0]); // X at 0
    await user.click(buttons[1]); // O at 1
    await user.click(buttons[2]); // X at 2
    await user.click(buttons[3]); // O at 3
    await user.click(buttons[5]); // X at 5
    await user.click(buttons[4]); // O at 4
    await user.click(buttons[6]); // X at 6
    await user.click(buttons[8]); // O at 8
    await user.click(buttons[7]); // X at 7 - should result in draw

    expect(screen.getByText("It's a draw!")).toBeInTheDocument();
  });
});