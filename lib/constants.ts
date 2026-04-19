import type { DealInputs, Strategy } from './types';

// MACRS depreciation tables
export const MACRS_5YR = [0.2000, 0.3200, 0.1920, 0.1152, 0.1152, 0.0576];
export const MACRS_15YR = [
  0.0500, 0.0950, 0.0855, 0.0770, 0.0693, 0.0623, 0.0590, 0.0590,
  0.0591, 0.0590, 0.0591, 0.0590, 0.0591, 0.0590, 0.0591, 0.0295,
];

// 27.5-year residential — Year 1 rate by month placed in service (0=Jan, 11=Dec)
export const RESIDENTIAL_275_YEAR1_BY_MONTH = [
  0.03485, 0.03182, 0.02879, 0.02576, 0.02273, 0.01970,
  0.01667, 0.01364, 0.01061, 0.00758, 0.00455, 0.00152,
];

export const RESIDENTIAL_275_FULL_YEAR = 1 / 27.5; // 3.636%

// Cost seg split defaults
export const COST_SEG_PERSONAL_PROPERTY_PCT = 0.25; // 25% → 5yr MACRS
export const COST_SEG_LAND_IMPROVEMENTS_PCT = 0.12; // 12% → 15yr MACRS
export const COST_SEG_STRUCTURE_PCT = 0.63;          // 63% → 27.5yr straight-line

// Within the accelerated portion
export const COST_SEG_ACCEL_PERSONAL_SPLIT = 0.67;   // 67% to 5yr
export const COST_SEG_ACCEL_LAND_SPLIT = 0.33;       // 33% to 15yr

// KPI thresholds
export const THRESHOLDS = {
  coc: { good: 10, marginal: 5 },
  cap: { good: 8, marginal: 5 },
  dscr: { good: 1.25, marginal: 1.0 },
  monthlyCashFlow: { good: 500, marginal: 0 },
  breakEvenOccupancy: { good: 55, marginal: 75 }, // lower is better
  grossYield: { good: 10, marginal: 7 },
  irr: { good: 15, marginal: 8 },
  totalReturn: { good: 100, marginal: 50 },
} as const;

// Tax constants
export const DEPRECIATION_RECAPTURE_RATE = 0.25; // 25% on accumulated depreciation
export const LTCG_RATE_BY_BRACKET: Record<number, number> = {
  10: 0,
  12: 0,
  22: 0.15,
  24: 0.15,
  32: 0.15,
  35: 0.15,
  37: 0.20,
};
export const QBI_THRESHOLD = { single: 191950, mfj: 383900 }; // 2024 thresholds
export const QBI_PHASEOUT_RANGE = { single: 50000, mfj: 100000 };
export const QBI_RATE = 0.20;

// Seasonality presets
export const SEASONALITY_PRESETS: Record<string, number[]> = {
  flat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  beach: [0.5, 0.5, 0.6, 0.8, 1.1, 1.5, 1.6, 1.5, 1.1, 0.7, 0.5, 0.5],
  ski: [1.5, 1.4, 1.2, 0.7, 0.6, 0.8, 1.0, 0.9, 0.7, 0.7, 1.0, 1.5],
  mountain: [1.3, 1.2, 0.9, 0.7, 0.8, 1.2, 1.4, 1.3, 1.0, 1.0, 0.8, 1.2],
  urban: [0.8, 0.9, 1.0, 1.1, 1.1, 1.0, 0.9, 0.8, 1.1, 1.1, 1.0, 1.0],
};

export const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const PROPERTY_TYPES = [
  'Cabin',
  'Beach House',
  'Lake House',
  'Condo',
  'Urban Apartment',
  'Mountain Home',
  'Other',
] as const;

export const LOAN_TYPES = [
  { value: 'conventional', label: 'Conventional' },
  { value: 'dscr', label: 'DSCR' },
  { value: 'cash', label: 'Cash Purchase' },
] as const;

export const LOAN_TERMS = [15, 20, 30] as const;

export const TAX_BRACKETS = [10, 12, 22, 24, 32, 35, 37] as const;

export const PLATFORM_OPTIONS = [
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'airbnb_vrbo', label: 'Airbnb + VRBO' },
  { value: 'direct_platforms', label: 'Direct + Platforms' },
] as const;

export const STRATEGIES: { value: Strategy; label: string; icon: string }[] = [
  { value: 'str', label: 'STR', icon: '🏠' },
  { value: 'ltr', label: 'LTR', icon: '🔑' },
  { value: 'flip', label: 'Flip', icon: '🔨' },
  { value: 'brrrr', label: 'BRRRR', icon: '♻️' },
  { value: 'wholesale', label: 'Wholesale', icon: '📝' },
];

export const DEFAULT_INPUTS: DealInputs = {
  activeStrategy: 'str',
  property: {
    market: '',
    propertyType: 'Cabin',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1800,
    purchasePrice: 400000,
    yearBuilt: 2005,
    landValuePct: 20,
  },
  financing: {
    loanType: 'conventional',
    downPaymentPct: 25,
    interestRate: 7.25,
    loanTerm: 30,
    closingCostsPct: 2.5,
    furnishingBudget: 50000,
    cashReserveMonths: 6,
  },
  revenue: {
    adr: 250,
    occupancyRate: 65,
    cleaningFeeNet: 50,
    avgStayLength: 3,
    platform: 'airbnb',
    platformFeePct: 3,
    annualRevenueGrowth: 2,
    seasonalityEnabled: false,
    seasonalityMultipliers: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  },
  expenses: {
    propertyTaxRate: 1,
    insuranceRate: 0.5,
    hoaMonthly: 0,
    utilitiesMonthly: 200,
    maintenanceReservePct: 1.5,
    capexReservePct: 1,
    propertyManagementPct: 0,
    suppliesMonthly: 150,
    softwareMonthly: 100,
    strPermitYearly: 0,
    annualExpenseGrowth: 2,
  },
  tax: {
    enabled: false,
    federalBracket: 22,
    stateTaxRate: 5,
    w2Income: 150000,
    exchange1031: false,
    exchangeProceeds: 0,
    deferredCapitalGain: 0,
    costSegEnabled: false,
    acceleratedPct: 30,
    bonusDepreciationRate: 100,
    materialParticipation: true,
    significantPersonalServices: false,
    realEstateProfessional: false,
    passiveIncomeFromOtherProperties: 0,
    exitYear: 5,
    sellingCostsPct: 7,
    filingStatus: 'mfj',
  },
  appreciationRate: 3,
  notes: '',
  ltr: {
    monthlyRent: 2800,
    vacancyRatePct: 5,
    annualRentGrowth: 3,
    leaseTermMonths: 12,
    managementFeePct: 0,
  },
  flip: {
    arv: 550000,
    renovationBudget: 60000,
    renoTimelineMonths: 4,
    totalHoldMonths: 6,
    financingType: 'hard_money',
    hardMoneyRate: 12,
    hardMoneyPoints: 2,
    hardMoneyTermMonths: 12,
    sellingCostsPct: 8,
    contingencyPct: 10,
  },
  brrrr: {
    arv: 550000,
    renovationBudget: 60000,
    renoTimelineMonths: 4,
    hardMoneyRate: 12,
    hardMoneyPoints: 2,
    hardMoneyTermMonths: 12,
    seasoningMonths: 6,
    refiLTV: 75,
    refiRate: 7.0,
    refiTermYears: 30,
    refiClosingCostsPct: 2.5,
    monthlyRent: 2800,
    vacancyRatePct: 5,
    annualRentGrowth: 3,
    managementFeePct: 0,
  },
  wholesale: {
    arv: 550000,
    renovationEstimate: 60000,
    assignmentFee: 15000,
    earnestMoney: 2500,
    closeTimelineDays: 30,
    maoDiscountPct: 70,
  },
};
