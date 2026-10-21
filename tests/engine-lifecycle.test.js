import test from "node:test";
import assert from "node:assert/strict";
import { Engine } from "../src/core/Engine.js";

function fixture() {
  const callbacks = new Map(); let nextId = 1;
  const listeners = new Map();
  const ctx = { save(){}, restore(){}, setTransform(){}, fillRect(){}, fillText(){}, translate(){}, rotate(){}, scale(){}, clearRect(){}, beginPath(){}, rect(){}, fill(){}, stroke(){} };
  const canvasListeners = new Map();
  const canvas = {
    width:0,height:0,style:{}, getContext:()=>ctx,
    addEventListener:(name,fn)=>canvasListeners.set(name,fn),
    removeEventListener:name=>canvasListeners.delete(name),
    getBoundingClientRect:()=>({left:0,top:0,width:960,height:540})
  };
  globalThis.window = { addEventListener:(n,f)=>listeners.set(`window:${n}`,f), removeEventListener:n=>listeners.delete(`window:${n}`) };
  globalThis.document = { hidden:false, addEventListener:(n,f)=>listeners.set(`document:${n}`,f), removeEventListener:n=>listeners.delete(`document:${n}`) };
  globalThis.requestAnimationFrame = fn => { const id=nextId++; callbacks.set(id,fn); return id; };
  globalThis.cancelAnimationFrame = id => callbacks.delete(id);
  return { canvas, callbacks, listeners };
}

test("engine validates render-rate configuration", () => {
  fixture();
  const canvas = { getContext:()=>({}) };
  assert.throws(() => new Engine(canvas, { targetFPS:0.5 }), RangeError);
  assert.throws(() => new Engine(canvas, { fixedDelta:0 }), RangeError);
});

test("engine start-stop-dispose is idempotent and prevents restart after disposal", () => {
  const f=fixture();
  const engine=new Engine(f.canvas,{audio:false});
  engine.start();
  assert.equal(engine.running,true);
  assert.equal(f.callbacks.size,1);
  engine.stop(); engine.stop();
  assert.equal(engine.running,false);
  assert.equal(f.callbacks.size,0);
  engine.dispose(); engine.dispose();
  assert.equal(engine.disposed,true);
  assert.throws(()=>engine.start(),/disposed/);
});

test("scene switching stops the previous scene and restarts lifecycle on re-entry", async () => {
  const { Scene } = await import("../src/core/Scene.js");
  const { SceneManager } = await import("../src/core/SceneManager.js");
  const events = [];
  class LifecycleScene extends Scene {
    onStart() { events.push(`${this.name}:start`); }
    onStop() { events.push(`${this.name}:stop`); }
  }
  const engine = { width: 100, height: 100 };
  const manager = new SceneManager(engine);
  manager.add("a", new LifecycleScene("a"));
  manager.add("b", new LifecycleScene("b"));
  manager.switchTo("a");
  manager.switchTo("b");
  manager.switchTo("a");
  assert.deepEqual(events, ["a:start", "a:stop", "b:start", "b:stop", "a:start"]);
  manager.dispose();
});

test("scene stop invokes entity component stop hooks once and restarts cleanly", async () => {
  const { Scene } = await import("../src/core/Scene.js");
  const { Entity } = await import("../src/core/Entity.js");
  const { Component } = await import("../src/core/Component.js");
  const events = [];
  class LifecycleComponent extends Component {
    start() { events.push("start"); }
    stop() { events.push("stop"); }
  }
  const scene = new Scene();
  scene.add(new Entity().addComponent(new LifecycleComponent()).entity);
  scene.start();
  scene.stop();
  scene.stop();
  scene.start();
  assert.deepEqual(events, ["start", "stop", "start"]);
  scene.dispose();
  assert.deepEqual(events, ["start", "stop", "start", "stop"]);
});

test("pointer clear releases held buttons after visibility loss", async () => {
  const { PointerManager } = await import("../src/input/PointerManager.js");
  const canvas = {
    width: 100, height: 100,
    addEventListener() {}, removeEventListener() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 })
  };
  const pointer = new PointerManager(canvas);
  pointer.buttons.add(0); pointer.down = true;
  pointer.clear();
  assert.equal(pointer.down, false);
  assert.equal(pointer.buttons.size, 0);
  assert.equal(pointer.justReleased, true);
  pointer.dispose();
});


test("removing an entity stops its components and re-adding restarts them", async () => {
  const { Scene } = await import("../src/core/Scene.js");
  const { Entity } = await import("../src/core/Entity.js");
  const { Component } = await import("../src/core/Component.js");
  const events = [];
  class LifecycleComponent extends Component {
    start() { events.push("start"); }
    stop() { events.push("stop"); }
  }
  const scene = new Scene();
  const entity = new Entity();
  entity.addComponent(new LifecycleComponent());
  scene.add(entity); scene.start();
  scene.remove(entity);
  scene.add(entity);
  assert.deepEqual(events, ["start", "stop", "start"]);
  scene.dispose();
});
