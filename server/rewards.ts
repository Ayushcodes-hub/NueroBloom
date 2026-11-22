import crypto from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import {
  ACHIEVEMENTS_CATALOG,
  GAMES_CATALOG,
  type AchievementDefinition,
  type GameSessionRecord,
  type RewardRecord,
  type UnlockedAchievement,
} from '../shared/types.ts';

export function calculateLevel(totalXp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
} {
  const xpPerLevel = 120;
  const level = Math.floor(totalXp / xpPerLevel) + 1;
  const currentLevelXp = totalXp % xpPerLevel;
  const nextLevelXp = xpPerLevel;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / nextLevelXp) * 100));
  return { level, currentLevelXp, nextLevelXp, progressPercent };
}

export function calculateDailyStreak(sessions: Array<{ completed_at: string }>): number {
  if (sessions.length === 0) return 0;
  const dateSet = new Set(sessions.map((s) => s.completed_at.slice(0, 10)));
  const sortedDates = Array.from(dateSet).sort((a, b) => (a > b ? -1 : 1));

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  let cursor = new Date(`${sortedDates[0]}T00:00:00Z`).getTime();
  for (let i = 1; i < sortedDates.length; i++) {
    const expectedPrev = new Date(cursor - 86400000).toISOString().slice(0, 10);
    if (sortedDates[i] === expectedPrev) {
      streak += 1;
      cursor -= 86400000;
    } else {
      break;
    }
  }
  return streak;
}

export function awardSessionRewards(
  db: DatabaseSync,
  childId: string,
  session: GameSessionRecord
): {
  sessionReward: RewardRecord;
  newlyUnlockedAchievements: AchievementDefinition[];
} {
  const now = new Date().toISOString();
  const baseCoins = 10 + (session.accuracy >= 80 ? 5 : 0);
  const baseXp = 25 + Math.round(session.accuracy * 0.2) + session.difficulty * 5;
  const gameTitle = GAMES_CATALOG.find((g) => g.id === session.game_id)?.title || session.game_id;

  const rewardId = crypto.randomUUID();
  const claimKey = `session:${session.id}`;

  db.prepare(
    `INSERT INTO rewards (id, child_id, reward_type, claim_key, description, coins, xp, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    rewardId,
    childId,
    'game_completion',
    claimKey,
    `Completed ${gameTitle} (Level ${session.difficulty})`,
    baseCoins,
    baseXp,
    now
  );

  const sessionReward: RewardRecord = {
    id: rewardId,
    child_id: childId,
    reward_type: 'game_completion',
    claim_key: claimKey,
    description: `Completed ${gameTitle} (Level ${session.difficulty})`,
    coins: baseCoins,
    xp: baseXp,
    created_at: now,
  };

  // Evaluate achievements
  const allSessions = db
    .prepare('SELECT * FROM game_sessions WHERE child_id = ? ORDER BY completed_at DESC')
    .all(childId) as unknown as GameSessionRecord[];

  const existingAchievements = db
    .prepare('SELECT achievement_id FROM achievements WHERE child_id = ?')
    .all(childId) as Array<{ achievement_id: string }>;
  const existingSet = new Set(existingAchievements.map((a) => a.achievement_id));

  const toUnlock: string[] = [];

  if (allSessions.length >= 1 && !existingSet.has('first-game')) {
    toUnlock.push('first-game');
  }

  const memoryCount = allSessions.filter((s) => {
    const g = GAMES_CATALOG.find((item) => item.id === s.game_id);
    return g?.category === 'Memory';
  }).length;
  if (memoryCount >= 3 && !existingSet.has('memory-master')) {
    toUnlock.push('memory-master');
  }

  const highFocus = allSessions.some((s) => {
    const g = GAMES_CATALOG.find((item) => item.id === s.game_id);
    return g?.category === 'Attention' && s.accuracy >= 85;
  });
  if (highFocus && !existingSet.has('focus-champion')) {
    toUnlock.push('focus-champion');
  }

  const patternCount = allSessions.filter((s) => {
    const g = GAMES_CATALOG.find((item) => item.id === s.game_id);
    return g?.category === 'Pattern Recognition';
  }).length;
  if (patternCount >= 3 && !existingSet.has('pattern-explorer')) {
    toUnlock.push('pattern-explorer');
  }

  const streak = calculateDailyStreak(allSessions);
  if (streak >= 7 && !existingSet.has('seven-day-streak')) {
    toUnlock.push('seven-day-streak');
  }

  const hasMaze = allSessions.some((s) => s.game_id === 'maze-explorer');
  const hasGlider = allSessions.some((s) => s.game_id === 'sky-glider');
  if (hasMaze && hasGlider && !existingSet.has('steady-navigator')) {
    toUnlock.push('steady-navigator');
  }

  const newlyUnlockedAchievements: AchievementDefinition[] = [];

  for (const achId of toUnlock) {
    const def = ACHIEVEMENTS_CATALOG.find((a) => a.id === achId);
    if (!def) continue;

    db.prepare(
      `INSERT OR IGNORE INTO achievements (id, child_id, achievement_id, unlocked_at)
       VALUES (?, ?, ?, ?)`
    ).run(crypto.randomUUID(), childId, achId, now);

    const achClaimKey = `achievement:${childId}:${achId}`;
    const existingClaim = db
      .prepare('SELECT id FROM rewards WHERE claim_key = ?')
      .get(achClaimKey) as { id: string } | undefined;

    if (!existingClaim) {
      db.prepare(
        `INSERT INTO rewards (id, child_id, reward_type, claim_key, description, coins, xp, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        crypto.randomUUID(),
        childId,
        'achievement_bonus',
        achClaimKey,
        `Unlocked badge: ${def.title}`,
        def.coinsBonus,
        def.xpBonus,
        now
      );
    }

    newlyUnlockedAchievements.push(def);
  }

  return { sessionReward, newlyUnlockedAchievements };
}

export function claimReward(
  db: DatabaseSync,
  childId: string,
  rewardType: 'daily_mission' | 'weekly_streak_bonus',
  dateKey?: string
): { claimed: boolean; alreadyClaimed: boolean; reward?: RewardRecord; message: string } {
  const today = dateKey || new Date().toISOString().slice(0, 10);
  const claimKey =
    rewardType === 'daily_mission'
      ? `daily_mission:${childId}:${today}`
      : `weekly_streak:${childId}:${today.slice(0, 7)}`;

  const existing = db
    .prepare('SELECT * FROM rewards WHERE claim_key = ?')
    .get(claimKey) as unknown as RewardRecord | undefined;

  if (existing) {
    return {
      claimed: false,
      alreadyClaimed: true,
      message: 'This reward has already been claimed for this period.',
    };
  }

  if (rewardType === 'daily_mission') {
    const todaySessions = db
      .prepare(
        `SELECT COUNT(*) as cnt FROM game_sessions
         WHERE child_id = ? AND substr(completed_at, 1, 10) = ?`
      )
      .get(childId, today) as { cnt: number };

    if (todaySessions.cnt < 2) {
      return {
        claimed: false,
        alreadyClaimed: false,
        message: 'Complete at least 2 cognitive games today to claim your Daily Mission bonus.',
      };
    }
  }

  const coins = rewardType === 'daily_mission' ? 25 : 40;
  const xp = rewardType === 'daily_mission' ? 50 : 80;
  const description =
    rewardType === 'daily_mission'
      ? `Daily Mission Bonus (${today})`
      : 'Weekly Practice Streak Bonus';
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  db.prepare(
    `INSERT INTO rewards (id, child_id, reward_type, claim_key, description, coins, xp, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, childId, rewardType, claimKey, description, coins, xp, now);

  const reward: RewardRecord = {
    id,
    child_id: childId,
    reward_type: rewardType,
    claim_key: claimKey,
    description,
    coins,
    xp,
    created_at: now,
  };

  return {
    claimed: true,
    alreadyClaimed: false,
    reward,
    message: `Earned ${coins} bonus coins and ${xp} XP!`,
  };
}

export function getRewardsSummary(db: DatabaseSync, childId: string) {
  const history = db
    .prepare('SELECT * FROM rewards WHERE child_id = ? ORDER BY created_at DESC LIMIT 30')
    .all(childId) as unknown as RewardRecord[];

  const totals = db
    .prepare('SELECT COALESCE(SUM(coins), 0) as totalCoins, COALESCE(SUM(xp), 0) as totalXp FROM rewards WHERE child_id = ?')
    .get(childId) as { totalCoins: number; totalXp: number };

  const unlocked = db
    .prepare('SELECT * FROM achievements WHERE child_id = ? ORDER BY unlocked_at DESC')
    .all(childId) as unknown as UnlockedAchievement[];

  const sessions = db
    .prepare('SELECT completed_at, duration FROM game_sessions WHERE child_id = ? ORDER BY completed_at DESC')
    .all(childId) as Array<{ completed_at: string; duration: number }>;

  const today = new Date().toISOString().slice(0, 10);
  const todayClaim = db
    .prepare('SELECT id FROM rewards WHERE claim_key = ?')
    .get(`daily_mission:${childId}:${today}`) as { id: string } | undefined;

  const todaySessions = sessions.filter((s) => s.completed_at.slice(0, 10) === today);
  const todayMinutes = Math.round(todaySessions.reduce((sum, s) => sum + s.duration, 0) / 60);
  const todayCoinsRow = db
    .prepare(
      `SELECT COALESCE(SUM(coins), 0) as c FROM rewards
       WHERE child_id = ? AND substr(created_at, 1, 10) = ?`
    )
    .get(childId, today) as { c: number };

  const levelInfo = calculateLevel(totals.totalXp);
  const streak = calculateDailyStreak(sessions);

  return {
    total_coins: totals.totalCoins,
    total_xp: totals.totalXp,
    ...levelInfo,
    streak_days: streak,
    daily_mission: {
      games_completed_today: todaySessions.length,
      games_target: 2,
      coins_today: todayCoinsRow.c,
      coins_target: 50,
      minutes_today: todayMinutes,
      minutes_target: 10,
      bonus_claimed: Boolean(todayClaim),
      eligible_to_claim: todaySessions.length >= 2 && !todayClaim,
    },
    unlocked_achievements: unlocked,
    history,
  };
}
