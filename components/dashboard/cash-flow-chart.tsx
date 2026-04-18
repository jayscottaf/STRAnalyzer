'use client';

import type { ProjectionYear } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface Props {
  projection: ProjectionYear[];
  taxEnabled: boolean;
}

export default function CashFlowChart({ projection, taxEnabled }: Props) {
  const data = projection.map((p) => ({
    year: `Year ${p.year}`,
    cashFlow: Math.round(p.netCashFlow),
    afterTax: p.afterTaxCashFlow ? Math.round(p.afterTaxCashFlow) : undefined,
    cumulative: Math.round(p.cumulativeCashFlow),
    equity: Math.round(p.equity),
  }));

  return (
    <div className="rounded-lg border border-border-default bg-bg-surface p-4">
      <h3 className="text-sm font-semibold text-text-foreground mb-1">Cash Flow & Equity Growth</h3>
      <p className="text-[10px] text-text-muted mb-4">5-year projection with cumulative returns</p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e3240" />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#71717a' }} />
            <YAxis
              tick={{ fontSize: 10, fill: '#71717a' }}
              tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1d27',
                border: '1px solid #2e3240',
                borderRadius: 8,
                fontSize: 11,
              }}
              labelStyle={{ color: '#e4e4e7' }}
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Legend
              wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
            />
            <Bar
              dataKey="cashFlow"
              name="Net Cash Flow"
              fill="#10b981"
              fillOpacity={0.7}
              radius={[3, 3, 0, 0]}
            />
            {taxEnabled && (
              <Bar
                dataKey="afterTax"
                name="After-Tax CF"
                fill="#3b82f6"
                fillOpacity={0.7}
                radius={[3, 3, 0, 0]}
              />
            )}
            <Line
              type="monotone"
              dataKey="cumulative"
              name="Cumulative"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="equity"
              name="Equity"
              stroke="#8b5cf6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#8b5cf6', r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
