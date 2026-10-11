'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatIDR } from '../../lib/finance/formatters';

interface CashFlowChartProps {
  income: number;
  expenses: number;
  savings: number;
}

export function CashFlowBarChart({ income, expenses, savings }: CashFlowChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-56 w-full items-center justify-center rounded-2xl bg-muted/20 animate-pulse">
        <span className="text-xs text-muted-foreground">Memuat visualisasi arus kas...</span>
      </div>
    );
  }

  const data = [
    { name: 'Pemasukan', amount: income, fill: 'hsl(var(--chart-2))' },
    { name: 'Pengeluaran', amount: expenses, fill: 'hsl(var(--chart-1))' },
    { name: 'Tabungan', amount: Math.max(0, savings), fill: 'hsl(var(--chart-3))' },
  ];

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'currentColor' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'currentColor' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `Rp${(val / 1000000).toFixed(0)}jt`}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
            formatter={(val: any) => [formatIDR(Number(val || 0)), 'Nominal']}
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              borderColor: 'hsl(var(--border))',
              borderRadius: 'var(--radius)',
              color: 'hsl(var(--popover-foreground))',
              fontSize: '12px',
              padding: '8px 12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600, marginBottom: '2px' }}
            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
          />
          <Bar dataKey="amount" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface CategoryPieChartProps {
  data: { name: string; amount: number; color?: string }[];
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-56 w-full items-center justify-center rounded-lg bg-muted/20 animate-pulse">
        <span className="text-xs text-muted-foreground">Memuat diagram pengeluaran...</span>
      </div>
    );
  }

  const SHADCN_CHART_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  if (!data || data.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-xs text-muted-foreground">
        Belum ada data pengeluaran bulan ini
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={75}
            paddingAngle={3}
            dataKey="amount"
            stroke="hsl(var(--card))"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || SHADCN_CHART_COLORS[index % SHADCN_CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(val: any) => [formatIDR(Number(val || 0)), 'Pengeluaran']}
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              borderColor: 'hsl(var(--border))',
              borderRadius: 'var(--radius)',
              color: 'hsl(var(--popover-foreground))',
              fontSize: '12px',
              padding: '8px 12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600, marginBottom: '2px' }}
            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
