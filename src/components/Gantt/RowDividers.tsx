'use client';

import React from 'react';
import { ROW_HEIGHT, Z } from '@/lib/ganttLayout';

interface RowDividersProps {
  totalHeight: number;
}

export default function RowDividers({ totalHeight }: RowDividersProps) {
  return (
    <div
      aria-hidden
      style={{
        gridRow: 2,
        gridColumn: '1 / -1',
        position: 'relative',
        width: '100%',
        height: totalHeight,
        pointerEvents: 'none',
        zIndex: Z.stickyCol + 1,
        backgroundImage:
          `linear-gradient(to bottom, transparent calc(${ROW_HEIGHT}px - 1px), var(--border-color) calc(${ROW_HEIGHT}px - 1px), var(--border-color) ${ROW_HEIGHT}px)`,
        backgroundRepeat: 'repeat-y',
        backgroundSize: `100% ${ROW_HEIGHT}px`,
      }}
    />
  );
}
