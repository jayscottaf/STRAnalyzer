'use client';

import type { ExpenseInputs as ExpenseInputsType, PropertyInputs } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import InputField from './input-field';

interface Props {
  values: ExpenseInputsType;
  property: PropertyInputs;
  onChange: (updates: Partial<ExpenseInputsType>) => void;
}

export default function ExpenseInputs({ values, property, onChange }: Props) {
  const monthlyFixed =
    (property.purchasePrice * (values.propertyTaxRate / 100)) / 12 +
    (property.purchasePrice * (values.insuranceRate / 100)) / 12 +
    values.hoaMonthly +
    values.utilitiesMonthly +
    values.suppliesMonthly +
    values.softwareMonthly +
    values.strPermitYearly / 12;

  return (
    <div>
      <InputField
        label="Property Tax Rate"
        value={values.propertyTaxRate}
        onChange={(v) => onChange({ propertyTaxRate: v as number })}
        suffix="%"
        min={0}
        max={10}
        step={0.1}
        tooltip="TN ~0.6%, FL ~1%, TX ~1.8%"
      />

      <InputField
        label="Insurance Rate"
        value={values.insuranceRate}
        onChange={(v) => onChange({ insuranceRate: v as number })}
        suffix="%"
        min={0}
        max={5}
        step={0.1}
        tooltip="STR insurance runs 0.4-0.8% of value"
      />

      <InputField
        label="HOA / Month"
        value={values.hoaMonthly}
        onChange={(v) => onChange({ hoaMonthly: v as number })}
        prefix="$"
        min={0}
        step={25}
      />

      <InputField
        label="Utilities / Month"
        value={values.utilitiesMonthly}
        onChange={(v) => onChange({ utilitiesMonthly: v as number })}
        prefix="$"
        min={0}
        step={25}
      />

      <InputField
        label="Maintenance Reserve"
        value={values.maintenanceReservePct}
        onChange={(v) => onChange({ maintenanceReservePct: v as number })}
        suffix="%"
        min={0}
        max={10}
        step={0.5}
      />

      <InputField
        label="Property Management"
        value={values.propertyManagementPct}
        onChange={(v) => onChange({ propertyManagementPct: v as number })}
        suffix="%"
        min={0}
        max={50}
        step={1}
        tooltip="Setting PM above 0% may jeopardize material participation for tax purposes."
      />
      {values.propertyManagementPct > 0 && (
        <p className="text-[10px] text-accent-amber -mt-2 mb-3">
          PM fee may affect material participation status for tax deductions
        </p>
      )}

      <InputField
        label="Supplies / Month"
        value={values.suppliesMonthly}
        onChange={(v) => onChange({ suppliesMonthly: v as number })}
        prefix="$"
        min={0}
        step={25}
      />

      <InputField
        label="Software / Month"
        value={values.softwareMonthly}
        onChange={(v) => onChange({ softwareMonthly: v as number })}
        prefix="$"
        min={0}
        step={25}
      />

      <InputField
        label="STR Permit / Year"
        value={values.strPermitYearly}
        onChange={(v) => onChange({ strPermitYearly: v as number })}
        prefix="$"
        min={0}
        step={50}
      />

      <InputField
        label="Annual Expense Growth"
        value={values.annualExpenseGrowth}
        onChange={(v) => onChange({ annualExpenseGrowth: v as number })}
        suffix="%"
        min={-5}
        max={20}
        step={0.5}
      />

      <div className="mt-3 pt-3 border-t border-border-default">
        <div className="flex justify-between text-xs">
          <span className="text-text-muted">Monthly Fixed Total</span>
          <span className="text-text-foreground font-medium">{formatCurrency(monthlyFixed)}</span>
        </div>
      </div>
    </div>
  );
}
