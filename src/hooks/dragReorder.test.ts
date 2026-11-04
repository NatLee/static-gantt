import { describe, expect, it } from 'vitest';
import { buildRowMap, findTaskDropRow, resolveTaskDropTarget, taskDropGap } from './useDragReorder';
import { buildHierarchy, computeSchedule } from '@/lib/scheduler';
import { task } from '@/test/helpers';
import { ROW_HEIGHT } from '@/lib/ganttLayout';

const hierarchyOf = (tasks: Parameters<typeof computeSchedule>[0]) => buildHierarchy(computeSchedule(tasks));

describe('resolveTaskDropTarget', () => {
  const tasks = [
    task('a', { phase: 'Phase 1 Plan', start: '2026-03-01' }),
    task('b', { phase: 'Phase 1 Plan', start: '2026-03-01' }),
    task('m1', { phase: 'Marketing', start: '2026-03-01' }),
    task('m2', { phase: 'Marketing', start: '2026-03-01' }),
  ];
  const rows = buildRowMap(hierarchyOf(tasks), 'ALL', new Set(), new Set());

  it('targets the sub-phase under the drop row', () => {
    const drop = rows.findIndex(r => r.taskId === 'b');
    expect(resolveTaskDropTarget({ type: 'task', masterPhase: 'Phase 1', subPhase: 'Plan', taskId: 'a' }, drop, rows))
      .toEqual({ targetPhase: 'Phase 1 Plan', insertBeforeTaskId: 'b' });
  });

  it('keeps the section name when dropping into a phase without a "Phase N" prefix', () => {
    const drop = rows.findIndex(r => r.taskId === 'm2');
    expect(resolveTaskDropTarget({ type: 'task', masterPhase: 'Phase 1', subPhase: 'Plan', taskId: 'a' }, drop, rows))
      .toEqual({ targetPhase: 'Marketing', insertBeforeTaskId: 'm2' });
  });
});

describe('resolveTaskDropTarget at the end of a group', () => {
  const tasks = [
    task('a1', { phase: 'Phase 1 UX', start: '2026-03-01' }),
    task('a2', { phase: 'Phase 1 UX', start: '2026-03-01' }),
    task('b1', { phase: 'Phase 1 UI', start: '2026-03-01' }),
    task('c1', { phase: 'Phase 2 Ship', start: '2026-03-01' }),
  ];
  const rows = buildRowMap(hierarchyOf(tasks), 'ALL', new Set(), new Set());
  const src = { type: 'task' as const, masterPhase: 'Phase 1', subPhase: 'UX', taskId: 'a1' };
  const gapAfter = (id: string) => rows.findIndex(r => r.taskId === id) + 1;

  // The drop line under the last task of "UX" sits on the row of the "UI" header. That gap used
  // to resolve to the row below it, sending the task to the end of "UI".
  it('appends to the sub-phase above the line, not the one below', () => {
    expect(resolveTaskDropTarget(src, gapAfter('a2'), rows)).toEqual({ targetPhase: 'Phase 1 UX' });
  });

  it('appends to the last sub-phase of a master phase, not the next master phase', () => {
    expect(resolveTaskDropTarget(src, gapAfter('b1'), rows)).toEqual({ targetPhase: 'Phase 1 UI' });
  });

  it('appends to the very last sub-phase at the end of the list', () => {
    expect(resolveTaskDropTarget(src, rows.length, rows)).toEqual({ targetPhase: 'Phase 2 Ship' });
  });

  it('puts the task first in a collapsed sub-phase when dropped under its header', () => {
    const collapsed = buildRowMap(hierarchyOf(tasks), 'ALL', new Set(), new Set(['Phase 1::UI']));
    const uiHeader = collapsed.findIndex(r => r.type === 'sub-phase' && r.subPhase === 'UI');
    expect(resolveTaskDropTarget(src, uiHeader + 1, collapsed)).toEqual({ targetPhase: 'Phase 1 UI' });
  });

  it('does nothing when dropped back into its own slot', () => {
    expect(resolveTaskDropTarget(src, gapAfter('a1') - 1, rows)).toBeNull();
  });
});

describe('taskDropGap / findTaskDropRow', () => {
  const rows = buildRowMap(hierarchyOf([
    task('a1', { phase: 'Phase 1 UX', start: '2026-03-01' }),
    task('a2', { phase: 'Phase 1 UX', start: '2026-03-01' }),
    task('a3', { phase: 'Phase 1 UX', start: '2026-03-01' }),
  ]), 'ALL', new Set(), new Set());
  const src = { type: 'task' as const, masterPhase: 'Phase 1', subPhase: 'UX', taskId: 'a2' };
  const row = (id: string) => rows.findIndex(r => r.taskId === id);
  const upper = (r: number) => r * ROW_HEIGHT + 5;
  const lower = (r: number) => r * ROW_HEIGHT + ROW_HEIGHT - 5;

  it('treats the upper half of a row as above it and the lower half as below it', () => {
    expect(taskDropGap(row('a1'), upper(row('a1')), rows)).toBe(row('a1'));
    expect(taskDropGap(row('a3'), lower(row('a3')), rows)).toBe(row('a3') + 1);
  });

  it('does not move a task that stays next to itself', () => {
    expect(findTaskDropRow(row('a2'), upper(row('a2')), rows, src)).toBeNull();
    expect(findTaskDropRow(row('a1'), lower(row('a1')), rows, src)).toBeNull();
    expect(findTaskDropRow(row('a3'), upper(row('a3')), rows, src)).toBeNull();
    expect(findTaskDropRow(row('a3'), lower(row('a3')), rows, src)).toBe(row('a3') + 1);
  });

  it('refuses a phase header whose sub-phases are collapsed away', () => {
    const collapsed = buildRowMap(hierarchyOf([task('x', { phase: 'Phase 1 UX', start: '2026-03-01' })]), 'ALL', new Set(['Phase 1']), new Set());
    expect(taskDropGap(0, 5, collapsed)).toBeNull();
  });
});

describe('buildRowMap', () => {
  it('lists phase, sub-phase and task rows and skips collapsed ones', () => {
    const h = hierarchyOf([
      task('a', { phase: 'Phase 1 Plan', start: '2026-03-01' }),
      task('b', { phase: 'Phase 1 Build', start: '2026-03-01' }),
      task('c', { phase: 'Phase 2 Ship', start: '2026-03-01' }),
    ]);
    const rows = buildRowMap(h, 'ALL', new Set(['Phase 2']), new Set(['Phase 1::Build']));
    expect(rows.map(r => r.taskId ?? `${r.type}:${r.subPhase ?? r.masterPhase}`)).toEqual([
      'phase:Phase 1', 'sub-phase:Plan', 'a', 'sub-phase:Build', 'phase:Phase 2',
    ]);
  });

  it('shows only the filtered master phase', () => {
    const h = hierarchyOf([
      task('a', { phase: 'Phase 1 Plan', start: '2026-03-01' }),
      task('c', { phase: 'Phase 2 Ship', start: '2026-03-01' }),
    ]);
    expect(buildRowMap(h, 'Phase 2', new Set(), new Set()).map(r => r.taskId).filter(Boolean)).toEqual(['c']);
  });
});
