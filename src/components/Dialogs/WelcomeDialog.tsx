'use client';

import { useEffect } from 'react';
import { Keyboard, MousePointer2, Save, Split, X } from 'lucide-react';

interface Props {
  onClose: () => void;
  onOpenShortcuts: () => void;
}

const FEATURES = [
  {
    icon: <MousePointer2 className="w-4 h-4" />,
    title: 'Drag to edit',
    body: 'Drag a task bar to move dates or reorder across sub-phases. Drag the right edge to resize. Right-click a task for duplicate / delete / status.',
  },
  {
    icon: <Split className="w-4 h-4" />,
    title: 'Connect dependencies',
    body: 'Drag from a task bar to another to create a dependency. The line turns red when it would cause a cycle.',
  },
  {
    icon: <Save className="w-4 h-4" />,
    title: 'Multi-project + auto-save',
    body: 'File menu → New / Open / Download / Import. Everything saves to localStorage automatically — no data loss on refresh.',
  },
  {
    icon: <Keyboard className="w-4 h-4" />,
    title: 'Keyboard shortcuts',
    body: 'Cmd/Ctrl+Z to undo, Cmd/Ctrl+F to search, T to jump to today, +/- to zoom. Press ? anywhere to see the full cheatsheet.',
  },
];

export default function WelcomeDialog({ onClose, onOpenShortcuts }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
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
      <div className="add-dialog" style={{ width: 520 }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Welcome 👋
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              A quick tour of what's in here
            </p>
          </div>
          <button
            className="btn-glass rounded-md p-1 cursor-pointer"
            onClick={onClose}
            type="button"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-3 mt-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-3 items-start">
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
                  {f.title}
                </div>
                <div
                  className="text-[11px] leading-snug"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {f.body}
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
            Show all shortcuts
          </button>
          <button
            className="btn-primary text-xs font-semibold px-5 py-2 rounded-lg cursor-pointer"
            onClick={onClose}
            type="button"
          >
            Let&apos;s go
          </button>
        </div>
      </div>
    </>
  );
}
