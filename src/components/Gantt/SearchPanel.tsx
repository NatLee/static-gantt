'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Task } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';

interface Props {
  tasks: Task[];
  onClose: () => void;
  onPick: (taskId: string) => void;
}

const MAX_RESULTS = 10;

export default function SearchPanel({ tasks, onClose, onPick }: Props) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const optionId = (i: number) => `${listId}-${i}`;

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

  // The highlighted row, kept inside the current results when they shrink.
  const active = selectedIndex < results.length ? selectedIndex : 0;

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
        const t = results[active];
        if (t) pick(t);
      }
    },
    [results, active, pick, onClose]
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
          onChange={e => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={t('search.placeholder')}
          aria-label={t('search.placeholder')}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={results.length > 0}
          aria-controls={listId}
          aria-activedescendant={results.length > 0 ? optionId(active) : undefined}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: 'var(--text-primary)' }}
        />
        <button
          className="btn-glass rounded p-1 cursor-pointer"
          onClick={onClose}
          type="button"
          title={t('search.close')}
          aria-label={t('search.close')}
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {query.trim() && (
        <div className="max-h-80 overflow-auto" role="listbox" id={listId} aria-label={t('search.placeholder')}>
          {results.length === 0 ? (
            <div
              className="px-3 py-4 text-xs text-center"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t('search.noMatches')}
            </div>
          ) : (
            results.map((task, i) => (
              <button
                key={task.id}
                id={optionId(i)}
                role="option"
                aria-selected={i === active}
                tabIndex={-1}
                className="w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer transition-colors"
                style={{
                  background: i === active ? 'var(--accent-glow)' : 'transparent',
                  color: 'var(--text-primary)',
                  borderLeft: `3px solid ${i === active ? 'var(--accent)' : 'transparent'}`,
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
                    {task.phase} · <span className="font-mono">{task.id}</span> · {t('tip.days', { days: task.duration })}
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
          {t('search.hintPrefix')} <kbd>↑</kbd>/<kbd>↓</kbd> {t('search.hintNav')} · <kbd>Enter</kbd> {t('search.hintPick')} · <kbd>Esc</kbd> {t('search.hintClose')}
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
  const { t } = useI18n();
  const map = {
    done: { bg: '#10b981', label: t('status.done') },
    'in-progress': { bg: '#6366f1', label: t('search.badgeActive') },
    planned: { bg: 'transparent', label: t('status.planned') },
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
