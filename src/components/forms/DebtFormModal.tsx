'use client';

import React, { useState, useEffect } from 'react';
import { X, CreditCard } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatIDR } from '../../lib/finance/formatters';
import { calculateInstallment } from '../../lib/finance/calculations';
import { DebtInterestType, DebtType } from '../../lib/db/types';
import { cn, generateUUID } from '../../lib/utils';

export function DebtFormModal() {
  const { activeModal, setActiveModal, debts, accounts, saveDebt, recordDebtPayment, user, selectedDebt: initialSelectedDebt } = useFinance();

  const activeDebts = debts.filter((d) => d.status !== 'paid_off');

  const [mode, setMode] = useState<'create' | 'payment'>('create');

  // Create form
  const [creditorName, setCreditorName] = useState('');
  const [debtName, setDebtName] = useState('');
  const [debtType, setDebtType] = useState<DebtType>('installment');
  const [principalStr, setPrincipalStr] = useState('');
  const [interestRate, setInterestRate] = useState('8.5');
  const [interestType, setInterestType] = useState<DebtInterestType>('flat');
  const [tenorMonths, setTenorMonths] = useState('12');
  const [dueDay, setDueDay] = useState('5');
  const [paymentAccountId, setPaymentAccountId] = useState(accounts[0]?.id || '');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Payment form
  const [selectedDebtId, setSelectedDebtId] = useState(activeDebts[0]?.id || '');
  const [paymentPrincipalStr, setPaymentPrincipalStr] = useState('');
  const [paymentInterestStr, setPaymentInterestStr] = useState('0');
  const [payingAccountId, setPayingAccountId] = useState(accounts[0]?.id || '');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialSelectedDebt) {
      setMode('payment');
      setSelectedDebtId(initialSelectedDebt.id);
      if (initialSelectedDebt.monthly_installment > 0) {
        setPaymentPrincipalStr(new Intl.NumberFormat('id-ID').format(initialSelectedDebt.monthly_installment));
      }
    }
  }, [initialSelectedDebt]);

  if (activeModal !== 'debt') return null;

  const rawPrincipal = parseFloat(principalStr.replace(/[^0-9]/g, '')) || 0;
  const numRate = parseFloat(interestRate) || 0;
  const numTenor = parseInt(tenorMonths, 10) || 12;

  const installmentCalc = calculateInstallment(rawPrincipal, numRate, numTenor, interestType);

  const selectedDebt = debts.find((d) => d.id === selectedDebtId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditorName.trim() || !debtName.trim()) {
      setError('Nama kreditor dan nama cicilan wajib diisi');
      return;
    }
    if (rawPrincipal <= 0) {
      setError('Pokok pinjaman harus lebih dari 0');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const activeUid = user?.id || accounts[0]?.user_id || 'user_local';
      const debtId = generateUUID();
      await saveDebt({
        id: debtId,
        user_id: activeUid,
        creditor_name: creditorName.trim(),
        debt_name: debtName.trim(),
        type: debtType,
        original_principal: rawPrincipal,
        current_principal: rawPrincipal,
        interest_rate: numRate,
        interest_type: interestType,
        tenor_months: numTenor,
        monthly_installment: installmentCalc.monthlyInstallment,
        due_day: parseInt(dueDay, 10) || 1,
        remaining_installments: numTenor,
        payment_account_id: paymentAccountId,
        status: 'active',
        start_date: startDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      setActiveModal(null);
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Gagal menyimpan data cicilan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) {
      setError('Pilih cicilan yang akan dibayar');
      return;
    }

    const rawPrincipalPaid = parseFloat(paymentPrincipalStr.replace(/[^0-9]/g, '')) || 0;
    const rawInterestPaid = parseFloat(paymentInterestStr.replace(/[^0-9]/g, '')) || 0;
    const totalPaid = rawPrincipalPaid + rawInterestPaid;

    if (totalPaid <= 0) {
      setError('Nominal pembayaran harus lebih dari 0');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const activeUid = user?.id || accounts[0]?.user_id || 'user_local';
      const nextInstNum = (selectedDebt.tenor_months - selectedDebt.remaining_installments) + 1;
      await recordDebtPayment({
        user_id: activeUid,
        debt_id: selectedDebt.id,
        account_id: payingAccountId,
        payment_date: new Date(paymentDate).toISOString(),
        installment_number: nextInstNum,
        principal_paid: rawPrincipalPaid,
        interest_paid: rawInterestPaid,
        fee_paid: 0,
        total_amount: totalPaid,
        notes: `Pembayaran cicilan ke-${nextInstNum}`,
      });

      setActiveModal(null);
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Gagal mencatat pembayaran cicilan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={() => setActiveModal(null)}
    >
      <div
        className="w-full max-w-md max-h-[92dvh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-2xl border-t sm:border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/25" />
        </div>

        <div className="flex items-center justify-between border-b border-border/80 px-5 py-3.5 sm:px-6 sm:py-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Cicilan & Hutang</h2>
              <p className="text-[11px] text-muted-foreground">Pemisahan akuntansi pokok vs bunga</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={cn(
                'rounded-xl py-2 text-xs font-bold transition',
                mode === 'create' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              Tambah Cicilan Baru
            </button>
            <button
              type="button"
              onClick={() => setMode('payment')}
              className={cn(
                'rounded-xl py-2 text-xs font-bold transition',
                mode === 'payment' ? 'bg-rose-600 text-white shadow-sm' : 'text-muted-foreground'
              )}
            >
              Bayar Cicilan
            </button>
          </div>

          {error && (
            <div className="mb-3 rounded-xl bg-rose-500/10 p-3 text-xs font-medium text-rose-600">
              {error}
            </div>
          )}

          {mode === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">Nama Cicilan</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Honda Vario 160"
                    value={debtName}
                    onChange={(e) => setDebtName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">Kreditor / Finance</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FIF Group"
                    value={creditorName}
                    onChange={(e) => setCreditorName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">Jenis Kewajiban</label>
                  <select
                    value={debtType}
                    onChange={(e) => setDebtType(e.target.value as DebtType)}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs"
                  >
                    <option value="installment">Cicilan Kendaraan/Barang</option>
                    <option value="bnpl">Buy Now Pay Later (BNPL)</option>
                    <option value="credit_card">Kartu Kredit</option>
                    <option value="mortgage">KPR / Rumah</option>
                    <option value="personal_loan">KTA / Pinjaman Pribadi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">Metode Bunga</label>
                  <select
                    value={interestType}
                    onChange={(e) => setInterestType(e.target.value as DebtInterestType)}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs"
                  >
                    <option value="flat">Flat (Tetap)</option>
                    <option value="effective">Efektif / Anuitas</option>
                    <option value="none">Bunga 0% (Tanpa Bunga)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground">Pokok Hutang Awal (IDR)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="0"
                  value={principalStr}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setPrincipalStr(val ? new Intl.NumberFormat('id-ID').format(Number(val)) : '');
                  }}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 font-mono text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">Bunga/Thn (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">Tenor (Bulan)</label>
                  <input
                    type="number"
                    min="1"
                    value={tenorMonths}
                    onChange={(e) => setTenorMonths(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">Jatuh Tempo (Tgl)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">Rekening Pembayaran Default</label>
                  <select
                    value={paymentAccountId}
                    onChange={(e) => setPaymentAccountId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs"
                  >
                    <option value="">-- Tanpa Rekening Khusus --</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">Tanggal Mulai Pinjaman</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-mono"
                  />
                </div>
              </div>

              {rawPrincipal > 0 && (
                <div className="rounded-2xl border border-border bg-muted/50 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Estimasi Cicilan per Bulan:</span>
                    <span className="font-mono font-bold text-foreground">
                      {formatIDR(installmentCalc.monthlyInstallment)}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-primary py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-primary/90 active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Kewajiban Cicilan'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground">Pilih Cicilan</label>
                <select
                  value={selectedDebtId}
                  onChange={(e) => {
                    setSelectedDebtId(e.target.value);
                    const d = debts.find((x) => x.id === e.target.value);
                    if (d) {
                      setPaymentPrincipalStr(new Intl.NumberFormat('id-ID').format(d.monthly_installment));
                    }
                  }}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium"
                >
                  {activeDebts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.debt_name} ({d.creditor_name}) — Sisa: {formatIDR(d.current_principal)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">Pokok Hutang (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="0"
                    value={paymentPrincipalStr}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setPaymentPrincipalStr(val ? new Intl.NumberFormat('id-ID').format(Number(val)) : '');
                    }}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">Porsi Bunga (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={paymentInterestStr}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setPaymentInterestStr(val ? new Intl.NumberFormat('id-ID').format(Number(val)) : '');
                    }}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground">Rekening Pembayaran</label>
                <select
                  value={payingAccountId}
                  onChange={(e) => setPayingAccountId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatIDR(acc.current_balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground">Tanggal Pembayaran</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-rose-600 py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-rose-700 active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? 'Memproses...' : 'Catat Pembayaran Cicilan'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
