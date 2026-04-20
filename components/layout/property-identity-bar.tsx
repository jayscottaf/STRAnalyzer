'use client';

import type { DealInputs } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

interface Props {
  inputs: DealInputs;
}

export default function PropertyIdentityBar({ inputs }: Props) {
  const { property } = inputs;
  const hasAddress = property.market && property.market.trim().length > 0;

  if (!hasAddress) {
    return (
      <div className="px-4 py-2 bg-bg-base/50 border-b border-border-default">
        <span className="text-[11px] text-text-muted italic">
          New Deal — enter property details to begin
        </span>
      </div>
    );
  }

  const bedBath = `${property.bedrooms}bd/${property.bathrooms}ba`;
  const sqftText = property.sqft > 0 ? `${property.sqft.toLocaleString()} sqft` : null;

  return (
    <div className="px-4 py-2 bg-bg-base/50 border-b border-border-default">
      <div className="flex items-center gap-2 text-[11px] flex-wrap">
        <svg className="w-3.5 h-3.5 text-accent-blue shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-text-foreground font-medium truncate">{property.market}</span>
        <span className="text-border-light">·</span>
        <span className="text-text-foreground font-semibold">{formatCurrency(property.purchasePrice)}</span>
        <span className="text-border-light">·</span>
        <span className="text-text-muted">{bedBath}</span>
        {sqftText && (
          <>
            <span className="text-border-light">·</span>
            <span className="text-text-muted">{sqftText}</span>
          </>
        )}
        {property.propertyType && (
          <>
            <span className="text-border-light hidden sm:inline">·</span>
            <span className="text-text-muted hidden sm:inline">{property.propertyType}</span>
          </>
        )}
      </div>
    </div>
  );
}
