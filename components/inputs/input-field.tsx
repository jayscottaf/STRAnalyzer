'use client';

import { useState, useRef } from 'react';

interface InputFieldProps {
  label: string;
  value: number | string;
  onChange: (value: number | string) => void;
  type?: 'number' | 'text';
  prefix?: string;
  suffix?: string;
  tooltip?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export default function InputField({
  label,
  value,
  onChange,
  type = 'number',
  prefix,
  suffix,
  tooltip,
  min,
  max,
  step,
  placeholder,
  error,
  disabled,
}: InputFieldProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 mb-1">
        <label className="text-xs font-medium text-text-muted">{label}</label>
        {tooltip && (
          <div className="relative">
            <button
              type="button"
              className="w-3.5 h-3.5 rounded-full bg-border-default text-[9px] text-text-muted flex items-center justify-center hover:bg-border-light cursor-help"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
            >
              ?
            </button>
            {showTooltip && (
              <div
                ref={tooltipRef}
                className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 text-[11px] leading-tight bg-bg-elevated border border-border-light rounded-md shadow-lg text-text-foreground max-w-[220px] whitespace-normal"
              >
                {tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-border-light" />
              </div>
            )}
          </div>
        )}
      </div>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-2.5 text-xs text-text-muted pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => {
            if (type === 'number') {
              const num = parseFloat(e.target.value);
              onChange(isNaN(num) ? 0 : num);
            } else {
              onChange(e.target.value);
            }
          }}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full h-8 bg-bg-base border rounded-md text-xs text-text-foreground outline-none transition-colors
            focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30
            disabled:opacity-50 disabled:cursor-not-allowed
            ${prefix ? 'pl-7' : 'pl-2.5'}
            ${suffix ? 'pr-8' : 'pr-2.5'}
            ${error ? 'border-accent-red' : 'border-border-default'}
          `}
        />
        {suffix && (
          <span className="absolute right-2.5 text-xs text-text-muted pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="mt-0.5 text-[10px] text-accent-red">{error}</p>}
    </div>
  );
}
