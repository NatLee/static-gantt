'use client';

import { Dispatch } from 'react';
import { FilePlus, ListPlus, Sparkles } from 'lucide-react';
import { GanttAction } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';

interface Props {
  dispatch: Dispatch<GanttAction>;
  onLoadDefault: () => void;
}

export default function EmptyState({ dispatch, onLoadDefault }: Props) {
  const { t } = useI18n();
  const openAddPhase = () =>
    dispatch({ type: 'OPEN_DIALOG', dialog: { type: 'add-phase', context: {} } });
  const openAddTask = () =>
    dispatch({ type: 'OPEN_DIALOG', dialog: { type: 'add-task', context: {} } });

  return (
    <div
      className="flex-1 flex items-center justify-center p-8"
      style={{ color: 'var(--text-primary)' }}
    >
      <div
        className="max-w-md text-center rounded-2xl p-8"
        style={{
          background: 'var(--bg-panel)',
          border: '1px dashed var(--border-color)',
        }}
      >
        <div
          className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
        >
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold mb-1">{t('empty.title')}</h2>
        <p
          className="text-xs mb-5 leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {t('empty.body')}
        </p>

        <div className="flex flex-col gap-2">
          <button
            className="btn-primary text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer flex items-center justify-center gap-2"
            onClick={openAddPhase}
            type="button"
          >
            <FilePlus className="w-3.5 h-3.5" />
            {t('empty.addPhase')}
          </button>
          <button
            className="btn-glass text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer flex items-center justify-center gap-2"
            onClick={openAddTask}
            type="button"
          >
            <ListPlus className="w-3.5 h-3.5" />
            {t('empty.addTask')}
          </button>
          <button
            className="text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
            onClick={onLoadDefault}
            type="button"
          >
            {t('empty.loadSample')}
          </button>
        </div>
      </div>
    </div>
  );
}
