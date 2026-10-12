'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { SyncStatusBadge } from '../shared/SyncStatusBadge';
import { useFinance } from '../../context/FinanceContext';
import { BrandLogo } from '../shared/BrandLogo';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

const PAGE_TITLES: Record<string, string> = {
  '/': 'ArtosKu',
  '/transactions': 'Catatan Transaksi',
  '/investments': 'Portofolio Investasi',
  '/accounts': 'Rekening & Dompet',
  '/budgets': 'Anggaran Bulanan',
  '/receivables': 'Kelola Piutang',
  '/debts': 'Cicilan & Hutang',
  '/reports': 'Laporan Finansial',
  '/reminders': 'Pengingat & Notifikasi',
  '/settings': 'Pengaturan',
};

export function AppHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { reminders } = useFinance();

  const activeRemindersCount = reminders.filter((r) => !r.is_completed).length;
  const isHome = pathname === '/';
  const currentTitle = PAGE_TITLES[pathname] || 'ArtosKu';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/80 bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <BrandLogo size="sm" showText={false} />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold tracking-tight text-foreground sm:text-lg">
                {currentTitle}
              </h1>
              {isHome && (
                <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  PRO
                </span>
              )}
            </div>
            <p className="hidden text-[11px] font-medium text-muted-foreground sm:block">
              Personal Wealth & Finance Management
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <SyncStatusBadge />

        {/* Theme toggle using shadcn Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-xl border-border/80"
          aria-label="Toggle Dark/Light Mode"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications Button using shadcn Button */}
        <Link href="/reminders" className="relative">
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl border-border/80"
            aria-label="Notifikasi & Pengingat"
          >
            <Bell className="h-4 w-4" />
          </Button>
          {activeRemindersCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-4 w-4 p-0 flex items-center justify-center rounded-full text-[9px] animate-pulse"
            >
              {activeRemindersCount}
            </Badge>
          )}
        </Link>
      </div>
    </header>
  );
}
