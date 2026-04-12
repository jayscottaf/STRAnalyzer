import type { DealInputs, SavedAnalysis } from './types';
import { DEFAULT_INPUTS } from './constants';

const CURRENT_KEY = 'str-analyzer-current';
const SAVED_KEY = 'str-analyzer-saved';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge(defaults: any, overrides: any): any {
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) return overrides ?? defaults;
  if (!defaults || typeof defaults !== 'object' || Array.isArray(defaults)) return overrides;
  const result = { ...defaults };
  for (const key of Object.keys(defaults)) {
    if (overrides[key] === undefined) continue;
    if (
      defaults[key] &&
      typeof defaults[key] === 'object' &&
      !Array.isArray(defaults[key]) &&
      overrides[key] &&
      typeof overrides[key] === 'object' &&
      !Array.isArray(overrides[key])
    ) {
      result[key] = deepMerge(defaults[key], overrides[key]);
    } else {
      result[key] = overrides[key];
    }
  }
  return result;
}

export function loadCurrentInputs(): DealInputs {
  if (typeof window === 'undefined') return DEFAULT_INPUTS;
  try {
    const raw = localStorage.getItem(CURRENT_KEY);
    if (!raw) return DEFAULT_INPUTS;
    const parsed = JSON.parse(raw) as Partial<DealInputs>;
    return deepMerge(DEFAULT_INPUTS, parsed);
  } catch {
    return DEFAULT_INPUTS;
  }
}

export function saveCurrentInputs(inputs: DealInputs): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CURRENT_KEY, JSON.stringify(inputs));
  } catch {
    // Storage full or unavailable
  }
}

export function loadSavedAnalyses(): SavedAnalysis[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedAnalysis[];
  } catch {
    return [];
  }
}

export function saveAnalysis(name: string, inputs: DealInputs): SavedAnalysis {
  const analyses = loadSavedAnalyses();
  const entry: SavedAnalysis = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    timestamp: Date.now(),
    inputs,
  };
  analyses.unshift(entry);
  if (typeof window !== 'undefined') {
    localStorage.setItem(SAVED_KEY, JSON.stringify(analyses));
  }
  return entry;
}

export function deleteAnalysis(id: string): void {
  const analyses = loadSavedAnalyses().filter((a) => a.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(SAVED_KEY, JSON.stringify(analyses));
  }
}
