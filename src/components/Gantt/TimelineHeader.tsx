'use client';

import React, { useMemo } from 'react';
import { offsetToCalendar, offsetToDate, formatDateFull } from '@/lib/dateUtils';
import { useI18n } from '@/i18n/I18nProvider';

import { PIXELS_PER_DAY } from '@/lib/ganttLayout';

interface TimelineHeaderProps {
  timelineStartDay: number;
  timelineEndDay: number;
  zoomScale: number;
  totalWidth: number;
}

export default function TimelineHeader({
  timelineStartDay,
  timelineEndDay,
  zoomScale,
  totalWidth,
}: TimelineHeaderProps) {
  const { locale } = useI18n();
  const ppd = PIXELS_PER_DAY * zoomScale;
  const totalDays = timelineEndDay - timelineStartDay;

  const monthCells = useMemo(() => {
    // Locale-aware short month name (e.g. "Mar" / "3月" / "3月") for the narrow header.
    // Days are UTC-midnight dates (see dateUtils), so format them in UTC too.
    const monthFmt = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
    const monthShort = (year: number, month: number) => monthFmt.format(new Date(Date.UTC(year, month, 1)));
    const cells: { label: string; left: number; width: number; idx: number }[] = [];
    let curMonth = -1;
    let curYear = -1;
    let monthStart = 0;

    for (let d = 0; d <= totalDays; d++) {
      const { month: m, year: y } = offsetToCalendar(timelineStartDay + d);

      if (m !== curMonth || y !== curYear) {
        if (curMonth !== -1) {
          cells.push({
            label:
              ppd >= 8
                ? `${curYear} / ${String(curMonth + 1).padStart(2, '0')}`
                : monthShort(curYear, curMonth),
            left: monthStart * ppd,
            width: (d - monthStart) * ppd,
            idx: cells.length,
          });
        }
        curMonth = m;
        curYear = y;
        monthStart = d;
      }
    }
    // Last month
    if (curMonth !== -1) {
      cells.push({
        label:
          ppd >= 8
            ? `${curYear} / ${String(curMonth + 1).padStart(2, '0')}`
            : monthShort(curYear, curMonth),
        left: monthStart * ppd,
        width: (totalDays - monthStart) * ppd,
        idx: cells.length,
      });
    }

    return cells;
  }, [timelineStartDay, totalDays, ppd, locale]);

  const dayOrWeekCells = useMemo(() => {
    if (ppd >= 15) {
      // Individual day cells
      const cells: { label: string; left: number; width: number; isWeekend: boolean }[] = [];
      for (let d = 0; d < totalDays; d++) {
        const { day, weekday: dow } = offsetToCalendar(timelineStartDay + d);
        cells.push({
          label: String(day),
          left: d * ppd,
          width: ppd,
          isWeekend: dow === 0 || dow === 6,
        });
      }
      return { type: 'day' as const, cells };
    } else {
      // Week blocks
      const cells: { label: string; left: number; width: number }[] = [];
      let weekStart = 0;
      for (let d = 0; d < totalDays; d++) {
        const { weekday: dow } = offsetToCalendar(timelineStartDay + d);
        if (dow === 1 && d > 0) {
          const startDate = offsetToDate(timelineStartDay + weekStart);
          cells.push({
            label: formatDateFull(startDate).slice(5),
            left: weekStart * ppd,
            width: (d - weekStart) * ppd,
          });
          weekStart = d;
        }
      }
      // Last week
      if (weekStart < totalDays) {
        const startDate = offsetToDate(timelineStartDay + weekStart);
        cells.push({
          label: formatDateFull(startDate).slice(5),
          left: weekStart * ppd,
          width: (totalDays - weekStart) * ppd,
        });
      }
      return { type: 'week' as const, cells };
    }
  }, [timelineStartDay, totalDays, ppd]);

  return (
    <div className="sticky-header" style={{ height: 52, width: totalWidth, display: 'flex', flexDirection: 'column' }}>
      {/* Month row */}
      <div style={{ position: 'relative', height: 26, width: totalWidth, overflow: 'hidden' }}>
        {monthCells.map((cell) => (
          <div
            key={`m-${cell.idx}`}
            style={{
              position: 'absolute',
              left: cell.left,
              width: cell.width,
              height: 26,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.5px',
              color: 'var(--text-secondary)',
              borderRight: '1px solid var(--border-color)',
              borderBottom: '1px solid var(--border-color)',
              background: cell.idx % 2 === 0 ? 'rgba(99,102,241,0.04)' : 'transparent',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {cell.width > 40 ? cell.label : ''}
          </div>
        ))}
      </div>

      {/* Day/Week row */}
      <div style={{ position: 'relative', height: 26, width: totalWidth, overflow: 'hidden' }}>
        {dayOrWeekCells.type === 'day'
          ? dayOrWeekCells.cells.map((cell, i) => (
              <div
                key={`d-${i}`}
                style={{
                  position: 'absolute',
                  left: cell.left,
                  width: cell.width,
                  height: 26,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 500,
                  color: cell.isWeekend ? 'rgba(239,68,68,0.6)' : 'var(--text-secondary)',
                  background: cell.isWeekend ? 'rgba(239,68,68,0.05)' : 'transparent',
                  borderRight: '1px solid var(--border-color)',
                  overflow: 'hidden',
                }}
              >
                {cell.width >= 12 ? cell.label : ''}
              </div>
            ))
          : dayOrWeekCells.cells.map((cell, i) => (
              <div
                key={`w-${i}`}
                style={{
                  position: 'absolute',
                  left: cell.left,
                  width: cell.width,
                  height: 26,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  borderRight: '1px solid var(--border-color)',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {cell.width > 30 ? cell.label : ''}
              </div>
            ))}
      </div>
    </div>
  );
}
