import { Task, ComputedTask, HierarchyMap } from '@/types';
import { PROJECT_START_DATE } from '@/data/defaultProject';

const MS_PER_DAY = 86400000;

export function computeSchedule(tasks: Task[]): ComputedTask[] {
  const taskMap: Record<string, ComputedTask> = {};
  tasks.forEach(t => {
    taskMap[t.id] = { ...t, startDayOffset: -1, endDayOffset: -1 };
  });

  let done = false;
  let loops = 0;
  while (!done && loops < 100) {
    done = true;
    for (const id in taskMap) {
      const t = taskMap[id];
      if (t.startDayOffset >= 0) continue;

      if (t.start) {
        t.startDayOffset = Math.round(
          (new Date(t.start).getTime() - PROJECT_START_DATE.getTime()) / MS_PER_DAY
        );
        t.endDayOffset = t.startDayOffset + t.duration;
      } else if (t.after) {
        const pres = t.after.split(',').map(s => s.trim());
        let mx = -1;
        let ok = true;
        for (const pid of pres) {
          const p = taskMap[pid];
          if (p && p.endDayOffset >= 0) {
            mx = Math.max(mx, p.endDayOffset);
          } else {
            ok = false;
            break;
          }
        }
        if (ok && mx >= 0) {
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
    if (t.startDayOffset >= 0) minStart = Math.min(minStart, t.startDayOffset);
    if (t.endDayOffset >= 0) maxEnd = Math.max(maxEnd, t.endDayOffset);
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
