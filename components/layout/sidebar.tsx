'use client';

import type { DealInputs, DealAction, Strategy } from '@/lib/types';
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

const STRATEGY_OPTIONS: { value: Strategy; label: string; icon: string }[] = [
  { value: 'str', label: 'Short-Term Rental', icon: '🏠' },
  { value: 'ltr', label: 'Long-Term Rental', icon: '🔑' },
  { value: 'flip', label: 'Fix & Flip', icon: '🔨' },
  { value: 'brrrr', label: 'BRRRR', icon: '♻️' },
  { value: 'wholesale', label: 'Wholesale', icon: '📝' },
];

export default function Sidebar({ inputs, dispatch }: Props) {
  const strategy = inputs.activeStrategy ?? 'str';
  const needsFinancing = strategy !== 'wholesale';
  const needsExpenses = strategy === 'str' || strategy === 'ltr' || strategy === 'brrrr';
  const needsTax = strategy === 'str' || strategy === 'ltr' || strategy === 'brrrr';

  return (
    <div className="h-full overflow-y-auto">
      {/* Strategy Selector */}
      <div className="px-4 py-3 border-b border-border-default bg-bg-elevated/50">
        <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">
          Investment Strategy
        </label>
        <select
          value={strategy}
          onChange={(e) => dispatch({ type: 'SET_STRATEGY', payload: e.target.value as Strategy })}
          className="w-full h-10 sm:h-9 bg-bg-base border border-accent-blue/40 rounded-lg text-sm text-text-foreground px-3 outline-none focus:border-accent-blue font-medium"
        >
          {STRATEGY_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
          ))}
        </select>
      </div>

      <SidebarSection title="Property Details" defaultOpen>
        <PropertyInputs
          values={inputs.property}
          onChange={(updates) => dispatch({ type: 'UPDATE_PROPERTY', payload: updates })}
          dispatch={dispatch}
        />
      </SidebarSection>

      {needsFinancing && (
        <SidebarSection title="Financing" defaultOpen>
          <FinancingInputs
            values={inputs.financing}
            property={inputs.property}
            onChange={(updates) => dispatch({ type: 'UPDATE_FINANCING', payload: updates })}
            strategy={strategy}
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
        <SidebarSection title="Rental Income" defaultOpen>
          <LTRInputs
            values={inputs.ltr}
            property={inputs.property}
            onChange={(updates) => dispatch({ type: 'UPDATE_LTR', payload: updates })}
          />
        </SidebarSection>
      )}

      {strategy === 'flip' && (
        <SidebarSection title="Flip Analysis" defaultOpen>
          <FlipInputs
            values={inputs.flip}
            property={inputs.property}
            onChange={(updates) => dispatch({ type: 'UPDATE_FLIP', payload: updates })}
          />
        </SidebarSection>
      )}

      {strategy === 'brrrr' && (
        <SidebarSection title="BRRRR Plan" defaultOpen>
          <BRRRRInputs
            values={inputs.brrrr}
            onChange={(updates) => dispatch({ type: 'UPDATE_BRRRR', payload: updates })}
          />
        </SidebarSection>
      )}

      {strategy === 'wholesale' && (
        <SidebarSection title="Wholesale Deal" defaultOpen>
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
            strategy={strategy}
          />
        </SidebarSection>
      )}

      {needsTax && (
        <SidebarSection
          title="Tax Strategy"
          badge={inputs.tax.enabled ? 'ON' : undefined}
        >
          <TaxInputs
            values={inputs.tax}
            pmPct={inputs.expenses.propertyManagementPct}
            avgStayLength={strategy === 'str' ? inputs.revenue.avgStayLength : 365}
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
