'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePersistentGanttState } from '@/hooks/usePersistentGanttState';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import Header from '@/components/Header/Header';
import GanttPanel from '@/components/Gantt/GanttPanel';
import TaskEditorPanel from '@/components/Editor/TaskEditorPanel';
import AddDialog from '@/components/Dialogs/AddDialog';
import ProjectListDialog from '@/components/Dialogs/ProjectListDialog';
import ShortcutsDialog from '@/components/Dialogs/ShortcutsDialog';
import AboutDialog from '@/components/Dialogs/AboutDialog';
import WelcomeDialog from '@/components/Dialogs/WelcomeDialog';
import EmptyState from '@/components/Gantt/EmptyState';
import { RowHoverProvider } from '@/hooks/useRowHover';
import { defaultTasks } from '@/data/defaultProject';
import SearchPanel from '@/components/Gantt/SearchPanel';
import { parseMermaid } from '@/lib/mermaidParser';
import { applyMermaid } from '@/lib/mermaidSync';
import { todayOffset } from '@/lib/dateUtils';
import { PIXELS_PER_DAY } from '@/lib/ganttLayout';
import dynamic from 'next/dynamic';
import type { MermaidPanelHandle } from '@/components/Mermaid/MermaidPanel';
import { useI18n } from '@/i18n/I18nProvider';

const ZOOM_PRESETS = {
  day: 4,     // ppd 20
  week: 2,    // ppd 10
  month: 0.8, // ppd 4
} as const;
export type ZoomPreset = keyof typeof ZOOM_PRESETS;

const MermaidPanel = dynamic(() => import('@/components/Mermaid/MermaidPanel'), {
  ssr: false,
});

export default function GanttApp() {
  const {
    state,
    dispatch,
    computed,
    hierarchy,
    taskMap,
    masterPhases,
    projects,
    saveStatus,
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePersistentGanttState();
  const { t } = useI18n();
  const activeProjectName =
    projects.projects.find(p => p.id === projects.activeProjectId)?.name ?? t('about.appName');
  const mermaidRef = useRef<MermaidPanelHandle>(null);
  const prevModeRef = useRef(state.currentMode);
  const [projectListOpen, setProjectListOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.isDark ? 'dark' : 'light');
  }, [state.isDark]);

  // First-visit welcome: flag stored once-ever, never shown again after dismiss
  useEffect(() => {
    try {
      if (!localStorage.getItem('gantt-welcome-seen')) {
        setWelcomeOpen(true);
      }
    } catch {
      // localStorage unavailable, skip
    }
  }, []);

  const handleCloseWelcome = useCallback(() => {
    try {
      localStorage.setItem('gantt-welcome-seen', '1');
    } catch {
      // ignore
    }
    setWelcomeOpen(false);
  }, []);

  const handleLoadSample = useCallback(() => {
    dispatch({ type: 'REPLACE_ALL_TASKS', tasks: defaultTasks });
  }, [dispatch]);

  // When switching from mermaid back to visual, read the text back into the project. Fields
  // Mermaid cannot express (progress, colours, assignees, …) are kept by task id.
  const contentRef = useRef({ tasks: state.tasks, milestones: state.milestones });
  useEffect(() => {
    contentRef.current = { tasks: state.tasks, milestones: state.milestones };
  }, [state.tasks, state.milestones]);
  useEffect(() => {
    if (prevModeRef.current === 'mermaid' && state.currentMode === 'visual' && mermaidRef.current) {
      const parsed = parseMermaid(mermaidRef.current.getCode());
      if (parsed.tasks.length > 0) {
        dispatch({ type: 'REPLACE_ALL_TASKS', ...applyMermaid(contentRef.current, parsed) });
      }
    }
    prevModeRef.current = state.currentMode;
  }, [state.currentMode, dispatch]);

  const handleOpenProjectList = useCallback(() => setProjectListOpen(true), []);
  const handleCloseProjectList = useCallback(() => setProjectListOpen(false), []);
  const handleOpenShortcuts = useCallback(() => setShortcutsOpen(true), []);
  const handleCloseShortcuts = useCallback(() => setShortcutsOpen(false), []);
  const handleOpenAbout = useCallback(() => setAboutOpen(true), []);
  const handleCloseAbout = useCallback(() => setAboutOpen(false), []);
  const handleOpenSearch = useCallback(() => {
    if (state.currentMode !== 'visual') dispatch({ type: 'SET_MODE', mode: 'visual' });
    setSearchOpen(true);
  }, [state.currentMode, dispatch]);
  const handleCloseSearch = useCallback(() => setSearchOpen(false), []);

  const handlePickSearchResult = useCallback(
    (taskId: string) => {
      dispatch({ type: 'SET_HIGHLIGHTED_TASK', taskId });
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement | null;
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      });
      setTimeout(() => {
        dispatch({ type: 'SET_HIGHLIGHTED_TASK', taskId: null });
      }, 1600);
    },
    [dispatch]
  );

  const scrollToToday = useCallback(() => {
    if (state.currentMode !== 'visual') return;
    const container = document.getElementById('gantt-scroll-container');
    if (!container) return;
    const today = todayOffset();
    const ppd = PIXELS_PER_DAY * state.zoomScale;
    const x = (today - state.timelineStartDay) * ppd;
    const viewportWidth = container.clientWidth;
    container.scrollTo({
      left: Math.max(0, x - viewportWidth / 2),
      behavior: 'smooth',
    });
  }, [state.currentMode, state.zoomScale, state.timelineStartDay]);

  const applyZoomPreset = useCallback(
    (preset: ZoomPreset) => {
      dispatch({ type: 'SET_ZOOM', scale: ZOOM_PRESETS[preset] });
    },
    [dispatch]
  );

  const fitToScreen = useCallback(() => {
    const container = document.getElementById('gantt-scroll-container');
    if (!container) return;
    const sidebar = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-w');
    const sidebarPx = parseFloat(sidebar) || 260;
    const totalDays = Math.max(1, state.timelineEndDay - state.timelineStartDay);
    const available = container.clientWidth - sidebarPx - 24;
    if (available <= 0) return;
    const ppd = available / totalDays;
    const scale = Math.max(0.2, Math.min(5, ppd / PIXELS_PER_DAY));
    dispatch({ type: 'SET_ZOOM', scale });
  }, [dispatch, state.timelineStartDay, state.timelineEndDay]);

  const zoomIn = useCallback(
    () => dispatch({ type: 'SET_ZOOM', scale: state.zoomScale * 1.2 }),
    [dispatch, state.zoomScale]
  );
  const zoomOut = useCallback(
    () => dispatch({ type: 'SET_ZOOM', scale: state.zoomScale * 0.8 }),
    [dispatch, state.zoomScale]
  );

  const handleExportPNG = useCallback(() => {
    const target = document.getElementById('gantt-export-target');
    const scrollContainer = document.getElementById('gantt-scroll-container');
    if (!target || !scrollContainer) return;
    import('@/lib/exportPng').then(({ exportToPNG }) => {
      exportToPNG(target, scrollContainer, state.isDark, state.currentFilter, t('export.pngFailed'));
    });
  }, [state.isDark, state.currentFilter, t]);

  const mermaidInsertSection = useCallback(() => mermaidRef.current?.insertSection?.(), []);
  const mermaidInsertTask = useCallback(() => mermaidRef.current?.insertTask?.(), []);
  const mermaidInsertMilestone = useCallback(() => mermaidRef.current?.insertMilestone?.(), []);
  const mermaidFormat = useCallback(() => mermaidRef.current?.format?.(), []);
  const mermaidDownload = useCallback(() => mermaidRef.current?.downloadMmd?.(), []);
  const mermaidImport = useCallback(
    (text: string) => mermaidRef.current?.importMmd?.(text),
    []
  );
  const mermaidExportSVG = useCallback(() => mermaidRef.current?.exportSvg?.(), []);
  const mermaidExportPNG = useCallback(() => mermaidRef.current?.exportPng?.(), []);

  const closeTopmost = useCallback(() => {
    if (searchOpen) return setSearchOpen(false);
    if (aboutOpen) return setAboutOpen(false);
    if (shortcutsOpen) return setShortcutsOpen(false);
    if (projectListOpen) return setProjectListOpen(false);
    if (state.activeDialog) return dispatch({ type: 'CLOSE_DIALOG' });
    if (state.editingTaskId) return dispatch({ type: 'CLOSE_TASK_EDITOR' });
  }, [searchOpen, aboutOpen, shortcutsOpen, projectListOpen, state.activeDialog, state.editingTaskId, dispatch]);

  useKeyboardShortcuts({
    undo,
    redo,
    today: scrollToToday,
    zoomIn,
    zoomOut,
    escape: closeTopmost,
    openShortcuts: handleOpenShortcuts,
    openSearch: handleOpenSearch,
  });

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header
        state={state}
        dispatch={dispatch}
        computed={computed}
        masterPhases={masterPhases}
        projectsApi={projects}
        saveStatus={saveStatus}
        onOpenProjectList={handleOpenProjectList}
        onOpenShortcuts={handleOpenShortcuts}
        onOpenAbout={handleOpenAbout}
        onOpenSearch={handleOpenSearch}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onScrollToToday={scrollToToday}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onApplyZoomPreset={applyZoomPreset}
        onFitToScreen={fitToScreen}
        onExportPNG={handleExportPNG}
        onMermaidInsertSection={mermaidInsertSection}
        onMermaidInsertTask={mermaidInsertTask}
        onMermaidInsertMilestone={mermaidInsertMilestone}
        onMermaidFormat={mermaidFormat}
        onMermaidDownload={mermaidDownload}
        onMermaidImport={mermaidImport}
        onMermaidExportSVG={mermaidExportSVG}
        onMermaidExportPNG={mermaidExportPNG}
      />

      {state.currentMode === 'visual' ? (
        state.tasks.length === 0 ? (
          <EmptyState dispatch={dispatch} onLoadDefault={handleLoadSample} />
        ) : (
          <RowHoverProvider>
            <GanttPanel
              state={state}
              dispatch={dispatch}
              computed={computed}
              hierarchy={hierarchy}
              taskMap={taskMap}
            />
          </RowHoverProvider>
        )
      ) : (
        <MermaidPanel
          ref={mermaidRef}
          state={state}
          title={activeProjectName}
        />
      )}

      {state.editingTaskId !== null && (
        <TaskEditorPanel
          key={state.editingTaskId}
          state={state}
          dispatch={dispatch}
          computed={computed}
          taskMap={taskMap}
        />
      )}

      {state.activeDialog !== null && (
        <AddDialog
          state={state}
          dispatch={dispatch}
          masterPhases={masterPhases}
        />
      )}

      {projectListOpen && (
        <ProjectListDialog api={projects} onClose={handleCloseProjectList} />
      )}

      {shortcutsOpen && <ShortcutsDialog onClose={handleCloseShortcuts} />}

      {aboutOpen && <AboutDialog onClose={handleCloseAbout} />}

      {welcomeOpen && (
        <WelcomeDialog
          onClose={handleCloseWelcome}
          onOpenShortcuts={handleOpenShortcuts}
        />
      )}

      {searchOpen && state.currentMode === 'visual' && (
        <SearchPanel
          tasks={state.tasks}
          dispatch={dispatch}
          onClose={handleCloseSearch}
          onPick={handlePickSearchResult}
        />
      )}
    </div>
  );
}
