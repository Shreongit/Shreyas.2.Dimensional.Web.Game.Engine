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
    this._renderPairs = [];
  }

  add(entity) {
    if (!entity) throw new TypeError("Cannot add an empty entity.");
    if (entity.scene && entity.scene !== this) entity.scene.remove(entity);
    if (!this.entities.includes(entity)) this.entities.push(entity);
    entity.scene = this;
    
    for (let i = 0; i < entity.components.length; i++) {
      const component = entity.components[i];
      if (component instanceof Collider) this.physics.add(component);
    }
    
    if (this._started) entity.start();
    return entity;
  }

  remove(entity) {
    const i = this.entities.indexOf(entity);
    if (i < 0) return false;
    this.entities.splice(i, 1);
    entity.stop();
    
    for (let j = 0; j < entity.components.length; j++) {
      const component = entity.components[j];
      if (component instanceof Collider) this.physics.remove(component);
    }
    
    entity.scene = null;
    return true;
  }

  start() {
    if (this._started) return;
    this._started = true;
    for (let i = 0; i < this.entities.length; i++) {
      this.entities[i].start();
    }
    this.onStart();
  }

  onStart() {}
  onStop() {}

  stop() {
    if (!this._started) return;
    for (let i = this.entities.length - 1; i >= 0; i--) {
      this.entities[i].stop();
    }
    this._started = false;
    this.onStop();
  }

  update(dt) {
    for (let i = 0; i < this.entities.length; i++) {
      this.entities[i].update(dt);
    }
    
    this.physics.step();
    this.camera?.update(dt);
    
    let writeIndex = 0;
    for (let i = 0; i < this.entities.length; i++) {
      if (!this.entities[i]._destroyed) {
        this.entities[writeIndex++] = this.entities[i];
      }
    }
    this.entities.length = writeIndex;
  }

  render(ctx) {
    const pairs = this._renderPairs;
    
    for (let i = 0; i < this.entities.length; i++) {
      if (i >= pairs.length) {
        pairs.push({ entity: null, index: 0 });
      }
      pairs[i].entity = this.entities[i];
      pairs[i].index = i;
    }
    pairs.length = this.entities.length;

    pairs.sort((a, b) => a.entity.renderOrder - b.entity.renderOrder || a.index - b.index);

    if (this.camera) {
      ctx.save();
      this.camera.apply(ctx, this.engine.width, this.engine.height);
      for (let i = 0; i < pairs.length; i++) {
        pairs[i].entity.render(ctx);
      }
      ctx.restore();
      return;
    }
    
    for (let i = 0; i < pairs.length; i++) {
      pairs[i].entity.render(ctx);
    }
  }

  dispose() {
    this.stop();
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      entity.scene = null;
      entity.destroy();
    }
    this.entities.length = 0;
    this._renderPairs.length = 0;
    this.engine = null;
    this._started = false;
  }
}
