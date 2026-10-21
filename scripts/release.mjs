import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
const sourceRoot = fileURLToPath(new URL("..", import.meta.url));
const git = (root, ...args) =>
  execFileSync("git", args, { cwd: root, maxBuffer: 64 * 1024 * 1024 });
export function checkReleaseGates(version, checklist) {
  if (
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/.test(
      version,
    )
  )
    throw new Error("Invalid release version.");
  const stable = /^[1-9]\d*\.\d+\.\d+$/.test(version);
  const requiredLines = checklist
    .split(/\r?\n/)
    .filter((line) => line.includes("**REQUIRED**"));
  if (
    !requiredLines.length ||
    requiredLines.some(
      (line) => !/^- \[[ xX]\] \*\*REQUIRED\*\*: .+\S$/.test(line),
    )
  )
    throw new Error("Release checklist requires well-formed REQUIRED gates.");
  const pending = [
    ...checklist.matchAll(/^- \[ \] \*\*REQUIRED\*\*: (.+)$/gm),
  ].map((m) => m[1]);
  if (stable && pending.length)
    throw new Error("Stable release blocked: " + pending.join("; "));
  return { channel: stable ? "stable" : "prerelease", pending };
}
export async function buildRelease({
  root = sourceRoot,
  outDir = path.join(sourceRoot, "dist"),
} = {}) {
  if (git(root, "status", "--porcelain").toString().trim())
    throw new Error("Release requires a clean, committed checkout.");
  const pkg = JSON.parse(
    await readFile(path.join(root, "package.json"), "utf8"),
  );
  const checklist = await readFile(
    path.join(root, "docs/RELEASE-CHECKLIST.md"),
    "utf8",
  );
  const gates = checkReleaseGates(pkg.version, checklist);
  const changelog = await readFile(path.join(root, "CHANGELOG.md"), "utf8");
  if (!changelog.includes("## " + pkg.version + "\n"))
    throw new Error("Changelog entry for application version is missing.");
  const commit = git(root, "rev-parse", "HEAD").toString().trim();
  const name = "cryogptchatfreebie-" + pkg.version + ".tar";
  const archive = git(
    root,
    "archive",
    "--format=tar",
    "--prefix=cryogptchatfreebie-" + pkg.version + "/",
    commit,
  );
  const digest = createHash("sha256").update(archive).digest("hex");
  const manifest = {
    schema: 1,
    name: pkg.name,
    version: pkg.version,
    channel: gates.channel,
    commit,
    archive: name,
    sha256: digest,
    bytes: archive.length,
    pendingGates: gates.pending,
  };
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, name), archive);
  await writeFile(path.join(outDir, "SHA256SUMS"), digest + "  " + name + "\n");
  await writeFile(
    path.join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  return manifest;
}
export async function verifyRelease(options = {}) {
  const work = await mkdtemp(path.join(tmpdir(), "cryo-repro-"));
  try {
    const first = await buildRelease({
        ...options,
        outDir: path.join(work, "first"),
      }),
      second = await buildRelease({
        ...options,
        outDir: path.join(work, "second"),
      });
    const a = await readFile(path.join(work, "first", first.archive)),
      b = await readFile(path.join(work, "second", second.archive));
    if (!a.equals(b) || first.sha256 !== second.sha256)
      throw new Error("Release archives are not byte-identical.");
    return buildRelease(options);
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const result = process.argv.includes("--verify")
      ? await verifyRelease()
      : await buildRelease();
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } catch (error) {
    process.stderr.write(error.message + "\n");
    process.exitCode = 1;
  }
}
