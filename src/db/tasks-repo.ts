import * as SQLite from 'expo-sqlite';

import { rowToTask, type Task, type TaskRow } from '@/store/types';

/**
 * Persistence for tasks, backed by SQLite (bundled with Expo Go — no dev build
 * needed). Every operation is best-effort: if SQLite is unavailable on the
 * current platform (e.g. web without the WASM setup, or in tests), the app
 * still works for the session — it just won't persist across restarts.
 */

const DB_NAME = 'second-brain.db';

const CREATE_TABLE = `
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    done INTEGER NOT NULL DEFAULT 0,
    important INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    completed_at INTEGER
  );
`;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(CREATE_TABLE);
      return db;
    })();
  }
  return dbPromise;
}

export async function fetchAllTasks(): Promise<Task[]> {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<TaskRow>('SELECT * FROM tasks;');
    return rows.map(rowToTask);
  } catch (error) {
    console.warn('[tasks-repo] fetchAllTasks failed; running without persistence', error);
    return [];
  }
}

export async function insertTask(task: Task): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO tasks
        (id, title, notes, done, important, created_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?);`,
      task.id,
      task.title,
      task.notes,
      task.done ? 1 : 0,
      task.important ? 1 : 0,
      task.createdAt,
      task.completedAt,
    );
  } catch (error) {
    console.warn('[tasks-repo] insertTask failed', error);
  }
}

/** Insert and update share the same upsert, keeping the store logic simple. */
export const upsertTask = insertTask;

export async function deleteTask(id: string): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM tasks WHERE id = ?;', id);
  } catch (error) {
    console.warn('[tasks-repo] deleteTask failed', error);
  }
}

export async function deleteCompleted(): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM tasks WHERE done = 1;');
  } catch (error) {
    console.warn('[tasks-repo] deleteCompleted failed', error);
  }
}
