export function buildDepPath(sx: number, sy: number, ex: number, ey: number): string {
  const gap = ex - sx;
  if (gap > 20) {
    const mx = sx + gap / 2;
    return `M ${sx} ${sy} L ${mx} ${sy} L ${mx} ${ey} L ${ex} ${ey}`;
  }
  const cpOffset = Math.max(30, Math.abs(ey - sy) * 0.4);
  return `M ${sx} ${sy} C ${sx + cpOffset} ${sy}, ${ex - cpOffset} ${ey}, ${ex} ${ey}`;
}

export function buildArrowHead(ex: number, ey: number, size = 5): string[] {
  return [
    `M ${ex} ${ey} L ${ex - size} ${ey - size}`,
    `M ${ex} ${ey} L ${ex - size} ${ey + size}`,
  ];
}
