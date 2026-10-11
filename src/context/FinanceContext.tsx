'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Account,
  Category,
  Transaction,
  InvestmentAsset,
  InvestmentTrade,
  Receivable,
  ReceivablePayment,
  Debt,
  DebtPayment,
  Budget,
  Reminder,
} from '../lib/db/types';
import { storage } from '../lib/db/storage';
import {
  calculateAssetPosition,
  calculateNetWorth,
  PortfolioPosition,
} from '../lib/finance/calculations';
import { getSyncQueue } from '../lib/db/indexeddb';

interface FinanceContextType {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  assets: InvestmentAsset[];
  trades: InvestmentTrade[];
  receivables: Receivable[];
  debts: Debt[];
  budgets: Budget[];
  reminders: Reminder[];
  positions: PortfolioPosition[];
  investmentMarketValue: number;
  netWorthData: ReturnType<typeof calculateNetWorth>;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  savingsRate: number;
  isLoading: boolean;
  isOnline: boolean;
  pendingSyncCount: number;
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  saveAccount: (account: Account) => Promise<void>;
  saveCategory: (category: Category) => Promise<void>;
  saveAsset: (asset: InvestmentAsset) => Promise<void>;
  addTrade: (trade: Omit<InvestmentTrade, 'id' | 'created_at'>) => Promise<void>;
  saveReceivable: (receivable: Receivable) => Promise<void>;
  recordReceivablePayment: (payment: Omit<ReceivablePayment, 'id' | 'created_at'>) => Promise<void>;
  saveDebt: (debt: Debt) => Promise<void>;
  recordDebtPayment: (payment: Omit<DebtPayment, 'id' | 'created_at'>) => Promise<void>;
  saveBudget: (budget: Budget) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  resetDemoData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [assets, setAssets] = useState<InvestmentAsset[]>([]);
  const [trades, setTrades] = useState<InvestmentTrade[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(false);

  const togglePrivacyMode = () => setIsPrivacyMode((prev) => !prev);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [accs, cats, txs, asts, trds, recs, dbts, bdgs, rems] = await Promise.all([
        storage.getAccounts(),
        storage.getCategories(),
        storage.getTransactions(),
        storage.getAssets(),
        storage.getTrades(),
        storage.getReceivables(),
        storage.getDebts(),
        storage.getBudgets(),
        storage.getReminders(),
      ]);

      setAccounts(accs);
      setCategories(cats);
      setTransactions(txs);
      setAssets(asts);
      setTrades(trds);
      setReceivables(recs);
      setDebts(dbts);
      setBudgets(bdgs);
      setReminders(rems);

      const queue = await getSyncQueue();
      setPendingSyncCount(queue.length);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  // Compute Portfolio positions
  const positions = useMemo(() => {
    return assets.map((asset) => {
      const assetTrades = trades.filter((t) => t.asset_id === asset.id);
      return calculateAssetPosition(asset, assetTrades);
    });
  }, [assets, trades]);

  // Total investment market value
  const investmentMarketValue = useMemo(() => {
    return positions.reduce((sum, p) => sum + p.currentMarketValue, 0);
  }, [positions]);

  // Net Worth
  const netWorthData = useMemo(() => {
    return calculateNetWorth({
      accounts,
      investmentMarketValue,
      receivables,
      debts,
    });
  }, [accounts, investmentMarketValue, receivables, debts]);

  // Monthly Income and Expenses
  const { monthlyIncome, monthlyExpenses, monthlySavings, savingsRate } = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const currentMonthTxs = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const income = currentMonthTxs
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const expenses = currentMonthTxs
      .filter((t) => t.type === 'expense' || t.type === 'installment_payment')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const savings = income - expenses;
    const rate = income > 0 ? Math.max(0, (savings / income) * 100) : 0;

    return {
      monthlyIncome: income,
      monthlyExpenses: expenses,
      monthlySavings: savings,
      savingsRate: Number(rate.toFixed(1)),
    };
  }, [transactions]);

  // Actions
  const addTransaction = async (txData: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await storage.addTransaction(newTx);
    await loadAll();
  };

  const deleteTransaction = async (id: string) => {
    await storage.deleteTransaction(id);
    await loadAll();
  };

  const saveAccount = async (account: Account) => {
    await storage.saveAccount(account);
    await loadAll();
  };

  const saveCategory = async (category: Category) => {
    await storage.saveCategory(category);
    await loadAll();
  };

  const saveAsset = async (asset: InvestmentAsset) => {
    await storage.saveAsset(asset);
    await loadAll();
  };

  const addTrade = async (tradeData: Omit<InvestmentTrade, 'id' | 'created_at'>) => {
    const newTrade: InvestmentTrade = {
      ...tradeData,
      id: `trade_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    };
    await storage.addTrade(newTrade);
    await loadAll();
  };

  const saveReceivable = async (receivable: Receivable) => {
    await storage.saveReceivable(receivable);
    await loadAll();
  };

  const recordReceivablePayment = async (
    paymentData: Omit<ReceivablePayment, 'id' | 'created_at'>
  ) => {
    const newPayment: ReceivablePayment = {
      ...paymentData,
      id: `rec_pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    };
    await storage.recordReceivablePayment(newPayment);
    await loadAll();
  };

  const saveDebt = async (debt: Debt) => {
    await storage.saveDebt(debt);
    await loadAll();
  };

  const recordDebtPayment = async (paymentData: Omit<DebtPayment, 'id' | 'created_at'>) => {
    const newPayment: DebtPayment = {
      ...paymentData,
      id: `debt_pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    };
    await storage.recordDebtPayment(newPayment);
    await loadAll();
  };

  const saveBudget = async (budget: Budget) => {
    await storage.saveBudget(budget);
    await loadAll();
  };

  const toggleReminder = async (id: string) => {
    const rem = reminders.find((r) => r.id === id);
    if (!rem) return;
    await storage.saveReminder({ ...rem, is_completed: !rem.is_completed });
    await loadAll();
  };

  const resetDemoData = async () => {
    await storage.resetToSeed();
    await loadAll();
  };

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        categories,
        transactions,
        assets,
        trades,
        receivables,
        debts,
        budgets,
        reminders,
        positions,
        investmentMarketValue,
        netWorthData,
        monthlyIncome,
        monthlyExpenses,
        monthlySavings,
        savingsRate,
        isLoading,
        isOnline,
        pendingSyncCount,
        activeModal,
        setActiveModal,
        isPrivacyMode,
        togglePrivacyMode,
        addTransaction,
        deleteTransaction,
        saveAccount,
        saveCategory,
        saveAsset,
        addTrade,
        saveReceivable,
        recordReceivablePayment,
        saveDebt,
        recordDebtPayment,
        saveBudget,
        toggleReminder,
        refreshData: loadAll,
        resetDemoData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
