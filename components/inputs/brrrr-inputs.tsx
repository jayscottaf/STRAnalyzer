'use client';

import type { BRRRRInputs as BRRRRInputsType } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import InputField from './input-field';

interface Props {
  values: BRRRRInputsType;
  onChange: (updates: Partial<BRRRRInputsType>) => void;
}

export default function BRRRRInputs({ values, onChange }: Props) {
  const refiAmount = values.arv * (values.refiLTV / 100);

  return (
    <div>
      <div className="text-[10px] font-semibold text-accent-blue uppercase tracking-wider mb-2">
        Phase 1: Buy &amp; Rehab
      </div>

      <InputField
        label="After Repair Value (ARV)"
        value={values.arv}
        onChange={(v) => onChange({ arv: v as number })}
        prefix="$"
        min={0}
        step={5000}
      />

      <InputField
        label="Renovation Budget"
        value={values.renovationBudget}
        onChange={(v) => onChange({ renovationBudget: v as number })}
        prefix="$"
        min={0}
        step={1000}
      />

      <div className="grid grid-cols-2 gap-2">
        <InputField
          label="Reno Timeline"
          value={values.renoTimelineMonths}
          onChange={(v) => onChange({ renoTimelineMonths: v as number })}
          suffix="mo"
          min={1}
          max={24}
          step={1}
        />
        <InputField
          label="Seasoning"
          value={values.seasoningMonths}
          onChange={(v) => onChange({ seasoningMonths: v as number })}
          suffix="mo"
          min={0}
          max={24}
          step={1}
          tooltip="Months after reno before refi. Most lenders require 6-12."
        />
      </div>

      <InputField
        label="Hard Money Rate"
        value={values.hardMoneyRate}
        onChange={(v) => onChange({ hardMoneyRate: v as number })}
        suffix="%"
        min={0}
        max={25}
        step={0.5}
      />

      <div className="grid grid-cols-2 gap-2">
        <InputField
          label="Points"
          value={values.hardMoneyPoints}
          onChange={(v) => onChange({ hardMoneyPoints: v as number })}
          min={0}
          max={10}
          step={0.5}
        />
        <InputField
          label="HM Term"
          value={values.hardMoneyTermMonths}
          onChange={(v) => onChange({ hardMoneyTermMonths: v as number })}
          suffix="mo"
          min={3}
          max={36}
          step={1}
        />
      </div>

      {/* Phase 2: Refi */}
      <div className="text-[10px] font-semibold text-accent-blue uppercase tracking-wider mt-4 mb-2">
        Phase 2: Refinance
      </div>

      <InputField
        label="Refi LTV"
        value={values.refiLTV}
        onChange={(v) => onChange({ refiLTV: v as number })}
        suffix="%"
        min={0}
        max={80}
        step={1}
        tooltip="Cash-out refi LTV on ARV. Typical 70-75%."
      />

      <div className="text-[10px] text-text-muted -mt-2 mb-3">
        New loan: {formatCurrency(refiAmount)} ({formatPercent(values.refiLTV)} of ARV)
      </div>

      <InputField
        label="Refi Rate"
        value={values.refiRate}
        onChange={(v) => onChange({ refiRate: v as number })}
        suffix="%"
        min={0}
        max={15}
        step={0.125}
      />

      <div className="mb-3">
        <label className="text-xs font-medium text-text-muted mb-1 block">Refi Term</label>
        <select
          value={values.refiTermYears}
          onChange={(e) => onChange({ refiTermYears: parseInt(e.target.value) as 15 | 20 | 30 })}
          className="w-full h-10 sm:h-8 bg-bg-base border border-border-default rounded-md text-sm sm:text-xs text-text-foreground px-2.5 outline-none focus:border-accent-blue"
        >
          <option value={15}>15 years</option>
          <option value={20}>20 years</option>
          <option value={30}>30 years</option>
        </select>
      </div>

      <InputField
        label="Refi Closing Costs"
        value={values.refiClosingCostsPct}
        onChange={(v) => onChange({ refiClosingCostsPct: v as number })}
        suffix="%"
        min={0}
        max={5}
        step={0.25}
      />

      {/* Phase 3: Rent */}
      <div className="text-[10px] font-semibold text-accent-blue uppercase tracking-wider mt-4 mb-2">
        Phase 3: Rent
      </div>

      <InputField
        label="Monthly Rent"
        value={values.monthlyRent}
        onChange={(v) => onChange({ monthlyRent: v as number })}
        prefix="$"
        min={0}
        step={50}
      />

      <InputField
        label="Vacancy Rate"
        value={values.vacancyRatePct}
        onChange={(v) => onChange({ vacancyRatePct: v as number })}
        suffix="%"
        min={0}
        max={30}
        step={0.5}
      />

      <InputField
        label="Rent Growth"
        value={values.annualRentGrowth}
        onChange={(v) => onChange({ annualRentGrowth: v as number })}
        suffix="%"
        min={-5}
        max={15}
        step={0.5}
      />

      <InputField
        label="Management Fee"
        value={values.managementFeePct}
        onChange={(v) => onChange({ managementFeePct: v as number })}
        suffix="%"
        min={0}
        max={20}
        step={0.5}
      />
    </div>
  );
}
