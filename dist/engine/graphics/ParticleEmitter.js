/** Small pooled-style particle emitter for sparks, dust, and effects. */
export class ParticleEmitter {
  constructor({ rate = 20, life = [0.3, 0.8], speed = [30, 100], angle = [0, Math.PI * 2], size = [2, 5], color = "#ffffff", gravityY = 0, maxParticles = 500 } = {}) {
    this.rate = rate; this.life = life; this.speed = speed; this.angle = angle; this.size = size;
    this.color = color; this.gravityY = gravityY; this.maxParticles = maxParticles;
    this.particles = []; this.accumulator = 0; this.x = 0; this.y = 0; this.emitting = true;
  }
  _range(pair) { return pair[0] + Math.random() * (pair[1] - pair[0]); }
  emit(count = 1) {
    for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
      const a = this._range(this.angle), s = this._range(this.speed);
      this.particles.push({ x: this.x, y: this.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, age: 0, life: this._range(this.life), size: this._range(this.size) });
    }
  }
  update(dt) {
    if (this.emitting && this.rate > 0) { this.accumulator += dt * this.rate; const n = Math.floor(this.accumulator); this.accumulator -= n; this.emit(n); }
    for (const p of this.particles) { p.age += dt; p.vy += this.gravityY * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    this.particles = this.particles.filter(p => p.age < p.life);
  }
  render(ctx) {
    ctx.save(); ctx.fillStyle = this.color;
    for (const p of this.particles) { ctx.globalAlpha = Math.max(0, 1 - p.age / p.life); ctx.fillRect(p.x, p.y, p.size, p.size); }
    ctx.restore();
  }
}
