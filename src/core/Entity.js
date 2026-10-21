import { Collider } from "../physics/Collider.js";
/** Game object with transform, tags, and composable behaviors. */
export class Entity {
  constructor({ name = "Entity", x = 0, y = 0, width = 0, height = 0, tag = "", renderOrder = 0 } = {}) {
    this.name = name;
    this.x = x; this.y = y;
    this.width = width; this.height = height;
    this.rotation = 0; this.scaleX = 1; this.scaleY = 1;
    this.visible = true; this.active = true;
    this.tag = tag;
    if (!Number.isFinite(renderOrder)) throw new TypeError("renderOrder must be finite");
    this.renderOrder = renderOrder;
    this.scene = null;
    this.components = [];
    this._started = false;
    this._destroyed = false;
  }
  addComponent(component) {
    if (!component || typeof component.update !== "function") throw new TypeError("Component must implement update(dt).");
    if (component.entity) throw new Error("Component is already attached to an entity.");
    component.entity = this;
    this.components.push(component);
    component.onAttach();
    if (this.scene && component instanceof Collider) this.scene.physics.add(component);
    if (this._started) component.start();
    return component;
  }
  getComponent(Type) { return this.components.find(c => c instanceof Type) ?? null; }
  removeComponent(component) {
    const i = this.components.indexOf(component);
    if (i < 0) return false;
    component.onDetach();
    if (this.scene && component instanceof Collider) this.scene.physics.remove(component);
    component.entity = null;
    this.components.splice(i, 1);
    return true;
  }
  start() {
    if (this._started) return;
    this._started = true;
    for (const component of this.components) component.start();
  }
  update(dt) {
    if (!this.active || this._destroyed) return;
    for (const component of [...this.components]) if (component.enabled) component.update(dt);
  }
  render(ctx) {
    if (!this.visible || this._destroyed) return;
    ctx.save();
    try {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.scale(this.scaleX, this.scaleY);
      for (const component of this.components) if (component.enabled) component.render(ctx);
    } finally {
      ctx.restore();
    }
  }
  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    for (const component of [...this.components]) this.removeComponent(component);
    if (this.scene) this.scene.remove(this);
  }
}