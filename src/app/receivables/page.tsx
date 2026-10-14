'use client';

import React from 'react';
import { HandCoins, Plus, Phone, Trash2, FolderOpen } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatIDR, formatIndonesianDate } from '../../lib/finance/formatters';
import { Receivable } from '../../lib/db/types';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';

export default function ReceivablesPage() {
  const { receivables, netWorthData, setActiveModal, setSelectedReceivable, deleteReceivable } = useFinance();

  const totalOutstanding = netWorthData.totalReceivables;
  const activeCount = receivables.filter((r) => r.status !== 'paid').length;

  const handleOpenPayment = (rec: Receivable) => {
    setSelectedReceivable(rec);
    setActiveModal('receivable');
  };

  const handleCreateNew = () => {
    setSelectedReceivable(null);
    setActiveModal('receivable');
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Kelola Piutang (Receivables)
          </h2>
          <p className="text-xs text-muted-foreground">
            Pantau uang yang Anda pinjamkan kepada orang lain dan riwayat pelunasan
          </p>
        </div>

        <Button
          onClick={handleCreateNew}
          className="gap-1.5 text-xs h-9 px-3.5 font-semibold"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Pinjamkan Uang Baru</span>
        </Button>
      </div>

      {/* Summary Cards (Shadcn/ui zinc) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Piutang Belum Tertagih
          </span>
          <div className="mt-1.5 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            {formatIDR(totalOutstanding)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Dari {activeCount} orang peminjam aktif
          </p>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Status Pelunasan Piutang
          </span>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-medium">
              {receivables.filter((r) => r.status === 'paid').length} Lunas
            </Badge>
            <Badge variant="outline" className="text-xs font-medium">
              {activeCount} Belum Lunas
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Uang yang masuk otomatis menambah saldo rekening tujuan Anda.
          </p>
        </Card>
      </div>

      {/* Receivables List */}
      <div className="space-y-3">
        {receivables.length === 0 ? (
          <Card className="p-10 text-center space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Belum Ada Catatan Piutang
              </p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                Catat saat Anda meminjamkan uang ke teman atau keluarga agar tidak lupa ditagih dan saldo keuangan tetap rapi.
              </p>
            </div>
            <Button
              onClick={handleCreateNew}
              className="text-xs h-9 font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Pinjamkan Uang Baru
            </Button>
          </Card>
        ) : (
          receivables.map((rec) => {
            const isPaid = rec.status === 'paid';
            const isOverdue =
              !isPaid && new Date(rec.due_date).getTime() < new Date().getTime();

            return (
              <Card
                key={rec.id}
                className="p-4 sm:p-5 transition hover:border-border/90"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left Column: Borrower details */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground">
                      <HandCoins className="h-4 w-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">
                          {rec.borrower_name}
                        </h3>
                        <Badge
                          variant={isPaid ? 'secondary' : isOverdue ? 'destructive' : 'outline'}
                          className={cn(
                            'text-[10px] px-1.5 py-0',
                            isPaid && 'text-emerald-600 dark:text-emerald-400',
                            rec.status === 'partially_paid' && 'text-amber-600 dark:text-amber-400'
                          )}
                        >
                          {isPaid
                            ? 'Lunas'
                            : isOverdue
                            ? 'Jatuh Tempo'
                            : rec.status === 'partially_paid'
                            ? 'Dicicil Sebagian'
                            : 'Belum Dibayar'}
                        </Badge>
                      </div>

                      {rec.borrower_phone && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                          <Phone className="h-3 w-3" />
                          <span>{rec.borrower_phone}</span>
                        </div>
                      )}

                      <div className="mt-1 flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
                        <span>Pinjam: {formatIndonesianDate(rec.loan_date, 'short')}</span>
                        <span>•</span>
                        <span>Jatuh Tempo: {formatIndonesianDate(rec.due_date, 'medium')}</span>
                        {rec.purpose && (
                          <>
                            <span>•</span>
                            <span className="italic">{rec.purpose}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Balances & Actions */}
                  <div className="flex flex-col sm:items-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
                    <div className="flex items-baseline justify-between sm:justify-end gap-3 w-full sm:w-auto">
                      <span className="text-[11px] text-muted-foreground">Sisa Piutang:</span>
                      <span className="font-mono text-base font-bold text-foreground">
                        {formatIDR(rec.current_balance)}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Pokok Awal: {formatIDR(rec.principal_amount)}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {!isPaid && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenPayment(rec)}
                          className="h-8 text-xs font-semibold px-3 cursor-pointer"
                        >
                          Bayar / Lunasi
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Hapus catatan piutang ${rec.borrower_name}?`)) {
                            deleteReceivable(rec.id);
                          }
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                        title="Hapus Piutang"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
