'use client';

import { useMemo } from 'react';
import type { DealInputs } from '@/lib/types';
import {
  calculateDepreciableBasis,
  calculateStandardDepreciation,
  calculateCostSegDepreciation,
} from '@/lib/calculations';
import { formatCurrency } from '@/lib/format';

interface Props {
  inputs: DealInputs;
}

export default function TaxComparator({ inputs }: Props) {
  const { tax, property } = inputs;
  if (!tax.enabled) return null;

  const comparison = useMemo(() => {
    const basis = calculateDepreciableBasis(property.purchasePrice, property.landValuePct);
    const combinedRate = (tax.federalBracket + tax.stateTaxRate) / 100;
    const years = 5;

    const rows = [];
    let stdTotal = 0;
    let csTotal = 0;

    for (let y = 1; y <= years; y++) {
      const std = calculateStandardDepreciation(basis, y);
      const cs = calculateCostSegDepreciation(basis, y, tax.bonusDepreciationRate, tax.acceleratedPct);
      stdTotal += std;
      csTotal += cs.total;
      rows.push({
        year: y,
        standard: std,
        costSeg: cs.total,
        delta: cs.total - std,
        stdSavings: std * combinedRate,
        csSavings: cs.total * combinedRate,
      });
    }

    return { rows, stdTotal, csTotal, basis, combinedRate };
  }, [property.purchasePrice, property.landValuePct, tax.federalBracket, tax.stateTaxRate, tax.bonusDepreciationRate, tax.acceleratedPct]);

  const { rows, stdTotal, csTotal, combinedRate } = comparison;
  const totalDeltaSavings = (csTotal - stdTotal) * combinedRate;

  return (
    <div className="rounded-lg border border-border-default bg-bg-surface p-4">
      <h3 className="text-sm font-semibold text-text-foreground mb-1">Tax Strategy Comparison</h3>
      <p className="text-[10px] text-text-muted mb-3">
        Standard 27.5yr depreciation vs cost segregation — 5-year impact at {(combinedRate * 100).toFixed(0)}% combined rate
      </p>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-[10px] border-collapse min-w-[400px]">
          <thead>
            <tr className="border-b border-border-default">
              <th className="p-1.5 text-left text-text-muted font-medium">Year</th>
              <th className="p-1.5 text-right text-text-muted font-medium">Standard</th>
              <th className="p-1.5 text-right text-text-muted font-medium">Cost Seg</th>
              <th className="p-1.5 text-right text-text-muted font-medium">Difference</th>
              <th className="p-1.5 text-right text-text-muted font-medium">Extra Savings</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.year} className={r.year === 1 ? 'bg-bg-elevated/30' : ''}>
                <td className="p-1.5 text-text-muted">Year {r.year}</td>
                <td className="p-1.5 text-right text-text-foreground">{formatCurrency(r.standard)}</td>
                <td className="p-1.5 text-right text-text-foreground font-medium">{formatCurrency(r.costSeg)}</td>
                <td className={`p-1.5 text-right ${r.delta > 0 ? 'text-accent-green' : r.delta < 0 ? 'text-accent-red' : 'text-text-muted'}`}>
                  {r.delta > 0 ? '+' : ''}{formatCurrency(r.delta)}
                </td>
                <td className={`p-1.5 text-right font-medium ${r.csSavings - r.stdSavings > 0 ? 'text-accent-green' : 'text-text-muted'}`}>
                  {r.csSavings - r.stdSavings > 0 ? '+' : ''}{formatCurrency(r.csSavings - r.stdSavings)}
                </td>
              </tr>
            ))}
            <tr className="border-t border-border-default font-semibold">
              <td className="p-1.5 text-text-foreground">5yr Total</td>
              <td className="p-1.5 text-right text-text-foreground">{formatCurrency(stdTotal)}</td>
              <td className="p-1.5 text-right text-text-foreground">{formatCurrency(csTotal)}</td>
              <td className={`p-1.5 text-right ${csTotal - stdTotal > 0 ? 'text-accent-green' : 'text-text-muted'}`}>
                +{formatCurrency(csTotal - stdTotal)}
              </td>
              <td className="p-1.5 text-right text-accent-green">
                +{formatCurrency(totalDeltaSavings)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {totalDeltaSavings > 1000 && (
        <div className="mt-3 px-3 py-2 rounded bg-accent-green-bg text-[11px] text-accent-green">
          Cost segregation generates <span className="font-bold">{formatCurrency(totalDeltaSavings)}</span> more in tax savings over 5 years. Year 1 is front-loaded due to bonus depreciation.
        </div>
      )}

      {totalDeltaSavings <= 1000 && totalDeltaSavings > 0 && (
        <div className="mt-3 px-3 py-2 rounded bg-accent-amber-bg text-[11px] text-accent-amber">
          Cost segregation provides a modest {formatCurrency(totalDeltaSavings)} benefit over 5 years. At this property value, a cost seg study (~$5-8k) may not pay for itself.
        </div>
      )}
    </div>
  );
}
