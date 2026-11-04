import { describe, expect, it } from 'vitest';
import { ganttReducer, undoableGanttReducer } from './useGanttState';
import type { GanttState, Task } from '@/types';
import type { History } from './useUndoableReducer';
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

  it('ADD_AFTER_TASK also re-points successors that wait for several tasks', () => {
    const s = ganttReducer(stateWith([
      task('a', { start: '2026-03-01' }), task('x', { start: '2026-03-01' }), task('b', { after: 'x,a' }),
    ]), { type: 'ADD_AFTER_TASK', targetTaskId: 'a', task: task('n') });
    expect(find(s, 'b').after).toBe('x,n');
    expect(find(s, 'n').after).toBe('a');
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

// Sections imported from Mermaid usually have no "Phase N" prefix ("Marketing"). They are shown as
// sub-phases of "Other"; these used to be renamed to "Other Marketing" by every edit that rebuilt
// the phase string by hand.
describe('ganttReducer: phases without a "Phase N" prefix', () => {
  const tasks = [
    task('m1', { phase: 'Marketing' }),
    task('p1', { phase: 'Phase 1 Plan' }),
    task('s1', { phase: 'Sales' }),
  ];

  it('RENAME_SUB_PHASE renames the section itself', () => {
    const s = ganttReducer(stateWith(tasks), { type: 'RENAME_SUB_PHASE', masterPhase: 'Other', oldSub: 'Marketing', newSub: 'Growth' });
    expect(find(s, 'm1').phase).toBe('Growth');
  });

  it('DELETE_SUB_PHASE deletes the section', () => {
    const s = ganttReducer(stateWith(tasks), { type: 'DELETE_SUB_PHASE', masterPhase: 'Other', subPhase: 'Sales' });
    expect(s.tasks.map(t => t.id)).toEqual(['m1', 'p1']);
  });

  it('MOVE_SUB_PHASE in and out of a numbered phase keeps the section name', () => {
    let s = ganttReducer(stateWith(tasks), { type: 'MOVE_SUB_PHASE', subPhase: 'Marketing', sourceMasterPhase: 'Other', targetMasterPhase: 'Phase 1' });
    expect(find(s, 'm1').phase).toBe('Phase 1 Marketing');
    s = ganttReducer(s, { type: 'MOVE_SUB_PHASE', subPhase: 'Plan', sourceMasterPhase: 'Phase 1', targetMasterPhase: 'Other' });
    expect(find(s, 'p1').phase).toBe('Plan');
  });

  it('REORDER_PHASES moves the Other group like any other phase', () => {
    const s = ganttReducer(stateWith(tasks), { type: 'REORDER_PHASES', orderedPhases: ['Other', 'Phase 1'] });
    expect(s.tasks.map(t => t.id)).toEqual(['m1', 's1', 'p1']);
  });

  it('REORDER_SUB_PHASES reorders sections inside Other', () => {
    const s = ganttReducer(stateWith(tasks), { type: 'REORDER_SUB_PHASES', masterPhase: 'Other', orderedSubPhases: ['Sales', 'Marketing'] });
    expect(s.tasks.map(t => t.id)).toEqual(['s1', 'm1', 'p1']);
  });

  it('COLLAPSE_ALL_PHASES also collapses Other, and only phases that are shown', () => {
    const s = ganttReducer(stateWith([...tasks, task('x', { phase: 'Phase 3' })]), { type: 'COLLAPSE_ALL_PHASES' });
    expect([...s.collapsedPhases].sort()).toEqual(['Other', 'Phase 1']);
  });

  it('RENAME_PHASE of Other gives its sections a numbered prefix', () => {
    const s = ganttReducer(stateWith(tasks), { type: 'RENAME_PHASE', oldName: 'Other', newName: 'Phase 2' });
    expect(s.tasks.map(t => t.phase)).toEqual(['Phase 2 Marketing', 'Phase 1 Plan', 'Phase 2 Sales']);
  });
});

describe('undo / redo', () => {
  const history = (tasks: Task[]): History<GanttState> => ({ past: [], present: stateWith(tasks), future: [] });

  it('undoes and redoes document edits', () => {
    let h = history([task('a', { start: '2026-03-01' })]);
    h = undoableGanttReducer(h, { type: 'RESIZE_TASK', taskId: 'a', newDuration: 5 });
    expect(h.present.tasks[0].duration).toBe(5);
    h = undoableGanttReducer(h, { type: '__UNDO__' });
    expect(h.present.tasks[0].duration).toBe(1);
    h = undoableGanttReducer(h, { type: '__REDO__' });
    expect(h.present.tasks[0].duration).toBe(5);
  });

  it('does not put view changes on the undo stack', () => {
    let h = history([task('a')]);
    h = undoableGanttReducer(h, { type: 'SET_ZOOM', scale: 2 });
    expect(h.past).toHaveLength(0);
    expect(h.present.zoomScale).toBe(2);
  });

  it('keeps at most 50 steps', () => {
    let h = history([task('a', { start: '2026-03-01' })]);
    for (let i = 2; i <= 60; i++) h = undoableGanttReducer(h, { type: 'RESIZE_TASK', taskId: 'a', newDuration: i });
    expect(h.past).toHaveLength(50);
    expect(h.past[0].tasks[0].duration).toBe(10);
  });
});
