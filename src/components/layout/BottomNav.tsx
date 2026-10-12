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

  const navItems = [
    { id: 'home', label: 'Home', href: '/', icon: Home },
    { id: 'reports', label: 'Laporan', href: '/reports', icon: BarChart3 },
    { id: 'menu', label: 'Menu', href: '#menu', icon: MoreHorizontal, isAction: true },
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

      {/* FAB Quick Action Bottom Sheet */}
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

      {/* Floating Pill Dock Navigation (Exact Design 01) */}
      <div className="fixed bottom-5 left-0 right-0 z-40 flex items-center justify-center px-4 pointer-events-none md:hidden">
        <div className="flex items-center gap-2.5 pointer-events-auto max-w-[390px] w-full">
          
          {/* Main Capsule Dock: Deep Navy rounded-full pill */}
          <nav className="flex-1 bg-[#14202e] dark:bg-[#0f1724] border border-white/10 rounded-full p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.45)] flex items-center justify-between">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.isAction 
                ? showMoreMenu || (pathname !== '/' && pathname !== '/reports')
                : pathname === item.href && !showMoreMenu;

              const content = (
                <div
                  className={cn(
                    'flex items-center justify-center transition-all duration-300 rounded-full select-none cursor-pointer',
                    isActive
                      ? 'bg-white px-4 py-2 gap-2 shadow-sm font-extrabold'
                      : 'text-white/65 hover:text-white px-3.5 py-2'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-transform duration-200',
                      isActive ? 'text-[#F05A28] stroke-[2.4] fill-[#F05A28]/25 scale-105' : 'stroke-[2]'
                    )}
                  />
                  {isActive && (
                    <span className="text-xs font-black tracking-tight text-zinc-900 whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-200">
                      {item.label}
                    </span>
                  )}
                </div>
              );

              if (item.isAction) {
                return (
                  <button
                    key={item.id}
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="focus:outline-none"
                    aria-label={item.label}
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setShowMoreMenu(false)}
                  className="focus:outline-none"
                  aria-label={item.label}
                >
                  {content}
                </Link>
              );
            })}
          </nav>

          {/* Action Button: Detached Floating Circle (Row 4 in Design 01) */}
          <button
            onClick={() => setShowFabMenu(!showFabMenu)}
            aria-label="Tambah Transaksi Cepat"
            className={cn(
              'h-14 w-14 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_16px_36px_rgba(0,0,0,0.45)] active:scale-90 cursor-pointer select-none',
              showFabMenu
                ? 'bg-[#F05A28] text-white shadow-[#F05A28]/45 border-0'
                : 'bg-[#14202e] dark:bg-[#0f1724] border border-white/10 text-white hover:border-[#F05A28]/50'
            )}
          >
            <Plus className={cn('h-6 w-6 stroke-[2.8] transition-transform duration-200', showFabMenu ? 'rotate-45' : '')} />
          </button>

        </div>
      </div>
    </>
  );
}