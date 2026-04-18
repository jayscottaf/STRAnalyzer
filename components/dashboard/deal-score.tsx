'use client';

import type { DealMetrics } from '@/lib/types';
import { THRESHOLDS } from '@/lib/constants';

interface Props {
  metrics: DealMetrics;
}

function scoreMetric(value: number, good: number, marginal: number, lowerBetter = false): number {
  if (lowerBetter) {
    if (value <= good) return 100;
    if (value <= marginal) return 50 + 50 * ((marginal - value) / (marginal - good));
    return Math.max(0, 50 * (1 - (value - marginal) / marginal));
  }
  if (value >= good) return 100;
  if (value >= marginal) return 50 + 50 * ((value - marginal) / (good - marginal));
  return Math.max(0, 50 * (value / marginal));
}

function getGrade(score: number): { letter: string; color: string; bgColor: string } {
  if (score >= 93) return { letter: 'A+', color: 'text-accent-green', bgColor: 'bg-accent-green' };
  if (score >= 85) return { letter: 'A', color: 'text-accent-green', bgColor: 'bg-accent-green' };
  if (score >= 78) return { letter: 'B+', color: 'text-accent-green', bgColor: 'bg-accent-green' };
  if (score >= 70) return { letter: 'B', color: 'text-accent-amber', bgColor: 'bg-accent-amber' };
  if (score >= 60) return { letter: 'C+', color: 'text-accent-amber', bgColor: 'bg-accent-amber' };
  if (score >= 50) return { letter: 'C', color: 'text-accent-amber', bgColor: 'bg-accent-amber' };
  if (score >= 40) return { letter: 'D', color: 'text-accent-red', bgColor: 'bg-accent-red' };
  return { letter: 'F', color: 'text-accent-red', bgColor: 'bg-accent-red' };
}

export default function DealScore({ metrics }: Props) {
  const cocScore = scoreMetric(metrics.cocReturn, THRESHOLDS.coc.good, THRESHOLDS.coc.marginal);
  const capScore = scoreMetric(metrics.capRate, THRESHOLDS.cap.good, THRESHOLDS.cap.marginal);
  const dscrScore = isFinite(metrics.dscr)
    ? scoreMetric(metrics.dscr, THRESHOLDS.dscr.good, THRESHOLDS.dscr.marginal)
    : 100;
  const cfScore = scoreMetric(
    metrics.monthlyCashFlow,
    THRESHOLDS.monthlyCashFlow.good,
    THRESHOLDS.monthlyCashFlow.marginal,
  );
  const beScore = scoreMetric(
    metrics.breakEvenOccupancy,
    THRESHOLDS.breakEvenOccupancy.good,
    THRESHOLDS.breakEvenOccupancy.marginal,
    true,
  );
  const yieldScore = scoreMetric(
    metrics.grossRentalYield,
    THRESHOLDS.grossYield.good,
    THRESHOLDS.grossYield.marginal,
  );

  const composite = Math.round(
    cocScore * 0.25 + capScore * 0.15 + dscrScore * 0.15 + cfScore * 0.2 + beScore * 0.15 + yieldScore * 0.1,
  );

  const { letter, color, bgColor } = getGrade(composite);

  const factors = [
    { label: 'CoC', score: cocScore },
    { label: 'CF', score: cfScore },
    { label: 'Cap', score: capScore },
    { label: 'DSCR', score: dscrScore },
    { label: 'B/E', score: beScore },
    { label: 'Yield', score: yieldScore },
  ];

  return (
    <div className="rounded-lg border border-border-default bg-bg-surface px-4 py-2.5 flex items-center gap-4">
      {/* Grade badge */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
          <span className="text-lg font-black text-white">{letter}</span>
        </div>
        <div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider">Deal Score</div>
          <div className={`text-sm font-bold ${color}`}>{composite}/100</div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-border-default shrink-0 hidden sm:block" />

      {/* Factor bars — horizontal row */}
      <div className="flex-1 grid grid-cols-3 sm:grid-cols-6 gap-x-3 gap-y-1">
        {factors.map(({ label, score }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="text-[9px] text-text-muted w-8 shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-bg-base rounded-full overflow-hidden min-w-[30px]">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${score}%`,
                  backgroundColor: score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
            <span className="text-[9px] text-text-muted w-5 text-right">{Math.round(score)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
