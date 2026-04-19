'use client';

import type { LTRMetrics } from '@/lib/types';
import { formatCurrency, formatPercent, formatDSCR } from '@/lib/format';
import { THRESHOLDS } from '@/lib/constants';
import MetricCard from './metric-card';

interface Props {
  metrics: LTRMetrics;
}

function getColor(value: number, thresholds: { good: number; marginal: number }, lowerBetter = false): 'green' | 'amber' | 'red' {
  if (lowerBetter) {
    if (value <= thresholds.good) return 'green';
    if (value <= thresholds.marginal) return 'amber';
    return 'red';
  }
  if (value >= thresholds.good) return 'green';
  if (value >= thresholds.marginal) return 'amber';
  return 'red';
}

export default function LTRDashboard({ metrics }: Props) {
  const dscrSubtitle = !isFinite(metrics.dscr)
    ? 'Cash purchase'
    : metrics.dscr >= 1.2
    ? 'Lender eligible'
    : 'Marginal coverage';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-fr">
      <MetricCard
        label="Monthly Cash Flow"
        value={formatCurrency(metrics.monthlyCashFlow)}
        subtitle={`Annual: ${formatCurrency(metrics.annualCashFlow)}`}
        tooltip="Net monthly cash flow after all expenses and debt service."
        color={getColor(metrics.monthlyCashFlow, THRESHOLDS.monthlyCashFlow)}
        large
      />
      <MetricCard
        label="Cash-on-Cash Return"
        value={formatPercent(metrics.cocReturn)}
        subtitle={metrics.trueCocReturn !== null ? `w/ tax: ${formatPercent(metrics.trueCocReturn)}` : 'pre-tax'}
        tooltip="Annual cash flow / cash invested. 8%+ is strong for LTR."
        color={getColor(metrics.cocReturn, THRESHOLDS.coc)}
        large
      />
      <MetricCard
        label="Cap Rate"
        value={formatPercent(metrics.capRate)}
        subtitle="Unlevered return"
        color={getColor(metrics.capRate, THRESHOLDS.cap)}
        large
      />
      <MetricCard
        label="DSCR"
        value={formatDSCR(metrics.dscr)}
        subtitle={dscrSubtitle}
        color={isFinite(metrics.dscr) ? getColor(metrics.dscr, THRESHOLDS.dscr) : 'blue'}
        large
      />
      <MetricCard
        label="Monthly Rent"
        value={formatCurrency(metrics.monthlyRent)}
        subtitle={`Annual: ${formatCurrency(metrics.annualGrossRent)}`}
        color="neutral"
      />
      <MetricCard
        label="1% Rule"
        value={metrics.onePercentRule ? 'PASS' : 'FAIL'}
        subtitle={metrics.twoPercentRule ? '2% rule passes too' : 'below 2% rule'}
        tooltip="Monthly rent ≥ 1% of purchase price."
        color={metrics.onePercentRule ? 'green' : 'amber'}
      />
      <MetricCard
        label="GRM"
        value={metrics.grm.toFixed(1)}
        subtitle="Gross Rent Multiplier"
        tooltip="Purchase price / annual rent. Lower is better. 8-12 is typical."
        color={metrics.grm > 0 && metrics.grm <= 10 ? 'green' : metrics.grm <= 15 ? 'amber' : 'red'}
      />
      <MetricCard
        label="NOI"
        value={formatCurrency(metrics.noi)}
        subtitle="Before debt service"
        color="neutral"
      />
      <MetricCard
        label="Total Cash Required"
        value={formatCurrency(metrics.totalCashInvested)}
        subtitle={`LTV: ${formatPercent(metrics.ltv)}`}
        color="neutral"
      />
      <MetricCard
        label="Vacancy Loss"
        value={formatCurrency(metrics.vacancyLoss)}
        subtitle={`EGI: ${formatCurrency(metrics.effectiveGrossIncome)}`}
        color="neutral"
      />
      {metrics.irr !== null && (
        <MetricCard
          label="IRR (w/ Exit)"
          value={formatPercent(metrics.irr)}
          subtitle="After-tax exit"
          color={getColor(metrics.irr, THRESHOLDS.irr)}
        />
      )}
      {metrics.totalReturnPct !== null && (
        <MetricCard
          label="5yr Total Return"
          value={formatPercent(metrics.totalReturnPct)}
          subtitle="Cash + apprec + paydown"
          color={getColor(metrics.totalReturnPct, THRESHOLDS.totalReturn)}
        />
      )}
    </div>
  );
}
