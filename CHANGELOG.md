# Changelog

Dieses Changelog dokumentiert den kumulativen Funktionsstand. Abgehakte Punkte sind implementiert und technisch geprüft. Sie erklären keinen Release Candidate zur stabilen Version. Die [Master-Roadmap](docs/roadmap/ROADMAP-100.md) enthält die vollständigen Entwicklungsmeilensteine einschließlich offener Abnahmen.

## 1.0.0-rc.1

Prüfbarer Kandidat für das 1.0-Ziel. Der folgende Stand umfasst auch die historische Alpha-Basis sowie die Workspace-, Recovery- und Dokumentationsausbauten aus PR #13, #15, #16 und #17. Roadmap-Nummern sind keine veröffentlichten Release-Tags.

### Chat und Notizen

- [x] Unterhaltungen erstellen, auswählen, umbenennen und löschen.
- [x] Gespeicherte Chats und Nachrichten per Volltextsuche finden.
- [x] Ohne Modell lokale Nachrichten und Notizen speichern; keine simulierten KI-Antworten.
- [x] Modellantworten streamen, stoppen und empfangene Teilantworten bei Abbruch oder Fehler erhalten.
- [x] Nachrichten kopieren; Senden per Enter und Zeilenumbruch per Shift+Enter.
- [x] Unicode-Inhalte einschließlich eigener Emojis beim Speichern, Neuladen und JSON-Export erhalten.

### Roadmap v1.4 · Lokale Projekt-Arbeitsräume (Entwicklungsbranch)

- [ ] CI auf dem exakten v1.4-PR-Head und manuelle Accessibility-Abnahme M17 abschließen.
- [x] Bis zu 40 Projekt-Arbeitsräume, Chatzuordnung und lokale Projektfilter ergänzt.
- [x] Getrennte private Projekt-Notizen mit maximal 4000 Zeichen ohne automatische Modellfreigabe.
- [x] Backup-Schema 3 mit v1/v2-Migration, Konsistenzprüfung und Roundtrip-Tests ergänzt.

### Roadmap v1.2 und v1.3 · Entwicklungsbranch (CI/AT-Gates offen)

- [ ] Auf finaler Commit-SHA alle Pflichtprüfungen ausführen und manuelle Accessibility-Abnahme nachweisen.
- [x] Bei großen Chatverläufen höchstens 80 Nachrichten gleichzeitig rendern; alle Nachrichten bleiben gespeichert.
- [x] Vorherige/nächste Nachrichtenseite bewusst per Button anzeigen; Volltextsuche berücksichtigt auch nicht gerenderte Nachrichten.
- [x] Gespräch, letztes Änderungsdatum, Projektwissen und Nachrichtenrolle lokal kombinierbar filtern.
- [x] Deterministische Node- und Playwright-Regressionstests einschließlich Performance-Budget ergänzen.

### Fehlerzentrale v1.1 · PR #25 / PR #26 in main (manuelle Abnahme offen)

- [ ] Manuelle Accessibility-Abnahme der Fehlerzentrale (M14) offen; technische PR-CI nach Korrektur #26 grün.
- [x] Temporäre, kontextbezogene Problemübersicht für Speicherung, Modellstatus, Chat und Aktionen implementiert.
- [x] Bewusste Wiederholungen ohne automatische erneute KI-Anfrage implementiert.
- [x] Node- und Browser-Testfälle ergänzt; Ergebnisse am endgültigen PR-Commit gesondert zu prüfen.

### Workbench-Überarbeitung · 23.10.2026

- [x] Neue zweispaltige Startansicht mit tatsächlichen Gesprächszahlen und aktivem Modellmodus.
- [x] Gruppierte Navigation, violette Design-Tokens und einheitliche Oberflächen für acht Ansichten.
- [x] Befehlssuche per Strg+K/Cmd+K mit Filter, Pfeiltasten, nativer Dialogsemantik und Fokusrückgabe.
- [x] Suche innerhalb des Gesprächs mit Trefferwechsel, Leerzustand und Rücksetzung beim Chatwechsel.
- [x] Desktop-Fokusmodus mit lokaler Präferenz und zugänglicher Rückkehr zur Navigation.
- [x] Zeichenzähler und kompakte mobile Startansicht mit früh erreichbarem Eingabefeld.
- [x] Reproduzierbare Offline-Screenshots und ergänzende Browser-Regressionstests.

### Workspace, Navigation und Design

- [x] Acht Ansichten für Chat, Projektwissen, Hyperfocus, Agenten, GitHub & Skills, Godot MCP, Roadmap und Modelle.
- [x] Hash-Navigation mit Browser-Zurück/Vorwärts und Sprunglink zum Arbeitsbereich.
- [x] Responsive Desktop-, Tablet- und Mobile-Layouts mit mobiler Navigation, Escape und Fokusrückgabe.
- [x] Konsistente Cryo-Neon-Farben, Oberflächen, Abstände und Animationen.
- [x] Emoji-freie Bedienelemente mit lokalen SVG-Icons und verständlichen Texten.
- [x] Animationen pausieren und die Einstellung lokal merken; Systemvorgabe für reduzierte Bewegung beachten.
- [x] Dauerhaft lesbare, schließbare Meldungen sowie kurze Generierungsansagen und sichtbare Fokusführung.

### Speicherung, Backup und Wiederherstellung

- [x] IndexedDB-Snapshots, serialisierte Schreibzugriffe und ausdrücklicher localStorage-Fallback.
- [x] Vorhandene Browserdaten erst nach erfolgreichem IndexedDB-Commit aus dem Altspeicher entfernen.
- [x] Backup-Schema 1 nach Schema 2 migrieren und Schema-2-Backups erhalten; alte Kontextfreigaben nicht aktivieren.
- [x] Chats und Projektwissen als JSON exportieren und Dateien bis 3 MiB vor dem Import lokal prüfen.
- [x] Dry-run mit Format-/Umfangsvorschau, Fehlerpfaden, Normalisierungshinweisen und redigiertem Prüfbericht.
- [x] Aktuellen Stand vor dem Import exportieren und Wiederherstellung ausdrücklich freigeben.
- [x] Neuen Stand und Rücksetzpunkt in einer IndexedDB-Transaktion speichern; Schreibfehler erhalten die vorherigen Daten.
- [x] Letzten Import nach erneuter Vorschau zurücksetzen oder den Rücksetzpunkt getrennt löschen.
- [x] Veraltete Restore-Vorschauen und zwischenzeitlich geänderte gespeicherte Daten erkennen.
- [x] Alte Agenten-/Hyperfocus-Vorschauen nach Restore verwerfen, auch bei identischen Chat-IDs.
- [x] Hyperfocus-Historie der Chats im Rücksetzpunkt bis zur Rücksetzung oder Löschung vor der normalen Bereinigung schützen.

Die Grenzen des nicht atomaren localStorage-Fallbacks und unverschlüsselter Kopien stehen in der [Backup-Anleitung](docs/backup-recovery.md).

### Modelle und Projektwissen

- [x] Ollama-Modelle optional verbinden, aktualisieren und ausdrücklich auswählen.
- [x] OpenAI nur mit serverseitigem API-Schlüssel und Modellfreigabeliste anbieten.
- [x] Jede Cloud-Anfrage mit sichtbarem Kosten-/Datenhinweis gesondert bestätigen.
- [x] Modelle suchen und Favoriten lokal speichern; Notizmodus manuell wählbar halten.
- [x] Anwendungsversion für Oberfläche, HTTP-Status und MCP aus derselben Paketquelle lesen.
- [x] Bis zu 4.000 Zeichen Projektwissen pro Chat speichern und bearbeiten.
- [x] Projektwissen nur nach gespeicherter chatbezogener Freigabe als normalen Modellkontext übertragen.
- [x] Zeichenzahl und ungespeicherte Änderungen im Notizeditor anzeigen.

### GitHub, Skills und Agenten

- [x] Ausschließlich explizit freigegebene öffentliche GitHub-Repositories als Lesequellen verwenden.
- [x] README-Vorschau, Skill-Katalogsuche, begrenzte Repository-Struktur und einzelne erlaubte Textdateien lesen.
- [x] Skill-Referenzen prüfen und erst nach Bestätigung ins Projektwissen übernehmen; keine automatische Skill-Ausführung.
- [x] Bis zu fünf Leseaktionen planen und jeden Schritt einzeln prüfen, freigeben oder abbrechen.
- [x] Pläne bei Chatwechsel oder Restore verwerfen; Ergebnisse auf Wunsch als Nachrichtenentwurf übernehmen.
- [x] Lokale Markdown-Ausgabe nur nach eigenem Opt-in und Vorschau als neue Datei im freigegebenen Linux-Ausgabeordner erstellen.
- [x] GitHub-Markdown-Ausgabe nur mit separater Schreibfreigabe, vollständiger Vorschau und zeitlich begrenztem Ticket ausführen.
- [x] Für GitHub-Ausgaben neue Branches, Commits und Pull Requests erstellen; direkte Änderungen und Merges auf `main` ausschließen.
- [x] Konflikte sowie bereits erfolgte GitHub-Teilschritte beim Wiederholen prüfen, um doppelte Commits und PRs zu vermeiden.

### Hyperfocus

- [x] Ziel, Repository, optionale Skill-Suche und ein menschliches Arbeitsbudget von 15/25/45 Minuten planen.
- [x] Einen festen, begrenzten Rechercheablauf erst nach Vorschau und einmaliger Freigabe starten.
- [x] Maximal zwei öffentliche GitHub-Leseaktionen und optional eine Ollama-Synthese ausführen; keine OpenAI-Auswahl im Hyperfocus.
- [x] Lauf abbrechen und Ergebnisse getrennt prüfen oder als Chat-Entwurf übernehmen.
- [x] Lokale Historie je Chat anzeigen und Einträge entfernen; auf 20 je Chat und 200 insgesamt begrenzen.

### Godot MCP

- [x] Manuell konfigurierte Godot-Version und Projektinformationen nach gesonderter Freigabe abfragen.
- [x] Neue `Node2D`-, `Node3D`- oder `Control`-Szenen im festgelegten Testprojekt vorschauen.
- [x] Szenenerstellung mit `GODOT_SCENE_WRITES=true`, Einmal-Ticket und Bestätigung `ERSTELLEN` freigeben.
- [x] Bestehende Szenen, beliebige Pfade und nicht freigegebene Godot-Werkzeuge vor Änderungen schützen.

Der externe MCP-Prozess bleibt ausführbarer Fremdcode; eine Sandbox und echte Live-Godot-Abnahme sind weiterhin offen.

### Roadmap und Dokumentation

- [x] Alle 100 Meilensteine von v0.1 bis v10.0 mit Lieferobjekt, Abnahmekriterium und ausgeschriebenem Status dokumentieren.
- [x] Dieselbe Markdown-Quelle in der GUI nach Version/Thema, Phase und Status durchsuchen und filtern.
- [x] Versionsdetails, Seitennavigation, Statusübersicht und Wiederholung nach Ladefehlern anbieten.
- [x] Acht abgeschlossene Entwicklungsmeilensteine abhaken; drei teilweise umgesetzte und 89 geplante Meilensteine offen halten.
- [x] Haupt-README sowie Clean-, Neon- und Produktvariante auf denselben aktuellen Funktions-/Release-Stand bringen.
- [x] Abschnittslinks, SVG-Banner und Architekturangaben berichtigen und zwölf aktuelle GUI-Screenshots bereitstellen.
- [x] Backup-, Accessibility-, Security-, Plattform-, Migrations- und Release-Grenzen dokumentieren.

### Sicherheitsgrenzen, Tests und Paketbau

- [x] Kanonischen Loopback-Host, Origin, JSON-Eingaben und Request-Größen vor API-Seiteneffekten prüfen.
- [x] CSP und Browser-Sicherheitsheader zentral setzen; Request-/Header-Zeitlimits und maximal zwei parallele Chat-Modellanfragen begrenzen.
- [x] Negative HTTP-/Provider-/MCP-/Schreibtests sowie Backup-Fehler, Konflikte und Wiederherstellung prüfen.
- [x] Node-Kompatibilität unter Node 20, 22 und 24 in CI testen.
- [x] Chromium-E2E mit Tastatur, axe, acht Ansichten und 320/360/768/1440 CSS-Pixeln ausführen.
- [x] README-Datei-/Abschnittslinks, aktuelle Versionsangaben, sieben SVG-Illustrationen und alle Roadmap-Versionen prüfen.
- [x] Quellpakete aus sauberem committed Git-Stand zweimal bytegleich bauen und mit SHA-256 sowie Herkunftsmanifest versehen.
- [x] Offene manuelle Gates im Kandidatenmanifest ausweisen und stabile Paketbauten bis zu ihrer Erfüllung blockieren.
- [x] Spätere Tag-Veröffentlichungen an Versionsgleichheit und denselben Qualitätsworkflow binden.
- [x] Bestehende Funktionen und Backup-Kompatibilität ohne neue npm-Laufzeitabhängigkeit erhalten.

Stand der automatisierten Prüfung: 84 Node-Tests und 27 Browsertests. Externe Dienste werden simuliert; diese Zahlen belegen keine echte Modellinferenz oder vollständige Produktabnahme.

### Offen vor der stabilen Freigabe

- [ ] Manuelle WCAG-2.2-AA-Abnahme mit realer assistiver Technik einschließlich Zoom, Textabständen, Fokus und Lesereihenfolge dokumentieren.
- [ ] Stabile 1.0 erst nach Erfüllung der [Release-Checkliste](docs/RELEASE-CHECKLIST.md) freigeben.

Weitere Zukunftsfunktionen sind in der [Master-Roadmap](docs/roadmap/ROADMAP-100.md) als offen gekennzeichnet. Weder Verschlüsselung, Multi-User/Sync, allgemeine autonome Skill-Ausführung noch MCP-Sandbox werden als abgeschlossen behauptet.

## 0.4.0

Historische Alpha-Basis mit lokalem Chat, Streaming, IndexedDB, Projektwissen, optionalen Providern, kontrollierten GitHub-Schritten und Godot MCP. Diese Funktionen sind im kumulativen Stand oben abgehakt. Die ursprünglichen Roadmap-Nummern beschreiben Entwicklungsphasen; es wird daraus keine historische Release-Veröffentlichung abgeleitet.
