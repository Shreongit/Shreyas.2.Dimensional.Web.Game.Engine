/** Mouse/touch pointer state in canvas-local CSS pixels. */
export class PointerManager {
  constructor(canvas) {
    this.canvas = canvas; this.x = 0; this.y = 0; this.down = false;
    this.justPressed = false; this.justReleased = false; this.buttons = new Set();
    this._move = e => this._position(e);
    this._down = e => { this._position(e); this.down = true; this.buttons.add(e.button); this.justPressed = true; };
    this._up = e => { this._position(e); this.down = false; this.buttons.delete(e.button); this.justReleased = true; };
    canvas.addEventListener("pointermove", this._move);
    canvas.addEventListener("pointerdown", this._down);
    window.addEventListener("pointerup", this._up);
  }
  _position(e) { const r = this.canvas.getBoundingClientRect(); this.x = (e.clientX-r.left) * (this.canvas.width/r.width); this.y = (e.clientY-r.top) * (this.canvas.height/r.height); }
  update() { this.justPressed = false; this.justReleased = false; }
  dispose() { this.canvas.removeEventListener("pointermove",this._move); this.canvas.removeEventListener("pointerdown",this._down); window.removeEventListener("pointerup",this._up); this.buttons.clear(); }
}
