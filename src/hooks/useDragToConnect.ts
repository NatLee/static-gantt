'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Task, GanttAction, ComputedTask } from '@/types';
import { PIXELS_PER_DAY, ROW_HEIGHT } from '@/lib/ganttLayout';
import { wouldCreateCycle } from '@/lib/cycleCheck';

export interface PreviewLine {
  sx: number;
  sy: number;
  ex: number;
  ey: number;
}

interface UseDragToConnectArgs {
  tasks: Task[];
  taskMap: Map<string, ComputedTask>;
  dispatch: React.Dispatch<GanttAction>;
  zoomScale: number;
  timelineStartDay: number;
  gridRef: React.RefObject<HTMLDivElement | null>;
}

export function useDragToConnect({
  tasks,
  taskMap,
  dispatch,
  zoomScale,
  timelineStartDay,
  gridRef,
}: UseDragToConnectArgs) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [previewLine, setPreviewLine] = useState<PreviewLine | null>(null);
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string | null>(null);

  const stateRef = useRef<{
    sourceId: string;
    sx: number;
    sy: number;
  } | null>(null);

  const hoveredRef = useRef<string | null>(null);

  const startConnect = useCallback(
    (e: React.MouseEvent, sourceTaskId: string) => {
      e.preventDefault();
      e.stopPropagation();

      const source = taskMap.get(sourceTaskId);
      const gridEl = gridRef.current;
      if (!source || source.rowIndex === undefined || !gridEl) return;

      const ppd = PIXELS_PER_DAY * zoomScale;
      const sx = (source.endDayOffset - timelineStartDay) * ppd;
      const sy = source.rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;

      const rect = gridEl.getBoundingClientRect();
      const ex = e.clientX - rect.left;
      const ey = e.clientY - rect.top;

      stateRef.current = { sourceId: sourceTaskId, sx, sy };
      hoveredRef.current = null;
      setIsConnecting(true);
      setPreviewLine({ sx, sy, ex, ey });
      setHoveredTargetId(null);
      setRejectReason(null);
    },
    [taskMap, zoomScale, timelineStartDay, gridRef]
  );

  useEffect(() => {
    if (!isConnecting) return;

    const handleMove = (ev: MouseEvent) => {
      const st = stateRef.current;
      const gridEl = gridRef.current;
      if (!st || !gridEl) return;

      const rect = gridEl.getBoundingClientRect();
      const ex = ev.clientX - rect.left;
      const ey = ev.clientY - rect.top;

      setPreviewLine({ sx: st.sx, sy: st.sy, ex, ey });

      const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
      const barEl = el?.closest('[data-task-id]') as HTMLElement | null;
      const targetId = barEl?.dataset.taskId ?? null;
      if (targetId !== hoveredRef.current) {
        hoveredRef.current = targetId && targetId !== st.sourceId ? targetId : null;
        setHoveredTargetId(hoveredRef.current);
      }
    };

    const handleUp = () => {
      const st = stateRef.current;
      const target = hoveredRef.current;
      stateRef.current = null;
      hoveredRef.current = null;
      setIsConnecting(false);
      setPreviewLine(null);
      setHoveredTargetId(null);

      if (!st || !target) return;
      if (target === st.sourceId) return;

      if (wouldCreateCycle(tasks, st.sourceId, target)) {
        setRejectReason('cycle');
        setTimeout(() => setRejectReason(null), 2000);
        return;
      }

      dispatch({ type: 'ADD_TASK_DEPENDENCY', taskId: target, predecessorId: st.sourceId });
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [isConnecting, tasks, dispatch, gridRef]);

  return { startConnect, isConnecting, previewLine, hoveredTargetId, rejectReason };
}
