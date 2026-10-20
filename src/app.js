import { consumeOllamaStream } from './stream.js';
import { createPersistence } from './storage.js';
import { emptyStore, createChat, renameChat, deleteChat, appendMessage, searchChats, parseBackup, toOllamaMessages, setProjectContext } from './core.js';

const el = id => document.getElementById(id);
let store = emptyStore(), models = [], sending = false, busyChatId = null, noticeTimer;
let streamController = null, streamedText = '', persistence = null;
const storageWarnings = [];

function notice(message) {
  clearTimeout(noticeTimer);
  el('notice').textContent = message;
  noticeTimer = setTimeout(() => { el('notice').textContent = ''; }, 8000);
}
try {
  persistence = await createPersistence({ onWarning: message => storageWarnings.push(message) });
  store = persistence.state;
} catch {
  // Do not overwrite a malformed existing backup with an empty store.
  storageWarnings.push('Vorhandene Daten konnten nicht gelesen werden. Bitte erst dein altes Backup sichern und reparieren.');
}

function persist() {
  if (!persistence) { notice('Speichern gesperrt: Datenproblem. Bitte vorhandene Daten sichern.'); return; }
  persistence.save(store).catch(error => notice(error.message));
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
  el('rename-chat').disabled = !chat || (sending && chat?.id === busyChatId);
  el('delete-chat').disabled = !chat || (sending && chat?.id === busyChatId);
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
    typing.className = 'typing'; typing.id = 'streaming-reply';
    typing.setAttribute('aria-live', 'off');
    typing.textContent = streamedText || '◌ Lokales Modell antwortet …';
    list.append(typing);
  }
  list.scrollTop = list.scrollHeight;
}
function renderProjectPanel() {
  const chat = active();
  const button = el('notes-toggle');
  button.disabled = !chat || (sending && chat.id === busyChatId);
  el('project-context').disabled = !chat || (sending && chat.id === busyChatId);
  el('project-share').disabled = !chat || (sending && chat.id === busyChatId);
  el('save-project-notes').disabled = !chat || (sending && chat.id === busyChatId);
  el('project-context').value = chat?.projectContext || '';
  el('project-share').checked = Boolean(chat?.shareProjectContext);
  el('project-notes-status').textContent = chat
    ? (chat.shareProjectContext ? 'Diese Notizen werden bei der nächsten Modellanfrage mitgesendet.' : 'Privat gespeichert – noch nicht an ein Modell freigegeben.')
    : 'Erstelle zuerst einen Chat.';
}
function render() { renderList(); renderMessages(); renderProjectPanel(); }

async function refreshModels() {
  if (sending) return;
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
  // Never switch automatically from explicit note-only mode to a paid or local model.
  picker.value = models.includes(store.settings.model) ? store.settings.model : '';
  el('model-state').textContent = picker.value ? 'Aktiv: ' + picker.value : 'Notizmodus · Modell manuell auswählen';
  store.settings.model = picker.value;
  persist();
}

let godotConfigured = false, godotBusy = false, canCreateScenes = false, sceneTicket = null, sceneExpiry = 0;
function clearScenePreview() { sceneTicket = null; sceneExpiry = 0; el('scene-create').disabled = true; }
function setGodotControls() {
  el('godot-version').disabled = !godotConfigured || godotBusy;
  el('godot-project').disabled = !godotConfigured || godotBusy;
  el('scene-preview').disabled = !godotConfigured || !canCreateScenes || godotBusy;
  el('scene-create').disabled = !godotConfigured || !canCreateScenes || godotBusy || !sceneTicket || Date.now() >= sceneExpiry;
}
async function checkGodotStatus() {
  try {
    const res = await fetch('/api/godot/status', { cache: 'no-store' });
    if (!res.ok) throw new Error('Godot-Status nicht abrufbar.');
    const data = await res.json();
    godotConfigured = data.configured === true;
    canCreateScenes = godotConfigured && data.canCreateScenes === true;
    el('godot-status').textContent = godotConfigured
      ? '● Optionales Godot MCP eingerichtet. Keine Abfrage läuft.'
      : '○ Nicht eingerichtet. Anleitung: docs/integrations/godot-mcp.md';
  } catch {
    godotConfigured = false;
    canCreateScenes = false;
    el('godot-status').textContent = '○ Godot MCP ist aktuell nicht erreichbar.';
  }
  setGodotControls();
}
el('godot-toggle').addEventListener('click', async () => {
  const panel = el('godot-panel');
  panel.hidden = !panel.hidden;
  el('godot-toggle').setAttribute('aria-expanded', String(!panel.hidden));
  if (!panel.hidden) await checkGodotStatus();
});
async function inspectGodot(tool) {
  if (!godotConfigured || godotBusy) return;
  const title = tool === 'get_godot_version' ? 'Godot-Version prüfen' : 'Godot-Projektinformationen auslesen';
  if (!window.confirm(title + '? Dazu wird der lokal konfigurierte Godot-MCP-Prozess einmalig gestartet.')) return;
  godotBusy = true;
  setGodotControls();
  el('godot-status').textContent = '◌ Lokale Abfrage läuft …';
  el('godot-output').textContent = 'Godot MCP wird geprüft …';
  try {
    const res = await fetch('/api/godot/inspect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Godot-Abfrage fehlgeschlagen.');
    el('godot-output').textContent = String(data.output || 'Keine Informationen verfügbar.');
    el('godot-status').textContent = '● Abfrage abgeschlossen. Ergebnis wurde nur angezeigt, nicht automatisch gespeichert oder an KI gesendet.';
  } catch (error) {
    el('godot-output').textContent = 'Fehler: ' + error.message;
    el('godot-status').textContent = '○ Abfrage fehlgeschlagen.';
  } finally {
    godotBusy = false;
    setGodotControls();
  }
}
for (const id of ['scene-name', 'scene-root']) {
  el(id).addEventListener('input', () => {
    clearScenePreview();
    el('scene-summary').textContent = 'Eingabe geändert. Bitte neue Vorschau erstellen.';
  });
}
el('scene-preview').addEventListener('click', async () => {
  if (!godotConfigured || !canCreateScenes || godotBusy) return;
  clearScenePreview();
  godotBusy = true; setGodotControls();
  try {
    const response = await fetch('/api/godot/scene/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sceneName: el('scene-name').value.trim(), rootNodeType: el('scene-root').value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Szenenvorschau fehlgeschlagen.');
    sceneTicket = data.ticket;
    sceneExpiry = data.expiresAt;
    el('scene-summary').textContent = data.summary + '\n\n2 Minuten gültig. Erst „Geprüfte Szene erstellen“ schreibt eine Datei.';
  } catch (error) {
    el('scene-summary').textContent = 'Fehler: ' + error.message;
  } finally {
    godotBusy = false; setGodotControls();
  }
});
el('scene-create').addEventListener('click', async () => {
  if (!sceneTicket || !canCreateScenes || godotBusy) return;
  if (Date.now() >= sceneExpiry) {
    clearScenePreview(); setGodotControls();
    el('scene-summary').textContent = 'Die Vorschau ist abgelaufen. Bitte erneut prüfen.';
    return;
  }
  const approval = window.prompt('Du erstellst eine NEUE Godot-Szenendatei im festgelegten Testprojekt. Bitte ERSTELLEN eingeben:', '');
  if (approval !== 'ERSTELLEN') return;
  const ticket = sceneTicket;
  clearScenePreview();
  godotBusy = true; setGodotControls();
  try {
    const response = await fetch('/api/godot/scene/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Szenenerstellung fehlgeschlagen.');
    el('scene-summary').textContent = 'Erstellt: ' + data.scenePath + '\nWurzelknoten: ' + data.rootNodeType + '\n' + (data.output || '');
  } catch (error) {
    el('scene-summary').textContent = 'Fehler: ' + error.message;
  } finally {
    godotBusy = false; setGodotControls();
  }
});
el('godot-version').addEventListener('click', () => inspectGodot('get_godot_version'));
el('godot-project').addEventListener('click', () => inspectGodot('get_project_info'));

el('notes-toggle').addEventListener('click', () => {
  if (!active()) { notice('Bitte zuerst einen Chat erstellen.'); return; }
  const panel = el('project-panel');
  panel.hidden = !panel.hidden;
  el('notes-toggle').setAttribute('aria-expanded', String(!panel.hidden));
});
el('save-project-notes').addEventListener('click', () => {
  const chat = active();
  if (!chat) return;
  const saved = mutate(state => setProjectContext(state, chat.id, el('project-context').value, el('project-share').checked));
  if (saved) notice('Projektwissen gespeichert.' + (active()?.shareProjectContext ? ' Beim nächsten Ollama-Aufruf wird es einbezogen.' : ' Es bleibt lokal privat.'));
});
el('new-chat').addEventListener('click', () => { mutate(s => createChat(s)); closeSidebar(); el('prompt').focus(); });
el('search').addEventListener('input', renderList);
el('refresh').addEventListener('click', refreshModels);
el('model').addEventListener('change', e => {
  store.settings.model = e.target.value;
  el('model-state').textContent = store.settings.model ? 'Aktiv: ' + store.settings.model : 'Notizmodus · Modell manuell auswählen';
  persist();
});
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

function setGenerating(value) {
  el('send').hidden = value;
  el('stop').hidden = !value;
  el('model').disabled = value;
  el('refresh').disabled = value;
}
el('stop').addEventListener('click', () => {
  if (streamController && !streamController.signal.aborted) streamController.abort();
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
  sending = true;
  busyChatId = chatId;
  streamedText = '';
  streamController = new AbortController();
  const controller = streamController;
  setGenerating(true);
  render();
  try {
    const chat = store.chats.find(c => c.id === chatId);
    const res = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ model, messages: toOllamaMessages(chat) })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Modellantwort fehlgeschlagen (HTTP ' + res.status + ').');
    }
    const reply = await consumeOllamaStream(res.body, {
      signal: controller.signal,
      onToken: text => {
        streamedText = text;
        const preview = el('streaming-reply');
        if (preview) {
          preview.textContent = text;
          el('messages').scrollTop = el('messages').scrollHeight;
        }
      }
    });
    if (reply.trim()) mutate(s => appendMessage(s, chatId, 'assistant', reply));
    else notice('Das Modell hat eine leere Antwort gesendet.');
  } catch (error) {
    if (controller.signal.aborted) {
      if (streamedText.trim()) {
        mutate(s => appendMessage(s, chatId, 'assistant', streamedText.trim().slice(0, 11960) + '\n\n[Antwort abgebrochen]'));
      }
      notice('KI-Generierung gestoppt. Bereits empfangener Text bleibt erhalten.');
    } else {
      if (streamedText.trim()) {
        mutate(s => appendMessage(s, chatId, 'assistant', streamedText.trim().slice(0, 11960) + '\n\n[Antwort unvollständig]'));
      }
      notice('KI-Anfrage unterbrochen: ' + error.message);
    }
  } finally {
    sending = false;
    busyChatId = null;
    streamController = null;
    streamedText = '';
    setGenerating(false);
    render();
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
  if (sending) { e.target.value = ''; notice('Bitte die laufende Antwort zuerst stoppen.'); return; }
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
if (storageWarnings.length) queueMicrotask(() => notice(storageWarnings.join(' ')));
