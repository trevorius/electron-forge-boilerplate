import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { RotateCcw, X, Circle } from 'lucide-react';
import LanguageSelector from '../common/LanguageSelector';

type Player = 'X' | 'O' | null;
type Board = Player[];

const TicTacToe: React.FC = () => {
  const { t } = useTranslation();
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player>(null);
  const [isDraw, setIsDraw] = useState(false);

  const checkWinner = useCallback((board: Board): Player => {
    const winningLines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (const [a, b, c] of winningLines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    return null;
  }, []);

  const handleCellClick = useCallback((index: number) => {
    // Since buttons are disabled for invalid states, we can assume valid state here
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const newWinner = checkWinner(newBoard);
    if (newWinner) {
      setWinner(newWinner);
    } else if (newBoard.every(cell => cell !== null)) {
      setIsDraw(true);
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  }, [board, currentPlayer, checkWinner]);

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setIsDraw(false);
  }, []);

  const getStatusMessage = () => {
    if (winner) return t('game.playerWins', { player: winner });
    if (isDraw) return t('game.draw');
    return t('game.playerTurn', { player: currentPlayer });
  };

  const getStatusMessageClass = () => {
    return `text-xl font-semibold ${winner || isDraw ? 'text-2xl' : ''}`;
  };

  const shouldRenderXIcon = (value: Player) => value === 'X';
  const shouldRenderOIcon = (value: Player) => value === 'O';

  const isCellDisabled = (value: Player) => !!value || !!winner || isDraw;

  const renderCell = (index: number) => {
    const value = board[index];
    return (
      <Button
        variant="outline"
        className="h-20 w-20 sm:h-24 sm:w-24 text-3xl sm:text-4xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        onClick={() => handleCellClick(index)}
        disabled={isCellDisabled(value)}
      >
        {shouldRenderXIcon(value) && <X className="h-10 w-10 sm:h-12 sm:w-12 text-blue-500" />}
        {shouldRenderOIcon(value) && <Circle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500" />}
      </Button>
    );
  };

  return (
    <Card className="w-full max-w-lg mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur">
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-end">
          <LanguageSelector />
        </div>
        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-red-500 bg-clip-text text-transparent">
          {t('game.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className={getStatusMessageClass()}>
            {getStatusMessage()}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 justify-center">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
            <div key={index} className="flex justify-center">
              {renderCell(index)}
            </div>
          ))}
        </div>

        <div className="flex justify-center pt-4">
          <Button
            onClick={resetGame}
            variant="default"
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {t('game.newGame')}
          </Button>
        </div>

        <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <X className="h-4 w-4 text-blue-500" />
            <span>{t('game.playerX')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-red-500" />
            <span>{t('game.playerO')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TicTacToe;