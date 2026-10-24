# PLAN · CryoGPTCHATFREEBIE

Stand: 23. Oktober 2026. PR #26 wurde mit erfolgreicher CI gemergt ([Run 40015621693](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/actions/runs/40015621693)).

## Workbench-Meilenstein

| Aufgabe | Akzeptanzkriterium | Umsetzung |
| --- | --- | --- |
| Oberfläche umfassend überarbeiten | Konsistente acht Ansichten, gruppierte Navigation, responsive Startansicht und echter Modus-/Speicherstatus | `src/workbench.js`, `src/workbench.css` |
| Schneller navigieren | Befehlssuche per Strg+K/Cmd+K, Filter, Pfeiltasten, Escape und Fokusrückgabe | `e2e/workbench.spec.js` |
| Gespräche bearbeiten | Nachrichtensuche mit Trefferwechsel, Desktop-Fokusmodus und Zeichenzähler | Browser-Regressionstests |
| Bestehende Funktionen absichern | Chat/Streaming, Backup/Undo, Modellwahl, Skills-/Agentenfreigaben weiter funktionsfähig | Vollständige Node- und Browser-Suiten |
| Dokumentation synchronisieren | Aktuelle Screenshots, reproduzierbarer Capture-Befehl, README, Audit und Übergaben | `docs/workbench-overhaul.md` |

## Offene Qualitätsgates

1. PR-CI mit Node 20/22/24, regulärem Playwright-Chromium und reproduzierbarem Paketbau prüfen.
2. PR-Diff und GitHub-Regeln vor einer Integration prüfen.
3. Manuelle WCAG-2.2-AA-Abnahme einschließlich neuer Fälle M11–M13 mit realer Assistive Technology durchführen. [Issue #22](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/issues/22) bleibt offen; Stable-1.0 bleibt blockiert.

[Workbench](docs/workbench-overhaul.md) · [PROGRESS](PROGRESS.md) · [Release-Gates](docs/RELEASE-CHECKLIST.md) · [Workflow-Referenz](https://github.com/Pierreg99/Workflows)

## Roadmap v1.1 · Fehlerzentrale (PR #25)

| Arbeit | Stand | Gate |
| --- | --- | --- |
| Fehler aus Speicher, Modellstatus, KI-Anfragen und Aktionen bündeln | In `main` über PR #25; CI-Nachbesserung in PR #26 | [src/error-center.js](src/error-center.js) |
| Speicherversuch/Modellstatus ausdrücklich wiederholen | Entwicklungsbranch | Keine impliziten Cloud- oder Schreiboperationen |
| Kontextsichere Fehleranzeige, Fokusrückgabe und Begrenzung | Entwicklungsbranch | Node- und Browser-Tests auf exaktem PR-Head |
| Realer Screenreader-Test der Fehlerzentrale | offen | M14 im [Accessibility-Bericht](docs/accessibility-report.md) |

PR #25 wurde trotz roter Roadmap-Assertion nach `main` integriert. Die angepasste Statuszählung und Dokumentation müssen im Reparatur-PR #26 auf dem finalen Head unter Node 20/22/24 und Chromium geprüft werden. Das REQUIRED-Gate aus Issue #22 bleibt unverändert offen. Danach v1.2 Performance und v1.3 Suche priorisieren.

## Roadmap v1.2/v1.3 · Begrenzte Verlaufdarstellung und Filter

| Bereich | Umgesetzter Branch-Umfang | Abnahme |
| --- | --- | --- |
| v1.2 | Nachrichtenfenster von maximal 80 DOM-Elementen mit älter/neuere Navigation; unveränderter 600-Nachrichten-Store | Unit-Test für Grenzen; 600-Nachrichten-Browserfall und Renderbudget von 2500 ms im Testumfeld |
| v1.2 | Volltextsuche indexiert nicht nur sichtbare DOM-Nachrichten, sondern den gesamten lokalen aktiven Chat | E2E findet Nachricht 005 außerhalb der letzten 80 |
| v1.3 | Gespräch, letztes Änderungsdatum, Projektwissen und Nachrichtenrolle kombinierbar | Deterministische Node- und Browser-Filtertests |
| Sicherheit | Keine Migration, Übertragung, automatische Tool-Aktion oder Freigabeänderung | Diff/Privacy Review; Node-Matrix, Chromium und Release-Check auf aktuellem PR-Head |

Danach v1.4: mehrere lokale Projekträume mit gesichertem JSON-Roundtrip; Datenmigration erst mit Tests und Rücksetzpfad. Stable `1.0.0` bleibt durch [Issue #22](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/issues/22) blockiert.

## Roadmap v1.4 · Projekt-Arbeitsräume (in Abnahme)

- Projekte mit ID, Name und bis zu 4000 Zeichen ausschließlich lokaler Notizen; höchstens 40 Projekte.
- Chatzuordnung per Auswahl, Erstellung über nativen Bestätigungsdialog und lokale Filterung.
- Backup-Schema 3: v1/v2 bleiben lesbar; v2-Freigaben erhalten; v1-Freigaben weiterhin widerrufen; Projekt-IDs und Chatreferenzen werden im Roundtrip validiert.
- Private Arbeitsraum-Notizen sind **kein** automatisch erlaubter Modellkontext; chatbezogenes Opt-in bleibt separat.
- Gates: Node 20/22/24, Chromium, Release-Check, echte Screenreader-Abnahme M17, Security-/Migrations-Review. Kein Stable-1.0 ohne Issue #22.

## Roadmap v1.5 · Schema-Migration und Rücksetzpfad

| Gate | Erwarteter Nachweis | Grenze |
| --- | --- | --- |
| Migration | Fixtures für Schemas 1/2/3, deterministische Umwandlung nach 3 | Alte Freigaben v1 nie automatisch aktivieren |
| Private Daten | Schema-3-Projektnotizen nur lokal, Fehlerberichte redigiert | Kein automatischer Modellzugriff |
| Import und Undo | Zwei Projekte inklusive Chats über Backup/Restore/Rücksetzpunkt testen | Fallback localStorage nicht atomar |
| Release | CI-Matrix Node 20/22/24, Browser, reproducible release und manueller Flow M18 | Stable 1.0 durch Issue #22 weiterhin blockiert |

Migrationsmatrix: [docs/schema-migration.md](docs/schema-migration.md). Nächster größerer Entwicklungsblock bleibt v1.6 optionale sichere Backup-Verschlüsselung; diese darf nicht ohne gesondertes Cryptography-Review als fertig gelten.

## Roadmap v1.6 · Lokale Backup-Verschlüsselung

| Änderung | Gate |
| --- | --- |
| AES-256-GCM; PBKDF2-SHA-256, 600.000 Iterationen; neue Salt-/Nonce-Zufallswerte je Export | Falsches Passwort, manipulierte Ciphertexte und wiederholte Exporte automatisiert prüfen |
| Passwortexport und lokaler Import-Unlock vor bisheriger Vorschau | Browser-Roundtrip, Neuladen, Undo; kein stiller Restore und keine Provider-Anfrage |
| Klartext-JSON-Export weiterhin verfügbar, Bestandsdaten bleiben lokal unverschlüsselt | Grenzen in README, Anleitung und Warnhinweisen darstellen |
| Geschütztes Format maximal 4 MiB, Klartext maximal 3 MiB | Malformed-/Oversize-Rejection, no untrusted algorithm or KDF parameters |

**Abnahme:** PR-CI auf finalem Head, Review und manuelle Screenreader-Probe M19 offen. Stable-1.0 bleibt durch Issue #22 gesperrt.

## Roadmap v1.7 · Offline-PWA

| Schritt | Umsetzung | Akzeptanz |
| --- | --- | --- |
| Shell | `manifest.webmanifest`, `service-worker.js`, `src/pwa.js` | Browser-Offline-Roundtrip mit lokalem Notizmodus |
| Sicherheitsgrenzen | Statische GET-Allowlist; keine API, Querys, fremde Origins oder Writes | `tests/offline-shell.test.js` |
| Browser | Offline-Neustart, Chat/Notiz speichern und nach erneutem Laden wiederfinden | `e2e/offline.spec.js` |
| Freigabe | CI auf finalem Commit, Security-Review, Accessibility M20 | Node 20/22/24, Chromium, Release-Gates ohne Bypass |

Stabile 1.0 weiterhin gesperrt durch [Issue #22](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/issues/22).
