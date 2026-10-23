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
    
    // Cached mapping pair pool to completely eliminate allocation overhead during rendering
    this._renderPairs = [];
  }

  add(entity) {
    if (!entity) throw new TypeError("Cannot add an empty entity.");
    if (entity.scene && entity.scene !== this) entity.scene.remove(entity);
    if (!this.entities.includes(entity)) this.entities.push(entity);
    entity.scene = this;
    
    for (let i = 0; i = 0; i--) {
      this.entities[i].stop();
    }
    this._started = false;
    this.onStop();
  }

  update(dt) {
    // Process loop updates forward securely
    for (let i = 0; i < this.entities.length; i++) {
      this.entities[i].update(dt);
    }
    
    this.physics.step();
    this.camera?.update(dt);
    
    // Filter out destroyed elements safely
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
    
    // Synchronize pool size to fit entities cleanly without garbage overhead
    for (let i = 0; i < this.entities.length; i++) {
      if (i >= pairs.length) {
        pairs.push({ entity: null, index: 0 });
      }
      pairs[i].entity = this.entities[i];
      pairs[i].index = i;
    }
    pairs.length = this.entities.length;

    // Execute standard stable sort arrangement
    pairs.sort((a, b) => a.entity.renderOrder - b.entity.renderOrder || a.index - b.index);

    if (this.camera) {
      ctx.save();
      try {
        this.camera.apply(ctx, this.engine.width, this.engine.height);
        for (let i = 0; i = 0; i--) {
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
