# PLAN · CryoGPTCHATFREEBIE

Stand: 22. Oktober 2026. Prioritäten sind Planungsstände, keine behaupteten Abschlüsse.

## Qualitätsgates

| Priorität | Aufgabe | Abhängigkeit | Akzeptanzkriterium |
| --- | --- | --- | --- |
| P0 | Manuelle WCAG-2.2-AA-Abnahme durchführen | [Issue #22](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/issues/22), reale Assistive Technik, menschliche Prüfung und Nachweise | M01–M10 und X01–X10 dokumentiert; Blocker/Major retested; REQUIRED-Gate erst danach geschlossen |
| P0 | Release-Candidate-Qualität erhalten | Node 20/22/24, Chromium-E2E und Release-Check | alle Pflichtchecks erfolgreich; kein Stable-1.0-Versprechen |
| P1 | README nach Cryo-Workflow-Standard ausbauen | vorhandene Screenshots, GitHub-kompatible SVGs und Linkprüfung | sechs verlinkte Kacheln, Screenshot-Galerie, native Details, Mermaid und funktionierende lokale Links |
| P1 | README-Governance mit CI absichern | Dokumentationstest und prüfbarer PR | Icons, Anker, Gate-Checkboxen und Projekt-Cockpit validiert |
| P1 | Projektunterlagen synchron halten | gesicherte Aussagen aus Commits, PRs, Tests | PLAN / PROGRESS / AUDIT / HANDOFF / HANDOVER aktuell und widerspruchsfrei |
| P2 | Wiederverwendbare README-Bausteine in weiteren Repos | verifiziertes Referenzmuster | Übernahme ohne angenommene Features oder falsche Status-Badges |
| P2 | Skill-/Agenten-Workflows ausbauen | Sicherheitsreview und Opt-in | Allowlist- und Negativtests dokumentiert |

## README-Meilenstein am 22.10.2026

Die README-Gates für das SVG-Dashboard, die Screenshot-Galerie, die Dokumentationstests und die projektübergreifende Governance wurden in [PR #20](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/pull/20) umgesetzt und nach erfolgreichen [Main-CI-Prüfungen](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/actions/runs/39732254173) übernommen. **P0 manuelle WCAG-2.2-AA-Abnahme ist weiter offen.**

## Aktiver P0-Meilenstein

Die manuelle Accessibility-Abnahme ist in [Issue #22](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/issues/22) als Release-Gate operationalisiert. Die Testmatrix und Befundvorlage stehen in [docs/accessibility-report.md](docs/accessibility-report.md). `1.0.0-rc.1` bleibt bestehen, bis die reale AT-Prüfung abgeschlossen und nachgewiesen ist.

## Ablauf für Änderungen

1. Audit der Projektfakten und vorhandenen Artefakte.
2. Änderungen mit prüfbaren Akzeptanzkriterien planen.
3. Feature-Branch und Pull Request verwenden.
4. Dokumentationstest, Node-Matrix, Browser-E2E und Release-Check ausführen.
5. Review- und Merge-Sperren prüfen; nur bei erfolgreichen Gates mergen.
6. Nachweise und Handoff synchronisieren.

[README-Dashboard](README.md#dashboard) · [Workflow-Referenz](https://github.com/Pierreg99/Workflows) · [Master-Roadmap](docs/roadmap/ROADMAP-100.md) · [Release-Gates](docs/RELEASE-CHECKLIST.md)
