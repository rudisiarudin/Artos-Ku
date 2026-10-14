'use client';

import React, { useState } from 'react';
import { X, Bitcoin } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatIDR } from '../../lib/finance/formatters';
import { cn, generateUUID } from '../../lib/utils';

export function CryptoTradeModal() {
  const { activeModal, setActiveModal, assets, accounts, addTrade, saveAsset, user } = useFinance();

  const cryptoAssets = assets.filter((a) => a.asset_type === 'crypto');

  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [selectedAssetId, setSelectedAssetId] = useState(cryptoAssets[0]?.id || 'new');
  const [newTicker, setNewTicker] = useState('ETH');
  const [newName, setNewName] = useState('Ethereum');
  const [units, setUnits] = useState('0.1');
  const [pricePerUnit, setPricePerUnit] = useState('45000000');
  const [fee, setFee] = useState('25000');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (activeModal !== 'crypto_trade') return null;

  const numUnits = parseFloat(units) || 0;
  const numPrice = parseFloat(pricePerUnit) || 0;
  const numFee = parseFloat(fee) || 0;
  const grossAmount = numUnits * numPrice;
  const totalAmount = tradeType === 'buy' ? grossAmount + numFee : Math.max(0, grossAmount - numFee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numUnits <= 0 || numPrice <= 0) {
      setError('Kuantitas koin dan harga harus lebih dari 0');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let finalAssetId = selectedAssetId;

      if (selectedAssetId === 'new') {
        if (!newTicker.trim() || !newName.trim()) {
          setError('Ticker dan nama aset crypto wajib diisi');
          setIsSubmitting(false);
          return;
        }

        const activeUid = user?.id || accounts[0]?.user_id || 'user_local';
        finalAssetId = generateUUID();
        await saveAsset({
          id: finalAssetId,
          user_id: activeUid,
          asset_type: 'crypto',
          ticker: newTicker.toUpperCase().trim(),
          name: newName.trim(),
          exchange: 'Indodax/Binance',
          currency: 'IDR',
          current_price: numPrice,
          last_price_updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
      }

      const activeUid = user?.id || accounts[0]?.user_id || 'user_local';
      await addTrade({
        user_id: activeUid,
        asset_id: finalAssetId,
        trade_type: tradeType,
        trade_date: new Date(tradeDate).toISOString(),
        shares_or_units: numUnits,
        price_per_unit: numPrice,
        fee: numFee,
        total_amount: totalAmount,
        account_id: accountId || null,
        notes: notes.trim() || null,
      });

      setActiveModal(null);
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Gagal menyimpan transaksi crypto');
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
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Bitcoin className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Transaksi Cryptocurrency</h2>
              <p className="text-[11px] text-muted-foreground">Mendukung satuan pecahan / desimal</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:text-foreground"
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

          {/* Trade Type Tabs */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setTradeType('buy')}
              className={cn(
                'rounded-xl py-2 text-xs font-bold transition',
                tradeType === 'buy' ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground'
              )}
            >
              Beli Koin (Buy)
            </button>
            <button
              type="button"
              onClick={() => setTradeType('sell')}
              className={cn(
                'rounded-xl py-2 text-xs font-bold transition',
                tradeType === 'sell' ? 'bg-rose-600 text-white shadow-sm' : 'text-muted-foreground'
              )}
            >
              Jual Koin (Sell)
            </button>
          </div>

          {/* Asset Selection */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground">Pilih Token / Koin</label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium text-foreground outline-none"
            >
              {cryptoAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.ticker} - {asset.name}
                </option>
              ))}
              <option value="new">+ Tambah Koin Baru...</option>
            </select>
          </div>

          {selectedAssetId === 'new' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground">Simbol Koin</label>
                <input
                  type="text"
                  placeholder="e.g. SOL"
                  required
                  value={newTicker}
                  onChange={(e) => setNewTicker(e.target.value)}
                  className="mt-1 w-full uppercase rounded-xl border border-border bg-background p-2.5 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground">Nama Koin</label>
                <input
                  type="text"
                  placeholder="e.g. Solana"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium"
                />
              </div>
            </div>
          )}

          {/* Quantity & Unit Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground">Kuantitas Unit</label>
              <input
                type="number"
                step="any"
                required
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 font-mono text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground">Harga Satuan (IDR)</label>
              <input
                type="number"
                step="any"
                required
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 font-mono text-xs font-semibold"
              />
            </div>
          </div>

          {/* Fee & Account */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground">Network / Gas Fee (Rp)</label>
              <input
                type="number"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 font-mono text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground">Dompet / Rekening</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground">Tanggal Transaksi</label>
              <input
                type="date"
                value={tradeDate}
                onChange={(e) => setTradeDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground">Catatan (Opsional)</label>
              <input
                type="text"
                placeholder="e.g. Beli DCA"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs"
              />
            </div>
          </div>

          {/* Total Display */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Transaksi Crypto:</span>
              <span className="font-mono font-bold text-foreground">{formatIDR(totalAmount)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-amber-600 py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-amber-700 active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? 'Memproses...' : `Konfirmasi ${tradeType === 'buy' ? 'Beli' : 'Jual'} Crypto`}
          </button>
        </form>
      </div>
    </div>
  );
}
