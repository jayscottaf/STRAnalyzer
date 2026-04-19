import type { DealInputs, WholesaleMetrics } from '../types';

export function calculateWholesaleMetrics(inputs: DealInputs): WholesaleMetrics {
  const { property, wholesale } = inputs;
  const arv = wholesale.arv;
  const renoEstimate = wholesale.renovationEstimate;
  const assignmentFee = wholesale.assignmentFee;
  const askingPrice = property.purchasePrice;

  // MAO: ARV × discount% - reno - assignment fee
  const maxAllowableOffer = arv * (wholesale.maoDiscountPct / 100) - renoEstimate - assignmentFee;
  const spreadVsAsking = maxAllowableOffer - askingPrice;

  const earnestMoney = wholesale.earnestMoney;
  const netProfit = assignmentFee;
  const roiOnEarnest = earnestMoney > 0 ? (netProfit / earnestMoney) * 100 : 0;

  // Wholesale income taxed as ordinary income
  const combinedRate = inputs.tax.enabled
    ? (inputs.tax.federalBracket + inputs.tax.stateTaxRate) / 100
    : 0;
  const afterTaxProfit = netProfit * (1 - combinedRate);

  // 70% rule check (without assignment fee, for buyer's view)
  const buyerMAO = arv * 0.70 - renoEstimate;
  const meetsSeventyRule = askingPrice + assignmentFee <= buyerMAO;

  // Deal quality
  let dealQuality: 'strong' | 'marginal' | 'weak';
  if (spreadVsAsking >= 5000 && meetsSeventyRule) dealQuality = 'strong';
  else if (spreadVsAsking >= 0) dealQuality = 'marginal';
  else dealQuality = 'weak';

  return {
    arv,
    renovationEstimate: renoEstimate,
    maxAllowableOffer,
    askingPrice,
    assignmentFee,
    spreadVsAsking,
    earnestMoney,
    roiOnEarnest,
    netProfit,
    afterTaxProfit,
    meetsSeventyRule,
    dealQuality,
  };
}
