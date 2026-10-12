'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import {
  formatIDR,
  formatPercentage,
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Extract unique platforms
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
    if (activeTab === 'stock' && p.assetType !== 'stock') return false;
    if (activeTab === 'crypto' && p.assetType !== 'crypto') return false;
    if (activeTab === 'other' && (p.assetType === 'stock' || p.assetType === 'crypto')) return false;

    if (selectedPlatform !== 'all') {
      const rawAsset = assets.find((a) => a.id === p.assetId);
      if (rawAsset?.platform !== selectedPlatform) return false;
    }

    return true;
  });

  // Refresh prices using market data provider
  const handleRefreshMarketPrices = async () => {
    if (assets.length === 0) return;
    setIsRefreshing(true);
    try {
      for (const asset of assets) {
        if (asset.asset_type === 'stock' || asset.asset_type === 'crypto') {
          const quote = await defaultMarketProvider.fetchPrice(asset.ticker, asset.asset_type);
          if (quote.price > 0 && quote.price !== asset.current_price) {
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

  // Auto-refresh once on load if any stock or crypto exists
  useEffect(() => {
    if (assets.length > 0) {
      handleRefreshMarketPrices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets.length]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
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
            className="gap-1.5 text-xs h-9 px-3.5 font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Catat Portofolio</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleRefreshMarketPrices}
            disabled={isRefreshing}
            className="gap-1.5 text-xs h-9 px-3 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
            <span>{isRefreshing ? 'Memperbarui...' : 'Perbarui Harga Pasar'}</span>
          </Button>
        </div>
      </div>

      {/* Overview Cards (Pure shadcn/ui zinc) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Nilai Portofolio
          </span>
          <div className="mt-1.5">
            <CurrencyDisplay amount={totalMarketValue} size="xl" />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Total Modal: {formatIDR(totalCostBasis)}
          </p>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Floating Profit / Loss
          </span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <CurrencyDisplay
              amount={totalUnrealizedPL}
              type={totalUnrealizedPL >= 0 ? 'income' : 'expense'}
              size="lg"
              showSign
            />
            <span
              className={cn(
                'text-xs font-semibold font-mono',
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

        <Card className="p-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Modal Investasi
          </span>
          <div className="mt-1.5">
            <CurrencyDisplay amount={totalCostBasis} size="lg" />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Modal pembelian (Cost Basis)
          </p>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Aset & Platform Aktif
          </span>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-xs font-medium">
              {positions.length} Aset
            </Badge>
            {availablePlatforms.map((plat) => (
              <Badge key={plat} variant="outline" className="text-[10px]">
                {plat}
              </Badge>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Tersimpan di ArtosKu
          </p>
        </Card>
      </div>

      {/* Tabs & Filters */}
      <div className="space-y-3">
        {/* Category Tabs */}
        <div className="flex border-b border-border overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'border-b-2 px-4 py-2 text-xs font-medium transition whitespace-nowrap cursor-pointer',
              activeTab === 'all'
                ? 'border-foreground text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Semua Aset ({positions.length})
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={cn(
              'border-b-2 px-4 py-2 text-xs font-medium transition whitespace-nowrap cursor-pointer',
              activeTab === 'stock'
                ? 'border-foreground text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Saham IDX ({positions.filter((p) => p.assetType === 'stock').length})
          </button>
          <button
            onClick={() => setActiveTab('crypto')}
            className={cn(
              'border-b-2 px-4 py-2 text-xs font-medium transition whitespace-nowrap cursor-pointer',
              activeTab === 'crypto'
                ? 'border-foreground text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Crypto ({positions.filter((p) => p.assetType === 'crypto').length})
          </button>
          <button
            onClick={() => setActiveTab('other')}
            className={cn(
              'border-b-2 px-4 py-2 text-xs font-medium transition whitespace-nowrap cursor-pointer',
              activeTab === 'other'
                ? 'border-foreground text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Reksadana & Lainnya ({positions.filter((p) => p.assetType !== 'stock' && p.assetType !== 'crypto').length})
          </button>
        </div>

        {/* Platform Filter Buttons */}
        {availablePlatforms.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-xs font-medium text-muted-foreground mr-1">Platform:</span>
            <button
              onClick={() => setSelectedPlatform('all')}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition border cursor-pointer',
                selectedPlatform === 'all'
                  ? 'bg-foreground text-background border-foreground font-semibold'
                  : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
              )}
            >
              Semua
            </button>
            {availablePlatforms.map((plat) => (
              <button
                key={plat}
                onClick={() => setSelectedPlatform(plat)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition border cursor-pointer',
                  selectedPlatform === plat
                    ? 'bg-foreground text-background border-foreground font-semibold'
                    : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {plat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Positions List */}
      <div className="space-y-3">
        {filteredPositions.length === 0 ? (
          <Card className="p-10 text-center space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Belum Ada Catatan Portofolio
              </p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                Catat kepemilikan saham atau aset yang Anda miliki di Ajaib, Stockbit, atau sekuritas lain. Harga pasar akan diambil otomatis dari API.
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingAsset(null);
                setActiveModal('portfolio_asset');
              }}
              className="text-xs h-9 font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Catat Portofolio Sekarang
            </Button>
          </Card>
        ) : (
          filteredPositions.map((pos) => {
            const rawAsset = assets.find((a) => a.id === pos.assetId);

            return (
              <Card
                key={pos.assetId}
                className="p-4 sm:p-5 transition hover:border-border/90"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left Column: Ticker, Name, Platform Badge */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground font-mono font-bold text-xs">
                      {pos.ticker.slice(0, 4)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground text-base tracking-tight font-mono">
                          {pos.ticker}
                        </h3>
                        {rawAsset?.platform && (
                          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-border text-muted-foreground">
                            {rawAsset.platform}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {pos.assetType === 'stock' ? 'IDX' : pos.assetType === 'crypto' ? 'Crypto' : 'Aset'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {pos.name}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground font-mono">
                        <span>
                          {pos.assetType === 'stock' && pos.totalLots !== null && pos.totalLots !== undefined ? (
                            <>
                              <strong className="text-foreground">{pos.totalLots}</strong> lot ({new Intl.NumberFormat('id-ID').format(pos.totalSharesOrUnits)} lbr)
                            </>
                          ) : (
                            <>
                              <strong className="text-foreground">{pos.totalSharesOrUnits}</strong> unit
                            </>
                          )}
                        </span>
                        <span>•</span>
                        <span>
                          Avg: <strong className="text-foreground">{formatIDR(pos.averageCost)}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Market Price & Valuation */}
                  <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:gap-6 border-t sm:border-t-0 pt-3 sm:pt-0">
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase font-medium">
                        Harga Pasar (API)
                      </span>
                      <span className="text-sm font-bold font-mono text-foreground">
                        {formatIDR(pos.currentPrice)}
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        Modal: {formatIDR(pos.totalCostBasis)}
                      </span>
                    </div>

                    <div className="text-right sm:text-left">
                      <span className="text-[10px] text-muted-foreground block uppercase font-medium">
                        Nilai Pasar & P/L
                      </span>
                      <span className="text-sm font-bold font-mono text-foreground">
                        {formatIDR(pos.currentMarketValue)}
                      </span>
                      <div className="flex items-center justify-end sm:justify-start gap-1">
                        <span
                          className={cn(
                            'text-xs font-semibold font-mono',
                            pos.unrealizedPL >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          )}
                        >
                          {pos.unrealizedPL >= 0 ? '+' : ''}
                          {formatIDR(pos.unrealizedPL)} ({formatPercentage(pos.unrealizedPLPercentage)})
                        </span>
                      </div>
                    </div>

                    {/* Actions: Edit & Delete */}
                    <div className="col-span-2 sm:col-span-1 flex items-center justify-end gap-1 pt-1 sm:pt-0 border-t sm:border-t-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (rawAsset) {
                            setEditingAsset(rawAsset);
                            setActiveModal('portfolio_asset');
                          }
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Edit Kepemilikan"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Hapus catatan ${pos.ticker} dari portofolio?`)) {
                            deleteAsset(pos.assetId);
                          }
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Hapus Aset"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
