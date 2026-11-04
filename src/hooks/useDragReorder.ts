'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { GanttState, GanttAction, HierarchyMap } from '@/types';
import { ROW_HEIGHT } from '@/lib/ganttLayout';
import { createAutoScroll, computeEdgeScrollSpeed } from '@/lib/autoScroll';
import { joinPhase, subPhaseKey } from '@/lib/phase';

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

/** Marks the element whose top edge is row 0 of the task list (set by TaskListColumn). */
export const TASK_LIST_ROWS_ATTR = 'data-task-list-rows';

/**
 * The task list's row container. Drop targets are computed from the pointer's distance to its top
 * edge, so this must be the element the rows are positioned in. It used to be found as "the second
 * child of .sticky-col", which became the sidebar's resize handle when the layout changed; every
 * drop then landed one row too low (a sideways drag could even move a task into the next
 * sub-phase).
 */
export function taskListRowsEl(scrollEl: ParentNode | null): HTMLElement | null {
  return scrollEl?.querySelector<HTMLElement>(`[${TASK_LIST_ROWS_ATTR}]`) ?? null;
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

      if (collapsedSubPhases.has(subPhaseKey(master, sub))) return;

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

  const autoScrollRef = useRef(createAutoScroll());

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

      const listAreaEl = taskListRowsEl(scrollEl);
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
      const speed = computeEdgeScrollSpeed(e.clientY, containerRect);
      if (speed === 0) autoScrollRef.current.stop();
      else autoScrollRef.current.update(scrollEl, speed);
    };

    const handleMouseUp = () => {
      const ds = dragStateRef.current;
      if (!ds) return;

      // Remove ghost
      if (ds.ghostEl && ds.ghostEl.parentNode) {
        ds.ghostEl.parentNode.removeChild(ds.ghostEl);
      }

      autoScrollRef.current.stop();

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
  }, [isDragging, hierarchy, dispatch, scrollContainerRef]);

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

/**
 * The gap (index into rowMap: "in front of row N") a task would go to with the pointer at
 * `relativeY` over `hoveredRow`, or null where tasks can't be dropped (a phase without an open
 * sub-phase). Over a task row the upper half means "above it", the lower half "below it".
 */
export function taskDropGap(hoveredRow: number, relativeY: number, rowMap: RowItem[]): number | null {
  const inTopHalf = (relativeY % ROW_HEIGHT) < ROW_HEIGHT / 2;
  const hoveredItem = rowMap[hoveredRow];
  if (!hoveredItem) return null;
  if (hoveredItem.type === 'task') return inTopHalf ? hoveredRow : hoveredRow + 1;
  // Over a sub-phase header: first task of that sub-phase.
  if (hoveredItem.type === 'sub-phase') return hoveredRow + 1;
  // Over a phase header: first task of its first sub-phase.
  if (rowMap[hoveredRow + 1]?.type === 'sub-phase') return hoveredRow + 2;
  return null;
}

/** True when dropping into `gap` would leave the task exactly where it is. */
export function isOwnSlot(gap: number, rowMap: RowItem[], source: DragSource): boolean {
  return rowMap[gap]?.taskId === source.taskId || rowMap[gap - 1]?.taskId === source.taskId;
}

/** The gap a dragged task would move to, or null when it would not move. */
export function findTaskDropRow(
  hoveredRow: number,
  relativeY: number,
  rowMap: RowItem[],
  source: DragSource,
): number | null {
  const gap = taskDropGap(hoveredRow, relativeY, rowMap);
  return gap === null || isOwnSlot(gap, rowMap, source) ? null : gap;
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

/**
 * Given a source task drag and a target drop-row index into rowMap, resolve
 * the final `{ targetPhase, insertBeforeTaskId }` for MOVE_REORDER_TASK /
 * MOVE_TASK_WITH_REORDER. Shared by left-panel list drag and right-side bar
 * drag so both paths behave identically.
 *
 * `dropRow` is a gap: the drop line drawn between rowMap[dropRow - 1] and rowMap[dropRow].
 * With a task below the gap, the dragged task goes in front of it, in that task's sub-phase.
 * Otherwise the gap closes a group (or the list), and the task is appended to the sub-phase of
 * the row above. That case used to take the row *below*, so dropping under the last task of
 * "UX" sent the task to the end of the next sub-phase, "UI".
 *
 * Leaves `insertBeforeTaskId` undefined to signal "append to target phase"
 * (the reducer handles that by inserting after the last task in targetPhase).
 */
export function resolveTaskDropTarget(
  source: DragSource,
  dropRow: number,
  rowMap: RowItem[],
): { targetPhase: string; insertBeforeTaskId?: string } | null {
  if (!source.taskId) return null;

  const below = rowMap[dropRow];
  if (below?.type === 'task' && below.subPhase) {
    if (below.taskId === source.taskId) return null; // dropped back into its own slot
    return { targetPhase: joinPhase(below.masterPhase, below.subPhase), insertBeforeTaskId: below.taskId };
  }

  const above = rowMap[dropRow - 1];
  if (!above) return null;
  // Under a phase header (its first sub-phase is collapsed): that phase's first sub-phase.
  const targetSub =
    above.subPhase ??
    rowMap.slice(dropRow).find(r => r.masterPhase === above.masterPhase && r.subPhase)?.subPhase;
  if (!targetSub) return null;
  return { targetPhase: joinPhase(above.masterPhase, targetSub) };
}

function dispatchTaskReorder(
  source: DragSource,
  dropRow: number,
  rowMap: RowItem[],
  hierarchy: HierarchyMap,
  dispatch: React.Dispatch<GanttAction>,
) {
  if (!source.taskId || !source.subPhase) return;
  const resolved = resolveTaskDropTarget(source, dropRow, rowMap);
  if (!resolved) return;
  dispatch({
    type: 'MOVE_REORDER_TASK',
    taskId: source.taskId,
    targetPhase: resolved.targetPhase,
    insertBeforeTaskId: resolved.insertBeforeTaskId,
  });
}
