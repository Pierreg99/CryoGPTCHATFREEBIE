# AUDIT · Workbench-Überarbeitung

Stand: 23. Oktober 2026.

| Prüfung | Ergebnis / Nachweis | Grenze |
| --- | --- | --- |
| Darstellung | Desktop- und Mobilansichten im Chromium erfasst und visuell geprüft; neue SVG-Illustration passt zum Workbench | [Aktuelle Screenshots](docs/screenshots/) |
| Neue Interaktionen | Sieben Browser-Tests für Befehlssuche, reale Statistiken, Entwürfe, Nachrichtensuche, Fokus und responsive Dialoge | [Tests](e2e/workbench.spec.js) |
| Bestehende Flows | Gesamte Browser-Suite prüft weiterhin Chat/Streaming, Modelle, Agenten, Skills, Roadmap und Backup/Undo | Externe Provider und Godot simuliert |
| Statische Auslieferung | Nur zwei neue Dateien zur expliziten Allowlist ergänzt | Keine allgemeine Verzeichnisfreigabe |
| Daten und Sicherheit | Suchtext bleibt im Speicher; Fokuspräferenz ohne Chatinhalt in localStorage; Nachrichten bleiben Text; bestehende Berechtigungsgrenzen weiter aktiv | [Workbench-Datenmodell](docs/workbench-overhaul.md#daten-und-zustand) |
| Dokumentation | README, Changelog, Screenshots und Übergaben aktualisiert; lokale Links und SVG-Struktur durch Node-Tests geprüft | GitHub-Rendering zusätzlich im PR kontrollieren |
| Manuelle Accessibility | Neue Fälle M11–M13 aufgenommen, noch kein positiver manueller AT-Nachweis | [Issue #22](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/issues/22) blockiert Stable-1.0 |
| CSS-Architektur | Neue Shell-Schicht mit zentralen Tokens; fachliche Komponenten bleiben in bisherigen Dateien | Historische CSS-Schichten noch nicht vollständig konsolidiert |

Lokale Testumgebung und Reproduktionsbefehle: [Workbench-Prüfbericht](docs/workbench-overhaul.md). PR-CI und Merge-Status müssen getrennt am konkreten Commit geprüft werden.

## V1.1 · Fehlerzentrale (PR #25 integriert; PR #26 repariert CI-Assertion)

- Neue Diagnosen sind nur im Arbeitsspeicher (maximal 20, ein Eintrag je Bereich) und enthalten keine automatischen Berichte an externe Dienste.
- Diagnoseeinträge werden mit `textContent` dargestellt; Meldungslänge und Bereichsbezeichner sind beschränkt.
- Ein Retry erfordert Nutzerklick. Modell-Retry prüft nur den Status; lokale Speicherung versucht nur den aktuellen Stand erneut zu sichern. Unterbrochene Cloud-Anfragen werden ausdrücklich **nicht** erneut ausgelöst.
- Ein Eintrag bleibt beim erneuten Fehler offen; erfolgreiche Modellstatus-Prüfung oder Speicherung entfernt ihn.
- Neue Node-Tests, Playwright-Browserfälle und manuelle Prüfung M14 sind angelegt. Der initiale `main`-Lauf nach PR #25 scheiterte an einer veralteten Roadmap-Zählung. PR #26 passt die Erwartung auf 8 implementiert / 4 teilweise / 88 geplant an. CI-/AT-Ergebnisse erst am finalen Fix-PR-Head bewerten.
- Keine Änderung der Cloud-Zustimmungsgrenzen, des Servers außerhalb der expliziten neuen statischen Modul-URL oder des Release-Gates.

## Roadmap v1.2/v1.3 · Branch-Prüfpunkte

- Review-Nachbesserung: Zeitzonen-Offsets werden beim Datumsfilter erst nach UTC konvertiert, Restore derselben Chat-ID invalidiert das sichtbare Fenster anhand der Nachrichtenarray-Identität, und Paging gibt den Tastaturfokus auf einen verfügbaren Nachfolgebutton zurück. Regressionstests decken alle drei Verhalten ab.
- Der vollständige Chatverlauf bleibt mit bis zu 600 Nachrichten in IndexedDB/Backup; nur die angezeigte Seite ist auf 80 DOM-Nachrichten begrenzt. Der Seitenwechsel erfolgt bewusst über beschriftete Buttons, keine unsichtbare Scrollmagie.
- Die Gesprächssuche verwendet das vollständige lokale Nachrichtenarray, nicht nur die aktuell gerenderten `article`-Elemente. Treffer außerhalb des Fensters steuern die aktuelle Nachrichtenansicht.
- Seitenleistenfilter verarbeiten ausschließlich vorhandene Daten (`title`, `updatedAt`, `projectContext`, `role` und Nachrichteninhalt). Projektwissen bleibt privat und löst kein Opt-in aus.
- Alle Texte werden weiterhin über `textContent` oder `Option` erstellt; Datum ist als UTC-ISO-Tag aus `updatedAt` definiert.
- Performance-Budget des Browser-Testfalls: `<= 80` sichtbare Nachrichten und maximal 2500 ms für einen Seitenwechsel mit 600 gespeicherten Nachrichten auf dem CI-Chromium. Ein bestandener automatischer Test beweist noch keine unabhängige AT-Abnahme.
- Bestehende Freigabe-, Backup-, Netzwerk- und Stabilitäts-Gates nicht ändern. PR-Checks auf dem finalen Head und reale AT-Fälle M15–M16 bleiben separate Gates.

## Roadmap v1.4 · Daten- und Freigabeaudit

- Schema `VERSION=3`: höchstens 40 Projekte mit ID, Name und bis zu 4000 Zeichen Notizen; Schemas 1/2 werden nach 3 migriert.
- Nur gültige Projekt-IDs zuordnen; Duplikate, verwaiste Zuordnungen, zu lange Inhalte und fehlende Pflichtfelder im Backup abweisen. Import erfordert weiterhin Vorschau und ausdrückliche Bestätigung.
- Nur chatbezogenes `shareProjectContext` kann Modellkontext freigeben. Neue Projekt-Arbeitsraum-Notizen bleiben immer lokal.
- Alte Clients mit Schema 2 können Schema-3-Backups nicht direkt lesen; vor Upgrade alten Export sichern. Kein automatischer Downgrade.
- Unit-/Browser-Fälle und manuelle WCAG-Matrix M17 ergänzt. Gates erst nach grünem finalem PR-Head als bestanden bezeichnen.

- Follow-up CodeAnt review: ISO-Zeitstempel ohne Offset werden bei der Datumssuche ausdrücklich als UTC behandelt. Tastatur-Paging überträgt den Fokus zum Nachfolgebutton; Pointer-Paging verzichtet auf zwangsweises Fokussieren und positioniert die neue Seite kontrolliert. Node-/Playwright-Regressionen ergänzt.

- Review-Fix v1.4: Änderungsdatum wird bei geänderter Projektzuordnung aktualisiert, nicht bei idempotenter Wahl. Ungespeicherte lokale Notizen werden projektweise im Sitzungs-Memory vorgehalten und bei Import/Rücksetzung verworfen; niemals ungefragt in Modellkontext übertragen. Unit-/Browser-Regressionen ergänzt.

## v1.5 · Migrationsreview

- Keine Laufzeit-Datenbankmigration hinzugefügt; statt dessen bestehende Parser-/Restore-Gates mit synthetischen Fixtures für Schemas 1, 2, 3 regressionstesten. `tests/schema-migration.test.js` ist Bestandteil von `npm test`.
- Die App verwirft weiterhin unzulässige Fremd-/Zukunftsversionen und verwaiste Projektzuordnungen. Fehlerberichte bleiben ohne Notiz- und Nachrichteninhalte.
- Wiederherstellung (v3→v2-fixture→v3-Rücksetzpunkt) prüft Projekte/Chat-Zuordnungen. Quell-Backup vor einem Upgrade bleibt notwendig, denn ein alter v2-Client kann das neue v3-Format nicht direkt lesen.
- Die Fixture-Daten sind künstlich. Keine tatsächlichen Nutzerbackups oder Live-Cloud-Provider im CI; manueller Browser-/Screenreader-Test M18 ausstehend.
