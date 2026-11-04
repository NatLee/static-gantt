import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseMermaid } from './mermaidParser';
import { computeSchedule } from './scheduler';
import { offsetToISO } from './dateUtils';

// The README's Mermaid example is meant to be pasted into the app, so it is checked here.
const readme = readFileSync(fileURLToPath(new URL('../../README.md', import.meta.url)), 'utf8');
const ganttBlock = [...readme.matchAll(/```mermaid\n([\s\S]*?)```/g)]
  .map(m => m[1])
  .find(block => block.trimStart().startsWith('gantt'));

describe('README Mermaid example', () => {
  it('is there', () => {
    expect(ganttBlock).toBeDefined();
  });

  it('parses into the tasks and milestone the README describes', () => {
    const { tasks, milestones } = parseMermaid(ganttBlock!);
    expect(tasks.map(t => t.id)).toEqual(['d1', 'd2', 'b1', 'b2', 'b3']);
    expect(tasks.find(t => t.id === 'b3')!.after).toBe('b1,b2');
    expect(tasks.find(t => t.id === 'b1')!.duration).toBe(14);
    expect(milestones).toEqual([{ id: 'm1', name: 'Go live', date: '2026-04-06' }]);
  });

  it('schedules "after b1 b2" after the later of the two', () => {
    const b3 = computeSchedule(parseMermaid(ganttBlock!).tasks).find(t => t.id === 'b3')!;
    // d1 03-02 + 5d → d2 03-07 + 3d → b1 03-10 + 14d ends 03-24; b2 ends 03-16.
    expect(offsetToISO(b3.startDayOffset)).toBe('2026-03-24');
  });
});
