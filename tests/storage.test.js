import test from 'node:test';
import assert from 'node:assert/strict';
import { createPersistence, LEGACY_KEY } from '../src/storage.js';
import { createChat, emptyStore } from '../src/core.js';

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
    values
  };
}

// A tiny deterministic IndexedDB contract stub (no package dependencies).
function fakeIndexedDB() {
  const values = new Map();
  const db = {
    objectStoreNames: { contains: () => true },
    createObjectStore() {},
    close() {},
    transaction() {
      const tx = { error: null, oncomplete: null, onabort: null, onerror: null };
      tx.objectStore = () => ({
        get(key) {
          const req = { result: undefined, error: null, onsuccess: null, onerror: null };
          queueMicrotask(() => { req.result = values.get(key); req.onsuccess?.(); });
          return req;
        },
        put(value, key) {
          queueMicrotask(() => { values.set(key, structuredClone(value)); tx.oncomplete?.(); });
        }
      });
      return tx;
    }
  };
  return {
    values,
    open() {
      const request = { result: db, error: null, onupgradeneeded: null, onsuccess: null, onerror: null };
      queueMicrotask(() => { request.onupgradeneeded?.(); request.onsuccess?.(); });
      return request;
    }
  };
}

test('v1 localStorage snapshot migrates to IndexedDB and only then removes old data', async () => {
  const legacy = createChat(emptyStore(), 'old', 'Alte Daten', '2026-10-19T00:00:00Z');
  const oldFormat = structuredClone(legacy);
  oldFormat.version = 1;
  delete oldFormat.chats[0].projectContext;
  delete oldFormat.chats[0].shareProjectContext;
  const fallback = memoryStorage({ [LEGACY_KEY]: JSON.stringify(oldFormat) });
  const idb = fakeIndexedDB();
  const store = await createPersistence({ idb, fallback });
  assert.equal(store.kind, 'IndexedDB');
  assert.equal(store.state.version, 2);
  assert.equal(store.state.chats[0].id, 'old');
  assert.equal(fallback.getItem(LEGACY_KEY), null);
  assert.equal(idb.values.get('current').chats[0].id, 'old');
});

test('new commits to IndexedDB are loaded on refresh', async () => {
  const idb = fakeIndexedDB(), fallback = memoryStorage();
  const first = await createPersistence({ idb, fallback });
  await first.save(createChat(first.state, 'new', 'Persistence'));
  const second = await createPersistence({ idb, fallback });
  assert.equal(second.state.chats[0].id, 'new');
  assert.equal(second.kind, 'IndexedDB');
});

test('writes are serialized to prevent an earlier snapshot overwriting a newer one', async () => {
  const idb = fakeIndexedDB(), fallback = memoryStorage();
  const storage = await createPersistence({ idb, fallback });
  const first = createChat(emptyStore(), 'a', 'A');
  const second = createChat(first, 'b', 'B');
  await Promise.all([storage.save(first), storage.save(second)]);
  const loaded = await createPersistence({ idb, fallback });
  assert.equal(loaded.state.chats.length, 2);
});

test('localStorage remains an explicit fallback if IndexedDB is unavailable', async () => {
  const warnings = [], fallback = memoryStorage();
  const storage = await createPersistence({ idb: null, fallback, onWarning: w => warnings.push(w) });
  assert.equal(storage.kind, 'localStorage');
  await storage.save(createChat(storage.state, 'fallback', 'Notiz'));
  const again = await createPersistence({ idb: null, fallback });
  assert.equal(again.state.chats[0].id, 'fallback');
  assert.ok(warnings.length);
});

test('malformed legacy backup is rejected instead of overwritten', async () => {
  const fallback = memoryStorage({ [LEGACY_KEY]: 'BROKEN BACKUP' });
  await assert.rejects(() => createPersistence({ idb: fakeIndexedDB(), fallback }));
  assert.equal(fallback.getItem(LEGACY_KEY), 'BROKEN BACKUP');
});
