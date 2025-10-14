import React from 'react';

const MockLineDestroyer: React.FC = () => {
  return (
    <div data-testid="mock-lineDestroyer">
      <h1>LineDestroyer</h1>
      <div>Score: 0</div>
      <div>Level: 1</div>
      <div>Lines: 0</div>
      <button>Start Game</button>
    </div>
  );
};

export default MockLineDestroyer;