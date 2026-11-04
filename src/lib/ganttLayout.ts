export const ROW_HEIGHT = 48;
export const HEADER_HEIGHT = 52;
export const SIDEBAR_DEFAULT_W = 360;
export const SIDEBAR_MIN_W = 260;
export const SIDEBAR_MAX_W = 560;
export const PIXELS_PER_DAY = 5;
export const VIRTUALIZE_THRESHOLD = 50;
export const VIRTUALIZE_BUFFER = 10;

export const Z = {
  grid: 0,
  deps: 10,
  bars: 20,
  barsHover: 30,
  stickyCol: 40,
  stickyHeader: 50,
  stickyCorner: 60,
  overlay: 100,
  panel: 200,
  dialog: 300,
} as const;

/** Zoom presets; zoom × PIXELS_PER_DAY = pixels per day (day 20, week 10, month 4). */
export const ZOOM_PRESETS = {
  day: 4,
  week: 2,
  month: 0.8,
} as const;
export type ZoomPreset = keyof typeof ZOOM_PRESETS;

export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 5;

/** Zoom of a new project: the week view, where a task of a few days is still a readable bar. */
export const DEFAULT_ZOOM = ZOOM_PRESETS.week;

/** Which preset button to highlight for a zoom level. */
export function zoomPresetFor(scale: number): ZoomPreset {
  return scale >= 3 ? 'day' : scale >= 1.6 ? 'week' : 'month';
}
