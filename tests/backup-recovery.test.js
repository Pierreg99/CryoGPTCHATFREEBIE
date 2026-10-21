import test from "node:test";
import assert from "node:assert/strict";
import {
  inspectBackup,
  backupReport,
  MAX_BACKUP_BYTES,
} from "../src/backup.js";
import { createPersistence, LEGACY_KEY } from "../src/storage.js";
import {
  CHECKPOINT_KEY,
  checkpointStorageKey,
} from "../src/recovery-storage.js";
import {
  createChat,
  appendMessage,
  emptyStore,
  setProjectContext,
} from "../src/core.js";
const time = "2026-10-21T09:00:00.000Z";
const snapshot = (id) => createChat(emptyStore(), id, id, time);
function memory(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
}
function atomicIndexedDB() {
  const values = new Map();
  let failCommit = false;
  const db = {
    objectStoreNames: { contains: () => true },
    close() {},
    transaction(_name, mode) {
      const staged = new Map(values);
      let pending = 0,
        aborted = false,
        scheduled = false;
      const tx = {
        error: null,
        abort() {
          aborted = true;
          queueMicrotask(() => tx.onabort?.());
        },
      };
      function schedule() {
        if (scheduled) return;
        scheduled = true;
        queueMicrotask(() => {
          scheduled = false;
          if (pending || aborted) return;
          if (failCommit && mode === "readwrite") {
            failCommit = false;
            tx.error = new Error("quota");
            tx.onerror?.();
            tx.abort();
            return;
          }
          if (mode === "readwrite") {
            values.clear();
            for (const [k, v] of staged) values.set(k, structuredClone(v));
          }
          tx.oncomplete?.();
        });
      }
      function request(operation) {
        const req = {};
        pending++;
        queueMicrotask(() => {
          if (aborted) return;
          try {
            req.result = operation();
            req.onsuccess?.();
          } catch (error) {
            tx.error = error;
            req.onerror?.();
            tx.onerror?.();
            tx.abort();
          }
          pending--;
          schedule();
        });
        return req;
      }
      tx.objectStore = () => ({
        get: (k) => request(() => staged.get(k)),
        put: (v, k) => request(() => staged.set(k, structuredClone(v))),
        delete: (k) => request(() => staged.delete(k)),
      });
      return tx;
    },
  };
  return {
    values,
    failNextCommit() {
      failCommit = true;
    },
    open() {
      const r = { result: db };
      queueMicrotask(() => r.onsuccess?.());
      return r;
    },
  };
}
test("backup dry-run migrates v1, preserves v2 opt-ins and does not mutate input", () => {
  let source = setProjectContext(
    snapshot("one"),
    "one",
    "Private context",
    true,
    time,
  );
  source = appendMessage(source, "one", "user", "Private message", "m", time);
  const original = JSON.stringify(source),
    preview = inspectBackup(original);
  assert.equal(preview.ok, true);
  assert.deepEqual(preview.backup, source);
  assert.equal(preview.summary.sharedContexts, 1);
  assert.equal(JSON.stringify(source), original);
  const legacy = { ...source, version: 1 };
  const migrated = inspectBackup(JSON.stringify(legacy));
  assert.equal(migrated.summary.sourceVersion, 1);
  assert.equal(migrated.backup.version, 2);
  assert.equal(migrated.backup.chats[0].shareProjectContext, false);
  assert.ok(migrated.warnings.some((w) => w.path === "version"));
});
test("dry-run errors locate corrupt values but reports never contain private contents", () => {
  const corrupt = snapshot("one");
  corrupt.chats[0].messages = [
    {
      id: "m",
      role: "system",
      content: "DO NOT EXPOSE THIS PRIVATE TEXT",
      createdAt: "invalid",
    },
  ];
  const preview = inspectBackup(JSON.stringify(corrupt));
  assert.equal(preview.ok, false);
  assert.ok(preview.errors.some((e) => e.path === "chats[0].messages[0].role"));
  assert.ok(preview.errors.some((e) => e.path.endsWith("createdAt")));
  assert.doesNotMatch(JSON.stringify(backupReport(preview)), /DO NOT EXPOSE/);
  assert.equal(inspectBackup("{PRIVATE BROKEN").ok, false);
});
test("backup size uses bytes and inspection reports normalization before applying", () => {
  assert.equal(inspectBackup("é".repeat(MAX_BACKUP_BYTES / 2 + 1)).ok, false);
  const source = snapshot("one");
  source.chats[0].updatedAt = "wrong";
  source.chats[0].title = "x".repeat(120);
  const preview = inspectBackup(JSON.stringify(source));
  assert.equal(preview.ok, true);
  assert.ok(preview.warnings.length >= 2);
  assert.equal(preview.backup.chats[0].title.length, 100);
});
test("IndexedDB import atomically saves a checkpoint and undo consumes it", async () => {
  const idb = atomicIndexedDB(),
    p = await createPersistence({ idb, fallback: null }),
    before = snapshot("before"),
    after = snapshot("after");
  await p.save(before);
  await p.restoreBackup(after, before);
  assert.deepEqual(idb.values.get("current"), after);
  assert.deepEqual(await p.readCheckpoint(), before);
  await p.restoreBackup(before, after, true);
  assert.deepEqual(idb.values.get("current"), before);
  assert.equal(await p.readCheckpoint(), null);
  assert.equal(idb.values.has(CHECKPOINT_KEY), false);
});
test("IndexedDB quota failure leaves both chats and an older checkpoint unchanged", async () => {
  const idb = atomicIndexedDB(),
    p = await createPersistence({ idb, fallback: null }),
    before = snapshot("before"),
    older = snapshot("older");
  await p.save(before);
  idb.values.set(CHECKPOINT_KEY, older);
  idb.failNextCommit();
  await assert.rejects(p.restoreBackup(snapshot("after"), before));
  assert.deepEqual(idb.values.get("current"), before);
  assert.deepEqual(await p.readCheckpoint(), older);
});
test("stale preview or changed checkpoint is rejected without overwriting external changes", async () => {
  const idb = atomicIndexedDB(),
    p = await createPersistence({ idb, fallback: null }),
    before = snapshot("before"),
    other = snapshot("external");
  await p.save(other);
  await assert.rejects(
    p.restoreBackup(snapshot("after"), before),
    /zwischenzeitlich/,
  );
  assert.deepEqual(idb.values.get("current"), other);
  idb.values.set(CHECKPOINT_KEY, snapshot("actual"));
  await assert.rejects(p.restoreBackup(before, other, true), /geändert/);
  assert.deepEqual(idb.values.get("current"), other);
});
test("localStorage fallback keeps a recovery point and never reports failed data as imported", async () => {
  const fallback = memory(),
    p = await createPersistence({ idb: null, fallback }),
    before = snapshot("before"),
    after = snapshot("after");
  await p.save(before);
  await p.restoreBackup(after, before);
  assert.deepEqual(await p.readCheckpoint(), before);
  await p.restoreBackup(before, after, true);
  assert.deepEqual(JSON.parse(fallback.getItem(LEGACY_KEY)), before);
  const set = fallback.setItem;
  fallback.setItem = (key, value) => {
    if (key === LEGACY_KEY) throw new Error("QuotaExceeded");
    return set(key, value);
  };
  await assert.rejects(p.restoreBackup(after, before), /nicht gespeichert/);
  assert.deepEqual(JSON.parse(fallback.getItem(LEGACY_KEY)), before);
  assert.equal(fallback.getItem(checkpointStorageKey(LEGACY_KEY)), null);
});

test("discarding a recovery checkpoint does not change current chats", async () => {
  for (const idb of [atomicIndexedDB(), null]) {
    const fallback = memory(),
      p = await createPersistence({ idb, fallback }),
      before = snapshot("before"),
      after = snapshot("after");
    await p.save(before);
    await p.restoreBackup(after, before);
    await p.clearCheckpoint();
    assert.equal(await p.readCheckpoint(), null);
    const loaded = await createPersistence({ idb, fallback });
    assert.deepEqual(loaded.state, after);
  }
});
