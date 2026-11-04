/**
 * Calendar maths for the chart.
 *
 * Every date in a project is a calendar day ("2026-03-05"), not a moment in time. Internally a day
 * is a whole-number offset from SCHEDULE_EPOCH, and a `Date` that stands for a day is always that
 * day at 00:00 UTC. Reading it back therefore uses the UTC getters, so a day stays the same day in
 * every time zone (local getters turn 2026-03-01 00:00 UTC into Feb 28 anywhere west of UTC).
 * Only "today" comes from the local clock: it is the viewer's own calendar date.
 */

const MS_PER_DAY = 86_400_000;

/**
 * Day 0 of every offset. Saved projects store timeline bounds and baselines as offsets from this
 * day, so it must never change.
 */
export const SCHEDULE_EPOCH = '2026-03-01';
const EPOCH_MS = Date.UTC(2026, 2, 1);

const ISO_DAY_RE = /^(\d{4})-(\d{2})-(\d{2})/;

/** Offset of a calendar day given as "YYYY-MM-DD" (anything after the date part is ignored). */
export function dateToOffset(isoDay: string): number {
  const m = isoDay.match(ISO_DAY_RE);
  const ms = m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : Date.parse(isoDay);
  return Math.round((ms - EPOCH_MS) / MS_PER_DAY);
}

/** The day at `offset`, as a Date at 00:00 UTC. Read it with the UTC getters or the helpers below. */
export function offsetToDate(offset: number): Date {
  return new Date(EPOCH_MS + offset * MS_PER_DAY);
}

/** "YYYY-MM-DD" for the day at `offset`. */
export function offsetToISO(offset: number): string {
  return formatISO(offsetToDate(offset));
}

/** Offset of the viewer's local calendar date at `now`. */
export function todayOffset(now: Date = new Date()): number {
  return (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - EPOCH_MS) / MS_PER_DAY;
}

/** The viewer's local calendar date at `now`, as "YYYY-MM-DD". */
export function todayISO(now: Date = new Date()): string {
  return offsetToISO(todayOffset(now));
}

export interface CalendarDay {
  year: number;
  /** 0 = January */
  month: number;
  day: number;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
}

export function offsetToCalendar(offset: number): CalendarDay {
  const d = offsetToDate(offset);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate(), weekday: d.getUTCDay() };
}

export function isWeekendOffset(offset: number): boolean {
  const { weekday } = offsetToCalendar(offset);
  return weekday === 0 || weekday === 6;
}

/** "M/D" for a day Date (00:00 UTC). */
export function formatDate(d: Date): string {
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

/** "YYYY/MM/DD" for a day Date (00:00 UTC). */
export function formatDateFull(d: Date): string {
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${d.getUTCFullYear()}/${mm}/${dd}`;
}

/** "YYYY-MM-DD" for a day Date (00:00 UTC). */
export function formatISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function genId(): string {
  return 't' + Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(-2);
}
