import { supabase, isSupabaseConfigured } from './supabase';
import { getSyncQueue, removeSyncQueueItem, clearSyncQueue, addToSyncQueue } from './indexeddb';
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

    if (!activeUserId || !session?.user?.id) {
      // User is operating in local/guest mode; clear sync queue to avoid infinite spinning
      await clearSyncQueue();
      return 0;
    }

    const queue = await getSyncQueue();
    if (queue.length === 0) return 0;

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

    for (const item of queue) {
      try {
        // Discard any dummy seed record items that should not be synced
        if (
          item.data &&
          (item.data.user_id === 'default-user' ||
            item.data.id === 'acc-bca' ||
            item.data.id === 'acc-mandiri' ||
            item.data.id === 'acc-gopay' ||
            item.data.id === 'acc-cash' ||
            item.data.id === 'acc-rdi')
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
        if (!isValidUUID(record.id)) {
          record.id = generateUUID();
        }

        if (action === 'delete') {
          await supabase.from(table).delete().eq('id', record.id);
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
        } else if (table === 'transactions') {
          const txPayload = {
            id: record.id,
            user_id: activeUserId,
            date: record.date || new Date().toISOString(),
            type: record.type,
            amount: Number(record.amount || 0),
            source_account_id: isValidUUID(record.source_account_id) ? record.source_account_id : null,
            destination_account_id: isValidUUID(record.destination_account_id) ? record.destination_account_id : null,
            category_id: normalizeCategoryId(record.category_id),
            description: record.description || 'Transaksi',
            notes: record.notes || null,
            payment_method: record.payment_method || 'transfer',
            tags: Array.isArray(record.tags) ? record.tags : [],
            reference_id: normalizeReferenceId(record.reference_id),
          };
          const { error } = await supabase.from('transactions').upsert(txPayload);
          if (error) console.warn('[SyncEngine] transactions upsert notice:', error.message);
          await removeSyncQueueItem(item.id);
        } else if (table === 'receivables') {
          const recPayload = {
            id: record.id,
            user_id: activeUserId,
            borrower_name: record.borrower_name,
            borrower_phone: record.borrower_phone || null,
            principal_amount: Number(record.principal_amount || 0),
            current_balance: Number(record.current_balance || 0),
            interest_rate: Number(record.interest_rate || 0),
            loan_date: record.loan_date ? record.loan_date.split('T')[0] : new Date().toISOString().split('T')[0],
            due_date: record.due_date ? record.due_date.split('T')[0] : new Date().toISOString().split('T')[0],
            status: record.status || 'unpaid',
            account_id: isValidUUID(record.account_id) ? record.account_id : null,
            purpose: record.purpose || null,
          };
          const { error } = await supabase.from('receivables').upsert(recPayload);
          if (error) console.warn('[SyncEngine] receivables upsert notice:', error.message);
          await removeSyncQueueItem(item.id);
        } else if (table === 'debts') {
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
            payment_account_id: isValidUUID(record.payment_account_id) ? record.payment_account_id : null,
            status: record.status || 'active',
            start_date: record.start_date ? record.start_date.split('T')[0] : new Date().toISOString().split('T')[0],
          };
          const { error } = await supabase.from('debts').upsert(debtPayload);
          if (error) console.warn('[SyncEngine] debts upsert notice:', error.message);
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
