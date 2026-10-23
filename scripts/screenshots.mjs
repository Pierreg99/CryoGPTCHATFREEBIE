import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { mkdir } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

// Fresh browser profile, no live providers, no saved user data or credentials.
const probe = createServer().listen(0, "127.0.0.1");
await once(probe, "listening");
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const root = new URL("../", import.meta.url);
const server = spawn(process.execPath, ["server.mjs"], {
  cwd: root,
  env: {
    ...process.env,
    PORT: String(port),
    OLLAMA_URL: "http://127.0.0.1:9",
    OPENAI_API_KEY: "",
    CRYO_OPENAI_MODELS: "",
    CRYO_GITHUB_REPOS: "",
    GODOT_MCP_ENTRY: "",
    GODOT_PROJECT_PATH: "",
    GODOT_SCENE_WRITES: "false",
    CRYO_LOCAL_WRITES: "false",
  },
  stdio: "ignore",
});
let browser;
try {
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      if ((await fetch(base)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await delay(100);
  }
  if (!ready) throw new Error("Screenshot server did not start.");
  browser = await chromium.launch({
    ...(process.env.CRYO_BROWSER_PATH
      ? { executablePath: process.env.CRYO_BROWSER_PATH }
      : {}),
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1040 },
    reducedMotion: "reduce",
  });
  const output = new URL("../docs/screenshots/", import.meta.url);
  await mkdir(output, { recursive: true });
  const capture = (name) =>
    page.screenshot({
      path: new URL(name + ".png", output).pathname,
      fullPage: true,
    });
  await page.goto(base);
  await page.waitForSelector("#command-open");
  await page.waitForFunction(
    () =>
      document.querySelector("#status").textContent === "Nur lokale Notizen",
  );
  await capture("workspace-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await capture("workspace-mobile");
  await page.setViewportSize({ width: 1440, height: 1040 });
  await page.locator("#command-open").click();
  await capture("commands");
  await page.keyboard.press("Escape");
  for (const [view, file] of [
    ["knowledge", "knowledge"],
    ["focus", "focus"],
    ["agents", "agents"],
    ["skills", "skills"],
    ["godot", "godot"],
    ["models", "models"],
    ["roadmap", "roadmap"],
  ]) {
    await page.goto(base + "/#" + view);
    await page.locator("#view-title").waitFor();
    if (view === "roadmap")
      await page.locator(".roadmap-list button").first().waitFor();
    await capture(file);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await capture("roadmap-mobile");
  await page.goto(base);
  await page.locator("#import-file").setInputFiles({
    name: "example-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        version: 2,
        chats: [],
        activeChatId: null,
        settings: { model: "" },
      }),
    ),
  });
  await page
    .locator("#restore-status")
    .filter({ hasText: "Prüfung abgeschlossen" })
    .waitFor();
  await capture("backup-restore-mobile");
  await page.setViewportSize({ width: 1440, height: 1040 });
  await capture("backup-restore");
  console.log(
    "Captured workbench views in docs/screenshots (offline, fresh profile).",
  );
} finally {
  await browser?.close();
  if (server.exitCode === null && server.signalCode === null) {
    server.kill();
    await once(server, "exit").catch(() => {});
  }
}
