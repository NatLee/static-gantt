'use client';

import React, { useRef, useCallback } from 'react';
import { ComputedTask, GanttState, GanttAction } from '@/types';
import { offsetToDate, formatDate, formatISO } from '@/lib/dateUtils';
import { PIXELS_PER_DAY, ROW_HEIGHT, Z } from '@/lib/ganttLayout';
import type { VirtualWindow } from '@/hooks/useVirtualRows';

interface TaskBarContainerProps {
  computed: ComputedTask[];
  state: GanttState;
  dispatch: React.Dispatch<GanttAction>;
  virtualWindow: VirtualWindow;
}

function statusClass(status: string): string {
  if (status === 'done') return 'status-done';
  if (status === 'in-progress') return 'status-progress';
  return 'status-planned';
}

export default function TaskBarContainer({
  computed,
  state,
  dispatch,
  virtualWindow,
}: TaskBarContainerProps) {
  const ppd = PIXELS_PER_DAY * state.zoomScale;
  const { timelineStartDay } = state;

  const barRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragState = useRef<{
    type: 'move' | 'resize';
    taskId: string;
    startX: number;
    origLeft: number;
    origWidth: number;
    origStartDayOffset: number;
    origDuration: number;
  } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, task: ComputedTask, type: 'move' | 'resize') => {
      // Only allow move for tasks with a fixed start (not pure dependency-based)
      if (type === 'move' && !task.start) return;
      e.preventDefault();
      e.stopPropagation();

      const barEl = barRefs.current[task.id];
      if (!barEl) return;

      const barWrapperEl = barEl.parentElement;
      if (!barWrapperEl) return;

      const origLeft = parseFloat(barWrapperEl.style.left) || 0;
      const origWidth = barEl.offsetWidth;

      dragState.current = {
        type,
        taskId: task.id,
        startX: e.clientX,
        origLeft,
        origWidth,
        origStartDayOffset: task.startDayOffset,
        origDuration: task.duration,
      };

      if (type === 'move') {
        barEl.classList.add('dragging');
      }

      const handleMouseMove = (ev: MouseEvent) => {
        const ds = dragState.current;
        if (!ds) return;
        const dx = ev.clientX - ds.startX;

        if (ds.type === 'move') {
          const wrapper = barRefs.current[ds.taskId]?.parentElement;
          if (wrapper) {
            wrapper.style.left = `${ds.origLeft + dx}px`;
          }
        } else {
          const bar = barRefs.current[ds.taskId];
          if (bar) {
            const newWidth = Math.max(12, ds.origWidth + dx);
            bar.style.width = `${newWidth}px`;
          }
        }
      };

      const handleMouseUp = (ev: MouseEvent) => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        const ds = dragState.current;
        if (!ds) return;
        dragState.current = null;

        const dx = ev.clientX - ds.startX;
        const dayDelta = Math.round(dx / ppd);

        const bar = barRefs.current[ds.taskId];
        if (bar) {
          bar.classList.remove('dragging');
        }

        if (ds.type === 'move') {
          if (dayDelta !== 0) {
            const newStartOffset = ds.origStartDayOffset + dayDelta;
            const newDate = offsetToDate(newStartOffset);
            dispatch({ type: 'MOVE_TASK', taskId: ds.taskId, newStartDate: formatISO(newDate) });
          } else {
            // Reset position
            const wrapper = bar?.parentElement;
            if (wrapper) {
              wrapper.style.left = `${ds.origLeft}px`;
            }
          }
        } else {
          if (dayDelta !== 0) {
            const newDuration = Math.max(1, ds.origDuration + dayDelta);
            dispatch({ type: 'RESIZE_TASK', taskId: ds.taskId, newDuration });
          } else {
            // Reset width
            if (bar) {
              bar.style.width = `${ds.origWidth}px`;
            }
          }
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [ppd, dispatch]
  );

  const visibleTasks = computed.filter((t) => {
    if (t.rowIndex === undefined || t.startDayOffset < 0) return false;
    if (!virtualWindow.enabled) return true;
    return t.rowIndex >= virtualWindow.startIndex && t.rowIndex <= virtualWindow.endIndex;
  });

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: Z.bars }}>
      {visibleTasks.map((task) => {
        const left = (task.startDayOffset - timelineStartDay) * ppd;
        const width = Math.max(task.duration * ppd, 12);
        const top = (task.rowIndex ?? 0) * ROW_HEIGHT;

        const endDate = offsetToDate(task.endDayOffset);

        return (
          <div
            key={task.id}
            style={{
              position: 'absolute',
              top,
              left: 0,
              width: '100%',
              height: ROW_HEIGHT,
              pointerEvents: 'none',
            }}
          >
            <div
              className="bar-wrapper"
              style={{
                left,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                height: '100%',
              }}
            >
              {/* Add before button */}
              <div
                className="bar-add-btn left"
                style={{ pointerEvents: 'auto' }}
                onClick={() =>
                  dispatch({
                    type: 'OPEN_DIALOG',
                    dialog: {
                      type: 'add-before-task',
                      context: { targetTaskId: task.id, phase: task.phase },
                    },
                  })
                }
              >
                +
              </div>

              {/* Task bar */}
              <div
                ref={(el) => {
                  barRefs.current[task.id] = el;
                }}
                className={`task-bar ${statusClass(task.status)} ${
                  task.isCritical ? 'ring-[2px] ring-red-400' : ''
                }`}
                style={{
                  width,
                  cursor: task.start ? 'grab' : 'default',
                  position: 'relative',
                  pointerEvents: 'auto',
                  zIndex: task.isCritical ? Z.barsHover : Z.bars,
                }}
                onMouseDown={(e) => {
                  // Don't initiate drag if clicking on resize handle
                  if ((e.target as HTMLElement).classList.contains('resize-handle')) return;
                  handleMouseDown(e, task, 'move');
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: 'OPEN_TASK_EDITOR', taskId: task.id });
                }}
              >
                <span className="task-bar-text" style={{ fontSize: 10, fontWeight: 700, pointerEvents: 'none', userSelect: 'none' }}>
                  {width > 24 ? `${task.duration}d` : ''}
                </span>

                {/* Resize handle */}
                <div
                  className="resize-handle"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown(e, task, 'resize');
                  }}
                />
              </div>

              {/* Add after button */}
              <div
                className="bar-add-btn right"
                style={{ pointerEvents: 'auto' }}
                onClick={() =>
                  dispatch({
                    type: 'OPEN_DIALOG',
                    dialog: {
                      type: 'add-after-task',
                      context: { targetTaskId: task.id, phase: task.phase },
                    },
                  })
                }
              >
                +
              </div>

              {/* Date label after bar */}
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 10,
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                {formatDate(endDate)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
