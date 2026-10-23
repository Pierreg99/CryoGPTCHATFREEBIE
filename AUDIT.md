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
