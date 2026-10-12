'use client';

import React, { useState } from 'react';
import { X, Landmark } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { AccountType } from '../../lib/db/types';
import { generateUUID } from '../../lib/utils';

export function AccountFormModal() {
  const { activeModal, setActiveModal, saveAccount, user, accounts, editingAccount, setEditingAccount } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [institutionName, setInstitutionName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [balanceStr, setBalanceStr] = useState('');
  const [color, setColor] = useState('#005E9E');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name || '');
      setType(editingAccount.type || 'bank');
      setInstitutionName(editingAccount.institution_name || '');
      setAccountNumber(editingAccount.account_number || '');
      const bal = Number(editingAccount.current_balance || 0);
      setBalanceStr(bal ? new Intl.NumberFormat('id-ID').format(bal) : '0');
      setColor(editingAccount.color || '#005E9E');
    } else {
      setName('');
      setType('bank');
      setInstitutionName('');
      setAccountNumber('');
      setBalanceStr('');
      setColor('#005E9E');
    }
  }, [editingAccount, activeModal]);

  if (activeModal !== 'account') return null;

  const rawBalance = parseFloat(balanceStr.replace(/[^0-9]/g, '')) || 0;

  const handleClose = () => {
    setEditingAccount(null);
    setActiveModal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama rekening atau dompet wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const activeUid = user?.id || (accounts[0]?.user_id && accounts[0].user_id !== 'default-user' ? accounts[0].user_id : null) || (typeof window !== 'undefined' ? localStorage.getItem('artosku_user_id') : null) || 'user_local';
      const accId = editingAccount ? editingAccount.id : generateUUID();
      await saveAccount({
        id: accId,
        user_id: editingAccount?.user_id || activeUid,
        name: name.trim(),
        type,
        institution_name: institutionName.trim() || null,
        account_number: accountNumber.trim() || null,
        currency: editingAccount?.currency || 'IDR',
        opening_balance: editingAccount ? editingAccount.opening_balance : rawBalance,
        current_balance: rawBalance,
        color,
        is_active: true,
        is_archived: false,
        created_at: editingAccount ? editingAccount.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan rekening');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={handleClose}
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
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Landmark className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {editingAccount ? 'Ubah Rekening / Dompet' : 'Tambah Rekening / Dompet'}
              </h2>
              <p className="text-[11px] text-muted-foreground">Bank, e-wallet, RDI, atau uang tunai</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:text-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-500/10 p-3 text-xs font-medium text-rose-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted-foreground">Nama Akun / Label</label>
            <input
              type="text"
              required
              placeholder="e.g. BCA Tahapan, GoPay, Dompet Tunai"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground">Tipe Akun</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium"
              >
                <option value="bank">Bank (Tabungan/Giro)</option>
                <option value="ewallet">E-Wallet (GoPay, OVO, Dana)</option>
                <option value="cash">Uang Tunai (Cash)</option>
                <option value="brokerage">RDI Sekuritas / Investasi</option>
                <option value="crypto_wallet">Crypto Exchange / Wallet</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground">Nama Institusi</label>
              <input
                type="text"
                list="institution-suggestions"
                placeholder="e.g. SeaBank, Allo Bank, BCA"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium"
              />
              <datalist id="institution-suggestions">
                <option value="SeaBank" />
                <option value="Allo Bank" />
                <option value="Bank Central Asia" />
                <option value="Bank Mandiri" />
                <option value="Bank Rakyat Indonesia" />
                <option value="Bank Negara Indonesia" />
                <option value="Bank Syariah Indonesia" />
                <option value="Bank Jago" />
                <option value="GoPay" />
                <option value="DANA" />
                <option value="OVO" />
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground">Nomor Rekening (Opsional)</label>
              <input
                type="text"
                placeholder="1234567890"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground">
                {editingAccount ? 'Saldo Saat Ini (IDR)' : 'Saldo Awal (IDR)'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="0"
                value={balanceStr}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setBalanceStr(val ? new Intl.NumberFormat('id-ID').format(Number(val)) : '');
                }}
                className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 font-mono text-xs font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Menyimpan...' : editingAccount ? 'Simpan Perubahan' : 'Simpan Rekening'}
          </button>
        </form>
      </div>
    </div>
  );
}
