'use client';

import React, { useMemo } from 'react';
import { isWeekendOffset, todayOffset } from '@/lib/dateUtils';

interface GridBackgroundProps {
  totalRows: number;
  totalWidth: number;
  totalHeight: number;
  timelineStartDay: number;
  timelineEndDay: number;
  ppd: number;
}

export default function GridBackground({
  totalWidth,
  totalHeight,
  timelineStartDay,
  timelineEndDay,
  ppd,
}: GridBackgroundProps) {
  const { weekendSpans, todayLeft } = useMemo(() => {
    const spans: { left: number; width: number }[] = [];
    let cursorStart: number | null = null;
    for (let d = timelineStartDay; d <= timelineEndDay; d++) {
      const isWeekend = isWeekendOffset(d);
      if (isWeekend && cursorStart === null) cursorStart = d;
      if ((!isWeekend || d === timelineEndDay) && cursorStart !== null) {
        const endDay = isWeekend ? d + 1 : d;
        spans.push({
          left: (cursorStart - timelineStartDay) * ppd,
          width: (endDay - cursorStart) * ppd,
        });
        cursorStart = null;
      }
    }
    const today = todayOffset();
    const todayLeft =
      today >= timelineStartDay && today <= timelineEndDay
        ? (today - timelineStartDay) * ppd
        : null;
    return { weekendSpans: spans, todayLeft };
  }, [timelineStartDay, timelineEndDay, ppd]);

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: totalWidth,
          height: totalHeight,
          pointerEvents: 'none',
          backgroundImage: [
            'linear-gradient(to right, var(--border-color) 1px, transparent 1px)',
            'linear-gradient(to bottom, var(--bg-row-even) 0, var(--bg-row-even) var(--row-height), var(--bg-row-odd) var(--row-height), var(--bg-row-odd) calc(2 * var(--row-height)))',
          ].join(','),
          backgroundSize: [
            'var(--col-width) 100%',
            '100% calc(2 * var(--row-height))',
          ].join(','),
          backgroundRepeat: 'repeat',
        }}
      />
      {weekendSpans.map((s, i) => (
        <div
          key={i}
          className="grid-col-weekend"
          style={{
            position: 'absolute',
            top: 0,
            left: s.left,
            width: s.width,
            height: totalHeight,
            pointerEvents: 'none',
          }}
        />
      ))}
      {todayLeft !== null && (
        <div
          className="grid-col-today"
          style={{
            position: 'absolute',
            top: 0,
            left: todayLeft,
            width: ppd,
            height: totalHeight,
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
}
