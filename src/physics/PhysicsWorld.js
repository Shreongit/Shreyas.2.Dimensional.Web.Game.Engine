import { Collision } from "./Collision.js";
import { PhysicsBody } from "./PhysicsBody.js";
import { SpatialHash } from "./SpatialHash.js";

/**
 * Lightweight deterministic AABB physics world. Coordinates are center-based;
 * velocities use world-units/second. This is not a rotational rigid-body solver.
 */
export class PhysicsWorld {
  static _nextId = 1;
  static _nextId = 1;
  // FIX: Properly initialize static sequence pointer for distinct entity tags
  static _nextId = 1;

  constructor({ gravityX = 0, gravityY = 900, cellSize = 128, solverIterations = 4, positionCorrection = 0.8, penetrationSlop = 0.01, enableCCD = true } = {}) {
    if (!Number.isFinite(gravityX) || !Number.isFinite(gravityY)) throw new TypeError("Gravity must be finite");
    if (!Number.isInteger(solverIterations) || solverIterations < 1 || solverIterations > 16) throw new RangeError("solverIterations must be an integer from 1 to 16");
    if (!Number.isFinite(positionCorrection) || positionCorrection < 0 || positionCorrection > 1) throw new RangeError("positionCorrection must be between 0 and 1");
    if (!Number.isFinite(penetrationSlop) || penetrationSlop < 0) throw new RangeError("penetrationSlop must be non-negative");
    
    this.gravity = { x: gravityX, y: gravityY };
    this.colliders = new Set(); 
    this.broadPhase = new SpatialHash(cellSize);
    this.solverIterations = solverIterations; 
    this.positionCorrection = positionCorrection;
    this.penetrationSlop = penetrationSlop; 
    this.enableCCD = Boolean(enableCCD);
    this.onCollision = null; 
    this.onCollisionEnter = null; 
    this.onCollisionStay = null; 
    this.onCollisionExit = null;
    
    this._contacts = new Map(); 
    this._stepping = false;

    // FIX: Allocation-free structural caches to optimize framework engine loop routines
    this._activeList = [];
    this._pairs = new Map();
    this._sweptBoundsCache = { x: 0, y: 0, width: 0, height: 0 };
  }

  add(collider) {
    if (!collider?.entity) throw new TypeError("Collider must be attached to an entity before registration");
    this.colliders.add(collider); 
    return collider;
  }

  remove(collider) {
    const existed = this.colliders.delete(collider);
    for (const [key, contact] of this._contacts) {
      if (contact.a === collider || contact.b === collider) {
        this._emit(this.onCollisionExit, { ...contact, phase: "exit" }); 
        this._contacts.delete(key);
      }
    }
    return existed;
  }

  _valid(c) {
    if (!c?.enabled || !c.entity?.active || !c.entity.scene || c.entity._destroyed) return false;
    const b = c.bounds;
    return [b.x, b.y, b.width, b.height].every(Number.isFinite) && b.width >= 0 && b.height >= 0;
  }

  _moves(body) { 
    return Boolean(body && body.enabled && !body.static); 
  }

  // FIX: Shift tracking keys from string maps to bitwise shifted integers to optimize lookup performance
  _key(a, b) { 
    const idA = a._physicsId;
    const idB = b._physicsId;
    return idA < idB ? ((idA & 0xFFFF) << 16) | (idB & 0xFFFF) : ((idB & 0xFFFF) << 16) | (idA & 0xFFFF);
  }

  _emit(callback, event) {
    if (!callback) return;
    try { callback(event); } catch (error) { queueMicrotask(() => { throw error; }); }
  }

  step() {
    if (this._stepping) throw new Error("PhysicsWorld.step() cannot be called recursively");
    this._stepping = true;
    try { this._step(); } finally { this._stepping = false; }
  }

  _step() {
    // FIX: Reuse array shell structure instead of spreading filters every tick
    const list = this._activeList;
    list.length = 0;
    
    for (const c of this.colliders) {
      if (this._valid(c)) {
        if (!Number.isInteger(c._physicsId)) c._physicsId = PhysicsWorld._nextId++;
        const body = c.entity.getComponent(PhysicsBody);
        if (body) body.grounded = false;
        list.push(c);
      }
    }

    this.broadPhase.clear();
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      this.broadPhase.insert(c, this._sweptBounds(c));
    }

    const pairs = this._pairs;
    pairs.clear();

    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      const candidates = this.broadPhase.query(this._sweptBounds(a));
      
      for (let j = 0; j < candidates.length; j++) {
        const b = candidates[j];
        if (a === b || !(a.layer & b.mask) || !(b.layer & a.mask)) continue;
        
        const key = this._key(a, b); 
        if (pairs.has(key)) continue;
        
        const hit = this._contact(a, b);
        if (hit) {
          pairs.set(key, { 
            a, b, key, 
            trigger: a.isTrigger || b.isTrigger, 
            normalX: hit.nx, normalY: hit.ny, 
            penetration: hit.penetration, 
            toi: hit.toi ?? 1 
          });
        }
      }
    }

    // Position correction and impulses are iterated to reduce residual overlap.
    for (let i = 0; i < this.solverIterations; i++) {
      for (const c of pairs.values()) {
        if (c.trigger || !this._valid(c.a) || !this._valid(c.b)) continue;
        const hit = this._contact(c.a, c.b);
        if (hit && hit.penetration > 0) this._resolve(c.a, c.b, hit);
        else if (i === 0 && hit?.toi < 1) this._resolveSweep(c.a, c.b, hit);
      }
    }

    const next = new Map();
    for (const c of pairs.values()) {
      const hit = this._contact(c.a, c.b);
      const event = { ...c, normalX: hit?.nx ?? c.normalX, normalY: hit?.ny ?? c.normalY, penetration: hit?.penetration ?? 0 };
      next.set(c.key, event);
      
      const phase = this._contacts.has(c.key) ? "stay" : "enter";
      this._emit(this.onCollision, { ...event, phase });
      this._emit(phase === "enter" ? this.onCollisionEnter : this.onCollisionStay, { ...event, phase });
    }

    for (const [key, c] of this._contacts) {
      if (!next.has(key)) this._emit(this.onCollisionExit, { ...c, phase: "exit" });
    }
    this._contacts = next;
  }

  _sweptBounds(c) {
    const b = c.bounds;
    const body = c.entity.getComponent(PhysicsBody);
    if (!this.enableCCD || !this._moves(body)) return b;
    
    const dx = c.entity.x - body.previousX;
    const dy = c.entity.y - body.previousY;
    
    // FIX: Update pre-allocated cache object values directly to stop frame-by-frame GC generation
    const cache = this._sweptBoundsCache;
    cache.x = b.x - dx / 2;
    cache.y = b.y - dy / 2;
    cache.width = b.width + Math.abs(dx);
    cache.height = b.height + Math.abs(dy);
    return cache;
  }

  _contact(a, b) {
    const A = a.bounds;
    const B = b.bounds;
    const ox = (A.width + B.width) / 2 - Math.abs(A.x - B.x);
    const oy = (A.height + B.height) / 2 - Math.abs(A.y - B.y);
    
    if (ox > 0 && oy > 0) {
      if (ox < oy) return { nx: A.x < B.x ? -1 : 1, ny: 0, penetration: ox, toi: 1 };
      return { nx: 0, ny: A.y < B.y ? -1 : 1, penetration: oy, toi: 1 };
    }
    if (!this.enableCCD) return null;
    return this._sweepAABB(a, b);
  }

  _sweepAABB(a, b) {
    const A = a.bounds;
    const B = b.bounds;
    const bodyA = a.entity.getComponent(PhysicsBody);
    const bodyB = b.entity.getComponent(PhysicsBody);
    
    const dxA = this._moves(bodyA) ? a.entity.x - bodyA.previousX : 0;
    const dyA = this._moves(bodyA) ? a.entity.y - bodyA.previousY : 0;
    const dxB = this._moves(bodyB) ? b.entity.x - bodyB.previousX : 0;
    const dyB = this._moves(bodyB) ? b.entity.y - bodyB.previousY : 0;
    
    const dx = dxA - dxB;
    const dy = dyA - dyB;
    if (dx === 0 && dy === 0) return null;
    
    const startBX = B.x - dxB;
    const startBY = B.y - dyB;
    
    const expanded = {
      left: startBX - (A.width + B.width) / 2,
      right: startBX + (A.width + B.width) / 2,
      top: startBY - (A.height + B.height) / 2,
      bottom: startBY + (A.height + B.height) / 2
    };
    
    const px = bodyA && !bodyA.static ? bodyA.previousX : a.entity.x;
    const py = bodyA && !bodyA.static ? bodyA.previousY : a.entity.y;
    const x0 = px - a.entity.x + A.x;
    const y0 = py - a.entity.y + A.y;
    
    let tx1, tx2, ty1, ty2;
    if (dx === 0) { 
      if (x0 < expanded.left || x0 > expanded.right) return null; 
      tx1 = -Infinity; tx2 = Infinity; 
    } else { 
      tx1 = (expanded.left - x0) / dx; 
      tx2 = (expanded.right - x0) / dx; 
    }
    
    if (dy === 0) { 
      if (y0 < expanded.top || y0 > expanded.bottom) return null; 
      ty1 = -Infinity; ty2 = Infinity; 
    } else { 
      ty1 = (expanded.top - y0) / dy; 
      ty2 = (expanded.bottom - y0) / dy; 
    }
    
    const xEntry = Math.min(tx1, tx2), xExit = Math.max(tx1, tx2);
    const yEntry = Math.min(ty1, ty2), yExit = Math.max(ty1, ty2);
    const entry = Math.max(xEntry, yEntry), exit = Math.min(xExit, yExit);
    
    if (entry < 0 || entry > 1 || entry > exit) return null;

    const useX = xEntry > yEntry || (xEntry === yEntry && Math.abs(dx) >= Math.abs(dy));
    return useX
      ? { nx: dx > 0 ? -1 : 1, ny: 0, penetration: 0, toi: entry }
      : { nx: 0, ny: dy > 0 ? -1 : 1, penetration: 0, toi: entry };
  }

  _resolveSweep(a, b, hit) {
    const bodyA = a.entity.getComponent(PhysicsBody);
    const bodyB = b.entity.getComponent(PhysicsBody);
    const moveA = this._moves(bodyA);
    const moveB = this._moves(bodyB);
    
    const invA = moveA ? 1 / bodyA.mass : 0;
    const invB = moveB ? 1 / bodyB.mass : 0;
    const total = invA + invB;
    if (!total) return;
    
    if (moveA) { 
      a.entity.x = bodyA.previousX + (a.entity.x - bodyA.previousX) * hit.toi; 
      a.entity.y = bodyA.previousY + (a.entity.y - bodyA.previousY) * hit.toi; 
    }
    if (moveB) { 
      b.entity.x = bodyB.previousX + (b.entity.x - bodyB.previousX) * hit.toi; 
      b.entity.y = bodyB.previousY + (b.entity.y - bodyB.previousY) * hit.toi; 
    }
    
    this._applyImpulse(bodyA, bodyB, hit.nx, hit.ny, invA, invB);
    if (moveA && hit.ny < 0) bodyA.grounded = true;
    if (moveB && hit.ny > 0) bodyB.grounded = true;
  }

  _resolve(a, b, hit) {
    const bodyA = a.entity.getComponent(PhysicsBody);
    const bodyB = b.entity.getComponent(PhysicsBody);
    const moveA = this._moves(bodyA);
    const moveB = this._moves(bodyB);

    const invA = moveA ? 1 / bodyA.mass : 0;
    const invB = moveB ? 1 / bodyB.mass : 0;
    const total = invA + invB;
    if (!total) return;

    const correction = Math.max(hit.penetration - this.penetrationSlop, 0) / total * this.positionCorrection;
    const cx = hit.nx * correction;
    const cy = hit.ny * correction;

    if (moveA) { a.entity.x -= cx * invA; a.entity.y -= cy * invA; }
    if (moveB) { b.entity.x += cx * invB; b.entity.y += cy * invB; }

    this._applyImpulse(bodyA, bodyB, hit.nx, hit.ny, invA, invB);
    if (moveA && hit.ny < 0) bodyA.grounded = true;
    if (moveB && hit.ny > 0) bodyB.grounded = true;
  }

  _applyImpulse(bodyA, bodyB, nx, ny, invA, invB) {
    if (!bodyA && !bodyB) return;

    const vxA = bodyA ? bodyA.velocityX : 0;
    const vyA = bodyA ? bodyA.velocityY : 0;
    const vxB = bodyB ? bodyB.velocityX : 0;
    const vyB = bodyB ? bodyB.velocityY : 0;

    const rvx = vxB - vxA;
    const rvy = vyB - vyA;
    const velAlongNormal = rvx * nx + rvy * ny;
    if (velAlongNormal > 0) return;

    const restitution = Math.min(bodyA?.restitution ?? 0, bodyB?.restitution ?? 0);
    let impulseScalar = -(1 + restitution) * velAlongNormal;
    impulseScalar /= (invA + invB);

    const ix = impulseScalar * nx;
    const iy = impulseScalar * ny;

    if (bodyA && !bodyA.static) { bodyA.velocityX -= ix * invA; bodyA.velocityY -= iy * invA; }
    if (bodyB && !bodyB.static) { bodyB.velocityX += ix * invB; bodyB.velocityY += iy * invB; }
  }
}
