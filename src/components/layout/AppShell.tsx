'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { DesktopSidebar } from './DesktopSidebar';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { TransactionFormModal } from '../forms/TransactionFormModal';
import { StockTradeModal } from '../forms/StockTradeModal';
import { CryptoTradeModal } from '../forms/CryptoTradeModal';
import { ReceivableFormModal } from '../forms/ReceivableFormModal';
import { DebtFormModal } from '../forms/DebtFormModal';
import { AccountFormModal } from '../forms/AccountFormModal';
import { PortfolioModal } from '../forms/PortfolioModal';
import { ServiceWorkerRegister } from '../shared/ServiceWorkerRegister';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Clean, focused layout for auth & onboarding flows
  const isAuthOrOnboarding =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/onboarding');

  if (isAuthOrOnboarding) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main>{children}</main>
        <ServiceWorkerRegister />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop Navigation Sidebar */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6">
        <AppHeader />
        <main className="flex-1 px-4 py-3 sm:px-6 sm:py-6">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav />

      {/* Global Financial Modals */}
      <TransactionFormModal />
      <StockTradeModal />
      <CryptoTradeModal />
      <ReceivableFormModal />
      <DebtFormModal />
      <AccountFormModal />
      <PortfolioModal />
      <ServiceWorkerRegister />
    </div>
  );
}
