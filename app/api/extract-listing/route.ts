import { NextRequest, NextResponse } from 'next/server';

function getOpenAI() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { default: OpenAI } = require('openai') as { default: new (opts: { apiKey: string | undefined }) => import('openai').default };
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const rateMap = new Map<string, number[]>();

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

const SYSTEM_PROMPT = `You extract STR (short-term rental) property details from real estate listing text or images.

Return ONLY valid JSON with this exact shape:
{
  "market": string | null,
  "propertyType": one of ["Single Family", "Multi-Family (2-4)", "Condo / Townhome", "Cabin", "Beach House", "Lake House", "Mountain Home", "Urban Apartment", "Duplex", "Triplex", "Fourplex", "Manufactured Home", "Commercial Mixed-Use", "Vacant Land", "Other"] | null,
  "bedrooms": number | null,
  "bathrooms": number | null,
  "sqft": number | null,
  "purchasePrice": number | null,
  "yearBuilt": number | null,
  "confidence": {
    "<field>": "high" | "low"
  }
}

Rules:
- Use null when a field is not clearly stated. Do not guess.
- "market" should be "City, ST" format (e.g. "Pigeon Forge, TN"). If only city is available, return "City".
- Match propertyType to the closest enum value based on listing description (waterfront → Beach House or Lake House, log home in woods → Cabin, downtown high-rise → Urban Apartment, etc.).
- bathrooms can be decimal for half-baths: 2.5
- purchasePrice is the list price in dollars, not mortgage payment, rent, or monthly HOA.
- sqft is total finished square feet.
- Include a confidence entry for every non-null field.
- Response must be valid JSON. No markdown, no commentary.`;

const VALID_PROPERTY_TYPES = new Set([
  'Single Family', 'Multi-Family (2-4)', 'Condo / Townhome', 'Cabin', 'Beach House',
  'Lake House', 'Mountain Home', 'Urban Apartment', 'Duplex', 'Triplex', 'Fourplex',
  'Manufactured Home', 'Commercial Mixed-Use', 'Vacant Land', 'Other',
]);

interface ExtractBody {
  text?: string;
  image?: string; // base64 data URL
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limited. Try again in a minute.' }, { status: 429 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured.' }, { status: 500 });
  }

  let body: ExtractBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const hasText = body.text && body.text.trim().length > 0;
  const hasImage = body.image && body.image.startsWith('data:image/');

  if (!hasText && !hasImage) {
    return NextResponse.json({ error: 'No text or image provided' }, { status: 400 });
  }

  try {
    const openai = getOpenAI();

    // Build messages based on input type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userContent: any[] = [];

    if (hasImage) {
      userContent.push({
        type: 'image_url',
        image_url: { url: body.image, detail: 'high' },
      });
      userContent.push({
        type: 'text',
        text: 'Extract the property details from this listing image.',
      });
    } else {
      const truncated = body.text!.length > 10_000 ? body.text!.slice(0, 10_000) : body.text!;
      userContent.push({ type: 'text', text: truncated });
    }

    const response = await openai.chat.completions.create({
      model: hasImage ? 'gpt-4.1' : 'gpt-4.1-mini',
      temperature: 0,
      max_tokens: 500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 500 });
    }

    const parsed = JSON.parse(content) as {
      market?: string | null;
      propertyType?: string | null;
      bedrooms?: number | null;
      bathrooms?: number | null;
      sqft?: number | null;
      purchasePrice?: number | null;
      yearBuilt?: number | null;
      confidence?: Record<string, 'high' | 'low'>;
    };

    if (parsed.propertyType && !VALID_PROPERTY_TYPES.has(parsed.propertyType)) {
      parsed.propertyType = 'Other';
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Listing extraction error:', message);
    return NextResponse.json({ error: `Extraction failed: ${message}` }, { status: 500 });
  }
}
