import type { DealInputs, ValidationError } from './types';

export function validateInputs(inputs: DealInputs): ValidationError[] {
  const errors: ValidationError[] = [];
  const strategy = inputs.activeStrategy ?? 'str';

  // Property (shared)
  if (inputs.property.purchasePrice <= 0) {
    errors.push({ field: 'purchasePrice', message: 'Purchase price must be greater than 0' });
  }
  if (inputs.property.bedrooms < 1) {
    errors.push({ field: 'bedrooms', message: 'Must have at least 1 bedroom' });
  }
  if (inputs.property.bathrooms < 1) {
    errors.push({ field: 'bathrooms', message: 'Must have at least 1 bathroom' });
  }
  if (inputs.property.landValuePct < 0 || inputs.property.landValuePct > 50) {
    errors.push({ field: 'landValuePct', message: 'Land value must be 0-50%' });
  }

  // Financing (shared, except wholesale)
  if (strategy !== 'wholesale' && inputs.financing.loanType !== 'cash') {
    if (inputs.financing.downPaymentPct < 0 || inputs.financing.downPaymentPct > 100) {
      errors.push({ field: 'downPaymentPct', message: 'Down payment must be 0-100%' });
    }
    if (inputs.financing.interestRate <= 0 || inputs.financing.interestRate > 25) {
      errors.push({ field: 'interestRate', message: 'Interest rate must be between 0 and 25%' });
    }
  }

  // STR-specific
  if (strategy === 'str') {
    if (inputs.revenue.adr <= 0) {
      errors.push({ field: 'adr', message: 'ADR must be greater than 0' });
    }
    if (inputs.revenue.occupancyRate <= 0 || inputs.revenue.occupancyRate > 100) {
      errors.push({ field: 'occupancyRate', message: 'Occupancy must be between 0 and 100%' });
    }
    if (inputs.revenue.avgStayLength < 1) {
      errors.push({ field: 'avgStayLength', message: 'Average stay must be at least 1 night' });
    }
  }

  // LTR-specific
  if (strategy === 'ltr') {
    if (inputs.ltr.monthlyRent <= 0) {
      errors.push({ field: 'monthlyRent', message: 'Monthly rent must be greater than 0' });
    }
    if (inputs.ltr.vacancyRatePct < 0 || inputs.ltr.vacancyRatePct > 50) {
      errors.push({ field: 'vacancyRate', message: 'Vacancy rate must be 0-50%' });
    }
  }

  // Flip-specific
  if (strategy === 'flip') {
    if (inputs.flip.arv <= 0) {
      errors.push({ field: 'arv', message: 'ARV must be greater than 0' });
    }
    if (inputs.flip.arv <= inputs.property.purchasePrice) {
      errors.push({ field: 'arv', message: 'ARV should exceed purchase price for a profitable flip' });
    }
    if (inputs.flip.renovationBudget < 0) {
      errors.push({ field: 'renovationBudget', message: 'Renovation budget cannot be negative' });
    }
    if (inputs.flip.totalHoldMonths < 1) {
      errors.push({ field: 'totalHoldMonths', message: 'Hold time must be at least 1 month' });
    }
  }

  // BRRRR-specific
  if (strategy === 'brrrr') {
    if (inputs.brrrr.arv <= 0) {
      errors.push({ field: 'arv', message: 'ARV must be greater than 0' });
    }
    if (inputs.brrrr.monthlyRent <= 0) {
      errors.push({ field: 'monthlyRent', message: 'Post-refi monthly rent must be greater than 0' });
    }
    if (inputs.brrrr.refiLTV <= 0 || inputs.brrrr.refiLTV > 80) {
      errors.push({ field: 'refiLTV', message: 'Refi LTV must be 0-80%' });
    }
  }

  // Wholesale-specific
  if (strategy === 'wholesale') {
    if (inputs.wholesale.arv <= 0) {
      errors.push({ field: 'arv', message: 'ARV must be greater than 0' });
    }
    if (inputs.wholesale.assignmentFee <= 0) {
      errors.push({ field: 'assignmentFee', message: 'Assignment fee must be greater than 0' });
    }
  }

  // Expenses (shared for rental strategies)
  if (strategy === 'str' || strategy === 'ltr' || strategy === 'brrrr') {
    if (inputs.expenses.propertyTaxRate < 0 || inputs.expenses.propertyTaxRate > 10) {
      errors.push({ field: 'propertyTaxRate', message: 'Property tax rate must be 0-10%' });
    }
  }

  return errors;
}

export function hasErrors(errors: ValidationError[], field: string): boolean {
  return errors.some((e) => e.field === field);
}

export function getError(errors: ValidationError[], field: string): string | undefined {
  return errors.find((e) => e.field === field)?.message;
}
