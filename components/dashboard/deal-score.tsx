'use client';

import type { DealMetrics, LTRMetrics, FlipMetrics, BRRRRMetrics, WholesaleMetrics, Strategy } from '@/lib/types';

type AnyMetrics = DealMetrics | LTRMetrics | FlipMetrics | BRRRRMetrics | WholesaleMetrics;

interface Props {
  metrics: AnyMetrics;
  strategy?: Strategy;
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

function getFactors(metrics: AnyMetrics, strategy: Strategy): { label: string; score: number; weight: number }[] {
  switch (strategy) {
    case 'str': {
      const m = metrics as DealMetrics;
      return [
        { label: 'CoC', score: scoreMetric(m.cocReturn, 10, 5), weight: 0.25 },
        { label: 'CF', score: scoreMetric(m.monthlyCashFlow, 500, 0), weight: 0.2 },
        { label: 'Cap', score: scoreMetric(m.capRate, 8, 5), weight: 0.15 },
        { label: 'DSCR', score: isFinite(m.dscr) ? scoreMetric(m.dscr, 1.25, 1.0) : 100, weight: 0.15 },
        { label: 'B/E', score: scoreMetric(m.breakEvenOccupancy, 55, 75, true), weight: 0.15 },
        { label: 'Yield', score: scoreMetric(m.grossRentalYield, 10, 7), weight: 0.1 },
      ];
    }
    case 'ltr': {
      const m = metrics as LTRMetrics;
      return [
        { label: 'CoC', score: scoreMetric(m.cocReturn, 10, 5), weight: 0.25 },
        { label: 'CF', score: scoreMetric(m.monthlyCashFlow, 200, 0), weight: 0.2 },
        { label: 'Cap', score: scoreMetric(m.capRate, 7, 4), weight: 0.15 },
        { label: 'DSCR', score: isFinite(m.dscr) ? scoreMetric(m.dscr, 1.25, 1.0) : 100, weight: 0.15 },
        { label: '1%', score: m.onePercentRule ? 100 : 40, weight: 0.15 },
        { label: 'GRM', score: scoreMetric(m.grm, 10, 15, true), weight: 0.1 },
      ];
    }
    case 'flip': {
      const m = metrics as FlipMetrics;
      return [
        { label: 'ROI', score: scoreMetric(m.roi, 20, 10), weight: 0.3 },
        { label: 'Profit', score: scoreMetric(m.netProfit, 40000, 15000), weight: 0.25 },
        { label: 'Margin', score: scoreMetric(m.profitMargin, 15, 8), weight: 0.2 },
        { label: '70%', score: m.meetsSeventyRule ? 100 : 30, weight: 0.25 },
      ];
    }
    case 'brrrr': {
      const m = metrics as BRRRRMetrics;
      return [
        { label: 'Cash', score: m.isInfiniteReturn ? 100 : scoreMetric(m.cashLeftInDeal, 5000, 30000, true), weight: 0.3 },
        { label: 'CoC', score: m.isInfiniteReturn ? 100 : scoreMetric(m.postRefiCocReturn, 15, 8), weight: 0.25 },
        { label: 'CF', score: scoreMetric(m.monthlyCashFlow, 200, 0), weight: 0.2 },
        { label: 'DSCR', score: scoreMetric(m.postRefiDscr, 1.25, 1.0), weight: 0.15 },
        { label: 'Cap', score: scoreMetric(m.capRate, 7, 4), weight: 0.1 },
      ];
    }
    case 'wholesale': {
      const m = metrics as WholesaleMetrics;
      return [
        { label: 'Spread', score: scoreMetric(m.spreadVsAsking, 10000, 0), weight: 0.35 },
        { label: 'Fee', score: scoreMetric(m.assignmentFee, 15000, 5000), weight: 0.25 },
        { label: '70%', score: m.meetsSeventyRule ? 100 : 30, weight: 0.25 },
        { label: 'ROI', score: scoreMetric(m.roiOnEarnest, 500, 200), weight: 0.15 },
      ];
    }
  }
}

export default function DealScore({ metrics, strategy = 'str' }: Props) {
  const factors = getFactors(metrics, strategy);
  const composite = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0),
  );
  const { letter, color, bgColor } = getGrade(composite);

  return (
    <div className="rounded-lg border border-border-default bg-bg-surface px-4 py-2.5 flex items-center gap-4">
      <div className="flex items-center gap-2.5 shrink-0">
        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
          <span className="text-lg font-black text-white">{letter}</span>
        </div>
        <div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider">Deal Score</div>
          <div className={`text-sm font-bold ${color}`}>{composite}/100</div>
        </div>
      </div>

      <div className="w-px h-8 bg-border-default shrink-0 hidden sm:block" />

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
