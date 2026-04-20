'use client';

import React, { useRef, useCallback, useState } from 'react';
import { ComputedTask, GanttState, GanttAction, HierarchyMap } from '@/types';
import { offsetToDate, formatDate, formatISO } from '@/lib/dateUtils';
import { PIXELS_PER_DAY, ROW_HEIGHT, Z } from '@/lib/ganttLayout';
import type { VirtualWindow } from '@/hooks/useVirtualRows';
import { buildRowMap } from '@/hooks/useDragReorder';
import type { ConnectDirection } from '@/hooks/useDragToConnect';
import TaskContextMenu from './TaskContextMenu';
import TaskTooltip from './TaskTooltip';

const CONNECT_DRAG_THRESHOLD = 4;

interface TaskBarContainerProps {
  computed: ComputedTask[];
  state: GanttState;
  dispatch: React.Dispatch<GanttAction>;
  virtualWindow: VirtualWindow;
  hierarchy: HierarchyMap;
  onStartConnect: (
    sourceTaskId: string,
    clientX: number,
    clientY: number,
    direction?: ConnectDirection
  ) => void;
  hoveredTargetId: string | null;
  isConnecting: boolean;
  connectCycleBlocked: boolean;
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
  connectCycleBlocked,
}: TaskBarContainerProps) {
  const ppd = PIXELS_PER_DAY * state.zoomScale;
  const { timelineStartDay } = state;

  const containerRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [contextMenu, setContextMenu] = useState<{ task: ComputedTask; x: number; y: number } | null>(null);
  const [tooltip, setTooltip] = useState<{ task: ComputedTask; x: number; y: number } | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const floatingPillRef = useRef<HTMLDivElement>(null);
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

  const handleConnectMouseDown = useCallback(
    (
      e: React.MouseEvent,
      task: ComputedTask,
      direction: ConnectDirection
    ) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startY = e.clientY;
      let dragStarted = false;

      const onMove = (ev: MouseEvent) => {
        if (dragStarted) return;
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > CONNECT_DRAG_THRESHOLD) {
          dragStarted = true;
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          onStartConnect(task.id, ev.clientX, ev.clientY, direction);
        }
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        if (!dragStarted) {
          dispatch({
            type: 'OPEN_DIALOG',
            dialog: {
              type: direction === 'forward' ? 'add-after-task' : 'add-before-task',
              context: { targetTaskId: task.id, phase: task.phase },
            },
          });
        }
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [dispatch, onStartConnect]
  );

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

      const pill = floatingPillRef.current;
      if (pill) pill.style.display = 'block';

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
          if (pill) {
            const dayDelta = Math.round(dx / ppd);
            const newStart = offsetToDate(ds.origStartDayOffset + dayDelta);
            const newEnd = offsetToDate(ds.origStartDayOffset + dayDelta + ds.origDuration - 1);
            pill.textContent = `${formatDate(newStart)} → ${formatDate(newEnd)}`;
            pill.style.left = `${ev.clientX + 12}px`;
            pill.style.top = `${ev.clientY - 28}px`;
          }
        } else {
          const bar = barRefs.current[ds.taskId];
          if (bar) {
            const newWidth = Math.max(12, ds.origWidth + dx);
            bar.style.width = `${newWidth}px`;
          }
          if (pill) {
            const dayDelta = Math.round(dx / ppd);
            const newDuration = Math.max(1, ds.origDuration + dayDelta);
            pill.textContent = `${newDuration}d`;
            pill.style.left = `${ev.clientX + 12}px`;
            pill.style.top = `${ev.clientY - 28}px`;
          }
        }
      };

      const handleMouseUp = (ev: MouseEvent) => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        if (pill) pill.style.display = 'none';

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
    if (t.rowIndex === undefined || Number.isNaN(t.startDayOffset)) return false;
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
              {/* Left port: drag to connect (target → this task); click to add-before */}
              <div
                className="bar-add-btn left"
                style={{ pointerEvents: 'auto' }}
                onMouseDown={(e) => handleConnectMouseDown(e, task, 'backward')}
              >
                +
              </div>

              {/* Task bar */}
              <div
                ref={(el) => {
                  barRefs.current[task.id] = el;
                }}
                data-task-id={task.id}
                className={`task-bar ${task.color ? '' : statusClass(task.status)} ${
                  task.isCritical ? 'ring-[2px] ring-red-400' : ''
                } ${isDropTarget ? (connectCycleBlocked ? 'drop-target-blocked' : 'drop-target') : ''} ${
                  state.highlightedTaskId === task.id ? 'search-hit' : ''
                }`}
                style={{
                  width,
                  cursor: task.start ? 'grab' : 'default',
                  position: 'relative',
                  pointerEvents: 'auto',
                  zIndex: task.isCritical ? Z.barsHover : Z.bars,
                  ...(task.color ? { background: task.color, color: '#fff' } : {}),
                }}
                onMouseDown={(e) => {
                  const el = e.target as HTMLElement;
                  if (el.classList.contains('resize-handle')) return;
                  handleMouseDown(e, task, 'move');
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isConnecting) return;
                  dispatch({ type: 'OPEN_TASK_EDITOR', taskId: task.id });
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextMenu({ task, x: e.clientX, y: e.clientY });
                }}
                onMouseEnter={(e) => {
                  if (dragState.current || isConnecting) return;
                  if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
                  const x = e.clientX;
                  const y = e.clientY;
                  tooltipTimerRef.current = setTimeout(() => {
                    setTooltip({ task, x, y });
                  }, 500);
                }}
                onMouseMove={(e) => {
                  if (!tooltip || tooltip.task.id !== task.id) return;
                  setTooltip({ task, x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => {
                  if (tooltipTimerRef.current) {
                    clearTimeout(tooltipTimerRef.current);
                    tooltipTimerRef.current = null;
                  }
                  setTooltip(null);
                }}
              >
                {typeof task.progress === 'number' && task.progress > 0 && (
                  <div
                    className="task-bar-progress"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: `${Math.min(100, Math.max(0, task.progress))}%`,
                      background: 'rgba(0,0,0,0.28)',
                      pointerEvents: 'none',
                      borderRadius: 'inherit',
                    }}
                  />
                )}
                <span
                  className="task-bar-text"
                  style={{ fontSize: 10, fontWeight: 700, pointerEvents: 'none', userSelect: 'none', position: 'relative', zIndex: 1 }}
                >
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

              {/* Right port: drag to connect (this task → target); click to add-after */}
              <div
                className="bar-add-btn right"
                style={{ pointerEvents: 'auto' }}
                onMouseDown={(e) => handleConnectMouseDown(e, task, 'forward')}
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

      {contextMenu && (
        <TaskContextMenu
          task={contextMenu.task}
          x={contextMenu.x}
          y={contextMenu.y}
          dispatch={dispatch}
          onClose={() => setContextMenu(null)}
        />
      )}

      {tooltip && !contextMenu && (
        <TaskTooltip task={tooltip.task} x={tooltip.x} y={tooltip.y} />
      )}

      <div
        ref={floatingPillRef}
        style={{
          position: 'fixed',
          display: 'none',
          pointerEvents: 'none',
          zIndex: 9999,
          padding: '4px 10px',
          borderRadius: 6,
          background: 'var(--accent)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      />
    </div>
  );
}
