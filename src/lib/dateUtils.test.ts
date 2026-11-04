import { describe, expect, it } from 'vitest';
import {
  SCHEDULE_EPOCH,
  dateToOffset,
  formatDate,
  formatDateFull,
  isWeekendOffset,
  offsetToCalendar,
  offsetToDate,
  offsetToISO,
  todayISO,
  todayOffset,
} from './dateUtils';
import { computeSchedule, computeTimelineBounds } from './scheduler';
import { buildExcelRows } from './exportExcel';
import { buildDefaultProject } from './projectStorage';
import { defaultMilestones, defaultTasks } from '@/data/defaultProject';
import { TEST_TIME_ZONES, inTimeZone, task } from '@/test/helpers';

describe('the scheduling epoch', () => {
  it('stays 2026-03-01, because saved timelines and baselines are offsets from it', () => {
    expect(SCHEDULE_EPOCH).toBe('2026-03-01');
    expect(dateToOffset('2026-03-01')).toBe(0);
  });
});

// Every assertion below must hold wherever the viewer is. Before the fix, west of UTC (New York)
// every label showed the previous day and Monday counted as a weekend day.
describe.each(TEST_TIME_ZONES)('calendar days in %s', tz => {
  const run = <T,>(fn: () => T) => inTimeZone(tz, fn);

  it('converts between days and offsets without shifting', () => run(() => {
    expect(dateToOffset('2026-03-05')).toBe(4);
    expect(dateToOffset('2026-11-01')).toBe(245); // across the US daylight-saving switch
    expect(offsetToISO(245)).toBe('2026-11-01');
    expect(offsetToCalendar(0)).toEqual({ year: 2026, month: 2, day: 1, weekday: 0 });
  }));

  it('formats labels as the same calendar day', () => run(() => {
    expect(formatDate(offsetToDate(0))).toBe('3/1');
    expect(formatDateFull(offsetToDate(31))).toBe('2026/04/01');
  }));

  it('treats Saturday and Sunday as the weekend', () => run(() => {
    // 2026-03-01 is a Sunday, so offsets 0 (Sun), 6 (Sat) and 7 (Sun) are weekend days.
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(isWeekendOffset)).toEqual([true, false, false, false, false, false, true, true]);
  }));

  it('skips the weekend in working-day mode', () => run(() => {
    // Friday 2026-03-06 + 2 working days ends after Monday 03-09 (exclusive end Tuesday 03-10).
    const [a, b] = computeSchedule([
      task('a', { start: '2026-03-06', duration: 2 }),
      task('b', { after: 'a', duration: 1 }),
    ], { workingDaysOnly: true });
    expect(offsetToISO(a.endDayOffset)).toBe('2026-03-10');
    expect(offsetToISO(b.startDayOffset)).toBe('2026-03-10');
  }));

  it('puts "today" on the viewer\'s local calendar date at any hour', () => run(() => {
    // Local 00:30 and 23:30 on 2026-04-15. The old code rounded the elapsed milliseconds, so in
    // Taipei the evening rounded up to the 16th and in New York the morning did.
    for (const hour of [0, 12, 23]) {
      const now = new Date(2026, 3, 15, hour, 30);
      expect(todayISO(now)).toBe('2026-04-15');
      expect(todayOffset(now)).toBe(dateToOffset('2026-04-15'));
    }
  }));
});

describe('computeTimelineBounds', () => {
  it('covers tasks, milestones and today with padding on both sides', () => {
    const scheduled = computeSchedule([task('a', { start: '2026-03-11', duration: 5 })]);
    const bounds = computeTimelineBounds(scheduled, [{ date: '2026-04-30' }], new Date(2026, 2, 21));
    expect(bounds).toEqual({ startDay: 10 - 30, endDay: 60 + 60 });
  });

  it('gives the sample project the same bounds as the chart computes for it', () => {
    // buildDefaultProject used to measure milestones and today from the current date instead of
    // the scheduling epoch, so new projects opened with months of empty timeline on the left.
    const project = buildDefaultProject();
    const expected = computeTimelineBounds(computeSchedule(defaultTasks), defaultMilestones);
    expect({ startDay: project.state.timelineStartDay, endDay: project.state.timelineEndDay }).toEqual(expected);
  });
});

describe('buildExcelRows', () => {
  it('writes calendar dates and leaves them blank for tasks that cannot be scheduled', () => {
    const rows = buildExcelRows(computeSchedule([
      task('a', { start: '2026-03-02', duration: 3 }),
      task('b', { after: 'missing', duration: 1 }),
    ]), 'ALL');
    expect(rows[0]['Start Date']).toBe('2026-03-02');
    expect(rows[0]['End Date']).toBe('2026-03-05');
    expect(rows[1]['Start Date']).toBe('');
  });

  it('keeps only the filtered master phase', () => {
    const rows = buildExcelRows(computeSchedule([
      task('a', { phase: 'Phase 1 X', start: '2026-03-02' }),
      task('b', { phase: 'Phase 2 Y', start: '2026-03-02' }),
    ]), 'Phase 2');
    expect(rows.map(r => r['Task ID'])).toEqual(['b']);
  });
});
