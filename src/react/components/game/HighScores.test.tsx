import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import HighScores from './HighScores';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

// Mock electron API
const mockElectronAPI = {
  getHighScores: jest.fn(),
  getAllHighScores: jest.fn(),
  clearScores: jest.fn(),
  deleteScore: jest.fn(),
};

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
});

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: jest.fn(),
});

const mockT = jest.fn((key: string, options?: any) => {
  const translations: Record<string, string> = {
    'highScores.loadError': 'Failed to load high scores',
    'highScores.clearError': 'Failed to clear scores',
    'highScores.deleteError': 'Failed to delete score',
    'highScores.loading': 'Loading...',
    'highScores.retry': 'Retry',
    'highScores.gameTitle': `High Scores - ${options?.game}`,
    'highScores.allGamesTitle': 'All High Scores',
    'highScores.refresh': 'Refresh',
    'highScores.clear': 'Clear All',
    'highScores.noScores': 'No high scores yet',
    'highScores.rank': 'Rank',
    'highScores.name': 'Name',
    'highScores.score': 'Score',
    'highScores.date': 'Date',
    'highScores.actions': 'Actions',
    'highScores.delete': 'Delete',
    'highScores.clearConfirm': 'Are you sure you want to clear all scores?',
    'highScores.deleteConfirm': 'Are you sure you want to delete this score?',
  };
  return translations[key] || key;
});

describe('HighScores', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTranslation as jest.Mock).mockReturnValue({ t: mockT });
    (window.confirm as jest.Mock).mockReturnValue(false);
  });

  const mockScores = [
    {
      id: 1,
      name: 'Player1',
      score: 1000,
      game: 'lineDestroyer',
      createdAt: new Date('2023-01-01'),
    },
    {
      id: 2,
      name: 'Player2',
      score: 900,
      game: 'lineDestroyer',
      createdAt: new Date('2023-01-02'),
    },
    {
      id: 3,
      name: 'Player3',
      score: 800,
      game: 'lineDestroyer',
      createdAt: new Date('2023-01-03'),
    },
  ];

  it('shows loading state initially', () => {
    mockElectronAPI.getHighScores.mockImplementation(() => new Promise(() => {}));

    render(<HighScores game="lineDestroyer" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('loads and displays high scores for specific game', async () => {
    mockElectronAPI.getHighScores.mockResolvedValue(mockScores);

    render(<HighScores game="lineDestroyer" />);

    await waitFor(() => {
      expect(screen.getByText('High Scores - lineDestroyer')).toBeInTheDocument();
    });

    expect(mockElectronAPI.getHighScores).toHaveBeenCalledWith('lineDestroyer', 10);
    expect(screen.getByText('Player1')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
  });

  it('loads and displays all high scores when no game specified', async () => {
    mockElectronAPI.getAllHighScores.mockResolvedValue(mockScores);

    render(<HighScores />);

    await waitFor(() => {
      expect(screen.getByText('All High Scores')).toBeInTheDocument();
    });

    expect(mockElectronAPI.getAllHighScores).toHaveBeenCalledWith(10);
  });

  it('shows error state when loading fails', async () => {
    mockElectronAPI.getHighScores.mockRejectedValue(new Error('Network error'));

    render(<HighScores game="lineDestroyer" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load high scores')).toBeInTheDocument();
    });

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('retries loading when retry button is clicked', async () => {
    mockElectronAPI.getHighScores
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockScores);

    render(<HighScores game="lineDestroyer" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load high scores')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.getByText('Player1')).toBeInTheDocument();
    });
  });

  it('shows no scores message when scores array is empty', async () => {
    mockElectronAPI.getHighScores.mockResolvedValue([]);

    render(<HighScores game="lineDestroyer" />);

    await waitFor(() => {
      expect(screen.getByText('No high scores yet')).toBeInTheDocument();
    });
  });

  it('clears scores when clear button is clicked and confirmed', async () => {
    mockElectronAPI.getHighScores.mockResolvedValue(mockScores);
    (window.confirm as jest.Mock).mockReturnValue(true);
    mockElectronAPI.clearScores.mockResolvedValue(undefined);

    render(<HighScores game="lineDestroyer" />);

    await waitFor(() => {
      expect(screen.getByText('Player1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Clear All'));

    await waitFor(() => {
      expect(mockElectronAPI.clearScores).toHaveBeenCalledWith('lineDestroyer');
    });
  });

  it('does not clear scores when clear is cancelled', async () => {
    mockElectronAPI.getHighScores.mockResolvedValue(mockScores);
    (window.confirm as jest.Mock).mockReturnValue(false);

    render(<HighScores game="lineDestroyer" />);

    await waitFor(() => {
      expect(screen.getByText('Player1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Clear All'));

    expect(mockElectronAPI.clearScores).not.toHaveBeenCalled();
  });

  it('shows error when clear scores fails', async () => {
    mockElectronAPI.getHighScores.mockResolvedValue(mockScores);
    (window.confirm as jest.Mock).mockReturnValue(true);
    mockElectronAPI.clearScores.mockRejectedValue(new Error('Clear failed'));

    render(<HighScores game="lineDestroyer" />);

    await waitFor(() => {
      expect(screen.getByText('Player1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Clear All'));

    await waitFor(() => {
      expect(screen.getByText('Failed to clear scores')).toBeInTheDocument();
    });
  });

  it('deletes score when delete button is clicked and confirmed', async () => {
    mockElectronAPI.getHighScores.mockResolvedValue(mockScores);
    (window.confirm as jest.Mock).mockReturnValue(true);
    mockElectronAPI.deleteScore.mockResolvedValue(undefined);

    render(<HighScores game="lineDestroyer" />);

    await waitFor(() => {
      expect(screen.getByText('Player1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockElectronAPI.deleteScore).toHaveBeenCalledWith(1);
    });
  });

  it('does not delete score when delete is cancelled', async () => {
    mockElectronAPI.getHighScores.mockResolvedValue(mockScores);
    (window.confirm as jest.Mock).mockReturnValue(false);

    render(<HighScores game="lineDestroyer" />);

    await waitFor(() => {
      expect(screen.getByText('Player1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(mockElectronAPI.deleteScore).not.toHaveBeenCalled();
  });

  it('shows error when delete score fails', async () => {
    mockElectronAPI.getHighScores.mockResolvedValue(mockScores);
    (window.confirm as jest.Mock).mockReturnValue(true);
    mockElectronAPI.deleteScore.mockRejectedValue(new Error('Delete failed'));

    render(<HighScores game="lineDestroyer" />);

    await waitFor(() => {
      expect(screen.getByText('Player1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Failed to delete score')).toBeInTheDocument();
    });
  });

  it('refreshes scores when refresh button is clicked', async () => {
    mockElectronAPI.getHighScores.mockResolvedValue(mockScores);

    render(<HighScores game="lineDestroyer" />);

    await waitFor(() => {
      expect(screen.getByText('Player1')).toBeInTheDocument();
    });

    mockElectronAPI.getHighScores.mockClear();
    fireEvent.click(screen.getByText('Refresh'));

    expect(mockElectronAPI.getHighScores).toHaveBeenCalledWith('lineDestroyer', 10);
  });

  it('displays ranking badges for top 3 scores', async () => {
    mockElectronAPI.getHighScores.mockResolvedValue(mockScores);

    render(<HighScores game="lineDestroyer" />);

    await waitFor(() => {
      expect(screen.getByText('1 🥇')).toBeInTheDocument();
      expect(screen.getByText('2 🥈')).toBeInTheDocument();
      expect(screen.getByText('3 🥉')).toBeInTheDocument();
    });
  });

  it('applies correct styling for bronze medal (3rd place)', async () => {
    mockElectronAPI.getHighScores.mockResolvedValue(mockScores);

    render(<HighScores game="lineDestroyer" />);

    await waitFor(() => {
      const bronzeElement = screen.getByText('3 🥉').closest('.grid');
      expect(bronzeElement).toHaveClass('bg-orange-900', 'text-orange-200');
    });
  });

  it('formats dates correctly', async () => {
    mockElectronAPI.getHighScores.mockResolvedValue(mockScores);

    render(<HighScores game="lineDestroyer" />);

    await waitFor(() => {
      expect(screen.getByText('1/1/2023')).toBeInTheDocument();
    });
  });

  it('uses custom limit when provided', async () => {
    mockElectronAPI.getHighScores.mockResolvedValue(mockScores);

    render(<HighScores game="lineDestroyer" limit={5} />);

    await waitFor(() => {
      expect(mockElectronAPI.getHighScores).toHaveBeenCalledWith('lineDestroyer', 5);
    });
  });

  it('applies correct styling for all ranking positions', async () => {
    const extendedMockScores = [
      ...mockScores,
      {
        id: 4,
        name: 'Player4',
        score: 700,
        game: 'lineDestroyer',
        createdAt: new Date('2023-01-04'),
      },
    ];

    mockElectronAPI.getHighScores.mockResolvedValue(extendedMockScores);

    render(<HighScores game="lineDestroyer" />);

    await waitFor(() => {
      // Test gold medal (index 0)
      const goldElement = screen.getByText('1 🥇').closest('.grid');
      expect(goldElement).toHaveClass('bg-yellow-900', 'text-yellow-200');

      // Test silver medal (index 1)
      const silverElement = screen.getByText('2 🥈').closest('.grid');
      expect(silverElement).toHaveClass('bg-gray-700', 'text-gray-200');

      // Test bronze medal (index 2) - this covers line 144
      const bronzeElement = screen.getByText('3 🥉').closest('.grid');
      expect(bronzeElement).toHaveClass('bg-orange-900', 'text-orange-200');

      // Test 4th place and beyond (index > 2)
      const fourthElement = screen.getByText('4').closest('.grid');
      expect(fourthElement).toHaveClass('bg-gray-800', 'text-gray-300');
    });
  });
});