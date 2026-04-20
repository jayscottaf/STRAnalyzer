'use client';

import { useState, useCallback, useMemo } from 'react';
import type { AIAnalysis, Strategy } from '@/lib/types';
import { useDealInputs } from '@/lib/hooks/use-deal-inputs';
import { useCalculations } from '@/lib/hooks/use-calculations';
import { useAutoSave } from '@/lib/hooks/use-auto-save';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileDrawer from '@/components/layout/mobile-drawer';
import StrategyTabs from '@/components/layout/strategy-tabs';
import MetricsGrid from '@/components/dashboard/metrics-grid';
import CashFlowBreakdown from '@/components/dashboard/cash-flow-breakdown';
import TaxBenefitPanel from '@/components/dashboard/tax-benefit-panel';
import TaxComparator from '@/components/dashboard/tax-comparator';
import SensitivityGrid from '@/components/dashboard/sensitivity-grid';
import ProjectionTable from '@/components/dashboard/projection-table';
import AIAnalysisPanel from '@/components/ai/ai-analysis-panel';
import CashFlowChart from '@/components/dashboard/cash-flow-chart';
import DealScore from '@/components/dashboard/deal-score';
import TornadoChart from '@/components/dashboard/tornado-chart';
import StickyKpiBar from '@/components/dashboard/sticky-kpi-bar';
import OfferSolver from '@/components/dashboard/offer-solver';
import CompareMode from '@/components/dashboard/compare-mode';
import PdfExport from '@/components/dashboard/pdf-export';
import OfflineBanner from '@/components/layout/offline-banner';
import InstallPrompt from '@/components/layout/install-prompt';
import LTRDashboard from '@/components/dashboard/ltr-dashboard';
import FlipDashboard from '@/components/dashboard/flip-dashboard';
import BRRRRDashboard from '@/components/dashboard/brrrr-dashboard';
import WholesaleDashboard from '@/components/dashboard/wholesale-dashboard';
import CompareStrategies from '@/components/dashboard/compare-strategies';
import { calculateTornado } from '@/lib/calculations';
import { calculateLTRMetrics, calculateFlipMetrics, calculateBRRRRMetrics, calculateWholesaleMetrics } from '@/lib/calculations/index';

export default function HomePage() {
  const { inputs, dispatch, errors, hydrated } = useDealInputs();
  const strMetrics = useCalculations(inputs, hydrated);
  useAutoSave(inputs, hydrated);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiCooldown, setAiCooldown] = useState(false);

  const strategy = inputs.activeStrategy;

  // Compute per-strategy metrics
  const ltrMetrics = useMemo(() => hydrated ? calculateLTRMetrics(inputs) : null, [inputs, hydrated]);
  const flipMetrics = useMemo(() => hydrated ? calculateFlipMetrics(inputs) : null, [inputs, hydrated]);
  const brrrrMetrics = useMemo(() => hydrated ? calculateBRRRRMetrics(inputs) : null, [inputs, hydrated]);
  const wholesaleMetrics = useMemo(() => hydrated ? calculateWholesaleMetrics(inputs) : null, [inputs, hydrated]);

  const runAnalysis = useCallback(async () => {
    if (aiLoading || aiCooldown) return;
    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs,
          strategy: activeTab === 'compare' ? inputs.activeStrategy : activeTab,
          metrics: strMetrics,
        }),
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
  }, [inputs, strMetrics, aiLoading, aiCooldown]);

  const handleStrategyChange = useCallback((s: Strategy | 'compare') => {
    if (s === 'compare') {
      dispatch({ type: 'SET_STRATEGY', payload: 'str' });
      setActiveTab('compare');
    } else {
      dispatch({ type: 'SET_STRATEGY', payload: s });
      setActiveTab(s);
    }
  }, [dispatch]);

  const [activeTab, setActiveTab] = useState<Strategy | 'compare'>('str');

  // Sync activeTab when strategy changes from sidebar selector
  // eslint-disable-next-line react-hooks/exhaustive-deps
  if (hydrated && activeTab !== 'compare' && activeTab !== inputs.activeStrategy) {
    setActiveTab(inputs.activeStrategy);
  }

  const tornadoData = useMemo(() => {
    if (!hydrated) return null;
    if (activeTab === 'compare' || activeTab === 'wholesale') return null;
    return calculateTornado(inputs);
  }, [inputs, hydrated, activeTab]);

  if (!hydrated || !strMetrics) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base">
        <div className="text-sm text-text-muted">Loading analyzer...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <OfflineBanner />
      <Header
        inputs={inputs}
        dispatch={dispatch}
        onAnalyze={runAnalysis}
        analyzing={aiLoading}
      />

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden lg:block w-80 shrink-0 bg-bg-surface border-r border-border-default overflow-y-auto">
          <Sidebar inputs={inputs} dispatch={dispatch} />
        </aside>

        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          inputs={inputs}
          dispatch={dispatch}
        />

        <main className="flex-1 overflow-y-auto relative">
          {/* Strategy tabs */}
          <StrategyTabs active={activeTab} onChange={handleStrategyChange} />

          {activeTab === 'str' && (
            <StickyKpiBar metrics={strMetrics} observeTargetId="main-kpi-grid" />
          )}

          <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 pb-24 lg:pb-6">
            {errors.length > 0 && (
              <div className="px-3 py-2 rounded-lg bg-accent-amber-bg border border-accent-amber/20 text-xs text-accent-amber">
                <span className="font-semibold">Warnings:</span>{' '}
                {errors.map((e) => e.message).join(' · ')}
              </div>
            )}

            {/* Compare tab */}
            {activeTab === 'compare' && (
              <CompareStrategies
                inputs={inputs}
                onOpenStrategy={(s) => handleStrategyChange(s)}
              />
            )}

            {/* STR Dashboard */}
            {activeTab === 'str' && (
              <>
                <div className="flex flex-wrap gap-2">
                  <OfferSolver inputs={inputs} dispatch={dispatch} />
                  <CompareMode />
                  <PdfExport inputs={inputs} metrics={strMetrics} aiAnalysis={aiAnalysis} />
                </div>

                <DealScore metrics={strMetrics} />

                <div id="main-kpi-grid">
                  <MetricsGrid metrics={strMetrics} />
                </div>

                <CashFlowBreakdown metrics={strMetrics} />

                {inputs.tax.enabled && <TaxBenefitPanel metrics={strMetrics} />}
                {inputs.tax.enabled && <TaxComparator inputs={inputs} />}

                {strMetrics.projection.length > 0 && (
                  <CashFlowChart projection={strMetrics.projection} taxEnabled={inputs.tax.enabled} />
                )}

                <SensitivityGrid
                  grid={strMetrics.sensitivityGrid}
                  baseOccupancy={inputs.revenue.occupancyRate}
                  baseAdr={inputs.revenue.adr}
                />

                {tornadoData && <TornadoChart items={tornadoData} baseline={strMetrics.cocReturn} />}

                <ProjectionTable
                  metrics={strMetrics}
                  appreciationRate={inputs.appreciationRate}
                  taxEnabled={inputs.tax.enabled}
                  dispatch={dispatch}
                />
              </>
            )}

            {/* LTR Dashboard */}
            {activeTab === 'ltr' && ltrMetrics && (
              <>
                <div className="flex flex-wrap gap-2">
                  <OfferSolver inputs={inputs} dispatch={dispatch} strategy="ltr" />
                </div>
                <DealScore metrics={ltrMetrics} strategy="ltr" />
                <LTRDashboard metrics={ltrMetrics} />

                {ltrMetrics.projection.length > 0 && (
                  <CashFlowChart projection={ltrMetrics.projection} taxEnabled={inputs.tax.enabled} />
                )}

                {inputs.tax.enabled && ltrMetrics.taxBenefits && (
                  <div className="rounded-lg border border-border-default bg-bg-surface p-4">
                    <h3 className="text-sm font-semibold mb-3">Tax Benefits (Year 1)</h3>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-text-muted">Depreciation</span><span>${Math.round(ltrMetrics.taxBenefits.depreciation.total).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-text-muted">Mortgage Interest</span><span>${Math.round(ltrMetrics.taxBenefits.mortgageInterest).toLocaleString()}</span></div>
                      <div className="flex justify-between font-semibold"><span>Taxable Income</span><span className={ltrMetrics.taxBenefits.taxableIncome < 0 ? 'text-accent-green' : 'text-accent-red'}>${Math.round(ltrMetrics.taxBenefits.taxableIncome).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-text-muted">Tax Savings</span><span className="text-accent-green">${Math.round(ltrMetrics.taxBenefits.taxSavings).toLocaleString()}</span></div>
                    </div>
                  </div>
                )}

                {inputs.tax.enabled && <TaxComparator inputs={inputs} />}

                {tornadoData && <TornadoChart items={tornadoData} baseline={ltrMetrics.cocReturn} />}
              </>
            )}

            {/* Flip Dashboard */}
            {activeTab === 'flip' && flipMetrics && (
              <>
                <DealScore metrics={flipMetrics} strategy="flip" />
                <FlipDashboard metrics={flipMetrics} />
                {tornadoData && <TornadoChart items={tornadoData} baseline={flipMetrics.roi} />}
              </>
            )}

            {/* BRRRR Dashboard */}
            {activeTab === 'brrrr' && brrrrMetrics && (
              <>
                <DealScore metrics={brrrrMetrics} strategy="brrrr" />
                <BRRRRDashboard metrics={brrrrMetrics} />

                {brrrrMetrics.projection.length > 0 && (
                  <CashFlowChart projection={brrrrMetrics.projection} taxEnabled={inputs.tax.enabled} />
                )}

                {inputs.tax.enabled && <TaxComparator inputs={inputs} />}

                {tornadoData && <TornadoChart items={tornadoData} baseline={brrrrMetrics.isInfiniteReturn ? 100 : brrrrMetrics.postRefiCocReturn} />}
              </>
            )}

            {/* Wholesale Dashboard */}
            {activeTab === 'wholesale' && wholesaleMetrics && (
              <>
                <DealScore metrics={wholesaleMetrics} strategy="wholesale" />
                <WholesaleDashboard metrics={wholesaleMetrics} />
              </>
            )}

            {/* AI Analysis — available on all strategy tabs */}
            {activeTab !== 'compare' && (
              <AIAnalysisPanel
                analysis={aiAnalysis}
                loading={aiLoading}
                error={aiError}
                onAnalyze={runAnalysis}
                cooldown={aiCooldown}
              />
            )}
          </div>
        </main>
      </div>

      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 h-14 px-5 rounded-full bg-accent-blue text-white text-sm font-medium shadow-lg hover:bg-accent-blue/90 transition-colors z-30 flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit Inputs
      </button>

      <InstallPrompt />
    </div>
  );
}
