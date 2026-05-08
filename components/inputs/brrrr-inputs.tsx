'use client';

import type {
  BRRRRInitialFundingType,
  BRRRRInputs as BRRRRInputsType,
  BRRRRRefiStrategy,
  PropertyInputs,
} from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import InputField from './input-field';

interface Props {
  values: BRRRRInputsType;
  property: PropertyInputs;
  onChange: (updates: Partial<BRRRRInputsType>) => void;
}

const INITIAL_FUNDING_OPTIONS: { value: BRRRRInitialFundingType; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'hard_money', label: 'Hard Money / Fix-and-Flip Loan' },
  { value: 'private_money', label: 'Private Money' },
  { value: 'bridge', label: 'Bridge Loan' },
  { value: 'conventional', label: 'Conventional Investment Loan' },
  { value: 'dscr', label: 'DSCR Acquisition Loan' },
  { value: 'heloc', label: 'HELOC / Line of Credit' },
  { value: 'seller_financing', label: 'Seller Financing' },
  { value: 'other', label: 'Other / Custom' },
];

const REFI_OPTIONS: { value: BRRRRRefiStrategy; label: string }[] = [
  { value: 'dscr_cash_out', label: 'DSCR Cash-Out Refinance' },
  { value: 'conventional_cash_out', label: 'Conventional Investment Cash-Out Refinance' },
  { value: 'portfolio_cash_out', label: 'Portfolio / Local Bank Refinance' },
  { value: 'delayed_financing', label: 'Delayed Financing / Cash Recapture' },
  { value: 'rate_term', label: 'Rate-and-Term Refinance' },
  { value: 'none', label: 'No Refinance' },
  { value: 'other', label: 'Other / Custom' },
];

function getInitialFundingPreset(
  type: BRRRRInitialFundingType,
  renovationBudget: number,
): Partial<BRRRRInputsType> {
  const fullReno = Math.max(renovationBudget, 0);
  const halfReno = Math.round(fullReno * 0.5);

  switch (type) {
    case 'cash':
      return {
        initialFundingType: type,
        initialLoanLtvPct: 0,
        initialRehabFunding: 0,
        initialRate: 0,
        initialPoints: 0,
        initialTermMonths: 0,
        initialInterestOnly: false,
      };
    case 'hard_money':
      return {
        initialFundingType: type,
        initialLoanLtvPct: 80,
        initialRehabFunding: fullReno,
        initialRate: 12,
        initialPoints: 2,
        initialTermMonths: 12,
        initialInterestOnly: true,
      };
    case 'private_money':
      return {
        initialFundingType: type,
        initialLoanLtvPct: 85,
        initialRehabFunding: fullReno,
        initialRate: 10,
        initialPoints: 1,
        initialTermMonths: 24,
        initialInterestOnly: true,
      };
    case 'bridge':
      return {
        initialFundingType: type,
        initialLoanLtvPct: 75,
        initialRehabFunding: halfReno,
        initialRate: 9.5,
        initialPoints: 1,
        initialTermMonths: 18,
        initialInterestOnly: true,
      };
    case 'conventional':
      return {
        initialFundingType: type,
        initialLoanLtvPct: 75,
        initialRehabFunding: 0,
        initialRate: 7.25,
        initialPoints: 0,
        initialTermMonths: 360,
        initialInterestOnly: false,
      };
    case 'dscr':
      return {
        initialFundingType: type,
        initialLoanLtvPct: 75,
        initialRehabFunding: 0,
        initialRate: 8,
        initialPoints: 1,
        initialTermMonths: 360,
        initialInterestOnly: false,
      };
    case 'heloc':
      return {
        initialFundingType: type,
        initialLoanLtvPct: 85,
        initialRehabFunding: fullReno,
        initialRate: 9,
        initialPoints: 0,
        initialTermMonths: 120,
        initialInterestOnly: true,
      };
    case 'seller_financing':
      return {
        initialFundingType: type,
        initialLoanLtvPct: 80,
        initialRehabFunding: 0,
        initialRate: 6,
        initialPoints: 0,
        initialTermMonths: 60,
        initialInterestOnly: false,
      };
    case 'other':
      return {
        initialFundingType: type,
        initialLoanLtvPct: 80,
        initialRehabFunding: halfReno,
        initialRate: 8,
        initialPoints: 0,
        initialTermMonths: 60,
        initialInterestOnly: false,
      };
  }
}

function getRefiPreset(strategy: BRRRRRefiStrategy): Partial<BRRRRInputsType> {
  switch (strategy) {
    case 'dscr_cash_out':
      return {
        refiStrategy: strategy,
        refiLTV: 75,
        refiRate: 7.75,
        refiTermYears: 30,
        refiClosingCostsPct: 2.5,
        refiDscrMin: 1.2,
        refiCashOut: true,
      };
    case 'conventional_cash_out':
      return {
        refiStrategy: strategy,
        refiLTV: 70,
        refiRate: 7.25,
        refiTermYears: 30,
        refiClosingCostsPct: 2.5,
        refiDscrMin: 0,
        refiCashOut: true,
      };
    case 'portfolio_cash_out':
      return {
        refiStrategy: strategy,
        refiLTV: 75,
        refiRate: 7.5,
        refiTermYears: 30,
        refiClosingCostsPct: 2,
        refiDscrMin: 1.15,
        refiCashOut: true,
      };
    case 'delayed_financing':
      return {
        refiStrategy: strategy,
        refiLTV: 75,
        refiRate: 7.25,
        refiTermYears: 30,
        refiClosingCostsPct: 2,
        refiDscrMin: 0,
        refiCashOut: true,
      };
    case 'rate_term':
      return {
        refiStrategy: strategy,
        refiLTV: 75,
        refiRate: 7,
        refiTermYears: 30,
        refiClosingCostsPct: 1.5,
        refiDscrMin: 0,
        refiCashOut: false,
      };
    case 'none':
      return {
        refiStrategy: strategy,
        refiCashOut: false,
      };
    case 'other':
      return {
        refiStrategy: strategy,
        refiLTV: 75,
        refiRate: 8,
        refiTermYears: 30,
        refiClosingCostsPct: 2.5,
        refiDscrMin: 1.2,
        refiCashOut: true,
      };
  }
}

export default function BRRRRInputs({ values, property, onChange }: Props) {
  const isCashInitial = values.initialFundingType === 'cash';
  const hasRefi = values.refiStrategy !== 'none';
  const canCashOut = hasRefi && values.refiStrategy !== 'rate_term';
  const initialLoanBasis = property.purchasePrice + values.initialRehabFunding;
  const estimatedInitialLoan = isCashInitial
    ? 0
    : (values.initialLoanLtvPct / 100) * initialLoanBasis;
  const refiAmount = hasRefi ? values.arv * (values.refiLTV / 100) : 0;

  return (
    <div>
      <div className="text-[10px] font-semibold text-accent-blue uppercase tracking-wider mb-2">
        Deal &amp; Rehab
      </div>

      <InputField
        label="After Repair Value (ARV)"
        value={values.arv}
        onChange={(v) => onChange({ arv: v as number })}
        prefix="$"
        min={0}
        step={5000}
      />

      <InputField
        label="Renovation Budget"
        value={values.renovationBudget}
        onChange={(v) => {
          const nextReno = v as number;
          onChange({
            renovationBudget: nextReno,
            initialRehabFunding: Math.min(values.initialRehabFunding, nextReno),
          });
        }}
        prefix="$"
        min={0}
        step={1000}
      />

      <div className="grid grid-cols-2 gap-2">
        <InputField
          label="Reno Timeline"
          value={values.renoTimelineMonths}
          onChange={(v) => onChange({ renoTimelineMonths: v as number })}
          suffix="mo"
          min={1}
          max={24}
          step={1}
        />
        <InputField
          label="Seasoning"
          value={values.seasoningMonths}
          onChange={(v) => onChange({ seasoningMonths: v as number })}
          suffix="mo"
          min={0}
          max={24}
          step={1}
          tooltip="Months after rehab before the refinance. Lender requirements vary by loan type."
        />
      </div>

      <div className="text-[10px] font-semibold text-accent-blue uppercase tracking-wider mt-4 mb-2">
        Initial Funding
      </div>

      <div className="mb-3">
        <label className="text-xs font-medium text-text-muted mb-1 block">Funding Type</label>
        <select
          value={values.initialFundingType}
          onChange={(e) => {
            const fundingType = e.target.value as BRRRRInitialFundingType;
            onChange(getInitialFundingPreset(fundingType, values.renovationBudget));
          }}
          className="w-full h-10 sm:h-8 bg-bg-base border border-border-default rounded-md text-sm sm:text-xs text-text-foreground px-2.5 outline-none focus:border-accent-blue"
        >
          {INITIAL_FUNDING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <p className="mt-1 text-[10px] text-text-muted">
          Selecting a type applies starter terms below; edit any field to override.
        </p>
      </div>

      {!isCashInitial && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <InputField
              label="Initial LTV / LTC"
              value={values.initialLoanLtvPct}
              onChange={(v) => onChange({ initialLoanLtvPct: v as number })}
              suffix="%"
              min={0}
              max={100}
              step={1}
              tooltip="Loan proceeds as a percent of eligible purchase/rehab costs. Actual lender rules vary."
            />
            <InputField
              label="Rehab Financed"
              value={values.initialRehabFunding}
              onChange={(v) => onChange({ initialRehabFunding: Math.min(v as number, values.renovationBudget) })}
              prefix="$"
              min={0}
              max={values.renovationBudget}
              step={1000}
            />
          </div>

          <div className="text-[10px] text-text-muted -mt-2 mb-3">
            Est. initial loan: {formatCurrency(estimatedInitialLoan)}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <InputField
              label="Initial Rate"
              value={values.initialRate}
              onChange={(v) => onChange({ initialRate: v as number })}
              suffix="%"
              min={0}
              max={25}
              step={0.125}
            />
            <InputField
              label="Points"
              value={values.initialPoints}
              onChange={(v) => onChange({ initialPoints: v as number })}
              min={0}
              max={10}
              step={0.5}
            />
          </div>

          <InputField
            label="Initial Term"
            value={values.initialTermMonths}
            onChange={(v) => onChange({ initialTermMonths: v as number })}
            suffix="mo"
            min={1}
            max={360}
            step={1}
          />

          <label className="mb-3 flex items-center gap-2 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={values.initialInterestOnly}
              onChange={(e) => onChange({ initialInterestOnly: e.target.checked })}
              className="h-4 w-4 rounded border-border-default bg-bg-base"
            />
            Interest-only during buy/rehab phase
          </label>
        </>
      )}

      <InputField
        label="Purchase Closing Costs"
        value={values.purchaseClosingCostsPct}
        onChange={(v) => onChange({ purchaseClosingCostsPct: v as number })}
        suffix="%"
        min={0}
        max={10}
        step={0.25}
      />

      <div className="text-[10px] font-semibold text-accent-blue uppercase tracking-wider mt-4 mb-2">
        Refinance Strategy
      </div>

      <div className="mb-3">
        <label className="text-xs font-medium text-text-muted mb-1 block">Refinance Type</label>
        <select
          value={values.refiStrategy}
          onChange={(e) => {
            const refiStrategy = e.target.value as BRRRRRefiStrategy;
            onChange(getRefiPreset(refiStrategy));
          }}
          className="w-full h-10 sm:h-8 bg-bg-base border border-border-default rounded-md text-sm sm:text-xs text-text-foreground px-2.5 outline-none focus:border-accent-blue"
        >
          {REFI_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <p className="mt-1 text-[10px] text-text-muted">
          Selecting a strategy applies starter refinance terms; edit any field to override.
        </p>
      </div>

      {hasRefi && (
        <>
          <InputField
            label="Refi LTV"
            value={values.refiLTV}
            onChange={(v) => onChange({ refiLTV: v as number })}
            suffix="%"
            min={0}
            max={85}
            step={1}
            tooltip="Modeled refinance LTV on ARV. Exact max LTV depends on loan type and lender."
          />

          <div className="text-[10px] text-text-muted -mt-2 mb-3">
            New loan: {formatCurrency(refiAmount)} ({formatPercent(values.refiLTV)} of ARV)
          </div>

          <InputField
            label="Refi Rate"
            value={values.refiRate}
            onChange={(v) => onChange({ refiRate: v as number })}
            suffix="%"
            min={0}
            max={15}
            step={0.125}
          />

          <div className="mb-3">
            <label className="text-xs font-medium text-text-muted mb-1 block">Refi Term</label>
            <select
              value={values.refiTermYears}
              onChange={(e) => onChange({ refiTermYears: parseInt(e.target.value) as 15 | 20 | 30 })}
              className="w-full h-10 sm:h-8 bg-bg-base border border-border-default rounded-md text-sm sm:text-xs text-text-foreground px-2.5 outline-none focus:border-accent-blue"
            >
              <option value={15}>15 years</option>
              <option value={20}>20 years</option>
              <option value={30}>30 years</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <InputField
              label="Refi Closing Costs"
              value={values.refiClosingCostsPct}
              onChange={(v) => onChange({ refiClosingCostsPct: v as number })}
              suffix="%"
              min={0}
              max={8}
              step={0.25}
            />
            <InputField
              label="Min DSCR"
              value={values.refiDscrMin}
              onChange={(v) => onChange({ refiDscrMin: v as number })}
              min={0}
              max={2}
              step={0.05}
            />
          </div>

          {canCashOut && (
            <label className="mb-3 flex items-center gap-2 text-xs text-text-muted">
              <input
                type="checkbox"
                checked={values.refiCashOut}
                onChange={(e) => onChange({ refiCashOut: e.target.checked })}
                className="h-4 w-4 rounded border-border-default bg-bg-base"
              />
              Model cash-out proceeds after paying off initial funding
            </label>
          )}
        </>
      )}

      <div className="text-[10px] font-semibold text-accent-blue uppercase tracking-wider mt-4 mb-2">
        Rental Operation
      </div>

      <InputField
        label="Monthly Rent"
        value={values.monthlyRent}
        onChange={(v) => onChange({ monthlyRent: v as number })}
        prefix="$"
        min={0}
        step={50}
      />

      <InputField
        label="Vacancy Rate"
        value={values.vacancyRatePct}
        onChange={(v) => onChange({ vacancyRatePct: v as number })}
        suffix="%"
        min={0}
        max={30}
        step={0.5}
      />

      <InputField
        label="Rent Growth"
        value={values.annualRentGrowth}
        onChange={(v) => onChange({ annualRentGrowth: v as number })}
        suffix="%"
        min={-5}
        max={15}
        step={0.5}
      />

      <InputField
        label="Management Fee"
        value={values.managementFeePct}
        onChange={(v) => onChange({ managementFeePct: v as number })}
        suffix="%"
        min={0}
        max={20}
        step={0.5}
      />
    </div>
  );
}
