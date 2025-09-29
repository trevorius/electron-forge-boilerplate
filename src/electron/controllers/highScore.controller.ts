import { ipcMain } from 'electron';
import { highScoreService, CreateScoreRequest } from '../services/highScore.service';

/**
 * High Score IPC Controller
 * Handles all IPC communication for high score operations
 * Separated from main.ts to keep the codebase organized and scalable
 */
export class HighScoreController {
  /**
   * Initialize all high score-related IPC handlers
   * Call this from main.ts after the app is ready
   */
  static async registerHandlers(): Promise<void> {
    // Initialize the database first
    try {
      await highScoreService.initialize();
      console.log('High score service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize high score service:', error);
      // Continue anyway - the service will try to initialize on first use
    }

    // Save a high score
    ipcMain.handle('save-score', async (_event, scoreData: CreateScoreRequest) => {
      try {
        return await highScoreService.saveScore(scoreData);
      } catch (error) {
        console.error('Failed to save score:', error);
        throw error;
      }
    });

    // Get high scores for a specific game
    ipcMain.handle('get-high-scores', async (_event, game: string, limit?: number) => {
      try {
        return await highScoreService.getHighScores(game, limit);
      } catch (error) {
        console.error('Failed to get high scores:', error);
        throw error;
      }
    });

    // Get high scores across all games
    ipcMain.handle('get-all-high-scores', async (_event, limit?: number) => {
      try {
        return await highScoreService.getAllHighScores(limit);
      } catch (error) {
        console.error('Failed to get all high scores:', error);
        throw error;
      }
    });

    // Check if a score qualifies as a high score
    ipcMain.handle('is-high-score', async (_event, game: string, score: number) => {
      try {
        return await highScoreService.isHighScore(game, score);
      } catch (error) {
        console.error('Failed to check if high score:', error);
        return false;
      }
    });

    // Delete a specific score
    ipcMain.handle('delete-score', async (_event, id: number) => {
      try {
        await highScoreService.deleteScore(id);
      } catch (error) {
        console.error('Failed to delete score:', error);
        throw error;
      }
    });

    // Clear scores (optionally for a specific game)
    ipcMain.handle('clear-scores', async (_event, game?: string) => {
      try {
        await highScoreService.clearScores(game);
      } catch (error) {
        console.error('Failed to clear scores:', error);
        throw error;
      }
    });
  }

  /**
   * Remove all high score IPC handlers
   * Useful for cleanup or testing
   */
  static removeHandlers(): void {
    ipcMain.removeHandler('save-score');
    ipcMain.removeHandler('get-high-scores');
    ipcMain.removeHandler('get-all-high-scores');
    ipcMain.removeHandler('is-high-score');
    ipcMain.removeHandler('delete-score');
    ipcMain.removeHandler('clear-scores');
  }
}