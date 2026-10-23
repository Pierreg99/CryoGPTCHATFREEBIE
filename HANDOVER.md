# HANDOVER · Projektkontext

CryoGPTCHATFREEBIE ist ein lokaler Einzelbenutzer-KI-Workspace mit optionalen Ollama-/OpenAI-Modellen und ausdrücklich bestätigten Entwickler-Integrationen. Paketstand: `1.0.0-rc.1`.

## Einstieg

- `npm start`: Server unter `127.0.0.1:4173`.
- `npm test`: Node-Tests einschließlich Sicherheits- und Dokumentationschecks.
- `npm ci && npx playwright install chromium && npm run test:e2e`: Browser-Regressionen.
- `npm run release:verify`: Reproduzierbarer Paketbau aus sauberem Commit.
- `npm run screenshots`: Offline-Galerie mit frischem Profil aktualisieren.

## Architektur und Darstellung

`src/app.js` verwaltet Store und Modell-/Chat-Lebenszyklus. `src/workspace.js` verwaltet die acht Ansichten. `src/workbench.js` ergänzt Startbereich, Befehlssuche, Gesprächssuche und Fokusmodus über bestehende Aktionen und Events. `src/workbench.css` wird als abschließende Shell-Schicht nach den vorhandenen Komponentenstyles geladen. Seit PR #25 ergänzt `src/error-center.js` eine flüchtige Fehlerwarteschlange (maximal 20, `textContent`-Darstellung) und sichere, nur manuell ausgeführte Retry-Aktionen. Keine neue Laufzeitabhängigkeit.

Die neuen v1.2/v1.3-Funktionen begrenzen die sichtbare Chatseite auf 80 Nachrichten, suchen aber weiterhin den vollständigen Chat; Sidebar-Filter verwenden nur lokale Titel, Datum, Projektwissen und Rolle. Sie ändern das Backup-Schema nicht. Die Befehlssuche startet keine KI-Anfragen. Fokuspräferenz: `cryo-focus-v1` in localStorage, nicht im Chat-Backup. Suchtext bleibt im Arbeitsspeicher. [Details und Prüfumgebung](docs/workbench-overhaul.md).

## Dokumentation

README mit lokalen SVG-Kacheln, echten Screenshots, Details und Mermaid. Keine Emojis in README-Varianten. Das Hero-SVG ist eine Illustration, die PNG-Galerie zeigt den echten Offline-Workspace. Statusaussagen bleiben an den jeweiligen Commit und dessen CI gebunden.

## Offene Abnahme

Cloud- und Schreibzugriffe bleiben ausdrücklich freizugeben. Stable-1.0 wartet auf die reale manuelle WCAG-2.2-AA-Abnahme einschließlich Workbench-Fällen M11–M13, Fehlerzentrale M14, Nachrichtenpaging M15 und Suchfiltern M16. [Release-Gates](docs/RELEASE-CHECKLIST.md) · [Accessibility-Bericht](docs/accessibility-report.md) · [HANDOFF](HANDOFF.md).

## Lokale Projekt-Arbeitsräume v1.4

Ab Schema 3 enthält `src/core.js` eigenständige Projekte und `chat.projectId`. Die Bedienung erfolgt lokal im bestehenden Projektwissen-Panel über `src/app.js`; `src/backup.js` prüft v1/v2/v3 einschließlich referenzieller Integrität. Neue Projektnotizen werden nie automatisch an Modelle gesendet; chatbezogenes Projektwissen benötigt weiterhin das separate Opt-in. Vor einem Rollback einen kompatiblen Backup-Export aufbewahren. CI- und AT-Gates sind separat nachzuweisen.

## v1.5 · Migrationsmatrix

`tests/schema-migration.test.js` lädt versionierte synthetische Backup-Fixtures 1/2/3, prüft deterministische Migration nach Schema 3 sowie Freigaben, Projektreferenzen, redigierte Negativberichte und ein Restore/Undo im localStorage-Fallback. Die Dokumentation `docs/schema-migration.md` erklärt die Grenzen des Downgrades auf alte Clients. Keine automatische verlustfreie Konvertierung von Schema-3-Projekten auf Schema 2. Releaseversion bleibt `1.0.0-rc.1`.

## v1.6 · Verschlüsselte Backups

`src/encrypted-backup.js` implementiert ausschließlich Dateiverschlüsselung mit Browser-WebCrypto (AES-256-GCM / PBKDF2-SHA-256), keine Verschlüsselung des laufenden Speichers. `src/backup-ui.js` ergänzt separate Export-Passworteingabe und Entsperrung vor dem alten Restore-Dialog. Die vorhandene JSON-Vorschau, Importfreigabe und lokale Rücksetzfunktion bleiben die verbindlichen Daten-Gates. [Format und Bedienung](docs/encrypted-backups.md). Neue manuelle AT-Matrix M19 offen; bestehende Cloud-Opt-ins unverändert.
