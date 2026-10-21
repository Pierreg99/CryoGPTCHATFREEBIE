import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  buildRelease,
  verifyRelease,
  checkReleaseGates,
} from "../scripts/release.mjs";
test("stable releases fail closed on unchecked gates, candidates disclose open gates", () => {
  assert.throws(() => checkReleaseGates("1.0.0", ""), /checklist/);
  assert.throws(
    () => checkReleaseGates("1.0.0", "- [] **REQUIRED**: Missing state"),
    /checklist/,
  );
  assert.throws(
    () => checkReleaseGates("invalid", "- [x] **REQUIRED**: Reviewed"),
    /version/,
  );
  const checklist = "- [ ] **REQUIRED**: Assistive technology review\n";
  assert.throws(() => checkReleaseGates("1.0.0", checklist), /blocked/);
  assert.deepEqual(checkReleaseGates("1.0.0-rc.1", checklist).pending, [
    "Assistive technology review",
  ]);
  assert.equal(
    checkReleaseGates("1.0.0", "- [x] **REQUIRED**: Reviewed").channel,
    "stable",
  );
});
test(
  "release artifacts are byte-reproducible from committed source and exclude ignored secrets",
  { timeout: 15000 },
  async (t) => {
    const root = await mkdtemp(path.join(tmpdir(), "cryo-release-fixture-"));
    t.after(() => rm(root, { recursive: true, force: true }));
    await mkdir(path.join(root, "docs"));
    await writeFile(
      path.join(root, "package.json"),
      JSON.stringify({ name: "cryogptchatfreebie", version: "1.0.0-rc.1" }),
    );
    await writeFile(
      path.join(root, "CHANGELOG.md"),
      "## 1.0.0-rc.1\n\nFixture.\n",
    );
    await writeFile(
      path.join(root, "docs/RELEASE-CHECKLIST.md"),
      "- [ ] **REQUIRED**: Manual review\n",
    );
    await writeFile(path.join(root, ".gitignore"), ".env\ndist/\n");
    await writeFile(path.join(root, ".env"), "PRIVATE_VALUE_DO_NOT_PACKAGE");
    const git = (...args) =>
      execFileSync("git", args, { cwd: root, stdio: "pipe" });
    git("init", "-q");
    git("add", ".");
    git(
      "-c",
      "user.name=Release Test",
      "-c",
      "user.email=release-test@example.invalid",
      "commit",
      "-qm",
      "fixture",
    );
    const result = await verifyRelease({
      root,
      outDir: path.join(root, "dist"),
    });
    const archive = await readFile(path.join(root, "dist", result.archive));
    assert.match(result.sha256, /^[a-f0-9]{64}$/);
    assert.equal(
      archive.includes(Buffer.from("PRIVATE_VALUE_DO_NOT_PACKAGE")),
      false,
    );
    assert.ok(archive.includes(Buffer.from("package.json")));
    assert.match(
      await readFile(path.join(root, "dist/SHA256SUMS"), "utf8"),
      new RegExp(result.sha256),
    );
    await writeFile(
      path.join(root, "package.json"),
      JSON.stringify({ name: "cryogptchatfreebie", version: "1.0.0" }),
    );
    await assert.rejects(buildRelease({ root }), /clean/);
  },
);
