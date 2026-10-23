/** Mouse/touch pointer state in canvas-local backing-store pixels without tracking allocations. */
export class PointerManager {
  constructor(canvas, { coordinateTransform = null } = {}) {
    if (!canvas?.addEventListener || !canvas?.getBoundingClientRect) throw new TypeError("PointerManager requires a canvas-like event target");
    
    this.canvas = canvas; 
    this.coordinateTransform = coordinateTransform; 
    this.x = 0; 
    this.y = 0; 
    this.inside = false; 
    this.down = false;
    this.justPressed = false; 
    this.justReleased = false; 
    
    // FIX: Using bitmask flags instead of a Set to prevent garbage collections every click
    this.buttonMask = 0; 
    
    this._move = e => this._position(e);
    this._down = e => {
      this._position(e); 
      this.down = true;
      
      const mask = 1 << e.button;
      if ((this.buttonMask & mask) === 0) this.justPressed = true;
      this.buttonMask |= mask;
    };
    this._up = e => {
      this._position(e); 
      this.buttonMask &= ~(1 << e.button); 
      this.down = this.buttonMask > 0;
      this.justReleased = true;
    };
    this._cancel = () => { 
      if (this.down) this.justReleased = true; 
      this.down = false; 
      this.buttonMask = 0; 
    };
    
    canvas.addEventListener("pointermove", this._move);
    canvas.addEventListener("pointerdown", this._down);
    globalThis.addEventListener?.("pointerup", this._up);
    globalThis.addEventListener?.("pointercancel", this._cancel);
    globalThis.addEventListener?.("blur", this._cancel);
  }

  _position(e) {
    const r = this.canvas.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    
    if (this.coordinateTransform) {
      const point = this.coordinateTransform(e.clientX, e.clientY);
      this.x = point.x; 
      this.y = point.y; 
      this.inside = point.inside ?? true;
    } else {
      this.x = (e.clientX - r.left) * (this.canvas.width / r.width);
      this.y = (e.clientY - r.top) * (this.canvas.height / r.height);
      this.inside = this.x >= 0 && this.y >= 0 && this.x < this.canvas.width && this.y < this.canvas.height;
    }
  }

  /** Keep edge events alive until the engine finishes the current frame. */
  update() {}

  clearTransient() { 
    this.justPressed = false; 
    this.justReleased = false; 
  }

  clear() {
    if (this.down) this.justReleased = true;
    this.down = false;
    this.buttonMask = 0;
  }

  dispose() {
    this.canvas.removeEventListener("pointermove", this._move);
    this.canvas.removeEventListener("pointerdown", this._down);
    globalThis.removeEventListener?.("pointerup", this._up);
    globalThis.removeEventListener?.("pointercancel", this._cancel);
    globalThis.removeEventListener?.("blur", this._cancel);
    this.clear(); 
    this.clearTransient();
  }
}
