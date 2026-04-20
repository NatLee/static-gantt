import { Task } from '@/types';

export function rewireDependencies(tasks: Task[], deletedIds: string | string[]): Task[] {
  const deletedSet = new Set(Array.isArray(deletedIds) ? deletedIds : [deletedIds]);
  const result = tasks.map(t => ({ ...t }));

  function resolveAlive(taskId: string, visited: Set<string> = new Set()): { afterIds: string[]; start: string | null } {
    if (visited.has(taskId)) return { afterIds: [], start: null };
    visited.add(taskId);
    const t = result.find(r => r.id === taskId);
    if (!t) return { afterIds: [], start: null };
    if (!deletedSet.has(taskId)) return { afterIds: [taskId], start: null };
    if (t.after) {
      const pres = t.after.split(',').map(s => s.trim());
      const alive: string[] = [];
      let inheritStart: string | null = null;
      for (const pid of pres) {
        const res = resolveAlive(pid, new Set(visited));
        alive.push(...res.afterIds);
        if (res.start) inheritStart = res.start;
      }
      return { afterIds: [...new Set(alive)], start: inheritStart };
    }
    if (t.start) return { afterIds: [], start: t.start };
    return { afterIds: [], start: null };
  }

  result.forEach(t => {
    if (deletedSet.has(t.id) || !t.after) return;
    const parts = t.after.split(',').map(s => s.trim());
    const newParts: string[] = [];
    let inheritStart: string | null = null;
    for (const pid of parts) {
      if (deletedSet.has(pid)) {
        const res = resolveAlive(pid, new Set());
        newParts.push(...res.afterIds);
        if (res.start) inheritStart = res.start;
      } else {
        newParts.push(pid);
      }
    }
    const unique = [...new Set(newParts)];
    if (unique.length > 0) {
      t.after = unique.join(',');
    } else if (inheritStart) {
      t.start = inheritStart;
      delete t.after;
    } else {
      delete t.after;
    }
  });

  return result.filter(t => !deletedSet.has(t.id));
}
