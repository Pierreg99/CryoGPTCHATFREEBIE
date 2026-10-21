import { readFileSync } from "node:fs";
// One application version for HTTP status, MCP client metadata and release checks.
export const APP_VERSION = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
).version;
