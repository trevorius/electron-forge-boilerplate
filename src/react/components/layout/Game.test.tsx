import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Game from './Game';

// Wrapper component to provide Router context
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Game Component', () => {
  test('renders game selection menu', () => {
    renderWithRouter(<Game />);

    expect(screen.getByText('Choose a Game')).toBeInTheDocument();
    expect(screen.getByText('Tic Tac Toe')).toBeInTheDocument();
    expect(screen.getByText('Tetris')).toBeInTheDocument();
  });

  test('has correct navigation links for games', () => {
    renderWithRouter(<Game />);

    const ticTacToeLink = screen.getByRole('link', { name: 'Tic Tac Toe' });
    const tetrisLink = screen.getByRole('link', { name: 'Tetris' });

    expect(ticTacToeLink).toHaveAttribute('href', '/game/tictactoe');
    expect(tetrisLink).toHaveAttribute('href', '/game/tetris');
  });

  test('buttons have correct styling classes', () => {
    renderWithRouter(<Game />);

    const ticTacToeButton = screen.getByRole('button', { name: 'Tic Tac Toe' });
    const tetrisButton = screen.getByRole('button', { name: 'Tetris' });

    expect(ticTacToeButton).toHaveClass('bg-blue-600', 'hover:bg-blue-700', 'text-white', 'py-3', 'text-lg', 'w-full');
    expect(tetrisButton).toHaveClass('bg-green-600', 'hover:bg-green-700', 'text-white', 'py-3', 'text-lg', 'w-full');
  });

  test('applies correct styling classes to game selection container', () => {
    const { container } = renderWithRouter(<Game />);
    const gameContainer = container.querySelector('.min-h-full');

    expect(gameContainer).toHaveClass(
      'min-h-full',
      'bg-gradient-to-br',
      'from-slate-900',
      'to-slate-800',
      'flex',
      'items-center',
      'justify-center',
      'p-4'
    );
  });

  test('renders card with correct styling', () => {
    renderWithRouter(<Game />);

    const card = screen.getByText('Choose a Game').closest('.p-8');
    expect(card).toHaveClass('p-8', 'bg-gray-800', 'border-gray-600');
  });

  test('has accessible button structure', () => {
    renderWithRouter(<Game />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);

    buttons.forEach(button => {
      expect(button).toBeInTheDocument();
      expect(button.closest('a')).toBeInTheDocument();
    });
  });
});