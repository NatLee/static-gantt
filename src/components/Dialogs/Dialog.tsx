'use client';

import { CSSProperties, KeyboardEvent, ReactNode, RefObject, useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusableIn(root: HTMLElement | null): HTMLElement[] {
  return root ? Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];
}

interface DialogProps {
  /** id of the element holding the visible title. */
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
  /** Panel and backdrop classes; the defaults are the centred dialog. */
  className?: string;
  overlayClassName?: string;
  style?: CSSProperties;
  /** Keys that close the dialog (Escape always does). */
  closeKeys?: string[];
  /** Element to focus on open; defaults to the first focusable control. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Extra key handling for the dialog's content (runs before the built-in keys). */
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
}

/**
 * Shell shared by every modal: backdrop, `role="dialog"` with its title, focus moved inside on
 * open and kept there with Tab, Escape to close, and focus handed back to whatever opened it.
 * Each dialog used to wire its own window-wide Escape listener and left focus behind it.
 */
export default function Dialog({
  labelledBy,
  onClose,
  children,
  className = 'add-dialog',
  overlayClassName = 'add-dialog-overlay',
  style,
  closeKeys = [],
  initialFocusRef,
  onKeyDown,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    (initialFocusRef?.current ?? focusableIn(panel)[0] ?? panel)?.focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
    // Runs once per opening; the focus target is read at mount time on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    if (e.key === 'Escape' || closeKeys.includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key === 'Tab') {
      const items = focusableIn(panelRef.current);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <>
      <div className={overlayClassName} onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={className}
        style={style}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </>
  );
}
