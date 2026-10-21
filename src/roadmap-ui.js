const labels = {
  implemented: "Umgesetzt",
  partial: "Teilweise umgesetzt",
  planned: "Geplant",
};
export function createRoadmapPanel() {
  const panel = document.createElement("section");
  panel.className = "roadmap-panel";
  panel.setAttribute("aria-label", "Produkt-Roadmap");
  panel.innerHTML = `<div class="roadmap-summary"><div><span class="eyebrow">V0.1 BIS V10.0</span><h2>Große Vision. Prüfbare Schritte.</h2><p>100 Meilensteine, zehn Phasen. Entwicklungsziele sind keine veröffentlichten Releases.</p></div><div class="roadmap-counts" aria-label="Umsetzungsstand"></div></div>
    <div class="roadmap-toolbar"><div class="field-group"><label for="roadmap-search">Version oder Thema suchen</label><input id="roadmap-search" type="search" placeholder="z. B. v0.6, Godot, Sandbox …"></div><div class="field-group"><label for="roadmap-phase">Phase</label><select id="roadmap-phase"><option value="">Alle zehn Phasen</option></select></div><div class="field-group"><label for="roadmap-status">Status</label><select id="roadmap-status"><option value="">Alle Status</option><option value="implemented">Umgesetzt</option><option value="partial">Teilweise umgesetzt</option><option value="planned">Geplant</option></select></div></div>
    <p id="roadmap-result-count" role="status">Roadmap wird geladen …</p><div class="roadmap-layout"><div><ol id="roadmap-list" class="roadmap-list" tabindex="-1" aria-label="Versions-Meilensteine"></ol><div class="roadmap-pagination"><button id="roadmap-prev" type="button">Zurück</button><span id="roadmap-page"></span><button id="roadmap-next" type="button">Weiter</button></div></div><section class="roadmap-detail" aria-label="Versionsdetails"><h2 tabindex="-1" id="roadmap-detail-title">Version auswählen</h2><div id="roadmap-detail-content"></div></section></div>`;
  const find = (id) => panel.querySelector("#" + id);
  let data,
    page = 0,
    selected = "";
  function select(milestone, focus = false) {
    selected = milestone.version;
    const detail = find("roadmap-detail-content");
    detail.replaceChildren();
    find("roadmap-detail-title").textContent =
      "v" + milestone.version + " · " + milestone.title;
    const badge = document.createElement("span");
    badge.className = "roadmap-badge";
    badge.dataset.status = milestone.status;
    badge.textContent = labels[milestone.status];
    const phase = document.createElement("p");
    phase.className = "roadmap-phase-label";
    phase.textContent =
      "Phase " +
      milestone.phase +
      " · " +
      data.phases.find((p) => p.id === milestone.phase).title;
    detail.append(badge, phase);
    for (const [heading, text] of [
      ["Lieferobjekt", milestone.deliverable],
      ["Abnahmekriterium", milestone.acceptance],
    ]) {
      const h = document.createElement("h3");
      h.textContent = heading;
      const p = document.createElement("p");
      p.textContent = text;
      detail.append(h, p);
    }
    const note = document.createElement("p");
    note.className = "roadmap-note";
    note.textContent =
      milestone.status === "planned"
        ? "Dieser Meilenstein ist geplant. Er beschreibt kein bereits verfügbares Feature."
        : milestone.status === "partial"
          ? "Teile sind umgesetzt. Das vollständige Abnahmekriterium ist noch offen."
          : "Als Entwicklungsmeilenstein umgesetzt. Die Versionsnummer ist kein veröffentlichter Release-Tag.";
    const source = document.createElement("a");
    source.href =
      "https://github.com/Pierreg99/CryoGPTCHATFREEBIE/blob/main/docs/roadmap/ROADMAP-100.md";
    source.textContent = "Quell-Roadmap ansehen";
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    const back = document.createElement("button");
    back.type = "button";
    back.className = "roadmap-back";
    back.textContent = "Zur Versionsliste";
    back.addEventListener("click", () => {
      find("roadmap-list").focus();
      find("roadmap-list").scrollIntoView({ block: "start" });
    });
    detail.append(note, source, back);
    find("roadmap-list")
      .querySelectorAll("button")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.version === selected),
        ),
      );
    if (focus) {
      find("roadmap-detail-title").focus({ preventScroll: true });
      if (matchMedia("(max-width:850px)").matches)
        find("roadmap-detail-title").scrollIntoView({ block: "start" });
    }
  }
  function render() {
    if (!data) return;
    const needle = find("roadmap-search")
        .value.trim()
        .toLocaleLowerCase("de-DE"),
      phase = find("roadmap-phase").value,
      status = find("roadmap-status").value;
    const matches = data.milestones.filter(
      (m) =>
        (!phase || m.phase === Number(phase)) &&
        (!status || m.status === status) &&
        (!needle ||
          (
            "v" +
            m.version +
            " " +
            m.title +
            " " +
            m.deliverable +
            " " +
            m.acceptance
          )
            .toLocaleLowerCase("de-DE")
            .includes(needle)),
    );
    page = Math.max(0, Math.min(page, Math.ceil(matches.length / 10) - 1));
    const entries = matches.slice(page * 10, page * 10 + 10),
      list = find("roadmap-list");
    list.replaceChildren();
    for (const m of entries) {
      const li = document.createElement("li"),
        button = document.createElement("button"),
        version = document.createElement("span"),
        title = document.createElement("strong"),
        badge = document.createElement("span");
      button.type = "button";
      button.dataset.version = m.version;
      button.setAttribute("aria-pressed", String(m.version === selected));
      version.className = "roadmap-version";
      version.textContent = "v" + m.version;
      title.textContent = m.title;
      badge.className = "roadmap-badge";
      badge.dataset.status = m.status;
      badge.textContent = labels[m.status];
      button.append(version, title, badge);
      button.addEventListener("click", () => select(m, true));
      li.append(button);
      list.append(li);
    }
    if (!matches.length) {
      const li = document.createElement("li");
      li.className = "roadmap-no-results";
      li.textContent =
        "Keine passenden Meilensteine. Suche oder Filter anpassen.";
      list.append(li);
    }
    panel.querySelector(".roadmap-detail").hidden = !matches.length;
    if (entries.length && !entries.some((m) => m.version === selected))
      select(entries[0]);
    find("roadmap-result-count").textContent = matches.length
      ? `${page * 10 + 1}–${Math.min((page + 1) * 10, matches.length)} von ${matches.length} Meilensteinen`
      : "0 passende Meilensteine";
    find("roadmap-page").textContent = matches.length
      ? `Seite ${page + 1} / ${Math.ceil(matches.length / 10)}`
      : "Keine Treffer";
    find("roadmap-prev").disabled = page === 0;
    find("roadmap-next").disabled = (page + 1) * 10 >= matches.length;
  }
  for (const id of ["roadmap-search", "roadmap-phase", "roadmap-status"])
    find(id).addEventListener(
      id === "roadmap-search" ? "input" : "change",
      () => {
        page = 0;
        render();
      },
    );
  find("roadmap-prev").addEventListener("click", () => {
    page--;
    render();
  });
  find("roadmap-next").addEventListener("click", () => {
    page++;
    render();
  });
  async function load() {
    try {
      const response = await fetch("/api/roadmap");
      if (!response.ok) throw new Error();
      data = await response.json();
      if (
        !Array.isArray(data.milestones) ||
        data.milestones.length !== 100 ||
        !Array.isArray(data.phases)
      )
        throw new Error();
      for (const phase of data.phases) {
        const option = document.createElement("option");
        option.value = String(phase.id);
        option.textContent = phase.id + " · " + phase.title;
        find("roadmap-phase").append(option);
      }
      for (const status of ["implemented", "partial", "planned"]) {
        const card = document.createElement("div"),
          count = document.createElement("strong"),
          label = document.createElement("span");
        count.textContent = String(
          data.milestones.filter((m) => m.status === status).length,
        );
        label.textContent = labels[status];
        card.append(count, label);
        panel.querySelector(".roadmap-counts").append(card);
      }
      render();
      select(
        data.milestones.find((m) => m.status !== "implemented") ||
          data.milestones[0],
      );
    } catch {
      find("roadmap-result-count").textContent = "Roadmap nicht erreichbar.";
      const retry = document.createElement("button");
      retry.type = "button";
      retry.textContent = "Erneut laden";
      retry.addEventListener("click", () => {
        retry.remove();
        load();
      });
      find("roadmap-result-count").after(retry);
    }
  }
  load();
  return panel;
}
