'use client';

import { Dispatch, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { GanttAction, Task } from '@/types';

interface Props {
  tasks: Task[];
  dispatch: Dispatch<GanttAction>;
  onClose: () => void;
  onPick: (taskId: string) => void;
}

const MAX_RESULTS = 10;

export default function SearchPanel({ tasks, dispatch, onClose, onPick }: Props) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const matches: Array<{ task: Task; score: number }> = [];
    for (const t of tasks) {
      const name = t.name.toLowerCase();
      const id = t.id.toLowerCase();
      const phase = t.phase.toLowerCase();
      let score = 0;
      if (id === q) score = 100;
      else if (name === q) score = 90;
      else if (id.startsWith(q)) score = 80;
      else if (name.startsWith(q)) score = 70;
      else if (name.includes(q)) score = 40;
      else if (id.includes(q)) score = 30;
      else if (phase.includes(q)) score = 10;
      if (score > 0) matches.push({ task: t, score });
    }
    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, MAX_RESULTS).map(m => m.task);
  }, [query, tasks]);

  useEffect(() => {
    if (selectedIndex >= results.length) setSelectedIndex(0);
  }, [results.length, selectedIndex]);

  const pick = useCallback(
    (task: Task) => {
      onPick(task.id);
      onClose();
    },
    [onPick, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (results.length === 0 ? 0 : (i + 1) % results.length));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i =>
          results.length === 0 ? 0 : (i - 1 + results.length) % results.length
        );
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const t = results[selectedIndex];
        if (t) pick(t);
      }
    },
    [results, selectedIndex, pick, onClose]
  );

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 top-2 z-[80] w-[440px] rounded-xl shadow-2xl overflow-hidden"
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-color)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <Search className="w-4 h-4 opacity-60" style={{ color: 'var(--text-secondary)' }} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search task by name, id, or phase..."
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: 'var(--text-primary)' }}
        />
        <button
          className="btn-glass rounded p-1 cursor-pointer"
          onClick={onClose}
          type="button"
          title="Close (Esc)"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {query.trim() && (
        <div className="max-h-80 overflow-auto">
          {results.length === 0 ? (
            <div
              className="px-3 py-4 text-xs text-center"
              style={{ color: 'var(--text-secondary)' }}
            >
              No matches
            </div>
          ) : (
            results.map((task, i) => (
              <button
                key={task.id}
                className="w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer transition-colors"
                style={{
                  background: i === selectedIndex ? 'var(--accent-glow)' : 'transparent',
                  color: 'var(--text-primary)',
                  borderLeft: `3px solid ${i === selectedIndex ? 'var(--accent)' : 'transparent'}`,
                }}
                onClick={() => pick(task)}
                onMouseEnter={() => setSelectedIndex(i)}
                type="button"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate">
                    <Highlight text={task.name} query={query} />
                  </div>
                  <div
                    className="text-[10px] truncate mt-0.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {task.phase} · <span className="font-mono">{task.id}</span> · {task.duration}d
                  </div>
                </div>
                <StatusBadge status={task.status} />
              </button>
            ))
          )}
        </div>
      )}

      {!query.trim() && (
        <div
          className="px-3 py-2 text-[10px]"
          style={{ color: 'var(--text-secondary)' }}
        >
          Type to search. <kbd>↑</kbd>/<kbd>↓</kbd> navigate · <kbd>Enter</kbd> pick · <kbd>Esc</kbd> close
        </div>
      )}
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark
        style={{
          background: 'var(--accent)',
          color: '#fff',
          padding: '0 2px',
          borderRadius: 2,
        }}
      >
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function StatusBadge({ status }: { status: Task['status'] }) {
  const map = {
    done: { bg: '#10b981', label: 'Done' },
    'in-progress': { bg: '#6366f1', label: 'Active' },
    planned: { bg: 'transparent', label: 'Planned' },
  } as const;
  const s = map[status];
  return (
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
      style={{
        background: s.bg,
        color: status === 'planned' ? 'var(--text-secondary)' : '#fff',
        border: status === 'planned' ? '1px solid var(--border-color)' : undefined,
      }}
    >
      {s.label}
    </span>
  );
}
