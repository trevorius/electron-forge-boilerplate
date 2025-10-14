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
  handleGameOverDialogChange,
  handleHighScoreSkip,
  handlePauseResume,
  handlePiecePlacement,
  handlePlayerNameChange,
  handlePlayerNameKeyPress,
  highScoreDialogOnOpenChange,
  isValidMove,
  renderPieceOnBoard,
  rotateTetromino,
  shouldGameEnd,
  type GamePiece,
  type Tetromino
} from './LineDestroyer.helpers';
import HighScores from './HighScores';

const CELL_SIZE = 30;

const LineDestroyer: React.FC = () => {
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
  const [showGameOverDialog, setShowGameOverDialog] = useState(false);
  const [showHighScoreDialog, setShowHighScoreDialog] = useState(false);
  const [playerName, setPlayerName] = useState('');

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const spawnNewPiece = useCallback(async () => {
    const newPiece: GamePiece = {
      tetromino: nextPiece,
      position: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 }
    };

    setNextPiece(getRandomTetromino());

    if (shouldGameEnd(board, newPiece)) {
      setGameOver(true);
      setIsPlaying(false);

      // Check if this is a high score
      try {
        const isHighScore = await window.electronAPI.isHighScore('lineDestroyer', score);
        if (isHighScore) {
          setShowHighScoreDialog(true);
        } else {
          setShowGameOverDialog(true);
        }
      } catch (error) {
        console.error('Failed to check high score:', error);
        setShowGameOverDialog(true);
      }
    } else {
      setCurrentPiece(newPiece);
    }
  }, [board, nextPiece, score]);

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

  const saveHighScore = async () => {
    if (!playerName.trim()) return;

    try {
      await window.electronAPI.saveScore({
        name: playerName.trim(),
        score: score,
        game: 'lineDestroyer'
      });
      setShowHighScoreDialog(false);
      setShowGameOverDialog(true);
      setPlayerName('');
    } catch (error) {
      console.error('Failed to save high score:', error);
    }
  };

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
    setShowGameOverDialog(false);
    setShowHighScoreDialog(false);
    setPlayerName('');
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
      <h1 className="text-3xl font-bold text-white mb-4">{t('lineDestroyer.title')}</h1>

      <div className="flex space-x-8">
        <Card className="p-4 bg-gray-800 border-gray-600">
          <div className="border-2 border-gray-600 bg-gray-900">
            {renderBoard()}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4 bg-gray-800 border-gray-600 text-white">
            <h3 className="text-lg font-semibold mb-2">{t('lineDestroyer.score')}</h3>
            <p className="text-2xl font-bold">{score}</p>
          </Card>

          <Card className="p-4 bg-gray-800 border-gray-600 text-white">
            <h3 className="text-lg font-semibold mb-2">{t('lineDestroyer.level')}</h3>
            <p className="text-xl">{level}</p>
          </Card>

          <Card className="p-4 bg-gray-800 border-gray-600 text-white">
            <h3 className="text-lg font-semibold mb-2">{t('lineDestroyer.lines')}</h3>
            <p className="text-xl">{lines}</p>
          </Card>

          <Card className="p-4 bg-gray-800 border-gray-600 text-white">
            <h3 className="text-lg font-semibold mb-2">{t('lineDestroyer.next')}</h3>
            <div className="flex flex-col items-center">
              {renderNextPiece()}
            </div>
          </Card>
          <Card className="p-4 bg-gray-800 border-gray-600 text-white text-sm">
        <h3 className="font-semibold mb-2">{t('lineDestroyer.controls')}</h3>
        <p>{t('lineDestroyer.controlMoveLeft')}</p>
        <p>{t('lineDestroyer.controlSoftDrop')}</p>
        <p>{t('lineDestroyer.controlRotate')}</p>
        <p>{t('lineDestroyer.controlHardDrop')}</p>
        <p>{t('lineDestroyer.controlPause')}</p>
      </Card>
        </div>
      </div>

      <div className="flex space-x-2">
        {!isPlaying && !gameOver && (
          <Button onClick={startGame} className="bg-green-600 hover:bg-green-700">
            {t('lineDestroyer.startGame')}
          </Button>
        )}

        {!isPlaying && gameOver && (
          <Button onClick={startGame} className="bg-blue-600 hover:bg-blue-700">
            {t('lineDestroyer.newGame')}
          </Button>
        )}

        {isPlaying && (
          <Button onClick={pauseGame} className="bg-yellow-600 hover:bg-yellow-700">
            {t('lineDestroyer.pause')}
          </Button>
        )}

        {!isPlaying && !gameOver && currentPiece && (
          <Button onClick={resumeGame} className="bg-green-600 hover:bg-green-700">
            {t('lineDestroyer.resume')}
          </Button>
        )}
      </div>

      <Dialog open={showGameOverDialog} onOpenChange={(open) => handleGameOverDialogChange(open, setShowGameOverDialog)}>
        <DialogContent className="bg-red-900 border-red-600 text-white text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-2">{t('lineDestroyer.gameOver')}</DialogTitle>
          </DialogHeader>
          <p className="text-lg mb-4">{t('lineDestroyer.finalScore', { score })}</p>
          <Button onClick={startGame} className="bg-blue-600 hover:bg-blue-700">
            {t('lineDestroyer.newGame')}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showHighScoreDialog} onOpenChange={highScoreDialogOnOpenChange}>
        <DialogContent className="bg-yellow-600 border-yellow-400 text-white text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-2">{t('lineDestroyer.newHighScore')}</DialogTitle>
          </DialogHeader>
          <p className="text-lg mb-4">{t('lineDestroyer.congratulations', { score })}</p>
          <div className="mb-4">
            <label htmlFor="playerName" className="block text-sm font-medium mb-2">
              {t('lineDestroyer.enterName')}
            </label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => handlePlayerNameChange(e, setPlayerName)}
              onKeyPress={(e) => handlePlayerNameKeyPress(e, saveHighScore)}
              className="w-full px-3 py-2 text-black rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder={t('lineDestroyer.nameInputPlaceholder')}
              maxLength={20}
              autoFocus
            />
          </div>
          <div className="flex space-x-2 justify-center">
            <Button
              onClick={saveHighScore}
              disabled={!playerName.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500"
            >
              {t('lineDestroyer.saveScore')}
            </Button>
            <Button
              onClick={() => handleHighScoreSkip(setShowHighScoreDialog, setShowGameOverDialog, setPlayerName)}
              className="bg-gray-600 hover:bg-gray-700"
            >
              {t('lineDestroyer.skip')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* High Scores Section */}
      <div className="mt-8 w-full max-w-4xl">
        <HighScores game="lineDestroyer" limit={10} />
      </div>

</div>
  );
};

export default LineDestroyer;
