import { describe, expect, it } from 'vitest';
import { wouldCreateCycle } from './cycleCheck';
import { task } from '@/test/helpers';

describe('wouldCreateCycle', () => {
  const chain = [
    task('a', { start: '2026-03-01' }),
    task('b', { after: 'a' }),
    task('c', { after: 'b' }),
    task('x', { start: '2026-03-01' }),
  ];

  it('rejects a task depending on itself', () => {
    expect(wouldCreateCycle(chain, 'a', 'a')).toBe(true);
  });

  it('rejects closing a direct loop', () => {
    expect(wouldCreateCycle(chain, 'b', 'a')).toBe(true);
  });

  it('rejects closing a loop through several tasks', () => {
    expect(wouldCreateCycle(chain, 'c', 'a')).toBe(true);
  });

  it('allows a new edge that keeps the graph acyclic', () => {
    expect(wouldCreateCycle(chain, 'a', 'c')).toBe(false);
    expect(wouldCreateCycle(chain, 'x', 'b')).toBe(false);
  });

  it('sees through multi-predecessor lists', () => {
    const tasks = [
      task('a', { start: '2026-03-01' }),
      task('b', { start: '2026-03-01' }),
      task('c', { after: 'a,b' }),
    ];
    expect(wouldCreateCycle(tasks, 'c', 'b')).toBe(true);
  });
});
