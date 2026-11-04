'use client';

import { KeyboardEvent, RefObject, useEffect } from 'react';

const ITEM_SELECTOR = '[role="menuitem"]:not([disabled]), [role="menuitemcheckbox"]:not([disabled])';

function menuItems(root: HTMLElement | null): HTMLElement[] {
  return root ? Array.from(root.querySelectorAll<HTMLElement>(ITEM_SELECTOR)) : [];
}

/**
 * Keyboard behaviour shared by the menubar menus and the right-click menus (WAI-ARIA menu
 * pattern): focus the first item when the menu opens, move with ↑ ↓ Home End, close with Escape
 * or Tab, and give focus back to whatever had it before. Returns the menu's onKeyDown handler.
 */
export function useMenuNavigation(
  menuRef: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void
) {
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    menuItems(menuRef.current)[0]?.focus();
    return () => {
      if (opener?.isConnected && opener !== document.body) opener.focus();
    };
  }, [open, menuRef]);

  return (e: KeyboardEvent) => {
    const items = menuItems(menuRef.current);
    const at = items.indexOf(document.activeElement as HTMLElement);
    const move = (i: number) => {
      e.preventDefault();
      items[(i + items.length) % items.length]?.focus();
    };
    switch (e.key) {
      case 'ArrowDown':
        return move(at + 1);
      case 'ArrowUp':
        return move(at < 0 ? -1 : at - 1);
      case 'Home':
        return move(0);
      case 'End':
        return move(-1);
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        return onClose();
      case 'Tab':
        return onClose();
    }
  };
}
