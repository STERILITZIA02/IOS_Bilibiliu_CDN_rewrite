# BiliFlow website

The production website for this repository. It provides an iPhone/iPad-first
interface for choosing the CDN-only or Enhanced module, enabling the ordinary-
video-only recommendation filter, changing each reviewed Home/Mine visibility
option, and generating a stable Shadowrocket install URL.

## Safety model

- The option catalog comes from the fixed repository `main` branch and is
  validated before use. A reviewed bundled catalog is the read-only fallback.
- Module templates are fetched only from two fixed `raw.githubusercontent.com`
  paths. The request cannot supply another source URL.
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
variants, latest-repository sourcing, customization persistence, and
injection-style request rejection. The generation route requires the latest
repository catalog and an exact catalog/module argument match; the bundled
catalog is only a display fallback.

## Main routes

- `/` — responsive visual customizer.
- `/api/catalog` — validated latest option catalog with a bundled fallback.
- `/module.sgmodule` — generated, updateable Shadowrocket module.

The website is built with the Sites-provided vinext runtime. It does not require
a database, login, analytics, cookies, or third-party client scripts.
