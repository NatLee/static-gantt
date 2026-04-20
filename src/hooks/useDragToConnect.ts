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

export type ConnectDirection = 'forward' | 'backward';

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
  const [cycleBlocked, setCycleBlocked] = useState(false);
  const [rejectReason, setRejectReason] = useState<string | null>(null);

  const stateRef = useRef<{
    sourceId: string;
    sx: number;
    sy: number;
    direction: ConnectDirection;
  } | null>(null);

  const hoveredRef = useRef<string | null>(null);

  const startConnect = useCallback(
    (
      sourceTaskId: string,
      clientX: number,
      clientY: number,
      direction: ConnectDirection = 'forward'
    ) => {
      const source = taskMap.get(sourceTaskId);
      const gridEl = gridRef.current;
      if (!source || source.rowIndex === undefined || !gridEl) return;

      const ppd = PIXELS_PER_DAY * zoomScale;
      const sx =
        direction === 'forward'
          ? (source.endDayOffset - timelineStartDay) * ppd
          : (source.startDayOffset - timelineStartDay) * ppd;
      const sy = source.rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;

      const rect = gridEl.getBoundingClientRect();
      const ex = clientX - rect.left;
      const ey = clientY - rect.top;

      stateRef.current = { sourceId: sourceTaskId, sx, sy, direction };
      hoveredRef.current = null;
      setIsConnecting(true);
      setPreviewLine({ sx, sy, ex, ey });
      setHoveredTargetId(null);
      setCycleBlocked(false);
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
        const validTarget = targetId && targetId !== st.sourceId ? targetId : null;
        hoveredRef.current = validTarget;
        setHoveredTargetId(validTarget);
        if (validTarget) {
          const [pred, succ] =
            st.direction === 'forward'
              ? [st.sourceId, validTarget]
              : [validTarget, st.sourceId];
          setCycleBlocked(wouldCreateCycle(tasks, pred, succ));
        } else {
          setCycleBlocked(false);
        }
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
      setCycleBlocked(false);

      if (!st || !target) return;
      if (target === st.sourceId) return;

      const [pred, succ] =
        st.direction === 'forward' ? [st.sourceId, target] : [target, st.sourceId];

      if (wouldCreateCycle(tasks, pred, succ)) {
        setRejectReason('cycle');
        setTimeout(() => setRejectReason(null), 2000);
        return;
      }

      dispatch({ type: 'ADD_TASK_DEPENDENCY', taskId: succ, predecessorId: pred });
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [isConnecting, tasks, dispatch, gridRef]);

  return { startConnect, isConnecting, previewLine, hoveredTargetId, cycleBlocked, rejectReason };
}
