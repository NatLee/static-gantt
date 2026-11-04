import { describe, expect, it } from 'vitest';
import { parseMermaidToTasks } from './mermaidParser';
import { generateMermaidFromData } from './mermaidGenerator';
import { formatMermaid } from './mermaidFormat';
import { task } from '@/test/helpers';

describe('parseMermaidToTasks', () => {
  it('reads sections, ids, start dates, dependencies, durations and flags', () => {
    const tasks = parseMermaidToTasks([
      'gantt',
      '    title Launch',
      '    dateFormat YYYY-MM-DD',
      '    section Phase 1 Discovery',
      '    Research   :crit, done, r1, 2026-03-01, 7d',
      '    Write PRD  :active, r2, after r1, 2w',
      '    section Phase 2 Build',
      '    Code       :c1, after r2, 10d',
    ].join('\n'));

    expect(tasks).toEqual([
      { id: 'r1', phase: 'Phase 1 Discovery', name: 'Research', duration: 7, isCritical: true, status: 'done', start: '2026-03-01' },
      { id: 'r2', phase: 'Phase 1 Discovery', name: 'Write PRD', duration: 14, isCritical: false, status: 'in-progress', after: 'r1' },
      { id: 'c1', phase: 'Phase 2 Build', name: 'Code', duration: 10, isCritical: false, status: 'planned', after: 'r2' },
    ]);
  });

  it('ignores header lines and tasks outside a section', () => {
    const tasks = parseMermaidToTasks([
      'gantt',
      '    axisFormat %m/%d',
      '    Orphan :o1, 2026-03-01, 1d',
      '    section S',
      '    Kept :k1, 2026-03-01, 1d',
    ].join('\n'));
    expect(tasks.map(t => t.id)).toEqual(['k1']);
  });
});

describe('generateMermaidFromData', () => {
  it('writes one section per phase run and keeps flags', () => {
    const code = generateMermaidFromData([
      task('a', { phase: 'Phase 1 Plan', name: 'Kickoff', start: '2026-03-02', duration: 2, isCritical: true, status: 'done' }),
      task('b', { phase: 'Phase 1 Plan', name: 'Scope', after: 'a', duration: 3, status: 'in-progress' }),
    ]);
    expect(code).toContain('section Phase 1 Plan');
    expect(code).toMatch(/Kickoff\s+:crit, done, a, 2026-03-02, 2d/);
    expect(code).toMatch(/Scope\s+:active, b, after a, 3d/);
  });

  it('round-trips single-dependency tasks through the parser', () => {
    const tasks = [
      task('a', { phase: 'Phase 1 Plan', name: 'Kickoff', start: '2026-03-02', duration: 2, isCritical: true, status: 'done' }),
      task('b', { phase: 'Phase 1 Plan', name: 'Scope', after: 'a', duration: 3, status: 'in-progress' }),
      task('c', { phase: 'Phase 2 Do', name: 'Build', after: 'b', duration: 5 }),
    ];
    expect(parseMermaidToTasks(generateMermaidFromData(tasks))).toEqual(tasks);
  });
});

describe('formatMermaid', () => {
  it('aligns the colons of task lines within a section', () => {
    const out = formatMermaid([
      'gantt',
      '    section A',
      '    Short:a1, 2026-03-01, 1d',
      '    A much longer name:a2, after a1, 2d',
    ].join('\n'));
    const lines = out.split('\n');
    expect(lines[2].indexOf(':')).toBe(lines[3].indexOf(':'));
    expect(lines[0]).toBe('gantt');
    expect(lines[1]).toBe('    section A');
  });

  it('leaves already-formatted text unchanged', () => {
    const once = formatMermaid('gantt\n    section A\n    Task:a1, 2026-03-01, 1d\n');
    expect(formatMermaid(once)).toBe(once);
  });
});
