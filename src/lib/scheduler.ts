import { Task, ComputedTask, HierarchyMap } from '@/types';
import { PROJECT_START_DATE } from '@/data/defaultProject';

const MS_PER_DAY = 86400000;

export interface ScheduleOptions {
  /** Interpret durations as working days, skipping weekends. */
  workingDaysOnly?: boolean;
}

// A day offset is a weekend when the local weekday is Sat/Sun. Mirrors the
// weekend shading in GridBackground (offsetToDate(d).getDay()) so bars that
// skip weekends stay visually aligned with the shaded columns.
function isWeekendOffset(offset: number): boolean {
  const day = new Date(PROJECT_START_DATE.getTime() + offset * MS_PER_DAY).getDay();
  return day === 0 || day === 6;
}

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

export function computeSchedule(tasks: Task[], opts: ScheduleOptions = {}): ComputedTask[] {
  const workingDaysOnly = !!opts.workingDaysOnly;
  const taskMap: Record<string, ComputedTask> = {};
  tasks.forEach(t => {
    taskMap[t.id] = {
      ...t,
      startDayOffset: NaN,
      endDayOffset: NaN,
      lateStartDayOffset: NaN,
      lateEndDayOffset: NaN,
      totalFloat: NaN,
      isOnCriticalPath: false,
    };
  });

  const endFor = (start: number, duration: number) =>
    workingDaysOnly ? addWorkingDays(start, duration) : start + duration;

  // ---- Forward pass (earliest start/finish), iterative fixed point ----
  let done = false;
  let loops = 0;
  while (!done && loops < 100) {
    done = true;
    for (const id in taskMap) {
      const t = taskMap[id];
      if (!Number.isNaN(t.startDayOffset)) continue;

      if (t.start) {
        t.startDayOffset = Math.round(
          (new Date(t.start).getTime() - PROJECT_START_DATE.getTime()) / MS_PER_DAY
        );
        t.endDayOffset = endFor(t.startDayOffset, t.duration);
      } else if (t.after) {
        const pres = t.after.split(',').map(s => s.trim());
        let mx = -Infinity;
        let ok = true;
        for (const pid of pres) {
          const p = taskMap[pid];
          if (p && !Number.isNaN(p.endDayOffset)) {
            mx = Math.max(mx, p.endDayOffset);
          } else {
            ok = false;
            break;
          }
        }
        if (ok && isFinite(mx)) {
          t.startDayOffset = workingDaysOnly ? nextWorkingDay(mx) : mx;
          t.endDayOffset = endFor(t.startDayOffset, t.duration);
        } else {
          done = false;
        }
      }
    }
    loops++;
  }

  computeCriticalPath(taskMap);

  return tasks.map(t => taskMap[t.id]);
}

// ---- Backward pass: latest start/finish, total float, critical path ----
function computeCriticalPath(taskMap: Record<string, ComputedTask>): void {
  // Project end = latest earliest-finish among all scheduled tasks.
  let projectEnd = -Infinity;
  for (const id in taskMap) {
    const e = taskMap[id].endDayOffset;
    if (Number.isFinite(e)) projectEnd = Math.max(projectEnd, e);
  }
  if (!Number.isFinite(projectEnd)) return; // nothing scheduled

  // successors[predId] = [ids of tasks that depend on predId]
  const successors: Record<string, string[]> = {};
  for (const id in taskMap) {
    const after = taskMap[id].after;
    if (!after) continue;
    after.split(',').map(s => s.trim()).filter(Boolean).forEach(pid => {
      (successors[pid] ||= []).push(id);
    });
  }

  let done = false;
  let loops = 0;
  while (!done && loops < 200) {
    done = true;
    for (const id in taskMap) {
      const t = taskMap[id];
      if (!Number.isFinite(t.endDayOffset)) continue;
      if (Number.isFinite(t.lateEndDayOffset)) continue;

      const succs = (successors[id] || []).filter(sid => Number.isFinite(taskMap[sid]?.endDayOffset));
      let late: number;
      if (succs.length === 0) {
        late = projectEnd;
      } else {
        let mn = Infinity;
        let ready = true;
        for (const sid of succs) {
          const ls = taskMap[sid].lateStartDayOffset;
          if (!Number.isFinite(ls)) { ready = false; break; }
          mn = Math.min(mn, ls);
        }
        if (!ready) { done = false; continue; }
        late = mn;
      }
      const span = t.endDayOffset - t.startDayOffset;
      t.lateEndDayOffset = late;
      t.lateStartDayOffset = late - span;
      // Round away tiny fp noise; clamp negatives to 0 so weekend gaps don't
      // read as negative slack.
      t.totalFloat = Math.max(0, Math.round(t.lateStartDayOffset - t.startDayOffset));
    }
    loops++;
  }

  // Critical path via driving-edge propagation: start from the latest finishers
  // and walk backward through the predecessor that actually drives each task's
  // start (the one with the maximum end). This stays a single contiguous chain
  // in both calendar and working-day mode (float==0 breaks across weekends).
  const stack: string[] = [];
  for (const id in taskMap) {
    if (taskMap[id].endDayOffset === projectEnd) {
      taskMap[id].isOnCriticalPath = true;
      stack.push(id);
    }
  }
  while (stack.length) {
    const t = taskMap[stack.pop()!];
    if (!t.after) continue;
    const preds = t.after
      .split(',')
      .map(s => s.trim())
      .filter(pid => taskMap[pid] && Number.isFinite(taskMap[pid].endDayOffset));
    if (preds.length === 0) continue;
    let maxEnd = -Infinity;
    preds.forEach(pid => { maxEnd = Math.max(maxEnd, taskMap[pid].endDayOffset); });
    preds.forEach(pid => {
      if (taskMap[pid].endDayOffset === maxEnd && !taskMap[pid].isOnCriticalPath) {
        taskMap[pid].isOnCriticalPath = true;
        stack.push(pid);
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
    // Defensive: never assume `phase` is a non-empty string. A malformed task
    // (e.g. created without a phase, or from a bad import) must not crash the
    // entire chart render.
    const phase = t.phase || 'Other';
    const m = phase.match(/^(Phase \d+)\s+(.*)/);
    const master = m ? m[1].trim() : 'Other';
    const sub = m ? m[2].trim() : phase;
    if (!hierarchy[master]) hierarchy[master] = {};
    if (!hierarchy[master][sub]) hierarchy[master][sub] = [];
    hierarchy[master][sub].push(t);
  });
  return hierarchy;
}

export function computeTimelineBounds(
  computed: ComputedTask[],
  milestones: { date: string }[],
  projectStart: Date
): { startDay: number; endDay: number } {
  let minStart = Infinity;
  let maxEnd = -Infinity;

  computed.forEach(t => {
    if (!Number.isNaN(t.startDayOffset)) minStart = Math.min(minStart, t.startDayOffset);
    if (!Number.isNaN(t.endDayOffset)) maxEnd = Math.max(maxEnd, t.endDayOffset);
  });

  milestones.forEach(ms => {
    const d = Math.round((new Date(ms.date).getTime() - projectStart.getTime()) / MS_PER_DAY);
    minStart = Math.min(minStart, d);
    maxEnd = Math.max(maxEnd, d);
  });

  const todayOff = Math.round((Date.now() - projectStart.getTime()) / MS_PER_DAY);
  minStart = Math.min(minStart, todayOff);
  maxEnd = Math.max(maxEnd, todayOff);

  if (!isFinite(minStart)) minStart = 0;
  if (!isFinite(maxEnd)) maxEnd = 90;

  return {
    startDay: minStart - 30,
    endDay: maxEnd + 60,
  };
}
