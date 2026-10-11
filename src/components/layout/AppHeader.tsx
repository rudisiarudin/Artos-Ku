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
  '/': 'Ringkasan Finansial',
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
  const currentTitle = PAGE_TITLES[pathname] || 'ArtosKu';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/80 bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="md:hidden">
          <BrandLogo size="sm" showText={false} />
        </Link>
        <div>
          <h1 className="text-base font-bold text-foreground sm:text-lg">{currentTitle}</h1>
          <p className="hidden text-[11px] text-muted-foreground sm:block">
            Personal Finance & Wealth Management • IDR
          </p>
        </div>
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
