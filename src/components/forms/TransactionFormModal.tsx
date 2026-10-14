'use client';

import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { TransactionType } from '../../lib/db/types';
import { formatIDR } from '../../lib/finance/formatters';
import { cn } from '../../lib/utils';

export function TransactionFormModal() {
  const { activeModal, setActiveModal, accounts, categories, addTransaction, user } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState(accounts[0]?.id || '');
  const [destinationAccountId, setDestinationAccountId] = useState(accounts[1]?.id || '');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('qris');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (!sourceAccountId && accounts.length > 0) {
      setSourceAccountId(accounts[0].id);
    }
  }, [accounts, sourceAccountId]);

  if (activeModal !== 'transaction') return null;

  const rawAmount = parseFloat(amountStr.replace(/[^0-9]/g, '')) || 0;

  const filteredCategories = categories.filter((c) => {
    if (type === 'income') return c.type === 'income';
    if (type === 'expense') return c.type === 'expense';
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rawAmount <= 0) {
      setError('Nominal harus lebih dari Rp 0');
      return;
    }
    if (!description.trim()) {
      setError('Deskripsi transaksi wajib diisi');
      return;
    }
    if (type === 'transfer' && sourceAccountId === destinationAccountId) {
      setError('Rekening asal dan tujuan tidak boleh sama');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const isToday = date === new Date().toISOString().split('T')[0];
      const txDate = isToday ? new Date().toISOString() : new Date(`${date}T12:00:00`).toISOString();
      const activeUid = user?.id || accounts[0]?.user_id || 'default-user';
      await addTransaction({
        user_id: activeUid,
        date: txDate,
        type,
        amount: rawAmount,
        source_account_id: sourceAccountId || accounts[0]?.id || null,
        destination_account_id: type === 'transfer' ? destinationAccountId || null : null,
        category_id: type === 'transfer' ? null : categoryId || null,
        description: description.trim(),
        notes: notes.trim() || null,
        payment_method: paymentMethod,
        tags: [type],
      });

      setActiveModal(null);
      // Reset form
      setAmountStr('');
      setDescription('');
      setNotes('');
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Gagal menyimpan transaksi');
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

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-5 py-3.5 sm:px-6 sm:py-4 shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">Catat Transaksi</h2>
            <p className="text-[11px] text-muted-foreground">Catatan langsung memperbarui saldo akun</p>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-500/10 p-3 text-xs font-medium text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* Type Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition',
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <ArrowDownRight className="h-3.5 w-3.5" />
              <span>Pengeluaran</span>
            </button>

            <button
              type="button"
              onClick={() => setType('income')}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition',
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>Pemasukan</span>
            </button>

            <button
              type="button"
              onClick={() => setType('transfer')}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition',
                type === 'transfer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              <span>Transfer</span>
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground">Nominal (IDR)</label>
            <div className="relative mt-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-base font-bold text-muted-foreground">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                required
                value={amountStr}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  if (!val) {
                    setAmountStr('');
                  } else {
                    setAmountStr(new Intl.NumberFormat('id-ID').format(Number(val)));
                  }
                }}
                placeholder="0"
                className="w-full rounded-2xl border border-border bg-background py-3.5 pl-12 pr-4 font-mono text-xl font-black text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {rawAmount > 0 && (
              <p className="mt-1 text-right text-[11px] font-medium text-muted-foreground">
                Terbaca: {formatIDR(rawAmount)}
              </p>
            )}
          </div>

          {/* Source Account */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground">
                {type === 'transfer' ? 'Dari Rekening' : 'Rekening / Dompet'}
              </label>
              <select
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium text-foreground outline-none focus:border-primary"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatIDR(acc.current_balance)})
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' ? (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground">Ke Rekening</label>
                <select
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium text-foreground outline-none focus:border-primary"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatIDR(acc.current_balance)})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground">Kategori</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium text-foreground outline-none focus:border-primary"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground">Keterangan / Judul</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Belanja Bulanan di Supermarket"
              className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium text-foreground outline-none focus:border-primary"
            />
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground">Metode Bayar</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium text-foreground outline-none focus:border-primary"
              >
                <option value="qris">QRIS</option>
                <option value="transfer">Transfer Bank (BI-FAST)</option>
                <option value="cash">Uang Tunai</option>
                <option value="debit">Kartu Debit</option>
                <option value="credit">Kartu Kredit</option>
                <option value="autodebit">Auto Debit</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground">Catatan Tambahan (Opsional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nomor resi, penerima, dll"
              className="mt-1 w-full rounded-xl border border-border bg-background p-2 text-xs text-foreground outline-none focus:border-primary"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
          </button>
        </form>
      </div>
    </div>
  );
}
