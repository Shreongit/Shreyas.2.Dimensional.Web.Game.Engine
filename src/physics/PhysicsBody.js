import { Component } from "../core/Component.js";

/** Simple 2D body using pixels, seconds, and pixels/second. */
export class PhysicsBody extends Component {
  constructor({ vx = 0, vy = 0, gravityScale = 1, mass = 1, drag = 0, maxSpeed = Infinity, static: isStatic = false, bounce = 0 } = {}) {
    super();
    if (!(mass > 0)) throw new RangeError("mass must be greater than zero");
    this.vx = vx; this.vy = vy; this.gravityScale = gravityScale; this.mass = mass;
    this.drag = Math.max(0, drag); this.maxSpeed = maxSpeed; this.static = isStatic;
    this.bounce = Math.max(0, Math.min(1, bounce));
    this.grounded = false;
  }
  update(dt) {
    if (this.static) return;
    const e = this.entity;
    const gravity = e.scene?.physics?.gravity ?? { x: 0, y: 0 };
    this.vx += gravity.x * this.gravityScale * dt;
    this.vy += gravity.y * this.gravityScale * dt;
    const damping = Math.exp(-this.drag * dt);
    this.vx *= damping; this.vy *= damping;
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > this.maxSpeed) { this.vx *= this.maxSpeed / speed; this.vy *= this.maxSpeed / speed; }
    e.x += this.vx * dt; e.y += this.vy * dt;
  }
  applyForce(x, y) { if (!this.static) { this.vx += x / this.mass; this.vy += y / this.mass; } }
  applyImpulse(x, y) { this.applyForce(x, y); }
  jump(velocity) { if (this.grounded) { this.vy = -Math.abs(velocity); this.grounded = false; return true; } return false; }
}
