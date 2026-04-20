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
          title="Undo (⌘Z)"
          onClick={onUndo}
          disabled={!canUndo}
        />
        <SegmentedButton
          icon={<Redo2 className="w-3.5 h-3.5" />}
          title="Redo (⇧⌘Z)"
          onClick={onRedo}
          disabled={!canRedo}
        />
      </Segmented>

      <div className="toolbar-sep" />

      <button type="button" className="toolbar-btn" onClick={onInsertSection} title="Insert section (⌘⇧S)">
        <Plus className="w-3.5 h-3.5" />
        <span>Section</span>
      </button>
      <button type="button" className="toolbar-btn" onClick={onInsertTask} title="Insert task (⌘⇧T)">
        <Plus className="w-3.5 h-3.5" />
        <span>Task</span>
      </button>
      <button type="button" className="toolbar-btn" onClick={onInsertMilestone} title="Insert milestone (⌘⇧M)">
        <Plus className="w-3.5 h-3.5" />
        <span>Milestone</span>
      </button>

      <div className="toolbar-sep" />

      <button type="button" className="toolbar-btn" onClick={onFormat} title="Format (⌘⇧F)">
        <AlignLeft className="w-3.5 h-3.5" />
        <span>Format</span>
      </button>

      <div className="toolbar-spacer" />

      <button type="button" className="toolbar-btn" onClick={handleImportClick} title="Import .mmd file">
        <FileUp className="w-3.5 h-3.5" />
        <span>Import</span>
      </button>
      <button type="button" className="toolbar-btn" onClick={onDownloadMmd} title="Download as .mmd">
        <FileDown className="w-3.5 h-3.5" />
        <span>Download</span>
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
