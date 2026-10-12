'use client';

import React from 'react';
import {
  Landmark,
  Plus,
  ArrowLeftRight,
  Wallet,
  CreditCard,
  Building,
  Smartphone,
  Pencil,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { CurrencyDisplay } from '../../components/shared/CurrencyDisplay';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export default function AccountsPage() {
  const { accounts, netWorthData, setActiveModal, setEditingAccount, deleteAccount } = useFinance();

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return Landmark;
      case 'ewallet':
        return Smartphone;
      case 'cash':
        return Wallet;
      case 'brokerage':
        return Building;
      default:
        return CreditCard;
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-foreground sm:text-2xl">
            Rekening & Dompet Keuangan
          </h2>
          <p className="text-xs text-muted-foreground">
            Kelola seluruh rekening bank, e-wallet, dompet tunai, dan rekening dana investor (RDI)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
          <Button
            variant="outline"
            onClick={() => setActiveModal('transaction')}
            className="gap-1.5 text-xs h-10 px-3 w-full sm:w-auto justify-center"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>Transfer</span>
            <span className="hidden sm:inline">Antar Rekening</span>
          </Button>

          <Button
            onClick={() => {
              setEditingAccount(null);
              setActiveModal('account');
            }}
            className="gap-1.5 text-xs font-bold shadow-sm h-10 px-3 w-full sm:w-auto justify-center cursor-pointer"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Tambah Rekening</span>
          </Button>
        </div>
      </div>

      {/* Summary Banner */}
      <Card className="p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Saldo Likuid & Tabungan
            </span>
            <div className="mt-1">
              <CurrencyDisplay amount={netWorthData.totalCash} size="xl" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Tersedia di {accounts.length} akun finansial aktif
            </p>
          </div>
        </div>
      </Card>

      {/* Accounts List */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((acc) => {
          const Icon = getAccountIcon(acc.type);

          return (
            <Card
              key={acc.id}
              className="flex flex-col justify-between p-5 shadow-sm transition hover:border-foreground/20"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                      {acc.type.replace('_', ' ')}
                    </Badge>
                    <button
                      onClick={() => {
                        setEditingAccount(acc);
                        setActiveModal('account');
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                      title="Ubah Rekening / Saldo"
                      aria-label="Ubah Rekening"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm(`Hapus rekening "${acc.name}"? Saldo akan disesuaikan secara otomatis.`)) {
                          await deleteAccount(acc.id);
                        }
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition cursor-pointer"
                      title="Hapus Rekening"
                      aria-label="Hapus Rekening"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-bold text-foreground">{acc.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {acc.institution_name || 'Dompet Pribadi'}
                  </p>
                  {acc.account_number && (
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground/80">
                      No: {acc.account_number}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 border-t border-border/60 pt-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-muted-foreground">Saldo Saat Ini</span>
                  <div className="mt-0.5">
                    <CurrencyDisplay amount={acc.current_balance} size="lg" />
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingAccount(acc);
                    setActiveModal('account');
                  }}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Ubah Saldo
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
