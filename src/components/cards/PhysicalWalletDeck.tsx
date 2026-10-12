'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Wifi, Wallet, ChevronLeft, ChevronRight, Eye, EyeOff, Plus, CreditCard } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatIDR } from '../../lib/finance/formatters';
import { cn } from '../../lib/utils';
import { Account } from '../../lib/db/types';
import { InstitutionLogo } from '../shared/BankLogos';

export function PhysicalWalletDeck() {
  const { accounts, isPrivacyMode, togglePrivacyMode, setActiveModal } = useFinance();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // If no accounts, provide a default placeholder account
  const displayAccounts: Account[] =
    accounts.length > 0
      ? accounts
      : [
          {
            id: 'default-main',
            user_id: 'default-user',
            name: 'Dompet Utama',
            type: 'cash',
            account_number: '52745678',
            opening_balance: 0,
            current_balance: 0,
            currency: 'IDR',
            color: '#005E9E',
            is_active: true,
            is_archived: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];

  // Helper to format masked card number
  const formatCardNumber = (accNum?: string | null) => {
    if (!accNum) return '•••• •••• 5274 5678';
    const clean = accNum.replace(/[^0-9]/g, '');
    const last4 = clean.slice(-4) || '5678';
    return `•••• •••• •••• ${last4}`;
  };

  // Determine dynamic gradient theme per account
  const getCardTheme = (acc: Account, index: number) => {
    const search = `${acc.name} ${acc.institution_name || ''}`.toLowerCase();
    if (search.includes('bca')) {
      return 'from-[#003B73] via-[#005E9E] to-[#002244] border-[#005E9E]/50 text-white';
    }
    if (search.includes('mandiri')) {
      return 'from-[#001D4A] via-[#002D62] to-[#0A1128] border-[#002D62]/50 text-white';
    }
    if (search.includes('bri')) {
      return 'from-[#003366] via-[#00529B] to-[#001f3f] border-[#00529B]/50 text-white';
    }
    if (search.includes('seabank') || search.includes('sea bank')) {
      return 'from-[#E04B16] via-[#F15A24] to-[#C93C08] border-[#F15A24]/60 text-white';
    }
    if (search.includes('allobank') || search.includes('allo bank')) {
      return 'from-[#002244] via-[#004F9F] to-[#001830] border-[#004F9F]/60 text-white';
    }
    if (search.includes('gopay')) {
      return 'from-[#005C8A] via-[#0081A7] to-[#003852] border-[#00AED6]/50 text-white';
    }
    if (search.includes('dana')) {
      return 'from-[#1169BA] via-[#108EE9] to-[#0C4F85] border-[#108EE9]/50 text-white';
    }
    if (search.includes('ovo')) {
      return 'from-[#3A1864] via-[#4C1E87] to-[#240C44] border-[#4C1E87]/50 text-white';
    }

    const fallbackGradients = [
      'from-zinc-900 via-zinc-800 to-black border-zinc-700/60 text-white',
      'from-emerald-800 via-emerald-900 to-zinc-950 border-emerald-600/40 text-white',
      'from-blue-900 via-indigo-950 to-black border-blue-600/40 text-white',
      'from-purple-900 via-zinc-900 to-black border-purple-600/40 text-white',
    ];
    return fallbackGradients[index % fallbackGradients.length];
  };

  // Track horizontal scroll position to update active index
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, offsetWidth } = scrollContainerRef.current;
    if (offsetWidth > 0) {
      const newIndex = Math.round(scrollLeft / (offsetWidth * 0.85));
      setActiveIndex(Math.min(Math.max(newIndex, 0), displayAccounts.length - 1));
    }
  };

  const scrollToCard = (index: number) => {
    if (!scrollContainerRef.current) return;
    const cardWidth = scrollContainerRef.current.offsetWidth * 0.88;
    scrollContainerRef.current.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth',
    });
    setActiveIndex(index);
  };

  const handleNext = () => {
    const nextIdx = (activeIndex + 1) % displayAccounts.length;
    scrollToCard(nextIdx);
  };

  const handlePrev = () => {
    const prevIdx = (activeIndex - 1 + displayAccounts.length) % displayAccounts.length;
    scrollToCard(prevIdx);
  };

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold tracking-tight text-foreground">
            My Wallet
          </h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {displayAccounts.length} Rekening
          </span>
        </div>

        <div className="flex items-center gap-1">
          {displayAccounts.length > 1 && (
            <div className="mr-1 hidden sm:flex items-center gap-1">
              <button
                onClick={handlePrev}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card/60 text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95"
                aria-label="Geser ke kiri"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleNext}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card/60 text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95"
                aria-label="Geser ke kanan"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={togglePrivacyMode}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95"
            aria-label={isPrivacyMode ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
            title={isPrivacyMode ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
          >
            {isPrivacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setActiveModal('account')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95"
            aria-label="Tambah rekening atau dompet"
            title="Tambah rekening"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Swipeable Horizontal Scroll Cards Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex gap-3.5 overflow-x-auto pb-2 pt-1 scroll-smooth snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {displayAccounts.map((acc, idx) => {
          const cardTheme = getCardTheme(acc, idx);
          const searchStr = `${acc.name} ${acc.institution_name || ''}`;
          const brandLogo = InstitutionLogo({ name: searchStr, className: 'h-6 w-auto', variant: 'card' });

          return (
            <div
              key={acc.id}
              className="relative min-w-[305px] max-w-[340px] w-[86vw] sm:w-[340px] shrink-0 snap-center transition-transform duration-300"
            >
              {/* Luxury Virtual Card Frame */}
              <div
                className={cn(
                  'relative flex h-[200px] sm:h-[208px] flex-col justify-between rounded-2xl sm:rounded-3xl border p-5 shadow-xl transition-all duration-300 select-none overflow-hidden bg-gradient-to-br',
                  cardTheme
                )}
              >
                {/* Specular lighting gloss */}
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
                <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-black/30 blur-2xl" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                {/* Top row: Clean Contactless Icon on Left, Official Bank Logo on Right */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 rotate-90 text-white/80" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/75 bg-white/10 px-2 py-0.5 rounded-full">
                      {acc.type.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-end shrink-0 max-w-[140px]">
                    {brandLogo || (
                      <span className="text-xs font-bold tracking-wide text-white drop-shadow-xs truncate">
                        {acc.institution_name || acc.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle row: Balance & Account Type */}
                <div className="my-auto py-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 block mb-0.5">
                    {acc.name}
                  </span>
                  <div className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                    {isPrivacyMode ? 'Rp •••••••' : formatIDR(acc.current_balance)}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/75 bg-white/15 px-1.5 py-0.5 rounded backdrop-blur-xs">
                      {acc.type.toUpperCase()}
                    </span>
                    {acc.institution_name && (
                      <span className="text-[10px] text-white/70 truncate max-w-[160px]">
                        {acc.institution_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom row: Masked Account Number & Card Emblem */}
                <div className="flex items-end justify-between pt-1">
                  <div>
                    <div className="font-mono text-xs tracking-wider text-white/90 font-medium">
                      {formatCardNumber(acc.account_number)}
                    </div>
                    <span className="text-[9px] uppercase tracking-wider text-white/60 font-semibold block">
                      DEBIT CARD
                    </span>
                  </div>

                  {/* Overlapping Mastercard/Visa-style emblem */}
                  <div className="flex items-center">
                    <div className="h-5 w-5 rounded-full bg-rose-500/90 shadow-xs" />
                    <div className="-ml-2.5 h-5 w-5 rounded-full bg-amber-400/90 backdrop-blur-sm shadow-xs" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Account Card at the end of swipe list */}
        <div
          onClick={() => setActiveModal('account')}
          className="relative min-w-[180px] max-w-[200px] shrink-0 snap-center cursor-pointer group"
        >
          <div className="flex h-[200px] sm:h-[208px] flex-col items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-dashed border-border/80 bg-muted/20 p-5 text-center transition-all duration-200 group-hover:border-primary/60 group-hover:bg-muted/40 active:scale-98">
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-foreground">
              Tambah Rekening
            </span>
            <span className="mt-0.5 text-[10px] text-muted-foreground">
              Bank atau e-wallet baru
            </span>
          </div>
        </div>
      </div>

      {/* Synchronized Pagination Dots Indicator */}
      {displayAccounts.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {displayAccounts.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToCard(i)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === activeIndex
                  ? 'w-6 bg-primary'
                  : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60'
              )}
              aria-label={`Pilih kartu ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
