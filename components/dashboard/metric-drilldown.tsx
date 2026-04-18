'use client';

import type { DealMetrics } from '@/lib/types';
import { formatCurrency, formatPercent, formatNumber, formatDSCR } from '@/lib/format';

interface Props {
  metricKey: string | null;
  metrics: DealMetrics;
  onClose: () => void;
}

interface DrilldownStep {
  label: string;
  value: string;
  op?: string;
  highlight?: boolean;
}

function getSteps(key: string, m: DealMetrics): { title: string; formula: string; steps: DrilldownStep[] } | null {
  switch (key) {
    case 'monthlyCashFlow':
      return {
        title: 'Monthly Cash Flow',
        formula: '(EGI - OpEx - Debt Service) / 12',
        steps: [
          { label: 'Gross Revenue', value: formatCurrency(m.grossRevenue) },
          { label: 'Platform Fees', value: formatCurrency(-m.platformFees), op: '-' },
          { label: 'Effective Gross Income', value: formatCurrency(m.effectiveGrossIncome), op: '=', highlight: true },
          { label: 'Total Operating Expenses', value: formatCurrency(-m.totalOperatingExpenses), op: '-' },
          { label: 'NOI', value: formatCurrency(m.noi), op: '=', highlight: true },
          { label: 'Annual Debt Service', value: formatCurrency(-m.debtService), op: '-' },
          { label: 'Annual Cash Flow', value: formatCurrency(m.annualCashFlow), op: '=', highlight: true },
          { label: 'Monthly Cash Flow', value: formatCurrency(m.monthlyCashFlow), op: '÷12', highlight: true },
        ],
      };
    case 'cocReturn':
      return {
        title: 'Cash-on-Cash Return',
        formula: 'Annual Cash Flow / Total Cash Invested × 100',
        steps: [
          { label: 'Annual Cash Flow', value: formatCurrency(m.annualCashFlow) },
          { label: 'Total Cash Invested', value: formatCurrency(m.totalCashInvested), op: '÷' },
          { label: 'Cash-on-Cash Return', value: formatPercent(m.cocReturn), op: '=', highlight: true },
          ...(m.trueCocReturn !== null ? [
            { label: 'After-Tax CF', value: formatCurrency(m.taxBenefits?.afterTaxCashFlow ?? 0), op: '' },
            { label: 'True CoC (w/ tax)', value: formatPercent(m.trueCocReturn), op: '=', highlight: true },
          ] : []),
        ],
      };
    case 'capRate':
      return {
        title: 'Cap Rate',
        formula: 'NOI / Purchase Price × 100',
        steps: [
          { label: 'NOI', value: formatCurrency(m.noi) },
          { label: 'Purchase Price', value: formatCurrency(m.totalCashInvested + m.loanAmount), op: '÷' },
          { label: 'Cap Rate', value: formatPercent(m.capRate), op: '=', highlight: true },
        ],
      };
    case 'dscr':
      return {
        title: 'Debt Service Coverage Ratio',
        formula: 'NOI / Annual Debt Service',
        steps: [
          { label: 'NOI', value: formatCurrency(m.noi) },
          { label: 'Annual Debt Service', value: m.debtService > 0 ? formatCurrency(m.debtService) : 'N/A (cash)', op: '÷' },
          { label: 'DSCR', value: formatDSCR(m.dscr), op: '=', highlight: true },
        ],
      };
    case 'noi':
      return {
        title: 'Net Operating Income',
        formula: 'EGI - Operating Expenses',
        steps: [
          { label: 'Gross Revenue', value: formatCurrency(m.grossRevenue) },
          { label: 'Platform Fees', value: formatCurrency(-m.platformFees), op: '-' },
          { label: 'EGI', value: formatCurrency(m.effectiveGrossIncome), op: '=' },
          { label: 'Property Tax', value: formatCurrency(-m.expenseBreakdown.propertyTax), op: '-' },
          { label: 'Insurance', value: formatCurrency(-m.expenseBreakdown.insurance), op: '-' },
          { label: 'Utilities', value: formatCurrency(-m.expenseBreakdown.utilities), op: '-' },
          { label: 'Maintenance', value: formatCurrency(-m.expenseBreakdown.maintenance), op: '-' },
          { label: 'Other OpEx', value: formatCurrency(-(m.expenseBreakdown.supplies + m.expenseBreakdown.software + m.expenseBreakdown.hoa + m.expenseBreakdown.strPermit + (m.expenseBreakdown.capex ?? 0) + m.expenseBreakdown.propertyManagement)), op: '-' },
          { label: 'NOI', value: formatCurrency(m.noi), op: '=', highlight: true },
        ],
      };
    case 'totalCashInvested':
      return {
        title: 'Total Cash Required',
        formula: 'Down Payment + Closing Costs + Furnishing + Cash Reserves',
        steps: [
          { label: 'Purchase Price', value: formatCurrency(m.totalCashInvested + m.loanAmount - m.totalCashInvested + m.totalCashInvested) },
          { label: 'Loan Amount', value: formatCurrency(m.loanAmount) },
          { label: 'Down Payment', value: formatCurrency(m.totalCashInvested + m.loanAmount - m.loanAmount - 0) },
          { label: 'LTV', value: formatPercent(m.ltv), highlight: true },
          { label: 'Total Cash Required', value: formatCurrency(m.totalCashInvested), op: '=', highlight: true },
        ],
      };
    case 'breakEvenOccupancy':
      return {
        title: 'Break-Even Occupancy',
        formula: 'Fixed Costs / (Revenue per Night × (1 - Variable %))',
        steps: [
          { label: 'Total Fixed Expenses + Debt Service', value: formatCurrency(m.totalOperatingExpenses + m.debtService) },
          { label: 'Nights Needed to Break Even', value: formatNumber(365 * m.breakEvenOccupancy / 100, 0) },
          { label: 'Break-Even Occupancy', value: formatPercent(m.breakEvenOccupancy), op: '=', highlight: true },
          { label: 'Current Occupancy', value: formatPercent(m.nightsBooked / 365 * 100) },
          { label: 'Safety Margin', value: formatPercent(Math.max(m.nightsBooked / 365 * 100 - m.breakEvenOccupancy, 0)), highlight: true },
        ],
      };
    case 'grossRentalYield':
      return {
        title: 'Gross Rental Yield',
        formula: 'Gross Revenue / Purchase Price × 100',
        steps: [
          { label: 'Gross Revenue', value: formatCurrency(m.grossRevenue) },
          { label: `${formatNumber(m.nightsBooked, 0)} nights × ADR + ${formatNumber(m.turns, 0)} turns × cleaning fee`, value: '' },
          { label: 'Purchase Price', value: formatCurrency(m.totalCashInvested + m.loanAmount), op: '÷' },
          { label: 'Gross Rental Yield', value: formatPercent(m.grossRentalYield), op: '=', highlight: true },
          { label: 'RevPAR', value: formatCurrency(m.revpar) },
        ],
      };
    case 'irr':
      return {
        title: 'Internal Rate of Return',
        formula: 'Rate where NPV of all cash flows = 0',
        steps: [
          { label: 'Initial Investment', value: formatCurrency(-m.totalCashInvested), op: 'Year 0' },
          ...m.projection.slice(0, (m.exitAnalysis ? Math.min(m.projection.length, 5) : 5)).map((p) => ({
            label: `Year ${p.year} Cash Flow`,
            value: formatCurrency(p.afterTaxCashFlow ?? p.netCashFlow),
            op: `Year ${p.year}`,
          })),
          ...(m.exitAnalysis ? [{ label: 'After-Tax Exit Proceeds', value: formatCurrency(m.exitAnalysis.afterTaxProceeds), op: '+' }] : []),
          { label: 'IRR', value: m.irr !== null ? formatPercent(m.irr) : 'N/A', op: '=', highlight: true },
        ],
      };
    case 'totalReturnPct':
      return {
        title: '5yr Total Return',
        formula: '(Cumulative CF + Appreciation + Principal Paydown) / Cash Invested',
        steps: (() => {
          const yr5 = m.projection[m.projection.length - 1];
          if (!yr5) return [];
          const appreciation = yr5.propertyValue - (m.totalCashInvested + m.loanAmount);
          const paydown = m.loanAmount - yr5.loanBalance;
          return [
            { label: '5yr Cumulative Cash Flow', value: formatCurrency(yr5.cumulativeCashFlow) },
            { label: 'Property Appreciation', value: formatCurrency(appreciation), op: '+' },
            { label: 'Principal Paydown', value: formatCurrency(paydown), op: '+' },
            { label: 'Total Wealth Created', value: formatCurrency(yr5.cumulativeCashFlow + appreciation + paydown), op: '=', highlight: true },
            { label: 'Cash Invested', value: formatCurrency(m.totalCashInvested), op: '÷' },
            { label: 'Total Return', value: formatPercent(yr5.totalReturn), op: '=', highlight: true },
          ];
        })(),
      };
    default:
      return null;
  }
}

export default function MetricDrilldown({ metricKey, metrics, onClose }: Props) {
  if (!metricKey) return null;

  const data = getSteps(metricKey, metrics);
  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-bg-elevated border border-border-light rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
          <div>
            <h3 className="text-sm font-semibold text-text-foreground">{data.title}</h3>
            <p className="text-[10px] text-text-muted font-mono mt-0.5">{data.formula}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-bg-hover text-text-muted"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-1">
          {data.steps.map((step, i) => (
            <div
              key={i}
              className={`flex items-center justify-between py-1.5 px-2 rounded ${
                step.highlight ? 'bg-bg-base font-semibold' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                {step.op && (
                  <span className="text-[10px] text-text-muted w-5 text-center font-mono">{step.op}</span>
                )}
                <span className={`text-xs ${step.highlight ? 'text-text-foreground' : 'text-text-muted'}`}>
                  {step.label}
                </span>
              </div>
              <span className={`text-xs font-mono ${step.highlight ? 'text-accent-green' : 'text-text-foreground'}`}>
                {step.value}
              </span>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-border-default">
          <p className="text-[9px] text-text-muted">
            Click anywhere outside this panel to close. All calculations are real-time based on current inputs.
          </p>
        </div>
      </div>
    </div>
  );
}
