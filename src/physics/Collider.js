import { Component } from "../core/Component.js";
import { Collision } from "./Collision.js";

/** Component-backed AABB collider. Register it with the scene collision world. */
export class Collider extends Component {
  constructor({ width = null, height = null, offsetX = 0, offsetY = 0, isTrigger = false, layer = 1, mask = 0xffffffff } = {}) {
    super();
    this.width = width; this.height = height; this.offsetX = offsetX; this.offsetY = offsetY;
    this.isTrigger = isTrigger; this.layer = layer; this.mask = mask;
  }
  get bounds() {
    const e = this.entity;
    return { x: e.x + this.offsetX, y: e.y + this.offsetY, width: this.width ?? e.width, height: this.height ?? e.height };
  }
  overlaps(other) { return Collision.aabb(this.bounds, other.bounds); }
}
