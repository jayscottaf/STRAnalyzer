'use client';

import type { LTRMetrics } from '@/lib/types';
import { formatCurrency, formatPercent, formatDSCR } from '@/lib/format';
import { THRESHOLDS } from '@/lib/constants';
import UniversalMetricsGrid, { type MetricDef } from './universal-metrics-grid';

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

  const items: MetricDef[] = [
    {
      key: 'monthlyCashFlow',
      label: 'Monthly Cash Flow',
      value: formatCurrency(metrics.monthlyCashFlow),
      rawValue: metrics.monthlyCashFlow,
      formatFn: (v) => formatCurrency(v),
      subtitle: `Annual: ${formatCurrency(metrics.annualCashFlow)}`,
      color: getColor(metrics.monthlyCashFlow, THRESHOLDS.monthlyCashFlow),
      benchmark: 'vs $200+ target',
      large: true,
    },
    {
      key: 'cocReturn',
      label: 'Cash-on-Cash Return',
      value: formatPercent(metrics.cocReturn),
      rawValue: metrics.cocReturn,
      formatFn: (v) => formatPercent(v),
      subtitle: metrics.trueCocReturn !== null ? `w/ tax: ${formatPercent(metrics.trueCocReturn)}` : 'pre-tax',
      color: getColor(metrics.cocReturn, THRESHOLDS.coc),
      benchmark: 'LTR avg: 6%',
      large: true,
    },
    {
      key: 'capRate',
      label: 'Cap Rate',
      value: formatPercent(metrics.capRate),
      rawValue: metrics.capRate,
      formatFn: (v) => formatPercent(v),
      subtitle: 'Unlevered return',
      color: getColor(metrics.capRate, THRESHOLDS.cap),
      benchmark: 'LTR avg: 5-7%',
      large: true,
    },
    {
      key: 'dscr',
      label: 'DSCR',
      value: formatDSCR(metrics.dscr),
      rawValue: isFinite(metrics.dscr) ? metrics.dscr : undefined,
      formatFn: (v) => formatDSCR(v),
      subtitle: dscrSubtitle,
      color: isFinite(metrics.dscr) ? getColor(metrics.dscr, THRESHOLDS.dscr) : 'blue',
      benchmark: 'Lender min: 1.20',
      large: true,
    },
    {
      key: 'monthlyRent',
      label: 'Monthly Rent',
      value: formatCurrency(metrics.monthlyRent),
      rawValue: metrics.monthlyRent,
      formatFn: (v) => formatCurrency(v),
      subtitle: `Annual: ${formatCurrency(metrics.annualGrossRent)}`,
      color: 'neutral',
    },
    {
      key: 'onePercentRule',
      label: '1% Rule',
      value: metrics.onePercentRule ? 'PASS' : 'FAIL',
      subtitle: metrics.twoPercentRule ? '2% rule passes too' : 'below 2% rule',
      color: metrics.onePercentRule ? 'green' : 'amber',
      benchmark: 'rent/price >= 1%',
    },
    {
      key: 'grm',
      label: 'GRM',
      value: metrics.grm.toFixed(1),
      rawValue: metrics.grm,
      formatFn: (v) => v.toFixed(1),
      subtitle: 'Gross Rent Multiplier',
      color: metrics.grm > 0 && metrics.grm <= 10 ? 'green' : metrics.grm <= 15 ? 'amber' : 'red',
      benchmark: 'Target: 8-12',
    },
    {
      key: 'noi',
      label: 'NOI',
      value: formatCurrency(metrics.noi),
      rawValue: metrics.noi,
      formatFn: (v) => formatCurrency(v),
      subtitle: 'Before debt service',
      color: 'neutral',
    },
    {
      key: 'totalCashInvested',
      label: 'Total Cash Required',
      value: formatCurrency(metrics.totalCashInvested),
      rawValue: metrics.totalCashInvested,
      formatFn: (v) => formatCurrency(v),
      subtitle: `LTV: ${formatPercent(metrics.ltv)}`,
      color: 'neutral',
    },
    {
      key: 'vacancyLoss',
      label: 'Vacancy Loss',
      value: formatCurrency(metrics.vacancyLoss),
      rawValue: metrics.vacancyLoss,
      formatFn: (v) => formatCurrency(v),
      subtitle: `EGI: ${formatCurrency(metrics.effectiveGrossIncome)}`,
      color: 'neutral',
    },
    ...(metrics.irr !== null ? [{
      key: 'irr',
      label: 'IRR (w/ Exit)',
      value: formatPercent(metrics.irr),
      rawValue: metrics.irr,
      formatFn: (v: number) => formatPercent(v),
      subtitle: 'After-tax exit',
      color: getColor(metrics.irr, THRESHOLDS.irr) as 'green' | 'amber' | 'red',
    }] : []),
    ...(metrics.totalReturnPct !== null ? [{
      key: 'totalReturnPct',
      label: '5yr Total Return',
      value: formatPercent(metrics.totalReturnPct),
      rawValue: metrics.totalReturnPct,
      formatFn: (v: number) => formatPercent(v),
      subtitle: 'Cash + apprec + paydown',
      color: getColor(metrics.totalReturnPct, THRESHOLDS.totalReturn) as 'green' | 'amber' | 'red',
    }] : []),
  ];

  return <UniversalMetricsGrid items={items} storagePrefix="ltr" />;
}
