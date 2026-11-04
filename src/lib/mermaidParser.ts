import { Task, TaskStatus } from '@/types';
import { formatAfter } from './dependencies';
import {
  AFTER_KEYWORD,
  CRITICAL_FLAG,
  MILESTONE_FLAG,
  STATUS_FLAGS,
  TASK_FLAGS,
  isHeaderOrComment,
  sectionName,
} from './mermaidSyntax';

/** A milestone as written in Mermaid. Colours are not part of the syntax; see applyMermaid. */
export interface ParsedMilestone {
  id: string;
  name: string;
  date: string;
}

export interface ParsedMermaid {
  tasks: Task[];
  milestones: ParsedMilestone[];
}

/** Days per Mermaid duration unit; other units (h, m, …) count as days, as before. */
const DAYS_PER_UNIT: Record<string, number> = { d: 1, w: 7 };
const DURATION_RE = /^(\d+)\s*([a-zA-Z]?)$/;

/**
 * Read a Mermaid gantt chart. Task lines look like
 *   Name :[crit, ][done|active, ][milestone, ]id, (YYYY-MM-DD | after id1 [id2 …]), <n>d|<n>w
 * Tasks outside a section are ignored (every task needs a phase). Milestones with a date become
 * milestones wherever they are; a milestone placed with `after` stays a zero-day task, because a
 * milestone marker needs a fixed date.
 */
export function parseMermaid(code: string): ParsedMermaid {
  const tasks: Task[] = [];
  const milestones: ParsedMilestone[] = [];
  let currentSection = '';

  for (const line of code.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || isHeaderOrComment(trimmed)) continue;

    const section = sectionName(trimmed);
    if (section !== null) {
      currentSection = section;
      continue;
    }

    const taskMatch = trimmed.match(/^(.+?)\s*:(.*?)\s*$/);
    if (!taskMatch) continue;
    const name = taskMatch[1].trim();
    const parts = taskMatch[2].split(',').map(s => s.trim());
    const flags = new Set(parts.filter(p => TASK_FLAGS.includes(p)));
    const values = parts.filter(p => !TASK_FLAGS.includes(p));
    // Need at least an id and a duration ("id, 5d"); "id, 2026-03-01" without a duration is skipped.
    if (!name || values.length < 2) continue;
    if (values.length === 2 && !DURATION_RE.test(values[1])) continue;
    const isCritical = flags.has(CRITICAL_FLAG);
    const isMilestone = flags.has(MILESTONE_FLAG);
    const status: TaskStatus = STATUS_FLAGS.find(([flag]) => flags.has(flag))?.[1] ?? 'planned';

    const id = values[0];
    let start = '';
    let after: string | undefined;
    let duration: string;
    if (values.length >= 3) {
      duration = values[2];
      const when = values[1];
      if (when.startsWith(`${AFTER_KEYWORD} `)) {
        // Mermaid allows several predecessors: "after a b c"
        after = formatAfter(when.slice(AFTER_KEYWORD.length).trim().split(/\s+/));
      } else {
        start = when;
      }
    } else {
      duration = values[1];
    }

    if (isMilestone && start) {
      milestones.push({ id, name, date: start });
      continue;
    }
    if (!currentSection) continue;

    const durMatch = duration.match(/(\d+)\s*([a-zA-Z]?)/);
    const durDays = durMatch ? parseInt(durMatch[1], 10) * (DAYS_PER_UNIT[durMatch[2].toLowerCase()] ?? 1) : 1;

    const task: Task = { id, phase: currentSection, name, duration: durDays, isCritical, status };
    if (start) task.start = start;
    else if (after) task.after = after;
    tasks.push(task);
  }

  return { tasks, milestones };
}
