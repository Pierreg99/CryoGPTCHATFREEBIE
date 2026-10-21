import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  writeFile,
  symlink,
  rm,
  mkdir,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createWriteService, validateWrite } from "../src/agent-workspace.mjs";
import { inspectGithub } from "../src/github-integration.mjs";
const input = {
  target: "local",
  path: "report.md",
  content: "# Report\nReviewed output",
};
const status = (code) => (error) => error.status === code;
test("writes default off, require Markdown, strict paths and explicit write repository", () => {
  assert.throws(() => validateWrite(input, {}), status(503));
  for (const name of [
    "../report.md",
    "/report.md",
    "file.js",
    "a/../report.md",
    "a\\b.md",
    ".github/file.md",
  ])
    assert.throws(
      () => validateWrite({ ...input, path: name }, {}),
      status(400),
    );
  assert.throws(
    () => validateWrite({ ...input, content: "a".repeat(102401) }, {}),
    status(400),
  );
  assert.throws(
    () =>
      validateWrite(
        { ...input, target: "github", repo: "other/repo" },
        {
          CRYO_GITHUB_WRITES: "true",
          CRYO_GITHUB_TOKEN: "test",
          CRYO_GITHUB_WRITE_REPOS: "allowed/repo",
        },
      ),
    status(403),
  );
});
test("local tickets bind content, create once, never overwrite, expire", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "cryo-output-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  let time = 0;
  const service = createWriteService({
    env: { CRYO_LOCAL_WRITES: "true", CRYO_OUTPUT_DIR: root },
    now: () => time,
  });
  const preview = await service.prepare(input);
  await service.execute(preview.ticket);
  assert.equal(
    await readFile(path.join(root, input.path), "utf8"),
    input.content,
  );
  await assert.rejects(service.execute(preview.ticket), status(409));
  await assert.rejects(service.prepare(input), status(409));
  const expired = await service.prepare({ ...input, path: "expire.md" });
  time = expired.expiresAt;
  await assert.rejects(service.execute(expired.ticket), status(409));
});
test("local file added after preview and symlink targets cannot be overwritten", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "cryo-race-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const service = createWriteService({
    env: { CRYO_LOCAL_WRITES: "true", CRYO_OUTPUT_DIR: root },
  });
  const p = await service.prepare(input);
  await writeFile(path.join(root, "report.md"), "original");
  await assert.rejects(service.execute(p.ticket), status(409));
  assert.equal(
    await readFile(path.join(root, "report.md"), "utf8"),
    "original",
  );
  await symlink(root, path.join(root, "alias"));
  const alias = createWriteService({
    env: {
      CRYO_LOCAL_WRITES: "true",
      CRYO_OUTPUT_DIR: path.join(root, "alias"),
    },
  });
  await assert.rejects(
    alias.prepare({ ...input, path: "new.md" }),
    status(403),
  );
});
function mockGithub({
  failPr = false,
  changeBase = false,
  ambiguousCommit = false,
  initialContent,
  extraChanges = false,
} = {}) {
  let head = "base";
  let branch = null,
    file =
      initialContent === undefined
        ? null
        : {
            type: "file",
            encoding: "base64",
            content: Buffer.from(initialContent).toString("base64"),
            size: Buffer.byteLength(initialContent),
            sha: "original",
          },
    prs = [],
    creates = 0,
    commits = 0,
    prAttempts = 0,
    reads = 0;
  const fetchImpl = async (url, options) => {
    const route = url.replace("https://api.github.com/repos/allowed/repo", ""),
      method = options.method,
      body = options.body && JSON.parse(options.body);
    const ok = (value) => ({ ok: true, status: 200, json: async () => value });
    const missing = () => ({ ok: false, status: 404 });
    if (route === "") return ok({ default_branch: "main", private: false });
    if (route === "/git/ref/heads/main") {
      reads++;
      return ok({
        object: { sha: changeBase && reads > 1 ? "changed" : "base" },
      });
    }
    if (route.startsWith("/git/ref/heads/"))
      return branch ? ok({ object: { sha: head } }) : missing();
    if (route === "/git/refs") {
      creates++;
      branch = body.ref;
      return ok({ ref: branch });
    }
    if (route.startsWith("/contents/")) {
      if (method === "PUT") {
        commits++;
        head = "commit";
        file = {
          type: "file",
          encoding: "base64",
          content: body.content,
          size: 10,
          sha: "new",
        };
        if (ambiguousCommit) throw new Error("connection lost");
        return ok({ commit: { sha: "commit" } });
      }
      return file ? ok(file) : missing();
    }
    if (route.startsWith("/compare/"))
      return ok({
        ahead_by: extraChanges ? 2 : 1,
        total_commits: extraChanges ? 2 : 1,
        files: [{ filename: "docs/report.md", status: "added" }],
      });
    if (route.startsWith("/pulls?")) return ok(prs);
    if (route === "/pulls") {
      prAttempts++;
      if (failPr && prAttempts === 1) return { ok: false, status: 502 };
      prs = [{ html_url: "https://github.com/allowed/repo/pull/1" }];
      return ok(prs[0]);
    }
    throw new Error("Unexpected request: " + route);
  };
  return { fetchImpl, counts: () => ({ creates, commits, prAttempts }) };
}
const githubEnv = {
  CRYO_GITHUB_WRITES: "true",
  CRYO_GITHUB_TOKEN: "test-only",
  CRYO_GITHUB_WRITE_REPOS: "allowed/repo",
};
const githubInput = {
  ...input,
  target: "github",
  repo: "allowed/repo",
  path: "docs/report.md",
};
test("GitHub partial failure resumes one branch and commit; completion consumes ticket", async () => {
  const mock = mockGithub({ failPr: true }),
    service = createWriteService({ env: githubEnv, fetchImpl: mock.fetchImpl });
  const p = await service.prepare(githubInput);
  await assert.rejects(
    service.execute(p.ticket),
    (e) => e.retryable && Boolean(e.progress.branch),
  );
  const result = await service.execute(p.ticket);
  assert.match(result.url, /pull\/1/);
  assert.deepEqual(mock.counts(), { creates: 1, commits: 1, prAttempts: 2 });
  await assert.rejects(service.execute(p.ticket), status(409));
});
test("ambiguous commit response is reconciled without a duplicate commit", async () => {
  const mock = mockGithub({ ambiguousCommit: true }),
    service = createWriteService({ env: githubEnv, fetchImpl: mock.fetchImpl });
  const p = await service.prepare(githubInput);
  await assert.rejects(service.execute(p.ticket));
  await service.execute(p.ticket);
  assert.equal(mock.counts().commits, 1);
});
test("changed base rejects approval before branch creation", async () => {
  const mock = mockGithub({ changeBase: true }),
    service = createWriteService({ env: githubEnv, fetchImpl: mock.fetchImpl });
  const p = await service.prepare(githubInput);
  await assert.rejects(service.execute(p.ticket), status(409));
  assert.equal(mock.counts().creates, 0);
});
test("text inspection bounds size, binary data, repository and path before returning content", async () => {
  const request = {
    repo: "allowed/repo",
    path: "README.md",
    operation: "read-file",
    allowlist: ["allowed/repo"],
  };
  const file = (content) => async () => ({
    ok: true,
    json: async () => ({
      type: "file",
      encoding: "base64",
      content: Buffer.from(content).toString("base64"),
      size: Buffer.byteLength(content),
    }),
  });
  assert.equal(
    (await inspectGithub({ ...request, fetchImpl: file("hello") })).text,
    "hello",
  );
  await assert.rejects(
    inspectGithub({ ...request, fetchImpl: file("a\0b") }),
    status(422),
  );
  await assert.rejects(
    inspectGithub({ ...request, fetchImpl: file("a".repeat(102401)) }),
    status(422),
  );
  await assert.rejects(
    inspectGithub({
      ...request,
      path: "../README.md",
      fetchImpl: () => assert.fail("network"),
    }),
    status(400),
  );
  await assert.rejects(
    inspectGithub({
      ...request,
      repo: "other/repo",
      fetchImpl: () => assert.fail("network"),
    }),
    status(403),
  );
});

test("unchanged GitHub content is rejected before any writes", async () => {
  const mock = mockGithub({ initialContent: githubInput.content });
  const service = createWriteService({
    env: githubEnv,
    fetchImpl: mock.fetchImpl,
  });
  await assert.rejects(service.prepare(githubInput), status(409));
  assert.deepEqual(mock.counts(), { creates: 0, commits: 0, prAttempts: 0 });
});

test("unreviewed changes in an output branch prevent PR creation", async () => {
  const mock = mockGithub({ extraChanges: true });
  const service = createWriteService({
    env: githubEnv,
    fetchImpl: mock.fetchImpl,
  });
  const preview = await service.prepare(githubInput);
  await assert.rejects(service.execute(preview.ticket), status(409));
  assert.equal(mock.counts().prAttempts, 0);
});
