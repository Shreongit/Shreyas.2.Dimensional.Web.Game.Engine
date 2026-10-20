import test from "node:test";
import assert from "node:assert/strict";
import { Entity } from "../src/core/Entity.js";
import { Scene } from "../src/core/Scene.js";
import { Collider } from "../src/physics/Collider.js";
import { PhysicsBody } from "../src/physics/PhysicsBody.js";

test("collider added after entity enters scene is registered", () => {
  const scene = new Scene("test");
  const entity = new Entity({x:10,y:10,width:10,height:10});
  scene.add(entity);
  const collider = entity.addComponent(new Collider());
  assert.equal(scene.physics.colliders.has(collider), true);
  entity.removeComponent(collider);
  assert.equal(scene.physics.colliders.has(collider), false);
});
test("physics world resolves overlap against a static collider", () => {
  const scene = new Scene("physics");
  scene.physics.gravity.y = 0;
  const dynamic = new Entity({x:0,y:0,width:10,height:10});
  dynamic.addComponent(new PhysicsBody({vx:0,vy:0}));
  dynamic.addComponent(new Collider());
  const wall = new Entity({x:8,y:0,width:10,height:10});
  wall.addComponent(new Collider());
  scene.add(dynamic); scene.add(wall);
  scene.physics.step();
  assert.ok(dynamic.x < 0, `expected dynamic entity to be separated, got x=${dynamic.x}`);
});
