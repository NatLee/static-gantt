'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppStorage, GanttAction, ProjectFile, SerializableGanttState } from '@/types';
import { useGanttState } from './useGanttState';
import {
  buildDefaultProject,
  buildEmptyProject,
  downloadAppStorage,
  downloadProjectFile,
  findActiveProject,
  loadAppStorage,
  makeId,
  now,
  parseImport,
  saveAppStorage,
  serializeState,
} from '@/lib/projectStorage';

const SAVE_DEBOUNCE_MS = 400;

export type SaveStatus = 'idle' | 'saving' | 'saved';

export interface ProjectsAPI {
  projects: Array<{ id: string; name: string; updatedAt: string; taskCount: number }>;
  activeProjectId: string;
  createEmpty: (name?: string) => void;
  createFromDefault: (name?: string) => void;
  duplicateActive: () => void;
  switchTo: (id: string) => void;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  downloadActive: () => void;
  downloadAll: () => void;
  importJsonText: (text: string) => Promise<{ kind: 'project' | 'app'; message: string }>;
}

export function usePersistentGanttState() {
  const gantt = useGanttState();
  const { state, dispatch, history } = gantt;

  const [storage, setStorage] = useState<AppStorage | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const storageRef = useRef<AppStorage | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSerializeRef = useRef(false);
  const lastSerializedRef = useRef<string>('');

  // Initial load from localStorage (client only)
  useEffect(() => {
    const loaded = loadAppStorage();
    storageRef.current = loaded;
    setStorage(loaded);

    const active = findActiveProject(loaded);
    skipNextSerializeRef.current = true;
    dispatch({ type: 'LOAD_PROJECT_STATE', state: active.state });

    // Restore preferences (theme, mode) by dispatching matching actions only if different
    // Theme: current default is dark=true, so only toggle when loaded says light
    if (loaded.preferences.isDark !== true) {
      dispatch({ type: 'TOGGLE_THEME' });
    }
    if (loaded.preferences.currentMode !== 'visual') {
      dispatch({ type: 'SET_MODE', mode: loaded.preferences.currentMode });
    }
    // Clear history so the initial load isn't undoable
    history.reset();
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist state on change (debounced). Guarded by content diff so equivalent
  // state doesn't retrigger writes on unrelated re-renders.
  useEffect(() => {
    if (!hydrated || !storageRef.current) return;

    const payload = JSON.stringify({
      s: serializeState(state),
      p: { isDark: state.isDark, currentMode: state.currentMode },
    });

    if (skipNextSerializeRef.current) {
      skipNextSerializeRef.current = false;
      lastSerializedRef.current = payload;
      return;
    }

    if (payload === lastSerializedRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('saving');

    saveTimerRef.current = setTimeout(() => {
      const current = storageRef.current;
      if (!current) return;
      const activeIdx = current.projects.findIndex(p => p.id === current.activeProjectId);
      if (activeIdx < 0) return;

      const updatedProject: ProjectFile = {
        ...current.projects[activeIdx],
        updatedAt: now(),
        state: serializeState(state),
      };
      const nextStorage: AppStorage = {
        ...current,
        projects: current.projects.map((p, i) => (i === activeIdx ? updatedProject : p)),
        preferences: {
          isDark: state.isDark,
          currentMode: state.currentMode,
        },
      };
      storageRef.current = nextStorage;
      saveAppStorage(nextStorage);
      setStorage(nextStorage);
      lastSerializedRef.current = payload;
      setSaveStatus('saved');
      setLastSavedAt(Date.now());

      if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current);
      savedStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 1500);
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state, hydrated]);

  const commitStorage = useCallback((next: AppStorage) => {
    storageRef.current = next;
    saveAppStorage(next);
    setStorage(next);
  }, []);

  const loadProjectIntoState = useCallback(
    (project: ProjectFile) => {
      skipNextSerializeRef.current = true;
      dispatch({ type: 'LOAD_PROJECT_STATE', state: project.state });
      history.reset();
    },
    [dispatch, history]
  );

  const api: ProjectsAPI = {
    projects:
      storage?.projects.map(p => ({
        id: p.id,
        name: p.name,
        updatedAt: p.updatedAt,
        taskCount: p.state.tasks.length,
      })) || [],
    activeProjectId: storage?.activeProjectId || '',

    createEmpty: useCallback(
      (name = 'Untitled Project') => {
        if (!storageRef.current) return;
        const project = buildEmptyProject(name);
        const next: AppStorage = {
          ...storageRef.current,
          projects: [...storageRef.current.projects, project],
          activeProjectId: project.id,
        };
        commitStorage(next);
        loadProjectIntoState(project);
      },
      [commitStorage, loadProjectIntoState]
    ),

    createFromDefault: useCallback(
      (name = 'Default Project') => {
        if (!storageRef.current) return;
        const project = buildDefaultProject(name);
        const next: AppStorage = {
          ...storageRef.current,
          projects: [...storageRef.current.projects, project],
          activeProjectId: project.id,
        };
        commitStorage(next);
        loadProjectIntoState(project);
      },
      [commitStorage, loadProjectIntoState]
    ),

    duplicateActive: useCallback(() => {
      if (!storageRef.current) return;
      const active = findActiveProject(storageRef.current);
      const copy: ProjectFile = {
        ...active,
        id: makeId(),
        name: `${active.name} (copy)`,
        createdAt: now(),
        updatedAt: now(),
        state: serializeState(state) as SerializableGanttState,
      };
      const next: AppStorage = {
        ...storageRef.current,
        projects: [...storageRef.current.projects, copy],
        activeProjectId: copy.id,
      };
      commitStorage(next);
      loadProjectIntoState(copy);
    }, [state, commitStorage, loadProjectIntoState]),

    switchTo: useCallback(
      (id: string) => {
        if (!storageRef.current) return;
        if (id === storageRef.current.activeProjectId) return;
        // Save current state to current active project first
        const currentActiveIdx = storageRef.current.projects.findIndex(
          p => p.id === storageRef.current!.activeProjectId
        );
        const targetProject = storageRef.current.projects.find(p => p.id === id);
        if (!targetProject) return;

        const projects = [...storageRef.current.projects];
        if (currentActiveIdx >= 0) {
          projects[currentActiveIdx] = {
            ...projects[currentActiveIdx],
            updatedAt: now(),
            state: serializeState(state),
          };
        }
        const next: AppStorage = {
          ...storageRef.current,
          projects,
          activeProjectId: id,
        };
        commitStorage(next);
        loadProjectIntoState(targetProject);
      },
      [state, commitStorage, loadProjectIntoState]
    ),

    rename: useCallback(
      (id: string, name: string) => {
        if (!storageRef.current) return;
        const trimmed = name.trim();
        if (!trimmed) return;
        const next: AppStorage = {
          ...storageRef.current,
          projects: storageRef.current.projects.map(p =>
            p.id === id ? { ...p, name: trimmed, updatedAt: now() } : p
          ),
        };
        commitStorage(next);
      },
      [commitStorage]
    ),

    remove: useCallback(
      (id: string) => {
        if (!storageRef.current) return;
        const remaining = storageRef.current.projects.filter(p => p.id !== id);
        if (remaining.length === 0) {
          // Keep at least one project
          const fresh = buildEmptyProject();
          const next: AppStorage = {
            ...storageRef.current,
            projects: [fresh],
            activeProjectId: fresh.id,
          };
          commitStorage(next);
          loadProjectIntoState(fresh);
          return;
        }
        let activeId = storageRef.current.activeProjectId;
        let toLoad: ProjectFile | null = null;
        if (id === activeId) {
          activeId = remaining[0].id;
          toLoad = remaining[0];
        }
        const next: AppStorage = {
          ...storageRef.current,
          projects: remaining,
          activeProjectId: activeId,
        };
        commitStorage(next);
        if (toLoad) loadProjectIntoState(toLoad);
      },
      [commitStorage, loadProjectIntoState]
    ),

    downloadActive: useCallback(() => {
      if (!storageRef.current) return;
      const active = findActiveProject(storageRef.current);
      // Make sure we download the latest state, not whatever was saved
      const current: ProjectFile = {
        ...active,
        updatedAt: now(),
        state: serializeState(state),
      };
      downloadProjectFile(current);
    }, [state]),

    downloadAll: useCallback(() => {
      if (!storageRef.current) return;
      downloadAppStorage(storageRef.current);
    }, []),

    importJsonText: useCallback(
      async (text: string) => {
        if (!storageRef.current) throw new Error('Storage not ready');
        const parsed = parseImport(text);
        if (parsed.kind === 'project') {
          const incoming: ProjectFile = {
            ...parsed.project,
            id: makeId(),
            updatedAt: now(),
          };
          const next: AppStorage = {
            ...storageRef.current,
            projects: [...storageRef.current.projects, incoming],
            activeProjectId: incoming.id,
          };
          commitStorage(next);
          loadProjectIntoState(incoming);
          return { kind: 'project' as const, message: `Imported "${incoming.name}"` };
        }
        // Full app storage — replace entire storage
        const next: AppStorage = parsed.storage;
        commitStorage(next);
        const active = findActiveProject(next);
        loadProjectIntoState(active);
        return {
          kind: 'app' as const,
          message: `Imported ${next.projects.length} project(s)`,
        };
      },
      [commitStorage, loadProjectIntoState]
    ),
  };

  return {
    ...gantt,
    hydrated,
    projects: api,
    saveStatus,
    lastSavedAt,
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    dispatch: dispatch as (a: GanttAction) => void,
  };
}
