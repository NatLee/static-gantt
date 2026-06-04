'use client';

import React from 'react';
import { Diamond } from 'lucide-react';
import { Milestone, GanttAction } from '@/types';
import { formatDateFull, dateToOffset } from '@/lib/dateUtils';
import { PROJECT_START_DATE } from '@/data/defaultProject';
import { PIXELS_PER_DAY, Z } from '@/lib/ganttLayout';

const MS_PER_DAY = 86400000;

interface MilestoneMarkersProps {
  milestones: Milestone[];
  zoomScale: number;
  timelineStartDay: number;
  totalHeight: number;
  dispatch: React.Dispatch<GanttAction>;
}

export default function MilestoneMarkers({
  milestones,
  zoomScale,
  timelineStartDay,
  totalHeight,
  dispatch,
}: MilestoneMarkersProps) {
  const ppd = PIXELS_PER_DAY * zoomScale;

  // Derive "today" on every render (matching GridBackground's calculation) so
  // the dashed TODAY line never drifts a day apart from the grid's today column
  // across a long-lived session that spans local midnight.
  const todayOffset = dateToOffset(new Date());

  const todayX = (todayOffset - timelineStartDay) * ppd;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: totalHeight, pointerEvents: 'none', zIndex: Z.barsHover }}>
      {/* TODAY marker */}
      <div
        style={{
          position: 'absolute',
          left: todayX,
          top: 0,
          width: 0,
          height: totalHeight,
          borderLeft: '2px dashed #ef4444',
          zIndex: Z.barsHover,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: -20,
            width: 40,
            textAlign: 'center',
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: '1px',
            color: '#ef4444',
            background: 'rgba(239,68,68,0.15)',
            borderRadius: 4,
            padding: '2px 4px',
          }}
        >
          TODAY
        </div>
      </div>

      {/* Milestone markers */}
      {milestones.map((ms) => {
        const msOffset = Math.round(
          (new Date(ms.date).getTime() - PROJECT_START_DATE.getTime()) / MS_PER_DAY
        );
        const x = (msOffset - timelineStartDay) * ppd;

        return (
          <div key={ms.id} style={{ position: 'absolute', left: x, top: 0, height: totalHeight, zIndex: Z.barsHover }}>
            {/* Vertical line */}
            <div
              className={ms.lineClass}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 2,
                height: totalHeight,
                opacity: 0.6,
              }}
            />

            {/* Floating label */}
            <div
              className={`milestone-label clickable ${ms.colorClass}`}
              onClick={() =>
                dispatch({
                  type: 'OPEN_DIALOG',
                  dialog: { type: 'edit-milestone', context: { milestoneId: ms.id } },
                })
              }
              style={{
                position: 'absolute',
                top: 4,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '4px 8px',
                borderRadius: 8,
                border: '1px solid',
                fontSize: 10,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                pointerEvents: 'auto',
                cursor: 'pointer',
                minWidth: 80,
              }}
            >
              <span className="milestone-name-text" style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Diamond size={10} />
                {ms.name}
              </span>
              <span className="milestone-date" style={{ fontSize: 9, opacity: 0.8 }}>
                {formatDateFull(new Date(ms.date))}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
