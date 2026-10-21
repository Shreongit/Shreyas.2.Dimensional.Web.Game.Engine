import test from "node:test";
import assert from "node:assert/strict";
import { AssetLoader } from "../src/assets/AssetLoader.js";
import { AudioManager } from "../src/audio/AudioManager.js";

function withGlobal(name, value, fn) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  return Promise.resolve().then(fn).finally(() => {
    if (previous) Object.defineProperty(globalThis, name, previous);
    else delete globalThis[name];
  });
}

test("asset loader defaults object entries to images and reports per-asset progress", async () => {
  await withGlobal("Image", class {
    set src(value) { this.url = value; queueMicrotask(() => this.onload()); }
  }, async () => {
    const loader = new AssetLoader();
    const progress = [];
    await loader.loadManifest({ logo: { url: "/logo.png" }, background: "/bg.png" }, { onProgress: value => progress.push(value) });
    assert.equal(loader.progress, 1);
    assert.equal(loader.loaded, 2);
    assert.equal(loader.errors.length, 0);
    assert.equal(progress.length, 2);
    assert.equal(progress.at(-1).progress, 1);
    assert.ok(loader.get("logo"));
  });
});

test("asset loader completes progress and aggregates failures when fail-fast is requested", async () => {
  await withGlobal("Image", class { set src(value) { queueMicrotask(() => this.onerror(new Error(value))); } }, async () => {
    const loader = new AssetLoader();
    const progress = [];
    await assert.rejects(
      loader.loadManifest({ badA: "/a.png", badB: "/b.png" }, { continueOnError: false, onProgress: event => progress.push(event) }),
      error => error instanceof AggregateError && error.failures.length === 2
    );
    assert.equal(loader.loaded, 2);
    assert.equal(progress.length, 2);
    assert.equal(loader.errors.length, 2);
  });
});

test("asset loader validates manifest and reports unsupported asset types", async () => {
  const loader = new AssetLoader();
  await assert.rejects(loader.loadManifest([]), /manifest must be an object/i);
  await loader.loadManifest({ data: { type: "video", url: "/x" } });
  assert.match(loader.errors[0].error.message, /Unsupported asset type/);
});

function makeAudioContext() {
  const sources = [];
  const context = {
    state: "suspended", destination: {},
    createGain() { return { gain: { value: 1 }, connect() {}, disconnect() {} }; },
    createBufferSource() {
      const listeners = {};
      const source = {
        connect() {}, disconnect() {}, start() { this.started = true; }, stop() { this.stopped = true; },
        addEventListener(name, callback) { listeners[name] = callback; },
        finish() { listeners.ended?.(); }
      };
      sources.push(source); return source;
    },
    async resume() { this.state = "running"; },
    async decodeAudioData() { return { decoded: true }; },
    async close() { this.state = "closed"; }
  };
  return { context, sources };
}

test("audio manager validates volume, unlocks, tracks ended sources, and disposes safely", async () => {
  const { context, sources } = makeAudioContext();
  await withGlobal("AudioContext", class { constructor() { return context; } }, async () => {
    const audio = new AudioManager({ masterVolume: 0.5 });
    assert.equal(await audio.unlock(), true);
    assert.equal(context.state, "running");
    assert.throws(() => audio.setVolume(Number.NaN), /finite/);
    audio.buffers.set("hit", { sample: true });
    const source = audio.play("hit", { volume: 2 });
    assert.equal(source.started, true);
    assert.equal(audio.sources.size, 1);
    source.finish();
    assert.equal(audio.sources.size, 0);
    const playing = audio.play("hit");
    assert.equal(playing, sources[1]);
    await audio.dispose();
    assert.equal(context.state, "closed");
    assert.equal(audio.buffers.size, 0);
    assert.throws(() => audio.play("hit"), /disposed/);
    await audio.dispose();
  });
});

test("audio manager gracefully reports unsupported audio and rejects invalid config", async () => {
  await withGlobal("AudioContext", undefined, async () => {
    const audio = new AudioManager();
    assert.equal(await audio.unlock(), false);
    assert.equal(await audio.load("music", "/music.ogg"), false);
    assert.equal(audio.play("music"), null);
    await audio.dispose();
  });
  assert.throws(() => new AudioManager({ masterVolume: 2 }), /masterVolume/);
});
