'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { DealMetrics } from '@/lib/types';
import { formatCurrency, formatPercent, formatDSCR } from '@/lib/format';
import { THRESHOLDS } from '@/lib/constants';
import MetricCard from './metric-card';
import MetricDrilldown from './metric-drilldown';

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

type ViewMode = 'grid' | 'compact';

const VIEW_MODE_KEY = 'str-kpi-view-mode';
const CARD_ORDER_KEY = 'str-kpi-card-order';

export default function MetricsGrid({ metrics }: Props) {
  const [drilldownKey, setDrilldownKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [cardOrder, setCardOrder] = useState<string[] | null>(null);
  const dragItem = useRef<string | null>(null);
  const dragOver = useRef<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY) as ViewMode | null;
    if (saved === 'compact' || saved === 'grid') setViewMode(saved);
    const savedOrder = localStorage.getItem(CARD_ORDER_KEY);
    if (savedOrder) {
      try { setCardOrder(JSON.parse(savedOrder)); } catch { /* ignore */ }
    }
  }, []);

  const handleDragStart = useCallback((key: string) => {
    dragItem.current = key;
  }, []);

  const handleDragEnter = useCallback((key: string) => {
    dragOver.current = key;
  }, []);

  const handleDragEnd = useCallback((orderedKeys: string[]) => {
    if (!dragItem.current || !dragOver.current || dragItem.current === dragOver.current) {
      dragItem.current = null;
      dragOver.current = null;
      return;
    }
    const fromIdx = orderedKeys.indexOf(dragItem.current);
    const toIdx = orderedKeys.indexOf(dragOver.current);
    if (fromIdx === -1 || toIdx === -1) return;
    const newOrder = [...orderedKeys];
    const [removed] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, removed);
    setCardOrder(newOrder);
    localStorage.setItem(CARD_ORDER_KEY, JSON.stringify(newOrder));
    dragItem.current = null;
    dragOver.current = null;
  }, []);

  const resetOrder = useCallback(() => {
    setCardOrder(null);
    localStorage.removeItem(CARD_ORDER_KEY);
  }, []);

  function toggleView() {
    const next = viewMode === 'grid' ? 'compact' : 'grid';
    setViewMode(next);
    localStorage.setItem(VIEW_MODE_KEY, next);
  }

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
  const breakEvenSubtitle = metrics.breakEvenOccupancy < 100
    ? `${formatPercent(100 - metrics.breakEvenOccupancy)} safety margin`
    : 'Not profitable';

  const allMetrics = [
    {
      key: 'monthlyCashFlow',
      label: 'Monthly Cash Flow',
      value: formatCurrency(metrics.monthlyCashFlow),
      rawValue: metrics.monthlyCashFlow,
      formatFn: (v: number) => formatCurrency(v),
      subtitle: cashFlowSubtitle,
      tooltip: 'Net cash flow per month after all expenses and debt service.',
      color: getColor(metrics.monthlyCashFlow, THRESHOLDS.monthlyCashFlow) as 'green' | 'amber' | 'red',
      benchmark: 'vs $500+ target',
      large: true,
    },
    {
      key: 'cocReturn',
      label: 'Cash-on-Cash Return',
      value: formatPercent(metrics.cocReturn),
      rawValue: metrics.cocReturn,
      formatFn: (v: number) => formatPercent(v),
      subtitle: cocSubtitle,
      tooltip: 'Annual cash flow divided by total cash invested. 8-12% is strong for STR.',
      color: getColor(metrics.cocReturn, THRESHOLDS.coc) as 'green' | 'amber' | 'red',
      benchmark: 'STR avg: 8%',
      large: true,
    },
    {
      key: 'capRate',
      label: 'Cap Rate',
      value: formatPercent(metrics.capRate),
      rawValue: metrics.capRate,
      formatFn: (v: number) => formatPercent(v),
      subtitle: capRateSubtitle,
      tooltip: 'NOI divided by purchase price. Measures unlevered return. 6-10% is typical for STR.',
      color: getColor(metrics.capRate, THRESHOLDS.cap) as 'green' | 'amber' | 'red',
      benchmark: 'STR avg: 6-8%',
      large: true,
    },
    {
      key: 'dscr',
      label: 'DSCR',
      value: formatDSCR(metrics.dscr),
      rawValue: isFinite(metrics.dscr) ? metrics.dscr : undefined,
      formatFn: (v: number) => formatDSCR(v),
      subtitle: dscrSubtitle,
      tooltip: 'NOI divided by annual debt service. Lenders require 1.20+ for DSCR loans.',
      color: (isFinite(metrics.dscr) ? getColor(metrics.dscr, THRESHOLDS.dscr) : 'blue') as 'green' | 'amber' | 'red' | 'blue',
      benchmark: 'Lender min: 1.20',
      large: true,
    },
    {
      key: 'noi',
      label: 'NOI',
      value: formatCurrency(metrics.noi),
      rawValue: metrics.noi,
      formatFn: (v: number) => formatCurrency(v),
      subtitle: noiSubtitle,
      tooltip: 'Net Operating Income: EGI minus operating expenses (before debt service).',
      color: 'neutral' as const,
    },
    {
      key: 'totalCashInvested',
      label: 'Total Cash Required',
      value: formatCurrency(metrics.totalCashInvested),
      rawValue: metrics.totalCashInvested,
      formatFn: (v: number) => formatCurrency(v),
      subtitle: `LTV: ${formatPercent(metrics.ltv)}`,
      tooltip: 'Down payment + closing costs + furnishing + cash reserves.',
      color: 'neutral' as const,
    },
    {
      key: 'breakEvenOccupancy',
      label: 'Break-Even Occupancy',
      value: formatPercent(metrics.breakEvenOccupancy),
      rawValue: metrics.breakEvenOccupancy,
      formatFn: (v: number) => formatPercent(v),
      subtitle: breakEvenSubtitle,
      tooltip: 'Minimum occupancy to cover all expenses + debt service. Lower is safer.',
      color: getColor(metrics.breakEvenOccupancy, THRESHOLDS.breakEvenOccupancy, true) as 'green' | 'amber' | 'red',
    },
    {
      key: 'grossRentalYield',
      label: 'Gross Rental Yield',
      value: formatPercent(metrics.grossRentalYield),
      rawValue: metrics.grossRentalYield,
      formatFn: (v: number) => formatPercent(v),
      subtitle: `RevPAR: ${formatCurrency(metrics.revpar)}`,
      tooltip: 'Gross revenue / purchase price. Quick measure of revenue potential.',
      color: getColor(metrics.grossRentalYield, THRESHOLDS.grossYield) as 'green' | 'amber' | 'red',
    },
    ...(metrics.irr !== null ? [{
      key: 'irr',
      label: 'IRR (w/ Exit)',
      value: formatPercent(metrics.irr),
      rawValue: metrics.irr,
      formatFn: (v: number) => formatPercent(v),
      subtitle: metrics.exitAnalysis?.is1031 ? '1031 exchange' : 'After-tax exit',
      tooltip: 'Internal rate of return including annual cash flows and after-tax sale proceeds.',
      color: getColor(metrics.irr, THRESHOLDS.irr) as 'green' | 'amber' | 'red',
    }] : []),
    ...(metrics.totalReturnPct !== null ? [{
      key: 'totalReturnPct',
      label: '5yr Total Return',
      value: formatPercent(metrics.totalReturnPct),
      rawValue: metrics.totalReturnPct,
      formatFn: (v: number) => formatPercent(v),
      subtitle: 'Cash + appreciation + paydown',
      tooltip: 'Total return on invested cash over 5 years.',
      color: getColor(metrics.totalReturnPct, THRESHOLDS.totalReturn) as 'green' | 'amber' | 'red',
    }] : []),
  ];

  // Apply custom order
  const orderedMetrics = (() => {
    if (!cardOrder) return allMetrics;
    const byKey = new Map(allMetrics.map((m) => [m.key, m]));
    const ordered = cardOrder.map((k) => byKey.get(k)).filter(Boolean) as typeof allMetrics;
    // Append any new metrics not in saved order
    for (const m of allMetrics) {
      if (!cardOrder.includes(m.key)) ordered.push(m);
    }
    return ordered;
  })();

  const orderedKeys = orderedMetrics.map((m) => m.key);

  return (
    <>
      {/* View mode toggle + reset */}
      <div className="flex justify-end gap-3 mb-2">
        {cardOrder && (
          <button
            type="button"
            onClick={resetOrder}
            className="text-[10px] text-text-muted hover:text-accent-red flex items-center gap-1 transition-colors"
          >
            Reset order
          </button>
        )}
        <button
          type="button"
          onClick={toggleView}
          className="text-[10px] text-text-muted hover:text-text-foreground flex items-center gap-1 transition-colors"
        >
          {viewMode === 'grid' ? (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Compact view
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Card view
            </>
          )}
        </button>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-fr">
          {orderedMetrics.map((m) => (
            <div
              key={m.key}
              draggable
              onDragStart={() => handleDragStart(m.key)}
              onDragEnter={() => handleDragEnter(m.key)}
              onDragEnd={() => handleDragEnd(orderedKeys)}
              onDragOver={(e) => e.preventDefault()}
              className="cursor-grab active:cursor-grabbing"
            >
            <MetricCard
              label={m.label}
              value={m.value}
              rawValue={m.rawValue}
              formatFn={m.formatFn}
              subtitle={m.subtitle}
              tooltip={m.tooltip}
              color={m.color}
              large={m.large}
              benchmark={m.benchmark}
              metricKey={m.key}
              onDrilldown={setDrilldownKey}
            />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border-default bg-bg-surface overflow-hidden">
          {orderedMetrics.map((m, i) => {
            const colorText =
              m.color === 'green' ? 'text-accent-green' :
              m.color === 'amber' ? 'text-accent-amber' :
              m.color === 'red' ? 'text-accent-red' :
              m.color === 'blue' ? 'text-accent-blue' :
              'text-text-foreground';
            return (
              <div
                key={m.key}
                onClick={() => setDrilldownKey(m.key)}
                className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-bg-hover transition-colors ${
                  i < allMetrics.length - 1 ? 'border-b border-border-default/50' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-text-muted whitespace-nowrap">{m.label}</span>
                  {m.subtitle && (
                    <span className="text-[10px] text-text-muted/60 truncate hidden sm:inline">{m.subtitle}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {m.benchmark && (
                    <span className="text-[9px] text-text-muted/40 hidden lg:inline">{m.benchmark}</span>
                  )}
                  <span className={`text-sm font-bold ${colorText}`}>
                    {m.rawValue !== undefined && m.formatFn ? (
                      <AnimatedValue value={m.rawValue} format={m.formatFn} />
                    ) : (
                      m.value
                    )}
                  </span>
                  <svg className="w-3 h-3 text-text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <MetricDrilldown
        metricKey={drilldownKey}
        metrics={metrics}
        onClose={() => setDrilldownKey(null)}
      />
    </>
  );
}

// Re-export AnimatedValue for compact mode
import AnimatedValue from './animated-value';
