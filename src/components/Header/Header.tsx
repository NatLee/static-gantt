'use client';

import { Dispatch } from 'react';
import Menubar from './Menubar';
import ContextualToolbar from './ContextualToolbar';
import type { GanttAction, GanttState, ComputedTask } from '@/types';
import type { ProjectsAPI, SaveStatus } from '@/hooks/usePersistentGanttState';
import type { ZoomPreset } from '@/components/GanttApp';

interface HeaderProps {
  state: GanttState;
  dispatch: Dispatch<GanttAction>;
  computed: ComputedTask[];
  masterPhases: string[];
  projectsApi: ProjectsAPI;
  saveStatus: SaveStatus;
  onOpenProjectList: () => void;
  onOpenShortcuts: () => void;
  onOpenAbout: () => void;
  onOpenSearch: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onScrollToToday: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onApplyZoomPreset: (preset: ZoomPreset) => void;
  onFitToScreen: () => void;
  onExportPNG: () => void;
  onMermaidInsertSection: () => void;
  onMermaidInsertTask: () => void;
  onMermaidInsertMilestone: () => void;
  onMermaidFormat: () => void;
  onMermaidDownload: () => void;
  onMermaidImport: (text: string) => void;
  onMermaidExportSVG: () => void;
  onMermaidExportPNG: () => void;
}

export default function Header(props: HeaderProps) {
  const {
    state,
    dispatch,
    computed,
    masterPhases,
    projectsApi,
    saveStatus,
    onOpenProjectList,
    onOpenShortcuts,
    onOpenAbout,
    onOpenSearch,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onScrollToToday,
    onZoomIn,
    onZoomOut,
    onApplyZoomPreset,
    onFitToScreen,
    onExportPNG,
    onMermaidInsertSection,
    onMermaidInsertTask,
    onMermaidInsertMilestone,
    onMermaidFormat,
    onMermaidDownload,
    onMermaidImport,
    onMermaidExportSVG,
    onMermaidExportPNG,
  } = props;

  return (
    <header className="header-root">
      <Menubar
        state={state}
        dispatch={dispatch}
        computed={computed}
        projectsApi={projectsApi}
        saveStatus={saveStatus}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
        onOpenProjectList={onOpenProjectList}
        onOpenShortcuts={onOpenShortcuts}
        onOpenAbout={onOpenAbout}
        onOpenSearch={onOpenSearch}
        onScrollToToday={onScrollToToday}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onFitToScreen={onFitToScreen}
        onApplyZoomPreset={onApplyZoomPreset}
        onExportPNG={onExportPNG}
        onExportMermaidSVG={onMermaidExportSVG}
        onExportMermaidPNG={onMermaidExportPNG}
        onDownloadMmd={onMermaidDownload}
        onImportMmd={onMermaidImport}
      />
      <ContextualToolbar
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
        onInsertSection={onMermaidInsertSection}
        onInsertTask={onMermaidInsertTask}
        onInsertMilestone={onMermaidInsertMilestone}
        onFormat={onMermaidFormat}
        onDownloadMmd={onMermaidDownload}
        onImportMmd={onMermaidImport}
      />
    </header>
  );
}
