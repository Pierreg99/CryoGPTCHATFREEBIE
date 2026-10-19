import { emptyStore, parseBackup } from './core.js';

const DB_NAME = 'cryogptchatfreebie';
const STORE = 'snapshots';
const SNAPSHOT_KEY = 'current';
export const LEGACY_KEY = 'crygptchat.alpha.v1';

function openDatabase(idb) {
  return new Promise((resolve, reject) => {
    const request = idb.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB konnte nicht geöffnet werden.'));
    request.onblocked = () => reject(new Error('IndexedDB-Migration wird durch ein anderes Tab blockiert.'));
  });
}

function readSnapshot(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).get(SNAPSHOT_KEY);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB-Lesezugriff fehlgeschlagen.'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB-Transaktion abgebrochen.'));
  });
}

function writeSnapshot(db, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, SNAPSHOT_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IndexedDB-Speicherung fehlgeschlagen.'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB-Speicherung abgebrochen.'));
  });
}

// IndexedDB stores atomic snapshots; legacy localStorage is only read during migration.
// Never remove the old snapshot until IndexedDB reports a successful transaction.
export async function createPersistence({
  idb = globalThis.indexedDB,
  fallback = globalThis.localStorage,
  legacyKey = LEGACY_KEY,
  onWarning = () => {}
} = {}) {
  let legacyRaw = null;
  try { legacyRaw = fallback?.getItem(legacyKey) || null; }
  catch { onWarning('Lokaler Browser-Speicher kann nicht gelesen werden.'); }
  // A malformed legacy backup must be reported rather than silently overwritten.
  const legacy = legacyRaw ? parseBackup(legacyRaw) : emptyStore();
  let db = null, state = legacy, kind = 'localStorage';
  if (idb) {
    try {
      db = await openDatabase(idb);
      const stored = await readSnapshot(db);
      if (stored !== undefined) {
        state = parseBackup(stored);
      } else if (legacyRaw) {
        await writeSnapshot(db, legacy);
        try { fallback?.removeItem(legacyKey); } catch { /* old backup is still safe */ }
      }
      kind = 'IndexedDB';
    } catch {
      db?.close();
      db = null;
      state = legacy;
      onWarning('IndexedDB nicht verfügbar. Als Fallback wird localStorage genutzt.');
    }
  } else {
    onWarning('IndexedDB ist deaktiviert. Als Fallback wird localStorage genutzt.');
  }
  let queue = Promise.resolve();
  function save(snapshot) {
    const clean = parseBackup(snapshot);
    queue = queue.catch(() => {}).then(async () => {
      if (db) {
        try { await writeSnapshot(db, clean); return; }
        catch { onWarning('IndexedDB-Speicherung fehlgeschlagen. Versuche lokalen Fallback.'); }
      }
      try { fallback?.setItem(legacyKey, JSON.stringify(clean)); }
      catch { throw new Error('Chat-Speicherung fehlgeschlagen. Bitte Chats exportieren.'); }
      if (!fallback) throw new Error('Keine lokale Speichermöglichkeit verfügbar.');
    });
    return queue;
  }
  return { state, kind, save, close: () => db?.close() };
}
