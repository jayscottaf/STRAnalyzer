'use client';

import type { DealInputs, DealMetrics, AIAnalysis } from '@/lib/types';
import { formatCurrency, formatPercent, formatDSCR } from '@/lib/format';

interface Props {
  inputs: DealInputs;
  metrics: DealMetrics;
  aiAnalysis: AIAnalysis | null;
}

export default function PdfExport({ inputs, metrics, aiAnalysis }: Props) {
  function handlePrint() {
    // Use the browser's native print-to-PDF via window.print
    window.print();
  }

  const year5 = metrics.projection[metrics.projection.length - 1];
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <>
      <button
        type="button"
        onClick={handlePrint}
        className="rounded-lg border border-accent-blue/40 bg-accent-blue-bg px-3 py-2 text-xs font-medium text-accent-blue hover:bg-accent-blue/20 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print / Export PDF
      </button>

      {/* Print-only report — invisible on screen, visible when printing */}
      <div className="print-report" style={{ position: 'absolute', left: '-9999px', top: 0, width: '8.5in', background: 'white', color: 'black', padding: '0.5in', fontSize: '11px', fontFamily: 'sans-serif' }}>
        <div className="mb-6 pb-4 border-b-2 border-black">
          <h1 className="text-2xl font-bold">STR Deal Analysis Report</h1>
          <p className="text-xs text-gray-600 mt-1">
            {inputs.property.market || 'Property'} &middot; Generated {date}
          </p>
        </div>

        {/* Property Summary */}
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide mb-2 border-b border-gray-300 pb-1">Property Summary</h2>
          <div className="grid grid-cols-4 gap-4 text-[11px]">
            <PrintField label="Type" value={inputs.property.propertyType} />
            <PrintField label="Bedrooms" value={inputs.property.bedrooms.toString()} />
            <PrintField label="Bathrooms" value={inputs.property.bathrooms.toString()} />
            <PrintField label="Sq Ft" value={inputs.property.sqft.toLocaleString()} />
            <PrintField label="Year Built" value={inputs.property.yearBuilt.toString()} />
            <PrintField label="Purchase Price" value={formatCurrency(inputs.property.purchasePrice)} />
            <PrintField label="Land Value" value={`${inputs.property.landValuePct}%`} />
            <PrintField label="Market" value={inputs.property.market || 'Not specified'} />
          </div>
        </section>

        {/* Financing */}
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide mb-2 border-b border-gray-300 pb-1">Financing</h2>
          <div className="grid grid-cols-4 gap-4 text-[11px]">
            <PrintField label="Loan Type" value={inputs.financing.loanType} />
            {inputs.financing.loanType !== 'cash' && (
              <>
                <PrintField label="Down Payment" value={`${inputs.financing.downPaymentPct}%`} />
                <PrintField label="Interest Rate" value={`${inputs.financing.interestRate}%`} />
                <PrintField label="Loan Term" value={`${inputs.financing.loanTerm}yr`} />
                <PrintField label="Loan Amount" value={formatCurrency(metrics.loanAmount)} />
                <PrintField label="Monthly P&I" value={formatCurrency(metrics.monthlyPayment)} />
              </>
            )}
            <PrintField label="Total Cash Required" value={formatCurrency(metrics.totalCashInvested)} />
          </div>
        </section>

        {/* Key Metrics */}
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide mb-2 border-b border-gray-300 pb-1">Key Metrics</h2>
          <div className="grid grid-cols-4 gap-x-4 gap-y-2">
            <PrintMetric label="Monthly Cash Flow" value={formatCurrency(metrics.monthlyCashFlow)} />
            <PrintMetric label="Cash-on-Cash Return" value={formatPercent(metrics.cocReturn)} />
            <PrintMetric label="Cap Rate" value={formatPercent(metrics.capRate)} />
            <PrintMetric label="DSCR" value={formatDSCR(metrics.dscr)} />
            <PrintMetric label="NOI" value={formatCurrency(metrics.noi)} />
            <PrintMetric label="Break-Even Occupancy" value={formatPercent(metrics.breakEvenOccupancy)} />
            <PrintMetric label="Gross Rental Yield" value={formatPercent(metrics.grossRentalYield)} />
            {metrics.irr !== null && <PrintMetric label="IRR (w/ Exit)" value={formatPercent(metrics.irr)} />}
          </div>
        </section>

        {/* 5-Year Projection */}
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide mb-2 border-b border-gray-300 pb-1">5-Year Projection</h2>
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="p-1 text-left">Metric</th>
                {metrics.projection.map((p) => (
                  <th key={p.year} className="p-1 text-right">Year {p.year}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <PrintRow label="Gross Revenue" values={metrics.projection.map((p) => p.grossRevenue)} />
              <PrintRow label="NOI" values={metrics.projection.map((p) => p.noi)} />
              <PrintRow label="Net Cash Flow" values={metrics.projection.map((p) => p.netCashFlow)} bold />
              <PrintRow label="Property Value" values={metrics.projection.map((p) => p.propertyValue)} />
              <PrintRow label="Equity" values={metrics.projection.map((p) => p.equity)} bold />
              <PrintRow label="Cumulative CF" values={metrics.projection.map((p) => p.cumulativeCashFlow)} />
            </tbody>
          </table>
          {year5 && (
            <div className="mt-2 text-[11px] flex gap-6">
              <span><b>5yr Cumulative CF:</b> {formatCurrency(year5.cumulativeCashFlow)}</span>
              <span><b>Year 5 Equity:</b> {formatCurrency(year5.equity)}</span>
            </div>
          )}
        </section>

        {/* AI Analysis */}
        {aiAnalysis && (
          <section className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wide mb-2 border-b border-gray-300 pb-1">
              AI Deal Analysis — Verdict: {aiAnalysis.verdict}
            </h2>
            <p className="text-[11px] italic mb-3">{aiAnalysis.verdict_reasoning}</p>
            <div className="grid grid-cols-2 gap-4 text-[10px]">
              <PrintTextBlock title="Market Assessment" content={aiAnalysis.market_assessment} />
              <PrintTextBlock title="Revenue Validation" content={aiAnalysis.revenue_validation} />
              <PrintTextBlock title="Deal Quality" content={aiAnalysis.deal_quality} />
              {aiAnalysis.tax_strategy && <PrintTextBlock title="Tax Strategy" content={aiAnalysis.tax_strategy} />}
            </div>
            {aiAnalysis.recommended_actions.length > 0 && (
              <div className="mt-3">
                <b className="text-[10px]">Recommended Actions:</b>
                <ol className="list-decimal list-inside text-[10px] mt-1 space-y-0.5">
                  {aiAnalysis.recommended_actions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        )}

        {/* Notes */}
        {inputs.notes && inputs.notes.trim().length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wide mb-2 border-b border-gray-300 pb-1">Notes</h2>
            <p className="text-[11px] whitespace-pre-wrap">{inputs.notes}</p>
          </section>
        )}

        <footer className="mt-8 pt-4 border-t border-gray-300 text-[9px] text-gray-600">
          Generated by STR Deal Analyzer. This report is for informational purposes only and does not constitute financial, tax, or legal advice. Consult qualified professionals before making investment decisions.
        </footer>
      </div>
    </>
  );
}

function PrintField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] text-gray-600 uppercase tracking-wider">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function PrintMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-300 rounded p-2">
      <div className="text-[9px] text-gray-600 uppercase tracking-wider">{label}</div>
      <div className="font-bold text-sm">{value}</div>
    </div>
  );
}

function PrintRow({ label, values, bold }: { label: string; values: number[]; bold?: boolean }) {
  return (
    <tr className={`border-b border-gray-200 ${bold ? 'font-bold' : ''}`}>
      <td className="p-1">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="p-1 text-right">{formatCurrency(v)}</td>
      ))}
    </tr>
  );
}

function PrintTextBlock({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <b className="block mb-1">{title}</b>
      <p>{content}</p>
    </div>
  );
}
