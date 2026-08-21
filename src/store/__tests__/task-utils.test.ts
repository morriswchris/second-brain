import {
  buildTask,
  isValidTitle,
  normalizeTitle,
  partitionTasks,
  sortActive,
  sortCompleted,
} from '@/store/task-utils';
import type { Task } from '@/store/types';

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: 'id',
    title: 'Task',
    notes: '',
    done: false,
    important: false,
    createdAt: 0,
    completedAt: null,
    ...overrides,
  };
}

describe('normalizeTitle', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeTitle('  buy   milk  ')).toBe('buy milk');
    expect(normalizeTitle('a\n\tb')).toBe('a b');
  });
});

describe('isValidTitle', () => {
  it('rejects empty or whitespace-only titles', () => {
    expect(isValidTitle('')).toBe(false);
    expect(isValidTitle('   ')).toBe(false);
  });

  it('accepts titles with content', () => {
    expect(isValidTitle('  hi ')).toBe(true);
  });
});

describe('buildTask', () => {
  it('creates an active task with a normalized title', () => {
    const task = buildTask('  water   plants ', { id: 'abc', now: 123 });
    expect(task).toEqual({
      id: 'abc',
      title: 'water plants',
      notes: '',
      done: false,
      important: false,
      createdAt: 123,
      completedAt: null,
    });
  });
});

describe('sortActive', () => {
  it('keeps only active tasks, important first, then newest', () => {
    const tasks = [
      makeTask({ id: 'old', createdAt: 1 }),
      makeTask({ id: 'new', createdAt: 3 }),
      makeTask({ id: 'starred', createdAt: 2, important: true }),
      makeTask({ id: 'done', createdAt: 5, done: true, completedAt: 6 }),
    ];
    expect(sortActive(tasks).map((t) => t.id)).toEqual(['starred', 'new', 'old']);
  });
});

describe('sortCompleted', () => {
  it('keeps only done tasks, most recently completed first', () => {
    const tasks = [
      makeTask({ id: 'active' }),
      makeTask({ id: 'a', done: true, completedAt: 10 }),
      makeTask({ id: 'b', done: true, completedAt: 30 }),
      makeTask({ id: 'c', done: true, completedAt: 20 }),
    ];
    expect(sortCompleted(tasks).map((t) => t.id)).toEqual(['b', 'c', 'a']);
  });
});

describe('partitionTasks', () => {
  it('splits tasks into active and completed groups', () => {
    const tasks = [makeTask({ id: 'x' }), makeTask({ id: 'y', done: true, completedAt: 1 })];
    const { active, completed } = partitionTasks(tasks);
    expect(active.map((t) => t.id)).toEqual(['x']);
    expect(completed.map((t) => t.id)).toEqual(['y']);
  });
});
