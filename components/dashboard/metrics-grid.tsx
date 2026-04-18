'use client';

import type { DealMetrics } from '@/lib/types';
import { formatCurrency, formatPercent, formatDSCR } from '@/lib/format';
import { THRESHOLDS } from '@/lib/constants';
import MetricCard from './metric-card';

interface Props {
  metrics: DealMetrics;
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

export default function MetricsGrid({ metrics }: Props) {
  const cocSubtitle = metrics.trueCocReturn !== null
    ? `w/ tax: ${formatPercent(metrics.trueCocReturn)}`
    : 'pre-tax return';

  const dscrSubtitle = !isFinite(metrics.dscr)
    ? 'Cash purchase'
    : metrics.dscr >= 1.2
    ? 'Lender eligible'
    : metrics.dscr >= 1.0
    ? 'Marginal coverage'
    : 'Negative coverage';

  const cashFlowSubtitle = `Annual: ${formatCurrency(metrics.annualCashFlow)}`;

  const capRateSubtitle = 'Unlevered return';

  const noiSubtitle = 'Before debt service';

  const breakEvenMargin = metrics.breakEvenOccupancy;
  const breakEvenSubtitle = breakEvenMargin < 100
    ? `${formatPercent(100 - breakEvenMargin)} safety margin`
    : 'Not profitable';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-fr">
      <MetricCard
        label="Monthly Cash Flow"
        value={formatCurrency(metrics.monthlyCashFlow)}
        subtitle={cashFlowSubtitle}
        tooltip="Net cash flow per month after all expenses and debt service."
        color={getColor(metrics.monthlyCashFlow, THRESHOLDS.monthlyCashFlow)}
        benchmark="vs $500+ target"
        large
      />
      <MetricCard
        label="Cash-on-Cash Return"
        value={formatPercent(metrics.cocReturn)}
        subtitle={cocSubtitle}
        tooltip="Annual cash flow divided by total cash invested. 8-12% is strong for STR."
        color={getColor(metrics.cocReturn, THRESHOLDS.coc)}
        benchmark="STR avg: 8%"
        large
      />
      <MetricCard
        label="Cap Rate"
        value={formatPercent(metrics.capRate)}
        subtitle={capRateSubtitle}
        tooltip="NOI divided by purchase price. Measures unlevered return. 6-10% is typical for STR."
        color={getColor(metrics.capRate, THRESHOLDS.cap)}
        benchmark="STR avg: 6-8%"
        large
      />
      <MetricCard
        label="DSCR"
        value={formatDSCR(metrics.dscr)}
        subtitle={dscrSubtitle}
        tooltip="NOI divided by annual debt service. Lenders require 1.20+ for DSCR loans."
        color={isFinite(metrics.dscr) ? getColor(metrics.dscr, THRESHOLDS.dscr) : 'blue'}
        benchmark="Lender min: 1.20"
        large
      />
      <MetricCard
        label="NOI"
        value={formatCurrency(metrics.noi)}
        subtitle={noiSubtitle}
        tooltip="Net Operating Income: EGI minus operating expenses (before debt service)."
        color="neutral"
      />
      <MetricCard
        label="Total Cash Required"
        value={formatCurrency(metrics.totalCashInvested)}
        subtitle={`LTV: ${formatPercent(metrics.ltv)}`}
        tooltip="Down payment + closing costs + furnishing + cash reserves."
        color="neutral"
      />
      <MetricCard
        label="Break-Even Occupancy"
        value={formatPercent(metrics.breakEvenOccupancy)}
        subtitle={breakEvenSubtitle}
        tooltip="Minimum occupancy to cover all expenses + debt service. Lower is safer."
        color={getColor(metrics.breakEvenOccupancy, THRESHOLDS.breakEvenOccupancy, true)}
      />
      <MetricCard
        label="Gross Rental Yield"
        value={formatPercent(metrics.grossRentalYield)}
        subtitle={`RevPAR: ${formatCurrency(metrics.revpar)}`}
        tooltip="Gross revenue / purchase price. Quick measure of revenue potential."
        color={getColor(metrics.grossRentalYield, THRESHOLDS.grossYield)}
      />

      {/* Row 3: IRR + Total Return (only if tax enabled) */}
      {metrics.irr !== null && (
        <MetricCard
          label="IRR (w/ Exit)"
          value={formatPercent(metrics.irr)}
          subtitle={`${metrics.exitAnalysis?.is1031 ? '1031 exchange' : 'After-tax exit'}`}
          tooltip="Internal rate of return including annual cash flows and after-tax sale proceeds at exit year. The gold standard return metric."
          color={getColor(metrics.irr, THRESHOLDS.irr)}
        />
      )}
      {metrics.totalReturnPct !== null && (
        <MetricCard
          label="5yr Total Return"
          value={formatPercent(metrics.totalReturnPct)}
          subtitle="Cash + appreciation + paydown"
          tooltip="Total return on invested cash: cumulative cash flow + property appreciation + mortgage principal paydown, divided by initial cash invested."
          color={getColor(metrics.totalReturnPct, THRESHOLDS.totalReturn)}
        />
      )}
    </div>
  );
}
