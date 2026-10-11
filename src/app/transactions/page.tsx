'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Copy,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Calendar,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatIDR, formatIndonesianDate } from '../../lib/finance/formatters';
import { CurrencyDisplay } from '../../components/shared/CurrencyDisplay';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';

export default function TransactionsPage() {
  const {
    transactions,
    accounts,
    categories,
    deleteTransaction,
    addTransaction,
    setActiveModal,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search
      if (
        searchTerm &&
        !tx.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !(tx.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      // Type
      if (selectedType !== 'all' && tx.type !== selectedType) {
        return false;
      }
      // Account
      if (
        selectedAccount !== 'all' &&
        tx.source_account_id !== selectedAccount &&
        tx.destination_account_id !== selectedAccount
      ) {
        return false;
      }
      // Category
      if (selectedCategory !== 'all' && tx.category_id !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [transactions, searchTerm, selectedType, selectedAccount, selectedCategory]);

  // Aggregate totals for the filtered set
  const filteredIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'income' || t.type === 'receivable_repayment')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [filteredTransactions]);

  const filteredExpense = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense' || t.type === 'installment_payment')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [filteredTransactions]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['ID', 'Tanggal', 'Tipe', 'Nominal', 'Deskripsi', 'Metode Bayar', 'Catatan'];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.date,
      t.type,
      t.amount,
      `"${t.description.replace(/"/g, '""')}"`,
      t.payment_method || '',
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `artosku_transaksi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Duplicate Transaction
  const handleDuplicate = async (tx: (typeof transactions)[0]) => {
    await addTransaction({
      user_id: tx.user_id,
      date: new Date().toISOString(),
      type: tx.type,
      amount: tx.amount,
      source_account_id: tx.source_account_id,
      destination_account_id: tx.destination_account_id,
      category_id: tx.category_id,
      description: `${tx.description} (Salinan)`,
      notes: tx.notes,
      payment_method: tx.payment_method,
      tags: tx.tags,
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-foreground sm:text-2xl">Daftar Transaksi</h2>
          <p className="text-xs text-muted-foreground">
            Total {filteredTransactions.length} dari {transactions.length} mutasi tercatat
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="gap-1.5 text-xs h-10 px-3 w-full sm:w-auto justify-center"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>Ekspor CSV</span>
          </Button>

          <Button
            onClick={() => setActiveModal('transaction')}
            className="gap-1.5 text-xs font-bold shadow-sm h-10 px-3 w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>+ Transaksi</span>
          </Button>
        </div>
      </div>

      {/* Filtered Summary Card */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="p-4 shadow-sm">
          <span className="text-xs font-medium text-muted-foreground">Pemasukan Terfilter</span>
          <div className="mt-1 font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
            {formatIDR(filteredIncome)}
          </div>
        </Card>
        <Card className="p-4 shadow-sm">
          <span className="text-xs font-medium text-muted-foreground">Pengeluaran Terfilter</span>
          <div className="mt-1 font-mono text-base font-bold text-rose-600 dark:text-rose-400">
            {formatIDR(filteredExpense)}
          </div>
        </Card>
        <Card className="col-span-2 sm:col-span-1 p-4 shadow-sm">
          <span className="text-xs font-medium text-muted-foreground">Selisih Bersih</span>
          <div
            className={`mt-1 font-mono text-base font-bold ${
              filteredIncome >= filteredExpense
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatIDR(filteredIncome - filteredExpense)}
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 shadow-sm space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari transaksi berdasarkan nama atau catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Semua Tipe Transaksi</option>
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
            <option value="transfer">Transfer Antar Rekening</option>
            <option value="installment_payment">Pembayaran Cicilan</option>
            <option value="receivable_repayment">Pelunasan Piutang</option>
          </select>

          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Semua Rekening</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Transactions List */}
      <Card className="overflow-hidden shadow-sm">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Tidak ada transaksi yang cocok dengan filter yang dipilih.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filteredTransactions.map((tx) => {
              const isIncome =
                tx.type === 'income' ||
                tx.type === 'receivable_repayment' ||
                tx.type === 'investment_sell';
              const isExpense =
                tx.type === 'expense' ||
                tx.type === 'installment_payment' ||
                tx.type === 'receivable_disbursement' ||
                tx.type === 'investment_buy';
              const srcAcc = accounts.find((a) => a.id === tx.source_account_id);
              const dstAcc = accounts.find((a) => a.id === tx.destination_account_id);
              const cat = categories.find((c) => c.id === tx.category_id);

              return (
                <div
                  key={tx.id}
                  className="group flex items-center justify-between gap-3 p-3.5 sm:p-4 transition hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                        isIncome
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : isExpense
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownRight className="h-5 w-5" />
                      ) : isExpense ? (
                        <ArrowUpRight className="h-5 w-5" />
                      ) : (
                        <ArrowLeftRight className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">{tx.description}</h4>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span>{formatIndonesianDate(tx.date, 'time')}</span>
                        {cat && (
                          <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium text-foreground text-[10px]">
                            {cat.name}
                          </span>
                        )}
                        <span className="hidden sm:inline">
                          {srcAcc ? srcAcc.name : ''}
                          {dstAcc ? ` → ${dstAcc.name}` : ''}
                        </span>
                      </div>
                      {tx.notes && (
                        <p className="mt-0.5 text-[10px] italic text-muted-foreground/80 truncate">
                          {tx.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-3 shrink-0">
                    <CurrencyDisplay
                      amount={tx.amount}
                      type={isIncome ? 'income' : isExpense ? 'expense' : 'neutral'}
                      size="md"
                      showSign={tx.type !== 'transfer'}
                    />

                    {/* Actions: Duplicate & Delete */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={() => handleDuplicate(tx)}
                        title="Duplikat Transaksi"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Hapus transaksi "${tx.description}"? Saldo akun akan dikembalikan.`)) {
                            deleteTransaction(tx.id);
                          }
                        }}
                        title="Hapus Transaksi"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-card text-rose-600 transition hover:bg-rose-500/10 hover:border-rose-500/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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
