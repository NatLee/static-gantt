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
  Briefcase,
  Camera,
  Eraser,
} from 'lucide-react';
import { Menu, MenuItem, MenuDivider, MenuHeading } from './Menu';
import ProjectSwitcher from './ProjectSwitcher';
import { Segmented, SegmentedButton } from './Segmented';
import { PROJECT_TITLE, PROJECT_SUBTITLE } from '@/data/defaultProject';
import { exportToExcel } from '@/lib/exportExcel';
import type { GanttAction, GanttState, ComputedTask } from '@/types';
import type { ProjectsAPI, SaveStatus } from '@/hooks/usePersistentGanttState';
import type { ZoomPreset } from '@/components/GanttApp';
import { useI18n } from '@/i18n/I18nProvider';
import { LOCALES, LOCALE_LABELS } from '@/i18n/config';
import { Languages } from 'lucide-react';

export interface MenubarProps {
  state: GanttState;
  dispatch: Dispatch<GanttAction>;
  computed: ComputedTask[];
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

  const { t, locale, setLocale } = useI18n();
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const mmdInputRef = useRef<HTMLInputElement>(null);

  const openDialog = useCallback(
    (type: 'add-phase' | 'add-sub-phase' | 'add-task' | 'add-milestone') => {
      dispatch({ type: 'OPEN_DIALOG', dialog: { type, context: {} } });
    },
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
        alert(err instanceof Error ? err.message : t('file.importFailed'));
      } finally {
        if (jsonInputRef.current) jsonInputRef.current.value = '';
      }
    },
    [projectsApi, t]
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
        <Menu label={t('menu.file')}>
          <MenuItem
            icon={<FilePlus className="w-3.5 h-3.5" />}
            label={t('file.newEmpty')}
            onClick={() => projectsApi.createEmpty()}
          />
          <MenuItem
            icon={<FilePlus className="w-3.5 h-3.5" />}
            label={t('file.newTemplate')}
            onClick={() => projectsApi.createFromDefault()}
          />
          <MenuDivider />
          <MenuItem
            icon={<FolderOpen className="w-3.5 h-3.5" />}
            label={t('file.openManage')}
            onClick={onOpenProjectList}
          />
          <MenuItem
            icon={<Copy className="w-3.5 h-3.5" />}
            label={t('file.duplicate')}
            onClick={() => projectsApi.duplicateActive()}
          />
          <MenuItem
            icon={<FileText className="w-3.5 h-3.5" />}
            label={t('file.rename')}
            onClick={onOpenProjectList}
          />
          <MenuDivider />
          <MenuItem
            icon={<Download className="w-3.5 h-3.5" />}
            label={t('file.downloadJson')}
            onClick={() => projectsApi.downloadActive()}
          />
          <MenuItem
            icon={<HardDriveDownload className="w-3.5 h-3.5" />}
            label={t('file.downloadBackup')}
            onClick={() => projectsApi.downloadAll()}
          />
          <MenuItem
            icon={<Upload className="w-3.5 h-3.5" />}
            label={t('file.importJson')}
            onClick={() => jsonInputRef.current?.click()}
          />
        </Menu>

        {/* Edit */}
        <Menu label={t('menu.edit')}>
          <MenuItem
            icon={<Undo2 className="w-3.5 h-3.5" />}
            label={t('edit.undo')}
            shortcut="⌘Z"
            onClick={onUndo}
            disabled={!canUndo}
          />
          <MenuItem
            icon={<Redo2 className="w-3.5 h-3.5" />}
            label={t('edit.redo')}
            shortcut="⇧⌘Z"
            onClick={onRedo}
            disabled={!canRedo}
          />
          <MenuDivider />
          <MenuItem
            icon={<Search className="w-3.5 h-3.5" />}
            label={t('edit.find')}
            shortcut="⌘F"
            onClick={onOpenSearch}
          />
        </Menu>

        {/* View */}
        <Menu label={t('menu.view')}>
          <MenuHeading>{t('view.theme')}</MenuHeading>
          <MenuItem
            icon={<Sun className="w-3.5 h-3.5" />}
            label={t('view.light')}
            checked={!state.isDark}
            onClick={() => {
              if (state.isDark) dispatch({ type: 'TOGGLE_THEME' });
            }}
          />
          <MenuItem
            icon={<Moon className="w-3.5 h-3.5" />}
            label={t('view.dark')}
            checked={state.isDark}
            onClick={() => {
              if (!state.isDark) dispatch({ type: 'TOGGLE_THEME' });
            }}
          />
          <MenuDivider />
          <MenuItem
            icon={<CalendarDays className="w-3.5 h-3.5" />}
            label={t('view.scrollToday')}
            shortcut="T"
            onClick={onScrollToToday}
            disabled={isMermaid}
          />
          <MenuItem
            icon={<ZoomIn className="w-3.5 h-3.5" />}
            label={t('view.zoomIn')}
            shortcut="+"
            onClick={onZoomIn}
            disabled={isMermaid}
          />
          <MenuItem
            icon={<ZoomOut className="w-3.5 h-3.5" />}
            label={t('view.zoomOut')}
            shortcut="−"
            onClick={onZoomOut}
            disabled={isMermaid}
          />
          <MenuItem
            icon={<Maximize2 className="w-3.5 h-3.5" />}
            label={t('view.fit')}
            onClick={onFitToScreen}
            disabled={isMermaid}
          />
          <MenuDivider />
          <MenuHeading>{t('view.zoomPreset')}</MenuHeading>
          <MenuItem
            label={t('view.dayView')}
            checked={!isMermaid && currentZoomPreset === 'day'}
            onClick={() => onApplyZoomPreset('day')}
            disabled={isMermaid}
          />
          <MenuItem
            label={t('view.weekView')}
            checked={!isMermaid && currentZoomPreset === 'week'}
            onClick={() => onApplyZoomPreset('week')}
            disabled={isMermaid}
          />
          <MenuItem
            label={t('view.monthView')}
            checked={!isMermaid && currentZoomPreset === 'month'}
            onClick={() => onApplyZoomPreset('month')}
            disabled={isMermaid}
          />
          <MenuDivider />
          <MenuItem
            icon={<ChevronsDownUp className="w-3.5 h-3.5" />}
            label={t('view.collapseAll')}
            onClick={() => dispatch({ type: 'COLLAPSE_ALL_PHASES' })}
            disabled={isMermaid}
          />
          <MenuItem
            icon={<ChevronsUpDown className="w-3.5 h-3.5" />}
            label={t('view.expandAll')}
            onClick={() => dispatch({ type: 'EXPAND_ALL_PHASES' })}
            disabled={isMermaid}
          />
          <MenuDivider />
          <MenuItem
            icon={state.legendVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            label={state.legendVisible ? t('view.hideLegend') : t('view.showLegend')}
            onClick={() => dispatch({ type: 'TOGGLE_LEGEND_VISIBLE' })}
            disabled={isMermaid}
          />
          <MenuDivider />
          <MenuHeading>{t('view.scheduleBaseline')}</MenuHeading>
          <MenuItem
            icon={<Briefcase className="w-3.5 h-3.5" />}
            label={t('view.workingDays')}
            checked={state.workingDaysOnly}
            onClick={() => dispatch({ type: 'SET_WORKING_DAYS', enabled: !state.workingDaysOnly })}
            disabled={isMermaid}
          />
          <MenuItem
            icon={<Camera className="w-3.5 h-3.5" />}
            label={state.baseline ? t('view.recaptureBaseline') : t('view.captureBaseline')}
            onClick={() => dispatch({ type: 'CAPTURE_BASELINE' })}
            disabled={isMermaid}
          />
          <MenuItem
            icon={<Eraser className="w-3.5 h-3.5" />}
            label={t('view.clearBaseline')}
            onClick={() => dispatch({ type: 'CLEAR_BASELINE' })}
            disabled={isMermaid || !state.baseline}
          />
          <MenuDivider />
          <MenuHeading>{t('view.language')}</MenuHeading>
          {LOCALES.map(loc => (
            <MenuItem
              key={loc}
              icon={<Languages className="w-3.5 h-3.5" />}
              label={LOCALE_LABELS[loc]}
              checked={locale === loc}
              onClick={() => setLocale(loc)}
            />
          ))}
        </Menu>

        {/* Insert */}
        <Menu label={t('menu.insert')}>
          <MenuItem
            icon={<Plus className="w-3.5 h-3.5" />}
            label={t('insert.phase')}
            onClick={() => openDialog('add-phase')}
          />
          <MenuItem
            icon={<Plus className="w-3.5 h-3.5" />}
            label={t('insert.subPhase')}
            onClick={() => openDialog('add-sub-phase')}
          />
          <MenuItem
            icon={<Plus className="w-3.5 h-3.5" />}
            label={t('insert.task')}
            onClick={() => openDialog('add-task')}
          />
          <MenuItem
            icon={<Plus className="w-3.5 h-3.5" />}
            label={t('insert.milestone')}
            onClick={() => openDialog('add-milestone')}
          />
        </Menu>

        {/* Export */}
        <Menu label={t('menu.export')}>
          <MenuHeading>{t('export.gantt')}</MenuHeading>
          <MenuItem
            icon={<Download className="w-3.5 h-3.5" />}
            label={t('export.csv')}
            onClick={() => exportToExcel(computed, state.currentFilter)}
          />
          <MenuItem
            icon={<ImageIcon className="w-3.5 h-3.5" />}
            label={t('export.png')}
            onClick={onExportPNG}
            disabled={isMermaid}
          />
          <MenuItem
            icon={<Download className="w-3.5 h-3.5" />}
            label={t('export.jsonProject')}
            onClick={() => projectsApi.downloadActive()}
          />
          <MenuDivider />
          <MenuHeading>{t('export.mermaid')}</MenuHeading>
          <MenuItem
            icon={<ImageIcon className="w-3.5 h-3.5" />}
            label={t('export.svg')}
            onClick={onExportMermaidSVG}
            disabled={!isMermaid}
          />
          <MenuItem
            icon={<ImageIcon className="w-3.5 h-3.5" />}
            label={t('export.png')}
            onClick={onExportMermaidPNG}
            disabled={!isMermaid}
          />
          <MenuItem
            icon={<FileDown className="w-3.5 h-3.5" />}
            label={t('export.mmdFile')}
            onClick={onDownloadMmd}
            disabled={!isMermaid}
          />
          <MenuItem
            icon={<Upload className="w-3.5 h-3.5" />}
            label={t('export.importMmd')}
            onClick={() => mmdInputRef.current?.click()}
            disabled={!isMermaid}
          />
        </Menu>

        {/* Help */}
        <Menu label={t('menu.help')}>
          <MenuItem
            icon={<Keyboard className="w-3.5 h-3.5" />}
            label={t('help.shortcuts')}
            shortcut="?"
            onClick={onOpenShortcuts}
          />
          <MenuItem
            icon={<Info className="w-3.5 h-3.5" />}
            label={t('help.about')}
            onClick={() =>
              alert(`${PROJECT_TITLE}\n${PROJECT_SUBTITLE}\n\n${t('help.aboutBody')}`)
            }
          />
        </Menu>
      </div>

      <div className="menubar-right">
        <Segmented>
          <SegmentedButton
            label={t('mode.visual')}
            active={state.currentMode === 'visual'}
            onClick={() => handleSetMode('visual')}
          />
          <SegmentedButton
            label={t('mode.mermaid')}
            active={state.currentMode === 'mermaid'}
            onClick={() => handleSetMode('mermaid')}
          />
        </Segmented>
        <button
          type="button"
          className="icon-btn"
          onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
          title={state.isDark ? t('mode.switchLight') : t('mode.switchDark')}
        >
          {state.isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onOpenShortcuts}
          title={t('mode.shortcutsTitle')}
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
