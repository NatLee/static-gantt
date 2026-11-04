'use client';

import React, { useState } from 'react';
import { ChevronDown, Plus, FolderOpen, CheckCircle2, Clock4, CircleDashed, GripVertical } from 'lucide-react';
import { ComputedTask, GanttState, GanttAction, HierarchyMap } from '@/types';
import { useDragReorder, DragSource } from '@/hooks/useDragReorder';
import { useRowHover } from '@/hooks/useRowHover';
import { ROW_HEIGHT, Z } from '@/lib/ganttLayout';
import { hueFromString } from '@/lib/colorHash';
import { joinPhase, subPhaseKey } from '@/lib/phase';
import type { VirtualWindow } from '@/hooks/useVirtualRows';
import TaskContextMenu from './TaskContextMenu';
import PhaseContextMenu from './PhaseContextMenu';
import AssigneeAvatar from './AssigneeAvatar';
import { useI18n } from '@/i18n/I18nProvider';

interface TaskListColumnProps {
  hierarchy: HierarchyMap;
  state: GanttState;
  dispatch: React.Dispatch<GanttAction>;
  totalRows: number;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  virtualWindow: VirtualWindow;
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'done') return <CheckCircle2 size={14} className="text-emerald-400" />;
  if (status === 'in-progress') return <Clock4 size={14} className="text-indigo-400" />;
  return <CircleDashed size={14} className="text-slate-400" />;
}

function TagChips({ tags }: { tags: string[] }) {
  const visible = tags.slice(0, 2);
  const rest = tags.length - visible.length;
  return (
    <span style={{ display: 'flex', gap: 3, marginLeft: 6, flexShrink: 0 }}>
      {visible.map((t) => (
        <span
          key={t}
          title={t}
          style={{
            fontSize: 9,
            fontWeight: 700,
            padding: '1px 5px',
            borderRadius: 4,
            background: 'var(--accent-glow)',
            color: 'var(--accent)',
            maxWidth: 60,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {t}
        </span>
      ))}
      {rest > 0 && (
        <span
          title={tags.slice(2).join(', ')}
          style={{
            fontSize: 9,
            fontWeight: 700,
            padding: '1px 5px',
            borderRadius: 4,
            color: 'var(--text-secondary)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          +{rest}
        </span>
      )}
    </span>
  );
}

export default function TaskListColumn({
  hierarchy,
  state,
  dispatch,
  totalRows,
  scrollContainerRef,
  virtualWindow,
}: TaskListColumnProps) {
  const { t } = useI18n();
  const inWindow = (rowIdx: number) =>
    !virtualWindow.enabled ||
    (rowIdx >= virtualWindow.startIndex && rowIdx <= virtualWindow.endIndex);
  const { currentFilter, collapsedPhases, collapsedSubPhases, selectedTaskId } = state;
  const { setHover } = useRowHover();
  const masterPhases = Object.keys(hierarchy);
  const [contextMenu, setContextMenu] = useState<{ task: ComputedTask; x: number; y: number } | null>(null);
  const [phaseMenu, setPhaseMenu] = useState<{
    kind: 'phase' | 'sub-phase';
    masterPhase: string;
    subPhase?: string;
    isCollapsed: boolean;
    x: number;
    y: number;
  } | null>(null);

  const { startDrag, isDragging, dragSource, dropIndicatorRow } = useDragReorder(
    hierarchy,
    state,
    dispatch,
    scrollContainerRef,
  );

  const rows: React.ReactNode[] = [];
  const addButtons: React.ReactNode[] = [];
  let rowIndex = 0;

  masterPhases.forEach((master) => {
    if (currentFilter !== 'ALL' && currentFilter !== master) return;

    const subs = hierarchy[master];
    const isPhaseCollapsed = collapsedPhases.has(master);

    const isPhaseBeingDragged =
      isDragging &&
      dragSource?.type === 'phase' &&
      dragSource.masterPhase === master;

    // Phase header row
    const phaseHue = hueFromString(master);
    if (inWindow(rowIndex)) rows.push(
      <div
        key={`phase-${master}`}
        data-row
        className="phase-row"
        style={{
          position: 'absolute',
          top: rowIndex * ROW_HEIGHT,
          left: 0,
          right: 0,
          height: ROW_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          opacity: isPhaseBeingDragged ? 0.35 : 1,
          background: isPhaseBeingDragged
            ? 'var(--accent-glow)'
            : `hsla(${phaseHue}, 65%, 55%, 0.12)`,
          transition: 'opacity 0.15s',
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setPhaseMenu({
            kind: 'phase',
            masterPhase: master,
            isCollapsed: isPhaseCollapsed,
            x: e.clientX,
            y: e.clientY,
          });
        }}
      >
        <span
          className="drag-handle"
          onMouseDown={(e) => {
            const source: DragSource = { type: 'phase', masterPhase: master };
            startDrag(e, 'phase', source, e.currentTarget.parentElement!);
          }}
        >
          <GripVertical size={14} />
        </span>
        <span
          className={`collapse-btn ${isPhaseCollapsed ? 'collapsed' : ''}`}
          onClick={() => dispatch({ type: 'TOGGLE_PHASE_COLLAPSE', phase: master })}
        >
          <ChevronDown size={14} />
        </span>
        <span
          style={{
            background: `linear-gradient(135deg, hsl(${phaseHue} 70% 45%), hsl(${phaseHue} 70% 62%))`,
            color: '#fff',
            fontSize: 10,
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 6,
            letterSpacing: '0.5px',
            marginRight: 8,
            cursor: 'pointer',
          }}
          onClick={() =>
            dispatch({
              type: 'OPEN_DIALOG',
              dialog: { type: 'edit-phase', context: { phase: master } },
            })
          }
        >
          {master}
        </span>
      </div>
    );
    rowIndex++;

    if (isPhaseCollapsed) return;

    const subKeys = Object.keys(subs);

    subKeys.forEach((sub) => {
      const collapseKey = subPhaseKey(master, sub);
      const isSubCollapsed = collapsedSubPhases.has(collapseKey);
      const tasks = subs[sub];

      const isSubBeingDragged =
        isDragging &&
        dragSource?.type === 'sub-phase' &&
        dragSource.masterPhase === master &&
        dragSource.subPhase === sub;

      // Sub-phase header row
      if (inWindow(rowIndex)) rows.push(
        <div
          key={`sub-${master}-${sub}`}
          data-row
          className="sub-phase-row"
          style={{
            position: 'absolute',
            top: rowIndex * ROW_HEIGHT,
            left: 0,
            right: 0,
            height: ROW_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            paddingLeft: 20,
            opacity: isSubBeingDragged ? 0.35 : 1,
            background: isSubBeingDragged
              ? 'var(--accent-glow)'
              : `hsla(${phaseHue}, 55%, 55%, 0.06)`,
            transition: 'opacity 0.15s',
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setPhaseMenu({
              kind: 'sub-phase',
              masterPhase: master,
              subPhase: sub,
              isCollapsed: isSubCollapsed,
              x: e.clientX,
              y: e.clientY,
            });
          }}
        >
          <span
            className="drag-handle"
            onMouseDown={(e) => {
              const source: DragSource = { type: 'sub-phase', masterPhase: master, subPhase: sub };
              startDrag(e, 'sub-phase', source, e.currentTarget.parentElement!);
            }}
          >
            <GripVertical size={12} />
          </span>
          <span
            className={`collapse-btn ${isSubCollapsed ? 'collapsed' : ''}`}
            onClick={() => dispatch({ type: 'TOGGLE_SUB_PHASE_COLLAPSE', key: collapseKey })}
          >
            <ChevronDown size={12} />
          </span>
          <FolderOpen size={14} style={{ marginRight: 6, color: 'var(--text-secondary)' }} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            className="task-name-text"
            onClick={() =>
              dispatch({
                type: 'OPEN_DIALOG',
                dialog: { type: 'edit-sub-phase', context: { masterPhase: master, subPhase: sub } },
              })
            }
          >
            {sub}
          </span>
        </div>
      );
      rowIndex++;

      if (isSubCollapsed) return;

      // Task rows
      tasks.forEach((task) => {
        const isTaskBeingDragged =
          isDragging &&
          dragSource?.type === 'task' &&
          dragSource.taskId === task.id;

        if (inWindow(rowIndex)) rows.push(
          <div
            key={`task-${task.id}`}
            data-row
            data-task-row-id={task.id}
            className={`task-row${selectedTaskId === task.id ? ' row-selected' : ''}`}
            style={{
              position: 'absolute',
              top: rowIndex * ROW_HEIGHT,
              left: 0,
              right: 0,
              height: ROW_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              paddingLeft: 40,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
              opacity: isTaskBeingDragged ? 0.35 : 1,
            }}
            onMouseEnter={() => {
              if (!isTaskBeingDragged) setHover(task.id);
            }}
            onMouseLeave={() => {
              if (!isTaskBeingDragged) setHover(null);
            }}
            onClick={() => {
              if (isDragging) return;
              dispatch({ type: 'SET_SELECTED_TASK', taskId: task.id });
              dispatch({ type: 'OPEN_TASK_EDITOR', taskId: task.id });
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ task, x: e.clientX, y: e.clientY });
            }}
          >
            <span
              className="drag-handle"
              onMouseDown={(e) => {
                e.stopPropagation();
                const source: DragSource = {
                  type: 'task',
                  masterPhase: master,
                  subPhase: sub,
                  taskId: task.id,
                };
                startDrag(e, 'task', source, e.currentTarget.parentElement!);
              }}
            >
              <GripVertical size={12} />
            </span>
            <StatusIcon status={task.status} />
            <span
              className="task-name-text"
              style={{
                marginLeft: 8,
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            >
              {task.name}
            </span>
            {task.tags && task.tags.length > 0 && <TagChips tags={task.tags} />}
            {task.assignee && (
              <span style={{ marginLeft: 6, display: 'inline-flex' }}>
                <AssigneeAvatar name={task.assignee} />
              </span>
            )}
          </div>
        );
        rowIndex++;
      });

      // "Add Task" overlay
      const addTaskAnchor = rowIndex - 1;
      addButtons.push(
        <div
          key={`add-task-${master}-${sub}`}
          className="add-row-container"
          style={{
            position: 'absolute',
            top: (addTaskAnchor + 1) * ROW_HEIGHT - 16,
            left: 0,
            right: 0,
            height: 0,
            overflow: 'visible',
            zIndex: Z.barsHover,
          }}
        >
          <div
            className="add-row"
            onClick={() =>
              dispatch({
                type: 'OPEN_DIALOG',
                dialog: {
                  type: 'add-task',
                  context: { phase: joinPhase(master, sub) },
                },
              })
            }
          >
            <Plus size={12} />
            {t('list.addTask')}
          </div>
        </div>
      );
    });

    // "Add Sub-Phase" overlay
    const addSubAnchor = rowIndex - 1;
    addButtons.push(
      <div
        key={`add-sub-${master}`}
        className="add-row-container"
        style={{
          position: 'absolute',
          top: (addSubAnchor + 1) * ROW_HEIGHT - 16,
          left: 0,
          right: 0,
          height: 0,
          overflow: 'visible',
          zIndex: Z.barsHover,
        }}
      >
        <div
          className="add-row"
          onClick={() =>
            dispatch({
              type: 'OPEN_DIALOG',
              dialog: {
                type: 'add-sub-phase',
                context: { masterPhase: master },
              },
            })
          }
        >
          <Plus size={12} />
          {t('list.addSubPhase')}
        </div>
      </div>
    );
  });

  // "Add Phase" overlay
  addButtons.push(
    <div
      key="add-phase"
      className="add-row-container"
      style={{
        position: 'absolute',
        top: totalRows * ROW_HEIGHT - 16,
        left: 0,
        right: 0,
        height: 0,
        overflow: 'visible',
        zIndex: Z.barsHover,
      }}
    >
      <div
        className="add-row"
        onClick={() =>
          dispatch({
            type: 'OPEN_DIALOG',
            dialog: { type: 'add-phase', context: {} },
          })
        }
      >
        <Plus size={12} />
        {t('list.addPhase')}
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative', height: totalRows * ROW_HEIGHT, overflow: 'visible' }}>
      {rows}
      {!isDragging && addButtons}

      {/* Drop indicator (left-list internal drag) */}
      {isDragging && dropIndicatorRow !== null && (
        <div
          className="drop-indicator"
          style={{
            position: 'absolute',
            top: dropIndicatorRow * ROW_HEIGHT - 1,
            left: 8,
            right: 8,
          }}
        />
      )}

      {/* Drop indicator (bar drag from right panel — imperatively shown) */}
      <div
        className="drop-indicator bar-drag-drop-indicator"
        style={{
          position: 'absolute',
          display: 'none',
          top: 0,
          left: 8,
          right: 8,
        }}
      />

      {/* Forbidden-row indicator (shown when the hovered row rejects the drop) */}
      <div
        className="bar-drag-forbidden-indicator bar-drag-forbidden-indicator-left"
        style={{
          display: 'none',
          top: 0,
          left: 4,
          right: 4,
        }}
      />


      {contextMenu && (
        <TaskContextMenu
          task={contextMenu.task}
          x={contextMenu.x}
          y={contextMenu.y}
          dispatch={dispatch}
          onClose={() => setContextMenu(null)}
        />
      )}

      {phaseMenu && (
        <PhaseContextMenu
          kind={phaseMenu.kind}
          masterPhase={phaseMenu.masterPhase}
          subPhase={phaseMenu.subPhase}
          isCollapsed={phaseMenu.isCollapsed}
          x={phaseMenu.x}
          y={phaseMenu.y}
          dispatch={dispatch}
          onClose={() => setPhaseMenu(null)}
        />
      )}
    </div>
  );
}
