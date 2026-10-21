import { Component } from "../core/Component.js";
import { Collision } from "./Collision.js";

/** Axis-aligned box collider. Entity rotation is intentionally not reflected in AABB bounds. */
export class Collider extends Component {
  constructor({ width = null, height = null, offsetX = 0, offsetY = 0, isTrigger = false, layer = 1, mask = 0xffffffff } = {}) {
    super();
    if (width !== null && (!Number.isFinite(width) || width < 0)) throw new RangeError("Collider width must be null or non-negative");
    if (height !== null && (!Number.isFinite(height) || height < 0)) throw new RangeError("Collider height must be null or non-negative");
    if (!Number.isFinite(offsetX) || !Number.isFinite(offsetY)) throw new TypeError("Collider offsets must be finite");
    if (!Number.isInteger(layer) || layer < 0 || layer > 0xffffffff || !Number.isInteger(mask) || mask < 0 || mask > 0xffffffff) throw new RangeError("Collision layer and mask must be unsigned 32-bit integers");
    this.width = width; this.height = height; this.offsetX = offsetX; this.offsetY = offsetY;
    this.isTrigger = Boolean(isTrigger); this.layer = layer; this.mask = mask;
  }
  get bounds() {
    const e = this.entity;
    if (!e) return { x: 0, y: 0, width: 0, height: 0 };
    const sx = Math.abs(e.scaleX ?? 1), sy = Math.abs(e.scaleY ?? 1);
    return {
      x: e.x + this.offsetX * (e.scaleX ?? 1),
      y: e.y + this.offsetY * (e.scaleY ?? 1),
      width: (this.width ?? e.width) * sx,
      height: (this.height ?? e.height) * sy
    };
  }
  overlaps(other) { return Collision.aabb(this.bounds, other.bounds); }
}
