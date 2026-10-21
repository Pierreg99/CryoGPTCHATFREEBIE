// Hyperfocus Workspace UI. Autonomy is strictly bounded to previewed, read-only research.
// Uses a one-time ticket; no background runs, writes, or automatic chat messages.
export function setupHyperfocus({ el, active, notice }) {
  const repo = el('focus-repo'), skills = el('focus-skills-repo');
  const goal = el('focus-goal'), query = el('focus-query');
  const minutes = el('focus-minutes'), model = el('focus-model');
  const preview = el('focus-preview'), result = el('focus-result');
  const status = el('focus-status');
  const planButton = el('focus-plan'), runButton = el('focus-run');
  const stopButton = el('focus-stop'), draftButton = el('focus-draft');
  const toggle = el('focus-toggle'), panel = el('focus-panel');

  let approvedPlan = null, lastResult = null, running = null, serial = 0;

  function cancel() {
    if (running) running.abort();
    running = null;
    stopButton.disabled = true;
    stopButton.hidden = true;
    planButton.disabled = false;
  }

  function invalidate() {
    ++serial;
    cancel();
    approvedPlan = null;
    lastResult = null;
    runButton.disabled = true;
    draftButton.disabled = true;
    preview.textContent = 'Noch kein Arbeitsplan erstellt.';
    result.textContent = 'Noch keine Ergebnisse.';
    status.textContent = 'Bereit für ein begrenztes Fokusziel.';
  }

  for (const control of [repo, skills, goal, query, minutes, model]) {
    control.addEventListener(control === goal || control === query ? 'input' : 'change', invalidate);
  }

  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
  });

  async function readJson(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Hyperfocus-Dienst nicht erreichbar.');
    return data;
  }

  function body() {
    return {
      goal: goal.value.trim(), repo: repo.value, skillRepo: skills.value,
      query: query.value.trim(), minutes: Number(minutes.value), model: model.value
    };
  }

  planButton.addEventListener('click', async () => {
    const chat = active();
    if (!chat) { notice('Bitte zuerst eine Unterhaltung erstellen.'); return; }
    if (running) return;
    const input = body(), request = ++serial;
    approvedPlan = null;
    lastResult = null;
    runButton.disabled = true;
    draftButton.disabled = true;
    status.textContent = 'Erzeuge eine prüfbare Vorschau …';
    try {
      const data = await readJson(await fetch('/api/hyperfocus/plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      }));
      if (request !== serial || active()?.id !== chat.id) return;
      approvedPlan = { ticket: data.ticket, expiresAt: data.expiresAt, chatId: chat.id, input };
      const p = data.preview;
      preview.textContent = 'ZIEL: ' + p.goal + '\nZEIT: ' + p.minutes +
        ' min\n\nGEPLANTE SCHRITTE\n' +
        p.actions.map((step, i) => (i + 1) + '. ' + step.description + (step.repo ? ' · ' + step.repo : '')).join('\n') +
        '\n\nSCHUTZGRENZEN\n' + p.permissions.join(' · ') +
        '\n\nNoch nichts ausgeführt. Freigabe verfällt nach zwei Minuten.';
      runButton.disabled = false;
      status.textContent = 'Vorschau fertig. Bitte Aktionen prüfen und gesamtem Lauf zustimmen.';
    } catch (error) {
      if (request === serial) {
        status.textContent = 'Plan fehlgeschlagen: ' + error.message;
        preview.textContent = 'Keine Aktionen ausgeführt.';
      }
    }
  });

  runButton.addEventListener('click', async () => {
    const task = approvedPlan;
    if (!task || task.chatId !== active()?.id) { invalidate(); return; }
    if (Date.now() >= task.expiresAt) {
      invalidate(); notice('Vorschau abgelaufen. Bitte neu planen.'); return;
    }
    if (JSON.stringify(task.input) !== JSON.stringify(body())) {
      invalidate(); notice('Eingaben geändert. Bitte neue Vorschau erstellen.'); return;
    }
    const details = 'Hyperfocus einmalig starten?\n' + task.input.goal +
      '\nRepository: ' + task.input.repo +
      '\nZeitfenster: ' + task.input.minutes + ' min' +
      (task.input.model ? '\nLokales Ollama-Modell: ' + task.input.model : '\nOhne Modell / Offline-Plan') +
      '\n\nNur öffentliches GitHub lesen; keine Dateiänderungen, kein Cloud-API-Aufruf.';
    if (!window.confirm(details)) return;
    const sequence = ++serial;
    approvedPlan = null; // no duplicate run from one preview
    runButton.disabled = true;
    draftButton.disabled = true;
    planButton.disabled = true;
    stopButton.hidden = false;
    stopButton.disabled = false;
    result.textContent = 'Recherche und Planerstellung laufen …';
    status.textContent = 'Autopilot aktiv: maximal zwei GitHub-Leseaktionen und eine lokale Zusammenfassung.';
    running = new AbortController();
    const controller = running;
    try {
      const data = await readJson(await fetch('/api/hyperfocus/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket: task.ticket }),
        signal: controller.signal
      }));
      if (sequence !== serial || active()?.id !== task.chatId) return;
      lastResult = { ...data, chatId: task.chatId };
      result.textContent = 'HYPERFOCUS ERGEBNIS · ' + data.mode.toUpperCase() + '\n' +
        data.steps.map(s => '✓ ' + s.operation + (s.repo ? ' · ' + s.repo : '')).join('\n') +
        '\n\n' + data.brief + '\n\n' + data.sourceNote;
      draftButton.disabled = false;
      status.textContent = 'Fertig. ' + data.steps.length + ' begrenzte Schritte; ' +
        data.writes + ' Schreibzugriffe. Ergebnis prüfen oder als Entwurf übernehmen.';
    } catch (error) {
      if (sequence === serial) {
        status.textContent = controller.signal.aborted
          ? 'Lauf gestoppt. Ein abgebrochener Lauf kann nicht fortgesetzt werden.'
          : 'Hyperfocus fehlgeschlagen: ' + error.message;
        result.textContent = 'Keine bestätigte Fertigstellung.';
      }
    } finally {
      if (sequence === serial) {
        running = null;
        planButton.disabled = false;
        stopButton.disabled = true;
        stopButton.hidden = true;
      }
    }
  });

  stopButton.addEventListener('click', () => {
    if (!running) return;
    running.abort();
    status.textContent = 'Stop angefordert. Nicht abgeschlossene Ergebnisse werden verworfen.';
  });

  draftButton.addEventListener('click', () => {
    if (!lastResult || lastResult.chatId !== active()?.id) {
      invalidate(); return;
    }
    const text = '[Hyperfocus / schreibgeschützte Recherche]\n' +
      'Ziel: ' + lastResult.goal + '\n\n' + lastResult.brief;
    const prompt = el('prompt');
    prompt.value = text.slice(0, 11500);
    prompt.focus();
    notice('Fokusplan als Nachrichtenentwurf eingefügt. Noch nichts an eine KI gesendet.');
  });

  async function init() {
    try {
      const [config, statusData] = await Promise.all([
        readJson(await fetch('/api/integrations')),
        readJson(await fetch('/api/status'))
      ]);
      const available = config.github?.repositories || [];
      repo.replaceChildren();
      skills.replaceChildren();
      const blank = document.createElement('option');
      blank.value = '';
      blank.textContent = 'Keine Skill-Suche';
      skills.append(blank);
      for (const r of available) {
        for (const dest of [repo, skills]) {
          const option = document.createElement('option');
          option.value = r; option.textContent = r; dest.append(option);
        }
      }
      repo.disabled = !available.length;
      skills.disabled = !available.length;
      planButton.disabled = !available.length;
      if (available.length) {
        repo.value = available.find(r => !r.toLowerCase().includes('learn-packages')) || available[0];
        skills.value = available.find(r => r.toLowerCase().includes('learn-packages')) || '';
      }
      model.replaceChildren();
      const localOnly = document.createElement('option');
      localOnly.value = ''; localOnly.textContent = 'Ohne Modell / Offline-Fokusplan';
      model.append(localOnly);
      const local = statusData.providers?.ollama?.models || [];
      for (const name of local) {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = 'Ollama (lokal): ' + name;
        model.append(option);
      }
      status.textContent = available.length
        ? 'Bereit: öffentliche Repositories. Optionales Ollama-Modell bewusst auswählen.'
        : 'Hyperfocus-Recherche deaktiviert. CRYO_GITHUB_REPOS beim Serverstart konfigurieren.';
    } catch {
      status.textContent = 'Hyperfocus-Konfiguration nicht erreichbar.';
      planButton.disabled = true;
    }
  }
  invalidate();
  init();
}
