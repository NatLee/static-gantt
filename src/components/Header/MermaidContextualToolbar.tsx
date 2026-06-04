'use client';

import { useRef } from 'react';
import {
  Undo2,
  Redo2,
  Plus,
  AlignLeft,
  FileDown,
  FileUp,
} from 'lucide-react';
import { Segmented, SegmentedButton } from './Segmented';
import { useI18n } from '@/i18n/I18nProvider';

interface Props {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onInsertSection: () => void;
  onInsertTask: () => void;
  onInsertMilestone: () => void;
  onFormat: () => void;
  onDownloadMmd: () => void;
  onImportMmd: (text: string) => void;
}

export default function MermaidContextualToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onInsertSection,
  onInsertTask,
  onInsertMilestone,
  onFormat,
  onDownloadMmd,
  onImportMmd,
}: Props) {
  const { t } = useI18n();
  const mmdInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => mmdInputRef.current?.click();
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      onImportMmd(text);
    } finally {
      if (mmdInputRef.current) mmdInputRef.current.value = '';
    }
  };

  return (
    <>
      <Segmented>
        <SegmentedButton
          icon={<Undo2 className="w-3.5 h-3.5" />}
          title={t('toolbar.undo')}
          onClick={onUndo}
          disabled={!canUndo}
        />
        <SegmentedButton
          icon={<Redo2 className="w-3.5 h-3.5" />}
          title={t('toolbar.redo')}
          onClick={onRedo}
          disabled={!canRedo}
        />
      </Segmented>

      <div className="toolbar-sep" />

      <button type="button" className="toolbar-btn" onClick={onInsertSection} title={t('mtoolbar.sectionTitle')}>
        <Plus className="w-3.5 h-3.5" />
        <span>{t('mtoolbar.section')}</span>
      </button>
      <button type="button" className="toolbar-btn" onClick={onInsertTask} title={t('mtoolbar.taskTitle')}>
        <Plus className="w-3.5 h-3.5" />
        <span>{t('mtoolbar.task')}</span>
      </button>
      <button type="button" className="toolbar-btn" onClick={onInsertMilestone} title={t('mtoolbar.milestoneTitle')}>
        <Plus className="w-3.5 h-3.5" />
        <span>{t('mtoolbar.milestone')}</span>
      </button>

      <div className="toolbar-sep" />

      <button type="button" className="toolbar-btn" onClick={onFormat} title={t('mtoolbar.formatTitle')}>
        <AlignLeft className="w-3.5 h-3.5" />
        <span>{t('mtoolbar.format')}</span>
      </button>

      <div className="toolbar-spacer" />

      <button type="button" className="toolbar-btn" onClick={handleImportClick} title={t('mtoolbar.importTitle')}>
        <FileUp className="w-3.5 h-3.5" />
        <span>{t('mtoolbar.import')}</span>
      </button>
      <button type="button" className="toolbar-btn" onClick={onDownloadMmd} title={t('mtoolbar.downloadTitle')}>
        <FileDown className="w-3.5 h-3.5" />
        <span>{t('mtoolbar.download')}</span>
      </button>

      <input
        ref={mmdInputRef}
        type="file"
        accept=".mmd,.txt,text/plain"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}
