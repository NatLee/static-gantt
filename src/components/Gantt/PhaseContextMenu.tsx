'use client';

import { Dispatch, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Edit, FolderMinus, FolderPlus, Plus, Trash2 } from 'lucide-react';
import { GanttAction } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';

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
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y, measured: false });

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = x;
    let top = y;
    if (left + rect.width > vw - 8) left = Math.max(8, vw - rect.width - 8);
    if (top + rect.height > vh - 8) top = Math.max(8, vh - rect.height - 8);
    setPosition({ left, top, measured: true });
  }, [x, y]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) onClose();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [onClose]);

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
          key: `${masterPhase}::${subPhase}`,
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

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      ref={menuRef}
      className="fixed min-w-[200px] rounded-lg shadow-2xl py-1"
      style={{
        left: position.left,
        top: position.top,
        zIndex: 1000,
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-color)',
        backdropFilter: 'blur(16px)',
        visibility: position.measured ? 'visible' : 'hidden',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider truncate"
        style={{ color: 'var(--text-secondary)' }}
      >
        {kind === 'phase' ? t('pctx.phase') : t('pctx.subPhase')} · {label}
      </div>
      <Divider />
      <Item icon={<Edit className="w-3 h-3" />} label={t('pctx.rename')} onClick={handleRename} />
      {kind === 'phase' && (
        <Item
          icon={<FolderPlus className="w-3 h-3" />}
          label={t('pctx.addSubPhase')}
          onClick={handleAddSubPhase}
        />
      )}
      <Item
        icon={<Plus className="w-3 h-3" />}
        label={t('pctx.addTask')}
        onClick={handleAddTask}
      />
      <Item
        icon={<FolderMinus className="w-3 h-3" />}
        label={isCollapsed ? t('pctx.expand') : t('pctx.collapse')}
        onClick={handleCollapse}
      />
      <Divider />
      <Item
        icon={<Trash2 className="w-3 h-3" />}
        label={t('pctx.delete')}
        onClick={handleDelete}
        danger
      />
    </div>,
    document.body
  );
}

function Item({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-xs font-medium cursor-pointer transition-colors hover:bg-[var(--bg-card)]"
      style={{ color: danger ? '#ef4444' : 'var(--text-primary)' }}
      onClick={onClick}
      type="button"
    >
      <span className="opacity-70 shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function Divider() {
  return (
    <div
      className="my-1 mx-2"
      style={{ height: 1, background: 'var(--border-color)', opacity: 0.6 }}
    />
  );
}
