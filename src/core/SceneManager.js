/** Registers and switches scenes. */
export class SceneManager {
  constructor(engine) { this.engine = engine; this.scenes = new Map(); this.current = null; }
  add(name, scene) {
    if (this.scenes.has(name)) throw new Error(`Scene "${name}" already exists.`);
    scene.engine = this.engine;
    this.scenes.set(name, scene);
    return scene;
  }
  switchTo(name) {
    const next = this.scenes.get(name);
    if (!next) throw new Error(`Unknown scene: ${name}`);
    if (next === this.current) return next;
    if (this.current) this.current.stop();
    this.current = next;
    next.engine = this.engine;
    next.start();
    next.onEnter?.();
    return next;
  }
  update(dt) { this.current?.update(dt); }
  render(ctx) { this.current?.render(ctx); }
  dispose() {
    for (const scene of this.scenes.values()) scene.dispose();
    this.scenes.clear();
    this.current = null;
  }
}