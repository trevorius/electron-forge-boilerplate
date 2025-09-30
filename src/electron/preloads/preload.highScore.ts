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
function saveScore(scoreData: CreateScoreRequest): Promise<ScoreRecord> {
  return ipcRenderer.invoke('save-score', scoreData);
}

function getHighScores(game: string, limit?: number): Promise<ScoreRecord[]> {
  return ipcRenderer.invoke('get-high-scores', game, limit);
}

function getAllHighScores(limit?: number): Promise<ScoreRecord[]> {
  return ipcRenderer.invoke('get-all-high-scores', limit);
}

function isHighScore(game: string, score: number): Promise<boolean> {
  return ipcRenderer.invoke('is-high-score', game, score);
}

function deleteScore(id: number): Promise<void> {
  return ipcRenderer.invoke('delete-score', id);
}

function clearScores(game?: string): Promise<void> {
  return ipcRenderer.invoke('clear-scores', game);
}

export const HighSCoresApi = {
  saveScore,
  getHighScores,
  getAllHighScores,
  isHighScore,
  deleteScore,
  clearScores
};
