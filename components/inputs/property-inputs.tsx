'use client';

import type { PropertyInputs as PropertyInputsType, DealAction } from '@/lib/types';
import { PROPERTY_TYPES } from '@/lib/constants';
import InputField from './input-field';
import ListingExtractor from './listing-extractor';

interface Props {
  values: PropertyInputsType;
  onChange: (updates: Partial<PropertyInputsType>) => void;
  dispatch?: React.Dispatch<DealAction>;
}

export default function PropertyInputs({ values, onChange, dispatch }: Props) {
  return (
    <div>
      <ListingExtractor onApply={onChange} dispatch={dispatch} />

      <InputField
        label="Property Address"
        type="text"
        value={values.market}
        onChange={(v) => onChange({ market: v as string })}
        placeholder="e.g. 79 W High St, Ballston Spa, NY 12020"
      />

      <div className="mb-3">
        <label className="text-xs font-medium text-text-muted mb-1 block">Property Type</label>
        <select
          value={values.propertyType}
          onChange={(e) => onChange({ propertyType: e.target.value })}
          className="w-full h-10 sm:h-8 bg-bg-base border border-border-default rounded-md text-sm sm:text-xs text-text-foreground px-2.5 outline-none focus:border-accent-blue"
        >
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <InputField
          label="Bedrooms"
          value={values.bedrooms}
          onChange={(v) => onChange({ bedrooms: v as number })}
          min={1}
          max={20}
          step={1}
        />
        <InputField
          label="Bathrooms"
          value={values.bathrooms}
          onChange={(v) => onChange({ bathrooms: v as number })}
          min={1}
          max={20}
          step={0.5}
        />
      </div>

      <InputField
        label="Purchase Price"
        value={values.purchasePrice}
        onChange={(v) => onChange({ purchasePrice: v as number })}
        prefix="$"
        min={0}
        step={5000}
      />

      <div className="grid grid-cols-2 gap-2">
        <InputField
          label="Sq Ft"
          value={values.sqft}
          onChange={(v) => onChange({ sqft: v as number })}
          min={0}
        />
        <InputField
          label="Year Built"
          value={values.yearBuilt}
          onChange={(v) => onChange({ yearBuilt: v as number })}
          min={1800}
          max={2030}
        />
      </div>

      <InputField
        label="Land Value %"
        value={values.landValuePct}
        onChange={(v) => onChange({ landValuePct: v as number })}
        suffix="%"
        min={0}
        max={50}
        step={1}
        tooltip="Percentage attributed to land, not depreciable. IRS typically accepts 15-25%."
      />
    </div>
  );
}
