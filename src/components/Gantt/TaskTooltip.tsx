'use client';

import { ComputedTask, Baseline } from '@/types';
import { offsetToDate, formatDateFull } from '@/lib/dateUtils';
import { useI18n } from '@/i18n/I18nProvider';
import { STATUS_LABEL_KEYS } from '@/i18n/messages';

interface Props {
  task: ComputedTask;
  x: number;
  y: number;
  baseline?: Baseline | null;
}

export default function TaskTooltip({ task, x, y, baseline }: Props) {
  const { t } = useI18n();
  const startDate = formatDateFull(offsetToDate(task.startDayOffset));
  const endDate = formatDateFull(offsetToDate(task.endDayOffset));
  const progress = typeof task.progress === 'number' ? task.progress : null;
  const statusLabel = t(STATUS_LABEL_KEYS[task.status]);

  const effCritical = task.isOnCriticalPath || task.isCritical;
  const hasSlack = Number.isFinite(task.totalFloat);

  // Baseline drift: how far the current start has slipped from the captured one.
  const base = baseline?.bars[task.id];
  const startDrift = base && Number.isFinite(task.startDayOffset)
    ? task.startDayOffset - base.start
    : null;
  const driftLabel =
    startDrift === null
      ? null
      : startDrift === 0
        ? t('tip.onBaseline')
        : startDrift > 0
          ? t('tip.driftLate', { days: startDrift })
          : t('tip.driftEarly', { days: Math.abs(startDrift) });

  const description =
    task.description && task.description.length > 120
      ? `${task.description.slice(0, 120)}…`
      : task.description;

  return (
    <div
      role="tooltip"
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

      <Row label={t('tip.dates')} value={`${startDate} → ${endDate}`} />
      <Row label={t('tip.duration')} value={t('tip.days', { days: task.duration })} />
      <Row label={t('tip.status')} value={statusLabel} />
      {effCritical && <Row label="" value={t('tip.criticalPath')} valueColor="#ef4444" />}
      {hasSlack && !effCritical && <Row label={t('tip.slackLabel')} value={t('tip.slack', { days: task.totalFloat })} />}
      {task.isOverallocated && (
        <Row label="" value={t('tip.overallocated')} valueColor="#f59e0b" />
      )}
      {driftLabel && (
        <Row
          label={t('tip.baseline')}
          value={driftLabel}
          valueColor={
            startDrift && startDrift > 0 ? '#f59e0b' : startDrift && startDrift < 0 ? '#10b981' : undefined
          }
        />
      )}
      {progress !== null && progress > 0 && <Row label={t('tip.progress')} value={`${progress}%`} />}
      {task.assignee && <Row label={t('tip.assignee')} value={task.assignee} />}
      {task.tags && task.tags.length > 0 && (
        <Row label={t('tip.tags')} value={task.tags.join(', ')} />
      )}
      {task.after && <Row label={t('tip.after')} value={task.after} mono />}
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
