import { describe, expect, it } from 'vitest';
import { annotateWorkload, buildHierarchy, computeSchedule, endOffsetFor } from './scheduler';
import { defaultTasks } from '@/data/defaultProject';
import { task } from '@/test/helpers';

// Day offsets count from the scheduling epoch, 2026-03-01 (a Sunday).
const byId = (list: ReturnType<typeof computeSchedule>) => new Map(list.map(t => [t.id, t]));

describe('computeSchedule: forward pass', () => {
  it('places a fixed-start task at its date and ends it after its duration', () => {
    const [a] = computeSchedule([task('a', { start: '2026-03-03', duration: 4 })]);
    expect(a.startDayOffset).toBe(2);
    expect(a.endDayOffset).toBe(6);
  });

  it('starts a dependent task when its predecessor ends', () => {
    const s = byId(computeSchedule([
      task('a', { start: '2026-03-01', duration: 3 }),
      task('b', { after: 'a', duration: 2 }),
    ]));
    expect(s.get('b')!.startDayOffset).toBe(3);
    expect(s.get('b')!.endDayOffset).toBe(5);
  });

  it('waits for the latest of several predecessors', () => {
    const s = byId(computeSchedule([
      task('a', { start: '2026-03-01', duration: 3 }),
      task('b', { start: '2026-03-01', duration: 7 }),
      task('c', { after: 'a,b', duration: 1 }),
    ]));
    expect(s.get('c')!.startDayOffset).toBe(7);
  });

  // The task editor and older imports can leave "a," or " a , b" behind; the forward pass used
  // to treat the blank entry as a missing task and left the bar unscheduled.
  it('accepts blanks and spaces in the predecessor list', () => {
    const s = byId(computeSchedule([
      task('a', { start: '2026-03-01', duration: 3 }),
      task('c', { after: ' a , ', duration: 1 }),
    ]));
    expect(s.get('c')!.startDayOffset).toBe(3);
  });

  it('resolves dependencies regardless of list order', () => {
    const s = byId(computeSchedule([
      task('c', { after: 'b', duration: 1 }),
      task('b', { after: 'a', duration: 1 }),
      task('a', { start: '2026-03-01', duration: 1 }),
    ]));
    expect(s.get('c')!.startDayOffset).toBe(2);
  });

  // The old forward pass gave up after 100 sweeps over the list; a chain stored in reverse order
  // only advances one task per sweep, so everything past the 100th task vanished from the chart.
  it('schedules long chains stored in reverse order', () => {
    const chain = Array.from({ length: 300 }, (_, i) =>
      task(`t${i}`, i === 0 ? { start: '2026-03-01', duration: 1 } : { after: `t${i - 1}`, duration: 1 }));
    const out = computeSchedule([...chain].reverse());
    expect(out.every(t => Number.isFinite(t.startDayOffset))).toBe(true);
    expect(out.find(t => t.id === 't299')!.startDayOffset).toBe(299);
    expect(out.find(t => t.id === 't0')!.isOnCriticalPath).toBe(true);
    expect(out.find(t => t.id === 't0')!.totalFloat).toBe(0);
  });

  it('keeps a pinned start even when the task also lists predecessors', () => {
    const s = byId(computeSchedule([
      task('a', { start: '2026-03-01', duration: 10 }),
      task('b', { start: '2026-03-03', after: 'a', duration: 1 }),
    ]));
    expect(s.get('b')!.startDayOffset).toBe(2);
  });

  it('leaves tasks with a missing predecessor unscheduled (NaN) instead of throwing', () => {
    const s = byId(computeSchedule([task('b', { after: 'ghost', duration: 2 })]));
    expect(Number.isNaN(s.get('b')!.startDayOffset)).toBe(true);
  });

  it('leaves tasks in a dependency cycle unscheduled', () => {
    const s = byId(computeSchedule([
      task('a', { after: 'b' }),
      task('b', { after: 'a' }),
    ]));
    expect(Number.isNaN(s.get('a')!.startDayOffset)).toBe(true);
    expect(Number.isNaN(s.get('b')!.startDayOffset)).toBe(true);
  });

  it('returns tasks in the input order', () => {
    const out = computeSchedule(defaultTasks);
    expect(out.map(t => t.id)).toEqual(defaultTasks.map(t => t.id));
  });
});

describe('computeSchedule: critical path', () => {
  it('marks the longest chain as critical and gives side branches float', () => {
    const s = byId(computeSchedule([
      task('a', { start: '2026-03-01', duration: 5 }),
      task('long', { after: 'a', duration: 10 }),
      task('short', { after: 'a', duration: 2 }),
      task('end', { after: 'long,short', duration: 1 }),
    ]));
    expect(s.get('a')!.isOnCriticalPath).toBe(true);
    expect(s.get('long')!.isOnCriticalPath).toBe(true);
    expect(s.get('end')!.isOnCriticalPath).toBe(true);
    expect(s.get('short')!.isOnCriticalPath).toBe(false);
    expect(s.get('short')!.totalFloat).toBe(8);
    expect(s.get('long')!.totalFloat).toBe(0);
  });

  it('computes late start/finish against the project end', () => {
    const s = byId(computeSchedule([
      task('a', { start: '2026-03-01', duration: 2 }),
      task('b', { start: '2026-03-01', duration: 6 }),
    ]));
    expect(s.get('a')!.lateEndDayOffset).toBe(6);
    expect(s.get('a')!.lateStartDayOffset).toBe(4);
    expect(s.get('a')!.totalFloat).toBe(4);
  });

  it('finds a single critical chain through the sample project', () => {
    const critical = computeSchedule(defaultTasks).filter(t => t.isOnCriticalPath).map(t => t.id);
    // p5c is the last task to finish; walking back through the predecessor that drives each start
    // gives this chain. p4a waits for both p3b (ends day 36) and p3c (ends day 45), so the
    // design branch through p3c drives it and the backend branch p1c → p3a → p3b has float.
    expect(critical).toEqual(['p1a', 'p1b', 'p2a', 'p2b', 'p2c', 'p3c', 'p4a', 'p4b', 'p4c', 'p5a', 'p5b', 'p5c']);
  });
});

describe('endOffsetFor', () => {
  it('adds calendar days, or working days stretched over weekends', () => {
    // Offset 5 is Friday 2026-03-06.
    expect(endOffsetFor(5, 3)).toBe(8);
    expect(endOffsetFor(5, 3, true)).toBe(10);
  });
});

describe('annotateWorkload', () => {
  it('flags overlapping tasks of the same assignee only', () => {
    const out = annotateWorkload(computeSchedule([
      task('a', { start: '2026-03-02', duration: 3, assignee: 'Amy' }),
      task('b', { start: '2026-03-04', duration: 3, assignee: 'Amy' }),
      task('c', { start: '2026-03-04', duration: 3, assignee: 'Bob' }),
      task('d', { start: '2026-03-05', duration: 1, assignee: 'Amy ' }),
    ]));
    const flagged = out.filter(t => t.isOverallocated).map(t => t.id);
    expect(flagged.sort()).toEqual(['a', 'b', 'd']);
  });

  it('treats back-to-back tasks as not overlapping', () => {
    const out = annotateWorkload(computeSchedule([
      task('a', { start: '2026-03-02', duration: 2, assignee: 'Amy' }),
      task('b', { start: '2026-03-04', duration: 2, assignee: 'Amy' }),
    ]));
    expect(out.some(t => t.isOverallocated)).toBe(false);
  });
});

describe('buildHierarchy', () => {
  it('groups "Phase N Sub" names into master phase and sub-phase', () => {
    const h = buildHierarchy(computeSchedule([
      task('a', { phase: 'Phase 1 Planning & Research', start: '2026-03-01' }),
      task('b', { phase: 'Phase 2 Build', start: '2026-03-01' }),
      task('c', { phase: 'Marketing', start: '2026-03-01' }),
    ]));
    expect(Object.keys(h)).toEqual(['Phase 1', 'Phase 2', 'Other']);
    expect(h['Phase 1']['Planning & Research'].map(t => t.id)).toEqual(['a']);
    expect(h.Other.Marketing.map(t => t.id)).toEqual(['c']);
  });
});
