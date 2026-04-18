'use client';

import Tooltip from './tooltip';
import AnimatedValue from './animated-value';

interface Props {
  label: string;
  value: string;
  rawValue?: number;
  formatFn?: (n: number) => string;
  subtitle?: string;
  tooltip?: string;
  color: 'green' | 'amber' | 'red' | 'blue' | 'neutral';
  large?: boolean;
  benchmark?: string;
  metricKey?: string;
  onDrilldown?: (key: string) => void;
}

const colorClasses = {
  green: 'text-accent-green bg-accent-green-bg border-accent-green/20',
  amber: 'text-accent-amber bg-accent-amber-bg border-accent-amber/20',
  red: 'text-accent-red bg-accent-red-bg border-accent-red/20',
  blue: 'text-accent-blue bg-accent-blue-bg border-accent-blue/20',
  neutral: 'text-text-foreground bg-bg-elevated border-border-default',
};

export default function MetricCard({
  label,
  value,
  rawValue,
  formatFn,
  subtitle,
  tooltip,
  color,
  large,
  benchmark,
  metricKey,
  onDrilldown,
}: Props) {
  const isClickable = metricKey && onDrilldown;

  const card = (
    <div
      className={`rounded-lg border p-3 ${colorClasses[color]} transition-all h-full flex flex-col ${
        isClickable ? 'cursor-pointer hover:ring-1 hover:ring-accent-blue/50 active:scale-[0.98]' : ''
      }`}
      onClick={isClickable ? () => onDrilldown(metricKey) : undefined}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="text-[10px] font-medium uppercase tracking-wider opacity-70">
          {label}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {benchmark && (
            <div className="text-[9px] opacity-50 px-1.5 py-0.5 rounded-full bg-black/20 whitespace-nowrap">
              {benchmark}
            </div>
          )}
          {isClickable && (
            <div className="text-[9px] opacity-30">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          )}
        </div>
      </div>
      <div className={`font-bold metric-value flex-1 flex items-center ${large ? 'text-2xl' : 'text-xl'} py-1`}>
        {rawValue !== undefined && formatFn ? (
          <AnimatedValue value={rawValue} format={formatFn} />
        ) : (
          value
        )}
      </div>
      <div className="text-[10px] opacity-60 min-h-[14px]">
        {subtitle ?? '\u00A0'}
      </div>
    </div>
  );

  if (tooltip && !isClickable) {
    return <Tooltip content={tooltip}>{card}</Tooltip>;
  }
  return card;
}
