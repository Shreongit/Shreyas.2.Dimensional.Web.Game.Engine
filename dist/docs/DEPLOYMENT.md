# Deployment and Content Security Policy

S2DWGE games are browser applications. Serve the generated `dist/` directory over HTTP(S); do not rely on `file://` module loading. Build with `npm run build`, then point your static host at `dist/` or copy its contents into your web root.

## Baseline deployment checklist

- Use HTTPS for public deployments.
- Serve JavaScript modules with a JavaScript MIME type and keep relative module paths intact.
- Keep game assets on trusted origins and handle load failures in game code.
- Do not evaluate downloaded or user-provided JavaScript.
- Treat client-side state as untrusted for multiplayer or competitive games; validate authoritative state on a server.
- Configure caching deliberately: versioned release assets may use long-lived immutable caching; HTML entry points should revalidate so users receive updates.
- Test the deployed site under the same origin, path prefix, and CSP as production.

## Content Security Policy

Start with a policy appropriate to your hosting setup and tighten it after testing. For a same-origin static game, a possible starting point is:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

This is a starting example, not a universal drop-in policy. Games using external assets, analytics, remote APIs, inline scripts/styles, workers, or embedded content must adjust the relevant directives intentionally. Prefer external script/style files and avoid adding `unsafe-eval`; test the policy in report-only mode before enforcing it on an existing game.

## Browser support

The project configures Playwright projects for Chromium, Firefox, and WebKit. A configured matrix is not evidence of a pass. Publish browser support only after the exact release commit passes in all advertised browsers.
