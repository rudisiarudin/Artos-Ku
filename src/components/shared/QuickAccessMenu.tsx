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
} from 'lucide-react';
import { Badge } from '../ui/badge';

interface QuickAccessItem {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  {
    id: 'accounts',
    title: 'Rekening',
    description: 'Bank & Dompet',
    href: '/accounts',
    icon: Wallet,
  },
  {
    id: 'investments',
    title: 'Investasi',
    description: 'Saham & Kripto',
    href: '/investments',
    icon: TrendingUp,
  },
  {
    id: 'reports',
    title: 'Laporan',
    description: 'Arus Kas & Neraca',
    href: '/reports',
    icon: PieChart,
  },
  {
    id: 'budgets',
    title: 'Anggaran',
    description: 'Batas Pengeluaran',
    href: '/budgets',
    icon: Target,
  },
  {
    id: 'debts',
    title: 'Hutang',
    description: 'Cicilan Berjalan',
    href: '/debts',
    icon: HandCoins,
  },
  {
    id: 'receivables',
    title: 'Piutang',
    description: 'Uang Dipinjamkan',
    href: '/receivables',
    icon: CircleDollarSign,
  },
  {
    id: 'reminders',
    title: 'Tagihan',
    description: 'Jatuh Tempo',
    href: '/reminders',
    icon: Bell,
  },
  {
    id: 'settings',
    title: 'Pengaturan',
    description: 'Akun & Profil',
    href: '/settings',
    icon: Settings,
  },
];

export function QuickAccessMenu() {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Akses Cepat
          </h3>
          <Badge variant="outline" className="text-[10px] font-normal px-2 py-0">
            Fitur Utama
          </Badge>
        </div>
        <Link
          href="/settings"
          className="text-xs text-muted-foreground transition hover:text-foreground"
        >
          Semua Fitur
        </Link>
      </div>

      {/* Grid of Quick Access Icons (Clean shadcn/ui zinc) */}
      <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
        {QUICK_ACCESS_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className="group flex flex-col items-center justify-center rounded-xl border border-border/70 bg-card p-3 text-center transition hover:border-border hover:bg-muted/40"
            >
              <div className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-muted/40 text-foreground transition group-hover:bg-accent group-hover:text-accent-foreground">
                <Icon className="h-4 w-4" />
              </div>

              <span className="text-[11px] font-medium text-foreground tracking-tight line-clamp-1">
                {item.title}
              </span>

              <span className="text-[9px] text-muted-foreground line-clamp-1 hidden sm:block">
                {item.description}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
