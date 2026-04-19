'use client';

import type { LTRInputs as LTRInputsType, PropertyInputs } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import InputField from './input-field';

interface Props {
  values: LTRInputsType;
  property: PropertyInputs;
  onChange: (updates: Partial<LTRInputsType>) => void;
}

export default function LTRInputs({ values, property, onChange }: Props) {
  const annualRent = values.monthlyRent * 12;
  const grm = property.purchasePrice > 0 && annualRent > 0
    ? property.purchasePrice / annualRent
    : 0;
  const onePercentRatio = property.purchasePrice > 0
    ? (values.monthlyRent / property.purchasePrice) * 100
    : 0;

  return (
    <div>
      <InputField
        label="Monthly Rent"
        value={values.monthlyRent}
        onChange={(v) => onChange({ monthlyRent: v as number })}
        prefix="$"
        min={0}
        step={50}
        tooltip="Gross monthly rent from tenant. Check Zillow/Rentometer for market comps."
      />

      <div className="flex justify-between text-[10px] text-text-muted -mt-2 mb-3 px-0.5">
        <span>Annual: {formatCurrency(annualRent)}</span>
        <span>GRM: {grm.toFixed(1)}</span>
      </div>

      <InputField
        label="Vacancy Rate"
        value={values.vacancyRatePct}
        onChange={(v) => onChange({ vacancyRatePct: v as number })}
        suffix="%"
        min={0}
        max={30}
        step={0.5}
        tooltip="Expected vacancy + bad debt. National average is 5-8%."
      />

      <InputField
        label="Annual Rent Growth"
        value={values.annualRentGrowth}
        onChange={(v) => onChange({ annualRentGrowth: v as number })}
        suffix="%"
        min={-5}
        max={15}
        step={0.5}
        tooltip="Projected annual rent increase. Historical US avg is 3-4%."
      />

      <InputField
        label="Lease Term"
        value={values.leaseTermMonths}
        onChange={(v) => onChange({ leaseTermMonths: v as number })}
        suffix="mo"
        min={1}
        max={36}
        step={1}
      />

      <InputField
        label="Management Fee"
        value={values.managementFeePct}
        onChange={(v) => onChange({ managementFeePct: v as number })}
        suffix="%"
        min={0}
        max={20}
        step={0.5}
        tooltip="Property management typically 8-10% of gross rent. Self-manage = 0%."
      />

      {/* 1% Rule Indicator */}
      <div className={`mt-3 px-2.5 py-2 rounded text-[11px] ${
        onePercentRatio >= 1 ? 'bg-accent-green-bg text-accent-green'
        : onePercentRatio >= 0.7 ? 'bg-accent-amber-bg text-accent-amber'
        : 'bg-accent-red-bg text-accent-red'
      }`}>
        <span className="font-semibold">1% Rule: {formatPercent(onePercentRatio, 2)}</span>
        {' — '}
        {onePercentRatio >= 1
          ? 'Passes (monthly rent ≥ 1% of price)'
          : onePercentRatio >= 0.7
          ? 'Below 1% rule but may still cash flow'
          : 'Rent-to-price ratio is low; cash flow will be difficult'}
      </div>
    </div>
  );
}
