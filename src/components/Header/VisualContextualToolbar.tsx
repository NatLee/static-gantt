'use client';

import { Dispatch, useCallback } from 'react';
import {
  Undo2,
  Redo2,
  CalendarDays,
  Maximize2,
  Plus,
  Briefcase,
} from 'lucide-react';
import { Segmented, SegmentedButton } from './Segmented';
import PhaseTabs from './PhaseTabs';
import type { GanttAction, GanttState } from '@/types';
import type { ZoomPreset } from '@/components/GanttApp';
import { useI18n } from '@/i18n/I18nProvider';

interface Props {
  state: GanttState;
  dispatch: Dispatch<GanttAction>;
  masterPhases: string[];
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onScrollToToday: () => void;
  onApplyZoomPreset: (preset: ZoomPreset) => void;
  onFitToScreen: () => void;
}

export default function VisualContextualToolbar({
  state,
  dispatch,
  masterPhases,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onScrollToToday,
  onApplyZoomPreset,
  onFitToScreen,
}: Props) {
  const { t } = useI18n();
  const currentZoomPreset: ZoomPreset =
    state.zoomScale >= 3 ? 'day' : state.zoomScale >= 1.6 ? 'week' : 'month';

  const handleFilterChange = useCallback(
    (filter: string) => {
      dispatch({ type: 'SET_FILTER', filter });
    },
    [dispatch]
  );

  const handleAddMilestone = useCallback(() => {
    dispatch({ type: 'OPEN_DIALOG', dialog: { type: 'add-milestone', context: {} } });
  }, [dispatch]);

  return (
    <>
      <Segmented>
        <SegmentedButton
          icon={<Undo2 className="w-3.5 h-3.5" />}
          title={t('toolbar.undo')}
          onClick={onUndo}
          disabled={!canUndo}
        />
        <SegmentedButton
          icon={<Redo2 className="w-3.5 h-3.5" />}
          title={t('toolbar.redo')}
          onClick={onRedo}
          disabled={!canRedo}
        />
      </Segmented>

      <div className="toolbar-sep" />

      <button
        type="button"
        className="toolbar-btn"
        onClick={onScrollToToday}
        title={t('toolbar.todayTitle')}
      >
        <CalendarDays className="w-3.5 h-3.5" />
        <span>{t('toolbar.today')}</span>
      </button>

      <button
        type="button"
        className={`toolbar-btn${state.workingDaysOnly ? ' toolbar-btn-primary' : ''}`}
        onClick={() => dispatch({ type: 'SET_WORKING_DAYS', enabled: !state.workingDaysOnly })}
        title={t('toolbar.workDaysTitle')}
      >
        <Briefcase className="w-3.5 h-3.5" />
        <span>{t('toolbar.workDays')}</span>
      </button>

      <Segmented>
        <SegmentedButton
          label="D"
          title={t('toolbar.dayTitle')}
          active={currentZoomPreset === 'day'}
          onClick={() => onApplyZoomPreset('day')}
        />
        <SegmentedButton
          label="W"
          title={t('toolbar.weekTitle')}
          active={currentZoomPreset === 'week'}
          onClick={() => onApplyZoomPreset('week')}
        />
        <SegmentedButton
          label="M"
          title={t('toolbar.monthTitle')}
          active={currentZoomPreset === 'month'}
          onClick={() => onApplyZoomPreset('month')}
        />
        <SegmentedButton
          icon={<Maximize2 className="w-3 h-3" />}
          title={t('toolbar.fitTitle')}
          onClick={onFitToScreen}
        />
      </Segmented>

      <div className="toolbar-sep" />

      <PhaseTabs
        phases={masterPhases}
        current={state.currentFilter}
        onChange={handleFilterChange}
      />

      <button
        type="button"
        className="toolbar-btn toolbar-btn-primary"
        onClick={handleAddMilestone}
        title={t('toolbar.milestoneTitle')}
      >
        <Plus className="w-3.5 h-3.5" />
        <span>{t('toolbar.milestone')}</span>
      </button>

      <div className="toolbar-spacer" />

      {state.legendVisible && (
        <div className="toolbar-legend">
          <LegendPill color="#10b981" label={t('legend.done')} />
          <LegendPill color="#6366f1" label={t('legend.inProgress')} />
          <LegendPill variant="planned" label={t('legend.planned')} />
          <LegendPill variant="critical" label={t('legend.critical')} />
        </div>
      )}
    </>
  );
}

function LegendPill({
  color,
  label,
  variant,
}: {
  color?: string;
  label: string;
  variant?: 'planned' | 'critical';
}) {
  return (
    <span className="toolbar-legend-pill">
      <span
        className="toolbar-legend-dot"
        style={
          variant === 'planned'
            ? { background: 'var(--bg-card)', border: '1px solid var(--border-color)' }
            : variant === 'critical'
            ? { background: 'transparent', border: '2px solid #f43f5e' }
            : { background: color }
        }
      />
      {label}
    </span>
  );
}
