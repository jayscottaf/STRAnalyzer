'use client';

import type { DealInputs, DealAction } from '@/lib/types';
import SidebarSection from './sidebar-section';
import PropertyInputs from '../inputs/property-inputs';
import FinancingInputs from '../inputs/financing-inputs';
import RevenueInputs from '../inputs/revenue-inputs';
import ExpenseInputs from '../inputs/expense-inputs';
import TaxInputs from '../inputs/tax-inputs';
import NotesInput from '../inputs/notes-input';
import LTRInputs from '../inputs/ltr-inputs';
import FlipInputs from '../inputs/flip-inputs';
import BRRRRInputs from '../inputs/brrrr-inputs';
import WholesaleInputs from '../inputs/wholesale-inputs';

interface Props {
  inputs: DealInputs;
  dispatch: React.Dispatch<DealAction>;
}

export default function Sidebar({ inputs, dispatch }: Props) {
  const strategy = inputs.activeStrategy;
  const needsFinancing = strategy !== 'wholesale';
  const needsExpenses = strategy === 'str' || strategy === 'ltr' || strategy === 'brrrr';
  const needsTax = strategy === 'str' || strategy === 'ltr' || strategy === 'brrrr';

  return (
    <div className="h-full overflow-y-auto">
      <SidebarSection title="Property Details" defaultOpen>
        <PropertyInputs
          values={inputs.property}
          onChange={(updates) => dispatch({ type: 'UPDATE_PROPERTY', payload: updates })}
        />
      </SidebarSection>

      {needsFinancing && (
        <SidebarSection title="Financing" defaultOpen>
          <FinancingInputs
            values={inputs.financing}
            property={inputs.property}
            onChange={(updates) => dispatch({ type: 'UPDATE_FINANCING', payload: updates })}
          />
        </SidebarSection>
      )}

      {/* Strategy-specific inputs */}
      {strategy === 'str' && (
        <SidebarSection title="STR Revenue" defaultOpen>
          <RevenueInputs
            values={inputs.revenue}
            onChange={(updates) => dispatch({ type: 'UPDATE_REVENUE', payload: updates })}
            onSeasonalityChange={(m) => dispatch({ type: 'UPDATE_SEASONALITY', payload: m })}
          />
        </SidebarSection>
      )}

      {strategy === 'ltr' && (
        <SidebarSection title="LTR Revenue" defaultOpen>
          <LTRInputs
            values={inputs.ltr}
            property={inputs.property}
            onChange={(updates) => dispatch({ type: 'UPDATE_LTR', payload: updates })}
          />
        </SidebarSection>
      )}

      {strategy === 'flip' && (
        <SidebarSection title="Flip Details" defaultOpen>
          <FlipInputs
            values={inputs.flip}
            property={inputs.property}
            onChange={(updates) => dispatch({ type: 'UPDATE_FLIP', payload: updates })}
          />
        </SidebarSection>
      )}

      {strategy === 'brrrr' && (
        <SidebarSection title="BRRRR Details" defaultOpen>
          <BRRRRInputs
            values={inputs.brrrr}
            onChange={(updates) => dispatch({ type: 'UPDATE_BRRRR', payload: updates })}
          />
        </SidebarSection>
      )}

      {strategy === 'wholesale' && (
        <SidebarSection title="Wholesale Details" defaultOpen>
          <WholesaleInputs
            values={inputs.wholesale}
            property={inputs.property}
            onChange={(updates) => dispatch({ type: 'UPDATE_WHOLESALE', payload: updates })}
          />
        </SidebarSection>
      )}

      {needsExpenses && (
        <SidebarSection title="Expenses">
          <ExpenseInputs
            values={inputs.expenses}
            property={inputs.property}
            onChange={(updates) => dispatch({ type: 'UPDATE_EXPENSES', payload: updates })}
          />
        </SidebarSection>
      )}

      {needsTax && (
        <SidebarSection
          title="Advanced Tax Strategy"
          badge={inputs.tax.enabled ? 'ON' : undefined}
        >
          <TaxInputs
            values={inputs.tax}
            pmPct={inputs.expenses.propertyManagementPct}
            avgStayLength={inputs.revenue.avgStayLength}
            onChange={(updates) => dispatch({ type: 'UPDATE_TAX', payload: updates })}
          />
        </SidebarSection>
      )}

      <SidebarSection
        title="Deal Notes"
        badge={inputs.notes && inputs.notes.length > 0 ? String(inputs.notes.length) : undefined}
      >
        <NotesInput
          value={inputs.notes ?? ''}
          onChange={(v) => dispatch({ type: 'UPDATE_NOTES', payload: v })}
        />
      </SidebarSection>
    </div>
  );
}
