import test from "node:test";
import assert from "node:assert/strict";
import { emptyStore, createChat, appendMessage, parseBackup } from "../src/core.js";
import { inspectBackup } from "../src/backup.js";
import {
  encryptBackup, decryptBackup, isEncryptedBackup, ENCRYPTED_BACKUP_FORMAT,
  PBKDF2_ITERATIONS, MAX_ENCRYPTED_BACKUP_BYTES,
} from "../src/encrypted-backup.js";

const PASSWORD = "Eine-lange-geheime-Passphrase-123";
function state() {
  const timestamp = "2026-10-21T12:00:00.000Z";
  let store = createChat(emptyStore(), "c", "Sicheres Gespräch", timestamp);
  store = appendMessage(store, "c", "user", "Geheimnis nur lokal", "m", timestamp);
  return store;
}
test("v1.6: PBKDF2/AES-GCM exports and decrypts a locally validated v3 backup", async () => {
  const original = state();
  const encrypted = await encryptBackup(original, PASSWORD);
  assert.equal(encrypted.format, ENCRYPTED_BACKUP_FORMAT);
  assert.equal(encrypted.iterations, PBKDF2_ITERATIONS);
  assert.equal(encrypted.cipher, "AES-256-GCM");
  assert.equal(encrypted.version, 1);
  const json = JSON.stringify(encrypted);
  assert.equal(isEncryptedBackup(json), true);
  assert.doesNotMatch(json, /Geheimnis nur lokal|Sicheres Gespräch|Passphrase/);
  const decrypted = await decryptBackup(json, PASSWORD);
  assert.equal(inspectBackup(decrypted).ok, true);
  assert.deepEqual(parseBackup(decrypted), original);
});
test("wrong password and modified AES-GCM ciphertext never yield plaintext", async () => {
  const encrypted = await encryptBackup(state(), PASSWORD);
  await assert.rejects(decryptBackup(JSON.stringify(encrypted), "wrong-password-value"), /Passwort falsch oder Datei verändert/);
  const corrupted = { ...encrypted, ciphertext: encrypted.ciphertext.slice(0, -4) + "AAAA" };
  await assert.rejects(decryptBackup(JSON.stringify(corrupted), PASSWORD), /Entschlüsselung|Ungültige/);
  assert.equal(inspectBackup(JSON.stringify(encrypted)).ok, false);
});
test("unique salt and IV for separate exports prevents matching ciphertext", async () => {
  const first = await encryptBackup(state(), PASSWORD);
  const next = await encryptBackup(state(), PASSWORD);
  assert.notEqual(first.salt, next.salt);
  assert.notEqual(first.iv, next.iv);
  assert.notEqual(first.ciphertext, next.ciphertext);
  assert.deepEqual(JSON.parse(await decryptBackup(JSON.stringify(next), PASSWORD)), state());
});
test("reject weak export passwords, unknown encryption parameters and oversized data", async () => {
  await assert.rejects(encryptBackup(state(), "short"), /mindestens 12/);
  const encrypted = await encryptBackup(state(), PASSWORD);
  await assert.rejects(decryptBackup(JSON.stringify({ ...encrypted, iterations: 1 }), PASSWORD), /Unbekanntes/);
  await assert.rejects(decryptBackup(JSON.stringify({ ...encrypted, version: 2 }), PASSWORD), /Unbekanntes/);
  await assert.rejects(decryptBackup(JSON.stringify({ ...encrypted, iv: encrypted.salt }), PASSWORD), /Ungültige/);
  await assert.rejects(decryptBackup("x".repeat(MAX_ENCRYPTED_BACKUP_BYTES + 1), PASSWORD), /zu groß/);
  assert.equal(isEncryptedBackup("not-json"), false);
});
