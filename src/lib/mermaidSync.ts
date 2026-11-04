import { Milestone, Task } from '@/types';
import { MS_COLORS } from '@/data/defaultProject';
import type { ParsedMermaid } from './mermaidParser';

/**
 * Task fields Mermaid has no syntax for. When the text comes back from Mermaid mode, tasks that
 * still have the same id keep these; without this, one trip through Mermaid mode erased every
 * task's progress, colour, assignee, tags and description.
 */
const FIELDS_NOT_IN_MERMAID = ['progress', 'color', 'tags', 'assignee', 'description'] as const;

export interface ProjectContent {
  tasks: Task[];
  milestones: Milestone[];
}

/** Turn parsed Mermaid text into the project's tasks and milestones, keeping what Mermaid can't hold. */
export function applyMermaid(previous: ProjectContent, parsed: ParsedMermaid): ProjectContent {
  const prevTasks = new Map(previous.tasks.map(t => [t.id, t]));
  const tasks = parsed.tasks.map(t => {
    const prev = prevTasks.get(t.id);
    if (!prev) return t;
    const kept: Partial<Task> = {};
    for (const field of FIELDS_NOT_IN_MERMAID) {
      if (prev[field] !== undefined) Object.assign(kept, { [field]: prev[field] });
    }
    return { ...kept, ...t };
  });

  // Milestone colours are not part of the syntax either: keep them by id, and give new ones the
  // next colour in the palette.
  const prevMilestones = new Map(previous.milestones.map(m => [m.id, m]));
  const milestones = parsed.milestones.map((m, i) => {
    const colors = prevMilestones.get(m.id) ?? MS_COLORS[i % MS_COLORS.length];
    return { ...m, colorClass: colors.colorClass, lineClass: colors.lineClass };
  });

  return { tasks, milestones };
}
