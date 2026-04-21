import { buildDepPath, buildArrowHead } from './depPath';

export function updateDepsForTask(
  svgRoot: SVGSVGElement | null,
  taskId: string,
  dx: number,
  dy: number,
  widthDelta: number,
): void {
  if (!svgRoot) return;
  const groups = svgRoot.querySelectorAll<SVGGElement>(
    `g[data-dep-pred="${taskId}"], g[data-dep-succ="${taskId}"]`,
  );
  groups.forEach((g) => {
    const isPred = g.getAttribute('data-dep-pred') === taskId;
    const isSucc = g.getAttribute('data-dep-succ') === taskId;
    const sx0 = parseFloat(g.getAttribute('data-sx') ?? '0');
    const sy0 = parseFloat(g.getAttribute('data-sy') ?? '0');
    const ex0 = parseFloat(g.getAttribute('data-ex') ?? '0');
    const ey0 = parseFloat(g.getAttribute('data-ey') ?? '0');

    let sx = sx0;
    let sy = sy0;
    let ex = ex0;
    let ey = ey0;

    if (isPred) {
      sx = sx0 + dx + widthDelta;
      sy = sy0 + dy;
    }
    if (isSucc) {
      ex = ex0 + dx;
      ey = ey0 + dy;
    }

    const d = buildDepPath(sx, sy, ex, ey);
    const [a0, a1] = buildArrowHead(ex, ey);

    const line = g.querySelector<SVGPathElement>('path[data-role="line"]');
    const arr0 = g.querySelector<SVGPathElement>('path[data-role="arrow-0"]');
    const arr1 = g.querySelector<SVGPathElement>('path[data-role="arrow-1"]');
    const hit = g.querySelector<SVGPathElement>('path[data-role="hit"]');

    if (line) line.setAttribute('d', d);
    if (hit) hit.setAttribute('d', d);
    if (arr0) arr0.setAttribute('d', a0);
    if (arr1) arr1.setAttribute('d', a1);
  });
}
