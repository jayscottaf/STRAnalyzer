import type {
  DealInputs,
  LTRMetrics,
  ExpenseBreakdown,
  ProjectionYear,
} from '../types';
import {
  calculateMonthlyPayment,
  generateAmortizationSchedule,
  calculateCashOnCash,
  calculateCapRate,
  calculateDSCR,
  calculateTaxBenefits,
  calculateIRR,
  calculateExitAnalysis,
  calculateDepreciableBasis,
  calculateStandardDepreciation,
  calculateCostSegDepreciation,
  getLoanBalanceAfterYear,
  getPassiveActivityStatus,
} from '../calculations';

// LTR-specific expense breakdown — no platform fees, no cleaning, minimal supplies/software
function calculateLTRExpenseBreakdown(inputs: DealInputs, grossRevenue: number): ExpenseBreakdown {
  const { property, expenses, ltr } = inputs;
  const propertyTax = property.purchasePrice * (expenses.propertyTaxRate / 100);
  const insurance = property.purchasePrice * (expenses.insuranceRate / 100);
  const hoa = expenses.hoaMonthly * 12;
  // LTR tenant typically pays utilities — reduce by half for model
  const utilities = expenses.utilitiesMonthly * 12 * 0.5;
  const maintenance = grossRevenue * (expenses.maintenanceReservePct / 100);
  const capex = property.purchasePrice * ((expenses.capexReservePct ?? 0) / 100);
  const propertyManagement = grossRevenue * (ltr.managementFeePct / 100);
  // Supplies and software much lower for LTR
  const supplies = 0;
  const software = 0;
  const strPermit = 0;
  const platformFees = 0;
  const total = propertyTax + insurance + hoa + utilities + maintenance + capex +
    propertyManagement + supplies + software + strPermit + platformFees;

  return {
    propertyTax, insurance, hoa, utilities, maintenance, capex,
    propertyManagement, supplies, software, strPermit, platformFees, total,
  };
}

export function calculateLTRMetrics(inputs: DealInputs): LTRMetrics {
  const { property, financing, ltr } = inputs;

  // Loan
  const loanAmount = financing.loanType === 'cash'
    ? 0
    : property.purchasePrice * (1 - financing.downPaymentPct / 100);
  const monthlyPayment = financing.loanType === 'cash'
    ? 0
    : calculateMonthlyPayment(loanAmount, financing.interestRate, financing.loanTerm);
  const annualDebtService = monthlyPayment * 12;
  const ltv = property.purchasePrice > 0 ? (loanAmount / property.purchasePrice) * 100 : 0;
  const schedule = financing.loanType === 'cash'
    ? []
    : generateAmortizationSchedule(loanAmount, financing.interestRate, financing.loanTerm, 60);

  // Revenue
  const annualGrossRent = ltr.monthlyRent * 12;
  const vacancyLoss = annualGrossRent * (ltr.vacancyRatePct / 100);
  const effectiveGrossIncome = annualGrossRent - vacancyLoss;

  // Expenses
  const expenseBreakdown = calculateLTRExpenseBreakdown(inputs, effectiveGrossIncome);
  const totalOperatingExpenses = expenseBreakdown.total;

  // NOI & CF
  const noi = effectiveGrossIncome - totalOperatingExpenses;
  const annualCashFlow = noi - annualDebtService;
  const monthlyCashFlow = annualCashFlow / 12;

  // Cash invested (no furnishing for LTR)
  const downPayment = property.purchasePrice - loanAmount;
  const closingCosts = property.purchasePrice * (financing.closingCostsPct / 100);
  const monthlyTax = property.purchasePrice * (inputs.expenses.propertyTaxRate / 100) / 12;
  const monthlyInsurance = property.purchasePrice * (inputs.expenses.insuranceRate / 100) / 12;
  const monthlyHoa = inputs.expenses.hoaMonthly;
  const pitia = monthlyPayment + monthlyTax + monthlyInsurance + monthlyHoa;
  const totalCashInvested = downPayment + closingCosts + pitia * financing.cashReserveMonths;

  const cocReturn = calculateCashOnCash(annualCashFlow, totalCashInvested);
  const capRate = calculateCapRate(noi, property.purchasePrice);
  const dscr = calculateDSCR(noi, annualDebtService);

  // LTR-specific metrics
  const grm = property.purchasePrice > 0 && annualGrossRent > 0
    ? property.purchasePrice / annualGrossRent
    : 0;
  const onePercentRule = property.purchasePrice > 0 && ltr.monthlyRent / property.purchasePrice >= 0.01;
  const twoPercentRule = property.purchasePrice > 0 && ltr.monthlyRent / property.purchasePrice >= 0.02;
  const priceToRent = annualGrossRent > 0 ? property.purchasePrice / annualGrossRent : 0;

  // Tax
  const taxBenefits = calculateTaxBenefits(inputs, noi, annualCashFlow, schedule, 1);
  const trueCocReturn = taxBenefits?.afterTaxCashFlow
    ? calculateCashOnCash(taxBenefits.afterTaxCashFlow, totalCashInvested)
    : null;
  const passiveStatus = inputs.tax.enabled ? getPassiveActivityStatus(inputs) : null;

  // Projection
  const projection: ProjectionYear[] = [];
  let cumulativeCashFlow = 0;
  const rentGrowth = ltr.annualRentGrowth / 100;
  const expenseGrowth = inputs.expenses.annualExpenseGrowth / 100;
  const appreciation = inputs.appreciationRate / 100;

  for (let y = 1; y <= 5; y++) {
    const growthMultRevenue = Math.pow(1 + rentGrowth, y - 1);
    const growthMultExpense = Math.pow(1 + expenseGrowth, y - 1);
    const grossRevenue = effectiveGrossIncome * growthMultRevenue;
    const operatingExpenses = totalOperatingExpenses * growthMultExpense;
    const yNoi = grossRevenue - operatingExpenses;
    const netCashFlow = yNoi - annualDebtService;
    cumulativeCashFlow += netCashFlow;
    const propertyValue = property.purchasePrice * Math.pow(1 + appreciation, y);
    const loanBalance = schedule.length > 0 ? getLoanBalanceAfterYear(schedule, y) : 0;
    const equity = propertyValue - loanBalance;
    const appreciationGain = propertyValue - property.purchasePrice;
    const paydown = loanAmount - loanBalance;
    const totalReturn = totalCashInvested > 0
      ? ((cumulativeCashFlow + appreciationGain + paydown) / totalCashInvested) * 100
      : 0;
    const tb = calculateTaxBenefits(inputs, yNoi, netCashFlow, schedule, y);
    projection.push({
      year: y,
      grossRevenue,
      operatingExpenses,
      noi: yNoi,
      debtService: annualDebtService,
      netCashFlow,
      cocReturn: calculateCashOnCash(netCashFlow, totalCashInvested),
      depreciation: tb?.depreciation.total,
      taxableIncome: tb?.taxableIncome,
      taxSavings: tb?.taxSavings,
      afterTaxCashFlow: tb?.afterTaxCashFlow,
      propertyValue,
      loanBalance,
      equity,
      cumulativeCashFlow,
      totalReturn,
    });
  }

  // Exit + IRR
  const exitYear = inputs.tax.exitYear ?? 5;
  let accumulatedDepreciation = 0;
  if (inputs.tax.enabled) {
    const basis = calculateDepreciableBasis(property.purchasePrice, property.landValuePct);
    for (let y = 1; y <= exitYear; y++) {
      if (inputs.tax.costSegEnabled) {
        accumulatedDepreciation += calculateCostSegDepreciation(basis, y, inputs.tax.bonusDepreciationRate, inputs.tax.acceleratedPct).total;
      } else {
        accumulatedDepreciation += calculateStandardDepreciation(basis, y);
      }
    }
  }
  const exitSchedule = financing.loanType === 'cash'
    ? []
    : generateAmortizationSchedule(loanAmount, financing.interestRate, financing.loanTerm, exitYear * 12);
  const exitAnalysis = inputs.tax.enabled
    ? calculateExitAnalysis(inputs, accumulatedDepreciation, exitSchedule, exitYear)
    : null;

  const irrCashFlows = [-totalCashInvested];
  for (let y = 0; y < projection.length; y++) {
    const cf = inputs.tax.enabled && projection[y].afterTaxCashFlow !== undefined
      ? projection[y].afterTaxCashFlow!
      : projection[y].netCashFlow;
    if (y === exitYear - 1 && exitAnalysis) {
      irrCashFlows.push(cf + exitAnalysis.afterTaxProceeds);
    } else if (y < exitYear) {
      irrCashFlows.push(cf);
    }
  }
  const irr = calculateIRR(irrCashFlows);
  const exitProjection = projection.find((p) => p.year === exitYear);
  const totalReturnPct = exitProjection?.totalReturn ?? null;

  return {
    monthlyRent: ltr.monthlyRent,
    annualGrossRent,
    vacancyLoss,
    effectiveGrossIncome,
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
    grm,
    onePercentRule,
    twoPercentRule,
    priceToRent,
    taxBenefits,
    trueCocReturn,
    passiveStatus,
    irr,
    totalReturnPct,
    exitAnalysis,
    projection,
    amortizationSchedule: schedule,
    expenseBreakdown,
  };
}
