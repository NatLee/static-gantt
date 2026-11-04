import { Task, ComputedTask, HierarchyMap } from '@/types';
import { dateToOffset, isWeekendOffset, todayOffset } from '@/lib/dateUtils';
import { splitPhase } from '@/lib/phase';
import { parseAfter } from '@/lib/dependencies';

export interface ScheduleOptions {
  /** Interpret durations as working days, skipping weekends. */
  workingDaysOnly?: boolean;
}

/** Days of empty timeline shown before the first and after the last scheduled day. */
const TIMELINE_PADDING_BEFORE = 30;
const TIMELINE_PADDING_AFTER = 60;

// Exclusive end offset that makes a bar starting at `start` cover `duration`
// working days, spanning over any weekends it crosses.
function addWorkingDays(start: number, duration: number): number {
  let remaining = Math.max(0, duration);
  let cur = start;
  while (remaining > 0) {
    if (!isWeekendOffset(cur)) remaining--;
    cur++;
  }
  return cur;
}

function nextWorkingDay(offset: number): number {
  let o = offset;
  while (isWeekendOffset(o)) o++;
  return o;
}

/**
 * Exclusive end offset of a bar that starts at `start` and lasts `duration` days. In working-day
 * mode the bar stretches over the weekends it crosses. Shared with the drag preview so the label
 * shown while dragging matches where the bar lands.
 */
export function endOffsetFor(start: number, duration: number, workingDaysOnly = false): number {
  return workingDaysOnly ? addWorkingDays(start, duration) : start + duration;
}

function unscheduled(t: Task): ComputedTask {
  return {
    ...t,
    startDayOffset: NaN,
    endDayOffset: NaN,
    lateStartDayOffset: NaN,
    lateEndDayOffset: NaN,
    totalFloat: NaN,
    isOnCriticalPath: false,
  };
}

/**
 * Schedule every task. A task with `start` is pinned to that day; a task with `after` starts when
 * its last predecessor ends. Tasks whose predecessors are missing or form a cycle cannot be placed
 * and keep NaN offsets (the chart skips them).
 *
 * Both passes walk the dependency graph in topological order (Kahn's algorithm), so the result is
 * the same however the task list is ordered and however long the chains are.
 */
export function computeSchedule(tasks: Task[], opts: ScheduleOptions = {}): ComputedTask[] {
  const workingDaysOnly = !!opts.workingDaysOnly;
  const taskMap = new Map<string, ComputedTask>();
  tasks.forEach(t => taskMap.set(t.id, unscheduled(t)));

  // ---- Forward pass: earliest start / finish ----
  // waitingOn[id] = predecessors not placed yet; dependents[pred] = tasks waiting for pred.
  const waitingOn = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  const ready: ComputedTask[] = [];
  taskMap.forEach(t => {
    if (t.start) {
      ready.push(t);
      return;
    }
    const preds = parseAfter(t.after);
    if (preds.length === 0) return; // nothing to anchor it: stays unscheduled
    waitingOn.set(t.id, preds.length);
    preds.forEach(pid => {
      if (!dependents.has(pid)) dependents.set(pid, []);
      dependents.get(pid)!.push(t.id);
    });
  });

  while (ready.length > 0) {
    const t = ready.shift()!;
    if (t.start) {
      t.startDayOffset = dateToOffset(t.start);
    } else {
      const latestEnd = Math.max(...parseAfter(t.after).map(pid => taskMap.get(pid)!.endDayOffset));
      t.startDayOffset = workingDaysOnly ? nextWorkingDay(latestEnd) : latestEnd;
    }
    t.endDayOffset = endOffsetFor(t.startDayOffset, t.duration, workingDaysOnly);
    if (!Number.isFinite(t.endDayOffset)) continue; // e.g. an unreadable start date

    (dependents.get(t.id) ?? []).forEach(sid => {
      const left = waitingOn.get(sid)! - 1;
      waitingOn.set(sid, left);
      if (left === 0) ready.push(taskMap.get(sid)!);
    });
  }

  computeCriticalPath(taskMap);

  return tasks.map(t => taskMap.get(t.id)!);
}

// ---- Backward pass: latest start/finish, total float, critical path ----
function computeCriticalPath(taskMap: Map<string, ComputedTask>): void {
  const scheduled = [...taskMap.values()].filter(t => Number.isFinite(t.endDayOffset));
  if (scheduled.length === 0) return;

  // Project end = latest earliest-finish among all scheduled tasks.
  const projectEnd = scheduled.reduce((m, t) => Math.max(m, t.endDayOffset), -Infinity);

  // successors[pred] = scheduled tasks that list pred in `after`
  const successors = new Map<string, ComputedTask[]>();
  scheduled.forEach(t => {
    parseAfter(t.after).forEach(pid => {
      if (!successors.has(pid)) successors.set(pid, []);
      successors.get(pid)!.push(t);
    });
  });

  // A task's late finish is known once every successor's late start is known.
  const pending = new Map<string, number>();
  const ready: ComputedTask[] = [];
  scheduled.forEach(t => {
    const n = successors.get(t.id)?.length ?? 0;
    pending.set(t.id, n);
    if (n === 0) ready.push(t);
  });

  while (ready.length > 0) {
    const t = ready.shift()!;
    const succs = successors.get(t.id) ?? [];
    const late = succs.length === 0 ? projectEnd : Math.min(...succs.map(s => s.lateStartDayOffset));
    const span = t.endDayOffset - t.startDayOffset;
    t.lateEndDayOffset = late;
    t.lateStartDayOffset = late - span;
    // Clamp negatives to 0 so weekend gaps don't read as negative slack.
    t.totalFloat = Math.max(0, Math.round(t.lateStartDayOffset - t.startDayOffset));

    parseAfter(t.after).forEach(pid => {
      if (!pending.has(pid)) return;
      const left = pending.get(pid)! - 1;
      pending.set(pid, left);
      if (left === 0) ready.push(taskMap.get(pid)!);
    });
  }

  // Critical path via driving-edge propagation: start from the latest finishers
  // and walk backward through the predecessor that actually drives each task's
  // start (the one with the maximum end). This stays a single contiguous chain
  // in both calendar and working-day mode (float==0 breaks across weekends).
  const stack: ComputedTask[] = [];
  scheduled.forEach(t => {
    if (t.endDayOffset === projectEnd) {
      t.isOnCriticalPath = true;
      stack.push(t);
    }
  });
  while (stack.length) {
    const t = stack.pop()!;
    const preds = parseAfter(t.after)
      .map(pid => taskMap.get(pid))
      .filter((p): p is ComputedTask => !!p && Number.isFinite(p.endDayOffset));
    if (preds.length === 0) continue;
    const maxEnd = Math.max(...preds.map(p => p.endDayOffset));
    preds.forEach(p => {
      if (p.endDayOffset === maxEnd && !p.isOnCriticalPath) {
        p.isOnCriticalPath = true;
        stack.push(p);
      }
    });
  }
}

/**
 * Mark tasks that overlap (in time) another task assigned to the same person.
 * Pure derived overlay — never mutates the underlying tasks.
 */
export function annotateWorkload(computed: ComputedTask[]): ComputedTask[] {
  const byAssignee = new Map<string, ComputedTask[]>();
  computed.forEach(t => {
    const who = t.assignee?.trim();
    if (!who || Number.isNaN(t.startDayOffset) || Number.isNaN(t.endDayOffset)) return;
    (byAssignee.get(who) ?? byAssignee.set(who, []).get(who)!).push(t);
  });

  const overallocated = new Set<string>();
  byAssignee.forEach(list => {
    if (list.length < 2) return;
    const sorted = [...list].sort((a, b) => a.startDayOffset - b.startDayOffset);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      // Half-open intervals [start, end); they overlap when cur starts before
      // prev ends. Walk back the running max-end to catch chained overlaps.
      let maxEnd = prev.endDayOffset;
      for (let j = i - 1; j >= 0; j--) maxEnd = Math.max(maxEnd, sorted[j].endDayOffset);
      if (cur.startDayOffset < maxEnd) {
        overallocated.add(cur.id);
        // Mark the earliest culprit too so both bars light up.
        for (let j = i - 1; j >= 0; j--) {
          if (sorted[j].endDayOffset > cur.startDayOffset) overallocated.add(sorted[j].id);
        }
      }
    }
  });

  if (overallocated.size === 0) return computed;
  return computed.map(t => (overallocated.has(t.id) ? { ...t, isOverallocated: true } : t));
}

export function buildHierarchy(computed: ComputedTask[]): HierarchyMap {
  const hierarchy: HierarchyMap = {};
  computed.forEach(t => {
    const { master, sub } = splitPhase(t.phase);
    if (!hierarchy[master]) hierarchy[master] = {};
    if (!hierarchy[master][sub]) hierarchy[master][sub] = [];
    hierarchy[master][sub].push(t);
  });
  return hierarchy;
}

/**
 * Day range the timeline must cover: every scheduled bar, every milestone and today, plus some
 * empty space on both sides. `now` is a parameter so tests can pin "today".
 */
export function computeTimelineBounds(
  computed: ComputedTask[],
  milestones: { date: string }[],
  now: Date = new Date()
): { startDay: number; endDay: number } {
  const days: number[] = [todayOffset(now)];
  computed.forEach(t => {
    if (Number.isFinite(t.startDayOffset)) days.push(t.startDayOffset);
    if (Number.isFinite(t.endDayOffset)) days.push(t.endDayOffset);
  });
  milestones.forEach(ms => {
    const d = dateToOffset(ms.date);
    if (Number.isFinite(d)) days.push(d);
  });

  const minStart = days.reduce((a, b) => Math.min(a, b));
  const maxEnd = days.reduce((a, b) => Math.max(a, b));
  return {
    startDay: minStart - TIMELINE_PADDING_BEFORE,
    endDay: maxEnd + TIMELINE_PADDING_AFTER,
  };
}

/**
 * The day to bring into view when a project opens: today while the project is under way,
 * otherwise the start of its first task, so a project that is over (or not started yet) does not
 * open on an empty stretch of timeline. With nothing scheduled, today.
 */
export function initialFocusDay(computed: ComputedTask[], today: number): number {
  let first = Infinity;
  let last = -Infinity;
  computed.forEach(t => {
    if (Number.isFinite(t.startDayOffset)) first = Math.min(first, t.startDayOffset);
    if (Number.isFinite(t.endDayOffset)) last = Math.max(last, t.endDayOffset);
  });
  if (!Number.isFinite(first)) return today;
  return today >= first && today <= last ? today : first;
}
