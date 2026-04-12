import type { DealInputs, ValidationError } from './types';

export function validateInputs(inputs: DealInputs): ValidationError[] {
  const errors: ValidationError[] = [];

  // Property
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

  // Financing
  if (inputs.financing.loanType !== 'cash') {
    if (inputs.financing.downPaymentPct < 0 || inputs.financing.downPaymentPct > 100) {
      errors.push({ field: 'downPaymentPct', message: 'Down payment must be 0-100%' });
    }
    if (inputs.financing.interestRate <= 0 || inputs.financing.interestRate > 25) {
      errors.push({ field: 'interestRate', message: 'Interest rate must be between 0 and 25%' });
    }
  }
  if (inputs.financing.furnishingBudget < 0) {
    errors.push({ field: 'furnishingBudget', message: 'Furnishing budget cannot be negative' });
  }

  // Revenue
  if (inputs.revenue.adr <= 0) {
    errors.push({ field: 'adr', message: 'ADR must be greater than 0' });
  }
  if (inputs.revenue.occupancyRate <= 0 || inputs.revenue.occupancyRate > 100) {
    errors.push({ field: 'occupancyRate', message: 'Occupancy must be between 0 and 100%' });
  }
  if (inputs.revenue.avgStayLength < 1) {
    errors.push({ field: 'avgStayLength', message: 'Average stay must be at least 1 night' });
  }

  // Expenses
  if (inputs.expenses.propertyTaxRate < 0 || inputs.expenses.propertyTaxRate > 10) {
    errors.push({ field: 'propertyTaxRate', message: 'Property tax rate must be 0-10%' });
  }

  return errors;
}

export function hasErrors(errors: ValidationError[], field: string): boolean {
  return errors.some((e) => e.field === field);
}

export function getError(errors: ValidationError[], field: string): string | undefined {
  return errors.find((e) => e.field === field)?.message;
}
