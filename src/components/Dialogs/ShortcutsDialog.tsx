'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

interface Row {
  keys: string[];
  label: string;
}

interface Section {
  title: string;
  rows: Row[];
}

const SECTIONS: Section[] = [
  {
    title: 'General',
    rows: [
      { keys: ['?'], label: 'Show this cheatsheet' },
      { keys: ['Esc'], label: 'Close dialogs / panels' },
    ],
  },
  {
    title: 'History',
    rows: [
      { keys: ['⌘/Ctrl', 'Z'], label: 'Undo' },
      { keys: ['⌘/Ctrl', 'Shift', 'Z'], label: 'Redo' },
      { keys: ['⌘/Ctrl', 'Y'], label: 'Redo (alt)' },
    ],
  },
  {
    title: 'Navigation',
    rows: [
      { keys: ['⌘/Ctrl', 'F'], label: 'Search tasks' },
      { keys: ['T'], label: 'Scroll to today' },
      { keys: ['+'], label: 'Zoom in' },
      { keys: ['-'], label: 'Zoom out' },
    ],
  },
  {
    title: 'Mermaid editor',
    rows: [
      { keys: ['⌘/Ctrl', 'Shift', 'S'], label: 'Insert section' },
      { keys: ['⌘/Ctrl', 'Shift', 'T'], label: 'Insert task' },
      { keys: ['⌘/Ctrl', 'Shift', 'M'], label: 'Insert milestone' },
      { keys: ['⌘/Ctrl', 'Shift', 'F'], label: 'Format' },
    ],
  },
];

export default function ShortcutsDialog({ onClose }: Props) {
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
            Keyboard shortcuts
          </h3>
          <button
            className="btn-glass rounded-md p-1 cursor-pointer"
            onClick={onClose}
            type="button"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {SECTIONS.map(section => (
            <div key={section.title}>
              <div
                className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {section.title}
              </div>
              <div className="flex flex-col gap-1">
                {section.rows.map(r => (
                  <div key={r.label} className="flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--text-primary)' }}>{r.label}</span>
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
