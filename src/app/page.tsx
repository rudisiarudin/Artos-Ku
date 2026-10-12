'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  TrendingUp,
  HandCoins,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  PiggyBank,
  ChevronRight,
  ShieldCheck,
  Eye,
  EyeOff,
  PlusCircle,
  Utensils,
  ShoppingBag,
  Car,
  Receipt,
  Briefcase,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatIDR, formatIndonesianDate } from '../lib/finance/formatters';
import { StatCard } from '../components/shared/StatCard';
import dynamic from 'next/dynamic';
import { CurrencyDisplay } from '../components/shared/CurrencyDisplay';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { PhysicalWalletDeck } from '../components/cards/PhysicalWalletDeck';
import { QuickActionBar } from '../components/shared/QuickActionBar';
import { QuickAccessMenu } from '../components/shared/QuickAccessMenu';

const CashFlowBarChart = dynamic(
  () => import('../components/charts/FinancialCharts').then((mod) => mod.CashFlowBarChart),
  { ssr: false }
);
const CategoryPieChart = dynamic(
  () => import('../components/charts/FinancialCharts').then((mod) => mod.CategoryPieChart),
  { ssr: false }
);

export default function DashboardPage() {
  const {
    user,
    netWorthData,
    accounts,
    transactions,
    receivables,
    debts,
    categories,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    savingsRate,
    setActiveModal,
    isPrivacyMode,
    togglePrivacyMode,
  } = useFinance();

  const [dateRange, setDateRange] = useState<'month' | 'year' | 'all'>('month');
  const [showChartsOnMobile, setShowChartsOnMobile] = useState(false);

  // Total Assets = Cash + Investments + Receivables
  const totalAssets =
    netWorthData.totalCash + netWorthData.investmentValue + netWorthData.totalReceivables;

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
    .filter((c) => c.amount > 0);

  // Active debts with upcoming due dates
  const upcomingDebts = debts
    .filter((d) => d.status === 'active')
    .slice(0, 3);

  // Overdue or pending receivables
  const pendingReceivables = receivables
    .filter((r) => r.status !== 'paid')
    .slice(0, 3);

  // Recent transactions
  const recentTransactions = transactions.slice(0, 5);

  // Dynamic greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat pagi,';
    if (hour < 15) return 'Selamat siang,';
    if (hour < 18) return 'Selamat sore,';
    return 'Selamat malam,';
  };

  // Dynamic user display name resolved from profile metadata or storage
  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.user_metadata?.name) return user.user_metadata.name;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('artosku_user_name');
      if (stored) return stored;
    }
    if (user?.email) {
      const namePart = user.email.split('@')[0];
      return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    }
    return 'Rudi Si\'arudin';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Helper to pick category icon and colors
  const getTransactionVisuals = (tx: any) => {
    const isIncome =
      tx.type === 'income' ||
      tx.type === 'receivable_repayment' ||
      tx.type === 'investment_sell';
    const isTransfer = tx.type === 'transfer';

    if (isIncome) {
      return {
        icon: ArrowDownRight,
        bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      };
    }
    if (isTransfer) {
      return {
        icon: ArrowLeftRight,
        bg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
      };
    }

    const desc = (tx.description || '').toLowerCase();
    if (desc.includes('makan') || desc.includes('kopi') || desc.includes('food') || desc.includes('resto') || desc.includes('noodle')) {
      return {
        icon: Utensils,
        bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      };
    }
    if (desc.includes('belanja') || desc.includes('supermarket') || desc.includes('mall') || desc.includes('mart')) {
      return {
        icon: ShoppingBag,
        bg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
      };
    }
    if (desc.includes('bensin') || desc.includes('gojek') || desc.includes('grab') || desc.includes('parkir') || desc.includes('tol')) {
      return {
        icon: Car,
        bg: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
      };
    }
    if (desc.includes('listrik') || desc.includes('air') || desc.includes('wifi') || desc.includes('pulsa') || desc.includes('tagihan')) {
      return {
        icon: Receipt,
        bg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
      };
    }

    return {
      icon: ArrowUpRight,
      bg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    };
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      {/* ========================================================
          MOBILE VIEW: Exact Layout Inspired by Fintech Reference
         ======================================================== */}
      <div className="space-y-4 sm:hidden">
        {/* 1. Header Greeting & Profile Status */}
        <div className="flex items-center justify-between rounded-2xl bg-card/60 border border-border/70 p-3 shadow-xs backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 text-white font-black text-sm shadow-sm ring-2 ring-emerald-500/20 select-none">
              {getUserInitials()}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground">{getGreeting()}</p>
              <h2 className="text-sm font-extrabold tracking-tight text-foreground truncate">
                {getUserDisplayName()}
              </h2>
            </div>
          </div>
          <Badge
            variant="outline"
            className="gap-1.5 px-2.5 py-1 text-[11px] font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 shadow-xs shrink-0"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Aktif</span>
          </Badge>
        </div>

        {/* 2. Total Balance & Cash Flow Card (Luxury Executive Obsidian & Emerald Card) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1727] via-[#0d2238] to-[#052824] border border-emerald-500/30 p-5 text-white shadow-2xl select-none">
          {/* Holographic specular lighting accents */}
          <div className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full bg-emerald-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-14 -bottom-14 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/90 font-mono">
                TOTAL KEKAYAAN BERSIH
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/30">
                IDR
              </span>
            </div>
            <button
              onClick={togglePrivacyMode}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition active:scale-95 cursor-pointer backdrop-blur-md border border-white/10"
              aria-label={isPrivacyMode ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
              title={isPrivacyMode ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
            >
              {isPrivacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Main Balance Display */}
          <div className="mt-3.5 flex items-baseline gap-2">
            <span className="text-base font-bold text-emerald-400/90">Rp</span>
            <span className="font-mono text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
              {isPrivacyMode ? '••••••••••' : formatIDR(netWorthData.netWorth).replace('Rp', '').trim()}
            </span>
          </div>

          {/* Asset Allocation Breakdown */}
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
            <div>
              <span className="text-[10px] uppercase font-semibold text-white/50 tracking-wider block">Kas & Bank</span>
              <span className="font-mono text-xs sm:text-sm font-bold text-white/95 truncate block">
                {isPrivacyMode ? '••••••' : formatIDR(netWorthData.totalCash)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-white/50 tracking-wider block">Investasi</span>
              <span className="font-mono text-xs sm:text-sm font-bold text-white/95 truncate block">
                {isPrivacyMode ? '••••••' : formatIDR(netWorthData.investmentValue)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-white/50 tracking-wider block">Hutang</span>
              <span className="font-mono text-xs sm:text-sm font-bold text-rose-300 truncate block">
                {isPrivacyMode ? '••••••' : formatIDR(netWorthData.totalDebts)}
              </span>
            </div>
          </div>

          {/* Cashflow Strip */}
          <div className="mt-3.5 flex items-center justify-between gap-2 rounded-2xl bg-white/5 p-2.5 backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                <ArrowDownRight className="h-3.5 w-3.5" />
                <span>{isPrivacyMode ? '•••' : formatIDR(monthlyIncome)}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/20 px-2.5 py-1 text-[11px] font-bold text-rose-300 border border-rose-500/30">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>{isPrivacyMode ? '•••' : formatIDR(monthlyExpenses)}</span>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 shrink-0">
              Bulan Ini
            </span>
          </div>
        </div>

        {/* 3. Primary Circular Quick Action Bar */}
        <QuickActionBar />

        {/* 4. Swipeable Virtual Cards (My Wallet) */}
        <PhysicalWalletDeck />

        {/* 5. Menu Quick Access (8-Grid Shortcuts) */}
        <QuickAccessMenu />

        {/* Mobile Latest Transactions */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-bold tracking-tight text-foreground">
              Transaksi Terkini
            </h3>
            <Link
              href="/transactions"
              className="text-xs font-semibold text-primary transition hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          <Card className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border shadow-sm">
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
                  <Receipt className="h-5 w-5" />
                </div>
                <p className="font-semibold text-foreground">Belum ada transaksi</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Ketuk tombol Catat di atas untuk transaksi baru.</p>
              </div>
            ) : (
              recentTransactions.map((tx) => {
                const visuals = getTransactionVisuals(tx);
                const Icon = visuals.icon;
                const isIncome =
                  tx.type === 'income' ||
                  tx.type === 'receivable_repayment' ||
                  tx.type === 'investment_sell';
                const isTransfer = tx.type === 'transfer';
                const cat = categories.find((c) => c.id === tx.category_id);

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3.5 transition hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${visuals.bg}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-foreground truncate">
                          {tx.description}
                        </h4>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {cat?.name || 'Umum'} • {formatIndonesianDate(tx.date, 'time')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`font-mono text-xs sm:text-sm font-bold ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isTransfer
                            ? 'text-foreground'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isPrivacyMode
                          ? '••••••'
                          : `${isIncome ? '+' : isTransfer ? '' : '-'}${formatIDR(tx.amount)}`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </Card>
        </div>

        {/* Mobile Expandable Analytics Button */}
        <div className="pt-1">
          <button
            onClick={() => setShowChartsOnMobile(!showChartsOnMobile)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs font-semibold text-foreground transition hover:bg-muted/60"
          >
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span>{showChartsOnMobile ? 'Sembunyikan Grafik & Statistik' : 'Lihat Grafik & Statistik Arus Kas'}</span>
            </div>
            <ChevronRight
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                showChartsOnMobile ? 'rotate-90' : ''
              }`}
            />
          </button>

          {showChartsOnMobile && (
            <div className="mt-4 space-y-4 animate-in fade-in">
              <Card className="p-4 shadow-sm">
                <h4 className="text-xs font-bold text-foreground mb-1">Arus Kas Bulanan</h4>
                <p className="text-[10px] text-muted-foreground mb-3">Pemasukan vs Pengeluaran</p>
                <CashFlowBarChart
                  income={monthlyIncome}
                  expenses={monthlyExpenses}
                  savings={monthlySavings}
                />
              </Card>

              <Card className="p-4 shadow-sm">
                <h4 className="text-xs font-bold text-foreground mb-1">Distribusi Pengeluaran</h4>
                <p className="text-[10px] text-muted-foreground mb-3">Berdasarkan kategori pengeluaran</p>
                <CategoryPieChart data={categoryExpenseData} />
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          DESKTOP & TABLET VIEW: Comprehensive Wealth Dashboard
         ======================================================== */}
      <div className="hidden sm:block space-y-6">
        {/* Date Range Switcher & Banner */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5 px-2.5 py-0.5 text-xs font-medium border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Akun Terverifikasi</span>
              </Badge>
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {getGreeting()} {getUserDisplayName()} 👋
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ringkasan kekayaan bersih, transaksi, dan aset finansial Anda.
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
            <button
              onClick={() => setDateRange('month')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                dateRange === 'month'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setDateRange('year')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                dateRange === 'year'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tahun Ini
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                dateRange === 'all'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Semua
            </button>
          </div>
        </div>

        {/* Hero Card: Net Worth (Desktop Obsidian & Emerald Card) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1727] via-[#0d2238] to-[#052824] border border-emerald-500/30 p-7 text-white shadow-2xl select-none">
          {/* Ambient light glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300/90 font-mono">
                  TOTAL KEKAYAAN BERSIH (NET WORTH)
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                  IDR
                </span>
                <button
                  onClick={togglePrivacyMode}
                  className="ml-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition active:scale-95 cursor-pointer backdrop-blur-md border border-white/10"
                  aria-label="Toggle Privacy Mode"
                >
                  {isPrivacyMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-xl font-bold text-emerald-400">Rp</span>
                <span className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-md">
                  {isPrivacyMode ? '••••••••••••' : formatIDR(netWorthData.netWorth).replace('Rp', '').trim()}
                </span>
              </div>
              <p className="mt-2 text-xs text-white/60">
                Kas & Tabungan + Investasi Pasar + Piutang Tagih − Total Kewajiban Hutang
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Button
                onClick={() => setActiveModal('transaction')}
                className="gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold shadow-lg shadow-emerald-500/20 border-0 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Catat Transaksi</span>
              </Button>
              <Link href="/reports">
                <Button variant="outline" className="gap-1.5 bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-sm backdrop-blur-md cursor-pointer">
                  <span>Lihat Laporan</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Breakdown Badges inside Hero */}
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/60">
                Kas & Rekening
              </span>
              <div className="mt-1 font-mono text-base font-bold text-white">
                {isPrivacyMode ? '••••••' : formatIDR(netWorthData.totalCash)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/60">
                Nilai Investasi
              </span>
              <div className="mt-1 font-mono text-base font-bold text-emerald-300">
                {isPrivacyMode ? '••••••' : formatIDR(netWorthData.investmentValue)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/60">
                Piutang Aktif
              </span>
              <div className="mt-1 font-mono text-base font-bold text-amber-300">
                {isPrivacyMode ? '••••••' : formatIDR(netWorthData.totalReceivables)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/60">
                Kewajiban Hutang
              </span>
              <div className="mt-1 font-mono text-base font-bold text-rose-300">
                {isPrivacyMode ? '••••••' : formatIDR(netWorthData.totalDebts)}
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Cash Flow Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pemasukan Bulan Ini"
            amount={monthlyIncome}
            icon={ArrowDownRight}
            type="income"
            iconBgColor="bg-emerald-500/10"
            iconColor="text-emerald-600"
            badgeText="Bulan Ini"
            badgeType="positive"
          />

          <StatCard
            title="Pengeluaran Bulan Ini"
            amount={monthlyExpenses}
            icon={ArrowUpRight}
            type="expense"
            iconBgColor="bg-rose-500/10"
            iconColor="text-rose-600"
            badgeText="Bulan Ini"
            badgeType="negative"
          />

          <StatCard
            title="Tabungan Bersih (Surplus)"
            amount={monthlySavings}
            icon={PiggyBank}
            type={monthlySavings >= 0 ? 'income' : 'expense'}
            iconBgColor="bg-blue-500/10"
            iconColor="text-blue-600"
            badgeText={`Rasio: ${savingsRate}%`}
            badgeType={savingsRate >= 20 ? 'positive' : 'neutral'}
          />

          <StatCard
            title="Total Aset Kotor"
            amount={totalAssets}
            icon={Wallet}
            iconBgColor="bg-purple-500/10"
            iconColor="text-purple-600"
            subtitle="Sebelum dikurangi kewajiban hutang"
          />
        </div>

        {/* Desktop Quick Access Menu */}
        <QuickAccessMenu />

        {/* Visualizations Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Cash Flow Chart */}
          <Card className="p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Arus Kas Bulanan</h3>
                <p className="text-[11px] text-muted-foreground">Pemasukan vs Pengeluaran vs Tabungan</p>
              </div>
              <Link
                href="/reports"
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Detail
              </Link>
            </div>
            <div className="mt-4">
              <CashFlowBarChart
                income={monthlyIncome}
                expenses={monthlyExpenses}
                savings={monthlySavings}
              />
            </div>
          </Card>

          {/* Expense Category Breakdown Chart */}
          <Card className="p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Distribusi Pengeluaran</h3>
                <p className="text-[11px] text-muted-foreground">Berdasarkan kategori pengeluaran</p>
              </div>
              <Link
                href="/budgets"
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Anggaran
              </Link>
            </div>
            <div className="mt-4">
              <CategoryPieChart data={categoryExpenseData} />
            </div>
          </Card>
        </div>

        {/* Accounts & Wallets Grid */}
        <Card className="p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Rekening & Dompet Anda</h3>
              <p className="text-[11px] text-muted-foreground">
                Total {accounts.length} rekening terdaftar
              </p>
            </div>
            <Link
              href="/accounts"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Kelola Semua
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 p-3.5 transition hover:bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground font-bold shadow-none">
                    {acc.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">{acc.name}</h4>
                    <p className="text-[10px] text-muted-foreground capitalize">
                      {acc.institution_name || acc.type}
                    </p>
                  </div>
                </div>
                <CurrencyDisplay amount={acc.current_balance} size="md" />
              </div>
            ))}
          </div>
        </Card>

        {/* Two Column Grid: Upcoming Installments & Receivables */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Upcoming Installments (Cicilan) */}
          <Card className="p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-rose-600 dark:text-rose-400">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Jadwal Cicilan Mendatang</h3>
                  <p className="text-[11px] text-muted-foreground">Kewajiban pembayaran aktif</p>
                </div>
              </div>
              <Link
                href="/debts"
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Semua
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {upcomingDebts.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Tidak ada cicilan aktif saat ini.
                </p>
              ) : (
                upcomingDebts.map((debt) => (
                  <div
                    key={debt.id}
                    className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 p-3"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">{debt.debt_name}</h4>
                      <p className="text-[11px] text-muted-foreground">
                        {debt.creditor_name} • Jatuh tempo tgl {debt.due_day}
                      </p>
                      <span className="mt-1 inline-block text-[10px] font-medium text-rose-600 dark:text-rose-400">
                        Sisa {debt.remaining_installments}x cicilan
                      </span>
                    </div>
                    <div className="text-right">
                      <CurrencyDisplay amount={debt.monthly_installment} size="md" />
                      <p className="text-[10px] text-muted-foreground">/ bulan</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Receivables (Piutang) */}
          <Card className="p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-amber-600 dark:text-amber-400">
                  <HandCoins className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Piutang Belum Lunas</h3>
                  <p className="text-[11px] text-muted-foreground">Uang yang dipinjam orang lain</p>
                </div>
              </div>
              <Link
                href="/receivables"
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Semua
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {pendingReceivables.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Tidak ada piutang tertagih saat ini.
                </p>
              ) : (
                pendingReceivables.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 p-3"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">{rec.borrower_name}</h4>
                      <p className="text-[11px] text-muted-foreground">
                        Jatuh tempo: {formatIndonesianDate(rec.due_date, 'short')}
                      </p>
                      <span className="mt-1 inline-block rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                        {rec.status === 'partially_paid' ? 'Dicicil Sebagian' : 'Belum Dibayar'}
                      </span>
                    </div>
                    <div className="text-right">
                      <CurrencyDisplay amount={rec.current_balance} size="md" />
                      <p className="text-[10px] text-muted-foreground">
                        dari {formatIDR(rec.principal_amount)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
