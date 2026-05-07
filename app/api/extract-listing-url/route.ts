import { NextRequest, NextResponse } from 'next/server';
import { lookup } from 'node:dns/promises';
import net from 'node:net';

export const runtime = 'nodejs';

const MAX_HTML_BYTES = 1_000_000;
const MAX_TEXT_CHARS = 10_000;
const MIN_EXTRACTED_CHARS = 300;
const rateMap = new Map<string, number[]>();

interface UrlBody {
  url?: string;
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const limit = 5;
  const timestamps = rateMap.get(ip)?.filter((t) => now - t < windowMs) ?? [];
  if (timestamps.length >= limit) return false;
  timestamps.push(now);
  rateMap.set(ip, timestamps);
  return true;
}

function isPrivateIPv4(address: string): boolean {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;

  const [a, b] = parts;
  return (
    a === 10
    || a === 127
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 169 && b === 254)
    || a === 0
  );
}

function isPrivateIPv6(address: string): boolean {
  const normalized = address.toLowerCase();
  return (
    normalized === '::1'
    || normalized.startsWith('fc')
    || normalized.startsWith('fd')
    || normalized.startsWith('fe80')
  );
}

function isBlockedIp(address: string): boolean {
  const family = net.isIP(address);
  if (family === 4) return isPrivateIPv4(address);
  if (family === 6) return isPrivateIPv6(address);
  return true;
}

async function assertPublicUrl(url: URL) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http:// and https:// listing URLs are supported.');
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.local')) {
    throw new Error('Local network URLs are not supported.');
  }

  const addresses = await lookup(hostname, { all: true });
  if (addresses.length === 0 || addresses.some((entry) => isBlockedIp(entry.address))) {
    throw new Error('Private or local network URLs are not supported.');
  }
}

async function readResponseText(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return response.text();

  const chunks: Uint8Array[] = [];
  let total = 0;

  while (total < MAX_HTML_BYTES) {
    const { done, value } = await reader.read();
    if (done || !value) break;

    const remaining = MAX_HTML_BYTES - total;
    const nextChunk = value.byteLength > remaining ? value.slice(0, remaining) : value;
    chunks.push(nextChunk);
    total += nextChunk.byteLength;
  }

  await reader.cancel().catch(() => undefined);
  const buffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
  return buffer.toString('utf8');
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function extractAttr(html: string, selector: RegExp): string {
  const match = html.match(selector);
  return decodeEntities(match?.[1]?.trim() ?? '');
}

function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function extractJsonLdText(html: string): string {
  const blocks = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
  const values: string[] = [];

  for (const block of blocks) {
    const raw = decodeEntities(block[1].trim());
    try {
      const parsed = JSON.parse(raw);
      values.push(JSON.stringify(parsed));
    } catch {
      values.push(raw);
    }
  }

  return values.join('\n');
}

function extractListingText(html: string, sourceUrl: string): { text: string; title: string } {
  const title = extractAttr(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescription = extractAttr(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    || extractAttr(html, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i);
  const ogTitle = extractAttr(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    || extractAttr(html, /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["'][^>]*>/i);
  const ogDescription = extractAttr(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    || extractAttr(html, /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["'][^>]*>/i);
  const jsonLd = extractJsonLdText(html);
  const visibleText = stripHtml(html);

  const text = [
    `Source URL: ${sourceUrl}`,
    title && `Page title: ${title}`,
    ogTitle && `Open Graph title: ${ogTitle}`,
    metaDescription && `Meta description: ${metaDescription}`,
    ogDescription && `Open Graph description: ${ogDescription}`,
    jsonLd && `Structured data: ${jsonLd}`,
    visibleText && `Page text: ${visibleText}`,
  ]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, MAX_TEXT_CHARS);

  return { text, title };
}

function looksBlocked(text: string): boolean {
  const normalized = text.toLowerCase();
  return [
    'captcha',
    'access denied',
    'verify you are human',
    'enable javascript',
    'unusual traffic',
    'request blocked',
    'cloudflare',
  ].some((needle) => normalized.includes(needle));
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limited. Try again in a minute.' }, { status: 429 });
  }

  let body: UrlBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.url) {
    return NextResponse.json({ error: 'No listing URL provided.' }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(body.url);
    await assertPublicUrl(url);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Invalid listing URL.' }, { status: 400 });
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'Mozilla/5.0 REIAnalyzer/1.0',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Listing page returned HTTP ${response.status}. Try PDF, screenshot, or pasted text.` }, { status: 502 });
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return NextResponse.json({ error: 'The listing URL did not return an HTML page. Try PDF, screenshot, or pasted text.' }, { status: 415 });
    }

    const html = await readResponseText(response);
    const { text, title } = extractListingText(html, url.toString());

    if (text.length < MIN_EXTRACTED_CHARS || looksBlocked(text)) {
      return NextResponse.json({ error: 'Could not read useful listing details from that URL. Try PDF, screenshot, or pasted text.' }, { status: 422 });
    }

    return NextResponse.json({
      title,
      url: url.toString(),
      text,
      chars: text.length,
    });
  } catch (err) {
    const message = err instanceof Error && err.name === 'TimeoutError'
      ? 'Listing page timed out. Try PDF, screenshot, or pasted text.'
      : 'Could not fetch listing URL. Try PDF, screenshot, or pasted text.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
