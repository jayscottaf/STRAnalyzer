'use client';

import type { WholesaleInputs as WholesaleInputsType, PropertyInputs } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import InputField from './input-field';

interface Props {
  values: WholesaleInputsType;
  property: PropertyInputs;
  onChange: (updates: Partial<WholesaleInputsType>) => void;
}

export default function WholesaleInputs({ values, property, onChange }: Props) {
  const mao = values.arv * (values.maoDiscountPct / 100) - values.renovationEstimate - values.assignmentFee;
  const spread = mao - property.purchasePrice;

  return (
    <div>
      <InputField
        label="ARV"
        value={values.arv}
        onChange={(v) => onChange({ arv: v as number })}
        prefix="$"
        min={0}
        step={5000}
        tooltip="After-repair value. What an end-buyer could resell for after rehab."
      />

      <InputField
        label="Renovation Estimate"
        value={values.renovationEstimate}
        onChange={(v) => onChange({ renovationEstimate: v as number })}
        prefix="$"
        min={0}
        step={1000}
        tooltip="Estimated rehab cost the end-buyer will face."
      />

      <InputField
        label="Assignment Fee"
        value={values.assignmentFee}
        onChange={(v) => onChange({ assignmentFee: v as number })}
        prefix="$"
        min={0}
        step={500}
        tooltip="Your profit for assigning the contract. Typical $5k-$25k per deal."
      />

      <InputField
        label="MAO Discount"
        value={values.maoDiscountPct}
        onChange={(v) => onChange({ maoDiscountPct: v as number })}
        suffix="%"
        min={50}
        max={85}
        step={1}
        tooltip="Max Allowable Offer multiplier. Most wholesalers use 70% for standard markets, 75% in hot markets."
      />

      <InputField
        label="Earnest Money"
        value={values.earnestMoney}
        onChange={(v) => onChange({ earnestMoney: v as number })}
        prefix="$"
        min={0}
        step={500}
      />

      <InputField
        label="Close Timeline"
        value={values.closeTimelineDays}
        onChange={(v) => onChange({ closeTimelineDays: v as number })}
        suffix="days"
        min={7}
        max={120}
        step={1}
      />

      {/* MAO Calculation Display */}
      <div className={`mt-3 px-2.5 py-2 rounded text-[11px] ${
        spread >= 5000 ? 'bg-accent-green-bg text-accent-green'
        : spread >= 0 ? 'bg-accent-amber-bg text-accent-amber'
        : 'bg-accent-red-bg text-accent-red'
      }`}>
        <div className="font-semibold mb-1">Max Allowable Offer: {formatCurrency(mao)}</div>
        <div className="text-[10px] opacity-80">
          {spread >= 0
            ? `Asking price is ${formatCurrency(Math.abs(spread))} below MAO — room to negotiate`
            : `Asking price is ${formatCurrency(Math.abs(spread))} over MAO — needs to come down`}
        </div>
      </div>
    </div>
  );
}
