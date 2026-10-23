import { icon } from "./icons.js";

// Shell enhancements consume existing app state and actions; no provider calls.
export function setupWorkbench({ el, active, getStore, notice }) {
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const button = (label, key, handler) => {
    const node = make("button", "workbench-button");
    node.type = "button";
    node.setAttribute("aria-label", label);
    node.append(icon(key), make("span", "", label));
    node.addEventListener("click", handler);
    return node;
  };
  const route = (view) => {
    // Use the router even when a command selects the current view.
    document.querySelector(`.workspace-nav a[data-view="${view}"]`).click();
  };
  document.querySelector(".brand strong").innerHTML = "CRYO<span>.</span>";
  document.querySelector(".brand small").textContent = "PERSONAL AI WORKSPACE";
  el("search").placeholder = "Gespräche suchen …";
  const newChat = el("new-chat");
  newChat.replaceChildren(
    icon("plus"),
    make("span", "", "Neuer Chat"),
    make("kbd", "", "Alt N"),
  );
  const nav = document.querySelector(".workspace-nav");
  for (const [key, label] of [
    ["agents", "WERKZEUGE"],
    ["roadmap", "WORKSPACE"],
  ]) {
    nav
      .querySelector(`[data-view="${key}"]`)
      .before(make("div", "nav-caption", label));
  }
  nav.querySelector(".nav-caption").textContent = "DENKEN & ENTWICKELN";
  // Put the primary creation action before destinations, with history below.
  nav.before(newChat);

  const welcome = el("welcome");
  const copy = make("div", "launch-copy");
  const orb = welcome.querySelector(".hero-orb");
  orb.setAttribute("aria-hidden", "true");
  copy.append(
    welcome.querySelector(".session-badge"),
    orb,
    welcome.querySelector(":scope > .eyebrow"),
    welcome.querySelector("h2"),
    welcome.querySelector(":scope > p"),
  );
  copy.querySelector(".session-badge").textContent = "DEIN RAUM. DEIN TEMPO.";
  copy.querySelector("h2").innerHTML =
    "Große Ideen.<br><em>Dein nächster Schritt.</em>";
  copy.querySelector("p").textContent =
    "Denken, entwickeln, weiterkommen. Starte mit einer Idee oder verbinde dein lokales Modell.";
  const hero = make("div", "launch-hero");
  const overview = make("aside", "session-overview");
  overview.setAttribute("aria-label", "Workspace-Übersicht");
  overview.innerHTML =
    '<div class="overview-heading"><span class="eyebrow">DEIN WORKSPACE</span><span class="local-dot">LOKAL</span></div><h3>Alles für den nächsten Schritt.</h3><dl class="workspace-metrics"><div><dt>Gespräche</dt><dd id="metric-chats">0</dd></div><div><dt>Nachrichten</dt><dd id="metric-messages">0</dd></div></dl><div class="overview-model"><span>Aktiver Modus</span><strong id="overview-model-name">Notizmodus</strong></div><div class="overview-links"><a href="#models">Modelle verbinden <span aria-hidden="true">↗</span></a><a href="#knowledge">Projektwissen öffnen <span aria-hidden="true">↗</span></a></div>';
  hero.append(copy, overview);
  overview
    .querySelectorAll(".overview-links a span")
    .forEach((node) => node.replaceChildren(icon("arrow")));
  const starters = make("div", "starter-heading");
  starters.append(
    make("h3", "", "Womit möchtest du starten?"),
    make("span", "", "Ein Klick bereitet deine Nachricht vor"),
  );
  welcome.prepend(hero);
  const prompts = welcome.querySelector(".prompt-grid");
  prompts.before(starters);
  prompts.querySelectorAll("button").forEach((node, i) => {
    node.prepend(make("span", "starter-number", "0" + (i + 1)));
  });

  const topActions = document.querySelector(".top-actions");
  const commandTrigger = button("Befehle", "search", () => openCommands());
  commandTrigger.id = "command-open";
  commandTrigger.setAttribute("aria-haspopup", "dialog");
  commandTrigger.setAttribute("aria-keyshortcuts", "Control+k Meta+k");
  commandTrigger.append(make("kbd", "", "Ctrl K"));
  topActions.prepend(commandTrigger);
  const focusToggle = button("Fokus", "focus", () => {
    focusEnabled = !focusEnabled;
    try {
      localStorage.setItem("cryo-focus-v1", String(focusEnabled));
    } catch {
      notice("Fokusmodus gilt nur für diese Sitzung.");
    }
    updateFocus();
  });
  focusToggle.id = "workspace-focus";
  focusToggle.title = "Seitenleiste im Chat ausblenden";
  topActions.append(focusToggle);
  let focusEnabled = false;
  try {
    focusEnabled = localStorage.getItem("cryo-focus-v1") === "true";
  } catch {}
  function updateFocus() {
    const inChat =
      nav.querySelector('[aria-current="page"]')?.dataset.view === "chat";
    const enabled = focusEnabled && inChat && innerWidth > 850;
    document.body.classList.toggle("workspace-focused", enabled);
    focusToggle.setAttribute("aria-pressed", String(enabled));
    focusToggle.querySelector("span").textContent = enabled
      ? "Fokus beenden"
      : "Fokus";
    focusToggle.setAttribute("aria-label", enabled ? "Fokus beenden" : "Fokus");
    focusToggle.hidden = innerWidth <= 850 || !inChat;
    el("sidebar").inert =
      enabled ||
      (innerWidth <= 850 && !el("sidebar").classList.contains("open"));
  }

  // Native dialog: focus trap, Escape and restoration; all command text is plain.
  const dialog = make("dialog", "command-dialog");
  dialog.id = "command-dialog";
  dialog.setAttribute("aria-labelledby", "command-title");
  dialog.innerHTML =
    '<div class="command-heading"><h2 id="command-title">Wohin soll es gehen?</h2><button type="button" id="command-close" aria-label="Befehlssuche schließen">Esc</button></div><label class="sr-only" for="command-search">Befehle suchen</label><input type="search" id="command-search" placeholder="Ansicht oder Aktion suchen …" autocomplete="off" aria-describedby="command-help"><p id="command-help">Ansichten öffnen und lokale Aktionen starten. Pfeiltasten zum Navigieren.</p><div id="command-results" class="command-results" aria-label="Gefundene Befehle"></div><p id="command-count" class="sr-only" role="status"></p>';
  document.body.append(dialog);
  let previousFocus, pendingCommand;
  const commands = [...nav.querySelectorAll("a[data-view]")].map((a) => ({
    title: a.textContent,
    description: "Ansicht öffnen",
    key: a.dataset.view,
    run: () => route(a.dataset.view),
  }));
  commands.unshift({
    title: "Neuer Chat",
    description: "Alt + N · Unterhaltung erstellen",
    key: "plus",
    run: () => newChat.click(),
  });
  commands.push(
    {
      title: "Backup exportieren",
      description: "Alle Gespräche als JSON sichern",
      key: "download",
      run: () => el("export").click(),
    },
    {
      title: "Backup importieren",
      description: "Wiederherstellung mit Vorschau öffnen",
      key: "upload",
      run: () => el("import").click(),
    },
    {
      title: "Nachricht schreiben",
      description: "Zum Eingabefeld wechseln",
      key: "rename",
      run: () => {
        route("chat");
        requestAnimationFrame(() => el("prompt").focus());
      },
    },
  );
  function renderCommands() {
    const term = el("command-search").value.trim().toLocaleLowerCase("de");
    const results = el("command-results");
    results.replaceChildren();
    const matching = commands.filter((c) =>
      (c.title + " " + c.description).toLocaleLowerCase("de").includes(term),
    );
    for (const command of matching) {
      const item = button(command.title, command.key, () => {
        pendingCommand = command.run;
        dialog.close();
      });
      const text = item.querySelector("span");
      text.append(make("small", "", command.description));
      item.append(make("span", "command-enter", "↵"));
      results.append(item);
    }
    if (!matching.length)
      results.append(
        make(
          "p",
          "command-empty",
          "Keine passenden Befehle. Versuche „Chat“, „Modelle“ oder „Backup“.",
        ),
      );
    el("command-count").textContent = `${matching.length} Befehle gefunden`;
  }
  function openCommands() {
    if (document.querySelector("dialog[open]")) return;
    previousFocus = document.activeElement;
    el("command-search").value = "";
    renderCommands();
    dialog.showModal();
    el("command-search").focus();
  }
  el("command-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    if (previousFocus?.isConnected && previousFocus.getClientRects().length)
      previousFocus.focus();
    const run = pendingCommand;
    pendingCommand = null;
    run?.();
  });
  el("command-search").addEventListener("input", renderCommands);
  dialog.addEventListener("keydown", (event) => {
    const items = [...el("command-results").querySelectorAll("button")];
    if (["ArrowDown", "ArrowUp"].includes(event.key) && items.length) {
      event.preventDefault();
      const i = items.indexOf(document.activeElement);
      const next =
        i < 0
          ? event.key === "ArrowDown"
            ? 0
            : items.length - 1
          : (i + (event.key === "ArrowDown" ? 1 : -1) + items.length) %
            items.length;
      items[next].focus();
    }
    if (
      event.key === "Enter" &&
      document.activeElement === el("command-search")
    ) {
      event.preventDefault();
      items[0]?.click();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "k" &&
      !event.isComposing
    ) {
      if (document.querySelector("dialog[open]")) return;
      event.preventDefault();
      openCommands();
    }
  });

  const findToggle = button("Im Chat suchen", "search", () => {
    const opening = el("conversation-search").hidden;
    el("conversation-search").hidden = !opening;
    findToggle.setAttribute("aria-expanded", String(opening));
    if (opening) el("conversation-query").focus();
    else clearSearch();
  });
  findToggle.id = "conversation-find";
  findToggle.setAttribute("aria-expanded", "false");
  findToggle.setAttribute("aria-controls", "conversation-search");
  document.querySelector(".chat-tools").append(findToggle);
  const search = make("section", "conversation-search");
  search.id = "conversation-search";
  search.hidden = true;
  search.setAttribute("aria-label", "Im Gespräch suchen");
  search.innerHTML =
    '<label class="sr-only" for="conversation-query">Suchtext im Gespräch</label><input id="conversation-query" type="search" placeholder="Nachricht finden …" maxlength="200"><span id="conversation-matches" role="status">Suchbegriff eingeben</span><button type="button" id="conversation-previous" aria-label="Vorheriger Treffer">↑</button><button type="button" id="conversation-next" aria-label="Nächster Treffer">↓</button><button type="button" id="conversation-close" aria-label="Gesprächssuche schließen">×</button>';
  el("messages").before(search);
  let hits = [],
    hitIndex = 0,
    searchChat = active()?.id;
  function clearSearch() {
    el("conversation-query").value = "";
    updateSearch();
  }
  function updateSearch(reveal = false) {
    const term = el("conversation-query").value.trim().toLocaleLowerCase("de");
    const rows = [...el("messages").querySelectorAll(".message")];
    rows.forEach((row) => row.classList.remove("search-hit", "search-current"));
    hits = term
      ? rows.filter((row) =>
          row
            .querySelector("pre")
            .textContent.toLocaleLowerCase("de")
            .includes(term),
        )
      : [];
    hitIndex = Math.min(hitIndex, Math.max(0, hits.length - 1));
    hits.forEach((row, i) =>
      row.classList.add(i === hitIndex ? "search-current" : "search-hit"),
    );
    el("conversation-matches").textContent = !term
      ? "Suchbegriff eingeben"
      : hits.length
        ? `${hitIndex + 1} / ${hits.length} Nachrichten`
        : "Keine Treffer";
    el("conversation-previous").disabled = el("conversation-next").disabled =
      !hits.length;
    if (reveal && hits.length)
      hits[hitIndex].scrollIntoView({ block: "center" });
  }
  el("conversation-query").addEventListener("input", () => {
    hitIndex = 0;
    updateSearch(true);
  });
  for (const [id, increment] of [
    ["conversation-next", 1],
    ["conversation-previous", -1],
  ]) {
    el(id).addEventListener("click", () => {
      if (!hits.length) return;
      hitIndex = (hitIndex + increment + hits.length) % hits.length;
      updateSearch(true);
    });
  }
  el("conversation-close").addEventListener("click", () => {
    findToggle.click();
    findToggle.focus();
  });
  search.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      el("conversation-close").click();
    }
    if (event.key === "Enter") {
      event.preventDefault();
      el(
        event.shiftKey ? "conversation-previous" : "conversation-next",
      ).click();
    }
  });

  const composerMeta = make("div", "composer-meta");
  composerMeta.innerHTML =
    '<span class="composer-local">Deine nächste Idee</span><span id="prompt-count">0 / 12.000</span>';
  el("prompt").before(composerMeta);
  function updatePrompt() {
    el("prompt-count").textContent =
      `${el("prompt").value.length.toLocaleString("de-DE")} / 12.000`;
  }
  el("prompt").addEventListener("input", updatePrompt);
  el("prompt").addEventListener("focus", updatePrompt);
  el("composer").addEventListener("submit", () => queueMicrotask(updatePrompt));
  document
    .querySelectorAll("[data-prompt]")
    .forEach((node) => node.addEventListener("click", updatePrompt));

  function updateOverview() {
    const chats = getStore().chats;
    el("metric-chats").textContent = chats.length.toLocaleString("de-DE");
    el("metric-messages").textContent = chats
      .reduce((n, c) => n + c.messages.length, 0)
      .toLocaleString("de-DE");
    const selected = el("model").selectedOptions[0];
    el("overview-model-name").textContent = selected?.value
      ? selected.textContent
      : "Notizmodus";
    if (searchChat !== active()?.id) {
      searchChat = active()?.id;
      clearSearch();
      search.hidden = true;
      findToggle.setAttribute("aria-expanded", "false");
    }
    findToggle.disabled = !active()?.messages.length;
    updateSearch();
    updatePrompt();
    updateFocus();
  }
  el("model").addEventListener("change", updateOverview);
  new MutationObserver(updateOverview).observe(el("model"), {
    childList: true,
  });
  document.addEventListener("workspace:chat", updateOverview);
  document.addEventListener("workspace:view", updateFocus);
  window.addEventListener("resize", updateFocus);
  updateOverview();
}
