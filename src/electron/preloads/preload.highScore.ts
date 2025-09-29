import { ipcRenderer } from 'electron';

/**
 * Database Types and Interfaces
 * Shared between main and renderer processes
 */
interface ScoreRecord {
  id: number;
  name: string;
  score: number;
  game: string;
  createdAt: Date;
}

interface CreateScoreRequest {
  name: string;
  score: number;
  game: string;
}

/**
 * High Score API functions for preload script
 * These functions handle IPC communication for database operations
 */
export const HighSCoresApi = {
  saveScore: (scoreData: CreateScoreRequest): Promise<ScoreRecord> =>
    ipcRenderer.invoke('save-score', scoreData),

  getHighScores: (game: string, limit?: number): Promise<ScoreRecord[]> =>
    ipcRenderer.invoke('get-high-scores', game, limit),

  getAllHighScores: (limit?: number): Promise<ScoreRecord[]> =>
    ipcRenderer.invoke('get-all-high-scores', limit),

  isHighScore: (game: string, score: number): Promise<boolean> =>
    ipcRenderer.invoke('is-high-score', game, score),

  deleteScore: (id: number): Promise<void> =>
    ipcRenderer.invoke('delete-score', id),

  clearScores: (game?: string): Promise<void> =>
    ipcRenderer.invoke('clear-scores', game)
};
