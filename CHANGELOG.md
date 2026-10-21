# Changelog

## Unreleased — Asset and audio reliability

- Hardened asset manifests with validation, default image typing for object entries, deterministic per-asset progress, and aggregated failures when `continueOnError: false` is selected.
- Made missing browser image support an explicit asset error instead of a hanging or opaque failure.
- Hardened audio volume/configuration validation, playback source cleanup, concurrent load/disposal handling, and idempotent asynchronous disposal.
- Added automated asset-loader and mocked Web Audio lifecycle regression tests.

## Unreleased

- Fixed swept-AABB collision normal selection to use the axis with the later entry time, preventing diagonal impacts from resolving along the wrong axis.
- Treated static and disabled physics bodies as zero-velocity, immovable solver participants so stale velocity cannot inject momentum and disabled bodies are not repositioned by collision resolution.
- Added regression tests for diagonal swept impacts, static-body velocity, and disabled-body solver behavior.

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


## Unreleased — lifecycle and input resilience

- Fixed scene transitions so the outgoing scene runs its full stop lifecycle and can be started again when re-entered.
- Added optional component `stop()` lifecycle hooks, invoked in reverse component/entity order when an entity or scene stops.
- Ensure removing or transferring an entity stops its active components before detaching it, allowing clean re-entry.
- Clear held pointer-button state and reset frame timing when the document becomes hidden, preventing stuck input and large resume deltas.
- Added regression tests for scene switching, stop/restart ordering, entity removal/re-addition, and pointer cancellation.
- This milestone does not claim cross-browser validation; Playwright's Node test runner is not installed in the current working environment.


## Unreleased — Graphics and viewport milestone

- Hardened `Viewport` input validation, zero-size handling, capped device-pixel-ratio backing stores, and idempotent disposal.
- Added logical-to-client and client-to-logical conversion, including an `inside` flag for letterbox/out-of-bounds coordinates.
- Integrated optional logical-resolution viewport rendering into `Engine` via `viewport: true` or viewport options; default rendering remains unchanged.
- Added viewport-aware pointer coordinates and `pointer.inside` when the engine viewport is enabled.
- Added regression tests for viewport fitting, letterboxing, coordinate round-trips, zero-sized canvases, and camera transform round-trips.
- Documented the viewport setup and camera/pointer coordinate workflow.
