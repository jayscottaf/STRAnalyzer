'use client';

import { useEffect, useState } from 'react';
import type { SavedAnalysis, DealMetrics } from '@/lib/types';
import { loadSavedAnalyses } from '@/lib/storage';
import { calculateAllMetrics } from '@/lib/calculations';
import { formatCurrency, formatPercent, formatDSCR } from '@/lib/format';

interface ComputedDeal {
  saved: SavedAnalysis;
  metrics: DealMetrics;
}

export default function CompareMode() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<SavedAnalysis[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setSaved(loadSavedAnalyses());
    }
  }, [open]);

  function toggleSelection(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id]; // max 3
      return [...prev, id];
    });
  }

  const comparing: ComputedDeal[] = selected
    .map((id) => saved.find((s) => s.id === id))
    .filter((s): s is SavedAnalysis => s !== undefined)
    .map((s) => ({ saved: s, metrics: calculateAllMetrics(s.inputs) }));

  // Find winner per metric
  function winnerOf(getValue: (m: DealMetrics) => number, lowerBetter = false): number {
    if (comparing.length < 2) return -1;
    let winnerIdx = 0;
    let best = getValue(comparing[0].metrics);
    for (let i = 1; i < comparing.length; i++) {
      const v = getValue(comparing[i].metrics);
      if (lowerBetter ? v < best : v > best) {
        best = v;
        winnerIdx = i;
      }
    }
    return winnerIdx;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-accent-blue/40 bg-accent-blue-bg px-3 py-2 text-xs font-medium text-accent-blue hover:bg-accent-blue/20 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        Compare Deals
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-5xl max-h-[90vh] overflow-hidden bg-bg-elevated border border-border-light rounded-xl shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-default shrink-0">
              <h3 className="text-sm font-semibold text-text-foreground">Compare Saved Deals</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-bg-hover text-text-muted"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto p-4">
              {saved.length === 0 ? (
                <div className="text-center py-8 text-xs text-text-muted">
                  No saved analyses yet. Save a deal from the Save/Load menu first.
                </div>
              ) : (
                <>
                  {/* Deal picker */}
                  <div className="mb-4">
                    <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                      Select up to 3 deals
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {saved.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleSelection(s.id)}
                          className={`px-3 py-1.5 text-[11px] rounded-md border transition-colors ${
                            selected.includes(s.id)
                              ? 'bg-accent-blue text-white border-accent-blue'
                              : 'bg-bg-base text-text-muted border-border-default hover:border-border-light'
                          }`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comparison table */}
                  {comparing.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border-default">
                            <th className="p-2 text-left text-text-muted font-medium">Metric</th>
                            {comparing.map((c) => (
                              <th key={c.saved.id} className="p-2 text-right text-text-foreground font-semibold">
                                {c.saved.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <CompareRow
                            label="Purchase Price"
                            comparing={comparing}
                            getValue={(c) => c.saved.inputs.property.purchasePrice}
                            winnerIdx={winnerOf((m) => -comparing.find((c) => c.metrics === m)!.saved.inputs.property.purchasePrice, false)}
                            format={formatCurrency}
                          />
                          <CompareRow
                            label="Total Cash Invested"
                            comparing={comparing}
                            getValue={(c) => c.metrics.totalCashInvested}
                            winnerIdx={winnerOf((m) => m.totalCashInvested, true)}
                            format={formatCurrency}
                          />
                          <CompareRow
                            label="Monthly Cash Flow"
                            comparing={comparing}
                            getValue={(c) => c.metrics.monthlyCashFlow}
                            winnerIdx={winnerOf((m) => m.monthlyCashFlow)}
                            format={formatCurrency}
                            highlight
                          />
                          <CompareRow
                            label="Cash-on-Cash Return"
                            comparing={comparing}
                            getValue={(c) => c.metrics.cocReturn}
                            winnerIdx={winnerOf((m) => m.cocReturn)}
                            format={formatPercent}
                            highlight
                          />
                          <CompareRow
                            label="Cap Rate"
                            comparing={comparing}
                            getValue={(c) => c.metrics.capRate}
                            winnerIdx={winnerOf((m) => m.capRate)}
                            format={formatPercent}
                          />
                          <CompareRow
                            label="DSCR"
                            comparing={comparing}
                            getValue={(c) => c.metrics.dscr}
                            winnerIdx={winnerOf((m) => (isFinite(m.dscr) ? m.dscr : 999))}
                            format={formatDSCR}
                          />
                          <CompareRow
                            label="NOI"
                            comparing={comparing}
                            getValue={(c) => c.metrics.noi}
                            winnerIdx={winnerOf((m) => m.noi)}
                            format={formatCurrency}
                          />
                          <CompareRow
                            label="Break-Even Occupancy"
                            comparing={comparing}
                            getValue={(c) => c.metrics.breakEvenOccupancy}
                            winnerIdx={winnerOf((m) => m.breakEvenOccupancy, true)}
                            format={formatPercent}
                          />
                          <CompareRow
                            label="IRR (w/ Exit)"
                            comparing={comparing}
                            getValue={(c) => c.metrics.irr ?? 0}
                            winnerIdx={winnerOf((m) => m.irr ?? -999)}
                            format={formatPercent}
                            highlight
                          />
                          <CompareRow
                            label="5yr Cumulative CF"
                            comparing={comparing}
                            getValue={(c) => {
                              const year5 = c.metrics.projection[c.metrics.projection.length - 1];
                              return year5?.cumulativeCashFlow ?? 0;
                            }}
                            winnerIdx={winnerOf((m) => {
                              const y5 = m.projection[m.projection.length - 1];
                              return y5?.cumulativeCashFlow ?? 0;
                            })}
                            format={formatCurrency}
                          />
                          <CompareRow
                            label="Year 5 Equity"
                            comparing={comparing}
                            getValue={(c) => {
                              const year5 = c.metrics.projection[c.metrics.projection.length - 1];
                              return year5?.equity ?? 0;
                            }}
                            winnerIdx={winnerOf((m) => {
                              const y5 = m.projection[m.projection.length - 1];
                              return y5?.equity ?? 0;
                            })}
                            format={formatCurrency}
                          />
                        </tbody>
                      </table>
                    </div>
                  )}

                  {comparing.length < 2 && (
                    <div className="text-center py-4 text-[11px] text-text-muted">
                      Select at least 2 deals to compare.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CompareRow({
  label,
  comparing,
  getValue,
  winnerIdx,
  format,
  highlight,
}: {
  label: string;
  comparing: ComputedDeal[];
  getValue: (c: ComputedDeal) => number;
  winnerIdx: number;
  format: (v: number) => string;
  highlight?: boolean;
}) {
  return (
    <tr className={`border-b border-border-default/50 ${highlight ? 'bg-bg-base/30' : ''}`}>
      <td className={`p-2 text-text-muted ${highlight ? 'font-semibold' : ''}`}>{label}</td>
      {comparing.map((c, i) => {
        const value = getValue(c);
        const isWinner = winnerIdx === i && comparing.length > 1;
        return (
          <td
            key={c.saved.id}
            className={`p-2 text-right ${isWinner ? 'text-accent-green font-bold' : 'text-text-foreground'} ${highlight ? 'font-semibold' : ''}`}
          >
            {isWinner && <span className="mr-1">★</span>}
            {format(value)}
          </td>
        );
      })}
    </tr>
  );
}
