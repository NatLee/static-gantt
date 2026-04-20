import { Task, ComputedTask, HierarchyMap } from '@/types';
import { PROJECT_START_DATE } from '@/data/defaultProject';

const MS_PER_DAY = 86400000;

export function computeSchedule(tasks: Task[]): ComputedTask[] {
  const taskMap: Record<string, ComputedTask> = {};
  tasks.forEach(t => {
    taskMap[t.id] = { ...t, startDayOffset: NaN, endDayOffset: NaN };
  });

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
        t.endDayOffset = t.startDayOffset + t.duration;
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
          t.startDayOffset = mx;
          t.endDayOffset = t.startDayOffset + t.duration;
        } else {
          done = false;
        }
      }
    }
    loops++;
  }

  return tasks.map(t => taskMap[t.id]);
}

export function buildHierarchy(computed: ComputedTask[]): HierarchyMap {
  const hierarchy: HierarchyMap = {};
  computed.forEach(t => {
    const m = t.phase.match(/^(Phase \d+)\s+(.*)/);
    const master = m ? m[1].trim() : 'Other';
    const sub = m ? m[2].trim() : t.phase;
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
