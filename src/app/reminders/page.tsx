'use client';

import React from 'react';
import { Bell, CheckCircle2, Clock, AlertTriangle, CreditCard, HandCoins } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatIndonesianDate } from '../../lib/finance/formatters';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export default function RemindersPage() {
  const { reminders, toggleReminder } = useFinance();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Pengingat & Notifikasi Finansial
        </h2>
        <p className="text-xs text-muted-foreground">
          Peringatan tanggal jatuh tempo cicilan, penagihan piutang, dan evaluasi anggaran
        </p>
      </div>

      <Card className="overflow-hidden shadow-sm">
        {reminders.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Tidak ada pengingat saat ini.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {reminders.map((rem) => {
              const isDue = new Date(rem.due_date).getTime() < new Date().getTime();

              return (
                <div
                  key={rem.id}
                  className={`flex items-start justify-between gap-4 p-5 transition ${
                    rem.is_completed ? 'bg-muted/10 opacity-60' : 'hover:bg-muted/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleReminder(rem.id)}
                      className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg border transition ${
                        rem.is_completed
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-border bg-background hover:border-primary'
                      }`}
                    >
                      {rem.is_completed && <CheckCircle2 className="h-4 w-4" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          className={`text-sm font-semibold ${
                            rem.is_completed
                              ? 'line-through text-muted-foreground'
                              : 'text-foreground'
                          }`}
                        >
                          {rem.title}
                        </h3>
                        <Badge
                          variant={
                            rem.type === 'installment'
                              ? 'destructive'
                              : rem.type === 'receivable'
                              ? 'warning'
                              : 'secondary'
                          }
                          className="text-[10px]"
                        >
                          {rem.type === 'installment'
                            ? 'Cicilan'
                            : rem.type === 'receivable'
                            ? 'Piutang'
                            : 'Anggaran'}
                        </Badge>
                      </div>

                      {rem.message && (
                        <p className="mt-1 text-xs text-muted-foreground">{rem.message}</p>
                      )}

                      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Jatuh Tempo: {formatIndonesianDate(rem.due_date, 'time')}</span>
                      </div>
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
