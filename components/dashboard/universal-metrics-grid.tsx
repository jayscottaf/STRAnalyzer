'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import MetricCard from './metric-card';
import MetricDrilldown from './metric-drilldown';
import AnimatedValue from './animated-value';
import type { DealMetrics } from '@/lib/types';

export interface MetricDef {
  key: string;
  label: string;
  value: string;
  rawValue?: number;
  formatFn?: (n: number) => string;
  subtitle?: string;
  tooltip?: string;
  color: 'green' | 'amber' | 'red' | 'blue' | 'neutral';
  large?: boolean;
  benchmark?: string;
}

interface Props {
  items: MetricDef[];
  storagePrefix?: string;
  drilldownMetrics?: DealMetrics;
}

type ViewMode = 'grid' | 'compact';

export default function UniversalMetricsGrid({ items, storagePrefix = 'default', drilldownMetrics }: Props) {
  const viewKey = `${storagePrefix}-kpi-view-mode`;
  const orderKey = `${storagePrefix}-kpi-card-order`;

  const [drilldownKey, setDrilldownKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [cardOrder, setCardOrder] = useState<string[] | null>(null);
  const dragItem = useRef<string | null>(null);
  const dragOver = useRef<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(viewKey) as ViewMode | null;
    if (saved === 'compact' || saved === 'grid') setViewMode(saved);
    const savedOrder = localStorage.getItem(orderKey);
    if (savedOrder) {
      try { setCardOrder(JSON.parse(savedOrder)); } catch { /* ignore */ }
    }
  }, [viewKey, orderKey]);

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
    localStorage.setItem(orderKey, JSON.stringify(newOrder));
    dragItem.current = null;
    dragOver.current = null;
  }, [orderKey]);

  const resetOrder = useCallback(() => {
    setCardOrder(null);
    localStorage.removeItem(orderKey);
  }, [orderKey]);

  function toggleView() {
    const next = viewMode === 'grid' ? 'compact' : 'grid';
    setViewMode(next);
    localStorage.setItem(viewKey, next);
  }

  // Apply custom order
  const orderedItems = (() => {
    if (!cardOrder) return items;
    const byKey = new Map(items.map((m) => [m.key, m]));
    const ordered = cardOrder.map((k) => byKey.get(k)).filter(Boolean) as MetricDef[];
    for (const m of items) {
      if (!cardOrder.includes(m.key)) ordered.push(m);
    }
    return ordered;
  })();

  const orderedKeys = orderedItems.map((m) => m.key);

  return (
    <>
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
          {orderedItems.map((m) => (
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
                metricKey={drilldownMetrics ? m.key : undefined}
                onDrilldown={drilldownMetrics ? setDrilldownKey : undefined}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border-default bg-bg-surface overflow-hidden">
          {orderedItems.map((m, i) => {
            const colorText =
              m.color === 'green' ? 'text-accent-green' :
              m.color === 'amber' ? 'text-accent-amber' :
              m.color === 'red' ? 'text-accent-red' :
              m.color === 'blue' ? 'text-accent-blue' :
              'text-text-foreground';
            return (
              <div
                key={m.key}
                onClick={drilldownMetrics ? () => setDrilldownKey(m.key) : undefined}
                className={`flex items-center justify-between px-3 py-2 ${drilldownMetrics ? 'cursor-pointer' : ''} hover:bg-bg-hover transition-colors ${
                  i < orderedItems.length - 1 ? 'border-b border-border-default/50' : ''
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
                  {drilldownMetrics && (
                    <svg className="w-3 h-3 text-text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {drilldownMetrics && (
        <MetricDrilldown
          metricKey={drilldownKey}
          metrics={drilldownMetrics}
          onClose={() => setDrilldownKey(null)}
        />
      )}
    </>
  );
}
