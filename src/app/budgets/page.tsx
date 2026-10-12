'use client';

import React, { useState } from 'react';
import { PiggyBank, AlertTriangle, CheckCircle2, AlertOctagon, Plus, Edit2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatIDR } from '../../lib/finance/formatters';
import { calculateBudgetUtilization } from '../../lib/finance/calculations';
import { CurrencyDisplay } from '../../components/shared/CurrencyDisplay';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { generateUUID } from '../../lib/utils';

export default function BudgetsPage() {
  const { categories, transactions, budgets, saveBudget, user, accounts } = useFinance();

  const [selectedCatId, setSelectedCatId] = useState('');
  const [limitStr, setLimitStr] = useState('');
  const [editingBudget, setEditingBudget] = useState<{ catId: string; limit: number } | null>(null);

  const currentMonthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Compute budget utilization for each expense category
  const budgetItems = expenseCategories.map((cat) => {
    const existingBudget = budgets.find(
      (b) => b.category_id === cat.id && b.month_year === currentMonthYear
    );
    const limit = existingBudget ? existingBudget.monthly_limit : 0;

    const spent = transactions
      .filter((t) => {
        if (t.category_id !== cat.id || t.type !== 'expense') return false;
        const d = new Date(t.date);
        return (
          d.getMonth() === new Date().getMonth() &&
          d.getFullYear() === new Date().getFullYear()
        );
      })
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const stats = calculateBudgetUtilization(spent, limit);

    return {
      category: cat,
      limit,
      spent,
      stats,
    };
  });

  const totalBudgeted = budgetItems.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgetItems.reduce((sum, b) => sum + b.spent, 0);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawLimit = parseFloat(limitStr.replace(/[^0-9]/g, '')) || 0;
    if (!selectedCatId || rawLimit <= 0) return;

    const activeUid = user?.id || accounts[0]?.user_id || 'user_local';
    await saveBudget({
      id: generateUUID(),
      user_id: activeUid,
      category_id: selectedCatId,
      month_year: currentMonthYear,
      monthly_limit: rawLimit,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    setSelectedCatId('');
    setLimitStr('');
    setEditingBudget(null);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-foreground sm:text-2xl">
            Anggaran Bulanan (Budgets)
          </h2>
          <p className="text-xs text-muted-foreground">
            Batas pengeluaran per kategori untuk periode {currentMonthYear}
          </p>
        </div>
      </div>

      {/* Aggregate Overview Card */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4 shadow-sm">
          <span className="text-xs font-medium text-muted-foreground">Total Plafon Anggaran</span>
          <div className="mt-1">
            <CurrencyDisplay amount={totalBudgeted} size="lg" />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Batas total pengeluaran terencana</p>
        </Card>

        <Card className="p-4 shadow-sm">
          <span className="text-xs font-medium text-muted-foreground">Realisasi Pengeluaran</span>
          <div className="mt-1">
            <CurrencyDisplay amount={totalSpent} type="expense" size="lg" />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {totalBudgeted > 0 ? `${((totalSpent / totalBudgeted) * 100).toFixed(1)}% terpakai` : 'Belum dianggarkan'}
          </p>
        </Card>

        <Card className="p-4 shadow-sm">
          <span className="text-xs font-medium text-muted-foreground">Sisa Anggaran Tersedia</span>
          <div className="mt-1">
            <CurrencyDisplay
              amount={Math.max(0, totalBudgeted - totalSpent)}
              type={totalBudgeted >= totalSpent ? 'income' : 'expense'}
              size="lg"
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Dana tersisa yang dapat dibelanjakan</p>
        </Card>
      </div>

      {/* Set/Edit Budget Form */}
      <Card className="p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">
          {editingBudget ? 'Ubah Batas Anggaran Kategori' : 'Tetapkan Batas Anggaran Kategori'}
        </h3>
        <form onSubmit={handleSaveBudget} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-muted-foreground">Kategori Pengeluaran</label>
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-input bg-background p-2.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">-- Pilih Kategori --</option>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold text-muted-foreground">Batas Anggaran Bulanan (Rp)</label>
            <Input
              type="text"
              inputMode="numeric"
              required
              placeholder="0"
              value={limitStr}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setLimitStr(val ? new Intl.NumberFormat('id-ID').format(Number(val)) : '');
              }}
              className="mt-1 font-mono text-xs font-bold"
            />
          </div>

          <Button
            type="submit"
            className="font-bold shadow-sm"
          >
            Simpan Anggaran
          </Button>
        </form>
      </Card>

      {/* Budget Utilization List */}
      <div className="space-y-3">
        {budgetItems.map((item) => {
          const { category, limit, spent, stats } = item;

          return (
            <Card
              key={category.id}
              className="p-4 shadow-sm transition hover:border-foreground/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground font-semibold text-xs">
                    {category.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">{category.name}</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Terpakai: {formatIDR(spent)} dari {limit > 0 ? formatIDR(limit) : 'Belum ditentukan'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {stats.isOverBudget ? (
                    <Badge variant="destructive" className="gap-1 text-xs">
                      <AlertOctagon className="h-3 w-3" />
                      Over Budget!
                    </Badge>
                  ) : stats.status === 'warning' ? (
                    <Badge variant="warning" className="gap-1 text-xs">
                      <AlertTriangle className="h-3 w-3" />
                      Mendekati Batas ({stats.percentage.toFixed(0)}%)
                    </Badge>
                  ) : (
                    <Badge variant="success" className="gap-1 text-xs">
                      <CheckCircle2 className="h-3 w-3" />
                      Aman ({stats.percentage.toFixed(0)}%)
                    </Badge>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {limit > 0 && (
                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full transition-all duration-300 ${
                        stats.isOverBudget
                          ? 'bg-destructive'
                          : stats.status === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, stats.percentage)}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
                    <span>{stats.percentage.toFixed(1)}% terpakai</span>
                    <span>Sisa: {formatIDR(Math.max(0, stats.remaining))}</span>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
