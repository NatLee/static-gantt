'use client';

import { Dispatch, useCallback, useRef } from 'react';
import {
  Layers,
  FilePlus,
  FolderOpen,
  Copy,
  FileText,
  Download,
  HardDriveDownload,
  Upload,
  Undo2,
  Redo2,
  Search,
  Moon,
  Sun,
  CalendarDays,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronsDownUp,
  ChevronsUpDown,
  Eye,
  EyeOff,
  Plus,
  Image as ImageIcon,
  FileDown,
  Keyboard,
  Info,
} from 'lucide-react';
import { Menu, MenuItem, MenuDivider, MenuHeading } from './Menu';
import ProjectSwitcher from './ProjectSwitcher';
import { Segmented, SegmentedButton } from './Segmented';
import { PROJECT_TITLE, PROJECT_SUBTITLE } from '@/data/defaultProject';
import { exportToExcel } from '@/lib/exportExcel';
import type { GanttAction, GanttState, ComputedTask } from '@/types';
import type { ProjectsAPI, SaveStatus } from '@/hooks/usePersistentGanttState';
import type { ZoomPreset } from '@/components/GanttApp';

export interface MenubarProps {
  state: GanttState;
  dispatch: Dispatch<GanttAction>;
  computed: ComputedTask[];
  masterPhases: string[];
  projectsApi: ProjectsAPI;
  saveStatus: SaveStatus;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenProjectList: () => void;
  onOpenShortcuts: () => void;
  onOpenSearch: () => void;
  onScrollToToday: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onApplyZoomPreset: (preset: ZoomPreset) => void;
  onExportPNG: () => void;
  onExportMermaidSVG: () => void;
  onExportMermaidPNG: () => void;
  onDownloadMmd: () => void;
  onImportMmd: (text: string) => void;
}

export default function Menubar(props: MenubarProps) {
  const {
    state,
    dispatch,
    computed,
    masterPhases,
    projectsApi,
    saveStatus,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onOpenProjectList,
    onOpenShortcuts,
    onOpenSearch,
    onScrollToToday,
    onZoomIn,
    onZoomOut,
    onFitToScreen,
    onApplyZoomPreset,
    onExportPNG,
    onExportMermaidSVG,
    onExportMermaidPNG,
    onDownloadMmd,
    onImportMmd,
  } = props;

  const jsonInputRef = useRef<HTMLInputElement>(null);
  const mmdInputRef = useRef<HTMLInputElement>(null);

  const openDialog = useCallback(
    (type: 'add-phase' | 'add-sub-phase' | 'add-task' | 'add-milestone') => {
      dispatch({ type: 'OPEN_DIALOG', dialog: { type, context: {} } });
    },
    [dispatch]
  );

  const handleSetFilter = useCallback(
    (filter: string) => dispatch({ type: 'SET_FILTER', filter }),
    [dispatch]
  );

  const handleJsonFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        await projectsApi.importJsonText(text);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Import failed');
      } finally {
        if (jsonInputRef.current) jsonInputRef.current.value = '';
      }
    },
    [projectsApi]
  );

  const handleMmdFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        onImportMmd(text);
      } finally {
        if (mmdInputRef.current) mmdInputRef.current.value = '';
      }
    },
    [onImportMmd]
  );

  const isMermaid = state.currentMode === 'mermaid';
  const currentZoomPreset: ZoomPreset | null =
    state.zoomScale >= 3 ? 'day' : state.zoomScale >= 1.6 ? 'week' : 'month';

  const handleSetMode = useCallback(
    (mode: 'visual' | 'mermaid') => dispatch({ type: 'SET_MODE', mode }),
    [dispatch]
  );

  return (
    <div className="menubar">
      <div className="menubar-left">
        <div className="menubar-logo" aria-hidden>
          <Layers className="w-4 h-4 text-white" />
        </div>
        <div className="menubar-brand">
          <h1 className="menubar-brand-title">{PROJECT_TITLE}</h1>
          <p className="menubar-brand-subtitle">{PROJECT_SUBTITLE}</p>
        </div>
        <ProjectSwitcher
          api={projectsApi}
          saveStatus={saveStatus}
          onOpenProjectList={onOpenProjectList}
        />
      </div>

      <div className="menubar-center">
        {/* File */}
        <Menu label="File">
          <MenuItem
            icon={<FilePlus className="w-3.5 h-3.5" />}
            label="New (empty)"
            onClick={() => projectsApi.createEmpty()}
          />
          <MenuItem
            icon={<FilePlus className="w-3.5 h-3.5" />}
            label="New from template"
            onClick={() => projectsApi.createFromDefault()}
          />
          <MenuDivider />
          <MenuItem
            icon={<FolderOpen className="w-3.5 h-3.5" />}
            label="Open / Manage…"
            onClick={onOpenProjectList}
          />
          <MenuItem
            icon={<Copy className="w-3.5 h-3.5" />}
            label="Duplicate current"
            onClick={() => projectsApi.duplicateActive()}
          />
          <MenuItem
            icon={<FileText className="w-3.5 h-3.5" />}
            label="Rename current…"
            onClick={onOpenProjectList}
          />
          <MenuDivider />
          <MenuItem
            icon={<Download className="w-3.5 h-3.5" />}
            label="Download JSON"
            onClick={() => projectsApi.downloadActive()}
          />
          <MenuItem
            icon={<HardDriveDownload className="w-3.5 h-3.5" />}
            label="Download backup (all)"
            onClick={() => projectsApi.downloadAll()}
          />
          <MenuItem
            icon={<Upload className="w-3.5 h-3.5" />}
            label="Import JSON…"
            onClick={() => jsonInputRef.current?.click()}
          />
        </Menu>

        {/* Edit */}
        <Menu label="Edit">
          <MenuItem
            icon={<Undo2 className="w-3.5 h-3.5" />}
            label="Undo"
            shortcut="⌘Z"
            onClick={onUndo}
            disabled={!canUndo}
          />
          <MenuItem
            icon={<Redo2 className="w-3.5 h-3.5" />}
            label="Redo"
            shortcut="⇧⌘Z"
            onClick={onRedo}
            disabled={!canRedo}
          />
          <MenuDivider />
          <MenuItem
            icon={<Search className="w-3.5 h-3.5" />}
            label="Find task…"
            shortcut="⌘F"
            onClick={onOpenSearch}
          />
        </Menu>

        {/* View */}
        <Menu label="View">
          <MenuHeading>Theme</MenuHeading>
          <MenuItem
            icon={<Sun className="w-3.5 h-3.5" />}
            label="Light"
            checked={!state.isDark}
            onClick={() => {
              if (state.isDark) dispatch({ type: 'TOGGLE_THEME' });
            }}
          />
          <MenuItem
            icon={<Moon className="w-3.5 h-3.5" />}
            label="Dark"
            checked={state.isDark}
            onClick={() => {
              if (!state.isDark) dispatch({ type: 'TOGGLE_THEME' });
            }}
          />
          <MenuDivider />
          <MenuItem
            icon={<CalendarDays className="w-3.5 h-3.5" />}
            label="Scroll to today"
            shortcut="T"
            onClick={onScrollToToday}
            disabled={isMermaid}
          />
          <MenuItem
            icon={<ZoomIn className="w-3.5 h-3.5" />}
            label="Zoom in"
            shortcut="+"
            onClick={onZoomIn}
            disabled={isMermaid}
          />
          <MenuItem
            icon={<ZoomOut className="w-3.5 h-3.5" />}
            label="Zoom out"
            shortcut="−"
            onClick={onZoomOut}
            disabled={isMermaid}
          />
          <MenuItem
            icon={<Maximize2 className="w-3.5 h-3.5" />}
            label="Fit to screen"
            onClick={onFitToScreen}
            disabled={isMermaid}
          />
          <MenuDivider />
          <MenuHeading>Zoom preset</MenuHeading>
          <MenuItem
            label="Day view"
            checked={!isMermaid && currentZoomPreset === 'day'}
            onClick={() => onApplyZoomPreset('day')}
            disabled={isMermaid}
          />
          <MenuItem
            label="Week view"
            checked={!isMermaid && currentZoomPreset === 'week'}
            onClick={() => onApplyZoomPreset('week')}
            disabled={isMermaid}
          />
          <MenuItem
            label="Month view"
            checked={!isMermaid && currentZoomPreset === 'month'}
            onClick={() => onApplyZoomPreset('month')}
            disabled={isMermaid}
          />
          <MenuDivider />
          <MenuHeading>Phase filter</MenuHeading>
          <MenuItem
            label="All phases"
            checked={state.currentFilter === 'ALL'}
            onClick={() => handleSetFilter('ALL')}
            disabled={isMermaid}
          />
          {masterPhases.map(phase => (
            <MenuItem
              key={phase}
              label={phase}
              checked={state.currentFilter === phase}
              onClick={() => handleSetFilter(phase)}
              disabled={isMermaid}
            />
          ))}
          <MenuDivider />
          <MenuItem
            icon={<ChevronsDownUp className="w-3.5 h-3.5" />}
            label="Collapse all phases"
            onClick={() => dispatch({ type: 'COLLAPSE_ALL_PHASES' })}
            disabled={isMermaid}
          />
          <MenuItem
            icon={<ChevronsUpDown className="w-3.5 h-3.5" />}
            label="Expand all phases"
            onClick={() => dispatch({ type: 'EXPAND_ALL_PHASES' })}
            disabled={isMermaid}
          />
          <MenuDivider />
          <MenuItem
            icon={state.legendVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            label={state.legendVisible ? 'Hide legend' : 'Show legend'}
            onClick={() => dispatch({ type: 'TOGGLE_LEGEND_VISIBLE' })}
            disabled={isMermaid}
          />
        </Menu>

        {/* Insert */}
        <Menu label="Insert">
          <MenuItem
            icon={<Plus className="w-3.5 h-3.5" />}
            label="Phase…"
            onClick={() => openDialog('add-phase')}
          />
          <MenuItem
            icon={<Plus className="w-3.5 h-3.5" />}
            label="Sub-phase…"
            onClick={() => openDialog('add-sub-phase')}
          />
          <MenuItem
            icon={<Plus className="w-3.5 h-3.5" />}
            label="Task…"
            onClick={() => openDialog('add-task')}
          />
          <MenuItem
            icon={<Plus className="w-3.5 h-3.5" />}
            label="Milestone…"
            onClick={() => openDialog('add-milestone')}
          />
        </Menu>

        {/* Export */}
        <Menu label="Export">
          <MenuHeading>Gantt</MenuHeading>
          <MenuItem
            icon={<Download className="w-3.5 h-3.5" />}
            label="CSV (Excel)"
            onClick={() => exportToExcel(computed, state.currentFilter)}
          />
          <MenuItem
            icon={<ImageIcon className="w-3.5 h-3.5" />}
            label="PNG"
            onClick={onExportPNG}
            disabled={isMermaid}
          />
          <MenuItem
            icon={<Download className="w-3.5 h-3.5" />}
            label="JSON (current project)"
            onClick={() => projectsApi.downloadActive()}
          />
          <MenuDivider />
          <MenuHeading>Mermaid</MenuHeading>
          <MenuItem
            icon={<ImageIcon className="w-3.5 h-3.5" />}
            label="SVG"
            onClick={onExportMermaidSVG}
            disabled={!isMermaid}
          />
          <MenuItem
            icon={<ImageIcon className="w-3.5 h-3.5" />}
            label="PNG"
            onClick={onExportMermaidPNG}
            disabled={!isMermaid}
          />
          <MenuItem
            icon={<FileDown className="w-3.5 h-3.5" />}
            label=".mmd file"
            onClick={onDownloadMmd}
            disabled={!isMermaid}
          />
          <MenuItem
            icon={<Upload className="w-3.5 h-3.5" />}
            label="Import .mmd…"
            onClick={() => mmdInputRef.current?.click()}
            disabled={!isMermaid}
          />
        </Menu>

        {/* Help */}
        <Menu label="Help">
          <MenuItem
            icon={<Keyboard className="w-3.5 h-3.5" />}
            label="Keyboard shortcuts"
            shortcut="?"
            onClick={onOpenShortcuts}
          />
          <MenuItem
            icon={<Info className="w-3.5 h-3.5" />}
            label="About"
            onClick={() =>
              alert(`${PROJECT_TITLE}\n${PROJECT_SUBTITLE}\n\nA static Gantt chart editor with visual and Mermaid modes.`)
            }
          />
        </Menu>
      </div>

      <div className="menubar-right">
        <Segmented>
          <SegmentedButton
            label="Visual"
            active={state.currentMode === 'visual'}
            onClick={() => handleSetMode('visual')}
          />
          <SegmentedButton
            label="Mermaid"
            active={state.currentMode === 'mermaid'}
            onClick={() => handleSetMode('mermaid')}
          />
        </Segmented>
        <button
          type="button"
          className="icon-btn"
          onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
          title={state.isDark ? 'Switch to light' : 'Switch to dark'}
        >
          {state.isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onOpenShortcuts}
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="w-4 h-4" />
        </button>
      </div>

      <input
        ref={jsonInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleJsonFileChange}
      />
      <input
        ref={mmdInputRef}
        type="file"
        accept=".mmd,.txt,text/plain"
        className="hidden"
        onChange={handleMmdFileChange}
      />
    </div>
  );
}
