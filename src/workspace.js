import { createRoadmapPanel } from "./roadmap-ui.js";
const titles = {
  chat: [
    "DEIN DENKRAUM",
    "Ideen beginnen hier.",
    "Lokal denken. Grenzenlos gestalten.",
  ],
  knowledge: [
    "KONTEXT & ENTSCHEIDUNGEN",
    "Projektwissen",
    "Dein Kontext. Bewusst geteilt.",
  ],
  focus: [
    "EIN ZIEL. KLARER KURS.",
    "Hyperfocus",
    "Vom Vorhaben zum nächsten machbaren Schritt.",
  ],
  agents: [
    "DU BEHÄLTST DIE KONTROLLE",
    "Agenten",
    "Prüfbare Schritte statt blinder Automatisierung.",
  ],
  skills: [
    "WISSEN VERBINDEN",
    "GitHub & Skills",
    "Referenzen entdecken, prüfen und gezielt übernehmen.",
  ],
  godot: [
    "DEIN SPIEL. DEINE WELT.",
    "Godot MCP",
    "Lokale Projekte untersuchen und Szenen bewusst erstellen.",
  ],
  roadmap: [
    "100 MEILENSTEINE. EIN KLARER KURS.",
    "Roadmap",
    "Von der lokalen Alpha zur langfristigen Produktvision.",
  ],
  models: [
    "DEINE MODELLE. DEINE WAHL.",
    "Modellzentrale",
    "Lokale Intelligenz und optionale Cloud klar getrennt.",
  ],
};
export function setupWorkspace({ el, notice, refreshModels, active }) {
  const nav = document.createElement("nav");
  nav.className = "workspace-nav";
  nav.setAttribute("aria-label", "Workspace");
  const icons = ["◈", "▤", "ϟ", "⌘", "⌗", "◇", "⌑", "◉"];
  Object.entries(titles).forEach(([key, [, title]], i) => {
    const link = document.createElement("a");
    link.href = "#" + key;
    link.dataset.view = key;
    const icon = document.createElement("span");
    icon.textContent = icons[i];
    icon.setAttribute("aria-hidden", "true");
    link.append(icon, key === "chat" ? "Chat" : title);
    nav.append(link);
  });
  el("new-chat").before(nav);
  const tools = document.createElement("div");
  tools.className = "tool-area";
  tools.hidden = true;
  tools.innerHTML =
    '<header class="view-header"><div class="eyebrow" id="view-eyebrow"></div><h1 id="view-title" tabindex="-1"></h1><p id="view-description"></p></header>';
  document.querySelector(".chat-area").after(tools);
  const panels = {
    knowledge: el("project-panel"),
    focus: el("focus-panel"),
    godot: el("godot-panel"),
    skills: document.querySelector(".integration-panel"),
    agents: document.querySelector(".agent-panel"),
  };
  Object.values(panels).forEach((panel) => {
    panel.hidden = true;
    tools.append(panel);
  });
  // Keep specialist forms discoverable without presenting every option at once.
  const legacy = document.createElement("details");
  legacy.className = "advanced-options";
  const legacyTitle = document.createElement("summary");
  legacyTitle.textContent = "Einzelaktion planen";
  legacy.append(legacyTitle);
  const agentIntro = panels.agents.querySelector("p");
  const legacyNodes = [...panels.agents.children].filter(
    (node) =>
      node !== panels.agents.querySelector(".eyebrow") &&
      node !== panels.agents.querySelector("h3") &&
      node !== agentIntro &&
      !node.classList.contains("agent-flow"),
  );
  legacyNodes.forEach((node) => legacy.append(node));
  panels.agents.insertBefore(
    legacy,
    panels.agents.querySelector(".agent-flow"),
  );
  agentIntro.textContent =
    "Baue einen nachvollziehbaren Ablauf. Jeder Zugriff bleibt sichtbar und braucht deine Freigabe.";
  const writes = panels.agents.querySelector(".write-form");
  if (writes) {
    const advanced = document.createElement("details");
    advanced.className = "advanced-options write-options";
    const summary = document.createElement("summary");
    summary.textContent = "Markdown-Ausgabe prüfen und freigeben";
    advanced.append(summary);
    writes.before(advanced);
    advanced.append(writes);
  }
  panels.skills.setAttribute("id", "skills-panel");
  panels.agents.setAttribute("id", "agents-panel");
  const modelPanel = document.createElement("section");
  modelPanel.className = "model-panel";
  modelPanel.id = "models-panel";
  modelPanel.setAttribute("aria-label", "Modelle");
  modelPanel.innerHTML =
    '<div class="section-heading"><h2>Verfügbare Modelle</h2><button type="button" id="models-refresh">↻ Aktualisieren</button></div><label for="model-search">Modell suchen</label><input id="model-search" type="search" placeholder="Name oder Anbieter …"><button id="models-offline" type="button">Nur lokal speichern / Notizmodus</button><p>Favoriten bleiben auf diesem Gerät. Die Auswahl startet keine Anfrage.</p><div class="model-grid" id="model-cards"></div>';
  panels.roadmap = createRoadmapPanel();
  tools.append(panels.roadmap);
  panels.models = modelPanel;
  tools.append(modelPanel);
  const noticeEl = el("notice");
  noticeEl.classList.add("workspace-notice");
  document.querySelector("main").append(noticeEl);
  const skip = document.createElement("a");
  skip.href = "#main-content";
  skip.className = "skip-link";
  skip.textContent = "Zum Inhalt";
  skip.addEventListener("click", (event) => {
    event.preventDefault();
    const main = document.querySelector("main");
    main.focus();
    main.scrollIntoView({ block: "start" });
  });
  document.body.prepend(skip);
  document.querySelector("main").id = "main-content";
  document.querySelector("main").tabIndex = -1;
  document.querySelector(".intro .eyebrow").textContent =
    "DEIN DENKRAUM / LOCAL FIRST";
  document.querySelector(".welcome .eyebrow").textContent =
    "IDEEN BRAUCHEN EINEN ANFANG";
  document.querySelector(".welcome h2").innerHTML =
    "Ein Gedanke.<br>Unendlich viele <em>Möglichkeiten.</em>";
  document.querySelector(".welcome > p").textContent =
    "Dein privater Raum für Code, kreative Durchbrüche und den nächsten großen Schritt. Womit legen wir los?";
  const badge = document.createElement("div");
  badge.className = "session-badge";
  badge.textContent = "◉ SYSTEM BEREIT · DEIN WORKSPACE";
  document.querySelector(".welcome").prepend(badge);
  let current = "";
  const navigate = () => {
    let key = location.hash.slice(1);
    if (!titles[key]) key = "chat";
    const initial = !current;
    const changed = current !== key;
    current = key;
    closeMenu();
    document.querySelector(".chat-area").hidden = key !== "chat";
    tools.hidden = key === "chat";
    Object.entries(panels).forEach(
      ([name, panel]) => (panel.hidden = name !== key),
    );
    nav.querySelectorAll("a").forEach((a) => {
      if (a.dataset.view === key) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    el("view-eyebrow").textContent = titles[key][0];
    el("view-title").textContent = titles[key][1];
    el("view-description").textContent = titles[key][2];
    document.querySelector(".breadcrumb").firstChild.textContent =
      "CRYO WORKSPACE ";
    el("top-title").textContent =
      key === "chat" ? active()?.title || "Neuer Chat" : titles[key][1];
    document.title =
      (key === "chat" ? "Chat" : titles[key][1]) + " · Cryo Workspace";
    if (changed && key === "chat" && !initial) {
      el("chat-heading").tabIndex = -1;
      el("chat-heading").focus({ preventScroll: true });
    }
    if (changed && key !== "chat")
      el("view-title").focus({ preventScroll: true });
    el("models-offline").disabled = el("model").disabled;
    document.dispatchEvent(new CustomEvent("workspace:view", { detail: key }));
    closeMenu();
  };
  function closeMenu() {
    el("sidebar").inert = matchMedia("(max-width:850px)").matches;
    el("sidebar").classList.remove("open");
    el("mobile-cover").hidden = true;
    el("nav-toggle").setAttribute("aria-expanded", "false");
    document.querySelector("main").inert = false;
  }
  el("nav-toggle").setAttribute("aria-controls", "sidebar");
  el("nav-toggle").setAttribute("aria-expanded", "false");
  el("nav-toggle").addEventListener("click", () => {
    el("sidebar").inert = false;
    el("nav-toggle").setAttribute("aria-expanded", "true");
    document.querySelector("main").inert = true;
    nav.querySelector("a").focus();
  });
  el("mobile-cover").addEventListener("click", () => {
    closeMenu();
    el("nav-toggle").focus();
  });
  document.addEventListener("keydown", (e) => {
    if (!el("sidebar").classList.contains("open")) return;
    if (e.key === "Escape") {
      closeMenu();
      el("nav-toggle").focus();
    }
    if (e.key === "Tab") {
      const items = [
        ...el("sidebar").querySelectorAll("a,button,input:not([hidden])"),
      ].filter((n) => !n.disabled && n.getClientRects().length);
      const first = items[0],
        last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  matchMedia("(max-width:850px)").addEventListener("change", closeMenu);
  window.addEventListener("hashchange", navigate);
  nav.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-view]");
    if (link && location.hash === link.getAttribute("href")) {
      event.preventDefault();
      navigate();
      const heading =
        current === "chat" ? el("chat-heading") : el("view-title");
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  });
  for (const [id, route] of [
    ["notes-toggle", "knowledge"],
    ["godot-toggle", "godot"],
    ["focus-toggle", "focus"],
  ]) {
    el(id).addEventListener(
      "click",
      (e) => {
        e.stopImmediatePropagation();
        location.hash = route;
        navigate();
      },
      true,
    );
    el(id).removeAttribute("aria-expanded");
    el(id).removeAttribute("aria-controls");
  }
  el("new-chat").addEventListener("click", () => {
    location.hash = "chat";
    navigate();
    el("prompt").focus();
  });
  el("chat-list").addEventListener("click", () => {
    location.hash = "chat";
    navigate();
  });
  for (const id of ["agent-use", "focus-draft"])
    el(id).addEventListener("click", () => {
      location.hash = "chat";
      navigate();
      el("prompt").focus();
    });
  el("models-refresh").addEventListener("click", refreshModels);
  el("models-offline").addEventListener("click", () => {
    if (el("model").disabled) return;
    el("model").value = "";
    el("model").dispatchEvent(new Event("change"));
    notice("Notizmodus aktiv.");
  });
  let favorites = [];
  try {
    const prefs = JSON.parse(localStorage.getItem("cryo-ui-v1") || "{}");
    favorites = Array.isArray(prefs.favorites)
      ? prefs.favorites.filter((x) => typeof x === "string").slice(0, 100)
      : [];
  } catch {
    /* preferences are optional */
  }
  function renderModels() {
    el("models-offline").disabled = el("model").disabled;
    el("models-refresh").disabled = el("model").disabled;
    const list = el("model-cards");
    list.replaceChildren();
    const needle = el("model-search").value.toLowerCase();
    const options = [...el("model").options]
      .filter((o) => o.value && o.textContent.toLowerCase().includes(needle))
      .sort(
        (a, b) =>
          Number(favorites.includes(b.value)) -
          Number(favorites.includes(a.value)),
      );
    for (const option of options) {
      const card = document.createElement("article");
      card.className = "model-card";
      const label = document.createElement("span");
      label.className = "eyebrow";
      label.textContent = option.value.startsWith("openai:")
        ? "CLOUD / OPENAI"
        : "LOKAL / OLLAMA";
      const title = document.createElement("h3");
      title.textContent = option.value.replace(/^openai:/, "");
      const choose = document.createElement("button");
      choose.textContent =
        el("model").value === option.value ? "Ausgewählt" : "Modell auswählen";
      choose.disabled = el("model").disabled;
      choose.addEventListener("click", () => {
        el("model").value = option.value;
        el("model").dispatchEvent(new Event("change"));
        renderModels();
        notice("Modell ausgewählt. Noch keine Anfrage gestartet.");
      });
      const favorite = document.createElement("button");
      favorite.textContent = favorites.includes(option.value)
        ? "★ Favorit"
        : "☆ Merken";
      favorite.setAttribute(
        "aria-pressed",
        String(favorites.includes(option.value)),
      );
      favorite.addEventListener("click", () => {
        favorites = favorites.includes(option.value)
          ? favorites.filter((x) => x !== option.value)
          : [...favorites, option.value].slice(-100);
        try {
          localStorage.setItem(
            "cryo-ui-v1",
            JSON.stringify({ version: 1, favorites }),
          );
        } catch {
          notice("Favoriten konnten nicht gespeichert werden.");
        }
        renderModels();
      });
      card.append(label, title, choose, favorite);
      list.append(card);
    }
    if (!options.length) {
      const p = document.createElement("p");
      p.textContent =
        "Keine Modelle gefunden. Ollama verbinden oder Suchtext ändern. Der lokale Notizmodus bleibt verfügbar.";
      list.append(p);
    }
  }
  el("model-search").addEventListener("input", renderModels);
  el("model").addEventListener("change", renderModels);
  new MutationObserver(renderModels).observe(el("model"), {
    childList: true,
    attributes: true,
  });
  document.addEventListener("workspace:chat", () => {
    if (current && current !== "chat")
      el("top-title").textContent = titles[current][1];
    document.dispatchEvent(
      new CustomEvent("workspace:context", { detail: active()?.id || null }),
    );
  });
  renderModels();
  navigate();
}
