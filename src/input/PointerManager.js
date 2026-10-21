/** Mouse/touch pointer state in canvas-local backing-store pixels. */
export class PointerManager {
  constructor(canvas) {
    if (!canvas?.addEventListener || !canvas?.getBoundingClientRect) throw new TypeError("PointerManager requires a canvas-like event target");
    this.canvas = canvas; this.x = 0; this.y = 0; this.down = false;
    this.justPressed = false; this.justReleased = false; this.buttons = new Set();
    this._move = e => this._position(e);
    this._down = e => {
      this._position(e); this.down = true;
      if (!this.buttons.has(e.button)) this.justPressed = true;
      this.buttons.add(e.button);
    };
    this._up = e => {
      this._position(e); this.buttons.delete(e.button); this.down = this.buttons.size > 0;
      this.justReleased = true;
    };
    this._cancel = () => { if (this.down) this.justReleased = true; this.down = false; this.buttons.clear(); };
    canvas.addEventListener("pointermove", this._move);
    canvas.addEventListener("pointerdown", this._down);
    globalThis.addEventListener?.("pointerup", this._up);
    globalThis.addEventListener?.("pointercancel", this._cancel);
    globalThis.addEventListener?.("blur", this._cancel);
  }
  _position(e) {
    const r = this.canvas.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    this.x = (e.clientX - r.left) * (this.canvas.width / r.width);
    this.y = (e.clientY - r.top) * (this.canvas.height / r.height);
  }
  /** Keep edge events alive until the engine finishes the current frame. */
  update() {}
  clearTransient() { this.justPressed = false; this.justReleased = false; }
  clear() {
    if (this.down) this.justReleased = true;
    this.down = false;
    this.buttons.clear();
  }
  dispose() {
    this.canvas.removeEventListener("pointermove", this._move);
    this.canvas.removeEventListener("pointerdown", this._down);
    globalThis.removeEventListener?.("pointerup", this._up);
    globalThis.removeEventListener?.("pointercancel", this._cancel);
    globalThis.removeEventListener?.("blur", this._cancel);
    this.clear(); this.clearTransient();
  }
}
