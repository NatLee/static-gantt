import { Task } from '@/types';
import { parseAfter } from './dependencies';

export function wouldCreateCycle(tasks: Task[], predecessorId: string, successorId: string): boolean {
  if (predecessorId === successorId) return true;

  const afterMap = new Map<string, string[]>();
  tasks.forEach(t => {
    const preds = parseAfter(t.after);
    if (preds.length > 0) afterMap.set(t.id, preds);
  });

  const simulated = new Map(afterMap);
  const successorPreds = simulated.get(successorId) ?? [];
  if (!successorPreds.includes(predecessorId)) {
    simulated.set(successorId, [...successorPreds, predecessorId]);
  }

  const stack = [predecessorId];
  const seen = new Set<string>();
  while (stack.length) {
    const id = stack.pop()!;
    if (id === successorId) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    const preds = simulated.get(id);
    if (preds) stack.push(...preds);
  }
  return false;
}
