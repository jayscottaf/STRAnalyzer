'use client';

import type { DealInputs, DealAction } from '@/lib/types';
import Sidebar from './sidebar';

interface Props {
  open: boolean;
  onClose: () => void;
  inputs: DealInputs;
  dispatch: React.Dispatch<DealAction>;
}

export default function MobileDrawer({ open, onClose, inputs, dispatch }: Props) {
  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-bg-surface border-r border-border-default z-50 transform transition-transform duration-300 lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
          <span className="text-sm font-semibold text-text-foreground">Edit Inputs</span>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-bg-hover text-text-muted"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="h-[calc(100%-49px)] overflow-y-auto">
          <Sidebar inputs={inputs} dispatch={dispatch} />
        </div>
      </div>
    </>
  );
}
