import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { createNote, sortNotesByNewest } from '@/notes/note-utils';
import * as repo from '@/notes/notes-repo';
import type { Note } from '@/notes/types';

type NotesContextValue = {
  /** Captured notes, newest first. */
  notes: Note[];
  /** False until the first load from storage settles. */
  ready: boolean;
  /**
   * Capture a thought. Trims/validates; a blank string is ignored and returns
   * `null`. Updates the UI optimistically, then writes through to storage.
   */
  addNote: (text: string) => Note | null;
  /** Delete a captured thought by id. */
  removeNote: (id: string) => void;
};

const NotesContext = createContext<NotesContextValue | null>(null);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [ready, setReady] = useState(false);

  // Guard against a late initial load clobbering notes captured while it was
  // still in flight (fast typers on a cold start).
  const mutatedBeforeLoad = useRef(false);

  useEffect(() => {
    let active = true;
    repo.loadNotes().then((loaded) => {
      if (!active || mutatedBeforeLoad.current) {
        setReady(true);
        return;
      }
      setNotes(sortNotesByNewest(loaded));
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const addNote = useCallback((text: string): Note | null => {
    const note = createNote(text);
    if (!note) return null;
    mutatedBeforeLoad.current = true;
    setNotes((prev) => [note, ...prev]);
    repo.insertNote(note);
    return note;
  }, []);

  const removeNote = useCallback((id: string) => {
    mutatedBeforeLoad.current = true;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    repo.deleteNote(id);
  }, []);

  const value = useMemo<NotesContextValue>(
    () => ({ notes, ready, addNote, removeNote }),
    [notes, ready, addNote, removeNote],
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes(): NotesContextValue {
  const ctx = useContext(NotesContext);
  if (!ctx) {
    throw new Error('useNotes must be used within a <NotesProvider>');
  }
  return ctx;
}
