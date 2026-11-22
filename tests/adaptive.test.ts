import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { initSchema } from '../server/db.ts';
import { seedDatabaseIfEmpty } from '../server/seed.ts';
import { evaluateAdaptiveDifficulty } from '../server/adaptive.ts';
import { awardSessionRewards, claimReward } from '../server/rewards.ts';
import { canAccessChild, verifyJwt, signJwt } from '../server/auth.ts';
import type { GameSessionRecord } from '../shared/types.ts';

describe('NeuroBloom Core Backend Engines', () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    initSchema(db);
    seedDatabaseIfEmpty(db);
  });

  it('increases difficulty when accuracy >= 85% across 3 comparable sessions', () => {
    const sessions = [
      { accuracy: 92, difficulty: 1, hints_used: 0, repeated_errors: 0 },
      { accuracy: 88, difficulty: 1, hints_used: 0, repeated_errors: 1 },
      { accuracy: 86, difficulty: 1, hints_used: 0, repeated_errors: 1 },
    ];
    const result = evaluateAdaptiveDifficulty(sessions, 1, 'Memory', ['Memory', 'Pattern Recognition']);
    assert.equal(result.action, 'increased');
    assert.equal(result.nextDifficulty, 2);
  });

  it('maintains difficulty when accuracy is between 60% and 84%', () => {
    const sessions = [
      { accuracy: 74, difficulty: 2, hints_used: 0, repeated_errors: 1 },
      { accuracy: 78, difficulty: 2, hints_used: 0, repeated_errors: 1 },
      { accuracy: 90, difficulty: 2, hints_used: 0, repeated_errors: 0 },
    ];
    const result = evaluateAdaptiveDifficulty(sessions, 2, 'Attention', ['Attention']);
    assert.equal(result.action, 'maintained');
    assert.equal(result.nextDifficulty, 2);
  });

  it('reduces difficulty when accuracy < 60% across 2 comparable sessions and offers support', () => {
    const sessions = [
      { accuracy: 45, difficulty: 3, hints_used: 2, repeated_errors: 3 },
      { accuracy: 52, difficulty: 3, hints_used: 1, repeated_errors: 2 },
    ];
    const result = evaluateAdaptiveDifficulty(sessions, 3, 'Problem Solving', ['Problem Solving']);
    assert.equal(result.action, 'reduced');
    assert.equal(result.nextDifficulty, 2);
    assert.equal(result.offerSimplerInstructions, true);
    assert.equal(result.offerAudioGuidance, true);
  });

  it('suggests a different category when the same category is repeated consecutively', () => {
    const result = evaluateAdaptiveDifficulty(
      [{ accuracy: 80, difficulty: 1, hints_used: 0, repeated_errors: 0 }],
      1,
      'Memory',
      ['Memory', 'Memory', 'Pattern Recognition']
    );
    assert.ok(result.suggestedNextCategory !== null);
    assert.notEqual(result.suggestedNextCategory, 'Memory');
  });

  it('prevents duplicate daily mission reward claims', () => {
    const today = new Date().toISOString().slice(0, 10);
    // Seed already has 1 session today for Aarav; add a 2nd session today
    db.prepare(
      `INSERT INTO game_sessions (id, child_id, game_id, score, accuracy, attempts, duration, difficulty, hints_used, repeated_errors, completed, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
    ).run('test-sess-today', 'child-aarav', 'shape-identification', 90, 90, 5, 120, 1, 0, 0, `${today}T12:00:00.000Z`);

    const firstClaim = claimReward(db, 'child-aarav', 'daily_mission', today);
    assert.equal(firstClaim.claimed, true);
    assert.equal(firstClaim.alreadyClaimed, false);

    const secondClaim = claimReward(db, 'child-aarav', 'daily_mission', today);
    assert.equal(secondClaim.claimed, false);
    assert.equal(secondClaim.alreadyClaimed, true);
  });

  it('awards session rewards and unlocks steady-navigator after maze & sky-glider', () => {
    const now = new Date().toISOString();
    const session: GameSessionRecord = {
      id: 'test-maze-1',
      child_id: 'child-aarav',
      game_id: 'maze-explorer',
      score: 92,
      accuracy: 92,
      attempts: 1,
      duration: 130,
      difficulty: 1,
      hints_used: 0,
      repeated_errors: 0,
      completed: true,
      completed_at: now,
    };
    db.prepare(
      `INSERT INTO game_sessions (id, child_id, game_id, score, accuracy, attempts, duration, difficulty, hints_used, repeated_errors, completed, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
    ).run(session.id, session.child_id, session.game_id, session.score, session.accuracy, session.attempts, session.duration, session.difficulty, 0, 0, now);

    const rewardResult = awardSessionRewards(db, 'child-aarav', session);
    assert.equal(rewardResult.sessionReward.coins, 15);
    assert.ok(rewardResult.newlyUnlockedAchievements.some((a) => a.id === 'steady-navigator'));
  });

  it('enforces doctor role-based access restrictions to assigned children only', () => {
    const token = signJwt({
      id: 'usr-doctor-ananya',
      email: 'doctor@neurobloom.demo',
      name: 'Dr. Ananya Rao',
      role: 'doctor',
    });
    const payload = verifyJwt(token);
    assert.ok(payload !== null);

    // Assigned child
    assert.equal(canAccessChild(db, payload!, 'child-aarav'), true);
    // Unassigned child (doctor_id is NULL)
    assert.equal(canAccessChild(db, payload!, 'child-rohan'), false);
  });
});
