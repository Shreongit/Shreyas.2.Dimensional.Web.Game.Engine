const easing = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < .5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2
};
/** Interpolates numeric object properties over time. */
export class Tween {
  constructor(target, to, duration, { from = null, easing: easingName = "linear", onUpdate = null, onComplete = null, yoyo = false, repeat = 0 } = {}) {
    if (!(duration > 0)) throw new RangeError("Tween duration must be positive");
    this.target = target; this.to = { ...to }; this.from = from ? { ...from } : Object.fromEntries(Object.keys(to).map(k => [k, target[k]]));
    this.duration = duration; this.ease = typeof easingName === "function" ? easingName : (easing[easingName] ?? easing.linear);
    this.onUpdate = onUpdate; this.onComplete = onComplete; this.yoyo = yoyo; this.repeat = repeat;
    this.elapsed = 0; this.active = true; this.iteration = 0;
  }
  update(dt) {
    if (!this.active) return;
    this.elapsed += Math.max(0, dt);
    const t = Math.min(1, this.elapsed / this.duration), eased = this.ease(t);
    for (const key of Object.keys(this.to)) {
      const a = this.iteration % 2 && this.yoyo ? this.to[key] : this.from[key];
      const b = this.iteration % 2 && this.yoyo ? this.from[key] : this.to[key];
      this.target[key] = a + (b - a) * eased;
    }
    this.onUpdate?.(this.target, t);
    if (t >= 1) {
      if (this.iteration < this.repeat) { this.iteration++; this.elapsed = 0; }
      else { this.active = false; this.onComplete?.(this.target); }
    }
  }
  cancel() { this.active = false; }
}
