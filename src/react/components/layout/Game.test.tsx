import React from 'react';
import { render, screen } from '@testing-library/react';
import Game from './Game';

// Mock the TicTacToe component
jest.mock('../game/TicTacToe', () => {
  return {
    __esModule: true,
    default: function MockTicTacToe() {
      return <div data-testid="mock-tic-tac-toe">TicTacToe Game</div>;
    }
  };
});

describe('Game', () => {
  it('should render with correct background styling', () => {
    const { container } = render(<Game />);

    const gameDiv = container.firstChild as HTMLElement;
    expect(gameDiv).toBeInTheDocument();
    expect(gameDiv).toHaveClass(
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

  it('should render the TicTacToe component', () => {
    render(<Game />);

    const ticTacToe = screen.getByTestId('mock-tic-tac-toe');
    expect(ticTacToe).toBeInTheDocument();
    expect(ticTacToe).toHaveTextContent('TicTacToe Game');
  });

  it('should be a functional component that returns JSX', () => {
    const result = Game();
    expect(result).toBeDefined();
    expect(result.type).toBe('div');
    expect(typeof result).toBe('object');
    expect(result.props).toBeDefined();
  });

  it('should have correct structure', () => {
    const result = Game();
    expect(result.props.className).toContain('min-h-screen');
    expect(result.props.className).toContain('bg-gradient-to-br');
    expect(result.props.className).toContain('from-slate-900');
    expect(result.props.className).toContain('to-slate-800');
    expect(result.props.className).toContain('flex');
    expect(result.props.className).toContain('items-center');
    expect(result.props.className).toContain('justify-center');
    expect(result.props.className).toContain('p-4');
  });
});