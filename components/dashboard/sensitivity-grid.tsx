'use client';

import type { SensitivityCell } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

interface Props {
  grid: SensitivityCell[][];
  baseOccupancy: number;
  baseAdr: number;
}

const colorMap = {
  green: 'bg-accent-green-bg text-accent-green',
  amber: 'bg-accent-amber-bg text-accent-amber',
  red: 'bg-accent-red-bg text-accent-red',
};

export default function SensitivityGrid({ grid, baseOccupancy, baseAdr }: Props) {
  if (grid.length === 0) return null;

  const adrSteps = [-15, -10, -5, 0, 5, 10, 15];

  return (
    <div className="rounded-lg border border-border-default bg-bg-surface p-4">
      <h3 className="text-sm font-semibold text-text-foreground mb-1">Sensitivity Analysis</h3>
      <p className="text-[10px] text-text-muted mb-3">Monthly cash flow by occupancy and ADR</p>

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
