'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, TrendingUp, RefreshCw, ShieldCheck } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { AssetType, InvestmentAsset } from '../../lib/db/types';
import { formatIDR, formatPercentage } from '../../lib/finance/formatters';
import { lotsToShares, sharesToLots } from '../../lib/finance/calculations';
import { generateUUID, cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';

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
  'Stockbit',
  'Ajaib',
  'Bibit',
  'IPOT',
  'Mirae',
  'Mandiri Sekuritas',
  'Pluang',
  'Indodax',
  'Lainnya',
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
  const [notes, setNotes] = useState('');

  // Auto-fetched live market price state
  const [marketPrice, setMarketPrice] = useState<number>(0);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [priceSource, setPriceSource] = useState<string>('');
  const [priceChange24h, setPriceChange24h] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isModalOpen =
    activeModal === 'portfolio_asset' ||
    activeModal === 'stock_trade' ||
    activeModal === 'crypto_trade';

  // Fetch real-time market price via API
  const fetchLiveMarketPrice = useCallback(
    async (sym: string, type: AssetType) => {
      const cleanSym = sym.trim().toUpperCase();
      if (!cleanSym || cleanSym.length < 2) return;

      setIsFetchingPrice(true);
      try {
        const res = await fetch(`/api/market-price?ticker=${encodeURIComponent(cleanSym)}&type=${type}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && typeof data.price === 'number' && data.price > 0) {
            setMarketPrice(data.price);
            setPriceSource(data.source || 'api');
            setPriceChange24h(data.change24h || 0);
          }
        }
      } catch {
        // Quiet fallback
      } finally {
        setIsFetchingPrice(false);
      }
    },
    []
  );

  useEffect(() => {
    if (editingAsset) {
      const isKnown = PLATFORMS.includes(editingAsset.platform || '');
      if (isKnown) {
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

      setMarketPrice(editingAsset.current_price || avgP);
      setNotes(editingAsset.notes || '');

      if (editingAsset.ticker) {
        fetchLiveMarketPrice(editingAsset.ticker, editingAsset.asset_type || 'stock');
      }
    } else {
      setPlatform('Stockbit');
      setCustomPlatform('');
      setAssetType('stock');
      setTicker('');
      setName('');
      setLotsStr('1');
      setUnitsStr('100');
      setAvgPriceStr('');
      setMarketPrice(0);
      setPriceSource('');
      setPriceChange24h(0);
      setNotes('');
    }
  }, [editingAsset, isModalOpen, fetchLiveMarketPrice]);

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
    if (val.length >= 2) {
      fetchLiveMarketPrice(val, assetType);
    }
  };

  const handleAssetTypeChange = (newType: AssetType) => {
    setAssetType(newType);
    if (ticker.trim().length >= 2) {
      fetchLiveMarketPrice(ticker, newType);
    }
  };

  // Calculations
  const numLots = parseFloat(lotsStr.replace(/[^0-9.]/g, '')) || 0;
  const numUnits =
    assetType === 'stock'
      ? lotsToShares(numLots)
      : parseFloat(unitsStr.replace(/[^0-9.]/g, '')) || 0;
  const numAvgPrice = parseFloat(avgPriceStr.replace(/[^0-9]/g, '')) || 0;
  const effectiveCurrentPrice = marketPrice > 0 ? marketPrice : numAvgPrice;

  const totalCostBasis = numUnits * numAvgPrice;
  const totalMarketValue = numUnits * effectiveCurrentPrice;
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
      const activeUid =
        user?.id ||
        (typeof window !== 'undefined' ? localStorage.getItem('artosku_user_id') : null) ||
        'user_local';
      const resolvedPlatform =
        platform === 'Lainnya' ? customPlatform.trim() || 'Lainnya' : platform;

      const finalPrice = marketPrice > 0 ? marketPrice : numAvgPrice;

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
        current_price: finalPrice,
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
              {editingAsset ? 'Edit Catatan Portofolio' : 'Catat Portofolio Investasi'}
            </h2>
            <p className="text-xs text-muted-foreground">
              Simpan kepemilikan saham & aset dari Ajaib, Stockbit, dll.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
              {error}
            </div>
          )}

          {/* Platform / Broker Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Platform Pembelian
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map((p) => {
                const isSelected = platform === p;
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-medium transition-colors border cursor-pointer',
                      isSelected
                        ? 'bg-foreground text-background border-foreground font-semibold'
                        : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            {platform === 'Lainnya' && (
              <input
                type="text"
                placeholder="Nama sekuritas / broker..."
                value={customPlatform}
                onChange={(e) => setCustomPlatform(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            )}
          </div>

          {/* Kategori Aset & Ticker */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Kategori Aset
              </label>
              <select
                value={assetType}
                onChange={(e) => handleAssetTypeChange(e.target.value as AssetType)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="stock" className="bg-popover text-foreground">Saham (IDX Indonesia)</option>
                <option value="crypto" className="bg-popover text-foreground">Cryptocurrency</option>
                <option value="mutual_fund" className="bg-popover text-foreground">Reksadana</option>
                <option value="gold" className="bg-popover text-foreground">Emas / Komoditas</option>
                <option value="other" className="bg-popover text-foreground">Lainnya</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Kode / Ticker
              </label>
              <input
                type="text"
                required
                placeholder={assetType === 'stock' ? 'BBCA' : 'BTC'}
                value={ticker}
                onChange={(e) => handleTickerChange(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-xs font-mono font-bold uppercase text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Nama Emiten / Aset */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Nama Emiten / Aset
            </label>
            <input
              type="text"
              required
              placeholder="Bank Central Asia Tbk"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Jumlah Kepemilikan & Harga Beli Avg */}
          <div className="grid grid-cols-2 gap-3">
            {assetType === 'stock' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Jumlah Lot
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="10"
                  value={lotsStr}
                  onChange={(e) => setLotsStr(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 font-mono text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <p className="text-[10px] text-muted-foreground">
                  = {new Intl.NumberFormat('id-ID').format(numUnits)} lembar
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Jumlah Unit / Koin
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="0.05"
                  value={unitsStr}
                  onChange={(e) => setUnitsStr(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 font-mono text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Harga Beli Avg (Rp)
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
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 font-mono text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <p className="text-[10px] text-muted-foreground truncate">
                Modal: {formatIDR(totalCostBasis)}
              </p>
            </div>
          </div>

          {/* Auto-Fetched Live Market Price Info Card (No Manual Input Required) */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">
                Harga Pasar Terkini (Otomatis dari API)
              </span>
              {isFetchingPrice ? (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Mengambil pasar...
                </span>
              ) : marketPrice > 0 ? (
                <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                  {priceSource === 'yahoo_finance'
                    ? 'Bursa IDX (Live)'
                    : priceSource === 'indodax'
                    ? 'Indodax (Live)'
                    : 'Pasar Terkini'}
                </Badge>
              ) : null}
            </div>

            <div className="flex items-baseline justify-between pt-0.5">
              <div className="text-sm font-bold font-mono text-foreground">
                {marketPrice > 0 ? (
                  <>
                    {formatIDR(marketPrice)}
                    <span className="text-[11px] font-normal text-muted-foreground ml-1">
                      / {assetType === 'stock' ? 'lembar' : 'unit'}
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-normal text-muted-foreground">
                    {ticker.trim()
                      ? 'Sedang mengambil data pasar...'
                      : 'Masukkan ticker untuk mengambil harga pasar'}
                  </span>
                )}
              </div>

              {marketPrice > 0 && numAvgPrice > 0 && (
                <span
                  className={cn(
                    'text-xs font-semibold font-mono',
                    marketPrice >= numAvgPrice
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  )}
                >
                  {marketPrice >= numAvgPrice ? '+' : ''}
                  {formatPercentage(((marketPrice - numAvgPrice) / numAvgPrice) * 100)}
                </span>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground">
              Harga pasar diambil otomatis dari bursa dan tidak perlu Anda isi manual.
            </p>
          </div>

          {/* Live Preview of Portfolio Value & Floating P/L */}
          {numUnits > 0 && numAvgPrice > 0 && (
            <div className="rounded-lg border border-border bg-card p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Nilai Portofolio Saat Ini</span>
                  <span className="font-bold font-mono text-foreground">{formatIDR(totalMarketValue)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Floating Profit / Loss</span>
                  <span
                    className={cn(
                      'font-bold font-mono',
                      unrealizedPL >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    )}
                  >
                    {unrealizedPL >= 0 ? '+' : ''}
                    {formatIDR(unrealizedPL)} ({formatPercentage(unrealizedPLPercent)})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Catatan Tambahan (Opsional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Catatan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Akun Stockbit sekunder, target hold 1 tahun"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Info Banner */}
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>Pencatatan portofolio ini tidak akan memotong saldo rekening bank Anda.</span>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full font-semibold cursor-pointer"
            >
              {isSubmitting
                ? 'Menyimpan...'
                : editingAsset
                ? 'Simpan Perubahan Portofolio'
                : 'Simpan Catatan Portofolio'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
