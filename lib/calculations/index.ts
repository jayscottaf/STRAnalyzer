import type { DealInputs, StrategyMetrics } from '../types';
import { calculateAllMetrics } from '../calculations';
import { calculateLTRMetrics } from './ltr';
import { calculateFlipMetrics } from './flip';
import { calculateBRRRRMetrics } from './brrrr';
import { calculateWholesaleMetrics } from './wholesale';

export { calculateLTRMetrics } from './ltr';
export { calculateFlipMetrics } from './flip';
export { calculateBRRRRMetrics } from './brrrr';
export { calculateWholesaleMetrics } from './wholesale';

export function calculateStrategyMetrics(inputs: DealInputs): StrategyMetrics {
  switch (inputs.activeStrategy) {
    case 'str':
      return { kind: 'str', data: calculateAllMetrics(inputs) };
    case 'ltr':
      return { kind: 'ltr', data: calculateLTRMetrics(inputs) };
    case 'flip':
      return { kind: 'flip', data: calculateFlipMetrics(inputs) };
    case 'brrrr':
      return { kind: 'brrrr', data: calculateBRRRRMetrics(inputs) };
    case 'wholesale':
      return { kind: 'wholesale', data: calculateWholesaleMetrics(inputs) };
  }
}

export function calculateAllStrategies(inputs: DealInputs) {
  return {
    str: calculateAllMetrics({ ...inputs, activeStrategy: 'str' }),
    ltr: calculateLTRMetrics({ ...inputs, activeStrategy: 'ltr' }),
    flip: calculateFlipMetrics({ ...inputs, activeStrategy: 'flip' }),
    brrrr: calculateBRRRRMetrics({ ...inputs, activeStrategy: 'brrrr' }),
    wholesale: calculateWholesaleMetrics({ ...inputs, activeStrategy: 'wholesale' }),
  };
}
