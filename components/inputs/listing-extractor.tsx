'use client';

import { useState } from 'react';
import type { PropertyInputs, DealAction } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import { hapticSuccess } from '@/lib/haptics';

interface ExtractedData {
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

interface Props {
  onApply: (updates: Partial<PropertyInputs>) => void;
  dispatch?: React.Dispatch<DealAction>;
}

const MAX_CHARS = 10_000;

type InputMode = 'text' | 'image' | 'pdf';

export default function ListingExtractor({ onApply, dispatch }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<InputMode>('text');
  const [text, setText] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageName, setImageName] = useState('');
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState('');
  const [pdfParsing, setPdfParsing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractedData | null>(null);

  function reset() {
    setText('');
    setImageBase64(null);
    setImageName('');
    setPdfText(null);
    setPdfName('');
    setPdfParsing(false);
    setResult(null);
    setError(null);
    setLoading(false);
  }

  function close() {
    setOpen(false);
    reset();
    setMode('text');
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError('Image must be under 4MB');
      return;
    }
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImageBase64(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('PDF must be under 10MB');
      return;
    }
    setPdfName(file.name);
    setPdfParsing(true);
    setError(null);

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pages: string[] = [];
      const maxPages = Math.min(pdf.numPages, 10);

      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageText = content.items.map((item: any) => item.str).join(' ');
        pages.push(pageText);
      }

      const fullText = pages.join('\n\n').trim();
      if (fullText.length < 20) {
        setError('Could not extract text from this PDF. It may be a scanned image — try the Image upload instead.');
        setPdfText(null);
      } else {
        setPdfText(fullText);
      }
    } catch (err) {
      setError('Failed to parse PDF. Try pasting the text manually instead.');
      setPdfText(null);
    } finally {
      setPdfParsing(false);
    }
  }

  async function handleExtract() {
    if (mode === 'text' && !text.trim()) return;
    if (mode === 'image' && !imageBase64) return;
    if (mode === 'pdf' && !pdfText) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body = mode === 'image'
        ? { image: imageBase64 }
        : { text: (mode === 'pdf' ? pdfText! : text).slice(0, MAX_CHARS) };

      const res = await fetch('/api/extract-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data: ExtractedData = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (!result) return;
    const updates: Partial<PropertyInputs> = {};
    if (result.market) updates.market = result.market;
    if (result.propertyType) updates.propertyType = result.propertyType;
    if (typeof result.bedrooms === 'number' && result.bedrooms > 0) updates.bedrooms = result.bedrooms;
    if (typeof result.bathrooms === 'number' && result.bathrooms > 0) updates.bathrooms = result.bathrooms;
    if (typeof result.sqft === 'number' && result.sqft > 0) updates.sqft = result.sqft;
    if (typeof result.purchasePrice === 'number' && result.purchasePrice > 0) updates.purchasePrice = result.purchasePrice;
    if (typeof result.yearBuilt === 'number' && result.yearBuilt > 1800) updates.yearBuilt = result.yearBuilt;
    onApply(updates);

    // Apply revenue estimates to strategy-specific inputs
    if (dispatch) {
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

    hapticSuccess();
    close();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full h-8 mb-3 px-2.5 text-[11px] font-medium rounded-md border border-accent-blue/40 bg-accent-blue-bg text-accent-blue hover:bg-accent-blue/20 transition-colors flex items-center justify-center gap-1.5"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Paste Listing (AI Extract)
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={close}
          >
            <div
              className="w-full max-w-lg bg-bg-elevated border border-border-light rounded-xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
                <h3 className="text-sm font-semibold text-text-foreground">Paste Listing Text</h3>
                <button
                  type="button"
                  onClick={close}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-bg-hover text-text-muted"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4">
                {!result && (
                  <>
                    {/* Tab switcher */}
                    <div className="flex gap-1 mb-3 p-0.5 bg-bg-base rounded-md">
                      <button
                        type="button"
                        onClick={() => setMode('text')}
                        className={`flex-1 h-7 text-[11px] font-medium rounded transition-colors ${
                          mode === 'text' ? 'bg-bg-elevated text-text-foreground' : 'text-text-muted hover:text-text-foreground'
                        }`}
                      >
                        Paste Text
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('image')}
                        className={`flex-1 h-7 text-[11px] font-medium rounded transition-colors ${
                          mode === 'image' ? 'bg-bg-elevated text-text-foreground' : 'text-text-muted hover:text-text-foreground'
                        }`}
                      >
                        Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('pdf')}
                        className={`flex-1 h-7 text-[11px] font-medium rounded transition-colors ${
                          mode === 'pdf' ? 'bg-bg-elevated text-text-foreground' : 'text-text-muted hover:text-text-foreground'
                        }`}
                      >
                        PDF
                      </button>
                    </div>

                    {mode === 'text' ? (
                      <>
                        <p className="text-[11px] text-text-muted mb-2">
                          Paste anything — a Zillow / Redfin / MLS listing, an email from your agent, or any property description.
                        </p>
                        <textarea
                          value={text}
                          onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
                          placeholder="Paste listing text here..."
                          disabled={loading}
                          className="w-full h-40 bg-bg-base border border-border-default rounded-md text-xs text-text-foreground px-3 py-2 outline-none focus:border-accent-blue resize-none font-mono disabled:opacity-50"
                        />
                        <div className="text-[10px] text-text-muted mt-1">
                          {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] text-text-muted mb-2">
                          Upload a screenshot, photo of an MLS sheet, agent flyer, or any image with property details.
                        </p>
                        {!imageBase64 ? (
                          <label className="flex flex-col items-center justify-center h-40 bg-bg-base border-2 border-dashed border-border-default rounded-md cursor-pointer hover:border-accent-blue transition-colors">
                            <svg className="w-8 h-8 text-text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                            <span className="text-xs text-text-muted">Click to upload or drag & drop</span>
                            <span className="text-[10px] text-text-muted/60 mt-0.5">PNG, JPG, WebP — max 4MB</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                        ) : (
                          <div className="relative h-40 bg-bg-base border border-border-default rounded-md overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imageBase64} alt="Uploaded" className="w-full h-full object-contain" />
                            <button
                              type="button"
                              onClick={() => { setImageBase64(null); setImageName(''); }}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-[10px] text-white truncate">
                              {imageName}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {mode === 'pdf' && (
                      <>
                        <p className="text-[11px] text-text-muted mb-2">
                          Print a Zillow, Redfin, or MLS listing to PDF, then upload it here. Text will be extracted automatically.
                        </p>
                        {!pdfText && !pdfParsing ? (
                          <label className="flex flex-col items-center justify-center h-40 bg-bg-base border-2 border-dashed border-border-default rounded-md cursor-pointer hover:border-accent-blue transition-colors">
                            <svg className="w-8 h-8 text-text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            <span className="text-xs text-text-muted">Click to upload PDF</span>
                            <span className="text-[10px] text-text-muted/60 mt-0.5">Max 10MB, up to 10 pages</span>
                            <input
                              type="file"
                              accept=".pdf,application/pdf"
                              onChange={handlePdfUpload}
                              className="hidden"
                            />
                          </label>
                        ) : pdfParsing ? (
                          <div className="flex flex-col items-center justify-center h-40 bg-bg-base border border-border-default rounded-md">
                            <div className="w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mb-2" />
                            <span className="text-xs text-text-muted">Parsing PDF...</span>
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="h-40 bg-bg-base border border-border-default rounded-md p-3 overflow-y-auto">
                              <div className="text-[10px] text-text-muted font-mono whitespace-pre-wrap leading-relaxed">
                                {pdfText!.slice(0, 2000)}{pdfText!.length > 2000 ? '...' : ''}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-[10px] text-text-muted">
                                {pdfName} &middot; {pdfText!.length.toLocaleString()} chars extracted
                              </span>
                              <button
                                type="button"
                                onClick={() => { setPdfText(null); setPdfName(''); }}
                                className="text-[10px] text-text-muted hover:text-accent-red"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex items-center justify-end mt-3 gap-2">
                      <button
                        type="button"
                        onClick={close}
                        disabled={loading || pdfParsing}
                        className="h-8 px-3 text-[11px] font-medium rounded-md border border-border-default text-text-muted hover:text-text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleExtract}
                        disabled={loading || pdfParsing || (mode === 'text' ? !text.trim() : mode === 'image' ? !imageBase64 : !pdfText)}
                        className="h-8 px-4 text-[11px] font-medium rounded-md bg-accent-blue text-white hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? 'Extracting…' : 'Extract Details'}
                      </button>
                    </div>
                  </>
                )}

                {loading && (
                  <div className="mt-3 space-y-2 animate-pulse">
                    <div className="h-3 skeleton-shimmer rounded w-1/3" />
                    <div className="h-3 skeleton-shimmer rounded w-1/2" />
                    <div className="h-3 skeleton-shimmer rounded w-2/5" />
                  </div>
                )}

                {error && (
                  <div className="mt-3 px-3 py-2 rounded bg-accent-red-bg text-xs text-accent-red">
                    {error}
                  </div>
                )}

                {result && (
                  <div>
                    <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                      Extracted Details
                    </div>
                    <div className="space-y-1.5 mb-4">
                      <PreviewRow label="Market / City" value={result.market} confidence={result.confidence?.market} />
                      <PreviewRow label="Property Type" value={result.propertyType} confidence={result.confidence?.propertyType} />
                      <PreviewRow
                        label="Purchase Price"
                        value={result.purchasePrice ? formatCurrency(result.purchasePrice) : null}
                        confidence={result.confidence?.purchasePrice}
                      />
                      <PreviewRow
                        label="Bedrooms"
                        value={result.bedrooms?.toString()}
                        confidence={result.confidence?.bedrooms}
                      />
                      <PreviewRow
                        label="Bathrooms"
                        value={result.bathrooms?.toString()}
                        confidence={result.confidence?.bathrooms}
                      />
                      <PreviewRow
                        label="Sq Ft"
                        value={result.sqft?.toLocaleString()}
                        confidence={result.confidence?.sqft}
                      />
                      <PreviewRow
                        label="Year Built"
                        value={result.yearBuilt?.toString()}
                        confidence={result.confidence?.yearBuilt}
                      />
                    </div>

                    {/* Revenue Estimates */}
                    {(result.suggestedADR || result.suggestedMonthlyRent || result.suggestedARV) && (
                      <div className="mt-3 pt-3 border-t border-border-default">
                        <div className="text-[10px] font-semibold text-accent-blue uppercase tracking-wider mb-2">
                          Revenue Estimates
                        </div>
                        <div className="space-y-1.5 mb-2">
                          <PreviewRow
                            label="STR Nightly Rate"
                            value={result.suggestedADR ? formatCurrency(result.suggestedADR) : null}
                            confidence={result.confidence?.suggestedADR}
                          />
                          <PreviewRow
                            label="STR Occupancy"
                            value={result.suggestedOccupancy ? `${result.suggestedOccupancy}%` : null}
                            confidence={result.confidence?.suggestedOccupancy}
                          />
                          <PreviewRow
                            label="LTR Monthly Rent"
                            value={result.suggestedMonthlyRent ? formatCurrency(result.suggestedMonthlyRent) : null}
                            confidence={result.confidence?.suggestedMonthlyRent}
                          />
                          <PreviewRow
                            label="ARV (if reno needed)"
                            value={result.suggestedARV ? formatCurrency(result.suggestedARV) : null}
                            confidence={result.confidence?.suggestedARV}
                          />
                        </div>
                        {result.revenueReasoning && (
                          <p className="text-[10px] text-text-muted italic">
                            {result.revenueReasoning}
                          </p>
                        )}
                      </div>
                    )}

                    <p className="text-[10px] text-text-muted mb-3 mt-3">
                      Review and apply. Fields marked <span className="text-text-muted">—</span> were not found and won&apos;t be overwritten.
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={reset}
                        className="h-8 px-3 text-[11px] font-medium rounded-md border border-border-default text-text-muted hover:text-text-foreground"
                      >
                        Try Again
                      </button>
                      <button
                        type="button"
                        onClick={handleApply}
                        className="h-8 px-4 text-[11px] font-medium rounded-md bg-accent-green text-white hover:bg-accent-green/90"
                      >
                        Apply to Form
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
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
    <div className="flex items-center justify-between text-xs py-1 border-b border-border-default/50 last:border-0">
      <span className="text-text-muted">{label}</span>
      <div className="flex items-center gap-2">
        {hasValue && confidence === 'low' && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-amber-bg text-accent-amber">
            low confidence
          </span>
        )}
        <span className={hasValue ? 'text-text-foreground font-medium' : 'text-text-muted'}>
          {hasValue ? value : '—'}
        </span>
      </div>
    </div>
  );
}
