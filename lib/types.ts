// ============================================================
// STR Deal Analyzer — TypeScript Interfaces
// ============================================================

export type Strategy = 'str' | 'ltr' | 'flip' | 'brrrr' | 'wholesale';

export interface PropertyInputs {
  market: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  purchasePrice: number;
  yearBuilt: number;
  landValuePct: number;
}

export interface FinancingInputs {
  loanType: 'conventional' | 'dscr' | 'cash';
  downPaymentPct: number;
  interestRate: number;
  loanTerm: 15 | 20 | 30;
  closingCostsPct: number;
  furnishingBudget: number;
  cashReserveMonths: number;
}

export interface RevenueInputs {
  adr: number;
  occupancyRate: number;
  cleaningFeeNet: number;
  avgStayLength: number;
  platform: 'airbnb' | 'airbnb_vrbo' | 'direct_platforms';
  platformFeePct: number;
  annualRevenueGrowth: number;
  seasonalityEnabled: boolean;
  seasonalityMultipliers: number[];
}

export interface ExpenseInputs {
  propertyTaxRate: number;
  insuranceRate: number;
  hoaMonthly: number;
  utilitiesMonthly: number;
  maintenanceReservePct: number;
  capexReservePct: number;
  propertyManagementPct: number;
  suppliesMonthly: number;
  softwareMonthly: number;
  strPermitYearly: number;
  annualExpenseGrowth: number;
}

export interface TaxInputs {
  enabled: boolean;
  federalBracket: number;
  stateTaxRate: number;
  w2Income: number;
  exchange1031: boolean;
  exchangeProceeds: number;
  deferredCapitalGain: number;
  costSegEnabled: boolean;
  acceleratedPct: number;
  bonusDepreciationRate: number;
  materialParticipation: boolean;
  significantPersonalServices: boolean;
  realEstateProfessional: boolean;
  passiveIncomeFromOtherProperties: number;
  exitYear: number;
  sellingCostsPct: number;
  filingStatus: 'single' | 'mfj';
}

// ============================================================
// Per-Strategy Inputs
// ============================================================

export interface LTRInputs {
  monthlyRent: number;
  vacancyRatePct: number;
  annualRentGrowth: number;
  leaseTermMonths: number;
  managementFeePct: number;
}

export interface FlipInputs {
  arv: number;
  renovationBudget: number;
  renoTimelineMonths: number;
  totalHoldMonths: number;
  financingType: 'cash' | 'conventional' | 'hard_money';
  hardMoneyRate: number;
  hardMoneyPoints: number;
  hardMoneyTermMonths: number;
  sellingCostsPct: number;
  contingencyPct: number;
}

export interface BRRRRInputs {
  // Acquisition + reno (flip-like)
  arv: number;
  renovationBudget: number;
  renoTimelineMonths: number;
  hardMoneyRate: number;
  hardMoneyPoints: number;
  hardMoneyTermMonths: number;
  seasoningMonths: number;
  // Refi terms
  refiLTV: number;
  refiRate: number;
  refiTermYears: 15 | 20 | 30;
  refiClosingCostsPct: number;
  // Rental (LTR-like)
  monthlyRent: number;
  vacancyRatePct: number;
  annualRentGrowth: number;
  managementFeePct: number;
}

export interface WholesaleInputs {
  arv: number;
  renovationEstimate: number;
  assignmentFee: number;
  earnestMoney: number;
  closeTimelineDays: number;
  maoDiscountPct: number; // default 70 for 70% rule
}

export interface DealInputs {
  activeStrategy: Strategy;
  property: PropertyInputs;
  financing: FinancingInputs;
  revenue: RevenueInputs;       // STR-specific, kept at top level for backward compat
  expenses: ExpenseInputs;
  tax: TaxInputs;
  appreciationRate: number;
  notes: string;
  ltr: LTRInputs;
  flip: FlipInputs;
  brrrr: BRRRRInputs;
  wholesale: WholesaleInputs;
}

export interface AmortizationEntry {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  remainingBalance: number;
}

export interface ExpenseBreakdown {
  propertyTax: number;
  insurance: number;
  hoa: number;
  utilities: number;
  maintenance: number;
  capex: number;
  propertyManagement: number;
  supplies: number;
  software: number;
  strPermit: number;
  platformFees: number;
  total: number;
}

export interface DepreciationBreakdown {
  standard?: number;
  personalProperty?: number;
  landImprovements?: number;
  buildingStructure?: number;
  bonusDepreciation?: number;
  total: number;
}

export interface PassiveActivityStatus {
  isRentalActivity: boolean;
  isNonPassive: boolean;
  pathway: string;
  tier: 'short' | 'mid' | 'long';
}

export interface TaxBenefits {
  depreciation: DepreciationBreakdown;
  mortgageInterest: number;
  taxableIncome: number;
  taxSavings: number;
  afterTaxCashFlow: number;
  combinedRate: number;
  passiveStatus: PassiveActivityStatus;
  qbiDeduction: number;
}

export interface ExitAnalysis {
  salePrice: number;
  sellingCosts: number;
  loanPayoff: number;
  netSaleProceeds: number;
  accumulatedDepreciation: number;
  depreciationRecapture: number;
  capitalGain: number;
  capitalGainTax: number;
  totalTaxOnSale: number;
  afterTaxProceeds: number;
  is1031: boolean;
}

export interface ProjectionYear {
  year: number;
  grossRevenue: number;
  operatingExpenses: number;
  noi: number;
  debtService: number;
  netCashFlow: number;
  cocReturn: number;
  depreciation?: number;
  taxableIncome?: number;
  taxSavings?: number;
  afterTaxCashFlow?: number;
  propertyValue: number;
  loanBalance: number;
  equity: number;
  cumulativeCashFlow: number;
  totalReturn: number;
}

export interface SensitivityCell {
  occupancy: number;
  adr: number;
  monthlyCashFlow: number;
  cocReturn: number;
  dscr: number;
  color: 'green' | 'amber' | 'red';
  isBaseCase: boolean;
}

export interface DealMetrics {
  // Core
  grossRevenue: number;
  platformFees: number;
  effectiveGrossIncome: number;
  nightsBooked: number;
  turns: number;
  expenseBreakdown: ExpenseBreakdown;
  totalOperatingExpenses: number;
  noi: number;
  debtService: number;
  annualCashFlow: number;
  monthlyCashFlow: number;

  // Returns
  totalCashInvested: number;
  loanAmount: number;
  ltv: number;
  monthlyPayment: number;
  cocReturn: number;
  capRate: number;
  dscr: number;
  breakEvenOccupancy: number;
  grossRentalYield: number;
  revpar: number;

  // Tax
  taxBenefits: TaxBenefits | null;
  trueCocReturn: number | null;
  passiveStatus: PassiveActivityStatus | null;

  // Returns
  irr: number | null;
  totalReturnPct: number | null;
  exitAnalysis: ExitAnalysis | null;

  // Projections
  projection: ProjectionYear[];
  sensitivityGrid: SensitivityCell[][];

  // Amortization
  amortizationSchedule: AmortizationEntry[];
}

// ============================================================
// Strategy-specific Metrics
// ============================================================

export interface LTRMetrics {
  monthlyRent: number;
  annualGrossRent: number;
  vacancyLoss: number;
  effectiveGrossIncome: number;
  totalOperatingExpenses: number;
  noi: number;
  debtService: number;
  annualCashFlow: number;
  monthlyCashFlow: number;
  totalCashInvested: number;
  loanAmount: number;
  ltv: number;
  monthlyPayment: number;
  cocReturn: number;
  capRate: number;
  dscr: number;
  grm: number;                   // Gross Rent Multiplier
  onePercentRule: boolean;       // monthly rent >= 1% of purchase price
  twoPercentRule: boolean;
  priceToRent: number;           // purchase / annual rent
  taxBenefits: TaxBenefits | null;
  trueCocReturn: number | null;
  passiveStatus: PassiveActivityStatus | null;
  irr: number | null;
  totalReturnPct: number | null;
  exitAnalysis: ExitAnalysis | null;
  projection: ProjectionYear[];
  amortizationSchedule: AmortizationEntry[];
  expenseBreakdown: ExpenseBreakdown;
}

export interface FlipMetrics {
  arv: number;
  purchasePrice: number;
  renovationBudget: number;
  contingency: number;
  totalHoldMonths: number;
  loanAmount: number;
  loanPoints: number;
  totalInterestCost: number;
  holdingCosts: number;
  sellingCosts: number;
  totalInvestment: number;
  grossProfit: number;
  netProfit: number;
  afterTaxProfit: number;
  roi: number;                   // profit / cash invested
  profitMargin: number;          // profit / ARV
  cashRequired: number;
  pricePerSqftAfter: number;
  maxAllowableOffer: number;     // 70% rule: ARV * 0.70 - reno
  meetsSeventyRule: boolean;
  holdingCostBreakdown: {
    loanInterest: number;
    propertyTax: number;
    insurance: number;
    utilities: number;
    loanPoints: number;
  };
}

export interface BRRRRMetrics {
  // Phase 1 (acquisition + reno)
  purchasePrice: number;
  arv: number;
  renovationBudget: number;
  initialCashInvested: number;
  hardMoneyLoan: number;
  hardMoneyPoints: number;
  phase1InterestCost: number;
  // Refi
  refiLoanAmount: number;        // ARV * refiLTV
  refiCashOut: number;           // refi proceeds minus hard money payoff + reno
  cashLeftInDeal: number;        // initial - refi cash out
  allInCost: number;             // purchase + reno + interest + points + closing
  refiMonthlyPayment: number;
  // Post-refi (LTR mode)
  monthlyRent: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  postRefiCocReturn: number;     // often infinite if cash left = 0
  postRefiDscr: number;
  capRate: number;
  isInfiniteReturn: boolean;
  grm: number;
  taxBenefits: TaxBenefits | null;
  trueCocReturn: number | null;
  projection: ProjectionYear[];
  amortizationSchedule: AmortizationEntry[];
}

export interface WholesaleMetrics {
  arv: number;
  renovationEstimate: number;
  maxAllowableOffer: number;     // MAO
  askingPrice: number;
  assignmentFee: number;
  spreadVsAsking: number;        // MAO - asking (negative if asking too high)
  earnestMoney: number;
  roiOnEarnest: number;
  netProfit: number;
  afterTaxProfit: number;
  meetsSeventyRule: boolean;
  dealQuality: 'strong' | 'marginal' | 'weak';
}

export type StrategyMetrics =
  | { kind: 'str'; data: DealMetrics }
  | { kind: 'ltr'; data: LTRMetrics }
  | { kind: 'flip'; data: FlipMetrics }
  | { kind: 'brrrr'; data: BRRRRMetrics }
  | { kind: 'wholesale'; data: WholesaleMetrics };

export interface AIAnalysis {
  market_assessment: string;
  revenue_validation: string;
  deal_quality: string;
  tax_strategy: string | null;
  red_flags: string[];
  green_flags: string[];
  verdict: 'STRONG BUY' | 'BUY' | 'MARGINAL' | 'PASS';
  verdict_reasoning: string;
  recommended_actions: string[];
}

export interface SavedAnalysis {
  id: string;
  name: string;
  timestamp: number;
  inputs: DealInputs;
}

export interface ValidationError {
  field: string;
  message: string;
}

export type DealAction =
  | { type: 'UPDATE_PROPERTY'; payload: Partial<PropertyInputs> }
  | { type: 'UPDATE_FINANCING'; payload: Partial<FinancingInputs> }
  | { type: 'UPDATE_REVENUE'; payload: Partial<RevenueInputs> }
  | { type: 'UPDATE_SEASONALITY'; payload: number[] }
  | { type: 'UPDATE_EXPENSES'; payload: Partial<ExpenseInputs> }
  | { type: 'UPDATE_TAX'; payload: Partial<TaxInputs> }
  | { type: 'UPDATE_APPRECIATION'; payload: number }
  | { type: 'UPDATE_NOTES'; payload: string }
  | { type: 'UPDATE_LTR'; payload: Partial<LTRInputs> }
  | { type: 'UPDATE_FLIP'; payload: Partial<FlipInputs> }
  | { type: 'UPDATE_BRRRR'; payload: Partial<BRRRRInputs> }
  | { type: 'UPDATE_WHOLESALE'; payload: Partial<WholesaleInputs> }
  | { type: 'SET_STRATEGY'; payload: Strategy }
  | { type: 'LOAD_ANALYSIS'; payload: DealInputs }
  | { type: 'RESET_TO_DEFAULTS' };
