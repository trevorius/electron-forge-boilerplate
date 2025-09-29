import { ipcMain } from 'electron';
import { HighScoreController } from './highScore.controller';
import { highScoreService } from '../services/highScore.service';

// Mock the high score service
jest.mock('../services/highScore.service', () => ({
  highScoreService: {
    initialize: jest.fn(),
    saveScore: jest.fn(),
    getHighScores: jest.fn(),
    getAllHighScores: jest.fn(),
    isHighScore: jest.fn(),
    deleteScore: jest.fn(),
    clearScores: jest.fn(),
  },
}));

// Mock ipcMain
jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
    removeHandler: jest.fn(),
  },
}));

describe('HighScoreController', () => {
  const mockIpcMain = ipcMain as jest.Mocked<typeof ipcMain>;
  const mockHighScoreService = highScoreService as jest.Mocked<typeof highScoreService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerHandlers', () => {
    it('should initialize service and register all IPC handlers', async () => {
      mockHighScoreService.initialize.mockResolvedValue(undefined);

      await HighScoreController.registerHandlers();

      expect(mockHighScoreService.initialize).toHaveBeenCalled();
      expect(mockIpcMain.handle).toHaveBeenCalledWith('save-score', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('get-high-scores', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('get-all-high-scores', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('is-high-score', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('delete-score', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('clear-scores', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledTimes(6);
    });

    it('should register handlers even if initialization fails', async () => {
      mockHighScoreService.initialize.mockRejectedValue(new Error('Init failed'));

      await HighScoreController.registerHandlers();

      expect(mockHighScoreService.initialize).toHaveBeenCalled();
      expect(mockIpcMain.handle).toHaveBeenCalledWith('save-score', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('get-high-scores', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('get-all-high-scores', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('is-high-score', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('delete-score', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('clear-scores', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledTimes(6);
    });
  });

  describe('removeHandlers', () => {
    it('should remove all IPC handlers', () => {
      HighScoreController.removeHandlers();

      expect(mockIpcMain.removeHandler).toHaveBeenCalledWith('save-score');
      expect(mockIpcMain.removeHandler).toHaveBeenCalledWith('get-high-scores');
      expect(mockIpcMain.removeHandler).toHaveBeenCalledWith('get-all-high-scores');
      expect(mockIpcMain.removeHandler).toHaveBeenCalledWith('is-high-score');
      expect(mockIpcMain.removeHandler).toHaveBeenCalledWith('delete-score');
      expect(mockIpcMain.removeHandler).toHaveBeenCalledWith('clear-scores');
      expect(mockIpcMain.removeHandler).toHaveBeenCalledTimes(6);
    });
  });

  describe('IPC Handler Functions', () => {
    let saveScoreHandler: Function;
    let getHighScoresHandler: Function;
    let getAllHighScoresHandler: Function;
    let isHighScoreHandler: Function;
    let deleteScoreHandler: Function;
    let clearScoresHandler: Function;

    beforeEach(async () => {
      mockHighScoreService.initialize.mockResolvedValue(undefined);
      await HighScoreController.registerHandlers();

      // Extract the handler functions from the mock calls
      const calls = mockIpcMain.handle.mock.calls;
      saveScoreHandler = calls.find(call => call[0] === 'save-score')?.[1];
      getHighScoresHandler = calls.find(call => call[0] === 'get-high-scores')?.[1];
      getAllHighScoresHandler = calls.find(call => call[0] === 'get-all-high-scores')?.[1];
      isHighScoreHandler = calls.find(call => call[0] === 'is-high-score')?.[1];
      deleteScoreHandler = calls.find(call => call[0] === 'delete-score')?.[1];
      clearScoresHandler = calls.find(call => call[0] === 'clear-scores')?.[1];
    });

    describe('save-score handler', () => {
      it('should save score successfully', async () => {
        const scoreData = { name: 'Player1', score: 1000, game: 'tetris' };
        const mockScore = { id: 1, ...scoreData, createdAt: new Date() };
        mockHighScoreService.saveScore.mockResolvedValue(mockScore);

        const result = await saveScoreHandler({}, scoreData);

        expect(mockHighScoreService.saveScore).toHaveBeenCalledWith(scoreData);
        expect(result).toEqual(mockScore);
      });

      it('should throw error if save fails', async () => {
        const scoreData = { name: 'Player1', score: 1000, game: 'tetris' };
        const error = new Error('Save failed');
        mockHighScoreService.saveScore.mockRejectedValue(error);

        await expect(saveScoreHandler({}, scoreData)).rejects.toThrow('Save failed');
      });
    });

    describe('get-high-scores handler', () => {
      it('should get high scores successfully', async () => {
        const mockScores = [
          { id: 1, name: 'Player1', score: 1000, game: 'tetris', createdAt: new Date() },
        ];
        mockHighScoreService.getHighScores.mockResolvedValue(mockScores);

        const result = await getHighScoresHandler({}, 'tetris', 10);

        expect(mockHighScoreService.getHighScores).toHaveBeenCalledWith('tetris', 10);
        expect(result).toEqual(mockScores);
      });

      it('should throw error if get fails', async () => {
        const error = new Error('Get failed');
        mockHighScoreService.getHighScores.mockRejectedValue(error);

        await expect(getHighScoresHandler({}, 'tetris', 10)).rejects.toThrow('Get failed');
      });
    });

    describe('get-all-high-scores handler', () => {
      it('should get all high scores successfully', async () => {
        const mockScores = [
          { id: 1, name: 'Player1', score: 1000, game: 'tetris', createdAt: new Date() },
        ];
        mockHighScoreService.getAllHighScores.mockResolvedValue(mockScores);

        const result = await getAllHighScoresHandler({}, 10);

        expect(mockHighScoreService.getAllHighScores).toHaveBeenCalledWith(10);
        expect(result).toEqual(mockScores);
      });

      it('should throw error if get all fails', async () => {
        const error = new Error('Get all failed');
        mockHighScoreService.getAllHighScores.mockRejectedValue(error);

        await expect(getAllHighScoresHandler({}, 10)).rejects.toThrow('Get all failed');
      });
    });

    describe('is-high-score handler', () => {
      it('should check high score successfully', async () => {
        mockHighScoreService.isHighScore.mockResolvedValue(true);

        const result = await isHighScoreHandler({}, 'tetris', 1000);

        expect(mockHighScoreService.isHighScore).toHaveBeenCalledWith('tetris', 1000);
        expect(result).toBe(true);
      });

      it('should return false if check fails', async () => {
        const error = new Error('Check failed');
        mockHighScoreService.isHighScore.mockRejectedValue(error);

        const result = await isHighScoreHandler({}, 'tetris', 1000);

        expect(result).toBe(false);
      });
    });

    describe('delete-score handler', () => {
      it('should delete score successfully', async () => {
        mockHighScoreService.deleteScore.mockResolvedValue(undefined);

        await deleteScoreHandler({}, 1);

        expect(mockHighScoreService.deleteScore).toHaveBeenCalledWith(1);
      });

      it('should throw error if delete fails', async () => {
        const error = new Error('Delete failed');
        mockHighScoreService.deleteScore.mockRejectedValue(error);

        await expect(deleteScoreHandler({}, 1)).rejects.toThrow('Delete failed');
      });
    });

    describe('clear-scores handler', () => {
      it('should clear scores for specific game', async () => {
        mockHighScoreService.clearScores.mockResolvedValue(undefined);

        await clearScoresHandler({}, 'tetris');

        expect(mockHighScoreService.clearScores).toHaveBeenCalledWith('tetris');
      });

      it('should clear all scores when no game specified', async () => {
        mockHighScoreService.clearScores.mockResolvedValue(undefined);

        await clearScoresHandler({});

        expect(mockHighScoreService.clearScores).toHaveBeenCalledWith(undefined);
      });

      it('should throw error if clear fails', async () => {
        const error = new Error('Clear failed');
        mockHighScoreService.clearScores.mockRejectedValue(error);

        await expect(clearScoresHandler({}, 'tetris')).rejects.toThrow('Clear failed');
      });
    });
  });
});