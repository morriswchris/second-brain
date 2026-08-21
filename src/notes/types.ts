/**
 * A single captured thought — the atomic unit of the Second Brain.
 *
 * v1 keeps this deliberately minimal: just the text and when it was captured.
 * Later features (LLM categorization for search, reminders/recurrence) will
 * add optional enrichment fields, but capture must never depend on them.
 */
export type Note = {
  id: string;
  text: string;
  /** Epoch milliseconds. */
  createdAt: number;
};

/** Shape of a row as stored in / read back from SQLite. */
export type NoteRow = {
  id: string;
  text: string;
  created_at: number;
};

export function rowToNote(row: NoteRow): Note {
  return { id: row.id, text: row.text, createdAt: row.created_at };
}
