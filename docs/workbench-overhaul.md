# Cryo Workbench · Überarbeitung vom 23.10.2026

Der Workspace führt Chat und Entwicklerwerkzeuge in einer ruhigeren, konsistenten Oberfläche zusammen. Die Paketversion bleibt `1.0.0-rc.1`.

## Was sich beim Arbeiten ändert

| Bereich | Verhalten |
| --- | --- |
| Start | Zweispaltiger Desktop-Einstieg; auf kleinen Displays kompakte Gesprächsstatistik und früh erreichbarer Composer |
| Navigation | Neuer Chat als primäre Aktion; Ansichten nach Denken, Werkzeugen und Workspace gruppiert |
| Befehlssuche | Strg+K/Cmd+K oder Suchbutton; Textfilter, Pfeiltasten, Enter, Tab und Escape; zeigt auch Backup- und Entwurfsaktionen |
| Chat durchsuchen | Im geöffneten Gespräch nach Text suchen; auch im gespeicherten, nicht sichtbaren Verlauf; Treffer öffnet die betreffende Nachrichtenseite |
| Langer Verlauf (v1.2) | Maximal 80 gleichzeitig gerenderte Nachrichten; ältere/neuere Seiten per Button, sämtliche Nachrichten bleiben im Backup |
| Erweiterte Suche (v1.3) | Sidebar-Filter nach Gespräch, Änderungsdatum, lokalem Projektwissen und Nachrichtenrolle; Kriterien kombiniert |
| Fokus | Desktop-Chat blendet die Seitenleiste aus; Fokus-Button bleibt erreichbar; Werkzeuge stellen die Navigation wieder her |
| Composer | Zeichenzähler bis 12.000; Vorschläge bleiben Entwürfe bis zum Senden |
| Überblick | Gesprächs- und Nachrichtenzahlen aus dem aktuellen lokalen Store; Modellmodus aus der tatsächlichen Modellauswahl |

Die Befehlssuche öffnet bestehende Ansichten oder betätigt vorhandene Aktionen. Backups verwenden weiterhin die vorhandene Vorschau und Bestätigung. Modellauswahl und Vorschlagskarten lösen keine Modellanfrage aus.

## Technische Aufteilung

| Datei | Verantwortung |
| --- | --- |
| `src/app.js` | Bestehender Store, Persistenz, Modell-/Chat-Lebenszyklus; bindet Workbench nach Router und Basisdarstellung ein |
| `src/workspace.js` | Bestehende Hash-Routen und fachliche Panels |
| `src/workbench.js` | Startbereich, native Befehlssuche, Gesprächssuche und Fokusmodus; liest State über `getStore`/`active` und konsumiert Workspace-Events |
| `src/workbench.css` | Abschließende Shell-Schicht mit semantischen Tokens, responsiven Regeln und Spezialzuständen |
| `src/interface.css` | Fachliche Formulare, Wiederherstellung und bestehende Komponenten |
| `server.mjs` | Liefert die beiden neuen Shell-Dateien über die bestehende explizite Static-Allowlist aus |
| `e2e/workbench.spec.js` | Sieben zusätzliche Browser-Tests für neue Interaktionen und responsive Zustände |
| `scripts/screenshots.mjs` | Reproduzierbare Screenshots in frischem Profil mit deaktivierten externen Integrationen |

Keine neue Laufzeitabhängigkeit. Die bestehenden CSS-Dateien werden weiter eingebunden; fachliche Komponenten bleiben getrennt von der Shell. Eine vollständige Zusammenführung der historischen CSS-Schichten ist kein Teil dieses Changes.

## Daten und Zustand

`cryo-focus-v1` enthält ausschließlich die boolesche Layoutpräferenz als String in localStorage. Die Einstellung gehört wie Favoriten und Motion-Präferenzen nicht zum Chat-JSON-Backup. Bei gesperrtem localStorage funktioniert sie nur für die Sitzung.

Suchbegriffe, Suchtreffer und der Zustand der Befehlssuche bleiben im Arbeitsspeicher. Die neuen Filter sind lokale UI-Einstellungen, keine persistierten Daten und keine Netzwerk-Anfragen. Das Datum wird nach Umrechnung des ISO-Zeitstempels (einschließlich Zeitzonen-Offsets) als UTC-Tag verglichen. Das 80er-Nachrichtenfenster wird separat vom weiterhin vollständigen Store verwaltet; bei Suchtreffern außerhalb des aktuellen DOM wird das Fenster neu ausgerichtet. Die Gesprächssuche wird beim Wechsel der aktiven Chat-ID zurückgesetzt. Nachrichten werden weiterhin als Text dargestellt. Das Rendering von Modell-/Nutzerinhalten als HTML wurde nicht eingeführt.

## Nachweise und Reproduktion

```bash
npm ci
npm test
npx playwright install chromium
npm run test:e2e
# Aus einem sauberen Commit:
npm run release:verify
# Screenshots aktualisieren:
npm run screenshots
```

Die lokale Verifikation verwendet Node 24 und Chromium 153. Für den Browserlauf wurde ein lokal verfügbares Chromium verwendet, da der reguläre Playwright-Browserdownload hier ein ungültiges Archiv lieferte. Die GitHub-CI verwendet ihre normale Playwright-Installation und prüft Node 20/22/24 separat. `CRYO_BROWSER_PATH` kann für den Screenshot-Befehl optional auf eine vorhandene Chromium-Datei zeigen; es verändert die Anwendung nicht.

Die Screenshots zeigen einen leeren Offline-Workspace, keine Live-Inferenz. Die Backup-Bilder zeigen die noch nicht angewandte Vorschau eines leeren Beispiel-Backups. Die Desktop-Ansichten wurden bei 1440 × 1040, die mobilen bei 390 × 844 aufgenommen.

Die automatische Suite prüft unter anderem acht Ansichten bei 320/360/768/1440 CSS-Pixeln, die Befehlssuche, Fokus-Rückgabe, Modell-Streaming mit simulierten Providern und echte IndexedDB-Wiederherstellung. Sie ersetzt die [manuelle Accessibility-Abnahme](accessibility-report.md) nicht. Neue manuelle Fälle M11–M13 sind offen.

## v1.2/v1.3 · Technische Regressionen

- `tests/core.test.js`: kombinierte Filter und feste 80er-Grenze auf 600 Nachrichten.
- `e2e/workbench.spec.js`: importierter großer Verlauf, Seitenwechselzeit unter 2500 ms in CI-Chromium, Suche nach verstecktem Verlauf, Filterkombinationen.
- Der Seitenwechsel ist eine explizite Bedienaktion, keine automatische Netzwerk- oder AI-Aktion. Für Release-Kandidaten bleiben manuelle Screenreader-Prüfungen M15–M16 notwendig.
