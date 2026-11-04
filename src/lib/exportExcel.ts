import { ComputedTask } from '@/types';
import { offsetToISO } from './dateUtils';
import { masterOf } from './phase';

export type ExcelRow = Record<string, string | number>;

const STATUS_LABELS: Record<ComputedTask['status'], string> = {
  done: 'Done',
  'in-progress': 'In Progress',
  planned: 'Planned',
};

/** A task that could not be scheduled (missing predecessor, cycle) has no dates. */
const dayOrBlank = (offset: number) => (Number.isFinite(offset) ? offsetToISO(offset) : '');

/** One spreadsheet row per task in the current phase filter ("ALL" or a master phase). */
export function buildExcelRows(tasks: ComputedTask[], filter: string): ExcelRow[] {
  return tasks
    .filter(t => filter === 'ALL' || masterOf(t.phase) === filter)
    .map(t => ({
      'Phase': t.phase,
      'Task ID': t.id,
      'Task Name': t.name,
      'Status': STATUS_LABELS[t.status] ?? t.status,
      'Progress (%)': typeof t.progress === 'number' ? t.progress : 0,
      'Duration (days)': t.duration,
      'Start Date': dayOrBlank(t.startDayOffset),
      'End Date': dayOrBlank(t.endDayOffset),
      'Critical Path': t.isOnCriticalPath || t.isCritical ? 'Yes' : 'No',
      'Slack (days)': Number.isFinite(t.totalFloat) ? t.totalFloat : '',
      'Predecessor': t.after || 'None',
      'Assignee': t.assignee || '',
      'Tags': (t.tags || []).join(', '),
      'Color': t.color || '',
      'Description': t.description || '',
    }));
}

export async function exportToExcel(tasks: ComputedTask[], filter: string) {
  const mod = await import('xlsx');
  const XLSX = (mod as unknown as { default?: typeof mod }).default ?? mod;
  const ws = XLSX.utils.json_to_sheet(buildExcelRows(tasks, filter));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Roadmap');
  XLSX.writeFile(wb, `SaaS_Roadmap_${filter}.xlsx`);
}
