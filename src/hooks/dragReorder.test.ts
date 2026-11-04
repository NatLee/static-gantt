import { describe, expect, it } from 'vitest';
import { buildRowMap, resolveTaskDropTarget } from './useDragReorder';
import { buildHierarchy, computeSchedule } from '@/lib/scheduler';
import { task } from '@/test/helpers';

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
