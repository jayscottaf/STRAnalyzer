'use client';

import Tooltip from './tooltip';

interface Props {
  label: string;
  value: string;
  subtitle?: string;
  tooltip?: string;
  color: 'green' | 'amber' | 'red' | 'blue' | 'neutral';
  large?: boolean;
}

const colorClasses = {
  green: 'text-accent-green bg-accent-green-bg',
  amber: 'text-accent-amber bg-accent-amber-bg',
  red: 'text-accent-red bg-accent-red-bg',
  blue: 'text-accent-blue bg-accent-blue-bg',
  neutral: 'text-text-foreground bg-bg-elevated',
};

export default function MetricCard({ label, value, subtitle, tooltip, color, large }: Props) {
  const card = (
    <div className={`rounded-lg border border-border-default p-3 ${colorClasses[color]} transition-all`}>
      <div className="text-[10px] font-medium uppercase tracking-wider opacity-70 mb-1">
        {label}
      </div>
      <div className={`font-bold metric-value ${large ? 'text-xl' : 'text-lg'}`}>
        {value}
      </div>
      {subtitle && (
        <div className="text-[10px] opacity-60 mt-0.5">{subtitle}</div>
      )}
    </div>
  );

  if (tooltip) {
    return <Tooltip content={tooltip}>{card}</Tooltip>;
  }
  return card;
}
