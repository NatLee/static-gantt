'use client';

import { ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react';
import { useMenuNavigation } from '@/hooks/useMenuNavigation';

interface MenuProps {
  label: string;
  children: ReactNode;
}

export function Menu({ label, children }: MenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const close = useCallback(() => setOpen(false), []);
  const onMenuKeyDown = useMenuNavigation(menuRef, open, close);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  return (
    <div ref={wrapperRef} className="menu-root">
      <button
        type="button"
        className={`menu-label ${open ? 'menu-label-active' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {label}
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          className="menu-dropdown"
          role="menu"
          aria-label={label}
          onClick={close}
          onKeyDown={onMenuKeyDown}
        >
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
      // Toggles (theme, language, zoom preset, working days) announce their state.
      role={checked === undefined ? 'menuitem' : 'menuitemcheckbox'}
      aria-checked={checked}
      tabIndex={-1}
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
