import { ComputedTask } from '@/types';
import { PROJECT_START_DATE } from '@/data/defaultProject';
import { formatISO } from './dateUtils';

const MS_PER_DAY = 86400000;

export async function exportToExcel(tasks: ComputedTask[], filter: string) {
  const mod = await import('xlsx');
  const XLSX = (mod as unknown as { default?: typeof mod }).default ?? mod;
  const data: Record<string, string | number | boolean>[] = [];

  tasks.forEach(t => {
    const m = t.phase.match(/^(Phase \d+)/);
    const mp = m ? m[1].trim() : 'Other';
    if (filter !== 'ALL' && mp !== filter) return;

    const sd = new Date(PROJECT_START_DATE.getTime() + t.startDayOffset * MS_PER_DAY);
    const ed = new Date(PROJECT_START_DATE.getTime() + t.endDayOffset * MS_PER_DAY);
    const st = t.status === 'done' ? 'Done' : t.status === 'in-progress' ? 'In Progress' : 'Planned';

    data.push({
      'Phase': t.phase,
      'Task ID': t.id,
      'Task Name': t.name,
      'Status': st,
      'Progress (%)': typeof t.progress === 'number' ? t.progress : 0,
      'Duration (days)': t.duration,
      'Start Date': formatISO(sd),
      'End Date': formatISO(ed),
      'Critical Path': t.isCritical ? 'Yes' : 'No',
      'Predecessor': t.after || 'None',
      'Assignee': t.assignee || '',
      'Tags': (t.tags || []).join(', '),
      'Color': t.color || '',
      'Description': t.description || '',
    });
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Roadmap');
  XLSX.writeFile(wb, `SaaS_Roadmap_${filter}.xlsx`);
}
