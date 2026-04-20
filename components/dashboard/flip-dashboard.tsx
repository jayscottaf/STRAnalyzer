'use client';

import type { FlipMetrics } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import UniversalMetricsGrid, { type MetricDef } from './universal-metrics-grid';

interface Props {
  metrics: FlipMetrics;
}

export default function FlipDashboard({ metrics }: Props) {
  const items: MetricDef[] = [
    {
      key: 'netProfit',
      label: 'Gross Profit',
      value: formatCurrency(metrics.netProfit),
      rawValue: metrics.netProfit,
      formatFn: (v) => formatCurrency(v),
      subtitle: `After-tax: ${formatCurrency(metrics.afterTaxProfit)}`,
      color: metrics.netProfit >= 30000 ? 'green' : metrics.netProfit >= 10000 ? 'amber' : 'red',
      benchmark: 'Target: $25k+',
      large: true,
    },
    {
      key: 'roi',
      label: 'ROI',
      value: formatPercent(metrics.roi),
      rawValue: metrics.roi,
      formatFn: (v) => formatPercent(v),
      subtitle: `On ${formatCurrency(metrics.cashRequired)} cash`,
      color: metrics.roi >= 20 ? 'green' : metrics.roi >= 10 ? 'amber' : 'red',
      benchmark: 'Target: 20%+',
      large: true,
    },
    {
      key: 'profitMargin',
      label: 'Profit Margin',
      value: formatPercent(metrics.profitMargin),
      rawValue: metrics.profitMargin,
      formatFn: (v) => formatPercent(v),
      subtitle: 'Profit / ARV',
      color: metrics.profitMargin >= 15 ? 'green' : metrics.profitMargin >= 8 ? 'amber' : 'red',
      benchmark: 'Target: 15%+',
      large: true,
    },
    {
      key: 'seventyRule',
      label: '70% Rule',
      value: metrics.meetsSeventyRule ? 'PASS' : 'FAIL',
      subtitle: `MAO: ${formatCurrency(metrics.maxAllowableOffer)}`,
      color: metrics.meetsSeventyRule ? 'green' : 'red',
      benchmark: 'ARV×70% - reno',
      large: true,
    },
    {
      key: 'arv',
      label: 'ARV',
      value: formatCurrency(metrics.arv),
      rawValue: metrics.arv,
      formatFn: (v) => formatCurrency(v),
      subtitle: `$${metrics.pricePerSqftAfter.toFixed(0)}/sqft`,
      color: 'neutral',
    },
    {
      key: 'totalReno',
      label: 'Total Reno',
      value: formatCurrency(metrics.renovationBudget + metrics.contingency),
      rawValue: metrics.renovationBudget + metrics.contingency,
      formatFn: (v) => formatCurrency(v),
      subtitle: `+${formatCurrency(metrics.contingency)} contingency`,
      color: 'neutral',
    },
    {
      key: 'holdingCosts',
      label: 'Holding Costs',
      value: formatCurrency(metrics.holdingCosts),
      rawValue: metrics.holdingCosts,
      formatFn: (v) => formatCurrency(v),
      subtitle: `${metrics.totalHoldMonths}mo hold`,
      color: 'neutral',
    },
    {
      key: 'sellingCosts',
      label: 'Selling Costs',
      value: formatCurrency(metrics.sellingCosts),
      rawValue: metrics.sellingCosts,
      formatFn: (v) => formatCurrency(v),
      subtitle: 'Agent + closing',
      color: 'neutral',
    },
    {
      key: 'cashRequired',
      label: 'Cash Required',
      value: formatCurrency(metrics.cashRequired),
      rawValue: metrics.cashRequired,
      formatFn: (v) => formatCurrency(v),
      subtitle: `Loan: ${formatCurrency(metrics.loanAmount)}`,
      color: 'neutral',
    },
    {
      key: 'purchasePrice',
      label: 'Purchase Price',
      value: formatCurrency(metrics.purchasePrice),
      rawValue: metrics.purchasePrice,
      formatFn: (v) => formatCurrency(v),
      subtitle: `${formatPercent(metrics.purchasePrice / metrics.arv * 100)} of ARV`,
      color: 'neutral',
    },
  ];

  return (
    <div className="space-y-4">
      <UniversalMetricsGrid items={items} storagePrefix="flip" />

      {/* Holding Cost Breakdown */}
      <div className="rounded-lg border border-border-default bg-bg-surface p-4">
        <h3 className="text-sm font-semibold text-text-foreground mb-3">Holding Cost Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider">Loan Interest</div>
            <div className="font-semibold">{formatCurrency(metrics.holdingCostBreakdown.loanInterest)}</div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider">Points</div>
            <div className="font-semibold">{formatCurrency(metrics.holdingCostBreakdown.loanPoints)}</div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider">Property Tax</div>
            <div className="font-semibold">{formatCurrency(metrics.holdingCostBreakdown.propertyTax)}</div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider">Insurance</div>
            <div className="font-semibold">{formatCurrency(metrics.holdingCostBreakdown.insurance)}</div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider">Utilities</div>
            <div className="font-semibold">{formatCurrency(metrics.holdingCostBreakdown.utilities)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
