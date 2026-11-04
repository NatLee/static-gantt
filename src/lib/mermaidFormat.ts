import { isHeaderOrComment, sectionName } from './mermaidSyntax';

// Align colons in task lines for readability.
// Example: "    Task one:crit, t1, 2026-01-01, 5d"
// becomes: "    Task one        :crit, t1, 2026-01-01, 5d"
export function formatMermaid(code: string): string {
  const lines = code.split('\n');
  const sectionGroups: number[][] = [];
  let currentGroup: number[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed === '' || sectionName(trimmed) !== null || isHeaderOrComment(trimmed) || !trimmed.includes(':')) {
      if (currentGroup.length > 0) {
        sectionGroups.push(currentGroup);
        currentGroup = [];
      }
      return;
    }
    currentGroup.push(i);
  });
  if (currentGroup.length > 0) sectionGroups.push(currentGroup);

  for (const group of sectionGroups) {
    let maxNameLen = 0;
    const parsed: Array<{ idx: number; indent: string; name: string; rest: string }> = [];
    for (const idx of group) {
      const line = lines[idx];
      const match = line.match(/^(\s*)(.*?)\s*:(.*)$/);
      if (!match) continue;
      const [, indent, rawName, rest] = match;
      const name = rawName.trimEnd();
      parsed.push({ idx, indent, name, rest });
      if (name.length > maxNameLen) maxNameLen = name.length;
    }
    const pad = Math.max(maxNameLen + 2, 20);
    for (const p of parsed) {
      lines[p.idx] = `${p.indent}${p.name.padEnd(pad, ' ')}:${p.rest.trim()}`;
    }
  }

  return lines.join('\n');
}
