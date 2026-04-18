'use client';

import { useState } from 'react';
import type { DealInputs, DealAction } from '@/lib/types';
import { calculateAllMetrics } from '@/lib/calculations';
import { formatCurrency, formatPercent } from '@/lib/format';

interface Props {
  inputs: DealInputs;
  dispatch: React.Dispatch<DealAction>;
}

type Target = 'coc' | 'dscr' | 'cashflow';

function solve(
  inputs: DealInputs,
  target: Target,
  targetValue: number,
): number | null {
  // Binary search purchasePrice between 10% and 500% of current
  let lo = inputs.property.purchasePrice * 0.1;
  let hi = inputs.property.purchasePrice * 5;

  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const test: DealInputs = {
      ...inputs,
      property: { ...inputs.property, purchasePrice: mid },
    };
    const m = calculateAllMetrics(test);

    let value: number;
    if (target === 'coc') value = m.cocReturn;
    else if (target === 'dscr') value = isFinite(m.dscr) ? m.dscr : 999;
    else value = m.monthlyCashFlow;

    if (Math.abs(value - targetValue) < (target === 'dscr' ? 0.01 : target === 'cashflow' ? 10 : 0.05)) {
      return mid;
    }

    // For CoC, DSCR, cashflow — all higher when price is lower
    if (value < targetValue) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  // Check final mid for validity
  const final = (lo + hi) / 2;
  if (final < inputs.property.purchasePrice * 0.1 || final > inputs.property.purchasePrice * 5) {
    return null;
  }
  return final;
}

export default function OfferSolver({ inputs, dispatch }: Props) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<Target>('coc');
  const [targetValue, setTargetValue] = useState(10);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSolve() {
    setError(null);
    const solved = solve(inputs, target, targetValue);
    if (solved === null || solved <= 0) {
      setError('No valid offer price found. Try a less aggressive target.');
      setResult(null);
    } else {
      setResult(solved);
    }
  }

  function handleApply() {
    if (result === null) return;
    dispatch({
      type: 'UPDATE_PROPERTY',
      payload: { purchasePrice: Math.round(result / 1000) * 1000 },
    });
    setOpen(false);
    setResult(null);
  }

  const priceDelta = result !== null ? result - inputs.property.purchasePrice : 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-accent-blue/40 bg-accent-blue-bg px-3 py-2 text-xs font-medium text-accent-blue hover:bg-accent-blue/20 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Offer Price Solver
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md bg-bg-elevated border border-border-light rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
              <h3 className="text-sm font-semibold text-text-foreground">Solve for Offer Price</h3>
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

            <div className="p-4">
              <p className="text-[11px] text-text-muted mb-3">
                What offer price do I need to make to hit my target return? Everything else stays fixed — only the purchase price changes.
              </p>

              <div className="mb-3">
                <label className="text-[10px] text-text-muted mb-1 block">Target Metric</label>
                <select
                  value={target}
                  onChange={(e) => {
                    const t = e.target.value as Target;
                    setTarget(t);
                    setTargetValue(t === 'coc' ? 10 : t === 'dscr' ? 1.25 : 500);
                    setResult(null);
                  }}
                  className="w-full h-8 bg-bg-base border border-border-default rounded-md text-xs text-text-foreground px-2.5 outline-none focus:border-accent-blue"
                >
                  <option value="coc">Cash-on-Cash Return</option>
                  <option value="dscr">DSCR</option>
                  <option value="cashflow">Monthly Cash Flow</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="text-[10px] text-text-muted mb-1 block">
                  Target Value {target === 'coc' && '(%)'}
                  {target === 'dscr' && '(ratio)'}
                  {target === 'cashflow' && '($)'}
                </label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(parseFloat(e.target.value) || 0)}
                  step={target === 'dscr' ? 0.05 : target === 'cashflow' ? 100 : 0.5}
                  className="w-full h-8 bg-bg-base border border-border-default rounded-md text-xs text-text-foreground px-2.5 outline-none focus:border-accent-blue"
                />
              </div>

              <button
                type="button"
                onClick={handleSolve}
                className="w-full h-9 bg-accent-blue text-white text-xs font-medium rounded-md hover:bg-accent-blue/90 transition-colors"
              >
                Solve
              </button>

              {error && (
                <div className="mt-3 px-3 py-2 rounded bg-accent-red-bg text-xs text-accent-red">
                  {error}
                </div>
              )}

              {result !== null && (
                <div className="mt-4 pt-3 border-t border-border-default">
                  <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">
                    Required Offer Price
                  </div>
                  <div className="text-2xl font-bold text-accent-green mb-1">
                    {formatCurrency(Math.round(result / 1000) * 1000)}
                  </div>
                  <div className="text-[11px] text-text-muted mb-3">
                    Current price: {formatCurrency(inputs.property.purchasePrice)}
                    {' — '}
                    <span className={priceDelta < 0 ? 'text-accent-green' : 'text-accent-red'}>
                      {priceDelta < 0 ? '-' : '+'}{formatPercent(Math.abs(priceDelta) / inputs.property.purchasePrice * 100)} ({formatCurrency(Math.abs(priceDelta))})
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="flex-1 h-8 px-3 text-[11px] font-medium rounded-md border border-border-default text-text-muted hover:text-text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApply}
                      className="flex-1 h-8 px-3 text-[11px] font-medium rounded-md bg-accent-green text-white hover:bg-accent-green/90"
                    >
                      Apply to Form
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
