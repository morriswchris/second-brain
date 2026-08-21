import { fireEvent, render, screen } from '@testing-library/react-native';

import { TaskRow } from '@/components/task-row';
import type { Task } from '@/store/types';

const baseTask: Task = {
  id: 't1',
  title: 'Water the plants',
  notes: '',
  done: false,
  important: false,
  createdAt: 0,
  completedAt: null,
};

async function renderRow(task: Task = baseTask) {
  const handlers = {
    onToggleDone: jest.fn(),
    onToggleImportant: jest.fn(),
    onPress: jest.fn(),
  };
  await render(<TaskRow task={task} {...handlers} />);
  return { handlers };
}

describe('TaskRow', () => {
  it('renders the task title', async () => {
    await renderRow();
    expect(screen.getByText('Water the plants')).toBeOnTheScreen();
  });

  it('toggles done when the checkbox is pressed', async () => {
    const { handlers } = await renderRow();
    fireEvent.press(screen.getByLabelText('Mark as done'));
    expect(handlers.onToggleDone).toHaveBeenCalledWith('t1');
  });

  it('toggles important when the star is pressed', async () => {
    const { handlers } = await renderRow();
    fireEvent.press(screen.getByLabelText('Mark important'));
    expect(handlers.onToggleImportant).toHaveBeenCalledWith('t1');
  });

  it('opens the row when the body is pressed', async () => {
    const { handlers } = await renderRow();
    fireEvent.press(screen.getByLabelText('Edit task: Water the plants'));
    expect(handlers.onPress).toHaveBeenCalledWith(baseTask);
  });

  it('reflects a done task with the checked label', async () => {
    await renderRow({ ...baseTask, done: true, completedAt: 1 });
    expect(screen.getByLabelText('Mark as not done')).toBeOnTheScreen();
  });
});
