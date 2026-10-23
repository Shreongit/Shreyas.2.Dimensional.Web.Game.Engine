## Unreleased — merged PR correctness fixes

- Corrected AABB contact-normal handling so overlap separation moves bodies apart consistently.
- Corrected impulse resolution to use the actual `PhysicsBody.vx` / `vy` velocity fields and the engine's `bounce` property.
- Fixed continuous-collision and stacked-body regressions covered by the physics test suite.
- Replaced lossy 16-bit physics pair and spatial-cell keys with collision-safe coordinate/ID keys.
- Added regression tests for large physics IDs and spatial coordinates.

Validation in the supplied environment: unit suite 73/73, syntax check, API contract, lifecycle soak, and distribution build checks pass. Browser tests were not run in this environment. The packed-consumer test was blocked by an npm cache permission error, not by a package assertion.

# Changelog

All notable project changes are recorded here. Dates and version labels reflect the package metadata in this archive.

## Unreleased — Cross-browser CI verification and documentation refresh

- Recorded successful GitHub Actions push checks for Chromium, Firefox, and WebKit browser jobs.
- Recorded successful Node.js 18, 20, and 22 unit-test matrix jobs.
- Clarified repository setup, local serving, starter-game initialization, and the distinction between release-candidate validation and stable release sign-off.
- Updated release-readiness notes to retain the remaining clean-install/dependency-audit and maintainer sign-off gates.

## Unreleased — Release-candidate packaging verification

- Generated and committed a `package-lock.json` from the declared package metadata to support reproducible dependency resolution.
- Verified the published package file list with `npm pack --dry-run`; the package includes the engine source, generated distribution, starter and sample games, documentation, changelog, and license.
- Re-ran syntax, unit/regression, distribution, API contract, and lifecycle soak checks successfully on Node.js 22.16.0.
- Clean install and dependency audit remain unverified because npm registry access failed with `EAI_AGAIN` in this environment; do not treat lockfile generation alone as a successful clean-install or security audit.

## Unreleased — Viewport test hardening milestone

- Reworked viewport unit tests to restore global browser mocks safely, including when assertions fail.
- Added wide-layout letterboxing and transform assertions, explicit CSS-client-coordinate semantics, and high-DPI coordinate round-trip coverage.
- Added zero-sized canvas recovery, observer disposal/idempotency, and invalid configuration regression tests.
- This milestone strengthens deterministic Node-level viewport coverage; it does not replace the required Chromium, Firefox, and WebKit run.

## Unreleased — Sample game and release readiness

- Added Starfall Survival, a complete playable sample game demonstrating custom components, keyboard movement, dynamically spawned hazards, collision/game-over handling, pause, and restart.
- Included the sample game in the generated distribution and added a regression test for its files and runtime import.
- Expanded API documentation and release checklist with sample-game and dependency-review gates.

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


## Unreleased — API and lifecycle validation

- Added `docs/API_REFERENCE.md` documenting the current public entry-point exports and subsystem boundaries.
- Added a lifecycle soak regression test covering 250 scene create/start/update/remove/dispose cycles with eight entities per scene. The test verifies balanced component start/stop/detach calls and no retained scene ownership.
- Added `npm run test:soak` for targeted lifecycle stress validation.

## Unreleased — Release verification follow-up

- Added `npm run test:consumer`, which packs the project, installs the generated tarball into an isolated temporary consumer project, and verifies key public API exports can be imported from the installed package.
- Recorded successful offline packed-consumer validation and kept registry-dependent clean install/security audit and browser-matrix gates explicitly open.
