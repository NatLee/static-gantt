'use client';

import { ComputedTask } from '@/types';
import { offsetToDate, formatDateFull } from '@/lib/dateUtils';

interface Props {
  task: ComputedTask;
  x: number;
  y: number;
}

export default function TaskTooltip({ task, x, y }: Props) {
  const startDate = formatDateFull(offsetToDate(task.startDayOffset));
  const endDate = formatDateFull(offsetToDate(task.endDayOffset));
  const progress = typeof task.progress === 'number' ? task.progress : null;
  const statusLabel =
    task.status === 'done' ? 'Done' : task.status === 'in-progress' ? 'In Progress' : 'Planned';

  const description =
    task.description && task.description.length > 120
      ? `${task.description.slice(0, 120)}…`
      : task.description;

  return (
    <div
      className="fixed pointer-events-none z-[95] rounded-lg shadow-xl"
      style={{
        left: x + 14,
        top: y + 14,
        minWidth: 240,
        maxWidth: 320,
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-color)',
        backdropFilter: 'blur(12px)',
        padding: '10px 12px',
      }}
    >
      <div className="text-xs font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>
        {task.name}
      </div>
      <div className="text-[10px] mb-2" style={{ color: 'var(--text-secondary)' }}>
        <span className="font-mono">{task.id}</span>
        {' · '}
        {task.phase}
      </div>

      <Row label="Dates" value={`${startDate} → ${endDate}`} />
      <Row label="Duration" value={`${task.duration}d`} />
      <Row label="Status" value={statusLabel} />
      {task.isCritical && <Row label="" value="⚡ Critical path" valueColor="#ef4444" />}
      {progress !== null && progress > 0 && <Row label="Progress" value={`${progress}%`} />}
      {task.assignee && <Row label="Assignee" value={task.assignee} />}
      {task.tags && task.tags.length > 0 && (
        <Row label="Tags" value={task.tags.join(', ')} />
      )}
      {task.after && <Row label="After" value={task.after} mono />}
      {description && (
        <div
          className="mt-1.5 pt-1.5 text-[11px]"
          style={{
            color: 'var(--text-secondary)',
            borderTop: '1px dashed var(--border-color)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {description}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  valueColor,
  mono,
}: {
  label: string;
  value: string;
  valueColor?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 text-[11px] leading-tight">
      {label && (
        <span
          className="font-semibold uppercase tracking-wider shrink-0"
          style={{ color: 'var(--text-secondary)', minWidth: 56, fontSize: 9, paddingTop: 2 }}
        >
          {label}
        </span>
      )}
      <span
        style={{
          color: valueColor || 'var(--text-primary)',
          fontFamily: mono ? 'ui-monospace, monospace' : undefined,
          fontWeight: 600,
          wordBreak: 'break-word',
        }}
      >
        {value}
      </span>
    </div>
  );
}
