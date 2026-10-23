import test from "node:test";
import assert from "node:assert/strict";
import * as publicApi from "../src/index.js";
import packageJson from "../package.json" with { type: "json" };
import fs from "node:fs/promises";

const documentedExports = [
  "Engine", "Scene", "SceneManager", "Entity", "Component", "Timer", "Tween",
  "Storage", "InputManager", "PointerManager", "Sprite", "Animation", "Camera2D",
  "ParticleEmitter", "Tilemap", "TilemapCollider", "CanvasText", "RectangleRenderer",
  "Collision", "Collider", "PhysicsBody", "PhysicsWorld", "AudioManager",
  "AssetLoader", "EventEmitter", "Logger", "Profiler", "SpatialHash", "raycastAABB", "Viewport"
];

test("public API exports the documented symbols", () => {
  for (const name of documentedExports) {
    assert.ok(name in publicApi, `Missing public export: ${name}`);
    assert.notEqual(publicApi[name], undefined, `Undefined public export: ${name}`);
  }
});

test("package metadata exposes an ESM entry point and supported Node baseline", () => {
  assert.equal(packageJson.type, "module");
  assert.equal(packageJson.exports["."], "./src/index.js");
  assert.equal(packageJson.engines.node, ">=18");
  assert.equal(packageJson.license, "UNLICENSED");
});

test("API reference calls out release-candidate status and physics scope", async () => {
  const api = await fs.readFile(new URL("../docs/API_REFERENCE.md", import.meta.url), "utf8");
  assert.match(api, /release-candidate status/i);
  assert.match(api, /general-purpose rigid-body solver/i);
  for (const name of documentedExports) assert.ok(api.includes(`\`${name}\``), `API reference missing ${name}`);
});
