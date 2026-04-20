import { PROJECT_START_DATE } from '@/data/defaultProject';

const MS_PER_DAY = 86400000;

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

export function dateToOffset(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  return Math.round((d.getTime() - PROJECT_START_DATE.getTime()) / MS_PER_DAY);
}

export function offsetToDate(offset: number): Date {
  return new Date(PROJECT_START_DATE.getTime() + offset * MS_PER_DAY);
}

export function formatDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function formatDateFull(d: Date): string {
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
}

export function formatISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function genId(): string {
  return 't' + Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(-2);
}
