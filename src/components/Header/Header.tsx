'use client';

import { Dispatch, useCallback } from 'react';
import { Layers, Moon, Sun, Download, Image as ImageIcon, Plus } from 'lucide-react';
import { GanttState, GanttAction, ComputedTask } from '@/types';
import { PROJECT_TITLE, PROJECT_SUBTITLE } from '@/data/defaultProject';
import { exportToExcel } from '@/lib/exportExcel';

interface HeaderProps {
  state: GanttState;
  dispatch: Dispatch<GanttAction>;
  computed: ComputedTask[];
  masterPhases: string[];
}

export default function Header({ state, dispatch, computed, masterPhases }: HeaderProps) {
  const handleFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      dispatch({ type: 'SET_FILTER', filter: e.target.value });
    },
    [dispatch]
  );

  const handleExportExcel = useCallback(() => {
    exportToExcel(computed, state.currentFilter);
  }, [computed, state.currentFilter]);

  const handleExportPNG = useCallback(() => {
    // PNG export requires refs to the gantt panel DOM elements.
    // These will be wired through the GanttPanel component.
    // For now, dispatch a no-op or alert the user.
    const target = document.getElementById('gantt-export-target');
    const scrollContainer = document.getElementById('gantt-scroll-container');
    if (target && scrollContainer) {
      import('@/lib/exportPng').then(({ exportToPNG }) => {
        exportToPNG(target, scrollContainer, state.isDark, state.currentFilter);
      });
    }
  }, [state.isDark, state.currentFilter]);

  const handleAddMilestone = useCallback(() => {
    dispatch({
      type: 'OPEN_DIALOG',
      dialog: { type: 'add-milestone', context: {} },
    });
  }, [dispatch]);

  const handleSetMode = useCallback(
    (mode: 'visual' | 'mermaid') => {
      dispatch({ type: 'SET_MODE', mode });
    },
    [dispatch]
  );

  const handleToggleTheme = useCallback(() => {
    dispatch({ type: 'TOGGLE_THEME' });
  }, [dispatch]);

  return (
    <header
      className="px-6 py-3 flex justify-between items-center shrink-0 z-[70] relative border-b"
      style={{
        background: 'var(--header-bg)',
        backdropFilter: 'blur(16px)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
            {PROJECT_TITLE}
          </h1>
          <p className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            {PROJECT_SUBTITLE}
          </p>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        {/* Phase Filter (only in visual mode) */}
        {state.currentMode === 'visual' && (
          <select
            className="custom-select btn-glass text-xs font-semibold rounded-lg px-3 py-[7px] pr-8 cursor-pointer"
            value={state.currentFilter}
            onChange={handleFilterChange}
          >
            <option value="ALL">All Phases</option>
            {masterPhases.map((phase) => (
              <option key={phase} value={phase}>
                {phase}
              </option>
            ))}
          </select>
        )}

        {/* Add Milestone */}
        <button
          className="btn-glass text-xs font-semibold rounded-lg px-3 py-[7px] flex items-center gap-1.5 cursor-pointer"
          onClick={handleAddMilestone}
        >
          <Plus className="w-3.5 h-3.5" />
          Milestone
        </button>

        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button
            className={`mode-btn ${state.currentMode === 'visual' ? 'active' : ''}`}
            onClick={() => handleSetMode('visual')}
          >
            Visual
          </button>
          <button
            className={`mode-btn ${state.currentMode === 'mermaid' ? 'active' : ''}`}
            onClick={() => handleSetMode('mermaid')}
          >
            Mermaid
          </button>
        </div>

        {/* Legend (hidden on small screens) */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Done
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            In Progress
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }} />
            Planned
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-rose-500 bg-transparent" />
            Critical Path
          </span>
        </div>

        {/* Export CSV */}
        <button
          className="btn-glass text-xs font-semibold rounded-lg px-3 py-[7px] flex items-center gap-1.5 cursor-pointer"
          onClick={handleExportExcel}
          title="Export to Excel"
        >
          <Download className="w-3.5 h-3.5" />
          CSV
        </button>

        {/* Export PNG */}
        <button
          className="btn-glass text-xs font-semibold rounded-lg px-3 py-[7px] flex items-center gap-1.5 cursor-pointer"
          onClick={handleExportPNG}
          title="Export to PNG"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          PNG
        </button>

        {/* Theme Toggle */}
        <button
          className="btn-glass rounded-lg p-[7px] cursor-pointer"
          onClick={handleToggleTheme}
          title={state.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {state.isDark ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
}
