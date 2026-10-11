'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  Landmark,
  PiggyBank,
  HandCoins,
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  Plus,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useFinance } from '../../context/FinanceContext';
import { CurrencyDisplay } from '../shared/CurrencyDisplay';
import { BrandLogo } from '../shared/BrandLogo';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Card } from '../ui/card';

export function DesktopSidebar() {
  const pathname = usePathname();
  const { netWorthData, setActiveModal, reminders, user, logout } = useFinance();

  const activeRemindersCount = reminders.filter((r) => !r.is_completed).length;

  const navItems = [
    { label: 'Ringkasan Finansial', href: '/', icon: LayoutDashboard },
    { label: 'Transaksi', href: '/transactions', icon: ArrowLeftRight },
    { label: 'Portofolio Investasi', href: '/investments', icon: TrendingUp },
    { label: 'Rekening & Dompet', href: '/accounts', icon: Landmark },
    { label: 'Anggaran Bulanan', href: '/budgets', icon: PiggyBank },
    { label: 'Kelola Piutang', href: '/receivables', icon: HandCoins },
    { label: 'Cicilan & Hutang', href: '/debts', icon: CreditCard },
    { label: 'Laporan & Analitik', href: '/reports', icon: BarChart3 },
    {
      label: 'Pengingat',
      href: '/reminders',
      icon: Bell,
      badge: activeRemindersCount > 0 ? activeRemindersCount : undefined,
    },
    { label: 'Pengaturan', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/80 bg-card md:flex z-30">
      {/* Brand Header with dynamic light/dark logo */}
      <div className="flex h-16 shrink-0 items-center border-b border-border/80 px-5">
        <Link href="/" className="hover:opacity-90 transition">
          <BrandLogo size="md" showText={true} />
        </Link>
      </div>

      {/* Net Worth Quick Card */}
      <div className="shrink-0 px-4 py-3">
        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Kekayaan Bersih</span>
            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
              Seimbang
            </Badge>
          </div>
          <div className="mt-1">
            <CurrencyDisplay amount={netWorthData.netWorth} size="lg" />
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Anti Double-Counting</span>
          </div>
        </div>
      </div>

      {/* Primary Action Button (shadcn button) */}
      <div className="shrink-0 px-4 mb-2">
        <Button
          onClick={() => setActiveModal('transaction')}
          className="w-full gap-2 shadow-sm font-semibold"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Catatan Baru</span>
        </Button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-secondary text-secondary-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <Badge variant="secondary" className="h-4 min-w-4 px-1 flex items-center justify-center rounded-full text-[9px]">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="shrink-0 border-t border-border/80 p-3 flex items-center justify-between">
        <Link href="/auth" className="flex items-center gap-2.5 transition hover:opacity-85 overflow-hidden">
          <Avatar className="h-8 w-8 shrink-0 border border-border">
            <AvatarFallback className="bg-primary/15 text-primary text-[11px] font-extrabold">
              {user?.user_metadata?.full_name
                ? user.user_metadata.full_name.substring(0, 2).toUpperCase()
                : user?.email
                ? user.email.substring(0, 2).toUpperCase()
                : 'DM'}
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="truncate text-xs font-bold text-foreground">
              {user?.user_metadata?.full_name || user?.email || 'Mode Demo'}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {user ? 'Akun Aktif' : 'Klik untuk Masuk'}
            </p>
          </div>
        </Link>

        {user && (
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Keluar (Logout)"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </aside>
  );
}
