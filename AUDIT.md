# AUDIT · Dokumentations-, CI- und Release-Check

Stand: 22. Oktober 2026.

| Priorität | Prüfung | Verifiziertes Ergebnis | Folgemaßnahme |
| --- | --- | --- | --- |
| P1 | README-Navigation | Bisherige README hatte Textlinks und Projektzentrale, aber kein anklickbares SVG-Kachel-Dashboard nach [Cryo-Workflow-Muster](https://github.com/Pierreg99/Workflows) | Sechs lokale SVG-Icons, Dashboard und echte Screenshot-Galerie per PR ergänzen |
| P1 | Markdown-/Asset-Vertrag | [Dokumentationstest](tests/documentation.test.js) kontrolliert lokale Links und Anker und verbietet Emojis in README-Varianten | Neue Icons als SVG-Dateien ohne Emojis; Link- und Dashboard-Tests erweitern |
| P1 | Release-Gate-Checkboxen | Vorher standen zwei Einträge als `- []` statt GitHub-kompatiblem `- [ ]` | Checkbox-Markdown korrigieren und testen |
| P1 | README-Markdown-Rendering | Alte Kopfzeile vermischte Markdown mit einer HTML-`div`-Umgebung | Zentrierten Kopfbereich als HTML strukturieren und GitHub-Rendering kontrollieren |
| P0 | Manuelle Accessibility | Version `1.0.0-rc.1`; manuelle WCAG-2.2-AA-Abnahme weiterhin ausstehend | Stable-1.0-Release bis zur dokumentierten Abnahme blockieren |
| P1 | CI-Baseline | Letzter geprüfter Main-Lauf erfolgreich | [Lauf 39730212438](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/actions/runs/39730212438); jeden neuen PR separat prüfen |
| P1 | Merge-Politik | Repository meldete `allow_auto_merge=false` | Kein ungeprüfter Merge; CI, PR-Review und GitHub-Regeln beachten |

## Grenzen des Audits

Ein erfolgreicher automatischer Browser-Test ist kein manueller WCAG-Nachweis. Das tatsächliche Rendern von SVG und Mermaid in GitHub sollte im PR kontrolliert werden. Inhalte verlinkter externer Ressourcen und assistive Technologien wurden nicht vollumfänglich getestet.

[README](README.md) · [PLAN](PLAN.md) · [PROGRESS](PROGRESS.md) · [Release-Gates](docs/RELEASE-CHECKLIST.md)
