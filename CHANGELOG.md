# Changelog

## 1.0.0-rc.2 — 2026-10-21

- Added a browser validation page for Canvas rendering, engine disposal, viewport coordinate conversion, fast impacts, triggers/layer filters, and physics stress.
- Added Playwright browser tests for Chromium, Firefox, and WebKit, including five viewport/device-pixel-ratio configurations and demo startup.
- Added a repeatable physics workload benchmark reporting warmed samples, median duration, heap use, and RSS without inventing machine-independent thresholds.
- Expanded CI to run unit checks on Node 18/20/22 and browser tests independently across Chromium, Firefox, and WebKit.
- Documented remaining release gates and the AABB physics model's explicit limitations.

## 1.0.0-rc.1 — 2026-10-21

- Added swept-AABB continuous collision detection for translating bodies.
- Reworked collision impulses to apply a consistent normal impulse and bounded friction impulse.
- Added contact normals and penetration information to collision events.
- Added configurable position correction, penetration slop, and solver iteration validation.
- Hardened the spatial hash against invalid bounds and extremely large entries.
- Added rollback when a component's attach/start lifecycle throws.
- Added finite-value validation for entity transforms, camera transforms, animation timing, collider masks, and engine render-rate settings.
- Made `targetFPS` cap rendering while the fixed-step simulation continues to use the requestAnimationFrame accumulator.
- Expanded regression coverage for CCD, stack stress, lifecycle rollback, invalid input, and spatial-hash overflow.
