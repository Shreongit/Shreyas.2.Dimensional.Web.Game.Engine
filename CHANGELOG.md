# Changelog

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

This is a release candidate. See `RELEASE_CHECKLIST.md` for the remaining browser, performance, and release-signoff requirements.
