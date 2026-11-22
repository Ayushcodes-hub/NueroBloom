import React, { useEffect, useState } from 'react';
import { GAMES_CATALOG } from '../../shared/types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { GameShell, type MiniGameProps } from '../games/GameShell';
import {
  AudioMemoryGame,
  EmotionMatchingGame,
  MemoryMatchGame,
  WordImageMatchingGame,
} from '../games/MemoryLanguageGames';
import {
  ColorSortingGame,
  NumberSequenceGame,
  PatternSequenceGame,
  ShapeIdentificationGame,
  VisualAttentionGame,
} from '../games/PatternAttentionGames';
import { MazeExplorerGame, SkyGliderGame } from '../games/MotorSpatialGames';

interface GameStudioPageProps {
  gameId: string;
  navigate: (to: string) => void;
}

export const GameStudioPage: React.FC<GameStudioPageProps> = ({ gameId, navigate }) => {
  const { activeChild } = useAuth();
  const [recommendedDiff, setRecommendedDiff] = useState(1);

  const game = GAMES_CATALOG.find((g) => g.id === gameId);

  useEffect(() => {
    if (!game) return;
    api
      .getGames(activeChild?.id)
      .then((res) => {
        const found = res.games.find((g) => g.id === game.id);
        if (found) setRecommendedDiff(found.recommended_difficulty || 1);
      })
      .catch(() => {});
  }, [game, activeChild?.id]);

  if (!game) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Game not found</h1>
        <button
          type="button"
          onClick={() => navigate('/child')}
          className="mt-4 rounded-xl bg-[var(--nb-primary)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to Child Dashboard
        </button>
      </div>
    );
  }

  const renderById = (props: MiniGameProps) => {
    switch (game.id) {
      case 'memory-match':
        return <MemoryMatchGame {...props} />;
      case 'pattern-sequence':
        return <PatternSequenceGame {...props} />;
      case 'color-sorting':
        return <ColorSortingGame {...props} />;
      case 'shape-identification':
        return <ShapeIdentificationGame {...props} />;
      case 'number-sequence':
        return <NumberSequenceGame {...props} />;
      case 'visual-attention':
        return <VisualAttentionGame {...props} />;
      case 'word-image-matching':
        return <WordImageMatchingGame {...props} />;
      case 'audio-memory':
        return <AudioMemoryGame {...props} />;
      case 'maze-explorer':
        return <MazeExplorerGame {...props} />;
      case 'sky-glider':
        return <SkyGliderGame {...props} />;
      case 'emotion-matching':
        return <EmotionMatchingGame {...props} />;
      default:
        return <MemoryMatchGame {...props} />;
    }
  };

  return (
    <GameShell
      game={game}
      initialDifficulty={recommendedDiff}
      onBack={() => navigate('/child')}
      renderGame={renderById}
    />
  );
};
