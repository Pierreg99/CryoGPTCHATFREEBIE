import { parseBackup } from "./core.js";
import { MAX_BACKUP_BYTES } from "./backup.js";

// This is a transport envelope, not a new stored-chat schema.
// The PBKDF2 cost and algorithms are intentionally fixed for predictable review.
export const ENCRYPTED_BACKUP_FORMAT = "cryogptchat-encrypted-backup";
export const ENCRYPTED_BACKUP_VERSION = 1;
export const PBKDF2_ITERATIONS = 600_000;
export const MAX_ENCRYPTED_BACKUP_BYTES = 4 * 1024 * 1024;
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

function cryptography() {
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues)
    throw new Error("Sichere Browser-Verschlüsselung ist nicht verfügbar.");
  return globalThis.crypto;
}
function passwordBytes(password, exporting = false) {
  if (typeof password !== "string") throw new Error("Passwort erforderlich.");
  const bytes = encoder.encode(password);
  if (!bytes.length || bytes.length > 1024 ||
    (exporting && password.length < 12))
    throw new Error(exporting
      ? "Bitte ein Passwort mit mindestens 12 Zeichen (maximal 1024 UTF-8-Bytes) verwenden."
      : "Passwort fehlt oder ist zu lang.");
  return bytes;
}
function base64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
function fromBase64(value, expectedSize = null) {
  if (typeof value !== "string" || value.length > MAX_ENCRYPTED_BACKUP_BYTES * 2 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))
    throw new Error("Ungültige verschlüsselte Backup-Datei.");
  const binary = atob(value);
  if (expectedSize !== null && binary.length !== expectedSize)
    throw new Error("Ungültige verschlüsselte Backup-Datei.");
  const bytes = Uint8Array.from(binary, letter => letter.charCodeAt(0));
  if (base64(bytes) !== value) throw new Error("Ungültige verschlüsselte Backup-Datei.");
  return bytes;
}
async function derive(password, salt, operation) {
  const crypto = cryptography();
  const key = await crypto.subtle.importKey("raw", password, "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    { name: "AES-GCM", length: 256 },
    false,
    [operation],
  );
}

export function isEncryptedBackup(raw) {
  if (typeof raw !== "string" || raw.length > MAX_ENCRYPTED_BACKUP_BYTES) return false;
  try {
    const value = JSON.parse(raw);
    return value !== null && typeof value === "object" && !Array.isArray(value) &&
      value.format === ENCRYPTED_BACKUP_FORMAT;
  } catch {
    return false;
  }
}
export async function encryptBackup(snapshot, password) {
  const passphrase = passwordBytes(password, true);
  const plaintext = encoder.encode(JSON.stringify(parseBackup(snapshot)));
  if (plaintext.length > MAX_BACKUP_BYTES)
    throw new Error("Der lokale Datenbestand ist für einen Backup-Export zu groß.");
  const crypto = cryptography();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derive(passphrase, salt, "encrypt");
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext),
  );
  return {
    format: ENCRYPTED_BACKUP_FORMAT,
    version: ENCRYPTED_BACKUP_VERSION,
    kdf: "PBKDF2-SHA-256",
    iterations: PBKDF2_ITERATIONS,
    salt: base64(salt),
    cipher: "AES-256-GCM",
    iv: base64(iv),
    ciphertext: base64(ciphertext),
  };
}
export async function decryptBackup(raw, password) {
  if (typeof raw !== "string" ||
    encoder.encode(raw).length > MAX_ENCRYPTED_BACKUP_BYTES)
    throw new Error("Verschlüsseltes Backup ist zu groß oder unlesbar.");
  let envelope;
  try { envelope = JSON.parse(raw); } catch {
    throw new Error("Ungültige verschlüsselte Backup-Datei.");
  }
  if (!envelope || envelope.format !== ENCRYPTED_BACKUP_FORMAT ||
    envelope.version !== ENCRYPTED_BACKUP_VERSION ||
    envelope.kdf !== "PBKDF2-SHA-256" || envelope.iterations !== PBKDF2_ITERATIONS ||
    envelope.cipher !== "AES-256-GCM")
    throw new Error("Unbekanntes oder manipuliertes Verschlüsselungsformat.");
  const salt = fromBase64(envelope.salt, 16);
  const iv = fromBase64(envelope.iv, 12);
  const ciphertext = fromBase64(envelope.ciphertext);
  if (ciphertext.length < 16 || ciphertext.length > MAX_BACKUP_BYTES + 16)
    throw new Error("Ungültige verschlüsselte Backup-Datei.");
  const passphrase = passwordBytes(password);
  try {
    const key = await derive(passphrase, salt, "decrypt");
    const plain = await cryptography().subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    if (plain.byteLength > MAX_BACKUP_BYTES)
      throw new Error("Backup ist zu groß.");
    return decoder.decode(plain);
  } catch {
    // Do not disclose whether the password or ciphertext/tag was incorrect.
    throw new Error("Entschlüsselung fehlgeschlagen: Passwort falsch oder Datei verändert.");
  }
}
