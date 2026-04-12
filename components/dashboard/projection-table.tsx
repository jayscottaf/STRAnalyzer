'use client';

import type { DealMetrics, DealAction } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/format';

interface Props {
  metrics: DealMetrics;
  appreciationRate: number;
  taxEnabled: boolean;
  dispatch: React.Dispatch<DealAction>;
}

export default function ProjectionTable({ metrics, appreciationRate, taxEnabled, dispatch }: Props) {
  const { projection } = metrics;
  if (projection.length === 0) return null;

  const year5 = projection[projection.length - 1];
  const cumCashFlow = year5?.cumulativeCashFlow ?? 0;
  const yr5Equity = year5?.equity ?? 0;

  return (
    <div className="rounded-lg border border-border-default bg-bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-foreground">5-Year Projection</h3>
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-text-muted">Appreciation:</label>
          <input
            type="number"
            value={appreciationRate}
            onChange={(e) => dispatch({ type: 'UPDATE_APPRECIATION', payload: parseFloat(e.target.value) || 0 })}
            className="w-14 h-6 bg-bg-base border border-border-default rounded text-[10px] text-text-foreground text-center outline-none focus:border-accent-blue"
            min={-5}
            max={20}
            step={0.5}
          />
          <span className="text-[10px] text-text-muted">%/yr</span>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-[10px] border-collapse min-w-[550px]">
          <thead>
            <tr className="border-b border-border-default">
              <th className="p-1.5 text-left text-text-muted font-medium">Metric</th>
              {projection.map((p) => (
                <th key={p.year} className="p-1.5 text-right text-text-muted font-medium">
                  Year {p.year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row label="Gross Revenue" values={projection.map((p) => p.grossRevenue)} />
            <Row label="Operating Expenses" values={projection.map((p) => -p.operatingExpenses)} negative />
            <Row label="NOI" values={projection.map((p) => p.noi)} bold />
            <Row label="Debt Service" values={projection.map((p) => -p.debtService)} negative />
            <Row label="Net Cash Flow" values={projection.map((p) => p.netCashFlow)} bold highlight />
            <Row label="CoC Return" values={projection.map((p) => p.cocReturn)} isPercent />

            {taxEnabled && (
              <>
                <tr><td colSpan={6} className="pt-2 pb-1"><div className="border-t border-border-default" /></td></tr>
                <Row label="Depreciation" values={projection.map((p) => p.depreciation ?? 0)} />
                <Row label="Taxable Income" values={projection.map((p) => p.taxableIncome ?? 0)} highlight />
                <Row label="Tax Savings" values={projection.map((p) => p.taxSavings ?? 0)} />
                <Row label="After-Tax Cash Flow" values={projection.map((p) => p.afterTaxCashFlow ?? 0)} bold highlight />
              </>
            )}

            <tr><td colSpan={6} className="pt-2 pb-1"><div className="border-t border-border-default" /></td></tr>
            <Row label="Property Value" values={projection.map((p) => p.propertyValue)} />
            <Row label="Loan Balance" values={projection.map((p) => p.loanBalance)} />
            <Row label="Equity" values={projection.map((p) => p.equity)} bold />
            <Row label="Cumulative Cash Flow" values={projection.map((p) => p.cumulativeCashFlow)} bold highlight />
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 mt-4 pt-3 border-t border-border-default">
        <div className="flex-1 rounded-lg bg-bg-elevated p-3 text-center">
          <div className="text-[10px] text-text-muted mb-1">5yr Cumulative Cash Flow</div>
          <div className={`text-lg font-bold ${cumCashFlow >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            {formatCurrency(cumCashFlow)}
          </div>
        </div>
        <div className="flex-1 rounded-lg bg-bg-elevated p-3 text-center">
          <div className="text-[10px] text-text-muted mb-1">Year 5 Equity</div>
          <div className="text-lg font-bold text-accent-blue">
            {formatCurrency(yr5Equity)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  values,
  bold,
  highlight,
  negative,
  isPercent,
}: {
  label: string;
  values: number[];
  bold?: boolean;
  highlight?: boolean;
  negative?: boolean;
  isPercent?: boolean;
}) {
  return (
    <tr className={highlight ? 'bg-bg-elevated/50' : ''}>
      <td className={`p-1.5 text-text-muted ${bold ? 'font-semibold' : ''}`}>{label}</td>
      {values.map((v, i) => {
        const display = isPercent ? formatPercent(v) : formatCurrency(v);
        const colorClass = highlight
          ? v >= 0
            ? 'text-accent-green'
            : 'text-accent-red'
          : negative
          ? 'text-accent-red/70'
          : 'text-text-foreground';
        return (
          <td key={i} className={`p-1.5 text-right ${bold ? 'font-semibold' : ''} ${colorClass}`}>
            {display}
          </td>
        );
      })}
    </tr>
  );
}
