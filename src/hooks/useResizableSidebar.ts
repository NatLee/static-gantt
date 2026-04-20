'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SIDEBAR_DEFAULT_W, SIDEBAR_MIN_W, SIDEBAR_MAX_W } from '@/lib/ganttLayout';

const STORAGE_KEY = 'gantt-sidebar-w';

function clamp(v: number) {
  return Math.min(SIDEBAR_MAX_W, Math.max(SIDEBAR_MIN_W, v));
}

function applyWidth(w: number) {
  document.documentElement.style.setProperty('--sidebar-w', `${w}px`);
}

export function useResizableSidebar() {
  const widthRef = useRef<number>(SIDEBAR_DEFAULT_W);
  const [isDragging, setIsDragging] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const initial = stored ? clamp(parseInt(stored, 10) || SIDEBAR_DEFAULT_W) : SIDEBAR_DEFAULT_W;
    widthRef.current = initial;
    applyWidth(initial);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX;
    const startW = widthRef.current;

    const move = (ev: PointerEvent) => {
      const next = clamp(startW + (ev.clientX - startX));
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        applyWidth(next);
        widthRef.current = next;
      });
    };

    const up = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      localStorage.setItem(STORAGE_KEY, String(widthRef.current));
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, []);

  return { isDragging, onPointerDown };
}
