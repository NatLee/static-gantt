import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  STORAGE_KEY,
  findActiveProject,
  loadAppStorage,
  parseImport,
  saveAppStorage,
  serializeState,
} from './projectStorage';
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
    saveAppStorage(savedV1 as AppStorage);
    expect(loadAppStorage()).toEqual(savedV1);
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
    expect(() => parseImport('{"hello":"world"}')).toThrow();
  });
});
