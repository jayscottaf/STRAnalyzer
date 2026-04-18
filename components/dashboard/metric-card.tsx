'use client';

import Tooltip from './tooltip';

interface Props {
  label: string;
  value: string;
  subtitle?: string;
  tooltip?: string;
  color: 'green' | 'amber' | 'red' | 'blue' | 'neutral';
  large?: boolean;
  benchmark?: string;
}

const colorClasses = {
  green: 'text-accent-green bg-accent-green-bg border-accent-green/20',
  amber: 'text-accent-amber bg-accent-amber-bg border-accent-amber/20',
  red: 'text-accent-red bg-accent-red-bg border-accent-red/20',
  blue: 'text-accent-blue bg-accent-blue-bg border-accent-blue/20',
  neutral: 'text-text-foreground bg-bg-elevated border-border-default',
};

export default function MetricCard({ label, value, subtitle, tooltip, color, large, benchmark }: Props) {
  const card = (
    <div className={`rounded-lg border p-3 ${colorClasses[color]} transition-all h-full flex flex-col`}>
      <div className="flex items-start justify-between gap-1">
        <div className="text-[10px] font-medium uppercase tracking-wider opacity-70">
          {label}
        </div>
        {benchmark && (
          <div className="text-[9px] opacity-50 px-1.5 py-0.5 rounded-full bg-black/20 whitespace-nowrap shrink-0">
            {benchmark}
          </div>
        )}
      </div>
      <div className={`font-bold metric-value flex-1 flex items-center ${large ? 'text-2xl' : 'text-xl'} py-1`}>
        {value}
      </div>
      <div className="text-[10px] opacity-60 min-h-[14px]">
        {subtitle ?? '\u00A0'}
      </div>
    </div>
  );

  if (tooltip) {
    return <Tooltip content={tooltip}>{card}</Tooltip>;
  }
  return card;
}
