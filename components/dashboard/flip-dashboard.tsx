'use client';

import type { FlipMetrics } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import MetricCard from './metric-card';

interface Props {
  metrics: FlipMetrics;
}

export default function FlipDashboard({ metrics }: Props) {
  const profitColor: 'green' | 'amber' | 'red' =
    metrics.netProfit >= 30000 ? 'green' :
    metrics.netProfit >= 10000 ? 'amber' : 'red';
  const roiColor: 'green' | 'amber' | 'red' =
    metrics.roi >= 20 ? 'green' : metrics.roi >= 10 ? 'amber' : 'red';
  const marginColor: 'green' | 'amber' | 'red' =
    metrics.profitMargin >= 15 ? 'green' : metrics.profitMargin >= 8 ? 'amber' : 'red';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-fr">
        <MetricCard
          label="Gross Profit"
          value={formatCurrency(metrics.netProfit)}
          subtitle={`After-tax: ${formatCurrency(metrics.afterTaxProfit)}`}
          tooltip="ARV minus purchase, reno, holding, selling costs."
          color={profitColor}
          large
        />
        <MetricCard
          label="ROI"
          value={formatPercent(metrics.roi)}
          subtitle={`On ${formatCurrency(metrics.cashRequired)} cash`}
          tooltip="Profit / cash required. 20%+ is strong for a flip."
          color={roiColor}
          large
        />
        <MetricCard
          label="Profit Margin"
          value={formatPercent(metrics.profitMargin)}
          subtitle="Profit / ARV"
          tooltip="Margin on the exit price. 15%+ gives room for surprises."
          color={marginColor}
          large
        />
        <MetricCard
          label="70% Rule"
          value={metrics.meetsSeventyRule ? 'PASS' : 'FAIL'}
          subtitle={`MAO: ${formatCurrency(metrics.maxAllowableOffer)}`}
          tooltip="ARV × 70% - reno. Rule-of-thumb ceiling."
          color={metrics.meetsSeventyRule ? 'green' : 'red'}
          large
        />
        <MetricCard
          label="ARV"
          value={formatCurrency(metrics.arv)}
          subtitle={`$${metrics.pricePerSqftAfter.toFixed(0)}/sqft`}
          color="neutral"
        />
        <MetricCard
          label="Total Reno"
          value={formatCurrency(metrics.renovationBudget + metrics.contingency)}
          subtitle={`+${formatCurrency(metrics.contingency)} contingency`}
          color="neutral"
        />
        <MetricCard
          label="Holding Costs"
          value={formatCurrency(metrics.holdingCosts)}
          subtitle={`${metrics.totalHoldMonths}mo hold`}
          color="neutral"
        />
        <MetricCard
          label="Selling Costs"
          value={formatCurrency(metrics.sellingCosts)}
          subtitle="Agent + closing"
          color="neutral"
        />
      </div>

      {/* Profit Breakdown */}
      <div className="rounded-lg border border-border-default bg-bg-surface p-4">
        <h3 className="text-sm font-semibold text-text-foreground mb-3">Profit Breakdown</h3>
        <div className="space-y-1">
          <BreakRow label="ARV (Sale Price)" value={metrics.arv} positive />
          <BreakRow label="Selling Costs" value={-metrics.sellingCosts} />
          <BreakRow label="Purchase Price" value={-metrics.purchasePrice} />
          <BreakRow label="Renovation + Contingency" value={-(metrics.renovationBudget + metrics.contingency)} />
          <BreakRow label="Holding Costs" value={-metrics.holdingCosts} />
          <div className="border-t border-border-default mt-2 pt-2">
            <BreakRow label="Gross Profit" value={metrics.netProfit} bold />
            <BreakRow label={`Tax (short-term gains)`} value={metrics.afterTaxProfit - metrics.netProfit} />
            <BreakRow label="After-Tax Profit" value={metrics.afterTaxProfit} bold highlight />
          </div>
        </div>
      </div>

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

function BreakRow({ label, value, positive, bold, highlight }: {
  label: string;
  value: number;
  positive?: boolean;
  bold?: boolean;
  highlight?: boolean;
}) {
  const colorClass = highlight
    ? value >= 0 ? 'text-accent-green' : 'text-accent-red'
    : positive
    ? 'text-accent-green'
    : value < 0
    ? 'text-accent-red/70'
    : 'text-text-foreground';
  return (
    <div className={`flex justify-between py-0.5 ${bold ? 'font-semibold' : ''} ${highlight ? 'text-sm' : 'text-xs'}`}>
      <span className="text-text-muted">{label}</span>
      <span className={colorClass}>{formatCurrency(value)}</span>
    </div>
  );
}
