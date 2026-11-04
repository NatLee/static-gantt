'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';

export interface ShortcutHandlers {
  undo?: () => void;
  redo?: () => void;
  today?: () => void;
  zoomIn?: () => void;
  zoomOut?: () => void;
  escape?: () => void;
  openShortcuts?: () => void;
  openSearch?: () => void;
  newTask?: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return false;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  // Keep the latest handlers for the one window listener below (updated after each render).
  const ref = useRef(handlers);
  useLayoutEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const h = ref.current;
      const cmd = e.metaKey || e.ctrlKey;
      const key = e.key;
      const lower = key.toLowerCase();

      // Modifier-based shortcuts first (these override editable targets only for undo/redo)
      if (cmd && lower === 'z') {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        if (e.shiftKey) h.redo?.();
        else h.undo?.();
        return;
      }
      if (cmd && lower === 'y') {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        h.redo?.();
        return;
      }
      if (cmd && lower === 'f') {
        if (isEditableTarget(e.target)) return;
        if (!h.openSearch) return;
        e.preventDefault();
        h.openSearch();
        return;
      }

      // Escape always works, even in inputs (so editor can be closed by dialog's own handler)
      if (key === 'Escape') {
        // Only fire global escape if no focused editable element (let those handle it)
        if (isEditableTarget(e.target)) return;
        h.escape?.();
        return;
      }

      // Letter/symbol shortcuts — suppressed inside inputs
      if (isEditableTarget(e.target)) return;

      if (lower === 't' && !cmd && !e.altKey) {
        e.preventDefault();
        h.today?.();
        return;
      }
      if (key === '?' && !cmd) {
        e.preventDefault();
        h.openShortcuts?.();
        return;
      }
      if ((key === '+' || key === '=') && !cmd) {
        e.preventDefault();
        h.zoomIn?.();
        return;
      }
      if ((key === '-' || key === '_') && !cmd) {
        e.preventDefault();
        h.zoomOut?.();
        return;
      }
      if (lower === 'n' && !cmd && !e.altKey) {
        e.preventDefault();
        h.newTask?.();
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
