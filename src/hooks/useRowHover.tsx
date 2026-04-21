'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';

interface RowHoverContextValue {
  setHover: (taskId: string | null) => void;
}

const RowHoverContext = createContext<RowHoverContextValue | null>(null);

const HOVER_CLASS = 'row-hover';
const SCROLL_CONTAINER_ID = 'gantt-scroll-container';

export function RowHoverProvider({ children }: { children: React.ReactNode }) {
  const currentRef = useRef<string | null>(null);

  const setHover = useCallback((taskId: string | null) => {
    if (currentRef.current === taskId) return;

    const root = document.getElementById(SCROLL_CONTAINER_ID) ?? document;
    const prev = currentRef.current;
    if (prev) {
      const prevNodes = root.querySelectorAll<HTMLElement>(
        `[data-task-row-id="${CSS.escape(prev)}"]`
      );
      prevNodes.forEach((n) => n.classList.remove(HOVER_CLASS));
    }
    if (taskId) {
      const nextNodes = root.querySelectorAll<HTMLElement>(
        `[data-task-row-id="${CSS.escape(taskId)}"]`
      );
      nextNodes.forEach((n) => n.classList.add(HOVER_CLASS));
    }
    currentRef.current = taskId;
  }, []);

  const value = useMemo<RowHoverContextValue>(() => ({ setHover }), [setHover]);
  return <RowHoverContext.Provider value={value}>{children}</RowHoverContext.Provider>;
}

export function useRowHover(): RowHoverContextValue {
  const ctx = useContext(RowHoverContext);
  if (!ctx) return { setHover: () => {} };
  return ctx;
}
