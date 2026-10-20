import { SceneManager } from "./SceneManager.js";
import { InputManager } from "../input/InputManager.js";
import { AudioManager } from "../audio/AudioManager.js";
import { PointerManager } from "../input/PointerManager.js";
import { Profiler } from "./Profiler.js";
import { Logger } from "./Logger.js";

/** Browser game loop with clamped delta time, pause/resume, and explicit disposal. */
export class Engine {
  constructor(canvas, { width = 960, height = 540, background = "#10131c", maxDelta = 0.1, targetFPS = 0, debug = false, audio = true } = {}) {
    if (!canvas?.getContext) throw new TypeError("Engine requires a canvas element.");
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    if (!this.ctx) throw new Error("2D canvas context is unavailable.");
    this.width = width; this.height = height; this.background = background;
    this.profiler = new Profiler(); this.logger = new Logger("S2DWGE", "warn");
    this.maxDelta = maxDelta; this.targetFPS = targetFPS; this.debug = debug;
    canvas.width = width; canvas.height = height;
    this.input = new InputManager();
    this.pointer = new PointerManager(canvas);
    this.audio = audio ? new AudioManager() : null;
    this.scenes = new SceneManager(this);
    this.running = false; this.paused = false; this.disposed = false;
    this._raf = 0; this._lastTime = 0; this._accumulator = 0;
    this._boundFrame = t => this._frame(t);
    this._boundVisibility = () => { if (document.hidden) this.input.clear(); };
    document.addEventListener("visibilitychange", this._boundVisibility);
  }
  start(sceneName) {
    if (this.disposed) throw new Error("Cannot start a disposed engine.");
    if (sceneName) this.scenes.switchTo(sceneName);
    if (!this.running) {
      this.running = true; this.paused = false; this._lastTime = 0;
      this._raf = requestAnimationFrame(this._boundFrame);
    }
    return this;
  }
  pause() { this.paused = true; this.input.clearTransient(); }
  resume() { if (this.disposed) return; this.paused = false; this._lastTime = 0; }
  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0; this.input.clear();
  }
  _frame(timestamp) {
    if (!this.running || this.disposed) return;
    const rawDt = this._lastTime ? (timestamp - this._lastTime) / 1000 : 0;
    this._lastTime = timestamp;
    const dt = Math.min(Math.max(rawDt, 0), this.maxDelta);
    this.profiler.record(rawDt);
    this.pointer.update();
    this.input.update();
    if (this.input.pressed("KeyP")) this.paused = !this.paused;
    if (!this.paused) this.scenes.update(dt);
    this.input.clearTransient();
    this._render();
    this._raf = requestAnimationFrame(this._boundFrame);
  }
  _render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = this.background;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.scenes.render(ctx);
    if (this.debug) this._renderDebug(ctx);
    ctx.restore();
  }
  _renderDebug(ctx) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.7)"; ctx.fillRect(8, 8, 220, 62);
    ctx.fillStyle = "#9fffb0"; ctx.font = "12px monospace";
    ctx.fillText(`Scene: ${this.scenes.current?.name ?? "none"}`, 16, 26);
    ctx.fillText(`Entities: ${this.scenes.current?.entities.length ?? 0}`, 16, 44);
    ctx.fillText(`FPS: ${this.profiler.fps.toFixed(0)} · ${this.profiler.averageMs.toFixed(1)} ms`, 16, 62);
    ctx.restore();
  }
  dispose() {
    if (this.disposed) return;
    this.stop();
    this.scenes.dispose();
    this.input.dispose();
    this.pointer.dispose();
    this.audio?.dispose();
    document.removeEventListener("visibilitychange", this._boundVisibility);
    this.disposed = true;
  }
}