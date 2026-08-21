/** A single task in the second-brain tracker. Times are epoch milliseconds. */
export type Task = {
  id: string;
  title: string;
  notes: string;
  done: boolean;
  important: boolean;
  createdAt: number;
  /** When the task was marked done, or null while it is still active. */
  completedAt: number | null;
};

/** Shape of a row as stored in SQLite (booleans as 0/1). */
export type TaskRow = {
  id: string;
  title: string;
  notes: string;
  done: number;
  important: number;
  created_at: number;
  completed_at: number | null;
};

export function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    done: row.done === 1,
    important: row.important === 1,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}
