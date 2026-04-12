'use client';

import type { TaxInputs as TaxInputsType } from '@/lib/types';
import { TAX_BRACKETS } from '@/lib/constants';
import { formatCurrency } from '@/lib/format';
import InputField from './input-field';

interface Props {
  values: TaxInputsType;
  pmPct: number;
  onChange: (updates: Partial<TaxInputsType>) => void;
}

export default function TaxInputs({ values, pmPct, onChange }: Props) {
  const combinedRate = values.federalBracket + values.stateTaxRate;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-medium text-text-foreground">Enable Tax Analysis</label>
        <button
          type="button"
          onClick={() => onChange({ enabled: !values.enabled })}
          className={`relative w-9 h-5 rounded-full transition-colors ${
            values.enabled ? 'bg-accent-blue' : 'bg-border-default'
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
              values.enabled ? 'left-[18px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {!values.enabled && (
        <p className="text-[10px] text-text-muted">
          Enable to see depreciation, tax savings, and after-tax returns.
        </p>
      )}

      {values.enabled && (
        <>
          <div className="mb-3">
            <label className="text-xs font-medium text-text-muted mb-1 block">
              Federal Tax Bracket
            </label>
            <select
              value={values.federalBracket}
              onChange={(e) => onChange({ federalBracket: parseInt(e.target.value) })}
              className="w-full h-8 bg-bg-base border border-border-default rounded-md text-xs text-text-foreground px-2.5 outline-none focus:border-accent-blue"
            >
              {TAX_BRACKETS.map((b) => (
                <option key={b} value={b}>{b}%</option>
              ))}
            </select>
          </div>

          <InputField
            label="State Tax Rate"
            value={values.stateTaxRate}
            onChange={(v) => onChange({ stateTaxRate: v as number })}
            suffix="%"
            min={0}
            max={15}
            step={0.5}
          />

          <div className="text-[10px] text-text-muted -mt-2 mb-3">
            Combined rate: {combinedRate}%
          </div>

          <InputField
            label="Annual W-2 Income"
            value={values.w2Income}
            onChange={(v) => onChange({ w2Income: v as number })}
            prefix="$"
            min={0}
            step={5000}
          />

          {/* 1031 Exchange */}
          <div className="mt-3 pt-3 border-t border-border-default">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-text-muted">1031 Exchange</label>
              <button
                type="button"
                onClick={() => onChange({ exchange1031: !values.exchange1031 })}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  values.exchange1031 ? 'bg-accent-blue' : 'bg-border-default'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                    values.exchange1031 ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
            {values.exchange1031 && (
              <>
                <InputField
                  label="Exchange Proceeds"
                  value={values.exchangeProceeds}
                  onChange={(v) => onChange({ exchangeProceeds: v as number })}
                  prefix="$"
                  min={0}
                />
                <InputField
                  label="Deferred Capital Gain"
                  value={values.deferredCapitalGain}
                  onChange={(v) => onChange({ deferredCapitalGain: v as number })}
                  prefix="$"
                  min={0}
                />
                {values.deferredCapitalGain > 0 && (
                  <div className="px-2 py-1.5 rounded bg-accent-green-bg text-[10px] text-accent-green mb-3">
                    Tax liability avoided: {formatCurrency(values.deferredCapitalGain * (combinedRate / 100))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Cost Segregation */}
          <div className="mt-3 pt-3 border-t border-border-default">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-text-muted">Cost Segregation</label>
              <button
                type="button"
                onClick={() => onChange({ costSegEnabled: !values.costSegEnabled })}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  values.costSegEnabled ? 'bg-accent-blue' : 'bg-border-default'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                    values.costSegEnabled ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
            {values.costSegEnabled && (
              <>
                <InputField
                  label="% of Basis Accelerated"
                  value={values.acceleratedPct}
                  onChange={(v) => onChange({ acceleratedPct: v as number })}
                  suffix="%"
                  min={0}
                  max={50}
                  step={1}
                />
                <InputField
                  label="Bonus Depreciation Rate"
                  value={values.bonusDepreciationRate}
                  onChange={(v) => onChange({ bonusDepreciationRate: v as number })}
                  suffix="%"
                  min={0}
                  max={100}
                  step={20}
                  tooltip="100% restored by Big Beautiful Bill (2025). Adjustable for future changes."
                />
              </>
            )}
          </div>

          {/* Material Participation */}
          <div className="mt-3 pt-3 border-t border-border-default">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-text-muted">Material Participation</label>
              <button
                type="button"
                onClick={() => onChange({ materialParticipation: !values.materialParticipation })}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  values.materialParticipation ? 'bg-accent-blue' : 'bg-border-default'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                    values.materialParticipation ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
            <p className="text-[10px] text-text-muted mb-2">
              Requires 100+ hours annually AND more hours than any other person. Qualifies losses to offset W-2 income.
            </p>
            {values.materialParticipation && pmPct > 0 && (
              <div className="px-2 py-1.5 rounded bg-accent-amber-bg text-[10px] text-accent-amber">
                Warning: Having a property manager ({pmPct}% fee) may jeopardize your material participation claim.
              </div>
            )}
          </div>

          {/* High-income strategy callout */}
          {values.federalBracket >= 32 && values.costSegEnabled && values.materialParticipation && (
            <div className="mt-3 px-2 py-1.5 rounded bg-accent-amber-bg text-[10px] text-accent-amber">
              High-income STR tax strategy detected. Cost segregation + material participation at your bracket ({values.federalBracket}%) can generate significant paper losses to offset W-2 income.
            </div>
          )}
        </>
      )}
    </div>
  );
}
