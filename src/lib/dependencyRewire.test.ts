import { describe, expect, it } from 'vitest';
import { rewireDependencies } from './dependencyRewire';
import { task } from '@/test/helpers';

describe('rewireDependencies', () => {
  it('reconnects successors to the deleted task\'s predecessors', () => {
    const out = rewireDependencies([
      task('a', { start: '2026-03-01' }),
      task('b', { after: 'a' }),
      task('c', { after: 'b' }),
    ], 'b');
    expect(out.map(t => t.id)).toEqual(['a', 'c']);
    expect(out.find(t => t.id === 'c')!.after).toBe('a');
  });

  it('hands the deleted task\'s fixed start date to a successor that loses all predecessors', () => {
    const out = rewireDependencies([
      task('a', { start: '2026-03-05' }),
      task('b', { after: 'a' }),
    ], 'a');
    const b = out.find(t => t.id === 'b')!;
    expect(b.after).toBeUndefined();
    expect(b.start).toBe('2026-03-05');
  });

  it('walks through several deleted tasks at once and removes duplicates', () => {
    const out = rewireDependencies([
      task('a', { start: '2026-03-01' }),
      task('b', { after: 'a' }),
      task('c', { after: 'b' }),
      task('d', { after: 'b,c,a' }),
    ], ['b', 'c']);
    expect(out.find(t => t.id === 'd')!.after).toBe('a');
  });

  it('does not mutate the input', () => {
    const input = [task('a', { start: '2026-03-01' }), task('b', { after: 'a' })];
    rewireDependencies(input, 'a');
    expect(input[1].after).toBe('a');
  });
});
