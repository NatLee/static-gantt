'use client';

import React from 'react';

interface GridBackgroundProps {
  totalRows: number;
  totalWidth: number;
  totalHeight: number;
}

export default function GridBackground({ totalWidth, totalHeight }: GridBackgroundProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: totalWidth,
        height: totalHeight,
        pointerEvents: 'none',
        backgroundImage: [
          'linear-gradient(to right, var(--border-color) 1px, transparent 1px)',
          'linear-gradient(to bottom, transparent 0, transparent calc(var(--row-height) - 1px), var(--border-color) calc(var(--row-height) - 1px), var(--border-color) var(--row-height))',
          'linear-gradient(to bottom, var(--bg-row-even) 0, var(--bg-row-even) var(--row-height), var(--bg-row-odd) var(--row-height), var(--bg-row-odd) calc(2 * var(--row-height)))',
        ].join(','),
        backgroundSize: [
          'var(--col-width) 100%',
          '100% var(--row-height)',
          '100% calc(2 * var(--row-height))',
        ].join(','),
        backgroundRepeat: 'repeat',
      }}
    />
  );
}
