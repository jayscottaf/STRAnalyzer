'use client';

import { useRef, useCallback, useEffect } from 'react';
import type { DealInputs, DealAction } from '@/lib/types';
import Sidebar from './sidebar';

interface Props {
  open: boolean;
  onClose: () => void;
  inputs: DealInputs;
  dispatch: React.Dispatch<DealAction>;
}

export default function MobileDrawer({ open, onClose, inputs, dispatch }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startY: 0, isDragging: false });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.drag-handle')) {
      dragRef.current = { startY: e.touches[0].clientY, isDragging: true };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current.isDragging || !sheetRef.current) return;
    const dy = e.touches[0].clientY - dragRef.current.startY;
    if (dy > 0) {
      sheetRef.current.style.transform = `translateY(${dy}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current.isDragging || !sheetRef.current) return;
    const dy = e.changedTouches[0].clientY - dragRef.current.startY;
    sheetRef.current.style.transform = '';
    dragRef.current.isDragging = false;
    if (dy > 120) {
      onClose();
    }
  }, [onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 bg-bg-surface rounded-t-2xl z-50 transform transition-transform duration-300 ease-out lg:hidden ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '90vh' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="drag-handle flex justify-center py-3 cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1 rounded-full bg-border-light" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2 border-b border-border-default">
          <span className="text-sm font-semibold text-text-foreground">Edit Inputs</span>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-bg-hover text-text-muted"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          <Sidebar inputs={inputs} dispatch={dispatch} />
        </div>
      </div>
    </>
  );
}
