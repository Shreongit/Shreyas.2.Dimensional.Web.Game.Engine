# S2DWGE — Shreyas's 2 Dimensional Web Game Engine

**S2DWGE** stands for **Shreyas's 2 Dimensional Web Game Engine**.

S2DWGE is a modular JavaScript 2D game-engine foundation for modern browsers. It uses HTML5 Canvas and native ES modules, has no runtime dependencies, and includes a playable demo and automated Node.js tests.

> **Project status:** advanced prototype / early-stage engine. This repository is not yet a fully production-certified engine. Browser integration, performance under load, accessibility, packaging and game-specific behavior still require validation before shipping a commercial game.

## Systems

- **Runtime:** animation-frame loop, delta-time clamp, pause/resume, lifecycle disposal, frame-time profiler and debug overlay.
- **World model:** entities, components, scenes and scene switching.
- **Graphics:** sprites, animation, text and rectangle components, camera transforms, logical viewport fitting, tilemap drawing and particles.
- **Input:** keyboard state/actions and pointer state.
- **Physics:** velocity/gravity body, AABB and circle overlap helpers, colliders, discrete collision resolution, tile collision queries, ray-vs-AABB and spatial hash broad-phase utility.
- **Assets/audio:** image and audio manifest loader with progress/errors; optional Web Audio wrapper.
- **Utilities:** event emitter, logger, profiler, timers, tweens and namespaced JSON storage.
- **Tests:** Node test coverage for selected utility and engine logic.

## Requirements and commands

Requires Node.js 18 or newer.

```bash
npm test
npm run check
npm run serve
```

Open <http://localhost:5173>. Move with WASD or arrow keys, hold Shift to sprint, and press P to pause/resume. Use a local HTTP server; browser ES module imports may not work from `file://`.

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

The included solver is discrete and intentionally lightweight. It is not a complete rigid-body solver and does not guarantee robust continuous collision detection, joints, friction, slopes, or stable stacking.

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

## Production-readiness gaps

Before marketing S2DWGE as production-ready, address these items:

1. Add browser-based integration tests and CI across Chromium, Firefox and WebKit.
2. Finish robust collision resolution, continuous collision detection, and documented physics ordering.
3. Add gamepad input, focus/accessibility handling, audio lifecycle tests and error reporting.
4. Add asset atlas tooling, cache invalidation, content validation and preload failure policy.
5. Add a real sample game with levels, collisions, menus and save/load.
6. Add profiling benchmarks, memory/leak tests, versioned API docs and migration policy.
7. Add bundling/minification, source maps, deployment guidance and a release workflow.

## License

MIT. See `LICENSE`.
