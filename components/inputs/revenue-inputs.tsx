'use client';

import type { RevenueInputs as RevenueInputsType } from '@/lib/types';
import { PLATFORM_OPTIONS } from '@/lib/constants';
import InputField from './input-field';
import SeasonalitySlider from './seasonality-slider';

interface Props {
  values: RevenueInputsType;
  onChange: (updates: Partial<RevenueInputsType>) => void;
  onSeasonalityChange: (multipliers: number[]) => void;
}

export default function RevenueInputs({ values, onChange, onSeasonalityChange }: Props) {
  return (
    <div>
      <InputField
        label="Nightly Rate (ADR)"
        value={values.adr}
        onChange={(v) => onChange({ adr: v as number })}
        prefix="$"
        min={0}
        step={5}
      />

      <InputField
        label="Occupancy Rate"
        value={values.occupancyRate}
        onChange={(v) => onChange({ occupancyRate: v as number })}
        suffix="%"
        min={0}
        max={100}
        step={1}
        tooltip="US average 50-54%. Strong markets hit 70%+."
      />

      <InputField
        label="Cleaning Fee (Net)"
        value={values.cleaningFeeNet}
        onChange={(v) => onChange({ cleaningFeeNet: v as number })}
        prefix="$"
        min={0}
        step={5}
        tooltip="What you keep after paying the cleaner."
      />

      <InputField
        label="Avg Stay Length"
        value={values.avgStayLength}
        onChange={(v) => onChange({ avgStayLength: v as number })}
        suffix="nights"
        min={1}
        max={30}
        step={0.5}
      />

      <div className="mb-3">
        <label className="text-xs font-medium text-text-muted mb-1 block">Platform</label>
        <select
          value={values.platform}
          onChange={(e) =>
            onChange({ platform: e.target.value as RevenueInputsType['platform'] })
          }
          className="w-full h-10 sm:h-8 bg-bg-base border border-border-default rounded-md text-sm sm:text-xs text-text-foreground px-2.5 outline-none focus:border-accent-blue"
        >
          {PLATFORM_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <InputField
        label="Platform Fee"
        value={values.platformFeePct}
        onChange={(v) => onChange({ platformFeePct: v as number })}
        suffix="%"
        min={0}
        max={20}
        step={0.5}
      />

      <InputField
        label="Annual Revenue Growth"
        value={values.annualRevenueGrowth}
        onChange={(v) => onChange({ annualRevenueGrowth: v as number })}
        suffix="%"
        min={-10}
        max={20}
        step={0.5}
      />

      <div className="mt-3 pt-3 border-t border-border-default">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-text-muted">Seasonality</label>
          <button
            type="button"
            onClick={() => onChange({ seasonalityEnabled: !values.seasonalityEnabled })}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              values.seasonalityEnabled ? 'bg-accent-blue' : 'bg-border-default'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                values.seasonalityEnabled ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {values.seasonalityEnabled && (
          <SeasonalitySlider
            multipliers={values.seasonalityMultipliers}
            onChange={onSeasonalityChange}
          />
        )}
      </div>
    </div>
  );
}
