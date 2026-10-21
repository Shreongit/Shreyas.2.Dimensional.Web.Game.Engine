/** Semantic keyboard actions with edge-triggered pressed/released states. */
export class InputManager {
  constructor(target = window) {
    this.target = target;
    this.down = new Set(); this.previous = new Set();
    this.actions = new Map();
    this._onDown = e => { this.down.add(e.code); };
    this._onUp = e => { this.down.delete(e.code); };
    this._onBlur = () => this.clear();
    target.addEventListener("keydown", this._onDown);
    target.addEventListener("keyup", this._onUp);
    window.addEventListener("blur", this._onBlur);
  }
  bind(action, codes) { this.actions.set(action, Array.isArray(codes) ? codes : [codes]); return this; }
  isDown(codeOrAction) { return this.actions.has(codeOrAction) ? this.actions.get(codeOrAction).some(c => this.down.has(c)) : this.down.has(codeOrAction); }
  pressed(codeOrAction) { return this._matches(codeOrAction, this.down) && !this._matches(codeOrAction, this.previous); }
  released(codeOrAction) { return !this._matches(codeOrAction, this.down) && this._matches(codeOrAction, this.previous); }
  _matches(key, set) { return this.actions.has(key) ? this.actions.get(key).some(c => set.has(c)) : set.has(key); }
  update() { /* Edge states remain readable until clearTransient() at frame end. */ }
  clearTransient() { this.previous = new Set(this.down); }
  clear() { this.down.clear(); this.previous.clear(); }
  dispose() {
    this.target.removeEventListener("keydown", this._onDown);
    this.target.removeEventListener("keyup", this._onUp);
    window.removeEventListener("blur", this._onBlur);
    this.clear(); this.actions.clear();
  }
}