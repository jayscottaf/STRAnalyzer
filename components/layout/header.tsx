'use client';

import SaveLoadMenu from '../persistence/save-load-menu';
import type { DealInputs, DealAction } from '@/lib/types';

interface Props {
  inputs: DealInputs;
  dispatch: React.Dispatch<DealAction>;
  onAnalyze: () => void;
  analyzing: boolean;
}

export default function Header({ inputs, dispatch, onAnalyze, analyzing }: Props) {
  return (
    <header className="h-14 sm:h-12 bg-bg-surface border-b border-border-default flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-accent-blue flex items-center justify-center">
            <span className="text-white text-xs font-bold">S</span>
          </div>
          <h1 className="text-sm font-bold text-text-foreground">
            <span className="hidden sm:inline">STR Deal Analyzer</span>
            <span className="sm:hidden">STR Analyzer</span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <SaveLoadMenu inputs={inputs} dispatch={dispatch} />

        <button
          type="button"
          onClick={onAnalyze}
          disabled={analyzing}
          className="hidden sm:flex h-8 px-4 text-xs font-medium rounded-md bg-accent-blue text-white hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
        </button>
      </div>
    </header>
  );
}
