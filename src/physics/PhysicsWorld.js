import { Collision } from "./Collision.js";
import { PhysicsBody } from "./PhysicsBody.js";

/** Lightweight discrete collision world. Resolve static AABBs after body integration. */
export class PhysicsWorld {
  constructor({ gravityX = 0, gravityY = 900 } = {}) {
    this.gravity = { x: gravityX, y: gravityY };
    this.colliders = new Set();
    this.onCollision = null;
  }
  add(collider) { this.colliders.add(collider); return collider; }
  remove(collider) { return this.colliders.delete(collider); }
  step() {
    const list = [...this.colliders].filter(c => c.enabled && c.entity?.active && c.entity.scene);
    for (const c of list) {
      const body = c.entity.getComponent(PhysicsBody);
      if (body) body.grounded = false;
    }
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        if (!(a.layer & b.mask) || !(b.layer & a.mask)) continue;
        const ab = a.bounds, bb = b.bounds;
        if (!Collision.aabb(ab, bb)) continue;
        this.onCollision?.({ a, b, trigger: a.isTrigger || b.isTrigger });
        if (a.isTrigger || b.isTrigger) continue;
        const bodyA = a.entity.getComponent(PhysicsBody);
        const bodyB = b.entity.getComponent(PhysicsBody);
        const immovableA = !bodyA || bodyA.static;
        const immovableB = !bodyB || bodyB.static;
        if (immovableA && immovableB) continue;
        const overlapX = (ab.width + bb.width) / 2 - Math.abs(ab.x - bb.x);
        const overlapY = (ab.height + bb.height) / 2 - Math.abs(ab.y - bb.y);
        if (overlapX <= 0 || overlapY <= 0) continue;
        if (overlapX < overlapY) {
          const direction = Math.sign(ab.x - bb.x) || 1;
          const correction = overlapX / (Number(!immovableA) + Number(!immovableB));
          if (!immovableA) a.entity.x += direction * correction;
          if (!immovableB) b.entity.x -= direction * correction;
          if (bodyA && !bodyA.static) bodyA.vx = -bodyA.vx * bodyA.bounce;
          if (bodyB && !bodyB.static) bodyB.vx = -bodyB.vx * bodyB.bounce;
        } else {
          const direction = Math.sign(ab.y - bb.y) || 1;
          const correction = overlapY / (Number(!immovableA) + Number(!immovableB));
          if (!immovableA) a.entity.y += direction * correction;
          if (!immovableB) b.entity.y -= direction * correction;
          if (!immovableA && bodyA) {
            if (direction > 0) bodyA.grounded = true;
            bodyA.vy = -bodyA.vy * bodyA.bounce;
          }
          if (!immovableB && bodyB) {
            if (direction < 0) bodyB.grounded = true;
            bodyB.vy = -bodyB.vy * bodyB.bounce;
          }
        }
      }
    }
  }
}
