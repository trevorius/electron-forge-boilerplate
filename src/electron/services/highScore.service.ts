import { PrismaClient } from '../generated/prisma';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export interface ScoreRecord {
  id: number;
  name: string;
  score: number;
  game: string;
  createdAt: Date;
}

export interface CreateScoreRequest {
  name: string;
  score: number;
  game: string;
}

export class HighScoreService {
  private prisma: PrismaClient;
  private initialized: boolean = false;

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.getDatabaseUrl(),
        },
      },
    });
  }

  private getDatabaseUrl(): string {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      const dbPath = path.join(process.cwd(), 'prisma', 'database.db');
      return `file:${dbPath}`;
    }

    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'database.db');
    return `file:${dbPath}`;
  }

  private getDatabasePath(): string {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      return path.join(process.cwd(), 'prisma', 'database.db');
    }

    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'database.db');
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Ensure database exists and has proper schema
      await this.ensureDatabaseExists();

      await this.prisma.$connect();

      // Check if tables exist, create them if not
      await this.ensureTablesExist();

      this.initialized = true;
      console.log('Database connected and initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async ensureDatabaseExists(): Promise<void> {
    const dbPath = this.getDatabasePath();
    const dbDir = path.dirname(dbPath);

    // Ensure directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // If database doesn't exist, it will be created when we connect
    if (!fs.existsSync(dbPath)) {
      console.log('Creating new database at:', dbPath);
    }
  }

  private async ensureTablesExist(): Promise<void> {
    try {
      // Try to query the scores table
      await this.prisma.$queryRaw`SELECT 1 FROM scores LIMIT 1`;
      console.log('Scores table exists');
    } catch (error) {
      // Table doesn't exist, create it
      console.log('Creating scores table...');
      await this.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "scores" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "name" TEXT NOT NULL,
          "score" INTEGER NOT NULL,
          "game" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log('Scores table created successfully');
    }
  }

  async saveScore(scoreData: CreateScoreRequest): Promise<ScoreRecord> {
    await this.ensureInitialized();

    try {
      const score = await this.prisma.score.create({
        data: {
          name: scoreData.name,
          score: scoreData.score,
          game: scoreData.game,
        },
      });

      return score;
    } catch (error) {
      console.error('Failed to save score:', error);
      throw error;
    }
  }

  async getHighScores(game: string, limit: number = 10): Promise<ScoreRecord[]> {
    await this.ensureInitialized();

    try {
      const scores = await this.prisma.score.findMany({
        where: { game },
        orderBy: { score: 'desc' },
        take: limit,
      });

      return scores;
    } catch (error) {
      console.error('Failed to get high scores:', error);
      throw error;
    }
  }

  async getAllHighScores(limit: number = 10): Promise<ScoreRecord[]> {
    await this.ensureInitialized();

    try {
      const scores = await this.prisma.score.findMany({
        orderBy: { score: 'desc' },
        take: limit,
      });

      return scores;
    } catch (error) {
      console.error('Failed to get all high scores:', error);
      throw error;
    }
  }

  async isHighScore(game: string, score: number): Promise<boolean> {
    await this.ensureInitialized();

    try {
      const topScores = await this.getHighScores(game, 10);

      if (topScores.length < 10) {
        return true;
      }

      const lowestTopScore = topScores[topScores.length - 1].score;
      return score > lowestTopScore;
    } catch (error) {
      console.error('Failed to check if high score:', error);
      return false;
    }
  }

  async deleteScore(id: number): Promise<void> {
    await this.ensureInitialized();

    try {
      await this.prisma.score.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Failed to delete score:', error);
      throw error;
    }
  }

  async clearScores(game?: string): Promise<void> {
    await this.ensureInitialized();

    try {
      if (game) {
        await this.prisma.score.deleteMany({
          where: { game },
        });
      } else {
        await this.prisma.score.deleteMany();
      }
    } catch (error) {
      console.error('Failed to clear scores:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.initialized) {
      await this.prisma.$disconnect();
      this.initialized = false;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

export const highScoreService = new HighScoreService();