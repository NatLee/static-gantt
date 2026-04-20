'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, FolderOpen } from 'lucide-react';
import type { ProjectsAPI, SaveStatus } from '@/hooks/usePersistentGanttState';

interface ProjectSwitcherProps {
  api: ProjectsAPI;
  saveStatus: SaveStatus;
  onOpenProjectList: () => void;
}

export default function ProjectSwitcher({ api, saveStatus, onOpenProjectList }: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const activeProject = api.projects.find(p => p.id === api.activeProjectId);
  const sortedProjects = [...api.projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const handleSwitch = useCallback(
    (id: string) => {
      api.switchTo(id);
      setOpen(false);
    },
    [api]
  );

  const handleManage = useCallback(() => {
    setOpen(false);
    onOpenProjectList();
  }, [onOpenProjectList]);

  return (
    <div ref={wrapperRef} className="project-switcher">
      <button
        type="button"
        className="project-chip"
        onClick={() => setOpen(o => !o)}
        title="Switch project"
      >
        <span className="project-chip-name">{activeProject?.name || 'Untitled'}</span>
        <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
        <SaveDot status={saveStatus} />
      </button>

      {open && (
        <div className="project-switcher-dropdown" role="menu">
          <div className="menu-heading">Switch project</div>
          {sortedProjects.slice(0, 8).map(p => {
            const active = p.id === api.activeProjectId;
            return (
              <button
                key={p.id}
                type="button"
                role="menuitem"
                className={`menu-item ${active ? 'menu-item-active' : ''}`}
                onClick={() => handleSwitch(p.id)}
              >
                <span className="menu-item-check" aria-hidden>
                  {active ? <Check className="w-3 h-3" /> : null}
                </span>
                <span className="menu-item-icon" aria-hidden />
                <span className="menu-item-label truncate">{p.name}</span>
                <span className="menu-item-shortcut">{p.taskCount}</span>
              </button>
            );
          })}
          {sortedProjects.length > 8 && (
            <div className="menu-heading" style={{ opacity: 0.6 }}>
              +{sortedProjects.length - 8} more
            </div>
          )}
          <div className="menu-divider" />
          <button type="button" role="menuitem" className="menu-item" onClick={handleManage}>
            <span className="menu-item-check" aria-hidden />
            <span className="menu-item-icon" aria-hidden><FolderOpen className="w-3.5 h-3.5" /></span>
            <span className="menu-item-label">Manage projects…</span>
          </button>
        </div>
      )}
    </div>
  );
}

function SaveDot({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null;
  const saving = status === 'saving';
  return (
    <span
      className="save-dot"
      title={saving ? 'Saving…' : 'Saved'}
      aria-label={saving ? 'Saving' : 'Saved'}
      style={{
        background: saving ? 'var(--text-secondary)' : '#10b981',
        animation: saving ? 'save-pulse 1s ease-in-out infinite' : undefined,
      }}
    />
  );
}
