import { Task, Milestone } from '@/types';

export const PROJECT_TITLE = 'SaaS Platform Launch Plan';
export const PROJECT_SUBTITLE = 'Strategic Product Roadmap (2026)';

export const defaultTasks: Task[] = [
  // Phase 1: Discovery & Planning (March)
  { id: 'p1a', phase: 'Phase 1 Discovery', name: 'Market & competitor research', start: '2026-03-01', duration: 7, isCritical: true, status: 'done' },
  { id: 'p1b', phase: 'Phase 1 Discovery', name: 'Product requirements (PRD)', after: 'p1a', duration: 5, isCritical: true, status: 'done' },
  { id: 'p1c', phase: 'Phase 1 Planning', name: 'Technical architecture design', after: 'p1b', duration: 5, isCritical: true, status: 'done' },
  { id: 'p1d', phase: 'Phase 1 Planning', name: 'Resource & timeline planning', after: 'p1b', duration: 3, isCritical: false, status: 'done' },

  // Phase 2: Design (March-April)
  { id: 'p2a', phase: 'Phase 2 UX', name: 'User flows & wireframes', after: 'p1b', duration: 8, isCritical: true, status: 'in-progress' },
  { id: 'p2b', phase: 'Phase 2 UX', name: 'Interactive prototype', after: 'p2a', duration: 6, isCritical: true, status: 'in-progress' },
  { id: 'p2c', phase: 'Phase 2 UI', name: 'Design system & components', after: 'p2b', duration: 7, isCritical: true, status: 'planned' },
  { id: 'p2d', phase: 'Phase 2 UI', name: 'Usability testing & iteration', after: 'p2c', duration: 5, isCritical: false, status: 'planned' },

  // Phase 3: Development (April-May)
  { id: 'p3a', phase: 'Phase 3 Backend', name: 'Database schema & API design', after: 'p1c', duration: 7, isCritical: true, status: 'planned' },
  { id: 'p3b', phase: 'Phase 3 Backend', name: 'Auth & core business services', after: 'p3a', duration: 12, isCritical: true, status: 'planned' },
  { id: 'p3c', phase: 'Phase 3 Frontend', name: 'App shell & dashboard', after: 'p2c', duration: 12, isCritical: true, status: 'planned' },
  { id: 'p3d', phase: 'Phase 3 Frontend', name: 'Feature screens & settings', after: 'p3c', duration: 8, isCritical: false, status: 'planned' },

  // Phase 4: Testing & QA (May-June)
  { id: 'p4a', phase: 'Phase 4 Integration', name: 'Frontend-backend integration', after: 'p3b,p3c', duration: 8, isCritical: true, status: 'planned' },
  { id: 'p4b', phase: 'Phase 4 QA', name: 'Automated test suites', after: 'p4a', duration: 8, isCritical: false, status: 'planned' },
  { id: 'p4c', phase: 'Phase 4 QA', name: 'E2E & performance testing', after: 'p4b', duration: 6, isCritical: true, status: 'planned' },

  // Phase 5: Launch (June)
  { id: 'p5a', phase: 'Phase 5 Beta', name: 'Closed beta & feedback', after: 'p4c', duration: 10, isCritical: true, status: 'planned' },
  { id: 'p5b', phase: 'Phase 5 Release', name: 'Security audit & hardening', after: 'p5a', duration: 6, isCritical: true, status: 'planned' },
  { id: 'p5c', phase: 'Phase 5 Release', name: 'Production launch & go-live', after: 'p5b', duration: 3, isCritical: true, status: 'planned' },
];

export const defaultMilestones: Milestone[] = [
  { id: 'ms1', name: 'Design Complete', date: '2026-04-12', colorClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', lineClass: 'bg-indigo-500' },
  { id: 'ms2', name: 'Beta Launch', date: '2026-05-18', colorClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40', lineClass: 'bg-amber-500' },
  { id: 'ms3', name: 'Production Launch', date: '2026-06-01', colorClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40', lineClass: 'bg-rose-500' },
];

export const MS_COLORS = [
  { colorClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', lineClass: 'bg-indigo-500' },
  { colorClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40', lineClass: 'bg-amber-500' },
  { colorClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40', lineClass: 'bg-rose-500' },
  { colorClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', lineClass: 'bg-cyan-500' },
  { colorClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', lineClass: 'bg-emerald-500' },
  { colorClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40', lineClass: 'bg-purple-500' },
];
