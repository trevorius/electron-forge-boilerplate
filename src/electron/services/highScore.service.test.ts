import { HighScoreService } from './highScore.service';
import { PrismaClient } from '../generated/prisma';

// Mock Prisma Client
jest.mock('../generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    score: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  })),
}));

// Mock electron app
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn().mockReturnValue('/mock/userData'),
  },
}));

describe('HighScoreService', () => {
  let service: HighScoreService;
  let mockPrismaInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaInstance = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      score: {
        create: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
    };
    (PrismaClient as jest.Mock).mockImplementation(() => mockPrismaInstance);
    service = new HighScoreService();
  });

  describe('getDatabaseUrl', () => {
    it('should return file URL for development', () => {
      process.env.NODE_ENV = 'development';
      const service = new HighScoreService();
      expect(service['getDatabaseUrl']()).toBe(`file:${process.cwd()}/prisma/database.db`);
    });

    it('should return userData path for production', () => {
      process.env.NODE_ENV = 'production';
      const service = new HighScoreService();
      expect(service['getDatabaseUrl']()).toBe('file:/mock/userData/database.db');
    });
  });

  describe('initialize', () => {
    it('should connect to database', async () => {
      mockPrismaInstance.$connect.mockResolvedValue(undefined);

      await service.initialize();

      expect(mockPrismaInstance.$connect).toHaveBeenCalled();
      expect(service['initialized']).toBe(true);
    });

    it('should not reconnect if already initialized', async () => {
      service['initialized'] = true;

      await service.initialize();

      expect(mockPrismaInstance.$connect).not.toHaveBeenCalled();
    });

    it('should throw error if connection fails', async () => {
      const error = new Error('Connection failed');
      mockPrismaInstance.$connect.mockRejectedValue(error);

      await expect(service.initialize()).rejects.toThrow('Connection failed');
    });
  });

  describe('saveScore', () => {
    const scoreData = { name: 'Player1', score: 1000, game: 'tetris' };

    it('should save score successfully', async () => {
      const mockScore = { id: 1, ...scoreData, createdAt: new Date() };
      service['initialized'] = true;
      mockPrismaInstance.score.create.mockResolvedValue(mockScore);

      const result = await service.saveScore(scoreData);

      expect(mockPrismaInstance.score.create).toHaveBeenCalledWith({
        data: scoreData,
      });
      expect(result).toEqual(mockScore);
    });

    it('should initialize if not already initialized', async () => {
      const mockScore = { id: 1, ...scoreData, createdAt: new Date() };
      mockPrismaInstance.$connect.mockResolvedValue(undefined);
      mockPrismaInstance.score.create.mockResolvedValue(mockScore);

      await service.saveScore(scoreData);

      expect(mockPrismaInstance.$connect).toHaveBeenCalled();
      expect(mockPrismaInstance.score.create).toHaveBeenCalled();
    });

    it('should throw error if save fails', async () => {
      const error = new Error('Save failed');
      service['initialized'] = true;
      mockPrismaInstance.score.create.mockRejectedValue(error);

      await expect(service.saveScore(scoreData)).rejects.toThrow('Save failed');
    });
  });

  describe('getHighScores', () => {
    const mockScores = [
      { id: 1, name: 'Player1', score: 1000, game: 'tetris', createdAt: new Date() },
      { id: 2, name: 'Player2', score: 900, game: 'tetris', createdAt: new Date() },
    ];

    it('should get high scores for a game', async () => {
      service['initialized'] = true;
      mockPrismaInstance.score.findMany.mockResolvedValue(mockScores);

      const result = await service.getHighScores('tetris', 10);

      expect(mockPrismaInstance.score.findMany).toHaveBeenCalledWith({
        where: { game: 'tetris' },
        orderBy: { score: 'desc' },
        take: 10,
      });
      expect(result).toEqual(mockScores);
    });

    it('should use default limit of 10', async () => {
      service['initialized'] = true;
      mockPrismaInstance.score.findMany.mockResolvedValue(mockScores);

      await service.getHighScores('tetris');

      expect(mockPrismaInstance.score.findMany).toHaveBeenCalledWith({
        where: { game: 'tetris' },
        orderBy: { score: 'desc' },
        take: 10,
      });
    });

    it('should throw error if fetch fails', async () => {
      const error = new Error('Fetch failed');
      service['initialized'] = true;
      mockPrismaInstance.score.findMany.mockRejectedValue(error);

      await expect(service.getHighScores('tetris')).rejects.toThrow('Fetch failed');
    });
  });

  describe('getAllHighScores', () => {
    const mockScores = [
      { id: 1, name: 'Player1', score: 1000, game: 'tetris', createdAt: new Date() },
      { id: 2, name: 'Player2', score: 900, game: 'pong', createdAt: new Date() },
    ];

    it('should get all high scores', async () => {
      service['initialized'] = true;
      mockPrismaInstance.score.findMany.mockResolvedValue(mockScores);

      const result = await service.getAllHighScores(10);

      expect(mockPrismaInstance.score.findMany).toHaveBeenCalledWith({
        orderBy: { score: 'desc' },
        take: 10,
      });
      expect(result).toEqual(mockScores);
    });

    it('should use default limit of 10', async () => {
      service['initialized'] = true;
      mockPrismaInstance.score.findMany.mockResolvedValue(mockScores);

      await service.getAllHighScores();

      expect(mockPrismaInstance.score.findMany).toHaveBeenCalledWith({
        orderBy: { score: 'desc' },
        take: 10,
      });
    });

    it('should throw error if fetch fails', async () => {
      const error = new Error('Fetch failed');
      service['initialized'] = true;
      mockPrismaInstance.score.findMany.mockRejectedValue(error);

      await expect(service.getAllHighScores()).rejects.toThrow('Fetch failed');
    });
  });

  describe('isHighScore', () => {
    it('should return true if less than 10 scores exist', async () => {
      const mockScores = [
        { id: 1, name: 'Player1', score: 500, game: 'tetris', createdAt: new Date() },
      ];
      service['initialized'] = true;
      mockPrismaInstance.score.findMany.mockResolvedValue(mockScores);

      const result = await service.isHighScore('tetris', 600);

      expect(result).toBe(true);
    });

    it('should return true if score is higher than lowest top score', async () => {
      const mockScores = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Player${i + 1}`,
        score: 1000 - i * 100,
        game: 'tetris',
        createdAt: new Date(),
      }));
      service['initialized'] = true;
      mockPrismaInstance.score.findMany.mockResolvedValue(mockScores);

      const result = await service.isHighScore('tetris', 250);

      expect(result).toBe(true);
    });

    it('should return false if score is lower than lowest top score', async () => {
      const mockScores = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Player${i + 1}`,
        score: 1000 - i * 100,
        game: 'tetris',
        createdAt: new Date(),
      }));
      service['initialized'] = true;
      mockPrismaInstance.score.findMany.mockResolvedValue(mockScores);

      const result = await service.isHighScore('tetris', 50);

      expect(result).toBe(false);
    });

    it('should return false if check fails', async () => {
      const error = new Error('Check failed');
      service['initialized'] = true;
      mockPrismaInstance.score.findMany.mockRejectedValue(error);

      const result = await service.isHighScore('tetris', 1000);

      expect(result).toBe(false);
    });
  });

  describe('deleteScore', () => {
    it('should delete score successfully', async () => {
      service['initialized'] = true;
      mockPrismaInstance.score.delete.mockResolvedValue({});

      await service.deleteScore(1);

      expect(mockPrismaInstance.score.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw error if delete fails', async () => {
      const error = new Error('Delete failed');
      service['initialized'] = true;
      mockPrismaInstance.score.delete.mockRejectedValue(error);

      await expect(service.deleteScore(1)).rejects.toThrow('Delete failed');
    });
  });

  describe('clearScores', () => {
    it('should clear scores for specific game', async () => {
      service['initialized'] = true;
      mockPrismaInstance.score.deleteMany.mockResolvedValue({});

      await service.clearScores('tetris');

      expect(mockPrismaInstance.score.deleteMany).toHaveBeenCalledWith({
        where: { game: 'tetris' },
      });
    });

    it('should clear all scores when no game specified', async () => {
      service['initialized'] = true;
      mockPrismaInstance.score.deleteMany.mockResolvedValue({});

      await service.clearScores();

      expect(mockPrismaInstance.score.deleteMany).toHaveBeenCalledWith();
    });

    it('should throw error if clear fails', async () => {
      const error = new Error('Clear failed');
      service['initialized'] = true;
      mockPrismaInstance.score.deleteMany.mockRejectedValue(error);

      await expect(service.clearScores()).rejects.toThrow('Clear failed');
    });
  });

  describe('close', () => {
    it('should disconnect from database if initialized', async () => {
      service['initialized'] = true;
      mockPrismaInstance.$disconnect.mockResolvedValue(undefined);

      await service.close();

      expect(mockPrismaInstance.$disconnect).toHaveBeenCalled();
      expect(service['initialized']).toBe(false);
    });

    it('should not disconnect if not initialized', async () => {
      service['initialized'] = false;

      await service.close();

      expect(mockPrismaInstance.$disconnect).not.toHaveBeenCalled();
    });
  });

  describe('ensureInitialized', () => {
    it('should initialize if not already initialized', async () => {
      service['initialized'] = false;
      mockPrismaInstance.$connect.mockResolvedValue(undefined);

      await service['ensureInitialized']();

      expect(mockPrismaInstance.$connect).toHaveBeenCalled();
      expect(service['initialized']).toBe(true);
    });

    it('should not initialize if already initialized', async () => {
      service['initialized'] = true;

      await service['ensureInitialized']();

      expect(mockPrismaInstance.$connect).not.toHaveBeenCalled();
    });
  });
});