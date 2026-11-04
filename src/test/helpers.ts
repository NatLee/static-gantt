import type { Task } from '@/types';

/** Build a task with sensible defaults; only the fields a test cares about need to be given. */
export function task(id: string, fields: Partial<Task> = {}): Task {
  return {
    id,
    phase: 'Phase 1 Work',
    name: id,
    duration: 1,
    status: 'planned',
    isCritical: false,
    ...fields,
  };
}

/** Run `fn` with the process time zone set to `tz`, then restore it. Node re-reads TZ on assignment. */
export function inTimeZone<T>(tz: string, fn: () => T): T {
  const previous = process.env.TZ;
  process.env.TZ = tz;
  try {
    return fn();
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
}

/**
 * Zones the date tests run in: one ahead of UTC (where the app was written), UTC itself, and one
 * behind UTC — the side where a UTC-midnight date shows up as the previous local day.
 */
export const TEST_TIME_ZONES = ['Asia/Taipei', 'UTC', 'America/New_York'] as const;
