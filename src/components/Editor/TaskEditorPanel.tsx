'use client';

import { Dispatch, useEffect, useState, useCallback, useMemo } from 'react';
import { GanttState, GanttAction, ComputedTask, TaskStatus } from '@/types';
import { offsetToDate, formatISO } from '@/lib/dateUtils';
import { formatAfter, parseAfter } from '@/lib/dependencies';
import { wouldCreateCycle } from '@/lib/cycleCheck';
import { useI18n } from '@/i18n/I18nProvider';

const COLOR_SWATCHES = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ec4899', // pink
];

interface TaskEditorPanelProps {
  state: GanttState;
  dispatch: Dispatch<GanttAction>;
  computed: ComputedTask[];
  taskMap: Map<string, ComputedTask>;
}

export default function TaskEditorPanel({ state, dispatch, taskMap }: TaskEditorPanelProps) {
  const { t } = useI18n();
  const { editingTaskId } = state;
  const task = useMemo(() => editingTaskId ? taskMap.get(editingTaskId) : undefined, [editingTaskId, taskMap]);

  const [name, setName] = useState(task?.name ?? '');
  const [duration, setDuration] = useState(task?.duration ?? 1);
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'planned');
  const [isCritical, setIsCritical] = useState(task?.isCritical ?? false);
  const [after, setAfter] = useState(task?.after ?? '');
  const [start, setStart] = useState(task?.start ?? '');
  const [progress, setProgress] = useState(task?.progress ?? 0);
  const [color, setColor] = useState(task?.color ?? '');
  const [tagsInput, setTagsInput] = useState((task?.tags ?? []).join(', '));
  const [assignee, setAssignee] = useState(task?.assignee ?? '');
  const [description, setDescription] = useState(task?.description ?? '');

  const handleClose = useCallback(() => {
    dispatch({ type: 'CLOSE_TASK_EDITOR' });
  }, [dispatch]);

  const handleApply = useCallback(() => {
    if (!editingTaskId) return;

    const tags = tagsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const updates: Record<string, unknown> = {
      name,
      duration,
      status,
      isCritical,
      progress: Math.max(0, Math.min(100, progress)),
      color: color.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      assignee: assignee.trim() || undefined,
      description: description.trim() || undefined,
    };

    // Sanitize the free-text predecessor list: keep only IDs that reference a
    // real task, never the task itself, and never one that would create a
    // dependency cycle. Any of those would leave the task (and its descendants)
    // unschedulable — computeSchedule would resolve them to NaN and the bars
    // would silently disappear from the chart.
    const cleanedAfter = formatAfter(
      parseAfter(after)
        .filter(pid => pid !== editingTaskId)
        .filter(pid => taskMap.has(pid))
        .filter(pid => !wouldCreateCycle(state.tasks, pid, editingTaskId))
    );

    // Precedence: a valid predecessor wins; else a fixed start date; else fall
    // back to anchoring at the task's current scheduled start so it never
    // becomes unschedulable.
    if (cleanedAfter) {
      updates.after = cleanedAfter;
      updates.start = undefined;
    } else if (start.trim()) {
      updates.start = start.trim();
      updates.after = undefined;
    } else {
      updates.after = undefined;
      updates.start =
        task && Number.isFinite(task.startDayOffset)
          ? formatISO(offsetToDate(task.startDayOffset))
          : formatISO(new Date());
    }

    dispatch({ type: 'UPDATE_TASK', taskId: editingTaskId, updates });
    dispatch({ type: 'CLOSE_TASK_EDITOR' });
  }, [
    editingTaskId,
    task,
    state.tasks,
    taskMap,
    name,
    duration,
    status,
    isCritical,
    after,
    start,
    progress,
    color,
    tagsInput,
    assignee,
    description,
    dispatch,
  ]);

  const handleDelete = useCallback(() => {
    if (!editingTaskId) return;
    dispatch({ type: 'DELETE_TASK', taskId: editingTaskId });
  }, [editingTaskId, dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        // Don't apply if focus is on a button (let the button handle it)
        const active = document.activeElement;
        if (active && active.tagName === 'BUTTON') return;
        handleApply();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, handleApply]);

  const isOpen = editingTaskId !== null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`task-edit-overlay ${isOpen ? 'open' : ''}`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div className={`task-edit-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-blue)', color: '#fff' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t('editor.title')}</h2>
              <p className="text-[11px] font-mono" style={{ color: 'var(--text-secondary)' }}>{editingTaskId}</p>
            </div>
          </div>
          <button
            className="btn-glass rounded-lg p-1.5 cursor-pointer"
            onClick={handleClose}
            title={t('editor.close')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* Task Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              {t('editor.taskName')}
            </label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Duration */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              {t('editor.duration')}
            </label>
            <input
              type="number"
              className="input-field"
              min={1}
              value={duration}
              onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          {/* Status Toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              {t('editor.status')}
            </label>
            <div className="flex gap-2">
              <button
                className={`flex-1 text-xs font-semibold py-2 rounded-lg border cursor-pointer transition-all ${
                  status === 'done' ? 'active-done' : 'btn-glass'
                }`}
                onClick={() => setStatus('done')}
                type="button"
              >
                {t('status.done')} &#10003;
              </button>
              <button
                className={`flex-1 text-xs font-semibold py-2 rounded-lg border cursor-pointer transition-all ${
                  status === 'in-progress' ? 'active-progress' : 'btn-glass'
                }`}
                onClick={() => setStatus('in-progress')}
                type="button"
              >
                {t('status.inProgress')} &#9673;
              </button>
              <button
                className={`flex-1 text-xs font-semibold py-2 rounded-lg border cursor-pointer transition-all ${
                  status === 'planned' ? 'active-planned' : 'btn-glass'
                }`}
                onClick={() => setStatus('planned')}
                type="button"
              >
                {t('status.planned')} &#9675;
              </button>
            </div>
          </div>

          {/* Critical Path */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="critical-check"
              checked={isCritical}
              onChange={(e) => setIsCritical(e.target.checked)}
              className="cursor-pointer"
            />
            <label
              htmlFor="critical-check"
              className="text-xs font-semibold cursor-pointer"
              style={{ color: 'var(--text-primary)' }}
            >
              {t('editor.criticalPath')}
            </label>
          </div>

          {/* Predecessor */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              {t('editor.predecessor')}
            </label>
            <input
              type="text"
              className="input-field"
              placeholder={t('editor.predecessorPh')}
              value={after}
              onChange={(e) => setAfter(e.target.value)}
            />
          </div>

          {/* Fixed Start Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              {t('editor.fixedStart')}
            </label>
            <input
              type="date"
              className="input-field"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>

          {/* Progress */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider flex items-center justify-between" style={{ color: 'var(--text-secondary)' }}>
              <span>{t('editor.progress')}</span>
              <span className="font-mono text-[10px]" style={{ color: 'var(--text-primary)' }}>{progress}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value) || 0)}
              className="cursor-pointer"
            />
          </div>

          {/* Color */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              {t('editor.color')}
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setColor('')}
                className="text-[10px] font-semibold px-2 py-1 rounded cursor-pointer"
                style={{
                  background: color === '' ? 'var(--accent)' : 'var(--bg-card)',
                  color: color === '' ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {t('editor.colorAuto')}
              </button>
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  title={c}
                  className="w-6 h-6 rounded cursor-pointer"
                  style={{
                    background: c,
                    outline: color === c ? '2px solid var(--text-primary)' : '1px solid var(--border-color)',
                    outlineOffset: color === c ? 2 : 0,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Assignee */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              {t('editor.assignee')}
            </label>
            <input
              type="text"
              className="input-field"
              placeholder={t('editor.assigneePh')}
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              {t('editor.tags')}
            </label>
            <input
              type="text"
              className="input-field"
              placeholder={t('editor.tagsPh')}
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              {t('editor.description')}
            </label>
            <textarea
              className="input-field"
              rows={3}
              placeholder={t('editor.descriptionPh')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <button
            className="text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-all"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
            onClick={handleDelete}
            type="button"
          >
            {t('editor.deleteTask')}
          </button>
          <button
            className="btn-primary text-xs font-semibold px-5 py-2 rounded-lg cursor-pointer"
            onClick={handleApply}
            type="button"
          >
            {t('editor.apply')}
          </button>
        </div>
      </div>
    </>
  );
}
