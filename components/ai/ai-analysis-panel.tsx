'use client';

import type { AIAnalysis } from '@/lib/types';
import AILoadingSkeleton from './ai-loading-skeleton';

interface Props {
  analysis: AIAnalysis | null;
  loading: boolean;
  error: string | null;
  onAnalyze: () => void;
  cooldown: boolean;
  isStale?: boolean;
}

const verdictColors: Record<string, string> = {
  'STRONG BUY': 'bg-accent-green text-white',
  'BUY': 'bg-accent-green/70 text-white',
  'MARGINAL': 'bg-accent-amber text-black',
  'PASS': 'bg-accent-red text-white',
};

export default function AIAnalysisPanel({ analysis, loading, error, onAnalyze, cooldown, isStale }: Props) {
  return (
    <div className="rounded-lg border border-border-default bg-bg-surface p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-text-foreground">AI Deal Analysis</h3>
        <div className="flex items-center gap-2">
          {isStale && !loading && (
            <span className="text-[10px] text-accent-amber font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Inputs changed — rerun to update
            </span>
          )}
          <button
            type="button"
            onClick={onAnalyze}
            disabled={loading || cooldown}
            className={`h-7 px-3 text-[11px] font-medium rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
              isStale
                ? 'bg-accent-amber hover:bg-accent-amber/90 ring-2 ring-accent-amber/40 animate-pulse'
                : 'bg-accent-blue hover:bg-accent-blue/90'
            }`}
          >
            {loading ? 'Analyzing...' : cooldown ? 'Wait...' : isStale ? 'Rerun Analysis' : 'Run AI Analysis'}
          </button>
        </div>
      </div>

      {error && (
        <div className="px-3 py-2 rounded bg-accent-red-bg text-xs text-accent-red mb-3">
          {error}
        </div>
      )}

      {loading && <AILoadingSkeleton />}

      {!loading && !analysis && !error && (
        <div className="py-8 text-center text-xs text-text-muted">
          Click &quot;Run AI Analysis&quot; to get an AI-powered deal verdict with market assessment, revenue validation, and actionable recommendations.
        </div>
      )}

      {!loading && analysis && (
        <div className="space-y-4">
          {/* Verdict */}
          <div className="flex items-start gap-3">
            <span className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap ${verdictColors[analysis.verdict] ?? 'bg-bg-elevated text-text-foreground'}`}>
              {analysis.verdict}
            </span>
            <p className="text-xs text-text-foreground leading-relaxed">
              {analysis.verdict_reasoning}
            </p>
          </div>

          {/* Analysis Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnalysisCard title="Market Assessment" content={analysis.market_assessment} />
            <AnalysisCard title="Revenue Validation" content={analysis.revenue_validation} />
            <AnalysisCard title="Deal Quality" content={analysis.deal_quality} />
            {analysis.tax_strategy && (
              <AnalysisCard title="Tax Strategy" content={analysis.tax_strategy} />
            )}
          </div>

          {/* Green Flags */}
          {analysis.green_flags.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-accent-green uppercase tracking-wider mb-1.5">
                Green Flags
              </div>
              <div className="space-y-1">
                {analysis.green_flags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-text-foreground">
                    <span className="text-accent-green mt-0.5 shrink-0">&#10003;</span>
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Red Flags */}
          {analysis.red_flags.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-accent-red uppercase tracking-wider mb-1.5">
                Red Flags
              </div>
              <div className="space-y-1">
                {analysis.red_flags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-text-foreground">
                    <span className="text-accent-red mt-0.5 shrink-0">&#9888;</span>
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          {analysis.recommended_actions.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                Recommended Actions
              </div>
              <ol className="space-y-1 list-decimal list-inside">
                {analysis.recommended_actions.map((action, i) => (
                  <li key={i} className="text-xs text-text-foreground">
                    {action}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-[9px] text-text-muted border-t border-border-default pt-3 mt-3">
            AI analysis is for informational purposes only. It does not constitute financial, tax, or legal advice. Always consult qualified professionals before making investment decisions.
          </p>
        </div>
      )}
    </div>
  );
}

function AnalysisCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-lg border border-border-default bg-bg-elevated p-3">
      <div className="text-[10px] font-semibold text-accent-blue uppercase tracking-wider mb-1.5">
        {title}
      </div>
      <p className="text-xs text-text-foreground leading-relaxed">{content}</p>
    </div>
  );
}
