# S2DWGE — Shreyas's 2 Dimensional Web Game Engine

**S2DWGE** stands for **Shreyas's 2 Dimensional Web Game Engine**.

S2DWGE is a modular JavaScript 2D game-engine foundation for modern browsers. It uses HTML5 Canvas and native ES modules, has no runtime dependencies, and includes a playable demo and automated Node.js tests.

> **Project status:** `1.0.0-rc.2` release candidate. This version adds cross-browser Playwright test infrastructure, viewport/DPR checks, and a repeatable physics benchmark. The browser matrix could not be executed in the authoring environment, so the engine is not signed off as stable 1.0. See `CHANGELOG.md` and `RELEASE_CHECKLIST.md`.

## Systems

- **Runtime:** fixed-step simulation accumulator, clamped frame delta, bounded catch-up steps, pause/resume, optional render-rate cap, lifecycle disposal, frame-time profiler and debug overlay.
- **World model:** entities, components, scenes and scene switching.
- **Graphics:** sprites, animation, text and rectangle components, stable render-order layers, exception-safe canvas state, camera transforms, logical viewport fitting, tilemap drawing and particles.
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
```

Open <http://localhost:5173>. Move with WASD or arrow keys, hold Shift to sprint, and press P to pause/resume. Use a local HTTP server; browser ES module imports may not work from `file://`.

For cross-browser integration tests, install the development dependency and browser binaries, then run `npm run test:browser`. The configured matrix targets Chromium, Firefox, and WebKit. `npm run benchmark` reports workload timings and process memory for comparison; timings are machine-specific.

## Load custom artwork

Place images inside the game project and serve them from the same origin (or configure CORS correctly for remote assets).

```js
import { AssetLoader, Sprite } from "../../src/index.js";

const assets = new AssetLoader();
await assets.loadManifest({
  hero: "./assets/hero.png",
  tiles: "./assets/tiles.png"
});
const hero = new Sprite(assets.get("hero"), { anchorX: 0.5, anchorY: 0.5 });
hero.draw(ctx, 100, 100, 48, 48);
```

Browser-supported image formats can vary. Sprite sheets and tilesets need explicit frame/tile metadata.

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

This is a release candidate, not a stable 1.0 sign-off. Browser integration tests, a cross-browser CI matrix, and benchmark tooling are now included, but the matrix must pass on the actual release commit. Remaining work includes deeper browser lifecycle/audio/asset tests, longer memory soak tests, expanded complex-contact physics validation, gamepad input, accessibility/focus handling, API documentation and a complete sample game. See `RELEASE_CHECKLIST.md` for the explicit release gate.

## License

MIT. See `LICENSE`.
