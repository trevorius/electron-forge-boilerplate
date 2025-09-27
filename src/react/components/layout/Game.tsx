import React, { useState } from 'react';
import TicTacToe from '../game/TicTacToe';
import Tetris from '../game/Tetris';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

type GameType = 'tictactoe' | 'tetris';

const Game: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);

  if (selectedGame === 'tictactoe') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-4">
        <div className="mb-4">
          <Button
            onClick={() => setSelectedGame(null)}
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-black"
          >
            ← Back to Game Selection
          </Button>
        </div>
        <TicTacToe />
      </div>
    );
  }

  if (selectedGame === 'tetris') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-4">
        <div className="mb-4">
          <Button
            onClick={() => setSelectedGame(null)}
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-black"
          >
            ← Back to Game Selection
          </Button>
        </div>
        <Tetris />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="p-8 bg-gray-800 border-gray-600 text-center">
        <h1 className="text-4xl font-bold text-white mb-8">Choose a Game</h1>
        <div className="flex flex-col space-y-4 w-64">
          <Button
            onClick={() => setSelectedGame('tictactoe')}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
          >
            Tic Tac Toe
          </Button>
          <Button
            onClick={() => setSelectedGame('tetris')}
            className="bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
          >
            Tetris
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Game;