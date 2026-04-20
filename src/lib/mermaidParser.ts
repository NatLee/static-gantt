import { Task, TaskStatus } from '@/types';

export function parseMermaidToTasks(code: string): Task[] {
  const lines = code.split('\n');
  const newTasks: Task[] = [];
  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();

    const secMatch = trimmed.match(/^section\s+(.+)/);
    if (secMatch) {
      currentSection = secMatch[1].trim();
      continue;
    }

    const taskMatch = trimmed.match(/^(.+?)\s*:(.*?)\s*$/);
    if (!taskMatch || !currentSection) continue;

    const name = taskMatch[1].trim();
    if (!name || name === 'gantt' || name.startsWith('title ') ||
        name.startsWith('dateFormat') || name.startsWith('axisFormat') ||
        name.startsWith('weekday')) continue;

    const parts = taskMatch[2].split(',').map(s => s.trim());
    if (parts.length < 3) continue;

    let isCritical = false;
    let isDone = false;
    let isActive = false;

    const valueParts: string[] = [];
    for (const p of parts) {
      if (p === 'crit') { isCritical = true; continue; }
      if (p === 'done') { isDone = true; continue; }
      if (p === 'active') { isActive = true; continue; }
      if (p === 'milestone') continue;
      valueParts.push(p);
    }

    if (valueParts.length < 2) continue;

    const id = valueParts[0];
    let start = '';
    let after = '';
    let duration = '';

    if (valueParts.length >= 3) {
      const secondPart = valueParts[1];
      if (secondPart.startsWith('after ')) {
        after = secondPart.replace('after ', '').trim();
        duration = valueParts[2];
      } else {
        start = secondPart;
        duration = valueParts[2];
      }
    } else {
      duration = valueParts[1];
    }

    const durMatch = duration.match(/(\d+)\s*([wdWD]?)/);
    let durDays = durMatch ? parseInt(durMatch[1]) : 1;
    if (durMatch && durMatch[2].toLowerCase() === 'w') durDays *= 7;

    let status: TaskStatus = 'planned';
    if (isDone) status = 'done';
    else if (isActive) status = 'in-progress';

    const task: Task = { id, phase: currentSection, name, duration: durDays, isCritical, status };
    if (start) task.start = start;
    else if (after) task.after = after;

    newTasks.push(task);
  }

  return newTasks;
}
