'use client';

import React from 'react';
import Link from 'next/link';
import {
  Wallet,
  PieChart,
  Target,
  TrendingUp,
  HandCoins,
  CircleDollarSign,
  Bell,
  Settings,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';

interface QuickAccessItem {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  badge?: string;
}

const QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  {
    id: 'accounts',
    title: 'Rekening',
    description: 'Bank & E-Wallet',
    href: '/accounts',
    icon: Wallet,
    gradient: 'from-blue-500 to-indigo-600 text-blue-500 bg-blue-500/10 dark:bg-blue-500/15',
  },
  {
    id: 'reports',
    title: 'Laporan',
    description: 'Arus Kas & Neraca',
    href: '/reports',
    icon: PieChart,
    gradient: 'from-emerald-500 to-teal-600 text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15',
  },
  {
    id: 'budgets',
    title: 'Anggaran',
    description: 'Batas Pengeluaran',
    href: '/budgets',
    icon: Target,
    gradient: 'from-amber-500 to-orange-600 text-amber-500 bg-amber-500/10 dark:bg-amber-500/15',
  },
  {
    id: 'investments',
    title: 'Investasi',
    description: 'Saham & Kripto',
    href: '/investments',
    icon: TrendingUp,
    gradient: 'from-violet-500 to-purple-600 text-violet-500 bg-violet-500/10 dark:bg-violet-500/15',
  },
  {
    id: 'debts',
    title: 'Hutang',
    description: 'Cicilan Berjalan',
    href: '/debts',
    icon: HandCoins,
    gradient: 'from-rose-500 to-pink-600 text-rose-500 bg-rose-500/10 dark:bg-rose-500/15',
  },
  {
    id: 'receivables',
    title: 'Piutang',
    description: 'Uang Dipinjamkan',
    href: '/receivables',
    icon: CircleDollarSign,
    gradient: 'from-cyan-500 to-sky-600 text-cyan-500 bg-cyan-500/10 dark:bg-cyan-500/15',
  },
  {
    id: 'reminders',
    title: 'Tagihan',
    description: 'Jatuh Tempo',
    href: '/reminders',
    icon: Bell,
    gradient: 'from-yellow-500 to-amber-600 text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 dark:bg-yellow-500/15',
  },
  {
    id: 'settings',
    title: 'Pengaturan',
    description: 'Akun & Profil',
    href: '/settings',
    icon: Settings,
    gradient: 'from-zinc-500 to-slate-600 text-zinc-500 dark:text-zinc-400 bg-zinc-500/10 dark:bg-zinc-500/15',
  },
];

export function QuickAccessMenu() {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold tracking-tight text-foreground">
            Akses Cepat
          </h3>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            Fitur Utama
          </span>
        </div>
        <Link
          href="/settings"
          className="text-xs font-semibold text-muted-foreground transition hover:text-foreground"
        >
          Semua Fitur
        </Link>
      </div>

      {/* Grid of Quick Access Icons */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
        {QUICK_ACCESS_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className="group relative flex flex-col items-center justify-center rounded-2xl border border-border/70 bg-card/60 p-2.5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-md active:scale-95"
            >
              {/* Icon Container */}
              <div
                className={cn(
                  'mb-1.5 flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 group-hover:scale-105 shadow-xs',
                  item.gradient
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              {/* Title */}
              <span className="text-[11px] font-bold text-foreground tracking-tight line-clamp-1">
                {item.title}
              </span>

              {/* Subtitle / Description */}
              <span className="text-[9px] font-medium text-muted-foreground line-clamp-1 hidden sm:block">
                {item.description}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
