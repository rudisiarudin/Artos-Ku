import {
  Account,
  InvestmentAsset,
  InvestmentTrade,
  AssetType,
  Receivable,
  Debt,
  DebtInterestType
} from '../db/types';

/**
 * 1 Lot = 100 Shares for Indonesian Stock Exchange (IDX)
 */
export const LOT_SIZE_IDX = 100;

export function lotsToShares(lots: number): number {
  return Math.round(lots * LOT_SIZE_IDX);
}

export function sharesToLots(shares: number): number {
  return Number((shares / LOT_SIZE_IDX).toFixed(2));
}

/**
 * Calculate Net Worth accurately:
 * Net Worth = Total Cash/Bank Balances + Investment Market Value + Collectible Receivables - Outstanding Debt Principal
 */
export function calculateNetWorth(params: {
  accounts: Account[];
  investmentMarketValue: number;
  receivables: Receivable[];
  debts: Debt[];
}): {
  totalCash: number;
  investmentValue: number;
  totalReceivables: number;
  totalDebts: number;
  netWorth: number;
} {
  const { accounts, investmentMarketValue, receivables, debts } = params;

  // Sum of all active account balances
  const totalCash = accounts
    .filter((a) => a.is_active && !a.is_archived)
    .reduce((sum, a) => sum + Number(a.current_balance || 0), 0);

  // Sum of collectible receivables (unpaid, partially_paid, overdue)
  const totalReceivables = receivables
    .filter((r) => r.status !== 'paid')
    .reduce((sum, r) => sum + Number(r.current_balance || 0), 0);

  // Sum of active debts outstanding principal
  const totalDebts = debts
    .filter((d) => d.status !== 'paid_off')
    .reduce((sum, d) => sum + Number(d.current_principal || 0), 0);

  const netWorth = totalCash + investmentMarketValue + totalReceivables - totalDebts;

  return {
    totalCash,
    investmentValue: investmentMarketValue,
    totalReceivables,
    totalDebts,
    netWorth,
  };
}

export interface PortfolioPosition {
  assetId: string;
  ticker: string;
  name: string;
  platform?: string | null;
  assetType: AssetType;
  totalSharesOrUnits: number;
  totalLots?: number;
  totalCostBasis: number;
  averageCost: number;
  currentPrice: number;
  currentMarketValue: number;
  unrealizedPL: number;
  unrealizedPLPercentage: number;
  realizedPL: number;
  notes?: string | null;
  totalDividends?: number;
}

/**
 * Calculate Weighted Average Cost (WAC), Realized P/L, and Unrealized P/L
 * Directly calculates from asset holding data, or chronologically processes buy and sell trades.
 */
export function calculateAssetPosition(
  asset: InvestmentAsset,
  trades: InvestmentTrade[] = []
): PortfolioPosition {
  // If asset directly records portfolio holdings (Catat Portofolio Tanpa Transaksi Beli/Jual)
  const directUnits = Number(
    asset.shares_or_units ?? (asset.lots ? lotsToShares(Number(asset.lots)) : 0)
  );
  const directAvgPrice = Number(asset.average_buy_price || 0);

  if (directUnits > 0 || directAvgPrice > 0 || trades.length === 0) {
    const totalCostBasis = directUnits * directAvgPrice;
    const currentPrice = Number(asset.current_price || directAvgPrice);
    const currentMarketValue = directUnits * currentPrice;
    const unrealizedPL = currentMarketValue - totalCostBasis;
    const unrealizedPLPercentage =
      totalCostBasis > 0 ? (unrealizedPL / totalCostBasis) * 100 : 0;

    return {
      assetId: asset.id,
      ticker: asset.ticker,
      name: asset.name,
      platform: asset.platform || null,
      assetType: asset.asset_type,
      totalSharesOrUnits: directUnits,
      totalLots:
        asset.asset_type === 'stock'
          ? (asset.lots ?? sharesToLots(directUnits))
          : undefined,
      totalCostBasis,
      averageCost: directAvgPrice,
      currentPrice,
      currentMarketValue,
      unrealizedPL,
      unrealizedPLPercentage,
      realizedPL: 0,
      notes: asset.notes || null,
    };
  }

  // Fallback: Sort trades chronologically
  const sortedTrades = [...trades].sort(
    (a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
  );

  let remainingUnits = 0;
  let totalCostBasis = 0;
  let averageCost = 0;
  let realizedPL = 0;

  for (const trade of sortedTrades) {
    const qty = Number(trade.shares_or_units);
    const price = Number(trade.price_per_unit);
    const fee = Number(trade.fee || 0);

    if (trade.trade_type === 'buy') {
      const tradeCost = qty * price + fee;
      remainingUnits += qty;
      totalCostBasis += tradeCost;
      averageCost = remainingUnits > 0 ? totalCostBasis / remainingUnits : 0;
    } else if (trade.trade_type === 'sell') {
      const sellProceeds = qty * price - fee;
      const costOfSoldShares = qty * averageCost;
      const tradeRealizedPL = sellProceeds - costOfSoldShares;

      realizedPL += tradeRealizedPL;
      remainingUnits = Math.max(0, remainingUnits - qty);
      totalCostBasis = remainingUnits * averageCost;

      if (remainingUnits === 0) {
        averageCost = 0;
        totalCostBasis = 0;
      }
    }
  }

  const currentPrice = Number(asset.current_price || 0);
  const currentMarketValue = remainingUnits * currentPrice;
  const unrealizedPL = remainingUnits > 0 ? currentMarketValue - totalCostBasis : 0;
  const unrealizedPLPercentage =
    totalCostBasis > 0 ? (unrealizedPL / totalCostBasis) * 100 : 0;

  return {
    assetId: asset.id,
    ticker: asset.ticker,
    name: asset.name,
    platform: asset.platform || null,
    assetType: asset.asset_type,
    totalSharesOrUnits: remainingUnits,
    totalLots: asset.asset_type === 'stock' ? sharesToLots(remainingUnits) : undefined,
    totalCostBasis,
    averageCost,
    currentPrice,
    currentMarketValue,
    unrealizedPL,
    unrealizedPLPercentage,
    realizedPL,
    notes: asset.notes || null,
  };
}

/**
 * Calculate monthly installment for debts
 */
export function calculateInstallment(
  principal: number,
  annualRatePercentage: number,
  tenorMonths: number,
  interestType: DebtInterestType = 'flat'
): {
  monthlyInstallment: number;
  monthlyPrincipal: number;
  monthlyInterest: number;
  totalInterest: number;
  totalPayment: number;
} {
  if (tenorMonths <= 0 || principal <= 0) {
    return {
      monthlyInstallment: 0,
      monthlyPrincipal: 0,
      monthlyInterest: 0,
      totalInterest: 0,
      totalPayment: 0,
    };
  }

  if (interestType === 'none' || annualRatePercentage <= 0) {
    const monthlyPrincipal = principal / tenorMonths;
    return {
      monthlyInstallment: Math.round(monthlyPrincipal),
      monthlyPrincipal: Math.round(monthlyPrincipal),
      monthlyInterest: 0,
      totalInterest: 0,
      totalPayment: principal,
    };
  }

  if (interestType === 'flat') {
    const totalInterest = principal * (annualRatePercentage / 100) * (tenorMonths / 12);
    const totalPayment = principal + totalInterest;
    const monthlyInstallment = totalPayment / tenorMonths;
    const monthlyPrincipal = principal / tenorMonths;
    const monthlyInterest = totalInterest / tenorMonths;

    return {
      monthlyInstallment: Math.round(monthlyInstallment),
      monthlyPrincipal: Math.round(monthlyPrincipal),
      monthlyInterest: Math.round(monthlyInterest),
      totalInterest: Math.round(totalInterest),
      totalPayment: Math.round(totalPayment),
    };
  }

  // Effective / Annuity
  const monthlyRate = annualRatePercentage / 100 / 12;
  const monthlyInstallment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, tenorMonths))) /
    (Math.pow(1 + monthlyRate, tenorMonths) - 1);
  const totalPayment = monthlyInstallment * tenorMonths;
  const totalInterest = totalPayment - principal;

  // First month breakdown approx
  const firstMonthInterest = principal * monthlyRate;
  const firstMonthPrincipal = monthlyInstallment - firstMonthInterest;

  return {
    monthlyInstallment: Math.round(monthlyInstallment),
    monthlyPrincipal: Math.round(firstMonthPrincipal),
    monthlyInterest: Math.round(firstMonthInterest),
    totalInterest: Math.round(totalInterest),
    totalPayment: Math.round(totalPayment),
  };
}

/**
 * Calculate budget status
 */
export function calculateBudgetUtilization(
  spent: number,
  monthlyLimit: number
): {
  spent: number;
  monthlyLimit: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  status: 'safe' | 'warning' | 'danger';
} {
  const remaining = monthlyLimit - spent;
  const percentage = monthlyLimit > 0 ? (spent / monthlyLimit) * 100 : 0;
  const isOverBudget = spent > monthlyLimit;

  let status: 'safe' | 'warning' | 'danger' = 'safe';
  if (percentage >= 100) {
    status = 'danger';
  } else if (percentage >= 80) {
    status = 'warning';
  }

  return {
    spent,
    monthlyLimit,
    remaining,
    percentage: Math.min(percentage, 100),
    isOverBudget,
    status,
  };
}
