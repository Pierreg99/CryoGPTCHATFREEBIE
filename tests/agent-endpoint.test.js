import test from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
async function portNumber() {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
test(
  "Agent-Endpunkt erzwingt Action-Allowlist und Cloud-Modelle benötigen Konfiguration",
  { timeout: 12000 },
  async (t) => {
    const port = await portNumber();
    const child = spawn(process.execPath, ["server.mjs"], {
      cwd: root,
      env: {
        ...process.env,
        PORT: String(port),
        CRYO_GITHUB_REPOS: "Pierreg99/CryoGPTCHATFREEBIE",
        OPENAI_API_KEY: "",
        CRYO_OPENAI_MODELS: "",
        CRYO_LOCAL_WRITES: "",
        CRYO_GITHUB_WRITES: "",
      },
      stdio: "ignore",
    });
    t.after(() => {
      child.kill("SIGTERM");
    });
    const base = "http://127.0.0.1:" + port;
    let ready = false;
    for (let i = 0; i < 60; i++) {
      try {
        const res = await fetch(base + "/api/integrations");
        if (res.ok) {
          ready = true;
          break;
        }
      } catch {
        /* starting */
      }
      await sleep(50);
    }
    assert.equal(ready, true);
    const status = await (await fetch(base + "/api/status")).json();
    assert.equal(status.providers.openai.enabled, false);
    assert.deepEqual(status.providers.openai.models, []);

    const agent = (value, origin = base) =>
      fetch(base + "/api/agent/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: origin },
        body: JSON.stringify(value),
      });
    assert.equal(
      (
        await agent({
          repo: "Pierreg99/CryoGPTCHATFREEBIE",
          operation: "write-file",
        })
      ).status,
      400,
    );
    assert.equal(
      (await agent({ repo: "untrusted/project", operation: "read-readme" }))
        .status,
      403,
    );
    assert.equal(
      (
        await agent(
          { repo: "Pierreg99/CryoGPTCHATFREEBIE", operation: "read-readme" },
          "https://bad.example",
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await agent({
          repo: "Pierreg99/CryoGPTCHATFREEBIE",
          operation: "search-skills",
          query: "x".repeat(101),
        })
      ).status,
      400,
    );
    const write = (endpoint, body, origin = base) =>
      fetch(base + "/api/agent/write/" + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: origin },
        body: JSON.stringify(body),
      });
    assert.equal(
      (
        await write("preview", {
          target: "local",
          path: "report.md",
          content: "# Test",
        })
      ).status,
      503,
    );
    assert.equal(
      (
        await write(
          "preview",
          { target: "local", path: "report.md", content: "# Test" },
          "https://bad.example",
        )
      ).status,
      403,
    );
    assert.equal((await write("execute", { ticket: "unknown" })).status, 409);
    assert.equal((await agent(null)).status, 400);
    assert.equal(
      (
        await agent({
          repo: "untrusted/project",
          operation: "read-file",
          path: "README.md",
        })
      ).status,
      403,
    );
    const remote = await fetch(base + "/api/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify({
        model: "openai:gpt-4.1-mini",
        messages: [{ role: "user", content: "test" }],
      }),
    });
    assert.equal(remote.status, 400);
  },
);
