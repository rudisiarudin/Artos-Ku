'use client';

import React from 'react';
import { BarChart3, Printer } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatIDR } from '../../lib/finance/formatters';
import dynamic from 'next/dynamic';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

const CashFlowBarChart = dynamic(
  () => import('../../components/charts/FinancialCharts').then((mod) => mod.CashFlowBarChart),
  { ssr: false }
);
const CategoryPieChart = dynamic(
  () => import('../../components/charts/FinancialCharts').then((mod) => mod.CategoryPieChart),
  { ssr: false }
);

export default function ReportsPage() {
  const {
    netWorthData,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    savingsRate,
    categories,
    transactions,
  } = useFinance();

  // Category expense breakdown
  const categoryExpenseData = categories
    .filter((c) => c.type === 'expense')
    .map((cat) => {
      const spent = transactions
        .filter((t) => t.category_id === cat.id && t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      return {
        name: cat.name,
        amount: spent,
        color: cat.color,
      };
    })
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const highestExpenseCategory = categoryExpenseData[0];

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-foreground sm:text-2xl">
            Laporan Finansial & Wawasan (Insights)
          </h2>
          <p className="text-xs text-muted-foreground">
            Analisis menyeluruh arus kas, alokasi kekayaan, dan performa investasi
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handlePrint}
          className="gap-1.5 w-full sm:w-auto justify-center text-xs h-10"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Cetak Laporan / PDF</span>
        </Button>
      </div>

      {/* Financial Health Insights */}
      <Card className="p-6 shadow-sm">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Indikator Kesehatan Finansial (Financial Health)</h3>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border/80 bg-muted/30 p-3.5">
            <span className="text-xs font-medium text-muted-foreground">Rasio Tabungan (Savings Rate)</span>
            <div className="mt-1 font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {savingsRate}%
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {savingsRate >= 20 ? 'Sangat Sehat (Di atas 20%)' : 'Dapat ditingkatkan'}
            </p>
          </div>

          <div className="rounded-lg border border-border/80 bg-muted/30 p-3.5">
            <span className="text-xs font-medium text-muted-foreground">Kategori Pengeluaran Terbesar</span>
            <div className="mt-1 text-sm font-semibold text-foreground">
              {highestExpenseCategory ? highestExpenseCategory.name : 'Belum Ada Data'}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {highestExpenseCategory ? formatIDR(highestExpenseCategory.amount) : '-'}
            </p>
          </div>

          <div className="rounded-lg border border-border/80 bg-muted/30 p-3.5">
            <span className="text-xs font-medium text-muted-foreground">Rasio Solvabilitas (Debt-to-Asset)</span>
            <div className="mt-1 font-mono text-lg font-bold text-foreground">
              {netWorthData.netWorth > 0
                ? `${((netWorthData.totalDebts / (netWorthData.totalCash + netWorthData.investmentValue)) * 100).toFixed(1)}%`
                : '0%'}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Total Hutang dibanding Aset Likuid</p>
          </div>
        </div>
      </Card>

      {/* Visualizations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Arus Kas Masuk vs Keluar</h3>
          <p className="text-xs text-muted-foreground">Surplus tabungan bulan berjalan</p>
          <div className="mt-4">
            <CashFlowBarChart
              income={monthlyIncome}
              expenses={monthlyExpenses}
              savings={monthlySavings}
            />
          </div>
        </Card>

        <Card className="p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Distribusi Pengeluaran Kategori</h3>
          <p className="text-xs text-muted-foreground">Persentase porsi belanja</p>
          <div className="mt-4">
            <CategoryPieChart data={categoryExpenseData} />
          </div>
        </Card>
      </div>

      {/* Balance Sheet Table */}
      <Card className="p-6 shadow-sm">
        <h3 className="text-base font-semibold text-foreground">Neraca Keuangan Pribadi (Personal Balance Sheet)</h3>
        <p className="text-xs text-muted-foreground">
          Rekonsiliasi aset lancar, investasi, piutang, dan liabilitas
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-2 font-medium">Komponen Keuangan</th>
                <th className="pb-2 text-right font-medium">Nominal (IDR)</th>
                <th className="pb-2 text-right font-medium">Proporsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr>
                <td className="py-2.5 font-medium text-foreground">Kas, Bank & E-Wallet</td>
                <td className="py-2.5 text-right font-mono font-medium text-foreground">
                  {formatIDR(netWorthData.totalCash)}
                </td>
                <td className="py-2.5 text-right text-muted-foreground">Aset Likuid</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-foreground">Portofolio Saham & Crypto</td>
                <td className="py-2.5 text-right font-mono font-medium text-foreground">
                  {formatIDR(netWorthData.investmentValue)}
                </td>
                <td className="py-2.5 text-right text-muted-foreground">Aset Investasi</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-foreground">Piutang yang Dapat Ditagih</td>
                <td className="py-2.5 text-right font-mono font-medium text-foreground">
                  {formatIDR(netWorthData.totalReceivables)}
                </td>
                <td className="py-2.5 text-right text-muted-foreground">Tagihan</td>
              </tr>
              <tr className="bg-destructive/5">
                <td className="py-2.5 font-medium text-destructive">
                  Total Kewajiban Hutang & Cicilan (−)
                </td>
                <td className="py-2.5 text-right font-mono font-medium text-destructive">
                  −{formatIDR(netWorthData.totalDebts)}
                </td>
                <td className="py-2.5 text-right text-destructive">Liabilitas</td>
              </tr>
              <tr className="border-t-2 border-border font-bold">
                <td className="py-3 text-sm text-foreground">Kekayaan Bersih (Net Worth)</td>
                <td className="py-3 text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                  {formatIDR(netWorthData.netWorth)}
                </td>
                <td className="py-3 text-right text-emerald-600 dark:text-emerald-400">Ekuitas Bersih</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
