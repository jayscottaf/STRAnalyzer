'use client';

import type { DealInputs, DealAction } from '@/lib/types';
import SidebarSection from './sidebar-section';
import PropertyInputs from '../inputs/property-inputs';
import FinancingInputs from '../inputs/financing-inputs';
import RevenueInputs from '../inputs/revenue-inputs';
import ExpenseInputs from '../inputs/expense-inputs';
import TaxInputs from '../inputs/tax-inputs';

interface Props {
  inputs: DealInputs;
  dispatch: React.Dispatch<DealAction>;
}

export default function Sidebar({ inputs, dispatch }: Props) {
  return (
    <div className="h-full overflow-y-auto">
      <SidebarSection title="Property Details" defaultOpen>
        <PropertyInputs
          values={inputs.property}
          onChange={(updates) => dispatch({ type: 'UPDATE_PROPERTY', payload: updates })}
        />
      </SidebarSection>

      <SidebarSection title="Financing" defaultOpen>
        <FinancingInputs
          values={inputs.financing}
          property={inputs.property}
          onChange={(updates) => dispatch({ type: 'UPDATE_FINANCING', payload: updates })}
        />
      </SidebarSection>

      <SidebarSection title="Revenue Assumptions" defaultOpen>
        <RevenueInputs
          values={inputs.revenue}
          onChange={(updates) => dispatch({ type: 'UPDATE_REVENUE', payload: updates })}
          onSeasonalityChange={(m) => dispatch({ type: 'UPDATE_SEASONALITY', payload: m })}
        />
      </SidebarSection>

      <SidebarSection title="Expenses">
        <ExpenseInputs
          values={inputs.expenses}
          property={inputs.property}
          onChange={(updates) => dispatch({ type: 'UPDATE_EXPENSES', payload: updates })}
        />
      </SidebarSection>

      <SidebarSection
        title="Advanced Tax Strategy"
        badge={inputs.tax.enabled ? 'ON' : undefined}
      >
        <TaxInputs
          values={inputs.tax}
          pmPct={inputs.expenses.propertyManagementPct}
          onChange={(updates) => dispatch({ type: 'UPDATE_TAX', payload: updates })}
        />
      </SidebarSection>
    </div>
  );
}
