import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseRoadmap } from "../src/roadmap.mjs";
const source = readFileSync(
  new URL("../docs/roadmap/ROADMAP-100.md", import.meta.url),
  "utf8",
);
test("roadmap API data preserves all 100 deliverables and acceptance gates across ten phases", () => {
  const { phases, milestones } = parseRoadmap(source);
  assert.equal(phases.length, 10);
  assert.equal(milestones.length, 100);
  for (const p of phases)
    assert.equal(milestones.filter((m) => m.phase === p.id).length, 10);
  for (const m of milestones) {
    assert.ok(m.title && m.deliverable && m.acceptance);
    assert.ok(["implemented", "partial", "planned"].includes(m.status));
  }
  assert.equal(
    milestones.find((m) => m.version === "0.6").status,
    "implemented",
  );
  assert.equal(milestones.find((m) => m.version === "0.7").status, "partial");
  assert.equal(milestones.at(-1).status, "planned");
  assert.deepEqual(
    ["implemented", "partial", "planned"].map(
      (status) => milestones.filter((m) => m.status === status).length,
    ),
    [8, 3, 89],
  );
});
test("missing, duplicate or incomplete roadmap entries fail instead of publishing misleading data", () => {
  assert.throws(() =>
    parseRoadmap(
      source.replace("v0.2 · Token-Streaming", "v0.1 · Token-Streaming"),
    ),
  );
  assert.throws(() =>
    parseRoadmap(
      source.replace(
        "**Lieferobjekt:** Chats erstellen",
        "**Unvollständig:** Chats erstellen",
      ),
    ),
  );
  assert.throws(
    () => parseRoadmap(source.replace("Implementiert v0.8", "Ungeprüft v0.8")),
    /Status/,
  );
  assert.throws(
    () => parseRoadmap(source.replace("Implementiert v0.8", "toString v0.8")),
    /Status/,
  );
  assert.throws(() => parseRoadmap(""));
});
