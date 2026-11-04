import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ImportError,
  STORAGE_KEY,
  findActiveProject,
  loadAppStorage,
  normalizeProjectState,
  parseImport,
  saveAppStorage,
  serializeState,
  withLiveState,
} from './projectStorage';
import { exportBaseName, safeFileName } from './download';
import { ganttReducer } from '@/hooks/useGanttState';
import type { AppStorage, GanttState } from '@/types';
import savedV1 from '@/test/fixtures/app-storage-v1.json';

// A localStorage stand-in so the browser-only code paths run under Node.
class MemoryStorage {
  private data = new Map<string, string>();
  getItem(k: string) { return this.data.has(k) ? this.data.get(k)! : null; }
  setItem(k: string, v: string) { this.data.set(k, String(v)); }
  removeItem(k: string) { this.data.delete(k); }
  clear() { this.data.clear(); }
}

let storage: MemoryStorage;
beforeEach(() => {
  storage = new MemoryStorage();
  (globalThis as { window?: unknown }).window = { localStorage: storage };
});
afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

const emptyState = (): GanttState => ({
  tasks: [], milestones: [], currentFilter: 'ALL', currentMode: 'visual', isDark: true, zoomScale: 1,
  collapsedPhases: new Set(), collapsedSubPhases: new Set(), editingTaskId: null, highlightedTaskId: null,
  selectedTaskId: null, activeDialog: null, timelineStartDay: 0, timelineEndDay: 30, legendVisible: true,
  workingDaysOnly: false, baseline: null,
});

describe('stored projects saved by earlier versions', () => {
  it('load unchanged from localStorage', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify(savedV1));
    const loaded = loadAppStorage();
    expect(loaded).toEqual(savedV1);
    expect(findActiveProject(loaded).name).toBe('Website relaunch');
  });

  it('restore every saved field into the editor state', () => {
    const project = (savedV1 as AppStorage).projects[0];
    const state = ganttReducer(emptyState(), { type: 'LOAD_PROJECT_STATE', state: project.state });
    expect(state.tasks).toEqual(project.state.tasks);
    expect(state.milestones).toEqual(project.state.milestones);
    expect(state.currentFilter).toBe('Phase 1');
    expect(state.zoomScale).toBe(2);
    expect([...state.collapsedSubPhases]).toEqual(['Phase 2::Build']);
    expect(state.workingDaysOnly).toBe(true);
    expect(state.baseline).toEqual(project.state.baseline);
    // Saving it again writes the same project state back.
    expect(serializeState(state)).toEqual(project.state);
  });

  it('fill in defaults for fields that did not exist yet', () => {
    const older = (savedV1 as AppStorage).projects[1];
    const state = ganttReducer(emptyState(), { type: 'LOAD_PROJECT_STATE', state: older.state });
    expect(state.workingDaysOnly).toBe(false);
    expect(state.baseline).toBeNull();
  });
});

describe('loadAppStorage', () => {
  it('starts with the sample project when nothing is stored', () => {
    const loaded = loadAppStorage();
    expect(loaded.projects).toHaveLength(1);
    expect(loaded.projects[0].state.tasks.length).toBeGreaterThan(0);
    expect(loaded.activeProjectId).toBe(loaded.projects[0].id);
  });

  it('falls back to a fresh start when the stored JSON is corrupt', () => {
    storage.setItem(STORAGE_KEY, '{not json');
    expect(loadAppStorage().projects).toHaveLength(1);
  });

  it('points at the first project when the active id is stale', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...savedV1, activeProjectId: 'gone' }));
    expect(loadAppStorage().activeProjectId).toBe('6f1c2b9e-1d2a-4c51-9a0e-3d1b7c2f8a10');
  });

  it('round-trips through saveAppStorage', () => {
    expect(saveAppStorage(savedV1 as AppStorage)).toBe(true);
    expect(loadAppStorage()).toEqual(savedV1);
  });

  it('reports a refused write instead of only logging it', () => {
    // Quota exceeded, Safari private mode, …: the UI now shows "not saved" for this.
    storage.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); };
    const quiet = console.error;
    console.error = () => {};
    try {
      expect(saveAppStorage(savedV1 as AppStorage)).toBe(false);
    } finally {
      console.error = quiet;
    }
  });

  it('skips a stored project whose tasks are unusable and keeps the rest', () => {
    const broken = { ...savedV1, projects: [{ ...savedV1.projects[0], state: { tasks: 'oops' } }, savedV1.projects[1]] };
    storage.setItem(STORAGE_KEY, JSON.stringify(broken));
    const loaded = loadAppStorage();
    expect(loaded.projects.map(p => p.id)).toEqual(['p0older']);
    expect(loaded.activeProjectId).toBe('p0older');
  });
});

describe('normalizeProjectState', () => {
  it('returns valid saved state unchanged', () => {
    for (const p of (savedV1 as AppStorage).projects) {
      expect(normalizeProjectState(p.state)).toEqual(p.state);
    }
  });

  it('fills in what a hand-made file leaves out', () => {
    const state = normalizeProjectState({ tasks: [{ id: 'a', name: 'A', start: '2026-03-02', duration: null }] })!;
    expect(state.tasks).toEqual([{ id: 'a', name: 'A', start: '2026-03-02', duration: 1, phase: 'Other', status: 'planned', isCritical: false }]);
    expect(state.milestones).toEqual([]);
    expect(state.currentFilter).toBe('ALL');
    expect(state.zoomScale).toBe(1);
    expect(Number.isFinite(state.timelineStartDay) && Number.isFinite(state.timelineEndDay)).toBe(true);
  });

  it('rejects tasks without an id and malformed milestones', () => {
    expect(normalizeProjectState({ tasks: [{ name: 'no id' }] })).toBeNull();
    expect(normalizeProjectState({ tasks: [], milestones: [{ id: 1 }] })).toBeNull();
    expect(normalizeProjectState({ tasks: {} })).toBeNull();
  });
});

describe('parseImport', () => {
  it('recognises a full backup', () => {
    expect(parseImport(JSON.stringify(savedV1)).kind).toBe('app');
  });

  it('recognises a single project file', () => {
    const result = parseImport(JSON.stringify((savedV1 as AppStorage).projects[0]));
    expect(result.kind).toBe('project');
  });

  it('rejects unrelated JSON', () => {
    expect(() => parseImport('{"hello":"world"}')).toThrow(ImportError);
  });

  // Each rejection carries a code the UI translates; before, users saw raw parser messages such
  // as "Unexpected token" and an empty backup crashed the page after replacing all projects.
  const codeOf = (text: string) => {
    try { parseImport(text); } catch (e) { return e instanceof ImportError ? [e.code, e.projectName] : ['other']; }
    return ['accepted'];
  };

  it('explains why a file was rejected', () => {
    expect(codeOf('not json')).toEqual(['not-json', undefined]);
    expect(codeOf('{"hello":"world"}')).toEqual(['unknown-format', undefined]);
    expect(codeOf(JSON.stringify({ ...savedV1, projects: [] }))).toEqual(['no-projects', undefined]);
    const badProject = { ...savedV1.projects[0], name: 'Broken', state: { tasks: [{ name: 'no id' }] } };
    expect(codeOf(JSON.stringify(badProject))).toEqual(['invalid-project', 'Broken']);
    expect(codeOf(JSON.stringify({ ...savedV1, projects: [savedV1.projects[1], badProject] }))).toEqual(['invalid-project', 'Broken']);
  });

  it('points a backup at a project that exists', () => {
    const result = parseImport(JSON.stringify({ ...savedV1, activeProjectId: 'gone' }));
    expect(result.kind === 'app' && result.storage.activeProjectId).toBe('6f1c2b9e-1d2a-4c51-9a0e-3d1b7c2f8a10');
  });
});

describe('safeFileName', () => {
  it('keeps letters of every script and drops characters file systems refuse', () => {
    // The old filter kept only ASCII, so every Chinese or Japanese project downloaded as "project".
    expect(safeFileName('網站 改版', 'project')).toBe('網站-改版');
    expect(safeFileName('Q3: plan / v2?', 'project')).toBe('Q3-plan-v2');
    expect(safeFileName('  ', 'project')).toBe('project');
  });
});

describe('exportBaseName', () => {
  it('names exports after the project and the active phase filter', () => {
    // Every export used to be called "SaaS_Roadmap_<filter>", the sample project's name.
    expect(exportBaseName('Website relaunch')).toBe('Website-relaunch');
    expect(exportBaseName('Website relaunch', 'Phase 2')).toBe('Website-relaunch-Phase-2');
    expect(exportBaseName('', 'ALL')).toBe('gantt');
  });
});

describe('withLiveState', () => {
  // The project list's Duplicate and Download buttons switched to the picked project and then
  // read the *previous* project's editor state, so the copy or file had the wrong tasks.
  it('writes the open project\'s editor state and leaves the others as saved', () => {
    const stored = savedV1 as AppStorage;
    const live = { ...emptyState(), tasks: [{ id: 'live', phase: 'Phase 1 X', name: 'Edited', duration: 2, status: 'planned' as const, isCritical: false, start: '2026-06-01' }] };
    const merged = withLiveState(stored, live);
    expect(merged.projects[0].state.tasks.map(t => t.id)).toEqual(['live']);
    expect(merged.projects[1]).toEqual(stored.projects[1]);
    expect(stored.projects[0].state.tasks).toHaveLength(3); // input untouched
  });
});
