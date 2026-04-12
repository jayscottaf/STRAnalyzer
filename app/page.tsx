'use client';

import { useState, useCallback } from 'react';
import type { AIAnalysis } from '@/lib/types';
import { useDealInputs } from '@/lib/hooks/use-deal-inputs';
import { useCalculations } from '@/lib/hooks/use-calculations';
import { useAutoSave } from '@/lib/hooks/use-auto-save';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileDrawer from '@/components/layout/mobile-drawer';
import MetricsGrid from '@/components/dashboard/metrics-grid';
import CashFlowBreakdown from '@/components/dashboard/cash-flow-breakdown';
import TaxBenefitPanel from '@/components/dashboard/tax-benefit-panel';
import SensitivityGrid from '@/components/dashboard/sensitivity-grid';
import ProjectionTable from '@/components/dashboard/projection-table';
import AIAnalysisPanel from '@/components/ai/ai-analysis-panel';

export default function HomePage() {
  const { inputs, dispatch, errors, hydrated } = useDealInputs();
  const metrics = useCalculations(inputs, hydrated);
  useAutoSave(inputs, hydrated);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiCooldown, setAiCooldown] = useState(false);

  const runAnalysis = useCallback(async () => {
    if (!metrics || aiLoading || aiCooldown) return;

    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs, metrics }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const analysis: AIAnalysis = await res.json();
      setAiAnalysis(analysis);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setAiError(message);
    } finally {
      setAiLoading(false);
      setAiCooldown(true);
      setTimeout(() => setAiCooldown(false), 5000);
    }
  }, [inputs, metrics, aiLoading, aiCooldown]);

  // Loading state
  if (!hydrated || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base">
        <div className="text-sm text-text-muted">Loading analyzer...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header
        inputs={inputs}
        dispatch={dispatch}
        onAnalyze={runAnalysis}
        analyzing={aiLoading}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-80 shrink-0 bg-bg-surface border-r border-border-default overflow-y-auto">
          <Sidebar inputs={inputs} dispatch={dispatch} />
        </aside>

        {/* Mobile Drawer */}
        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          inputs={inputs}
          dispatch={dispatch}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6 pb-24 lg:pb-6">
          {/* Validation warnings */}
          {errors.length > 0 && (
            <div className="px-3 py-2 rounded-lg bg-accent-amber-bg border border-accent-amber/20 text-xs text-accent-amber">
              <span className="font-semibold">Warnings:</span>{' '}
              {errors.map((e) => e.message).join(' · ')}
            </div>
          )}

          {/* KPI Grid */}
          <MetricsGrid metrics={metrics} />

          {/* Cash Flow Breakdown */}
          <CashFlowBreakdown metrics={metrics} />

          {/* Tax Benefits */}
          {inputs.tax.enabled && <TaxBenefitPanel metrics={metrics} />}

          {/* Sensitivity Grid */}
          <SensitivityGrid
            grid={metrics.sensitivityGrid}
            baseOccupancy={inputs.revenue.occupancyRate}
            baseAdr={inputs.revenue.adr}
          />

          {/* 5-Year Projection */}
          <ProjectionTable
            metrics={metrics}
            appreciationRate={inputs.appreciationRate}
            taxEnabled={inputs.tax.enabled}
            dispatch={dispatch}
          />

          {/* AI Analysis */}
          <AIAnalysisPanel
            analysis={aiAnalysis}
            loading={aiLoading}
            error={aiError}
            onAnalyze={runAnalysis}
            cooldown={aiCooldown}
          />
        </main>
      </div>

      {/* Mobile floating button */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 h-12 px-4 rounded-full bg-accent-blue text-white text-sm font-medium shadow-lg hover:bg-accent-blue/90 transition-colors z-30 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit Inputs
      </button>
    </div>
  );
}
