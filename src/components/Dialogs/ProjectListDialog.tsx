'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Download, Pencil, Trash2, X } from 'lucide-react';
import type { ProjectsAPI } from '@/hooks/usePersistentGanttState';
import { useI18n } from '@/i18n/I18nProvider';

interface Props {
  api: ProjectsAPI;
  onClose: () => void;
}

export default function ProjectListDialog({ api, onClose }: Props) {
  const { t } = useI18n();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const commitRename = useCallback(() => {
    if (renamingId) {
      api.rename(renamingId, renameValue);
    }
    setRenamingId(null);
    setRenameValue('');
  }, [renamingId, renameValue, api]);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const sorted = [...api.projects].sort((a, b) =>
    a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0
  );

  return (
    <>
      <div className="add-dialog-overlay" onClick={onClose} />
      <div
        className="add-dialog"
        style={{ width: 520, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('projects.title', { count: api.projects.length })}
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

        <div className="flex flex-col gap-1.5 overflow-auto pr-1" style={{ maxHeight: '60vh' }}>
          {sorted.map(p => {
            const isActive = p.id === api.activeProjectId;
            const isRenaming = renamingId === p.id;
            const isConfirmingDelete = confirmDeleteId === p.id;
            return (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                style={{
                  background: isActive ? 'var(--accent-glow)' : 'var(--bg-card)',
                  border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border-color)'}`,
                }}
              >
                <button
                  className="flex-1 text-left min-w-0 cursor-pointer"
                  onClick={() => {
                    if (!isRenaming) api.switchTo(p.id);
                  }}
                  type="button"
                  disabled={isRenaming}
                >
                  {isRenaming ? (
                    <input
                      autoFocus
                      className="w-full px-2 py-1 rounded border text-xs font-semibold"
                      style={{
                        background: 'var(--bg-panel)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') {
                          setRenamingId(null);
                          setRenameValue('');
                        }
                      }}
                      onBlur={commitRename}
                    />
                  ) : (
                    <>
                      <div
                        className="text-xs font-bold truncate flex items-center gap-1.5"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {isActive && <Check className="w-3 h-3 text-emerald-500 shrink-0" />}
                        {p.name}
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {p.taskCount === 1
                          ? t('projects.taskOne', { count: p.taskCount })
                          : t('projects.taskOther', { count: p.taskCount })}{' '}
                        · {formatDate(p.updatedAt)}
                      </div>
                    </>
                  )}
                </button>

                {!isRenaming && (
                  <div className="flex items-center gap-1 shrink-0">
                    {isConfirmingDelete ? (
                      <>
                        <button
                          className="text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                          style={{
                            background: 'rgba(239,68,68,0.2)',
                            color: '#ef4444',
                            border: '1px solid rgba(239,68,68,0.4)',
                          }}
                          onClick={() => {
                            api.remove(p.id);
                            setConfirmDeleteId(null);
                          }}
                          type="button"
                        >
                          {t('common.delete')}
                        </button>
                        <button
                          className="text-[10px] font-medium px-2 py-1 rounded cursor-pointer"
                          style={{ color: 'var(--text-secondary)' }}
                          onClick={() => setConfirmDeleteId(null)}
                          type="button"
                        >
                          {t('common.cancel')}
                        </button>
                      </>
                    ) : (
                      <>
                        <IconButton
                          icon={<Pencil className="w-3 h-3" />}
                          title={t('common.rename')}
                          onClick={() => {
                            setRenamingId(p.id);
                            setRenameValue(p.name);
                          }}
                        />
                        <IconButton
                          icon={<Copy className="w-3 h-3" />}
                          title={t('common.duplicate')}
                          onClick={() => api.duplicate(p.id)}
                        />
                        <IconButton
                          icon={<Download className="w-3 h-3" />}
                          title={t('common.download')}
                          onClick={() => api.download(p.id)}
                        />
                        <IconButton
                          icon={<Trash2 className="w-3 h-3" />}
                          title={t('common.delete')}
                          variant="danger"
                          onClick={() => setConfirmDeleteId(p.id)}
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end mt-4 gap-2">
          <button
            className="btn-glass text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
            onClick={onClose}
            type="button"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </>
  );
}

function IconButton({
  icon,
  title,
  onClick,
  variant,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  variant?: 'danger';
}) {
  return (
    <button
      className="btn-glass rounded-md p-1 cursor-pointer"
      style={variant === 'danger' ? { color: '#ef4444' } : undefined}
      title={title}
      onClick={onClick}
      type="button"
    >
      {icon}
    </button>
  );
}
