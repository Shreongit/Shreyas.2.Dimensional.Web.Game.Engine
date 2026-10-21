import test from "node:test";
import assert from "node:assert/strict";
import { Entity } from "../src/core/Entity.js";
import { Scene } from "../src/core/Scene.js";
import { Collider } from "../src/physics/Collider.js";
import { PhysicsBody } from "../src/physics/PhysicsBody.js";
import { PhysicsWorld } from "../src/physics/PhysicsWorld.js";

function addBody(scene, { x=0, y=0, width=10, height=10, body={}, collider={} } = {}) {
  const entity = new Entity({ x, y, width, height });
  if (body !== null) entity.addComponent(new PhysicsBody(body));
  const shape = entity.addComponent(new Collider(collider));
  scene.add(entity);
  return { entity, body: entity.getComponent(PhysicsBody), collider: shape };
}

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
  const scene = new Scene("physics"); scene.physics.gravity.y = 0;
  const dynamic = addBody(scene, { x:0 });
  addBody(scene, { x:8, body:null });
  scene.physics.step();
  assert.ok(dynamic.entity.x < 0, `expected dynamic entity to be separated, got x=${dynamic.entity.x}`);
});
test("broad phase avoids duplicate contact callbacks", () => {
  const scene = new Scene(); scene.physics.gravity.y = 0;
  addBody(scene, { x:0 }); addBody(scene, { x:8, body:null });
  let calls = 0; scene.physics.onCollisionEnter = () => calls++;
  scene.physics.step(); scene.physics.step();
  assert.equal(calls, 1);
});
test("collision exit fires when objects separate", () => {
  const scene = new Scene(); scene.physics.gravity.y = 0;
  const a = addBody(scene, { x:0 }); addBody(scene, { x:8, body:null });
  let exits = 0; scene.physics.onCollisionExit = () => exits++;
  scene.physics.step(); a.entity.x = -100; scene.physics.step();
  assert.equal(exits, 1);
});
test("layer and mask filters suppress contacts", () => {
  const scene = new Scene(); scene.physics.gravity.y = 0;
  addBody(scene, { x:0, collider:{ layer:1, mask:1 } });
  addBody(scene, { x:8, body:null, collider:{ layer:2, mask:2 } });
  let calls = 0; scene.physics.onCollision = () => calls++;
  scene.physics.step(); assert.equal(calls, 0);
});
test("trigger contacts are reported without physical separation", () => {
  const scene = new Scene(); scene.physics.gravity.y = 0;
  const a = addBody(scene, { x:0, collider:{ isTrigger:true } });
  addBody(scene, { x:8, body:null });
  scene.physics.step(); assert.equal(a.entity.x, 0);
});
test("mass affects impulse response and validates input", () => {
  const body = new PhysicsBody({ mass:2 });
  body.applyImpulse(10, 0); assert.equal(body.vx, 5);
  assert.throws(() => new PhysicsBody({ mass:0 }), RangeError);
  assert.throws(() => body.applyForce(NaN, 0), TypeError);
});
test("force is integrated over time", () => {
  const scene = new Scene(); scene.physics.gravity.x = 0; scene.physics.gravity.y = 0;
  const { body } = addBody(scene, { body:{ mass:2 } });
  body.applyForce(10, 0); body.update(0.5);
  assert.equal(body.vx, 2.5);
});
test("physics world validates solver settings", () => {
  assert.throws(() => new PhysicsWorld({ solverIterations:0 }), RangeError);
});

test("collider bounds account for entity scale and scaled offsets", () => {
  const scene = new Scene();
  const { collider } = addBody(scene, { x:10, y:20, width:8, height:6, collider:{ offsetX:2, offsetY:-1 } });
  collider.entity.scaleX = 2; collider.entity.scaleY = 3;
  assert.deepEqual(collider.bounds, { x:14, y:17, width:16, height:18 });
});

test("continuous collision detection prevents a fast body crossing a thin wall", () => {
  const scene = new Scene("ccd"); scene.physics.gravity.y = 0;
  const fast = addBody(scene, { x: -100, width: 10, height: 10, body: { vx: 12000 }, collider: {} });
  addBody(scene, { x: 0, width: 4, height: 100, body: null });
  // Simulate a single 1/60 s displacement (200 world units).
  fast.body.previousX = fast.entity.x;
  fast.entity.x += fast.body.vx / 60;
  scene.physics.step();
  assert.ok(fast.entity.x < 0, `fast body tunneled through wall: x=${fast.entity.x}`);
  assert.ok(Math.abs(fast.body.vx) < 1e-8, `normal velocity should be removed: vx=${fast.body.vx}`);
});

test("collision events include stable pair identity and contact normal", () => {
  const scene = new Scene("contact-info"); scene.physics.gravity.y = 0;
  addBody(scene, { x: 0 }); addBody(scene, { x: 8, body: null });
  let event;
  scene.physics.onCollisionEnter = value => { event = value; };
  scene.physics.step();
  assert.ok(event.key);
  assert.ok(Number.isFinite(event.normalX) && Number.isFinite(event.normalY));
  assert.equal(event.phase, "enter");
});

test("stacked-body stress remains finite and respects a static floor", () => {
  const scene = new Scene("stress"); scene.physics.gravity.y = 900;
  addBody(scene, { x:0, y:200, width:300, height:20, body:null });
  const bodies=[];
  for (let i=0;i<12;i++) bodies.push(addBody(scene, { x:(i%3)*22-22, y:-i*24, width:20, height:20 }));
  for (let frame=0;frame<360;frame++) {
    for (const entity of [...scene.entities]) entity.update(1/60);
    scene.physics.step();
  }
  for (const {entity} of bodies) {
    assert.ok(Number.isFinite(entity.x) && Number.isFinite(entity.y));
    assert.ok(entity.y < 220, `body fell through floor at y=${entity.y}`);
  }
});
