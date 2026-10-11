'use client';

import React from 'react';
import { Plus, ArrowRight, TrendingUp, CreditCard, ArrowLeftRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { cn } from '../../lib/utils';

export function QuickActionBar() {
  const { setActiveModal } = useFinance();

  const actions = [
    {
      id: 'transaction',
      label: 'Catat',
      sublabel: 'Pemasukan/Pengeluaran',
      icon: Plus,
      onClick: () => setActiveModal('transaction'),
      primary: true,
    },
    {
      id: 'transfer',
      label: 'Transfer',
      sublabel: 'Antar Rekening',
      icon: ArrowLeftRight,
      onClick: () => setActiveModal('transaction'),
      primary: false,
    },
    {
      id: 'investment',
      label: 'Investasi',
      sublabel: 'Saham & Crypto',
      icon: TrendingUp,
      onClick: () => setActiveModal('stock_trade'),
      primary: false,
    },
    {
      id: 'debt',
      label: 'Bayar',
      sublabel: 'Cicilan & Hutang',
      icon: CreditCard,
      onClick: () => setActiveModal('debt'),
      primary: false,
    },
  ];

  return (
    <div className="flex items-center justify-around gap-2 px-1 py-1">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.id}
            onClick={act.onClick}
            className="group flex flex-col items-center justify-center gap-1.5 focus:outline-none"
          >
            <div
              className={cn(
                'flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-full transition-all duration-150 active:scale-95 shadow-sm',
                act.primary
                  ? 'bg-emerald-500 text-zinc-950 dark:bg-[#4ade80] dark:text-zinc-950 shadow-emerald-500/20 hover:brightness-110'
                  : 'bg-muted/80 text-foreground border border-border/80 hover:bg-muted dark:bg-zinc-900 dark:border-zinc-800'
              )}
            >
              <Icon className="h-5 w-5 stroke-[2.2]" />
            </div>
            <span className="text-[11px] font-semibold text-foreground tracking-tight">
              {act.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
