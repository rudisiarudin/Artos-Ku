import { supabase, isSupabaseConfigured } from './supabase';
import { getSyncQueue, removeSyncQueueItem, clearSyncQueue } from './indexeddb';
import { DEFAULT_CATEGORIES, DEFAULT_CATEGORY_UUID_MAP } from './seedData';
import { isValidUUID, generateUUID } from '../utils';

// Helper to normalize any category ID to a valid UUID
export function normalizeCategoryId(catId?: string | null): string | null {
  if (!catId) return null;
  if (DEFAULT_CATEGORY_UUID_MAP[catId]) {
    return DEFAULT_CATEGORY_UUID_MAP[catId];
  }
  if (isValidUUID(catId)) {
    return catId;
  }
  return null;
}

// Helper to normalize reference_id: must be a valid UUID for Supabase, or null
export function normalizeReferenceId(refId?: string | null): string | null {
  if (!refId) return null;
  if (isValidUUID(refId)) {
    return refId;
  }
  return null;
}

let isSyncing = false;

/**
 * Process all items in IndexedDB sync_queue against Supabase.
 * Returns the count of remaining pending items.
 */
export async function processSyncQueue(fallbackUserId?: string): Promise<number> {
  if (typeof window === 'undefined') return 0;
  if (!navigator.onLine) {
    const queue = await getSyncQueue();
    return queue.length;
  }

  if (!isSupabaseConfigured() || !supabase) {
    // If Supabase is not configured, clear the queue so the UI doesn't spin endlessly
    await clearSyncQueue();
    return 0;
  }

  if (isSyncing) {
    const queue = await getSyncQueue();
    return queue.length;
  }

  isSyncing = true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const activeUserId = session?.user?.id || fallbackUserId;

    if (!session?.user?.id) {
      // User session is not yet active or offline; keep sync queue intact so items sync upon login
      const queue = await getSyncQueue();
      return queue.length;
    }

    const queue = await getSyncQueue();
    if (queue.length === 0) return 0;

    const TABLE_PRIORITY: Record<string, number> = {
      accounts: 1,
      categories: 2,
      assets: 3,
      receivables: 4,
      debts: 5,
      transactions: 6,
      trades: 7,
      receivable_payments: 8,
      debt_payments: 9,
      budgets: 10,
      reminders: 11,
    };
    const sortedQueue = [...queue].sort(
      (a, b) => (TABLE_PRIORITY[a.table] || 99) - (TABLE_PRIORITY[b.table] || 99)
    );

    // Ensure categories exist in Supabase for this user
    try {
      const categoriesPayload = DEFAULT_CATEGORIES.map((cat) => ({
        id: cat.id,
        user_id: activeUserId,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        is_system: cat.is_system,
      }));
      await supabase.from('categories').upsert(categoriesPayload, { onConflict: 'id' });
    } catch (catErr) {
      console.warn('[SyncEngine] Category seed sync notice:', catErr);
    }

    const SEED_ACCOUNT_IDS = ['acc-bca', 'acc-mandiri', 'acc-gopay', 'acc-cash', 'acc-rdi'];

    for (const item of sortedQueue) {
      try {
        // Discard only mock demo seed fixtures that should never be sent to cloud
        if (
          item.data &&
          (SEED_ACCOUNT_IDS.includes(item.data.id as string) ||
            (typeof item.data.id === 'string' &&
              (item.data.id.startsWith('tx-demo') ||
                item.data.id.startsWith('trade-demo') ||
                item.data.id.startsWith('rec-demo') ||
                item.data.id.startsWith('debt-demo'))))
        ) {
          await removeSyncQueueItem(item.id);
          continue;
        }

        const table = item.table;
        const action = item.action;
        const record = { ...item.data };

        // Normalize user_id to currently authenticated user
        record.user_id = activeUserId;

        // Ensure record has a valid UUID
        if (!isValidUUID(typeof record.id === 'string' ? record.id : null)) {
          record.id = generateUUID();
        }

        if (action === 'delete') {
          const { error } = await supabase.from(table).delete().eq('id', record.id as string);
          if (error && table === 'assets') {
            await supabase.from('investment_assets').delete().eq('id', record.id as string);
          }
          await removeSyncQueueItem(item.id);
          continue;
        }

        // Table-specific sanitization strictly matching Postgres columns
        if (table === 'accounts') {
          const accountPayload = {
            id: record.id,
            user_id: activeUserId,
            name: record.name,
            type: record.type,
            account_number: record.account_number || null,
            institution_name: record.institution_name || null,
            currency: record.currency || 'IDR',
            opening_balance: Number(record.opening_balance || 0),
            current_balance: Number(record.current_balance || 0),
            color: record.color || '#10B981',
            is_active: record.is_active !== false,
            is_archived: Boolean(record.is_archived),
          };
          const { error } = await supabase.from('accounts').upsert(accountPayload);
          if (error) console.warn('[SyncEngine] accounts upsert notice:', error.message);
          await removeSyncQueueItem(item.id);
        } else if (table === 'assets') {
          const assetPayload: Record<string, unknown> = {
            id: record.id,
            user_id: activeUserId,
            ticker: record.ticker,
            name: record.name,
            asset_type: record.asset_type || 'stock',
            platform: record.platform || null,
            lots: record.lots !== undefined && record.lots !== null ? Number(record.lots) : null,
            shares_or_units: Number(record.shares_or_units || 0),
            average_buy_price: Number(record.average_buy_price || 0),
            current_price: Number(record.current_price || 0),
            currency: record.currency || 'IDR',
            exchange: record.exchange || null,
            notes: record.notes || null,
            last_price_updated_at: record.last_price_updated_at || new Date().toISOString(),
          };

          let { error } = await supabase.from('assets').upsert(assetPayload);
          if (error) {
            // Fallback to investment_assets if assets table name differs in Supabase
            const retryRes = await supabase.from('investment_assets').upsert(assetPayload);
            error = retryRes.error;
          }
          if (error) console.warn('[SyncEngine] assets upsert notice:', error.message);
          await removeSyncQueueItem(item.id);
        } else if (table === 'transactions') {
          const txType = (record.type as string) || 'expense';
          const txDesc = (record.description as string) || (record.name as string) || 'Transaksi';
          const txPayload: Record<string, unknown> = {
            id: record.id,
            user_id: activeUserId,
            date: record.date || new Date().toISOString(),
            type: txType,
            description: txDesc,
            amount: Number(record.amount || 0),
            source_account_id: isValidUUID(record.source_account_id as string) ? record.source_account_id : null,
            destination_account_id: isValidUUID(record.destination_account_id as string) ? record.destination_account_id : null,
            category_id: normalizeCategoryId(record.category_id as string),
            payment_method: record.payment_method || 'transfer',
            tags: Array.isArray(record.tags) ? record.tags : [],
            reference_id: normalizeReferenceId(record.reference_id as string),
          };
          if (record.notes) {
            txPayload.notes = record.notes;
          }

          let { error } = await supabase.from('transactions').upsert(txPayload);
          // If foreign key constraint failed on category_id or account IDs, retry with null
          if (
            error &&
            (error.code === '23503' ||
              error.message.toLowerCase().includes('foreign key') ||
              error.message.toLowerCase().includes('violates foreign key constraint'))
          ) {
            txPayload.category_id = null;
            txPayload.source_account_id = null;
            txPayload.destination_account_id = null;
            const retryRes = await supabase.from('transactions').upsert(txPayload);
            error = retryRes.error;
          }
          // If Supabase schema does not have 'notes' column, remove and retry
          if (error && (error.message.includes("'notes'") || error.message.toLowerCase().includes('notes'))) {
            delete txPayload.notes;
            const retryRes = await supabase.from('transactions').upsert(txPayload);
            error = retryRes.error;
          }
          if (error) {
            console.warn('[SyncEngine] transactions upsert notice:', error.message);
          } else {
            await removeSyncQueueItem(item.id);
          }
        } else if (table === 'receivables') {
          const loanDateStr = typeof record.loan_date === 'string' ? record.loan_date : new Date().toISOString();
          const dueDateStr = typeof record.due_date === 'string' ? record.due_date : new Date().toISOString();
          const recPayload = {
            id: record.id,
            user_id: activeUserId,
            borrower_name: record.borrower_name,
            borrower_phone: record.borrower_phone || null,
            principal_amount: Number(record.principal_amount || 0),
            current_balance: Number(record.current_balance || 0),
            interest_rate: Number(record.interest_rate || 0),
            loan_date: loanDateStr.split('T')[0],
            due_date: dueDateStr.split('T')[0],
            status: record.status || 'unpaid',
            account_id: isValidUUID(record.account_id as string) ? record.account_id : null,
            purpose: record.purpose || null,
          };
          const { error } = await supabase.from('receivables').upsert(recPayload);
          if (error) console.warn('[SyncEngine] receivables upsert notice:', error.message);
          await removeSyncQueueItem(item.id);
        } else if (table === 'debts') {
          const startDateStr = typeof record.start_date === 'string' ? record.start_date : new Date().toISOString();
          const debtPayload = {
            id: record.id,
            user_id: activeUserId,
            creditor_name: record.creditor_name,
            debt_name: record.debt_name,
            type: record.type || 'installment',
            original_principal: Number(record.original_principal || 0),
            current_principal: Number(record.current_principal || 0),
            interest_rate: Number(record.interest_rate || 0),
            interest_type: record.interest_type || 'flat',
            tenor_months: Number(record.tenor_months || 12),
            monthly_installment: Number(record.monthly_installment || 0),
            due_day: Number(record.due_day || 1),
            remaining_installments: Number(record.remaining_installments || 0),
            payment_account_id: isValidUUID(record.payment_account_id as string) ? record.payment_account_id : null,
            status: record.status || 'active',
            start_date: startDateStr.split('T')[0],
          };
          const { error } = await supabase.from('debts').upsert(debtPayload);
          if (error) console.warn('[SyncEngine] debts upsert notice:', error.message);
          await removeSyncQueueItem(item.id);
        } else if (table === 'receivable_payments') {
          const paymentPayload = {
            id: record.id,
            user_id: activeUserId,
            receivable_id: record.receivable_id,
            account_id: record.account_id,
            payment_date: record.payment_date || new Date().toISOString(),
            principal_paid: Number(record.principal_paid || 0),
            interest_paid: Number(record.interest_paid || 0),
            total_received: Number(record.total_received || 0),
            notes: record.notes || null,
          };
          const { error } = await supabase.from('receivable_payments').upsert(paymentPayload);
          if (error) console.warn('[SyncEngine] receivable_payments upsert notice:', error.message);
          await removeSyncQueueItem(item.id);
        } else if (table === 'debt_payments') {
          const debtPayPayload = {
            id: record.id,
            user_id: activeUserId,
            debt_id: record.debt_id,
            account_id: record.account_id,
            payment_date: record.payment_date || new Date().toISOString(),
            installment_number: Number(record.installment_number || 1),
            principal_paid: Number(record.principal_paid || 0),
            interest_paid: Number(record.interest_paid || 0),
            fee_paid: Number(record.fee_paid || 0),
            total_amount: Number(record.total_amount || 0),
            notes: record.notes || null,
          };
          const { error } = await supabase.from('debt_payments').upsert(debtPayPayload);
          if (error) console.warn('[SyncEngine] debt_payments upsert notice:', error.message);
          await removeSyncQueueItem(item.id);
        } else if (table === 'trades' || table === 'investment_trades') {
          const tradePayload = {
            id: record.id,
            user_id: activeUserId,
            asset_id: record.asset_id,
            trade_type: record.trade_type || 'buy',
            trade_date: record.trade_date || record.date || new Date().toISOString(),
            lots: record.lots !== undefined && record.lots !== null ? Number(record.lots) : null,
            shares_or_units: Number(record.shares_or_units || 0),
            price_per_unit: Number(record.price_per_unit || 0),
            fee: Number(record.fee || 0),
            total_amount: Number(record.total_amount || 0),
            realized_pl: record.realized_pl !== undefined && record.realized_pl !== null ? Number(record.realized_pl) : null,
            account_id: isValidUUID(record.account_id as string) ? record.account_id : null,
            notes: record.notes || null,
          };
          let { error } = await supabase.from('investment_trades').upsert(tradePayload);
          if (error) {
            const retryRes = await supabase.from('trades').upsert(tradePayload);
            error = retryRes.error;
          }
          if (error) console.warn('[SyncEngine] trades upsert notice:', error.message);
          await removeSyncQueueItem(item.id);
        } else if (table === 'budgets') {
          const normCatId = normalizeCategoryId(record.category_id as string);
          if (!normCatId) {
            await removeSyncQueueItem(item.id);
            continue;
          }
          const budgetPayload = {
            id: record.id,
            user_id: activeUserId,
            category_id: normCatId,
            month_year: (record.month_year as string) || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
            monthly_limit: Number(record.monthly_limit || 0),
            created_at: (record.created_at as string) || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          const { error } = await supabase.from('budgets').upsert(budgetPayload, { onConflict: 'user_id, category_id, month_year' });
          if (error) console.warn('[SyncEngine] budgets upsert notice:', error.message);
          await removeSyncQueueItem(item.id);
        } else {
          const { error } = await supabase.from(table).upsert(record);
          if (error) console.warn(`[SyncEngine] ${table} upsert notice:`, error.message);
          await removeSyncQueueItem(item.id);
        }
      } catch (itemErr) {
        console.warn(`[SyncEngine] Error processing sync item ${item.id}:`, itemErr);
        await removeSyncQueueItem(item.id);
      }
    }

    const remaining = await getSyncQueue();
    return remaining.length;
  } catch (err) {
    console.warn('[SyncEngine] Sync queue processing failed:', err);
    const queue = await getSyncQueue();
    return queue.length;
  } finally {
    isSyncing = false;
  }
}
