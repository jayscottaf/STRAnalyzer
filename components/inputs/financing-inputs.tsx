'use client';

import type { FinancingInputs as FinancingInputsType, PropertyInputs } from '@/lib/types';
import { LOAN_TYPES, LOAN_TERMS } from '@/lib/constants';
import { formatCurrency } from '@/lib/format';
import InputField from './input-field';

interface Props {
  values: FinancingInputsType;
  property: PropertyInputs;
  onChange: (updates: Partial<FinancingInputsType>) => void;
}

export default function FinancingInputs({ values, property, onChange }: Props) {
  const isCash = values.loanType === 'cash';
  const loanAmount = isCash
    ? 0
    : property.purchasePrice * (1 - values.downPaymentPct / 100);
  const downPaymentAmount = property.purchasePrice - loanAmount;

  return (
    <div>
      <div className="mb-3">
        <label className="text-xs font-medium text-text-muted mb-1 block">Loan Type</label>
        <select
          value={values.loanType}
          onChange={(e) => onChange({ loanType: e.target.value as FinancingInputsType['loanType'] })}
          className="w-full h-8 bg-bg-base border border-border-default rounded-md text-xs text-text-foreground px-2.5 outline-none focus:border-accent-blue"
        >
          {LOAN_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        {values.loanType === 'dscr' && (
          <p className="mt-1 text-[10px] text-accent-amber">
            DSCR loans qualify on property income, not W-2. Typically 0.5-1% higher rate.
          </p>
        )}
      </div>

      {!isCash && (
        <>
          <InputField
            label="Down Payment"
            value={values.downPaymentPct}
            onChange={(v) => onChange({ downPaymentPct: v as number })}
            suffix="%"
            min={0}
            max={100}
            step={1}
          />
          <div className="flex justify-between text-[10px] text-text-muted -mt-2 mb-3 px-0.5">
            <span>Down: {formatCurrency(downPaymentAmount)}</span>
            <span>Loan: {formatCurrency(loanAmount)}</span>
          </div>

          <InputField
            label="Interest Rate"
            value={values.interestRate}
            onChange={(v) => onChange({ interestRate: v as number })}
            suffix="%"
            min={0}
            max={25}
            step={0.125}
          />

          <div className="mb-3">
            <label className="text-xs font-medium text-text-muted mb-1 block">Loan Term</label>
            <select
              value={values.loanTerm}
              onChange={(e) => onChange({ loanTerm: parseInt(e.target.value) as 15 | 20 | 30 })}
              className="w-full h-8 bg-bg-base border border-border-default rounded-md text-xs text-text-foreground px-2.5 outline-none focus:border-accent-blue"
            >
              {LOAN_TERMS.map((t) => (
                <option key={t} value={t}>{t} years</option>
              ))}
            </select>
          </div>
        </>
      )}

      <InputField
        label="Closing Costs"
        value={values.closingCostsPct}
        onChange={(v) => onChange({ closingCostsPct: v as number })}
        suffix="%"
        min={0}
        max={10}
        step={0.5}
      />

      <InputField
        label="Furnishing Budget"
        value={values.furnishingBudget}
        onChange={(v) => onChange({ furnishingBudget: v as number })}
        prefix="$"
        min={0}
        step={1000}
      />

      <InputField
        label="Cash Reserves"
        value={values.cashReserveMonths}
        onChange={(v) => onChange({ cashReserveMonths: v as number })}
        suffix="months"
        min={0}
        max={24}
        step={1}
        tooltip="Months of PITIA held in reserve. Lenders typically require 3-6."
      />
    </div>
  );
}
