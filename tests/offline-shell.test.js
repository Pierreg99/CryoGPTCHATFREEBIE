import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { registerOfflineShell } from "../src/pwa.js";

const workerSource = readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");
const manifest = JSON.parse(readFileSync(new URL("../manifest.webmanifest", import.meta.url), "utf8"));
const server = readFileSync(new URL("../server.mjs", import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("v1.7 offline manifest and every precached file use the static server allowlist", () => {
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.icons.length);
  assert.match(html, /rel="manifest" href="\/manifest.webmanifest"/);
  assert.match(server, /"\.webmanifest": "application\/manifest\+json/);
  const all = workerSource.match(/const SHELL_FILES = (\[[\s\S]*?\]);/);
  assert.ok(all);
  const files = JSON.parse(all[1]);
  assert.equal(new Set(files).size, files.length);
  assert.ok(files.includes("/index.html"));
  assert.ok(files.includes("/src/app.js"));
  for (const file of files) {
    assert.doesNotMatch(file, /\/api\/|\?|\#/);
    assert.ok(server.includes(JSON.stringify(file)), "Not in static allowlist: " + file);
  }
});
test("v1.7 service worker ignores API, writes, search params and cross-origin URLs", () => {
  const handlers = {};
  vm.runInNewContext(workerSource, {
    self: { location: { origin: "http://127.0.0.1:4173" },
      addEventListener: (name, fn) => { handlers[name] = fn; } },
    URL, Set, fetch: async () => ({ ok: false }),
  });
  assert.equal(typeof handlers.fetch, "function");
  const cases = [
    ["http://127.0.0.1:4173/api/status", "GET"],
    ["http://127.0.0.1:4173/api/chat", "POST"],
    ["http://127.0.0.1:4173/src/app.js?token=private", "GET"],
    ["http://127.0.0.1:4173/private-notes.json", "GET"],
    ["https://example.net/index.html", "GET"],
    ["http://127.0.0.1:4173/", "POST"],
  ];
  for (const [url, method] of cases) {
    let intercepted = false;
    handlers.fetch({ request: { url, method }, respondWith: () => { intercepted = true; } });
    assert.equal(intercepted, false, method + " " + url);
  }
  let intercepted = false;
  handlers.fetch({ request: { url: "http://127.0.0.1:4173/", method: "GET" },
    respondWith: () => { intercepted = true; } });
  assert.equal(intercepted, true);
});
test("v1.7 worker registration is optional and limited to secure/loopback origins", async () => {
  const paths = [];
  const nav = { serviceWorker: { register: async (...args) => { paths.push(args); } } };
  assert.equal(await registerOfflineShell({ navigatorObject: nav,
    locationObject: { hostname: "evil.example", protocol: "http:" } }), false);
  assert.equal(paths.length, 0);
  assert.equal(await registerOfflineShell({ navigatorObject: nav,
    locationObject: { hostname: "127.0.0.1", protocol: "http:" } }), true);
  assert.deepEqual(paths[0], ["/service-worker.js", { scope: "/" }]);
  assert.equal(await registerOfflineShell({ navigatorObject: {}, locationObject: {} }), false);
  assert.equal(await registerOfflineShell({ navigatorObject: {
    serviceWorker: { register: async () => { throw new Error("Denied"); } }
  }, locationObject: { hostname: "127.0.0.1", protocol: "http:" } }), false);
});
