'use client';

import React, { useRef, useCallback } from 'react';
import { ComputedTask, GanttState, GanttAction, HierarchyMap } from '@/types';
import { offsetToDate, formatDate, formatISO } from '@/lib/dateUtils';
import { PIXELS_PER_DAY, ROW_HEIGHT, Z } from '@/lib/ganttLayout';
import type { VirtualWindow } from '@/hooks/useVirtualRows';
import { buildRowMap } from '@/hooks/useDragReorder';

interface TaskBarContainerProps {
  computed: ComputedTask[];
  state: GanttState;
  dispatch: React.Dispatch<GanttAction>;
  virtualWindow: VirtualWindow;
  hierarchy: HierarchyMap;
  onStartConnect: (e: React.MouseEvent, sourceTaskId: string) => void;
  hoveredTargetId: string | null;
  isConnecting: boolean;
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
  hierarchy,
  onStartConnect,
  hoveredTargetId,
  isConnecting,
}: TaskBarContainerProps) {
  const ppd = PIXELS_PER_DAY * state.zoomScale;
  const { timelineStartDay } = state;

  const containerRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragState = useRef<{
    type: 'move' | 'resize';
    taskId: string;
    startX: number;
    startY: number;
    origLeft: number;
    origTop: number;
    origWidth: number;
    origStartDayOffset: number;
    origDuration: number;
    origRowIndex: number;
    lastDropRow: number | null;
  } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, task: ComputedTask, type: 'move' | 'resize') => {
      if (type === 'move' && !task.start) return;
      if (task.rowIndex === undefined) return;
      e.preventDefault();
      e.stopPropagation();

      const barEl = barRefs.current[task.id];
      const rowEl = rowRefs.current[task.id];
      if (!barEl || !rowEl) return;

      const barWrapperEl = barEl.parentElement;
      if (!barWrapperEl) return;

      const origLeft = parseFloat(barWrapperEl.style.left) || 0;
      const origTop = parseFloat(rowEl.style.top) || 0;
      const origWidth = barEl.offsetWidth;

      dragState.current = {
        type,
        taskId: task.id,
        startX: e.clientX,
        startY: e.clientY,
        origLeft,
        origTop,
        origWidth,
        origStartDayOffset: task.startDayOffset,
        origDuration: task.duration,
        origRowIndex: task.rowIndex,
        lastDropRow: null,
      };

      if (type === 'move') {
        barEl.classList.add('dragging');
      }

      const handleMouseMove = (ev: MouseEvent) => {
        const ds = dragState.current;
        if (!ds) return;
        const dx = ev.clientX - ds.startX;
        const dy = ev.clientY - ds.startY;

        if (ds.type === 'move') {
          const wrapper = barRefs.current[ds.taskId]?.parentElement;
          if (wrapper) {
            wrapper.style.left = `${ds.origLeft + dx}px`;
          }
          const row = rowRefs.current[ds.taskId];
          if (row) {
            row.style.top = `${ds.origTop + dy}px`;
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
        const dy = ev.clientY - ds.startY;
        const dayDelta = Math.round(dx / ppd);

        const bar = barRefs.current[ds.taskId];
        if (bar) {
          bar.classList.remove('dragging');
        }
        const row = rowRefs.current[ds.taskId];

        if (ds.type === 'resize') {
          if (dayDelta !== 0) {
            const newDuration = Math.max(1, ds.origDuration + dayDelta);
            dispatch({ type: 'RESIZE_TASK', taskId: ds.taskId, newDuration });
          } else if (bar) {
            bar.style.width = `${ds.origWidth}px`;
          }
          return;
        }

        const rowDelta = Math.round(dy / ROW_HEIGHT);
        const targetRowIndex = ds.origRowIndex + rowDelta;

        const rowMap = buildRowMap(
          hierarchy,
          state.currentFilter,
          state.collapsedPhases,
          state.collapsedSubPhases
        );

        let targetPhase: string | null = null;
        let insertBeforeTaskId: string | undefined;

        if (rowDelta !== 0 && targetRowIndex >= 0 && targetRowIndex < rowMap.length) {
          const item = rowMap[targetRowIndex];
          if (item.type === 'task' && item.taskId !== ds.taskId) {
            targetPhase = `${item.masterPhase} ${item.subPhase}`;
            insertBeforeTaskId = item.taskId;
          } else if (item.type === 'sub-phase') {
            targetPhase = `${item.masterPhase} ${item.subPhase}`;
            insertBeforeTaskId = undefined;
          } else if (item.type === 'phase') {
            for (let i = targetRowIndex + 1; i < rowMap.length; i++) {
              const next = rowMap[i];
              if (next.type === 'sub-phase' && next.masterPhase === item.masterPhase) {
                targetPhase = `${next.masterPhase} ${next.subPhase}`;
                break;
              }
            }
          }
        }

        const newStartOffset = ds.origStartDayOffset + dayDelta;
        const newDateISO = formatISO(offsetToDate(newStartOffset));
        const task = computed.find((t) => t.id === ds.taskId);
        const currentPhase = task?.phase;

        const phaseChanged = targetPhase && targetPhase !== currentPhase;

        if (phaseChanged && targetPhase) {
          dispatch({
            type: 'MOVE_TASK_WITH_REORDER',
            taskId: ds.taskId,
            newStartDate: newDateISO,
            targetPhase,
            insertBeforeTaskId,
          });
        } else if (dayDelta !== 0) {
          dispatch({ type: 'MOVE_TASK', taskId: ds.taskId, newStartDate: newDateISO });
        } else {
          const wrapper = bar?.parentElement;
          if (wrapper) wrapper.style.left = `${ds.origLeft}px`;
          if (row) row.style.top = `${ds.origTop}px`;
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [ppd, dispatch, hierarchy, state.currentFilter, state.collapsedPhases, state.collapsedSubPhases, computed]
  );

  const visibleTasks = computed.filter((t) => {
    if (t.rowIndex === undefined || t.startDayOffset < 0) return false;
    if (!virtualWindow.enabled) return true;
    return t.rowIndex >= virtualWindow.startIndex && t.rowIndex <= virtualWindow.endIndex;
  });

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: Z.bars }}
    >
      {visibleTasks.map((task) => {
        const left = (task.startDayOffset - timelineStartDay) * ppd;
        const width = Math.max(task.duration * ppd, 12);
        const top = (task.rowIndex ?? 0) * ROW_HEIGHT;

        const endDate = offsetToDate(task.endDayOffset);
        const isDropTarget = hoveredTargetId === task.id;

        return (
          <div
            key={task.id}
            ref={(el) => {
              rowRefs.current[task.id] = el;
            }}
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
                data-task-id={task.id}
                className={`task-bar ${statusClass(task.status)} ${
                  task.isCritical ? 'ring-[2px] ring-red-400' : ''
                } ${isDropTarget ? 'drop-target' : ''}`}
                style={{
                  width,
                  cursor: task.start ? 'grab' : 'default',
                  position: 'relative',
                  pointerEvents: 'auto',
                  zIndex: task.isCritical ? Z.barsHover : Z.bars,
                }}
                onMouseDown={(e) => {
                  const el = e.target as HTMLElement;
                  if (el.classList.contains('resize-handle')) return;
                  if (el.classList.contains('conn-port')) return;
                  handleMouseDown(e, task, 'move');
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isConnecting) return;
                  dispatch({ type: 'OPEN_TASK_EDITOR', taskId: task.id });
                }}
              >
                <span
                  className="task-bar-text"
                  style={{ fontSize: 10, fontWeight: 700, pointerEvents: 'none', userSelect: 'none' }}
                >
                  {width > 24 ? `${task.duration}d` : ''}
                </span>

                {/* Connection port — source (right edge) */}
                <div
                  className="conn-port right"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onStartConnect(e, task.id);
                  }}
                />

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
