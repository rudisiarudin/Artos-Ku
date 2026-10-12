'use client';

import React, { useState, useEffect } from 'react';
import { X, HandCoins, CheckCircle2, ShieldCheck, ArrowDownRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatIDR } from '../../lib/finance/formatters';
import { cn, generateUUID } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';

export function ReceivableFormModal() {
  const {
    activeModal,
    setActiveModal,
    receivables,
    accounts,
    saveReceivable,
    recordReceivablePayment,
    addTransaction,
    selectedReceivable,
    setSelectedReceivable,
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

  const isModalOpen = activeModal === 'receivable';

  useEffect(() => {
    if (selectedReceivable) {
      setMode('payment');
      setSelectedRecId(selectedReceivable.id);
      setPaymentAmountStr(
        new Intl.NumberFormat('id-ID').format(Number(selectedReceivable.current_balance))
      );
    } else {
      if (activeReceivables.length > 0) {
        setSelectedRecId(activeReceivables[0].id);
      }
    }
  }, [selectedReceivable, isModalOpen]);

  if (!isModalOpen) return null;

  const handleClose = () => {
    setSelectedReceivable(null);
    setActiveModal(null);
  };

  const rawPrincipal = parseFloat(principalStr.replace(/[^0-9]/g, '')) || 0;
  const rawPayment = parseFloat(paymentAmountStr.replace(/[^0-9]/g, '')) || 0;

  const currentSelectedRec = receivables.find((r) => r.id === selectedRecId);

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
      const activeUid = user?.id || (typeof window !== 'undefined' ? localStorage.getItem('artosku_user_id') : null) || 'user_local';
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
        account_id: accountId || null,
        purpose: purpose.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Deduct disbursement account if selected
      if (accountId) {
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
      }

      handleClose();
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
    if (!receivingAccountId) {
      setError('Pilih rekening penerima dana');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const activeUid = user?.id || (typeof window !== 'undefined' ? localStorage.getItem('artosku_user_id') : null) || 'user_local';
      await recordReceivablePayment({
        user_id: activeUid,
        receivable_id: selectedRecId,
        account_id: receivingAccountId,
        payment_date: new Date(paymentDate).toISOString(),
        principal_paid: rawPayment,
        interest_paid: 0,
        total_received: rawPayment,
        notes: `Pelunasan piutang: ${currentSelectedRec?.borrower_name || ''}`,
      });

      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal mencatat pelunasan piutang');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg max-h-[92dvh] sm:max-h-[88vh] rounded-t-2xl sm:rounded-xl border border-border bg-card shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              {mode === 'payment' ? 'Catat Pembayaran Piutang' : 'Pinjamkan Uang Baru'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {mode === 'payment'
                ? 'Terima pengembalian atau cicilan dari peminjam'
                : 'Catat uang yang Anda pinjamkan ke teman / keluarga'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Mode Switcher (Shadcn segmented tabs) */}
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('create');
                setSelectedReceivable(null);
              }}
              className={cn(
                'rounded-md py-1.5 text-xs font-medium transition cursor-pointer',
                mode === 'create'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Pinjamkan Uang Baru
            </button>
            <button
              type="button"
              onClick={() => setMode('payment')}
              className={cn(
                'rounded-md py-1.5 text-xs font-medium transition cursor-pointer',
                mode === 'payment'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Catat Pelunasan / Cicil
            </button>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
              {error}
            </div>
          )}

          {mode === 'create' ? (
            /* CREATE FORM */
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Nama Peminjam
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dimas Pratama"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  No. Telepon / WhatsApp (Opsional)
                </label>
                <input
                  type="tel"
                  placeholder="08123456789"
                  value={borrowerPhone}
                  onChange={(e) => setBorrowerPhone(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Nominal Pinjaman (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="1.000.000"
                  value={principalStr}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setPrincipalStr(val ? new Intl.NumberFormat('id-ID').format(Number(val)) : '');
                  }}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 font-mono text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Tanggal Pinjam
                  </label>
                  <input
                    type="date"
                    value={loanDate}
                    onChange={(e) => setLoanDate(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Sumber Rekening (Dana yang Dikeluarkan)
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="" className="bg-popover text-foreground">Tidak memotong rekening (Hanya Catat)</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} className="bg-popover text-foreground">
                      {acc.name} ({formatIDR(acc.current_balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Keperluan / Catatan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Biaya servis motor, janji bayar akhir bulan"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full font-semibold cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Catatan Piutang'}
                </Button>
              </div>
            </form>
          ) : (
            /* PAYMENT / PELUNASAN FORM */
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Pilih Peminjam / Piutang
                </label>
                <select
                  value={selectedRecId}
                  onChange={(e) => {
                    setSelectedRecId(e.target.value);
                    const found = receivables.find((r) => r.id === e.target.value);
                    if (found) {
                      setPaymentAmountStr(new Intl.NumberFormat('id-ID').format(Number(found.current_balance)));
                    }
                  }}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {activeReceivables.length === 0 ? (
                    <option value="" className="bg-popover text-foreground">Tidak ada piutang aktif</option>
                  ) : (
                    activeReceivables.map((r) => (
                      <option key={r.id} value={r.id} className="bg-popover text-foreground">
                        {r.borrower_name} — Sisa: {formatIDR(r.current_balance)}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {currentSelectedRec && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Peminjam:</span>
                    <strong className="text-foreground">{currentSelectedRec.borrower_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Pokok Awal:</span>
                    <span className="font-mono">{formatIDR(currentSelectedRec.principal_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sisa Yang Harus Dibayar:</span>
                    <strong className="font-mono text-foreground">{formatIDR(currentSelectedRec.current_balance)}</strong>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">
                    Nominal yang Dibayarkan (Rp)
                  </label>
                  {currentSelectedRec && (
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentAmountStr(
                          new Intl.NumberFormat('id-ID').format(Number(currentSelectedRec.current_balance))
                        )
                      }
                      className="text-[10px] font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Bayar Lunas (100%)
                    </button>
                  )}
                </div>
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
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 font-mono text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Masuk ke Rekening / Dompet
                </label>
                <select
                  value={receivingAccountId}
                  onChange={(e) => setReceivingAccountId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} className="bg-popover text-foreground">
                      {acc.name} ({formatIDR(acc.current_balance)})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground">
                  Saldo rekening yang Anda pilih akan bertambah sebesar nominal yang dibayarkan.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Tanggal Pembayaran
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>Pelunasan piutang tidak dihitung sebagai pengeluaran/beban, melainkan pengembalian aset kas Anda.</span>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || activeReceivables.length === 0}
                  className="w-full font-semibold cursor-pointer"
                >
                  {isSubmitting ? 'Memproses...' : 'Catat Pelunasan Piutang'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
