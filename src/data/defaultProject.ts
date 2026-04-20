import { Task, Milestone } from '@/types';

export const PROJECT_START_DATE = new Date('2026-03-01');
export const PROJECT_TITLE = 'SaaS Platform Launch Plan';
export const PROJECT_SUBTITLE = 'Strategic Product Roadmap (2026)';

export const defaultTasks: Task[] = [
  // Phase 1: Planning & Research (March)
  { id: 'p1a', phase: 'Phase 1 Planning & Research', name: 'Market analysis & competitor research', start: '2026-03-01', duration: 7, isCritical: true, status: 'done' },
  { id: 'p1b', phase: 'Phase 1 Planning & Research', name: 'Define product requirements (PRD)', after: 'p1a', duration: 5, isCritical: true, status: 'done' },
  { id: 'p1c', phase: 'Phase 1 Technical Planning', name: 'Technical architecture design', after: 'p1b', duration: 5, isCritical: false, status: 'done' },
  { id: 'p1d', phase: 'Phase 1 Technical Planning', name: 'Resource planning & team allocation', after: 'p1b', duration: 3, isCritical: false, status: 'done' },

  // Phase 2: UI/UX Design (March-April)
  { id: 'p2a', phase: 'Phase 2 User Research', name: 'User persona & journey mapping', after: 'p1b', duration: 5, isCritical: false, status: 'done' },
  { id: 'p2b', phase: 'Phase 2 User Research', name: 'Wireframes & interactive prototypes', after: 'p2a', duration: 10, isCritical: true, status: 'in-progress' },
  { id: 'p2c', phase: 'Phase 2 Design System', name: 'Component library & design tokens', after: 'p2b', duration: 7, isCritical: false, status: 'in-progress' },
  { id: 'p2d', phase: 'Phase 2 Design System', name: 'Usability testing & iteration', after: 'p2c', duration: 5, isCritical: false, status: 'planned' },

  // Phase 3: Backend Development (April-May)
  { id: 'p3a', phase: 'Phase 3 Backend Core', name: 'Database schema & API design', after: 'p1c', duration: 7, isCritical: true, status: 'planned' },
  { id: 'p3b', phase: 'Phase 3 Backend Core', name: 'Authentication & authorization (RBAC)', after: 'p3a', duration: 10, isCritical: true, status: 'planned' },
  { id: 'p3c', phase: 'Phase 3 Backend Services', name: 'Core business logic services', after: 'p3b', duration: 14, isCritical: true, status: 'planned' },
  { id: 'p3d', phase: 'Phase 3 Backend Services', name: 'Payment & subscription integration', after: 'p3c', duration: 10, isCritical: false, status: 'planned' },
  { id: 'p3e', phase: 'Phase 3 Backend Infrastructure', name: 'CI/CD pipeline setup', after: 'p3a', duration: 5, isCritical: false, status: 'planned' },

  // Phase 4: Frontend Development (May-June)
  { id: 'p4a', phase: 'Phase 4 Frontend Core', name: 'Project scaffolding & routing', after: 'p2c', duration: 5, isCritical: false, status: 'planned' },
  { id: 'p4b', phase: 'Phase 4 Frontend Core', name: 'Dashboard & analytics views', after: 'p4a', duration: 14, isCritical: true, status: 'planned' },
  { id: 'p4c', phase: 'Phase 4 Frontend Features', name: 'User management & settings', after: 'p4b', duration: 7, isCritical: false, status: 'planned' },
  { id: 'p4d', phase: 'Phase 4 Frontend Features', name: 'Real-time notifications (WebSocket)', after: 'p4b', duration: 7, isCritical: false, status: 'planned' },
  { id: 'p4e', phase: 'Phase 4 Frontend Polish', name: 'Responsive design & accessibility', after: 'p4c', duration: 5, isCritical: false, status: 'planned' },

  // Phase 5: Integration & Testing (June-July)
  { id: 'p5a', phase: 'Phase 5 Integration', name: 'Frontend-backend API integration', after: 'p3c,p4b', duration: 10, isCritical: true, status: 'planned' },
  { id: 'p5b', phase: 'Phase 5 Testing', name: 'Unit & integration test suites', after: 'p5a', duration: 10, isCritical: false, status: 'planned' },
  { id: 'p5c', phase: 'Phase 5 Testing', name: 'E2E testing (Playwright)', after: 'p5b', duration: 7, isCritical: true, status: 'planned' },
  { id: 'p5d', phase: 'Phase 5 Testing', name: 'Performance & load testing', after: 'p5b', duration: 5, isCritical: false, status: 'planned' },

  // Phase 6: Beta Launch (July-August)
  { id: 'p6a', phase: 'Phase 6 Beta Prep', name: 'Staging environment setup', after: 'p5c', duration: 5, isCritical: true, status: 'planned' },
  { id: 'p6b', phase: 'Phase 6 Beta Prep', name: 'Beta user onboarding flow', after: 'p6a', duration: 5, isCritical: false, status: 'planned' },
  { id: 'p6c', phase: 'Phase 6 Beta Operations', name: 'Closed beta with 50 users', after: 'p6b', duration: 14, isCritical: true, status: 'planned' },
  { id: 'p6d', phase: 'Phase 6 Beta Operations', name: 'Feedback collection & bug triage', after: 'p6c', duration: 7, isCritical: false, status: 'planned' },

  // Phase 7: Marketing & Growth (August-September)
  { id: 'p7a', phase: 'Phase 7 Marketing', name: 'Landing page & SEO optimization', after: 'p6a', duration: 10, isCritical: false, status: 'planned' },
  { id: 'p7b', phase: 'Phase 7 Marketing', name: 'Content marketing & blog launch', after: 'p7a', duration: 14, isCritical: false, status: 'planned' },
  { id: 'p7c', phase: 'Phase 7 Growth', name: 'Referral program & onboarding emails', after: 'p7b', duration: 7, isCritical: false, status: 'planned' },

  // Phase 8: Production Launch (September-October)
  { id: 'p8a', phase: 'Phase 8 Launch Prep', name: 'Security audit & penetration testing', after: 'p6d', duration: 10, isCritical: true, status: 'planned' },
  { id: 'p8b', phase: 'Phase 8 Launch Prep', name: 'Production infrastructure deployment', after: 'p8a', duration: 5, isCritical: true, status: 'planned' },
  { id: 'p8c', phase: 'Phase 8 Launch Execution', name: 'Data migration & go-live', after: 'p8b', duration: 3, isCritical: true, status: 'planned' },
  { id: 'p8d', phase: 'Phase 8 Launch Execution', name: 'Launch day monitoring & support', after: 'p8c', duration: 3, isCritical: false, status: 'planned' },

  // Phase 9: Post-Launch Optimization (October-November)
  { id: 'p9a', phase: 'Phase 9 Optimization', name: 'Analytics review & KPI tracking', after: 'p8d', duration: 7, isCritical: false, status: 'planned' },
  { id: 'p9b', phase: 'Phase 9 Optimization', name: 'Performance optimization & caching', after: 'p9a', duration: 10, isCritical: false, status: 'planned' },
  { id: 'p9c', phase: 'Phase 9 Iteration', name: 'V1.1 feature backlog prioritization', after: 'p9a', duration: 5, isCritical: false, status: 'planned' },
];

export const defaultMilestones: Milestone[] = [
  { id: 'ms1', name: 'Design Complete', date: '2026-04-30', colorClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', lineClass: 'bg-indigo-500' },
  { id: 'ms2', name: 'Beta Launch', date: '2026-07-15', colorClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40', lineClass: 'bg-amber-500' },
  { id: 'ms3', name: 'Production Launch', date: '2026-09-30', colorClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40', lineClass: 'bg-rose-500' },
  { id: 'ms4', name: 'V1.1 Release', date: '2026-11-30', colorClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', lineClass: 'bg-cyan-500' },
];

export const MS_COLORS = [
  { colorClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', lineClass: 'bg-indigo-500' },
  { colorClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40', lineClass: 'bg-amber-500' },
  { colorClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40', lineClass: 'bg-rose-500' },
  { colorClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', lineClass: 'bg-cyan-500' },
  { colorClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', lineClass: 'bg-emerald-500' },
  { colorClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40', lineClass: 'bg-purple-500' },
];
