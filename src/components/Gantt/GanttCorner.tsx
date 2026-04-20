'use client';

import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface GanttCornerProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function GanttCorner({ onZoomIn, onZoomOut }: GanttCornerProps) {
  return (
    <div
      style={{
        height: 'var(--header-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid var(--border-color)',
        borderRight: '1px solid var(--border-color)',
        boxShadow: '2px 0 12px rgba(0,0,0,0.1)',
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '1px',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
        }}
      >
        Task Structure
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          className="btn-glass"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
          onClick={onZoomOut}
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
        <button
          className="btn-glass"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
          onClick={onZoomIn}
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
      </div>
    </div>
  );
}
