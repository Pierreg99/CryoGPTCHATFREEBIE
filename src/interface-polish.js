// Presentation only: existing controls, handlers and permission boundaries stay in place.
import { icon } from "./icons.js";
function emptyState(key, title, description, action, onClick) {
  const section = document.createElement("div");
  section.className = "empty-state";
  const mark = document.createElement("div");
  mark.className = "empty-mark";
  mark.append(icon(key));
  const heading = document.createElement("h2");
  heading.textContent = title;
  const text = document.createElement("p");
  text.textContent = description;
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = action;
  button.addEventListener("click", onClick);
  section.append(mark, heading, text, button);
  return section;
}
export function refineInterface({ el, active }) {
  for (const [id, key, label, iconOnly = false] of [
    ["nav-toggle", "menu", "Navigation öffnen", true],
    ["refresh", "refresh", "Modelle aktualisieren", true],
    ["rename-chat", "rename", "Umbenennen"],
    ["notes-toggle", "knowledge", "Projektwissen"],
    ["godot-toggle", "godot", "Godot MCP"],
    ["focus-toggle", "focus", "Hyperfocus"],
    ["export", "download", "Export"],
    ["import", "upload", "Import"],
    ["stop", "stop", "Stoppen"],
    ["focus-stop", "stop", "Stoppen"],
    ["send", "send", "Senden"],
  ]) {
    const button = el(id);
    button.replaceChildren(icon(key));
    button.classList.add("icon-control");
    if (iconOnly) button.setAttribute("aria-label", label);
    else button.append(document.createTextNode(label));
  }
  const navLabel = document.createElement("div");
  navLabel.className = "nav-caption";
  navLabel.textContent = "DEIN WORKSPACE";
  document.querySelector(".workspace-nav").prepend(navLabel);
  document.querySelectorAll(".prompt-grid button").forEach((button, i) => {
    [...button.childNodes]
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .forEach((n) => n.remove());
    button.prepend(icon(["agents", "skills", "godot", "focus"][i]));
  });
  const welcomeTitle = document.querySelector(".welcome h2");
  welcomeTitle.setAttribute("role", "heading");
  const context = document.createElement("div");
  context.className = "context-strip";
  const contextLabel = document.createElement("div");
  contextLabel.innerHTML =
    '<span class="eyebrow">AKTIVER KONTEXT</span><strong></strong>';
  const contextAction = document.createElement("button");
  contextAction.type = "button";
  context.append(icon("knowledge"), contextLabel, contextAction);
  document.querySelector(".view-header").after(context);
  function startChatHere() {
    const route = location.hash;
    el("new-chat").click();
    location.hash = route;
  }
  contextAction.addEventListener("click", () => {
    if (active()) location.hash = "chat";
    else startChatHere();
  });
  const knowledge = el("project-panel"),
    editor = document.createElement("div");
  editor.className = "knowledge-editor";
  editor.append(...knowledge.childNodes);
  knowledge.append(editor);
  knowledge.classList.add("knowledge-layout");
  const intro = document.createElement("h2");
  intro.textContent = "Kontext für deinen nächsten Schritt";
  editor.querySelector(".eyebrow").after(intro);
  const meta = document.createElement("div");
  meta.className = "editor-meta";
  meta.innerHTML =
    '<span id="context-dirty">Lokal gespeichert</span><span id="context-count"></span>';
  el("project-context").after(meta);
  const guide = document.createElement("aside");
  guide.className = "context-guide";
  guide.setAttribute("aria-label", "So funktioniert Projektwissen");
  guide.innerHTML =
    '<div class="eyebrow">BEWUSST VERBINDEN</div><h3>Guter Kontext.<br>Bessere Antworten.</h3><ol><li><strong>Festhalten</strong><p>Ziele, Entscheidungen und Hintergrundwissen für diesen Chat sammeln.</p></li><li><strong>Freigeben</strong><p>Du entscheidest, ob deine Notizen mit der nächsten Modellanfrage gesendet werden.</p></li><li><strong>Weiterdenken</strong><p>GitHub-Referenzen kannst du nach Prüfung im Bereich Skills übernehmen.</p></li></ol><a href="#skills">GitHub & Skills öffnen</a>';
  knowledge.append(guide);
  const knowledgeEmpty = emptyState(
    "knowledge",
    "Gib deinen Ideen einen Kontext.",
    "Starte eine Unterhaltung, um Notizen und Projektwissen sicher diesem Chat zuzuordnen.",
    "Chat erstellen",
    startChatHere,
  );
  knowledge.prepend(knowledgeEmpty);
  function updateContext() {
    const chat = active(),
      view = location.hash.slice(1);
    document
      .querySelector(".chat-area")
      .classList.toggle("has-chat", Boolean(chat));
    welcomeTitle.setAttribute("aria-level", chat ? "2" : "1");
    context.hidden =
      !["knowledge", "focus", "agents", "skills"].includes(view) ||
      (!chat && view === "knowledge");
    contextLabel.querySelector("strong").textContent =
      chat?.title || "Noch keine Unterhaltung ausgewählt";
    contextAction.textContent = chat ? "Zum Chat" : "Unterhaltung starten";
    editor.hidden = !chat;
    knowledgeEmpty.hidden = Boolean(chat);
    updateEditor();
  }
  function updateEditor() {
    el("context-count").textContent =
      el("project-context").value.length + " / 4.000 Zeichen";
    const dirty =
      active() &&
      (el("project-context").value !== (active().projectContext || "") ||
        el("project-share").checked !== Boolean(active().shareProjectContext));
    el("context-dirty").textContent = dirty
      ? "Ungespeicherte Änderungen"
      : "Lokal gespeichert";
    el("context-dirty").dataset.dirty = String(Boolean(dirty));
  }
  el("project-context").addEventListener("input", updateEditor);
  el("project-share").addEventListener("change", updateEditor);
  document.addEventListener("workspace:chat", updateContext);
  document.addEventListener("workspace:view", updateContext);
  const fieldGrid = document.createElement("div");
  fieldGrid.className = "agent-field-grid";
  el("flow-repo").previousElementSibling.before(fieldGrid);
  for (const id of ["flow-repo", "flow-operation", "flow-input", "flow-ref"]) {
    const control = el(id),
      label = control.previousElementSibling,
      field = document.createElement("div");
    field.className = "field-group";
    field.append(label, control);
    fieldGrid.append(field);
  }
  const results = document.createElement("section");
  results.className = "agent-results";
  results.setAttribute("aria-label", "Ergebnisse der Agentenschritte");
  el("flow-status").before(results);
  results.append(el("flow-status"), el("flow-result"), el("flow-draft"));
  const legacy = document.querySelector("#agents-panel > .advanced-options");
  document.querySelector(".write-options").before(legacy);
  const sceneDisclosure = document.createElement("details");
  sceneDisclosure.className = "advanced-options godot-scene-disclosure";
  const sceneTitle = document.createElement("summary");
  sceneTitle.textContent = "Neue Szene erstellen · Vorschau und Freigabe";
  document.querySelector(".scene-builder").before(sceneDisclosure);
  sceneDisclosure.append(sceneTitle, document.querySelector(".scene-builder"));
  for (const [id, placeholder] of [
    ["godot-output", "Keine Abfrage gestartet."],
    ["scene-summary", "Keine Vorschau. Ziel: scenes/cryogptchat/"],
  ]) {
    const output = el(id);
    const update = () =>
      (output.hidden = output.textContent.trim() === placeholder);
    update();
    new MutationObserver(update).observe(output, { childList: true });
  }
  const steps = document.createElement("ol");
  steps.className = "process-steps";
  steps.setAttribute("aria-label", "Hyperfocus-Phasen");
  for (const text of ["Ziel definieren", "Plan freigeben", "Ergebnis prüfen"]) {
    const li = document.createElement("li");
    li.textContent = text;
    steps.append(li);
  }
  el("focus-goal").previousElementSibling.before(steps);
  function updatePhases() {
    const phase = !el("focus-draft").disabled
      ? 3
      : !el("focus-stop").hidden
        ? 2
        : !el("focus-run").disabled
          ? 1
          : 0;
    [...steps.children].forEach((li, i) => {
      li.dataset.state =
        i < phase ? "done" : i === phase ? "current" : "pending";
      if (i === phase) li.setAttribute("aria-current", "step");
      else li.removeAttribute("aria-current");
    });
  }
  const phaseObserver = new MutationObserver(updatePhases);
  for (const id of ["focus-draft", "focus-stop", "focus-run"])
    phaseObserver.observe(el(id), { attributes: true });
  updatePhases();
  const modelSearch = document.createElement("div");
  modelSearch.className = "model-toolbar";
  el("model-search").previousElementSibling.before(modelSearch);
  const searchField = document.createElement("div");
  searchField.className = "field-group";
  searchField.append(
    el("model-search").previousElementSibling,
    el("model-search"),
  );
  modelSearch.append(searchField, el("models-offline"));
  function refineModelEmpty() {
    const list = el("model-cards"),
      first = list.firstElementChild;
    if (!first || first.tagName !== "P") return;
    const hasModels = [...el("model").options].some((o) => o.value);
    const state = emptyState(
      "models",
      hasModels
        ? "Für diese Suche gibt es noch keinen Treffer."
        : "Dein nächstes Modell wartet.",
      first.textContent,
      hasModels ? "Suche zurücksetzen" : "Modelle aktualisieren",
      () => {
        if (hasModels) {
          el("model-search").value = "";
          el("model-search").dispatchEvent(new Event("input"));
        } else el("models-refresh").click();
      },
    );
    list.replaceChildren(state);
  }
  new MutationObserver(refineModelEmpty).observe(el("model-cards"), {
    childList: true,
  });
  refineModelEmpty();
  updateContext();
}
