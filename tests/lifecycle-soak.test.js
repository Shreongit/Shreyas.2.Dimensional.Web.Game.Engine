import test from "node:test";
import assert from "node:assert/strict";
import { Scene } from "../src/core/Scene.js";
import { Entity } from "../src/core/Entity.js";
import { Component } from "../src/core/Component.js";

class ResourceProbe extends Component {
  constructor(counter) { super(); this.counter = counter; }
  start() { this.counter.started++; this.counter.active++; }
  stop() { this.counter.stopped++; this.counter.active--; }
  update() { this.counter.updated++; }
  onDetach() { this.counter.detached++; }
}

test("lifecycle soak: repeated scene/entity creation and disposal balances component resources", () => {
  const counter = { started: 0, stopped: 0, active: 0, updated: 0, detached: 0 };
  const iterations = 250;
  for (let i = 0; i < iterations; i++) {
    const scene = new Scene(`soak-${i}`);
    const entities = Array.from({ length: 8 }, () => {
      const entity = new Entity({ x: 0, y: 0, width: 1, height: 1 });
      entity.addComponent(new ResourceProbe(counter));
      scene.add(entity);
      return entity;
    });
    scene.start();
    scene.update(1 / 60);
    assert.equal(counter.active, 8);
    scene.remove(entities[0]);
    assert.equal(counter.active, 7);
    entities[0].destroy();
    scene.dispose();
    assert.equal(counter.active, 0);
    assert.equal(scene.entities.length, 0);
    assert.equal(entities.every(entity => entity.scene === null), true);
  }
  assert.equal(counter.started, iterations * 8);
  assert.equal(counter.stopped, iterations * 8);
  assert.equal(counter.detached, iterations * 8);
  assert.equal(counter.active, 0);
});
