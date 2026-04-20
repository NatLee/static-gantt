import { useReducer, useMemo } from 'react';
import { GanttState, GanttAction, ComputedTask, HierarchyMap } from '@/types';
import { defaultTasks, defaultMilestones, PROJECT_START_DATE } from '@/data/defaultProject';
import { computeSchedule, buildHierarchy, computeTimelineBounds } from '@/lib/scheduler';
import { rewireDependencies } from '@/lib/dependencyRewire';

const initialBounds = computeTimelineBounds(
  computeSchedule(defaultTasks),
  defaultMilestones,
  PROJECT_START_DATE
);

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
  activeDialog: null,
  timelineStartDay: initialBounds.startDay,
  timelineEndDay: initialBounds.endDay,
};

function ganttReducer(state: GanttState, action: GanttAction): GanttState {
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
      return { ...state, tasks, editingTaskId: null };
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
      // Any task that depended on targetTask now depends on the new task
      tasks.forEach(t => {
        if (t.after === action.targetTaskId && t.id !== newTask.id) {
          t.after = newTask.id;
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
        const regex = new RegExp(`^${action.oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s+.*)?$`);
        const m = t.phase.match(regex);
        if (m) return { ...t, phase: action.newName + (m[1] || '') };
        return t;
      });
      return { ...state, tasks };
    }

    case 'DELETE_PHASE': {
      const regex = new RegExp(`^${action.phase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s+.*)?$`);
      const deletedIds = state.tasks.filter(t => regex.test(t.phase)).map(t => t.id);
      const tasks = rewireDependencies(state.tasks, deletedIds);
      return { ...state, tasks };
    }

    case 'RENAME_SUB_PHASE': {
      const oldFull = `${action.masterPhase} ${action.oldSub}`;
      const newFull = `${action.masterPhase} ${action.newSub}`;
      const tasks = state.tasks.map(t =>
        t.phase === oldFull ? { ...t, phase: newFull } : t
      );
      return { ...state, tasks };
    }

    case 'DELETE_SUB_PHASE': {
      const fullPhase = `${action.masterPhase} ${action.subPhase}`;
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
      const phaseRegex = /^(Phase \d+)\s+(.*)/;
      const groups = new Map<string, typeof state.tasks>();
      const otherTasks: typeof state.tasks = [];
      state.tasks.forEach(t => {
        const m = t.phase.match(phaseRegex);
        const master = m ? m[1].trim() : null;
        if (master) {
          if (!groups.has(master)) groups.set(master, []);
          groups.get(master)!.push(t);
        } else {
          otherTasks.push(t);
        }
      });
      const tasks: typeof state.tasks = [];
      action.orderedPhases.forEach(phase => {
        const group = groups.get(phase);
        if (group) tasks.push(...group);
      });
      // Append any phases not in orderedPhases + other tasks
      groups.forEach((group, key) => {
        if (!action.orderedPhases.includes(key)) tasks.push(...group);
      });
      tasks.push(...otherTasks);
      return { ...state, tasks };
    }

    case 'REORDER_SUB_PHASES': {
      const phaseRegex = /^(Phase \d+)\s+(.*)/;
      const masterPhase = action.masterPhase;
      // Split tasks into: before master phase, within master phase (by sub), after master phase
      const before: typeof state.tasks = [];
      const subGroups = new Map<string, typeof state.tasks>();
      const after: typeof state.tasks = [];
      let seenMaster = false;
      let pastMaster = false;
      state.tasks.forEach(t => {
        const m = t.phase.match(phaseRegex);
        const master = m ? m[1].trim() : null;
        const sub = m ? m[2].trim() : null;
        if (master === masterPhase && sub) {
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
      const tasks = state.tasks.filter(t => t.id !== action.taskId);
      if (action.insertBeforeTaskId) {
        const idx = tasks.findIndex(t => t.id === action.insertBeforeTaskId);
        if (idx >= 0) {
          tasks.splice(idx, 0, updated);
        } else {
          tasks.push(updated);
        }
      } else {
        // Insert after last task in targetPhase
        let lastIdx = -1;
        tasks.forEach((t, i) => { if (t.phase === action.targetPhase) lastIdx = i; });
        if (lastIdx >= 0) {
          tasks.splice(lastIdx + 1, 0, updated);
        } else {
          tasks.push(updated);
        }
      }
      return { ...state, tasks };
    }

    case 'MOVE_SUB_PHASE': {
      const oldPhase = `${action.sourceMasterPhase} ${action.subPhase}`;
      const newPhase = `${action.targetMasterPhase} ${action.subPhase}`;
      const movedTasks = state.tasks.filter(t => t.phase === oldPhase).map(t => ({ ...t, phase: newPhase }));
      if (movedTasks.length === 0) return state;
      const tasks = state.tasks.filter(t => t.phase !== oldPhase);
      if (action.insertBeforeSubPhase) {
        const targetFullPhase = `${action.targetMasterPhase} ${action.insertBeforeSubPhase}`;
        const idx = tasks.findIndex(t => t.phase === targetFullPhase);
        if (idx >= 0) {
          tasks.splice(idx, 0, ...movedTasks);
        } else {
          tasks.push(...movedTasks);
        }
      } else {
        // Insert after last task in targetMasterPhase
        const phaseRegex = /^(Phase \d+)\s+(.*)/;
        let lastIdx = -1;
        tasks.forEach((t, i) => {
          const m = t.phase.match(phaseRegex);
          if (m && m[1].trim() === action.targetMasterPhase) lastIdx = i;
        });
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

export function useGanttState() {
  const [state, dispatch] = useReducer(ganttReducer, initialState);

  const computed = useMemo<ComputedTask[]>(() => computeSchedule(state.tasks), [state.tasks]);
  const hierarchy = useMemo<HierarchyMap>(() => buildHierarchy(computed), [computed]);
  const taskMap = useMemo(() => {
    const map = new Map<string, ComputedTask>();
    computed.forEach(t => map.set(t.id, t));
    return map;
  }, [computed]);

  const masterPhases = useMemo(() => Object.keys(hierarchy), [hierarchy]);

  const bounds = useMemo(() => {
    return computeTimelineBounds(computed, state.milestones, PROJECT_START_DATE);
  }, [computed, state.milestones]);

  // Auto-extend timeline when bounds change
  const timelineStartDay = Math.min(state.timelineStartDay, bounds.startDay);
  const timelineEndDay = Math.max(state.timelineEndDay, bounds.endDay);

  return {
    state: {
      ...state,
      timelineStartDay,
      timelineEndDay,
    },
    dispatch,
    computed,
    hierarchy,
    taskMap,
    masterPhases,
  };
}
