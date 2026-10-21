/** Optional Web Audio wrapper with explicit unlock, playback, and disposal semantics. */
export class AudioManager {
  constructor({ masterVolume = 0.7 } = {}) {
    if (!Number.isFinite(masterVolume) || masterVolume < 0 || masterVolume > 1) {
      throw new RangeError("masterVolume must be a finite number between 0 and 1.");
    }
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    this.context = AudioContextClass ? new AudioContextClass() : null;
    this.master = this.context?.createGain() ?? null;
    if (this.master) {
      this.master.gain.value = masterVolume;
      this.master.connect(this.context.destination);
    }
    this.buffers = new Map();
    this.sources = new Set();
    this.disposed = false;
  }

  async unlock() {
    this._assertActive();
    if (this.context?.state === "suspended") await this.context.resume();
    return Boolean(this.context);
  }

  setVolume(value) {
    this._assertActive();
    if (!Number.isFinite(value)) throw new TypeError("Volume must be a finite number.");
    if (this.master) this.master.gain.value = Math.max(0, Math.min(1, value));
  }

  async load(name, url) {
    this._assertActive();
    if (typeof name !== "string" || !name.trim()) throw new TypeError("Audio asset name must be a non-empty string.");
    if (typeof url !== "string" || !url.trim()) throw new TypeError("Audio URL must be a non-empty string.");
    if (!this.context) return false;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Audio load failed (${response.status}): ${url}`);
    const bytes = await response.arrayBuffer();
    // Disposal may occur while fetch/decode is in flight.
    this._assertActive();
    const buffer = await this.context.decodeAudioData(bytes);
    this._assertActive();
    this.buffers.set(name, buffer);
    return true;
  }

  play(name, { loop = false, volume = 1 } = {}) {
    this._assertActive();
    if (!Number.isFinite(volume)) throw new TypeError("Playback volume must be a finite number.");
    const buffer = this.buffers.get(name);
    if (!this.context || !buffer) return null;
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.loop = Boolean(loop);
    gain.gain.value = Math.max(0, Math.min(1, volume));
    source.connect(gain);
    gain.connect(this.master);
    this.sources.add(source);
    source.addEventListener("ended", () => this.sources.delete(source), { once: true });
    try {
      source.start();
    } catch (error) {
      this.sources.delete(source);
      try { source.disconnect(); } catch {}
      try { gain.disconnect(); } catch {}
      throw error;
    }
    return source;
  }

  stopAll() {
    if (this.disposed) return;
    for (const source of this.sources) {
      try { source.stop(); } catch {}
      try { source.disconnect(); } catch {}
    }
    this.sources.clear();
  }

  async dispose() {
    if (this.disposed) return;
    this.stopAll();
    this.buffers.clear();
    this.master?.disconnect();
    const context = this.context;
    this.context = null;
    this.master = null;
    this.disposed = true;
    if (context && context.state !== "closed") await context.close();
  }

  _assertActive() {
    if (this.disposed) throw new Error("AudioManager has been disposed.");
  }
}
