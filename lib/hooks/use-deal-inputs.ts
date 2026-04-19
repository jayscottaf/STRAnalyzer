'use client';

import { useReducer, useEffect, useState } from 'react';
import type { DealInputs, DealAction, ValidationError } from '../types';
import { DEFAULT_INPUTS } from '../constants';
import { loadCurrentInputs } from '../storage';
import { validateInputs } from '../validation';

function dealReducer(state: DealInputs, action: DealAction): DealInputs {
  switch (action.type) {
    case 'UPDATE_PROPERTY':
      return { ...state, property: { ...state.property, ...action.payload } };
    case 'UPDATE_FINANCING':
      return { ...state, financing: { ...state.financing, ...action.payload } };
    case 'UPDATE_REVENUE':
      return { ...state, revenue: { ...state.revenue, ...action.payload } };
    case 'UPDATE_SEASONALITY':
      return { ...state, revenue: { ...state.revenue, seasonalityMultipliers: action.payload } };
    case 'UPDATE_EXPENSES':
      return { ...state, expenses: { ...state.expenses, ...action.payload } };
    case 'UPDATE_TAX':
      return { ...state, tax: { ...state.tax, ...action.payload } };
    case 'UPDATE_APPRECIATION':
      return { ...state, appreciationRate: action.payload };
    case 'UPDATE_NOTES':
      return { ...state, notes: action.payload };
    case 'UPDATE_LTR':
      return { ...state, ltr: { ...state.ltr, ...action.payload } };
    case 'UPDATE_FLIP':
      return { ...state, flip: { ...state.flip, ...action.payload } };
    case 'UPDATE_BRRRR':
      return { ...state, brrrr: { ...state.brrrr, ...action.payload } };
    case 'UPDATE_WHOLESALE':
      return { ...state, wholesale: { ...state.wholesale, ...action.payload } };
    case 'SET_STRATEGY':
      return { ...state, activeStrategy: action.payload };
    case 'LOAD_ANALYSIS':
      return action.payload;
    case 'RESET_TO_DEFAULTS':
      return DEFAULT_INPUTS;
    default:
      return state;
  }
}

export function useDealInputs() {
  const [hydrated, setHydrated] = useState(false);
  const [inputs, dispatch] = useReducer(dealReducer, DEFAULT_INPUTS);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadCurrentInputs();
    dispatch({ type: 'LOAD_ANALYSIS', payload: saved });
    setHydrated(true);
  }, []);

  // Validate on every change
  useEffect(() => {
    setErrors(validateInputs(inputs));
  }, [inputs]);

  return { inputs, dispatch, errors, hydrated };
}
