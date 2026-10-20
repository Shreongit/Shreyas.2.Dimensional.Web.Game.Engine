import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "../src/core/EventEmitter.js";
import { SpatialHash } from "../src/physics/SpatialHash.js";
import { raycastAABB } from "../src/physics/Raycast.js";
import { Profiler } from "../src/core/Profiler.js";

test("event emitter unsubscribe and once semantics", () => {
  const bus=new EventEmitter(); let calls=0;
  bus.once("tick",()=>calls++); bus.emit("tick"); bus.emit("tick");
  assert.equal(calls,1); assert.equal(bus.listenerCount("tick"),0);
});
test("spatial hash queries overlapping cells and removes entries", () => {
  const hash=new SpatialHash(10), item={id:1};
  hash.insert(item,{x:5,y:5,width:4,height:4});
  assert.ok(hash.query({x:5,y:5,width:2,height:2}).includes(item));
  hash.remove(item);
  assert.equal(hash.query({x:5,y:5,width:2,height:2}).length,0);
});
test("raycast returns nearest AABB intersection", () => {
  const hit=raycastAABB({x:0,y:0},{x:1,y:0},{x:10,y:0,width:4,height:4},20);
  assert.equal(hit.distance,8); assert.equal(hit.normalX,-1);
});
test("profiler computes rolling fps", () => {
  const p=new Profiler(2); p.record(.016); p.record(.016);
  assert.ok(p.fps>60); p.record(.032); assert.equal(p.samples.length,2);
});
