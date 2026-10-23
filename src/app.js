import { setupAccessibility } from "./accessibility.js";
import { setupWorkbench } from "./workbench.js";
import { createErrorCenter } from "./error-center.js";
import { setupBackupRestore } from "./backup-ui.js";
import { refineInterface } from "./interface-polish.js";
import { confirmAction, requestText } from "./dialogs.js";
import { setupWorkspace } from "./workspace.js";
import { setupAgentFlow } from "./agent-flow.js";
import { consumeOllamaStream } from "./stream.js";
import { setupIntegrations } from "./integrations.js";
import { setupAgent } from "./agent-ui.js";
import { setupHyperfocus } from "./hyperfocus-ui.js";
import { createPersistence } from "./storage.js";
import {
  emptyStore,
  createChat,
  renameChat,
  deleteChat,
  appendMessage,
  filterChats,
  messagePage,
  toOllamaMessages,
  setProjectContext,
} from "./core.js";

const el = (id) => document.getElementById(id);
let store = emptyStore(),
  models = [],
  sending = false,
  busyChatId = null,
  restoring = false,
  modelRefreshSerial = 0;
let streamController = null,
  streamedText = "",
  persistence = null;
const storageWarnings = [];
const errorCenter = createErrorCenter();

function notice(message) {
  const banner = el("notice");
  banner.hidden = false;
  let text = el("notice-message");
  if (!text) {
    banner.removeAttribute("role");
    banner.removeAttribute("aria-live");
    banner.setAttribute("aria-label", "Benachrichtigung");
    text = document.createElement("span");
    text.id = "notice-message";
    text.setAttribute("role", "status");
    text.setAttribute("aria-live", "polite");
    text.setAttribute("aria-atomic", "true");
    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.id = "notice-dismiss";
    dismiss.textContent = "Meldung schließen";
    dismiss.addEventListener("click", () => {
      banner.hidden = true;
      document.querySelector("main").focus({ preventScroll: true });
    });
    banner.append(text, dismiss);
  }
  text.textContent = message;
}
try {
  persistence = await createPersistence({
    onWarning: (message) => storageWarnings.push(message),
  });
  store = persistence.state;
} catch {
  // Do not overwrite a malformed existing backup with an empty store.
  storageWarnings.push(
    "Vorhandene Daten konnten nicht gelesen werden. Bitte erst dein altes Backup sichern und reparieren.",
  );
  errorCenter.report({
    scope: "storage",
    title: "Lokale Daten nicht lesbar",
    detail: "Speichern bleibt gesperrt. Vorhandene Daten sichern und das Backup prüfen.",
  });
}

function persist() {
  if (!persistence) {
    notice("Speichern gesperrt: Datenproblem. Bitte vorhandene Daten sichern.");
    return;
  }
  return persistence.save(store).then(
    () => errorCenter.resolve("storage"),
    () => {
      const message = "Lokale Änderungen konnten nicht gespeichert werden.";
      notice(message);
      errorCenter.report({
        scope: "storage",
        title: "Speicherfehler",
        detail: "Die Änderungen sind möglicherweise nur im Arbeitsspeicher. Bitte erst sichern oder Speicherzugriff prüfen.",
        retryLabel: "Erneut speichern",
        retry: () => persist(),
      });
    },
  );
}
function active() {
  return store.chats.find((c) => c.id === store.activeChatId) || null;
}
function mutate(fn) {
  if (restoring) {
    notice("Bitte die Wiederherstellung abwarten.");
    return false;
  }
  try {
    store = fn(store);
    persist();
    render();
    return true;
  } catch (error) {
    notice(error.message);
    errorCenter.report({
      scope: "action",
      title: "Aktion fehlgeschlagen",
      detail: error.message,
    });
    return false;
  }
}
function closeSidebar() {
  el("sidebar").inert = matchMedia("(max-width:850px)").matches;
  el("sidebar").classList.remove("open");
  el("mobile-cover").hidden = true;
  el("nav-toggle").setAttribute("aria-expanded", "false");
  document.querySelector("main").inert = false;
}
function renderList() {
  const list = el("chat-list");
  list.replaceChildren();
  el("chat-count").textContent = String(store.chats.length);
  // Rebuild from text nodes; never interpret imported chat titles as markup.
  const chatFilter = el("chat-filter-chat");
  const selected = chatFilter.value;
  chatFilter.replaceChildren(new Option("Alle Gespräche", ""));
  for (const chat of store.chats) chatFilter.add(new Option(chat.title, chat.id));
  chatFilter.value = store.chats.some(chat => chat.id === selected) ? selected : "";
  const results = filterChats(store, el("search").value, {
    chatId: chatFilter.value,
    from: el("chat-filter-from").value,
    to: el("chat-filter-to").value,
    project: el("chat-filter-project").value,
    role: el("chat-filter-role").value,
  });
  el("chat-filter-summary").textContent = `${results.length} von ${store.chats.length} Gesprächen`;
  if (!results.length) {
    const empty = document.createElement("p");
    empty.className = "empty-list";
    empty.textContent = store.chats.length
      ? "Keine Treffer."
      : "Noch keine Gespräche.";
    list.append(empty);
  }
  for (const chat of results) {
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "chat-link" + (chat.id === store.activeChatId ? " active" : "");
    button.setAttribute(
      "aria-current",
      chat.id === store.activeChatId ? "page" : "false",
    );
    const name = document.createElement("strong");
    name.textContent = chat.title;
    const count = document.createElement("small");
    count.textContent = chat.messages.length + " Nachrichten";
    button.append(name, count);
    button.addEventListener("click", () => {
      store.activeChatId = chat.id;
      persist();
      render();
      closeSidebar();
      el("chat-heading").tabIndex = -1;
      el("chat-heading").focus({ preventScroll: true });
    });
    list.append(button);
  }
}
const MESSAGE_PAGE_SIZE = 80;
let messageWindowChat = null;
let messageWindowLength = 0;
let messageWindowMessages = null;
let messageWindowEnd = 0;
function renderMessages() {
  const chat = active(),
    list = el("messages");
  const all = chat?.messages || [];
  if (chat?.id !== messageWindowChat || all !== messageWindowMessages || all.length > messageWindowLength)
    messageWindowEnd = all.length;
  messageWindowChat = chat?.id || null;
  messageWindowMessages = all;
  messageWindowLength = all.length;
  const page = messagePage(all, messageWindowEnd, MESSAGE_PAGE_SIZE);
  messageWindowEnd = page.end;
  list.replaceChildren();
  const pagination = (text, end, direction) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "message-page-button";
    button.dataset.page = direction;
    button.textContent = text;
    button.addEventListener("click", () => {
      messageWindowEnd = end;
      renderMessages();
      // The clicked button was replaced; return keyboard focus to the same paging action.
      const successor = list.querySelector(`[data-page="${direction}"]`) || list.querySelector('.message-page-button');
      if (!successor) list.tabIndex = -1;
      (successor || list).focus();
    });
    return button;
  };
  if (page.hasOlder)
    list.append(pagination("Ältere Nachrichten anzeigen", page.start, "older"));
  el("welcome").hidden = Boolean(chat?.messages.length);
  el("top-title").textContent = chat?.title || "Neuer Chat";
  el("chat-heading").textContent = chat?.title || "CryoGPTChat.";
  el("chat-subtitle").textContent = chat?.messages.length
    ? "Gesprächsverlauf – nur in deinem Browserprofil gespeichert."
    : "Dein Arbeitsbereich für Ideen, Code und Gespräche – ohne Cloud-Zwang.";
  el("rename-chat").disabled = !chat || (sending && chat?.id === busyChatId);
  el("delete-chat").disabled = !chat || (sending && chat?.id === busyChatId);
  for (const msg of page.items) {
    const row = document.createElement("article");
    row.className = "message " + msg.role;
    row.dataset.messageId = msg.id;
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = msg.role === "user" ? "DU" : "AI";
    const body = document.createElement("div");
    const meta = document.createElement("small");
    meta.textContent =
      (msg.role === "user" ? "DU" : "KI-MODELL") +
      " · " +
      new Date(msg.createdAt).toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      });
    const pre = document.createElement("pre");
    pre.textContent = msg.content; // Never treat user/model content as HTML.
    const copy = document.createElement("button");
    copy.className = "copy-message";
    copy.type = "button";
    copy.textContent = "Kopieren";
    copy.setAttribute("aria-label", "Nachricht kopieren");
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(msg.content);
        notice("Nachricht kopiert.");
      } catch {
        notice("Kopieren nicht verfügbar. Text bitte manuell auswählen.");
      }
    });
    body.append(meta, pre, copy);
    row.append(avatar, body);
    list.append(row);
  }
  if (page.hasNewer)
    list.append(pagination("Neuere Nachrichten anzeigen", Math.min(all.length, page.end + MESSAGE_PAGE_SIZE), "newer"));
  if (sending && chat?.id === busyChatId && !page.hasNewer) {
    const typing = document.createElement("p");
    typing.className = "typing";
    typing.id = "streaming-reply";
    typing.setAttribute("aria-live", "off");
    typing.textContent = streamedText || "KI-Modell antwortet …";
    list.append(typing);
  }
  list.scrollTop = list.scrollHeight;
  document.dispatchEvent(new Event("workspace:messages"));
}
document.addEventListener("workspace:reveal-message", event => {
  const messages = active()?.messages || [];
  const index = messages.findIndex(message => message.id === event.detail);
  if (index === -1) return;
  const nextEnd = Math.min(messages.length, Math.max(MESSAGE_PAGE_SIZE, index + 40));
  if (nextEnd !== messageWindowEnd) {
    messageWindowEnd = nextEnd;
    renderMessages();
  }
});
function renderProjectPanel() {
  const chat = active();
  const button = el("notes-toggle");
  button.disabled = !chat || (sending && chat.id === busyChatId);
  el("project-context").disabled = !chat || (sending && chat.id === busyChatId);
  el("project-share").disabled = !chat || (sending && chat.id === busyChatId);
  el("save-project-notes").disabled =
    !chat || (sending && chat.id === busyChatId);
  el("project-context").value = chat?.projectContext || "";
  el("project-share").checked = Boolean(chat?.shareProjectContext);
  el("project-notes-status").textContent = chat
    ? chat.shareProjectContext
      ? "Diese Notizen werden bei der nächsten Modellanfrage mitgesendet."
      : "Privat gespeichert – noch nicht an ein Modell freigegeben."
    : "Erstelle zuerst einen Chat.";
}
function render() {
  renderList();
  renderMessages();
  renderProjectPanel();
  document.dispatchEvent(
    new CustomEvent("workspace:chat", { detail: store.chats.map((c) => c.id) }),
  );
}

async function refreshModels() {
  if (sending || restoring) return;
  const request = ++modelRefreshSerial;
  el("status").textContent = "Prüfe Modellanbieter …";
  try {
    const res = await fetch("/api/status");
    if (!res.ok) throw new Error("Server nicht erreichbar");
    const data = await res.json();
    if (request !== modelRefreshSerial || restoring) return;
    errorCenter.resolve("models");
    if (typeof data.version === "string")
      el("app-version").textContent =
        (data.version.includes("-rc.")
          ? "RC "
          : data.version.startsWith("0.")
            ? "ALPHA "
            : "VERSION ") + data.version;
    const local = data.online && Array.isArray(data.models) ? data.models : [];
    const cloud =
      data.providers?.openai?.enabled &&
      Array.isArray(data.providers?.openai?.models)
        ? data.providers.openai.models
        : [];
    models = [...local, ...cloud.map((name) => "openai:" + name)];
    el("status").textContent = models.length
      ? "" + local.length + " lokal · " + cloud.length + " Cloud"
      : "Nur lokale Notizen";
  } catch {
    if (request !== modelRefreshSerial || restoring) return;
    models = [];
    el("status").textContent = "Keine KI-Verbindung";
    errorCenter.report({
      scope: "models",
      title: "Modellverbindung fehlgeschlagen",
      detail: "Der lokale Status-Endpunkt antwortet nicht. Notizen bleiben verfügbar.",
      retryLabel: "Verbindung erneut prüfen",
      retry: () => refreshModels(),
    });
  }
  const picker = el("model");
  picker.replaceChildren();
  const offline = document.createElement("option");
  offline.value = "";
  offline.textContent = "Nur lokal speichern";
  picker.append(offline);
  for (const name of models) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name.startsWith("openai:")
      ? "OpenAI / " + name.slice(7) + " (API-Kosten möglich)"
      : "Ollama / " + name;
    picker.append(option);
  }
  // Never switch automatically from explicit note-only mode to a paid or local model.
  picker.value = models.includes(store.settings.model)
    ? store.settings.model
    : "";
  updateModelNotice(picker.value);
  store.settings.model = picker.value;
  persist();
}

function updateModelNotice(model) {
  const cloud = model.startsWith("openai:");
  el("cloud-warning").hidden = !cloud;
  el("model-state").textContent = !model
    ? "Notizmodus · Modell manuell auswählen"
    : cloud
      ? "Cloud: " + model.slice(7) + " · Bestätigung vor jeder Anfrage"
      : "Lokal: " + model;
}

let godotConfigured = false,
  godotBusy = false,
  canCreateScenes = false,
  sceneTicket = null,
  sceneExpiry = 0;
function clearScenePreview() {
  sceneTicket = null;
  sceneExpiry = 0;
  el("scene-create").disabled = true;
}
function setGodotControls() {
  el("godot-version").disabled = !godotConfigured || godotBusy;
  el("godot-project").disabled = !godotConfigured || godotBusy;
  el("scene-preview").disabled =
    !godotConfigured || !canCreateScenes || godotBusy;
  el("scene-create").disabled =
    !godotConfigured ||
    !canCreateScenes ||
    godotBusy ||
    !sceneTicket ||
    Date.now() >= sceneExpiry;
}
async function checkGodotStatus() {
  try {
    const res = await fetch("/api/godot/status", { cache: "no-store" });
    if (!res.ok) throw new Error("Godot-Status nicht abrufbar.");
    const data = await res.json();
    godotConfigured = data.configured === true;
    canCreateScenes = godotConfigured && data.canCreateScenes === true;
    el("godot-status").textContent = godotConfigured
      ? "Optionales Godot MCP eingerichtet. Keine Abfrage läuft."
      : "Nicht eingerichtet. Anleitung: docs/integrations/godot-mcp.md";
  } catch {
    godotConfigured = false;
    canCreateScenes = false;
    el("godot-status").textContent = "Godot MCP ist aktuell nicht erreichbar.";
  }
  setGodotControls();
}
el("godot-toggle").addEventListener("click", async () => {
  const panel = el("godot-panel");
  panel.hidden = !panel.hidden;
  el("godot-toggle").setAttribute("aria-expanded", String(!panel.hidden));
  if (!panel.hidden) await checkGodotStatus();
});
async function inspectGodot(tool) {
  if (!godotConfigured || godotBusy) return;
  const title =
    tool === "get_godot_version"
      ? "Godot-Version prüfen"
      : "Godot-Projektinformationen auslesen";
  if (
    !(await confirmAction(
      title +
        "? Dazu wird der lokal konfigurierte Godot-MCP-Prozess einmalig gestartet.",
    ))
  )
    return;
  godotBusy = true;
  setGodotControls();
  el("godot-status").textContent = "Lokale Abfrage läuft …";
  el("godot-output").textContent = "Godot MCP wird geprüft …";
  try {
    const res = await fetch("/api/godot/inspect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Godot-Abfrage fehlgeschlagen.");
    el("godot-output").textContent = String(
      data.output || "Keine Informationen verfügbar.",
    );
    el("godot-status").textContent =
      "Abfrage abgeschlossen. Ergebnis wurde nur angezeigt, nicht automatisch gespeichert oder an KI gesendet.";
  } catch (error) {
    el("godot-output").textContent = "Fehler: " + error.message;
    el("godot-status").textContent = "Abfrage fehlgeschlagen.";
  } finally {
    godotBusy = false;
    setGodotControls();
  }
}
for (const id of ["scene-name", "scene-root"]) {
  el(id).addEventListener("input", () => {
    clearScenePreview();
    el("scene-summary").textContent =
      "Eingabe geändert. Bitte neue Vorschau erstellen.";
  });
}
el("scene-preview").addEventListener("click", async () => {
  if (!godotConfigured || !canCreateScenes || godotBusy) return;
  clearScenePreview();
  godotBusy = true;
  setGodotControls();
  try {
    const response = await fetch("/api/godot/scene/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sceneName: el("scene-name").value.trim(),
        rootNodeType: el("scene-root").value,
      }),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Szenenvorschau fehlgeschlagen.");
    sceneTicket = data.ticket;
    sceneExpiry = data.expiresAt;
    el("scene-summary").textContent =
      data.summary +
      "\n\n2 Minuten gültig. Erst „Geprüfte Szene erstellen“ schreibt eine Datei.";
  } catch (error) {
    el("scene-summary").textContent = "Fehler: " + error.message;
  } finally {
    godotBusy = false;
    setGodotControls();
  }
});
el("scene-create").addEventListener("click", async () => {
  if (!sceneTicket || !canCreateScenes || godotBusy) return;
  if (Date.now() >= sceneExpiry) {
    clearScenePreview();
    setGodotControls();
    el("scene-summary").textContent =
      "Die Vorschau ist abgelaufen. Bitte erneut prüfen.";
    return;
  }
  const approval = await requestText(
    "Du erstellst eine NEUE Godot-Szenendatei im festgelegten Testprojekt. Bitte ERSTELLEN eingeben:",
    "",
  );
  if (approval !== "ERSTELLEN") return;
  const ticket = sceneTicket;
  clearScenePreview();
  godotBusy = true;
  setGodotControls();
  try {
    const response = await fetch("/api/godot/scene/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket }),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Szenenerstellung fehlgeschlagen.");
    el("scene-summary").textContent =
      "Erstellt: " +
      data.scenePath +
      "\nWurzelknoten: " +
      data.rootNodeType +
      "\n" +
      (data.output || "");
  } catch (error) {
    el("scene-summary").textContent = "Fehler: " + error.message;
  } finally {
    godotBusy = false;
    setGodotControls();
  }
});
el("godot-version").addEventListener("click", () =>
  inspectGodot("get_godot_version"),
);
el("godot-project").addEventListener("click", () =>
  inspectGodot("get_project_info"),
);

el("notes-toggle").addEventListener("click", () => {
  if (!active()) {
    notice("Bitte zuerst einen Chat erstellen.");
    return;
  }
  const panel = el("project-panel");
  panel.hidden = !panel.hidden;
  el("notes-toggle").setAttribute("aria-expanded", String(!panel.hidden));
});
el("save-project-notes").addEventListener("click", () => {
  const chat = active();
  if (!chat) return;
  const saved = mutate((state) =>
    setProjectContext(
      state,
      chat.id,
      el("project-context").value,
      el("project-share").checked,
    ),
  );
  if (saved)
    notice(
      "Projektwissen gespeichert." +
        (active()?.shareProjectContext
          ? " Beim nächsten Modellaufruf wird es einbezogen."
          : " Es bleibt lokal privat."),
    );
});
el("new-chat").addEventListener("click", () => {
  mutate((s) => createChat(s));
  closeSidebar();
  el("prompt").focus();
});
el("search").addEventListener("input", renderList);
for (const id of ["chat-filter-chat", "chat-filter-from", "chat-filter-to", "chat-filter-role", "chat-filter-project"]) {
  el(id).addEventListener("input", renderList);
  el(id).addEventListener("change", renderList);
}
el("chat-filter-reset").addEventListener("click", () => {
  for (const id of ["chat-filter-chat", "chat-filter-from", "chat-filter-to", "chat-filter-role", "chat-filter-project"])
    el(id).value = "";
  el("search").value = "";
  renderList();
  el("search").focus();
});
el("refresh").addEventListener("click", refreshModels);
el("model").addEventListener("change", (e) => {
  store.settings.model = e.target.value;
  updateModelNotice(store.settings.model);
  persist();
});
el("rename-chat").addEventListener("click", async () => {
  const chat = active();
  if (!chat) return;
  const title = await requestText("Neuer Chat-Titel:", chat.title);
  if (title !== null) mutate((s) => renameChat(s, chat.id, title));
});
el("delete-chat").addEventListener("click", async () => {
  const chat = active();
  if (
    chat &&
    (await confirmAction("Chat „" + chat.title + "“ wirklich löschen?"))
  )
    mutate((s) => deleteChat(s, chat.id));
});
el("nav-toggle").addEventListener("click", () => {
  el("sidebar").classList.add("open");
  el("mobile-cover").hidden = false;
});
el("mobile-cover").addEventListener("click", closeSidebar);
document.querySelectorAll("[data-prompt]").forEach((button) =>
  button.addEventListener("click", () => {
    el("prompt").value = button.dataset.prompt;
    el("prompt").focus();
  }),
);
document.addEventListener("keydown", (e) => {
  if (document.querySelector("dialog[open]")) return;
  if (e.altKey && e.key.toLowerCase() === "n") {
    e.preventDefault();
    el("new-chat").click();
  }
});
el("prompt").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    el("composer").requestSubmit();
  }
});

function setGenerating(value) {
  const focused = document.activeElement?.id;
  el("messages").setAttribute("aria-busy", String(value));
  if (value)
    el("generation-status").textContent =
      "Antwort wird erstellt. Du kannst die Generierung mit Stoppen abbrechen.";
  el("send").hidden = value;
  el("stop").hidden = !value;
  el("model").disabled = value;
  el("refresh").disabled = value;
  if (value && focused === "send") el("stop").focus();
  if (!value && focused === "stop") el("prompt").focus();
}
el("stop").addEventListener("click", () => {
  if (streamController && !streamController.signal.aborted)
    streamController.abort();
});
el("composer").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (sending || restoring || document.querySelector("#restore-dialog[open]"))
    return;
  const content = el("prompt").value.trim();
  if (!content) return;
  const model = el("model").value;
  if (
    model.startsWith("openai:") &&
    !(await confirmAction(
      "Cloud-Anfrage an OpenAI senden?\nBis zu 24 Chat-Nachrichten und freigegebenes Projektwissen werden übertragen. API-Kosten sind möglich.",
    ))
  )
    return;
  if (!active() && !mutate((s) => createChat(s))) return;
  const chatId = store.activeChatId;
  if (!mutate((s) => appendMessage(s, chatId, "user", content))) return;
  el("prompt").value = "";
  if (!model) {
    notice("Als lokale Notiz gespeichert. Wähle ein Modell für KI-Antworten.");
    return;
  }
  sending = true;
  busyChatId = chatId;
  streamedText = "";
  streamController = new AbortController();
  const controller = streamController;
  setGenerating(true);
  render();
  try {
    const chat = store.chats.find((c) => c.id === chatId);
    const res = await fetch("/api/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ model, messages: toOllamaMessages(chat) }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(
        data.error || "Modellantwort fehlgeschlagen (HTTP " + res.status + ").",
      );
    }
    const reply = await consumeOllamaStream(res.body, {
      signal: controller.signal,
      onToken: (text) => {
        streamedText = text;
        const preview = el("streaming-reply");
        if (preview) {
          preview.textContent = text;
          el("messages").scrollTop = el("messages").scrollHeight;
        }
      },
    });
    el("generation-status").textContent = reply.trim()
      ? "Antwort abgeschlossen. " + reply.slice(0, 250)
      : "Das Modell hat eine leere Antwort gesendet.";
    if (reply.trim())
      mutate((s) => appendMessage(s, chatId, "assistant", reply));
    else notice("Das Modell hat eine leere Antwort gesendet.");
  } catch (error) {
    el("generation-status").textContent = controller.signal.aborted
      ? "Antwort gestoppt. Bereits empfangener Text bleibt erhalten."
      : "Antwort konnte nicht abgeschlossen werden.";
    if (controller.signal.aborted) {
      if (streamedText.trim()) {
        mutate((s) =>
          appendMessage(
            s,
            chatId,
            "assistant",
            streamedText.trim().slice(0, 11960) + "\n\n[Antwort abgebrochen]",
          ),
        );
      }
      notice(
        "KI-Generierung gestoppt. Bereits empfangener Text bleibt erhalten.",
      );
    } else {
      if (streamedText.trim()) {
        mutate((s) =>
          appendMessage(
            s,
            chatId,
            "assistant",
            streamedText.trim().slice(0, 11960) + "\n\n[Antwort unvollständig]",
          ),
        );
      }
      notice("KI-Anfrage unterbrochen: " + error.message);
      errorCenter.report({
        scope: "chat",
        title: "KI-Antwort unterbrochen",
        detail: "Eventuell empfangener Text wurde erhalten. Erneutes Senden erfolgt ausschließlich manuell und kann Kosten verursachen.",
        retryLabel: "Modellverbindung prüfen",
        retry: () => refreshModels(),
      });
    }
  } finally {
    sending = false;
    busyChatId = null;
    streamController = null;
    streamedText = "";
    setGenerating(false);
    render();
  }
});

el("export").addEventListener("click", () => {
  const data = new Blob([JSON.stringify(store, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(data),
    link = document.createElement("a");
  link.href = url;
  link.download =
    "cryogptchat-backup-" + new Date().toISOString().slice(0, 10) + ".json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

render();
setupIntegrations({ el, active, mutate, notice });
setupAgent({ el, active, notice });
setupHyperfocus({ el, active, notice });
setupAgentFlow({ el, active, notice });
setupWorkspace({ el, notice, refreshModels, active });
refineInterface({ el, active });
setupAccessibility({ el, notice });
setupWorkbench({ el, active, getStore: () => store, notice });
setupBackupRestore({
  el,
  getStore: () => store,
  getPersistence: () => persistence,
  isGenerating: () => sending,
  closeSidebar,
  notice,
  apply: async (backup, undo) => {
    if (sending || restoring)
      throw new Error("Eine Antwort oder Wiederherstellung läuft bereits.");
    if (!persistence) throw new Error("Lokales Speichern ist gesperrt.");
    restoring = true;
    ++modelRefreshSerial;
    let committed = false;
    try {
      const previous = store;
      const restored = await persistence.restoreBackup(backup, previous, undo);
      store = restored;
      committed = true;
      document.dispatchEvent(
        new CustomEvent("workspace:recovery", {
          detail: undo ? [] : previous.chats.map((chat) => chat.id),
        }),
      );
      document.dispatchEvent(new Event("workspace:restore"));
      render();
    } finally {
      restoring = false;
      if (committed) await refreshModels();
    }
  },
});
document.addEventListener("workspace:view", (e) => {
  if (e.detail === "godot") checkGodotStatus();
});
if (location.hash === "#godot") checkGodotStatus();
refreshModels();
if (storageWarnings.length)
  queueMicrotask(() => notice(storageWarnings.join(" ")));
