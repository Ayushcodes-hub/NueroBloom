import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

let dbInstance: DatabaseSync | null = null;

export function getDbPath(): string {
  return process.env.DB_PATH || path.resolve(process.cwd(), 'neurobloom.db');
}

function tryOpenDatabase(targetPath: string): DatabaseSync {
  if (targetPath !== ':memory:') {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  const db = new DatabaseSync(targetPath);
  try {
    db.exec('PRAGMA journal_mode = DELETE;');
  } catch {
    // Ignore journal mode errors on constrained filesystems
  }
  db.exec('PRAGMA foreign_keys = ON;');
  initSchema(db);
  return db;
}

export function getDb(customPath?: string): DatabaseSync {
  if (dbInstance && !customPath) {
    return dbInstance;
  }

  const candidates = customPath
    ? [customPath]
    : [getDbPath(), path.join(os.tmpdir(), 'neurobloom.db'), ':memory:'];

  let db: DatabaseSync | null = null;
  let lastError: unknown = null;

  for (const candidate of candidates) {
    try {
      db = tryOpenDatabase(candidate);
      if (candidate !== candidates[0]) {
        console.warn(`NeuroBloom SQLite opened fallback database at ${candidate}`);
      }
      break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!db) {
    throw lastError instanceof Error ? lastError : new Error('Unable to initialize SQLite database');
  }

  if (!customPath) {
    dbInstance = db;
  }
  return db;
}

export function resetDbInstanceForTesting(db: DatabaseSync): void {
  dbInstance = db;
  initSchema(db);
}

export function initSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK(role IN ('child', 'parent', 'doctor', 'admin')),
      password_hash TEXT NOT NULL,
      avatar_url TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS child_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      guardian_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      doctor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      display_name TEXT NOT NULL,
      age_group TEXT NOT NULL DEFAULT '7-9 years',
      avatar_url TEXT NOT NULL DEFAULT '',
      learning_preferences TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
      game_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      accuracy REAL NOT NULL,
      attempts INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      difficulty INTEGER NOT NULL CHECK(difficulty BETWEEN 1 AND 5),
      hints_used INTEGER NOT NULL DEFAULT 0,
      repeated_errors INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 1,
      completed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
      reward_type TEXT NOT NULL,
      claim_key TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      coins INTEGER NOT NULL DEFAULT 0,
      xp INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
      achievement_id TEXT NOT NULL,
      unlocked_at TEXT NOT NULL,
      UNIQUE(child_id, achievement_id)
    );

    CREATE TABLE IF NOT EXISTS caregiver_notes (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL,
      author_role TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
      game_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      difficulty INTEGER NOT NULL DEFAULT 1,
      source TEXT NOT NULL DEFAULT 'educator',
      author_name TEXT NOT NULL DEFAULT 'Adaptive Engine',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS accessibility_settings (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL UNIQUE REFERENCES child_profiles(id) ON DELETE CASCADE,
      dyslexic_font INTEGER NOT NULL DEFAULT 0,
      high_contrast INTEGER NOT NULL DEFAULT 0,
      reduced_motion INTEGER NOT NULL DEFAULT 0,
      text_size TEXT NOT NULL DEFAULT 'normal',
      text_to_speech INTEGER NOT NULL DEFAULT 0,
      sound_enabled INTEGER NOT NULL DEFAULT 1,
      simplified_instructions INTEGER NOT NULL DEFAULT 0,
      interaction_timing TEXT NOT NULL DEFAULT 'standard',
      keyboard_navigation INTEGER NOT NULL DEFAULT 1,
      alternative_tap INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS practice_reminders (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
      guardian_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      days_of_week TEXT NOT NULL,
      email_recipient TEXT NOT NULL,
      notification_status TEXT NOT NULL DEFAULT 'scheduled_local',
      created_at TEXT NOT NULL
    );
  `);
}
