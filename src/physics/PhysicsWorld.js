import { Collision } from "./Collision.js";
import { PhysicsBody } from "./PhysicsBody.js";
import { SpatialHash } from "./SpatialHash.js";

/** AABB physics world with grid broad-phase, filtered pairs, contact phases and impulse response. */
export class PhysicsWorld {
  constructor({ gravityX = 0, gravityY = 900, cellSize = 128, solverIterations = 2 } = {}) {
    if (!Number.isFinite(gravityX) || !Number.isFinite(gravityY)) throw new TypeError("Gravity must be finite");
    if (!Number.isInteger(solverIterations) || solverIterations < 1 || solverIterations > 16) throw new RangeError("solverIterations must be an integer from 1 to 16");
    this.gravity = { x: gravityX, y: gravityY };
    this.colliders = new Set();
    this.broadPhase = new SpatialHash(cellSize);
    this.solverIterations = solverIterations;
    this.onCollision = null;
    this.onCollisionEnter = null;
    this.onCollisionStay = null;
    this.onCollisionExit = null;
    this._contacts = new Map();
  }
  add(collider) {
    if (!collider?.entity) throw new TypeError("Collider must be attached to an entity before registration");
    this.colliders.add(collider); return collider;
  }
  remove(collider) {
    this.colliders.delete(collider);
    for (const [key, contact] of this._contacts) {
      if (contact.a === collider || contact.b === collider) {
        this.onCollisionExit?.({ ...contact, phase: "exit" });
        this._contacts.delete(key);
      }
    }
    return true;
  }
  _valid(c) {
    if (!c?.enabled || !c.entity?.active || !c.entity.scene || c.entity._destroyed) return false;
    const b = c.bounds;
    return Number.isFinite(b.x) && Number.isFinite(b.y) && Number.isFinite(b.width) && Number.isFinite(b.height) && b.width >= 0 && b.height >= 0;
  }
  _key(a, b) { return a._physicsId < b._physicsId ? `${a._physicsId}:${b._physicsId}` : `${b._physicsId}:${a._physicsId}`; }
  step() {
    const list = [...this.colliders].filter(c => this._valid(c));
    for (const c of list) {
      const body = c.entity.getComponent(PhysicsBody);
      if (body) body.grounded = false;
      if (!Number.isInteger(c._physicsId)) c._physicsId = PhysicsWorld._nextId++;
    }
    this.broadPhase.clear();
    for (const c of list) this.broadPhase.insert(c, c.bounds);

    const pairs = new Map();
    for (const a of list) {
      for (const b of this.broadPhase.query(a.bounds)) {
        if (a === b || !(a.layer & b.mask) || !(b.layer & a.mask)) continue;
        const key = this._key(a, b);
        if (pairs.has(key)) continue;
        if (Collision.aabb(a.bounds, b.bounds)) pairs.set(key, { a, b, key, trigger: a.isTrigger || b.isTrigger });
      }
    }

    // Resolve contacts iteratively, refreshing bounds after each correction.
    for (let iteration = 0; iteration < this.solverIterations; iteration++) {
      for (const contact of pairs.values()) {
        const { a, b } = contact;
        if (contact.trigger || !this._valid(a) || !this._valid(b)) continue;
        this._resolve(a, b);
      }
    }

    const nextContacts = new Map();
    for (const contact of pairs.values()) {
      const { key } = contact;
      nextContacts.set(key, contact);
      const phase = this._contacts.has(key) ? "stay" : "enter";
      const event = { ...contact, phase };
      this.onCollision?.(event);
      (phase === "enter" ? this.onCollisionEnter : this.onCollisionStay)?.(event);
    }
    for (const [key, contact] of this._contacts) {
      if (!nextContacts.has(key)) this.onCollisionExit?.({ ...contact, phase: "exit" });
    }
    this._contacts = nextContacts;
  }
  _resolve(a, b) {
    const ab = a.bounds, bb = b.bounds;
    const overlapX = (ab.width + bb.width) / 2 - Math.abs(ab.x - bb.x);
    const overlapY = (ab.height + bb.height) / 2 - Math.abs(ab.y - bb.y);
    if (overlapX <= 0 || overlapY <= 0) return;
    const bodyA = a.entity.getComponent(PhysicsBody), bodyB = b.entity.getComponent(PhysicsBody);
    const movableA = bodyA && !bodyA.static, movableB = bodyB && !bodyB.static;
    if (!movableA && !movableB) return;
    const invA = movableA ? 1 / bodyA.mass : 0, invB = movableB ? 1 / bodyB.mass : 0;
    const invSum = invA + invB;
    const horizontal = overlapX < overlapY;
    const delta = horizontal ? ab.x - bb.x : ab.y - bb.y;
    const normalSign = delta === 0 ? 1 : Math.sign(delta);
    const nx = horizontal ? normalSign : 0, ny = horizontal ? 0 : normalSign;
    const penetration = horizontal ? overlapX : overlapY;
    const correction = Math.max(0, penetration - 0.001) / invSum;
    if (movableA) { a.entity.x += nx * correction * invA; a.entity.y += ny * correction * invA; }
    if (movableB) { b.entity.x -= nx * correction * invB; b.entity.y -= ny * correction * invB; }
    if (horizontal) {
      if (movableA) bodyA.vx = this._normalVelocity(bodyA.vx, bodyB?.vx ?? 0, bodyA.bounce, bodyB?.bounce ?? 0, invA, invB, nx);
      if (movableB) bodyB.vx = this._normalVelocity(bodyB.vx, bodyA?.vx ?? 0, bodyB.bounce, bodyA?.bounce ?? 0, invB, invA, -nx);
    } else {
      if (movableA) bodyA.vy = this._normalVelocity(bodyA.vy, bodyB?.vy ?? 0, bodyA.bounce, bodyB?.bounce ?? 0, invA, invB, ny);
      if (movableB) bodyB.vy = this._normalVelocity(bodyB.vy, bodyA?.vy ?? 0, bodyB.bounce, bodyA?.bounce ?? 0, invB, invA, -ny);
      if (movableA && ny < 0) bodyA.grounded = true;
      if (movableB && ny > 0) bodyB.grounded = true;
    }
    // Simple tangential damping based on the lower friction coefficient.
    const friction = Math.min(bodyA?.friction ?? 0.2, bodyB?.friction ?? 0.2);
    if (horizontal) {
      if (movableA) bodyA.vy *= 1 - friction * 0.05;
      if (movableB) bodyB.vy *= 1 - friction * 0.05;
    } else {
      if (movableA) bodyA.vx *= 1 - friction * 0.05;
      if (movableB) bodyB.vx *= 1 - friction * 0.05;
    }
  }
  _normalVelocity(velocity, otherVelocity, bounceA, bounceB, invA, invB, normal) {
    const relative = velocity - otherVelocity;
    if (relative * normal >= 0) return velocity;
    const restitution = Math.max(bounceA, bounceB);
    const impulse = -(1 + restitution) * relative / (invA + invB);
    return velocity + impulse * invA * normal;
  }
}
PhysicsWorld._nextId = 1;
