'use client';

import { useEffect } from 'react';
import { X, Layers, MousePointerClick, GitBranch, Save, Download } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';
import type { LucideIcon } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const FEATURES: { icon: LucideIcon; key: MessageKey }[] = [
  { icon: MousePointerClick, key: 'about.featureVisual' },
  { icon: GitBranch, key: 'about.featureMermaid' },
  { icon: Save, key: 'about.featureAutosave' },
  { icon: Download, key: 'about.featureExport' },
];

export default function AboutDialog({ onClose }: Props) {
  const { t } = useI18n();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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
      <div className="add-dialog" style={{ width: 420 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('help.about')}
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

        <div className="flex items-center gap-3 mb-4">
          <div className="about-logo" aria-hidden>
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                {t('about.appName')}
              </span>
              <span className="about-version">{t('about.version')}</span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {t('about.tagline')}
            </p>
          </div>
        </div>

        <div
          className="text-[10px] font-bold uppercase tracking-wider mb-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          {t('about.features')}
        </div>
        <div className="flex flex-col gap-2 mb-4">
          {FEATURES.map(({ icon: Icon, key }) => (
            <div key={key} className="flex items-start gap-2.5 text-xs">
              <span className="about-feature-icon" aria-hidden>
                <Icon className="w-3.5 h-3.5" />
              </span>
              <span style={{ color: 'var(--text-primary)' }}>{t(key)}</span>
            </div>
          ))}
        </div>

        <div
          className="text-[11px] pt-3"
          style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)' }}
        >
          {t('about.builtWith')}
        </div>
      </div>
    </>
  );
}
