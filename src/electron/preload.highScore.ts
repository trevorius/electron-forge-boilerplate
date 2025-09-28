import { ipcRenderer } from 'electron';

/**
 * Database Types and Interfaces
 * Shared between main and renderer processes
 */
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

/**
 * Database API functions for preload script
 * These functions handle IPC communication for database operations
 */
export const databaseAPI = {
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

/**
 * Type definitions for the main ElectronAPI interface
 * Use this to extend the main ElectronAPI interface
 */
export interface DatabaseAPI {
  saveScore: (scoreData: CreateScoreRequest) => Promise<ScoreRecord>;
  getHighScores: (game: string, limit?: number) => Promise<ScoreRecord[]>;
  getAllHighScores: (limit?: number) => Promise<ScoreRecord[]>;
  isHighScore: (game: string, score: number) => Promise<boolean>;
  deleteScore: (id: number) => Promise<void>;
  clearScores: (game?: string) => Promise<void>;
}