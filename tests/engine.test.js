import test from "node:test";
import assert from "node:assert/strict";
import { Animation } from "../src/graphics/Animation.js";
import { Entity } from "../src/core/Entity.js";
import { Scene } from "../src/core/Scene.js";
import { Component } from "../src/core/Component.js";
import { AssetLoader } from "../src/assets/AssetLoader.js";

test("animation advances multiple frames after a long update", () => {
  const a = new Animation(["a", "b", "c"], { frameDuration: 0.1 });
  a.update(0.25);
  assert.equal(a.currentFrame, "c");
  assert.ok(Math.abs(a.elapsed - 0.05) < 1e-8);
});
test("non-looping animation finishes on final frame", () => {
  const a = new Animation([1, 2], { frameDuration: 0.1, loop: false });
  a.update(0.5);
  assert.equal(a.currentFrame, 2);
  assert.equal(a.finished, true);
});
test("entity components attach, update and detach", () => {
  let updates = 0, detached = 0;
  class C extends Component { update() { updates++; } onDetach() { detached++; } }
  const e = new Entity(); const c = e.addComponent(new C());
  e.update(0.1); assert.equal(updates, 1);
  assert.equal(e.removeComponent(c), true); assert.equal(detached, 1); assert.equal(c.entity, null);
});
test("scene maintains entity ownership", () => {
  const a = new Scene("A"), b = new Scene("B"), e = new Entity();
  a.add(e); b.add(e);
  assert.equal(a.entities.includes(e), false);
  assert.equal(b.entities.includes(e), true);
  assert.equal(e.scene, b);
});
test("scene removes entity and clears ownership", () => {
  const s = new Scene(); const e = new Entity(); s.add(e);
  assert.equal(s.remove(e), true); assert.equal(e.scene, null);
});
test("destroying an entity removes it from its scene", () => {
  const s = new Scene(), e = new Entity(); s.add(e); e.destroy();
  assert.equal(s.entities.includes(e), false);
  assert.equal(e.scene, null);
});
test("asset loader reports empty manifest as complete", async () => {
  const loader = new AssetLoader();
  await loader.loadManifest({});
  assert.equal(loader.progress, 1);
  assert.equal(loader.loaded, 0);
});
test("asset loader records a missing URL without hanging progress", async () => {
  const loader = new AssetLoader();
  await loader.loadManifest({ bad: { type: "unknown" } });
  assert.equal(loader.loaded, 1);
  assert.equal(loader.errors.length, 1);
  assert.equal(loader.progress, 1);
});