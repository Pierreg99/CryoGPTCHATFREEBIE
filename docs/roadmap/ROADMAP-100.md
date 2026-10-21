# ❄️ CryoGPTCHATFREEBIE · Master Roadmap mit 100 Meilensteinen

> **Interpretation:** 100 Versionen **v0.1 bis v10.0 in 0.1er-Schritten**. Dies ist eine priorisierbare Produktvision, **kein Versprechen**, 100 Releases zu liefern. Das Versionsraster dient als Navigationshilfe; Release-Tagging folgt echter SemVer- und Qualitätsprüfung, nicht automatisch jeder Zeile.

**Stand der Recherche:** 21. Oktober 2026 · Grundlage: [README](../../README.md), [Node-Server](../../server.mjs), [Chat-Core](../../src/core.js), [GitHub/Skills](../../src/github-integration.mjs), [Modellanbieter](../../src/providers.mjs), [Godot](../../src/godot-mcp-client.mjs), [CI](../../.github/workflows/ci.yml), [Integration](../integrations.md), [Godot-Doku](../integrations/godot-mcp.md), [Modelle und Agenten](../model-providers-and-agents.md) und bereits gemergte PRs #1–#9.

## Status und Leseregeln

- **✅ Bereits im Code / PR-historisch belegt:** v0.1, v0.2, v0.3, v0.4. Das bedeutet **nicht**, dass jede Idee eines alten Alpha-Abschnitts vollständig end-to-end zertifiziert ist.
- **✅ Als MVP in `main`:** v0.5 Hyperfocus wurde über PR #10 gemergt; der zugehörige Lokalisierungs-Test wurde über PR #12 repariert. Live-Browser-E2E und vollständige Produktabnahme bleiben offen.
- **⬜ Zukunftsplanung:** v0.6 bis v10.0. Keine Implementierung, kein zugesagtes Lieferdatum.
- **Abnahmeprinzip:** Jede Version benennt ein konkretes Artefakt und einen **prüfbaren Exit-Gate**. Funktionen mit externem Netzwerk, privaten Daten oder Writes bleiben standardmäßig deaktiviert und erfordern Sicherheitsprüfung sowie ausdrückliche Freigabe.

## Forschungsbefund in Kürze

Der aktuelle lokale Node.js-Workspace startet auf `127.0.0.1`; Chats liegen in IndexedDB mit `localStorage`-Fallback und JSON-Backups. Ollama funktioniert optional; OpenAI ist nur nach serverseitiger Konfiguration und pro Anfrage bestätigter Cloud-Freigabe vorgesehen. Die GitHub-Integration liest nur erlaubte öffentliche Repositories und Skill-Metadaten; Godot-MCP-Projekte werden über festgelegte lokale Pfade mit manueller Tool-Freigabe angesprochen. CI testet Node.js 20 und 22. **Aktuell fehlen unter anderem Browser-E2E, robuste Authentifizierung, verschlüsselter Speicher, autonomes sicheres Schreiben, Multi-User-Betrieb, Sandbox und Live-Godot-E2E.** Sie sind explizit zukünftige Gates.

## Phasenübersicht

| Phase | Versionen | Schwerpunkt | Ergebnisrichtung |
| :--- | :--- | :--- | :--- |
| 1 | v0.1–v1.0 | Fundament und sichere Alpha | Von lokalem Experiment zu klar dokumentiertem Einzelbenutzer-Workspace. |
| 2 | v1.1–v2.0 | Qualität, Stabilität und lokale Erfahrung | Datenbeständigkeit, UX und vorhersagbaren Betrieb etablieren. |
| 3 | v2.1–v3.0 | Wissenssystem und Cryo-Omega-Skills | Eine prüfbare, schlanke Registry statt kopierter Skill-Bestände. |
| 4 | v3.1–v4.0 | Kontrollierte Agenten und Sicherheitsarchitektur | Vom einmaligen Werkzeugaufruf zum inspizierbaren, abbrechbaren Agenten. |
| 5 | v4.1–v5.0 | Entwickler-Workflows und GitHub | Kontrollierte, nachvollziehbare Coding-Assistance statt verdeckter Änderungen. |
| 6 | v5.1–v6.0 | Godot, Spiele und 3D-Pipeline | Sichere Creator-Flows vom Szenenentwurf bis zur exportierbaren Testszene. |
| 7 | v6.1–v7.0 | Multimodalität und Produktoberfläche | Bessere Interaktion bei optionaler, expliziter Medienverarbeitung. |
| 8 | v7.1–v8.0 | Sync und Zusammenarbeit – streng optional | Von lokalem Einzelplatz zu bewusst autorisierten Projekträumen. |
| 9 | v8.1–v9.0 | Ökosystem, Erweiterbarkeit und Governance | Integrationen offen gestalten, ohne Sicherheit oder Herkunft zu verlieren. |
| 10 | v9.1–v10.0 | Skalierung, Vertrauenswürdigkeit und 10.0 | Technisch belastbare und überprüfbare Plattform-Reife – ohne Cloud-Zwang. |

## Alle 100 Versions-Meilensteine

### Phase 1 · Fundament und sichere Alpha (v0.1–v1.0)

Von lokalem Experiment zu klar dokumentiertem Einzelbenutzer-Workspace.

#### ✅ Historisch implementiert v0.1 · Lokales Chat-MVP

**Lieferobjekt:** Chats erstellen, speichern und Ollama optional ansprechen. **Abnahme:** Core- und Server-Smoke-Tests.

#### ✅ Historisch implementiert v0.2 · Token-Streaming

**Lieferobjekt:** Ollama-NDJSON, Abbruch und partielle Antworten integrieren. **Abnahme:** Stream- und Cancel-Tests.

#### ✅ Historisch implementiert v0.3 · Projektwissen

**Lieferobjekt:** IndexedDB-Migration, versionierte Backups und explizites Kontext-Opt-in. **Abnahme:** Migrations- und Opt-in-Tests.

#### ✅ Historisch implementiert v0.4 · Integrationsbasis

**Lieferobjekt:** OpenAI optional, GitHub-Skills lesend, Godot MCP manuell freigeben. **Abnahme:** Allowlist-, MCP- und Provider-Tests.

#### ✅ MVP im Code v0.5 · Hyperfocus-MVP

**Lieferobjekt:** Begrenzte, bestätigte README-/Skill-Recherche mit lokalem Planer. **Abnahme:** Einmal-Ticket, read-only, Abbruch testen.

#### ⬜ Geplant v0.6 · Browser-End-to-End

**Lieferobjekt:** Playwright-Smoke-Flows für Chat, Import, Planfreigabe. **Abnahme:** CI testet Desktop und Mobile-Viewport.

#### ⬜ Geplant v0.7 · Barrierefreiheit

**Lieferobjekt:** Tastaturreihenfolge, Dialoge, Fokusmanagement und Statusmeldungen prüfen. **Abnahme:** WCAG-2.2-AA-Prüfbericht für Kernflows.

#### ⬜ Geplant v0.8 · Backup-Wiederherstellung

**Lieferobjekt:** Export-/Import-Protokoll mit Dry-run, Fehlerbericht und Restore-Wizard. **Abnahme:** Roundtrip mit v1/v2 und beschädigten Daten.

#### ⬜ Geplant v0.9 · Security-Baseline

**Lieferobjekt:** Threat-Model, CSP-Härtung, Origin- und Request-Limits dokumentieren. **Abnahme:** Negative API-Tests und Review-Checkliste.

#### ⬜ Geplant v1.0 · Stabiles 1.0

**Lieferobjekt:** Unterstützte Plattformen, Migrationspolitik und reproduzierbare Releases definieren. **Abnahme:** Release-Checkliste und E2E grün.

### Phase 2 · Qualität, Stabilität und lokale Erfahrung (v1.1–v2.0)

Datenbeständigkeit, UX und vorhersagbaren Betrieb etablieren.

#### ⬜ Geplant v1.1 · Fehlerzentrale

**Lieferobjekt:** Kontextbezogene UI-Fehler und Wiederholungsaktionen bereitstellen. **Abnahme:** Fehlerfälle reproduzierbar sichtbar.

#### ⬜ Geplant v1.2 · Chat-Performance

**Lieferobjekt:** Große Chatverläufe virtuell rendern und Suche optimieren. **Abnahme:** Definierte Latenzbudgets im Browser-Test.

#### ⬜ Geplant v1.3 · Suchfilter

**Lieferobjekt:** Suche nach Chat, Datum, Projekt und Nachrichtenrolle. **Abnahme:** Filterkombinationen deterministisch getestet.

#### ⬜ Geplant v1.4 · Projekt-Arbeitsräume

**Lieferobjekt:** Chats und Notizen mehreren lokalen Projekten zuordnen. **Abnahme:** Import-/Export-Roundtrip mehrerer Projekte.

#### ⬜ Geplant v1.5 · Versionsmigration

**Lieferobjekt:** Dokumentierte Schema-Upgrades mit Rollback-Pfad. **Abnahme:** Fixtures jeder unterstützten Version.

#### ⬜ Geplant v1.6 · Lokalverschlüsselung

**Lieferobjekt:** Optional verschlüsselte Backups mit Passwort-KDF und Warnungen. **Abnahme:** Falsches Passwort und Restore-E2E.

#### ⬜ Geplant v1.7 · Offline-Installierbarkeit

**Lieferobjekt:** Lokale PWA-Shell ohne Cloud-Abhängigkeit für Notizmodus. **Abnahme:** Cold-start/offline Smoke-Test.

#### ⬜ Geplant v1.8 · Modellverwaltung

**Lieferobjekt:** Ollama-Modelle, Erreichbarkeit und Fehlerdiagnose vereinheitlichen. **Abnahme:** Offline-/Timeout-/Modellwechsel-Tests.

#### ⬜ Geplant v1.9 · Release-Automation

**Lieferobjekt:** SemVer-Tags, Changelog und Checksummen automatisieren. **Abnahme:** Repro-Archiv und CI-Artefakt nach Tag.

#### ⬜ Geplant v2.0 · Hardening-Gate

**Lieferobjekt:** UX-, Datenschutz- und Belastungstests zum Release-Gate kombinieren. **Abnahme:** Freigabe nur bei definierter Testmatrix.

### Phase 3 · Wissenssystem und Cryo-Omega-Skills (v2.1–v3.0)

Eine prüfbare, schlanke Registry statt kopierter Skill-Bestände.

#### ⬜ Geplant v2.1 · Skill-Manifest

**Lieferobjekt:** Schema für Slug, Quelle, Version, Lizenz und When-to-use definieren. **Abnahme:** Catalog-Schema-Validierung in CI.

#### ⬜ Geplant v2.2 · Skill-Import

**Lieferobjekt:** Öffentliche erlaubte Skill-Manifeste nur lesend einlesen. **Abnahme:** Ablehnung ungültiger URLs und Typen.

#### ⬜ Geplant v2.3 · Registry-Deduplikation

**Lieferobjekt:** Skills über Quelle+Commit statt Kopien referenzieren. **Abnahme:** Gleiche Version erzeugt nur einen Eintrag.

#### ⬜ Geplant v2.4 · Skill-Discovery

**Lieferobjekt:** Nach Aufgabentyp und when-to-use filtern. **Abnahme:** Treffer nachvollziehbar mit Quelle verlinkt.

#### ⬜ Geplant v2.5 · Relevanzbewertung

**Lieferobjekt:** Deterministische Rangfolge mit erklärten Signalen. **Abnahme:** Goldset-Rankingtest mit Fehlertoleranz.

#### ⬜ Geplant v2.6 · Provenance-Anzeige

**Lieferobjekt:** Commit, Lizenz, Herkunft und Datum je Skill zeigen. **Abnahme:** Quelleninfo für jede Empfehlung sichtbar.

#### ⬜ Geplant v2.7 · Lokaler Dokument-Index

**Lieferobjekt:** Opt-in-Indizierung eigener Textdateien ohne Upload. **Abnahme:** Rebuild/Delete-Tests auf Index.

#### ⬜ Geplant v2.8 · RAG-Quellen

**Lieferobjekt:** Zitierte Auszüge mit Pfad und Abschnitt zuordnen. **Abnahme:** Jede Antwort stützt sich auf Quellenstellen.

#### ⬜ Geplant v2.9 · Wissenskorrektur

**Lieferobjekt:** Falsche Indexeinträge/Quellen gezielt löschen und rebuilden. **Abnahme:** Deletion entfernt Treffer und Cache.

#### ⬜ Geplant v3.0 · Knowledge-Gate

**Lieferobjekt:** Offline-Evaluationssuite für Präzision, Leakage und Injection. **Abnahme:** Akzeptanzwerte dokumentiert und geprüft.

### Phase 4 · Kontrollierte Agenten und Sicherheitsarchitektur (v3.1–v4.0)

Vom einmaligen Werkzeugaufruf zum inspizierbaren, abbrechbaren Agenten.

#### ⬜ Geplant v3.1 · Capability-Modell

**Lieferobjekt:** Rollen für read, draft, write mit deny-by-default definieren. **Abnahme:** Rechte sind serverseitig nicht umgehbar.

#### ⬜ Geplant v3.2 · Plan-Diff

**Lieferobjekt:** Jede geplante Aktion mit Ziel, Daten und Folgen vorab anzeigen. **Abnahme:** Keine Aktion ohne eindeutig genehmigten Scope.

#### ⬜ Geplant v3.3 · Lauf-Protokoll

**Lieferobjekt:** Jeden Schritt und seinen Status in lokalem Journal erfassen. **Abnahme:** Journal bleibt nach Refresh lesbar.

#### ⬜ Geplant v3.4 · Abbruch und Resume

**Lieferobjekt:** Idempotente Fortsetzung nur mit frischer Bestätigung. **Abnahme:** Doppelausführung im Crash-Test ausgeschlossen.

#### ⬜ Geplant v3.5 · Budget-Wächter

**Lieferobjekt:** Tool-, Token-, Zeit- und Request-Budgets festsetzen. **Abnahme:** Budgetüberschreitung stoppt Lauf.

#### ⬜ Geplant v3.6 · Untrusted-Input-Filter

**Lieferobjekt:** Prompt-Injection-Testfälle für Skill-/GitHub-Quellen einführen. **Abnahme:** Tool-Selektion bleibt policy-gesteuert.

#### ⬜ Geplant v3.7 · Sandbox-Design

**Lieferobjekt:** Isolierte Worker und Dateisystem-Grenzen evaluieren. **Abnahme:** Bedrohungsmodell und Escape-Tests.

#### ⬜ Geplant v3.8 · Dry-run-Writes

**Lieferobjekt:** Schreibaktionen zunächst nur als Patch/Vorschau erzeugen. **Abnahme:** Keine Dateimutation im Vorschaupfad.

#### ⬜ Geplant v3.9 · Approval-Ledger

**Lieferobjekt:** Einmal-Freigaben kryptografisch an Inhalt und Ablaufzeit binden. **Abnahme:** Replay- und Tampering-Tests.

#### ⬜ Geplant v4.0 · Agent-Safety-Gate

**Lieferobjekt:** Red-Team-Suite für Prompt-Injection, Scope und Endlosschleifen. **Abnahme:** Kein unfreigegebener Seiteneffekt in Tests.

### Phase 5 · Entwickler-Workflows und GitHub (v4.1–v5.0)

Kontrollierte, nachvollziehbare Coding-Assistance statt verdeckter Änderungen.

#### ⬜ Geplant v4.1 · Repository-Scanner

**Lieferobjekt:** Freigegebene Codebasen read-only strukturiert erfassen. **Abnahme:** Dateimengen und Größen strikt limitiert.

#### ⬜ Geplant v4.2 · Abhängigkeitsübersicht

**Lieferobjekt:** Paket- und Lizenzrisiken lokal visualisieren. **Abnahme:** Ergebnisse referenzieren konkrete Manifestdateien.

#### ⬜ Geplant v4.3 · Change-Proposals

**Lieferobjekt:** Codeänderungen als reine diff-Dateien planen. **Abnahme:** Diff-Prüfung erzeugt keine Writes.

#### ⬜ Geplant v4.4 · Testplan-Generator

**Lieferobjekt:** Tests zu gewünschten Änderungen vorschlagen. **Abnahme:** Jeder Vorschlag mit Prüfschritt.

#### ⬜ Geplant v4.5 · Lokaler Workspace-Adapter

**Lieferobjekt:** Nur ausgewählte Arbeitsordner per Freigabe öffnen. **Abnahme:** Pfad-Traversal und Symlink-Tests.

#### ⬜ Geplant v4.6 · Sandbox-Patch

**Lieferobjekt:** Patch in temporärer Kopie statt Original anwenden. **Abnahme:** Originalvergleich unverändert.

#### ⬜ Geplant v4.7 · Rollback-Workflow

**Lieferobjekt:** Änderungen erst nach Preview mit Rücksetzpunkt erlauben. **Abnahme:** Rollback stellt Bytegleichheit wieder her.

#### ⬜ Geplant v4.8 · GitHub-Entwurf

**Lieferobjekt:** GitHub PR-Entwürfe nur mit eng begrenztem Token/Approval anlegen. **Abnahme:** Keine direkte main-Änderung ohne Freigabe.

#### ⬜ Geplant v4.9 · Review-Assistent

**Lieferobjekt:** CI-Ergebnisse, Diffs und Kommentare zusammenfassen. **Abnahme:** Aussagen durch Checks und Dateien belegbar.

#### ⬜ Geplant v5.0 · DevOps-Sicherheitsgate

**Lieferobjekt:** Least-Privilege, Dependency-Pinning und Supply-Chain-Checks. **Abnahme:** CI und Security-Review bestehen.

### Phase 6 · Godot, Spiele und 3D-Pipeline (v5.1–v6.0)

Sichere Creator-Flows vom Szenenentwurf bis zur exportierbaren Testszene.

#### ⬜ Geplant v5.1 · Godot-Verifikation

**Lieferobjekt:** Echte Godot-Testprojekt-E2E für Inspektion ergänzen. **Abnahme:** Headless-Test gegen gepinnte Godot-Version.

#### ⬜ Geplant v5.2 · Szenentemplates

**Lieferobjekt:** Geprüfte Vorlagen für Node2D, Node3D und Control. **Abnahme:** Jede Szene öffnet ohne Parserfehler.

#### ⬜ Geplant v5.3 · Szenen-Diff

**Lieferobjekt:** Bestehende Szenen nur mit explizitem AST-Diff planen. **Abnahme:** Vorschau verändert keine Projektdatei.

#### ⬜ Geplant v5.4 · Asset-Inventar

**Lieferobjekt:** Projektressourcen und Referenzen nur lesend auflisten. **Abnahme:** Kein fremder Code für Preview nötig.

#### ⬜ Geplant v5.5 · GLB-Validierung

**Lieferobjekt:** Importierte Modelle auf Größe, Format und Assets prüfen. **Abnahme:** Ungültige 3D-Dateien sicher abgefangen.

#### ⬜ Geplant v5.6 · Animations-Vorschau

**Lieferobjekt:** Offline-Preview von Clip-Namen und Rig-Metadaten. **Abnahme:** Kein automatisches Script-Execution.

#### ⬜ Geplant v5.7 · Material-Presets

**Lieferobjekt:** Versionierte Farb-, Neon- und Shader-Vorlagen anbieten. **Abnahme:** Golden-Scene-Vergleich.

#### ⬜ Geplant v5.8 · AR-Mock-Workflow

**Lieferobjekt:** Karten-Scan-Konzept mit synthetischen Testdaten prüfen. **Abnahme:** Kein Upload privater Kamerabilder.

#### ⬜ Geplant v5.9 · Gameplay-Scaffold

**Lieferobjekt:** Godot-Spielprototyp als getrennten Testprojekt-Patch erzeugen. **Abnahme:** Preview, Approval und Rollback vorhanden.

#### ⬜ Geplant v6.0 · Creator-Pipeline-Gate

**Lieferobjekt:** Import, Export, Kompatibilität und Rechte dokumentieren. **Abnahme:** Reproduzierbare Demo mit sauberer Lizenzliste.

### Phase 7 · Multimodalität und Produktoberfläche (v6.1–v7.0)

Bessere Interaktion bei optionaler, expliziter Medienverarbeitung.

#### ⬜ Geplant v6.1 · Design-System

**Lieferobjekt:** Cryo-Neon-Tokens, Komponenten und Kontraststandards kodifizieren. **Abnahme:** UI-Snapshots und Designregeln in CI.

#### ⬜ Geplant v6.2 · Tastatur-Workflow

**Lieferobjekt:** Command-Palette und Shortcuts ohne Fokusfallen. **Abnahme:** Keyboard-only E2E.

#### ⬜ Geplant v6.3 · Lokale Datei-Vorschau

**Lieferobjekt:** Bilder und Text in ausgewählter Sitzung anzeigen. **Abnahme:** Kein automatischer Netzwerktransfer.

#### ⬜ Geplant v6.4 · Bildkontext-Consent

**Lieferobjekt:** Bilddaten nur an ausdrücklich ausgewähltes Modell übermitteln. **Abnahme:** Einzelne Zustimmungen protokolliert.

#### ⬜ Geplant v6.5 · Audio-Aufnahme

**Lieferobjekt:** Opt-in-Mikrofonaufnahme mit klarer Aufbewahrung. **Abnahme:** Löschen entfernt Binärdaten vollständig.

#### ⬜ Geplant v6.6 · Lokale Transkription

**Lieferobjekt:** Optionalen installierten Transkriptionsanbieter integrieren. **Abnahme:** Offline/No-model Verhalten getestet.

#### ⬜ Geplant v6.7 · Multimodales Search

**Lieferobjekt:** Text und Metadaten verbinden ohne Rohmedien offenzulegen. **Abnahme:** Quellenangaben pro Treffer.

#### ⬜ Geplant v6.8 · Storyboard-Ansicht

**Lieferobjekt:** Szenen und Quellen als editierbare Karten strukturieren. **Abnahme:** JSON-Export-/Import-Roundtrip.

#### ⬜ Geplant v6.9 · Medienexport

**Lieferobjekt:** Opt-in-Export als ausgewählte Formate mit Voransicht. **Abnahme:** Kein verstecktes Remote-Publishing.

#### ⬜ Geplant v7.0 · UX-Reife-Gate

**Lieferobjekt:** Barrierefreiheit, Mobilgeräte und Medien-Sicherheit prüfen. **Abnahme:** Dokumentierter Usability- und Security-Test.

### Phase 8 · Sync und Zusammenarbeit – streng optional (v7.1–v8.0)

Von lokalem Einzelplatz zu bewusst autorisierten Projekträumen.

#### ⬜ Geplant v7.1 · Identitätsdesign

**Lieferobjekt:** Auth-Anforderungen und Datenfluss für Multi-User entwerfen. **Abnahme:** Review von Bedrohungsmodell und Datenrechten.

#### ⬜ Geplant v7.2 · Lokale Profile

**Lieferobjekt:** Getrennte Browserprofile/Workspaces sauber isolieren. **Abnahme:** Profilwechsel zeigt keine fremden Daten.

#### ⬜ Geplant v7.3 · Synchronisationsmodell

**Lieferobjekt:** Konfliktfreie, optionale Sync-Schemas prototypisieren. **Abnahme:** Offline-Edit und Merge-Test.

#### ⬜ Geplant v7.4 · Ende-zu-Ende-Krypto-Design

**Lieferobjekt:** E2EE-Schlüsselrotation und Wiederherstellung konzipieren. **Abnahme:** Externe Kryptografieprüfung geplant.

#### ⬜ Geplant v7.5 · Sync-Prototyp

**Lieferobjekt:** Explizit aktivierbaren privaten Sync-Dienst isoliert erproben. **Abnahme:** Standardinstallation sendet keinerlei Daten.

#### ⬜ Geplant v7.6 · Freigaberechte

**Lieferobjekt:** Projektrollen mit Least-Privilege und zeitlicher Befristung. **Abnahme:** Rechte-Entzugstests.

#### ⬜ Geplant v7.7 · Konflikt-UI

**Lieferobjekt:** Dokumente/Chats bei konkurrierenden Änderungen vergleichen. **Abnahme:** Kein stilles Überschreiben.

#### ⬜ Geplant v7.8 · Audit & Export

**Lieferobjekt:** Zugriffe, Rechte und vollständigen Datenexport bereitstellen. **Abnahme:** Portabilitäts-E2E.

#### ⬜ Geplant v7.9 · Einladungsprüfung

**Lieferobjekt:** Ablaufende, einmalige Freigabelinks mit Widerruf. **Abnahme:** Replay- und Link-Leak-Tests.

#### ⬜ Geplant v8.0 · Collaboration-Gate

**Lieferobjekt:** Multi-User-Funktion nur nach unabhängigen Privacy-/Security-Checks. **Abnahme:** Beta-Freigabe nur nach Review.

### Phase 9 · Ökosystem, Erweiterbarkeit und Governance (v8.1–v9.0)

Integrationen offen gestalten, ohne Sicherheit oder Herkunft zu verlieren.

#### ⬜ Geplant v8.1 · Plugin-SDK

**Lieferobjekt:** Manifestschema für klar begrenzte Konnektoren bereitstellen. **Abnahme:** Schema und Beispielintegration versioniert.

#### ⬜ Geplant v8.2 · Capability-Permissions

**Lieferobjekt:** Jede Plugin-Funktion einzeln autorisieren. **Abnahme:** Nicht erlaubte Methoden serverseitig 403.

#### ⬜ Geplant v8.3 · Signierte Artefakte

**Lieferobjekt:** Checksummen/Signaturen für Plugin-Releases überprüfen. **Abnahme:** Manipulierte Pakete werden abgewiesen.

#### ⬜ Geplant v8.4 · Test-Harness

**Lieferobjekt:** Mock-APIs und standardisierte Connector-Tests anbieten. **Abnahme:** Referenzplugin besteht Konformitätstest.

#### ⬜ Geplant v8.5 · Marketplace-Konzept

**Lieferobjekt:** Kuratierte, lokale Plugin-Suche ohne Auto-Installation. **Abnahme:** Kein ausführbarer Code bei bloßer Suche.

#### ⬜ Geplant v8.6 · Migration-Contracts

**Lieferobjekt:** Kompatible Versionierung für Skill-/Plugin-APIs definieren. **Abnahme:** Breaking Changes mit Upgrade-Guide.

#### ⬜ Geplant v8.7 · Enterprise-Schnittstellen

**Lieferobjekt:** Optionale policy-basierte Auth-/Audit-Adapter isolieren. **Abnahme:** Default local-first bleibt unverändert.

#### ⬜ Geplant v8.8 · Governance-Review

**Lieferobjekt:** Sicherheitsmeldungen, Maintainer-Regeln und Responsible Disclosure. **Abnahme:** Policy-Dateien öffentlich überprüfbar.

#### ⬜ Geplant v8.9 · Community-Programm

**Lieferobjekt:** Contributing-Guides, Templates und Beispielprojekte. **Abnahme:** Externe PRs bauen reproduzierbar.

#### ⬜ Geplant v9.0 · Ecosystem-Gate

**Lieferobjekt:** SDK, Plugin-Permissions und Supply Chain auditieren. **Abnahme:** Konformitätssuite öffentlich nachvollziehbar.

### Phase 10 · Skalierung, Vertrauenswürdigkeit und 10.0 (v9.1–v10.0)

Technisch belastbare und überprüfbare Plattform-Reife – ohne Cloud-Zwang.

#### ⬜ Geplant v9.1 · Performance-Budgets

**Lieferobjekt:** Grenzwerte für RAM, CPU, Datenbank und Latenz festlegen. **Abnahme:** Regressions-Benchmarks in CI.

#### ⬜ Geplant v9.2 · Last- und Stresstests

**Lieferobjekt:** Große Projekte, Chats und Dateien systematisch testen. **Abnahme:** Messbare Limits und Degradation dokumentiert.

#### ⬜ Geplant v9.3 · Fault-Injection

**Lieferobjekt:** Netzwerkabbrüche, beschädigte Backups und Provider-Ausfälle simulieren. **Abnahme:** Kein irreversibler Datenverlust im Testszenario.

#### ⬜ Geplant v9.4 · Observability-Privacy

**Lieferobjekt:** Opt-in lokales Diagnosejournal mit Redaction anbieten. **Abnahme:** Secrets/Chat-Inhalte erscheinen nie im Log.

#### ⬜ Geplant v9.5 · Daten-Lifecycle

**Lieferobjekt:** Aufbewahrung, Löschung und Export inkl. Sync-Komponenten prüfen. **Abnahme:** End-to-End-Löschtests.

#### ⬜ Geplant v9.6 · API-Stabilität

**Lieferobjekt:** Öffentliche Schnittstellen versionieren und deprecations planen. **Abnahme:** API-Contract-Tests vollständig.

#### ⬜ Geplant v9.7 · Reproducible Builds

**Lieferobjekt:** Abhängigkeiten, SBOM und signierte Releases ausliefern. **Abnahme:** Build-Vergleich und Provenance-Checks.

#### ⬜ Geplant v9.8 · Security-Audit

**Lieferobjekt:** Unabhängige Prüfung von Agenten, Plugins, Godot und Sync. **Abnahme:** Schwere Befunde vor Release behoben.

#### ⬜ Geplant v9.9 · Release-Candidate

**Lieferobjekt:** Systematische Desktop-/Mobile-/Linux-Matrix und Dokumentation abschließen. **Abnahme:** Kritische Bugs geschlossen, Recovery getestet.

#### ⬜ Geplant v10.0 · Vision 10.0

**Lieferobjekt:** Reifes, modular erweiterbares Local-First-Workspace-Release bereitstellen. **Abnahme:** Qualitäts-, Sicherheits- und Migrations-Gates erfüllt.

## Abhängigkeiten und Sicherheitsgates

1. **Vor neuen Agentenrechten:** v3.1–v4.0 abschließen (Capability-Modell, Prompt-Injection-Tests, Sandboxing, Dry-run und Approval-Ledger). Kein autonomes Schreiben in v0.5.
2. **Vor GitHub-Write:** v4.1–v4.8 nur mit expliziter Repo-Auswahl, minimierten Tokens, Branch-/PR-Workflow und Diff-/Rollback-Prüfung. Keine direkte `main`-Mutation als Default.
3. **Vor Godot-/3D-Automation:** v5.1–v5.3 mit isolierter Testumgebung und echter Godot-E2E-Suite. Externes MCP bleibt ausführbarer Drittcode trotz Tool-Allowlist.
4. **Vor Multimodalität/Sync:** Medien-, Rollen- und Datenschutzmodell dokumentieren. Ohne Opt-in kein Kamera-/Mikrofonzugriff, Upload oder Browser-zu-Cloud-Sync.
5. **Vor 10.0:** reale Qualitätsnachweise, Sicherheitsreviews, Datenmigrationspfade, reproduzierbare Builds und dokumentierte Supportmatrix.

## Jetzt als Nächstes – priorisierter Sprint

| Reihenfolge | Vorhaben | Warum jetzt | Minimaler Akzeptanztest |
| :--- | :--- | :--- | :--- |
| 1 | v0.5 Hyperfocus manuell abnehmen | Das MVP ist gemergt, benötigt aber Browser-/Live-Test | Mock-Tests grün; UI-E2E und Abbruch bei echten Quellen prüfen |
| 2 | v0.6 Browser-E2E | Node-Tests allein erkennen keine defekten UI-Flows | Chat, Agent, Godot und Hyperfocus im echten Browser |
| 3 | v0.7 Zugänglichkeit | Mobile und Tastatur-Fokus vor weiteren Panels stabilisieren | Keyboard-/Screenreader-Review der Kernflows |
| 4 | v0.8 Backup & Restore | Erst Datensicherung, dann künftige Agenten-Funktionalität | v1/v2/defekter Import mit Rücksetztest |
| 5 | v0.9 Threat Model | Fremde GitHub-Dateien/MCP sind nicht vertrauenswürdig | Server-API Negativsuite und Freigabeaudit |

## Messgrößen statt Roadmap-Theater

Jeder Schritt bekommt: verantwortlichen Owner, GitHub-Issue/PR, Risiko, Akzeptanzkriterium, dokumentierte Test-URL und Review-Datum. Ein grüner Unit-Test ist kein Beleg für produktionsreifen autonomen Betrieb. **Keine Release-Daten ohne Kapazitätsplanung.**

Siehe [Recherche- und Quellenprotokoll](RESEARCH.md) für die überprüften Dateien, gesicherte Ist-Funktionen und bewusste Grenzen.
