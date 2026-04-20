export type TaskStatus = 'done' | 'in-progress' | 'planned';

export interface Task {
  id: string;
  phase: string;
  name: string;
  duration: number;
  status: TaskStatus;
  isCritical: boolean;
  start?: string;
  after?: string;
  progress?: number; // 0-100
  color?: string; // hex like '#ef4444' or a palette key
  tags?: string[];
  assignee?: string;
  description?: string;
}

export interface ComputedTask extends Task {
  startDayOffset: number;
  endDayOffset: number;
  rowIndex?: number;
}

export interface Milestone {
  id: string;
  name: string;
  date: string;
  colorClass: string;
  lineClass: string;
}

export type HierarchyMap = Record<string, Record<string, ComputedTask[]>>;

export type DialogType =
  | 'add-phase'
  | 'add-sub-phase'
  | 'add-task'
  | 'edit-phase'
  | 'edit-sub-phase'
  | 'add-milestone'
  | 'edit-milestone'
  | 'add-before-task'
  | 'add-after-task';

export interface DialogState {
  type: DialogType;
  context: Record<string, string>;
}

export interface GanttState {
  tasks: Task[];
  milestones: Milestone[];
  currentFilter: string;
  currentMode: 'visual' | 'mermaid';
  isDark: boolean;
  zoomScale: number;
  collapsedPhases: Set<string>;
  collapsedSubPhases: Set<string>;
  editingTaskId: string | null;
  highlightedTaskId: string | null;
  activeDialog: DialogState | null;
  timelineStartDay: number;
  timelineEndDay: number;
  legendVisible: boolean;
}

export interface SerializableGanttState {
  tasks: Task[];
  milestones: Milestone[];
  currentFilter: string;
  zoomScale: number;
  collapsedPhases: string[];
  collapsedSubPhases: string[];
  timelineStartDay: number;
  timelineEndDay: number;
}

export interface ProjectFile {
  version: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  state: SerializableGanttState;
}

export interface AppStorage {
  version: 1;
  projects: ProjectFile[];
  activeProjectId: string;
  preferences: {
    isDark: boolean;
    currentMode: 'visual' | 'mermaid';
  };
}

export type GanttAction =
  | { type: 'SET_FILTER'; filter: string }
  | { type: 'SET_MODE'; mode: 'visual' | 'mermaid' }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_ZOOM'; scale: number }
  | { type: 'TOGGLE_PHASE_COLLAPSE'; phase: string }
  | { type: 'TOGGLE_SUB_PHASE_COLLAPSE'; key: string }
  | { type: 'OPEN_TASK_EDITOR'; taskId: string }
  | { type: 'CLOSE_TASK_EDITOR' }
  | { type: 'UPDATE_TASK'; taskId: string; updates: Partial<Task> }
  | { type: 'DELETE_TASK'; taskId: string }
  | { type: 'ADD_TASK'; task: Task; afterIndex?: number }
  | { type: 'ADD_MILESTONE'; milestone: Milestone }
  | { type: 'UPDATE_MILESTONE'; milestoneId: string; updates: Partial<Milestone> }
  | { type: 'DELETE_MILESTONE'; milestoneId: string }
  | { type: 'RENAME_PHASE'; oldName: string; newName: string }
  | { type: 'DELETE_PHASE'; phase: string }
  | { type: 'RENAME_SUB_PHASE'; masterPhase: string; oldSub: string; newSub: string }
  | { type: 'DELETE_SUB_PHASE'; masterPhase: string; subPhase: string }
  | { type: 'REPLACE_ALL_TASKS'; tasks: Task[] }
  | { type: 'EXTEND_TIMELINE'; direction: 'left' | 'right'; days: number }
  | { type: 'OPEN_DIALOG'; dialog: DialogState }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'MOVE_TASK'; taskId: string; newStartDate: string }
  | { type: 'RESIZE_TASK'; taskId: string; newDuration: number }
  | { type: 'ADD_BEFORE_TASK'; targetTaskId: string; task: Task }
  | { type: 'ADD_AFTER_TASK'; targetTaskId: string; task: Task }
  | { type: 'REORDER_PHASES'; orderedPhases: string[] }
  | { type: 'REORDER_SUB_PHASES'; masterPhase: string; orderedSubPhases: string[] }
  | { type: 'MOVE_REORDER_TASK'; taskId: string; targetPhase: string; insertBeforeTaskId?: string }
  | { type: 'MOVE_SUB_PHASE'; subPhase: string; sourceMasterPhase: string; targetMasterPhase: string; insertBeforeSubPhase?: string }
  | { type: 'MOVE_TASK_WITH_REORDER'; taskId: string; newStartDate: string; targetPhase: string; insertBeforeTaskId?: string }
  | { type: 'ADD_TASK_DEPENDENCY'; taskId: string; predecessorId: string }
  | { type: 'SET_HIGHLIGHTED_TASK'; taskId: string | null }
  | { type: 'DUPLICATE_TASK'; taskId: string; newId: string }
  | { type: 'LOAD_PROJECT_STATE'; state: SerializableGanttState }
  | { type: 'COLLAPSE_ALL_PHASES' }
  | { type: 'EXPAND_ALL_PHASES' }
  | { type: 'TOGGLE_LEGEND_VISIBLE' };
