'use client';

import { useState } from 'react';
import type { SensitivityCell } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Cell,
} from 'recharts';

interface Props {
  grid: SensitivityCell[][];
  baseOccupancy: number;
  baseAdr: number;
}

type ViewMode = 'table' | 'heatmap';

const colorMap = {
  green: 'bg-accent-green-bg text-accent-green',
  amber: 'bg-accent-amber-bg text-accent-amber',
  red: 'bg-accent-red-bg text-accent-red',
};

const dotColors = {
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
};

export default function SensitivityGrid({ grid, baseOccupancy, baseAdr }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  if (grid.length === 0) return null;

  const adrSteps = [-15, -10, -5, 0, 5, 10, 15];

  // Flatten grid for scatter chart
  const scatterData = grid.flatMap((row) =>
    row.map((cell) => ({
      occ: cell.occupancy,
      adr: Math.round(cell.adr),
      cf: cell.monthlyCashFlow,
      coc: cell.cocReturn,
      dscr: cell.dscr,
      color: cell.color,
      isBase: cell.isBaseCase,
    })),
  );

  return (
    <div className="rounded-lg border border-border-default bg-bg-surface p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-text-foreground">Sensitivity Analysis</h3>
        <button
          type="button"
          onClick={() => setViewMode(viewMode === 'table' ? 'heatmap' : 'table')}
          className="text-[10px] text-text-muted hover:text-text-foreground flex items-center gap-1 transition-colors"
        >
          {viewMode === 'table' ? (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Chart view
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Table view
            </>
          )}
        </button>
      </div>
      <p className="text-[10px] text-text-muted mb-3">Monthly cash flow by occupancy and ADR</p>

      {viewMode === 'table' ? (
        <>
          <div className="relative">
            <div className="overflow-x-auto -mx-4 px-4 scroll-smooth">
              <table className="w-full text-[10px] border-collapse min-w-[600px]">
                <thead>
                  <tr>
                    <th className="p-1.5 text-text-muted font-medium text-left">Occ \ ADR</th>
                    {adrSteps.map((step, j) => (
                      <th key={step} className="p-1.5 text-text-muted font-medium text-center">
                        {formatCurrency(grid[0]?.[j]?.adr ?? baseAdr * (1 + step / 100), 0)}
                        {step === 0 && <span className="block text-accent-blue">(base)</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grid.map((row, i) => (
                    <tr key={i}>
                      <td className="p-1.5 text-text-muted font-medium">
                        {row[0]?.occupancy.toFixed(0)}%
                        {row[0]?.occupancy === baseOccupancy && (
                          <span className="text-accent-blue ml-1">(base)</span>
                        )}
                      </td>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className={`p-1.5 text-center font-medium ${colorMap[cell.color]} ${
                            cell.isBaseCase ? 'ring-2 ring-accent-blue ring-inset rounded' : ''
                          }`}
                        >
                          {formatCurrency(cell.monthlyCashFlow)}
                          {cell.dscr >= 1.2 && <span className="ml-0.5">&#10003;</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-6 pointer-events-none bg-gradient-to-l from-bg-surface to-transparent lg:hidden" />
          </div>
        </>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
              <XAxis
                dataKey="adr"
                name="ADR"
                type="number"
                tick={{ fontSize: 10, fill: '#71717a' }}
                label={{ value: 'Nightly Rate ($)', position: 'bottom', fontSize: 10, fill: '#71717a', offset: 5 }}
              />
              <YAxis
                dataKey="occ"
                name="Occupancy"
                type="number"
                unit="%"
                tick={{ fontSize: 10, fill: '#71717a' }}
                label={{ value: 'Occupancy %', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#71717a' }}
              />
              <ZAxis
                dataKey="cf"
                range={[80, 400]}
                name="Cash Flow"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1d27',
                  border: '1px solid #2e3240',
                  borderRadius: 8,
                  fontSize: 11,
                }}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Scatter data={scatterData}>
                {scatterData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={dotColors[entry.color]}
                    fillOpacity={entry.isBase ? 1 : 0.7}
                    stroke={entry.isBase ? '#3b82f6' : 'none'}
                    strokeWidth={entry.isBase ? 3 : 0}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-text-muted">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-accent-green-bg border border-accent-green/30" /> CoC &ge; 10%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-accent-amber-bg border border-accent-amber/30" /> CoC 5-10%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-accent-red-bg border border-accent-red/30" /> CoC &lt; 5%
        </span>
        <span>&#10003; = DSCR &ge; 1.20</span>
      </div>
    </div>
  );
}
