import test from "node:test";
import assert from "node:assert/strict";
import { SpatialHash } from "../src/physics/SpatialHash.js";
import { PhysicsWorld } from "../src/physics/PhysicsWorld.js";

test("physics pair keys remain distinct beyond 16-bit IDs", () => {
  const world = new PhysicsWorld();
  const a = { _physicsId: 1 };
  const b = { _physicsId: 65537 };
  const c = { _physicsId: 2 };
  const d = { _physicsId: 65538 };
  assert.notEqual(world._key(a, b), world._key(c, d));
  assert.equal(world._key(a, b), world._key(b, a));
});

test("spatial hash cell keys do not alias coordinates outside 16-bit range", () => {
  const hash = new SpatialHash(1);
  const left = { id: "left" };
  const right = { id: "right" };
  hash.insert(left, { x: 1, y: 1, width: 0.1, height: 0.1 });
  hash.insert(right, { x: 65537, y: 1, width: 0.1, height: 0.1 });
  assert.deepEqual(hash.query({ x: 1, y: 1, width: 0.1, height: 0.1 }), [left]);
  assert.deepEqual(hash.query({ x: 65537, y: 1, width: 0.1, height: 0.1 }), [right]);
});
