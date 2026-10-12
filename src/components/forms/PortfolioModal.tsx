'use client';

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Sparkles, Building2, HelpCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { AssetType, InvestmentAsset } from '../../lib/db/types';
import { formatIDR, formatPercentage } from '../../lib/finance/formatters';
import { lotsToShares, sharesToLots } from '../../lib/finance/calculations';
import { generateUUID, cn } from '../../lib/utils';

const POPULAR_STOCKS: Record<string, string> = {
  BBCA: 'Bank Central Asia Tbk',
  BBRI: 'Bank Rakyat Indonesia Tbk',
  BMRI: 'Bank Mandiri Tbk',
  BBNI: 'Bank Negara Indonesia Tbk',
  ASII: 'Astra International Tbk',
  GOTO: 'GoTo Gojek Tokopedia Tbk',
  TLKM: 'Telkom Indonesia Tbk',
  ICBP: 'Indofood CBP Sukses Makmur Tbk',
  INDF: 'Indofood Sukses Makmur Tbk',
  UNVR: 'Unilever Indonesia Tbk',
  BREN: 'Barito Renewables Energy Tbk',
  AMMN: 'Amman Mineral Internasional Tbk',
  ADRO: 'Adaro Energy Indonesia Tbk',
  PGAS: 'Perusahaan Gas Negara Tbk',
  ANTM: 'Aneka Tambang Tbk',
  MDKA: 'Merdeka Copper Gold Tbk',
};

const PLATFORMS = [
  { id: 'Stockbit', label: 'Stockbit' },
  { id: 'Ajaib', label: 'Ajaib' },
  { id: 'Bibit', label: 'Bibit' },
  { id: 'IPOT', label: 'IPOT' },
  { id: 'Mirae', label: 'Mirae Sekuritas' },
  { id: 'Mandiri Sekuritas', label: 'Mandiri Sekuritas' },
  { id: 'Pluang', label: 'Pluang' },
  { id: 'Indodax', label: 'Indodax' },
  { id: 'Lainnya', label: 'Lainnya' },
];

export function PortfolioModal() {
  const { activeModal, setActiveModal, saveAsset, user, editingAsset, setEditingAsset } = useFinance();

  const [platform, setPlatform] = useState('Stockbit');
  const [customPlatform, setCustomPlatform] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('stock');
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [lotsStr, setLotsStr] = useState('1');
  const [unitsStr, setUnitsStr] = useState('100');
  const [avgPriceStr, setAvgPriceStr] = useState('');
  const [currentPriceStr, setCurrentPriceStr] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isModalOpen = activeModal === 'portfolio_asset' || activeModal === 'stock_trade' || activeModal === 'crypto_trade';

  useEffect(() => {
    if (editingAsset) {
      const knownPlat = PLATFORMS.some((p) => p.id === editingAsset.platform);
      if (knownPlat) {
        setPlatform(editingAsset.platform || 'Stockbit');
        setCustomPlatform('');
      } else if (editingAsset.platform) {
        setPlatform('Lainnya');
        setCustomPlatform(editingAsset.platform);
      } else {
        setPlatform('Stockbit');
        setCustomPlatform('');
      }

      setAssetType(editingAsset.asset_type || 'stock');
      setTicker(editingAsset.ticker || '');
      setName(editingAsset.name || '');

      const l = editingAsset.lots ?? (editingAsset.shares_or_units ? sharesToLots(editingAsset.shares_or_units) : 1);
      setLotsStr(String(l));

      const u = editingAsset.shares_or_units ?? (editingAsset.lots ? lotsToShares(editingAsset.lots) : 100);
      setUnitsStr(String(u));

      const avgP = Number(editingAsset.average_buy_price || editingAsset.current_price || 0);
      setAvgPriceStr(avgP ? new Intl.NumberFormat('id-ID').format(avgP) : '');

      const curP = Number(editingAsset.current_price || 0);
      setCurrentPriceStr(curP ? new Intl.NumberFormat('id-ID').format(curP) : '');

      setNotes(editingAsset.notes || '');
    } else {
      setPlatform('Stockbit');
      setCustomPlatform('');
      setAssetType('stock');
      setTicker('');
      setName('');
      setLotsStr('1');
      setUnitsStr('100');
      setAvgPriceStr('');
      setCurrentPriceStr('');
      setNotes('');
    }
  }, [editingAsset, isModalOpen]);

  if (!isModalOpen) return null;

  const handleClose = () => {
    setEditingAsset(null);
    setActiveModal(null);
  };

  const handleTickerChange = (raw: string) => {
    const val = raw.toUpperCase().trim();
    setTicker(val);
    if (assetType === 'stock' && POPULAR_STOCKS[val] && !name) {
      setName(POPULAR_STOCKS[val]);
    }
  };

  // Parsing numerical values
  const numLots = parseFloat(lotsStr.replace(/[^0-9.]/g, '')) || 0;
  const numUnits = assetType === 'stock' ? lotsToShares(numLots) : (parseFloat(unitsStr.replace(/[^0-9.]/g, '')) || 0);
  const numAvgPrice = parseFloat(avgPriceStr.replace(/[^0-9]/g, '')) || 0;
  const numCurrentPrice = parseFloat(currentPriceStr.replace(/[^0-9]/g, '')) || numAvgPrice;

  // Realtime Live Preview Calculation
  const totalCostBasis = numUnits * numAvgPrice;
  const totalMarketValue = numUnits * numCurrentPrice;
  const unrealizedPL = totalMarketValue - totalCostBasis;
  const unrealizedPLPercent = totalCostBasis > 0 ? (unrealizedPL / totalCostBasis) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim()) {
      setError('Kode / Ticker aset wajib diisi (misal BBCA, BTC)');
      return;
    }
    if (!name.trim()) {
      setError('Nama aset / emiten wajib diisi');
      return;
    }
    if (numUnits <= 0) {
      setError(assetType === 'stock' ? 'Jumlah lot harus lebih dari 0' : 'Jumlah unit harus lebih dari 0');
      return;
    }
    if (numAvgPrice <= 0) {
      setError('Harga beli rata-rata (Avg Price) harus lebih dari 0');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const activeUid = user?.id || (typeof window !== 'undefined' ? localStorage.getItem('artosku_user_id') : null) || 'user_local';
      const resolvedPlatform = platform === 'Lainnya' ? (customPlatform.trim() || 'Lainnya') : platform;

      const assetPayload: InvestmentAsset = {
        id: editingAsset ? editingAsset.id : generateUUID(),
        user_id: editingAsset?.user_id || activeUid,
        asset_type: assetType,
        ticker: ticker.trim().toUpperCase(),
        name: name.trim(),
        platform: resolvedPlatform,
        lots: assetType === 'stock' ? numLots : null,
        shares_or_units: numUnits,
        average_buy_price: numAvgPrice,
        current_price: numCurrentPrice > 0 ? numCurrentPrice : numAvgPrice,
        exchange: assetType === 'stock' ? 'IDX' : undefined,
        currency: 'IDR',
        notes: notes.trim() || null,
        last_price_updated_at: new Date().toISOString(),
        created_at: editingAsset ? editingAsset.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await saveAsset(assetPayload);
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan catatan portofolio');
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
        className="w-full max-w-lg max-h-[92dvh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-2xl border-t sm:border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/25" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-5 py-3.5 sm:px-6 sm:py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {editingAsset ? 'Ubah Catatan Portofolio' : 'Catat Portofolio Investasi'}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Simpan kepemilikan saham/aset dari Ajaib, Stockbit, dll.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:text-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-500/10 p-3 text-xs font-semibold text-rose-600">
              {error}
            </div>
          )}

          {/* 1. Platform / Sekuritas */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              Platform Pembelian (Sekuritas / Exchange)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={cn(
                    'rounded-xl px-3 py-1.5 text-xs font-semibold transition border cursor-pointer',
                    platform === p.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {platform === 'Lainnya' && (
              <input
                type="text"
                placeholder="Nama sekuritas / broker lain..."
                value={customPlatform}
                onChange={(e) => setCustomPlatform(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium"
              />
            )}
          </div>

          {/* 2. Tipe Aset */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                Kategori Aset
              </label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as AssetType)}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium"
              >
                <option value="stock">Saham (IDX Indonesia)</option>
                <option value="crypto">Cryptocurrency</option>
                <option value="mutual_fund">Reksadana</option>
                <option value="gold">Emas / Komoditas</option>
                <option value="other">Aset Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                Kode / Ticker
              </label>
              <input
                type="text"
                required
                placeholder={assetType === 'stock' ? 'e.g. BBCA, BBRI' : 'e.g. BTC, ETH'}
                value={ticker}
                onChange={(e) => handleTickerChange(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-mono font-bold uppercase"
              />
            </div>
          </div>

          {/* 3. Nama Emiten / Aset */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">
              Nama Emiten / Perusahaan / Aset
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Bank Central Asia Tbk"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium"
            />
          </div>

          {/* 4. Jumlah Kepemilikan (Lot vs Units) */}
          <div className="grid grid-cols-2 gap-3">
            {assetType === 'stock' ? (
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Jumlah Lot
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="10"
                  value={lotsStr}
                  onChange={(e) => setLotsStr(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="w-full rounded-xl border border-border bg-background p-2.5 font-mono text-xs font-bold"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  = {new Intl.NumberFormat('id-ID').format(numUnits)} lembar saham
                </span>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Jumlah Unit / Koin
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="0.05"
                  value={unitsStr}
                  onChange={(e) => setUnitsStr(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="w-full rounded-xl border border-border bg-background p-2.5 font-mono text-xs font-bold"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                Harga Beli Avg (Rp / lbr)
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="9.850"
                value={avgPriceStr}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setAvgPriceStr(val ? new Intl.NumberFormat('id-ID').format(Number(val)) : '');
                }}
                className="w-full rounded-xl border border-border bg-background p-2.5 font-mono text-xs font-bold"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">
                Modal: {formatIDR(totalCostBasis)}
              </span>
            </div>
          </div>

          {/* 5. Harga Saat Ini (Current Price) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-muted-foreground">
                Harga Pasar Saat Ini (Rp / lbr)
              </label>
              <button
                type="button"
                onClick={() => setCurrentPriceStr(avgPriceStr)}
                className="text-[10px] font-semibold text-primary hover:underline cursor-pointer"
              >
                Samakan dengan Avg Buy
              </button>
            </div>
            <input
              type="text"
              inputMode="numeric"
              placeholder={avgPriceStr || '10.000'}
              value={currentPriceStr}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setCurrentPriceStr(val ? new Intl.NumberFormat('id-ID').format(Number(val)) : '');
              }}
              className="w-full rounded-xl border border-border bg-background p-2.5 font-mono text-xs font-bold"
            />
          </div>

          {/* 6. Live Portfolio Value & Floating P/L Preview Card */}
          {numUnits > 0 && numAvgPrice > 0 && (
            <div className="rounded-2xl border border-border bg-muted/40 p-3.5 space-y-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Ringkasan Portofolio ({ticker || 'Aset'})
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Total Modal Beli</span>
                  <span className="font-mono font-bold text-foreground">
                    {formatIDR(totalCostBasis)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Nilai Portofolio Saat Ini</span>
                  <span className="font-mono font-bold text-foreground">
                    {formatIDR(totalMarketValue)}
                  </span>
                </div>
              </div>
              <div className="border-t border-border/60 pt-2 flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">Floating Profit / Loss</span>
                <span
                  className={cn(
                    'font-mono text-xs font-extrabold',
                    unrealizedPL >= 0 ? 'text-emerald-500' : 'text-rose-500'
                  )}
                >
                  {unrealizedPL >= 0 ? '+' : ''}{formatIDR(unrealizedPL)} ({formatPercentage(unrealizedPLPercent)})
                </span>
              </div>
            </div>
          )}

          {/* 7. Catatan Opsional */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">
              Catatan / Keterangan (Opsional)
            </label>
            <input
              type="text"
              placeholder="e.g. Hold jangka panjang, dividen hunter"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-medium"
            />
          </div>

          {/* Info Badge: No Cash Account Deduction */}
          <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-2.5 flex items-start gap-2 text-blue-600 dark:text-blue-400">
            <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-tight">
              <strong>Hanya Catatan Portofolio:</strong> Form ini menyimpan data kepemilikan aset Anda di {platform}. Saldo rekening bank Anda tidak akan terpotong.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Menyimpan...' : editingAsset ? 'Simpan Perubahan Portofolio' : 'Simpan Catatan Portofolio'}
          </button>
        </form>
      </div>
    </div>
  );
}
