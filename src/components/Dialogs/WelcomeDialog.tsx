'use client';

import { useId, useRef } from 'react';
import Dialog from './Dialog';
import { Keyboard, MousePointer2, Save, Split, X } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';

interface Props {
  onClose: () => void;
  onOpenShortcuts: () => void;
}

const FEATURES: { icon: React.ReactNode; titleKey: MessageKey; bodyKey: MessageKey }[] = [
  {
    icon: <MousePointer2 className="w-4 h-4" />,
    titleKey: 'welcome.dragTitle',
    bodyKey: 'welcome.dragBody',
  },
  {
    icon: <Split className="w-4 h-4" />,
    titleKey: 'welcome.connectTitle',
    bodyKey: 'welcome.connectBody',
  },
  {
    icon: <Save className="w-4 h-4" />,
    titleKey: 'welcome.saveTitle',
    bodyKey: 'welcome.saveBody',
  },
  {
    icon: <Keyboard className="w-4 h-4" />,
    titleKey: 'welcome.kbdTitle',
    bodyKey: 'welcome.kbdBody',
  },
];

export default function WelcomeDialog({ onClose, onOpenShortcuts }: Props) {
  const { t } = useI18n();
  const titleId = useId();
  // Focus starts on "Let's go", so Enter still closes the dialog as before, while Tab and Enter
  // can now reach "Show shortcuts" too (a window-wide Enter handler used to swallow it).
  const primaryRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog labelledBy={titleId} onClose={onClose} initialFocusRef={primaryRef} style={{ width: 520 }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 id={titleId} className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              {t('welcome.title')}
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {t('welcome.subtitle')}
            </p>
          </div>
          <button
            className="btn-glass rounded-md p-1 cursor-pointer"
            onClick={onClose}
            type="button"
            title={t('common.close')}
            aria-label={t('common.close')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-3 mt-2">
          {FEATURES.map((f) => (
            <div key={f.titleKey} className="flex gap-3 items-start">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: 'var(--accent-glow)',
                  color: 'var(--accent)',
                }}
              >
                {f.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-xs font-bold mb-0.5"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {t(f.titleKey)}
                </div>
                <div
                  className="text-[11px] leading-snug"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t(f.bodyKey)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            className="btn-glass text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer"
            onClick={() => {
              onClose();
              onOpenShortcuts();
            }}
            type="button"
          >
            {t('welcome.showShortcuts')}
          </button>
          <button
            ref={primaryRef}
            className="btn-primary text-xs font-semibold px-5 py-2 rounded-lg cursor-pointer"
            onClick={onClose}
            type="button"
          >
            {t('welcome.letsGo')}
          </button>
        </div>
    </Dialog>
  );
}
