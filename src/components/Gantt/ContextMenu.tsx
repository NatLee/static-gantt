'use client';

import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMenuNavigation } from '@/hooks/useMenuNavigation';

/** Gap kept between the menu and the window edge. */
const EDGE_MARGIN = 8;

interface ContextMenuProps {
  x: number;
  y: number;
  /** Accessible name of the menu (what it acts on). */
  label: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Right-click menu shell used for tasks and phases: rendered at the pointer (moved inside the
 * window when it would overflow), closed by a click outside, and driven by the keyboard like the
 * menubar menus. The two menus used to carry their own copies of all of this.
 */
export default function ContextMenu({ x, y, label, onClose, children }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y, measured: false });
  const onKeyDown = useMenuNavigation(menuRef, position.measured, onClose);

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const left = Math.min(x, Math.max(EDGE_MARGIN, window.innerWidth - rect.width - EDGE_MARGIN));
    const top = Math.min(y, Math.max(EDGE_MARGIN, window.innerHeight - rect.height - EDGE_MARGIN));
    // Measuring needs the rendered menu, so the position is set right after the first layout.
    setPosition({ left, top, measured: true });
  }, [x, y]);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) onClose();
    };
    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, [onClose]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={label}
      className="fixed min-w-[200px] rounded-lg shadow-2xl py-1"
      style={{
        left: position.left,
        top: position.top,
        zIndex: 1000,
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-color)',
        backdropFilter: 'blur(16px)',
        visibility: position.measured ? 'visible' : 'hidden',
      }}
      onKeyDown={onKeyDown}
      onContextMenu={e => e.preventDefault()}
    >
      {children}
    </div>,
    document.body
  );
}

export function ContextMenuItem({
  icon,
  label,
  onClick,
  danger,
  checked,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  /** Set for items that show an on/off or current state (status choices). */
  checked?: boolean;
}) {
  return (
    <button
      role={checked === undefined ? 'menuitem' : 'menuitemradio'}
      aria-checked={checked}
      tabIndex={-1}
      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-xs font-medium cursor-pointer transition-colors hover:bg-[var(--bg-card)] focus-visible:bg-[var(--bg-card)]"
      style={{ color: danger ? '#ef4444' : 'var(--text-primary)' }}
      onClick={onClick}
      type="button"
    >
      <span className="opacity-70 shrink-0" aria-hidden="true">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

export function ContextMenuDivider() {
  return (
    <div
      role="separator"
      className="my-1 mx-2"
      style={{ height: 1, background: 'var(--border-color)', opacity: 0.6 }}
    />
  );
}

export function ContextMenuHeading({ children, small }: { children: ReactNode; small?: boolean }) {
  return (
    <div
      className={
        small
          ? 'px-3 pt-1.5 pb-0.5 text-[9px] font-bold uppercase tracking-wider'
          : 'px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider truncate'
      }
      style={{ color: 'var(--text-secondary)' }}
    >
      {children}
    </div>
  );
}
