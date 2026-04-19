'use client';

import type { WholesaleMetrics } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import MetricCard from './metric-card';

interface Props {
  metrics: WholesaleMetrics;
}

export default function WholesaleDashboard({ metrics }: Props) {
  const qualityMap = {
    strong: { color: 'green' as const, label: 'STRONG' },
    marginal: { color: 'amber' as const, label: 'MARGINAL' },
    weak: { color: 'red' as const, label: 'WEAK' },
  };
  const quality = qualityMap[metrics.dealQuality];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-fr">
        <MetricCard
          label="Assignment Fee"
          value={formatCurrency(metrics.assignmentFee)}
          subtitle={`After-tax: ${formatCurrency(metrics.afterTaxProfit)}`}
          tooltip="Your profit from assigning the contract to an end buyer."
          color={metrics.assignmentFee >= 10000 ? 'green' : metrics.assignmentFee >= 5000 ? 'amber' : 'red'}
          large
        />
        <MetricCard
          label="MAO"
          value={formatCurrency(metrics.maxAllowableOffer)}
          subtitle={metrics.spreadVsAsking >= 0 ? `${formatCurrency(metrics.spreadVsAsking)} room` : `${formatCurrency(Math.abs(metrics.spreadVsAsking))} over`}
          tooltip="Maximum Allowable Offer: ARV × discount - reno - your fee."
          color={metrics.spreadVsAsking >= 5000 ? 'green' : metrics.spreadVsAsking >= 0 ? 'amber' : 'red'}
          large
        />
        <MetricCard
          label="ROI on Earnest"
          value={formatPercent(metrics.roiOnEarnest)}
          subtitle={`$${metrics.earnestMoney.toLocaleString()} at risk`}
          tooltip="Profit / earnest money deposit. Wholesaling is capital-light by design."
          color={metrics.roiOnEarnest >= 500 ? 'green' : metrics.roiOnEarnest >= 200 ? 'amber' : 'red'}
          large
        />
        <MetricCard
          label="Deal Quality"
          value={quality.label}
          subtitle={metrics.meetsSeventyRule ? '70% rule: PASS' : '70% rule: FAIL'}
          color={quality.color}
          large
        />
        <MetricCard
          label="ARV"
          value={formatCurrency(metrics.arv)}
          subtitle="End-buyer's resale value"
          color="neutral"
        />
        <MetricCard
          label="Reno Estimate"
          value={formatCurrency(metrics.renovationEstimate)}
          subtitle="What buyer will spend"
          color="neutral"
        />
        <MetricCard
          label="Asking Price"
          value={formatCurrency(metrics.askingPrice)}
          subtitle="Seller's ask"
          color="neutral"
        />
        <MetricCard
          label="Net Profit"
          value={formatCurrency(metrics.netProfit)}
          subtitle="Pre-tax assignment fee"
          color="neutral"
        />
      </div>

      {/* MAO Breakdown */}
      <div className="rounded-lg border border-border-default bg-bg-surface p-4">
        <h3 className="text-sm font-semibold text-text-foreground mb-3">MAO Calculation</h3>
        <div className="space-y-1 text-xs">
          <MaoRow label="ARV" value={metrics.arv} />
          <MaoRow label={`Discount multiplier (70% rule)`} value={-(metrics.arv * 0.30)} op="×" />
          <MaoRow label="After discount" value={metrics.arv * 0.70} bold />
          <MaoRow label="Renovation estimate" value={-metrics.renovationEstimate} />
          <MaoRow label="Assignment fee (your cut)" value={-metrics.assignmentFee} />
          <div className="border-t border-border-default mt-2 pt-2">
            <MaoRow label="Max Allowable Offer (MAO)" value={metrics.maxAllowableOffer} bold highlight />
            <MaoRow label="Asking price" value={metrics.askingPrice} />
            <MaoRow label="Spread" value={metrics.spreadVsAsking} bold highlight />
          </div>
        </div>
      </div>

      {/* Coaching Note */}
      <div className={`rounded-lg border p-3 text-[11px] ${
        metrics.dealQuality === 'strong'
          ? 'bg-accent-green-bg border-accent-green/30 text-accent-green'
          : metrics.dealQuality === 'marginal'
          ? 'bg-accent-amber-bg border-accent-amber/30 text-accent-amber'
          : 'bg-accent-red-bg border-accent-red/30 text-accent-red'
      }`}>
        {metrics.dealQuality === 'strong' && (
          <>This deal has room to assign for {formatCurrency(metrics.assignmentFee)} and still deliver a buyer at MAO. Strong wholesale candidate.</>
        )}
        {metrics.dealQuality === 'marginal' && (
          <>Tight margin — you may need to either lower your assignment fee or negotiate the asking price down to make this work.</>
        )}
        {metrics.dealQuality === 'weak' && (
          <>Asking is above MAO. Either negotiate seller down by {formatCurrency(Math.abs(metrics.spreadVsAsking))} or walk away. Not a wholesale deal at current terms.</>
        )}
      </div>
    </div>
  );
}

function MaoRow({ label, value, bold, highlight, op }: {
  label: string;
  value: number;
  bold?: boolean;
  highlight?: boolean;
  op?: string;
}) {
  return (
    <div className={`flex justify-between ${bold ? 'font-semibold' : ''}`}>
      <span className="text-text-muted flex items-center gap-1">
        {op && <span className="text-[9px] text-text-muted/60 w-4">{op}</span>}
        {label}
      </span>
      <span className={highlight ? (value >= 0 ? 'text-accent-green' : 'text-accent-red') : 'text-text-foreground'}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}
