import test from "node:test";
import assert from "node:assert/strict";
import { Collision } from "../src/physics/Collision.js";
import { PhysicsBody } from "../src/physics/PhysicsBody.js";
import { Camera2D } from "../src/graphics/Camera2D.js";
import { Tween } from "../src/core/Tween.js";
import { Timer } from "../src/core/Timer.js";
import { ParticleEmitter } from "../src/graphics/ParticleEmitter.js";

test("AABB collision detects overlap and separation", () => {
  assert.equal(Collision.aabb({x:0,y:0,width:10,height:10},{x:8,y:0,width:10,height:10}), true);
  assert.equal(Collision.aabb({x:0,y:0,width:10,height:10},{x:20,y:0,width:10,height:10}), false);
});
test("point rectangle test uses center-based bounds", () => {
  assert.equal(Collision.pointInRect({x:0,y:0},{x:0,y:0,width:10,height:10}), true);
  assert.equal(Collision.pointInRect({x:10,y:0},{x:0,y:0,width:10,height:10}), false);
});
test("camera transforms world and screen coordinates", () => {
  const c = new Camera2D({x:100,y:50,zoom:2});
  const screen = c.worldToScreen(120,70,800,600);
  const world = c.screenToWorld(screen.x,screen.y,800,600);
  assert.ok(Math.abs(world.x-120)<1e-8);
  assert.ok(Math.abs(world.y-70)<1e-8);
});
test("tween interpolates and completes", () => {
  const obj = {x:0}; let completed = false;
  const tween = new Tween(obj,{x:10},1,{onComplete:()=>completed=true});
  tween.update(.5); assert.equal(obj.x,5);
  tween.update(.5); assert.equal(obj.x,10); assert.equal(completed,true);
});
test("timer fires once when elapsed duration is reached", () => {
  let calls=0; const timer=new Timer(.5,()=>calls++);
  timer.update(.2); timer.update(.3);
  assert.equal(calls,1); assert.equal(timer.completed,true);
});
test("particle emitter creates and expires particles", () => {
  const emitter = new ParticleEmitter({rate:0,life:[.1,.1],speed:[0,0],size:[2,2]});
  emitter.emit(3); assert.equal(emitter.particles.length,3);
  emitter.update(.2); assert.equal(emitter.particles.length,0);
});
