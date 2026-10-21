# S2DWGE — Shreyas's 2 Dimensional Web Game Engine

**S2DWGE** stands for **Shreyas's 2 Dimensional Web Game Engine**.

S2DWGE is a modular JavaScript 2D game-engine foundation for modern browsers. It uses HTML5 Canvas and native ES modules, has no runtime dependencies, and includes a playable demo and automated Node.js tests.

> **Project status:** `1.0.0-rc.2` release candidate. This version adds cross-browser Playwright test infrastructure, viewport/DPR checks, and a repeatable physics benchmark. The browser matrix could not be executed in the authoring environment, so the engine is not signed off as stable 1.0. See `CHANGELOG.md` and `RELEASE_CHECKLIST.md`.

## Systems

- **Runtime:** fixed-step simulation accumulator, clamped frame delta, bounded catch-up steps, pause/resume, optional render-rate cap, lifecycle disposal, frame-time profiler and debug overlay.
- **World model:** entities, components, scenes and scene switching.
- **Graphics:** sprites, animation, text and rectangle components, stable render-order layers, exception-safe canvas state, camera transforms, logical viewport fitting with optional high-DPI backing-store scaling, letterbox-aware pointer coordinates, tilemap drawing and particles.
- **Input:** keyboard state/actions and pointer state.
- **Physics:** mass-aware forces and impulses, gravity/drag/speed limits, scaled AABB colliders, collision layer/mask filtering, grid broad-phase candidate generation, iterative positional correction, normal/friction impulses, swept-AABB continuous collision detection for fast translating bodies, trigger contacts and enter/stay/exit events with contact normals, plus overlap helpers and ray-vs-AABB.
- **Assets/audio:** image and audio manifest loader with progress/errors; optional Web Audio wrapper.
- **Utilities:** event emitter, logger, profiler, timers, tweens and namespaced JSON storage.
- **Tests:** Node test coverage for selected utility and engine logic.

## Requirements and commands

Requires Node.js 18 or newer.

```bash
npm test
npm run check
npm run serve
npm run benchmark
npm run build
npm run build:check
```

Open <http://localhost:5173>. Move with WASD or arrow keys, hold Shift to sprint, and press P to pause/resume. Use a local HTTP server; browser ES module imports may not work from `file://`.

For cross-browser integration tests, install the development dependency and browser binaries, then run `npm run test:browser`. The configured matrix targets Chromium, Firefox, and WebKit. `npm run benchmark` reports workload timings and process memory for comparison; timings are machine-specific.

## Build a distributable runtime and starter game

Build a clean, dependency-free distribution from the current source tree:

```bash
npm run build
npm run build:check
```

The build writes `dist/` with the native ES-module runtime, package metadata, license, README, and a runnable vanilla-JavaScript starter game. The runtime intentionally remains a set of ES modules rather than claiming to be a bundled/minified single file; this build requires no additional bundler dependency and preserves debuggable module boundaries. Run it through a local HTTP server (not `file://`):

```bash
npx http-server dist
```

Then open the server URL and navigate to `/starter-game/`. If you do not have `http-server`, use any static web server. To start a new game, copy `dist/starter-game/` and `dist/engine/` together, preserving their relative paths. The starter demonstrates engine initialization, a scene, an entity, a component, keyboard input, a logical viewport, and disposal/restart patterns. The generated `dist/package.json` identifies the runtime entry point for package-style consumers.

`npm run build:check` rebuilds the distribution and checks that the runtime entry, starter assets, license, and relative imports are present. This validates the packaging structure; it does not replace browser testing of the starter game.

## Logical resolution and high-DPI viewport

Enable the optional viewport when you want a fixed logical game resolution that scales to the canvas element while preserving aspect ratio. Existing games retain their current rendering behavior unless `viewport` is enabled.

```js
import { Engine } from "./src/index.js";

const canvas = document.querySelector("canvas");
const engine = new Engine(canvas, {
  width: 960,
  height: 540,
  viewport: { pixelArt: false, autoResize: true, maxDPR: 3 },
  audio: false
});

// With viewport enabled, pointer.x and pointer.y use logical game coordinates.
engine.start("main");
```

The viewport scales the backing store for device-pixel ratio, centers the logical image when aspect ratios differ, and reports whether pointer coordinates fall inside the logical game area (`pointer.inside`). `Viewport.toLogical()` and `Viewport.toClient()` convert between client and logical coordinates. If a scene uses a camera, use `scene.camera.screenToWorld(pointer.x, pointer.y, engine.width, engine.height)` to obtain world coordinates. Keep the canvas CSS size controlled by your layout; the viewport observes its displayed dimensions and updates its backing store.

## Load custom artwork

Place images inside the game project and serve them from the same origin (or configure CORS correctly for remote assets).

```js
import { AssetLoader, Sprite } from "../../src/index.js";

const assets = new AssetLoader();
await assets.loadManifest({
  hero: "./assets/hero.png",
  tiles: "./assets/tiles.png"
});
const heroImage = assets.get("hero");
if (!heroImage) {
  // With the default continueOnError:true, inspect assets.errors and provide a fallback.
  console.error("Hero artwork failed to load", assets.errors);
} else {
  const hero = new Sprite(heroImage, { anchorX: 0.5, anchorY: 0.5 });
  hero.draw(ctx, 100, 100, 48, 48);
}
```

Object manifest entries default to `type: "image"`; use `{ type: "audio", url: "./assets/music.ogg" }` to load audio bytes. Progress callbacks receive `{ name, loaded, total, progress, error }`. By default, failures are collected in `assets.errors` and loading continues. Pass `{ continueOnError: false }` to reject after all entries finish, with an `AggregateError` containing a `failures` array. Browser-supported image formats can vary. Sprite sheets and tilesets need explicit frame/tile metadata.

## Audio playback

```js
import { AudioManager } from "./src/index.js";

const audio = new AudioManager({ masterVolume: 0.7 });
// Call from a user gesture (for example, the Start button) to satisfy browser autoplay policies.
await audio.unlock();
await audio.load("music", "./assets/music.ogg");
const music = audio.play("music", { loop: true, volume: 0.5 });
// Later, when leaving the game:
audio.stopAll();
await audio.dispose();
```

Audio is optional when Web Audio is unavailable. Handle `load()` failures, unlock audio from a user gesture, and call `dispose()` when the game no longer needs the manager. A disposed manager cannot be reused.

## Basic physics setup

```js
import { Entity, Collider, PhysicsBody } from "./src/index.js";

const player = new Entity({ x: 80, y: 80, width: 32, height: 32 });
player.addComponent(new PhysicsBody({ gravityScale: 1 }));
player.addComponent(new Collider());
scene.add(player);
scene.physics.gravity.y = 900;
```

The included solver is a lightweight AABB solver, not a full rigid-body engine. Continuous collision detection covers swept AABB motion for translating bodies, but does not solve rotational motion or guarantee every complex high-speed multi-body case. The engine does not yet provide rotational inertia, joints, general shape casts, one-way platforms, slope handling, or guarantees for stable stacking. Run automated tests and validate the target browser/game workload before shipping.

## Project structure

```text
src/
  core/       Engine, scenes, entities, events, profiler, timers, tweens, storage
  graphics/   Sprites, animation, camera, viewport, tilemaps, particles, text
  input/      Keyboard and pointer
  physics/    Collision helpers, body, collider, world, raycast, spatial hash
  audio/      Web Audio wrapper
  assets/     AssetLoader
examples/
  box-mover/  Playable demo
tests/        Automated Node.js tests
scripts/      Local development server
```

## Release-readiness work still required

This is a release candidate, not a stable 1.0 sign-off. Browser integration tests, a cross-browser CI matrix, and benchmark tooling are now included, but the matrix must pass on the actual release commit. Remaining work includes executing the browser matrix on the release commit, deeper browser lifecycle/audio/asset tests, longer memory soak tests, expanded complex-contact physics validation, gamepad input, accessibility/focus handling, full API documentation and a complete sample game. The production distribution currently ships native ES modules rather than a bundled/minified single-file runtime. The optional logical viewport and coordinate conversions have dedicated Node regression tests, but still require real-browser validation before stable release. See `RELEASE_CHECKLIST.md` for the explicit release gate.

## License

MIT. See `LICENSE`.
