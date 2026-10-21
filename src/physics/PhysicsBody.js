import { Component } from "../core/Component.js";

/** 2D point-mass body. Units are pixels, seconds, and pixels/second. */
export class PhysicsBody extends Component {
  constructor({ vx = 0, vy = 0, gravityScale = 1, mass = 1, drag = 0, maxSpeed = Infinity, static: isStatic = false, bounce = 0, friction = 0.2 } = {}) {
    super();
    if (!Number.isFinite(mass) || mass <= 0) throw new RangeError("mass must be a finite number greater than zero");
    for (const [name, value] of Object.entries({ vx, vy, gravityScale, drag, bounce, friction })) {
      if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
    }
    if (maxSpeed !== Infinity && (!Number.isFinite(maxSpeed) || maxSpeed < 0)) throw new RangeError("maxSpeed must be non-negative");
    this.vx = vx; this.vy = vy; this.gravityScale = gravityScale; this.mass = mass;
    this.drag = Math.max(0, drag); this.maxSpeed = maxSpeed; this.static = Boolean(isStatic);
    this.bounce = Math.max(0, Math.min(1, bounce));
    this.friction = Math.max(0, Math.min(1, friction));
    this.grounded = false;
    this._forceX = 0; this._forceY = 0;
  }
  update(dt) {
    if (this.static || !this.enabled) return;
    const gravity = this.entity.scene?.physics?.gravity ?? { x: 0, y: 0 };
    this.vx += (gravity.x * this.gravityScale + this._forceX / this.mass) * dt;
    this.vy += (gravity.y * this.gravityScale + this._forceY / this.mass) * dt;
    this._forceX = 0; this._forceY = 0;
    const damping = Math.exp(-this.drag * dt);
    this.vx *= damping; this.vy *= damping;
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > this.maxSpeed) { this.vx *= this.maxSpeed / speed; this.vy *= this.maxSpeed / speed; }
    this.entity.x += this.vx * dt;
    this.entity.y += this.vy * dt;
  }
  /** Accumulates a force in newton-like game units; consumed on the next body update. */
  applyForce(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new TypeError("Force components must be finite");
    if (!this.static) { this._forceX += x; this._forceY += y; }
    return this;
  }
  /** Applies an instantaneous impulse, changing velocity by impulse / mass. */
  applyImpulse(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new TypeError("Impulse components must be finite");
    if (!this.static) { this.vx += x / this.mass; this.vy += y / this.mass; }
    return this;
  }
  jump(velocity) {
    if (!Number.isFinite(velocity) || velocity < 0) throw new RangeError("jump velocity must be a finite non-negative number");
    if (this.grounded) { this.vy = -velocity; this.grounded = false; return true; }
    return false;
  }
}
