import type { KeyboardEvent } from 'react';

/** Enter or Space: the keys that press a button. */
export function isActivationKey(e: KeyboardEvent): boolean {
  return e.key === 'Enter' || e.key === ' ';
}

/** The keyboard's menu key, or Shift+F10: the keyboard way to right-click. */
export function isContextMenuKey(e: KeyboardEvent): boolean {
  return e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10');
}

/** Where a context menu opened from the keyboard appears: under the focused element. */
export function menuPointFor(el: Element): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.bottom };
}
