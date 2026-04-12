import type {
  DealInputs,
  AmortizationEntry,
  ExpenseBreakdown,
  DepreciationBreakdown,
  TaxBenefits,
  ProjectionYear,
  SensitivityCell,
  DealMetrics,
} from './types';
import {
  MACRS_5YR,
  MACRS_15YR,
  RESIDENTIAL_275_YEAR1_BY_MONTH,
  RESIDENTIAL_275_FULL_YEAR,
  COST_SEG_ACCEL_PERSONAL_SPLIT,
  COST_SEG_ACCEL_LAND_SPLIT,
  THRESHOLDS,
} from './constants';

// ============================================================
// Mortgage
// ============================================================

export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number,
): number {
  if (principal <= 0 || annualRate <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termYears: number,
  months?: number,
): AmortizationEntry[] {
  if (principal <= 0 || annualRate <= 0) return [];
  const r = annualRate / 100 / 12;
  const payment = calculateMonthlyPayment(principal, annualRate, termYears);
  const totalMonths = months ?? termYears * 12;
  const schedule: AmortizationEntry[] = [];
  let balance = principal;

  for (let m = 1; m <= totalMonths; m++) {
    const interest = balance * r;
    const principalPaid = payment - interest;
    balance = Math.max(0, balance - principalPaid);
    schedule.push({
      month: m,
      payment,
      interest,
      principal: principalPaid,
      remainingBalance: balance,
    });
  }
  return schedule;
}

export function getYearInterest(schedule: AmortizationEntry[], year: number): number {
  const start = (year - 1) * 12;
  const end = year * 12;
  return schedule.slice(start, end).reduce((sum, e) => sum + e.interest, 0);
}

export function getYearPrincipal(schedule: AmortizationEntry[], year: number): number {
  const start = (year - 1) * 12;
  const end = year * 12;
  return schedule.slice(start, end).reduce((sum, e) => sum + e.principal, 0);
}

export function getLoanBalanceAfterYear(schedule: AmortizationEntry[], year: number): number {
  const idx = year * 12 - 1;
  if (idx < 0 || idx >= schedule.length) return 0;
  return schedule[idx].remainingBalance;
}

// ============================================================
// Revenue
// ============================================================

export function calculateGrossRevenue(
  adr: number,
  occupancyRate: number,
  cleaningFeeNet: number,
  avgStayLength: number,
): number {
  const nightsBooked = 365 * (occupancyRate / 100);
  const turns = nightsBooked / Math.max(avgStayLength, 1);
  return nightsBooked * adr + turns * cleaningFeeNet;
}

export function calculateMonthlyRevenueBreakdown(
  adr: number,
  occupancyRate: number,
  cleaningFeeNet: number,
  avgStayLength: number,
  seasonalityMultipliers: number[],
): number[] {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysInMonth.map((days, i) => {
    const mult = seasonalityMultipliers[i] ?? 1;
    const effOcc = Math.min((occupancyRate / 100) * mult, 1);
    const nights = days * effOcc;
    const turns = nights / Math.max(avgStayLength, 1);
    return nights * adr + turns * cleaningFeeNet;
  });
}

export function calculateEffectiveGrossIncome(
  grossRevenue: number,
  platformFeePct: number,
): number {
  return grossRevenue * (1 - platformFeePct / 100);
}

// ============================================================
// Expenses
// ============================================================

export function calculateExpenseBreakdown(
  inputs: DealInputs,
  grossRevenue: number,
): ExpenseBreakdown {
  const { property, expenses } = inputs;
  const propertyTax = property.purchasePrice * (expenses.propertyTaxRate / 100);
  const insurance = property.purchasePrice * (expenses.insuranceRate / 100);
  const hoa = expenses.hoaMonthly * 12;
  const utilities = expenses.utilitiesMonthly * 12;
  const maintenance = grossRevenue * (expenses.maintenanceReservePct / 100);
  const propertyManagement = grossRevenue * (expenses.propertyManagementPct / 100);
  const supplies = expenses.suppliesMonthly * 12;
  const software = expenses.softwareMonthly * 12;
  const strPermit = expenses.strPermitYearly;
  const platformFees = grossRevenue * (inputs.revenue.platformFeePct / 100);

  const total =
    propertyTax + insurance + hoa + utilities + maintenance +
    propertyManagement + supplies + software + strPermit + platformFees;

  return {
    propertyTax,
    insurance,
    hoa,
    utilities,
    maintenance,
    propertyManagement,
    supplies,
    software,
    strPermit,
    platformFees,
    total,
  };
}

// ============================================================
// Return Metrics
// ============================================================

export function calculateTotalCashInvested(inputs: DealInputs): number {
  const { property, financing, expenses } = inputs;
  const loanAmount =
    financing.loanType === 'cash'
      ? 0
      : property.purchasePrice * (1 - financing.downPaymentPct / 100);
  const downPayment = property.purchasePrice - loanAmount;
  const closingCosts = property.purchasePrice * (financing.closingCostsPct / 100);

  const monthlyPayment =
    financing.loanType === 'cash'
      ? 0
      : calculateMonthlyPayment(loanAmount, financing.interestRate, financing.loanTerm);
  const monthlyTax = property.purchasePrice * (expenses.propertyTaxRate / 100) / 12;
  const monthlyInsurance = property.purchasePrice * (expenses.insuranceRate / 100) / 12;
  const monthlyHoa = expenses.hoaMonthly;
  const pitia = monthlyPayment + monthlyTax + monthlyInsurance + monthlyHoa;

  return downPayment + closingCosts + financing.furnishingBudget + pitia * financing.cashReserveMonths;
}

export function calculateCapRate(noi: number, price: number): number {
  if (price <= 0) return 0;
  return (noi / price) * 100;
}

export function calculateCashOnCash(cashFlow: number, cashInvested: number): number {
  if (cashInvested <= 0) return 0;
  return (cashFlow / cashInvested) * 100;
}

export function calculateDSCR(noi: number, debtService: number): number {
  if (debtService <= 0) return Infinity;
  return noi / debtService;
}

export function calculateBreakEvenOccupancy(
  adr: number,
  cleaningFeeNet: number,
  avgStayLength: number,
  fixedExpenses: number,
  debtService: number,
  pmPercent: number,
  platformFeePct: number,
): number {
  // Revenue = nights * adr + (nights/avgStay) * cleaningFee
  // Variable expenses = PM% * Revenue + platformFee% * Revenue
  // Need: Revenue * (1 - PM% - platformFee%) = fixedExpenses + debtService
  // Revenue = (fixedExpenses + debtService) / (1 - variableRate)
  const variableRate = (pmPercent + platformFeePct) / 100;
  if (variableRate >= 1) return 100;
  const requiredRevenue = (fixedExpenses + debtService) / (1 - variableRate);

  // Revenue per night = adr + cleaningFee/avgStay
  const revenuePerNight = adr + cleaningFeeNet / Math.max(avgStayLength, 1);
  if (revenuePerNight <= 0) return 100;

  const nightsNeeded = requiredRevenue / revenuePerNight;
  return Math.min((nightsNeeded / 365) * 100, 100);
}

// ============================================================
// Tax & Depreciation (27.5-year RESIDENTIAL)
// ============================================================

export function calculateDepreciableBasis(price: number, landPct: number): number {
  return price * (1 - landPct / 100);
}

export function calculateStandardDepreciation(
  basis: number,
  year: number,
  monthPlaced: number = 6, // default July (0-indexed)
): number {
  if (year < 1 || year > 28 || basis <= 0) return 0;
  if (year === 1) {
    return basis * RESIDENTIAL_275_YEAR1_BY_MONTH[monthPlaced];
  }
  if (year <= 27) {
    return basis * RESIDENTIAL_275_FULL_YEAR;
  }
  // Year 28: remainder
  const prior =
    basis * RESIDENTIAL_275_YEAR1_BY_MONTH[monthPlaced] +
    basis * RESIDENTIAL_275_FULL_YEAR * 26;
  return Math.max(basis - prior, 0);
}

export function calculateCostSegDepreciation(
  basis: number,
  year: number,
  bonusDepPct: number,
  acceleratedPct: number = 30,
  monthPlaced: number = 6,
): DepreciationBreakdown {
  if (basis <= 0 || year < 1) {
    return { personalProperty: 0, landImprovements: 0, buildingStructure: 0, bonusDepreciation: 0, total: 0 };
  }

  const acceleratedBasis = basis * (acceleratedPct / 100);
  const personalPropertyBasis = acceleratedBasis * COST_SEG_ACCEL_PERSONAL_SPLIT;
  const landImprovementsBasis = acceleratedBasis * COST_SEG_ACCEL_LAND_SPLIT;
  const buildingStructureBasis = basis - acceleratedBasis;

  const bonusRate = bonusDepPct / 100;

  // Building structure NEVER gets bonus — always 27.5yr straight-line
  let buildingDep: number;
  if (year === 1) {
    buildingDep = buildingStructureBasis * RESIDENTIAL_275_YEAR1_BY_MONTH[monthPlaced];
  } else if (year <= 27) {
    buildingDep = buildingStructureBasis * RESIDENTIAL_275_FULL_YEAR;
  } else if (year === 28) {
    const priorBuilding =
      buildingStructureBasis * RESIDENTIAL_275_YEAR1_BY_MONTH[monthPlaced] +
      buildingStructureBasis * RESIDENTIAL_275_FULL_YEAR * 26;
    buildingDep = Math.max(buildingStructureBasis - priorBuilding, 0);
  } else {
    buildingDep = 0;
  }

  // Personal property (5yr MACRS) — bonus applies
  let personalDep = 0;
  let bonusPersonal = 0;
  if (year === 1) {
    bonusPersonal = personalPropertyBasis * bonusRate;
    const remainingBasis = personalPropertyBasis * (1 - bonusRate);
    personalDep = bonusPersonal + remainingBasis * (MACRS_5YR[0] ?? 0);
  } else if (year - 1 < MACRS_5YR.length) {
    const remainingBasis = personalPropertyBasis * (1 - bonusRate);
    personalDep = remainingBasis * (MACRS_5YR[year - 1] ?? 0);
  }

  // Land improvements (15yr MACRS) — bonus applies
  let landDep = 0;
  let bonusLand = 0;
  if (year === 1) {
    bonusLand = landImprovementsBasis * bonusRate;
    const remainingBasis = landImprovementsBasis * (1 - bonusRate);
    landDep = bonusLand + remainingBasis * (MACRS_15YR[0] ?? 0);
  } else if (year - 1 < MACRS_15YR.length) {
    const remainingBasis = landImprovementsBasis * (1 - bonusRate);
    landDep = remainingBasis * (MACRS_15YR[year - 1] ?? 0);
  }

  const totalBonus = bonusPersonal + bonusLand;
  const total = personalDep + landDep + buildingDep;

  return {
    personalProperty: personalDep,
    landImprovements: landDep,
    buildingStructure: buildingDep,
    bonusDepreciation: totalBonus,
    total,
  };
}

export function calculateTaxBenefits(
  inputs: DealInputs,
  noi: number,
  cashFlow: number,
  schedule: AmortizationEntry[],
  year: number,
): TaxBenefits | null {
  if (!inputs.tax.enabled) return null;

  const basis = calculateDepreciableBasis(inputs.property.purchasePrice, inputs.property.landValuePct);
  const combinedRate = (inputs.tax.federalBracket + inputs.tax.stateTaxRate) / 100;

  let depreciation: DepreciationBreakdown;
  if (inputs.tax.costSegEnabled) {
    depreciation = calculateCostSegDepreciation(
      basis,
      year,
      inputs.tax.bonusDepreciationRate,
      inputs.tax.acceleratedPct,
    );
  } else {
    const stdDep = calculateStandardDepreciation(basis, year);
    depreciation = { standard: stdDep, total: stdDep };
  }

  const mortgageInterest = schedule.length > 0 ? getYearInterest(schedule, year) : 0;

  const taxableIncome = noi - mortgageInterest - depreciation.total;

  let taxSavings: number;
  if (taxableIncome < 0 && inputs.tax.materialParticipation) {
    taxSavings = Math.abs(taxableIncome) * combinedRate;
  } else if (taxableIncome < 0) {
    // Passive loss — carries forward, no current savings
    taxSavings = 0;
  } else {
    // Positive taxable income — tax owed
    taxSavings = -(taxableIncome * combinedRate);
  }

  const afterTaxCashFlow = cashFlow + taxSavings;

  return {
    depreciation,
    mortgageInterest,
    taxableIncome,
    taxSavings,
    afterTaxCashFlow,
    combinedRate,
    materialParticipation: inputs.tax.materialParticipation,
  };
}

// ============================================================
// 5-Year Projection
// ============================================================

export function calculateProjection(
  inputs: DealInputs,
  baseGrossRevenue: number,
  baseOperatingExpenses: number,
  baseNOI: number,
  annualDebtService: number,
  cashInvested: number,
  schedule: AmortizationEntry[],
): ProjectionYear[] {
  const years: ProjectionYear[] = [];
  let cumulativeCashFlow = 0;
  const revenueGrowth = inputs.revenue.annualRevenueGrowth / 100;
  const expenseGrowth = inputs.expenses.annualExpenseGrowth / 100;
  const appreciation = inputs.appreciationRate / 100;

  for (let y = 1; y <= 5; y++) {
    const growthMultRevenue = Math.pow(1 + revenueGrowth, y - 1);
    const growthMultExpense = Math.pow(1 + expenseGrowth, y - 1);

    const grossRevenue = baseGrossRevenue * growthMultRevenue;
    const operatingExpenses = baseOperatingExpenses * growthMultExpense;
    const noi = grossRevenue - operatingExpenses;
    const netCashFlow = noi - annualDebtService;
    cumulativeCashFlow += netCashFlow;

    const cocReturn = calculateCashOnCash(netCashFlow, cashInvested);
    const propertyValue = inputs.property.purchasePrice * Math.pow(1 + appreciation, y);
    const loanBalance = schedule.length > 0 ? getLoanBalanceAfterYear(schedule, y) : 0;
    const equity = propertyValue - loanBalance;

    const taxBenefits = calculateTaxBenefits(inputs, noi, netCashFlow, schedule, y);

    const projection: ProjectionYear = {
      year: y,
      grossRevenue,
      operatingExpenses,
      noi,
      debtService: annualDebtService,
      netCashFlow,
      cocReturn,
      propertyValue,
      loanBalance,
      equity,
      cumulativeCashFlow,
    };

    if (taxBenefits) {
      projection.depreciation = taxBenefits.depreciation.total;
      projection.taxableIncome = taxBenefits.taxableIncome;
      projection.taxSavings = taxBenefits.taxSavings;
      projection.afterTaxCashFlow = taxBenefits.afterTaxCashFlow;
      if (taxBenefits.afterTaxCashFlow !== undefined) {
        cumulativeCashFlow =
          cumulativeCashFlow - netCashFlow + taxBenefits.afterTaxCashFlow;
        projection.cumulativeCashFlow = cumulativeCashFlow;
      }
    }

    years.push(projection);
  }

  return years;
}

// ============================================================
// Sensitivity Grid
// ============================================================

export function calculateSensitivityGrid(
  inputs: DealInputs,
  cashInvested: number,
  annualDebtService: number,
): SensitivityCell[][] {
  const baseOcc = inputs.revenue.occupancyRate;
  const baseAdr = inputs.revenue.adr;
  const steps = [-15, -10, -5, 0, 5, 10, 15];

  return steps.map((occStep) => {
    const occ = Math.min(Math.max(baseOcc + occStep, 0), 100);

    return steps.map((adrStep) => {
      const adr = baseAdr * (1 + adrStep / 100);
      const grossRevenue = calculateGrossRevenue(
        adr,
        occ,
        inputs.revenue.cleaningFeeNet,
        inputs.revenue.avgStayLength,
      );

      // Recalculate expenses with this revenue (PM scales with revenue)
      const modifiedInputs = { ...inputs, revenue: { ...inputs.revenue, occupancyRate: occ, adr } };
      const expBreakdown = calculateExpenseBreakdown(modifiedInputs, grossRevenue);
      // Operating expenses exclude platform fees (already in EGI)
      const totalOpEx = expBreakdown.total - expBreakdown.platformFees;
      const egi = calculateEffectiveGrossIncome(grossRevenue, inputs.revenue.platformFeePct);
      const noi = egi - totalOpEx;
      const annualCashFlow = noi - annualDebtService;
      const monthlyCashFlow = annualCashFlow / 12;
      const cocReturn = calculateCashOnCash(annualCashFlow, cashInvested);
      const dscr = calculateDSCR(noi, annualDebtService);

      let color: 'green' | 'amber' | 'red';
      if (cocReturn >= THRESHOLDS.coc.good) color = 'green';
      else if (cocReturn >= THRESHOLDS.coc.marginal) color = 'amber';
      else color = 'red';

      return {
        occupancy: occ,
        adr,
        monthlyCashFlow,
        cocReturn,
        dscr,
        color,
        isBaseCase: occStep === 0 && adrStep === 0,
      };
    });
  });
}

// ============================================================
// Master Calculation
// ============================================================

export function calculateAllMetrics(inputs: DealInputs): DealMetrics {
  const { property, financing, revenue, expenses } = inputs;

  // Loan
  const loanAmount =
    financing.loanType === 'cash'
      ? 0
      : property.purchasePrice * (1 - financing.downPaymentPct / 100);
  const monthlyPayment =
    financing.loanType === 'cash'
      ? 0
      : calculateMonthlyPayment(loanAmount, financing.interestRate, financing.loanTerm);
  const annualDebtService = monthlyPayment * 12;
  const ltv = property.purchasePrice > 0 ? (loanAmount / property.purchasePrice) * 100 : 0;

  const schedule =
    financing.loanType === 'cash'
      ? []
      : generateAmortizationSchedule(loanAmount, financing.interestRate, financing.loanTerm, 60);

  // Revenue
  const nightsBooked = 365 * (revenue.occupancyRate / 100);
  const turns = nightsBooked / Math.max(revenue.avgStayLength, 1);

  let grossRevenue: number;
  if (revenue.seasonalityEnabled) {
    const monthly = calculateMonthlyRevenueBreakdown(
      revenue.adr,
      revenue.occupancyRate,
      revenue.cleaningFeeNet,
      revenue.avgStayLength,
      revenue.seasonalityMultipliers,
    );
    grossRevenue = monthly.reduce((a, b) => a + b, 0);
  } else {
    grossRevenue = calculateGrossRevenue(
      revenue.adr,
      revenue.occupancyRate,
      revenue.cleaningFeeNet,
      revenue.avgStayLength,
    );
  }

  const platformFees = grossRevenue * (revenue.platformFeePct / 100);
  const effectiveGrossIncome = calculateEffectiveGrossIncome(grossRevenue, revenue.platformFeePct);

  // Expenses
  const expenseBreakdown = calculateExpenseBreakdown(inputs, grossRevenue);
  // Platform fees are in breakdown for display but already subtracted in EGI
  const totalOperatingExpenses = expenseBreakdown.total - expenseBreakdown.platformFees;

  // NOI & Cash Flow
  const noi = effectiveGrossIncome - totalOperatingExpenses;
  const annualCashFlow = noi - annualDebtService;
  const monthlyCashFlow = annualCashFlow / 12;

  // Returns
  const totalCashInvested = calculateTotalCashInvested(inputs);
  const cocReturn = calculateCashOnCash(annualCashFlow, totalCashInvested);
  const capRate = calculateCapRate(noi, property.purchasePrice);
  const dscr = calculateDSCR(noi, annualDebtService);

  // Fixed expenses for break-even (exclude PM and platform fees which are variable)
  const fixedExpenses =
    expenseBreakdown.propertyTax +
    expenseBreakdown.insurance +
    expenseBreakdown.hoa +
    expenseBreakdown.utilities +
    expenseBreakdown.supplies +
    expenseBreakdown.software +
    expenseBreakdown.strPermit +
    grossRevenue * (expenses.maintenanceReservePct / 100);

  const breakEvenOccupancy = calculateBreakEvenOccupancy(
    revenue.adr,
    revenue.cleaningFeeNet,
    revenue.avgStayLength,
    fixedExpenses,
    annualDebtService,
    expenses.propertyManagementPct,
    revenue.platformFeePct,
  );

  const grossRentalYield = property.purchasePrice > 0 ? (grossRevenue / property.purchasePrice) * 100 : 0;
  const revpar = revenue.adr * (revenue.occupancyRate / 100);

  // Tax
  const taxBenefits = calculateTaxBenefits(inputs, noi, annualCashFlow, schedule, 1);
  const trueCocReturn = taxBenefits?.afterTaxCashFlow
    ? calculateCashOnCash(taxBenefits.afterTaxCashFlow, totalCashInvested)
    : null;

  // Projection
  const projection = calculateProjection(
    inputs,
    grossRevenue,
    totalOperatingExpenses,
    noi,
    annualDebtService,
    totalCashInvested,
    schedule,
  );

  // Sensitivity Grid
  const sensitivityGrid = calculateSensitivityGrid(inputs, totalCashInvested, annualDebtService);

  return {
    grossRevenue,
    platformFees,
    effectiveGrossIncome,
    nightsBooked,
    turns,
    expenseBreakdown,
    totalOperatingExpenses,
    noi,
    debtService: annualDebtService,
    annualCashFlow,
    monthlyCashFlow,
    totalCashInvested,
    loanAmount,
    ltv,
    monthlyPayment,
    cocReturn,
    capRate,
    dscr,
    breakEvenOccupancy,
    grossRentalYield,
    revpar,
    taxBenefits,
    trueCocReturn,
    projection,
    sensitivityGrid,
    amortizationSchedule: schedule,
  };
}
