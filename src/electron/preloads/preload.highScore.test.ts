import { ipcRenderer } from 'electron';
import { HighSCoresApi } from './preload.highScore';

// Mock ipcRenderer
jest.mock('electron', () => ({
  ipcRenderer: {
    invoke: jest.fn(),
  },
}));

describe('preload.highScore', () => {
  const mockIpcRenderer = ipcRenderer as jest.Mocked<typeof ipcRenderer>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('databaseAPI', () => {
    describe('saveScore', () => {
      it('should call ipcRenderer.invoke with save-score', async () => {
        const scoreData = { name: 'Player1', score: 1000, game: 'lineDestroyer' };
        const mockResult = { id: 1, ...scoreData, createdAt: new Date() };
        mockIpcRenderer.invoke.mockResolvedValue(mockResult);

        const result = await HighSCoresApi.saveScore(scoreData);

        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('save-score', scoreData);
        expect(result).toEqual(mockResult);
      });
    });

    describe('getHighScores', () => {
      it('should call ipcRenderer.invoke with get-high-scores', async () => {
        const mockScores = [
          { id: 1, name: 'Player1', score: 1000, game: 'lineDestroyer', createdAt: new Date() },
        ];
        mockIpcRenderer.invoke.mockResolvedValue(mockScores);

        const result = await HighSCoresApi.getHighScores('lineDestroyer', 10);

        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-high-scores', 'lineDestroyer', 10);
        expect(result).toEqual(mockScores);
      });

      it('should work without limit parameter', async () => {
        const mockScores = [
          { id: 1, name: 'Player1', score: 1000, game: 'lineDestroyer', createdAt: new Date() },
        ];
        mockIpcRenderer.invoke.mockResolvedValue(mockScores);

        const result = await HighSCoresApi.getHighScores('lineDestroyer');

        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-high-scores', 'lineDestroyer', undefined);
        expect(result).toEqual(mockScores);
      });
    });

    describe('getAllHighScores', () => {
      it('should call ipcRenderer.invoke with get-all-high-scores', async () => {
        const mockScores = [
          { id: 1, name: 'Player1', score: 1000, game: 'lineDestroyer', createdAt: new Date() },
          { id: 2, name: 'Player2', score: 900, game: 'pong', createdAt: new Date() },
        ];
        mockIpcRenderer.invoke.mockResolvedValue(mockScores);

        const result = await HighSCoresApi.getAllHighScores(10);

        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-all-high-scores', 10);
        expect(result).toEqual(mockScores);
      });

      it('should work without limit parameter', async () => {
        const mockScores = [
          { id: 1, name: 'Player1', score: 1000, game: 'lineDestroyer', createdAt: new Date() },
        ];
        mockIpcRenderer.invoke.mockResolvedValue(mockScores);

        const result = await HighSCoresApi.getAllHighScores();

        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-all-high-scores', undefined);
        expect(result).toEqual(mockScores);
      });
    });

    describe('isHighScore', () => {
      it('should call ipcRenderer.invoke with is-high-score', async () => {
        mockIpcRenderer.invoke.mockResolvedValue(true);

        const result = await HighSCoresApi.isHighScore('lineDestroyer', 1000);

        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('is-high-score', 'lineDestroyer', 1000);
        expect(result).toBe(true);
      });
    });

    describe('deleteScore', () => {
      it('should call ipcRenderer.invoke with delete-score', async () => {
        mockIpcRenderer.invoke.mockResolvedValue(undefined);

        await HighSCoresApi.deleteScore(1);

        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('delete-score', 1);
      });
    });

    describe('clearScores', () => {
      it('should call ipcRenderer.invoke with clear-scores for specific game', async () => {
        mockIpcRenderer.invoke.mockResolvedValue(undefined);

        await HighSCoresApi.clearScores('lineDestroyer');

        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('clear-scores', 'lineDestroyer');
      });

      it('should call ipcRenderer.invoke with clear-scores for all games', async () => {
        mockIpcRenderer.invoke.mockResolvedValue(undefined);

        await HighSCoresApi.clearScores();

        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('clear-scores', undefined);
      });
    });
  });
});
