// Browser-only progressive enhancement: never require service workers for the app.
export async function registerOfflineShell({ navigatorObject = globalThis.navigator, locationObject = globalThis.location } = {}) {
  const serviceWorker = navigatorObject?.serviceWorker;
  const local = locationObject?.hostname === "127.0.0.1";
  if (!serviceWorker || !(local || locationObject?.protocol === "https:")) return false;
  try {
    await serviceWorker.register("/service-worker.js", { scope: "/" });
    return true;
  } catch {
    // Browser settings can block PWA installation. The live local app stays usable.
    return false;
  }
}
