import { Component } from "../core/Component.js";

/** Example render component for colored rectangles. */
export class RectangleRenderer extends Component {
  constructor({ color = "#75e6a5", stroke = null } = {}) { super(); this.color = color; this.stroke = stroke; }
  render(ctx) {
    const e = this.entity;
    ctx.fillStyle = this.color;
    ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);
    if (this.stroke) { ctx.strokeStyle = this.stroke; ctx.strokeRect(-e.width / 2, -e.height / 2, e.width, e.height); }
  }
}