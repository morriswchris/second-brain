import { fireEvent, render, screen } from '@testing-library/react-native';

import { NoteCard } from '@/components/note-card';
import type { Note } from '@/notes/types';

const note: Note = { id: 'n1', text: 'Call the dentist', createdAt: 1_000_000_000_000 };

describe('NoteCard', () => {
  it('renders the note text and a relative timestamp', async () => {
    await render(<NoteCard note={note} onDelete={() => {}} now={note.createdAt + 5 * 60_000} />);

    expect(screen.getByText('Call the dentist')).toBeOnTheScreen();
    expect(screen.getByText('5m')).toBeOnTheScreen();
  });

  it('calls onDelete with the note id when the delete control is pressed', async () => {
    const onDelete = jest.fn();
    await render(<NoteCard note={note} onDelete={onDelete} />);

    fireEvent.press(screen.getByLabelText('Delete thought'));

    expect(onDelete).toHaveBeenCalledWith('n1');
  });
});
