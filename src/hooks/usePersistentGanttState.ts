'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppStorage, GanttAction, ProjectFile } from '@/types';
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
  type ImportedPayload,
  saveAppStorage,
  serializeState,
  withLiveState,
} from '@/lib/projectStorage';

const SAVE_DEBOUNCE_MS = 400;
/** How long the green "saved" dot stays after a successful write. */
const SAVED_BADGE_MS = 1500;

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface ProjectsAPI {
  projects: Array<{ id: string; name: string; updatedAt: string; taskCount: number }>;
  activeProjectId: string;
  /** Name of the open project ('' until saved data has loaded). */
  activeProjectName: string;
  createEmpty: (name?: string) => void;
  createFromDefault: (name?: string) => void;
  /** Copy a project (the open one includes its unsaved edits) and open the copy. */
  duplicate: (id: string) => void;
  switchTo: (id: string) => void;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  /** Download one project as .gantt.json without switching to it. */
  download: (id: string) => void;
  downloadAll: () => void;
  /**
   * Apply a file read with parseImport: a single project is added and opened; a full backup
   * replaces every project (the caller asks the user first).
   */
  applyImport: (payload: ImportedPayload) => void;
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
  const pendingSaveRef = useRef<(() => void) | null>(null);

  /** Show the result of a write: a short "saved", or "not saved" until a later write succeeds. */
  const reportSave = useCallback((ok: boolean) => {
    if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current);
    if (!ok) {
      setSaveStatus('error');
      return;
    }
    setSaveStatus('saved');
    setLastSavedAt(Date.now());
    savedStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), SAVED_BADGE_MS);
  }, []);

  // Initial load from localStorage. This has to run after mount: the page is prebuilt without
  // access to the browser storage, and the first client render must match that HTML.
  useEffect(() => {
    const loaded = loadAppStorage();
    storageRef.current = loaded;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage once after mount
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

    const save = () => {
      pendingSaveRef.current = null;
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
      setStorage(nextStorage);
      lastSerializedRef.current = payload;
      reportSave(saveAppStorage(nextStorage));
    };
    pendingSaveRef.current = save;
    saveTimerRef.current = setTimeout(save, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      pendingSaveRef.current = null;
    };
  }, [state, hydrated, reportSave]);

  // An edit made less than SAVE_DEBOUNCE_MS before the tab is closed or hidden would otherwise
  // be lost: write it out right away.
  useEffect(() => {
    const flush = () => pendingSaveRef.current?.();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const commitStorage = useCallback((next: AppStorage) => {
    storageRef.current = next;
    setStorage(next);
    reportSave(saveAppStorage(next));
  }, [reportSave]);

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
    activeProjectName: storage ? findActiveProject(storage).name : '',

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

    duplicate: useCallback(
      (id: string) => {
        if (!storageRef.current) return;
        // Write the open project's latest edits first, then copy the requested project from
        // that: the copy used to take the open project's tasks whatever project was picked.
        const saved = withLiveState(storageRef.current, state);
        const source = saved.projects.find(p => p.id === id);
        if (!source) return;
        const copy: ProjectFile = {
          ...source,
          id: makeId(),
          name: `${source.name} (copy)`,
          createdAt: now(),
          updatedAt: now(),
        };
        commitStorage({ ...saved, projects: [...saved.projects, copy], activeProjectId: copy.id });
        loadProjectIntoState(copy);
      },
      [state, commitStorage, loadProjectIntoState]
    ),

    switchTo: useCallback(
      (id: string) => {
        if (!storageRef.current) return;
        if (id === storageRef.current.activeProjectId) return;
        const targetProject = storageRef.current.projects.find(p => p.id === id);
        if (!targetProject) return;
        // Save the open project's edits before leaving it.
        commitStorage({ ...withLiveState(storageRef.current, state), activeProjectId: id });
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

    download: useCallback(
      (id: string) => {
        if (!storageRef.current) return;
        // The open project is downloaded with its unsaved edits, any other one as saved.
        const project = withLiveState(storageRef.current, state).projects.find(p => p.id === id);
        if (project) downloadProjectFile(project);
      },
      [state]
    ),

    downloadAll: useCallback(() => {
      if (!storageRef.current) return;
      downloadAppStorage(withLiveState(storageRef.current, state));
    }, [state]),

    applyImport: useCallback(
      (parsed: ImportedPayload) => {
        if (!storageRef.current) return;
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
          return;
        }
        // Full backup: replaces every project.
        commitStorage(parsed.storage);
        loadProjectIntoState(findActiveProject(parsed.storage));
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
