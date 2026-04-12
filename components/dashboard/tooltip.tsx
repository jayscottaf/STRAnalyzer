'use client';

import { useState, useRef } from 'react';

interface Props {
  content: string;
  children: React.ReactNode;
}

export default function Tooltip({ content, children }: Props) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          ref={ref}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 text-[11px] leading-tight bg-bg-elevated border border-border-light rounded-md shadow-lg text-text-foreground max-w-[250px] whitespace-normal"
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-border-light" />
        </div>
      )}
    </div>
  );
}
