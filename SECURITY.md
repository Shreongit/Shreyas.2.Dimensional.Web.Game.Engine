# Security policy

S2DWGE is an early-stage open-source engine. Do not assume it has undergone a security audit.

## Reporting

Please do not publish exploitable security details in a public issue. Until a private security contact is configured for this repository, contact the maintainers through a trusted private channel and include reproduction steps, affected versions, and impact.

## Asset and game-code safety

- Treat user-supplied asset files and game scripts as untrusted input.
- Do not evaluate arbitrary game code from untrusted sources.
- Serve projects with an appropriate Content Security Policy when deploying publicly.
- Validate server-side data in networked games; client-side checks are not authoritative.
