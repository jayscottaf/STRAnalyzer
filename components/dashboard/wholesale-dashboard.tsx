'use client';

import type { WholesaleMetrics } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import UniversalMetricsGrid, { type MetricDef } from './universal-metrics-grid';

interface Props {
  metrics: WholesaleMetrics;
}

export default function WholesaleDashboard({ metrics }: Props) {
  const qualityMap = {
    strong: { label: 'STRONG' },
    marginal: { label: 'MARGINAL' },
    weak: { label: 'WEAK' },
  };

  const items: MetricDef[] = [
    {
      key: 'assignmentFee',
      label: 'Assignment Fee',
      value: formatCurrency(metrics.assignmentFee),
      rawValue: metrics.assignmentFee,
      formatFn: (v) => formatCurrency(v),
      subtitle: `After-tax: ${formatCurrency(metrics.afterTaxProfit)}`,
      color: metrics.assignmentFee >= 10000 ? 'green' : metrics.assignmentFee >= 5000 ? 'amber' : 'red',
      benchmark: 'Target: $10k+',
      large: true,
    },
    {
      key: 'maxAllowableOffer',
      label: 'MAO',
      value: formatCurrency(metrics.maxAllowableOffer),
      rawValue: metrics.maxAllowableOffer,
      formatFn: (v) => formatCurrency(v),
      subtitle: metrics.spreadVsAsking >= 0
        ? `${formatCurrency(metrics.spreadVsAsking)} room`
        : `${formatCurrency(Math.abs(metrics.spreadVsAsking))} over`,
      color: metrics.spreadVsAsking >= 5000 ? 'green' : metrics.spreadVsAsking >= 0 ? 'amber' : 'red',
      benchmark: 'ARV×70% - reno - fee',
      large: true,
    },
    {
      key: 'roiOnEarnest',
      label: 'ROI on Earnest',
      value: formatPercent(metrics.roiOnEarnest),
      rawValue: metrics.roiOnEarnest,
      formatFn: (v) => formatPercent(v),
      subtitle: `$${metrics.earnestMoney.toLocaleString()} at risk`,
      color: metrics.roiOnEarnest >= 500 ? 'green' : metrics.roiOnEarnest >= 200 ? 'amber' : 'red',
      large: true,
    },
    {
      key: 'dealQuality',
      label: 'Deal Quality',
      value: qualityMap[metrics.dealQuality].label,
      subtitle: metrics.meetsSeventyRule ? '70% rule: PASS' : '70% rule: FAIL',
      color: metrics.dealQuality === 'strong' ? 'green' : metrics.dealQuality === 'marginal' ? 'amber' : 'red',
      large: true,
    },
    {
      key: 'arv',
      label: 'ARV',
      value: formatCurrency(metrics.arv),
      rawValue: metrics.arv,
      formatFn: (v) => formatCurrency(v),
      subtitle: 'End-buyer resale value',
      color: 'neutral',
    },
    {
      key: 'renovationEstimate',
      label: 'Reno Estimate',
      value: formatCurrency(metrics.renovationEstimate),
      rawValue: metrics.renovationEstimate,
      formatFn: (v) => formatCurrency(v),
      subtitle: 'What buyer will spend',
      color: 'neutral',
    },
    {
      key: 'askingPrice',
      label: 'Asking Price',
      value: formatCurrency(metrics.askingPrice),
      rawValue: metrics.askingPrice,
      formatFn: (v) => formatCurrency(v),
      subtitle: 'Seller ask',
      color: 'neutral',
    },
    {
      key: 'spreadVsAsking',
      label: 'Spread',
      value: formatCurrency(metrics.spreadVsAsking),
      rawValue: metrics.spreadVsAsking,
      formatFn: (v) => formatCurrency(v),
      subtitle: metrics.spreadVsAsking >= 0 ? 'Room to negotiate' : 'Price too high',
      color: metrics.spreadVsAsking >= 5000 ? 'green' : metrics.spreadVsAsking >= 0 ? 'amber' : 'red',
    },
  ];

  return (
    <div className="space-y-4">
      <UniversalMetricsGrid items={items} storagePrefix="wholesale" />

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
          <>Tight margin — you may need to lower your assignment fee or negotiate the asking price down.</>
        )}
        {metrics.dealQuality === 'weak' && (
          <>Asking is above MAO. Negotiate seller down by {formatCurrency(Math.abs(metrics.spreadVsAsking))} or walk away.</>
        )}
      </div>
    </div>
  );
}
