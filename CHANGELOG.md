# Changelog

All notable changes to this project are documented here.

## [2.0.0] - 2026-07-26

- Add independent, conservative JSON and gRPC filters for high-confidence
  splash, feed, Story, search, related-content, comment, PGC/Web, and live
  advertisements.
- Add configurable cleanup for the reviewed top navigation, bottom publish and
  membership-shopping tabs, and explicit marketing/service entries in Mine.
- Preserve unknown response structures, login/account data, real membership
  status, paid entitlements, messages, unread counts, and normal interaction
  fields.
- Replace global static-host auto selection with per-media-object candidates
  sourced only from the current server-provided primary and backup URLs.
- Isolate CDN choices by network profile, media kind, resource path,
  representation metadata, codec/bandwidth, and candidate set.
- Prevent promotion across standard CDN, MCDN, and PCDN families.
- Require strict 16 KiB GET Range validation, two confirmations separated by
  ten minutes, and the configured improvement threshold before promotion.
- Preserve current signed URLs, move the original primary into the backup
  list, never change the learning response, and fail open on every parse,
  storage, timeout, or validation error.
- Bound auto state to 64 entries, cap TTL by network-profile mode, add locks,
  global probe throttling, failure backoff, and query-free persistent hashes.
- Add an optional narrow `*pcdn*.biliapi.net` policy without broad IP/CIDR or
  MCDN blocking.
- Add device acceptance, update, rollback, privacy, troubleshooting, upstream
  research, and third-party notice documentation.
- Publish both runtime scripts and checksums as release assets.

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
