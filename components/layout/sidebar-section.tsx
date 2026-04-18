'use client';

import { useState } from 'react';

interface Props {
  title: string;
  defaultOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
}

export default function SidebarSection({ title, defaultOpen = false, badge, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border-default">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 sm:py-2.5 hover:bg-bg-hover transition-colors min-h-[44px]"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-foreground">{title}</span>
          {badge && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-accent-blue text-white">
              {badge}
            </span>
          )}
        </div>
        <svg
          className={`w-3.5 h-3.5 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}
