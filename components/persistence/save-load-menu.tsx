'use client';

import { useState, useRef, useEffect } from 'react';
import type { DealInputs, DealAction, SavedAnalysis } from '@/lib/types';
import { DEFAULT_INPUTS } from '@/lib/constants';
import { loadSavedAnalyses, saveAnalysis, deleteAnalysis } from '@/lib/storage';
import { hapticSuccess } from '@/lib/haptics';

interface Props {
  inputs: DealInputs;
  dispatch: React.Dispatch<DealAction>;
}

export default function SaveLoadMenu({ inputs, dispatch }: Props) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<SavedAnalysis[]>([]);
  const [saveName, setSaveName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSaved(loadSavedAnalyses());
    }
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSave() {
    if (!saveName.trim()) return;
    saveAnalysis(saveName.trim(), inputs);
    setSaveName('');
    setSaved(loadSavedAnalyses());
    hapticSuccess();
  }

  function handleLoad(analysis: SavedAnalysis) {
    dispatch({ type: 'LOAD_ANALYSIS', payload: analysis.inputs });
    setOpen(false);
  }

  function handleDelete(id: string) {
    deleteAnalysis(id);
    setSaved(loadSavedAnalyses());
  }

  function handleReset() {
    dispatch({ type: 'LOAD_ANALYSIS', payload: DEFAULT_INPUTS });
    setOpen(false);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium rounded-md border border-border-default text-text-muted hover:text-text-foreground hover:border-border-light transition-colors"
      >
        Save / Load
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-bg-elevated border border-border-light rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Save */}
          <div className="p-3 border-b border-border-default">
            <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
              Save Current Analysis
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Analysis name..."
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="flex-1 h-7 bg-bg-base border border-border-default rounded text-xs text-text-foreground px-2 outline-none focus:border-accent-blue"
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={!saveName.trim()}
                className="h-7 px-3 text-[11px] font-medium rounded bg-accent-blue text-white disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>

          {/* Saved list */}
          <div className="max-h-48 overflow-y-auto">
            {saved.length === 0 ? (
              <div className="p-3 text-xs text-text-muted text-center">No saved analyses</div>
            ) : (
              saved.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-3 py-2 hover:bg-bg-hover border-b border-border-default last:border-0"
                >
                  <button
                    type="button"
                    onClick={() => handleLoad(s)}
                    className="text-left flex-1 min-w-0"
                  >
                    <div className="text-xs text-text-foreground truncate">{s.name}</div>
                    <div className="text-[10px] text-text-muted flex items-center gap-1.5">
                      {new Date(s.timestamp).toLocaleDateString()}
                      {s.inputs.activeStrategy && (
                        <span className="px-1 py-0.5 rounded bg-accent-blue/20 text-accent-blue text-[8px] uppercase font-bold">
                          {s.inputs.activeStrategy}
                        </span>
                      )}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id)}
                    className="ml-2 text-text-muted hover:text-accent-red text-xs shrink-0"
                  >
                    &#10005;
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Reset */}
          <div className="p-2 border-t border-border-default">
            <button
              type="button"
              onClick={handleReset}
              className="w-full h-7 text-[11px] text-text-muted hover:text-accent-red rounded hover:bg-bg-hover transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
