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
      sublabel: 'Pemasukan & Pengeluaran',
      icon: Plus,
      onClick: () => setActiveModal('transaction'),
      colorStyles:
        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 group-hover:border-emerald-500 group-hover:bg-emerald-500 group-hover:text-white dark:group-hover:text-zinc-950 shadow-emerald-500/10',
    },
    {
      id: 'transfer',
      label: 'Transfer',
      sublabel: 'Antar Rekening',
      icon: ArrowLeftRight,
      onClick: () => setActiveModal('transaction'),
      colorStyles:
        'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25 group-hover:border-blue-500 group-hover:bg-blue-500 group-hover:text-white shadow-blue-500/10',
    },
    {
      id: 'investment',
      label: 'Investasi',
      sublabel: 'Saham & Kripto',
      icon: TrendingUp,
      onClick: () => setActiveModal('stock_trade'),
      colorStyles:
        'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25 group-hover:border-violet-500 group-hover:bg-violet-500 group-hover:text-white shadow-violet-500/10',
    },
    {
      id: 'debt',
      label: 'Bayar',
      sublabel: 'Cicilan & Hutang',
      icon: CreditCard,
      onClick: () => setActiveModal('debt'),
      colorStyles:
        'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 group-hover:border-amber-500 group-hover:bg-amber-500 group-hover:text-white shadow-amber-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5 px-0.5 py-1">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.id}
            onClick={act.onClick}
            className="group flex flex-col items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
          >
            <div
              className={cn(
                'flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-2xl border transition-all duration-200 active:scale-95 shadow-xs',
                act.colorStyles
              )}
            >
              <Icon className="h-5 w-5 stroke-[2.2] transition-transform duration-200 group-hover:scale-110" />
            </div>
            <span className="text-[11px] font-bold text-foreground tracking-tight transition-colors group-hover:text-primary">
              {act.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
