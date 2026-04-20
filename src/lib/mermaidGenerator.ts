import { Task } from '@/types';

const STATUS_MAP = {
  'done': 'done',
  'in-progress': 'active',
  'planned': '',
} as const;

export function generateMermaidFromData(tasks: Task[]): string {
  let s = 'gantt\n    title SaaS Platform Launch Plan\n    dateFormat YYYY-MM-DD\n    axisFormat %m/%d\n    weekday monday\n\n';
  let lastPhase = '';

  tasks.forEach(t => {
    if (t.phase !== lastPhase) {
      s += `    section ${t.phase}\n`;
      lastPhase = t.phase;
    }
    const nm = t.name.padEnd(40, ' ');
    let flags = '';
    if (t.isCritical) flags += 'crit, ';
    const statusFlag = STATUS_MAP[t.status];
    if (statusFlag) flags += statusFlag + ', ';

    if (t.start) {
      s += `    ${nm}:${flags}${t.id}, ${t.start}, ${t.duration}d\n`;
    } else if (t.after) {
      // Mermaid gantt only supports single dependency; use last predecessor
      const predecessors = t.after.split(',').map(s => s.trim());
      const primaryDep = predecessors[predecessors.length - 1];
      s += `    ${nm}:${flags}${t.id}, after ${primaryDep}, ${t.duration}d\n`;
    }
  });

  return s;
}
