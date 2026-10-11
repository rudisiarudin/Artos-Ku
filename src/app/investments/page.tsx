'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Check,
  X,
  PieChart as PieIcon,
  Bitcoin,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import {
  formatIDR,
  formatPercentage,
  formatStockQuantity,
  formatIndonesianDate,
} from '../../lib/finance/formatters';
import { CurrencyDisplay } from '../../components/shared/CurrencyDisplay';
import { defaultMarketProvider } from '../../lib/finance/marketData';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';

export default function InvestmentsPage() {
  const { positions, assets, saveAsset, setActiveModal } = useFinance();

  const [activeTab, setActiveTab] = useState<'all' | 'stock' | 'crypto'>('all');
  const [editingPriceAssetId, setEditingPriceAssetId] = useState<string | null>(null);
  const [newPriceStr, setNewPriceStr] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Total summary calculations
  const totalMarketValue = positions.reduce((sum, p) => sum + p.currentMarketValue, 0);
  const totalCostBasis = positions.reduce((sum, p) => sum + p.totalCostBasis, 0);
  const totalUnrealizedPL = totalMarketValue - totalCostBasis;
  const totalUnrealizedPLPercent =
    totalCostBasis > 0 ? (totalUnrealizedPL / totalCostBasis) * 100 : 0;
  const totalRealizedPL = positions.reduce((sum, p) => sum + p.realizedPL, 0);

  // Filtered positions
  const filteredPositions = positions.filter((p) => {
    if (activeTab === 'all') return true;
    return p.assetType === activeTab;
  });

  // Refresh prices using market data provider
  const handleRefreshMarketPrices = async () => {
    setIsRefreshing(true);
    try {
      for (const asset of assets) {
        const quote = await defaultMarketProvider.fetchPrice(asset.ticker, asset.asset_type);
        if (quote.price > 0) {
          await saveAsset({
            ...asset,
            current_price: quote.price,
            last_price_updated_at: quote.timestamp,
          });
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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-foreground sm:text-2xl">
            Portofolio Investasi
          </h2>
          <p className="text-xs text-muted-foreground">
            Saham Bursa Efek Indonesia (IDX) & Aset Cryptocurrency
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:flex-wrap sm:items-center">
          <Button
            onClick={() => setActiveModal('stock_trade')}
            className="gap-1.5 text-xs h-10 px-3 font-semibold justify-center"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            <span>Beli Saham</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setActiveModal('crypto_trade')}
            className="gap-1.5 text-xs h-10 px-3 font-semibold justify-center"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            <span>Beli Crypto</span>
          </Button>

          <Button
            variant="ghost"
            onClick={handleRefreshMarketPrices}
            disabled={isRefreshing}
            className="col-span-2 sm:col-span-1 gap-1.5 text-xs h-9 justify-center text-muted-foreground"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Memperbarui...' : 'Perbarui Harga'}</span>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 shadow-sm">
          <span className="text-xs font-medium text-muted-foreground">Nilai Pasar Portofolio</span>
          <div className="mt-2">
            <CurrencyDisplay amount={totalMarketValue} size="xl" />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Modal Investasi: {formatIDR(totalCostBasis)}
          </p>
        </Card>

        <Card className="p-4 shadow-sm">
          <span className="text-xs font-medium text-muted-foreground">Floating Profit / Loss (Unrealized)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <CurrencyDisplay
              amount={totalUnrealizedPL}
              type={totalUnrealizedPL >= 0 ? 'income' : 'expense'}
              size="lg"
              showSign
            />
            <span
              className={`text-xs font-bold ${
                totalUnrealizedPLPercent >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatPercentage(totalUnrealizedPLPercent)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Berdasarkan harga pasar saat ini</p>
        </Card>

        <Card className="p-4 shadow-sm">
          <span className="text-xs font-medium text-muted-foreground">Realized Profit / Loss</span>
          <div className="mt-2">
            <CurrencyDisplay
              amount={totalRealizedPL}
              type={totalRealizedPL >= 0 ? 'income' : 'expense'}
              size="lg"
              showSign
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Keuntungan terealisasi dari penjualan</p>
        </Card>

        <Card className="p-4 shadow-sm">
          <span className="text-xs font-medium text-muted-foreground">Diversifikasi Portofolio</span>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {positions.filter((p) => p.assetType === 'stock').length} Saham IDX
            </Badge>
            <Badge variant="outline" className="text-xs">
              {positions.filter((p) => p.assetType === 'crypto').length} Crypto
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Metode Weighted Average Cost (WAC)</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('all')}
          className={`border-b-2 px-4 py-2.5 text-xs font-medium transition ${
            activeTab === 'all'
              ? 'border-foreground text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Semua Aset ({positions.length})
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={`border-b-2 px-4 py-2.5 text-xs font-medium transition ${
            activeTab === 'stock'
              ? 'border-foreground text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Saham IDX ({positions.filter((p) => p.assetType === 'stock').length})
        </button>
        <button
          onClick={() => setActiveTab('crypto')}
          className={`border-b-2 px-4 py-2.5 text-xs font-medium transition ${
            activeTab === 'crypto'
              ? 'border-foreground text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Cryptocurrency ({positions.filter((p) => p.assetType === 'crypto').length})
        </button>
      </div>

      {/* Positions Table / Cards */}
      <Card className="overflow-hidden shadow-sm">
        {filteredPositions.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Belum ada posisi aset untuk kategori ini.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filteredPositions.map((pos) => {
              const isProfit = pos.unrealizedPL >= 0;
              const isEditingPrice = editingPriceAssetId === pos.assetId;
              const rawAsset = assets.find((a) => a.id === pos.assetId);

              return (
                <div key={pos.assetId} className="p-4 transition hover:bg-muted/20">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    {/* Asset Info */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                          pos.assetType === 'stock'
                            ? 'bg-purple-500/10 text-purple-600'
                            : 'bg-amber-500/10 text-amber-600'
                        }`}
                      >
                        {pos.assetType === 'stock' ? (
                          <TrendingUp className="h-5 w-5" />
                        ) : (
                          <Bitcoin className="h-5 w-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-foreground">{pos.ticker}</h4>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                              pos.assetType === 'stock'
                                ? 'bg-purple-500/10 text-purple-600'
                                : 'bg-amber-500/10 text-amber-600'
                            }`}
                          >
                            {pos.assetType === 'stock' ? 'IDX' : 'Crypto'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{pos.name}</p>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                          <span>
                            Kepemilikan:{' '}
                            <strong className="text-foreground">
                              {pos.assetType === 'stock'
                                ? formatStockQuantity(pos.totalSharesOrUnits)
                                : `${pos.totalSharesOrUnits} unit`}
                            </strong>
                          </span>
                          <span>
                            Avg Buy:{' '}
                            <strong className="text-foreground">{formatIDR(pos.averageCost)}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Price & P/L Stats */}
                    <div className="flex flex-col sm:items-end justify-between border-t border-border/40 pt-2 sm:border-0 sm:pt-0">
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
                              className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setEditingPriceAssetId(null)}
                              className="flex h-6 w-6 items-center justify-center rounded bg-muted text-muted-foreground"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-sm font-bold text-foreground">
                              {formatIDR(pos.currentPrice)}
                            </span>
                            <button
                              onClick={() => {
                                setEditingPriceAssetId(pos.assetId);
                                setNewPriceStr(pos.currentPrice.toString());
                              }}
                              title="Update Harga Manual"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="mt-1 text-xs">
                        <span className="text-muted-foreground">Nilai Pasar: </span>
                        <CurrencyDisplay amount={pos.currentMarketValue} size="md" />
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 text-xs">
                        <span className="text-muted-foreground">P/L: </span>
                        <span
                          className={`font-mono font-bold ${
                            isProfit
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {formatIDR(pos.unrealizedPL)} ({formatPercentage(pos.unrealizedPLPercentage)})
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
