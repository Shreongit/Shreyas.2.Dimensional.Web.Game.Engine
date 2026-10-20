/** Camera transforms world coordinates into the canvas viewport. */
export class Camera2D {
  constructor({ x = 0, y = 0, zoom = 1, rotation = 0, smoothing = 0 } = {}) {
    this.x = x; this.y = y; this.zoom = zoom; this.rotation = rotation; this.smoothing = Math.max(0, Math.min(1, smoothing));
    this.target = null;
  }
  follow(target) { this.target = target; return this; }
  update(dt) {
    if (!this.target) return;
    const alpha = this.smoothing <= 0 ? 1 : 1 - Math.pow(this.smoothing, dt * 60);
    this.x += (this.target.x - this.x) * alpha;
    this.y += (this.target.y - this.y) * alpha;
  }
  apply(ctx, width, height) {
    ctx.translate(width / 2, height / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.rotate(-this.rotation);
    ctx.translate(-this.x, -this.y);
  }
  screenToWorld(x, y, width, height) {
    const dx = (x - width / 2) / this.zoom, dy = (y - height / 2) / this.zoom;
    const c = Math.cos(this.rotation), s = Math.sin(this.rotation);
    return { x: this.x + dx * c - dy * s, y: this.y + dx * s + dy * c };
  }
  worldToScreen(x, y, width, height) {
    const dx = x - this.x, dy = y - this.y, c = Math.cos(this.rotation), s = Math.sin(this.rotation);
    return { x: width / 2 + (dx * c + dy * s) * this.zoom, y: height / 2 + (-dx * s + dy * c) * this.zoom };
  }
}
