# Changelog

## 1.0.0-rc.1

- README-Hauptseite und Clean-/Neon-/Produktvarianten auf den aktuellen Stand gebracht; gemeinsame Roadmap mit ausgeschriebenen Statusangaben.
- Emoji-freie Bedienelemente mit lokalen SVG-Icons und verständlichen Texten; Unicode-Inhalte in Chats bleiben erhalten.

Prüfbarer Kandidat für das 1.0-Ziel. Die stabile Freigabe bleibt durch die noch offene manuelle Accessibility-Abnahme blockiert.

- Backup-Dry-run, redigierte Fehlerberichte und expliziter Restore-Assistent für Schema 1/2.
- Atomarer IndexedDB-Rücksetzpunkt, einmaliges Undo und separates Löschen; Schutz vor Quota-Fehlern und veralteten Vorschauen.
- Verwerfen alter Agenten-/Hyperfocus-Freigaben nach Restore; bestehende Fokus-Historie des Rücksetzpunkts bleibt geschützt.
- Persistente, schließbare Meldungen, pausierbare Bewegung und verbesserte Fokus-/Live-Statusführung.
- Zentraler Host-/Origin-/CSP-Schutz, Body-/Zeit-/Modellparallelitätslimits und dokumentiertes Bedrohungsmodell.
- Anwendungsversion aus einer Quelle für HTTP/MCP, reproduzierbare Quellpakete und blockierende Stable-Release-Gates.
- Laufzeit-/Backup-Kompatibilität bleibt erhalten; keine neue npm-Laufzeitabhängigkeit.

## 0.4.0

Historische Alpha-Basis mit lokalem Chat, Streaming, IndexedDB, Projektwissen, optionalen Providern, kontrollierten GitHub-Schritten und Godot MCP. Der anschließend gemergte Cryo-Neon-Workspace und die interaktive 100-Versionen-Roadmap sind Grundlage dieses Kandidaten; Roadmap-Nummern waren keine veröffentlichten Release-Tags.
