# S2DWGE Release Status

**Current version:** `1.0.0-rc.2`  
**Status:** Release candidate — not approved for stable `1.0.0` publication.

## Verified in the available environment

- `npm run ci`: passed (51 JavaScript files checked; 71 unit/regression tests passed).
- `npm run build:check`: passed (3 distribution tests).
- `npm run test:api`: passed (3 API contract tests).
- `npm run test:soak`: passed.
- `npm run test:consumer`: passed; packed tarball installed offline and core exports imported.
- `npm pack --dry-run`: passed.
- ZIP archive integrity: verified after packaging.

## Required before stable publication

1. Run `npm ci` successfully in network-enabled CI using the committed lockfile.
2. Run and review registry-backed `npm audit` (or an equivalent dependency review).
3. Fix the browser-test CLI/environment and run Chromium, Firefox, and WebKit against the exact release commit.
4. Verify the starter and sample games in those browsers, including restart, responsive sizing, and no uncaught errors or failed runtime requests.
5. Review the documented physics limitations and complete all remaining mandatory items in `RELEASE_CHECKLIST.md`.

## Known verification limits

- Local `npm run test:browser` currently reports `unknown command 'test'`; browser tests are not verified here.
- Network access to `registry.npmjs.org` was unavailable, so clean network-enabled installation and registry-backed audit remain unverified.
- These limitations are release blockers, not evidence that the checks passed.

Do not retag this artifact as stable `1.0.0` until the mandatory checks above have passed and the maintainer has signed off.
