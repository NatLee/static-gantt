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
import type { GanttAction, GanttState } from '@/types';
import type { ZoomPreset } from '@/components/GanttApp';

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
  const currentZoomPreset: ZoomPreset =
    state.zoomScale >= 3 ? 'day' : state.zoomScale >= 1.6 ? 'week' : 'month';

  const handleFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      dispatch({ type: 'SET_FILTER', filter: e.target.value });
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
          title="Undo (⌘Z)"
          onClick={onUndo}
          disabled={!canUndo}
        />
        <SegmentedButton
          icon={<Redo2 className="w-3.5 h-3.5" />}
          title="Redo (⇧⌘Z)"
          onClick={onRedo}
          disabled={!canRedo}
        />
      </Segmented>

      <div className="toolbar-sep" />

      <button
        type="button"
        className="toolbar-btn"
        onClick={onScrollToToday}
        title="Scroll to today (T)"
      >
        <CalendarDays className="w-3.5 h-3.5" />
        <span>Today</span>
      </button>

      <button
        type="button"
        className={`toolbar-btn${state.workingDaysOnly ? ' toolbar-btn-primary' : ''}`}
        onClick={() => dispatch({ type: 'SET_WORKING_DAYS', enabled: !state.workingDaysOnly })}
        title="Working-day scheduling — durations count business days and dependencies skip weekends"
      >
        <Briefcase className="w-3.5 h-3.5" />
        <span>Work days</span>
      </button>

      <Segmented>
        <SegmentedButton
          label="D"
          title="Day view"
          active={currentZoomPreset === 'day'}
          onClick={() => onApplyZoomPreset('day')}
        />
        <SegmentedButton
          label="W"
          title="Week view"
          active={currentZoomPreset === 'week'}
          onClick={() => onApplyZoomPreset('week')}
        />
        <SegmentedButton
          label="M"
          title="Month view"
          active={currentZoomPreset === 'month'}
          onClick={() => onApplyZoomPreset('month')}
        />
        <SegmentedButton
          icon={<Maximize2 className="w-3 h-3" />}
          title="Fit to screen"
          onClick={onFitToScreen}
        />
      </Segmented>

      <div className="toolbar-sep" />

      <select
        className="toolbar-select"
        value={state.currentFilter}
        onChange={handleFilterChange}
      >
        <option value="ALL">All Phases</option>
        {masterPhases.map(phase => (
          <option key={phase} value={phase}>
            {phase}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="toolbar-btn toolbar-btn-primary"
        onClick={handleAddMilestone}
        title="Add milestone"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Milestone</span>
      </button>

      <div className="toolbar-spacer" />

      {state.legendVisible && (
        <div className="toolbar-legend">
          <LegendPill color="#10b981" label="Done" />
          <LegendPill color="#6366f1" label="In Progress" />
          <LegendPill variant="planned" label="Planned" />
          <LegendPill variant="critical" label="Critical" />
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
