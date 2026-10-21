import { PhysicsWorld } from "../physics/PhysicsWorld.js";
import { Collider } from "../physics/Collider.js";

/** A scene owns entities and their update/render lifecycle. */
export class Scene {
  constructor(name = "Scene") {
    this.name = name;
    this.entities = [];
    this.engine = null;
    this._started = false;
    this.physics = new PhysicsWorld();
    this.camera = null;
  }
  add(entity) {
    if (!entity) throw new TypeError("Cannot add an empty entity.");
    if (entity.scene && entity.scene !== this) entity.scene.remove(entity);
    if (!this.entities.includes(entity)) this.entities.push(entity);
    entity.scene = this;
    for (const component of entity.components) if (component instanceof Collider) this.physics.add(component);
    if (this._started) entity.start();
    return entity;
  }
  remove(entity) {
    const i = this.entities.indexOf(entity);
    if (i < 0) return false;
    this.entities.splice(i, 1);
    entity.stop();
    for (const component of entity.components) if (component instanceof Collider) this.physics.remove(component);
    entity.scene = null;
    return true;
  }
  start() {
    if (this._started) return;
    this._started = true;
    for (const entity of this.entities) entity.start();
    this.onStart();
  }
  onStart() {}
  onStop() {}
  stop() {
    if (!this._started) return;
    // Stop entities in reverse order so dependents can release resources first.
    for (const entity of [...this.entities].reverse()) entity.stop();
    this._started = false;
    this.onStop();
  }
  update(dt) {
    for (const entity of [...this.entities]) entity.update(dt);
    this.physics.step();
    this.camera?.update(dt);
    this.entities = this.entities.filter(e => !e._destroyed);
  }
  render(ctx) {
    const ordered = this.entities.map((entity, index) => ({ entity, index }))
      .sort((a, b) => a.entity.renderOrder - b.entity.renderOrder || a.index - b.index);
    if (this.camera) {
      ctx.save();
      try {
        this.camera.apply(ctx, this.engine.width, this.engine.height);
        for (const { entity } of ordered) entity.render(ctx);
      } finally { ctx.restore(); }
      return;
    }
    for (const { entity } of ordered) entity.render(ctx);
  }
  dispose() {
    this.stop();
    for (const entity of [...this.entities]) {
      entity.scene = null;
      entity.destroy();
    }
    this.entities.length = 0;
    this.engine = null;
    this._started = false;
  }
}