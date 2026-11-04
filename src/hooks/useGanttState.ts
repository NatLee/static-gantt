import { useMemo } from 'react';
import { GanttState, GanttAction, ComputedTask, HierarchyMap, Task } from '@/types';
import { defaultTasks, defaultMilestones } from '@/data/defaultProject';
import { computeSchedule, buildHierarchy, computeTimelineBounds, annotateWorkload } from '@/lib/scheduler';
import { rewireDependencies } from '@/lib/dependencyRewire';
import { joinPhase, masterOf, splitPhase } from '@/lib/phase';
import { formatAfter, parseAfter } from '@/lib/dependencies';
import { useUndoableReducer } from './useUndoableReducer';

const initialBounds = computeTimelineBounds(computeSchedule(defaultTasks), defaultMilestones);

const initialState: GanttState = {
  tasks: defaultTasks,
  milestones: defaultMilestones,
  currentFilter: 'ALL',
  currentMode: 'visual',
  isDark: true,
  zoomScale: 1,
  collapsedPhases: new Set<string>(),
  collapsedSubPhases: new Set<string>(),
  editingTaskId: null,
  highlightedTaskId: null,
  selectedTaskId: null,
  activeDialog: null,
  timelineStartDay: initialBounds.startDay,
  timelineEndDay: initialBounds.endDay,
  legendVisible: true,
  workingDaysOnly: false,
  baseline: null,
};

/**
 * Take `updated` out of its current slot and put it back in front of `insertBeforeTaskId`, or,
 * without one, after the last task of its (new) phase. List order is display order.
 */
function moveTaskInto(tasks: Task[], updated: Task, insertBeforeTaskId?: string): Task[] {
  const rest = tasks.filter(t => t.id !== updated.id);
  let idx = -1;
  if (insertBeforeTaskId) {
    idx = rest.findIndex(t => t.id === insertBeforeTaskId);
  } else {
    const lastInPhase = rest.findLastIndex(t => t.phase === updated.phase);
    if (lastInPhase >= 0) idx = lastInPhase + 1;
  }
  if (idx < 0) rest.push(updated);
  else rest.splice(idx, 0, updated);
  return rest;
}

export function ganttReducer(state: GanttState, action: GanttAction): GanttState {
  switch (action.type) {
    case 'SET_FILTER':
      return { ...state, currentFilter: action.filter };

    case 'SET_MODE':
      return { ...state, currentMode: action.mode };

    case 'TOGGLE_THEME':
      return { ...state, isDark: !state.isDark };

    case 'SET_ZOOM':
      return { ...state, zoomScale: Math.max(0.2, Math.min(action.scale, 5)) };

    case 'TOGGLE_PHASE_COLLAPSE': {
      const next = new Set(state.collapsedPhases);
      if (next.has(action.phase)) next.delete(action.phase);
      else next.add(action.phase);
      return { ...state, collapsedPhases: next };
    }

    case 'TOGGLE_SUB_PHASE_COLLAPSE': {
      const next = new Set(state.collapsedSubPhases);
      if (next.has(action.key)) next.delete(action.key);
      else next.add(action.key);
      return { ...state, collapsedSubPhases: next };
    }

    case 'OPEN_TASK_EDITOR':
      return { ...state, editingTaskId: action.taskId };

    case 'CLOSE_TASK_EDITOR':
      return { ...state, editingTaskId: null };

    case 'UPDATE_TASK': {
      const tasks = state.tasks.map(t =>
        t.id === action.taskId ? { ...t, ...action.updates } : t
      );
      return { ...state, tasks };
    }

    case 'DELETE_TASK': {
      const tasks = rewireDependencies(state.tasks, action.taskId);
      const clearedSelection =
        state.selectedTaskId === action.taskId ? null : state.selectedTaskId;
      return { ...state, tasks, editingTaskId: null, selectedTaskId: clearedSelection };
    }

    case 'ADD_TASK': {
      const tasks = [...state.tasks];
      if (action.afterIndex !== undefined) {
        tasks.splice(action.afterIndex + 1, 0, action.task);
      } else {
        tasks.push(action.task);
      }
      return { ...state, tasks };
    }

    case 'ADD_BEFORE_TASK': {
      const tasks = state.tasks.map(t => ({ ...t }));
      const targetIdx = tasks.findIndex(t => t.id === action.targetTaskId);
      if (targetIdx === -1) return state;
      const target = tasks[targetIdx];
      const newTask = { ...action.task };
      if (target.after) { newTask.after = target.after; delete newTask.start; }
      else if (target.start) { newTask.start = target.start; delete newTask.after; }
      target.after = newTask.id;
      delete target.start;
      tasks.splice(targetIdx, 0, newTask);
      return { ...state, tasks };
    }

    case 'ADD_AFTER_TASK': {
      const tasks = state.tasks.map(t => ({ ...t }));
      const targetIdx = tasks.findIndex(t => t.id === action.targetTaskId);
      if (targetIdx === -1) return state;
      const newTask = { ...action.task, after: action.targetTaskId };
      delete newTask.start;
      // Any task that depended on targetTask now depends on the new task instead,
      // including tasks that wait for several predecessors.
      tasks.forEach(t => {
        const preds = parseAfter(t.after);
        if (t.id !== newTask.id && preds.includes(action.targetTaskId)) {
          t.after = formatAfter(preds.map(id => (id === action.targetTaskId ? newTask.id : id)));
        }
      });
      tasks.splice(targetIdx + 1, 0, newTask);
      return { ...state, tasks };
    }

    case 'ADD_MILESTONE': {
      return { ...state, milestones: [...state.milestones, action.milestone] };
    }

    case 'UPDATE_MILESTONE': {
      const milestones = state.milestones.map(ms =>
        ms.id === action.milestoneId ? { ...ms, ...action.updates } : ms
      );
      return { ...state, milestones };
    }

    case 'DELETE_MILESTONE': {
      return { ...state, milestones: state.milestones.filter(ms => ms.id !== action.milestoneId) };
    }

    case 'RENAME_PHASE': {
      const tasks = state.tasks.map(t => {
        const { master, sub } = splitPhase(t.phase);
        return master === action.oldName ? { ...t, phase: joinPhase(action.newName, sub) } : t;
      });
      return { ...state, tasks };
    }

    case 'DELETE_PHASE': {
      const deletedIds = state.tasks.filter(t => masterOf(t.phase) === action.phase).map(t => t.id);
      const tasks = rewireDependencies(state.tasks, deletedIds);
      return { ...state, tasks };
    }

    case 'RENAME_SUB_PHASE': {
      const oldFull = joinPhase(action.masterPhase, action.oldSub);
      const newFull = joinPhase(action.masterPhase, action.newSub);
      const tasks = state.tasks.map(t =>
        t.phase === oldFull ? { ...t, phase: newFull } : t
      );
      return { ...state, tasks };
    }

    case 'DELETE_SUB_PHASE': {
      const fullPhase = joinPhase(action.masterPhase, action.subPhase);
      const deletedIds = state.tasks.filter(t => t.phase === fullPhase).map(t => t.id);
      const tasks = rewireDependencies(state.tasks, deletedIds);
      return { ...state, tasks };
    }

    case 'REPLACE_ALL_TASKS':
      return { ...state, tasks: action.tasks, currentFilter: 'ALL' };

    case 'EXTEND_TIMELINE':
      if (action.direction === 'left') {
        return { ...state, timelineStartDay: state.timelineStartDay - action.days };
      }
      return { ...state, timelineEndDay: state.timelineEndDay + action.days };

    case 'OPEN_DIALOG':
      return { ...state, activeDialog: action.dialog };

    case 'CLOSE_DIALOG':
      return { ...state, activeDialog: null };

    case 'MOVE_TASK': {
      const tasks = state.tasks.map(t =>
        t.id === action.taskId ? { ...t, start: action.newStartDate, after: undefined } : t
      );
      return { ...state, tasks };
    }

    case 'RESIZE_TASK': {
      const tasks = state.tasks.map(t =>
        t.id === action.taskId ? { ...t, duration: action.newDuration } : t
      );
      return { ...state, tasks };
    }

    case 'REORDER_PHASES': {
      const groups = new Map<string, typeof state.tasks>();
      state.tasks.forEach(t => {
        const master = masterOf(t.phase);
        if (!groups.has(master)) groups.set(master, []);
        groups.get(master)!.push(t);
      });
      const tasks: typeof state.tasks = [];
      action.orderedPhases.forEach(phase => {
        const group = groups.get(phase);
        if (group) tasks.push(...group);
      });
      // Append any phases not in orderedPhases, keeping their current order
      groups.forEach((group, key) => {
        if (!action.orderedPhases.includes(key)) tasks.push(...group);
      });
      return { ...state, tasks };
    }

    case 'REORDER_SUB_PHASES': {
      const masterPhase = action.masterPhase;
      // Split tasks into: before master phase, within master phase (by sub), after master phase
      const before: typeof state.tasks = [];
      const subGroups = new Map<string, typeof state.tasks>();
      const after: typeof state.tasks = [];
      let seenMaster = false;
      let pastMaster = false;
      state.tasks.forEach(t => {
        const { master, sub } = splitPhase(t.phase);
        if (master === masterPhase) {
          seenMaster = true;
          if (!subGroups.has(sub)) subGroups.set(sub, []);
          subGroups.get(sub)!.push(t);
        } else {
          if (seenMaster && master !== masterPhase) pastMaster = true;
          if (!seenMaster) before.push(t);
          else if (pastMaster) after.push(t);
          else before.push(t); // non-matching task before master ends
        }
      });
      const tasks = [...before];
      action.orderedSubPhases.forEach(sub => {
        const group = subGroups.get(sub);
        if (group) tasks.push(...group);
      });
      // Append any sub-phases not in orderedSubPhases
      subGroups.forEach((group, key) => {
        if (!action.orderedSubPhases.includes(key)) tasks.push(...group);
      });
      tasks.push(...after);
      return { ...state, tasks };
    }

    case 'MOVE_REORDER_TASK': {
      const task = state.tasks.find(t => t.id === action.taskId);
      if (!task) return state;
      const updated = { ...task, phase: action.targetPhase };
      return { ...state, tasks: moveTaskInto(state.tasks, updated, action.insertBeforeTaskId) };
    }

    case 'MOVE_TASK_WITH_REORDER': {
      const existing = state.tasks.find(t => t.id === action.taskId);
      if (!existing) return state;
      const updated = {
        ...existing,
        start: action.newStartDate,
        after: undefined,
        phase: action.targetPhase,
      };
      return { ...state, tasks: moveTaskInto(state.tasks, updated, action.insertBeforeTaskId) };
    }

    case 'SET_HIGHLIGHTED_TASK':
      return { ...state, highlightedTaskId: action.taskId };

    case 'SET_SELECTED_TASK':
      return { ...state, selectedTaskId: action.taskId };

    case 'DUPLICATE_TASK': {
      const idx = state.tasks.findIndex(t => t.id === action.taskId);
      if (idx < 0) return state;
      const original = state.tasks[idx];
      const copy = {
        ...original,
        id: action.newId,
        name: `${original.name} (copy)`,
        after: original.id,
        start: undefined,
      };
      const tasks = [...state.tasks];
      tasks.splice(idx + 1, 0, copy);
      return { ...state, tasks };
    }

    case 'LOAD_PROJECT_STATE': {
      const s = action.state;
      return {
        ...state,
        tasks: s.tasks,
        milestones: s.milestones,
        currentFilter: s.currentFilter,
        zoomScale: s.zoomScale,
        collapsedPhases: new Set(s.collapsedPhases),
        collapsedSubPhases: new Set(s.collapsedSubPhases),
        timelineStartDay: s.timelineStartDay,
        timelineEndDay: s.timelineEndDay,
        workingDaysOnly: s.workingDaysOnly ?? false,
        baseline: s.baseline ?? null,
        editingTaskId: null,
        highlightedTaskId: null,
        selectedTaskId: null,
        activeDialog: null,
      };
    }

    case 'ADD_TASK_DEPENDENCY': {
      const tasks = state.tasks.map(t => {
        if (t.id !== action.taskId) return t;
        const existing = parseAfter(t.after);
        if (existing.includes(action.predecessorId)) return t;
        const next = { ...t, after: formatAfter([...existing, action.predecessorId]) };
        delete next.start;
        return next;
      });
      return { ...state, tasks };
    }

    case 'REMOVE_TASK_DEPENDENCY': {
      const tasks = state.tasks.map(t => {
        if (t.id !== action.taskId || !t.after) return t;
        const remaining = formatAfter(parseAfter(t.after).filter(id => id !== action.predecessorId));
        const next = { ...t };
        if (remaining) {
          next.after = remaining;
        } else {
          delete next.after;
          // No predecessors left: anchor the task at its current date so it
          // stays scheduled instead of cascading to NaN through descendants.
          if (!next.start && action.fallbackStartDate) {
            next.start = action.fallbackStartDate;
          }
        }
        return next;
      });
      return { ...state, tasks };
    }

    case 'COLLAPSE_ALL_PHASES':
      return { ...state, collapsedPhases: new Set(state.tasks.map(t => masterOf(t.phase))) };

    case 'EXPAND_ALL_PHASES':
      return { ...state, collapsedPhases: new Set(), collapsedSubPhases: new Set() };

    case 'TOGGLE_LEGEND_VISIBLE':
      return { ...state, legendVisible: !state.legendVisible };

    case 'SET_WORKING_DAYS':
      return { ...state, workingDaysOnly: action.enabled };

    case 'CAPTURE_BASELINE': {
      const scheduled = computeSchedule(state.tasks, { workingDaysOnly: state.workingDaysOnly });
      const bars: Record<string, { start: number; end: number }> = {};
      scheduled.forEach(t => {
        if (Number.isFinite(t.startDayOffset) && Number.isFinite(t.endDayOffset)) {
          bars[t.id] = { start: t.startDayOffset, end: t.endDayOffset };
        }
      });
      return { ...state, baseline: { capturedAt: new Date().toISOString(), bars } };
    }

    case 'CLEAR_BASELINE':
      return { ...state, baseline: null };

    case 'MOVE_SUB_PHASE': {
      const oldPhase = joinPhase(action.sourceMasterPhase, action.subPhase);
      const newPhase = joinPhase(action.targetMasterPhase, action.subPhase);
      const movedTasks = state.tasks.filter(t => t.phase === oldPhase).map(t => ({ ...t, phase: newPhase }));
      if (movedTasks.length === 0) return state;
      const tasks = state.tasks.filter(t => t.phase !== oldPhase);
      if (action.insertBeforeSubPhase) {
        const targetFullPhase = joinPhase(action.targetMasterPhase, action.insertBeforeSubPhase);
        const idx = tasks.findIndex(t => t.phase === targetFullPhase);
        if (idx >= 0) {
          tasks.splice(idx, 0, ...movedTasks);
        } else {
          tasks.push(...movedTasks);
        }
      } else {
        // Insert after last task in targetMasterPhase
        const lastIdx = tasks.findLastIndex(t => masterOf(t.phase) === action.targetMasterPhase);
        if (lastIdx >= 0) {
          tasks.splice(lastIdx + 1, 0, ...movedTasks);
        } else {
          tasks.push(...movedTasks);
        }
      }
      return { ...state, tasks };
    }

    default:
      return state;
  }
}

const NON_UNDOABLE_ACTIONS = new Set<GanttAction['type']>([
  'SET_FILTER',
  'SET_MODE',
  'TOGGLE_THEME',
  'SET_ZOOM',
  'TOGGLE_PHASE_COLLAPSE',
  'TOGGLE_SUB_PHASE_COLLAPSE',
  'OPEN_TASK_EDITOR',
  'CLOSE_TASK_EDITOR',
  'OPEN_DIALOG',
  'CLOSE_DIALOG',
  'EXTEND_TIMELINE',
  'LOAD_PROJECT_STATE',
  'SET_HIGHLIGHTED_TASK',
  'SET_SELECTED_TASK',
  'COLLAPSE_ALL_PHASES',
  'EXPAND_ALL_PHASES',
  'TOGGLE_LEGEND_VISIBLE',
  'SET_WORKING_DAYS',
]);

function isUndoable(action: GanttAction): boolean {
  return !NON_UNDOABLE_ACTIONS.has(action.type);
}

export function useGanttState() {
  const [state, dispatch, history] = useUndoableReducer(
    ganttReducer,
    initialState,
    { isUndoable, maxHistory: 50 }
  );

  const computed = useMemo<ComputedTask[]>(
    () => annotateWorkload(computeSchedule(state.tasks, { workingDaysOnly: state.workingDaysOnly })),
    [state.tasks, state.workingDaysOnly]
  );
  const hierarchy = useMemo<HierarchyMap>(() => buildHierarchy(computed), [computed]);
  const taskMap = useMemo(() => {
    const map = new Map<string, ComputedTask>();
    computed.forEach(t => map.set(t.id, t));
    return map;
  }, [computed]);

  const masterPhases = useMemo(() => Object.keys(hierarchy), [hierarchy]);

  const bounds = useMemo(() => {
    return computeTimelineBounds(computed, state.milestones);
  }, [computed, state.milestones]);

  // Auto-extend timeline when bounds change
  const timelineStartDay = Math.min(state.timelineStartDay, bounds.startDay);
  const timelineEndDay = Math.max(state.timelineEndDay, bounds.endDay);

  const effectiveState = useMemo(
    () => ({ ...state, timelineStartDay, timelineEndDay }),
    [state, timelineStartDay, timelineEndDay]
  );

  return {
    state: effectiveState,
    dispatch,
    computed,
    hierarchy,
    taskMap,
    masterPhases,
    history,
  };
}
