import * as SQLite from 'expo-sqlite';

import { rowToNote, type Note, type NoteRow } from '@/notes/types';

/**
 * Offline-first persistence for captured notes, backed by SQLite (bundled with
 * Expo Go — no development build required).
 *
 * Every operation is **best-effort**: if SQLite is unavailable on the current
 * platform (e.g. web without the WASM setup, or in the Jest environment) the
 * app must still work for the session. So failures are swallowed with a warning
 * and the app degrades to in-memory-only for that run rather than crashing.
 * Capture should never fail because storage is unhappy.
 */

const DB_NAME = 'second-brain.db';

const SCHEMA = `
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY NOT NULL,
    text TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(SCHEMA);
      return db;
    })();
    // Don't cache a rejected promise — allow a later retry.
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
}

/** All notes, newest first. Returns `[]` if persistence is unavailable. */
export async function loadNotes(): Promise<Note[]> {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<NoteRow>(
      'SELECT id, text, created_at FROM notes ORDER BY created_at DESC;',
    );
    return rows.map(rowToNote);
  } catch (error) {
    console.warn('[notes-repo] loadNotes failed; running without persistence', error);
    return [];
  }
}

/** Persist a captured note. Silently no-ops if persistence is unavailable. */
export async function insertNote(note: Note): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync('INSERT OR REPLACE INTO notes (id, text, created_at) VALUES (?, ?, ?);', [
      note.id,
      note.text,
      note.createdAt,
    ]);
  } catch (error) {
    console.warn('[notes-repo] insertNote failed; note kept in memory only', error);
  }
}

/** Remove a note by id. Silently no-ops if persistence is unavailable. */
export async function deleteNote(id: string): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM notes WHERE id = ?;', [id]);
  } catch (error) {
    console.warn('[notes-repo] deleteNote failed', error);
  }
}
