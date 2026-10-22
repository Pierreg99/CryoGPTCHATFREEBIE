# AUDIT · Dokumentations- und Release-Check

Stand: 22. Oktober 2026.

| Prüfung | Ergebnis | Maßnahme |
| --- | --- | --- |
| README-Designassets | SVG-Hero und drei Designvarianten vorhanden | Weiterverwenden statt neue Behauptungen |
| GitHub-CI | Workflows für Tests und Release vorhanden | Laufstatus über Actions verifizieren |
| Release-Reife | 1.0.0-rc.1; manuelle Accessibility-Abnahme offen | Keine stabile Freigabe vortäuschen |
| Produktgrenzen | Keine öffentliche Multiuser-/Cloud-Sync-Freigabe | Sicherheitsgrenzen prominent dokumentieren |
| Automerge | Repository-Automerge nicht als aktiv voraussetzen | PR nur nach Review und grünen Checks mergen |

## Nächste Prüfung

README-Links und Mermaid-Rendering in GitHub kontrollieren, CI auf dem Dokumentations-PR prüfen und anschließend die Accessibility-Gates abarbeiten.
