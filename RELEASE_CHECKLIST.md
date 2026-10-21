# S2DWGE 1.0 release gate

A passing unit suite is necessary but not sufficient for a stable 1.0 release. Do not mark the release stable until every required gate below has recorded evidence.

## Automated checks
- [x] Local Node.js 22 syntax checks pass.
- [x] Local Node.js 22 unit/regression tests pass.
- [x] Repeatable physics benchmark runner added (`npm run benchmark`).
- [x] Browser integration test suite added for Chromium, Firefox, and WebKit.
- [x] CI workflow configured for Node 18/20/22 and a per-browser Playwright matrix.
- [ ] CI has completed successfully on the release commit for all Node versions and browsers.
- [ ] Browser matrix has been executed and results reviewed. The current authoring environment blocks Chromium automation and does not contain runnable Firefox/WebKit binaries, so no local browser-pass claim is made.

## Runtime and physics
- [x] Regression coverage for swept-AABB fast impacts, trigger contacts, layer/mask filtering, contact exits, finite stack stress, and collider scaling.
- [ ] Browser tests cover repeated start/pause/resume/stop/dispose, scene switching, and background-tab delta behavior.
- [ ] Physics is validated for corner impacts, friction stability, long-duration stacking, and dense contact piles across supported browsers.
- [ ] Limitations are accepted: AABB-only colliders; no angular velocity/rotational rigid-body solver, joints, general convex shapes, or full tilemap contact solver. CCD currently targets translating AABBs and is not a general continuous physics guarantee.

## Graphics, viewport, and memory
- [x] Viewport integration tests cover 800x600, 1365x768, 1920x1080, 390x844@2x, and 1440x900@3x in the browser suite.
- [ ] Browser suite passes on each supported browser and DPR configuration.
- [ ] Reference-device benchmark results and performance budgets are recorded; timings are machine-dependent and must not be generalized from one host.
- [ ] Memory/leak soak tests cover repeated scene transitions, event subscriptions, asset loading, and disposal.

## Distribution and sign-off
- [ ] API documentation and browser support policy reviewed.
- [ ] Security/dependency audit completed.
- [ ] At least one complete sample game built and tested against the release API.
- [ ] Release commit's CI links and benchmark artifact attached.
- [ ] Maintainer explicitly signs off on known issues.

## Release status
**Not signed off as stable 1.0.** This repository contains the release-gate tooling and candidate changes, but browser CI has not been run from this environment. Promote to stable only after the unchecked release gates are satisfied; do not infer a pass from tests being configured.
