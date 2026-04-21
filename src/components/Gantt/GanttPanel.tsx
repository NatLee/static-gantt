'use client';

import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { GanttState, GanttAction, ComputedTask, HierarchyMap } from '@/types';
import { offsetToDate, formatDateFull } from '@/lib/dateUtils';
import TimelineHeader from './TimelineHeader';
import TaskListColumn from './TaskListColumn';
import GridBackground from './GridBackground';
import PhaseBackgroundBands from './PhaseBackgroundBands';
import RowDividers from './RowDividers';
import DependencyLines from './DependencyLines';
import MilestoneMarkers from './MilestoneMarkers';
import TaskBarContainer from './TaskBarContainer';
import GanttCorner from './GanttCorner';
import { ROW_HEIGHT, PIXELS_PER_DAY, Z } from '@/lib/ganttLayout';
import { useResizableSidebar } from '@/hooks/useResizableSidebar';
import { useVirtualRows } from '@/hooks/useVirtualRows';
import { useDragToConnect } from '@/hooks/useDragToConnect';
import { buildDepPath, buildArrowHead } from '@/lib/depPath';

interface GanttPanelProps {
  state: GanttState;
  dispatch: React.Dispatch<GanttAction>;
  computed: ComputedTask[];
  hierarchy: HierarchyMap;
  taskMap: Map<string, ComputedTask>;
}

function computeRowIndexMap(
  hierarchy: HierarchyMap,
  currentFilter: string,
  collapsedPhases: Set<string>,
  collapsedSubPhases: Set<string>
): Map<string, number> {
  const map = new Map<string, number>();
  let rowIndex = 0;
  const masters = Object.keys(hierarchy);

  masters.forEach((master) => {
    if (currentFilter !== 'ALL' && currentFilter !== master) return;
    rowIndex++; // Phase header
    if (collapsedPhases.has(master)) return;
    const subs = hierarchy[master];
    Object.keys(subs).forEach((sub) => {
      rowIndex++; // Sub-phase header
      const collapseKey = `${master}::${sub}`;
      if (collapsedSubPhases.has(collapseKey)) return;
      subs[sub].forEach((task) => {
        map.set(task.id, rowIndex);
        rowIndex++;
      });
    });
  });

  return map;
}

function countTotalRows(
  hierarchy: HierarchyMap,
  currentFilter: string,
  collapsedPhases: Set<string>,
  collapsedSubPhases: Set<string>
): number {
  let count = 0;
  const masters = Object.keys(hierarchy);

  masters.forEach((master) => {
    if (currentFilter !== 'ALL' && currentFilter !== master) return;

    count++; // Phase header row

    if (collapsedPhases.has(master)) return;

    const subs = hierarchy[master];
    const subKeys = Object.keys(subs);

    subKeys.forEach((sub) => {
      count++; // Sub-phase header row

      const collapseKey = `${master}::${sub}`;
      if (collapsedSubPhases.has(collapseKey)) return;

      count += subs[sub].length; // Task rows
    });
  });

  return count;
}

export default function GanttPanel({
  state,
  dispatch,
  computed,
  hierarchy,
  taskMap,
}: GanttPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const exportTargetRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const datePointerRef = useRef<HTMLDivElement>(null);
  const dateTooltipRef = useRef<HTMLDivElement>(null);
  const isExtendingRef = useRef(false);

  const [pointerVisible, setPointerVisible] = useState(false);
  const sidebar = useResizableSidebar();

  const ppd = PIXELS_PER_DAY * state.zoomScale;

  const totalDays = state.timelineEndDay - state.timelineStartDay;
  const totalWidth = totalDays * ppd;

  const totalRows = useMemo(
    () => countTotalRows(hierarchy, state.currentFilter, state.collapsedPhases, state.collapsedSubPhases),
    [hierarchy, state.currentFilter, state.collapsedPhases, state.collapsedSubPhases]
  );

  const rowIndexMap = useMemo(
    () => computeRowIndexMap(hierarchy, state.currentFilter, state.collapsedPhases, state.collapsedSubPhases),
    [hierarchy, state.currentFilter, state.collapsedPhases, state.collapsedSubPhases]
  );

  const computedWithRows = useMemo(
    () => computed.map(t => ({ ...t, rowIndex: rowIndexMap.get(t.id) })),
    [computed, rowIndexMap]
  );

  const totalHeight = totalRows * ROW_HEIGHT;

  const virtualWindow = useVirtualRows(scrollContainerRef, totalRows);

  const connect = useDragToConnect({
    tasks: state.tasks,
    taskMap,
    dispatch,
    zoomScale: state.zoomScale,
    timelineStartDay: state.timelineStartDay,
    gridRef,
  });

  // Update CSS variable for grid background
  useEffect(() => {
    document.documentElement.style.setProperty('--col-width', `${ppd}px`);
  }, [ppd]);

  // Scroll handler for timeline extension
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el || isExtendingRef.current) return;

    const maxScroll = el.scrollWidth - el.clientWidth;

    if (el.scrollLeft >= maxScroll - 200) {
      isExtendingRef.current = true;
      dispatch({ type: 'EXTEND_TIMELINE', direction: 'right', days: 60 });
      requestAnimationFrame(() => {
        isExtendingRef.current = false;
      });
    }

    if (el.scrollLeft <= 100) {
      isExtendingRef.current = true;
      const prevScrollLeft = el.scrollLeft;
      const addedWidth = 60 * ppd;
      dispatch({ type: 'EXTEND_TIMELINE', direction: 'left', days: 60 });
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = prevScrollLeft + addedWidth;
        }
        isExtendingRef.current = false;
      });
    }
  }, [dispatch, ppd]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    dispatch({ type: 'SET_ZOOM', scale: state.zoomScale * 1.2 });
  }, [dispatch, state.zoomScale]);

  const handleZoomOut = useCallback(() => {
    dispatch({ type: 'SET_ZOOM', scale: state.zoomScale * 0.8 });
  }, [dispatch, state.zoomScale]);

  // Date hover pointer on grid
  const handleGridMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const gridEl = e.currentTarget;
      const rect = gridEl.getBoundingClientRect();
      const x = e.clientX - rect.left + gridEl.scrollLeft;

      if (datePointerRef.current) {
        datePointerRef.current.style.left = `${x}px`;
        datePointerRef.current.style.display = 'block';
      }

      // Compute date from x position
      const dayOffset = Math.floor(x / ppd) + state.timelineStartDay;
      const date = offsetToDate(dayOffset);

      if (dateTooltipRef.current) {
        dateTooltipRef.current.style.left = `${x}px`;
        dateTooltipRef.current.style.display = 'block';
        dateTooltipRef.current.textContent = formatDateFull(date);
      }

      if (!pointerVisible) setPointerVisible(true);
    },
    [ppd, state.timelineStartDay, pointerVisible]
  );

  const handleGridMouseLeave = useCallback(() => {
    if (datePointerRef.current) {
      datePointerRef.current.style.display = 'none';
    }
    if (dateTooltipRef.current) {
      dateTooltipRef.current.style.display = 'none';
    }
    setPointerVisible(false);
  }, []);

  return (
    <main className="flex-1 overflow-hidden p-4 flex flex-col">
      <div
        id="gantt-export-target"
        ref={exportTargetRef}
        className="rounded-2xl flex-1 flex flex-col overflow-hidden"
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div
          id="gantt-scroll-container"
          ref={scrollContainerRef}
          className="flex-1 overflow-auto relative"
          onScroll={handleScroll}
          style={{
            display: 'grid',
            gridTemplateColumns: `var(--sidebar-w) ${totalWidth}px`,
            gridTemplateRows: `var(--header-height) ${totalHeight}px`,
          }}
        >
          {/* Row 1 Col 1: Corner (sticky top-left) */}
          <div className="sticky-corner" style={{ gridRow: 1, gridColumn: 1 }}>
            <GanttCorner onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
          </div>

          {/* Row 1 Col 2: Timeline Header (sticky top) */}
          <div style={{ gridRow: 1, gridColumn: 2 }}>
            <TimelineHeader
              timelineStartDay={state.timelineStartDay}
              timelineEndDay={state.timelineEndDay}
              zoomScale={state.zoomScale}
              totalWidth={totalWidth}
            />
          </div>

          {/* Row 2 Col 1: Task List (sticky left) + divider spanning both rows */}
          <div
            className="sticky-col"
            style={{
              gridRow: 2,
              gridColumn: 1,
              width: 'var(--sidebar-w)',
              overflow: 'visible',
            }}
          >
            <TaskListColumn
              hierarchy={hierarchy}
              state={state}
              dispatch={dispatch}
              totalRows={totalRows}
              scrollContainerRef={scrollContainerRef}
              virtualWindow={virtualWindow}
            />
            <div
              className={`mm-divider${sidebar.isDragging ? ' active' : ''}`}
              onPointerDown={sidebar.onPointerDown}
              style={{
                position: 'absolute',
                top: 'calc(-1 * var(--header-height))',
                right: -2,
                height: `calc(var(--header-height) + ${totalHeight}px)`,
                width: 5,
                cursor: 'col-resize',
                zIndex: Z.stickyCorner + 1,
              }}
            />
          </div>

          {/* Row 2 Col 2: Grid Layer */}
          <div
            className="gantt-grid"
            ref={gridRef}
            style={{
              gridRow: 2,
              gridColumn: 2,
              position: 'relative',
              zIndex: Z.grid,
              width: totalWidth,
              height: totalHeight,
            }}
            onMouseMove={handleGridMouseMove}
            onMouseLeave={handleGridMouseLeave}
          >
            <PhaseBackgroundBands
              hierarchy={hierarchy}
              currentFilter={state.currentFilter}
              collapsedPhases={state.collapsedPhases}
              collapsedSubPhases={state.collapsedSubPhases}
              totalWidth={totalWidth}
            />
            <GridBackground
              totalRows={totalRows}
              totalWidth={totalWidth}
              totalHeight={totalHeight}
              timelineStartDay={state.timelineStartDay}
              timelineEndDay={state.timelineEndDay}
              ppd={ppd}
            />
            <div
              ref={datePointerRef}
              style={{
                position: 'absolute',
                top: 0,
                width: 1,
                height: totalHeight,
                background: 'var(--accent)',
                opacity: 0.5,
                pointerEvents: 'none',
                display: 'none',
                zIndex: Z.barsHover,
              }}
            />
            <div
              ref={dateTooltipRef}
              style={{
                position: 'absolute',
                top: -20,
                transform: 'translateX(-50%)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                padding: '2px 8px',
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                display: 'none',
                zIndex: Z.overlay,
              }}
            />
            <DependencyLines
              computed={computedWithRows}
              zoomScale={state.zoomScale}
              timelineStartDay={state.timelineStartDay}
              totalWidth={totalWidth}
              totalHeight={totalHeight}
              virtualWindow={virtualWindow}
              dispatch={dispatch}
            />
            <MilestoneMarkers
              milestones={state.milestones}
              zoomScale={state.zoomScale}
              timelineStartDay={state.timelineStartDay}
              totalHeight={totalHeight}
              dispatch={dispatch}
            />
            <TaskBarContainer
              computed={computedWithRows}
              state={state}
              dispatch={dispatch}
              virtualWindow={virtualWindow}
              hierarchy={hierarchy}
              scrollContainerRef={scrollContainerRef}
              onStartConnect={connect.startConnect}
              hoveredTargetId={connect.hoveredTargetId}
              isConnecting={connect.isConnecting}
              connectCycleBlocked={connect.cycleBlocked}
            />
            {connect.previewLine && (
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: totalWidth,
                  height: totalHeight,
                  pointerEvents: 'none',
                  zIndex: Z.overlay,
                }}
              >
                <path
                  d={buildDepPath(
                    connect.previewLine.sx,
                    connect.previewLine.sy,
                    connect.previewLine.ex,
                    connect.previewLine.ey
                  )}
                  fill="none"
                  stroke={connect.cycleBlocked ? '#ef4444' : 'var(--accent)'}
                  strokeWidth={2}
                  strokeDasharray="5 3"
                />
                {buildArrowHead(connect.previewLine.ex, connect.previewLine.ey).map((ad, j) => (
                  <path
                    key={j}
                    d={ad}
                    fill="none"
                    stroke={connect.cycleBlocked ? '#ef4444' : 'var(--accent)'}
                    strokeWidth={2}
                  />
                ))}
              </svg>
            )}
            {connect.rejectReason === 'cycle' && (
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--bg-card)',
                  border: '1px solid #f87171',
                  color: '#f87171',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  pointerEvents: 'none',
                  zIndex: Z.overlay + 1,
                }}
              >
                無法建立：會造成循環依賴
              </div>
            )}
          </div>

          {/* Row dividers: shared horizontal lines spanning both sidebar and timeline */}
          <RowDividers totalHeight={totalHeight} />
        </div>
      </div>
    </main>
  );
}
