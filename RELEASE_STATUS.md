# S2DWGE Release Status

**Current package version:** `1.0.0-rc.2`  
**Status:** Release candidate. GitHub Actions checks shown for the pushed commit are green; stable `1.0.0` sign-off is still separate.

## Verified locally before the latest documentation refresh

- `npm run ci`: passed; syntax checks and 71 unit/regression tests passed.
- `npm run build:check`: passed (3 distribution tests).
- `npm run test:api`: passed (3 API contract tests).
- `npm run test:soak`: passed.
- `npm run test:consumer`: passed; packed tarball installed offline in an isolated consumer and core exports imported.
- `npm pack --dry-run`: passed.
- `npm run test:browser`: passed 27/27 tests locally across Chromium, Firefox, and WebKit in the final user-reported run.

## GitHub Actions evidence provided by maintainer

The screenshot for the pushed commit shows all six checks successful: browser jobs for Chromium, Firefox, and WebKit, plus unit jobs for Node.js 18, 20, and 22. This is recorded from the maintainer-provided screenshot; the report does not independently query GitHub.

## Remaining stable-release gates

1. Complete a network-enabled `npm ci` using the committed lockfile.
2. Run and review a registry-backed `npm audit` (or equivalent dependency review).
3. Review remaining items in `RELEASE_CHECKLIST.md`, including documented physics limitations and release sign-off.
4. Rebuild and rerun all checks after any release-version or source changes.
5. Change the version to stable `1.0.0`, tag, and publish only after the maintainer explicitly approves the final release.

Passing CI is strong evidence for the tested commit and configurations, but does not prove every possible game or use case. This archive intentionally remains labeled `1.0.0-rc.2`; no stable version or publication is claimed.
