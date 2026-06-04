'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';

interface Props {
  onClose: () => void;
}

interface Row {
  keys: string[];
  labelKey: MessageKey;
}

interface Section {
  titleKey: MessageKey;
  rows: Row[];
}

const SECTIONS: Section[] = [
  {
    titleKey: 'shortcuts.general',
    rows: [
      { keys: ['?'], labelKey: 'shortcuts.showCheatsheet' },
      { keys: ['Esc'], labelKey: 'shortcuts.closeDialogs' },
    ],
  },
  {
    titleKey: 'shortcuts.history',
    rows: [
      { keys: ['⌘/Ctrl', 'Z'], labelKey: 'shortcuts.undo' },
      { keys: ['⌘/Ctrl', 'Shift', 'Z'], labelKey: 'shortcuts.redo' },
      { keys: ['⌘/Ctrl', 'Y'], labelKey: 'shortcuts.redoAlt' },
    ],
  },
  {
    titleKey: 'shortcuts.navigation',
    rows: [
      { keys: ['⌘/Ctrl', 'F'], labelKey: 'shortcuts.search' },
      { keys: ['T'], labelKey: 'shortcuts.today' },
      { keys: ['+'], labelKey: 'shortcuts.zoomIn' },
      { keys: ['-'], labelKey: 'shortcuts.zoomOut' },
    ],
  },
  {
    titleKey: 'shortcuts.mermaidEditor',
    rows: [
      { keys: ['⌘/Ctrl', 'Shift', 'S'], labelKey: 'shortcuts.insertSection' },
      { keys: ['⌘/Ctrl', 'Shift', 'T'], labelKey: 'shortcuts.insertTask' },
      { keys: ['⌘/Ctrl', 'Shift', 'M'], labelKey: 'shortcuts.insertMilestone' },
      { keys: ['⌘/Ctrl', 'Shift', 'F'], labelKey: 'shortcuts.format' },
    ],
  },
];

export default function ShortcutsDialog({ onClose }: Props) {
  const { t } = useI18n();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="add-dialog-overlay" onClick={onClose} />
      <div className="add-dialog" style={{ width: 440 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('shortcuts.title')}
          </h3>
          <button
            className="btn-glass rounded-md p-1 cursor-pointer"
            onClick={onClose}
            type="button"
            title={t('common.close')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {SECTIONS.map(section => (
            <div key={section.titleKey}>
              <div
                className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t(section.titleKey)}
              </div>
              <div className="flex flex-col gap-1">
                {section.rows.map(r => (
                  <div key={r.labelKey} className="flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--text-primary)' }}>{t(r.labelKey)}</span>
                    <div className="flex items-center gap-1">
                      {r.keys.map((k, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <span style={{ color: 'var(--text-secondary)' }}>+</span>}
                          <kbd
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold"
                            style={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-primary)',
                              minWidth: 18,
                              textAlign: 'center',
                            }}
                          >
                            {k}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
