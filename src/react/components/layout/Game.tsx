import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

const Game: React.FC = () => {
  return (
    <div className="min-h-full  flex items-center justify-center p-4">
      <Card className="p-8 bg-gray-800 border-gray-600 text-center">
        <h1 className="text-4xl font-bold text-white mb-8">Choose a Game</h1>
        <div className="flex flex-col space-y-4 w-64">
          <Link to="/game/tictactoe">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg w-full">
              Tic Tac Toe
            </Button>
          </Link>
          <Link to="/game/tetris">
            <Button className="bg-green-600 hover:bg-green-700 text-white py-3 text-lg w-full">
              Tetris
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Game;
