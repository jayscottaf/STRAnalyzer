'use client';

import type { BRRRRMetrics } from '@/lib/types';
import { formatCurrency, formatPercent, formatDSCR } from '@/lib/format';
import UniversalMetricsGrid, { type MetricDef } from './universal-metrics-grid';

interface Props {
  metrics: BRRRRMetrics;
}

export default function BRRRRDashboard({ metrics }: Props) {
  const items: MetricDef[] = [
    {
      key: 'cashLeftInDeal',
      label: 'Cash Left in Deal',
      value: metrics.isInfiniteReturn ? '$0' : formatCurrency(metrics.cashLeftInDeal),
      rawValue: metrics.cashLeftInDeal,
      formatFn: (v) => v <= 0 ? '$0' : formatCurrency(v),
      subtitle: metrics.isInfiniteReturn ? 'Infinite CoC' : `Pulled out: ${formatCurrency(metrics.refiCashOut)}`,
      color: metrics.cashLeftInDeal <= 0 ? 'green' : metrics.cashLeftInDeal <= 25000 ? 'amber' : 'red',
      benchmark: 'Target: $0',
      large: true,
    },
    {
      key: 'postRefiCocReturn',
      label: 'Post-Refi CoC',
      value: metrics.isInfiniteReturn ? '∞' : formatPercent(metrics.postRefiCocReturn),
      rawValue: metrics.isInfiniteReturn ? undefined : metrics.postRefiCocReturn,
      formatFn: (v) => formatPercent(v),
      subtitle: 'After refinance',
      color: metrics.isInfiniteReturn ? 'green' : metrics.postRefiCocReturn >= 15 ? 'green' : metrics.postRefiCocReturn >= 8 ? 'amber' : 'red',
      large: true,
    },
    {
      key: 'monthlyCashFlow',
      label: 'Monthly Cash Flow',
      value: formatCurrency(metrics.monthlyCashFlow),
      rawValue: metrics.monthlyCashFlow,
      formatFn: (v) => formatCurrency(v),
      subtitle: `Annual: ${formatCurrency(metrics.annualCashFlow)}`,
      color: metrics.monthlyCashFlow >= 200 ? 'green' : metrics.monthlyCashFlow >= 0 ? 'amber' : 'red',
      benchmark: 'vs $200+ target',
      large: true,
    },
    {
      key: 'postRefiDscr',
      label: 'Post-Refi DSCR',
      value: formatDSCR(metrics.postRefiDscr),
      rawValue: isFinite(metrics.postRefiDscr) ? metrics.postRefiDscr : undefined,
      formatFn: (v) => formatDSCR(v),
      subtitle: metrics.postRefiDscr >= 1.2 ? 'Lender eligible' : 'Below 1.20',
      color: metrics.postRefiDscr >= 1.25 ? 'green' : metrics.postRefiDscr >= 1.0 ? 'amber' : 'red',
      benchmark: 'Lender min: 1.20',
      large: true,
    },
    {
      key: 'allInCost',
      label: 'All-In Cost',
      value: formatCurrency(metrics.allInCost),
      rawValue: metrics.allInCost,
      formatFn: (v) => formatCurrency(v),
      subtitle: `ARV: ${formatCurrency(metrics.arv)}`,
      color: metrics.allInCost < metrics.arv * 0.8 ? 'green' : metrics.allInCost < metrics.arv ? 'amber' : 'red',
    },
    {
      key: 'refiLoanAmount',
      label: 'Refi Loan',
      value: formatCurrency(metrics.refiLoanAmount),
      rawValue: metrics.refiLoanAmount,
      formatFn: (v) => formatCurrency(v),
      subtitle: `${formatPercent((metrics.refiLoanAmount / metrics.arv) * 100)} of ARV`,
      color: 'neutral',
    },
    {
      key: 'refiMonthlyPayment',
      label: 'Refi Monthly Pmt',
      value: formatCurrency(metrics.refiMonthlyPayment),
      rawValue: metrics.refiMonthlyPayment,
      formatFn: (v) => formatCurrency(v),
      subtitle: 'P&I only',
      color: 'neutral',
    },
    {
      key: 'capRate',
      label: 'Cap Rate',
      value: formatPercent(metrics.capRate),
      rawValue: metrics.capRate,
      formatFn: (v) => formatPercent(v),
      subtitle: 'NOI / ARV',
      color: metrics.capRate >= 8 ? 'green' : metrics.capRate >= 5 ? 'amber' : 'red',
    },
    {
      key: 'phase1InterestCost',
      label: 'Phase 1 Interest',
      value: formatCurrency(metrics.phase1InterestCost),
      rawValue: metrics.phase1InterestCost,
      formatFn: (v) => formatCurrency(v),
      subtitle: 'Hard money cost',
      color: 'neutral',
    },
    {
      key: 'initialCashInvested',
      label: 'Initial Capital',
      value: formatCurrency(metrics.initialCashInvested),
      rawValue: metrics.initialCashInvested,
      formatFn: (v) => formatCurrency(v),
      subtitle: 'Before refi',
      color: 'neutral',
    },
    {
      key: 'monthlyRent',
      label: 'Monthly Rent',
      value: formatCurrency(metrics.monthlyRent),
      rawValue: metrics.monthlyRent,
      formatFn: (v) => formatCurrency(v),
      subtitle: `GRM: ${metrics.grm.toFixed(1)}`,
      color: 'neutral',
    },
  ];

  return (
    <div className="space-y-4">
      <UniversalMetricsGrid items={items} storagePrefix="brrrr" />

      {/* Phase Timeline */}
      <div className="rounded-lg border border-border-default bg-bg-surface p-4">
        <h3 className="text-sm font-semibold text-text-foreground mb-3">BRRRR Timeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <PhaseStep num={1} title="Buy" detail={`${formatCurrency(metrics.purchasePrice)} purchase`} color="blue" />
          <PhaseStep num={2} title="Rehab" detail={`${formatCurrency(metrics.renovationBudget)} budget`} color="amber" />
          <PhaseStep num={3} title="Rent" detail={`${formatCurrency(metrics.monthlyRent)}/mo`} color="green" />
          <PhaseStep num={4} title="Refi" detail={`${formatCurrency(metrics.refiCashOut)} cash out`} color="blue" />
        </div>
      </div>
    </div>
  );
}

function PhaseStep({ num, title, detail, color }: {
  num: number;
  title: string;
  detail: string;
  color: 'blue' | 'green' | 'amber';
}) {
  const colorMap = {
    blue: 'bg-accent-blue-bg text-accent-blue border-accent-blue/30',
    green: 'bg-accent-green-bg text-accent-green border-accent-green/30',
    amber: 'bg-accent-amber-bg text-accent-amber border-accent-amber/30',
  };
  return (
    <div className={`rounded-lg border p-3 ${colorMap[color]}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-70">Phase {num}</div>
      <div className="text-sm font-bold">{title}</div>
      <div className="text-[10px] mt-1 opacity-80">{detail}</div>
    </div>
  );
}
