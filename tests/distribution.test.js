import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("production distribution contains runtime entry, package metadata and starter game", async () => {
  const [entry, manifest, html, game, css, license] = await Promise.all([
    fs.readFile(path.join(root, "dist/engine/index.js"), "utf8"),
    fs.readFile(path.join(root, "dist/package.json"), "utf8"),
    fs.readFile(path.join(root, "dist/starter-game/index.html"), "utf8"),
    fs.readFile(path.join(root, "dist/starter-game/game.js"), "utf8"),
    fs.readFile(path.join(root, "dist/starter-game/style.css"), "utf8"),
    fs.readFile(path.join(root, "dist/LICENSE"), "utf8")
  ]);
  assert.match(entry, /export \{ Engine \}/);
  assert.equal(JSON.parse(manifest).type, "module");
  assert.match(html, /type="module"/);
  assert.match(game, /\.\.\/engine\/index\.js/);
  assert.match(css, /canvas/);
  assert.match(license, /MIT License/);
});

test("distribution starter imports a runtime file included in distribution", async () => {
  const game = await fs.readFile(path.join(root, "dist/starter-game/game.js"), "utf8");
  const importPath = game.match(/from ["']([^"']+)["']/)?.[1];
  assert.ok(importPath, "starter game should have an explicit runtime import");
  await fs.access(path.resolve(root, "dist/starter-game", importPath));
});
