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
  Reminder
} from './types';
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_CATEGORIES,
  DEFAULT_ASSETS,
  DEFAULT_TRADES,
  DEFAULT_RECEIVABLES,
  DEFAULT_DEBTS,
  DEFAULT_BUDGETS,
  DEFAULT_TRANSACTIONS,
  DEFAULT_REMINDERS,
} from './seedData';
import { addToSyncQueue, idbGet, idbSet } from './indexeddb';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  ACCOUNTS: 'artosku_accounts',
  CATEGORIES: 'artosku_categories',
  TRANSACTIONS: 'artosku_transactions',
  ASSETS: 'artosku_assets',
  TRADES: 'artosku_trades',
  RECEIVABLES: 'artosku_receivables',
  REC_PAYMENTS: 'artosku_receivable_payments',
  DEBTS: 'artosku_debts',
  DEBT_PAYMENTS: 'artosku_debt_payments',
  BUDGETS: 'artosku_budgets',
  REMINDERS: 'artosku_reminders',
};

class ArtosKuStorage {
  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  // Load collection with fallback
  async getCollection<T>(key: string, defaultData: T[] = []): Promise<T[]> {
    if (!this.isClient()) return defaultData;
    try {
      const fromIdb = await idbGet<T[]>(key);
      if (fromIdb !== undefined && Array.isArray(fromIdb)) {
        return fromIdb;
      }
      const fromLocal = localStorage.getItem(key);
      if (fromLocal !== null) {
        try {
          const parsed = JSON.parse(fromLocal);
          if (Array.isArray(parsed)) {
            await idbSet(key, parsed);
            return parsed;
          }
        } catch {}
      }
    } catch (err) {
      console.warn('Storage read failed', err);
    }
    // Save defaults
    await this.setCollection(key, defaultData);
    return defaultData;
  }

  async setCollection<T>(key: string, data: T[]): Promise<void> {
    if (!this.isClient()) return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
      await idbSet(key, data);
    } catch (err) {
      console.warn('Storage write failed', err);
    }
  }

  // Clear all data for a clean account state
  async clearAllUserData(): Promise<void> {
    if (!this.isClient()) return;
    await Promise.all([
      this.setCollection(STORAGE_KEYS.ACCOUNTS, []),
      this.setCollection(STORAGE_KEYS.TRANSACTIONS, []),
      this.setCollection(STORAGE_KEYS.ASSETS, []),
      this.setCollection(STORAGE_KEYS.TRADES, []),
      this.setCollection(STORAGE_KEYS.RECEIVABLES, []),
      this.setCollection(STORAGE_KEYS.REC_PAYMENTS, []),
      this.setCollection(STORAGE_KEYS.DEBTS, []),
      this.setCollection(STORAGE_KEYS.DEBT_PAYMENTS, []),
      this.setCollection(STORAGE_KEYS.BUDGETS, []),
      this.setCollection(STORAGE_KEYS.REMINDERS, []),
    ]);
  }

  // Purge any contaminated seed demo records from earlier demo sessions
  async purgeDummyData(): Promise<void> {
    if (!this.isClient()) return;
    const cleanList = async (key: string) => {
      try {
        let list = await idbGet<any[]>(key);
        if (!list) {
          const raw = localStorage.getItem(key);
          if (raw) list = JSON.parse(raw);
        }
        if (Array.isArray(list)) {
          const filtered = list.filter((item) => item.user_id !== 'default-user');
          if (filtered.length !== list.length) {
            await this.setCollection(key, filtered);
          }
        }
      } catch (err) {
        console.warn('purgeDummyData key failed', key, err);
      }
    };

    await Promise.all([
      cleanList(STORAGE_KEYS.ACCOUNTS),
      cleanList(STORAGE_KEYS.TRANSACTIONS),
      cleanList(STORAGE_KEYS.ASSETS),
      cleanList(STORAGE_KEYS.TRADES),
      cleanList(STORAGE_KEYS.RECEIVABLES),
      cleanList(STORAGE_KEYS.DEBTS),
      cleanList(STORAGE_KEYS.BUDGETS),
      cleanList(STORAGE_KEYS.REMINDERS),
    ]);
  }

  // ACCOUNTS
  async getAccounts(): Promise<Account[]> {
    return this.getCollection(STORAGE_KEYS.ACCOUNTS, []);
  }

  async saveAccount(account: Account): Promise<void> {
    const list = await this.getAccounts();
    const index = list.findIndex((a) => a.id === account.id);
    let updated: Account[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = account;
    } else {
      updated = [account, ...list];
    }
    await this.setCollection(STORAGE_KEYS.ACCOUNTS, updated);
    await addToSyncQueue({
      action: index >= 0 ? 'update' : 'insert',
      table: 'accounts',
      data: account,
    });
  }

  // TRANSACTIONS & STRICT FINANCIAL ACCOUNTING
  async getTransactions(): Promise<Transaction[]> {
    return this.getCollection(STORAGE_KEYS.TRANSACTIONS, []);
  }

  async addTransaction(tx: Transaction): Promise<void> {
    const transactions = await this.getTransactions();
    const accounts = await this.getAccounts();
    const updatedAccounts = [...accounts];

    // Strictly apply accounting balances based on transaction type
    const srcAcc = updatedAccounts.find((a) => a.id === tx.source_account_id);
    const dstAcc = updatedAccounts.find((a) => a.id === tx.destination_account_id);

    switch (tx.type) {
      case 'income':
        if (srcAcc) {
          srcAcc.current_balance = Number(srcAcc.current_balance) + Number(tx.amount);
        }
        break;

      case 'expense':
      case 'installment_payment':
      case 'debt_repayment':
      case 'receivable_disbursement':
      case 'investment_buy':
        if (srcAcc) {
          srcAcc.current_balance = Number(srcAcc.current_balance) - Number(tx.amount);
        }
        break;

      case 'transfer':
        if (srcAcc && dstAcc) {
          srcAcc.current_balance = Number(srcAcc.current_balance) - Number(tx.amount);
          dstAcc.current_balance = Number(dstAcc.current_balance) + Number(tx.amount);
        }
        break;

      case 'investment_sell':
      case 'receivable_repayment':
        if (srcAcc) {
          srcAcc.current_balance = Number(srcAcc.current_balance) + Number(tx.amount);
        }
        break;

      case 'balance_adjustment':
        if (srcAcc) {
          srcAcc.current_balance = Number(tx.amount);
        }
        break;
    }

    const updatedTransactions = [tx, ...transactions];
    await this.setCollection(STORAGE_KEYS.TRANSACTIONS, updatedTransactions);
    await this.setCollection(STORAGE_KEYS.ACCOUNTS, updatedAccounts);

    await addToSyncQueue({
      action: 'insert',
      table: 'transactions',
      data: tx,
    });
  }

  async deleteTransaction(txId: string): Promise<void> {
    const transactions = await this.getTransactions();
    const target = transactions.find((t) => t.id === txId);
    if (!target) return;

    // Rollback account balances
    const accounts = await this.getAccounts();
    const updatedAccounts = [...accounts];
    const srcAcc = updatedAccounts.find((a) => a.id === target.source_account_id);
    const dstAcc = updatedAccounts.find((a) => a.id === target.destination_account_id);

    switch (target.type) {
      case 'income':
      case 'investment_sell':
      case 'receivable_repayment':
        if (srcAcc) srcAcc.current_balance = Number(srcAcc.current_balance) - Number(target.amount);
        break;
      case 'expense':
      case 'installment_payment':
      case 'debt_repayment':
      case 'receivable_disbursement':
      case 'investment_buy':
        if (srcAcc) srcAcc.current_balance = Number(srcAcc.current_balance) + Number(target.amount);
        break;
      case 'transfer':
        if (srcAcc && dstAcc) {
          srcAcc.current_balance = Number(srcAcc.current_balance) + Number(target.amount);
          dstAcc.current_balance = Number(dstAcc.current_balance) - Number(target.amount);
        }
        break;
    }

    const filtered = transactions.filter((t) => t.id !== txId);
    await this.setCollection(STORAGE_KEYS.TRANSACTIONS, filtered);
    await this.setCollection(STORAGE_KEYS.ACCOUNTS, updatedAccounts);

    await addToSyncQueue({
      action: 'delete',
      table: 'transactions',
      data: { id: txId },
    });
  }

  // CATEGORIES
  async getCategories(): Promise<Category[]> {
    return this.getCollection(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  }

  async saveCategory(category: Category): Promise<void> {
    const list = await this.getCategories();
    const idx = list.findIndex((c) => c.id === category.id);
    const updated = idx >= 0 ? list.map((c) => (c.id === category.id ? category : c)) : [category, ...list];
    await this.setCollection(STORAGE_KEYS.CATEGORIES, updated);
  }

  // INVESTMENTS
  async getAssets(): Promise<InvestmentAsset[]> {
    return this.getCollection(STORAGE_KEYS.ASSETS, []);
  }

  async saveAsset(asset: InvestmentAsset): Promise<void> {
    const list = await this.getAssets();
    const idx = list.findIndex((a) => a.id === asset.id);
    const updated = idx >= 0 ? list.map((a) => (a.id === asset.id ? asset : a)) : [asset, ...list];
    await this.setCollection(STORAGE_KEYS.ASSETS, updated);
  }

  async getTrades(): Promise<InvestmentTrade[]> {
    return this.getCollection(STORAGE_KEYS.TRADES, []);
  }

  async addTrade(trade: InvestmentTrade): Promise<void> {
    const list = await this.getTrades();
    await this.setCollection(STORAGE_KEYS.TRADES, [trade, ...list]);

    // Also register corresponding cash account deduction or credit
    if (trade.account_id) {
      const tx: Transaction = {
        id: `tx_trade_${trade.id}`,
        user_id: trade.user_id,
        date: trade.trade_date,
        type: trade.trade_type === 'buy' ? 'investment_buy' : 'investment_sell',
        amount: trade.total_amount,
        source_account_id: trade.account_id,
        destination_account_id: null,
        category_id: null,
        description: `${trade.trade_type === 'buy' ? 'Beli' : 'Jual'} ${trade.shares_or_units} unit @ ${trade.price_per_unit}`,
        notes: trade.notes || 'Transaksi Investasi',
        payment_method: 'brokerage',
        reference_id: trade.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await this.addTransaction(tx);
    }
  }

  // RECEIVABLES
  async getReceivables(): Promise<Receivable[]> {
    return this.getCollection(STORAGE_KEYS.RECEIVABLES, []);
  }

  async saveReceivable(rec: Receivable): Promise<void> {
    const list = await this.getReceivables();
    const idx = list.findIndex((r) => r.id === rec.id);
    const updated = idx >= 0 ? list.map((r) => (r.id === rec.id ? rec : r)) : [rec, ...list];
    await this.setCollection(STORAGE_KEYS.RECEIVABLES, updated);
  }

  async recordReceivablePayment(payment: ReceivablePayment): Promise<void> {
    const receivables = await this.getReceivables();
    const rec = receivables.find((r) => r.id === payment.receivable_id);
    if (!rec) return;

    rec.current_balance = Math.max(0, rec.current_balance - payment.principal_paid);
    rec.status = rec.current_balance <= 0 ? 'paid' : 'partially_paid';
    await this.saveReceivable(rec);

    // Save payment
    const payments = await this.getCollection<ReceivablePayment>(STORAGE_KEYS.REC_PAYMENTS, []);
    await this.setCollection(STORAGE_KEYS.REC_PAYMENTS, [payment, ...payments]);

    // Update account balance: receipt of principal + interest
    const tx: Transaction = {
      id: `tx_rec_pay_${payment.id}`,
      user_id: payment.user_id,
      date: payment.payment_date,
      type: 'receivable_repayment',
      amount: payment.total_received,
      source_account_id: payment.account_id,
      destination_account_id: null,
      category_id: null,
      description: `Pelunasan Piutang: ${rec.borrower_name}`,
      notes: payment.notes || 'Pembayaran piutang',
      reference_id: payment.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await this.addTransaction(tx);
  }

  // DEBTS & INSTALLMENTS
  async getDebts(): Promise<Debt[]> {
    return this.getCollection(STORAGE_KEYS.DEBTS, []);
  }

  async saveDebt(debt: Debt): Promise<void> {
    const list = await this.getDebts();
    const idx = list.findIndex((d) => d.id === debt.id);
    const updated = idx >= 0 ? list.map((d) => (d.id === debt.id ? debt : d)) : [debt, ...list];
    await this.setCollection(STORAGE_KEYS.DEBTS, updated);
  }

  async recordDebtPayment(payment: DebtPayment): Promise<void> {
    const debts = await this.getDebts();
    const debt = debts.find((d) => d.id === payment.debt_id);
    if (!debt) return;

    debt.current_principal = Math.max(0, debt.current_principal - payment.principal_paid);
    debt.remaining_installments = Math.max(0, debt.remaining_installments - 1);
    if (debt.current_principal <= 0 || debt.remaining_installments <= 0) {
      debt.status = 'paid_off';
    }
    await this.saveDebt(debt);

    // Save payment record
    const payments = await this.getCollection<DebtPayment>(STORAGE_KEYS.DEBT_PAYMENTS, []);
    await this.setCollection(STORAGE_KEYS.DEBT_PAYMENTS, [payment, ...payments]);

    // Record transaction
    const tx: Transaction = {
      id: `tx_debt_pay_${payment.id}`,
      user_id: payment.user_id,
      date: payment.payment_date,
      type: 'installment_payment',
      amount: payment.total_amount,
      source_account_id: payment.account_id,
      destination_account_id: null,
      category_id: null,
      description: `Pembayaran ${debt.debt_name} (${debt.creditor_name}) ke-${payment.installment_number}`,
      notes: `Pokok: Rp${payment.principal_paid.toLocaleString('id-ID')} | Bunga: Rp${payment.interest_paid.toLocaleString('id-ID')}`,
      reference_id: payment.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await this.addTransaction(tx);
  }

  // BUDGETS
  async getBudgets(): Promise<Budget[]> {
    return this.getCollection(STORAGE_KEYS.BUDGETS, []);
  }

  async saveBudget(budget: Budget): Promise<void> {
    const list = await this.getBudgets();
    const idx = list.findIndex((b) => b.category_id === budget.category_id && b.month_year === budget.month_year);
    const updated = idx >= 0 ? list.map((b, i) => (i === idx ? budget : b)) : [budget, ...list];
    await this.setCollection(STORAGE_KEYS.BUDGETS, updated);
  }

  // REMINDERS
  async getReminders(): Promise<Reminder[]> {
    return this.getCollection(STORAGE_KEYS.REMINDERS, []);
  }

  async saveReminder(rem: Reminder): Promise<void> {
    const list = await this.getReminders();
    const idx = list.findIndex((r) => r.id === rem.id);
    const updated = idx >= 0 ? list.map((r) => (r.id === rem.id ? rem : r)) : [rem, ...list];
    await this.setCollection(STORAGE_KEYS.REMINDERS, updated);
  }

  // EXPORT / IMPORT / RESET
  async exportAllData(): Promise<string> {
    const [accounts, categories, transactions, assets, trades, receivables, debts, budgets, reminders] =
      await Promise.all([
        this.getAccounts(),
        this.getCategories(),
        this.getTransactions(),
        this.getAssets(),
        this.getTrades(),
        this.getReceivables(),
        this.getDebts(),
        this.getBudgets(),
        this.getReminders(),
      ]);

    return JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        accounts,
        categories,
        transactions,
        assets,
        trades,
        receivables,
        debts,
        budgets,
        reminders,
      },
      null,
      2
    );
  }

  async resetToSeed(): Promise<void> {
    if (!this.isClient()) return;
    localStorage.clear();
    await this.setCollection(STORAGE_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
    await this.setCollection(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    await this.setCollection(STORAGE_KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS);
    await this.setCollection(STORAGE_KEYS.ASSETS, DEFAULT_ASSETS);
    await this.setCollection(STORAGE_KEYS.TRADES, DEFAULT_TRADES);
    await this.setCollection(STORAGE_KEYS.RECEIVABLES, DEFAULT_RECEIVABLES);
    await this.setCollection(STORAGE_KEYS.DEBTS, DEFAULT_DEBTS);
    await this.setCollection(STORAGE_KEYS.BUDGETS, DEFAULT_BUDGETS);
    await this.setCollection(STORAGE_KEYS.REMINDERS, DEFAULT_REMINDERS);
  }
}

export const storage = new ArtosKuStorage();
