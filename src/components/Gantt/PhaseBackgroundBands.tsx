'use client';

import React from 'react';
import { HierarchyMap } from '@/types';
import { ROW_HEIGHT } from '@/lib/ganttLayout';
import { hueFromString } from '@/lib/colorHash';
import { subPhaseKey } from '@/lib/phase';

interface PhaseBackgroundBandsProps {
  hierarchy: HierarchyMap;
  currentFilter: string;
  collapsedPhases: Set<string>;
  collapsedSubPhases: Set<string>;
  totalWidth: number;
}

export default function PhaseBackgroundBands({
  hierarchy,
  currentFilter,
  collapsedPhases,
  collapsedSubPhases,
  totalWidth,
}: PhaseBackgroundBandsProps) {
  const bands: React.ReactNode[] = [];
  let rowIndex = 0;

  Object.keys(hierarchy).forEach((master) => {
    if (currentFilter !== 'ALL' && currentFilter !== master) return;

    const masterHue = hueFromString(master);
    bands.push(
      <div
        key={`phase-band-${master}`}
        className="phase-band"
        style={{
          position: 'absolute',
          top: rowIndex * ROW_HEIGHT,
          left: 0,
          height: ROW_HEIGHT,
          width: totalWidth,
          background: `hsla(${masterHue}, 65%, 55%, 0.12)`,
          pointerEvents: 'none',
        }}
      />
    );
    rowIndex++;

    if (collapsedPhases.has(master)) return;

    const subs = hierarchy[master];
    Object.keys(subs).forEach((sub) => {
      bands.push(
        <div
          key={`sub-phase-band-${master}-${sub}`}
          className="sub-phase-band"
          style={{
            position: 'absolute',
            top: rowIndex * ROW_HEIGHT,
            left: 0,
            height: ROW_HEIGHT,
            width: totalWidth,
            background: `hsla(${masterHue}, 55%, 55%, 0.06)`,
            pointerEvents: 'none',
          }}
        />
      );
      rowIndex++;

      const collapseKey = subPhaseKey(master, sub);
      if (collapsedSubPhases.has(collapseKey)) return;
      rowIndex += subs[sub].length;
    });
  });

  return <>{bands}</>;
}
