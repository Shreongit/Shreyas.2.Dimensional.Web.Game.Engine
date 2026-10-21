import test from "node:test";
import assert from "node:assert/strict";
import { PointerManager } from "../src/input/PointerManager.js";

function target() {
  const handlers = new Map();
  return {
    width:200, height:100,
    addEventListener(type, fn) { handlers.set(type, fn); },
    removeEventListener(type) { handlers.delete(type); },
    getBoundingClientRect() { return { left:10, top:20, width:100, height:50 }; },
    fire(type, event={}) { handlers.get(type)?.(event); }
  };
}
test("pointer edge events survive update until explicitly cleared", () => {
  const canvas = target(), pointer = new PointerManager(canvas);
  canvas.fire("pointerdown", { clientX:35, clientY:45, button:0 });
  pointer.update();
  assert.equal(pointer.justPressed, true);
  assert.equal(pointer.x, 50); assert.equal(pointer.y, 50);
  pointer.clearTransient(); assert.equal(pointer.justPressed, false);
  pointer.dispose();
});
test("pointer supports multiple pressed buttons and cancellation", () => {
  const savedAdd = globalThis.addEventListener, savedRemove = globalThis.removeEventListener;
  const globalHandlers = new Map();
  globalThis.addEventListener = (type, fn) => globalHandlers.set(type, fn);
  globalThis.removeEventListener = type => globalHandlers.delete(type);
  try {
    const canvas = target(), pointer = new PointerManager(canvas);
    canvas.fire("pointerdown", { clientX:10, clientY:20, button:0 });
    canvas.fire("pointerdown", { clientX:10, clientY:20, button:2 });
    globalHandlers.get("pointerup")?.({ button:0, clientX:10, clientY:20 });
    assert.equal(pointer.down, true);
    globalHandlers.get("pointercancel")?.();
    assert.equal(pointer.down, false);
    pointer.dispose();
  } finally {
    globalThis.addEventListener = savedAdd;
    globalThis.removeEventListener = savedRemove;
  }
});
