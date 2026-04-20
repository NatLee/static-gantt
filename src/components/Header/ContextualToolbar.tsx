'use client';

import { Dispatch } from 'react';
import VisualContextualToolbar from './VisualContextualToolbar';
import MermaidContextualToolbar from './MermaidContextualToolbar';
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
  onInsertSection: () => void;
  onInsertTask: () => void;
  onInsertMilestone: () => void;
  onFormat: () => void;
  onDownloadMmd: () => void;
  onImportMmd: (text: string) => void;
}

export default function ContextualToolbar(props: Props) {
  const {
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
    onInsertSection,
    onInsertTask,
    onInsertMilestone,
    onFormat,
    onDownloadMmd,
    onImportMmd,
  } = props;

  return (
    <div className="contextual-toolbar">
      {state.currentMode === 'visual' ? (
        <VisualContextualToolbar
          state={state}
          dispatch={dispatch}
          masterPhases={masterPhases}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
          onScrollToToday={onScrollToToday}
          onApplyZoomPreset={onApplyZoomPreset}
          onFitToScreen={onFitToScreen}
        />
      ) : (
        <MermaidContextualToolbar
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
          onInsertSection={onInsertSection}
          onInsertTask={onInsertTask}
          onInsertMilestone={onInsertMilestone}
          onFormat={onFormat}
          onDownloadMmd={onDownloadMmd}
          onImportMmd={onImportMmd}
        />
      )}
    </div>
  );
}
