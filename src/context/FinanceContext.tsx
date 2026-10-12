'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
import { supabase, isSupabaseConfigured } from '../lib/db/supabase';
import { generateUUID, isValidUUID } from '../lib/utils';
import { processSyncQueue } from '../lib/db/sync';

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
  // Auth & Onboarding
  user: any | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  logout: () => Promise<void>;
  completeOnboarding: (account: Account) => Promise<void>;
  resetOnboarding: () => void;
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
  const router = useRouter();
  const pathname = usePathname();

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

  // Auth and Onboarding State
  const [user, setUser] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(true);

  const togglePrivacyMode = () => setIsPrivacyMode((prev) => !prev);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await storage.purgeDummyData();

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

      // Auto-heal / migrate any user-created items that were saved with legacy 'default-user'
      let activeAuthId: string | null = null;
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          activeAuthId = session?.user?.id || null;
        } catch {}
      }
      const targetUserId = activeAuthId || user?.id || (typeof window !== 'undefined' ? localStorage.getItem('artosku_user_id') : null);

      if (targetUserId) {
        const isSeedId = (id: string) =>
          ['acc-bca', 'acc-mandiri', 'acc-gopay', 'acc-cash', 'acc-rdi'].includes(id) ||
          id.startsWith('tx-demo') ||
          id.startsWith('trade-') ||
          id.startsWith('rec-') ||
          id.startsWith('debt-');

        let modified = false;
        accs.forEach((a) => {
          if (a.user_id === 'default-user' && !isSeedId(a.id)) {
            a.user_id = targetUserId;
            modified = true;
          }
        });
        txs.forEach((t) => {
          if (t.user_id === 'default-user' && !isSeedId(t.id)) {
            t.user_id = targetUserId;
            modified = true;
          }
        });
        recs.forEach((r) => {
          if (r.user_id === 'default-user' && !isSeedId(r.id)) {
            r.user_id = targetUserId;
            modified = true;
          }
        });
        dbts.forEach((d) => {
          if (d.user_id === 'default-user' && !isSeedId(d.id)) {
            d.user_id = targetUserId;
            modified = true;
          }
        });
        bdgs.forEach((b) => {
          if (b.user_id === 'default-user') {
            b.user_id = targetUserId;
            modified = true;
          }
        });

        if (modified) {
          await Promise.all([
            storage.setCollection('artosku_accounts', accs),
            storage.setCollection('artosku_transactions', txs),
            storage.setCollection('artosku_receivables', recs),
            storage.setCollection('artosku_debts', dbts),
            storage.setCollection('artosku_budgets', bdgs),
          ]);
        }
      }

      // Filter out only true demo fixtures
      const isSeedFixture = (id: string) =>
        ['acc-bca', 'acc-mandiri', 'acc-gopay', 'acc-cash', 'acc-rdi'].includes(id) ||
        (typeof id === 'string' &&
          (id.startsWith('tx-demo') ||
            id.startsWith('trade-') ||
            id.startsWith('rec-') ||
            id.startsWith('debt-')));

      let cleanAccs = targetUserId ? accs.filter((a) => !isSeedFixture(a.id) && a.user_id === targetUserId) : accs.filter((a) => !isSeedFixture(a.id));
      let cleanTxs = targetUserId ? txs.filter((t) => !isSeedFixture(t.id) && t.user_id === targetUserId) : txs.filter((t) => !isSeedFixture(t.id));
      let cleanAssets = targetUserId ? asts.filter((a) => !isSeedFixture(a.id) && a.user_id === targetUserId) : asts.filter((a) => !isSeedFixture(a.id));
      let cleanTrades = targetUserId ? trds.filter((t) => !isSeedFixture(t.id) && t.user_id === targetUserId) : trds.filter((t) => !isSeedFixture(t.id));
      let cleanRecs = targetUserId ? recs.filter((r) => !isSeedFixture(r.id) && r.user_id === targetUserId) : recs.filter((r) => !isSeedFixture(r.id));
      let cleanDebts = targetUserId ? dbts.filter((d) => !isSeedFixture(d.id) && d.user_id === targetUserId) : dbts.filter((d) => !isSeedFixture(d.id));
      let cleanBudgets = targetUserId ? bdgs.filter((b) => b.user_id === targetUserId) : bdgs;
      let cleanReminders = targetUserId ? rems.filter((r) => r.user_id === targetUserId) : rems;

      let resolvedAccs = cleanAccs;
      let resolvedTxs = cleanTxs;

      // Sync with Supabase cloud database across devices (PC, Mobile, etc.)
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const uid = session?.user?.id || targetUserId;
          if (uid) {
            // 1. Process any pending offline edits from this device first
            await processSyncQueue(uid);

            // 2. Query latest authoritative state from Supabase
            const [dbAccs, dbTxs, dbAssets, dbTrades, dbRecs, dbDebts, dbBudgets, dbReminders] = await Promise.all([
              supabase.from('accounts').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
              supabase.from('transactions').select('*').eq('user_id', uid).order('date', { ascending: false }),
              supabase.from('assets').select('*').eq('user_id', uid),
              supabase.from('trades').select('*').eq('user_id', uid).order('date', { ascending: false }),
              supabase.from('receivables').select('*').eq('user_id', uid),
              supabase.from('debts').select('*').eq('user_id', uid),
              supabase.from('budgets').select('*').eq('user_id', uid),
              supabase.from('reminders').select('*').eq('user_id', uid),
            ]);

            if (dbAccs.data && dbAccs.data.length > 0) {
              resolvedAccs = dbAccs.data;
              await storage.setCollection('artosku_accounts', dbAccs.data);
            }
            if (dbTxs.data && dbTxs.data.length > 0) {
              resolvedTxs = dbTxs.data;
              await storage.setCollection('artosku_transactions', dbTxs.data);
            }
            if (dbAssets.data && dbAssets.data.length > 0) {
              cleanAssets = dbAssets.data;
              await storage.setCollection('artosku_assets', dbAssets.data);
            }
            if (dbTrades.data && dbTrades.data.length > 0) {
              cleanTrades = dbTrades.data;
              await storage.setCollection('artosku_trades', dbTrades.data);
            }
            if (dbRecs.data && dbRecs.data.length > 0) {
              cleanRecs = dbRecs.data;
              await storage.setCollection('artosku_receivables', dbRecs.data);
            }
            if (dbDebts.data && dbDebts.data.length > 0) {
              cleanDebts = dbDebts.data;
              await storage.setCollection('artosku_debts', dbDebts.data);
            }
            if (dbBudgets.data && dbBudgets.data.length > 0) {
              cleanBudgets = dbBudgets.data;
              await storage.setCollection('artosku_budgets', dbBudgets.data);
            }
            if (dbReminders.data && dbReminders.data.length > 0) {
              cleanReminders = dbReminders.data;
              await storage.setCollection('artosku_reminders', dbReminders.data);
            }
          }
        } catch (fetchErr) {
          console.warn('Could not sync/hydrate from Supabase:', fetchErr);
        }
      }

      // Self-heal: If an account has double balance from previous onboarding duplicate accounting bug
      let needPersistAccounts = false;
      for (const acc of resolvedAccs) {
        if (
          Number(acc.opening_balance) > 0 &&
          Number(acc.current_balance) === Number(acc.opening_balance) * 2 &&
          resolvedTxs.length <= 1
        ) {
          acc.current_balance = Number(acc.opening_balance);
          needPersistAccounts = true;
        }
      }
      if (needPersistAccounts) {
        await storage.setCollection('artosku_accounts', resolvedAccs);
      }

      setAccounts(resolvedAccs);
      setCategories(cats);
      setTransactions(resolvedTxs);
      setAssets(cleanAssets);
      setTrades(cleanTrades);
      setReceivables(cleanRecs);
      setDebts(cleanDebts);
      setBudgets(cleanBudgets);
      setReminders(cleanReminders);

      // Process pending sync queue against Supabase
      const remainingPending = await processSyncQueue(targetUserId || undefined);
      setPendingSyncCount(remainingPending);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Auth & Onboarding Guard Logic
  useEffect(() => {
    let isMounted = true;

    const checkIsOnboarded = async (currentUser: any): Promise<boolean> => {
      // 1. Check user metadata from Supabase
      if (currentUser?.user_metadata?.onboarding_completed) {
        return true;
      }

      // 2. Check localStorage flags
      if (typeof window !== 'undefined') {
        if (localStorage.getItem('artosku_onboarding_completed') === 'true') return true;
        if (currentUser?.id && localStorage.getItem(`artosku_onboarded_${currentUser.id}`) === 'true') return true;
      }

      // 3. Check existing accounts in IndexedDB / local storage
      const localAccs = await storage.getAccounts();
      const validAccs = localAccs.filter((a) => a.user_id !== 'default-user');
      if (validAccs.length > 0) {
        return true;
      }

      // 4. Check Supabase accounts table if connected
      if (isSupabaseConfigured() && supabase && currentUser?.id) {
        try {
          const { count } = await supabase
            .from('accounts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', currentUser.id);
          if ((count ?? 0) > 0) return true;
        } catch {}
      }

      return false;
    };

    const evaluateAuth = async () => {
      try {
        let authUser = null;
        if (isSupabaseConfigured() && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          authUser = session?.user || null;
        }

        const onboarded = await checkIsOnboarded(authUser);

        if (!isMounted) return;

        const authed = Boolean(authUser);
        setUser(authUser);
        setIsAuthenticated(authed);
        setHasCompletedOnboarding(onboarded);

        const isAuthRoute =
          pathname.startsWith('/login') ||
          pathname.startsWith('/register') ||
          pathname.startsWith('/auth');
        const isOnboardingRoute = pathname.startsWith('/onboarding');

        // 1. Not Authenticated: Force to /login if trying to access dashboard/core app
        if (!authed) {
          if (!isAuthRoute && !isOnboardingRoute) {
            router.push('/login');
          }
          return;
        }

        // 2. Authenticated but haven't onboarded yet: Force to /onboarding
        if (!onboarded) {
          if (!isOnboardingRoute) {
            router.push('/onboarding');
          }
          return;
        }

        // 3. Authenticated & Onboarded: If on /login or /onboarding, go to home
        if (isAuthRoute || isOnboardingRoute) {
          router.push('/');
        }
      } catch (err) {
        console.warn('Error during auth check:', err);
      }
    };

    evaluateAuth();

    // Listen to Supabase Auth State changes
    if (isSupabaseConfigured() && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;
        const currentUsr = session?.user || null;
        setUser(currentUsr);
        setIsAuthenticated(Boolean(currentUsr));

        if (event === 'SIGNED_OUT') {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('artosku_demo_session');
          }
          router.push('/login');
        } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          const onboarded = await checkIsOnboarded(currentUsr);
          setHasCompletedOnboarding(onboarded);
          if (!onboarded) {
            if (pathname !== '/onboarding') {
              router.push('/onboarding');
            }
          } else {
            if (pathname === '/login' || pathname === '/register' || pathname === '/onboarding') {
              router.push('/');
            }
          }
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }
  }, [pathname, router]);

  // Network & Data Load Listener
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
  }, [loadAll]);

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

  // Auth & Onboarding Handlers
  const logout = async () => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    await storage.clearAllUserData();
    await storage.clearSyncQueue();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('artosku_user_id');
      localStorage.removeItem('artosku_onboarding_completed');
      localStorage.removeItem('artosku_demo_session');
    }
    setUser(null);
    setIsAuthenticated(false);
    setAccounts([]);
    setTransactions([]);
    setAssets([]);
    setTrades([]);
    setReceivables([]);
    setDebts([]);
    setBudgets([]);
    setReminders([]);
    router.push('/login');
  };

  const completeOnboarding = async (initialAccount: Account) => {
    // 1. Wipe all previous dummy/demo data completely
    await storage.clearAllUserData();

    // 2. Save ONLY the user's initial account from onboarding
    // initialAccount.current_balance is already set to opening_balance
    await storage.setCollection('artosku_accounts', [initialAccount]);

    // 3. If opening balance > 0, record ONLY the single Initial Balance Transaction
    let initialTx: Transaction | null = null;
    if (Number(initialAccount.opening_balance) > 0) {
      const txId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `tx_init_${Date.now()}`;

      initialTx = {
        id: txId,
        user_id: initialAccount.user_id,
        date: new Date().toISOString(),
        type: 'income',
        amount: Number(initialAccount.opening_balance),
        source_account_id: initialAccount.id,
        destination_account_id: null,
        category_id: null,
        description: `Saldo Awal: ${initialAccount.name}`,
        notes: 'Pencatatan saldo awal saat onboarding dompet pertama ArtosKu.',
        payment_method: initialAccount.type,
        tags: ['onboarding', 'saldo_awal'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // CRITICAL FIX FOR DOUBLE BALANCE:
      // We set the initial transaction collection directly.
      // We do NOT call storage.addTransaction(initialTx) because initialAccount.current_balance
      // is ALREADY initialized with opening_balance! Calling addTransaction would add
      // opening_balance a second time onto current_balance, which caused the double balance bug.
      await storage.setCollection('artosku_transactions', [initialTx]);
    } else {
      await storage.setCollection('artosku_transactions', []);
    }

    // 4. Ensure all other models are strictly empty
    await storage.setCollection('artosku_assets', []);
    await storage.setCollection('artosku_trades', []);
    await storage.setCollection('artosku_receivables', []);
    await storage.setCollection('artosku_receivable_payments', []);
    await storage.setCollection('artosku_debts', []);
    await storage.setCollection('artosku_debt_payments', []);
    await storage.setCollection('artosku_budgets', []);
    await storage.setCollection('artosku_reminders', []);

    // 5. If Supabase is connected and user is authenticated, sync to Supabase database
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('accounts').upsert({
          id: initialAccount.id,
          user_id: initialAccount.user_id,
          name: initialAccount.name,
          type: initialAccount.type,
          account_number: initialAccount.account_number,
          institution_name: initialAccount.institution_name,
          currency: initialAccount.currency,
          opening_balance: initialAccount.opening_balance,
          current_balance: initialAccount.current_balance,
          color: initialAccount.color,
          is_active: initialAccount.is_active,
          is_archived: initialAccount.is_archived,
        });

        if (initialTx) {
          await supabase.from('transactions').upsert({
            id: initialTx.id,
            user_id: initialAccount.user_id,
            date: initialTx.date,
            type: initialTx.type,
            amount: initialTx.amount,
            source_account_id: initialTx.source_account_id,
            destination_account_id: initialTx.destination_account_id,
            category_id: initialTx.category_id,
            description: initialTx.description,
            notes: initialTx.notes,
            payment_method: initialTx.payment_method,
            tags: initialTx.tags,
          });
        }

        await supabase.auth.updateUser({
          data: { onboarding_completed: true },
        });
      } catch (syncErr) {
        console.warn('Sync to Supabase during onboarding completed with notice:', syncErr);
      }
    }

    // 6. Mark Onboarding as Completed in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('artosku_onboarding_completed', 'true');
      if (initialAccount.user_id) {
        localStorage.setItem(`artosku_onboarded_${initialAccount.user_id}`, 'true');
      }
    }
    setHasCompletedOnboarding(true);

    await loadAll();
    router.push('/');
  };

  const resetOnboarding = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('artosku_onboarding_completed');
    }
    setHasCompletedOnboarding(false);
    router.push('/onboarding');
  };

  // Actions
  const getActiveUserId = () => {
    return user?.id || (accounts[0]?.user_id && accounts[0].user_id !== 'default-user' ? accounts[0].user_id : null) || (typeof window !== 'undefined' ? localStorage.getItem('artosku_user_id') : null) || 'local_user';
  };

  const addTransaction = async (txData: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => {
    const activeUid = getActiveUserId();
    const newTx: Transaction = {
      ...txData,
      id: generateUUID(),
      user_id: txData.user_id && txData.user_id !== 'default-user' ? txData.user_id : activeUid,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await storage.addTransaction(newTx);
    if (isSupabaseConfigured() && supabase) {
      await processSyncQueue(newTx.user_id);
    }
    await loadAll();
  };

  const deleteTransaction = async (id: string) => {
    await storage.deleteTransaction(id);
    if (isSupabaseConfigured() && supabase) {
      await processSyncQueue(user?.id);
    }
    await loadAll();
  };

  const saveAccount = async (account: Account) => {
    const activeUid = getActiveUserId();
    const sanitized: Account = {
      ...account,
      id: isValidUUID(account.id) ? account.id : generateUUID(),
      user_id: account.user_id && account.user_id !== 'default-user' ? account.user_id : activeUid,
    };
    await storage.saveAccount(sanitized);
    if (isSupabaseConfigured() && supabase) {
      await processSyncQueue(sanitized.user_id);
    }
    await loadAll();
  };

  const saveCategory = async (category: Category) => {
    const activeUid = getActiveUserId();
    const sanitized: Category = {
      ...category,
      id: isValidUUID(category.id) ? category.id : generateUUID(),
      user_id: category.user_id && category.user_id !== 'default-user' ? category.user_id : activeUid,
    };
    await storage.saveCategory(sanitized);
    await loadAll();
  };

  const saveAsset = async (asset: InvestmentAsset) => {
    const activeUid = getActiveUserId();
    const sanitized: InvestmentAsset = {
      ...asset,
      id: isValidUUID(asset.id) ? asset.id : generateUUID(),
      user_id: asset.user_id && asset.user_id !== 'default-user' ? asset.user_id : activeUid,
    };
    await storage.saveAsset(sanitized);
    await loadAll();
  };

  const addTrade = async (tradeData: Omit<InvestmentTrade, 'id' | 'created_at'>) => {
    const activeUid = getActiveUserId();
    const newTrade: InvestmentTrade = {
      ...tradeData,
      id: generateUUID(),
      user_id: tradeData.user_id && tradeData.user_id !== 'default-user' ? tradeData.user_id : activeUid,
      created_at: new Date().toISOString(),
    };
    await storage.addTrade(newTrade);
    await loadAll();
  };

  const saveReceivable = async (receivable: Receivable) => {
    const activeUid = getActiveUserId();
    const sanitized: Receivable = {
      ...receivable,
      id: isValidUUID(receivable.id) ? receivable.id : generateUUID(),
      user_id: receivable.user_id && receivable.user_id !== 'default-user' ? receivable.user_id : activeUid,
    };
    await storage.saveReceivable(sanitized);
    await loadAll();
  };

  const recordReceivablePayment = async (
    paymentData: Omit<ReceivablePayment, 'id' | 'created_at'>
  ) => {
    const activeUid = getActiveUserId();
    const newPayment: ReceivablePayment = {
      ...paymentData,
      id: generateUUID(),
      user_id: paymentData.user_id && paymentData.user_id !== 'default-user' ? paymentData.user_id : activeUid,
      created_at: new Date().toISOString(),
    };
    await storage.recordReceivablePayment(newPayment);
    await loadAll();
  };

  const saveDebt = async (debt: Debt) => {
    const activeUid = getActiveUserId();
    const sanitized: Debt = {
      ...debt,
      id: isValidUUID(debt.id) ? debt.id : generateUUID(),
      user_id: debt.user_id && debt.user_id !== 'default-user' ? debt.user_id : activeUid,
    };
    await storage.saveDebt(sanitized);
    await loadAll();
  };

  const recordDebtPayment = async (paymentData: Omit<DebtPayment, 'id' | 'created_at'>) => {
    const activeUid = getActiveUserId();
    const newPayment: DebtPayment = {
      ...paymentData,
      id: generateUUID(),
      user_id: paymentData.user_id && paymentData.user_id !== 'default-user' ? paymentData.user_id : activeUid,
      created_at: new Date().toISOString(),
    };
    await storage.recordDebtPayment(newPayment);
    await loadAll();
  };

  const saveBudget = async (budget: Budget) => {
    const activeUid = getActiveUserId();
    const sanitized: Budget = {
      ...budget,
      id: isValidUUID(budget.id) ? budget.id : generateUUID(),
      user_id: budget.user_id && budget.user_id !== 'default-user' ? budget.user_id : activeUid,
    };
    await storage.saveBudget(sanitized);
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
        // Auth & Onboarding
        user,
        isAuthenticated,
        hasCompletedOnboarding,
        logout,
        completeOnboarding,
        resetOnboarding,
        // Actions
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
