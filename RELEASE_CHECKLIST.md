# Release readiness checklist

This checklist is intentionally strict. A passing unit suite is not a production certification.

## Build and tests
- [ ] `npm run ci` passes on all supported Node versions.
- [ ] Browser integration tests pass on Chromium, Firefox, and WebKit.
- [ ] Test report and known limitations are published for the release.
- [ ] No unresolved critical/high severity defects.

## Runtime
- [ ] Start, pause, resume, stop, and dispose have browser tests.
- [ ] No duplicate animation loops or event listeners after repeated lifecycle operations.
- [ ] Scene switching and scene re-entry behavior is explicitly tested.
- [ ] Background-tab behavior and delta-time spikes are verified.

## Physics and rendering
- [ ] Collision behavior is tested for corners, edges, fast objects, triggers, and multiple bodies.
- [ ] High-speed tunneling and tile collision are either solved or documented as unsupported.
- [ ] Camera/viewport scaling is tested at multiple aspect ratios and device pixel ratios.
- [ ] Performance benchmark results are recorded for a defined reference scene.

## Assets and audio
- [ ] Missing, malformed, oversized, and cross-origin assets produce clear errors.
- [ ] Audio autoplay restrictions and context disposal are browser-tested.
- [ ] Memory use is measured during repeated scene changes and asset loading.

## Distribution and governance
- [ ] Release bundles, source maps, license notices, and version tags are generated.
- [ ] Public API docs and migration notes are complete.
- [ ] Dependency and code security scans are configured.
- [ ] Supported browser matrix and support policy are published.
- [ ] At least one complete sample game has been built and tested on the release engine.

## Sign-off
- [ ] A named maintainer reviewed the release candidate.
- [ ] CI results, browser matrix, benchmark results, and known issues are attached to the release.
