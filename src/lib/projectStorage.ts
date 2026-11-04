import {
  AppStorage,
  GanttState,
  Milestone,
  ProjectFile,
  SerializableGanttState,
  Task,
  TaskStatus,
} from '@/types';
import { defaultTasks, defaultMilestones } from '@/data/defaultProject';
import { computeSchedule, computeTimelineBounds } from '@/lib/scheduler';
import { todayISO } from '@/lib/dateUtils';
import { OTHER_PHASE } from '@/lib/phase';
import { downloadBlob, safeFileName } from '@/lib/download';

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

/**
 * Storage with the open project's current editor state written in. Autosave lags behind by a
 * moment, so anything that reads projects from storage (switching, copying, downloading) goes
 * through this to see the latest edits.
 */
export function withLiveState(storage: AppStorage, live: GanttState): AppStorage {
  return {
    ...storage,
    projects: storage.projects.map(p =>
      p.id === storage.activeProjectId ? { ...p, updatedAt: now(), state: serializeState(live) } : p
    ),
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

// ---- Reading stored and imported data ----
//
// Saved data is plain JSON, so it is checked before use: localStorage can be edited by hand,
// and imported files can come from anywhere. Projects saved by any earlier release load
// unchanged; fields that hand-made or older files leave out get their defaults.

/** Why an imported file was rejected; the UI turns the code into a translated message. */
export type ImportErrorCode = 'not-json' | 'unknown-format' | 'no-projects' | 'invalid-project';

export class ImportError extends Error {
  constructor(
    readonly code: ImportErrorCode,
    /** For 'invalid-project': the project's name. */
    readonly projectName?: string
  ) {
    super(projectName ? `${code}: ${projectName}` : code);
    this.name = 'ImportError';
  }
}

const TASK_STATUSES: readonly TaskStatus[] = ['done', 'in-progress', 'planned'];

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(x => typeof x === 'string');

/**
 * A usable task, or null when it has no id. Everything else gets a default, so a project is never
 * thrown away over one odd field (a cleared duration field, for example, is saved as null).
 */
function normalizeTask(raw: unknown): Task | null {
  if (!isRecord(raw) || typeof raw.id !== 'string' || !raw.id) return null;
  return {
    ...(raw as unknown as Task),
    phase: typeof raw.phase === 'string' ? raw.phase : OTHER_PHASE,
    name: typeof raw.name === 'string' ? raw.name : '',
    duration: isFiniteNumber(raw.duration) ? raw.duration : 1,
    status: TASK_STATUSES.includes(raw.status as TaskStatus) ? (raw.status as TaskStatus) : 'planned',
    isCritical: raw.isCritical === true,
  };
}

function isMilestone(raw: unknown): raw is Milestone {
  return isRecord(raw) && typeof raw.id === 'string' && typeof raw.name === 'string' && typeof raw.date === 'string';
}

/**
 * A project's saved state, checked and with defaults for missing fields, or null when its tasks
 * or milestones are unusable. Valid saved state comes back equal to what was stored.
 */
export function normalizeProjectState(raw: unknown): SerializableGanttState | null {
  if (!isRecord(raw) || !Array.isArray(raw.tasks)) return null;
  const tasks = raw.tasks.map(normalizeTask);
  if (tasks.some(t => t === null)) return null;
  if (raw.milestones !== undefined && !(Array.isArray(raw.milestones) && raw.milestones.every(isMilestone))) {
    return null;
  }
  const valid = tasks as Task[];
  const milestones = (raw.milestones as Milestone[] | undefined) ?? [];
  const hasTimeline = isFiniteNumber(raw.timelineStartDay) && isFiniteNumber(raw.timelineEndDay);
  const bounds = hasTimeline ? null : computeTimelineBounds(computeSchedule(valid), milestones);
  return {
    ...(raw as unknown as SerializableGanttState),
    tasks: valid,
    milestones,
    currentFilter: typeof raw.currentFilter === 'string' ? raw.currentFilter : 'ALL',
    zoomScale: isFiniteNumber(raw.zoomScale) && raw.zoomScale > 0 ? raw.zoomScale : 1,
    collapsedPhases: isStringArray(raw.collapsedPhases) ? raw.collapsedPhases : [],
    collapsedSubPhases: isStringArray(raw.collapsedSubPhases) ? raw.collapsedSubPhases : [],
    timelineStartDay: bounds ? bounds.startDay : (raw.timelineStartDay as number),
    timelineEndDay: bounds ? bounds.endDay : (raw.timelineEndDay as number),
  };
}

function looksLikeProjectFile(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && value.version === PROJECT_VERSION && typeof value.id === 'string' &&
    typeof value.name === 'string' && isRecord(value.state);
}

/** A checked project, or null when it is not a usable project file. */
function toProjectFile(value: unknown): ProjectFile | null {
  if (!looksLikeProjectFile(value)) return null;
  const state = normalizeProjectState(value.state);
  return state ? { ...(value as unknown as ProjectFile), state } : null;
}

function looksLikeAppStorage(value: unknown): value is Record<string, unknown> & { projects: unknown[] } {
  return isRecord(value) && value.version === APP_VERSION && Array.isArray(value.projects) &&
    typeof value.activeProjectId === 'string' && isRecord(value.preferences);
}

/** Checked storage with only usable projects, or null when none is usable. */
function toAppStorage(value: unknown): AppStorage | null {
  if (!looksLikeAppStorage(value)) return null;
  const projects = value.projects.map(toProjectFile).filter((p): p is ProjectFile => p !== null);
  if (projects.length === 0) return null;
  const storage = value as unknown as AppStorage;
  const activeProjectId = projects.some(p => p.id === storage.activeProjectId)
    ? storage.activeProjectId
    : projects[0].id;
  return { ...storage, projects, activeProjectId };
}

export function loadAppStorage(): AppStorage {
  if (typeof window === 'undefined') return buildInitialAppStorage();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialAppStorage();
    return toAppStorage(JSON.parse(raw)) ?? buildInitialAppStorage();
  } catch {
    return buildInitialAppStorage();
  }
}

/** Write everything to localStorage. Returns false when the browser refuses (quota, privacy mode). */
export function saveAppStorage(storage: AppStorage): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    return true;
  } catch (err) {
    console.error('Failed to save app storage', err);
    return false;
  }
}

export function findActiveProject(storage: AppStorage): ProjectFile {
  return (
    storage.projects.find(p => p.id === storage.activeProjectId) ||
    storage.projects[0]
  );
}

export type ImportedPayload =
  | { kind: 'project'; project: ProjectFile }
  | { kind: 'app'; storage: AppStorage };

/** Read a downloaded project file or full backup. Throws ImportError and never half-imports. */
export function parseImport(jsonText: string): ImportedPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new ImportError('not-json');
  }

  if (looksLikeAppStorage(parsed)) {
    if (parsed.projects.length === 0) throw new ImportError('no-projects');
    parsed.projects.forEach(p => {
      if (!toProjectFile(p)) throw new ImportError('invalid-project', projectLabel(p));
    });
    return { kind: 'app', storage: toAppStorage(parsed)! };
  }
  if (looksLikeProjectFile(parsed)) {
    const project = toProjectFile(parsed);
    if (!project) throw new ImportError('invalid-project', projectLabel(parsed));
    return { kind: 'project', project };
  }
  throw new ImportError('unknown-format');
}

function projectLabel(value: unknown): string {
  return isRecord(value) && typeof value.name === 'string' ? value.name : '?';
}

export function downloadProjectFile(project: ProjectFile): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${safeFileName(project.name, 'project')}.gantt.json`);
}

export function downloadAppStorage(storage: AppStorage): void {
  const blob = new Blob([JSON.stringify(storage, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `gantt-backup-${todayISO()}.json`);
}

export { makeId, now };
