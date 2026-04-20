'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { GanttState, GanttAction, HierarchyMap } from '@/types';
import { ROW_HEIGHT } from '@/lib/ganttLayout';

export type RowItemType = 'phase' | 'sub-phase' | 'task';

export interface RowItem {
  type: RowItemType;
  masterPhase: string;
  subPhase?: string;
  taskId?: string;
}

export interface DragSource {
  type: RowItemType;
  masterPhase: string;
  subPhase?: string;
  taskId?: string;
}

/**
 * Build a RowMap from the hierarchy, respecting filters and collapsed state.
 * Must match the exact same iteration order as TaskListColumn rendering.
 */
export function buildRowMap(
  hierarchy: HierarchyMap,
  currentFilter: string,
  collapsedPhases: Set<string>,
  collapsedSubPhases: Set<string>,
): RowItem[] {
  const rowMap: RowItem[] = [];
  const masterPhases = Object.keys(hierarchy);

  masterPhases.forEach((master) => {
    if (currentFilter !== 'ALL' && currentFilter !== master) return;

    rowMap.push({ type: 'phase', masterPhase: master });

    if (collapsedPhases.has(master)) return;

    const subs = hierarchy[master];
    Object.keys(subs).forEach((sub) => {
      rowMap.push({ type: 'sub-phase', masterPhase: master, subPhase: sub });

      const collapseKey = `${master}::${sub}`;
      if (collapsedSubPhases.has(collapseKey)) return;

      subs[sub].forEach((task) => {
        rowMap.push({ type: 'task', masterPhase: master, subPhase: sub, taskId: task.id });
      });
    });
  });

  return rowMap;
}

export function useDragReorder(
  hierarchy: HierarchyMap,
  state: GanttState,
  dispatch: React.Dispatch<GanttAction>,
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragSource, setDragSource] = useState<DragSource | null>(null);
  const [dropIndicatorRow, setDropIndicatorRow] = useState<number | null>(null);
  const dropIndicatorRowRef = useRef<number | null>(null);

  const dragStateRef = useRef<{
    type: RowItemType;
    source: DragSource;
    startY: number;
    rowMap: RowItem[];
    listElTop: number;
    // For ghost element
    ghostEl: HTMLElement | null;
    grabOffsetY: number;
  } | null>(null);

  const autoScrollRef = useRef<number | null>(null);

  const startAutoScroll = useCallback((el: HTMLElement, speed: number) => {
    if (autoScrollRef.current !== null) return;
    const scroll = () => {
      el.scrollTop += speed;
      autoScrollRef.current = requestAnimationFrame(scroll);
    };
    autoScrollRef.current = requestAnimationFrame(scroll);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current !== null) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  }, []);

  const startDrag = useCallback(
    (e: React.MouseEvent, type: RowItemType, source: DragSource, rowEl: HTMLElement) => {
      e.preventDefault();
      e.stopPropagation();

      const rowMap = buildRowMap(
        hierarchy,
        state.currentFilter,
        state.collapsedPhases,
        state.collapsedSubPhases,
      );

      // Find the task list container (the parent of rows with position: relative)
      const listEl = rowEl.parentElement;
      if (!listEl) return;
      const listRect = listEl.getBoundingClientRect();

      // Create ghost element
      const ghost = rowEl.cloneNode(true) as HTMLElement;
      ghost.style.position = 'fixed';
      ghost.style.width = `${rowEl.offsetWidth}px`;
      ghost.style.height = `${ROW_HEIGHT}px`;
      ghost.style.pointerEvents = 'none';
      ghost.style.zIndex = '10000';
      ghost.style.opacity = '0.85';
      ghost.style.background = 'var(--bg-card)';
      ghost.style.borderRadius = '8px';
      ghost.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
      ghost.style.top = `${e.clientY - 24}px`;
      ghost.style.left = `${listRect.left}px`;
      document.body.appendChild(ghost);

      const scrollEl = scrollContainerRef.current;
      const scrollTop = scrollEl ? scrollEl.scrollTop : 0;

      dragStateRef.current = {
        type,
        source,
        startY: e.clientY,
        rowMap,
        listElTop: listRect.top + scrollTop,
        ghostEl: ghost,
        grabOffsetY: 24,
      };

      setIsDragging(true);
      setDragSource(source);
      dropIndicatorRowRef.current = null;
      setDropIndicatorRow(null);
    },
    [hierarchy, state.currentFilter, state.collapsedPhases, state.collapsedSubPhases, scrollContainerRef],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const ds = dragStateRef.current;
      if (!ds) return;

      // Move ghost
      if (ds.ghostEl) {
        ds.ghostEl.style.top = `${e.clientY - ds.grabOffsetY}px`;
      }

      // Compute which row the pointer is over
      const scrollEl = scrollContainerRef.current;
      if (!scrollEl) return;

      const listColEl = scrollEl.querySelector('.sticky-col');
      if (!listColEl) return;

      // The task list area starts after the header (52px)
      const listAreaEl = listColEl.children[1] as HTMLElement; // TaskListColumn container
      if (!listAreaEl) return;
      const listRect = listAreaEl.getBoundingClientRect();

      const relativeY = e.clientY - listRect.top;
      const hoveredRow = Math.floor(relativeY / ROW_HEIGHT);
      const rowMap = ds.rowMap;

      // Determine valid drop position
      let indicatorRow: number | null = null;

      if (hoveredRow < 0 || hoveredRow >= rowMap.length) {
        // Outside bounds — clamp to edges
        if (hoveredRow < 0) indicatorRow = 0;
        else indicatorRow = rowMap.length;
      } else {
        // Decide indicator placement based on drag type
        if (ds.type === 'phase') {
          // Find nearest phase boundary
          indicatorRow = findPhaseDropRow(hoveredRow, relativeY, rowMap, ds.source);
        } else if (ds.type === 'sub-phase') {
          indicatorRow = findSubPhaseDropRow(hoveredRow, relativeY, rowMap, ds.source);
        } else {
          indicatorRow = findTaskDropRow(hoveredRow, relativeY, rowMap, ds.source);
        }
      }

      dropIndicatorRowRef.current = indicatorRow;
      setDropIndicatorRow(indicatorRow);

      // Auto-scroll
      const containerRect = scrollEl.getBoundingClientRect();
      const edgeThreshold = 60;
      if (e.clientY < containerRect.top + edgeThreshold) {
        startAutoScroll(scrollEl, -5);
      } else if (e.clientY > containerRect.bottom - edgeThreshold) {
        startAutoScroll(scrollEl, 5);
      } else {
        stopAutoScroll();
      }
    };

    const handleMouseUp = () => {
      const ds = dragStateRef.current;
      if (!ds) return;

      // Remove ghost
      if (ds.ghostEl && ds.ghostEl.parentNode) {
        ds.ghostEl.parentNode.removeChild(ds.ghostEl);
      }

      stopAutoScroll();

      const rowMap = ds.rowMap;
      const indicatorRow = dropIndicatorRowRef.current;

      if (indicatorRow !== null && indicatorRow >= 0) {
        if (ds.type === 'phase') {
          dispatchPhaseReorder(ds.source, indicatorRow, rowMap, hierarchy, dispatch);
        } else if (ds.type === 'sub-phase') {
          dispatchSubPhaseReorder(ds.source, indicatorRow, rowMap, hierarchy, dispatch);
        } else {
          dispatchTaskReorder(ds.source, indicatorRow, rowMap, hierarchy, dispatch);
        }
      }

      dragStateRef.current = null;
      dropIndicatorRowRef.current = null;
      setIsDragging(false);
      setDragSource(null);
      setDropIndicatorRow(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, hierarchy, dispatch, scrollContainerRef, startAutoScroll, stopAutoScroll]);

  return { startDrag, isDragging, dragSource, dropIndicatorRow };
}

// ---- Drop row computation helpers ----

function findPhaseDropRow(
  hoveredRow: number,
  relativeY: number,
  rowMap: RowItem[],
  source: DragSource,
): number | null {
  // Find which phase block we're in, and whether we're in the top or bottom half
  const inTopHalf = (relativeY % ROW_HEIGHT) < ROW_HEIGHT / 2;

  // Find the phase boundaries
  const phaseBoundaries: number[] = []; // row indices where phases start
  rowMap.forEach((item, i) => {
    if (item.type === 'phase') phaseBoundaries.push(i);
  });
  phaseBoundaries.push(rowMap.length); // sentinel for "after last phase"

  // Find which phase the cursor is within
  let targetBoundary = 0;
  for (let i = 0; i < phaseBoundaries.length - 1; i++) {
    const start = phaseBoundaries[i];
    const end = phaseBoundaries[i + 1];
    if (hoveredRow >= start && hoveredRow < end) {
      targetBoundary = inTopHalf || hoveredRow === start ? i : i + 1;
      break;
    }
  }

  const dropRow = phaseBoundaries[targetBoundary] ?? rowMap.length;

  // Don't drop on self
  const sourcePhaseStart = phaseBoundaries.find(
    (b) => rowMap[b]?.masterPhase === source.masterPhase,
  );
  if (sourcePhaseStart !== undefined) {
    const sourceIdx = phaseBoundaries.indexOf(sourcePhaseStart);
    const sourceNextIdx = sourceIdx + 1;
    const sourceEnd = phaseBoundaries[sourceNextIdx] ?? rowMap.length;
    if (dropRow === sourcePhaseStart || dropRow === sourceEnd) return null;
  }

  return dropRow;
}

function findSubPhaseDropRow(
  hoveredRow: number,
  relativeY: number,
  rowMap: RowItem[],
  source: DragSource,
): number | null {
  const inTopHalf = (relativeY % ROW_HEIGHT) < ROW_HEIGHT / 2;

  // Collect sub-phase boundaries across all phases
  const subBoundaries: { row: number; masterPhase: string; subPhase: string }[] = [];
  rowMap.forEach((item, i) => {
    if (item.type === 'sub-phase') {
      subBoundaries.push({ row: i, masterPhase: item.masterPhase, subPhase: item.subPhase! });
    }
  });

  if (subBoundaries.length === 0) return null;

  // Find which sub-phase block the cursor is in
  let targetIdx = 0;
  for (let i = 0; i < subBoundaries.length; i++) {
    const start = subBoundaries[i].row;
    const end = i + 1 < subBoundaries.length ? subBoundaries[i + 1].row : rowMap.length;
    if (hoveredRow >= start && hoveredRow < end) {
      // If hovering on the sub-phase header itself, check half
      if (hoveredRow === start && inTopHalf) {
        targetIdx = i;
      } else {
        targetIdx = i + 1;
      }
      break;
    } else if (hoveredRow < start) {
      targetIdx = i;
      break;
    }
    targetIdx = i + 1;
  }

  const dropRow = targetIdx < subBoundaries.length ? subBoundaries[targetIdx].row : rowMap.length;

  // Don't drop on self
  const sourceSubStart = subBoundaries.find(
    (b) => b.masterPhase === source.masterPhase && b.subPhase === source.subPhase,
  );
  if (sourceSubStart) {
    const sourceIdx = subBoundaries.indexOf(sourceSubStart);
    const sourceNextRow = sourceIdx + 1 < subBoundaries.length ? subBoundaries[sourceIdx + 1].row : rowMap.length;
    if (dropRow === sourceSubStart.row || dropRow === sourceNextRow) return null;
  }

  return dropRow;
}

function findTaskDropRow(
  hoveredRow: number,
  relativeY: number,
  rowMap: RowItem[],
  source: DragSource,
): number | null {
  const inTopHalf = (relativeY % ROW_HEIGHT) < ROW_HEIGHT / 2;
  const hoveredItem = rowMap[hoveredRow];
  if (!hoveredItem) return null;

  // Tasks can only be dropped among task rows or right after a sub-phase header
  if (hoveredItem.type === 'task') {
    const dropRow = inTopHalf ? hoveredRow : hoveredRow + 1;
    // Don't drop on self (same position)
    if (hoveredItem.taskId === source.taskId) return null;
    // Check if dropping right after self
    if (!inTopHalf && hoveredRow + 1 < rowMap.length) {
      const nextItem = rowMap[hoveredRow + 1];
      if (nextItem?.taskId === source.taskId) return null;
    }
    if (inTopHalf && hoveredRow > 0) {
      const prevItem = rowMap[hoveredRow - 1];
      if (prevItem?.taskId === source.taskId) return null;
    }
    return dropRow;
  }

  if (hoveredItem.type === 'sub-phase') {
    // Drop as first task in this sub-phase
    return hoveredRow + 1;
  }

  if (hoveredItem.type === 'phase') {
    // Drop into first sub-phase of this phase, or skip
    if (hoveredRow + 1 < rowMap.length && rowMap[hoveredRow + 1].type === 'sub-phase') {
      return hoveredRow + 2; // after the first sub-phase header
    }
  }

  return null;
}

// ---- Dispatch helpers ----

function dispatchPhaseReorder(
  source: DragSource,
  dropRow: number,
  rowMap: RowItem[],
  hierarchy: HierarchyMap,
  dispatch: React.Dispatch<GanttAction>,
) {
  const masterPhases = Object.keys(hierarchy);
  const orderedPhases = [...masterPhases];

  // Remove source from its current position
  const sourceIdx = orderedPhases.indexOf(source.masterPhase);
  if (sourceIdx < 0) return;
  orderedPhases.splice(sourceIdx, 1);

  // Find which phase the drop row corresponds to
  let insertBeforePhase: string | null = null;
  if (dropRow < rowMap.length) {
    // Walk up from dropRow to find the owning phase
    const item = rowMap[dropRow];
    if (item) insertBeforePhase = item.masterPhase;
  }

  if (insertBeforePhase && insertBeforePhase !== source.masterPhase) {
    const insertIdx = orderedPhases.indexOf(insertBeforePhase);
    if (insertIdx >= 0) {
      orderedPhases.splice(insertIdx, 0, source.masterPhase);
    } else {
      orderedPhases.push(source.masterPhase);
    }
  } else {
    orderedPhases.push(source.masterPhase);
  }

  dispatch({ type: 'REORDER_PHASES', orderedPhases });
}

function dispatchSubPhaseReorder(
  source: DragSource,
  dropRow: number,
  rowMap: RowItem[],
  hierarchy: HierarchyMap,
  dispatch: React.Dispatch<GanttAction>,
) {
  if (!source.subPhase) return;

  // Determine target master phase and insertion point
  let targetMaster: string | null = null;
  let insertBeforeSub: string | undefined;

  if (dropRow < rowMap.length) {
    const item = rowMap[dropRow];
    targetMaster = item.masterPhase;
    if (item.type === 'sub-phase') {
      insertBeforeSub = item.subPhase;
    }
  } else {
    // Dropping at the very end — find last phase
    const lastItem = rowMap[rowMap.length - 1];
    targetMaster = lastItem?.masterPhase ?? null;
  }

  if (!targetMaster) return;

  if (targetMaster === source.masterPhase) {
    // Same phase — reorder sub-phases
    const subPhases = Object.keys(hierarchy[targetMaster] || {});
    const ordered = [...subPhases];
    const srcIdx = ordered.indexOf(source.subPhase);
    if (srcIdx < 0) return;
    ordered.splice(srcIdx, 1);

    if (insertBeforeSub) {
      const destIdx = ordered.indexOf(insertBeforeSub);
      if (destIdx >= 0) {
        ordered.splice(destIdx, 0, source.subPhase);
      } else {
        ordered.push(source.subPhase);
      }
    } else {
      ordered.push(source.subPhase);
    }

    dispatch({ type: 'REORDER_SUB_PHASES', masterPhase: targetMaster, orderedSubPhases: ordered });
  } else {
    // Cross-phase move
    dispatch({
      type: 'MOVE_SUB_PHASE',
      subPhase: source.subPhase,
      sourceMasterPhase: source.masterPhase,
      targetMasterPhase: targetMaster,
      insertBeforeSubPhase: insertBeforeSub,
    });
  }
}

function dispatchTaskReorder(
  source: DragSource,
  dropRow: number,
  rowMap: RowItem[],
  hierarchy: HierarchyMap,
  dispatch: React.Dispatch<GanttAction>,
) {
  if (!source.taskId || !source.subPhase) return;

  // Determine target phase and insertion point
  let targetMaster: string | null = null;
  let targetSub: string | null = null;
  let insertBeforeTaskId: string | undefined;

  if (dropRow < rowMap.length) {
    const item = rowMap[dropRow];
    targetMaster = item.masterPhase;
    targetSub = item.subPhase ?? null;
    if (item.type === 'task' && item.taskId !== source.taskId) {
      insertBeforeTaskId = item.taskId;
    }
    // If landing on a sub-phase or phase header, find the sub-phase
    if (!targetSub && item.type === 'sub-phase') {
      targetSub = item.subPhase ?? null;
    }
    if (!targetSub) {
      // Walk forward to find the first sub-phase
      for (let i = dropRow; i < rowMap.length; i++) {
        if (rowMap[i].subPhase && rowMap[i].masterPhase === targetMaster) {
          targetSub = rowMap[i].subPhase!;
          break;
        }
      }
    }
  } else {
    // End of list — find last sub-phase
    const lastItem = rowMap[rowMap.length - 1];
    if (lastItem) {
      targetMaster = lastItem.masterPhase;
      targetSub = lastItem.subPhase ?? null;
    }
  }

  if (!targetMaster || !targetSub) return;

  const targetPhase = `${targetMaster} ${targetSub}`;
  dispatch({
    type: 'MOVE_REORDER_TASK',
    taskId: source.taskId,
    targetPhase,
    insertBeforeTaskId,
  });
}
