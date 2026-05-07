import type { Dispatch } from 'react';
import type { DealAction, PropertyInputs } from './types';

export const MAX_LISTING_CHARS = 10_000;

export type ListingInputMode = 'text' | 'url' | 'image' | 'pdf';

export interface ExtractedListingData {
  market?: string | null;
  propertyType?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  sqft?: number | null;
  purchasePrice?: number | null;
  yearBuilt?: number | null;
  suggestedADR?: number | null;
  suggestedOccupancy?: number | null;
  suggestedMonthlyRent?: number | null;
  suggestedARV?: number | null;
  revenueReasoning?: string | null;
  confidence?: Record<string, 'high' | 'low'>;
}

export function getListingSource(rawUrl: string): string {
  try {
    const host = new URL(rawUrl).hostname.replace(/^www\./, '').toLowerCase();
    if (host.includes('zillow.com')) return 'Zillow';
    if (host.includes('redfin.com')) return 'Redfin';
    if (host.includes('realtor.com')) return 'Realtor.com';
    if (host.includes('trulia.com')) return 'Trulia';
    if (host.includes('homes.com')) return 'Homes.com';
    if (host.includes('mls')) return 'MLS';
    return host;
  } catch {
    return '';
  }
}

export function isValidHttpUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function applyExtractedListing(
  result: ExtractedListingData,
  onApply: (updates: Partial<PropertyInputs>) => void,
  dispatch?: Dispatch<DealAction>,
) {
  const updates: Partial<PropertyInputs> = {};
  if (result.market) updates.market = result.market;
  if (result.propertyType) updates.propertyType = result.propertyType;
  if (typeof result.bedrooms === 'number' && result.bedrooms > 0) updates.bedrooms = result.bedrooms;
  if (typeof result.bathrooms === 'number' && result.bathrooms > 0) updates.bathrooms = result.bathrooms;
  if (typeof result.sqft === 'number' && result.sqft > 0) updates.sqft = result.sqft;
  if (typeof result.purchasePrice === 'number' && result.purchasePrice > 0) updates.purchasePrice = result.purchasePrice;
  if (typeof result.yearBuilt === 'number' && result.yearBuilt > 1800) updates.yearBuilt = result.yearBuilt;
  onApply(updates);

  if (!dispatch) return;

  if (typeof result.suggestedADR === 'number' && result.suggestedADR > 0) {
    dispatch({ type: 'UPDATE_REVENUE', payload: { adr: result.suggestedADR } });
  }
  if (typeof result.suggestedOccupancy === 'number' && result.suggestedOccupancy > 0) {
    dispatch({ type: 'UPDATE_REVENUE', payload: { occupancyRate: result.suggestedOccupancy } });
  }
  if (typeof result.suggestedMonthlyRent === 'number' && result.suggestedMonthlyRent > 0) {
    dispatch({ type: 'UPDATE_LTR', payload: { monthlyRent: result.suggestedMonthlyRent } });
    dispatch({ type: 'UPDATE_BRRRR', payload: { monthlyRent: result.suggestedMonthlyRent } });
  }
  if (typeof result.suggestedARV === 'number' && result.suggestedARV > 0) {
    dispatch({ type: 'UPDATE_FLIP', payload: { arv: result.suggestedARV } });
    dispatch({ type: 'UPDATE_BRRRR', payload: { arv: result.suggestedARV } });
    dispatch({ type: 'UPDATE_WHOLESALE', payload: { arv: result.suggestedARV } });
  }
}
