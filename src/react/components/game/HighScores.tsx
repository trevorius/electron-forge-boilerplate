import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface ScoreRecord {
  id: number;
  name: string;
  score: number;
  game: string;
  createdAt: Date;
}

interface HighScoresProps {
  game?: string;
  limit?: number;
}

const HighScores: React.FC<HighScoresProps> = ({ game, limit = 10 }) => {
  const { t } = useTranslation();
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadScores = async () => {
    setLoading(true);
    setError(null);

    try {
      let highScores: ScoreRecord[];
      if (game) {
        highScores = await window.electronAPI.getHighScores(game, limit);
      } else {
        highScores = await window.electronAPI.getAllHighScores(limit);
      }
      setScores(highScores);
    } catch (err) {
      console.error('Failed to load high scores:', err);
      setError(t('highScores.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScores();
  }, [game, limit]);

  const clearScores = async () => {
    if (!window.confirm(t('highScores.clearConfirm'))) return;

    try {
      await window.electronAPI.clearScores(game);
      await loadScores();
    } catch (err) {
      console.error('Failed to clear scores:', err);
      setError(t('highScores.clearError'));
    }
  };

  const deleteScore = async (id: number) => {
    if (!window.confirm(t('highScores.deleteConfirm'))) return;

    try {
      await window.electronAPI.deleteScore(id);
      await loadScores();
    } catch (err) {
      console.error('Failed to delete score:', err);
      setError(t('highScores.deleteError'));
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gray-800 border-gray-600">
        <p className="text-white text-center">{t('highScores.loading')}</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-900 border-red-600">
        <p className="text-white text-center">{error}</p>
        <div className="mt-4 text-center">
          <Button onClick={loadScores} className="bg-blue-600 hover:bg-blue-700">
            {t('highScores.retry')}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gray-800 border-gray-600">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">
          {game ? t('highScores.gameTitle', { game }) : t('highScores.allGamesTitle')}
        </h2>
        <div className="space-x-2">
          <Button
            onClick={loadScores}
            className="bg-blue-600 hover:bg-blue-700 text-sm"
          >
            {t('highScores.refresh')}
          </Button>
          {scores.length > 0 && (
            <Button
              onClick={clearScores}
              className="bg-red-600 hover:bg-red-700 text-sm"
            >
              {t('highScores.clear')}
            </Button>
          )}
        </div>
      </div>

      {scores.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          {t('highScores.noScores')}
        </p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-4 text-gray-300 font-semibold border-b border-gray-600 pb-2">
            <div>{t('highScores.rank')}</div>
            <div>{t('highScores.name')}</div>
            <div>{t('highScores.score')}</div>
            <div>{t('highScores.date')}</div>
            <div>{t('highScores.actions')}</div>
          </div>

          {scores.map((score, index) => (
            <div
              key={score.id}
              className={`grid grid-cols-5 gap-4 items-center py-2 px-3 rounded ${
                index === 0
                  ? 'bg-yellow-900 text-yellow-200'
                  : index === 1
                  ? 'bg-gray-700 text-gray-200'
                  : index === 2
                  ? 'bg-orange-900 text-orange-200'
                  : 'bg-gray-800 text-gray-300'
              }`}
            >
              <div className="font-bold">
                {index + 1}
                {index === 0 && ' 🥇'}
                {index === 1 && ' 🥈'}
                {index === 2 && ' 🥉'}
              </div>
              <div className="font-medium">{score.name}</div>
              <div className="font-bold">{score.score.toLocaleString()}</div>
              <div className="text-sm">{formatDate(score.createdAt)}</div>
              <div>
                <Button
                  onClick={() => deleteScore(score.id)}
                  className="bg-red-600 hover:bg-red-700 text-xs py-1 px-2"
                >
                  {t('highScores.delete')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default HighScores;