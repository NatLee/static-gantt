import { Milestone, Task } from '@/types';
import { parseAfter } from './dependencies';
import { AFTER_KEYWORD, CRITICAL_FLAG, FLAG_BY_STATUS, MILESTONE_FLAG, MILESTONE_SECTION } from './mermaidSyntax';

/** Task names are padded to this width so the colons line up in the editor. */
const NAME_COLUMN = 40;
const INDENT = '    ';

export interface MermaidSource {
  title: string;
  tasks: Task[];
  milestones?: Milestone[];
}

function taskLine(t: Task): string {
  const flags = [t.isCritical ? CRITICAL_FLAG : null, FLAG_BY_STATUS[t.status]].filter(Boolean);
  const preds = parseAfter(t.after);
  // Mermaid accepts several predecessors separated by spaces: "after a b".
  const when = t.start ? t.start : preds.length > 0 ? `${AFTER_KEYWORD} ${preds.join(' ')}` : null;
  const values = [t.id, when, `${t.duration}d`].filter(Boolean);
  return `${INDENT}${t.name.padEnd(NAME_COLUMN, ' ')}:${[...flags, ...values].join(', ')}`;
}

function milestoneLine(ms: Milestone): string {
  return `${INDENT}${ms.name.padEnd(NAME_COLUMN, ' ')}:${MILESTONE_FLAG}, ${ms.id}, ${ms.date}, 0d`;
}

/**
 * Write the project as a Mermaid gantt chart. Together with parseMermaid and applyMermaid this
 * round-trips everything Mermaid can express: phases, names, ids, start dates, every
 * predecessor, durations, critical/done/active flags and milestones.
 */
export function generateMermaid({ title, tasks, milestones = [] }: MermaidSource): string {
  let s = `gantt\n${INDENT}title ${title}\n${INDENT}dateFormat YYYY-MM-DD\n${INDENT}axisFormat %m/%d\n${INDENT}weekday monday\n\n`;
  let lastPhase: string | null = null;

  tasks.forEach(t => {
    if (t.phase !== lastPhase) {
      s += `${INDENT}section ${t.phase}\n`;
      lastPhase = t.phase;
    }
    s += taskLine(t) + '\n';
  });

  if (milestones.length > 0) {
    s += `${INDENT}section ${MILESTONE_SECTION}\n`;
    milestones.forEach(ms => {
      s += milestoneLine(ms) + '\n';
    });
  }

  return s;
}
