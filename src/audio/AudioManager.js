/** Optional Web Audio wrapper; gracefully handles unsupported browsers. */
export class AudioManager {
  constructor() {
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    this.context = AudioContextClass ? new AudioContextClass() : null;
    this.master = this.context?.createGain() ?? null;
    if (this.master) { this.master.gain.value = 0.7; this.master.connect(this.context.destination); }
    this.buffers = new Map(); this.sources = new Set();
  }
  async unlock() {
    if (this.context?.state === "suspended") {
      try { await this.context.resume(); } catch (error) { console.warn("Audio could not resume:", error); }
    }
  }
  setVolume(value) { if (this.master) this.master.gain.value = Math.max(0, Math.min(1, value)); }
  async load(name, url) {
    if (!this.context) return false;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Audio load failed (${response.status}): ${url}`);
    const buffer = await response.arrayBuffer();
    this.buffers.set(name, await this.context.decodeAudioData(buffer));
    return true;
  }
  play(name, { loop = false, volume = 1 } = {}) {
    const buffer = this.buffers.get(name);
    if (!this.context || !buffer) return null;
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer; source.loop = loop; gain.gain.value = Math.max(0, Math.min(1, volume));
    source.connect(gain); gain.connect(this.master); this.sources.add(source);
    source.addEventListener("ended", () => this.sources.delete(source), { once: true });
    source.start();
    return source;
  }
  stopAll() { for (const source of this.sources) { try { source.stop(); } catch {} } this.sources.clear(); }
  dispose() { this.stopAll(); this.buffers.clear(); this.master?.disconnect(); this.context?.close(); this.context = null; }
}