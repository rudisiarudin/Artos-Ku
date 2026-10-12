'use client';

import React, { useState } from 'react';
import { X, HandCoins, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatIDR } from '../../lib/finance/formatters';
import { cn, generateUUID } from '../../lib/utils';

export function ReceivableFormModal() {
  const {
    activeModal,
    setActiveModal,
    receivables,
    accounts,
    saveReceivable,
    recordReceivablePayment,
    addTransaction,
    user,
  } = useFinance();

  const activeReceivables = receivables.filter((r) => r.status !== 'paid');

  const [mode, setMode] = useState<'create' | 'payment'>('create');
  // Create fields
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [principalStr, setPrincipalStr] = useState('');
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [purpose, setPurpose] = useState('');

  // Payment fields
  const [selectedRecId, setSelectedRecId] = useState(activeReceivables[0]?.id || '');
  const [paymentAmountStr, setPaymentAmountStr] = useState('');
  const [receivingAccountId, setReceivingAccountId] = useState(accounts[0]?.id || '');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (activeModal !== 'receivable') return null;

  const rawPrincipal = parseFloat(principalStr.replace(/[^0-9]/g, '')) || 0;
  const rawPayment = parseFloat(paymentAmountStr.replace(/[^0-9]/g, '')) || 0;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName.trim()) {
      setError('Nama peminjam wajib diisi');
      return;
    }
    if (rawPrincipal <= 0) {
      setError('Nominal pinjaman harus lebih dari 0');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const activeUid = user?.id || accounts[0]?.user_id || 'user_local';
      const recId = generateUUID();
      await saveReceivable({
        id: recId,
        user_id: activeUid,
        borrower_name: borrowerName.trim(),
        borrower_phone: borrowerPhone.trim() || null,
        principal_amount: rawPrincipal,
        current_balance: rawPrincipal,
        interest_rate: 0,
        loan_date: loanDate,
        due_date: dueDate,
        status: 'unpaid',
        account_id: accountId,
        purpose: purpose.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Deduct disbursement account
      await addTransaction({
        user_id: activeUid,
        date: new Date(loanDate).toISOString(),
        type: 'receivable_disbursement',
        amount: rawPrincipal,
        source_account_id: accountId,
        destination_account_id: null,
        category_id: null,
        description: `Pemberian Pinjaman kepada ${borrowerName.trim()}`,
        notes: purpose || 'Pemberian piutang',
        reference_id: recId,
        tags: ['piutang'],
      });

      setActiveModal(null);
    } catch (err: any) {
      setError(err?.message || 'Gagal mencatat piutang');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecId) {
      setError('Pilih piutang yang akan dibayar');
      return;
    }
    if (rawPayment <= 0) {
      setError('Nominal pembayaran harus lebih dari 0');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const activeUid = user?.id || accounts[0]?.user_id || 'user_local';
      await recordReceivablePayment({
        user_id: activeUid,
        receivable_id: selectedRecId,
        account_id: receivingAccountId,
        payment_date: new Date(paymentDate).toISOString(),
        principal_paid: rawPayment,
        interest_paid: 0,
        total_received: rawPayment,
        notes: 'Pelunasan / cicilan piutang',
      });

      setActiveModal(null);
    } catch (err: any) {
      setError(err?.message || 'Gagal mencatat pelunasan piutang');
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
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <HandCoins className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Kelola Piutang (Receivables)</h2>
              <p className="text-[11px] text-muted-foreground">Catat uang yang dipinjamkan ke orang lain</p>
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
          {/* Mode Switcher */}
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={cn(
                'rounded-xl py-2 text-xs font-bold transition',
                mode === 'create' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              Pinjamkan Uang Baru
            </button>
            <button
              type="button"
              onClick={() => setMode('payment')}
              className={cn(
                'rounded-xl py-2 text-xs font-bold transition',
                mode === 'payment' ? 'bg-amber-600 text-white shadow-sm' : 'text-muted-foreground'
              )}
            >
              Catat Pengembalian
            </button>
          </div>

          {error && (
            <div className="mb-3 rounded-xl bg-rose-500/10 p-3 text-xs font-medium text-rose-600">
              {error}
            </div>
          )}

          {mode === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground">Nama Peminjam</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dimas Pratama"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground">No. Telepon / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="0812xxxxxxx"
                  value={borrowerPhone}
                  onChange={(e) => setBorrowerPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground">Nominal Pinjaman</label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">Tanggal Pinjam</label>
                  <input
                    type="date"
                    value={loanDate}
                    onChange={(e) => setLoanDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground">Jatuh Tempo</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground">Sumber Dana Rekening</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
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
                <label className="block text-xs font-semibold text-muted-foreground">Tujuan Pinjaman / Catatan</label>
                <input
                  type="text"
                  placeholder="Biaya darurat / servis kendaraan"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-primary py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-primary/90 active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Catatan Piutang'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground">Pilih Piutang</label>
                <select
                  value={selectedRecId}
                  onChange={(e) => setSelectedRecId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium"
                >
                  {activeReceivables.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.borrower_name} — Sisa: {formatIDR(r.current_balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground">Nominal yang Dikembalikan</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="0"
                  value={paymentAmountStr}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setPaymentAmountStr(val ? new Intl.NumberFormat('id-ID').format(Number(val)) : '');
                  }}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground">Rekening Penerima Dana</label>
                <select
                  value={receivingAccountId}
                  onChange={(e) => setReceivingAccountId(e.target.value)}
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
                <label className="block text-xs font-semibold text-muted-foreground">Tanggal Penerimaan</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs"
                />
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-muted-foreground">
                Pengembalian dana pokok akan langsung menambah saldo rekening dan mengurangi piutang tanpa dihitung sebagai pendapatan konsumtif biasa.
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-amber-600 py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-amber-700 active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? 'Memproses...' : 'Catat Pelunasan Piutang'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
