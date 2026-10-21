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
