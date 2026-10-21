import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist");

async function copyTree(from, to) {
  await fs.mkdir(to, { recursive: true });
  for (const entry of await fs.readdir(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) await copyTree(source, target);
    else if (entry.isFile() && entry.name.endsWith(".js")) await fs.copyFile(source, target);
  }
}

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });
await copyTree(path.join(root, "src"), path.join(out, "engine"));
await fs.cp(path.join(root, "templates", "starter-game"), path.join(out, "starter-game"), { recursive: true });
await fs.cp(path.join(root, "templates", "sample-game"), path.join(out, "sample-game"), { recursive: true });
await fs.copyFile(path.join(root, "LICENSE"), path.join(out, "LICENSE"));
await fs.copyFile(path.join(root, "README.md"), path.join(out, "README.md"));
const manifest = {
  name: "s2dwge-distribution",
  version: JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8")).version,
  description: "S2DWGE browser runtime and vanilla JavaScript starter game",
  type: "module",
  exports: "./engine/index.js",
  files: ["engine", "starter-game", "LICENSE", "README.md"],
  license: "MIT"
};
await fs.writeFile(path.join(out, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Built S2DWGE distribution at ${path.relative(root, out)}`);
console.log("Includes native ES-module runtime, starter game, complete sample game, package metadata, README and license.");
