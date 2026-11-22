import crypto from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { hashPassword } from './auth.ts';

function daysAgoIso(daysAgo: number, hourOffset = 10): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hourOffset, 15, 0, 0);
  return d.toISOString();
}

export function seedDatabaseIfEmpty(db: DatabaseSync): void {
  const existingUsers = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  if (existingUsers.cnt > 0) {
    return;
  }

  const now = new Date().toISOString();

  // Demo users
  const childUserId = 'usr-child-aarav';
  const parentUserId = 'usr-parent-meera';
  const doctorUserId = 'usr-doctor-ananya';
  const adminUserId = 'usr-admin-rnsit';
  const otherParentId = 'usr-parent-vikram';

  const insertUser = db.prepare(
    `INSERT INTO users (id, name, email, role, password_hash, avatar_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  insertUser.run(
    childUserId,
    'Aarav Sharma',
    'aarav@neurobloom.demo',
    'child',
    hashPassword('BloomChild123!'),
    '/src/assets/images/avatar_child_aarav_1795193965975.jpg',
    now
  );
  insertUser.run(
    parentUserId,
    'Meera Sharma',
    'meera@neurobloom.demo',
    'parent',
    hashPassword('BloomParent123!'),
    '/src/assets/images/avatar_parent_meera_1795193964870.jpg',
    now
  );
  insertUser.run(
    doctorUserId,
    'Dr. Ananya Rao',
    'doctor@neurobloom.demo',
    'doctor',
    hashPassword('BloomDoctor123!'),
    '/src/assets/images/avatar_doctor_karthik_1795193966468.jpg',
    now
  );
  insertUser.run(
    adminUserId,
    'RNSIT Program Admin',
    'admin@neurobloom.demo',
    'admin',
    hashPassword('BloomAdmin123!'),
    '',
    now
  );
  insertUser.run(
    otherParentId,
    'Vikram Kulkarni',
    'vikram@neurobloom.demo',
    'parent',
    hashPassword('BloomParent123!'),
    '',
    now
  );

  // Child profiles
  const aaravId = 'child-aarav';
  const diyaId = 'child-diya';
  const rohanId = 'child-rohan';

  const insertChild = db.prepare(
    `INSERT INTO child_profiles (id, user_id, guardian_id, doctor_id, display_name, age_group, avatar_url, learning_preferences, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  insertChild.run(
    aaravId,
    childUserId,
    parentUserId,
    doctorUserId,
    'Aarav Sharma',
    '7-9 years',
    '/src/assets/images/avatar_child_aarav_1795193965975.jpg',
    JSON.stringify(['Pattern Recognition', 'Memory', 'Motor Coordination']),
    daysAgoIso(14)
  );

  insertChild.run(
    diyaId,
    null,
    parentUserId,
    doctorUserId,
    'Diya Sharma',
    '5-6 years',
    '',
    JSON.stringify(['Language', 'Attention']),
    daysAgoIso(10)
  );

  // Unassigned child (doctor_id = NULL) to verify doctor access restrictions
  insertChild.run(
    rohanId,
    null,
    otherParentId,
    null,
    'Rohan Kulkarni',
    '10-12 years',
    '',
    JSON.stringify(['Problem Solving']),
    daysAgoIso(8)
  );

  // Accessibility settings for all children
  const insertA11y = db.prepare(
    `INSERT INTO accessibility_settings (
      id, child_id, dyslexic_font, high_contrast, reduced_motion, text_size,
      text_to_speech, sound_enabled, simplified_instructions, interaction_timing,
      keyboard_navigation, alternative_tap, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  insertA11y.run('a11y-aarav', aaravId, 0, 0, 0, 'normal', 0, 1, 0, 'standard', 1, 0, now);
  insertA11y.run('a11y-diya', diyaId, 1, 0, 0, 'large', 1, 1, 1, 'relaxed', 1, 1, now);
  insertA11y.run('a11y-rohan', rohanId, 0, 0, 0, 'normal', 0, 1, 0, 'standard', 1, 0, now);

  // Historical multi-day sessions for Aarav (6-day active streak + rich analytics)
  const aaravSessions = [
    { game_id: 'memory-match', score: 88, accuracy: 86, attempts: 14, duration: 190, difficulty: 1, hints: 0, errors: 1, daysAgo: 6 },
    { game_id: 'pattern-sequence', score: 92, accuracy: 90, attempts: 10, duration: 165, difficulty: 1, hints: 0, errors: 1, daysAgo: 5 },
    { game_id: 'color-sorting', score: 84, accuracy: 82, attempts: 11, duration: 150, difficulty: 1, hints: 1, errors: 2, daysAgo: 4 },
    { game_id: 'memory-match', score: 90, accuracy: 88, attempts: 13, duration: 175, difficulty: 1, hints: 0, errors: 1, daysAgo: 3 },
    { game_id: 'pattern-sequence', score: 95, accuracy: 92, attempts: 12, duration: 180, difficulty: 1, hints: 0, errors: 0, daysAgo: 3 },
    { game_id: 'visual-attention', score: 89, accuracy: 89, attempts: 9, duration: 140, difficulty: 1, hints: 0, errors: 1, daysAgo: 2 },
    { game_id: 'word-image-matching', score: 80, accuracy: 78, attempts: 10, duration: 210, difficulty: 1, hints: 1, errors: 2, daysAgo: 2 },
    { game_id: 'memory-match', score: 94, accuracy: 91, attempts: 11, duration: 160, difficulty: 1, hints: 0, errors: 1, daysAgo: 1 },
    { game_id: 'pattern-sequence', score: 91, accuracy: 88, attempts: 11, duration: 170, difficulty: 1, hints: 0, errors: 1, daysAgo: 1 },
    { game_id: 'sky-glider', score: 78, accuracy: 76, attempts: 14, duration: 145, difficulty: 1, hints: 0, errors: 2, daysAgo: 0 },
  ];

  const insertSession = db.prepare(
    `INSERT INTO game_sessions (
      id, child_id, game_id, score, accuracy, attempts, duration, difficulty, hints_used, repeated_errors, completed, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
  );

  const insertReward = db.prepare(
    `INSERT INTO rewards (id, child_id, reward_type, claim_key, description, coins, xp, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  aaravSessions.forEach((s, idx) => {
    const sid = `seed-sess-aarav-${idx + 1}`;
    const ts = daysAgoIso(s.daysAgo, 9 + (idx % 5));
    insertSession.run(sid, aaravId, s.game_id, s.score, s.accuracy, s.attempts, s.duration, s.difficulty, s.hints, s.errors, ts);
    insertReward.run(
      `seed-rew-aarav-${idx + 1}`,
      aaravId,
      'game_completion',
      `session:${sid}`,
      `Completed ${s.game_id} practice`,
      s.accuracy >= 80 ? 15 : 10,
      25 + Math.round(s.accuracy * 0.2),
      ts
    );
  });

  // Historical sessions for Diya & Rohan
  insertSession.run('seed-sess-diya-1', diyaId, 'emotion-matching', 85, 85, 8, 160, 1, 1, 1, daysAgoIso(2));
  insertSession.run('seed-sess-diya-2', diyaId, 'shape-identification', 90, 90, 6, 130, 1, 0, 0, daysAgoIso(1));
  insertSession.run('seed-sess-rohan-1', rohanId, 'number-sequence', 88, 88, 9, 175, 2, 0, 1, daysAgoIso(1));

  // Initial achievements for Aarav
  const insertAch = db.prepare(
    `INSERT INTO achievements (id, child_id, achievement_id, unlocked_at) VALUES (?, ?, ?, ?)`
  );
  insertAch.run('seed-ach-1', aaravId, 'first-game', daysAgoIso(6));
  insertAch.run('seed-ach-2', aaravId, 'memory-master', daysAgoIso(1));
  insertAch.run('seed-ach-3', aaravId, 'focus-champion', daysAgoIso(2));
  insertAch.run('seed-ach-4', aaravId, 'pattern-explorer', daysAgoIso(1));

  insertReward.run('seed-rew-ach-1', aaravId, 'achievement_bonus', `achievement:${aaravId}:first-game`, 'Unlocked badge: First Sprout', 15, 30, daysAgoIso(6));
  insertReward.run('seed-rew-ach-2', aaravId, 'achievement_bonus', `achievement:${aaravId}:memory-master`, 'Unlocked badge: Memory Master', 25, 50, daysAgoIso(1));
  insertReward.run('seed-rew-ach-3', aaravId, 'achievement_bonus', `achievement:${aaravId}:focus-champion`, 'Unlocked badge: Focus Champion', 25, 50, daysAgoIso(2));
  insertReward.run('seed-rew-ach-4', aaravId, 'achievement_bonus', `achievement:${aaravId}:pattern-explorer`, 'Unlocked badge: Pattern Explorer', 25, 50, daysAgoIso(1));

  // Caregiver notes & Educator recommendations
  const insertNote = db.prepare(
    `INSERT INTO caregiver_notes (id, child_id, author_id, author_name, author_role, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  insertNote.run(
    'seed-note-1',
    aaravId,
    parentUserId,
    'Meera Sharma',
    'parent',
    'Aarav really enjoyed Pattern Sequence after school today and stayed calm using the gentle chime mode.',
    daysAgoIso(2)
  );
  insertNote.run(
    'seed-note-2',
    aaravId,
    doctorUserId,
    'Dr. Ananya Rao',
    'doctor',
    'Steady pattern and visual recall engagement observed. Encourage alternating with Maze Explorer or Sky Glider for motor variety without rushing.',
    daysAgoIso(1)
  );

  const insertRec = db.prepare(
    `INSERT INTO recommendations (id, child_id, game_id, reason, difficulty, source, author_name, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insertRec.run(
    'seed-rec-1',
    aaravId,
    'maze-explorer',
    'Gentle spatial planning practice to pair with Aarav’s strong pattern recognition.',
    2,
    'educator',
    'Dr. Ananya Rao',
    daysAgoIso(1)
  );

  // Sample practice reminder
  db.prepare(
    `INSERT INTO practice_reminders (id, child_id, guardian_id, title, scheduled_time, days_of_week, email_recipient, notification_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    crypto.randomUUID(),
    aaravId,
    parentUserId,
    'Afternoon Playful Focus Session (10 min)',
    '16:30',
    'Mon,Wed,Fri,Sat',
    'meera@neurobloom.demo',
    'scheduled_local',
    daysAgoIso(3)
  );
}
