'use client';

import { Dispatch } from 'react';
import { Check, Copy, Edit, Flag, Hash, Plus, Trash2, Zap } from 'lucide-react';
import { GanttAction, Task, TaskStatus } from '@/types';
import { genId } from '@/lib/dateUtils';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';
import ContextMenu, { ContextMenuDivider, ContextMenuHeading, ContextMenuItem } from './ContextMenu';

interface Props {
  task: Task;
  x: number;
  y: number;
  dispatch: Dispatch<GanttAction>;
  onClose: () => void;
}

const STATUS_OPTIONS: Array<{ value: TaskStatus; labelKey: MessageKey }> = [
  { value: 'planned', labelKey: 'status.planned' },
  { value: 'in-progress', labelKey: 'ctx.statusInProgress' },
  { value: 'done', labelKey: 'status.done' },
];

export default function TaskContextMenu({ task, x, y, dispatch, onClose }: Props) {
  const { t } = useI18n();

  const run = (fn: () => void) => {
    fn();
    onClose();
  };

  const handleEdit = () => run(() => dispatch({ type: 'OPEN_TASK_EDITOR', taskId: task.id }));
  const handleDuplicate = () => run(() => dispatch({ type: 'DUPLICATE_TASK', taskId: task.id, newId: genId() }));
  const handleDelete = () => run(() => dispatch({ type: 'DELETE_TASK', taskId: task.id }));
  const handleAddBefore = () =>
    run(() =>
      dispatch({
        type: 'OPEN_DIALOG',
        dialog: { type: 'add-before-task', context: { targetTaskId: task.id, phase: task.phase } },
      })
    );
  const handleAddAfter = () =>
    run(() =>
      dispatch({
        type: 'OPEN_DIALOG',
        dialog: { type: 'add-after-task', context: { targetTaskId: task.id, phase: task.phase } },
      })
    );
  const handleCopyId = () => run(() => navigator.clipboard?.writeText(task.id));
  const handleToggleCritical = () =>
    run(() =>
      dispatch({ type: 'UPDATE_TASK', taskId: task.id, updates: { isCritical: !task.isCritical } })
    );
  const handleSetStatus = (status: TaskStatus) =>
    run(() => dispatch({ type: 'UPDATE_TASK', taskId: task.id, updates: { status } }));

  return (
    <ContextMenu x={x} y={y} label={task.name} onClose={onClose}>
      <ContextMenuHeading>{task.name}</ContextMenuHeading>
      <ContextMenuDivider />
      <ContextMenuItem icon={<Edit className="w-3 h-3" />} label={t('ctx.edit')} onClick={handleEdit} />
      <ContextMenuItem icon={<Copy className="w-3 h-3" />} label={t('ctx.duplicate')} onClick={handleDuplicate} />
      <ContextMenuItem icon={<Hash className="w-3 h-3" />} label={t('ctx.copyId', { id: task.id })} onClick={handleCopyId} />
      <ContextMenuDivider />
      <ContextMenuItem icon={<Plus className="w-3 h-3" />} label={t('ctx.addBefore')} onClick={handleAddBefore} />
      <ContextMenuItem icon={<Plus className="w-3 h-3" />} label={t('ctx.addAfter')} onClick={handleAddAfter} />
      <ContextMenuDivider />
      <ContextMenuItem
        icon={<Zap className="w-3 h-3" style={{ color: task.isCritical ? '#ef4444' : undefined }} />}
        label={task.isCritical ? t('ctx.unmarkCritical') : t('ctx.markCritical')}
        onClick={handleToggleCritical}
      />
      <ContextMenuHeading small>{t('ctx.status')}</ContextMenuHeading>
      {STATUS_OPTIONS.map(opt => (
        <ContextMenuItem
          key={opt.value}
          checked={task.status === opt.value}
          icon={
            task.status === opt.value ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <Flag className="w-3 h-3 opacity-40" />
            )
          }
          label={t(opt.labelKey)}
          onClick={() => handleSetStatus(opt.value)}
        />
      ))}
      <ContextMenuDivider />
      <ContextMenuItem icon={<Trash2 className="w-3 h-3" />} label={t('ctx.delete')} onClick={handleDelete} danger />
    </ContextMenu>
  );
}
