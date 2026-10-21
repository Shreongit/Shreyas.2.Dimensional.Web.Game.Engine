import test from "node:test";
import assert from "node:assert/strict";
import { Entity } from "../src/core/Entity.js";
import { Scene } from "../src/core/Scene.js";
import { Component } from "../src/core/Component.js";

class DrawRecorder extends Component {
  constructor(name, log) { super(); this.name = name; this.log = log; }
  render() { this.log.push(this.name); }
}
const context = { save(){}, restore(){}, translate(){}, rotate(){}, scale(){} };
test("scene renders by renderOrder and preserves insertion order for ties", () => {
  const scene = new Scene(), log = [];
  const high = new Entity({ renderOrder:5 }); high.addComponent(new DrawRecorder("high", log));
  const lowA = new Entity({ renderOrder:-1 }); lowA.addComponent(new DrawRecorder("low-a", log));
  const lowB = new Entity({ renderOrder:-1 }); lowB.addComponent(new DrawRecorder("low-b", log));
  scene.add(high); scene.add(lowA); scene.add(lowB); scene.render(context);
  assert.deepEqual(log, ["low-a", "low-b", "high"]);
});
test("entity rejects non-finite render order", () => {
  assert.throws(() => new Entity({ renderOrder: Number.NaN }), TypeError);
});
