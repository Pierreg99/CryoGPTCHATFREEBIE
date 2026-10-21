import { emptyStore, parseBackup } from "./core.js";
export const CHECKPOINT_KEY = "restore-checkpoint-v1";
export const checkpointStorageKey = (legacyKey) =>
  legacyKey + ".restore-checkpoint-v1";
const clone = (state) => parseBackup(state);
const equivalent = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function ensureCurrent(actual, expected) {
  const current =
    actual === undefined || actual === null ? emptyStore() : clone(actual);
  if (!equivalent(current, expected))
    throw new Error(
      "Gespeicherte Daten wurden zwischenzeitlich geändert. Bitte neu laden und erneut prüfen.",
    );
}
export function readRecovery(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("snapshots", "readonly"),
      req = tx.objectStore("snapshots").get(CHECKPOINT_KEY);
    req.onsuccess = () => {
      try {
        resolve(req.result === undefined ? null : clone(req.result));
      } catch {
        reject(
          new Error(
            "Wiederherstellungspunkt ist beschädigt. Er wird nicht überschrieben.",
          ),
        );
      }
    };
    req.onerror = () =>
      reject(new Error("Wiederherstellungspunkt konnte nicht gelesen werden."));
    tx.onabort = () =>
      reject(
        new Error("Lesezugriff auf Wiederherstellungspunkt wurde abgebrochen."),
      );
  });
}
// Both entries change in one IndexedDB transaction; failures leave current + checkpoint intact.
export function writeRecovery(db, next, previous, undo = false) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("snapshots", "readwrite"),
      store = tx.objectStore("snapshots");
    let failure,
      current,
      checkpoint,
      pending = undo ? 2 : 1,
      restored;
    function ready() {
      if (--pending) return;
      try {
        ensureCurrent(current, previous);
        if (undo) {
          if (checkpoint === undefined || !equivalent(clone(checkpoint), next))
            throw new Error(
              "Wiederherstellungspunkt geändert oder nicht mehr vorhanden. Bitte neu prüfen.",
            );
          restored = clone(checkpoint);
          store.put(restored, "current");
          store.delete(CHECKPOINT_KEY);
        } else {
          restored = next;
          store.put(previous, CHECKPOINT_KEY);
          store.put(next, "current");
        }
      } catch (error) {
        failure = error;
        tx.abort();
      }
    }
    const read = store.get("current");
    read.onsuccess = () => {
      current = read.result;
      ready();
    };
    if (undo) {
      const check = store.get(CHECKPOINT_KEY);
      check.onsuccess = () => {
        checkpoint = check.result;
        ready();
      };
    }
    tx.oncomplete = () => resolve(restored);
    tx.onerror = () => {
      failure ||= new Error(
        "Speichern fehlgeschlagen. Bisherige Daten bleiben erhalten.",
      );
    };
    tx.onabort = () =>
      reject(
        failure ||
          new Error(
            "Wiederherstellung wurde nicht gespeichert. Bisherige Daten bleiben erhalten.",
          ),
      );
  });
}
export function fallbackRecovery(
  storage,
  legacyKey,
  next,
  previous,
  undo = false,
) {
  if (!storage) throw new Error("Keine lokale Speichermöglichkeit verfügbar.");
  const checkpointKey = checkpointStorageKey(legacyKey),
    actual = storage.getItem(legacyKey);
  ensureCurrent(actual === null ? null : JSON.parse(actual), previous);
  if (undo) {
    const saved = storage.getItem(checkpointKey);
    if (!saved || !equivalent(clone(JSON.parse(saved)), next))
      throw new Error(
        "Wiederherstellungspunkt geändert oder nicht mehr vorhanden.",
      );
    storage.setItem(legacyKey, JSON.stringify(next));
    // Removal is cleanup: a quota/security failure cannot turn a committed restore into a reported failure.
    try {
      storage.removeItem(checkpointKey);
    } catch {}
  } else {
    const oldCheckpoint = storage.getItem(checkpointKey);
    storage.setItem(checkpointKey, JSON.stringify(previous));
    try {
      storage.setItem(legacyKey, JSON.stringify(next));
    } catch (error) {
      try {
        if (oldCheckpoint === null) storage.removeItem(checkpointKey);
        else storage.setItem(checkpointKey, oldCheckpoint);
      } catch {}
      throw new Error(
        "Import konnte nicht gespeichert werden. Bisherige Chats bleiben erhalten.",
      );
    }
  }
  return next;
}
