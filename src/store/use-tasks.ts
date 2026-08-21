import { create } from 'zustand';

import * as repo from '@/db/tasks-repo';
import { buildTask, isValidTitle, newId, normalizeTitle } from '@/store/task-utils';
import type { Task } from '@/store/types';

type TasksState = {
  tasks: Task[];
  loaded: boolean;
  /** Hydrate from SQLite. Idempotent — safe to call from multiple screens. */
  load: () => Promise<void>;
  /** Add an active task from raw input. No-op if the title is empty. */
  addTask: (rawTitle: string) => void;
  toggleDone: (id: string) => void;
  toggleImportant: (id: string) => void;
  editTask: (id: string, patch: { title?: string; notes?: string }) => void;
  removeTask: (id: string) => void;
  clearCompleted: () => void;
};

export const useTasks = create<TasksState>((set, get) => ({
  tasks: [],
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    const tasks = await repo.fetchAllTasks();
    set({ tasks, loaded: true });
  },

  addTask: (rawTitle) => {
    if (!isValidTitle(rawTitle)) return;
    const task = buildTask(rawTitle, { id: newId(), now: Date.now() });
    set((state) => ({ tasks: [task, ...state.tasks] }));
    void repo.insertTask(task);
  },

  toggleDone: (id) => {
    let updated: Task | undefined;
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== id) return t;
        updated = {
          ...t,
          done: !t.done,
          completedAt: !t.done ? Date.now() : null,
        };
        return updated;
      }),
    }));
    if (updated) void repo.upsertTask(updated);
  },

  toggleImportant: (id) => {
    let updated: Task | undefined;
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== id) return t;
        updated = { ...t, important: !t.important };
        return updated;
      }),
    }));
    if (updated) void repo.upsertTask(updated);
  },

  editTask: (id, patch) => {
    let updated: Task | undefined;
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== id) return t;
        const nextTitle = patch.title !== undefined ? normalizeTitle(patch.title) : t.title;
        updated = {
          ...t,
          // Ignore an edit that would blank out the title.
          title: nextTitle.length > 0 ? nextTitle : t.title,
          notes: patch.notes !== undefined ? patch.notes : t.notes,
        };
        return updated;
      }),
    }));
    if (updated) void repo.upsertTask(updated);
  },

  removeTask: (id) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
    void repo.deleteTask(id);
  },

  clearCompleted: () => {
    set((state) => ({ tasks: state.tasks.filter((t) => !t.done) }));
    void repo.deleteCompleted();
  },
}));
