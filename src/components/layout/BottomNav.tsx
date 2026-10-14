'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Wallet,
  TrendingUp,
  Settings,
  Plus,
  BarChart3,
  PiggyBank,
  ArrowLeftRight,
  HandCoins,
  CreditCard,
  Landmark,
  X,
  LayoutGrid,
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

  const navItems = [
    { id: 'home', label: 'Home', href: '/', icon: Home },
    { id: 'transactions', label: 'Transaksi', href: '/transactions', icon: ArrowLeftRight },
    { id: 'wallet', label: 'Dompet', href: '/accounts', icon: Wallet },
    { id: 'investasi', label: 'Investasi', href: '/investments', icon: TrendingUp },
  ];

  return (
    <>
      {/* "More" Sheet Drawer */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl border-t border-border bg-card p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-2xl animate-in slide-in-from-bottom duration-200"
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

      {/* FAB Quick Action Bottom Sheet */}
      {showFabMenu && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={() => setShowFabMenu(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl border-t border-border bg-card p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-2xl animate-in slide-in-from-bottom duration-200"
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
                  setActiveModal('portfolio_asset');
                }}
                className="flex flex-col items-start rounded-2xl border border-border bg-muted/30 p-3.5 text-left transition hover:bg-muted active:scale-98"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-2">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-foreground">Portofolio Saham</span>
                <span className="text-[10px] text-muted-foreground">Ajaib, Stockbit, Bibit, dll.</span>
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
                className="flex flex-col items-start rounded-2xl border border-border bg-muted/30 p-3.5 text-left transition hover:bg-muted active:scale-98"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-2">
                  <CreditCard className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-foreground">Cicilan & Hutang</span>
                <span className="text-[10px] text-muted-foreground">KPR, kendaraan, cicilan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Pill Dock Navigation */}
      <div className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 flex items-center justify-center px-3 pointer-events-none md:hidden">
        <div className="flex items-center gap-2 pointer-events-auto max-w-[420px] w-full">
          
          {/* Main Capsule Dock: Clean Matte Zinc rounded-full pill */}
          <nav className="flex-1 bg-zinc-950/95 dark:bg-zinc-900/95 border border-zinc-800/90 rounded-full p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.5)] backdrop-blur-md flex items-center justify-between">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="focus:outline-none"
                  aria-label={item.label}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center transition-all duration-200 rounded-full select-none cursor-pointer',
                      isActive
                        ? 'bg-white text-zinc-950 px-3 py-1.5 gap-1 shadow-sm font-bold'
                        : 'text-zinc-400 hover:text-white p-2'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4.5 w-4.5 transition-transform duration-200',
                        isActive ? 'text-zinc-950 stroke-[2.4]' : 'stroke-[1.8]'
                      )}
                    />
                    {isActive && (
                      <span className="text-[11px] font-extrabold tracking-tight text-zinc-950 whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-150">
                        {item.label}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}

            {/* Menu Drawer Button inside Dock */}
            <button
              type="button"
              onClick={() => setShowMoreMenu(true)}
              aria-label="Semua Menu"
              className="focus:outline-none"
            >
              <div
                className={cn(
                  'flex items-center justify-center transition-all duration-200 rounded-full select-none cursor-pointer',
                  showMoreMenu
                    ? 'bg-white text-zinc-950 px-3 py-1.5 gap-1 shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-white p-2'
                )}
              >
                <LayoutGrid className="h-4.5 w-4.5 stroke-[1.8]" />
              </div>
            </button>
          </nav>

          {/* Action Button: Detached Floating Circle (+ Catat) */}
          <button
            onClick={() => setShowFabMenu(true)}
            aria-label="Catat Keuangan Cepat"
            title="Catat Keuangan Cepat"
            className="h-12 w-12 shrink-0 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center transition-all duration-200 shadow-[0_16px_36px_rgba(16,185,129,0.35)] backdrop-blur-md active:scale-90 cursor-pointer select-none"
          >
            <Plus className="h-6 w-6 stroke-[2.8]" />
          </button>

        </div>
      </div>
    </>
  );
}