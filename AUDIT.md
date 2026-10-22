# AUDIT · Dokumentations-, CI- und Release-Check

Stand: 22. Oktober 2026.

| Priorität | Prüfung | Verifiziertes Ergebnis | Folgemaßnahme |
| --- | --- | --- | --- |
| P1 | README-Navigation | Sechs lokale SVG-Kacheln, Dashboard und echte Screenshot-Galerie mit [PR #20](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/pull/20) integriert | Nur künftige Änderungen erneut prüfen |
| P1 | Markdown-/Asset-Vertrag | [Dokumentationstests](tests/documentation.test.js) prüfen lokale Links, Anker, zugängliche SVG-Metadaten, Galerie und Details; PR- und Main-CI grün | Bei künftigen Designänderungen Tests mitführen |
| P1 | Release-Gate-Checkboxen | Ungültige `- []`-Checkboxen zu `- [ ]` korrigiert und in Tests abgesichert | Manuelle WCAG-Abnahme weiterhin offen lassen |
| P1 | README-Markdown-Rendering | Kopfbereich HTML-strukturiert, SVG-Kacheln als lokale Links, Details und Mermaid als GitHub-kompatible Blöcke angelegt | Visuelle GitHub-Prüfung bei Layout-Änderungen wiederholen |
| P0 | Manuelle Accessibility | Version `1.0.0-rc.1`; manuelle WCAG-2.2-AA-Abnahme weiterhin ausstehend | Stable-1.0-Release bis zur dokumentierten Abnahme blockieren |
| P1 | CI-Baseline | Main-Lauf nach PR #20 mit Erfolg abgeschlossen | [Lauf 39732254173](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/actions/runs/39732254173); jeden neuen PR separat prüfen |
| P1 | Merge-Politik | Repository meldete `allow_auto_merge=false` | Kein ungeprüfter Merge; CI, PR-Review und GitHub-Regeln beachten |

## Grenzen des Audits

Ein erfolgreicher automatischer Browser-Test ist kein manueller WCAG-Nachweis. Das tatsächliche Rendern von SVG und Mermaid in GitHub sollte im PR kontrolliert werden. Inhalte verlinkter externer Ressourcen und assistive Technologien wurden nicht vollumfänglich getestet.

[README](README.md) · [PLAN](PLAN.md) · [PROGRESS](PROGRESS.md) · [Release-Gates](docs/RELEASE-CHECKLIST.md)
