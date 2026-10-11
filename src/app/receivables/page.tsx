'use client';

import React from 'react';
import { HandCoins, Plus, Calendar, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatIDR, formatIndonesianDate } from '../../lib/finance/formatters';
import { CurrencyDisplay } from '../../components/shared/CurrencyDisplay';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export default function ReceivablesPage() {
  const { receivables, netWorthData, setActiveModal } = useFinance();

  const totalOutstanding = netWorthData.totalReceivables;
  const activeCount = receivables.filter((r) => r.status !== 'paid').length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-foreground sm:text-2xl">
            Manajemen Piutang (Receivables)
          </h2>
          <p className="text-xs text-muted-foreground">
            Pantau uang yang Anda pinjamkan kepada orang lain dan riwayat pelunasan
          </p>
        </div>

        <Button
          onClick={() => setActiveModal('receivable')}
          className="w-full sm:w-auto gap-1.5 text-xs sm:text-sm font-bold shadow-sm h-10 justify-center"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>Catat / Pelunasan Piutang</span>
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Piutang Belum Tertagih
            </span>
            <div className="mt-1 font-mono text-2xl font-bold text-amber-600 dark:text-amber-400 sm:text-3xl">
              {formatIDR(totalOutstanding)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Dari {activeCount} orang peminjam aktif
            </p>
          </div>
        </div>
      </Card>

      {/* Receivables List */}
      <Card className="overflow-hidden shadow-sm">
        {receivables.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Tidak ada data piutang yang tercatat.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {receivables.map((rec) => {
              const isPaid = rec.status === 'paid';
              const isOverdue =
                !isPaid && new Date(rec.due_date).getTime() < new Date().getTime();

              return (
                <div key={rec.id} className="p-5 transition hover:bg-muted/20">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">{rec.borrower_name}</h3>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            isPaid
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : isOverdue
                              ? 'bg-rose-500/10 text-rose-600'
                              : rec.status === 'partially_paid'
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-blue-500/10 text-blue-600'
                          }`}
                        >
                          {isPaid
                            ? 'Lunas'
                            : isOverdue
                            ? 'Jatuh Tempo (Overdue)'
                            : rec.status === 'partially_paid'
                            ? 'Dicicil Sebagian'
                            : 'Belum Dibayar'}
                        </span>
                      </div>

                      {rec.borrower_phone && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{rec.borrower_phone}</span>
                        </div>
                      )}

                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        <span>Pinjaman: {formatIndonesianDate(rec.loan_date, 'short')}</span>
                        <span>Jatuh Tempo: {formatIndonesianDate(rec.due_date, 'medium')}</span>
                        {rec.purpose && <span>Tujuan: {rec.purpose}</span>}
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end border-t border-border/40 pt-2 sm:border-0 sm:pt-0">
                      <span className="text-xs text-muted-foreground">Sisa Piutang:</span>
                      <div className="font-mono text-base font-bold text-foreground">
                        {formatIDR(rec.current_balance)}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        Pokok Awal: {formatIDR(rec.principal_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
