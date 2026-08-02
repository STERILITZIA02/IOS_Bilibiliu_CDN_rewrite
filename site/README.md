# BiliFlow website

The production website for this repository. It provides an iPhone/iPad-first
interface for choosing the CDN-only or Enhanced module, enabling the ordinary-
video-only playback filter and the six-item ordinary-AV home feed, changing
each reviewed Home/Mine visibility option, and generating a stable
Shadowrocket install URL. CDN controls expose a default background cron
benchmark with a zero-probe playback hot path, an explicit blocking/off mode,
manual network profiles, and an idempotent learning-state reset token.

## Safety model

- The option catalog comes from the fixed repository `main` branch and is
  validated before use. A reviewed catalog and module snapshot from the exact
  deployed commit is the bounded fallback.
- Online module templates are fetched only from two fixed
  `raw.githubusercontent.com` paths. The request cannot supply another source
  URL, and an egress outage can only select the build-time reviewed snapshot.
- Every query key, value type, numeric range, policy name, and fixed CDN host is
  allowlisted before the `#!arguments` line is replaced.
- The route verifies the module header, version, size, sections, variant, and
  every argument placeholder. It fails closed if repository files drift.
- Customized responses are `no-store`. No account, browsing, Bilibili,
  Shadowrocket, or device data is collected.

## Commands

Requires Node.js `>=22.13.0`.

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run dev
npm run lint
npm test
```

`npm test` performs a production build and checks server rendering, both module
variants, latest-repository sourcing, safe snapshot fallback, customization
persistence, and injection-style request rejection. The generation route
requires an exact catalog/module argument match regardless of source.

## Main routes

- `/` — responsive visual customizer.
- `/api/catalog` — validated latest option catalog with a bundled fallback.
- `/module.sgmodule` — generated, updateable Shadowrocket module.

The website is built with the Sites-provided vinext runtime. It does not require
a database, login, analytics, cookies, or third-party client scripts.
