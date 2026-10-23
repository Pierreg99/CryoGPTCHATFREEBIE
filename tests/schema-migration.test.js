import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseBackup, toOllamaMessages, VERSION } from "../src/core.js";
import { inspectBackup, backupReport } from "../src/backup.js";
import { createPersistence, LEGACY_KEY } from "../src/storage.js";

const fixture = version => JSON.parse(readFileSync(
  new URL(`./fixtures/backup-schema-v${version}.json`, import.meta.url), "utf8",
));
const memory = () => {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
    values,
  };
};

test("schema v1/v2/v3 fixtures migrate consistently to v3 with explicit context consent", () => {
  assert.equal(VERSION, 3);
  for (const sourceVersion of [1, 2, 3]) {
    const raw = fixture(sourceVersion);
    const before = JSON.stringify(raw);
    const inspection = inspectBackup(before);
    assert.equal(inspection.ok, true);
    assert.equal(inspection.summary.sourceVersion, sourceVersion);
    assert.equal(inspection.summary.targetVersion, VERSION);
    assert.equal(JSON.stringify(raw), before);
    const migrated = inspection.backup;
    assert.equal(migrated.version, VERSION);
    assert.deepEqual(parseBackup(JSON.stringify(migrated)), migrated);
    assert.equal(migrated.activeChatId, raw.activeChatId);
    assert.equal(migrated.chats.length, raw.chats.length);
    assert.equal(migrated.projects.length, sourceVersion === 3 ? 2 : 0);
    assert.equal(migrated.chats[0].shareProjectContext, sourceVersion !== 1);
    assert.equal(migrated.chats[0].projectId, sourceVersion === 3 ? "cryo" : null);
    assert.equal(inspection.warnings.some(w => w.path === "version"), sourceVersion !== 3);
  }
});

test("schema v3 project notes remain local even when per-chat context is explicitly shared", () => {
  const state = parseBackup(fixture(3));
  const cryo = state.chats.find(chat => chat.projectId === "cryo");
  const outgoing = JSON.stringify(toOllamaMessages(cryo));
  assert.match(outgoing, /Consented chat notes/);
  assert.doesNotMatch(outgoing, /Private roadmap notes|Private engine notes/);
  assert.equal(state.projects[1].notes, "Private engine notes");
});

test("malformed v3 and future-version backups fail validation without leaking private notes", () => {
  const scenarios = [
    value => { value.version = 999; },
    value => { value.projects.push(value.projects[0]); },
    value => { value.projects[0].notes = "x".repeat(4001); },
    value => { value.chats[0].projectId = "no-such-project"; },
    value => { delete value.projects; },
  ];
  for (const change of scenarios) {
    const source = fixture(3);
    change(source);
    const result = inspectBackup(JSON.stringify(source));
    assert.equal(result.ok, false);
    assert.throws(() => parseBackup(source));
    assert.doesNotMatch(JSON.stringify(backupReport(result)), /Private roadmap notes|Private engine notes/);
  }
});

test("schema v3 restore creates a full-fidelity checkpoint and undo restores both project workspaces", async () => {
  const fallback = memory();
  const storage = await createPersistence({ idb: null, fallback });
  const original = parseBackup(fixture(3));
  await storage.save(original);
  const reloaded = await createPersistence({ idb: null, fallback });
  assert.deepEqual(reloaded.state, original);
  const upgraded = parseBackup(fixture(2));
  const afterImport = await reloaded.restoreBackup(upgraded, original);
  assert.deepEqual(afterImport, upgraded);
  assert.deepEqual(await reloaded.readCheckpoint(), original);
  const afterUndo = await reloaded.restoreBackup(original, upgraded, true);
  assert.deepEqual(afterUndo, original);
  assert.equal(await reloaded.readCheckpoint(), null);
  assert.deepEqual(JSON.parse(fallback.getItem(LEGACY_KEY)), original);
});
