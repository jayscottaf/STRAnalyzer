'use client';

import type { BRRRRMetrics } from '@/lib/types';
import { formatCurrency, formatPercent, formatDSCR } from '@/lib/format';
import MetricCard from './metric-card';

interface Props {
  metrics: BRRRRMetrics;
}

export default function BRRRRDashboard({ metrics }: Props) {
  const cashLeftColor: 'green' | 'amber' | 'red' =
    metrics.cashLeftInDeal <= 0 ? 'green' :
    metrics.cashLeftInDeal <= 25000 ? 'amber' : 'red';
  const cashFlowColor: 'green' | 'amber' | 'red' =
    metrics.monthlyCashFlow >= 200 ? 'green' :
    metrics.monthlyCashFlow >= 0 ? 'amber' : 'red';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-fr">
        <MetricCard
          label="Cash Left in Deal"
          value={metrics.isInfiniteReturn ? '$0' : formatCurrency(metrics.cashLeftInDeal)}
          subtitle={metrics.isInfiniteReturn ? 'Infinite CoC ✨' : `Pulled out: ${formatCurrency(metrics.refiCashOut)}`}
          tooltip="Cash remaining in the deal after refi. $0 = infinite return (the BRRRR dream)."
          color={cashLeftColor}
          large
        />
        <MetricCard
          label="Post-Refi CoC"
          value={metrics.isInfiniteReturn ? '∞' : formatPercent(metrics.postRefiCocReturn)}
          subtitle="After refinance"
          tooltip="Cash-on-cash return based on cash left in the deal."
          color={metrics.isInfiniteReturn ? 'green' : metrics.postRefiCocReturn >= 15 ? 'green' : metrics.postRefiCocReturn >= 8 ? 'amber' : 'red'}
          large
        />
        <MetricCard
          label="Monthly Cash Flow"
          value={formatCurrency(metrics.monthlyCashFlow)}
          subtitle={`Annual: ${formatCurrency(metrics.annualCashFlow)}`}
          color={cashFlowColor}
          large
        />
        <MetricCard
          label="Post-Refi DSCR"
          value={formatDSCR(metrics.postRefiDscr)}
          subtitle={metrics.postRefiDscr >= 1.2 ? 'Lender eligible' : 'Below 1.20'}
          color={metrics.postRefiDscr >= 1.25 ? 'green' : metrics.postRefiDscr >= 1.0 ? 'amber' : 'red'}
          large
        />
        <MetricCard
          label="All-In Cost"
          value={formatCurrency(metrics.allInCost)}
          subtitle={`ARV: ${formatCurrency(metrics.arv)}`}
          tooltip="Purchase + reno + interest + points + closing. Lower than ARV is essential."
          color={metrics.allInCost < metrics.arv * 0.8 ? 'green' : metrics.allInCost < metrics.arv ? 'amber' : 'red'}
        />
        <MetricCard
          label="Refi Loan"
          value={formatCurrency(metrics.refiLoanAmount)}
          subtitle={`${formatPercent((metrics.refiLoanAmount / metrics.arv) * 100)} of ARV`}
          color="neutral"
        />
        <MetricCard
          label="Refi Monthly Pmt"
          value={formatCurrency(metrics.refiMonthlyPayment)}
          subtitle="P&I only"
          color="neutral"
        />
        <MetricCard
          label="Cap Rate"
          value={formatPercent(metrics.capRate)}
          subtitle="NOI / ARV"
          color={metrics.capRate >= 8 ? 'green' : metrics.capRate >= 5 ? 'amber' : 'red'}
        />
        <MetricCard
          label="Phase 1 Interest"
          value={formatCurrency(metrics.phase1InterestCost)}
          subtitle="Hard money cost"
          color="neutral"
        />
        <MetricCard
          label="Initial Capital"
          value={formatCurrency(metrics.initialCashInvested)}
          subtitle="Before refi"
          color="neutral"
        />
        <MetricCard
          label="Monthly Rent"
          value={formatCurrency(metrics.monthlyRent)}
          subtitle={`GRM: ${metrics.grm.toFixed(1)}`}
          color="neutral"
        />
      </div>

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
