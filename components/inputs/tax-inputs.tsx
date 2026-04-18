'use client';

import type { TaxInputs as TaxInputsType } from '@/lib/types';
import { TAX_BRACKETS } from '@/lib/constants';
import { formatCurrency } from '@/lib/format';
import InputField from './input-field';

interface Props {
  values: TaxInputsType;
  pmPct: number;
  avgStayLength: number;
  onChange: (updates: Partial<TaxInputsType>) => void;
}

export default function TaxInputs({ values, pmPct, avgStayLength, onChange }: Props) {
  const combinedRate = values.federalBracket + values.stateTaxRate;

  // Passive activity tier detection
  const tier: 'short' | 'mid' | 'long' =
    avgStayLength <= 7 ? 'short' : avgStayLength <= 30 ? 'mid' : 'long';

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

          <div className="mb-3">
            <label className="text-xs font-medium text-text-muted mb-1 block">Filing Status</label>
            <select
              value={values.filingStatus ?? 'mfj'}
              onChange={(e) => onChange({ filingStatus: e.target.value as 'single' | 'mfj' })}
              className="w-full h-8 bg-bg-base border border-border-default rounded-md text-xs text-text-foreground px-2.5 outline-none focus:border-accent-blue"
            >
              <option value="single">Single</option>
              <option value="mfj">Married Filing Jointly</option>
            </select>
          </div>

          {/* Passive Activity Status Card */}
          <div className="mt-3 pt-3 border-t border-border-default">
            <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
              Passive Activity Classification
            </div>

            {tier === 'short' && (
              <div className="px-2.5 py-2 rounded bg-accent-blue-bg text-[10px] text-accent-blue mb-2">
                <span className="font-semibold">Non-Rental Activity</span> — Your {avgStayLength}-night avg stay qualifies under Reg. §1.469-1T(e)(3)(ii)(A). Material participation enables losses to offset W-2 income.
              </div>
            )}

            {tier === 'mid' && (
              <div className="px-2.5 py-2 rounded bg-accent-amber-bg text-[10px] text-accent-amber mb-2">
                <span className="font-semibold">8–30 Day Range</span> — Avg stay of {avgStayLength} nights. Requires significant personal services + material participation for losses to offset W-2.
              </div>
            )}

            {tier === 'long' && (
              <div className="px-2.5 py-2 rounded bg-accent-red-bg text-[10px] text-accent-red mb-2">
                <span className="font-semibold">Per-Se Passive Rental</span> — Avg stay of {avgStayLength} nights (&gt;30 days). Material participation alone is insufficient. Only Real Estate Professional status qualifies losses to offset W-2.
              </div>
            )}

            {/* Material Participation — always shown */}
            <div className="flex items-center justify-between mb-2 mt-3">
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
              100+ hours annually AND more hours than any other person on this property.
            </p>
            {values.materialParticipation && pmPct > 0 && (
              <div className="px-2 py-1.5 rounded bg-accent-amber-bg text-[10px] text-accent-amber mb-2">
                Warning: Property manager ({pmPct}% fee) may jeopardize your material participation claim.
              </div>
            )}

            {/* Significant Personal Services — only for 8-30 day range */}
            {tier === 'mid' && (
              <>
                <div className="flex items-center justify-between mb-2 mt-2">
                  <label className="text-xs font-medium text-text-muted">Significant Personal Services</label>
                  <button
                    type="button"
                    onClick={() => onChange({ significantPersonalServices: !values.significantPersonalServices })}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      values.significantPersonalServices ? 'bg-accent-blue' : 'bg-border-default'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        values.significantPersonalServices ? 'left-[18px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[10px] text-text-muted mb-2">
                  Cleaning, concierge, guest services beyond basic landlord duties — Reg. §1.469-1T(e)(3)(ii)(B).
                </p>
              </>
            )}

            {/* Real Estate Professional — only for >7 day stays */}
            {(tier === 'mid' || tier === 'long') && (
              <>
                <div className="flex items-center justify-between mb-2 mt-2">
                  <label className="text-xs font-medium text-text-muted">Real Estate Professional</label>
                  <button
                    type="button"
                    onClick={() => onChange({ realEstateProfessional: !values.realEstateProfessional })}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      values.realEstateProfessional ? 'bg-accent-blue' : 'bg-border-default'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        values.realEstateProfessional ? 'left-[18px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[10px] text-text-muted mb-2">
                  750+ hours in real property trades/businesses AND &gt;50% of all professional services — IRC §469(c)(7).
                </p>
              </>
            )}

            {/* Passive income from other properties */}
            <InputField
              label="Passive Income (Other Properties)"
              value={values.passiveIncomeFromOtherProperties ?? 0}
              onChange={(v) => onChange({ passiveIncomeFromOtherProperties: v as number })}
              prefix="$"
              min={0}
              step={1000}
              tooltip="If you have passive income from other rentals, passive losses from this STR can offset it even without material participation."
            />
          </div>

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

          {/* Exit Assumptions */}
          <div className="mt-3 pt-3 border-t border-border-default">
            <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
              Exit Assumptions
            </div>
            <div className="grid grid-cols-2 gap-2">
              <InputField
                label="Exit Year"
                value={values.exitYear ?? 5}
                onChange={(v) => onChange({ exitYear: v as number })}
                min={1}
                max={30}
                step={1}
              />
              <InputField
                label="Selling Costs"
                value={values.sellingCostsPct ?? 7}
                onChange={(v) => onChange({ sellingCostsPct: v as number })}
                suffix="%"
                min={0}
                max={15}
                step={0.5}
                tooltip="Agent commission + closing costs on sale. Typically 6-8%."
              />
            </div>
          </div>

          {/* High-income strategy callout */}
          {values.federalBracket >= 32 && values.costSegEnabled && values.materialParticipation && tier === 'short' && (
            <div className="mt-3 px-2 py-1.5 rounded bg-accent-amber-bg text-[10px] text-accent-amber">
              High-income STR tax strategy detected. Cost seg + material participation at your bracket ({values.federalBracket}%) can generate significant paper losses to offset W-2 income.
            </div>
          )}
        </>
      )}
    </div>
  );
}
