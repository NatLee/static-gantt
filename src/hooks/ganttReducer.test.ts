import { describe, expect, it } from 'vitest';
import { ganttReducer } from './useGanttState';
import type { GanttState, Task } from '@/types';
import { task } from '@/test/helpers';

const stateWith = (tasks: Task[]): GanttState => ({
  tasks, milestones: [], currentFilter: 'ALL', currentMode: 'visual', isDark: true, zoomScale: 1,
  collapsedPhases: new Set(), collapsedSubPhases: new Set(), editingTaskId: null, highlightedTaskId: null,
  selectedTaskId: null, activeDialog: null, timelineStartDay: 0, timelineEndDay: 30, legendVisible: true,
  workingDaysOnly: false, baseline: null,
});
const find = (s: GanttState, id: string) => s.tasks.find(t => t.id === id)!;

describe('ganttReducer: dates and dependencies', () => {
  it('MOVE_TASK pins the task to a date and drops its dependency', () => {
    const s = ganttReducer(stateWith([task('a', { start: '2026-03-01' }), task('b', { after: 'a' })]),
      { type: 'MOVE_TASK', taskId: 'b', newStartDate: '2026-03-10' });
    expect(find(s, 'b').start).toBe('2026-03-10');
    expect(find(s, 'b').after).toBeUndefined();
  });

  it('ADD_TASK_DEPENDENCY appends once and clears the fixed start', () => {
    let s = stateWith([task('a', { start: '2026-03-01' }), task('b', { start: '2026-03-01' }), task('c', { after: 'a' })]);
    s = ganttReducer(s, { type: 'ADD_TASK_DEPENDENCY', taskId: 'c', predecessorId: 'b' });
    s = ganttReducer(s, { type: 'ADD_TASK_DEPENDENCY', taskId: 'c', predecessorId: 'b' });
    expect(find(s, 'c').after).toBe('a,b');
    s = ganttReducer(s, { type: 'ADD_TASK_DEPENDENCY', taskId: 'b', predecessorId: 'a' });
    expect(find(s, 'b').start).toBeUndefined();
  });

  it('REMOVE_TASK_DEPENDENCY anchors a task that loses its last predecessor', () => {
    const s = ganttReducer(stateWith([task('a', { start: '2026-03-01' }), task('b', { after: 'a' })]),
      { type: 'REMOVE_TASK_DEPENDENCY', taskId: 'b', predecessorId: 'a', fallbackStartDate: '2026-03-02' });
    expect(find(s, 'b').after).toBeUndefined();
    expect(find(s, 'b').start).toBe('2026-03-02');
  });

  it('ADD_BEFORE_TASK inserts into the chain in front of the target', () => {
    const s = ganttReducer(stateWith([task('a', { start: '2026-03-01' }), task('b', { after: 'a' })]),
      { type: 'ADD_BEFORE_TASK', targetTaskId: 'b', task: task('n') });
    expect(s.tasks.map(t => t.id)).toEqual(['a', 'n', 'b']);
    expect(find(s, 'n').after).toBe('a');
    expect(find(s, 'b').after).toBe('n');
  });

  it('ADD_AFTER_TASK hands the target\'s successors to the new task', () => {
    const s = ganttReducer(stateWith([task('a', { start: '2026-03-01' }), task('b', { after: 'a' })]),
      { type: 'ADD_AFTER_TASK', targetTaskId: 'a', task: task('n') });
    expect(s.tasks.map(t => t.id)).toEqual(['a', 'n', 'b']);
    expect(find(s, 'n').after).toBe('a');
    expect(find(s, 'b').after).toBe('n');
  });

  it('DELETE_TASK rewires successors and clears the selection', () => {
    let s = stateWith([task('a', { start: '2026-03-01' }), task('b', { after: 'a' }), task('c', { after: 'b' })]);
    s = { ...s, selectedTaskId: 'b' };
    s = ganttReducer(s, { type: 'DELETE_TASK', taskId: 'b' });
    expect(find(s, 'c').after).toBe('a');
    expect(s.selectedTaskId).toBeNull();
  });
});

describe('ganttReducer: phases', () => {
  const tasks = [
    task('a', { phase: 'Phase 1 Plan' }),
    task('b', { phase: 'Phase 1 Build' }),
    task('c', { phase: 'Phase 2 Ship' }),
  ];

  it('RENAME_PHASE renames the master phase of every sub-phase', () => {
    const s = ganttReducer(stateWith(tasks), { type: 'RENAME_PHASE', oldName: 'Phase 1', newName: 'Phase 9' });
    expect(s.tasks.map(t => t.phase)).toEqual(['Phase 9 Plan', 'Phase 9 Build', 'Phase 2 Ship']);
  });

  it('REORDER_PHASES moves whole master phases', () => {
    const s = ganttReducer(stateWith(tasks), { type: 'REORDER_PHASES', orderedPhases: ['Phase 2', 'Phase 1'] });
    expect(s.tasks.map(t => t.id)).toEqual(['c', 'a', 'b']);
  });

  it('MOVE_SUB_PHASE moves a sub-phase under another master phase', () => {
    const s = ganttReducer(stateWith(tasks), {
      type: 'MOVE_SUB_PHASE', subPhase: 'Build', sourceMasterPhase: 'Phase 1', targetMasterPhase: 'Phase 2',
    });
    expect(find(s, 'b').phase).toBe('Phase 2 Build');
    expect(s.tasks.map(t => t.id)).toEqual(['a', 'c', 'b']);
  });

  it('COLLAPSE_ALL_PHASES collapses every master phase', () => {
    const s = ganttReducer(stateWith(tasks), { type: 'COLLAPSE_ALL_PHASES' });
    expect([...s.collapsedPhases].sort()).toEqual(['Phase 1', 'Phase 2']);
  });
});

describe('ganttReducer: baseline', () => {
  it('CAPTURE_BASELINE records the scheduled bars', () => {
    const s = ganttReducer(stateWith([task('a', { start: '2026-03-03', duration: 2 })]), { type: 'CAPTURE_BASELINE' });
    expect(s.baseline!.bars).toEqual({ a: { start: 2, end: 4 } });
  });
});
