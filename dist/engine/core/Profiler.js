/** Lightweight rolling frame-time profiler. */
export class Profiler {
  constructor(windowSize = 120) { this.windowSize = Math.max(1, windowSize|0); this.samples = []; this.frameMs = 0; this.fps = 0; this.averageMs = 0; this.maxMs = 0; }
  record(dtSeconds) {
    this.frameMs = Math.max(0, dtSeconds * 1000);
    this.samples.push(this.frameMs);
    if (this.samples.length > this.windowSize) this.samples.shift();
    this.averageMs = this.samples.reduce((a,b)=>a+b,0)/this.samples.length;
    this.maxMs = Math.max(...this.samples);
    this.fps = this.averageMs > 0 ? 1000/this.averageMs : 0;
  }
  reset() { this.samples.length=0; this.frameMs=this.fps=this.averageMs=this.maxMs=0; }
}
