'use client';

import { useState } from 'react';
import type { DealAction, PropertyInputs } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import { hapticSuccess } from '@/lib/haptics';
import {
  MAX_LISTING_CHARS,
  type ExtractedListingData,
  applyExtractedListing,
  getListingSource,
  isValidHttpUrl,
} from '@/lib/listing-import';
import ListingExtractor from '@/components/inputs/listing-extractor';

interface Props {
  onApply: (updates: Partial<PropertyInputs>) => void;
  dispatch: React.Dispatch<DealAction>;
}

export default function ImportFirstPanel({ onApply, dispatch }: Props) {
  const [listingUrl, setListingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractedListingData | null>(null);

  async function handleAnalyze() {
    const trimmedUrl = listingUrl.trim();
    if (!trimmedUrl || loading) return;

    setLoading(true);
    setStatus('Trying to read the shared listing link...');
    setError(null);
    setResult(null);

    try {
      if (!isValidHttpUrl(trimmedUrl)) {
        throw new Error('Enter a valid listing URL that starts with http:// or https://.');
      }

      const urlRes = await fetch('/api/extract-listing-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      if (!urlRes.ok) {
        const data = await urlRes.json().catch(() => ({ error: 'Could not read listing URL' }));
        throw new Error(data.error || 'Could not read listing URL. Try PDF, screenshot, or pasted text.');
      }

      const urlData = await urlRes.json() as { text?: string; chars?: number };
      if (!urlData.text) {
        throw new Error('Could not read useful listing details from that URL. Try PDF, screenshot, or pasted text.');
      }

      setStatus(`Read ${urlData.chars?.toLocaleString() ?? 'some'} chars from the listing. Extracting details...`);

      const extractRes = await fetch('/api/extract-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: urlData.text.slice(0, MAX_LISTING_CHARS) }),
      });

      if (!extractRes.ok) {
        const data = await extractRes.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(data.error || `HTTP ${extractRes.status}`);
      }

      const extracted = await extractRes.json() as ExtractedListingData;
      setResult(extracted);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setStatus(null);
      setLoading(false);
    }
  }

  function handleApply() {
    if (!result) return;
    applyExtractedListing(result, onApply, dispatch);
    hapticSuccess();
    setResult(null);
  }

  function handleStartBlank() {
    setListingUrl('');
    setResult(null);
    setError(null);
    setStatus(null);
    dispatch({ type: 'RESET_TO_DEFAULTS' });
    hapticSuccess();
  }

  const source = listingUrl.trim() ? getListingSource(listingUrl.trim()) : '';

  return (
    <section className="rounded-lg border border-border-default bg-bg-surface p-3 sm:p-4">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-accent-blue">
            Analyze a listing
          </div>
          <h2 className="mt-0.5 text-base sm:text-lg font-semibold text-text-foreground">
            Start from a listing URL
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            Paste a listing link, then review the extracted deal inputs before applying them.
          </p>
        </div>
        {source && (
          <div className="self-start rounded-md bg-bg-base px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {source}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          value={listingUrl}
          onChange={(e) => {
            setListingUrl(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleAnalyze();
            }
          }}
          placeholder="https://www.zillow.com/homedetails/..."
          disabled={loading}
          className="h-11 sm:h-10 flex-1 min-w-0 rounded-md border border-border-default bg-bg-base px-3 text-sm sm:text-xs text-text-foreground outline-none transition-colors focus:border-accent-blue disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => void handleAnalyze()}
          disabled={loading || !listingUrl.trim()}
          className="h-11 sm:h-10 px-4 rounded-md bg-accent-blue text-white text-sm sm:text-xs font-semibold hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Analyzing...' : 'Analyze Listing'}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 sm:flex gap-2">
        <ListingExtractor
          onApply={onApply}
          dispatch={dispatch}
          triggerMode="text"
          triggerLabel="Paste Text"
          triggerClassName="h-9 px-3 rounded-md border border-border-default bg-bg-base text-xs font-medium text-text-muted hover:text-text-foreground hover:border-border-light transition-colors"
        />
        <ListingExtractor
          onApply={onApply}
          dispatch={dispatch}
          triggerMode="pdf"
          triggerLabel="Upload PDF"
          triggerClassName="h-9 px-3 rounded-md border border-border-default bg-bg-base text-xs font-medium text-text-muted hover:text-text-foreground hover:border-border-light transition-colors"
        />
        <ListingExtractor
          onApply={onApply}
          dispatch={dispatch}
          triggerMode="image"
          triggerLabel="Upload Image"
          triggerClassName="h-9 px-3 rounded-md border border-border-default bg-bg-base text-xs font-medium text-text-muted hover:text-text-foreground hover:border-border-light transition-colors"
        />
        <button
          type="button"
          onClick={handleStartBlank}
          className="h-9 px-3 rounded-md border border-border-default bg-bg-base text-xs font-medium text-text-muted hover:text-text-foreground hover:border-border-light transition-colors"
        >
          Start Blank
        </button>
      </div>

      {status && (
        <div className="mt-3 rounded-md bg-accent-blue-bg px-3 py-2 text-xs text-accent-blue">
          {status}
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-md bg-accent-red-bg px-3 py-2 text-xs text-accent-red">
          {error}
          <div className="mt-1 text-[11px] text-text-muted">
            Try Paste Text, Upload PDF, or Upload Image if the listing site blocks the page read.
          </div>
        </div>
      )}

      {result && (
        <div className="mt-3 border-t border-border-default pt-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Extracted Details
            </div>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="text-[11px] font-medium text-text-muted hover:text-text-foreground"
            >
              Clear
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <PreviewRow label="Address" value={result.market} confidence={result.confidence?.market} />
            <PreviewRow label="Type" value={result.propertyType} confidence={result.confidence?.propertyType} />
            <PreviewRow
              label="Price"
              value={result.purchasePrice ? formatCurrency(result.purchasePrice) : null}
              confidence={result.confidence?.purchasePrice}
            />
            <PreviewRow
              label="Beds / Baths"
              value={result.bedrooms || result.bathrooms ? `${result.bedrooms ?? '-'} / ${result.bathrooms ?? '-'}` : null}
              confidence={result.confidence?.bedrooms || result.confidence?.bathrooms}
            />
            <PreviewRow
              label="Sq Ft"
              value={result.sqft?.toLocaleString()}
              confidence={result.confidence?.sqft}
            />
            <PreviewRow
              label="Year"
              value={result.yearBuilt?.toString()}
              confidence={result.confidence?.yearBuilt}
            />
          </div>

          {(result.suggestedADR || result.suggestedMonthlyRent || result.suggestedARV) && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-x-4 border-t border-border-default/60 pt-2">
              <PreviewRow
                label="STR rate"
                value={result.suggestedADR ? formatCurrency(result.suggestedADR) : null}
                confidence={result.confidence?.suggestedADR}
              />
              <PreviewRow
                label="LTR rent"
                value={result.suggestedMonthlyRent ? formatCurrency(result.suggestedMonthlyRent) : null}
                confidence={result.confidence?.suggestedMonthlyRent}
              />
              <PreviewRow
                label="ARV"
                value={result.suggestedARV ? formatCurrency(result.suggestedARV) : null}
                confidence={result.confidence?.suggestedARV}
              />
            </div>
          )}

          {result.revenueReasoning && (
            <p className="mt-2 text-[11px] italic text-text-muted">
              {result.revenueReasoning}
            </p>
          )}

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleApply}
              className="h-9 px-4 rounded-md bg-accent-green text-white text-xs font-semibold hover:bg-accent-green/90 transition-colors"
            >
              Apply to Deal
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function PreviewRow({
  label,
  value,
  confidence,
}: {
  label: string;
  value: string | null | undefined;
  confidence?: 'high' | 'low';
}) {
  const hasValue = value !== null && value !== undefined && value !== '';

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-default/50 py-1.5 text-xs last:border-0">
      <span className="text-text-muted">{label}</span>
      <div className="flex min-w-0 items-center gap-1.5">
        {hasValue && confidence === 'low' && (
          <span className="shrink-0 rounded bg-accent-amber-bg px-1.5 py-0.5 text-[9px] text-accent-amber">
            low
          </span>
        )}
        <span className={hasValue ? 'truncate font-medium text-text-foreground' : 'text-text-muted'}>
          {hasValue ? value : '-'}
        </span>
      </div>
    </div>
  );
}
