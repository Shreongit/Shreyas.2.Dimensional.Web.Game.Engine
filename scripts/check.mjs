import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = [];
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory() && item.name !== "node_modules" && item.name !== ".git") walk(full);
    else if (item.isFile() && /\.(mjs|js)$/.test(item.name)) files.push(full);
  }
}
walk(path.join(root, "src")); walk(path.join(root, "examples")); walk(path.join(root, "scripts")); walk(path.join(root, "tests"));
let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) { failed = true; console.error(`FAIL ${path.relative(root,file)}\n${result.stderr || result.stdout}`); }
}
if (failed) process.exitCode = 1;
else console.log(`Syntax check passed for ${files.length} JavaScript files.`);
