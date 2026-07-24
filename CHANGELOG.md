# Changelog

All notable changes to this project are documented here.

## [1.1.0] - 2026-07-24

- Add an `auto` CDN mode backed by a curated pool of current Bilibili hosts.
- Benchmark at most six candidates against a real signed VOD URL per cycle.
- Cache the selected host for 12 hours by default and rotate through the pool.
- Add a 24-hour minimum hold and 20% improvement threshold to prevent churn.
- Fail over immediately only when the cached host is unreachable.
- Preserve fixed-host and routing-only (`off`) modes.
- Keep the stable module filename and update URLs for in-app Shadowrocket
  updates.

## [1.0.0] - 2026-07-24

- Add a directly installable Shadowrocket module for iOS 26 and iOS 27.
- Add JSON playback-response rewriting for UGC, PGC, PUGV, DASH, and DURL.
- Add dependency-free gRPC framing and recursive Protobuf URL rewriting for
  current Bilibili iOS playback services.
- Add a focused Bilibili rule set covering API, static, VOD CDN, and live CDN
  traffic.
- Preserve signed live CDN hosts and route them through the selected policy.
- Add deterministic builds, checksums, tests, CI, and tagged-release automation.
