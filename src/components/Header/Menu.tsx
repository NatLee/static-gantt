'use client';

import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';

interface MenuProps {
  label: string;
  children: ReactNode;
}

export function Menu({ label, children }: MenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  return (
    <div ref={wrapperRef} className="menu-root">
      <button
        type="button"
        className={`menu-label ${open ? 'menu-label-active' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        {label}
      </button>
      {open && (
        <div className="menu-dropdown" role="menu" onClick={close}>
          {children}
        </div>
      )}
    </div>
  );
}

interface MenuItemProps {
  icon?: ReactNode;
  label: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  checked?: boolean;
  danger?: boolean;
}

export function MenuItem({ icon, label, shortcut, onClick, disabled, checked, danger }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className={`menu-item ${disabled ? 'menu-item-disabled' : ''} ${danger ? 'menu-item-danger' : ''}`}
      onClick={(e) => {
        if (disabled) {
          e.stopPropagation();
          return;
        }
        onClick?.();
      }}
      disabled={disabled}
    >
      <span className="menu-item-check" aria-hidden>
        {checked ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : null}
      </span>
      <span className="menu-item-icon" aria-hidden>{icon}</span>
      <span className="menu-item-label">{label}</span>
      {shortcut && <span className="menu-item-shortcut">{shortcut}</span>}
    </button>
  );
}

export function MenuDivider() {
  return <div className="menu-divider" role="separator" />;
}

export function MenuHeading({ children }: { children: ReactNode }) {
  return <div className="menu-heading">{children}</div>;
}
