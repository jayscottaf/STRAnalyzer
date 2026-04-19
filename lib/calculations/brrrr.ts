import type { DealInputs, BRRRRMetrics, ProjectionYear } from '../types';
import {
  calculateMonthlyPayment,
  generateAmortizationSchedule,
  calculateCashOnCash,
  calculateCapRate,
  calculateDSCR,
  calculateTaxBenefits,
  getLoanBalanceAfterYear,
} from '../calculations';

export function calculateBRRRRMetrics(inputs: DealInputs): BRRRRMetrics {
  const { property, brrrr } = inputs;
  const purchasePrice = property.purchasePrice;
  const arv = brrrr.arv;
  const renoBudget = brrrr.renovationBudget;

  // Phase 1: Acquisition with hard money
  const hardMoneyLoan = purchasePrice * 0.80;
  const hardMoneyDownPayment = purchasePrice - hardMoneyLoan;
  const hardMoneyPoints = hardMoneyLoan * (brrrr.hardMoneyPoints / 100);
  const hardMoneyMonthlyInterest = hardMoneyLoan * (brrrr.hardMoneyRate / 100 / 12);
  const phase1Months = brrrr.renoTimelineMonths + brrrr.seasoningMonths;
  const phase1InterestCost = hardMoneyMonthlyInterest * phase1Months;
  const closingCosts = purchasePrice * (inputs.financing.closingCostsPct / 100);
  const initialCashInvested = hardMoneyDownPayment + renoBudget + hardMoneyPoints + closingCosts;

  // Phase 2: Cash-out refinance at ARV × LTV
  const refiLoanAmount = arv * (brrrr.refiLTV / 100);
  const refiClosingCosts = refiLoanAmount * (brrrr.refiClosingCostsPct / 100);
  const refiCashOut = refiLoanAmount - hardMoneyLoan - refiClosingCosts;
  const cashLeftInDeal = Math.max(initialCashInvested + phase1InterestCost - refiCashOut, 0);
  const allInCost = purchasePrice + renoBudget + phase1InterestCost + hardMoneyPoints + closingCosts + refiClosingCosts;

  const refiMonthlyPayment = calculateMonthlyPayment(refiLoanAmount, brrrr.refiRate, brrrr.refiTermYears);
  const refiSchedule = generateAmortizationSchedule(refiLoanAmount, brrrr.refiRate, brrrr.refiTermYears, 60);
  const refiAnnualDebtService = refiMonthlyPayment * 12;

  // Post-refi LTR operation
  const annualGrossRent = brrrr.monthlyRent * 12;
  const vacancyLoss = annualGrossRent * (brrrr.vacancyRatePct / 100);
  const effectiveGrossIncome = annualGrossRent - vacancyLoss;

  // Operating expenses
  const propertyTax = arv * (inputs.expenses.propertyTaxRate / 100);
  const insurance = arv * (inputs.expenses.insuranceRate / 100);
  const hoa = inputs.expenses.hoaMonthly * 12;
  const utilities = inputs.expenses.utilitiesMonthly * 12 * 0.5; // tenant pays most
  const maintenance = effectiveGrossIncome * (inputs.expenses.maintenanceReservePct / 100);
  const capex = arv * ((inputs.expenses.capexReservePct ?? 0) / 100);
  const propertyManagement = effectiveGrossIncome * (brrrr.managementFeePct / 100);
  const totalOpEx = propertyTax + insurance + hoa + utilities + maintenance + capex + propertyManagement;

  const noi = effectiveGrossIncome - totalOpEx;
  const annualCashFlow = noi - refiAnnualDebtService;
  const monthlyCashFlow = annualCashFlow / 12;

  // Post-refi CoC: infinite if cash left = 0
  const isInfiniteReturn = cashLeftInDeal <= 0 && annualCashFlow > 0;
  const postRefiCocReturn = cashLeftInDeal > 0
    ? calculateCashOnCash(annualCashFlow, cashLeftInDeal)
    : annualCashFlow > 0 ? Infinity : 0;

  const postRefiDscr = calculateDSCR(noi, refiAnnualDebtService);
  const capRate = calculateCapRate(noi, arv);

  const grm = arv > 0 && annualGrossRent > 0 ? arv / annualGrossRent : 0;

  // Tax (post-refi)
  const taxBenefits = calculateTaxBenefits(inputs, noi, annualCashFlow, refiSchedule, 1);
  const trueCocReturn = taxBenefits?.afterTaxCashFlow && cashLeftInDeal > 0
    ? calculateCashOnCash(taxBenefits.afterTaxCashFlow, cashLeftInDeal)
    : null;

  // 5-yr projection (post-refi LTR)
  const projection: ProjectionYear[] = [];
  let cumulativeCashFlow = 0;
  const rentGrowth = brrrr.annualRentGrowth / 100;
  const expenseGrowth = inputs.expenses.annualExpenseGrowth / 100;
  const appreciation = inputs.appreciationRate / 100;
  const cashInvestedForReturn = cashLeftInDeal > 0 ? cashLeftInDeal : initialCashInvested;

  for (let y = 1; y <= 5; y++) {
    const growthMultRevenue = Math.pow(1 + rentGrowth, y - 1);
    const growthMultExpense = Math.pow(1 + expenseGrowth, y - 1);
    const yGrossRevenue = effectiveGrossIncome * growthMultRevenue;
    const yOpEx = totalOpEx * growthMultExpense;
    const yNoi = yGrossRevenue - yOpEx;
    const netCashFlow = yNoi - refiAnnualDebtService;
    cumulativeCashFlow += netCashFlow;
    const propertyValue = arv * Math.pow(1 + appreciation, y);
    const loanBalance = getLoanBalanceAfterYear(refiSchedule, y);
    const equity = propertyValue - loanBalance;
    const appreciationGain = propertyValue - arv;
    const paydown = refiLoanAmount - loanBalance;
    const totalReturn = cashInvestedForReturn > 0
      ? ((cumulativeCashFlow + appreciationGain + paydown) / cashInvestedForReturn) * 100
      : 0;
    const tb = calculateTaxBenefits(inputs, yNoi, netCashFlow, refiSchedule, y);
    projection.push({
      year: y,
      grossRevenue: yGrossRevenue,
      operatingExpenses: yOpEx,
      noi: yNoi,
      debtService: refiAnnualDebtService,
      netCashFlow,
      cocReturn: cashInvestedForReturn > 0 ? calculateCashOnCash(netCashFlow, cashInvestedForReturn) : 0,
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

  return {
    purchasePrice,
    arv,
    renovationBudget: renoBudget,
    initialCashInvested,
    hardMoneyLoan,
    hardMoneyPoints,
    phase1InterestCost,
    refiLoanAmount,
    refiCashOut,
    cashLeftInDeal,
    allInCost,
    refiMonthlyPayment,
    monthlyRent: brrrr.monthlyRent,
    monthlyCashFlow,
    annualCashFlow,
    postRefiCocReturn,
    postRefiDscr,
    capRate,
    isInfiniteReturn,
    grm,
    taxBenefits,
    trueCocReturn,
    projection,
    amortizationSchedule: refiSchedule,
  };
}
