'use client';

import { SEASONALITY_PRESETS, MONTH_LABELS } from '@/lib/constants';

interface Props {
  multipliers: number[];
  onChange: (multipliers: number[]) => void;
}

export default function SeasonalitySlider({ multipliers, onChange }: Props) {
  const avg = multipliers.reduce((a, b) => a + b, 0) / 12;
  const deviation = Math.abs(avg - 1.0);

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-3">
        {Object.entries(SEASONALITY_PRESETS).map(([name, values]) => (
          <button
            key={name}
            type="button"
            onClick={() => onChange([...values])}
            className="px-2 py-0.5 text-[10px] rounded bg-bg-base border border-border-default hover:border-accent-blue text-text-muted hover:text-text-foreground transition-colors capitalize"
          >
            {name}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        {MONTH_LABELS.map((month, i) => (
          <div key={month} className="flex items-center gap-2">
            <span className="text-[10px] text-text-muted w-7 shrink-0">{month}</span>
            <input
              type="range"
              min={0.1}
              max={2.0}
              step={0.05}
              value={multipliers[i]}
              onChange={(e) => {
                const newMult = [...multipliers];
                newMult[i] = parseFloat(e.target.value);
                onChange(newMult);
              }}
              className="flex-1"
            />
            <span className="text-[10px] text-text-foreground w-8 text-right">
              {(multipliers[i] ?? 1).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {deviation > 0.05 && (
        <p className="mt-2 text-[10px] text-accent-amber">
          Average multiplier: {avg.toFixed(2)} (deviates from 1.0 by {(deviation * 100).toFixed(0)}%)
        </p>
      )}
    </div>
  );
}
