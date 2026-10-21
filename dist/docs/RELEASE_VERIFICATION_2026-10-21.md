# Release verification report — 2026-10-21

## Scope

This report records checks executed against the supplied `1.0.0-rc.2` project archive in the available Node.js environment. It is not a stable-release sign-off and does not imply GitHub CI ran on this exact archive.

## Passed locally

Environment: Node.js `v22.16.0`, npm `10.9.2`.

- `npm run ci` — passed; syntax check covered 51 JavaScript files and the complete Node test suite passed 71/71.
- `npm run build` — passed; generated the native ES-module distribution, starter game, sample game, package metadata, README, and license.
- `npm run test:api` — passed 3/3.
- `npm run test:soak` — passed 1/1 lifecycle soak test.
- `npm run test:consumer` — passed; packed `s2dwge-1.0.0-rc.2.tgz`, installed the tarball into an isolated temporary consumer project using offline installation, and imported `Engine`, `Scene`, `Entity`, `Viewport`, and `PhysicsWorld`.
- `npm pack --dry-run` — passed and listed the expected source, distribution, templates, docs, and package metadata.
- ZIP integrity — verified after packaging this checkpoint.

## Blocked or not established

- `npm ci --offline` — did not pass because `playwright-core@1.64.1` was not cached. This is not a successful clean-install result; a network-enabled CI run is still required.
- `npm run test:browser` — did not run: the available `playwright` command reported `unknown command 'test'`. The compatible local Playwright Test CLI is unavailable in this environment. No Chromium, Firefox, or WebKit pass is claimed for this checkpoint.
- `npm audit --offline` — exited successfully and reported `found 0 vulnerabilities`, but this used offline/cache mode. Treat it as **non-authoritative**; it does not replace a registry-backed audit and review of development dependencies.
- No live-browser gameplay verification, published-package test, or GitHub CI result was available to inspect for this exact archive.

## Required before stable 1.0

1. In network-enabled CI, run `npm ci` from the committed lockfile.
2. Run and review `npm audit` with registry access; document any findings and remediation.
3. Install the project dependencies, confirm `npm run test:browser` resolves to the project's `@playwright/test` CLI, and run the configured Chromium, Firefox, and WebKit jobs.
4. Verify the distributed starter and sample game in each supported browser, including controls, restart, resize, console errors, and failed requests.
5. Review the public API and deployment guidance, attach CI evidence to the release commit, and explicitly sign off known physics limitations.

## Status

**Release candidate only — not signed off as stable 1.0.** The local unit, build, API, lifecycle, and packed-consumer checks passed, but the network-enabled clean install, authoritative dependency audit, and real-browser matrix remain open gates.
