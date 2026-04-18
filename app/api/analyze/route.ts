import { NextRequest, NextResponse } from 'next/server';
import type { DealInputs, DealMetrics } from '@/lib/types';

// Lazy-initialize OpenAI client — NEVER at module level or build fails
function getOpenAI() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { default: OpenAI } = require('openai') as { default: new (opts: { apiKey: string | undefined }) => import('openai').default };
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Simple in-memory rate limiter: 5 req/min per IP
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

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limited. Try again in a minute.' }, { status: 429 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured. Set OPENAI_API_KEY in .env.local' }, { status: 500 });
  }

  let body: { inputs: DealInputs; metrics: DealMetrics };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { inputs, metrics } = body;

  const systemPrompt = `You are an expert short-term rental (STR) investor, underwriter, and CPA with 20+ years of experience. You analyze STR deals with precision and honesty. Never sugarcoat — if a deal is bad, say so clearly.

You MUST respond with valid JSON only. No markdown, no explanation outside JSON. Use this exact shape:
{
  "market_assessment": "string - analysis of the market/location",
  "revenue_validation": "string - assessment of revenue assumptions (ADR, occupancy)",
  "deal_quality": "string - overall deal quality analysis",
  "tax_strategy": "string or null - tax strategy analysis if tax data provided, null otherwise",
  "red_flags": ["string array of concerns"],
  "green_flags": ["string array of positives"],
  "verdict": "STRONG BUY | BUY | MARGINAL | PASS",
  "verdict_reasoning": "string - concise reasoning for verdict",
  "recommended_actions": ["string array of numbered next steps"]
}`;

  const projection5yr = metrics.projection.map((p) => ({
    year: p.year,
    revenue: Math.round(p.grossRevenue),
    noi: Math.round(p.noi),
    cashFlow: Math.round(p.netCashFlow),
    equity: Math.round(p.equity),
  }));

  const taxInfo = inputs.tax.enabled
    ? `
Tax Strategy Enabled:
- Federal bracket: ${inputs.tax.federalBracket}%, State: ${inputs.tax.stateTaxRate}%
- W-2 income: $${inputs.tax.w2Income.toLocaleString()}
- Cost segregation: ${inputs.tax.costSegEnabled ? `Yes (${inputs.tax.acceleratedPct}% accelerated, ${inputs.tax.bonusDepreciationRate}% bonus dep)` : 'No'}
- Material participation: ${inputs.tax.materialParticipation ? 'Yes' : 'No'}
- Year 1 depreciation: $${Math.round(metrics.taxBenefits?.depreciation.total ?? 0).toLocaleString()}
- Year 1 tax savings: $${Math.round(metrics.taxBenefits?.taxSavings ?? 0).toLocaleString()}
- After-tax cash flow: $${Math.round(metrics.taxBenefits?.afterTaxCashFlow ?? 0).toLocaleString()}`
    : 'Tax analysis not enabled.';

  const userPrompt = `Analyze this STR deal:

Property: ${inputs.property.propertyType} in ${inputs.property.market || 'unspecified market'}
- ${inputs.property.bedrooms}bd/${inputs.property.bathrooms}ba, ${inputs.property.sqft} sqft, built ${inputs.property.yearBuilt}
- Purchase price: $${inputs.property.purchasePrice.toLocaleString()}

Financing: ${inputs.financing.loanType === 'cash' ? 'Cash purchase' : `${inputs.financing.downPaymentPct}% down, ${inputs.financing.interestRate}% rate, ${inputs.financing.loanTerm}yr ${inputs.financing.loanType}`}
- Total cash required: $${Math.round(metrics.totalCashInvested).toLocaleString()}

Revenue Assumptions:
- ADR: $${inputs.revenue.adr}, Occupancy: ${inputs.revenue.occupancyRate}%, Avg stay: ${inputs.revenue.avgStayLength} nights
- Gross revenue: $${Math.round(metrics.grossRevenue).toLocaleString()}
- Platform: ${inputs.revenue.platform}, fee: ${inputs.revenue.platformFeePct}%

Key Metrics:
- Monthly cash flow: $${Math.round(metrics.monthlyCashFlow).toLocaleString()}
- Cash-on-cash return: ${metrics.cocReturn.toFixed(1)}%
- Cap rate: ${metrics.capRate.toFixed(1)}%
- DSCR: ${isFinite(metrics.dscr) ? metrics.dscr.toFixed(2) : 'N/A (cash)'}
- NOI: $${Math.round(metrics.noi).toLocaleString()}
- Break-even occupancy: ${metrics.breakEvenOccupancy.toFixed(1)}%
- IRR (w/ exit): ${metrics.irr !== null ? metrics.irr.toFixed(1) + '%' : 'N/A'}
- 5yr Total Return: ${metrics.totalReturnPct !== null ? metrics.totalReturnPct.toFixed(1) + '%' : 'N/A'}

Passive Activity Status: ${metrics.passiveStatus?.pathway ?? 'Not analyzed'}
Exit Assumptions: Year ${inputs.tax.exitYear ?? 5}, ${inputs.tax.sellingCostsPct ?? 7}% selling costs${inputs.tax.exchange1031 ? ', 1031 exchange planned' : ''}
${metrics.exitAnalysis ? `After-tax exit proceeds: $${Math.round(metrics.exitAnalysis.afterTaxProceeds).toLocaleString()}` : ''}
Appreciation assumption: ${inputs.appreciationRate}%/yr

5-Year Projection: ${JSON.stringify(projection5yr)}

${taxInfo}`;

  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 500 });
    }

    const analysis = JSON.parse(content);
    return NextResponse.json(analysis);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('AI analysis error:', message);
    return NextResponse.json({ error: `AI analysis failed: ${message}` }, { status: 500 });
  }
}
