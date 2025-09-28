import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import {
  BOARD_WIDTH,
  calculateDropPosition,
  calculateMovementDelta,
  canPerformAction,
  canPieceMove,
  createEmptyBoard,
  createGameState,
  createPauseState,
  createResumeState,
  getRandomTetromino,
  handleFailedMovement,
  handlePauseResume,
  handlePiecePlacement,
  isValidMove,
  renderPieceOnBoard,
  rotateTetromino,
  shouldGameEnd,
  type GamePiece,
  type Tetromino
} from './Tetris.helpers';

const CELL_SIZE = 30;

const Tetris: React.FC = () => {
  const { t } = useTranslation();
  const [board, setBoard] = useState<number[][]>(createEmptyBoard);
  const [currentPiece, setCurrentPiece] = useState<GamePiece | null>(null);
  const [nextPiece, setNextPiece] = useState<Tetromino>(getRandomTetromino);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dropTime, setDropTime] = useState(1000);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const spawnNewPiece = useCallback(() => {
    const newPiece: GamePiece = {
      tetromino: nextPiece,
      position: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 }
    };

    setNextPiece(getRandomTetromino());

    if (shouldGameEnd(board, newPiece)) {
      setGameOver(true);
      setIsPlaying(false);
    } else {
      setCurrentPiece(newPiece);
    }
  }, [board, nextPiece]);

  const movePiece = useCallback((direction: 'left' | 'right' | 'down') => {
    if (!canPieceMove(currentPiece, gameOver)) return;

    const delta = calculateMovementDelta(direction);
    const newPosition = {
      x: currentPiece!.position.x + delta.x,
      y: currentPiece!.position.y + delta.y
    };

    if (isValidMove(board, currentPiece!, newPosition)) {
      setCurrentPiece(prev => prev ? { ...prev, position: newPosition } : null);
    } else {
      const failedMovement = handleFailedMovement(direction, board, currentPiece!, score, level);
      if (failedMovement.shouldPlace && failedMovement.placementResult) {
        setBoard(failedMovement.placementResult.newBoard);
        setLines(prev => prev + failedMovement.placementResult!.linesCleared);
        setScore(prev => prev + failedMovement.placementResult!.scoreIncrease);
        setCurrentPiece(null);
      }
    }
  }, [currentPiece, board, gameOver, level]);

  const rotatePiece = useCallback(() => {
    if (!canPerformAction(currentPiece, gameOver)) return;

    const rotatedShape = rotateTetromino(currentPiece.tetromino.shape);
    const rotatedPiece = {
      ...currentPiece,
      tetromino: { ...currentPiece.tetromino, shape: rotatedShape }
    };

    if (isValidMove(board, rotatedPiece, currentPiece.position)) {
      setCurrentPiece(rotatedPiece);
    }
  }, [currentPiece, board, gameOver]);

  const dropPiece = useCallback(() => {
    if (!canPerformAction(currentPiece, gameOver)) return;

    const dropPosition = calculateDropPosition(board, currentPiece);
    const droppedPiece = { ...currentPiece, position: dropPosition };
    const placementResult = handlePiecePlacement(board, droppedPiece, score, level);

    setBoard(placementResult.newBoard);
    setLines(prev => prev + placementResult.linesCleared);
    setScore(prev => prev + placementResult.scoreIncrease + 20); // +20 bonus for hard drop
    setCurrentPiece(null);
  }, [currentPiece, board, gameOver, level, score]);

  const startGame = () => {
    const gameState = createGameState();
    setBoard(gameState.board);
    setScore(gameState.score);
    setLevel(gameState.level);
    setLines(gameState.lines);
    setGameOver(gameState.gameOver);
    setIsPlaying(gameState.isPlaying);
    setDropTime(gameState.dropTime);
    setCurrentPiece(gameState.currentPiece);
    setNextPiece(gameState.nextPiece);
  };

  const pauseGame = () => {
    const pauseState = createPauseState();
    setIsPlaying(pauseState.isPlaying);
  };

  const resumeGame = () => {
    const resumeState = createResumeState(gameOver);
    setIsPlaying(resumeState.isPlaying);
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isPlaying) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          movePiece('left');
          break;
        case 'ArrowRight':
          event.preventDefault();
          movePiece('right');
          break;
        case 'ArrowDown':
          event.preventDefault();
          movePiece('down');
          break;
        case 'ArrowUp':
          event.preventDefault();
          rotatePiece();
          break;
        case ' ':
          event.preventDefault();
          dropPiece();
          break;
        case 'p':
        case 'P':
          event.preventDefault();
          handlePauseResume(isPlaying, pauseGame, resumeGame);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, movePiece, rotatePiece, dropPiece]);

  useEffect(() => {
    if (isPlaying && !currentPiece) {
      spawnNewPiece();
    }
  }, [currentPiece, isPlaying, spawnNewPiece]);

  useEffect(() => {
    if (isPlaying && currentPiece) {
      gameLoopRef.current = setInterval(() => {
        movePiece('down');
      }, dropTime);
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [isPlaying, currentPiece, dropTime, movePiece]);

  useEffect(() => {
    const newLevel = Math.floor(lines / 10) + 1;
    setLevel(newLevel);
    setDropTime(Math.max(50, 1000 - (newLevel - 1) * 50));
  }, [lines]);

  const renderBoard = () => {
    const displayBoard = renderPieceOnBoard(board, currentPiece);

    return displayBoard.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => (
          <div
            key={x}
            className={`w-[${CELL_SIZE}px] h-[${CELL_SIZE}px] border border-gray-600 ${
              cell === 1 ? 'bg-gray-300' : cell === 2 ? 'bg-blue-400' : 'bg-gray-900'
            }`}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              backgroundColor: cell === 2 && currentPiece ? currentPiece.tetromino.color : undefined
            }}
          />
        ))}
      </div>
    ));
  };

  const renderNextPiece = () => {
    return nextPiece.shape.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => (
          <div
            key={x}
            className={`w-6 h-6 border border-gray-600 ${
              cell ? 'bg-gray-300' : 'bg-gray-900'
            }`}
            style={{
              backgroundColor: cell ? nextPiece.color : undefined
            }}
          />
        ))}
      </div>
    ));
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center space-y-4 p-4">
      <h1 className="text-3xl font-bold text-white mb-4">{t('tetris.title')}</h1>

      <div className="flex space-x-8">
        <Card className="p-4 bg-gray-800 border-gray-600">
          <div className="border-2 border-gray-600 bg-gray-900">
            {renderBoard()}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4 bg-gray-800 border-gray-600 text-white">
            <h3 className="text-lg font-semibold mb-2">{t('tetris.score')}</h3>
            <p className="text-2xl font-bold">{score}</p>
          </Card>

          <Card className="p-4 bg-gray-800 border-gray-600 text-white">
            <h3 className="text-lg font-semibold mb-2">{t('tetris.level')}</h3>
            <p className="text-xl">{level}</p>
          </Card>

          <Card className="p-4 bg-gray-800 border-gray-600 text-white">
            <h3 className="text-lg font-semibold mb-2">{t('tetris.lines')}</h3>
            <p className="text-xl">{lines}</p>
          </Card>

          <Card className="p-4 bg-gray-800 border-gray-600 text-white">
            <h3 className="text-lg font-semibold mb-2">{t('tetris.next')}</h3>
            <div className="flex flex-col items-center">
              {renderNextPiece()}
            </div>
          </Card>
          <Card className="p-4 bg-gray-800 border-gray-600 text-white text-sm">
        <h3 className="font-semibold mb-2">{t('tetris.controls')}</h3>
        <p>{t('tetris.controlMoveLeft')}</p>
        <p>{t('tetris.controlSoftDrop')}</p>
        <p>{t('tetris.controlRotate')}</p>
        <p>{t('tetris.controlHardDrop')}</p>
        <p>{t('tetris.controlPause')}</p>
      </Card>
        </div>
      </div>

      <div className="flex space-x-2">
        {!isPlaying && !gameOver && (
          <Button onClick={startGame} className="bg-green-600 hover:bg-green-700">
            {t('tetris.startGame')}
          </Button>
        )}

        {!isPlaying && gameOver && (
          <Button onClick={startGame} className="bg-blue-600 hover:bg-blue-700">
            {t('tetris.newGame')}
          </Button>
        )}

        {isPlaying && (
          <Button onClick={pauseGame} className="bg-yellow-600 hover:bg-yellow-700">
            {t('tetris.pause')}
          </Button>
        )}

        {!isPlaying && !gameOver && currentPiece && (
          <Button onClick={resumeGame} className="bg-green-600 hover:bg-green-700">
            {t('tetris.resume')}
          </Button>
        )}
      </div>

      <Dialog open={gameOver} onOpenChange={() => {}}>
        <DialogContent className="bg-red-900 border-red-600 text-white text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-2">{t('tetris.gameOver')}</DialogTitle>
          </DialogHeader>
          <p className="text-lg mb-4">{t('tetris.finalScore', { score })}</p>
          <Button onClick={startGame} className="bg-blue-600 hover:bg-blue-700">
            {t('tetris.newGame')}
          </Button>
        </DialogContent>
      </Dialog>

</div>
  );
};

export default Tetris;
