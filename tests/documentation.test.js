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
