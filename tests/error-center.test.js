import test from "node:test";
import assert from "node:assert/strict";
import { normalizeError } from "../src/error-center.js";

test("diagnostics keep scoped context with bounded plain text", () => {
  const item = normalizeError({
    scope: "models",
    title: "  Offline ",
    detail: "<img src=x onerror=alert(1)>" + "x".repeat(500),
  });
  assert.equal(item.scope, "models");
  assert.equal(item.title, "Offline");
  assert.ok(item.detail.startsWith("<img"));
  assert.equal(item.detail.length, 300);
});
test("diagnostics reject arbitrary scopes and use safe fallbacks", () => {
  assert.throws(() => normalizeError({ scope: "../secret", title: "x" }), TypeError);
  assert.deepEqual(normalizeError({ scope: "storage" }), {
    scope: "storage",
    title: "Aktion fehlgeschlagen",
    detail: "Bitte den Vorgang prüfen.",
  });
});
test("diagnostics strip control characters", () => {
  assert.equal(normalizeError({scope: "chat", title: "Oh\nno", detail: "a\rb"}).title, "Oh no");
});
