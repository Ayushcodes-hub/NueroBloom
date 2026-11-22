import type { DatabaseSync } from 'node:sqlite';
import {
  GAMES_CATALOG,
  type AdaptiveAdjustment,
  type GameCategory,
  type GameRecommendation,
  type GameSessionRecord,
} from '../shared/types.ts';

export interface AdaptiveConfig {
  increaseThresholdAccuracy: number;
  increaseWindowSessions: number;
  reduceThresholdAccuracy: number;
  reduceWindowSessions: number;
  minDifficulty: number;
  maxDifficulty: number;
  highHintThreshold: number;
  repeatedErrorThreshold: number;
}

export const DEFAULT_ADAPTIVE_CONFIG: AdaptiveConfig = {
  increaseThresholdAccuracy: 85,
  increaseWindowSessions: 3,
  reduceThresholdAccuracy: 60,
  reduceWindowSessions: 2,
  minDifficulty: 1,
  maxDifficulty: 5,
  highHintThreshold: 2,
  repeatedErrorThreshold: 3,
};

/**
 * Rule-based Adaptive Personalization Engine:
 * - IF accuracy >= 85% across 3 comparable sessions: Increase difficulty by one level.
 * - IF accuracy is between 60% and 84%: Maintain difficulty.
 * - IF accuracy < 60% across 2 comparable sessions: Reduce difficulty by one level.
 * - IF child repeatedly struggles (errors/hints): Offer simpler instructions & audio guidance.
 * - IF child completes multiple activities in same category: Suggest a different category for variety.
 */
export function evaluateAdaptiveDifficulty(
  recentComparableSessions: Array<{ accuracy: number; difficulty: number; hints_used: number; repeated_errors: number }>,
  currentDifficulty: number,
  latestCategory: GameCategory,
  recentCategories: GameCategory[],
  config: AdaptiveConfig = DEFAULT_ADAPTIVE_CONFIG
): AdaptiveAdjustment {
  const ordered = recentComparableSessions; // newest first
  const latest = ordered[0];

  let nextDifficulty = currentDifficulty;
  let action: AdaptiveAdjustment['action'] = 'maintained';
  let reason = `Staying at Level ${currentDifficulty} to build comfortable mastery (accuracy ${Math.round(latest?.accuracy ?? 75)}%).`;

  if (ordered.length >= config.increaseWindowSessions) {
    const windowSlice = ordered.slice(0, config.increaseWindowSessions);
    const allHigh = windowSlice.every((s) => s.accuracy >= config.increaseThresholdAccuracy);
    if (allHigh && currentDifficulty < config.maxDifficulty) {
      nextDifficulty = Math.min(config.maxDifficulty, currentDifficulty + 1);
      action = 'increased';
      reason = `Accuracy stayed at or above ${config.increaseThresholdAccuracy}% across ${config.increaseWindowSessions} sessions, so difficulty gently stepped up to Level ${nextDifficulty}.`;
    } else if (allHigh && currentDifficulty >= config.maxDifficulty) {
      reason = `Consistent ${config.increaseThresholdAccuracy}%+ accuracy at Level ${config.maxDifficulty} (current peak level).`;
    }
  }

  if (action === 'maintained' && ordered.length >= config.reduceWindowSessions) {
    const windowSlice = ordered.slice(0, config.reduceWindowSessions);
    const allLow = windowSlice.every((s) => s.accuracy < config.reduceThresholdAccuracy);
    if (allLow && currentDifficulty > config.minDifficulty) {
      nextDifficulty = Math.max(config.minDifficulty, currentDifficulty - 1);
      action = 'reduced';
      reason = `Accuracy was below ${config.reduceThresholdAccuracy}% across ${config.reduceWindowSessions} sessions, so difficulty eased to Level ${nextDifficulty} for a supportive pace.`;
    }
  }

  const offerSimplerInstructions = Boolean(
    latest &&
      (latest.repeated_errors >= config.repeatedErrorThreshold ||
        latest.hints_used >= config.highHintThreshold ||
        latest.accuracy < config.reduceThresholdAccuracy)
  );

  const offerAudioGuidance = Boolean(
    latest && (latest.repeated_errors >= config.repeatedErrorThreshold || latest.accuracy < 65)
  );

  let suggestedNextCategory: GameCategory | null = null;
  if (recentCategories.length >= 2 && recentCategories[0] === latestCategory && recentCategories[1] === latestCategory) {
    const allCategories: GameCategory[] = [
      'Memory',
      'Attention',
      'Pattern Recognition',
      'Motor Coordination',
      'Language',
      'Problem Solving',
    ];
    const leastRecent = allCategories.find((cat) => !recentCategories.slice(0, 4).includes(cat));
    suggestedNextCategory = leastRecent || allCategories.find((cat) => cat !== latestCategory) || null;
  }

  return {
    previousDifficulty: currentDifficulty,
    nextDifficulty,
    action,
    reason,
    offerSimplerInstructions,
    offerAudioGuidance,
    suggestedNextCategory,
  };
}

export function getRecommendedDifficultyForGame(
  db: DatabaseSync,
  childId: string,
  gameId: string,
  config: AdaptiveConfig = DEFAULT_ADAPTIVE_CONFIG
): number {
  const sessions = db
    .prepare(
      `SELECT accuracy, difficulty, hints_used, repeated_errors
       FROM game_sessions
       WHERE child_id = ? AND game_id = ?
       ORDER BY completed_at DESC
       LIMIT 5`
    )
    .all(childId, gameId) as Array<{
    accuracy: number;
    difficulty: number;
    hints_used: number;
    repeated_errors: number;
  }>;

  if (sessions.length === 0) {
    // Check if an educator left a difficulty recommendation for this game
    const docRec = db
      .prepare(
        `SELECT difficulty FROM recommendations
         WHERE child_id = ? AND game_id = ? AND source = 'educator'
         ORDER BY created_at DESC LIMIT 1`
      )
      .get(childId, gameId) as { difficulty: number } | undefined;
    return docRec?.difficulty ?? 1;
  }

  const game = GAMES_CATALOG.find((g) => g.id === gameId);
  const currentDiff = sessions[0].difficulty;
  const evalResult = evaluateAdaptiveDifficulty(
    sessions,
    currentDiff,
    game?.category ?? 'Memory',
    [],
    config
  );
  return evalResult.nextDifficulty;
}

export function buildAdaptiveRecommendations(db: DatabaseSync, childId: string): {
  primary: GameRecommendation;
  recommendations: GameRecommendation[];
} {
  const child = db
    .prepare('SELECT learning_preferences FROM child_profiles WHERE id = ?')
    .get(childId) as { learning_preferences: string } | undefined;

  let preferences: string[] = [];
  try {
    preferences = child ? (JSON.parse(child.learning_preferences) as string[]) : [];
  } catch {
    preferences = [];
  }

  const recentSessions = db
    .prepare(
      `SELECT * FROM game_sessions
       WHERE child_id = ?
       ORDER BY completed_at DESC
       LIMIT 20`
    )
    .all(childId) as unknown as GameSessionRecord[];

  const educatorRecs = db
    .prepare(
      `SELECT game_id, reason, difficulty, author_name, created_at
       FROM recommendations
       WHERE child_id = ? AND source = 'educator'
       ORDER BY created_at DESC
       LIMIT 3`
    )
    .all(childId) as Array<{
    game_id: string;
    reason: string;
    difficulty: number;
    author_name: string;
    created_at: string;
  }>;

  const recentGameIds = recentSessions.slice(0, 3).map((s) => s.game_id);
  const recentCategories = recentSessions
    .slice(0, 3)
    .map((s) => GAMES_CATALOG.find((g) => g.id === s.game_id)?.category)
    .filter(Boolean) as GameCategory[];

  const scoredGames = GAMES_CATALOG.map((game) => {
    const gameSessions = recentSessions.filter((s) => s.game_id === game.id);
    const recommendedDiff = getRecommendedDifficultyForGame(db, childId, game.id);
    let score = 50;
    let reason = `Great match to explore ${game.category.toLowerCase()} skills at Level ${recommendedDiff}.`;

    const prefMatch = preferences.some(
      (p) => p.toLowerCase() === game.category.toLowerCase() || p.toLowerCase() === game.id
    );
    if (prefMatch) {
      score += 20;
    }

    const educatorMatch = educatorRecs.find((r) => r.game_id === game.id);
    if (educatorMatch) {
      score += 35;
      reason = `${educatorMatch.author_name} suggested this: ${educatorMatch.reason}`;
    } else if (gameSessions.length > 0) {
      const last = gameSessions[0];
      if (last.accuracy >= 85 && !recentGameIds.slice(0, 1).includes(game.id)) {
        score += 22;
        reason = `Recommended because you enjoyed ${game.category.toLowerCase()} games and completed your last ${game.title} session with ${Math.round(last.accuracy)}% accuracy.`;
      } else if (last.accuracy < 65) {
        score += 18;
        reason = `Gentle practice at Level ${recommendedDiff} to build comfort with ${game.title} at your own pace.`;
      }
    } else {
      // Unplayed game boosts variety!
      score += 25;
      reason = `Fresh ${game.category.toLowerCase()} discovery to add variety to your recent activities.`;
    }

    // Encourage category variety if recent 2 sessions used the same category
    if (recentCategories.length >= 2 && recentCategories[0] === game.category && recentCategories[1] === game.category) {
      score -= 18;
    } else if (recentCategories.length > 0 && !recentCategories.slice(0, 2).includes(game.category)) {
      score += 12;
    }

    // Avoid repeating the exact last played game as #1 unless educator prioritized
    if (recentGameIds[0] === game.id && !educatorMatch) {
      score -= 15;
    }

    return {
      score,
      rec: {
        game_id: game.id,
        title: game.title,
        category: game.category,
        recommended_difficulty: recommendedDiff,
        reason,
        source: educatorMatch ? ('educator' as const) : ('adaptive-engine' as const),
        author_name: educatorMatch?.author_name,
      },
    };
  });

  scoredGames.sort((a, b) => b.score - a.score);
  const recommendations = scoredGames.slice(0, 4).map((item) => item.rec);

  return {
    primary: recommendations[0],
    recommendations,
  };
}
