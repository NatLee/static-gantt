'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';

interface Props {
  phases: string[];
  current: string;
  onChange: (filter: string) => void;
}

/**
 * Phase filter rendered as a scrollable tab strip. Unlike a dropdown whose
 * option list grows unbounded with the number of phases, this control caps its
 * footprint and pages horizontally — the strip scrolls and prev/next chevrons
 * appear only when the tabs overflow the available width.
 */
export default function PhaseTabs({ phases, current, onChange }: Props) {
  const { t } = useI18n();
  const trackRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const left = el.scrollLeft > 1;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setOverflow(prev => (prev.left === left && prev.right === right ? prev : { left, right }));
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', measure);
      ro.disconnect();
    };
  }, [measure, phases.length]);

  // Keep the active tab in view when the filter changes programmatically.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const active = el.querySelector('[data-active="true"]') as HTMLElement | null;
    active?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [current]);

  const page = useCallback((dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(140, el.clientWidth * 0.8), behavior: 'smooth' });
  }, []);

  return (
    <div className="phase-tabs">
      <button
        type="button"
        className={`phase-tabs-pager${overflow.left ? '' : ' phase-tabs-pager-hidden'}`}
        onClick={() => page(-1)}
        title={t('toolbar.scrollPhasesLeft')}
        aria-label={t('toolbar.scrollPhasesLeft')}
        tabIndex={overflow.left ? 0 : -1}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      <div className="phase-tabs-track" ref={trackRef}>
        <button
          type="button"
          className={`phase-tab${current === 'ALL' ? ' phase-tab-active' : ''}`}
          data-active={current === 'ALL'}
          onClick={() => onChange('ALL')}
        >
          {t('toolbar.allPhases')}
        </button>
        {phases.map(phase => (
          <button
            key={phase}
            type="button"
            className={`phase-tab${current === phase ? ' phase-tab-active' : ''}`}
            data-active={current === phase}
            onClick={() => onChange(phase)}
            title={phase}
          >
            {phase}
          </button>
        ))}
      </div>

      <button
        type="button"
        className={`phase-tabs-pager${overflow.right ? '' : ' phase-tabs-pager-hidden'}`}
        onClick={() => page(1)}
        title={t('toolbar.scrollPhasesRight')}
        aria-label={t('toolbar.scrollPhasesRight')}
        tabIndex={overflow.right ? 0 : -1}
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
