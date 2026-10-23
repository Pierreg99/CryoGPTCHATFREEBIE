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

## V1.1 · Fehlerzentrale (PR #25, nicht gemergt)

- Neue Diagnosen sind nur im Arbeitsspeicher (maximal 20, ein Eintrag je Bereich) und enthalten keine automatischen Berichte an externe Dienste.
- Diagnoseeinträge werden mit `textContent` dargestellt; Meldungslänge und Bereichsbezeichner sind beschränkt.
- Ein Retry erfordert Nutzerklick. Modell-Retry prüft nur den Status; lokale Speicherung versucht nur den aktuellen Stand erneut zu sichern. Unterbrochene Cloud-Anfragen werden ausdrücklich **nicht** erneut ausgelöst.
- Ein Eintrag bleibt beim erneuten Fehler offen; erfolgreiche Modellstatus-Prüfung oder Speicherung entfernt ihn.
- Neue Node-Tests, Playwright-Browserfälle und manuelle Prüfung M14 sind angelegt. CI-/AT-Ergebnisse dieser Änderung erst am finalen PR-Head bewerten.
- Keine Änderung der Cloud-Zustimmungsgrenzen, des Servers außerhalb der expliziten neuen statischen Modul-URL oder des Release-Gates.
