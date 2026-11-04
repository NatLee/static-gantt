import { describe, expect, it } from 'vitest';
import { parseMermaid } from './mermaidParser';
import { generateMermaid } from './mermaidGenerator';
import { formatMermaid } from './mermaidFormat';
import { applyMermaid } from './mermaidSync';
import { defaultMilestones, defaultTasks } from '@/data/defaultProject';
import type { Milestone, Task } from '@/types';
import { task } from '@/test/helpers';

/** Visual → Mermaid text → visual, the way the mode switch does it. */
const roundTrip = (tasks: Task[], milestones: Milestone[] = []) =>
  applyMermaid({ tasks, milestones }, parseMermaid(generateMermaid({ title: 'T', tasks, milestones })));

describe('parseMermaid', () => {
  it('reads sections, ids, start dates, dependencies, durations and flags', () => {
    const { tasks } = parseMermaid([
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
    const { tasks } = parseMermaid([
      'gantt',
      '    axisFormat %m/%d',
      '    Orphan :o1, 2026-03-01, 1d',
      '    section S',
      '    Kept :k1, 2026-03-01, 1d',
    ].join('\n'));
    expect(tasks.map(t => t.id)).toEqual(['k1']);
  });

  it('reads every predecessor of "after a b"', () => {
    const { tasks } = parseMermaid('gantt\n  section S\n  A :a, 2026-03-01, 1d\n  B :b, 2026-03-01, 2d\n  C :c, after a b, 1d');
    expect(tasks[2].after).toBe('a,b');
  });

  it('skips comment lines, even when they contain a colon', () => {
    const { tasks } = parseMermaid('gantt\n  section S\n  %% note: x, y, z\n  A :a, 2026-03-01, 1d');
    expect(tasks.map(t => t.id)).toEqual(['a']);
  });

  it('turns dated milestone lines into milestones, wherever they are', () => {
    const parsed = parseMermaid('gantt\n  Kickoff :milestone, m1, 2026-03-02, 0d\n  section S\n  A :a, 2026-03-01, 1d\n  Review :milestone, m2, 2026-03-09, 0d');
    expect(parsed.milestones).toEqual([
      { id: 'm1', name: 'Kickoff', date: '2026-03-02' },
      { id: 'm2', name: 'Review', date: '2026-03-09' },
    ]);
    expect(parsed.tasks.map(t => t.id)).toEqual(['a']);
  });

  it('lets done win over active, like before', () => {
    const { tasks } = parseMermaid('gantt\n  section S\n  A :active, done, a, 2026-03-01, 1d');
    expect(tasks[0].status).toBe('done');
  });

  it('accepts "id, duration" and skips a line without a duration', () => {
    const { tasks } = parseMermaid('gantt\n  section S\n  A :a, 3d\n  B :b, 2026-03-01');
    expect(tasks).toEqual([{ id: 'a', phase: 'S', name: 'A', duration: 3, isCritical: false, status: 'planned' }]);
  });
});

describe('generateMermaid', () => {
  it('writes the title, one section per phase run and the flags', () => {
    const code = generateMermaid({
      title: 'Website relaunch',
      tasks: [
        task('a', { phase: 'Phase 1 Plan', name: 'Kickoff', start: '2026-03-02', duration: 2, isCritical: true, status: 'done' }),
        task('b', { phase: 'Phase 1 Plan', name: 'Scope', after: 'a', duration: 3, status: 'in-progress' }),
      ],
    });
    expect(code).toContain('title Website relaunch');
    expect(code).toContain('section Phase 1 Plan');
    expect(code).toMatch(/Kickoff\s+:crit, done, a, 2026-03-02, 2d/);
    expect(code).toMatch(/Scope\s+:active, b, after a, 3d/);
  });

  it('writes every predecessor, space-separated as Mermaid expects', () => {
    const code = generateMermaid({ title: 'T', tasks: [task('c', { after: 'a,b', duration: 1 })] });
    expect(code).toMatch(/:c, after a b, 1d/);
  });

  it('writes milestones in their own section', () => {
    const code = generateMermaid({ title: 'T', tasks: [], milestones: defaultMilestones });
    expect(code).toContain('section Milestones');
    expect(code).toMatch(/Design Complete\s+:milestone, ms1, 2026-04-12, 0d/);
  });
});

describe('visual → Mermaid → visual', () => {
  // Before: the second predecessor of every multi-dependency task was dropped (p4a in the sample
  // waits for p3b and p3c), milestones disappeared from the text, and progress, colours,
  // assignees, tags and descriptions were wiped by a single trip through Mermaid mode.
  it('keeps the sample project exactly as it was', () => {
    expect(roundTrip(defaultTasks, defaultMilestones)).toEqual({ tasks: defaultTasks, milestones: defaultMilestones });
  });

  it('keeps fields Mermaid has no syntax for', () => {
    const tasks = [
      task('a', { phase: 'Phase 1 Plan', start: '2026-03-02', duration: 2, progress: 40, color: '#0ea5e9', tags: ['ux'], assignee: 'Amy', description: 'Notes' }),
      task('b', { phase: 'Phase 1 Plan', after: 'a', duration: 1 }),
    ];
    expect(roundTrip(tasks).tasks).toEqual(tasks);
  });

  it('gives milestones added in the text a palette colour', () => {
    const parsed = parseMermaid('gantt\n  section S\n  A :a, 2026-03-01, 1d\n  New :milestone, m9, 2026-03-03, 0d');
    const { milestones } = applyMermaid({ tasks: [], milestones: [] }, parsed);
    expect(milestones[0]).toMatchObject({ id: 'm9', name: 'New', date: '2026-03-03' });
    expect(milestones[0].colorClass).toBeTruthy();
    expect(milestones[0].lineClass).toBeTruthy();
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

  it('does not touch header statements or comments that contain a colon', () => {
    const src = 'gantt\n    accTitle: Plan\n    %% a: b\n    section A\n    Task:a1, 2026-03-01, 1d';
    const out = formatMermaid(src).split('\n');
    expect(out[1]).toBe('    accTitle: Plan');
    expect(out[2]).toBe('    %% a: b');
  });
});
