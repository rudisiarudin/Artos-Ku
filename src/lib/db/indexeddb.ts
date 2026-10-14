import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SyncQueueItem } from './types';

interface ArtosKuDB extends DBSchema {
  keyval: {
    key: string;
    value: unknown;
  };
  sync_queue: {
    key: string;
    value: SyncQueueItem;
  };
  drafts: {
    key: string;
    value: { id: string; formType: string; data: unknown; updatedAt: number };
  };
}

const DB_NAME = 'artosku_offline_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ArtosKuDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<ArtosKuDB>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available on server'));
  }

  if (!dbPromise) {
    dbPromise = openDB<ArtosKuDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('keyval')) {
          db.createObjectStore('keyval');
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function idbGet<T = unknown>(key: string): Promise<T | undefined> {
  try {
    const db = await getDB();
    return (await db.get('keyval', key)) as T;
  } catch {
    return undefined;
  }
}

export async function idbSet<T = unknown>(key: string, val: T): Promise<void> {
  try {
    const db = await getDB();
    await db.put('keyval', val, key);
  } catch (err) {
    console.warn('idbSet failed', err);
  }
}

export async function addToSyncQueue(
  item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'status' | 'data'> & { data: unknown }
): Promise<void> {
  try {
    const db = await getDB();
    const queueItem: SyncQueueItem = {
      action: item.action,
      table: item.table,
      data: item.data as Record<string, unknown>,
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      status: 'pending',
    };
    await db.put('sync_queue', queueItem);
  } catch (err) {
    console.warn('addToSyncQueue failed', err);
  }
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const db = await getDB();
    return await db.getAll('sync_queue');
  } catch {
    return [];
  }
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('sync_queue', id);
  } catch (err) {
    console.warn('removeSyncQueueItem failed', err);
  }
}

export async function clearSyncQueue(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear('sync_queue');
  } catch (err) {
    console.warn('clearSyncQueue failed', err);
  }
}

export async function clearAllLocalIDB(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear('keyval');
    await db.clear('sync_queue');
    await db.clear('drafts');
  } catch (err) {
    console.warn('clearAllLocalIDB failed', err);
  }
}
