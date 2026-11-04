import {
  AppStorage,
  GanttState,
  ProjectFile,
  SerializableGanttState,
} from '@/types';
import { defaultTasks, defaultMilestones } from '@/data/defaultProject';
import { computeSchedule, computeTimelineBounds } from '@/lib/scheduler';

export const STORAGE_KEY = 'gantt-app-v1';
export const APP_VERSION = 1 as const;
export const PROJECT_VERSION = 1 as const;

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function now(): string {
  return new Date().toISOString();
}

export function serializeState(state: GanttState): SerializableGanttState {
  return {
    tasks: state.tasks,
    milestones: state.milestones,
    currentFilter: state.currentFilter,
    zoomScale: state.zoomScale,
    collapsedPhases: Array.from(state.collapsedPhases),
    collapsedSubPhases: Array.from(state.collapsedSubPhases),
    timelineStartDay: state.timelineStartDay,
    timelineEndDay: state.timelineEndDay,
    workingDaysOnly: state.workingDaysOnly,
    baseline: state.baseline,
  };
}

export function buildDefaultProject(name = 'Default Project'): ProjectFile {
  const bounds = computeTimelineBounds(computeSchedule(defaultTasks), defaultMilestones);
  const id = makeId();
  const ts = now();
  return {
    version: PROJECT_VERSION,
    id,
    name,
    createdAt: ts,
    updatedAt: ts,
    state: {
      tasks: defaultTasks,
      milestones: defaultMilestones,
      currentFilter: 'ALL',
      zoomScale: 1,
      collapsedPhases: [],
      collapsedSubPhases: [],
      timelineStartDay: bounds.startDay,
      timelineEndDay: bounds.endDay,
    },
  };
}

export function buildEmptyProject(name = 'Untitled Project'): ProjectFile {
  const id = makeId();
  const ts = now();
  return {
    version: PROJECT_VERSION,
    id,
    name,
    createdAt: ts,
    updatedAt: ts,
    state: {
      tasks: [],
      milestones: [],
      currentFilter: 'ALL',
      zoomScale: 1,
      collapsedPhases: [],
      collapsedSubPhases: [],
      timelineStartDay: 0,
      timelineEndDay: 30,
    },
  };
}

export function buildInitialAppStorage(): AppStorage {
  const def = buildDefaultProject();
  return {
    version: APP_VERSION,
    projects: [def],
    activeProjectId: def.id,
    preferences: {
      isDark: true,
      currentMode: 'visual',
    },
  };
}

function isValidAppStorage(value: unknown): value is AppStorage {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<AppStorage>;
  return (
    v.version === APP_VERSION &&
    Array.isArray(v.projects) &&
    typeof v.activeProjectId === 'string' &&
    !!v.preferences
  );
}

export function loadAppStorage(): AppStorage {
  if (typeof window === 'undefined') return buildInitialAppStorage();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialAppStorage();
    const parsed = JSON.parse(raw);
    if (!isValidAppStorage(parsed)) return buildInitialAppStorage();
    if (parsed.projects.length === 0) return buildInitialAppStorage();
    const hasActive = parsed.projects.some(p => p.id === parsed.activeProjectId);
    if (!hasActive) parsed.activeProjectId = parsed.projects[0].id;
    return parsed;
  } catch {
    return buildInitialAppStorage();
  }
}

export function saveAppStorage(storage: AppStorage): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (err) {
    console.error('Failed to save app storage', err);
  }
}

export function findActiveProject(storage: AppStorage): ProjectFile {
  return (
    storage.projects.find(p => p.id === storage.activeProjectId) ||
    storage.projects[0]
  );
}

function isProjectFile(value: unknown): value is ProjectFile {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<ProjectFile>;
  return (
    v.version === PROJECT_VERSION &&
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    !!v.state &&
    Array.isArray(v.state.tasks)
  );
}

export type ImportedPayload =
  | { kind: 'project'; project: ProjectFile }
  | { kind: 'app'; storage: AppStorage };

export function parseImport(jsonText: string): ImportedPayload {
  const parsed = JSON.parse(jsonText);
  if (isValidAppStorage(parsed)) return { kind: 'app', storage: parsed };
  if (isProjectFile(parsed)) return { kind: 'project', project: parsed };
  throw new Error('Unrecognized file format');
}

export function downloadProjectFile(project: ProjectFile): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: 'application/json',
  });
  triggerDownload(blob, `${sanitizeFilename(project.name)}.gantt.json`);
}

export function downloadAppStorage(storage: AppStorage): void {
  const blob = new Blob([JSON.stringify(storage, null, 2)], {
    type: 'application/json',
  });
  triggerDownload(blob, `gantt-backup-${new Date().toISOString().slice(0, 10)}.json`);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\- ]+/g, '').trim().replace(/\s+/g, '-') || 'project';
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export { makeId, now };
