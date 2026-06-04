'use client';

import React, { useRef, useCallback, useState } from 'react';
import { ComputedTask, GanttState, GanttAction, HierarchyMap } from '@/types';
import { offsetToDate, formatDate, formatISO } from '@/lib/dateUtils';
import { PIXELS_PER_DAY, ROW_HEIGHT, Z } from '@/lib/ganttLayout';
import type { VirtualWindow } from '@/hooks/useVirtualRows';
import { buildRowMap, findTaskDropRow, resolveTaskDropTarget, type RowItem } from '@/hooks/useDragReorder';
import type { ConnectDirection } from '@/hooks/useDragToConnect';
import { useRowHover } from '@/hooks/useRowHover';
import { updateDepsForTask } from '@/lib/depLineLive';
import { createAutoScroll, computeEdgeScrollSpeed } from '@/lib/autoScroll';
import { AlertTriangle } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import TaskContextMenu from './TaskContextMenu';
import TaskTooltip from './TaskTooltip';
import AssigneeAvatar from './AssigneeAvatar';

const BAR_CLICK_THRESHOLD = 4;

interface TaskBarContainerProps {
  computed: ComputedTask[];
  state: GanttState;
  dispatch: React.Dispatch<GanttAction>;
  virtualWindow: VirtualWindow;
  hierarchy: HierarchyMap;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
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
  scrollContainerRef,
  onStartConnect,
  hoveredTargetId,
  isConnecting,
  connectCycleBlocked,
}: TaskBarContainerProps) {
  const ppd = PIXELS_PER_DAY * state.zoomScale;
  const { timelineStartDay } = state;
  const { setHover } = useRowHover();
  const { t } = useI18n();

  const containerRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [contextMenu, setContextMenu] = useState<{ task: ComputedTask; x: number; y: number } | null>(null);
  const [tooltip, setTooltip] = useState<{ task: ComputedTask; x: number; y: number } | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const floatingPillRef = useRef<HTMLDivElement>(null);
  const snapGuideRef = useRef<HTMLDivElement>(null);
  const didDragBarRef = useRef(false);
  const autoScrollRef = useRef(createAutoScroll());
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
    origListTop: number;
    origPhase: string;
    sourceMaster: string;
    sourceSub: string | undefined;
    listRowEl: HTMLElement | null;
    dropIndicatorEl: HTMLElement | null;
    forbiddenIndicatorEls: HTMLElement[];
    rowMap: RowItem[];
    depSvg: SVGSVGElement | null;
    dropRow: number | null;
  } | null>(null);

  const handleConnectMouseDown = useCallback(
    (
      e: React.MouseEvent,
      task: ComputedTask,
      direction: ConnectDirection
    ) => {
      e.preventDefault();
      e.stopPropagation();
      onStartConnect(task.id, e.clientX, e.clientY, direction);
    },
    [onStartConnect]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, task: ComputedTask, type: 'move' | 'resize') => {
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

      // Find left task-list row for parallel vertical movement
      const listRowEl =
        (document.querySelector(
          `.sticky-col [data-task-row-id="${task.id}"]`,
        ) as HTMLElement | null) ?? null;
      const origListTop = listRowEl ? parseFloat(listRowEl.style.top) || 0 : 0;

      // Drop indicator (lives inside TaskListColumn as a persistent hidden div)
      const dropIndicatorEl =
        (document.querySelector('.bar-drag-drop-indicator') as HTMLElement | null) ?? null;

      // Forbidden-row indicators (left panel + right chart body). Shown when
      // the hovered row rejects the drop (e.g. source task's own row).
      const forbiddenIndicatorEls = Array.from(
        document.querySelectorAll('.bar-drag-forbidden-indicator'),
      ) as HTMLElement[];

      // Row map for unified drop-target resolution
      const rowMap = buildRowMap(
        hierarchy,
        state.currentFilter,
        state.collapsedPhases,
        state.collapsedSubPhases,
      );

      const depSvg =
        (document.querySelector('svg[data-role="dep-svg"]') as SVGSVGElement | null) ?? null;

      const phaseMatch = task.phase.match(/^(Phase \d+)\s+(.*)/);
      const sourceMaster = phaseMatch?.[1] ?? '';
      const sourceSub = phaseMatch?.[2];

      didDragBarRef.current = false;
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
        origListTop,
        origPhase: task.phase,
        sourceMaster,
        sourceSub,
        listRowEl,
        dropIndicatorEl,
        forbiddenIndicatorEls,
        rowMap,
        depSvg,
        dropRow: null,
      };

      if (type === 'move') {
        barEl.classList.add('dragging');
        if (listRowEl) listRowEl.classList.add('dragging');
      }

      const pill = floatingPillRef.current;
      if (pill) pill.style.display = 'block';
      const snapGuide = snapGuideRef.current;
      if (snapGuide && type === 'move') snapGuide.style.display = 'block';

      const handleMouseMove = (ev: MouseEvent) => {
        const ds = dragState.current;
        if (!ds) return;
        const dx = ev.clientX - ds.startX;
        const dy = ev.clientY - ds.startY;
        if (!didDragBarRef.current && Math.hypot(dx, dy) > BAR_CLICK_THRESHOLD) {
          didDragBarRef.current = true;
        }

        if (ds.type === 'move') {
          const dayDelta = Math.round(dx / ppd);
          const snappedDx = dayDelta * ppd;

          // Move right-side bar wrapper (horizontal snapped, vertical raw for smoothness)
          const wrapper = barRefs.current[ds.taskId]?.parentElement;
          if (wrapper) wrapper.style.left = `${ds.origLeft + snappedDx}px`;
          const row = rowRefs.current[ds.taskId];
          if (row) row.style.top = `${ds.origTop + dy}px`;

          // Move left-side task list row in parallel
          if (ds.listRowEl) ds.listRowEl.style.top = `${ds.origListTop + dy}px`;

          // Live-update dependency lines
          updateDepsForTask(ds.depSvg, ds.taskId, snappedDx, dy, 0);

          // Compute drop row using the same routine as useDragReorder
          const scrollEl = scrollContainerRef.current;
          let dropRow: number | null = null;
          let clampedHoveredRow: number | null = null;
          if (scrollEl) {
            const listColEl = scrollEl.querySelector('.sticky-col');
            const listAreaEl = listColEl?.children[1] as HTMLElement | undefined;
            if (listAreaEl) {
              const listRect = listAreaEl.getBoundingClientRect();
              const relativeY = ev.clientY - listRect.top;
              const hoveredRow = Math.floor(relativeY / ROW_HEIGHT);
              if (hoveredRow >= 0 && ds.rowMap.length > 0) {
                // Clamp so dragging past the last row still yields a valid
                // findTaskDropRow hit; the helper can then return rowMap.length
                // for "append at end" semantics.
                clampedHoveredRow = Math.min(hoveredRow, ds.rowMap.length - 1);
                dropRow = findTaskDropRow(clampedHoveredRow, relativeY, ds.rowMap, {
                  type: 'task',
                  masterPhase: ds.sourceMaster,
                  subPhase: ds.sourceSub,
                  taskId: ds.taskId,
                });
              }
            }
          }
          ds.dropRow = dropRow;

          const isForbiddenHover = clampedHoveredRow !== null && dropRow === null;

          // Update drop indicator (valid drop → thin line between rows)
          if (ds.dropIndicatorEl) {
            if (dropRow !== null) {
              ds.dropIndicatorEl.style.display = 'block';
              ds.dropIndicatorEl.style.top = `${dropRow * ROW_HEIGHT - 1}px`;
            } else {
              ds.dropIndicatorEl.style.display = 'none';
            }
          }

          // Update forbidden-row indicators (invalid drop → full-row red band)
          if (ds.forbiddenIndicatorEls.length > 0) {
            if (isForbiddenHover && clampedHoveredRow !== null) {
              const top = clampedHoveredRow * ROW_HEIGHT;
              ds.forbiddenIndicatorEls.forEach((el) => {
                el.style.display = 'block';
                el.style.top = `${top}px`;
              });
            } else {
              ds.forbiddenIndicatorEls.forEach((el) => {
                el.style.display = 'none';
              });
            }
          }

          // Auto-scroll at viewport edges
          if (scrollEl) {
            const rect = scrollEl.getBoundingClientRect();
            const speed = computeEdgeScrollSpeed(ev.clientY, rect);
            if (speed === 0) autoScrollRef.current.stop();
            else autoScrollRef.current.update(scrollEl, speed);
          }

          // Snap guide
          if (snapGuide) {
            snapGuide.style.left = `${ds.origLeft + snappedDx}px`;
            snapGuide.style.top = '0';
          }

          if (pill) {
            const newStart = offsetToDate(ds.origStartDayOffset + dayDelta);
            const newEnd = offsetToDate(ds.origStartDayOffset + dayDelta + ds.origDuration - 1);
            pill.textContent = `${formatDate(newStart)} → ${formatDate(newEnd)}`;
            pill.style.left = `${ev.clientX + 12}px`;
            pill.style.top = `${ev.clientY - 28}px`;
          }
        } else {
          // Resize: only width changes; dep lines whose pred is this task shift sx.
          const bar = barRefs.current[ds.taskId];
          const dayDelta = Math.round(dx / ppd);
          const newDuration = Math.max(1, ds.origDuration + dayDelta);
          const newWidth = Math.max(12, newDuration * ppd);
          const widthDelta = newWidth - ds.origWidth;
          if (bar) bar.style.width = `${newWidth}px`;
          updateDepsForTask(ds.depSvg, ds.taskId, 0, 0, widthDelta);

          if (pill) {
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
        if (snapGuide) snapGuide.style.display = 'none';
        autoScrollRef.current.stop();

        const ds = dragState.current;
        if (!ds) return;
        dragState.current = null;

        const dx = ev.clientX - ds.startX;
        const dayDelta = Math.round(dx / ppd);

        const bar = barRefs.current[ds.taskId];
        if (bar) bar.classList.remove('dragging');
        if (ds.listRowEl) ds.listRowEl.classList.remove('dragging');
        if (ds.dropIndicatorEl) ds.dropIndicatorEl.style.display = 'none';
        ds.forbiddenIndicatorEls.forEach((el) => { el.style.display = 'none'; });
        const row = rowRefs.current[ds.taskId];

        // Reset inline styles we mutated during mousemove. React's style
        // reconciliation is prop-diffed — if the post-dispatch rowIndex / left
        // happens to equal the pre-drag value, React won't rewrite the DOM and
        // the bar visually "sticks" wherever we left it. Resetting to origin
        // before dispatch lets React's re-render land on the correct position.
        const wrapper = bar?.parentElement;
        if (wrapper) wrapper.style.left = `${ds.origLeft}px`;
        if (row) row.style.top = `${ds.origTop}px`;
        if (ds.listRowEl) ds.listRowEl.style.top = `${ds.origListTop}px`;
        if (bar && ds.type === 'resize') bar.style.width = `${ds.origWidth}px`;
        updateDepsForTask(ds.depSvg, ds.taskId, 0, 0, 0);

        if (ds.type === 'resize') {
          if (dayDelta !== 0) {
            const newDuration = Math.max(1, ds.origDuration + dayDelta);
            dispatch({ type: 'RESIZE_TASK', taskId: ds.taskId, newDuration });
          }
          return;
        }

        const resolved = ds.dropRow !== null
          ? resolveTaskDropTarget(
              {
                type: 'task',
                masterPhase: ds.sourceMaster,
                subPhase: ds.sourceSub,
                taskId: ds.taskId,
              },
              ds.dropRow,
              ds.rowMap,
            )
          : null;

        const phaseChanged = !!resolved && resolved.targetPhase !== ds.origPhase;
        const reorder =
          !!resolved && (phaseChanged || resolved.insertBeforeTaskId !== undefined);

        const newStartOffset = ds.origStartDayOffset + dayDelta;
        const newDateISO = formatISO(offsetToDate(newStartOffset));

        if (reorder && resolved) {
          if (dayDelta !== 0) {
            dispatch({
              type: 'MOVE_TASK_WITH_REORDER',
              taskId: ds.taskId,
              newStartDate: newDateISO,
              targetPhase: resolved.targetPhase,
              insertBeforeTaskId: resolved.insertBeforeTaskId,
            });
          } else {
            dispatch({
              type: 'MOVE_REORDER_TASK',
              taskId: ds.taskId,
              targetPhase: resolved.targetPhase,
              insertBeforeTaskId: resolved.insertBeforeTaskId,
            });
          }
        } else if (dayDelta !== 0) {
          dispatch({ type: 'MOVE_TASK', taskId: ds.taskId, newStartDate: newDateISO });
        }
        // else: pure click / no-movement — inline styles were already reset above.
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [ppd, dispatch, hierarchy, state.currentFilter, state.collapsedPhases, state.collapsedSubPhases, computed, scrollContainerRef]
  );

  const visibleTasks = computed.filter((t) => {
    if (t.rowIndex === undefined || Number.isNaN(t.startDayOffset)) return false;
    if (!virtualWindow.enabled) return true;
    return t.rowIndex >= virtualWindow.startIndex && t.rowIndex <= virtualWindow.endIndex;
  });

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: Z.bars, pointerEvents: 'none' }}
    >
      {visibleTasks.map((task) => {
        const left = (task.startDayOffset - timelineStartDay) * ppd;
        // Use the calendar span (end - start) so working-day mode bars stretch
        // across the weekends they skip; in calendar mode this equals duration.
        const width = Math.max((task.endDayOffset - task.startDayOffset) * ppd, 12);
        const top = (task.rowIndex ?? 0) * ROW_HEIGHT;

        const endDate = offsetToDate(task.endDayOffset);
        const isDropTarget = hoveredTargetId === task.id;

        // Effective critical = on the computed critical path OR manually marked.
        const effCritical = task.isOnCriticalPath || task.isCritical;

        // Baseline ghost (planned-vs-current): faint bar at the captured position.
        const base = state.baseline?.bars[task.id];
        const baseLeft = base ? (base.start - timelineStartDay) * ppd : 0;
        const baseWidth = base ? Math.max((base.end - base.start) * ppd, 4) : 0;

        const isSelected = state.selectedTaskId === task.id;
        return (
          <div
            key={task.id}
            ref={(el) => {
              rowRefs.current[task.id] = el;
            }}
            data-task-row-id={task.id}
            className={`task-bar-row${isSelected ? ' row-selected' : ''}`}
            style={{
              position: 'absolute',
              top,
              left: 0,
              width: '100%',
              height: ROW_HEIGHT,
              pointerEvents: 'none',
            }}
          >
            {base && (
              <div
                className="baseline-ghost"
                title={t('bar.baselineGhost')}
                style={{
                  position: 'absolute',
                  left: baseLeft,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: baseWidth,
                  height: 13,
                  borderRadius: 4,
                  background: 'var(--text-secondary)',
                  opacity: 0.18,
                  border: '1px dashed var(--text-secondary)',
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              />
            )}
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
              {/* Left cluster: outer = add-with-dep (before), inner = plain add */}
              <div
                className="bar-add-btn left dep"
                title={t('bar.addLinkedPred')}
                style={{ pointerEvents: 'auto' }}
                onMouseDown={(e) => handleConnectMouseDown(e, task, 'backward')}
              >
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 3v6a3 3 0 0 0 3 3h5" />
                  <path d="M9 9l3 3-3 3" />
                </svg>
              </div>
              <div
                className="bar-add-btn left plain"
                title={t('bar.addAdjacent')}
                style={{ pointerEvents: 'auto' }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({
                    type: 'OPEN_DIALOG',
                    dialog: { type: 'add-task', context: { phase: task.phase } },
                  });
                }}
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
                  effCritical ? 'ring-2 ring-red-400' : ''
                } ${isDropTarget ? (connectCycleBlocked ? 'drop-target-blocked' : 'drop-target') : ''} ${
                  state.highlightedTaskId === task.id ? 'search-hit' : ''
                }`}
                style={{
                  width,
                  cursor: 'grab',
                  position: 'relative',
                  pointerEvents: 'auto',
                  zIndex: effCritical ? Z.barsHover : Z.bars,
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
                  if (didDragBarRef.current) {
                    didDragBarRef.current = false;
                    return;
                  }
                  dispatch({ type: 'SET_SELECTED_TASK', taskId: task.id });
                  dispatch({ type: 'OPEN_TASK_EDITOR', taskId: task.id });
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextMenu({ task, x: e.clientX, y: e.clientY });
                }}
                onMouseEnter={(e) => {
                  if (dragState.current || isConnecting) return;
                  setHover(task.id);
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
                  setHover(null);
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
                      background: 'rgba(0,0,0,0.22)',
                      pointerEvents: 'none',
                      borderRadius: 'inherit',
                    }}
                  />
                )}
                {task.assignee && width > 80 && (
                  <span
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      display: 'inline-flex',
                      pointerEvents: 'none',
                    }}
                  >
                    <AssigneeAvatar name={task.assignee} size={20} ring />
                  </span>
                )}
                <span
                  className="task-bar-text"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    pointerEvents: 'none',
                    userSelect: 'none',
                    position: 'relative',
                    zIndex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {width > 40 ? task.name : ''}
                </span>

                {task.isOverallocated && (
                  <span
                    title={t('bar.overallocated')}
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 3,
                      zIndex: 2,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 13,
                      height: 13,
                      borderRadius: '50%',
                      background: '#f59e0b',
                      color: '#fff',
                      pointerEvents: 'none',
                    }}
                  >
                    <AlertTriangle size={9} strokeWidth={2.6} />
                  </span>
                )}

                {/* Resize handle */}
                <div
                  className="resize-handle"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown(e, task, 'resize');
                  }}
                />
              </div>

              {/* Right cluster: inner = plain add, outer = add-with-dep (after) */}
              <div
                className="bar-add-btn right plain"
                title={t('bar.addAdjacent')}
                style={{ pointerEvents: 'auto' }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({
                    type: 'OPEN_DIALOG',
                    dialog: { type: 'add-task', context: { phase: task.phase } },
                  });
                }}
              >
                +
              </div>
              <div
                className="bar-add-btn right dep"
                title={t('bar.addLinkedSucc')}
                style={{ pointerEvents: 'auto' }}
                onMouseDown={(e) => handleConnectMouseDown(e, task, 'forward')}
              >
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 3v6a3 3 0 0 0 3 3h5" />
                  <path d="M9 9l3 3-3 3" />
                </svg>
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
        <TaskTooltip task={tooltip.task} x={tooltip.x} y={tooltip.y} baseline={state.baseline} />
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
      <div
        ref={snapGuideRef}
        className="bar-drag-snap-guide"
        style={{
          position: 'absolute',
          display: 'none',
          pointerEvents: 'none',
          top: 0,
          width: 1,
          height: '100%',
          background: 'var(--accent)',
          opacity: 0.55,
          zIndex: Z.overlay,
        }}
      />
      {/* Right-side mirror of the forbidden-row indicator (spans chart body) */}
      <div
        className="bar-drag-forbidden-indicator bar-drag-forbidden-indicator-right"
        style={{
          display: 'none',
          top: 0,
          left: 0,
          right: 0,
        }}
      />
    </div>
  );
}
