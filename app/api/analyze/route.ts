import { NextRequest, NextResponse } from 'next/server';
import type { DealInputs, DealMetrics, Strategy } from '@/lib/types';

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

  let body: { inputs: DealInputs; metrics: DealMetrics; strategy?: Strategy };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { inputs, metrics } = body;
  const strategy: Strategy = body.strategy ?? inputs.activeStrategy ?? 'str';

  const roleByStrategy: Record<Strategy, string> = {
    str: 'expert short-term rental (STR) investor, underwriter, and CPA with 20+ years of experience analyzing vacation rental and corporate STR deals',
    ltr: 'expert long-term rental investor and CPA with deep knowledge of buy-and-hold strategies, tenant screening, and rental market analysis',
    flip: 'expert fix-and-flip investor and contractor with 20+ years of renovation and resale experience, including ARV comps, reno budgeting, and market timing',
    brrrr: 'expert BRRRR (Buy, Rehab, Rent, Refinance, Repeat) investor who understands both the fix-and-flip acquisition phase and the long-term rental operation phase, plus cash-out refinance mechanics',
    wholesale: 'expert wholesaler with deep knowledge of off-market deal acquisition, MAO calculations, buyer list management, and contract assignment mechanics',
  };

  const strategyFocus: Record<Strategy, string> = {
    str: 'ADR/occupancy realism, seasonality, market saturation, regulatory risk, and tax strategy (material participation + 7-day rule)',
    ltr: 'rent comps, tenant quality, vacancy realism, 1%/2% rule, price-to-rent ratio, neighborhood stability, and long-term appreciation',
    flip: 'ARV accuracy, renovation scope realism, 70% rule check, market holding risk, contractor assumptions, and short-term tax impact',
    brrrr: 'all-in cost vs ARV, refi feasibility and LTV limits, seasoning risk, post-refi cash flow, and cash-left-in-deal optimization',
    wholesale: 'MAO vs asking price spread, buyer list availability, market fit for assignment, earnest money risk, and 70% rule adherence',
  };

  const systemPrompt = `You are an ${roleByStrategy[strategy]}. You analyze deals with precision and honesty. Never sugarcoat — if a deal is bad, say so clearly.

Focus on: ${strategyFocus[strategy]}.

You MUST respond with valid JSON only. No markdown, no explanation outside JSON. Use this exact shape:
{
  "market_assessment": "string - analysis of the market/location for this strategy",
  "revenue_validation": "string - assessment of revenue/profit assumptions specific to ${strategy.toUpperCase()}",
  "deal_quality": "string - overall deal quality analysis for ${strategy.toUpperCase()} strategy",
  "tax_strategy": "string or null - tax strategy analysis if relevant, null otherwise",
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

  // Strategy-specific input context
  const strategyInputs: Record<Strategy, string> = {
    str: `Strategy: SHORT-TERM RENTAL (STR)
- ADR: $${inputs.revenue.adr}, Occupancy: ${inputs.revenue.occupancyRate}%, Avg stay: ${inputs.revenue.avgStayLength} nights
- Platform: ${inputs.revenue.platform}, fee: ${inputs.revenue.platformFeePct}%
- Projected gross revenue: $${Math.round(metrics.grossRevenue).toLocaleString()}/yr`,
    ltr: `Strategy: LONG-TERM RENTAL (LTR)
- Monthly rent: $${inputs.ltr.monthlyRent.toLocaleString()}
- Vacancy rate: ${inputs.ltr.vacancyRatePct}%
- Annual rent growth: ${inputs.ltr.annualRentGrowth}%
- Management fee: ${inputs.ltr.managementFeePct}%
- Lease term: ${inputs.ltr.leaseTermMonths} months`,
    flip: `Strategy: FIX & FLIP
- ARV (after repair value): $${inputs.flip.arv.toLocaleString()}
- Renovation budget: $${inputs.flip.renovationBudget.toLocaleString()} (+${inputs.flip.contingencyPct}% contingency)
- Reno timeline: ${inputs.flip.renoTimelineMonths} months, total hold: ${inputs.flip.totalHoldMonths} months
- Financing: ${inputs.flip.financingType}${inputs.flip.financingType === 'hard_money' ? ` at ${inputs.flip.hardMoneyRate}% + ${inputs.flip.hardMoneyPoints} points` : ''}
- Selling costs: ${inputs.flip.sellingCostsPct}%`,
    brrrr: `Strategy: BRRRR (Buy, Rehab, Rent, Refinance)
- ARV: $${inputs.brrrr.arv.toLocaleString()}, Reno: $${inputs.brrrr.renovationBudget.toLocaleString()}
- Hard money: ${inputs.brrrr.hardMoneyRate}% + ${inputs.brrrr.hardMoneyPoints} points for ${inputs.brrrr.hardMoneyTermMonths} months
- Seasoning period: ${inputs.brrrr.seasoningMonths} months before refi
- Refi: ${inputs.brrrr.refiLTV}% LTV of ARV at ${inputs.brrrr.refiRate}% for ${inputs.brrrr.refiTermYears}yr
- Monthly rent post-refi: $${inputs.brrrr.monthlyRent.toLocaleString()}`,
    wholesale: `Strategy: WHOLESALE (Contract Assignment)
- ARV: $${inputs.wholesale.arv.toLocaleString()}
- Renovation estimate (for end buyer): $${inputs.wholesale.renovationEstimate.toLocaleString()}
- Assignment fee (your profit): $${inputs.wholesale.assignmentFee.toLocaleString()}
- MAO discount: ${inputs.wholesale.maoDiscountPct}%
- Earnest money: $${inputs.wholesale.earnestMoney.toLocaleString()}
- Close timeline: ${inputs.wholesale.closeTimelineDays} days`,
  };

  // Strategy-specific metrics context
  const metricsContext: Record<Strategy, string> = {
    str: `Key Metrics (STR):
- Monthly cash flow: $${Math.round(metrics.monthlyCashFlow).toLocaleString()}
- Cash-on-cash return: ${metrics.cocReturn.toFixed(1)}%
- Cap rate: ${metrics.capRate.toFixed(1)}%
- DSCR: ${isFinite(metrics.dscr) ? metrics.dscr.toFixed(2) : 'N/A (cash)'}
- NOI: $${Math.round(metrics.noi).toLocaleString()}
- Break-even occupancy: ${metrics.breakEvenOccupancy.toFixed(1)}%
- IRR (w/ exit): ${metrics.irr !== null ? metrics.irr.toFixed(1) + '%' : 'N/A'}
- 5yr Total Return: ${metrics.totalReturnPct !== null ? metrics.totalReturnPct.toFixed(1) + '%' : 'N/A'}
- Total cash required: $${Math.round(metrics.totalCashInvested).toLocaleString()}`,
    ltr: `Key Metrics (LTR):
- Monthly rent: $${inputs.ltr.monthlyRent.toLocaleString()}
- Annual gross rent: $${(inputs.ltr.monthlyRent * 12).toLocaleString()}
- 1% rule: ${(inputs.ltr.monthlyRent / inputs.property.purchasePrice * 100).toFixed(2)}% (${inputs.ltr.monthlyRent / inputs.property.purchasePrice >= 0.01 ? 'PASS' : 'FAIL'})
- GRM: ${(inputs.property.purchasePrice / (inputs.ltr.monthlyRent * 12)).toFixed(1)}
- Vacancy: ${inputs.ltr.vacancyRatePct}%`,
    flip: `Key Metrics (Flip):
- ARV: $${inputs.flip.arv.toLocaleString()}
- Total reno: $${Math.round(inputs.flip.renovationBudget * (1 + inputs.flip.contingencyPct / 100)).toLocaleString()}
- 70% rule MAO: $${Math.round(inputs.flip.arv * 0.70 - inputs.flip.renovationBudget * (1 + inputs.flip.contingencyPct / 100)).toLocaleString()}
- Meets 70% rule: ${inputs.property.purchasePrice <= inputs.flip.arv * 0.70 - inputs.flip.renovationBudget * (1 + inputs.flip.contingencyPct / 100) ? 'YES' : 'NO'}
- Hold time: ${inputs.flip.totalHoldMonths} months
- Financing: ${inputs.flip.financingType}`,
    brrrr: `Key Metrics (BRRRR):
- ARV: $${inputs.brrrr.arv.toLocaleString()}
- Total reno: $${inputs.brrrr.renovationBudget.toLocaleString()}
- All-in cost: ~$${Math.round(inputs.property.purchasePrice + inputs.brrrr.renovationBudget).toLocaleString()}
- Refi loan (${inputs.brrrr.refiLTV}% of ARV): $${Math.round(inputs.brrrr.arv * inputs.brrrr.refiLTV / 100).toLocaleString()}
- Monthly rent post-refi: $${inputs.brrrr.monthlyRent.toLocaleString()}
- Seasoning: ${inputs.brrrr.seasoningMonths} months`,
    wholesale: `Key Metrics (Wholesale):
- ARV: $${inputs.wholesale.arv.toLocaleString()}
- Reno estimate: $${inputs.wholesale.renovationEstimate.toLocaleString()}
- MAO (${inputs.wholesale.maoDiscountPct}% rule): $${Math.round(inputs.wholesale.arv * inputs.wholesale.maoDiscountPct / 100 - inputs.wholesale.renovationEstimate - inputs.wholesale.assignmentFee).toLocaleString()}
- Assignment fee: $${inputs.wholesale.assignmentFee.toLocaleString()}
- Asking price: $${inputs.property.purchasePrice.toLocaleString()}
- Spread: $${Math.round(inputs.wholesale.arv * inputs.wholesale.maoDiscountPct / 100 - inputs.wholesale.renovationEstimate - inputs.wholesale.assignmentFee - inputs.property.purchasePrice).toLocaleString()}
- Earnest money at risk: $${inputs.wholesale.earnestMoney.toLocaleString()}`,
  };

  const userPrompt = `Analyze this ${strategy.toUpperCase()} deal:

${strategyInputs[strategy]}

Property: ${inputs.property.propertyType} in ${inputs.property.market || 'unspecified market'}
- ${inputs.property.bedrooms}bd/${inputs.property.bathrooms}ba, ${inputs.property.sqft} sqft, built ${inputs.property.yearBuilt}
- Purchase price: $${inputs.property.purchasePrice.toLocaleString()}

${strategy !== 'wholesale' ? `Financing: ${inputs.financing.loanType === 'cash' ? 'Cash purchase' : `${inputs.financing.downPaymentPct}% down, ${inputs.financing.interestRate}% rate, ${inputs.financing.loanTerm}yr ${inputs.financing.loanType}`}` : ''}

${metricsContext[strategy]}

${(strategy === 'str' || strategy === 'ltr' || strategy === 'brrrr') ? `
Passive Activity Status: ${metrics.passiveStatus?.pathway ?? 'Not analyzed'}
Exit Assumptions: Year ${inputs.tax.exitYear ?? 5}, ${inputs.tax.sellingCostsPct ?? 7}% selling costs${inputs.tax.exchange1031 ? ', 1031 exchange planned' : ''}
${metrics.exitAnalysis ? `After-tax exit proceeds: $${Math.round(metrics.exitAnalysis.afterTaxProceeds).toLocaleString()}` : ''}
Appreciation assumption: ${inputs.appreciationRate}%/yr` : ''}

${(strategy === 'str') ? `5-Year Projection: ${JSON.stringify(projection5yr)}` : ''}

${(strategy === 'str' || strategy === 'ltr' || strategy === 'brrrr') ? taxInfo : ''}`;

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
