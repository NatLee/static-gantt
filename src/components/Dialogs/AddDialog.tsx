'use client';

import { Dispatch, useEffect, useState, useRef, useCallback } from 'react';
import { GanttState, GanttAction, Task } from '@/types';
import { genId, formatISO } from '@/lib/dateUtils';
import { MS_COLORS } from '@/data/defaultProject';

interface AddDialogProps {
  state: GanttState;
  dispatch: Dispatch<GanttAction>;
  masterPhases: string[];
}

export default function AddDialog({ state, dispatch }: AddDialogProps) {
  const dialog = state.activeDialog;

  // Form fields
  const [phaseName, setPhaseName] = useState('');
  const [subPhaseName, setSubPhaseName] = useState('');
  const [taskName, setTaskName] = useState('');
  const [duration, setDuration] = useState(5);
  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');

  const firstInputRef = useRef<HTMLInputElement>(null);

  // Reset form when dialog changes
  useEffect(() => {
    if (!dialog) return;

    setPhaseName('');
    setSubPhaseName('');
    setTaskName('');
    setDuration(5);
    setMilestoneName('');
    setMilestoneDate('');

    // Pre-populate for edit dialogs
    if (dialog.type === 'edit-phase' && (dialog.context.phase || dialog.context.masterPhase)) {
      setPhaseName(dialog.context.phase || dialog.context.masterPhase);
    }
    if (dialog.type === 'edit-sub-phase' && dialog.context.subPhase) {
      setSubPhaseName(dialog.context.subPhase);
    }
    if (dialog.type === 'edit-milestone') {
      // The edit trigger only passes { milestoneId }, so look the milestone up
      // from state to pre-fill the current name/date (otherwise both fields
      // open blank and a "Save" with empty fields silently no-ops).
      const ms = state.milestones.find(m => m.id === dialog.context.milestoneId);
      setMilestoneName(dialog.context.name || ms?.name || '');
      setMilestoneDate(dialog.context.date || ms?.date || '');
    }

    // Auto-focus first input
    setTimeout(() => {
      firstInputRef.current?.focus();
    }, 50);
    // Intentionally only re-run when the dialog identity changes; we snapshot
    // milestones at open time and must not reset fields on later state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog]);

  const handleClose = useCallback(() => {
    dispatch({ type: 'CLOSE_DIALOG' });
  }, [dispatch]);

  const findLastTaskId = useCallback((filterFn?: (t: Task) => boolean): string | undefined => {
    const tasks = state.tasks;
    if (filterFn) {
      const filtered = tasks.filter(filterFn);
      return filtered.length > 0 ? filtered[filtered.length - 1].id : undefined;
    }
    return tasks.length > 0 ? tasks[tasks.length - 1].id : undefined;
  }, [state.tasks]);

  const findLastTaskIndex = useCallback((filterFn?: (t: Task) => boolean): number => {
    const tasks = state.tasks;
    if (filterFn) {
      for (let i = tasks.length - 1; i >= 0; i--) {
        if (filterFn(tasks[i])) return i;
      }
      return tasks.length - 1;
    }
    return tasks.length - 1;
  }, [state.tasks]);

  const handleSubmit = useCallback(() => {
    if (!dialog) return;

    switch (dialog.type) {
      case 'add-phase': {
        const lastId = findLastTaskId();
        const sub = subPhaseName.trim() || 'General';
        const newTask: Task = {
          id: genId(),
          phase: `${phaseName.trim() || 'Phase'} ${sub}`,
          name: taskName.trim() || 'New Task',
          duration: Math.max(1, duration),
          status: 'planned',
          isCritical: false,
          // Link after the last existing task so the new phase lands at the end
          // of the schedule; if the project is empty, anchor to today so the
          // bar is actually schedulable (an unanchored task renders as NaN).
          ...(lastId ? { after: lastId } : { start: formatISO(new Date()) }),
        };
        dispatch({ type: 'ADD_TASK', task: newTask });
        break;
      }

      case 'add-sub-phase': {
        const masterPhase = dialog.context.masterPhase;
        // Match only tasks within THIS master phase. Using a bare prefix would
        // let "Phase 1" also match "Phase 10", "Phase 11", … — use a boundary.
        const inMaster = (t: Task) =>
          t.phase === masterPhase || t.phase.startsWith(`${masterPhase} `);
        const lastId = findLastTaskId(inMaster);
        const lastIdx = findLastTaskIndex(inMaster);
        const newTask: Task = {
          id: genId(),
          phase: `${masterPhase} ${subPhaseName.trim() || 'General'}`,
          name: taskName.trim() || 'New Task',
          duration: Math.max(1, duration),
          status: 'planned',
          isCritical: false,
          ...(lastId ? { after: lastId } : { start: formatISO(new Date()) }),
        };
        dispatch({ type: 'ADD_TASK', task: newTask, afterIndex: lastIdx });
        break;
      }

      case 'add-task': {
        // Resolve a valid full phase string from whatever context shape we got.
        // The context-menu "Add task…" passes { masterPhase, subPhase } (or just
        // { masterPhase }); the list overlay passes { phase }; the empty state
        // passes {}. Never leave phase undefined — that crashes buildHierarchy.
        let fullPhase = dialog.context.phase || dialog.context.fullPhase;
        if (!fullPhase && dialog.context.masterPhase) {
          const m = dialog.context.masterPhase;
          if (dialog.context.subPhase) {
            fullPhase = `${m} ${dialog.context.subPhase}`;
          } else {
            const firstInMaster = state.tasks.find(
              t => t.phase === m || t.phase.startsWith(`${m} `)
            );
            fullPhase = firstInMaster ? firstInMaster.phase : `${m} General`;
          }
        }
        if (!fullPhase) fullPhase = 'Phase 1 General';

        const afterTaskId = dialog.context.afterTaskId;
        // Find last task in this phase to link after
        const phaseTasks = state.tasks.filter(t => t.phase === fullPhase);
        const lastPhaseTask = phaseTasks.length > 0 ? phaseTasks[phaseTasks.length - 1] : undefined;
        const linkAfter = afterTaskId || lastPhaseTask?.id;
        const afterIdx = linkAfter ? state.tasks.findIndex(t => t.id === linkAfter) : state.tasks.length - 1;
        const newTask: Task = {
          id: genId(),
          phase: fullPhase,
          name: taskName.trim() || 'New Task',
          duration: Math.max(1, duration),
          status: 'planned',
          isCritical: false,
          // Anchor to today when there's no predecessor to chain after, so the
          // first task in a phase/project is always visible.
          ...(linkAfter ? { after: linkAfter } : { start: formatISO(new Date()) }),
        };
        dispatch({ type: 'ADD_TASK', task: newTask, afterIndex: afterIdx >= 0 ? afterIdx : undefined });
        break;
      }

      case 'add-before-task': {
        const targetTaskId = dialog.context.targetTaskId;
        const targetTask = state.tasks.find(t => t.id === targetTaskId);
        const newTask: Task = {
          id: genId(),
          phase: targetTask?.phase || '',
          name: taskName.trim() || 'New Task',
          duration: Math.max(1, duration),
          status: 'planned',
          isCritical: false,
        };
        dispatch({ type: 'ADD_BEFORE_TASK', targetTaskId, task: newTask });
        break;
      }

      case 'add-after-task': {
        const targetTaskId = dialog.context.targetTaskId;
        const phase = dialog.context.phase;
        const newTask: Task = {
          id: genId(),
          phase: phase || '',
          name: taskName.trim() || 'New Task',
          duration: Math.max(1, duration),
          status: 'planned',
          isCritical: false,
        };
        dispatch({ type: 'ADD_AFTER_TASK', targetTaskId, task: newTask });
        break;
      }

      case 'edit-phase': {
        const oldName = dialog.context.phase || dialog.context.masterPhase;
        const newName = phaseName.trim();
        if (newName && newName !== oldName) {
          dispatch({ type: 'RENAME_PHASE', oldName, newName });
        }
        break;
      }

      case 'edit-sub-phase': {
        const masterPhase = dialog.context.masterPhase;
        const oldSub = dialog.context.subPhase;
        const newSub = subPhaseName.trim();
        if (newSub && newSub !== oldSub) {
          dispatch({ type: 'RENAME_SUB_PHASE', masterPhase, oldSub, newSub });
        }
        break;
      }

      case 'add-milestone': {
        if (!milestoneName.trim() || !milestoneDate.trim()) return;
        const colorIndex = state.milestones.length % MS_COLORS.length;
        const color = MS_COLORS[colorIndex];
        dispatch({
          type: 'ADD_MILESTONE',
          milestone: {
            id: 'ms' + Date.now().toString(36),
            name: milestoneName.trim(),
            date: milestoneDate.trim(),
            colorClass: color.colorClass,
            lineClass: color.lineClass,
          },
        });
        break;
      }

      case 'edit-milestone': {
        const milestoneId = dialog.context.milestoneId;
        if (milestoneName.trim() && milestoneDate.trim()) {
          dispatch({
            type: 'UPDATE_MILESTONE',
            milestoneId,
            updates: { name: milestoneName.trim(), date: milestoneDate.trim() },
          });
        }
        break;
      }
    }

    dispatch({ type: 'CLOSE_DIALOG' });
  }, [dialog, phaseName, subPhaseName, taskName, duration, milestoneName, milestoneDate, state.tasks, state.milestones, dispatch, findLastTaskId, findLastTaskIndex]);

  const handleDelete = useCallback(() => {
    if (!dialog) return;

    switch (dialog.type) {
      case 'edit-phase':
        dispatch({ type: 'DELETE_PHASE', phase: dialog.context.phase || dialog.context.masterPhase });
        break;
      case 'edit-sub-phase':
        dispatch({ type: 'DELETE_SUB_PHASE', masterPhase: dialog.context.masterPhase, subPhase: dialog.context.subPhase });
        break;
      case 'edit-milestone':
        dispatch({ type: 'DELETE_MILESTONE', milestoneId: dialog.context.milestoneId });
        break;
    }

    dispatch({ type: 'CLOSE_DIALOG' });
  }, [dialog, dispatch]);

  // Enter key submits
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        const active = document.activeElement;
        if (active && active.tagName === 'BUTTON') return;
        handleSubmit();
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit, handleClose]);

  if (!dialog) return null;

  // Determine dialog title and icon
  const dialogConfig = getDialogConfig(dialog.type);
  const showDeleteButton = dialog.type === 'edit-phase' || dialog.type === 'edit-sub-phase' || dialog.type === 'edit-milestone';

  return (
    <>
      {/* Overlay */}
      <div className="add-dialog-overlay" onClick={handleClose} />

      {/* Dialog */}
      <div className="add-dialog">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
            style={{ background: dialogConfig.iconBg }}
          >
            {dialogConfig.icon}
          </div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {dialogConfig.title}
          </h3>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-3">
          {renderFields(dialog.type)}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-5">
          <div>
            {showDeleteButton && (
              <button
                className="text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-all"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                onClick={handleDelete}
                type="button"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-glass text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
              onClick={handleClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="btn-primary text-xs font-semibold px-5 py-2 rounded-lg cursor-pointer"
              onClick={handleSubmit}
              type="button"
            >
              {dialogConfig.submitLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  function renderFields(type: string) {
    switch (type) {
      case 'add-phase':
        return (
          <>
            <FieldGroup label="Phase Name">
              <input
                ref={firstInputRef}
                type="text"
                className="input-field"
                placeholder="e.g. Phase 10"
                value={phaseName}
                onChange={(e) => setPhaseName(e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="First Sub-Phase Name">
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Setup"
                value={subPhaseName}
                onChange={(e) => setSubPhaseName(e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="First Task Name">
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Initial setup"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Duration (days)">
              <input
                type="number"
                className="input-field"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </FieldGroup>
          </>
        );

      case 'add-sub-phase':
        return (
          <>
            <FieldGroup label="Sub-Phase Name">
              <input
                ref={firstInputRef}
                type="text"
                className="input-field"
                placeholder="e.g. Testing"
                value={subPhaseName}
                onChange={(e) => setSubPhaseName(e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="First Task Name">
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Write test cases"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Duration (days)">
              <input
                type="number"
                className="input-field"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </FieldGroup>
          </>
        );

      case 'add-task':
      case 'add-before-task':
      case 'add-after-task':
        return (
          <>
            <FieldGroup label="Task Name">
              <input
                ref={firstInputRef}
                type="text"
                className="input-field"
                placeholder="e.g. Implement feature"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Duration (days)">
              <input
                type="number"
                className="input-field"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </FieldGroup>
          </>
        );

      case 'edit-phase':
        return (
          <FieldGroup label="Phase Name">
            <input
              ref={firstInputRef}
              type="text"
              className="input-field"
              value={phaseName}
              onChange={(e) => setPhaseName(e.target.value)}
            />
          </FieldGroup>
        );

      case 'edit-sub-phase':
        return (
          <FieldGroup label="Sub-Phase Name">
            <input
              ref={firstInputRef}
              type="text"
              className="input-field"
              value={subPhaseName}
              onChange={(e) => setSubPhaseName(e.target.value)}
            />
          </FieldGroup>
        );

      case 'add-milestone':
        return (
          <>
            <FieldGroup label="Milestone Name">
              <input
                ref={firstInputRef}
                type="text"
                className="input-field"
                placeholder="e.g. Beta Release"
                value={milestoneName}
                onChange={(e) => setMilestoneName(e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Date">
              <input
                type="date"
                className="input-field"
                value={milestoneDate}
                onChange={(e) => setMilestoneDate(e.target.value)}
              />
            </FieldGroup>
          </>
        );

      case 'edit-milestone':
        return (
          <>
            <FieldGroup label="Milestone Name">
              <input
                ref={firstInputRef}
                type="text"
                className="input-field"
                value={milestoneName}
                onChange={(e) => setMilestoneName(e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Date">
              <input
                type="date"
                className="input-field"
                value={milestoneDate}
                onChange={(e) => setMilestoneDate(e.target.value)}
              />
            </FieldGroup>
          </>
        );

      default:
        return null;
    }
  }
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function getDialogConfig(type: string): { title: string; icon: string; iconBg: string; submitLabel: string } {
  switch (type) {
    case 'add-phase':
      return { title: 'Add New Phase', icon: '+', iconBg: 'linear-gradient(135deg, #6366f1, #8b5cf6)', submitLabel: 'Add Phase' };
    case 'add-sub-phase':
      return { title: 'Add Sub-Phase', icon: '+', iconBg: 'linear-gradient(135deg, #6366f1, #8b5cf6)', submitLabel: 'Add Sub-Phase' };
    case 'add-task':
      return { title: 'Add Task', icon: '+', iconBg: 'linear-gradient(135deg, #3b82f6, #6366f1)', submitLabel: 'Add Task' };
    case 'add-before-task':
      return { title: 'Insert Task Before', icon: '+', iconBg: 'linear-gradient(135deg, #3b82f6, #6366f1)', submitLabel: 'Insert Task' };
    case 'add-after-task':
      return { title: 'Insert Task After', icon: '+', iconBg: 'linear-gradient(135deg, #3b82f6, #6366f1)', submitLabel: 'Insert Task' };
    case 'edit-phase':
      return { title: 'Edit Phase', icon: '\u270E', iconBg: 'linear-gradient(135deg, #f59e0b, #ef4444)', submitLabel: 'Save Changes' };
    case 'edit-sub-phase':
      return { title: 'Edit Sub-Phase', icon: '\u270E', iconBg: 'linear-gradient(135deg, #f59e0b, #ef4444)', submitLabel: 'Save Changes' };
    case 'add-milestone':
      return { title: 'Add Milestone', icon: '\u25C6', iconBg: 'linear-gradient(135deg, #10b981, #14b8a6)', submitLabel: 'Add Milestone' };
    case 'edit-milestone':
      return { title: 'Edit Milestone', icon: '\u25C6', iconBg: 'linear-gradient(135deg, #10b981, #14b8a6)', submitLabel: 'Save Changes' };
    default:
      return { title: 'Dialog', icon: '?', iconBg: '#666', submitLabel: 'Submit' };
  }
}
