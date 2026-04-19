'use client';

import type { Strategy } from '@/lib/types';

interface Props {
  active: Strategy | 'compare';
  onChange: (strategy: Strategy | 'compare') => void;
}

const TABS: { value: Strategy | 'compare'; label: string; icon: string; desc: string }[] = [
  { value: 'str', label: 'STR', icon: '🏠', desc: 'Short-term rental' },
  { value: 'ltr', label: 'LTR', icon: '🔑', desc: 'Long-term rental' },
  { value: 'flip', label: 'Flip', icon: '🔨', desc: 'Fix & flip' },
  { value: 'brrrr', label: 'BRRRR', icon: '♻️', desc: 'Buy, rehab, rent, refi' },
  { value: 'wholesale', label: 'Wholesale', icon: '📝', desc: 'Contract assignment' },
  { value: 'compare', label: 'Compare', icon: '⚖️', desc: 'All strategies side-by-side' },
];

export default function StrategyTabs({ active, onChange }: Props) {
  return (
    <div className="border-b border-border-default bg-bg-surface">
      <div className="flex overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => {
          const isActive = active === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange(tab.value)}
              title={tab.desc}
              className={`
                flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap
                border-b-2 transition-colors min-h-[44px]
                ${isActive
                  ? 'border-accent-blue text-text-foreground bg-bg-base/50'
                  : 'border-transparent text-text-muted hover:text-text-foreground hover:bg-bg-hover'}
              `}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

