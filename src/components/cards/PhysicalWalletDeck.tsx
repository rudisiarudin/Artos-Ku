'use client';

import React, { useState } from 'react';
import { Wifi, Wallet, ChevronLeft, ChevronRight, Eye, EyeOff, MoreHorizontal, Plus } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatIDR } from '../../lib/finance/formatters';
import { cn } from '../../lib/utils';
import { Account } from '../../lib/db/types';
import { InstitutionLogo } from '../shared/BankLogos';

export function PhysicalWalletDeck() {
  const { accounts, isPrivacyMode, togglePrivacyMode, setActiveModal } = useFinance();
  const [activeIndex, setActiveIndex] = useState(0);

  // If no accounts, provide a default placeholder account
  const displayAccounts: Account[] =
    accounts.length > 0
      ? accounts
      : [
          {
            id: 'default-main',
            user_id: 'default-user',
            name: 'Main Wallet',
            type: 'cash',
            account_number: '52745678',
            opening_balance: 0,
            current_balance: 0,
            currency: 'IDR',
            color: '#18181b',
            is_active: true,
            is_archived: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];

  const currentAccount = displayAccounts[activeIndex] || displayAccounts[0];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % displayAccounts.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + displayAccounts.length) % displayAccounts.length);
  };

  // Helper to format masked card number
  const formatCardNumber = (accNum?: string | null) => {
    if (!accNum) return '•••• •••• 5274 5678';
    const clean = accNum.replace(/[^0-9]/g, '');
    const last4 = clean.slice(-4) || '5678';
    return `•••• •••• •••• ${last4}`;
  };

  // Color schemes for physical cards
  const getCardStyle = (index: number) => {
    const cardColorThemes = [
      {
        bg: 'bg-gradient-to-br from-zinc-900 via-zinc-800 to-black text-white border-zinc-700/50',
        chip: 'bg-amber-400/80',
        badge: 'from-rose-500 to-amber-500',
      },
      {
        bg: 'bg-gradient-to-br from-emerald-700 via-emerald-800 to-zinc-950 text-white border-emerald-600/40',
        chip: 'bg-emerald-300/80',
        badge: 'from-emerald-400 to-teal-500',
      },
      {
        bg: 'bg-gradient-to-br from-blue-900 via-indigo-900 to-zinc-950 text-white border-blue-600/40',
        chip: 'bg-blue-300/80',
        badge: 'from-blue-400 to-cyan-500',
      },
      {
        bg: 'bg-gradient-to-br from-purple-900 via-zinc-900 to-black text-white border-purple-600/40',
        chip: 'bg-purple-300/80',
        badge: 'from-purple-400 to-pink-500',
      },
    ];
    return cardColorThemes[index % cardColorThemes.length];
  };

  const currentTheme = getCardStyle(activeIndex);
  const nextTheme1 = getCardStyle(activeIndex + 1);
  const nextTheme2 = getCardStyle(activeIndex + 2);

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base font-bold tracking-tight text-foreground">
          My Wallet
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={togglePrivacyMode}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label={isPrivacyMode ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
            title={isPrivacyMode ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
          >
            {isPrivacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setActiveModal('account')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Tambah rekening atau dompet"
            title="Tambah rekening"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stacked Cards Area */}
      <div className="relative mx-auto max-w-sm sm:max-w-md pt-2 pb-1">
        {/* Decorative Peeking Background Card 2 */}
        {displayAccounts.length > 2 && (
          <div
            className={cn(
              'absolute inset-0 top-0 translate-x-5 -rotate-2 rounded-2xl sm:rounded-3xl border opacity-30 shadow-sm pointer-events-none transition-transform duration-300',
              nextTheme2.bg
            )}
            style={{ height: '200px' }}
          />
        )}

        {/* Decorative Peeking Background Card 1 */}
        {displayAccounts.length > 1 && (
          <div
            className={cn(
              'absolute inset-0 top-1 translate-x-2.5 rotate-1 rounded-2xl sm:rounded-3xl border opacity-60 shadow-md pointer-events-none transition-transform duration-300',
              nextTheme1.bg
            )}
            style={{ height: '200px' }}
          />
        )}

        {/* Foreground Active Physical Card */}
        <div
          className={cn(
            'relative z-10 flex flex-col justify-between rounded-2xl sm:rounded-3xl border p-5 sm:p-6 shadow-xl transition-all duration-300 select-none overflow-hidden',
            currentTheme.bg
          )}
          style={{ height: '205px' }}
        >
          {/* Subtle glossy card reflection effect */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5 blur-2xl" />

          {/* Top row of card */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(() => {
                const searchStr = `${currentAccount.name} ${currentAccount.institution_name || ''}`;
                const brandLogo = InstitutionLogo({ name: searchStr, className: 'h-6 w-auto', variant: 'card' });

                if (brandLogo) {
                  return brandLogo;
                }

                return (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                    <Wallet className="h-4 w-4 text-white" />
                  </div>
                );
              })()}
              <span className="text-xs font-semibold tracking-wide text-white/90">
                {currentAccount.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 rotate-90 text-white/70" />
            </div>
          </div>

          {/* Middle row: Balance & Account Type */}
          <div className="my-auto py-1">
            <div className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              {isPrivacyMode ? 'Rp •••••••' : formatIDR(currentAccount.current_balance)}
            </div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/60">
              {currentAccount.type.toUpperCase()} ACCOUNT
            </div>
          </div>

          {/* Bottom row: Card Number & Mastercard/Visa Emblem */}
          <div className="flex items-end justify-between pt-1">
            <div className="font-mono text-xs tracking-wider text-white/80">
              {formatCardNumber(currentAccount.account_number)}
            </div>

            {/* Overlapping Circles Credit Card Logo */}
            <div className="flex items-center">
              <div className="h-5 w-5 rounded-full bg-rose-500/90" />
              <div className="-ml-2.5 h-5 w-5 rounded-full bg-amber-400/90 backdrop-blur-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Dot Indicators & Navigation */}
      {displayAccounts.length > 1 && (
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            onClick={handlePrev}
            className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground/60 transition hover:text-foreground"
            aria-label="Kartu sebelumnya"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-center gap-1.5">
            {displayAccounts.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-200',
                  i === activeIndex
                    ? 'w-6 bg-foreground'
                    : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                )}
                aria-label={`Pilih kartu ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground/60 transition hover:text-foreground"
            aria-label="Kartu selanjutnya"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
