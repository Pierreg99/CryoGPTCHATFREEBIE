/* Offline note-mode shell only. Never intercept API, provider or user data requests. */
const CACHE_NAME = "cryo-offline-shell-v1-7-20261024";
const SHELL_FILES = [
  "/index.html",
  "/manifest.webmanifest",
  "/src/app.js",
  "/src/pwa.js",
  "/src/accessibility.js",
  "/src/backup.js",
  "/src/backup-ui.js",
  "/src/encrypted-backup.js",
  "/src/recovery-storage.js",
  "/src/workspace.js",
  "/src/workbench.js",
  "/src/error-center.js",
  "/src/workbench.css",
  "/src/interface-polish.js",
  "/src/icons.js",
  "/src/interface.css",
  "/src/roadmap-ui.js",
  "/src/dialogs.js",
  "/src/agent-flow.js",
  "/src/integrations.js",
  "/src/agent-ui.js",
  "/src/hyperfocus-ui.js",
  "/src/core.js",
  "/src/stream.js",
  "/src/storage.js",
  "/src/styles.css",
  "/assets/logo.svg"
];
const SHELL_PATHS = new Set(["/", ...SHELL_FILES]);
self.addEventListener("install", (event) => {
  // A failed preload must not replace an older, working offline cache.
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES)));
});
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith("cryo-offline-shell-") && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Never capture /api/*, dynamic queries, cross-origin URLs, writes or unknown paths.
  if (url.origin !== self.location.origin || url.search || !SHELL_PATHS.has(url.pathname)) return;
  const key = url.pathname === "/" ? "/index.html" : url.pathname;
  event.respondWith((async () => {
    try {
      const network = await fetch(request);
      if (network.ok && network.type === "basic") {
        // Clone before returning a response to the page.
        const copy = network.clone();
        const save = caches.open(CACHE_NAME).then(cache => cache.put(key, copy)).catch(() => {});
        event.waitUntil(save);
      }
      return network;
    } catch {
      return (await caches.match(key)) || Response.error();
    }
  })());
});
