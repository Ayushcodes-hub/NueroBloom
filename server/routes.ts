import crypto from 'node:crypto';
import express, { type Router } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import {
  GAMES_CATALOG,
  ACHIEVEMENTS_CATALOG,
  DEFAULT_ACCESSIBILITY,
  type AccessibilityPreferences,
  type ChildProfile,
  type GameCategory,
  type GameSessionRecord,
  type UserRole,
} from '../shared/types.ts';
import {
  canAccessChild,
  hashPassword,
  requireAuth,
  requireRole,
  signJwt,
  verifyPassword,
  type AuthenticatedRequest,
} from './auth.ts';
import { buildAdaptiveRecommendations, evaluateAdaptiveDifficulty, getRecommendedDifficultyForGame } from './adaptive.ts';
import { awardSessionRewards, claimReward, getRewardsSummary } from './rewards.ts';

function toAccessibility(row: Record<string, unknown> | undefined): AccessibilityPreferences {
  if (!row) return { ...DEFAULT_ACCESSIBILITY };
  return {
    dyslexic_font: Boolean(row.dyslexic_font),
    high_contrast: Boolean(row.high_contrast),
    reduced_motion: Boolean(row.reduced_motion),
    text_size: (row.text_size as AccessibilityPreferences['text_size']) || 'normal',
    text_to_speech: Boolean(row.text_to_speech),
    sound_enabled: Boolean(row.sound_enabled),
    simplified_instructions: Boolean(row.simplified_instructions),
    interaction_timing: (row.interaction_timing as AccessibilityPreferences['interaction_timing']) || 'standard',
    keyboard_navigation: Boolean(row.keyboard_navigation),
    alternative_tap: Boolean(row.alternative_tap),
  };
}

function parseChildRow(row: Record<string, unknown>): ChildProfile {
  let prefs: string[] = [];
  try {
    prefs = JSON.parse((row.learning_preferences as string) || '[]') as string[];
  } catch {
    prefs = [];
  }
  return {
    id: String(row.id),
    user_id: row.user_id ? String(row.user_id) : null,
    guardian_id: String(row.guardian_id),
    doctor_id: row.doctor_id ? String(row.doctor_id) : null,
    display_name: String(row.display_name),
    age_group: String(row.age_group),
    avatar_url: String(row.avatar_url || ''),
    learning_preferences: prefs,
    created_at: String(row.created_at),
  };
}

export function createApiRouter(db: DatabaseSync): Router {
  const router = express.Router();

  // OpenAPI / Swagger spec
  router.get('/openapi.json', (_req, res) => {
    res.json({
      openapi: '3.0.3',
      info: {
        title: 'NeuroBloom Cognitive Play API',
        version: '1.0.0',
        description:
          'Educational and therapy-support API powering NeuroBloom adaptive cognitive games, reward tracking, accessibility persistence, and caregiver/educator observations.',
      },
      paths: {
        '/api/auth/register': { post: { summary: 'Register user account' } },
        '/api/auth/login': { post: { summary: 'Authenticate and receive JWT' } },
        '/api/auth/me': { get: { summary: 'Get authenticated user & linked profiles' } },
        '/api/children': { get: { summary: 'List accessible child profiles' }, post: { summary: 'Create child profile' } },
        '/api/children/{id}': { get: { summary: 'Get child profile details' } },
        '/api/games': { get: { summary: 'List all 11 cognitive games' } },
        '/api/games/{id}': { get: { summary: 'Get game definition' } },
        '/api/games/sessions': { post: { summary: 'Save completed game session, compute adaptive difficulty & rewards' } },
        '/api/games/sessions/{childId}': { get: { summary: 'Get child game session history' } },
        '/api/analytics/{childId}': { get: { summary: 'Get longitudinal analytics for child' } },
        '/api/analytics/{childId}/weekly': { get: { summary: 'Get 7-day activity & accuracy trends' } },
        '/api/rewards/{childId}': { get: { summary: 'Get coins, XP, level, streak & achievements' } },
        '/api/rewards/claim': { post: { summary: 'Claim daily mission or streak bonus (duplicate protected)' } },
        '/api/recommendations/{childId}': { get: { summary: 'Get rule-based adaptive game recommendations' } },
        '/api/accessibility/{childId}': { get: { summary: 'Get accessibility preferences' }, put: { summary: 'Update accessibility preferences' } },
        '/api/notes': { post: { summary: 'Add caregiver or educator observation note' } },
        '/api/notes/{childId}': { get: { summary: 'List notes for child' } },
        '/api/doctor/children': { get: { summary: 'List children assigned to current doctor/educator' } },
        '/api/doctor/recommendations': { post: { summary: 'Create educator game & difficulty recommendation' } },
      },
    });
  });

  router.get('/docs', (_req, res) => {
    res.type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>NeuroBloom API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({ url: '/api/openapi.json', dom_id: '#swagger-ui' });
    };
  </script>
</body>
</html>`);
  });

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', database: 'sqlite', timestamp: new Date().toISOString() });
  });

  // 1. AUTHENTICATION
  router.post('/auth/register', (req, res) => {
    const { name, email, password, role, displayName, ageGroup } = req.body || {};
    if (!name || !email || !password || !role) {
      res.status(400).json({ error: 'Name, email, password, and role are required' });
      return;
    }
    const allowedRoles: UserRole[] = ['child', 'parent', 'doctor'];
    if (!allowedRoles.includes(role)) {
      res.status(400).json({ error: 'Role must be child, parent, or doctor' });
      return;
    }
    if (String(password).length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO users (id, name, email, role, password_hash, avatar_url, created_at)
       VALUES (?, ?, ?, ?, ?, '', ?)`
    ).run(userId, String(name).trim(), normalizedEmail, role, hashPassword(String(password)), now);

    // If registering as child or parent, auto-provision an initial child profile so experience works immediately
    if (role === 'child' || role === 'parent') {
      const childId = crypto.randomUUID();
      const guardianId = role === 'parent' ? userId : 'usr-parent-meera';
      const childDisplay = displayName ? String(displayName).trim() : role === 'child' ? String(name).trim() : `${String(name).trim().split(' ')[0]}'s Child`;
      db.prepare(
        `INSERT INTO child_profiles (id, user_id, guardian_id, doctor_id, display_name, age_group, avatar_url, learning_preferences, created_at)
         VALUES (?, ?, ?, ?, ?, ?, '', ?, ?)`
      ).run(
        childId,
        role === 'child' ? userId : null,
        guardianId,
        'usr-doctor-ananya',
        childDisplay,
        ageGroup || '7-9 years',
        JSON.stringify(['Memory', 'Pattern Recognition']),
        now
      );

      db.prepare(
        `INSERT INTO accessibility_settings (id, child_id, updated_at) VALUES (?, ?, ?)`
      ).run(crypto.randomUUID(), childId, now);
    }

    const token = signJwt({ id: userId, email: normalizedEmail, name: String(name).trim(), role });
    res.status(201).json({
      token,
      user: { id: userId, name: String(name).trim(), email: normalizedEmail, role, avatar_url: '', created_at: now },
    });
  });

  router.post('/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const userRow = db
      .prepare('SELECT id, name, email, role, password_hash, avatar_url, created_at FROM users WHERE email = ?')
      .get(normalizedEmail) as
      | { id: string; name: string; email: string; role: UserRole; password_hash: string; avatar_url: string; created_at: string }
      | undefined;

    if (!userRow || !verifyPassword(String(password), userRow.password_hash)) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = signJwt({ id: userRow.id, email: userRow.email, name: userRow.name, role: userRow.role });
    res.json({
      token,
      user: {
        id: userRow.id,
        name: userRow.name,
        email: userRow.email,
        role: userRow.role,
        avatar_url: userRow.avatar_url,
        created_at: userRow.created_at,
      },
    });
  });

  router.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const userRow = db
      .prepare('SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = ?')
      .get(user.sub) as Record<string, unknown> | undefined;
    if (!userRow) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let childrenRows: Record<string, unknown>[] = [];
    if (user.role === 'admin') {
      childrenRows = db.prepare('SELECT * FROM child_profiles ORDER BY created_at ASC').all() as Record<string, unknown>[];
    } else if (user.role === 'child') {
      childrenRows = db.prepare('SELECT * FROM child_profiles WHERE user_id = ?').all(user.sub) as Record<string, unknown>[];
    } else if (user.role === 'parent') {
      childrenRows = db.prepare('SELECT * FROM child_profiles WHERE guardian_id = ? ORDER BY created_at ASC').all(user.sub) as Record<string, unknown>[];
    } else if (user.role === 'doctor') {
      childrenRows = db.prepare('SELECT * FROM child_profiles WHERE doctor_id = ? ORDER BY created_at ASC').all(user.sub) as Record<string, unknown>[];
    }

    res.json({
      user: userRow,
      children: childrenRows.map(parseChildRow),
    });
  });

  // 2. CHILDREN
  router.get('/children', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    let rows: Record<string, unknown>[] = [];
    if (user.role === 'admin') {
      rows = db.prepare('SELECT * FROM child_profiles ORDER BY created_at ASC').all() as Record<string, unknown>[];
    } else if (user.role === 'child') {
      rows = db.prepare('SELECT * FROM child_profiles WHERE user_id = ?').all(user.sub) as Record<string, unknown>[];
    } else if (user.role === 'parent') {
      rows = db.prepare('SELECT * FROM child_profiles WHERE guardian_id = ? ORDER BY created_at ASC').all(user.sub) as Record<string, unknown>[];
    } else if (user.role === 'doctor') {
      rows = db.prepare('SELECT * FROM child_profiles WHERE doctor_id = ? ORDER BY created_at ASC').all(user.sub) as Record<string, unknown>[];
    }
    res.json({ children: rows.map(parseChildRow) });
  });

  router.get('/children/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const childId = String(req.params.id);
    if (!canAccessChild(db, req.user!, childId)) {
      res.status(403).json({ error: 'Access denied for this child profile' });
      return;
    }
    const row = db.prepare('SELECT * FROM child_profiles WHERE id = ?').get(childId) as Record<string, unknown> | undefined;
    if (!row) {
      res.status(404).json({ error: 'Child profile not found' });
      return;
    }
    const a11y = db.prepare('SELECT * FROM accessibility_settings WHERE child_id = ?').get(childId) as Record<string, unknown> | undefined;
    res.json({ child: parseChildRow(row), accessibility: toAccessibility(a11y) });
  });

  router.post('/children', requireAuth, requireRole('parent', 'admin'), (req: AuthenticatedRequest, res) => {
    const { display_name, age_group, learning_preferences } = req.body || {};
    if (!display_name || String(display_name).trim().length < 2) {
      res.status(400).json({ error: 'Display name is required (at least 2 characters)' });
      return;
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const prefs = Array.isArray(learning_preferences) ? learning_preferences : ['Memory', 'Pattern Recognition'];
    db.prepare(
      `INSERT INTO child_profiles (id, user_id, guardian_id, doctor_id, display_name, age_group, avatar_url, learning_preferences, created_at)
       VALUES (?, NULL, ?, ?, ?, ?, '', ?, ?)`
    ).run(id, req.user!.sub, 'usr-doctor-ananya', String(display_name).trim(), age_group || '7-9 years', JSON.stringify(prefs), now);

    db.prepare('INSERT INTO accessibility_settings (id, child_id, updated_at) VALUES (?, ?, ?)').run(
      crypto.randomUUID(),
      id,
      now
    );

    const created = db.prepare('SELECT * FROM child_profiles WHERE id = ?').get(id) as Record<string, unknown>;
    res.status(201).json({ child: parseChildRow(created) });
  });

  router.patch('/children/:id/preferences', requireAuth, (req: AuthenticatedRequest, res) => {
    const childId = String(req.params.id);
    if (!canAccessChild(db, req.user!, childId)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    const { learning_preferences } = req.body || {};
    if (!Array.isArray(learning_preferences)) {
      res.status(400).json({ error: 'learning_preferences must be an array' });
      return;
    }
    db.prepare('UPDATE child_profiles SET learning_preferences = ? WHERE id = ?').run(
      JSON.stringify(learning_preferences),
      childId
    );
    const updated = db.prepare('SELECT * FROM child_profiles WHERE id = ?').get(childId) as Record<string, unknown>;
    res.json({ child: parseChildRow(updated) });
  });

  // 3. GAMES & SESSIONS
  router.get('/games', (req, res) => {
    const childId = typeof req.query.childId === 'string' ? req.query.childId : null;
    const gamesWithDifficulty = GAMES_CATALOG.map((game) => ({
      ...game,
      recommended_difficulty: childId ? getRecommendedDifficultyForGame(db, childId, game.id) : 1,
    }));
    res.json({ games: gamesWithDifficulty, achievements: ACHIEVEMENTS_CATALOG });
  });

  router.get('/games/sessions/:childId', requireAuth, (req: AuthenticatedRequest, res) => {
    const childId = String(req.params.childId);
    if (!canAccessChild(db, req.user!, childId)) {
      res.status(403).json({ error: 'Access denied for this child profile' });
      return;
    }
    const sessions = db
      .prepare('SELECT * FROM game_sessions WHERE child_id = ? ORDER BY completed_at DESC LIMIT 50')
      .all(childId) as unknown as GameSessionRecord[];
    res.json({ sessions });
  });

  router.get('/games/:id', (req, res) => {
    const game = GAMES_CATALOG.find((g) => g.id === req.params.id);
    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }
    res.json({ game });
  });

  router.post('/games/sessions', requireAuth, (req: AuthenticatedRequest, res) => {
    const {
      child_id,
      game_id,
      score,
      accuracy,
      attempts,
      duration,
      difficulty,
      hints_used = 0,
      repeated_errors = 0,
      completed = true,
    } = req.body || {};

    if (!child_id || !game_id) {
      res.status(400).json({ error: 'child_id and game_id are required' });
      return;
    }

    if (!canAccessChild(db, req.user!, String(child_id))) {
      res.status(403).json({ error: 'Access denied for this child profile' });
      return;
    }

    const game = GAMES_CATALOG.find((g) => g.id === game_id);
    if (!game) {
      res.status(400).json({ error: 'Unknown game_id' });
      return;
    }

    const safeDifficulty = Math.min(5, Math.max(1, Number(difficulty) || 1));
    const safeAccuracy = Math.min(100, Math.max(0, Number(accuracy) || 0));
    const safeScore = Math.max(0, Number(score) || 0);
    const safeAttempts = Math.max(1, Number(attempts) || 1);
    const safeDuration = Math.max(1, Number(duration) || 10);
    const safeHints = Math.max(0, Number(hints_used) || 0);
    const safeErrors = Math.max(0, Number(repeated_errors) || 0);
    const now = new Date().toISOString();
    const sessionId = crypto.randomUUID();

    db.prepare(
      `INSERT INTO game_sessions (
        id, child_id, game_id, score, accuracy, attempts, duration, difficulty, hints_used, repeated_errors, completed, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      sessionId,
      String(child_id),
      String(game_id),
      safeScore,
      safeAccuracy,
      safeAttempts,
      safeDuration,
      safeDifficulty,
      safeHints,
      safeErrors,
      completed ? 1 : 0,
      now
    );

    const savedSession: GameSessionRecord = {
      id: sessionId,
      child_id: String(child_id),
      game_id: String(game_id),
      score: safeScore,
      accuracy: safeAccuracy,
      attempts: safeAttempts,
      duration: safeDuration,
      difficulty: safeDifficulty,
      hints_used: safeHints,
      repeated_errors: safeErrors,
      completed: Boolean(completed),
      completed_at: now,
    };

    // Evaluate adaptive difficulty using comparable recent sessions for this game
    const comparable = db
      .prepare(
        `SELECT accuracy, difficulty, hints_used, repeated_errors
         FROM game_sessions
         WHERE child_id = ? AND game_id = ?
         ORDER BY completed_at DESC
         LIMIT 5`
      )
      .all(String(child_id), String(game_id)) as Array<{
      accuracy: number;
      difficulty: number;
      hints_used: number;
      repeated_errors: number;
    }>;

    const recentCategoriesRaw = db
      .prepare(
        `SELECT game_id FROM game_sessions
         WHERE child_id = ?
         ORDER BY completed_at DESC
         LIMIT 5`
      )
      .all(String(child_id)) as Array<{ game_id: string }>;

    const recentCategories = recentCategoriesRaw
      .map((r) => GAMES_CATALOG.find((g) => g.id === r.game_id)?.category)
      .filter(Boolean) as GameCategory[];

    const adaptiveAdjustment = evaluateAdaptiveDifficulty(
      comparable,
      safeDifficulty,
      game.category,
      recentCategories
    );

    const rewardResult = awardSessionRewards(db, String(child_id), savedSession);
    const rewardsSummary = getRewardsSummary(db, String(child_id));

    res.status(201).json({
      session: savedSession,
      adaptive_adjustment: adaptiveAdjustment,
      reward_earned: rewardResult.sessionReward,
      newly_unlocked_achievements: rewardResult.newlyUnlockedAchievements,
      rewards_summary: rewardsSummary,
    });
  });

  // 4. ANALYTICS
  router.get('/analytics/:childId', requireAuth, (req: AuthenticatedRequest, res) => {
    const childId = String(req.params.childId);
    if (!canAccessChild(db, req.user!, childId)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const sessions = db
      .prepare('SELECT * FROM game_sessions WHERE child_id = ? ORDER BY completed_at DESC')
      .all(childId) as unknown as GameSessionRecord[];

    const totalSessions = sessions.length;
    const totalDurationSeconds = sessions.reduce((sum, s) => sum + s.duration, 0);
    const avgAccuracy =
      totalSessions > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions) : 0;

    // Category aggregation
    const categories: GameCategory[] = [
      'Memory',
      'Attention',
      'Pattern Recognition',
      'Motor Coordination',
      'Language',
      'Problem Solving',
    ];

    const categoryTrends = categories.map((cat) => {
      const catGameIds = new Set(GAMES_CATALOG.filter((g) => g.category === cat).map((g) => g.id));
      const catSessions = sessions.filter((s) => catGameIds.has(s.game_id));
      const avg =
        catSessions.length > 0
          ? Math.round(catSessions.reduce((sum, s) => sum + s.accuracy, 0) / catSessions.length)
          : 0;
      const avgDiff =
        catSessions.length > 0
          ? Number((catSessions.reduce((sum, s) => sum + s.difficulty, 0) / catSessions.length).toFixed(1))
          : 1;
      return {
        category: cat,
        sessions: catSessions.length,
        avgAccuracy: avg,
        avgDifficulty: avgDiff,
        totalMinutes: Math.round(catSessions.reduce((sum, s) => sum + s.duration, 0) / 60),
      };
    });

    // Game-wise accuracy
    const gameWise = GAMES_CATALOG.map((game) => {
      const gSessions = sessions.filter((s) => s.game_id === game.id);
      const avg =
        gSessions.length > 0 ? Math.round(gSessions.reduce((sum, s) => sum + s.accuracy, 0) / gSessions.length) : 0;
      return {
        game_id: game.id,
        title: game.title,
        category: game.category,
        sessions: gSessions.length,
        avgAccuracy: avg,
        latestDifficulty: gSessions[0]?.difficulty ?? 1,
      };
    }).filter((g) => g.sessions > 0);

    const rewardsSummary = getRewardsSummary(db, childId);

    // Insights based on real gameplay
    const sortedCats = [...categoryTrends].filter((c) => c.sessions > 0).sort((a, b) => b.avgAccuracy - a.avgAccuracy);
    const strongestCat = sortedCats[0];
    const practiceArea = [...categoryTrends].sort((a, b) => a.sessions - b.sessions || a.avgAccuracy - b.avgAccuracy)[0];

    res.json({
      disclaimer: 'Gameplay observations reflect practice engagement and game interactions only, not clinical or diagnostic assessments.',
      overview: {
        total_sessions: totalSessions,
        total_practice_minutes: Math.round(totalDurationSeconds / 60),
        average_accuracy: avgAccuracy,
        current_streak: rewardsSummary.streak_days,
        total_coins: rewardsSummary.total_coins,
        level: rewardsSummary.level,
      },
      category_trends: categoryTrends,
      game_wise: gameWise,
      recent_sessions: sessions.slice(0, 15).map((s) => ({
        ...s,
        game_title: GAMES_CATALOG.find((g) => g.id === s.game_id)?.title || s.game_id,
        category: GAMES_CATALOG.find((g) => g.id === s.game_id)?.category || 'Memory',
      })),
      insights: {
        enjoyed_area: strongestCat
          ? `${strongestCat.category} (${strongestCat.avgAccuracy}% avg gameplay accuracy across ${strongestCat.sessions} sessions)`
          : 'Exploring initial activities',
        additional_practice_area: practiceArea
          ? `${practiceArea.category} (${practiceArea.sessions} sessions logged so far)`
          : 'All categories balanced',
      },
    });
  });

  router.get('/analytics/:childId/weekly', requireAuth, (req: AuthenticatedRequest, res) => {
    const childId = String(req.params.childId);
    if (!canAccessChild(db, req.user!, childId)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const sessions = db
      .prepare('SELECT * FROM game_sessions WHERE child_id = ? ORDER BY completed_at ASC')
      .all(childId) as unknown as GameSessionRecord[];

    const days: Array<{ date: string; label: string; sessions: number; minutes: number; avgAccuracy: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const isoDate = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
      const daySessions = sessions.filter((s) => s.completed_at.slice(0, 10) === isoDate);
      const avgAcc =
        daySessions.length > 0
          ? Math.round(daySessions.reduce((sum, s) => sum + s.accuracy, 0) / daySessions.length)
          : 0;
      days.push({
        date: isoDate,
        label: dayLabel,
        sessions: daySessions.length,
        minutes: Math.round(daySessions.reduce((sum, s) => sum + s.duration, 0) / 60),
        avgAccuracy: avgAcc,
      });
    }

    res.json({ weekly: days });
  });

  // 5. REWARDS
  router.get('/rewards/:childId', requireAuth, (req: AuthenticatedRequest, res) => {
    const childId = String(req.params.childId);
    if (!canAccessChild(db, req.user!, childId)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    res.json(getRewardsSummary(db, childId));
  });

  router.post('/rewards/claim', requireAuth, (req: AuthenticatedRequest, res) => {
    const { child_id, reward_type } = req.body || {};
    if (!child_id || !reward_type) {
      res.status(400).json({ error: 'child_id and reward_type are required' });
      return;
    }
    if (!canAccessChild(db, req.user!, String(child_id))) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    if (reward_type !== 'daily_mission' && reward_type !== 'weekly_streak_bonus') {
      res.status(400).json({ error: 'Unsupported reward_type' });
      return;
    }

    const result = claimReward(db, String(child_id), reward_type);
    if (result.alreadyClaimed) {
      res.status(409).json({ error: result.message, already_claimed: true });
      return;
    }
    if (!result.claimed) {
      res.status(400).json({ error: result.message });
      return;
    }
    res.status(201).json({
      ...result,
      rewards_summary: getRewardsSummary(db, String(child_id)),
    });
  });

  // 6. RECOMMENDATIONS
  router.get('/recommendations/:childId', requireAuth, (req: AuthenticatedRequest, res) => {
    const childId = String(req.params.childId);
    if (!canAccessChild(db, req.user!, childId)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    res.json(buildAdaptiveRecommendations(db, childId));
  });

  // 7. ACCESSIBILITY
  router.get('/accessibility/:childId', requireAuth, (req: AuthenticatedRequest, res) => {
    const childId = String(req.params.childId);
    if (!canAccessChild(db, req.user!, childId)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    const row = db
      .prepare('SELECT * FROM accessibility_settings WHERE child_id = ?')
      .get(childId) as Record<string, unknown> | undefined;
    res.json({ settings: toAccessibility(row) });
  });

  router.put('/accessibility/:childId', requireAuth, (req: AuthenticatedRequest, res) => {
    const childId = String(req.params.childId);
    if (!canAccessChild(db, req.user!, childId)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const body = req.body || {};
    const currentRow = db
      .prepare('SELECT * FROM accessibility_settings WHERE child_id = ?')
      .get(childId) as Record<string, unknown> | undefined;
    const merged: AccessibilityPreferences = {
      ...toAccessibility(currentRow),
      ...body,
    };

    const now = new Date().toISOString();
    if (currentRow) {
      db.prepare(
        `UPDATE accessibility_settings SET
          dyslexic_font = ?, high_contrast = ?, reduced_motion = ?, text_size = ?,
          text_to_speech = ?, sound_enabled = ?, simplified_instructions = ?,
          interaction_timing = ?, keyboard_navigation = ?, alternative_tap = ?, updated_at = ?
         WHERE child_id = ?`
      ).run(
        merged.dyslexic_font ? 1 : 0,
        merged.high_contrast ? 1 : 0,
        merged.reduced_motion ? 1 : 0,
        merged.text_size,
        merged.text_to_speech ? 1 : 0,
        merged.sound_enabled ? 1 : 0,
        merged.simplified_instructions ? 1 : 0,
        merged.interaction_timing,
        merged.keyboard_navigation ? 1 : 0,
        merged.alternative_tap ? 1 : 0,
        now,
        childId
      );
    } else {
      db.prepare(
        `INSERT INTO accessibility_settings (
          id, child_id, dyslexic_font, high_contrast, reduced_motion, text_size,
          text_to_speech, sound_enabled, simplified_instructions, interaction_timing,
          keyboard_navigation, alternative_tap, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        crypto.randomUUID(),
        childId,
        merged.dyslexic_font ? 1 : 0,
        merged.high_contrast ? 1 : 0,
        merged.reduced_motion ? 1 : 0,
        merged.text_size,
        merged.text_to_speech ? 1 : 0,
        merged.sound_enabled ? 1 : 0,
        merged.simplified_instructions ? 1 : 0,
        merged.interaction_timing,
        merged.keyboard_navigation ? 1 : 0,
        merged.alternative_tap ? 1 : 0,
        now
      );
    }

    res.json({ settings: merged, updated_at: now });
  });

  // 8. CAREGIVER NOTES & REMINDERS
  router.get('/notes/:childId', requireAuth, (req: AuthenticatedRequest, res) => {
    const childId = String(req.params.childId);
    if (!canAccessChild(db, req.user!, childId)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    const notes = db
      .prepare('SELECT * FROM caregiver_notes WHERE child_id = ? ORDER BY created_at DESC LIMIT 30')
      .all(childId);
    res.json({ notes });
  });

  router.post('/notes', requireAuth, requireRole('parent', 'doctor', 'admin'), (req: AuthenticatedRequest, res) => {
    const { child_id, note } = req.body || {};
    if (!child_id || !note || String(note).trim().length < 2) {
      res.status(400).json({ error: 'child_id and note text are required' });
      return;
    }
    if (!canAccessChild(db, req.user!, String(child_id))) {
      res.status(403).json({ error: 'Access denied for this child profile' });
      return;
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO caregiver_notes (id, child_id, author_id, author_name, author_role, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, String(child_id), req.user!.sub, req.user!.name, req.user!.role, String(note).trim(), now);

    const created = db.prepare('SELECT * FROM caregiver_notes WHERE id = ?').get(id);
    res.status(201).json({ note: created });
  });

  router.get('/reminders/:childId', requireAuth, (req: AuthenticatedRequest, res) => {
    const childId = String(req.params.childId);
    if (!canAccessChild(db, req.user!, childId)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    const reminders = db
      .prepare('SELECT * FROM practice_reminders WHERE child_id = ? ORDER BY created_at DESC')
      .all(childId);
    res.json({ reminders });
  });

  router.post('/reminders', requireAuth, requireRole('parent', 'admin'), (req: AuthenticatedRequest, res) => {
    const { child_id, title, scheduled_time, days_of_week, email_recipient } = req.body || {};
    if (!child_id || !title || !scheduled_time) {
      res.status(400).json({ error: 'child_id, title, and scheduled_time are required' });
      return;
    }
    if (!canAccessChild(db, req.user!, String(child_id))) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const status = process.env.EMAIL_NOTIFICATIONS_MODE === 'smtp' && process.env.SMTP_HOST ? 'smtp_queued' : 'scheduled_local';
    db.prepare(
      `INSERT INTO practice_reminders (id, child_id, guardian_id, title, scheduled_time, days_of_week, email_recipient, notification_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      String(child_id),
      req.user!.sub,
      String(title).trim(),
      String(scheduled_time),
      String(days_of_week || 'Mon,Wed,Fri'),
      String(email_recipient || req.user!.email),
      status,
      now
    );
    const created = db.prepare('SELECT * FROM practice_reminders WHERE id = ?').get(id);
    res.status(201).json({ reminder: created });
  });

  // 9. DOCTOR / SPECIAL EDUCATOR ENDPOINTS
  router.get('/doctor/children', requireAuth, requireRole('doctor', 'admin'), (req: AuthenticatedRequest, res) => {
    const rows =
      req.user!.role === 'admin'
        ? (db.prepare('SELECT * FROM child_profiles ORDER BY created_at ASC').all() as Record<string, unknown>[])
        : (db
            .prepare('SELECT * FROM child_profiles WHERE doctor_id = ? ORDER BY created_at ASC')
            .all(req.user!.sub) as Record<string, unknown>[]);

    const enriched = rows.map((row) => {
      const child = parseChildRow(row);
      const stats = db
        .prepare(
          `SELECT COUNT(*) as sessions, COALESCE(ROUND(AVG(accuracy), 0), 0) as avgAccuracy, MAX(completed_at) as lastSession
           FROM game_sessions WHERE child_id = ?`
        )
        .get(child.id) as { sessions: number; avgAccuracy: number; lastSession: string | null };
      return {
        ...child,
        session_count: stats.sessions,
        avg_accuracy: stats.avgAccuracy,
        last_session_at: stats.lastSession,
      };
    });

    res.json({ children: enriched });
  });

  router.post(
    '/doctor/recommendations',
    requireAuth,
    requireRole('doctor', 'admin'),
    (req: AuthenticatedRequest, res) => {
      const { child_id, game_id, reason, difficulty } = req.body || {};
      if (!child_id || !game_id || !reason) {
        res.status(400).json({ error: 'child_id, game_id, and reason are required' });
        return;
      }
      if (!canAccessChild(db, req.user!, String(child_id))) {
        res.status(403).json({ error: 'Doctor can only add recommendations for assigned children' });
        return;
      }
      const game = GAMES_CATALOG.find((g) => g.id === game_id);
      if (!game) {
        res.status(400).json({ error: 'Invalid game_id' });
        return;
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const safeDiff = Math.min(5, Math.max(1, Number(difficulty) || 1));

      db.prepare(
        `INSERT INTO recommendations (id, child_id, game_id, reason, difficulty, source, author_name, created_at)
         VALUES (?, ?, ?, ?, ?, 'educator', ?, ?)`
      ).run(id, String(child_id), String(game_id), String(reason).trim(), safeDiff, req.user!.name, now);

      const created = db.prepare('SELECT * FROM recommendations WHERE id = ?').get(id);
      res.status(201).json({ recommendation: created });
    }
  );

  router.get(
    '/doctor/report/:childId',
    requireAuth,
    requireRole('doctor', 'parent', 'admin'),
    (req: AuthenticatedRequest, res) => {
      const childId = String(req.params.childId);
      if (!canAccessChild(db, req.user!, childId)) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
      const childRow = db.prepare('SELECT * FROM child_profiles WHERE id = ?').get(childId) as Record<string, unknown>;
      const child = parseChildRow(childRow);
      const sessions = db
        .prepare('SELECT * FROM game_sessions WHERE child_id = ? ORDER BY completed_at DESC LIMIT 30')
        .all(childId) as unknown as GameSessionRecord[];
      const notes = db
        .prepare('SELECT * FROM caregiver_notes WHERE child_id = ? ORDER BY created_at DESC LIMIT 15')
        .all(childId);
      const recommendations = db
        .prepare('SELECT * FROM recommendations WHERE child_id = ? ORDER BY created_at DESC LIMIT 10')
        .all(childId);

      res.json({
        generated_at: new Date().toISOString(),
        disclaimer:
          'This NeuroBloom Gameplay Observation Report summarizes educational practice activity only. It is not a medical diagnosis or clinical evaluation.',
        child,
        summary: {
          total_sessions: sessions.length,
          total_minutes: Math.round(sessions.reduce((s, r) => s + r.duration, 0) / 60),
          average_accuracy:
            sessions.length > 0
              ? Math.round(sessions.reduce((s, r) => s + r.accuracy, 0) / sessions.length)
              : 0,
        },
        sessions: sessions.map((s) => ({
          ...s,
          game_title: GAMES_CATALOG.find((g) => g.id === s.game_id)?.title || s.game_id,
          category: GAMES_CATALOG.find((g) => g.id === s.game_id)?.category || 'Memory',
        })),
        notes,
        recommendations,
      });
    }
  );

  // 10. ADMIN OVERVIEW
  router.get('/admin/overview', requireAuth, requireRole('admin'), (_req, res) => {
    const users = db
      .prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at ASC')
      .all();
    const children = (db.prepare('SELECT * FROM child_profiles ORDER BY created_at ASC').all() as Record<string, unknown>[]).map(
      parseChildRow
    );
    const counts = db
      .prepare(
        `SELECT
          (SELECT COUNT(*) FROM users) as userCount,
          (SELECT COUNT(*) FROM child_profiles) as childCount,
          (SELECT COUNT(*) FROM game_sessions) as sessionCount,
          (SELECT COUNT(*) FROM caregiver_notes) as noteCount`
      )
      .get();

    res.json({ users, children, counts });
  });

  return router;
}
