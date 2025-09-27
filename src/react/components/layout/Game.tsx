import React from 'react';
import TicTacToe from '../game/TicTacToe';

const Game: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <TicTacToe />
    </div>
  );
};

export default Game;