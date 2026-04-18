'use client';

import type { TornadoItem } from '@/lib/calculations';
import { formatPercent } from '@/lib/format';

interface Props {
  items: TornadoItem[];
  baseline: number;
}

export default function TornadoChart({ items, baseline }: Props) {
  if (items.length === 0) return null;

  // Find the max range for scaling
  const maxRange = Math.max(
    ...items.map((i) => Math.max(Math.abs(i.lowValue - baseline), Math.abs(i.highValue - baseline))),
  );
  const axisWidth = Math.max(maxRange, 1) * 1.1; // add 10% padding

  return (
    <div className="rounded-lg border border-border-default bg-bg-surface p-4">
      <h3 className="text-sm font-semibold text-text-foreground mb-1">Input Sensitivity</h3>
      <p className="text-[10px] text-text-muted mb-4">
        Cash-on-cash return impact when each input moves ±10%. Sorted by magnitude — the top row is the biggest lever on your deal.
      </p>

      <div className="space-y-2">
        {items.map((item) => {
          const lowDelta = item.lowValue - baseline;
          const highDelta = item.highValue - baseline;

          // For each bar, position from center (baseline) out
          // Left bar (low variant): starts at center, goes left by |lowDelta|
          // Right bar (high variant): starts at center, goes right by |highDelta|

          const lowBarWidth = (Math.abs(lowDelta) / axisWidth) * 50; // % of half-width
          const highBarWidth = (Math.abs(highDelta) / axisWidth) * 50;

          const lowIsPositive = lowDelta > 0;
          const highIsPositive = highDelta > 0;

          return (
            <div key={item.label} className="flex items-center gap-2">
              <div className="w-24 text-[10px] text-text-muted text-right shrink-0">
                {item.label}
              </div>

              <div className="flex-1 relative h-6 bg-bg-base rounded-sm overflow-hidden">
                {/* Center line */}
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border-light z-10" />

                {/* Low variant bar (left of center) */}
                {lowBarWidth > 0 && (
                  <div
                    className={`absolute top-1 bottom-1 rounded-l-sm ${
                      lowIsPositive ? 'bg-accent-green/60' : 'bg-accent-red/60'
                    }`}
                    style={{
                      right: '50%',
                      width: `${lowBarWidth}%`,
                    }}
                  />
                )}

                {/* High variant bar (right of center) */}
                {highBarWidth > 0 && (
                  <div
                    className={`absolute top-1 bottom-1 rounded-r-sm ${
                      highIsPositive ? 'bg-accent-green/60' : 'bg-accent-red/60'
                    }`}
                    style={{
                      left: '50%',
                      width: `${highBarWidth}%`,
                    }}
                  />
                )}

                {/* Value labels */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 text-[9px] text-text-muted"
                  style={{ right: `${50 + lowBarWidth + 1}%` }}
                >
                  {formatPercent(item.lowValue)}
                </div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 text-[9px] text-text-muted"
                  style={{ left: `${50 + highBarWidth + 1}%` }}
                >
                  {formatPercent(item.highValue)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-border-default flex items-center justify-between text-[10px] text-text-muted">
        <span>&minus;10% variant</span>
        <span className="text-accent-blue">Baseline CoC: {formatPercent(baseline)}</span>
        <span>+10% variant</span>
      </div>
    </div>
  );
}
