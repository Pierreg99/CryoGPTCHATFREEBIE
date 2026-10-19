export const VERSION = 1;
export const MAX_CHATS = 200;
export const MAX_MESSAGES = 600;
export const MAX_MESSAGE_LENGTH = 12000;

export function emptyStore() {
  return { version: VERSION, chats: [], activeChatId: null, settings: { model: '' } };
}
const uid = () => globalThis.crypto?.randomUUID?.() || `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function createChat(store, id = uid(), title = 'Neuer Chat', now = new Date().toISOString()) {
  if (store.chats.length >= MAX_CHATS) throw new Error(`Maximal ${MAX_CHATS} Chats. Bitte exportieren und aufräumen.`);
  if (store.chats.some(chat => chat.id === id)) throw new Error('ID bereits vergeben');
  const chat = { id, title: String(title).trim().slice(0, 100) || 'Neuer Chat', createdAt: now, updatedAt: now, messages: [] };
  return { ...store, activeChatId: id, chats: [chat, ...store.chats] };
}

export function renameChat(store, chatId, title, now = new Date().toISOString()) {
  const text = String(title).trim().slice(0, 100);
  if (!text) return store;
  return { ...store, chats: store.chats.map(chat => chat.id === chatId ? { ...chat, title: text, updatedAt: now } : chat) };
}

export function deleteChat(store, chatId) {
  const chats = store.chats.filter(chat => chat.id !== chatId);
  return { ...store, chats, activeChatId: store.activeChatId === chatId ? (chats[0]?.id || null) : store.activeChatId };
}

export function appendMessage(store, chatId, role, text, id = uid(), now = new Date().toISOString()) {
  if (!['user', 'assistant'].includes(role)) throw new Error('Ungültige Nachrichtenrolle');
  const content = String(text).trim();
  if (!content || content.length > MAX_MESSAGE_LENGTH) throw new Error('Nachricht leer oder zu lang');
  if (!store.chats.some(c => c.id === chatId)) throw new Error('Chat nicht gefunden');
  const chats = store.chats.map(chat => {
    if (chat.id !== chatId) return chat;
    if (chat.messages.length >= MAX_MESSAGES) throw new Error('Nachrichtenlimit erreicht. Bitte exportieren.');
    const messages = [...chat.messages, { id, role, content, createdAt: now }];
    const title = role === 'user' && chat.messages.length === 0 && chat.title === 'Neuer Chat' ? content.replace(/\s+/g, ' ').slice(0, 55) : chat.title;
    return { ...chat, title, updatedAt: now, messages };
  });
  return { ...store, chats: chats.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) };
}

export function searchChats(store, query) {
  const needle = String(query || '').trim().toLocaleLowerCase('de-DE');
  if (!needle) return store.chats;
  return store.chats.filter(chat => chat.title.toLocaleLowerCase('de-DE').includes(needle) || chat.messages.some(message => message.content.toLocaleLowerCase('de-DE').includes(needle)));
}

export function parseBackup(raw) {
  const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!value || typeof value !== 'object' || value.version !== VERSION || !Array.isArray(value.chats) || value.chats.length > MAX_CHATS) throw new Error('Inkompatibles Backupformat');
  const seen = new Set();
  const chats = value.chats.map(c => {
    if (!c || typeof c.id !== 'string' || !c.id || c.id.length > 200 || seen.has(c.id) || typeof c.title !== 'string' || !Array.isArray(c.messages) || c.messages.length > MAX_MESSAGES) throw new Error('Ungültiger Chat im Backup');
    seen.add(c.id);
    const validDate = date => typeof date === 'string' && !Number.isNaN(Date.parse(date));
    const messages = c.messages.map(m => {
      if (!m || typeof m.id !== 'string' || !m.id || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || !m.content.trim() || m.content.length > MAX_MESSAGE_LENGTH || !validDate(m.createdAt)) throw new Error('Ungültige Nachricht im Backup');
      return { id: m.id, role: m.role, content: m.content, createdAt: m.createdAt };
    });
    return { id: c.id, title: c.title.slice(0, 100), createdAt: validDate(c.createdAt) ? c.createdAt : new Date().toISOString(), updatedAt: validDate(c.updatedAt) ? c.updatedAt : new Date().toISOString(), messages };
  });
  return { version: VERSION, chats, activeChatId: chats.some(c => c.id === value.activeChatId) ? value.activeChatId : (chats[0]?.id || null), settings: { model: typeof value.settings?.model === 'string' ? value.settings.model.slice(0, 100) : '' } };
}

export function toOllamaMessages(chat) {
  if (!chat) return [];
  return chat.messages.filter(m => m.role === 'user' || m.role === 'assistant').slice(-24).map(({ role, content }) => ({ role, content }));
}
