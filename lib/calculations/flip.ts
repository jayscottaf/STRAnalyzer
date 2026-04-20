import type { DealInputs, FlipMetrics } from '../types';

export function calculateFlipMetrics(inputs: DealInputs): FlipMetrics {
  const { property, flip } = inputs;
  const purchasePrice = property.purchasePrice;
  const arv = flip.arv;
  const renoBudget = flip.renovationBudget;
  const contingency = renoBudget * (flip.contingencyPct / 100);
  const totalReno = renoBudget + contingency;
  const holdMonths = flip.totalHoldMonths;

  // Loan details
  let loanAmount = 0;
  let loanPoints = 0;
  let totalInterestCost = 0;
  let cashRequired = purchasePrice + totalReno; // if cash

  if (flip.financingType === 'hard_money') {
    // Hard money typically funds 80-90% of purchase + some or all reno
    loanAmount = purchasePrice * 0.80; // finance 80% of purchase
    loanPoints = loanAmount * (flip.hardMoneyPoints / 100);
    // Interest-only for hold period
    const monthlyInterest = loanAmount * (flip.hardMoneyRate / 100 / 12);
    totalInterestCost = monthlyInterest * holdMonths;
    const downPayment = purchasePrice - loanAmount;
    cashRequired = downPayment + totalReno + loanPoints;
  } else if (flip.financingType === 'conventional') {
    loanAmount = purchasePrice * (1 - inputs.financing.downPaymentPct / 100);
    // Use actual month-by-month interest accumulation
    const monthlyRate = inputs.financing.interestRate / 100 / 12;
    const n = inputs.financing.loanTerm * 12;
    const monthlyPayment = loanAmount > 0
      ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
      : 0;
    let balance = loanAmount;
    totalInterestCost = 0;
    for (let m = 0; m < holdMonths; m++) {
      const interest = balance * monthlyRate;
      const principal = monthlyPayment - interest;
      totalInterestCost += interest;
      balance -= principal;
    }
    const downPayment = purchasePrice - loanAmount;
    cashRequired = downPayment + totalReno;
  }

  // Holding costs during flip
  const propertyTaxMonthly = purchasePrice * (inputs.expenses.propertyTaxRate / 100) / 12;
  const insuranceMonthly = purchasePrice * (inputs.expenses.insuranceRate / 100) / 12;
  const utilitiesMonthly = inputs.expenses.utilitiesMonthly;
  const holdingCostBreakdown = {
    loanInterest: totalInterestCost,
    propertyTax: propertyTaxMonthly * holdMonths,
    insurance: insuranceMonthly * holdMonths,
    utilities: utilitiesMonthly * holdMonths,
    loanPoints,
  };
  const holdingCosts =
    holdingCostBreakdown.loanInterest +
    holdingCostBreakdown.propertyTax +
    holdingCostBreakdown.insurance +
    holdingCostBreakdown.utilities +
    holdingCostBreakdown.loanPoints;

  // Selling costs (agent, closing)
  const sellingCosts = arv * (flip.sellingCostsPct / 100);

  // Total investment (what comes out of my pocket)
  const totalInvestment = cashRequired + holdingCosts;

  // Profit
  const grossProfit = arv - purchasePrice - totalReno - holdingCosts - sellingCosts;
  const netProfit = grossProfit;

  // Tax — flip profit is short-term capital gains (ordinary income rates)
  const combinedRate = inputs.tax.enabled
    ? (inputs.tax.federalBracket + inputs.tax.stateTaxRate) / 100
    : 0;
  const afterTaxProfit = netProfit > 0 ? netProfit * (1 - combinedRate) : netProfit;

  // ROI metrics
  const roi = cashRequired > 0 ? (netProfit / cashRequired) * 100 : 0;
  const profitMargin = arv > 0 ? (netProfit / arv) * 100 : 0;
  const pricePerSqftAfter = property.sqft > 0 ? arv / property.sqft : 0;

  // 70% rule
  const maxAllowableOffer = arv * 0.70 - totalReno;
  const meetsSeventyRule = purchasePrice <= maxAllowableOffer;

  return {
    arv,
    purchasePrice,
    renovationBudget: renoBudget,
    contingency,
    totalHoldMonths: holdMonths,
    loanAmount,
    loanPoints,
    totalInterestCost,
    holdingCosts,
    sellingCosts,
    totalInvestment,
    grossProfit,
    netProfit,
    afterTaxProfit,
    roi,
    profitMargin,
    cashRequired,
    pricePerSqftAfter,
    maxAllowableOffer,
    meetsSeventyRule,
    holdingCostBreakdown,
  };
}
