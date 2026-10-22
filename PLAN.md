# PLAN · CryoGPTCHATFREEBIE

Stand: 22. Oktober 2026. Prioritäten sind Planung, keine behaupteten Abschlüsse.

| Priorität | Aufgabe | Abhängigkeit | Akzeptanzkriterium |
| --- | --- | --- | --- |
| P0 | Manuelle WCAG-2.2-AA-Abnahme | reale Assistive Technology und Prüfnachweise | REQUIRED-Gate mit Belegen abgeschlossen |
| P0 | Release-Candidate-Qualität erhalten | Node-/Browser-CI | alle relevanten Checks grün |
| P1 | README und Dokumentationslinks aktuell halten | verifizierte Projektquellen | Links und Statusangaben geprüft |
| P1 | Release-Prozess kontrolliert prüfen | P0-Gates | reproduzierbarer Build und dokumentierte Freigabe |
| P2 | Skill-Registry und Agenten-Workflows erweitern | Sicherheits-Review und Opt-in | Allowlist- und Negativtests vorhanden |

## Reihenfolge

1. Dokumentations-PR prüfen und CI abwarten.
2. Accessibility-Prüfung mit echter assistiver Technik dokumentieren.
3. Offene Befunde beheben und erneut prüfen.
4. Erst nach allen Gates eine stabile Freigabe erwägen.

[Master-Roadmap](docs/roadmap/ROADMAP-100.md) · [Release-Gates](docs/RELEASE-CHECKLIST.md)
