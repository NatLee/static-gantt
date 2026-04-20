'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import type React from 'react';
import { ROW_HEIGHT, VIRTUALIZE_THRESHOLD, VIRTUALIZE_BUFFER } from '@/lib/ganttLayout';

export interface VirtualWindow {
  enabled: boolean;
  startIndex: number;
  endIndex: number;
}

export function useVirtualRows(
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
  totalRows: number,
  rowHeight: number = ROW_HEIGHT,
): VirtualWindow {
  const enabled = totalRows > VIRTUALIZE_THRESHOLD;

  const virtualizer = useVirtualizer({
    count: enabled ? totalRows : 0,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => rowHeight,
    overscan: VIRTUALIZE_BUFFER,
    enabled,
  });

  if (!enabled) {
    return { enabled: false, startIndex: 0, endIndex: totalRows - 1 };
  }

  const items = virtualizer.getVirtualItems();
  const startIndex = items.length > 0 ? items[0].index : 0;
  const endIndex = items.length > 0 ? items[items.length - 1].index : -1;

  return { enabled: true, startIndex, endIndex };
}
