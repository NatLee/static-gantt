/**
 * A task's `phase` is one string that encodes two levels: "Phase 3 Backend" means master phase
 * "Phase 3", sub-phase "Backend". Anything without the "Phase <n>" prefix (for example a Mermaid
 * section called "Marketing") is shown as a sub-phase of the catch-all master phase "Other".
 *
 * Every place that reads or builds a phase string goes through these helpers, so the two
 * directions always agree: joinPhase(splitPhase(p).master, splitPhase(p).sub) === p.
 */

/** Master phase that collects every phase name without a "Phase <n>" prefix. */
export const OTHER_PHASE = 'Other';

/** Sub-phase name used when a new master phase or task needs one and the user gave none. */
export const DEFAULT_SUB_PHASE = 'General';

const PHASE_RE = /^(Phase \d+)\s+(.*)$/;

export interface PhaseParts {
  master: string;
  sub: string;
}

export function splitPhase(phase: string | undefined | null): PhaseParts {
  // Defensive: a malformed task (bad import, missing phase) must not crash rendering.
  const value = phase || OTHER_PHASE;
  const m = value.match(PHASE_RE);
  if (m) return { master: m[1].trim(), sub: m[2].trim() };
  return { master: OTHER_PHASE, sub: value };
}

export function joinPhase(master: string, sub: string): string {
  return master === OTHER_PHASE ? sub : `${master} ${sub}`;
}

export function masterOf(phase: string | undefined | null): string {
  return splitPhase(phase).master;
}

/** Key used to remember a collapsed sub-phase. Stored in saved projects, so the format is fixed. */
export function subPhaseKey(master: string, sub: string): string {
  return `${master}::${sub}`;
}
