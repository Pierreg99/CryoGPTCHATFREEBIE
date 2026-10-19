import { emptyStore, createChat, renameChat, deleteChat, appendMessage, searchChats, parseBackup, toOllamaMessages } from './core.js';

const KEY = 'crygptchat.alpha.v1';
const el = id => document.getElementById(id);
let store, models = [], sending = false, busyChatId = null, noticeTimer;

function notice(message) {
  clearTimeout(noticeTimer);
  el('notice').textContent = message;
  noticeTimer = setTimeout(() => { el('notice').textContent = ''; }, 8000);
}
try {
  const saved = localStorage.getItem(KEY);
  store = saved ? parseBackup(saved) : emptyStore();
} catch {
  store = emptyStore();
  queueMicrotask(() => notice('Gespeicherte Chats konnten nicht gelesen werden. Importiere bei Bedarf ein Backup.'));
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(store)); }
  catch { notice('Lokaler Speicher ist voll oder blockiert. Bitte exportiere deine Daten.'); }
}
function active() { return store.chats.find(c => c.id === store.activeChatId) || null; }
function mutate(fn) {
  try { store = fn(store); persist(); render(); return true; }
  catch (error) { notice(error.message); return false; }
}
function closeSidebar() { el('sidebar').classList.remove('open'); el('mobile-cover').hidden = true; }
function renderList() {
  const list = el('chat-list');
  list.replaceChildren();
  el('chat-count').textContent = String(store.chats.length);
  const results = searchChats(store, el('search').value);
  if (!results.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-list';
    empty.textContent = store.chats.length ? 'Keine Treffer.' : 'Noch keine Gespräche.';
    list.append(empty);
  }
  for (const chat of results) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'chat-link' + (chat.id === store.activeChatId ? ' active' : '');
    button.setAttribute('aria-current', chat.id === store.activeChatId ? 'page' : 'false');
    const name = document.createElement('strong'); name.textContent = chat.title;
    const count = document.createElement('small'); count.textContent = chat.messages.length + ' Nachrichten';
    button.append(name, count);
    button.addEventListener('click', () => { store.activeChatId = chat.id; persist(); render(); closeSidebar(); });
    list.append(button);
  }
}
function renderMessages() {
  const chat = active(), list = el('messages');
  list.replaceChildren();
  el('welcome').hidden = Boolean(chat?.messages.length);
  el('top-title').textContent = chat?.title || 'Neuer Chat';
  el('chat-heading').textContent = chat?.title || 'CryoGPTChat.';
  el('chat-subtitle').textContent = chat?.messages.length
    ? 'Gesprächsverlauf – nur in deinem Browserprofil gespeichert.'
    : 'Dein Arbeitsbereich für Ideen, Code und Gespräche – ohne Cloud-Zwang.';
  el('rename-chat').disabled = !chat;
  el('delete-chat').disabled = !chat;
  for (const msg of chat?.messages || []) {
    const row = document.createElement('article');
    row.className = 'message ' + msg.role;
    const avatar = document.createElement('div');
    avatar.className = 'avatar'; avatar.textContent = msg.role === 'user' ? 'DU' : 'AI';
    const body = document.createElement('div');
    const meta = document.createElement('small');
    meta.textContent = (msg.role === 'user' ? 'DU' : 'LOKALES MODELL') + ' · ' + new Date(msg.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    const pre = document.createElement('pre');
    pre.textContent = msg.content; // Never treat user/model content as HTML.
    body.append(meta, pre); row.append(avatar, body); list.append(row);
  }
  if (sending && chat?.id === busyChatId) {
    const typing = document.createElement('p');
    typing.className = 'typing'; typing.textContent = '◌ Lokales Modell antwortet …';
    list.append(typing);
  }
  list.scrollTop = list.scrollHeight;
}
function render() { renderList(); renderMessages(); }

async function refreshModels() {
  el('status').textContent = '○ Prüfe Ollama …';
  try {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Server nicht erreichbar');
    const data = await res.json();
    models = data.online && Array.isArray(data.models) ? data.models : [];
    el('status').textContent = models.length ? '● ' + models.length + ' Modell(e) bereit' : '○ Nur lokale Notizen';
  } catch { models = []; el('status').textContent = '○ Keine KI-Verbindung'; }
  const picker = el('model');
  picker.replaceChildren();
  const offline = document.createElement('option');
  offline.value = ''; offline.textContent = 'Nur lokal speichern'; picker.append(offline);
  for (const name of models) {
    const option = document.createElement('option');
    option.value = name; option.textContent = name; picker.append(option);
  }
  picker.value = models.includes(store.settings.model) ? store.settings.model : (models[0] || '');
  store.settings.model = picker.value;
  persist();
}

el('new-chat').addEventListener('click', () => { mutate(s => createChat(s)); closeSidebar(); el('prompt').focus(); });
el('search').addEventListener('input', renderList);
el('refresh').addEventListener('click', refreshModels);
el('model').addEventListener('change', e => { store.settings.model = e.target.value; persist(); });
el('rename-chat').addEventListener('click', () => {
  const chat = active(); if (!chat) return;
  const title = window.prompt('Neuer Chat-Titel:', chat.title);
  if (title !== null) mutate(s => renameChat(s, chat.id, title));
});
el('delete-chat').addEventListener('click', () => {
  const chat = active();
  if (chat && window.confirm('Chat „' + chat.title + '“ wirklich löschen?')) mutate(s => deleteChat(s, chat.id));
});
el('nav-toggle').addEventListener('click', () => { el('sidebar').classList.add('open'); el('mobile-cover').hidden = false; });
el('mobile-cover').addEventListener('click', closeSidebar);
document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => {
  el('prompt').value = button.dataset.prompt; el('prompt').focus();
}));
document.addEventListener('keydown', e => {
  if (e.altKey && e.key.toLowerCase() === 'n') { e.preventDefault(); el('new-chat').click(); }
});
el('prompt').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); el('composer').requestSubmit(); }
});

el('composer').addEventListener('submit', async e => {
  e.preventDefault();
  if (sending) return;
  const content = el('prompt').value.trim();
  if (!content) return;
  if (!active() && !mutate(s => createChat(s))) return;
  const chatId = store.activeChatId;
  if (!mutate(s => appendMessage(s, chatId, 'user', content))) return;
  el('prompt').value = '';
  const model = el('model').value;
  if (!model) { notice('Als lokale Notiz gespeichert. Wähle ein Modell für KI-Antworten.'); return; }
  sending = true; busyChatId = chatId; el('send').disabled = true; render();
  try {
    const chat = store.chats.find(c => c.id === chatId);
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: toOllamaMessages(chat) })
    });
    const data = await res.json();
    if (!res.ok || typeof data.message !== 'string') throw new Error(data.error || 'Modellantwort fehlgeschlagen');
    mutate(s => appendMessage(s, chatId, 'assistant', data.message));
  } catch (error) {
    notice('Notiz gespeichert, aber KI-Anfrage fehlgeschlagen: ' + error.message);
  } finally {
    sending = false; busyChatId = null; el('send').disabled = false; render();
  }
});

el('export').addEventListener('click', () => {
  const data = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(data), link = document.createElement('a');
  link.href = url; link.download = 'cryogptchat-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
el('import').addEventListener('click', () => el('import-file').click());
el('import-file').addEventListener('change', async e => {
  const file = e.target.files?.[0]; if (!file) return;
  try {
    if (file.size > 3 * 1024 * 1024) throw new Error('Backups dürfen maximal 3 MB groß sein.');
    const backup = parseBackup(await file.text());
    if (!window.confirm('Import ersetzt ' + store.chats.length + ' Chat(s) durch ' + backup.chats.length + ' Chat(s). Fortfahren?')) return;
    store = backup; persist(); render(); await refreshModels(); notice('Backup importiert.');
  } catch (error) { notice('Import fehlgeschlagen: ' + error.message); }
  finally { e.target.value = ''; }
});

render();
refreshModels();
