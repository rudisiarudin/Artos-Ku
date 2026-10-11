'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BarChart3,
  Plus,
  PiggyBank,
  MoreHorizontal,
  ArrowLeftRight,
  TrendingUp,
  HandCoins,
  CreditCard,
  Landmark,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useFinance } from '../../context/FinanceContext';

export function BottomNav() {
  const pathname = usePathname();
  const { setActiveModal } = useFinance();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);

  const moreNav = [
    { label: 'Transaksi', href: '/transactions', icon: ArrowLeftRight },
    { label: 'Investasi', href: '/investments', icon: TrendingUp },
    { label: 'Rekening & Dompet', href: '/accounts', icon: Landmark },
    { label: 'Anggaran Bulanan', href: '/budgets', icon: PiggyBank },
    { label: 'Kelola Piutang', href: '/receivables', icon: HandCoins },
    { label: 'Cicilan & Hutang', href: '/debts', icon: CreditCard },
    { label: 'Laporan Finansial', href: '/reports', icon: BarChart3 },
    { label: 'Pengaturan', href: '/settings', icon: Settings },
    { label: 'Akun / Masuk', href: '/auth', icon: Landmark },
  ];

  return (
    <>
      {/* "More" Sheet Drawer (Native Mobile Slide-Up) */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl border-t border-border bg-card p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted-foreground/20" />
            
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <span className="text-sm font-bold text-foreground">Semua Menu & Fitur</span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2.5">
              {moreNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMoreMenu(false)}
                    className={cn(
                      'flex flex-col items-center justify-center rounded-2xl border p-2.5 text-center transition-all',
                      isActive
                        ? 'border-primary/40 bg-primary/10 text-primary font-bold'
                        : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 mb-1.5" />
                    <span className="text-[10px] font-medium leading-tight line-clamp-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FAB Quick Action Bottom Sheet (Native Mobile Slide-Up) */}
      {showFabMenu && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={() => setShowFabMenu(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl border-t border-border bg-card p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted-foreground/20" />

            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <div>
                <span className="text-sm font-bold text-foreground">Catat Keuangan Cepat</span>
                <p className="text-[11px] text-muted-foreground">Pilih jenis pencatatan finansial</p>
              </div>
              <button
                onClick={() => setShowFabMenu(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  setShowFabMenu(false);
                  setActiveModal('transaction');
                }}
                className="flex flex-col items-start rounded-2xl border border-border bg-muted/30 p-3.5 text-left transition hover:bg-muted active:scale-98"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
                  <ArrowLeftRight className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-foreground">Transaksi Harian</span>
                <span className="text-[10px] text-muted-foreground">Pemasukan, pengeluaran & transfer</span>
              </button>

              <button
                onClick={() => {
                  setShowFabMenu(false);
                  setActiveModal('stock_trade');
                }}
                className="flex flex-col items-start rounded-2xl border border-border bg-muted/30 p-3.5 text-left transition hover:bg-muted active:scale-98"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-2">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-foreground">Trading Saham</span>
                <span className="text-[10px] text-muted-foreground">Beli/jual saham IDX (Lot)</span>
              </button>

              <button
                onClick={() => {
                  setShowFabMenu(false);
                  setActiveModal('crypto_trade');
                }}
                className="flex flex-col items-start rounded-2xl border border-border bg-muted/30 p-3.5 text-left transition hover:bg-muted active:scale-98"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-2">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-foreground">Aset Crypto</span>
                <span className="text-[10px] text-muted-foreground">Beli/jual BTC, ETH, SOL</span>
              </button>

              <button
                onClick={() => {
                  setShowFabMenu(false);
                  setActiveModal('receivable');
                }}
                className="flex flex-col items-start rounded-2xl border border-border bg-muted/30 p-3.5 text-left transition hover:bg-muted active:scale-98"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-2">
                  <HandCoins className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-foreground">Pinjamkan Uang</span>
                <span className="text-[10px] text-muted-foreground">Catat piutang teman/keluarga</span>
              </button>

              <button
                onClick={() => {
                  setShowFabMenu(false);
                  setActiveModal('debt');
                }}
                className="col-span-2 flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3.5 text-left transition hover:bg-muted active:scale-98"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground">Cicilan & Hutang Baru</span>
                  <p className="text-[10px] text-muted-foreground">KPR, kendaraan, smartphone, atau kartu kredit</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Docked Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border/80 bg-background/95 px-3 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden">
        {/* Item 1: Home */}
        <Link
          href="/"
          className={cn(
            'flex flex-col items-center justify-center gap-1 min-w-[56px] py-1 text-[11px] font-medium transition',
            pathname === '/' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </Link>

        {/* Item 2: Analytics / Reports */}
        <Link
          href="/reports"
          className={cn(
            'flex flex-col items-center justify-center gap-1 min-w-[56px] py-1 text-[11px] font-medium transition',
            pathname === '/reports' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <BarChart3 className="h-5 w-5" />
          <span>Analytics</span>
        </Link>

        {/* CENTER PROMINENT FLOATING ACTION BUTTON */}
        <div className="relative -top-4 flex items-center justify-center">
          <button
            onClick={() => setShowFabMenu(true)}
            aria-label="Tambah Transaksi Finansial"
            className="flex h-13 w-13 items-center justify-center rounded-full bg-zinc-950 text-white dark:bg-[#4ade80] dark:text-zinc-950 shadow-lg shadow-black/10 dark:shadow-[#4ade80]/20 transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="h-6 w-6 stroke-[2.6]" />
          </button>
        </div>

        {/* Item 3: Budgets */}
        <Link
          href="/budgets"
          className={cn(
            'flex flex-col items-center justify-center gap-1 min-w-[56px] py-1 text-[11px] font-medium transition',
            pathname === '/budgets' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <PiggyBank className="h-5 w-5" />
          <span>Budgets</span>
        </Link>

        {/* Item 4: More / Lainnya */}
        <button
          onClick={() => setShowMoreMenu(true)}
          className={cn(
            'flex flex-col items-center justify-center gap-1 min-w-[56px] py-1 text-[11px] font-medium transition',
            showMoreMenu || (pathname !== '/' && pathname !== '/reports' && pathname !== '/budgets')
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>Menu</span>
        </button>
      </nav>
    </>
  );
}
