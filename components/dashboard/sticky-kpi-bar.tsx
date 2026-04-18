'use client';

import { useEffect, useRef, useState } from 'react';
import type { DealMetrics } from '@/lib/types';
import { formatCurrency, formatPercent, formatDSCR } from '@/lib/format';
import { THRESHOLDS } from '@/lib/constants';

interface Props {
  metrics: DealMetrics;
  observeTargetId: string;
}

function colorFor(value: number, good: number, marginal: number, lowerBetter = false): string {
  if (lowerBetter) {
    if (value <= good) return 'text-accent-green';
    if (value <= marginal) return 'text-accent-amber';
    return 'text-accent-red';
  }
  if (value >= good) return 'text-accent-green';
  if (value >= marginal) return 'text-accent-amber';
  return 'text-accent-red';
}

export default function StickyKpiBar({ metrics, observeTargetId }: Props) {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const target = document.getElementById(observeTargetId);
    if (!target) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Show sticky bar when target (main KPI grid) is NOT intersecting
        setVisible(!entries[0].isIntersecting);
      },
      {
        root: null,
        rootMargin: '-50px 0px 0px 0px',
        threshold: 0,
      },
    );

    observerRef.current.observe(target);
    return () => observerRef.current?.disconnect();
  }, [observeTargetId]);

  return (
    <div
      className={`sticky top-0 z-20 bg-bg-surface/95 backdrop-blur-md border-b border-border-default transition-all duration-200 ${
        visible ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 pointer-events-none -mt-4'
      } overflow-hidden`}
    >
      <div className="grid grid-cols-4 gap-2 px-4 py-2 text-xs">
        <div>
          <div className="text-[9px] text-text-muted uppercase tracking-wider">Monthly CF</div>
          <div className={`font-bold ${colorFor(metrics.monthlyCashFlow, THRESHOLDS.monthlyCashFlow.good, THRESHOLDS.monthlyCashFlow.marginal)}`}>
            {formatCurrency(metrics.monthlyCashFlow)}
          </div>
        </div>
        <div>
          <div className="text-[9px] text-text-muted uppercase tracking-wider">CoC</div>
          <div className={`font-bold ${colorFor(metrics.cocReturn, THRESHOLDS.coc.good, THRESHOLDS.coc.marginal)}`}>
            {formatPercent(metrics.cocReturn)}
          </div>
        </div>
        <div>
          <div className="text-[9px] text-text-muted uppercase tracking-wider">Cap</div>
          <div className={`font-bold ${colorFor(metrics.capRate, THRESHOLDS.cap.good, THRESHOLDS.cap.marginal)}`}>
            {formatPercent(metrics.capRate)}
          </div>
        </div>
        <div>
          <div className="text-[9px] text-text-muted uppercase tracking-wider">DSCR</div>
          <div className={`font-bold ${isFinite(metrics.dscr) ? colorFor(metrics.dscr, THRESHOLDS.dscr.good, THRESHOLDS.dscr.marginal) : 'text-accent-blue'}`}>
            {formatDSCR(metrics.dscr)}
          </div>
        </div>
      </div>
    </div>
  );
}
