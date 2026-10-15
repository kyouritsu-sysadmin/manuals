// Build a combined local preview of the two separately deployed GitHub Pages sites.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docs = path.resolve(root, "../my-docs");
const output = path.join(root, ".preview");
function run(command, args, cwd, env = process.env) {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
run(process.execPath, ["scripts/build.mjs"], root);
run(process.execPath, ["scripts/check.mjs"], root);
fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(path.join(root, "dist"), output, { recursive: true });
const env = {
  ...process.env,
  BASE_URL: "/manuals/",
  HOME_URL: process.env.PREVIEW_HOME_URL || "http://127.0.0.1:3000/",
};
run(
  "npm",
  ["run", "build", "--", "--out-dir", path.join(output, "manuals")],
  docs,
  env,
);
run("npm", ["run", "check:build"], docs, {
  ...env,
  BUILD_DIR: path.join(output, "manuals"),
});
console.log(
  "Combined preview ready in portal/.preview. Serve that folder on port 3000.",
);
