import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("..", import.meta.url));
const readmes = [
  "README.md",
  "docs/readme-variants/01-clean.md",
  "docs/readme-variants/02-neon.md",
  "docs/readme-variants/03-product.md",
];
const read = (file) => readFileSync(path.join(root, file), "utf8");
const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}_\- ]/gu, "")
    .replace(/ /g, "-");
test("all README variants link to existing local files and valid section anchors", () => {
  for (const file of readmes) {
    const source = read(file);
    const links = [
      ...[...source.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]),
      ...[...source.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]),
    ];
    for (const link of links) {
      if (/^[a-z]+:/i.test(link)) continue;
      const [relative, hash] = link.split("#");
      const target = relative
        ? path.resolve(root, path.dirname(file), relative)
        : path.join(root, file);
      assert.ok(existsSync(target), `${file}: missing ${link}`);
      if (hash && target.endsWith(".md")) {
        const anchors = [
          ...readFileSync(target, "utf8").matchAll(/^#{1,6} (.+)$/gm),
        ].map((m) => slug(m[1]));
        assert.ok(anchors.includes(hash), `${file}: unknown anchor ${link}`);
      }
    }
  }
});
test("all README variants describe the current candidate, recovery, storage and common roadmap", () => {
  const { version } = JSON.parse(read("package.json"));
  for (const file of readmes) {
    const source = read(file);
    assert.ok(
      source.includes(version),
      file + ": application version is stale",
    );
    for (const term of [
      "IndexedDB",
      "localStorage",
      "Rücksetzpunkt",
      "ROADMAP-100.md",
      "RELEASE-CHECKLIST.md",
      "manuelle",
      "OpenAI",
      "Godot",
    ])
      assert.ok(source.includes(term), `${file}: missing ${term}`);
    assert.doesNotMatch(source, /\p{Extended_Pictographic}|\uFE0F/u);
    assert.doesNotMatch(
      source,
      /ALPHA 0\.1|Alpha 0\.1|Streaming.*GEPLANT|Browser-E2E.*noch nicht abgedeckt/,
    );
  }
});
test("README artwork matches current storage and release metadata", () => {
  const { version } = JSON.parse(read("package.json"));
  for (const file of ["hero-v2.svg", "architecture-v2.svg"]) {
    const svg = read("assets/readme/" + file);
    assert.ok(svg.includes(version), file + ": stale release label");
    assert.doesNotMatch(
      svg,
      /ALPHA 0\.4|Alpha 0\.4|\p{Extended_Pictographic}|\uFE0F/u,
    );
  }
  assert.match(read("assets/readme/architecture.svg"), /IndexedDB/);
});

test("README workflow dashboard is navigable with local accessible SVG icons", () => {
  const source = read("README.md");
  assert.match(source, /^## Dashboard$/m);
  const targets = new Map([
    ["start", "schnellstart"],
    ["features", "funktionen"],
    ["gallery", "oberflächen-galerie"],
    ["architecture", "systemarchitektur"],
    ["security", "datenschutz-und-grenzen"],
    ["roadmap", "roadmap"],
  ]);
  for (const [icon, anchor] of targets) {
    const file = "assets/readme/icons/" + icon + ".svg";
    assert.ok(existsSync(path.join(root, file)), file + ": missing icon");
    const markup = read(file);
    assert.match(markup, /<svg\s/);
    assert.match(markup, /<title\s+id="title">/);
    assert.match(markup, /<desc\s+id="desc">/);
    assert.doesNotMatch(markup, /<script|onload=|javascript:/i);
    assert.ok(
      source.includes('href="#' + anchor + '"><img src="' + file + '"'),
      file + ": tile does not link to its destination",
    );
  }
  assert.match(source, /^## Projektzentrale$/m);
  assert.match(source, /^## README und Release Workflow$/m);
  for (const file of ["PLAN.md", "PROGRESS.md", "AUDIT.md", "HANDOFF.md", "HANDOVER.md"]) {
    assert.ok(source.includes("](" + file + ")"), file + ": missing project governance link");
  }
});

test("README gallery shows versioned screenshots and correctly structured release gates", () => {
  const source = read("README.md");
  assert.match(source, /^## Oberflächen-Galerie$/m);
  for (const name of [
    "workspace-desktop.png",
    "workspace-mobile.png",
    "models.png",
    "skills.png",
    "roadmap.png",
    "backup-restore.png",
  ]) {
    const file = "docs/screenshots/" + name;
    assert.ok(existsSync(path.join(root, file)), file + ": screenshot missing");
    assert.ok(source.includes('src="' + file + '"'), file + ": not rendered in gallery");
  }
  assert.equal(
    [...source.matchAll(/^<details>$/gm)].length,
    [...source.matchAll(/^<\/details>$/gm)].length,
    "README detail sections must be balanced",
  );
  assert.doesNotMatch(source, /^- \[\] /m, "invalid task-list checkbox syntax");
  assert.match(source, /^- \[ \] Manuelle WCAG-2\.2-AA-Abnahme/m);
  assert.match(source, /^- \[ \] Stabile Version 1\.0/m);
  assert.match(source, /Auto-Merge ist für dieses Repository derzeit \*\*nicht aktiviert\*\*/);
});
