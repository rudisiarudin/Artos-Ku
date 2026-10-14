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
import { addToSyncQueue, removeSyncQueueItem } from '../lib/db/indexeddb';
import { supabase, isSupabaseConfigured } from '../lib/db/supabase';
import { User } from '@supabase/supabase-js';
import { generateUUID, isValidUUID } from '../lib/utils';
import { processSyncQueue, normalizeCategoryId, normalizeReferenceId } from '../lib/db/sync';

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
  user: User | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  logout: () => Promise<void>;
  completeOnboarding: (account: Account) => Promise<void>;
  resetOnboarding: () => void;
  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  saveAccount: (account: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  editingAccount: Account | null;
  setEditingAccount: (account: Account | null) => void;
  saveCategory: (category: Category) => Promise<void>;
  saveAsset: (asset: InvestmentAsset) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  editingAsset: InvestmentAsset | null;
  setEditingAsset: (asset: InvestmentAsset | null) => void;
  addTrade: (trade: Omit<InvestmentTrade, 'id' | 'created_at'>) => Promise<void>;
  saveReceivable: (receivable: Receivable) => Promise<void>;
  deleteReceivable: (id: string) => Promise<void>;
  recordReceivablePayment: (payment: Omit<ReceivablePayment, 'id' | 'created_at'>) => Promise<void>;
  selectedReceivable: Receivable | null;
  setSelectedReceivable: (receivable: Receivable | null) => void;
  saveDebt: (debt: Debt) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  recordDebtPayment: (payment: Omit<DebtPayment, 'id' | 'created_at'>) => Promise<void>;
  selectedDebt: Debt | null;
  setSelectedDebt: (debt: Debt | null) => void;
  saveBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  clearCache: () => Promise<void>;
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
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingAsset, setEditingAsset] = useState<InvestmentAsset | null>(null);
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(false);

  // Auth and Onboarding State
  const [user, setUser] = useState<User | null>(null);
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
          id.startsWith('trade-demo') ||
          id.startsWith('rec-demo') ||
          id.startsWith('debt-demo');

        let modified = false;
        const idReplacements = new Map<string, string>();

        accs.forEach((a) => {
          if (!isValidUUID(a.id) && !isSeedId(a.id)) {
            const newId = generateUUID();
            idReplacements.set(a.id, newId);
            a.id = newId;
            modified = true;
          }
          if (a.user_id !== targetUserId && !isSeedId(a.id)) {
            a.user_id = targetUserId;
            modified = true;
          }
        });

        txs.forEach((t) => {
          if (!isValidUUID(t.id) && !isSeedId(t.id)) {
            t.id = generateUUID();
            modified = true;
          }
          if (t.source_account_id && idReplacements.has(t.source_account_id)) {
            t.source_account_id = idReplacements.get(t.source_account_id)!;
            modified = true;
          }
          if (t.destination_account_id && idReplacements.has(t.destination_account_id)) {
            t.destination_account_id = idReplacements.get(t.destination_account_id)!;
            modified = true;
          }
          if (t.user_id !== targetUserId && !isSeedId(t.id)) {
            t.user_id = targetUserId;
            modified = true;
          }
        });

        recs.forEach((r) => {
          if (!isValidUUID(r.id) && !isSeedId(r.id)) {
            r.id = generateUUID();
            modified = true;
          }
          if (r.account_id && idReplacements.has(r.account_id)) {
            r.account_id = idReplacements.get(r.account_id)!;
            modified = true;
          }
          if (r.user_id !== targetUserId && !isSeedId(r.id)) {
            r.user_id = targetUserId;
            modified = true;
          }
        });

        dbts.forEach((d) => {
          if (!isValidUUID(d.id) && !isSeedId(d.id)) {
            d.id = generateUUID();
            modified = true;
          }
          if (d.disbursement_account_id && idReplacements.has(d.disbursement_account_id)) {
            d.disbursement_account_id = idReplacements.get(d.disbursement_account_id)!;
            modified = true;
          }
          if (d.payment_account_id && idReplacements.has(d.payment_account_id)) {
            d.payment_account_id = idReplacements.get(d.payment_account_id)!;
            modified = true;
          }
          if (d.user_id !== targetUserId && !isSeedId(d.id)) {
            d.user_id = targetUserId;
            modified = true;
          }
        });

        bdgs.forEach((b) => {
          if (b.user_id !== targetUserId) {
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
            id.startsWith('trade-demo') ||
            id.startsWith('rec-demo') ||
            id.startsWith('debt-demo')));

      const isAllowedUserId = (uid?: string | null) =>
        !targetUserId ||
        uid === targetUserId ||
        uid === 'default-user' ||
        uid === 'user_local' ||
        uid === 'local_user' ||
        Boolean(uid && uid.startsWith('user_'));

      const cleanAccs = accs.filter((a) => !isSeedFixture(a.id) && isAllowedUserId(a.user_id));
      const cleanTxs = txs.filter((t) => !isSeedFixture(t.id) && isAllowedUserId(t.user_id));
      let cleanAssets = targetUserId ? asts.filter((a) => !isSeedFixture(a.id) && isAllowedUserId(a.user_id)) : asts.filter((a) => !isSeedFixture(a.id));
      let cleanTrades = targetUserId ? trds.filter((t) => !isSeedFixture(t.id) && isAllowedUserId(t.user_id)) : trds.filter((t) => !isSeedFixture(t.id));
      let cleanRecs = targetUserId ? recs.filter((r) => !isSeedFixture(r.id) && isAllowedUserId(r.user_id)) : recs.filter((r) => !isSeedFixture(r.id));
      let cleanDebts = targetUserId ? dbts.filter((d) => !isSeedFixture(d.id) && isAllowedUserId(d.user_id)) : dbts.filter((d) => !isSeedFixture(d.id));
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
            let dbTradesRes = await supabase.from('investment_trades').select('*').eq('user_id', uid).order('trade_date', { ascending: false });
            if (dbTradesRes.error) {
              dbTradesRes = await supabase.from('trades').select('*').eq('user_id', uid).order('created_at', { ascending: false });
            }

            const [dbAccs, dbTxs, dbAssets, dbRecs, dbDebts, dbBudgets, dbReminders] = await Promise.all([
              supabase.from('accounts').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
              supabase.from('transactions').select('*').eq('user_id', uid).order('date', { ascending: false }),
              supabase.from('assets').select('*').eq('user_id', uid),
              supabase.from('receivables').select('*').eq('user_id', uid),
              supabase.from('debts').select('*').eq('user_id', uid),
              supabase.from('budgets').select('*').eq('user_id', uid),
              supabase.from('reminders').select('*').eq('user_id', uid),
            ]);

            // Reconcile Accounts (Ensures PC and Mobile accounts stay completely in sync)
            if (dbAccs.data && dbAccs.data.length > 0) {
              const dbIds = new Set(dbAccs.data.map((a: Account) => a.id));
              const missingOnCloud = cleanAccs.filter((a) => !dbIds.has(a.id));
              if (missingOnCloud.length > 0) {
                for (const acc of missingOnCloud) {
                  await addToSyncQueue({ action: 'insert', table: 'accounts', data: acc as unknown as Record<string, unknown> });
                }
                await processSyncQueue(uid);
                resolvedAccs = [...dbAccs.data, ...missingOnCloud];
              } else {
                resolvedAccs = dbAccs.data;
              }
              await storage.setCollection('artosku_accounts', resolvedAccs);
            } else if (cleanAccs.length > 0) {
              for (const acc of cleanAccs) {
                await addToSyncQueue({ action: 'insert', table: 'accounts', data: acc as unknown as Record<string, unknown> });
              }
              await processSyncQueue(uid);
            }

            // Reconcile Transactions (Ensures transactions recorded on mobile or PC are merged)
            if (dbTxs.data && dbTxs.data.length > 0) {
              const dbIds = new Set(dbTxs.data.map((t: Transaction) => t.id));
              const missingOnCloud = cleanTxs.filter((t) => !dbIds.has(t.id));
              if (missingOnCloud.length > 0) {
                for (const tx of missingOnCloud) {
                  await addToSyncQueue({ action: 'insert', table: 'transactions', data: tx as unknown as Record<string, unknown> });
                }
                await processSyncQueue(uid);
                resolvedTxs = [...dbTxs.data, ...missingOnCloud];
              } else {
                resolvedTxs = dbTxs.data;
              }
              const normalizedTxs = resolvedTxs.map((t: Transaction) => ({
                ...t,
                description: t.description || 'Transaksi',
                type: t.type || 'expense',
              }));
              resolvedTxs = normalizedTxs;
              await storage.setCollection('artosku_transactions', normalizedTxs);
            } else if (cleanTxs.length > 0) {
              resolvedTxs = cleanTxs;
              for (const tx of cleanTxs) {
                await addToSyncQueue({ action: 'insert', table: 'transactions', data: tx as unknown as Record<string, unknown> });
              }
              await processSyncQueue(uid);
              await storage.setCollection('artosku_transactions', cleanTxs);
            }

            let resolvedAssets = dbAssets.data;
            if ((!resolvedAssets || resolvedAssets.length === 0) && dbAssets.error) {
              const alt = await supabase.from('investment_assets').select('*').eq('user_id', uid);
              if (alt.data && alt.data.length > 0) {
                resolvedAssets = alt.data;
              }
            }
            if (resolvedAssets && resolvedAssets.length > 0) {
              cleanAssets = resolvedAssets;
              await storage.setCollection('artosku_assets', resolvedAssets);
            }
            // Reconcile Assets
            if (cleanAssets.length > 0 && (!resolvedAssets || resolvedAssets.length === 0)) {
              for (const asset of cleanAssets) {
                await addToSyncQueue({ action: 'insert', table: 'assets', data: asset as unknown as Record<string, unknown> });
              }
              await processSyncQueue(uid);
            }

            if (dbTradesRes.data && dbTradesRes.data.length > 0) {
              cleanTrades = dbTradesRes.data;
              await storage.setCollection('artosku_trades', dbTradesRes.data);
            } else if (cleanTrades.length > 0) {
              for (const tr of cleanTrades) {
                await addToSyncQueue({ action: 'insert', table: 'trades', data: tr as unknown as Record<string, unknown> });
              }
              await processSyncQueue(uid);
            }

            // Reconcile Receivables (Ensures HP local receivables push to Supabase so PC receives them)
            if (dbRecs.data && dbRecs.data.length > 0) {
              const dbIds = new Set(dbRecs.data.map((r: Receivable) => r.id));
              const missingOnCloud = cleanRecs.filter((r) => !dbIds.has(r.id));
              if (missingOnCloud.length > 0) {
                for (const rec of missingOnCloud) {
                  await addToSyncQueue({ action: 'insert', table: 'receivables', data: rec as unknown as Record<string, unknown> });
                }
                await processSyncQueue(uid);
                cleanRecs = [...dbRecs.data, ...missingOnCloud];
              } else {
                cleanRecs = dbRecs.data;
              }
              await storage.setCollection('artosku_receivables', cleanRecs);
            } else if (cleanRecs.length > 0) {
              for (const rec of cleanRecs) {
                await addToSyncQueue({ action: 'insert', table: 'receivables', data: rec as unknown as Record<string, unknown> });
              }
              await processSyncQueue(uid);
            }

            // Reconcile Debts
            if (dbDebts.data && dbDebts.data.length > 0) {
              const dbIds = new Set(dbDebts.data.map((d: Debt) => d.id));
              const missingOnCloud = cleanDebts.filter((d) => !dbIds.has(d.id));
              if (missingOnCloud.length > 0) {
                for (const debt of missingOnCloud) {
                  await addToSyncQueue({ action: 'insert', table: 'debts', data: debt as unknown as Record<string, unknown> });
                }
                await processSyncQueue(uid);
                cleanDebts = [...dbDebts.data, ...missingOnCloud];
              } else {
                cleanDebts = dbDebts.data;
              }
              await storage.setCollection('artosku_debts', cleanDebts);
            } else if (cleanDebts.length > 0) {
              for (const debt of cleanDebts) {
                await addToSyncQueue({ action: 'insert', table: 'debts', data: debt as unknown as Record<string, unknown> });
              }
              await processSyncQueue(uid);
            }

            // Reconcile Budgets
            if (dbBudgets.data && dbBudgets.data.length > 0) {
              const dbIds = new Set(dbBudgets.data.map((b: Budget) => b.id));
              const missingOnCloud = cleanBudgets.filter((b) => !dbIds.has(b.id));
              if (missingOnCloud.length > 0) {
                for (const b of missingOnCloud) {
                  await addToSyncQueue({ action: 'insert', table: 'budgets', data: b as unknown as Record<string, unknown> });
                }
                await processSyncQueue(uid);
                cleanBudgets = [...dbBudgets.data, ...missingOnCloud];
              } else {
                cleanBudgets = dbBudgets.data;
              }
              await storage.setCollection('artosku_budgets', cleanBudgets);
            } else if (cleanBudgets.length > 0) {
              for (const b of cleanBudgets) {
                await addToSyncQueue({ action: 'insert', table: 'budgets', data: b as unknown as Record<string, unknown> });
              }
              await processSyncQueue(uid);
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

      // Self-heal: Deduplicate accounts sharing identical account_number
      // (e.g. from onboarding preset + custom account creation like BCA Tahapan Utama vs BCA Xpresi)
      const seenAccountNumbers = new Map<string, Account>();
      const deduplicatedAccs: Account[] = [];
      for (const acc of resolvedAccs) {
        const accNum = acc.account_number?.trim();
        if (accNum && accNum.length >= 4) {
          if (seenAccountNumbers.has(accNum)) {
            const existing = seenAccountNumbers.get(accNum)!;
            needPersistAccounts = true;
            // Prefer user's customized name (e.g. 'BCA Xpresi') over generic default onboarding preset name ('BCA Tahapan Utama')
            if (existing.name === 'BCA Tahapan Utama' && acc.name !== 'BCA Tahapan Utama') {
              const idx = deduplicatedAccs.findIndex((a) => a.id === existing.id);
              if (idx !== -1) {
                storage.deleteAccount(existing.id).catch(() => {});
                deduplicatedAccs[idx] = acc;
                seenAccountNumbers.set(accNum, acc);
              }
            } else {
              storage.deleteAccount(acc.id).catch(() => {});
            }
            continue;
          } else {
            seenAccountNumbers.set(accNum, acc);
          }
        }
        deduplicatedAccs.push(acc);
      }
      resolvedAccs = deduplicatedAccs;

      if (needPersistAccounts) {
        await storage.setCollection('artosku_accounts', resolvedAccs);
      }

      resolvedTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

    const checkIsOnboarded = async (currentUser: User | null): Promise<boolean> => {
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
          await loadAll();
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }
  }, [pathname, router, loadAll]);

  // Network & Cross-Device Data Sync Listener
  useEffect(() => {
    loadAll();

    const handleOnline = () => {
      setIsOnline(true);
      loadAll();
    };
    const handleOffline = () => setIsOnline(false);

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadAll();
      }
    };

    const handleWindowFocus = () => {
      loadAll();
    };

    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      window.addEventListener('focus', handleWindowFocus);
      document.addEventListener('visibilitychange', handleVisibility);
    }

    // Subscribe to Supabase Realtime for instant cross-device updates (PC <-> HP)
    let channel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;
    if (isSupabaseConfigured() && supabase) {
      try {
        channel = supabase
          .channel('artosku_realtime_sync')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public' },
            () => {
              loadAll();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Realtime channel subscription error:', err);
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('focus', handleWindowFocus);
        document.removeEventListener('visibilitychange', handleVisibility);
      }
      if (channel && supabase) {
        supabase.removeChannel(channel);
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
      const txId = generateUUID();

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
    let authUid = user?.id;
    if (!authUid && isSupabaseConfigured() && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        authUid = session?.user?.id;
        if (authUid && !user) {
          setUser(session?.user || null);
          setIsAuthenticated(true);
        }
      } catch {}
    }
    const activeUid = authUid || getActiveUserId();
    const newTx: Transaction = {
      ...txData,
      id: generateUUID(),
      user_id: activeUid,
      source_account_id: isValidUUID(txData.source_account_id) ? txData.source_account_id : null,
      destination_account_id: isValidUUID(txData.destination_account_id) ? txData.destination_account_id : null,
      category_id: normalizeCategoryId(txData.category_id),
      reference_id: normalizeReferenceId(txData.reference_id),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Immediately record in local storage (IndexedDB)
    await storage.addTransaction(newTx);

    // 2. Immediately update in-memory React state for instantaneous mobile UI feedback
    setTransactions((prev) => [newTx, ...prev.filter((t) => t.id !== newTx.id)]);

    // 3. Direct push to Supabase for instantaneous cloud sync (PC receives Realtime notification)
    if (isSupabaseConfigured() && supabase && authUid && authUid !== 'local_user' && authUid !== 'default-user') {
      try {
        const txPayload: Record<string, unknown> = {
          id: newTx.id,
          user_id: authUid,
          date: newTx.date,
          type: newTx.type,
          description: newTx.description || 'Transaksi',
          amount: Number(newTx.amount),
          source_account_id: newTx.source_account_id,
          destination_account_id: newTx.destination_account_id,
          category_id: newTx.category_id,
          payment_method: newTx.payment_method || 'transfer',
          tags: Array.isArray(newTx.tags) ? newTx.tags : [],
          reference_id: newTx.reference_id,
        };
        if (newTx.notes) txPayload.notes = newTx.notes;

        let { error: txErr } = await supabase.from('transactions').upsert(txPayload);
        if (
          txErr &&
          (txErr.code === '23503' ||
            txErr.message.toLowerCase().includes('foreign key') ||
            txErr.message.toLowerCase().includes('violates foreign key constraint'))
        ) {
          txPayload.category_id = null;
          txPayload.source_account_id = null;
          txPayload.destination_account_id = null;
          const retry = await supabase.from('transactions').upsert(txPayload);
          txErr = retry.error;
        }

        if (!txErr) {
          // Direct cloud write succeeded, remove item from sync queue
          await removeSyncQueueItem(newTx.id);

          // Also push source account updated balance to Supabase
          if (newTx.source_account_id) {
            const updatedAccs = await storage.getAccounts();
            const srcAcc = updatedAccs.find((a) => a.id === newTx.source_account_id);
            if (srcAcc) {
              await supabase.from('accounts').upsert({
                id: srcAcc.id,
                user_id: authUid,
                name: srcAcc.name,
                type: srcAcc.type,
                account_number: srcAcc.account_number || null,
                institution_name: srcAcc.institution_name || null,
                currency: srcAcc.currency || 'IDR',
                opening_balance: Number(srcAcc.opening_balance || 0),
                current_balance: Number(srcAcc.current_balance || 0),
                color: srcAcc.color || '#10B981',
                is_active: srcAcc.is_active !== false,
                is_archived: Boolean(srcAcc.is_archived),
              });
            }
          }
        } else {
          console.warn('[FinanceContext] Direct cloud push notice, queue will retry:', txErr.message);
        }
      } catch (cloudErr) {
        console.warn('[FinanceContext] Direct cloud push exception:', cloudErr);
      }
    }

    if (isSupabaseConfigured() && supabase && activeUid) {
      await processSyncQueue(activeUid);
    }
    await loadAll();
  };

  const deleteTransaction = async (id: string) => {
    await storage.deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (isSupabaseConfigured() && supabase && user?.id) {
      try {
        await supabase.from('transactions').delete().eq('id', id);
      } catch {}
      await processSyncQueue(user.id);
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

  const deleteAccount = async (id: string) => {
    await storage.deleteAccount(id);
    if (isSupabaseConfigured() && supabase) {
      await processSyncQueue(user?.id);
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
    if (isSupabaseConfigured() && supabase) {
      await processSyncQueue(sanitized.user_id);
    }
    await loadAll();
  };

  const deleteAsset = async (id: string) => {
    await storage.deleteAsset(id);
    if (isSupabaseConfigured() && supabase) {
      await processSyncQueue(user?.id);
    }
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
    if (isSupabaseConfigured() && supabase) {
      await processSyncQueue(newTrade.user_id);
    }
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
    if (isSupabaseConfigured() && supabase) {
      await processSyncQueue(sanitized.user_id);
    }
    await loadAll();
  };

  const deleteReceivable = async (id: string) => {
    await storage.deleteReceivable(id);
    if (isSupabaseConfigured() && supabase) {
      await processSyncQueue(user?.id);
    }
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
    if (isSupabaseConfigured() && supabase) {
      await processSyncQueue(newPayment.user_id);
    }
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
    if (isSupabaseConfigured() && supabase) {
      await processSyncQueue(sanitized.user_id);
    }
    await loadAll();
  };

  const deleteDebt = async (id: string) => {
    await storage.deleteDebt(id);
    if (isSupabaseConfigured() && supabase) {
      await processSyncQueue(user?.id);
    }
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
    if (isSupabaseConfigured() && supabase) {
      await processSyncQueue(newPayment.user_id);
    }
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
    if (isSupabaseConfigured() && supabase) {
      await processSyncQueue(sanitized.user_id);
    }
    await loadAll();
  };

  const deleteBudget = async (id: string) => {
    await storage.deleteBudget(id);
    if (isSupabaseConfigured() && supabase) {
      await processSyncQueue(user?.id);
    }
    await loadAll();
  };

  const toggleReminder = async (id: string) => {
    const rem = reminders.find((r) => r.id === id);
    if (!rem) return;
    await storage.saveReminder({ ...rem, is_completed: !rem.is_completed });
    await loadAll();
  };

  const clearCache = async () => {
    setIsLoading(true);
    try {
      await storage.clearLocalCache();
      await loadAll();
    } finally {
      setIsLoading(false);
    }
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
        selectedReceivable,
        setSelectedReceivable,
        debts,
        selectedDebt,
        setSelectedDebt,
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
        deleteAccount,
        editingAccount,
        setEditingAccount,
        saveCategory,
        saveAsset,
        deleteAsset,
        editingAsset,
        setEditingAsset,
        addTrade,
        saveReceivable,
        deleteReceivable,
        recordReceivablePayment,
        saveDebt,
        deleteDebt,
        recordDebtPayment,
        saveBudget,
        deleteBudget,
        toggleReminder,
        refreshData: loadAll,
        clearCache,
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
