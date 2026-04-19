'use client';

import { useState, useMemo } from 'react';
import type { DealInputs, Strategy } from '@/lib/types';
import { calculateAllStrategies } from '@/lib/calculations/index';
import { formatCurrency, formatPercent, formatDSCR } from '@/lib/format';

interface Props {
  inputs: DealInputs;
  onOpenStrategy: (s: Strategy) => void;
}

interface ColumnData {
  strategy: Strategy;
  label: string;
  icon: string;
  topMetrics: { label: string; value: string; color: 'green' | 'amber' | 'red' | 'neutral' }[];
  grade: { letter: string; score: number; color: string };
  summary: string;
}

function getGrade(score: number): { letter: string; color: string } {
  if (score >= 85) return { letter: 'A', color: 'bg-accent-green text-white' };
  if (score >= 75) return { letter: 'B+', color: 'bg-accent-green/80 text-white' };
  if (score >= 65) return { letter: 'B', color: 'bg-accent-amber text-black' };
  if (score >= 50) return { letter: 'C', color: 'bg-accent-amber/70 text-black' };
  if (score >= 35) return { letter: 'D', color: 'bg-accent-red/80 text-white' };
  return { letter: 'F', color: 'bg-accent-red text-white' };
}

function scoreFor(value: number, good: number, marginal: number, lowerBetter = false): number {
  if (lowerBetter) {
    if (value <= good) return 100;
    if (value <= marginal) return 60;
    return 30;
  }
  if (value >= good) return 100;
  if (value >= marginal) return 60;
  return 30;
}

export default function CompareStrategies({ inputs, onOpenStrategy }: Props) {
  const [hidden, setHidden] = useState<Set<Strategy>>(new Set());

  const all = useMemo(() => calculateAllStrategies(inputs), [inputs]);

  const columns: ColumnData[] = useMemo(() => {
    const strColor = (v: number, g: number, m: number, lb = false): 'green' | 'amber' | 'red' => {
      if (lb) return v <= g ? 'green' : v <= m ? 'amber' : 'red';
      return v >= g ? 'green' : v >= m ? 'amber' : 'red';
    };

    // STR score
    const strScore = Math.round(
      scoreFor(all.str.cocReturn, 10, 5) * 0.3 +
      scoreFor(all.str.monthlyCashFlow, 500, 0) * 0.3 +
      scoreFor(all.str.capRate, 8, 5) * 0.2 +
      scoreFor(isFinite(all.str.dscr) ? all.str.dscr : 2, 1.25, 1.0) * 0.2
    );
    const strGrade = getGrade(strScore);

    // LTR score
    const ltrScore = Math.round(
      scoreFor(all.ltr.cocReturn, 10, 5) * 0.3 +
      scoreFor(all.ltr.monthlyCashFlow, 200, 0) * 0.3 +
      scoreFor(all.ltr.capRate, 7, 4) * 0.2 +
      scoreFor(isFinite(all.ltr.dscr) ? all.ltr.dscr : 2, 1.25, 1.0) * 0.2
    );
    const ltrGrade = getGrade(ltrScore);

    // Flip score
    const flipScore = Math.round(
      scoreFor(all.flip.roi, 20, 10) * 0.4 +
      scoreFor(all.flip.profitMargin, 15, 8) * 0.3 +
      (all.flip.meetsSeventyRule ? 100 : 30) * 0.3
    );
    const flipGrade = getGrade(flipScore);

    // BRRRR score
    const brrrrScore = Math.round(
      (all.brrrr.isInfiniteReturn ? 100 : scoreFor(all.brrrr.postRefiCocReturn, 15, 8)) * 0.4 +
      scoreFor(all.brrrr.monthlyCashFlow, 200, 0) * 0.3 +
      scoreFor(all.brrrr.postRefiDscr, 1.25, 1.0) * 0.3
    );
    const brrrrGrade = getGrade(brrrrScore);

    // Wholesale score
    const wholesaleScore = Math.round(
      scoreFor(all.wholesale.spreadVsAsking, 10000, 0) * 0.5 +
      (all.wholesale.meetsSeventyRule ? 100 : 30) * 0.5
    );
    const wholesaleGrade = getGrade(wholesaleScore);

    return [
      {
        strategy: 'str' as Strategy,
        label: 'STR',
        icon: '🏠',
        topMetrics: [
          { label: 'Monthly CF', value: formatCurrency(all.str.monthlyCashFlow), color: strColor(all.str.monthlyCashFlow, 500, 0) },
          { label: 'CoC', value: formatPercent(all.str.cocReturn), color: strColor(all.str.cocReturn, 10, 5) },
          { label: 'Cap Rate', value: formatPercent(all.str.capRate), color: strColor(all.str.capRate, 8, 5) },
          { label: 'DSCR', value: formatDSCR(all.str.dscr), color: isFinite(all.str.dscr) ? strColor(all.str.dscr, 1.25, 1.0) : 'neutral' },
        ],
        grade: { ...strGrade, score: strScore },
        summary: `${formatCurrency(all.str.grossRevenue)}/yr revenue`,
      },
      {
        strategy: 'ltr' as Strategy,
        label: 'LTR',
        icon: '🔑',
        topMetrics: [
          { label: 'Monthly CF', value: formatCurrency(all.ltr.monthlyCashFlow), color: strColor(all.ltr.monthlyCashFlow, 200, 0) },
          { label: 'CoC', value: formatPercent(all.ltr.cocReturn), color: strColor(all.ltr.cocReturn, 10, 5) },
          { label: 'Cap Rate', value: formatPercent(all.ltr.capRate), color: strColor(all.ltr.capRate, 7, 4) },
          { label: '1% Rule', value: all.ltr.onePercentRule ? 'PASS' : 'FAIL', color: all.ltr.onePercentRule ? 'green' : 'amber' },
        ],
        grade: { ...ltrGrade, score: ltrScore },
        summary: `${formatCurrency(all.ltr.monthlyRent)}/mo rent`,
      },
      {
        strategy: 'flip' as Strategy,
        label: 'Flip',
        icon: '🔨',
        topMetrics: [
          { label: 'Net Profit', value: formatCurrency(all.flip.netProfit), color: strColor(all.flip.netProfit, 30000, 10000) },
          { label: 'ROI', value: formatPercent(all.flip.roi), color: strColor(all.flip.roi, 20, 10) },
          { label: 'Margin', value: formatPercent(all.flip.profitMargin), color: strColor(all.flip.profitMargin, 15, 8) },
          { label: '70% Rule', value: all.flip.meetsSeventyRule ? 'PASS' : 'FAIL', color: all.flip.meetsSeventyRule ? 'green' : 'red' },
        ],
        grade: { ...flipGrade, score: flipScore },
        summary: `${all.flip.totalHoldMonths}mo hold`,
      },
      {
        strategy: 'brrrr' as Strategy,
        label: 'BRRRR',
        icon: '♻️',
        topMetrics: [
          { label: 'Cash Left', value: all.brrrr.isInfiniteReturn ? '$0' : formatCurrency(all.brrrr.cashLeftInDeal), color: all.brrrr.cashLeftInDeal <= 0 ? 'green' : all.brrrr.cashLeftInDeal <= 25000 ? 'amber' : 'red' },
          { label: 'Post-Refi CoC', value: all.brrrr.isInfiniteReturn ? '∞' : formatPercent(all.brrrr.postRefiCocReturn), color: all.brrrr.isInfiniteReturn ? 'green' : strColor(all.brrrr.postRefiCocReturn, 15, 8) },
          { label: 'Monthly CF', value: formatCurrency(all.brrrr.monthlyCashFlow), color: strColor(all.brrrr.monthlyCashFlow, 200, 0) },
          { label: 'DSCR', value: formatDSCR(all.brrrr.postRefiDscr), color: strColor(all.brrrr.postRefiDscr, 1.25, 1.0) },
        ],
        grade: { ...brrrrGrade, score: brrrrScore },
        summary: `Refi: ${formatCurrency(all.brrrr.refiLoanAmount)}`,
      },
      {
        strategy: 'wholesale' as Strategy,
        label: 'Wholesale',
        icon: '📝',
        topMetrics: [
          { label: 'Assignment Fee', value: formatCurrency(all.wholesale.assignmentFee), color: strColor(all.wholesale.assignmentFee, 10000, 5000) },
          { label: 'MAO Spread', value: formatCurrency(all.wholesale.spreadVsAsking), color: strColor(all.wholesale.spreadVsAsking, 5000, 0) },
          { label: 'ROI on Earnest', value: formatPercent(all.wholesale.roiOnEarnest), color: strColor(all.wholesale.roiOnEarnest, 500, 200) },
          { label: '70% Rule', value: all.wholesale.meetsSeventyRule ? 'PASS' : 'FAIL', color: all.wholesale.meetsSeventyRule ? 'green' : 'red' },
        ],
        grade: { ...wholesaleGrade, score: wholesaleScore },
        summary: `MAO: ${formatCurrency(all.wholesale.maxAllowableOffer)}`,
      },
    ];
  }, [all]);

  // Find the top-scored strategy
  const visible = columns.filter((c) => !hidden.has(c.strategy));
  const topScore = Math.max(...visible.map((c) => c.grade.score));
  const winner = visible.find((c) => c.grade.score === topScore)?.strategy;

  function toggleHidden(s: Strategy) {
    const next = new Set(hidden);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    setHidden(next);
  }

  const colorClass = {
    green: 'text-accent-green',
    amber: 'text-accent-amber',
    red: 'text-accent-red',
    neutral: 'text-text-foreground',
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border-default bg-bg-surface p-4">
        <h3 className="text-sm font-semibold text-text-foreground mb-1">Same Property, 5 Strategies</h3>
        <p className="text-[11px] text-text-muted mb-3">
          How does this property perform under each strategy? Click a column to see the full analysis.
        </p>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {columns.map((c) => {
            const isHidden = hidden.has(c.strategy);
            return (
              <button
                key={c.strategy}
                type="button"
                onClick={() => toggleHidden(c.strategy)}
                className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-colors ${
                  isHidden
                    ? 'border-border-default text-text-muted bg-bg-base line-through'
                    : 'border-accent-blue bg-accent-blue-bg text-accent-blue'
                }`}
              >
                <span className="mr-1">{c.icon}</span>
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Strategy columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {visible.map((c) => {
            const isWinner = c.strategy === winner && visible.length > 1;
            return (
              <div
                key={c.strategy}
                className={`rounded-lg border bg-bg-elevated p-3 flex flex-col relative ${
                  isWinner ? 'border-accent-green ring-1 ring-accent-green/30' : 'border-border-default'
                }`}
              >
                {isWinner && (
                  <div className="absolute -top-2 left-3 px-2 py-0.5 rounded-full bg-accent-green text-white text-[9px] font-bold">
                    ★ BEST FIT
                  </div>
                )}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">{c.icon}</span>
                    <span className="text-sm font-bold text-text-foreground">{c.label}</span>
                  </div>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm ${c.grade.color}`}>
                    {c.grade.letter}
                  </div>
                </div>

                <div className="text-[9px] text-text-muted mb-2">{c.summary}</div>

                <div className="space-y-1 flex-1">
                  {c.topMetrics.map((m) => (
                    <div key={m.label} className="flex justify-between text-[11px]">
                      <span className="text-text-muted">{m.label}</span>
                      <span className={`font-semibold ${colorClass[m.color]}`}>{m.value}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenStrategy(c.strategy)}
                  className="mt-3 w-full h-7 text-[10px] font-medium rounded-md bg-bg-base border border-border-default hover:border-accent-blue hover:text-accent-blue text-text-muted transition-colors"
                >
                  Open full analysis →
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {visible.length >= 2 && (
        <div className="rounded-lg border border-accent-blue/30 bg-accent-blue-bg p-3 text-[11px] text-accent-blue">
          💡 <span className="font-semibold">Cross-Strategy Insight:</span>{' '}
          {winner && `This property scores highest as a ${columns.find((c) => c.strategy === winner)?.label} (${columns.find((c) => c.strategy === winner)?.grade.letter}). `}
          Switch to that tab for the full analysis, or click &quot;Run AI Analysis&quot; for a detailed cross-strategy verdict.
        </div>
      )}
    </div>
  );
}
