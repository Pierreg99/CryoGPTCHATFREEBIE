# Security-Baseline · Roadmap v0.9

## Einsatzgrenze

Die App läuft als lokaler Einzelbenutzer-Prozess ausschließlich auf `127.0.0.1`. Sie bietet keine Anmeldung, Benutzertrennung, Prozesssandbox oder sichere öffentliche Bereitstellung. Ein anderer Prozess oder Benutzer mit Zugriff auf das lokale Konto kann Browser-/Dateisystemdaten und Serverkonfiguration erreichen. Das ist keine Multi-User-Sicherheitsgrenze.

Schützenswerte Daten sind Chat-/Projektnotizen und Backups, serverseitige Provider-/GitHub-Schlüssel, lokale Ausgabeordner und ausdrücklich konfigurierte Godot-Projekte. Externe README-/Skill-Texte und MCP-Antworten sind Daten, keine privilegierten Anweisungen.

## Grenzen und Maßnahmen

| Angriff / Fehler | Maßnahme und Test |
| --- | --- |
| DNS-Rebinding / fremder Host | HTTP-Host muss exakt `127.0.0.1:PORT` sein. Absolute Fremd-URLs werden abgewiesen. Browser-/Raw-HTTP-Negativtests in `tests/security.test.js`. |
| Fremde Browser-Anfragen | Fremder/undurchsichtiger Origin und widersprüchliche Fetch-Metadata werden bei API-POST vor dem Routing abgewiesen. Browser-JSON verlangt passenden Ursprung. |
| Historische lokale CLI | Chat und lesende Agenten behalten den dokumentierten lokalen CLI-Pfad ohne Origin/Fetch-Metadata. Godot, Hyperfocus und Agenten-Schreiben verlangen weiterhin expliziten kanonischen Origin. Das ist keine Authentifizierung lokaler Programme. |
| XSS / Clickjacking | Content-Security-Policy ohne Inline-Skripte, fremde Verbindungen oder eingebettete Frames; frame-ancestors none, X-Frame-Options DENY, nosniff und Same-Origin-CORP/COOP. Texte werden als Text eingefügt. |
| Unbeabsichtigte Gerätefreigabe | Kamera, Mikrofon und Standort sind per Permissions-Policy deaktiviert. Künftige Medienfeatures benötigen eine gesonderte Änderung. |
| Überlast / große Eingaben | Maximal 200.000 HTTP-Body-Bytes, Content-Length-Vorabprüfung, 15 s Request-/10 s Header-Timeout, 64 Header. Höchstens zwei aktive Modellanfragen, ein Hyperfocus-Lauf und zwei Godot-Prozesse. Vorhandene Modell-/Stream-/Planlimits bleiben aktiv. |
| Beliebige Dateien / URLs | Statische Dateien haben eine explizite Allowlist; GitHub-Reads nutzen festen API-Host und freigegebene Repositories. Lokale Writes erlauben neue Markdown-Dateien im festgelegten Linux-Ausgabeordner. |
| Ungeprüfte Schreibaktionen | Default aus, begrenzte Repositories und serverseitiger Token, vollständige Vorschau, kurzlebiges gebundenes Ticket, neue Branches und PRs; kein Merge aus Produkt-Agenten. |
| Veraltete oder doppelte Freigabe | Einmal-Tickets, Kontext-/Inhaltsprüfung und GitHub-Commit-/Branch-Abgleich. Ein Restore verwirft alte Browser-Vorschauen. |
| Backup-Verlust | Vorschau, redigierter Bericht, ausdrückliche Bestätigung und atomarer IndexedDB-Rücksetzpunkt. Quota-/Konfliktfälle werden negativ geprüft. |

Die Obergrenze für den HTTP-Body schließt JSON-Escaping ein und kann kleiner sein als die theoretische Summe aller einzelnen Textfeldlimits. Oversize-Content-Length wird mit 413 abgewiesen; chunked Übergröße wird beim Lesen beendet. Es gibt keinen unbegrenzten generischen Proxy oder Shell-Endpunkt.

## Restrisiken

Browser-Speicher und Exporte sind unverschlüsselt. Öffentliche GitHub-APIs können Rate-Limits erreichen. Ein ausdrücklich gestartetes externes MCP-Programm ist ausführbarer Fremdcode und wird durch die Werkzeug-Allowlist nicht isoliert. Ein lokaler GitHub-/Provider-Token muss außerhalb des Repositories verwaltet und minimal berechtigt sein. Einen bereits angelegten Branch oder eine externe Datei löscht ein fehlgeschlagener Folgeaufruf nicht automatisch.

Diese Baseline und negative Tests sind kein unabhängiger Penetrationstest. Sandbox, Multi-User-/Sync-Rechte, vollständiges Approval-Journal und externe Audits gehören weiterhin zu ihren eigenen Roadmap-Gates.

## Review-Checkliste

- [x] Zulässige Hosts, Browser-Origin und CLI-Ausnahme sind ausdrücklich dokumentiert und getestet.
- [x] Alle API-Schreib-/Toolwege bleiben begrenzt; keine neue Shell oder freie Tool-Selektion.
- [x] CSP/Frame-/Gerätegrenzen sind zentral definiert und über HTTP geprüft.
- [x] Body-/Zeit-/Parallelitätslimits liegen vor Upstream-Seiteneffekten.
- [x] Rücksetz-/Fehlerberichte enthalten keine Chattexte oder Schlüssel.
- [x] Replay, Traversal, geänderte Vorschau, Quota und konkurrierende Daten sind in negativen Tests vertreten.
