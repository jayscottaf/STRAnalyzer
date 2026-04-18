'use client';

import type { DealMetrics } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/format';

interface Props {
  metrics: DealMetrics;
}

export default function TaxBenefitPanel({ metrics }: Props) {
  const tax = metrics.taxBenefits;
  if (!tax) return null;

  const dep = tax.depreciation;
  const isCostSeg = dep.personalProperty !== undefined;
  const paperLoss = tax.taxableIncome < 0 ? Math.abs(tax.taxableIncome) : 0;
  const ps = tax.passiveStatus;

  return (
    <div className="rounded-lg border border-border-default bg-bg-surface p-4">
      <h3 className="text-sm font-semibold text-text-foreground mb-3">Tax Benefits (Year 1)</h3>

      {/* Passive Activity Status Banner */}
      {ps && (
        <div className={`px-3 py-2 rounded text-[11px] mb-4 ${
          ps.isNonPassive
            ? 'bg-accent-green-bg text-accent-green'
            : 'bg-accent-amber-bg text-accent-amber'
        }`}>
          <span className="font-semibold">{ps.isNonPassive ? 'Non-Passive' : 'Passive'}</span>
          {' — '}{ps.pathway}
        </div>
      )}

      {/* Depreciation Breakdown */}
      <div className="mb-3">
        <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
          Depreciation {isCostSeg ? '(Cost Segregation)' : '(Standard 27.5yr)'}
        </div>

        {isCostSeg ? (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">5yr Personal Property</span>
              <span className="text-text-foreground">{formatCurrency(dep.personalProperty ?? 0)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">15yr Land Improvements</span>
              <span className="text-text-foreground">{formatCurrency(dep.landImprovements ?? 0)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">27.5yr Building Structure</span>
              <span className="text-text-foreground">{formatCurrency(dep.buildingStructure ?? 0)}</span>
            </div>
            {(dep.bonusDepreciation ?? 0) > 0 && (
              <div className="flex justify-between text-xs mt-1 px-2 py-1 rounded bg-accent-green-bg">
                <span className="text-accent-green font-medium">Bonus Depreciation Included</span>
                <span className="text-accent-green font-medium">{formatCurrency(dep.bonusDepreciation ?? 0)}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Standard Depreciation</span>
            <span className="text-text-foreground">{formatCurrency(dep.standard ?? dep.total)}</span>
          </div>
        )}

        <div className="flex justify-between text-xs font-semibold mt-1 pt-1 border-t border-border-default">
          <span>Total Depreciation</span>
          <span>{formatCurrency(dep.total)}</span>
        </div>
      </div>

      {/* Mortgage Interest */}
      {tax.mortgageInterest > 0 && (
        <div className="flex justify-between text-xs mb-3">
          <span className="text-text-muted">Mortgage Interest (Year 1)</span>
          <span className="text-text-foreground">{formatCurrency(tax.mortgageInterest)}</span>
        </div>
      )}

      {/* Taxable Income */}
      <div className="flex justify-between text-xs font-semibold mb-1">
        <span>Taxable Income</span>
        <span className={tax.taxableIncome < 0 ? 'text-accent-green' : 'text-accent-red'}>
          {formatCurrency(tax.taxableIncome)}
        </span>
      </div>

      {/* QBI Deduction */}
      {tax.qbiDeduction > 0 && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-text-muted">QBI Deduction (20%)</span>
          <span className="text-accent-green">-{formatCurrency(tax.qbiDeduction)}</span>
        </div>
      )}

      {/* Tax Savings or Tax Owed */}
      {tax.taxSavings > 0 ? (
        <>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text-muted">Tax Savings at {formatPercent(tax.combinedRate * 100, 0)}</span>
            <span className="text-accent-green font-semibold">{formatCurrency(tax.taxSavings)}</span>
          </div>
          <div className="flex justify-between text-xs font-semibold">
            <span>After-Tax Cash Flow</span>
            <span className={tax.afterTaxCashFlow >= 0 ? 'text-accent-green' : 'text-accent-red'}>
              {formatCurrency(tax.afterTaxCashFlow)}
            </span>
          </div>
          {metrics.trueCocReturn !== null && (
            <div className="flex justify-between text-xs mt-1">
              <span className="text-text-muted">True CoC Return</span>
              <span className="text-accent-green font-semibold">{formatPercent(metrics.trueCocReturn)}</span>
            </div>
          )}
        </>
      ) : tax.taxSavings < 0 ? (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-text-muted">Tax Owed at {formatPercent(tax.combinedRate * 100, 0)}</span>
          <span className="text-accent-red font-semibold">{formatCurrency(tax.taxSavings)}</span>
        </div>
      ) : null}

      {/* Passive loss without non-passive status */}
      {!ps?.isNonPassive && tax.taxableIncome < 0 && tax.taxSavings === 0 && (
        <div className="mt-3 px-3 py-2 rounded bg-accent-amber-bg text-[11px] text-accent-amber">
          This {formatCurrency(paperLoss)} paper loss is passive and will carry forward. Enable material participation{ps?.tier === 'long' ? ' and Real Estate Professional status' : ''} to offset W-2 income.
        </div>
      )}

      {/* Non-passive + significant paper loss */}
      {ps?.isNonPassive && paperLoss > 5000 && tax.taxSavings > 0 && (
        <div className="mt-3 px-3 py-2 rounded bg-accent-green-bg text-[11px] text-accent-green">
          {formatCurrency(paperLoss)} paper loss offsets W-2 income, generating {formatCurrency(tax.taxSavings)} in real tax savings.
        </div>
      )}

      {/* Exit Analysis */}
      {metrics.exitAnalysis && (
        <div className="mt-4 pt-3 border-t border-border-default">
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
            Exit Analysis (Year {metrics.exitAnalysis.is1031 ? '— 1031 Exchange' : ''})
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Projected Sale Price</span>
              <span>{formatCurrency(metrics.exitAnalysis.salePrice)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Selling Costs</span>
              <span className="text-accent-red/70">-{formatCurrency(metrics.exitAnalysis.sellingCosts)}</span>
            </div>
            {metrics.exitAnalysis.loanPayoff > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Loan Payoff</span>
                <span className="text-accent-red/70">-{formatCurrency(metrics.exitAnalysis.loanPayoff)}</span>
              </div>
            )}
            {!metrics.exitAnalysis.is1031 && (
              <>
                {metrics.exitAnalysis.depreciationRecapture > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Depreciation Recapture (25%)</span>
                    <span className="text-accent-red">-{formatCurrency(metrics.exitAnalysis.depreciationRecapture)}</span>
                  </div>
                )}
                {metrics.exitAnalysis.capitalGainTax > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Capital Gains Tax</span>
                    <span className="text-accent-red">-{formatCurrency(metrics.exitAnalysis.capitalGainTax)}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between text-xs font-semibold pt-1 border-t border-border-default">
              <span>After-Tax Proceeds</span>
              <span className="text-accent-green">{formatCurrency(metrics.exitAnalysis.afterTaxProceeds)}</span>
            </div>
          </div>
          {metrics.exitAnalysis.is1031 && (
            <div className="mt-2 px-2 py-1.5 rounded bg-accent-green-bg text-[10px] text-accent-green">
              1031 exchange defers all depreciation recapture and capital gains taxes.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
