import { SceneManager } from "./SceneManager.js";
import { InputManager } from "../input/InputManager.js";
import { AudioManager } from "../audio/AudioManager.js";
import { PointerManager } from "../input/PointerManager.js";
import { Profiler } from "./Profiler.js";
import { Logger } from "./Logger.js";
import { Viewport } from "../graphics/Viewport.js";

/** Browser game loop with clamped delta time, pause/resume, and explicit disposal. */
export class Engine {
  constructor(canvas, { width = 960, height = 540, background = "#10131c", maxDelta = 0.1, fixedDelta = 1 / 60, maxSubSteps = 5, targetFPS = 0, debug = false, audio = true, viewport = false, pixelArt = false } = {}) {
    if (!canvas?.getContext) throw new TypeError("Engine requires a canvas element.");
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    if (!this.ctx) throw new Error("2D canvas context is unavailable.");
    
    this.width = width; this.height = height; this.background = background;
    this.profiler = new Profiler(); this.logger = new Logger("S2DWGE", "warn");
    
    if (!Number.isFinite(maxDelta) || maxDelta <= 0) throw new RangeError("maxDelta must be a positive finite number");
    if (!Number.isFinite(fixedDelta) || fixedDelta <= 0) throw new RangeError("fixedDelta must be a positive finite number");
    if (!Number.isInteger(maxSubSteps) || maxSubSteps < 1) throw new RangeError("maxSubSteps must be a positive integer");
    if (!Number.isFinite(targetFPS) || targetFPS < 0 || (targetFPS > 0 && targetFPS < 1) || targetFPS > 1000) throw new RangeError("targetFPS must be 0 (uncapped) or between 1 and 1000");
    
    this.maxDelta = maxDelta; this.fixedDelta = fixedDelta; this.maxSubSteps = maxSubSteps;
    this.targetFPS = targetFPS; this.debug = debug;
    
    canvas.width = width; canvas.height = height;
    
    this.viewport = viewport ? new Viewport(canvas, width, height, { ...(typeof viewport === "object" ? viewport : {}), pixelArt: typeof viewport === "object" ? (viewport.pixelArt ?? pixelArt) : pixelArt }) : null;
    this.input = new InputManager();
    this.pointer = new PointerManager(canvas, { coordinateTransform: this.viewport ? (x, y) => this.viewport.toLogical(x, y) : null });
    this.audio = audio ? new AudioManager() : null;
    this.scenes = new SceneManager(this);
    
    this.running = false; this.paused = false; this.disposed = false;
    this._raf = 0; this._lastTime = 0; this._lastRenderTime = -Infinity; this._accumulator = 0;
    
    this._boundFrame = t => this._frame(t);
    this._boundVisibility = this.handleVisibilityChange.bind(this);
    
    document.addEventListener("visibilitychange", this._boundVisibility);
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.input.clear();
      this.pointer.clear();
      this._lastTime = 0;
      this._accumulator = 0;
    }
  }

  start(sceneName) {
    if (this.disposed) throw new Error("Cannot start a disposed engine.");
    if (sceneName) this.scenes.switchTo(sceneName);
    if (!this.running) {
      this.running = true; this.paused = false; this._lastTime = 0; this._lastRenderTime = -Infinity;
      this._raf = requestAnimationFrame(this._boundFrame);
    }
    return this;
  }

  pause() { this.paused = true; this._accumulator = 0; this.input.clearTransient(); }
  resume() { if (this.disposed) return; this.paused = false; this._accumulator = 0; this._lastTime = 0; }
  
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
    
    if (this.paused) {
      this._accumulator = 0;
    } else {
      this._accumulator += dt;
      let steps = 0;
      while (this._accumulator >= this.fixedDelta && steps < this.maxSubSteps) {
        this.scenes.update(this.fixedDelta);
        this._accumulator -= this.fixedDelta;
        steps++;
      }
      if (steps === this.maxSubSteps && this._accumulator >= this.fixedDelta) this._accumulator = 0;
    }
    
    this.input.clearTransient();
    this.pointer.clearTransient();
    
    const renderInterval = this.targetFPS > 0 ? 1000 / this.targetFPS : 0;
    
    // FIX: Subtract a small threshold cushion (0.1ms) to offset minor browser frame jitter
    if (renderInterval === 0 || (timestamp - this._lastRenderTime) >= (renderInterval - 0.1)) {
      this._render();
      // Keep render timeline updates uniform instead of drifting with jittered frame times
      this._lastRenderTime = renderInterval === 0 ? timestamp : timestamp - ((timestamp - this._lastRenderTime) % renderInterval);
    }
    
    this._raf = requestAnimationFrame(this._boundFrame);
  }

  _render() {
    const ctx = this.ctx;
    ctx.save();
    try {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (this.viewport) {
        this.viewport.begin(ctx);
        ctx.fillStyle = this.background;
        ctx.fillRect(0, 0, this.width, this.height);
      } else {
        ctx.fillStyle = this.background;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
      this.scenes.render(ctx);
      if (this.debug) this._renderDebug(ctx);
    } finally { ctx.restore(); }
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
    this.viewport?.dispose();
    this.audio?.dispose();
    document.removeEventListener("visibilitychange", this._boundVisibility);
    this.disposed = true;
  }
}
