import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the TicTacToe component
jest.mock('./components/TicTacToe', () => {
  return {
    __esModule: true,
    default: function MockTicTacToe() {
      return <div data-testid="mock-tic-tac-toe">TicTacToe Game</div>;
    }
  };
});

describe('App', () => {
  it('should render the main container with correct classes', () => {
    const { container } = render(<App />);

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toBeInTheDocument();
    expect(mainDiv).toHaveClass(
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
    render(<App />);

    const ticTacToe = screen.getByTestId('mock-tic-tac-toe');
    expect(ticTacToe).toBeInTheDocument();
    expect(ticTacToe).toHaveTextContent('TicTacToe Game');
  });

  it('should be a functional component that returns JSX', () => {
    const result = App();
    expect(result).toBeDefined();
    expect(result.type).toBe('div');
    expect(typeof result).toBe('object');
    expect(result.props).toBeDefined();
  });

  it('should have correct structure', () => {
    const result = App();
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