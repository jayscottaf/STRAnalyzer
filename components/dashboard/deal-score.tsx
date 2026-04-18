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

function getGrade(score: number): { letter: string; color: string } {
  if (score >= 93) return { letter: 'A+', color: 'text-accent-green' };
  if (score >= 85) return { letter: 'A', color: 'text-accent-green' };
  if (score >= 78) return { letter: 'B+', color: 'text-accent-green/80' };
  if (score >= 70) return { letter: 'B', color: 'text-accent-amber' };
  if (score >= 60) return { letter: 'C+', color: 'text-accent-amber' };
  if (score >= 50) return { letter: 'C', color: 'text-accent-amber' };
  if (score >= 40) return { letter: 'D', color: 'text-accent-red' };
  return { letter: 'F', color: 'text-accent-red' };
}

export default function DealScore({ metrics }: Props) {
  const cocScore = scoreMetric(metrics.cocReturn, THRESHOLDS.coc.good, THRESHOLDS.coc.marginal);
  const capScore = scoreMetric(metrics.capRate, THRESHOLDS.cap.good, THRESHOLDS.cap.marginal);
  const dscrScore = isFinite(metrics.dscr)
    ? scoreMetric(metrics.dscr, THRESHOLDS.dscr.good, THRESHOLDS.dscr.marginal)
    : 100; // cash purchase
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
    (cocScore * 0.25 + capScore * 0.15 + dscrScore * 0.15 + cfScore * 0.2 + beScore * 0.15 + yieldScore * 0.1),
  );

  const { letter, color } = getGrade(composite);

  const factors = [
    { label: 'Cash-on-Cash', score: cocScore },
    { label: 'Cash Flow', score: cfScore },
    { label: 'Cap Rate', score: capScore },
    { label: 'DSCR', score: dscrScore },
    { label: 'Break-Even', score: beScore },
    { label: 'Yield', score: yieldScore },
  ];

  return (
    <div className="rounded-lg border border-border-default bg-bg-surface p-4">
      <div className="flex items-center gap-4">
        {/* Score circle */}
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#2e3240" strokeWidth="6" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke={composite >= 70 ? '#10b981' : composite >= 50 ? '#f59e0b' : '#ef4444'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(composite / 100) * 213.6} 213.6`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xl font-bold ${color}`}>{letter}</span>
            <span className="text-[9px] text-text-muted">{composite}/100</span>
          </div>
        </div>

        {/* Factor bars */}
        <div className="flex-1 space-y-1.5">
          {factors.map(({ label, score }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[9px] text-text-muted w-16 shrink-0">{label}</span>
              <div className="flex-1 h-1.5 bg-bg-base rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${score}%`,
                    backgroundColor: score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <span className="text-[9px] text-text-muted w-6 text-right">{Math.round(score)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
