// ============================================================
// STR Deal Analyzer — TypeScript Interfaces
// ============================================================

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

export interface DealInputs {
  property: PropertyInputs;
  financing: FinancingInputs;
  revenue: RevenueInputs;
  expenses: ExpenseInputs;
  tax: TaxInputs;
  appreciationRate: number;
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
  | { type: 'LOAD_ANALYSIS'; payload: DealInputs }
  | { type: 'RESET_TO_DEFAULTS' };
