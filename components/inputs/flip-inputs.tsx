'use client';

import type { FlipInputs as FlipInputsType, PropertyInputs } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import InputField from './input-field';

interface Props {
  values: FlipInputsType;
  property: PropertyInputs;
  onChange: (updates: Partial<FlipInputsType>) => void;
}

export default function FlipInputs({ values, property, onChange }: Props) {
  const contingency = values.renovationBudget * (values.contingencyPct / 100);
  const totalReno = values.renovationBudget + contingency;
  const maoSeventyRule = values.arv * 0.70 - totalReno;
  const meetsSeventyRule = property.purchasePrice <= maoSeventyRule;

  return (
    <div>
      <InputField
        label="After Repair Value (ARV)"
        value={values.arv}
        onChange={(v) => onChange({ arv: v as number })}
        prefix="$"
        min={0}
        step={5000}
        tooltip="Projected sale price after renovation. Comp against similar renovated homes."
      />

      <InputField
        label="Renovation Budget"
        value={values.renovationBudget}
        onChange={(v) => onChange({ renovationBudget: v as number })}
        prefix="$"
        min={0}
        step={1000}
        tooltip="Total rehab cost estimate: kitchen, baths, flooring, roof, HVAC, cosmetic."
      />

      <InputField
        label="Contingency"
        value={values.contingencyPct}
        onChange={(v) => onChange({ contingencyPct: v as number })}
        suffix="%"
        min={0}
        max={30}
        step={1}
        tooltip="Buffer on reno budget. Experienced flippers use 10-15% minimum."
      />

      <div className="flex justify-between text-[10px] text-text-muted -mt-2 mb-3 px-0.5">
        <span>Contingency: {formatCurrency(contingency)}</span>
        <span>Total reno: {formatCurrency(totalReno)}</span>
      </div>

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
          label="Total Hold"
          value={values.totalHoldMonths}
          onChange={(v) => onChange({ totalHoldMonths: v as number })}
          suffix="mo"
          min={1}
          max={36}
          step={1}
          tooltip="Purchase → reno → list → close. Includes market time."
        />
      </div>

      <div className="mb-3">
        <label className="text-xs font-medium text-text-muted mb-1 block">Financing Type</label>
        <select
          value={values.financingType}
          onChange={(e) => onChange({ financingType: e.target.value as FlipInputsType['financingType'] })}
          className="w-full h-10 sm:h-8 bg-bg-base border border-border-default rounded-md text-sm sm:text-xs text-text-foreground px-2.5 outline-none focus:border-accent-blue"
        >
          <option value="hard_money">Hard Money</option>
          <option value="conventional">Conventional</option>
          <option value="cash">Cash</option>
        </select>
      </div>

      {values.financingType === 'hard_money' && (
        <>
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
              suffix=""
              min={0}
              max={10}
              step={0.5}
            />
            <InputField
              label="Term"
              value={values.hardMoneyTermMonths}
              onChange={(v) => onChange({ hardMoneyTermMonths: v as number })}
              suffix="mo"
              min={3}
              max={36}
              step={1}
            />
          </div>
        </>
      )}

      <InputField
        label="Selling Costs"
        value={values.sellingCostsPct}
        onChange={(v) => onChange({ sellingCostsPct: v as number })}
        suffix="%"
        min={0}
        max={15}
        step={0.5}
        tooltip="Agent commission + closing costs on sale. Typically 7-9%."
      />

      {/* 70% Rule Indicator */}
      <div className={`mt-3 px-2.5 py-2 rounded text-[11px] ${
        meetsSeventyRule ? 'bg-accent-green-bg text-accent-green' : 'bg-accent-red-bg text-accent-red'
      }`}>
        <span className="font-semibold">70% Rule: {meetsSeventyRule ? 'PASS' : 'FAIL'}</span>
        <div className="text-[10px] mt-0.5 opacity-80">
          Max offer: {formatCurrency(Math.max(maoSeventyRule, 0))} &middot; Current: {formatCurrency(property.purchasePrice)}
        </div>
      </div>
    </div>
  );
}
