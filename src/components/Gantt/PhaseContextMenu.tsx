'use client';

import { Dispatch } from 'react';
import { Edit, FolderMinus, FolderPlus, Plus, Trash2 } from 'lucide-react';
import { GanttAction } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { subPhaseKey } from '@/lib/phase';
import ContextMenu, { ContextMenuDivider, ContextMenuHeading, ContextMenuItem } from './ContextMenu';

interface Props {
  kind: 'phase' | 'sub-phase';
  masterPhase: string;
  subPhase?: string;
  x: number;
  y: number;
  isCollapsed: boolean;
  dispatch: Dispatch<GanttAction>;
  onClose: () => void;
}

export default function PhaseContextMenu({
  kind,
  masterPhase,
  subPhase,
  x,
  y,
  isCollapsed,
  dispatch,
  onClose,
}: Props) {
  const { t } = useI18n();

  const run = (fn: () => void) => {
    fn();
    onClose();
  };

  const label = kind === 'phase' ? masterPhase : `${masterPhase} · ${subPhase}`;

  const handleRename = () =>
    run(() =>
      dispatch({
        type: 'OPEN_DIALOG',
        dialog:
          kind === 'phase'
            ? { type: 'edit-phase', context: { phase: masterPhase } }
            : {
                type: 'edit-sub-phase',
                context: { masterPhase, subPhase: subPhase || '' },
              },
      })
    );

  const handleDelete = () =>
    run(() => {
      if (kind === 'phase') {
        dispatch({ type: 'DELETE_PHASE', phase: masterPhase });
      } else if (subPhase) {
        dispatch({ type: 'DELETE_SUB_PHASE', masterPhase, subPhase });
      }
    });

  const handleCollapse = () =>
    run(() => {
      if (kind === 'phase') {
        dispatch({ type: 'TOGGLE_PHASE_COLLAPSE', phase: masterPhase });
      } else if (subPhase) {
        dispatch({
          type: 'TOGGLE_SUB_PHASE_COLLAPSE',
          key: subPhaseKey(masterPhase, subPhase),
        });
      }
    });

  const handleAddSubPhase = () =>
    run(() =>
      dispatch({
        type: 'OPEN_DIALOG',
        dialog: { type: 'add-sub-phase', context: { masterPhase } },
      })
    );

  const handleAddTask = () =>
    run(() =>
      dispatch({
        type: 'OPEN_DIALOG',
        dialog: {
          type: 'add-task',
          context:
            kind === 'sub-phase'
              ? { masterPhase, subPhase: subPhase || '' }
              : { masterPhase },
        },
      })
    );

  return (
    <ContextMenu x={x} y={y} label={label} onClose={onClose}>
      <ContextMenuHeading>
        {kind === 'phase' ? t('pctx.phase') : t('pctx.subPhase')} · {label}
      </ContextMenuHeading>
      <ContextMenuDivider />
      <ContextMenuItem icon={<Edit className="w-3 h-3" />} label={t('pctx.rename')} onClick={handleRename} />
      {kind === 'phase' && (
        <ContextMenuItem
          icon={<FolderPlus className="w-3 h-3" />}
          label={t('pctx.addSubPhase')}
          onClick={handleAddSubPhase}
        />
      )}
      <ContextMenuItem icon={<Plus className="w-3 h-3" />} label={t('pctx.addTask')} onClick={handleAddTask} />
      <ContextMenuItem
        icon={<FolderMinus className="w-3 h-3" />}
        label={isCollapsed ? t('pctx.expand') : t('pctx.collapse')}
        onClick={handleCollapse}
      />
      <ContextMenuDivider />
      <ContextMenuItem icon={<Trash2 className="w-3 h-3" />} label={t('pctx.delete')} onClick={handleDelete} danger />
    </ContextMenu>
  );
}
