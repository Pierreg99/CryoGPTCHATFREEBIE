// Local, ephemeral issue queue: never uploads diagnostics or retries side effects silently.
export function normalizeError({ scope, title, detail }) {
  if (!/^[a-z][a-z0-9-]{0,31}$/.test(scope || ""))
    throw new TypeError("Ungültiger Fehlerbereich.");
  const clean = (value, max) =>
    String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
  return {
    scope,
    title: clean(title, 100) || "Aktion fehlgeschlagen",
    detail: clean(detail, 300) || "Bitte den Vorgang prüfen.",
  };
}

export function createErrorCenter(doc = document) {
  const trigger = doc.createElement("button");
  trigger.type = "button";
  trigger.id = "error-center-open";
  trigger.className = "workbench-button";
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-controls", "error-center-dialog");
  const label = doc.createElement("span");
  label.className = "error-label";
  label.textContent = "Probleme";
  const count = doc.createElement("strong");
  count.id = "error-center-count";
  count.textContent = "0";
  trigger.append(label, count);
  doc.querySelector(".top-actions").append(trigger);

  const dialog = doc.createElement("dialog");
  dialog.id = "error-center-dialog";
  dialog.className = "error-center-dialog";
  dialog.setAttribute("aria-labelledby", "error-center-title");
  // The only HTML inserted is a static template. Diagnostics use textContent.
  dialog.innerHTML = `<div class="error-center-heading"><h2 id="error-center-title">Fehlerzentrale</h2><button id="error-center-close" type="button">Schließen</button></div><p id="error-center-help">Nur diese Sitzung. Keine automatische Übertragung oder Wiederholung von Modellanfragen.</p><p id="error-center-summary" role="status"></p><div id="error-center-list" class="error-center-list"></div><button id="error-center-clear" type="button">Liste leeren</button>`;
  doc.body.append(dialog);
  const list = dialog.querySelector("#error-center-list");
  const clearButton = dialog.querySelector("#error-center-clear");
  const items = new Map();
  let previousFocus;

  function render() {
    count.textContent = String(items.size);
    trigger.setAttribute("aria-label", `Fehlerzentrale öffnen, ${items.size} Probleme`);
    dialog.querySelector("#error-center-summary").textContent =
      items.size ? `${items.size} offene Probleme` : "Keine offenen Probleme";
    clearButton.disabled = !items.size;
    list.replaceChildren();
    for (const issue of [...items.values()].reverse()) {
      const entry = doc.createElement("section");
      entry.className = "error-center-entry";
      const heading = doc.createElement("h3");
      heading.textContent = issue.title;
      const detail = doc.createElement("p");
      detail.textContent = issue.detail;
      const actions = doc.createElement("div");
      actions.className = "error-center-actions";
      if (typeof issue.retry === "function") {
        const retry = doc.createElement("button");
        retry.type = "button";
        retry.dataset.retry = issue.scope;
        retry.textContent = issue.retryLabel || "Erneut prüfen";
        retry.addEventListener("click", () => {
          dialog.close();
          // Only a deliberate click invokes the explicitly scoped retry.
          try {
            Promise.resolve(issue.retry()).catch(() => {
              report({ scope: issue.scope, title: issue.title, detail: "Erneuter Versuch fehlgeschlagen." });
            });
          } catch {
            report({ scope: issue.scope, title: issue.title, detail: "Erneuter Versuch fehlgeschlagen." });
          }
        });
        actions.append(retry);
      }
      const dismiss = doc.createElement("button");
      dismiss.type = "button";
      dismiss.textContent = "Aus Liste entfernen";
      dismiss.addEventListener("click", () => resolve(issue.scope));
      actions.append(dismiss);
      entry.append(heading, detail, actions);
      list.append(entry);
    }
  }
  function report({ scope, title, detail, retry, retryLabel }) {
    const issue = normalizeError({ scope, title, detail });
    // Repeated failures from the same source replace their previous entry.
    items.delete(scope);
    items.set(scope, { ...issue, retry, retryLabel });
    if (items.size > 20) items.delete(items.keys().next().value);
    render();
  }
  function resolve(scope) {
    items.delete(scope);
    render();
  }
  trigger.addEventListener("click", () => {
    if (doc.querySelector("dialog[open]")) return;
    previousFocus = doc.activeElement;
    render();
    dialog.showModal();
    dialog.querySelector("#error-center-close").focus();
  });
  dialog.querySelector("#error-center-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    if (previousFocus?.isConnected && !previousFocus.inert) previousFocus.focus();
  });
  clearButton.addEventListener("click", () => { items.clear(); render(); });
  render();
  return { report, resolve, count: () => items.size };
}
