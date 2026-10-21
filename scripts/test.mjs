import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const files = (await readdir(new URL("../tests/", import.meta.url)))
  .filter((name) => name.endsWith(".test.js"))
  .sort()
  .map((name) => "tests/" + name);
const child = spawnSync(process.execPath, ["--test", ...files], {
  cwd: new URL("..", import.meta.url),
  stdio: "inherit",
});
if (child.error) throw child.error;
process.exitCode = child.status ?? 1;
