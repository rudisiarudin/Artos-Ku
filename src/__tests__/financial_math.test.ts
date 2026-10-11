import { describe, it, expect } from 'vitest';
import {
  lotsToShares,
  sharesToLots,
  calculateAssetPosition,
  calculateNetWorth,
  calculateInstallment,
  calculateBudgetUtilization,
} from '../lib/finance/calculations';
import {
  Account,
  InvestmentAsset,
  InvestmentTrade,
  Receivable,
  Debt,
} from '../lib/db/types';

describe('Financial Math & Accounting Engine', () => {
  describe('Stock Lot & Share Conversion (IDX)', () => {
    it('correctly converts Indonesian stock lots to shares (1 lot = 100 shares)', () => {
      expect(lotsToShares(1)).toBe(100);
      expect(lotsToShares(10)).toBe(1000);
      expect(lotsToShares(25.5)).toBe(2550);
    });

    it('correctly converts shares to lots', () => {
      expect(sharesToLots(100)).toBe(1);
      expect(sharesToLots(1500)).toBe(15);
      expect(sharesToLots(250)).toBe(2.5);
    });
  });

  describe('Weighted Average Cost (WAC) & Profit/Loss', () => {
    const mockAsset: InvestmentAsset = {
      id: 'asset-1',
      user_id: 'user-1',
      asset_type: 'stock',
      ticker: 'BBCA',
      name: 'Bank Central Asia',
      exchange: 'IDX',
      currency: 'IDR',
      current_price: 10000,
      last_price_updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    it('calculates average cost accurately on single purchase with fee', () => {
      const trades: InvestmentTrade[] = [
        {
          id: 't-1',
          user_id: 'user-1',
          asset_id: 'asset-1',
          trade_type: 'buy',
          trade_date: '2026-01-01T00:00:00Z',
          shares_or_units: 1000, // 10 lots
          price_per_unit: 9000,
          fee: 15000,
          total_amount: 9015000,
          created_at: '2026-01-01T00:00:00Z',
        },
      ];

      const pos = calculateAssetPosition(mockAsset, trades);
      expect(pos.totalSharesOrUnits).toBe(1000);
      expect(pos.totalLots).toBe(10);
      expect(pos.totalCostBasis).toBe(9015000);
      expect(pos.averageCost).toBe(9015);
      expect(pos.currentMarketValue).toBe(1000 * 10000); // 10,000,000
      expect(pos.unrealizedPL).toBe(10000000 - 9015000); // 985,000
    });

    it('calculates weighted average cost after multiple buys and realized P/L on partial sell', () => {
      const trades: InvestmentTrade[] = [
        // Buy 1000 shares @ Rp9,000 without fee for simplicity
        {
          id: 't-1',
          user_id: 'user-1',
          asset_id: 'asset-1',
          trade_type: 'buy',
          trade_date: '2026-01-01T00:00:00Z',
          shares_or_units: 1000,
          price_per_unit: 9000,
          fee: 0,
          total_amount: 9000000,
          created_at: '2026-01-01T00:00:00Z',
        },
        // Buy 1000 shares @ Rp10,000 -> Total 2000 shares, WAC = Rp9,500
        {
          id: 't-2',
          user_id: 'user-1',
          asset_id: 'asset-1',
          trade_type: 'buy',
          trade_date: '2026-01-10T00:00:00Z',
          shares_or_units: 1000,
          price_per_unit: 10000,
          fee: 0,
          total_amount: 10000000,
          created_at: '2026-01-10T00:00:00Z',
        },
        // Sell 500 shares @ Rp11,000 -> Cost basis of 500 shares is 500 * 9500 = 4,750,000
        // Proceeds = 5,500,000. Realized P/L = 750,000
        {
          id: 't-3',
          user_id: 'user-1',
          asset_id: 'asset-1',
          trade_type: 'sell',
          trade_date: '2026-01-15T00:00:00Z',
          shares_or_units: 500,
          price_per_unit: 11000,
          fee: 0,
          total_amount: 5500000,
          created_at: '2026-01-15T00:00:00Z',
        },
      ];

      const pos = calculateAssetPosition(mockAsset, trades);
      expect(pos.totalSharesOrUnits).toBe(1500);
      expect(pos.averageCost).toBe(9500);
      expect(pos.realizedPL).toBe(750000);
      expect(pos.totalCostBasis).toBe(1500 * 9500); // 14,250,000
      expect(pos.currentMarketValue).toBe(1500 * 10000); // 15,000,000
      expect(pos.unrealizedPL).toBe(750000);
    });

    it('handles cryptocurrency fractional quantities correctly', () => {
      const cryptoAsset: InvestmentAsset = {
        id: 'asset-btc',
        user_id: 'user-1',
        asset_type: 'crypto',
        ticker: 'BTC',
        name: 'Bitcoin',
        currency: 'IDR',
        current_price: 1000000000,
        last_price_updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const trades: InvestmentTrade[] = [
        {
          id: 't-btc-1',
          user_id: 'user-1',
          asset_id: 'asset-btc',
          trade_type: 'buy',
          trade_date: '2026-01-01T00:00:00Z',
          shares_or_units: 0.05,
          price_per_unit: 800000000,
          fee: 50000,
          total_amount: 40050000,
          created_at: '2026-01-01T00:00:00Z',
        },
      ];

      const pos = calculateAssetPosition(cryptoAsset, trades);
      expect(pos.totalSharesOrUnits).toBeCloseTo(0.05, 8);
      expect(pos.currentMarketValue).toBe(50000000); // 0.05 * 1,000,000,000
      expect(pos.unrealizedPL).toBe(50000000 - 40050000); // 9,950,000
    });
  });

  describe('Net Worth Calculation & Anti-Double-Counting', () => {
    it('accurately computes Net Worth = Cash + Investments + Receivables - Debts', () => {
      const accounts: Account[] = [
        {
          id: 'acc-1',
          user_id: 'u-1',
          name: 'BCA',
          type: 'bank',
          currency: 'IDR',
          opening_balance: 5000000,
          current_balance: 10000000,
          color: '#005E9E',
          is_active: true,
          is_archived: false,
          created_at: '',
          updated_at: '',
        },
        {
          id: 'acc-2',
          user_id: 'u-1',
          name: 'GoPay',
          type: 'ewallet',
          currency: 'IDR',
          opening_balance: 500000,
          current_balance: 2000000,
          color: '#00AA13',
          is_active: true,
          is_archived: false,
          created_at: '',
          updated_at: '',
        },
      ];

      const receivables: Receivable[] = [
        {
          id: 'rec-1',
          user_id: 'u-1',
          borrower_name: 'Budi',
          principal_amount: 5000000,
          current_balance: 3000000, // partially repaid, 3M collectible
          interest_rate: 0,
          loan_date: '2026-01-01',
          due_date: '2026-02-01',
          status: 'partially_paid',
          created_at: '',
          updated_at: '',
        },
      ];

      const debts: Debt[] = [
        {
          id: 'debt-1',
          user_id: 'u-1',
          creditor_name: 'FIF',
          debt_name: 'Vario',
          type: 'installment',
          original_principal: 20000000,
          current_principal: 15000000, // 15M remaining liability
          interest_rate: 10,
          interest_type: 'flat',
          tenor_months: 24,
          monthly_installment: 1000000,
          due_day: 5,
          remaining_installments: 18,
          status: 'active',
          start_date: '2026-01-01',
          created_at: '',
          updated_at: '',
        },
      ];

      const investmentMarketValue = 25000000; // Portfolio current value

      const res = calculateNetWorth({
        accounts,
        investmentMarketValue,
        receivables,
        debts,
      });

      // Total Cash = 10,000,000 + 2,000,000 = 12,000,000
      // Investments = 25,000,000
      // Collectible Receivables = 3,000,000
      // Debts = 15,000,000
      // Net Worth = 12M + 25M + 3M - 15M = 25,000,000
      expect(res.totalCash).toBe(12000000);
      expect(res.investmentValue).toBe(25000000);
      expect(res.totalReceivables).toBe(3000000);
      expect(res.totalDebts).toBe(15000000);
      expect(res.netWorth).toBe(25000000);
    });
  });

  describe('Debt & Installment Loan Calculations', () => {
    it('calculates flat interest installment correctly', () => {
      // Rp12,000,000 principal, 12 months tenor, 10% annual flat rate
      // Total interest = 12,000,000 * 0.10 * 1 = 1,200,000
      // Total payment = 13,200,000
      // Monthly installment = 1,100,000 (Principal: 1,000,000, Interest: 100,000)
      const res = calculateInstallment(12000000, 10, 12, 'flat');
      expect(res.monthlyInstallment).toBe(1100000);
      expect(res.monthlyPrincipal).toBe(1000000);
      expect(res.monthlyInterest).toBe(100000);
      expect(res.totalInterest).toBe(1200000);
      expect(res.totalPayment).toBe(13200000);
    });
  });

  describe('Budget Utilization Tracking', () => {
    it('evaluates budget utilization and warnings', () => {
      const safe = calculateBudgetUtilization(400000, 1000000);
      expect(safe.percentage).toBe(40);
      expect(safe.status).toBe('safe');
      expect(safe.isOverBudget).toBe(false);

      const warning = calculateBudgetUtilization(850000, 1000000);
      expect(warning.percentage).toBe(85);
      expect(warning.status).toBe('warning');

      const danger = calculateBudgetUtilization(1200000, 1000000);
      expect(danger.isOverBudget).toBe(true);
      expect(danger.status).toBe('danger');
    });
  });
});
