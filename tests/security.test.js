import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as sleep } from "node:timers/promises";
import {
  requestBoundary,
  SECURITY_HEADERS,
  MAX_REQUEST_BYTES,
} from "../src/security.mjs";
import { APP_VERSION } from "../src/version.mjs";
const req = (headers = {}) => ({
  method: "POST",
  url: "/api/chat",
  headers: {
    host: "127.0.0.1:4173",
    "content-type": "application/json",
    origin: "http://127.0.0.1:4173",
    ...headers,
  },
});
test("request boundary rejects rebound hosts, opaque/cross-site origins and oversized payloads", () => {
  assert.equal(requestBoundary(req(), 4173), null);
  for (const host of [
    "evil.example:4173",
    "localhost:4173",
    "127.0.0.1.evil:4173",
  ])
    assert.equal(requestBoundary(req({ host }), 4173).status, 403);
  for (const origin of [
    "null",
    "https://evil.example",
    "http://127.0.0.1:4173.evil",
  ])
    assert.equal(requestBoundary(req({ origin }), 4173).status, 403);
  assert.equal(
    requestBoundary(
      req({ origin: undefined, "sec-fetch-site": "same-origin" }),
      4173,
    ).status,
    403,
  );
  assert.equal(
    requestBoundary(
      req({ origin: undefined, "sec-fetch-site": undefined }),
      4173,
    ),
    null,
  );
  assert.equal(
    requestBoundary(req({ "content-type": "application/jsonp" }), 4173).status,
    415,
  );
  assert.equal(
    requestBoundary(
      req({ "content-length": String(MAX_REQUEST_BYTES + 1) }),
      4173,
    ).status,
    413,
  );
  assert.equal(
    requestBoundary({ ...req(), url: "http://evil.example/api/chat" }, 4173)
      .status,
    403,
  );
});
test(
  "HTTP security boundary and model concurrency limit hold before upstream side effects",
  { timeout: 15000 },
  async (t) => {
    let modelCalls = 0;
    const upstream = http.createServer((request, response) => {
      if (request.url === "/api/tags") {
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({ models: [{ name: "mock" }] }));
        return;
      }
      modelCalls++;
      response.writeHead(200, { "Content-Type": "application/x-ndjson" });
      response.write('{"message":{"content":"running"},"done":false}\n');
    });
    upstream.listen(0, "127.0.0.1");
    await once(upstream, "listening");
    const free = http.createServer();
    free.listen(0, "127.0.0.1");
    await once(free, "listening");
    const port = free.address().port;
    await new Promise((resolve) => free.close(resolve));
    const base = "http://127.0.0.1:" + port;
    const child = spawn(process.execPath, ["server.mjs"], {
      cwd: new URL("..", import.meta.url),
      env: {
        ...process.env,
        PORT: String(port),
        OLLAMA_URL: "http://127.0.0.1:" + upstream.address().port,
      },
      stdio: "ignore",
    });
    const controllers = [];
    t.after(async () => {
      controllers.forEach((c) => c.abort());
      child.kill();
      upstream.closeAllConnections();
      await new Promise((resolve) => upstream.close(resolve));
    });
    for (let i = 0; i < 60; i++) {
      try {
        if ((await fetch(base + "/api/status")).ok) break;
      } catch {}
      await sleep(40);
    }
    const status = await fetch(base + "/api/status");
    assert.equal((await status.json()).version, APP_VERSION);
    for (const [key, value] of Object.entries(SECURITY_HEADERS))
      assert.equal(status.headers.get(key), value);
    const rebound = await new Promise((resolve, reject) => {
      const request = http.get(
        base + "/api/status",
        { headers: { Host: "evil.example:" + port } },
        (response) => {
          response.resume();
          resolve(response.statusCode);
        },
      );
      request.on("error", reject);
    });
    assert.equal(rebound, 403);
    const post = (body, headers = {}) =>
      fetch(base + "/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: base,
          ...headers,
        },
        body,
      });
    assert.equal((await post("null")).status, 400);
    assert.equal((await post("{}", { Origin: "null" })).status, 403);
    assert.equal((await post("x".repeat(MAX_REQUEST_BYTES + 1))).status, 413);
    assert.equal(modelCalls, 0);
    for (let i = 0; i < 2; i++) {
      const controller = new AbortController();
      controllers.push(controller);
      const response = await fetch(base + "/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: base },
        signal: controller.signal,
        body: JSON.stringify({
          model: "mock",
          messages: [{ role: "user", content: "hello" }],
        }),
      });
      assert.equal(response.status, 200);
    }
    assert.equal(
      (
        await post(
          JSON.stringify({
            model: "mock",
            messages: [{ role: "user", content: "third" }],
          }),
        )
      ).status,
      429,
    );
    assert.equal(modelCalls, 2);
  },
);
