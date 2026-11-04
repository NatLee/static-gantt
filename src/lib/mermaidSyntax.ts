import type { TaskStatus } from '@/types';

/**
 * The parts of Mermaid's gantt syntax this app reads and writes, in one place so the parser, the
 * generator, the formatter and the editor's syntax colouring agree on them.
 * Reference: https://mermaid.js.org/syntax/gantt.html
 */

/** Statements that configure the chart rather than describe a task. */
export const HEADER_KEYWORDS = [
  'gantt',
  'title',
  'dateFormat',
  'axisFormat',
  'tickInterval',
  'weekday',
  'excludes',
  'includes',
  'todayMarker',
  'displayMode',
  'inclusiveEndDates',
  'topAxis',
  'accTitle',
  'accDescr',
] as const;

export const SECTION_KEYWORD = 'section';
export const COMMENT_PREFIX = '%%';

export const CRITICAL_FLAG = 'crit';
export const MILESTONE_FLAG = 'milestone';
/** Mermaid's status flags and the app status each stands for; when both are given, done wins. */
export const STATUS_FLAGS: ReadonlyArray<readonly [flag: string, status: TaskStatus]> = [
  ['done', 'done'],
  ['active', 'in-progress'],
];
export const FLAG_BY_STATUS: Record<TaskStatus, string | null> = { done: 'done', 'in-progress': 'active', planned: null };
/** Every word that can appear before the task id. */
export const TASK_FLAGS: readonly string[] = [CRITICAL_FLAG, MILESTONE_FLAG, ...STATUS_FLAGS.map(([flag]) => flag)];
export const AFTER_KEYWORD = 'after';

/** Section the generator puts milestones in (Mermaid draws them as diamonds there). */
export const MILESTONE_SECTION = 'Milestones';

const HEADER_RE = new RegExp(`^(?:${HEADER_KEYWORDS.join('|')})(?:\\s|:|$)`);

/** True for header statements and comments: lines that never describe a task. */
export function isHeaderOrComment(trimmedLine: string): boolean {
  return trimmedLine.startsWith(COMMENT_PREFIX) || HEADER_RE.test(trimmedLine);
}

/** The section name when the line opens a section, otherwise null. */
export function sectionName(trimmedLine: string): string | null {
  const m = trimmedLine.match(/^section\s+(.+)$/);
  return m ? m[1].trim() : null;
}
