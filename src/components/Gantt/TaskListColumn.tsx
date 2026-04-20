'use client';

import React, { useState } from 'react';
import { ChevronDown, Plus, FolderOpen, CheckCircle2, Clock4, CircleDashed, GripVertical } from 'lucide-react';
import { ComputedTask, GanttState, GanttAction, HierarchyMap } from '@/types';
import { useDragReorder, DragSource } from '@/hooks/useDragReorder';
import { ROW_HEIGHT, Z } from '@/lib/ganttLayout';
import type { VirtualWindow } from '@/hooks/useVirtualRows';
import TaskContextMenu from './TaskContextMenu';

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

function AssigneeAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  // Deterministic hue from name
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  return (
    <span
      title={name}
      style={{
        marginLeft: 6,
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: `hsl(${hue} 70% 45%)`,
        color: '#fff',
        fontSize: 9,
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {initials || '?'}
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
  const inWindow = (rowIdx: number) =>
    !virtualWindow.enabled ||
    (rowIdx >= virtualWindow.startIndex && rowIdx <= virtualWindow.endIndex);
  const { currentFilter, collapsedPhases, collapsedSubPhases } = state;
  const masterPhases = Object.keys(hierarchy);
  const [contextMenu, setContextMenu] = useState<{ task: ComputedTask; x: number; y: number } | null>(null);

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
    if (inWindow(rowIndex)) rows.push(
      <div
        key={`phase-${master}`}
        data-row
        style={{
          position: 'absolute',
          top: rowIndex * ROW_HEIGHT,
          left: 0,
          right: 0,
          height: ROW_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          borderBottom: '1px solid var(--border-color)',
          opacity: isPhaseBeingDragged ? 0.35 : 1,
          background: isPhaseBeingDragged ? 'var(--accent-glow)' : undefined,
          transition: 'opacity 0.15s',
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
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
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
      const collapseKey = `${master}::${sub}`;
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
            borderBottom: '1px solid var(--border-color)',
            opacity: isSubBeingDragged ? 0.35 : 1,
            background: isSubBeingDragged ? 'var(--accent-glow)' : undefined,
            transition: 'opacity 0.15s',
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
              borderBottom: '1px solid var(--border-color)',
              cursor: 'pointer',
              transition: 'background 0.15s, opacity 0.15s',
              opacity: isTaskBeingDragged ? 0.35 : 1,
              background: isTaskBeingDragged ? 'var(--accent-glow)' : undefined,
            }}
            onMouseEnter={(e) => {
              if (!isTaskBeingDragged) {
                (e.currentTarget as HTMLElement).style.background = 'var(--accent-glow)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isTaskBeingDragged) {
                (e.currentTarget as HTMLElement).style.background = '';
              }
            }}
            onClick={() => {
              if (!isDragging) dispatch({ type: 'OPEN_TASK_EDITOR', taskId: task.id });
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
            {task.assignee && <AssigneeAvatar name={task.assignee} />}
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
                  context: { phase: `${master} ${sub}` },
                },
              })
            }
          >
            <Plus size={12} />
            Add Task
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
          Add Sub-Phase
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
        Add Phase
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative', height: totalRows * ROW_HEIGHT, overflow: 'visible' }}>
      {rows}
      {!isDragging && addButtons}

      {/* Drop indicator */}
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

      {contextMenu && (
        <TaskContextMenu
          task={contextMenu.task}
          x={contextMenu.x}
          y={contextMenu.y}
          dispatch={dispatch}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
