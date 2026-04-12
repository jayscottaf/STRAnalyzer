'use client';

import { useMemo } from 'react';
import type { DealInputs, DealMetrics } from '../types';
import { calculateAllMetrics } from '../calculations';

export function useCalculations(inputs: DealInputs, hydrated: boolean): DealMetrics | null {
  const metrics = useMemo(() => {
    if (!hydrated) return null;
    return calculateAllMetrics(inputs);
  }, [inputs, hydrated]);

  return metrics;
}
