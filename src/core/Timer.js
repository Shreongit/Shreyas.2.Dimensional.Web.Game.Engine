/** Deterministic timer utilities; update timers from the engine/scene update loop. */
export class Timer {
  constructor(duration, callback, { repeat = false, immediate = false } = {}) {
    if (!(duration >= 0)) throw new RangeError("duration must be non-negative");
    this.duration = duration; 
    this.callback = callback; 
    this.repeat = repeat;
    this.elapsed = immediate ? duration : 0; 
    this.active = true; 
    this.completed = false;
  }

  update(dt) {
    if (!this.active || this.completed) return;

    // 1. Safety clamp: Prevent extreme lag spikes from freezing the loop
    const safeDt = Math.min(Math.max(0, dt), 0.1);
    this.elapsed += safeDt;

    // 2. Fix infinite loop: Handle zero-duration edge cases immediately
    if (this.duration === 0) {
      this.active = false;
      this.completed = true;
      this.callback?.();
      return;
    }

    // 3. Process accumulator safely
    while (this.elapsed >= this.duration && this.active) {
      this.elapsed -= this.duration;
      this.callback?.();
      
      if (!this.repeat) { 
        this.active = false; 
        this.completed = true; 
        break; 
      }
    }
  }

  cancel() { 
    this.active = false; 
  }

  reset() { 
    this.elapsed = 0; 
    this.active = true; 
    this.completed = false; 
    return this; 
  }
}
