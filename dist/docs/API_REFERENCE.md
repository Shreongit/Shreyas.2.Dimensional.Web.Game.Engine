# S2DWGE Public API Reference

This document describes the symbols exported from `src/index.js`, which is the package's current public entry point. It is an inventory and orientation guide, not a substitute for the source-level method contracts. The API is still release-candidate status (`1.0.0-rc.2`); verify behavior against the version you install.

## Importing

```js
import { Engine, Scene, Entity, Component } from "s2dwge";
```

For the repository checkout, import from `./src/index.js`. The generated distribution exposes its runtime through `dist/engine/index.js`.

## Core and lifecycle

| Export | Purpose |
|---|---|
| `Engine` | Owns the browser game loop and engine-level systems. |
| `Scene` | Owns entities and their update/render lifecycle. |
| `SceneManager` | Registers and switches between scenes. |
| `Entity` | Game object with transform, visibility, activity, tag and render order. |
| `Component` | Base class for reusable entity behavior. |
| `EventEmitter` | Event subscription and dispatch utility. |
| `Timer` | Time-based callback utility. |
| `Tween` | Interpolates values over time. |
| `Storage` | Browser storage utility. |
| `Logger` | Logging utility. |
| `Profiler` | Lightweight timing/profiling utility. |

## Input and browser interaction

| Export | Purpose |
|---|---|
| `InputManager` | Keyboard input state and queries. |
| `PointerManager` | Pointer position and button state for a canvas. |

## Graphics

| Export | Purpose |
|---|---|
| `Viewport` | Logical/physical canvas sizing and coordinate conversion utilities. |
| `Camera2D` | Camera transform support. |
| `Sprite` | Sprite rendering component/utility. |
| `Animation` | Sprite animation timing and frame selection. |
| `CanvasText` | Canvas text rendering helper. |
| `RectangleRenderer` | Rectangle rendering component/utility. |
| `Tilemap` | Tilemap data and rendering. |
| `TilemapCollider` | Collision utility for tilemaps. |
| `ParticleEmitter` | Particle emission and update utility. |

## Physics and collision

| Export | Purpose |
|---|---|
| `Collision` | Collision query helpers. |
| `Collider` | Collision component. |
| `PhysicsBody` | Body state such as velocity and physical properties. |
| `PhysicsWorld` | Physics stepping and contact resolution. |
| `SpatialHash` | Spatial partitioning for broad-phase queries. |
| `raycastAABB` | Ray query against an axis-aligned bounding box. |

Physics support is intentionally scoped. Consult the README and source implementation for supported shapes, continuous-collision limitations, contact semantics and solver guarantees; do not assume a general-purpose rigid-body solver.

## Assets and audio

| Export | Purpose |
|---|---|
| `AssetLoader` | Loads and tracks game assets. |
| `AudioManager` | Browser audio playback and management. |

## Example: defining a component

```js
import { Component, Entity, Scene } from "s2dwge";

class MoveRight extends Component {
  update(dt) {
    this.entity.x += 120 * dt;
  }
}

const scene = new Scene("Example");
const player = new Entity({ x: 20, y: 20, width: 24, height: 24 });
player.addComponent(new MoveRight());
scene.add(player);
```

This demonstrates the entity/component relationship and scene ownership. It does not start a game loop; initialize an `Engine` and register/switch scenes according to the current starter-game example.

## Lifecycle guidance

- Keep resource acquisition in component/scene start hooks and release listeners, timers and other owned resources in corresponding stop/disposal hooks.
- Treat `dispose()` as the terminal cleanup operation for objects that expose it; do not assume a disposed engine can be restarted.
- Remove entities through their owning scene when possible so scene and physics bookkeeping remain synchronized.
- Browser audio may require a user gesture due to browser autoplay policies.
- Use the documented supported browser matrix and run the browser suite for the exact release commit.

## Stability notice

S2DWGE remains a release candidate until the release checklist is satisfied. This reference lists the current named exports; it does not imply every subsystem has a finalized semantic-versioning guarantee.


## Complete sample game

The generated distribution includes `sample-game/`, a small playable survival game demonstrating scene lifecycle, custom components, keyboard movement, entity spawning/removal, rendering, pause handling, and restart/disposal. Serve the generated `dist/` directory over HTTP, then open `/sample-game/`. The sample is an integration example, not a promise that every game genre or physics workload is supported.
