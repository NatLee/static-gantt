'use client';

import { Dispatch, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Edit,
  Flag,
  Hash,
  Plus,
  Trash2,
  Zap,
} from 'lucide-react';
import { GanttAction, Task, TaskStatus } from '@/types';
import { genId } from '@/lib/dateUtils';

interface Props {
  task: Task;
  x: number;
  y: number;
  dispatch: Dispatch<GanttAction>;
  onClose: () => void;
}

const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: 'planned', label: 'Planned' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

export default function TaskContextMenu({ task, x, y, dispatch, onClose }: Props) {
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
    <div
      ref={menuRef}
      className="fixed z-[90] min-w-[200px] rounded-lg shadow-2xl py-1"
      style={{
        left: position.left,
        top: position.top,
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-color)',
        backdropFilter: 'blur(16px)',
        visibility: position.measured ? 'visible' : 'hidden',
      }}
      onContextMenu={e => e.preventDefault()}
    >
      <MenuLabel>{task.name}</MenuLabel>
      <Divider />
      <Item icon={<Edit className="w-3 h-3" />} label="Edit..." onClick={handleEdit} />
      <Item icon={<Copy className="w-3 h-3" />} label="Duplicate" onClick={handleDuplicate} />
      <Item icon={<Hash className="w-3 h-3" />} label={`Copy ID (${task.id})`} onClick={handleCopyId} />
      <Divider />
      <Item icon={<Plus className="w-3 h-3" />} label="Add before" onClick={handleAddBefore} />
      <Item icon={<Plus className="w-3 h-3" />} label="Add after" onClick={handleAddAfter} />
      <Divider />
      <Item
        icon={<Zap className="w-3 h-3" style={{ color: task.isCritical ? '#ef4444' : undefined }} />}
        label={task.isCritical ? 'Unmark critical' : 'Mark critical'}
        onClick={handleToggleCritical}
      />
      <SubLabel>Status</SubLabel>
      {STATUS_OPTIONS.map(opt => (
        <Item
          key={opt.value}
          icon={
            task.status === opt.value ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <Flag className="w-3 h-3 opacity-40" />
            )
          }
          label={opt.label}
          onClick={() => handleSetStatus(opt.value)}
        />
      ))}
      <Divider />
      <Item
        icon={<Trash2 className="w-3 h-3" />}
        label="Delete"
        onClick={handleDelete}
        danger
      />
    </div>
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

function MenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider truncate"
      style={{ color: 'var(--text-secondary)' }}
    >
      {children}
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-3 pt-1.5 pb-0.5 text-[9px] font-bold uppercase tracking-wider"
      style={{ color: 'var(--text-secondary)' }}
    >
      {children}
    </div>
  );
}
