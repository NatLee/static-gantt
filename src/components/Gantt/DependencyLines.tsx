'use client';

import React, { useMemo } from 'react';
import { ComputedTask } from '@/types';
import { PIXELS_PER_DAY, ROW_HEIGHT, Z } from '@/lib/ganttLayout';
import type { VirtualWindow } from '@/hooks/useVirtualRows';

interface DependencyLinesProps {
  computed: ComputedTask[];
  taskMap: Map<string, ComputedTask>;
  zoomScale: number;
  timelineStartDay: number;
  totalWidth: number;
  totalHeight: number;
  virtualWindow: VirtualWindow;
}

export default function DependencyLines({
  computed,
  taskMap,
  zoomScale,
  timelineStartDay,
  totalWidth,
  totalHeight,
  virtualWindow,
}: DependencyLinesProps) {
  const ppd = PIXELS_PER_DAY * zoomScale;

  const paths = useMemo(() => {
    const result: { d: string; isCritical: boolean; arrows: string[] }[] = [];

    computed.forEach((task) => {
      if (!task.after || task.rowIndex === undefined || task.startDayOffset < 0) return;

      const taskRowIndex = task.rowIndex;
      const pres = task.after.split(',').map((s) => s.trim());

      pres.forEach((preId) => {
        const pre = taskMap.get(preId);
        if (!pre || pre.rowIndex === undefined || pre.startDayOffset < 0) return;

        if (virtualWindow.enabled) {
          const minRow = Math.min(pre.rowIndex, taskRowIndex);
          const maxRow = Math.max(pre.rowIndex, taskRowIndex);
          if (maxRow < virtualWindow.startIndex || minRow > virtualWindow.endIndex) return;
        }

        const sx = (pre.endDayOffset - timelineStartDay) * ppd;
        const sy = pre.rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
        const ex = (task.startDayOffset - timelineStartDay) * ppd;
        const ey = taskRowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;

        const gap = ex - sx;
        let d: string;

        if (gap > 20) {
          // Right angle path
          const mx = sx + gap / 2;
          d = `M ${sx} ${sy} L ${mx} ${sy} L ${mx} ${ey} L ${ex} ${ey}`;
        } else {
          // Bezier curve for tight spaces
          const cpOffset = Math.max(30, Math.abs(ey - sy) * 0.4);
          d = `M ${sx} ${sy} C ${sx + cpOffset} ${sy}, ${ex - cpOffset} ${ey}, ${ex} ${ey}`;
        }

        // Arrowhead
        const arrowSize = 5;
        const arrows = [
          `M ${ex} ${ey} L ${ex - arrowSize} ${ey - arrowSize}`,
          `M ${ex} ${ey} L ${ex - arrowSize} ${ey + arrowSize}`,
        ];

        result.push({
          d,
          isCritical: task.isCritical && pre.isCritical,
          arrows,
        });
      });
    });

    return result;
  }, [computed, taskMap, ppd, timelineStartDay, virtualWindow]);

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
