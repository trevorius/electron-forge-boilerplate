import React from 'react';

const MockTetris: React.FC = () => {
  return (
    <div data-testid="mock-tetris">
      <h1>Tetris</h1>
      <div>Score: 0</div>
      <div>Level: 1</div>
      <div>Lines: 0</div>
      <button>Start Game</button>
    </div>
  );
};

export default MockTetris;