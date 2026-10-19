import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyStore, createChat, appendMessage, deleteChat, renameChat, searchChats, parseBackup, toOllamaMessages, setProjectContext, MAX_PROJECT_CONTEXT, MAX_MESSAGE_LENGTH } from '../src/core.js';
const T = '2026-10-19T18:00:00.000Z';
test('leerer Store hat stabiles Schema', () => { const s = emptyStore(); assert.equal(s.version, 2); assert.equal(s.chats.length, 0); });
test('Chat anlegen und Titel aus erster Nachricht ableiten', () => { let s = createChat(emptyStore(), 'a', 'Neuer Chat', T); s = appendMessage(s, 'a', 'user', '  Hallo CryGPTCHAT  ', 'm1', T); assert.equal(s.chats[0].title, 'Hallo CryGPTCHAT'); assert.equal(s.chats[0].messages[0].content, 'Hallo CryGPTCHAT'); });
test('Chat umbenennen und löschen', () => { let s = createChat(emptyStore(), 'a', 'X', T); s = renameChat(s, 'a', '  Z  ', T); assert.equal(s.chats[0].title, 'Z'); s = deleteChat(s, 'a'); assert.equal(s.activeChatId, null); });
test('Suche findet Nachrichteninhalte, nicht nur Titel', () => { let s = createChat(emptyStore(), 'a', 'Test', T); s = appendMessage(s, 'a', 'user', 'Kubernetes bitte', 'm1', T); assert.equal(searchChats(s, 'kube').length, 1); assert.equal(searchChats(s, 'xyz').length, 0); });
test('Backup-Roundtrip mit aktiver Unterhaltung', () => { let s = createChat(emptyStore(), 'a', 'Hi', T); s = appendMessage(s, 'a', 'assistant', 'Antwort', 'm2', T); assert.deepEqual(parseBackup(JSON.stringify(s)), s); });
test('Ungültige Rollen oder zu lange Nachrichten werden abgelehnt', () => { const s = createChat(emptyStore(), 'a', 'X', T); assert.throws(() => appendMessage(s, 'a', 'system', 'foo')); assert.throws(() => appendMessage(s, 'a', 'user', 'x'.repeat(MAX_MESSAGE_LENGTH + 1))); });
test('Manipuliertes Backup wird verworfen', () => { const s = createChat(emptyStore(), 'a', 'X', T); s.chats[0].messages = [{ id: 'z', role: 'system', content: 'oops', createdAt: T }]; assert.throws(() => parseBackup(s)); });
test('Nur Rollen und Inhalte werden an Ollama geschickt', () => { let s = createChat(emptyStore(), 'a', 'X', T); s = appendMessage(s, 'a', 'user', 'Frage', 'm', T); assert.deepEqual(toOllamaMessages(s.chats[0]), [{ role: 'user', content: 'Frage' }]); });

test('Projektwissen bleibt zunächst lokal und wird erst nach Freigabe an Ollama gegeben', () => {
  let state = createChat(emptyStore(), 'project', 'Cryo', T);
  state = appendMessage(state, 'project', 'user', 'Wie weiter?', 'u', T);
  state = setProjectContext(state, 'project', 'Nutze Typescript und lokale Modelle', false, T);
  assert.deepEqual(toOllamaMessages(state.chats[0]), [{ role: 'user', content: 'Wie weiter?' }]);
  state = setProjectContext(state, 'project', 'Nutze Typescript und lokale Modelle', true, T);
  const messages = toOllamaMessages(state.chats[0]);
  assert.equal(messages.length, 2);
  assert.equal(messages[0].role, 'user');
  assert.match(messages[0].content, /Typescript/);
  assert.equal(messages[1].content, 'Wie weiter?');
});

test('v1-Browser-Backup wird verlustfrei nach v2 migriert', () => {
  const legacy = { version: 1, chats: [{
    id: 'legacy', title: 'Alter Chat', createdAt: T, updatedAt: T,
    messages: [{ id: 'old', role: 'user', content: 'Bleibt erhalten', createdAt: T }]
  }], activeChatId: 'legacy', settings: { model: 'qwen2.5:3b' } };
  const result = parseBackup(legacy);
  assert.equal(result.version, 2);
  assert.equal(result.chats[0].messages[0].content, 'Bleibt erhalten');
  assert.equal(result.chats[0].projectContext, '');
  assert.equal(result.chats[0].shareProjectContext, false);
  assert.equal(result.settings.model, 'qwen2.5:3b');
});

test('Projektwissen und Freigabe überleben Backup und Restore', () => {
  let s = createChat(emptyStore(), 'knowledge', 'Notizen', T);
  s = setProjectContext(s, 'knowledge', 'Projektdefinition und nächste Schritte', true, T);
  assert.deepEqual(parseBackup(JSON.stringify(s)), s);
  assert.throws(() => setProjectContext(s, 'knowledge', 'X'.repeat(MAX_PROJECT_CONTEXT + 1), true));
  s.chats[0].projectContext = 'X'.repeat(MAX_PROJECT_CONTEXT + 1);
  assert.throws(() => parseBackup(s), /Projektwissen/);
});

test('Projektkontext benötigt explizite Freigabe und respektiert das 24-Nachrichten-Limit', () => {
  let s = createChat(emptyStore(), 'a', 'A', T);
  for (let i = 0; i < 30; i++) s = appendMessage(s, 'a', 'user', 'Prompt ' + i, 'm' + i, T);
  s = setProjectContext(s, 'a', 'Projektplan', true, T);
  const messages = toOllamaMessages(s.chats[0]);
  assert.equal(messages.length, 24);
  assert.match(messages[0].content, /Projektplan/);
  assert.equal(messages.at(-1).content, 'Prompt 29');
});
