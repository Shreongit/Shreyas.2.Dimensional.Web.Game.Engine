/** Time-based animation that catches up after long frames without unnecessary loop stepping overhead. */
export class Animation {
  constructor(frames, { frameDuration = 0.1, loop = true } = {}) {
    if (!Array.isArray(frames) || frames.length === 0) throw new TypeError("Animation requires at least one frame.");
    if (!Number.isFinite(frameDuration) || frameDuration <= 0) throw new RangeError("frameDuration must be a positive finite number.");
    
    this.frames = frames; 
    this.frameDuration = frameDuration; 
    this.loop = loop;
    this.elapsed = 0; 
    this.index = 0; 
    this.finished = false;
  }

  get currentFrame() { 
    return this.frames[this.index]; 
  }

  reset() { 
    this.elapsed = 0; 
    this.index = 0; 
    this.finished = false; 
    return this; 
  }

  update(dt) {
    if (this.finished) return;
    if (!Number.isFinite(dt) || dt < 0) throw new RangeError("Animation dt must be a finite non-negative number.");
    
    this.elapsed += dt;
    const steps = Math.floor(this.elapsed / this.frameDuration);
    if (steps <= 0) return;

    this.elapsed -= steps * this.frameDuration;

    // FIX: Eliminated the frame-by-frame loop stepping bottleneck.
    // Instead of looping, we now calculate the new frame index directly via modulo math.
    if (this.loop) {
      this.index = (this.index + steps) % this.frames.length;
    } else {
      const nextIndex = this.index + steps;
      if (nextIndex >= this.frames.length) {
        this.index = this.frames.length - 1;
        this.finished = true;
      } else {
        this.index = nextIndex;
      }
    }
  }
}
