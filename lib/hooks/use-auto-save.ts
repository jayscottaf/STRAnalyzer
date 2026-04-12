'use client';

import { useEffect, useRef } from 'react';
import type { DealInputs } from '../types';
import { saveCurrentInputs } from '../storage';

export function useAutoSave(inputs: DealInputs, hydrated: boolean): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hydrated) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveCurrentInputs(inputs);
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inputs, hydrated]);
}
