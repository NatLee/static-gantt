import { describe, expect, it } from 'vitest';
import { buildDepPath } from './depPath';
import { ROW_HEIGHT } from './ganttLayout';

/** The points of an "M x y L x y …" path. */
const points = (d: string) => d.replace(/[ML]/g, ' ').trim().split(/\s+/).map(Number)
  .reduce<number[][]>((acc, n, i) => (i % 2 ? acc[acc.length - 1].push(n) : acc.push([n]), acc), []);

describe('buildDepPath', () => {
  it('turns down half-way when there is room between the bars', () => {
    expect(buildDepPath(100, 24, 200, 120)).toBe('M 100 24 L 150 24 L 150 120 L 200 120');
  });

  // Finish-to-start with no gap is the common case. The old bezier swung out 30 px on both sides
  // and looped across neighbouring bars; now every segment is horizontal or vertical and the
  // line crosses over on the row boundary just above the successor.
  it('routes a no-gap dependency along the row boundary with right angles only', () => {
    const d = buildDepPath(100, 24, 100, 24 + 3 * ROW_HEIGHT);
    expect(d).not.toContain('C');
    const pts = points(d);
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      expect(x0 === x1 || y0 === y1).toBe(true);
    }
    expect(pts[pts.length - 1]).toEqual([100, 24 + 3 * ROW_HEIGHT]);
    expect(pts[2][1]).toBe(24 + 3 * ROW_HEIGHT - ROW_HEIGHT / 2);
  });

  it('comes into the successor from the left, so the arrow head points right', () => {
    const pts = points(buildDepPath(300, 200, 250, 24));
    const [xa, ya] = pts[pts.length - 2];
    const [xb, yb] = pts[pts.length - 1];
    expect(ya).toBe(yb);
    expect(xa).toBeLessThan(xb);
  });
});
