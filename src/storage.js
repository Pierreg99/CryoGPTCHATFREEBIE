import {
  checkpointStorageKey,
  readRecovery,
  writeRecovery,
  fallbackRecovery,
} from "./recovery-storage.js";
import { emptyStore, parseBackup } from "./core.js";

const DB_NAME = "cryogptchatfreebie";
const STORE = "snapshots";
const SNAPSHOT_KEY = "current";
export const LEGACY_KEY = "crygptchat.alpha.v1";

function openDatabase(idb) {
  return new Promise((resolve, reject) => {
    const request = idb.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE))
        request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        request.error || new Error("IndexedDB konnte nicht geöffnet werden."),
      );
    request.onblocked = () =>
      reject(
        new Error("IndexedDB-Migration wird durch ein anderes Tab blockiert."),
      );
  });
}

function readSnapshot(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(SNAPSHOT_KEY);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        request.error || new Error("IndexedDB-Lesezugriff fehlgeschlagen."),
      );
    tx.onabort = () =>
      reject(tx.error || new Error("IndexedDB-Transaktion abgebrochen."));
  });
}

function writeSnapshot(db, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, SNAPSHOT_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error || new Error("IndexedDB-Speicherung fehlgeschlagen."));
    tx.onabort = () =>
      reject(tx.error || new Error("IndexedDB-Speicherung abgebrochen."));
  });
}

// IndexedDB stores atomic snapshots; legacy localStorage is only read during migration.
// Never remove the old snapshot until IndexedDB reports a successful transaction.
export async function createPersistence({
  idb = globalThis.indexedDB,
  fallback = globalThis.localStorage,
  legacyKey = LEGACY_KEY,
  onWarning = () => {},
} = {}) {
  let legacyRaw = null;
  try {
    legacyRaw = fallback?.getItem(legacyKey) || null;
  } catch {
    onWarning("Lokaler Browser-Speicher kann nicht gelesen werden.");
  }
  // IndexedDB becomes authoritative after migration. Read it before legacy data
  // so that an old damaged localStorage copy cannot shadow a healthy DB.
  const parseLegacy = () => (legacyRaw ? parseBackup(legacyRaw) : emptyStore());
  let db = null,
    state = emptyStore(),
    kind = "localStorage";
  if (idb) {
    try {
      db = await openDatabase(idb);
      const stored = await readSnapshot(db);
      if (stored !== undefined) {
        state = parseBackup(stored);
      } else {
        state = parseLegacy();
        if (legacyRaw) {
          await writeSnapshot(db, state);
          try {
            fallback?.removeItem(legacyKey);
          } catch {
            /* old backup is still safe */
          }
        }
      }
      kind = "IndexedDB";
    } catch {
      db?.close();
      db = null;
      // Corrupt backups throw here instead of being overwritten silently.
      state = parseLegacy();
      onWarning(
        "IndexedDB nicht verfügbar. Als Fallback wird localStorage genutzt.",
      );
    }
  } else {
    state = parseLegacy();
    onWarning(
      "IndexedDB ist deaktiviert. Als Fallback wird localStorage genutzt.",
    );
  }
  let queue = Promise.resolve();
  function save(snapshot) {
    const clean = parseBackup(snapshot);
    queue = queue
      .catch(() => {})
      .then(async () => {
        if (db) {
          // Never silently switch to localStorage after IndexedDB has become authoritative:
          // an old IndexedDB snapshot would otherwise shadow new fallback writes on reload.
          try {
            await writeSnapshot(db, clean);
            return;
          } catch {
            onWarning(
              "IndexedDB-Speicherung fehlgeschlagen. Bitte Chats als JSON exportieren.",
            );
            throw new Error(
              "IndexedDB-Speicherung fehlgeschlagen. Bitte Chats exportieren.",
            );
          }
        }
        try {
          fallback?.setItem(legacyKey, JSON.stringify(clean));
        } catch {
          throw new Error(
            "Chat-Speicherung fehlgeschlagen. Bitte Chats exportieren.",
          );
        }
        if (!fallback)
          throw new Error("Keine lokale Speichermöglichkeit verfügbar.");
      });
    return queue;
  }
  const enqueue = (operation) => {
    queue = queue.catch(() => {}).then(operation);
    return queue;
  };
  function readCheckpoint() {
    return enqueue(() => {
      if (db) return readRecovery(db);
      const raw = fallback?.getItem(checkpointStorageKey(legacyKey));
      return raw ? parseBackup(raw) : null;
    });
  }
  function clearCheckpoint() {
    return enqueue(() => {
      if (!db) {
        fallback?.removeItem(checkpointStorageKey(legacyKey));
        return;
      }
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete("restore-checkpoint-v1");
        tx.oncomplete = () => resolve();
        tx.onabort = () =>
          reject(
            new Error("Wiederherstellungspunkt konnte nicht gelöscht werden."),
          );
      });
    });
  }
  function restoreBackup(nextSnapshot, previousSnapshot, undo = false) {
    const next = parseBackup(nextSnapshot),
      previous = parseBackup(previousSnapshot);
    return enqueue(async () => {
      const restored = db
        ? await writeRecovery(db, next, previous, undo)
        : fallbackRecovery(fallback, legacyKey, next, previous, undo);
      state = restored;
      return restored;
    });
  }
  return {
    get state() {
      return state;
    },
    kind,
    save,
    readCheckpoint,
    clearCheckpoint,
    restoreBackup,
    close: () => db?.close(),
  };
}
