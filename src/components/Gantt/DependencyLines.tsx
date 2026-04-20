'use client';

import React, { useMemo } from 'react';
import { ComputedTask } from '@/types';
import { PIXELS_PER_DAY, ROW_HEIGHT, Z } from '@/lib/ganttLayout';
import type { VirtualWindow } from '@/hooks/useVirtualRows';
import { buildDepPath, buildArrowHead } from '@/lib/depPath';

interface DependencyLinesProps {
  computed: ComputedTask[];
  zoomScale: number;
  timelineStartDay: number;
  totalWidth: number;
  totalHeight: number;
  virtualWindow: VirtualWindow;
}

export default function DependencyLines({
  computed,
  zoomScale,
  timelineStartDay,
  totalWidth,
  totalHeight,
  virtualWindow,
}: DependencyLinesProps) {
  const ppd = PIXELS_PER_DAY * zoomScale;

  const paths = useMemo(() => {
    const result: { d: string; isCritical: boolean; arrows: string[] }[] = [];
    const lookup = new Map<string, ComputedTask>();
    computed.forEach((t) => lookup.set(t.id, t));

    computed.forEach((task) => {
      if (!task.after || task.rowIndex === undefined || Number.isNaN(task.startDayOffset)) return;

      const taskRowIndex = task.rowIndex;
      const pres = task.after.split(',').map((s) => s.trim());

      pres.forEach((preId) => {
        const pre = lookup.get(preId);
        if (!pre || pre.rowIndex === undefined || Number.isNaN(pre.startDayOffset)) return;

        if (virtualWindow.enabled) {
          const minRow = Math.min(pre.rowIndex, taskRowIndex);
          const maxRow = Math.max(pre.rowIndex, taskRowIndex);
          if (maxRow < virtualWindow.startIndex || minRow > virtualWindow.endIndex) return;
        }

        const sx = (pre.endDayOffset - timelineStartDay) * ppd;
        const sy = pre.rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
        const ex = (task.startDayOffset - timelineStartDay) * ppd;
        const ey = taskRowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;

        const d = buildDepPath(sx, sy, ex, ey);
        const arrows = buildArrowHead(ex, ey);

        result.push({
          d,
          isCritical: task.isCritical && pre.isCritical,
          arrows,
        });
      });
    });

    return result;
  }, [computed, ppd, timelineStartDay, virtualWindow]);

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: totalWidth,
        height: totalHeight,
        pointerEvents: 'none',
        zIndex: Z.deps,
      }}
    >
      {paths.map((p, i) => (
        <g key={i}>
          <path
            d={p.d}
            fill="none"
            stroke={p.isCritical ? '#f87171' : 'rgba(148,163,184,0.35)'}
            strokeWidth={p.isCritical ? 2 : 1.5}
            strokeDasharray={p.isCritical ? undefined : '4 2'}
          />
          {p.arrows.map((ad, j) => (
            <path
              key={j}
              d={ad}
              fill="none"
              stroke={p.isCritical ? '#f87171' : 'rgba(148,163,184,0.35)'}
              strokeWidth={p.isCritical ? 2 : 1.5}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}
