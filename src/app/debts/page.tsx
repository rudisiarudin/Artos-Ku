'use client';

import React from 'react';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatIDR } from '../../lib/finance/formatters';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export default function DebtsPage() {
  const { debts, netWorthData, setActiveModal, setSelectedDebt, deleteDebt } = useFinance();

  const totalOutstanding = netWorthData.totalDebts;
  const activeDebts = debts.filter((d) => d.status !== 'paid_off');
  const totalMonthlyCommitment = activeDebts.reduce(
    (sum, d) => sum + Number(d.monthly_installment || 0),
    0
  );

  const handleOpenCreate = () => {
    setSelectedDebt(null);
    setActiveModal('debt');
  };

  const handleOpenPayment = (debt: (typeof debts)[0]) => {
    setSelectedDebt(debt);
    setActiveModal('debt');
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-foreground sm:text-2xl">
            Cicilan & Kewajiban Hutang (Liabilities)
          </h2>
          <p className="text-xs text-muted-foreground">
            Kelola cicilan motor/mobil, smartphone, KPR, kartu kredit, dan BNPL
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto gap-1.5 text-xs sm:text-sm font-bold shadow-sm h-10 justify-center"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>Tambah Cicilan Baru</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-6 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Sisa Pokok Hutang
          </span>
          <div className="mt-1 font-mono text-2xl font-bold text-rose-600 dark:text-rose-400 sm:text-3xl">
            {formatIDR(totalOutstanding)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Kewajiban liabilitas aktif yang mengurangi Net Worth
          </p>
        </Card>

        <Card className="p-6 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Beban Komitmen Cicilan per Bulan
          </span>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            {formatIDR(totalMonthlyCommitment)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Total angsuran wajib setiap bulan untuk {activeDebts.length} kewajiban
          </p>
        </Card>
      </div>

      {/* Debts List */}
      <div className="space-y-4">
        {debts.map((debt) => {
          const isPaidOff = debt.status === 'paid_off';
          const progressPercent = debt.original_principal > 0
            ? Math.min(100, Math.round(((debt.original_principal - debt.current_principal) / debt.original_principal) * 100))
            : 100;

          return (
            <Card
              key={debt.id}
              className="p-5 shadow-sm transition hover:border-foreground/20"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <CreditCard className="h-5 w-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{debt.debt_name}</h3>
                      <Badge
                        variant={isPaidOff ? 'success' : 'destructive'}
                        className="text-[10px]"
                      >
                        {isPaidOff ? 'Lunas' : 'Aktif Berjalan'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Kreditor: {debt.creditor_name} • Tipe: {debt.type}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span>Jatuh Tempo: Tgl {debt.due_day} tiap bulan</span>
                      <span>Bunga: {debt.interest_rate}% ({debt.interest_type})</span>
                      <span>Sisa Tenor: {debt.remaining_installments} dari {debt.tenor_months} bulan</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end border-t border-border/40 pt-2 sm:border-0 sm:pt-0 gap-1.5">
                  <div className="text-right sm:text-right">
                    <span className="text-xs text-muted-foreground block">Cicilan Bulanan:</span>
                    <div className="font-mono text-base font-bold text-foreground">
                      {formatIDR(debt.monthly_installment)}
                    </div>
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold block">
                      Sisa Pokok: {formatIDR(debt.current_principal)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    {!isPaidOff && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenPayment(debt)}
                        className="h-8 text-xs font-semibold px-3 cursor-pointer"
                      >
                        Bayar Angsuran
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Hapus kewajiban cicilan "${debt.debt_name}"?`)) {
                          deleteDebt(debt.id);
                        }
                      }}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                      title="Hapus Cicilan"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 border-t border-border/40 pt-3">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Progress Pelunasan: {progressPercent}%</span>
                  <span>Awal: {formatIDR(debt.original_principal)}</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
