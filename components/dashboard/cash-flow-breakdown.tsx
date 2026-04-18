'use client';

import type { DealMetrics } from '@/lib/types';
import { formatCurrency, formatNumber } from '@/lib/format';

interface Props {
  metrics: DealMetrics;
}

function LineItem({ label, amount, indent, bold, color }: {
  label: string;
  amount: number;
  indent?: boolean;
  bold?: boolean;
  color?: 'green' | 'red' | 'amber';
}) {
  const colorClass = color === 'green' ? 'text-accent-green' : color === 'red' ? 'text-accent-red' : color === 'amber' ? 'text-accent-amber' : 'text-text-foreground';
  return (
    <div className={`flex justify-between py-0.5 ${indent ? 'pl-3' : ''} ${bold ? 'font-semibold' : ''}`}>
      <span className="text-xs text-text-muted">{label}</span>
      <span className={`text-xs ${colorClass}`}>{formatCurrency(amount)}</span>
    </div>
  );
}

export default function CashFlowBreakdown({ metrics }: Props) {
  const { expenseBreakdown: eb } = metrics;

  return (
    <div className="rounded-lg border border-border-default bg-bg-surface p-4">
      <h3 className="text-sm font-semibold text-text-foreground mb-3">Cash Flow Breakdown</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Income */}
        <div>
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Income</div>
          <LineItem label="Gross Revenue" amount={metrics.grossRevenue} />
          <LineItem label="Platform Fees" amount={-metrics.platformFees} indent />
          <div className="border-t border-border-default mt-1 pt-1">
            <LineItem label="Effective Gross Income" amount={metrics.effectiveGrossIncome} bold />
          </div>
          <div className="mt-2 text-[10px] text-text-muted">
            {formatNumber(metrics.nightsBooked, 0)} nights booked &middot; {formatNumber(metrics.turns, 0)} turns/yr
          </div>
        </div>

        {/* Expenses */}
        <div>
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Expenses</div>
          <LineItem label="Property Tax" amount={eb.propertyTax} indent />
          <LineItem label="Insurance" amount={eb.insurance} indent />
          {eb.hoa > 0 && <LineItem label="HOA" amount={eb.hoa} indent />}
          <LineItem label="Utilities" amount={eb.utilities} indent />
          <LineItem label="Maintenance" amount={eb.maintenance} indent />
          {eb.capex > 0 && <LineItem label="CapEx Reserve" amount={eb.capex} indent />}
          {eb.propertyManagement > 0 && <LineItem label="Property Mgmt" amount={eb.propertyManagement} indent />}
          <LineItem label="Supplies" amount={eb.supplies} indent />
          <LineItem label="Software" amount={eb.software} indent />
          {eb.strPermit > 0 && <LineItem label="STR Permit" amount={eb.strPermit} indent />}
          <div className="border-t border-border-default mt-1 pt-1">
            <LineItem label="Total Operating Expenses" amount={metrics.totalOperatingExpenses} bold />
          </div>
        </div>
      </div>

      {/* Bottom summary */}
      <div className="mt-4 pt-3 border-t border-border-default space-y-1">
        <LineItem label="Net Operating Income (NOI)" amount={metrics.noi} bold />
        {metrics.debtService > 0 && (
          <LineItem label="Debt Service" amount={-metrics.debtService} />
        )}
        <div className="border-t border-border-default pt-1 mt-1">
          <div className="flex justify-between">
            <span className="text-xs font-semibold text-text-foreground">Annual Net Cash Flow</span>
            <span className={`text-sm font-bold ${metrics.annualCashFlow >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
              {formatCurrency(metrics.annualCashFlow)}
            </span>
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-xs text-text-muted">Monthly</span>
            <span className={`text-xs font-semibold ${metrics.monthlyCashFlow >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
              {formatCurrency(metrics.monthlyCashFlow)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
