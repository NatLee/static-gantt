import { ROW_HEIGHT } from './ganttLayout';

/** Length of the straight stub that leaves the predecessor and enters the successor. */
const STUB = 10;

/**
 * SVG path of a dependency arrow from the end of a predecessor bar (sx, sy) to the start of its
 * successor (ex, ey), using right angles only.
 *
 * With room between the bars the line turns down half-way. When the successor starts at (or
 * before) the predecessor's end, which is the normal finish-to-start case, the line steps out,
 * runs along the row boundary above the successor and comes back in from the left. The old
 * curve for that case swung out 30 px or more on both sides and looped across neighbouring bars.
 */
export function buildDepPath(sx: number, sy: number, ex: number, ey: number): string {
  if (ex - sx > 2 * STUB || sy === ey) {
    const mx = sx + (ex - sx) / 2;
    return `M ${sx} ${sy} L ${mx} ${sy} L ${mx} ${ey} L ${ex} ${ey}`;
  }
  const laneY = ey > sy ? ey - ROW_HEIGHT / 2 : ey + ROW_HEIGHT / 2;
  return `M ${sx} ${sy} L ${sx + STUB} ${sy} L ${sx + STUB} ${laneY} L ${ex - STUB} ${laneY} L ${ex - STUB} ${ey} L ${ex} ${ey}`;
}

export function buildArrowHead(ex: number, ey: number, size = 5): string[] {
  return [
    `M ${ex} ${ey} L ${ex - size} ${ey - size}`,
    `M ${ex} ${ey} L ${ex - size} ${ey + size}`,
  ];
}
