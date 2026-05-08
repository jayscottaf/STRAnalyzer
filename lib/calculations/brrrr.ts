import type { AmortizationEntry, DealInputs, BRRRRMetrics, ProjectionYear } from '../types';
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
  const isCashInitial = brrrr.initialFundingType === 'cash';
  const hasRefi = brrrr.refiStrategy !== 'none';
  const canCashOut = hasRefi && brrrr.refiStrategy !== 'rate_term' && brrrr.refiCashOut;

  // Phase 1: acquisition and rehab with the selected initial funding source.
  const financedRehab = isCashInitial ? 0 : Math.min(Math.max(brrrr.initialRehabFunding, 0), renoBudget);
  const initialLoanBasis = purchasePrice + financedRehab;
  const initialLoanAmount = isCashInitial ? 0 : initialLoanBasis * (brrrr.initialLoanLtvPct / 100);
  const initialLoanPoints = initialLoanAmount * (brrrr.initialPoints / 100);
  const phase1Months = brrrr.renoTimelineMonths + brrrr.seasoningMonths;
  const initialTermYears = Math.max(brrrr.initialTermMonths / 12, 1 / 12);
  const phase1Schedule = brrrr.initialInterestOnly
    ? []
    : generateAmortizationSchedule(initialLoanAmount, brrrr.initialRate, initialTermYears, phase1Months);
  const phase1InterestCost = brrrr.initialInterestOnly
    ? initialLoanAmount * (brrrr.initialRate / 100 / 12) * phase1Months
    : phase1Schedule.reduce((sum, entry) => sum + entry.payment, 0);
  const initialLoanPayoff = brrrr.initialInterestOnly
    ? initialLoanAmount
    : phase1Schedule.at(-1)?.remainingBalance ?? initialLoanAmount;
  const closingCosts = purchasePrice * (brrrr.purchaseClosingCostsPct / 100);
  const initialCashInvested = Math.max(
    purchasePrice + renoBudget + initialLoanPoints + closingCosts - initialLoanAmount,
    0,
  );

  // Phase 2: refinance into permanent debt, or leave initial debt in place.
  const refiMaxLoan = arv * (brrrr.refiLTV / 100);
  const refiLoanAmount = !hasRefi
    ? initialLoanPayoff
    : canCashOut
      ? refiMaxLoan
      : Math.min(refiMaxLoan, initialLoanPayoff);
  const refiClosingCosts = hasRefi ? refiLoanAmount * (brrrr.refiClosingCostsPct / 100) : 0;
  const refiCashOut = canCashOut ? Math.max(refiLoanAmount - initialLoanPayoff - refiClosingCosts, 0) : 0;
  const cashLeftInDeal = Math.max(initialCashInvested + phase1InterestCost - refiCashOut, 0);
  const allInCost = purchasePrice + renoBudget + phase1InterestCost + initialLoanPoints + closingCosts + refiClosingCosts;

  const ongoingRate = hasRefi ? brrrr.refiRate : brrrr.initialRate;
  const ongoingTermYears = hasRefi ? brrrr.refiTermYears : initialTermYears;
  const refiMonthlyPayment = (hasRefi || !brrrr.initialInterestOnly)
    ? calculateMonthlyPayment(refiLoanAmount, ongoingRate, ongoingTermYears)
    : refiLoanAmount * (ongoingRate / 100 / 12);
  const refiSchedule: AmortizationEntry[] = (hasRefi || !brrrr.initialInterestOnly)
    ? generateAmortizationSchedule(refiLoanAmount, ongoingRate, ongoingTermYears, 60)
    : Array.from({ length: 60 }, (_, index) => ({
      month: index + 1,
      payment: refiMonthlyPayment,
      interest: refiMonthlyPayment,
      principal: 0,
      remainingBalance: refiLoanAmount,
    }));
  const refiAnnualDebtService = refiMonthlyPayment * 12;

  // Post-refi LTR operation
  const annualGrossRent = brrrr.monthlyRent * 12;
  const vacancyLoss = annualGrossRent * (brrrr.vacancyRatePct / 100);
  const effectiveGrossIncome = annualGrossRent - vacancyLoss;

  // Operating expenses
  const propertyTax = arv * (inputs.expenses.propertyTaxRate / 100);
  const insurance = arv * (inputs.expenses.insuranceRate / 100);
  const hoa = inputs.expenses.hoaMonthly * 12;
  const utilities = inputs.expenses.utilitiesMonthly * 12 * 0.5;
  const maintenance = effectiveGrossIncome * (inputs.expenses.maintenanceReservePct / 100);
  const capex = arv * ((inputs.expenses.capexReservePct ?? 0) / 100);
  const propertyManagement = effectiveGrossIncome * (brrrr.managementFeePct / 100);
  const totalOpEx = propertyTax + insurance + hoa + utilities + maintenance + capex + propertyManagement;

  const noi = effectiveGrossIncome - totalOpEx;
  const annualCashFlow = noi - refiAnnualDebtService;
  const monthlyCashFlow = annualCashFlow / 12;

  const isInfiniteReturn = cashLeftInDeal <= 0 && annualCashFlow > 0;
  const postRefiCocReturn = cashLeftInDeal > 0
    ? calculateCashOnCash(annualCashFlow, cashLeftInDeal)
    : annualCashFlow > 0 ? Infinity : 0;

  const postRefiDscr = calculateDSCR(noi, refiAnnualDebtService);
  const capRate = calculateCapRate(noi, arv);
  const grm = arv > 0 && annualGrossRent > 0 ? arv / annualGrossRent : 0;

  const taxBenefits = calculateTaxBenefits(inputs, noi, annualCashFlow, refiSchedule, 1);
  const trueCocReturn = taxBenefits?.afterTaxCashFlow && cashLeftInDeal > 0
    ? calculateCashOnCash(taxBenefits.afterTaxCashFlow, cashLeftInDeal)
    : null;

  const projection: ProjectionYear[] = [];
  let cumulativeCashFlow = 0;
  const rentGrowth = brrrr.annualRentGrowth / 100;
  const expenseGrowth = inputs.expenses.annualExpenseGrowth / 100;
  const appreciation = inputs.appreciationRate / 100;
  const cashInvestedForReturn = cashLeftInDeal > 0 ? cashLeftInDeal : initialCashInvested + phase1InterestCost;

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
    const paydown = Math.max(refiLoanAmount - loanBalance, 0);
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
    initialLoanAmount,
    initialLoanPoints,
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
