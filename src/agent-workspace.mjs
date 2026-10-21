import { constants } from "node:fs";
import { open, realpath, lstat } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { configuredRepositories } from "./github-integration.mjs";

const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
export function markdownPath(value) {
  if (
    typeof value !== "string" ||
    value.length > 160 ||
    !/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\.md$/.test(value)
  )
    fail("Nur relative Markdown-Pfade ohne Sondersegmente sind erlaubt.");
  return value;
}
export function validateWrite(input, env = process.env) {
  if (!input || !["local", "github"].includes(input.target))
    fail("Unbekanntes Schreibziel.");
  markdownPath(input.path);
  if (
    typeof input.content !== "string" ||
    !input.content.trim() ||
    Buffer.byteLength(input.content) > 100 * 1024 ||
    input.content.includes("\0")
  )
    fail("Markdown muss 1 bis 100 KiB UTF-8-Text enthalten.");
  if (input.target === "local") {
    if (process.platform !== "linux")
      fail(
        "Lokale Schreibausgabe benötigt Linux; GitHub-Ausgabe bleibt verfügbar.",
        503,
      );
    if (env.CRYO_LOCAL_WRITES !== "true" || !env.CRYO_OUTPUT_DIR)
      fail("Lokale Ausgabe ist deaktiviert.", 503);
    if (input.path.includes("/"))
      fail("Lokale Ausgabe erlaubt nur Dateinamen im Ausgabeordner.");
  } else {
    if (env.CRYO_GITHUB_WRITES !== "true" || !env.CRYO_GITHUB_TOKEN)
      fail("GitHub-Schreiben ist deaktiviert.", 503);
    if (
      !configuredRepositories(env.CRYO_GITHUB_WRITE_REPOS || "").includes(
        input.repo,
      )
    )
      fail("Schreib-Repository nicht freigegeben.", 403);
  }
  return {
    target: input.target,
    path: input.path,
    content: input.content,
    ...(input.target === "github" ? { repo: input.repo } : {}),
  };
}
export function createWriteService({
  env = process.env,
  fetchImpl = fetch,
  now = Date.now,
} = {}) {
  const plans = new Map();
  async function github(route, method = "GET", body) {
    const response = await fetchImpl("https://api.github.com/repos/" + route, {
      method,
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer " + env.CRYO_GITHUB_TOKEN,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (response.status === 404 && method === "GET") return null;
    if (!response.ok)
      fail(
        "GitHub-Schritt fehlgeschlagen (HTTP " + response.status + ").",
        502,
      );
    return response.json();
  }
  async function localRoot() {
    const root = path.resolve(env.CRYO_OUTPUT_DIR);
    if ((await lstat(root)).isSymbolicLink() || (await realpath(root)) !== root)
      fail("Ausgabeordner darf keine Symlinks enthalten.", 403);
    return root;
  }
  async function prepare(input) {
    const plan = validateWrite(input, env);
    if (plan.target === "local") {
      const root = await localRoot();
      try {
        await lstat(path.join(root, plan.path));
        fail("Datei existiert bereits.", 409);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      plan.root = root;
      const rootInfo = await lstat(root);
      plan.rootDev = rootInfo.dev;
      plan.rootIno = rootInfo.ino;
    } else {
      const repo = await github(plan.repo);
      if (!repo?.default_branch || repo.private)
        fail("Nur öffentliche konfigurierte Repositories sind erlaubt.", 403);
      plan.base = repo.default_branch;
      const ref = await github(
        plan.repo + "/git/ref/heads/" + encodeURIComponent(plan.base),
      );
      if (!ref?.object?.sha) fail("Basisbranch fehlt.", 409);
      plan.baseSha = ref.object.sha;
      const old = await github(
        plan.repo +
          "/contents/" +
          plan.path +
          "?ref=" +
          encodeURIComponent(plan.base),
      );
      if (
        old &&
        (old.type !== "file" ||
          old.encoding !== "base64" ||
          old.size > 100 * 1024)
      )
        fail("Ausgangsdatei nicht unterstützt.", 422);
      plan.oldSha = old?.sha || null;
      plan.before = old
        ? new TextDecoder("utf-8", { fatal: true }).decode(
            Buffer.from(old.content, "base64"),
          )
        : "";
    }
    if (plan.target === "github" && plan.before === plan.content)
      fail("Keine Änderungen gegenüber der Ausgangsdatei.", 409);
    for (const [key, p] of plans) if (p.expiresAt <= now()) plans.delete(key);
    if (plans.size >= 25) fail("Zu viele offene Schreibvorschauen.", 429);
    const ticket = randomBytes(24).toString("hex");
    const expiresAt = now() + 120000;
    plans.set(ticket, { ...plan, expiresAt, state: "ready", progress: {} });
    return {
      ticket,
      expiresAt,
      target: plan.target,
      path: plan.path,
      repo: plan.repo,
      before: plan.before || "",
      after: plan.content,
      baseSha: plan.baseSha,
    };
  }
  async function execute(ticket) {
    const plan = typeof ticket === "string" && plans.get(ticket);
    if (
      !plan ||
      plan.expiresAt <= now() ||
      plan.state === "done" ||
      plan.state === "busy"
    )
      fail("Freigabe abgelaufen, verwendet oder in Bearbeitung.", 409);
    validateWrite(plan, env);
    plan.state = "busy";
    try {
      if (plan.target === "local") {
        if ((await localRoot()) !== plan.root)
          fail("Ausgabeordner geändert.", 409);
        // Pin the directory inode: pathname replacement cannot redirect this write.
        const directory = await open(
          plan.root,
          constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW,
        );
        try {
          const info = await directory.stat();
          if (info.dev !== plan.rootDev || info.ino !== plan.rootIno)
            fail("Ausgabeordner ersetzt. Neue Vorschau erforderlich.", 409);
          const file = await open(
            "/proc/self/fd/" + directory.fd + "/" + plan.path,
            constants.O_WRONLY |
              constants.O_CREAT |
              constants.O_EXCL |
              constants.O_NOFOLLOW,
            0o600,
          );
          try {
            await file.writeFile(plan.content, "utf8");
            await file.sync();
          } finally {
            await file.close();
          }
        } finally {
          await directory.close();
        }
        plan.state = "done";
        return { path: plan.path, target: "local" };
      }
      const progress = plan.progress;
      if (!progress.branch) {
        const ref = await github(
          plan.repo + "/git/ref/heads/" + encodeURIComponent(plan.base),
        );
        if (ref?.object?.sha !== plan.baseSha)
          fail("Basisbranch geändert. Neue Vorschau erforderlich.", 409);
        progress.branch = "cryo/markdown-" + randomBytes(10).toString("hex");
      }
      if (!progress.branchCreated) {
        // Reconcile an ambiguous response before creating anything again.
        const existing = await github(
          plan.repo + "/git/ref/heads/" + encodeURIComponent(progress.branch),
        );
        if (existing && existing.object.sha !== plan.baseSha)
          fail("Unerwarteter Branchzustand.", 409);
        if (!existing)
          await github(plan.repo + "/git/refs", "POST", {
            ref: "refs/heads/" + progress.branch,
            sha: plan.baseSha,
          });
        progress.branchCreated = true;
      }
      if (!progress.commit) {
        const current = await github(
          plan.repo +
            "/contents/" +
            plan.path +
            "?ref=" +
            encodeURIComponent(progress.branch),
        );
        if (
          current?.encoding === "base64" &&
          Buffer.from(current.content, "base64").toString("utf8") ===
            plan.content
        )
          progress.commit = true;
        else {
          if ((current?.sha || null) !== plan.oldSha)
            fail("Ausgangsdatei geändert. Neue Vorschau erforderlich.", 409);
          const result = await github(
            plan.repo + "/contents/" + plan.path,
            "PUT",
            {
              message: "docs: add reviewed Cryo agent output",
              content: Buffer.from(plan.content).toString("base64"),
              branch: progress.branch,
              ...(plan.oldSha ? { sha: plan.oldSha } : {}),
            },
          );
          progress.commit = result.commit?.sha || true;
        }
      }
      // A retry must never open a PR containing changes made by another actor.
      const head = await github(
        plan.repo + "/git/ref/heads/" + encodeURIComponent(progress.branch),
      );
      const headSha = head?.object?.sha;
      if (
        !headSha ||
        (typeof progress.commit === "string" && progress.commit !== headSha)
      )
        fail("Branch nach Freigabe geändert. Neue Vorschau erforderlich.", 409);
      const comparison = await github(
        plan.repo + "/compare/" + plan.baseSha + "..." + headSha,
      );
      if (
        comparison?.ahead_by !== 1 ||
        comparison.total_commits !== 1 ||
        comparison.files?.length !== 1 ||
        comparison.files[0].filename !== plan.path ||
        !["added", "modified"].includes(comparison.files[0].status)
      )
        fail(
          "Branch enthält ungeprüfte Änderungen. Neue Vorschau erforderlich.",
          409,
        );
      progress.commit = headSha;
      const pulls = await github(
        plan.repo +
          "/pulls?state=open&head=" +
          encodeURIComponent(plan.repo.split("/")[0] + ":" + progress.branch),
      );
      const pr =
        pulls?.[0] ||
        (await github(plan.repo + "/pulls", "POST", {
          title: "docs: reviewed Cryo agent output",
          head: progress.branch,
          base: plan.base,
          body: "Manuell geprüfte Markdown-Ausgabe aus dem Cryo-Workspace. Keine automatische Zusammenführung.",
        }));
      plan.state = "done";
      return { target: "github", branch: progress.branch, url: pr.html_url };
    } catch (error) {
      plan.state =
        plan.target === "github" && error.status !== 409 ? "retry" : "done";
      error.progress = plan.progress;
      error.retryable = plan.state === "retry";
      if (!error.status) {
        error.status = error.code === "EEXIST" ? 409 : 502;
        error.message = "Schreibaktion fehlgeschlagen. Ziel prüfen.";
      }
      throw error;
    }
  }
  return { prepare, execute };
}
