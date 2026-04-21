'use client';

import React, { useMemo, useState } from 'react';
import { ComputedTask, GanttAction } from '@/types';
import { PIXELS_PER_DAY, ROW_HEIGHT, Z } from '@/lib/ganttLayout';
import type { VirtualWindow } from '@/hooks/useVirtualRows';
import { buildDepPath, buildArrowHead } from '@/lib/depPath';
import { offsetToDate, formatISO } from '@/lib/dateUtils';

interface DependencyLinesProps {
  computed: ComputedTask[];
  zoomScale: number;
  timelineStartDay: number;
  totalWidth: number;
  totalHeight: number;
  virtualWindow: VirtualWindow;
  dispatch: React.Dispatch<GanttAction>;
}

interface DepPath {
  d: string;
  isCritical: boolean;
  arrows: string[];
  taskId: string;
  predId: string;
  succName: string;
  predName: string;
  succStartDayOffset: number;
  sx: number;
  sy: number;
  ex: number;
  ey: number;
}

export default function DependencyLines({
  computed,
  zoomScale,
  timelineStartDay,
  totalWidth,
  totalHeight,
  virtualWindow,
  dispatch,
}: DependencyLinesProps) {
  const ppd = PIXELS_PER_DAY * zoomScale;
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const paths = useMemo<DepPath[]>(() => {
    const result: DepPath[] = [];
    const lookup = new Map<string, ComputedTask>();
    computed.forEach((t) => lookup.set(t.id, t));

    computed.forEach((task) => {
      if (!task.after || task.rowIndex === undefined || Number.isNaN(task.startDayOffset)) return;

      const taskRowIndex = task.rowIndex;
      const pres = task.after.split(',').map((s) => s.trim()).filter(Boolean);

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

        result.push({
          d: buildDepPath(sx, sy, ex, ey),
          isCritical: task.isCritical && pre.isCritical,
          arrows: buildArrowHead(ex, ey),
          taskId: task.id,
          predId: preId,
          succName: task.name,
          predName: pre.name,
          succStartDayOffset: task.startDayOffset,
          sx,
          sy,
          ex,
          ey,
        });
      });
    });

    return result;
  }, [computed, ppd, timelineStartDay, virtualWindow]);

  const handleRemove = (taskId: string, predId: string, succStartDayOffset: number) => {
    const fallbackStartDate = formatISO(offsetToDate(succStartDayOffset));
    dispatch({ type: 'REMOVE_TASK_DEPENDENCY', taskId, predecessorId: predId, fallbackStartDate });
    setHoveredIdx(null);
  };

  return (
    <svg
      data-role="dep-svg"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: totalWidth,
        height: totalHeight,
        pointerEvents: 'none',
        zIndex: Z.deps,
        overflow: 'visible',
      }}
    >
      {paths.map((p, i) => {
        const isHovered = hoveredIdx === i;
        const baseStroke = p.isCritical ? '#f87171' : 'rgba(148,163,184,0.35)';
        const stroke = isHovered ? '#ef4444' : baseStroke;
        const strokeWidth = isHovered ? 2.5 : p.isCritical ? 2 : 1.5;
        const dash = p.isCritical || isHovered ? undefined : '4 2';

        return (
          <g
            key={`${p.taskId}-${p.predId}`}
            data-dep-pred={p.predId}
            data-dep-succ={p.taskId}
            data-sx={p.sx}
            data-sy={p.sy}
            data-ex={p.ex}
            data-ey={p.ey}
          >
            {/* Visible dep path */}
            <path
              data-role="line"
              d={p.d}
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={dash}
            />
            {p.arrows.map((ad, j) => (
              <path
                key={j}
                data-role={`arrow-${j}`}
                d={ad}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
              />
            ))}
            {/* Wider invisible hit area for easier targeting */}
            <path
              data-role="hit"
              d={p.d}
              fill="none"
              stroke="transparent"
              strokeWidth={12}
              style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx((prev) => (prev === i ? null : prev))}
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(p.taskId, p.predId, p.succStartDayOffset);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRemove(p.taskId, p.predId, p.succStartDayOffset);
              }}
            >
              <title>{`${p.predName} → ${p.succName} · click to remove`}</title>
            </path>
          </g>
        );
      })}
    </svg>
  );
}
