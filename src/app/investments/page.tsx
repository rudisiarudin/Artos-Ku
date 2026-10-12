'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  PieChart as PieIcon,
  Bitcoin,
  Building2,
  FolderOpen,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import {
  formatIDR,
  formatPercentage,
  formatStockQuantity,
} from '../../lib/finance/formatters';
import { CurrencyDisplay } from '../../components/shared/CurrencyDisplay';
import { defaultMarketProvider } from '../../lib/finance/marketData';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { cn } from '../../lib/utils';

export default function InvestmentsPage() {
  const { positions, assets, saveAsset, deleteAsset, setEditingAsset, setActiveModal } = useFinance();

  const [activeTab, setActiveTab] = useState<'all' | 'stock' | 'crypto' | 'other'>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [editingPriceAssetId, setEditingPriceAssetId] = useState<string | null>(null);
  const [newPriceStr, setNewPriceStr] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Extract unique platforms present in user's portfolio
  const availablePlatforms = Array.from(
    new Set(assets.map((a) => a.platform).filter(Boolean))
  ) as string[];

  // Total summary calculations
  const totalMarketValue = positions.reduce((sum, p) => sum + p.currentMarketValue, 0);
  const totalCostBasis = positions.reduce((sum, p) => sum + p.totalCostBasis, 0);
  const totalUnrealizedPL = totalMarketValue - totalCostBasis;
  const totalUnrealizedPLPercent =
    totalCostBasis > 0 ? (totalUnrealizedPL / totalCostBasis) * 100 : 0;

  // Filtered positions based on Tab and Platform
  const filteredPositions = positions.filter((p) => {
    // 1. Tab filter
    if (activeTab === 'stock' && p.assetType !== 'stock') return false;
    if (activeTab === 'crypto' && p.assetType !== 'crypto') return false;
    if (activeTab === 'other' && (p.assetType === 'stock' || p.assetType === 'crypto')) return false;

    // 2. Platform filter
    if (selectedPlatform !== 'all') {
      const rawAsset = assets.find((a) => a.id === p.assetId);
      if (rawAsset?.platform !== selectedPlatform) return false;
    }

    return true;
  });

  // Refresh prices using market data provider
  const handleRefreshMarketPrices = async () => {
    setIsRefreshing(true);
    try {
      for (const asset of assets) {
        if (asset.asset_type === 'stock' || asset.asset_type === 'crypto') {
          const quote = await defaultMarketProvider.fetchPrice(asset.ticker, asset.asset_type);
          if (quote.price > 0) {
            await saveAsset({
              ...asset,
              current_price: quote.price,
              last_price_updated_at: quote.timestamp,
            });
          }
        }
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Save manual price update
  const handleSavePrice = async (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return;

    const price = parseFloat(newPriceStr.replace(/[^0-9.]/g, '')) || 0;
    if (price > 0) {
      await saveAsset({
        ...asset,
        current_price: price,
        last_price_updated_at: new Date().toISOString(),
      });
    }
    setEditingPriceAssetId(null);
    setNewPriceStr('');
  };

  const getPlatformBadgeColor = (plat?: string | null) => {
    switch (plat?.toLowerCase()) {
      case 'stockbit':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
      case 'ajaib':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25';
      case 'bibit':
        return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25';
      case 'indodax':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-foreground sm:text-2xl">
            Portofolio Investasi
          </h2>
          <p className="text-xs text-muted-foreground">
            Catatan kepemilikan saham & aset investasi Anda di Ajaib, Stockbit, Bibit, dll.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              setEditingAsset(null);
              setActiveModal('portfolio_asset');
            }}
            className="gap-1.5 text-xs h-10 px-4 font-bold cursor-pointer"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Catat Portofolio</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleRefreshMarketPrices}
            disabled={isRefreshing}
            className="gap-1.5 text-xs h-10 px-3 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Memperbarui...' : 'Perbarui Harga Pasar'}</span>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Nilai Portofolio
          </span>
          <div className="mt-2">
            <CurrencyDisplay amount={totalMarketValue} size="xl" />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Total Modal: {formatIDR(totalCostBasis)}
          </p>
        </Card>

        <Card className="p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Floating Profit / Loss
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <CurrencyDisplay
              amount={totalUnrealizedPL}
              type={totalUnrealizedPL >= 0 ? 'income' : 'expense'}
              size="lg"
              showSign
            />
            <span
              className={cn(
                'text-xs font-extrabold',
                totalUnrealizedPLPercent >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {formatPercentage(totalUnrealizedPLPercent)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {totalUnrealizedPL >= 0 ? 'Potensi keuntungan saat ini' : 'Potensi kerugian saat ini'}
          </p>
        </Card>

        <Card className="p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Modal Investasi
          </span>
          <div className="mt-2">
            <CurrencyDisplay amount={totalCostBasis} size="lg" />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Rata-rata modal pembelian (Cost Basis)
          </p>
        </Card>

        <Card className="p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Aset & Platform Aktif
          </span>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-xs font-bold">
              {positions.length} Aset
            </Badge>
            {availablePlatforms.map((plat) => (
              <Badge key={plat} variant="outline" className="text-[10px] font-semibold">
                {plat}
              </Badge>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Tersimpan di ArtosKu
          </p>
        </Card>
      </div>

      {/* Tabs & Platform Filters */}
      <div className="space-y-3">
        {/* Category Tabs */}
        <div className="flex border-b border-border overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'border-b-2 px-4 py-2.5 text-xs font-bold transition whitespace-nowrap cursor-pointer',
              activeTab === 'all'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Semua Aset ({positions.length})
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={cn(
              'border-b-2 px-4 py-2.5 text-xs font-bold transition whitespace-nowrap cursor-pointer',
              activeTab === 'stock'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Saham IDX ({positions.filter((p) => p.assetType === 'stock').length})
          </button>
          <button
            onClick={() => setActiveTab('crypto')}
            className={cn(
              'border-b-2 px-4 py-2.5 text-xs font-bold transition whitespace-nowrap cursor-pointer',
              activeTab === 'crypto'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Crypto ({positions.filter((p) => p.assetType === 'crypto').length})
          </button>
          <button
            onClick={() => setActiveTab('other')}
            className={cn(
              'border-b-2 px-4 py-2.5 text-xs font-bold transition whitespace-nowrap cursor-pointer',
              activeTab === 'other'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Reksadana & Lainnya ({positions.filter((p) => p.assetType !== 'stock' && p.assetType !== 'crypto').length})
          </button>
        </div>

        {/* Platform Filter Buttons */}
        {availablePlatforms.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Platform:</span>
            <button
              onClick={() => setSelectedPlatform('all')}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-semibold transition border cursor-pointer',
                selectedPlatform === 'all'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
              )}
            >
              Semua Platform
            </button>
            {availablePlatforms.map((plat) => (
              <button
                key={plat}
                onClick={() => setSelectedPlatform(plat)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-semibold transition border cursor-pointer',
                  selectedPlatform === plat
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {plat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Positions Table / Cards */}
      <Card className="overflow-hidden shadow-sm">
        {filteredPositions.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <FolderOpen className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Belum Ada Catatan Portofolio</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Catat kepemilikan saham atau aset yang Anda miliki di Ajaib, Stockbit, atau sekuritas lain untuk memantau performa investasi Anda di ArtosKu.
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingAsset(null);
                setActiveModal('portfolio_asset');
              }}
              className="gap-1.5 text-xs font-bold cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Catat Portofolio Sekarang</span>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filteredPositions.map((pos) => {
              const isProfit = pos.unrealizedPL >= 0;
              const isEditingPrice = editingPriceAssetId === pos.assetId;
              const rawAsset = assets.find((a) => a.id === pos.assetId);

              return (
                <div key={pos.assetId} className="p-4 transition hover:bg-muted/20">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    {/* Left: Asset Identity & Platform */}
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                          pos.assetType === 'stock'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                            : pos.assetType === 'crypto'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        )}
                      >
                        {pos.assetType === 'stock' ? (
                          <TrendingUp className="h-5 w-5" />
                        ) : pos.assetType === 'crypto' ? (
                          <Bitcoin className="h-5 w-5" />
                        ) : (
                          <Building2 className="h-5 w-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-black tracking-tight text-foreground font-mono">
                            {pos.ticker}
                          </h4>
                          {pos.platform && (
                            <span
                              className={cn(
                                'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                                getPlatformBadgeColor(pos.platform)
                              )}
                            >
                              {pos.platform}
                            </span>
                          )}
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                            {pos.assetType === 'stock' ? 'IDX' : pos.assetType}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">{pos.name}</p>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            Kepemilikan:{' '}
                            <strong className="text-foreground font-mono">
                              {pos.assetType === 'stock'
                                ? `${pos.totalLots ? `${pos.totalLots} Lot` : ''} (${formatStockQuantity(pos.totalSharesOrUnits)})`
                                : `${pos.totalSharesOrUnits} unit`}
                            </strong>
                          </span>
                          <span>
                            Avg Buy:{' '}
                            <strong className="text-foreground font-mono">
                              {formatIDR(pos.averageCost)}
                            </strong>
                          </span>
                          <span>
                            Modal:{' '}
                            <strong className="text-foreground font-mono">
                              {formatIDR(pos.totalCostBasis)}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Market Value, Floating P/L & Action Buttons */}
                    <div className="flex flex-col sm:items-end justify-between border-t border-border/40 pt-3 sm:border-0 sm:pt-0 gap-1.5">
                      {/* Price Row with Quick Edit */}
                      <div className="flex items-center gap-2">
                        {isEditingPrice ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={newPriceStr}
                              onChange={(e) => setNewPriceStr(e.target.value)}
                              placeholder="Harga Baru"
                              className="w-28 rounded-lg border border-border bg-background p-1 text-xs font-mono"
                            />
                            <button
                              onClick={() => handleSavePrice(pos.assetId)}
                              className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white cursor-pointer"
                              title="Simpan Harga"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setEditingPriceAssetId(null)}
                              className="flex h-6 w-6 items-center justify-center rounded bg-muted text-muted-foreground cursor-pointer"
                              title="Batal"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Harga Sekarang:</span>
                            <span className="font-mono text-sm font-extrabold text-foreground">
                              {formatIDR(pos.currentPrice)}
                            </span>
                            <button
                              onClick={() => {
                                setEditingPriceAssetId(pos.assetId);
                                setNewPriceStr(pos.currentPrice.toString());
                              }}
                              title="Update Harga Pasar Cepat"
                              className="text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}

                        {/* Edit & Delete Action Buttons */}
                        <div className="ml-2 flex items-center gap-1 border-l border-border pl-2">
                          <button
                            onClick={() => {
                              if (rawAsset) {
                                setEditingAsset(rawAsset);
                                setActiveModal('portfolio_asset');
                              }
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                            title="Ubah Catatan Portofolio"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm(`Hapus catatan ${pos.ticker} (${pos.name}) dari portofolio?`)) {
                                await deleteAsset(pos.assetId);
                              }
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition cursor-pointer"
                            title="Hapus dari Portofolio"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Market Value */}
                      <div className="text-xs">
                        <span className="text-muted-foreground">Nilai Portofolio: </span>
                        <span className="font-mono text-sm font-bold text-foreground">
                          {formatIDR(pos.currentMarketValue)}
                        </span>
                      </div>

                      {/* Floating P/L */}
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-muted-foreground">Floating P/L: </span>
                        <span
                          className={cn(
                            'font-mono font-extrabold',
                            isProfit
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          )}
                        >
                          {isProfit ? '+' : ''}{formatIDR(pos.unrealizedPL)} ({formatPercentage(pos.unrealizedPLPercentage)})
                        </span>
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
