import { describe, expect, it } from 'vitest';
import { OTHER_PHASE, joinPhase, masterOf, splitPhase, subPhaseKey } from './phase';

describe('phase names', () => {
  it('splits "Phase N Sub" into master and sub-phase', () => {
    expect(splitPhase('Phase 12 Planning & Research')).toEqual({ master: 'Phase 12', sub: 'Planning & Research' });
  });

  it('puts names without the prefix under the catch-all master phase', () => {
    expect(splitPhase('Marketing')).toEqual({ master: OTHER_PHASE, sub: 'Marketing' });
    expect(splitPhase('Phase 3')).toEqual({ master: OTHER_PHASE, sub: 'Phase 3' });
    expect(splitPhase('')).toEqual({ master: OTHER_PHASE, sub: OTHER_PHASE });
  });

  it('joins back to the original string in both cases', () => {
    for (const phase of ['Phase 1 Discovery', 'Marketing', 'Phase 3', 'Other Stuff']) {
      const { master, sub } = splitPhase(phase);
      expect(joinPhase(master, sub)).toBe(phase);
    }
  });

  it('exposes the master phase and the collapse key', () => {
    expect(masterOf('Phase 2 UX')).toBe('Phase 2');
    expect(masterOf('Marketing')).toBe(OTHER_PHASE);
    expect(subPhaseKey('Phase 2', 'UX')).toBe('Phase 2::UX');
  });
});
