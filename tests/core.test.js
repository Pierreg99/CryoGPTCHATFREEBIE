import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyStore, createChat, appendMessage, deleteChat, renameChat, searchChats, filterChats, messagePage, parseBackup, toOllamaMessages, setProjectContext, createProject, setChatProject, setProjectNotes, MAX_PROJECT_CONTEXT, MAX_MESSAGE_LENGTH } from '../src/core.js';
const T = '2026-10-19T18:00:00.000Z';
test('leerer Store hat stabiles Schema', () => { const s = emptyStore(); assert.equal(s.version, 3); assert.equal(s.chats.length, 0); });
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

test('v1-Browser-Backup wird verlustfrei nach v3 migriert', () => {
  const legacy = { version: 1, chats: [{
    id: 'legacy', title: 'Alter Chat', createdAt: T, updatedAt: T,
    messages: [{ id: 'old', role: 'user', content: 'Bleibt erhalten', createdAt: T }]
  }], activeChatId: 'legacy', settings: { model: 'qwen2.5:3b' } };
  const result = parseBackup(legacy);
  assert.equal(result.version, 3);
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

test('Freigabe aus alten oder manipulierten Backups wird nicht automatisch aktiviert', () => {
  const s = createChat(emptyStore(), 'x', 'X', T);
  s.chats[0].projectContext = 'Nicht automatisch weitergeben';
  s.chats[0].shareProjectContext = 'true';
  assert.equal(parseBackup(s).chats[0].shareProjectContext, false);
  s.version = 1;
  s.chats[0].shareProjectContext = true;
  assert.equal(parseBackup(s).chats[0].shareProjectContext, false);
});

test('v1.3 filters combine chat title, edited date, project notes and message role', () => {
  let state = emptyStore();
  state = createChat(state, 'a', 'Alpha', '2026-10-20T12:00:00.000Z');
  state = appendMessage(state, 'a', 'user', 'Search term', 'a1', '2026-10-20T12:00:00.000Z');
  state = setProjectContext(state, 'a', 'Lokales Projektwissen', false, '2026-10-20T12:00:00.000Z');
  state = createChat(state, 'b', 'Beta', '2026-10-21T12:00:00.000Z');
  state = appendMessage(state, 'b', 'assistant', 'Search term', 'b1', '2026-10-21T12:00:00.000Z');
  assert.deepEqual(filterChats(state, 'Search term', { role: 'user' }).map(c => c.id), ['a']);
  assert.deepEqual(filterChats(state, 'Search term', { role: 'assistant' }).map(c => c.id), ['b']);
  assert.deepEqual(filterChats(state, '', { project: 'PROJEKT', from: '2026-10-20', to: '2026-10-20', role: 'user' }).map(c => c.id), ['a']);
  assert.deepEqual(filterChats(state, '', { project: 'PROJEKT', from: '2026-10-21' }), []);
  assert.deepEqual(filterChats(state, '', { chatId: 'b' }).map(c => c.id), ['b']);
  assert.deepEqual(filterChats(state, 'Alpha', { role: 'assistant' }), []);
  assert.deepEqual(searchChats(state, 'Alpha').map(c => c.id), ['a']);
});
test('v1.2 message window bounds DOM to at most 80 while preserving every stored message', () => {
  const messages = Array.from({ length: 600 }, (_, id) => ({ id: String(id), content: String(id) }));
  const recent = messagePage(messages);
  assert.equal(recent.start, 520);
  assert.equal(recent.items.length, 80);
  assert.equal(recent.items[0].id, '520');
  assert.equal(recent.hasNewer, false);
  const older = messagePage(messages, recent.start);
  assert.equal(older.start, 440);
  assert.equal(older.items.length, 80);
  assert.equal(older.hasOlder, true);
  assert.equal(older.hasNewer, true);
  assert.equal(messagePage(messages, 1, 10000).items.length, 1);
  assert.equal(messages.length, 600);
});

test('UTC date filter normalizes time-zone-offset timestamps from valid backups', () => {
  let state = createChat(emptyStore(), 'tz', 'Zeitzonen', '2026-10-20T23:30:00-02:00');
  assert.deepEqual(filterChats(state, '', { from: '2026-10-21', to: '2026-10-21' }).map(chat => chat.id), ['tz']);
  assert.equal(filterChats(state, '', { to: '2026-10-20' }).length, 0);
  assert.deepEqual(filterChats(parseBackup(JSON.stringify(state)), '', { from: '2026-10-21', to: '2026-10-21' }).map(chat => chat.id), ['tz']);
});

test('v1.4 project workspaces survive JSON export and restore without model sharing', () => {
  const at = '2026-10-21T08:00:00.000Z';
  let state = createChat(emptyStore(), 'a', 'Alpha', at);
  state = createChat(state, 'b', 'Beta', at);
  state = createProject(state, 'p1', 'Cryo Omega');
  state = createProject(state, 'p2', 'Game Engine');
  state = setChatProject(state, 'a', 'p1');
  state = setChatProject(state, 'b', 'p2');
  state = setProjectNotes(state, 'p1', 'Private roadmap with <img src=x>');
  state = setProjectNotes(state, 'p2', 'Spielentwicklung');
  const restored = parseBackup(JSON.stringify(state));
  assert.deepEqual(restored, state);
  assert.deepEqual(filterChats(restored, '', { projectId: 'p1' }).map(chat => chat.id), ['a']);
  assert.deepEqual(filterChats(restored, '', { projectId: 'p2' }).map(chat => chat.id), ['b']);
  assert.deepEqual(toOllamaMessages(restored.chats[0]), []);
  assert.throws(() => setChatProject(state, 'a', 'non-existent'));
  assert.throws(() => setProjectNotes(state, 'p1', 'x'.repeat(4001)));
  const orphan = structuredClone(state); orphan.chats[0].projectId = 'invalid';
  assert.throws(() => parseBackup(orphan), /Projektzuordnung/);
  const duplicate = structuredClone(state); duplicate.projects.push(duplicate.projects[0]);
  assert.throws(() => parseBackup(duplicate), /Projekt/);
});
test('v2 backups migrate to v3 without losing consented per-chat notes or enabling shared project notes', () => {
  const at = '2026-10-21T08:00:00.000Z';
  let state = setProjectContext(createChat(emptyStore(), 'a', 'A', at), 'a', 'Freigegeben', true, at);
  state.version = 2;
  delete state.projects;
  delete state.chats[0].projectId;
  const migrated = parseBackup(JSON.stringify(state));
  assert.equal(migrated.version, 3);
  assert.deepEqual(migrated.projects, []);
  assert.equal(migrated.chats[0].projectId, null);
  assert.equal(migrated.chats[0].shareProjectContext, true);
  assert.match(toOllamaMessages(migrated.chats[0])[0].content, /Freigegeben/);
});

test('timezone-less ISO date inputs have a deterministic UTC search day', () => {
  const local = createChat(emptyStore(), 'local-day', 'Naive timestamp', '2026-10-21T23:30:00');
  assert.deepEqual(filterChats(local, '', { from: '2026-10-21', to: '2026-10-21' }).map(c => c.id), ['local-day']);
  assert.deepEqual(filterChats(local, '', { from: '2026-10-22' }), []);
  const spaced = createChat(emptyStore(), 'space', 'Naive timestamp with space', '2026-10-21 23:30:00');
  assert.deepEqual(filterChats(spaced, '', { to: '2026-10-21' }).map(c => c.id), ['space']);
});

test('moving a chat between projects updates its date exactly when assignment changes', () => {
  const initial = '2026-10-20T08:00:00.000Z';
  const changed = '2026-10-22T10:00:00.000Z';
  let s = createChat(emptyStore(), 'chat', 'Notizen', initial);
  s = createProject(s, 'p', 'Project');
  s = setChatProject(s, 'chat', 'p', changed);
  assert.equal(s.chats[0].updatedAt, changed);
  assert.deepEqual(filterChats(s, '', { from: '2026-10-22', projectId: 'p' }).map(c => c.id), ['chat']);
  s = setChatProject(s, 'chat', 'p', '2026-10-23T01:00:00.000Z');
  assert.equal(s.chats[0].updatedAt, changed);
  s = setChatProject(s, 'chat', null, '2026-10-23T01:00:00.000Z');
  assert.equal(s.chats[0].projectId, null);
  assert.equal(s.chats[0].updatedAt, '2026-10-23T01:00:00.000Z');
});
