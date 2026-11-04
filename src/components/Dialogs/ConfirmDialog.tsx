'use client';

import { useId, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import Dialog from './Dialog';

interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * "Are you sure?" for actions that throw data away. Same shell and look as the other dialogs;
 * focus starts on Cancel, so pressing Enter by reflex doesn't confirm, and Escape cancels.
 */
export default function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }: Props) {
  const { t } = useI18n();
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog labelledBy={titleId} onClose={onCancel} initialFocusRef={cancelRef} style={{ width: 420 }}>
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
          aria-hidden="true"
        >
          <AlertTriangle className="w-4 h-4" />
        </div>
        <h3 id={titleId} className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {message}
      </p>
      <div className="flex items-center justify-end gap-2 mt-5">
        <button
          ref={cancelRef}
          className="btn-glass text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
          onClick={onCancel}
          type="button"
        >
          {t('common.cancel')}
        </button>
        <button
          className="text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-all"
          style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
          onClick={onConfirm}
          type="button"
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
