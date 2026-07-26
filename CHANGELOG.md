# Changelog

All notable changes to this project are documented here.

## [3.1.0] - 2026-07-26

- Add a default-on `首页推荐6个普通视频` switch for the app and Web home
  recommendation feeds. Each response keeps, in server order, at most the
  first six cards that carry both an explicit AV/video type and a concrete
  video identity.
- Reject homepage banners, ads, mini-games/apps, PGC/OGV, documentary,
  variety, movie/TV, live, activity, unknown, and commercially disguised
  cards without using title text as a classifier.
- Apply the strict check to every fresh recommendation response and make the
  transform idempotent, while intentionally avoiding recursive refill
  requests, synthetic cards, or refresh-timer changes.
- Remove Story `vertical_pgc` cards and, in strict mode, retain only
  `vertical_av`; recognize `business_info` and `cm_mark` as explicit
  commercial markers.
- Cover current and alternate VIP banner-list keys plus structurally explicit
  Mine-page VIP marketing banners while preserving member state, expiry,
  wallet, orders, payment, privileges, and unknown account fields.
- Record the 2026-07-26 upstream audit at BiliUniverse/ADBlock commit
  `43b07841fa55ba77e29d478cab0be44c8b49a3c2` and add refresh, false-positive,
  exact-six, Web-feed, Story, disguised-ad, and VIP-banner regressions.

## [3.0.1] - 2026-07-26

- Fix first-open video pages by reading Shadowrocket binary `bodyBytes` and
  processing bounded gzip-compressed gRPC messages before the app renders them.
- Remove current View v1 under-player marketing field `34`, the reviewed
  `TFInfo` carrier-marketing fields, and the existing View/ViewUnite CM fields.
- Require both ViewUnite relation type `1 (AV)` and the `av(2)` oneof payload;
  reject mismatched documentary, live, game, CM, PGC, resource, AI, and special
  payloads even when their outer type is disguised as AV.
- Make the JSON strict mode require an explicit ordinary-video marker instead
  of treating a bare AVID/BVID as sufficient type evidence.
- Version-key every remote rule/script URL so an in-app module update cannot
  continue using a cached script from an older release.
- Add first-response gzip, `bodyBytes`, disguised-card, under-player marketing,
  TFInfo, and remote-update cache regression coverage.

## [3.0.0] - 2026-07-26

- Add independent per-item visibility switches for the reviewed Home, Mine, and
  More Services entries while preserving unknown entries and essential account,
  search, message, navigation, and playback fields.
- Add conservative VIP-center and video-page marketing cleanup based on exact
  endpoints, stable identifiers, reviewed Protobuf module types, and
  high-confidence commercial markers.
- Add a default-on, independently configurable video-page recommendation
  allowlist that keeps only ordinary AV videos across JSON, View v1,
  ViewUnite, and both RelatesFeed methods; filter documentary, variety, OGV,
  live, game, course, resource, special, advertising, and unknown cards.
- Add ViewUnite filtering for course relations and reviewed activity, VIP, and
  UP-goods modules without replacing or reconstructing unknown response arrays.
- Publish separate CDN-only and CDN + ad/UI Enhanced Shadowrocket modules while
  preserving the historical module URL as an Enhanced compatibility alias.
- Generate a versioned option catalog from the same schema used to build module
  arguments so the customization site cannot drift from the scripts.
- Add the iPhone/iPad-first BiliFlow site for per-item visibility switches,
  fixed-source module generation, persistent selections, and one-tap
  Shadowrocket installation.
- Make customized module generation fail closed when the latest repository
  catalog is unavailable or its arguments/placeholders drift from the module;
  keep the bundled catalog as display-only fallback.
- Split core and website test discovery, verify both from clean CI/release
  checkouts, and pin GitHub Actions to audited Node 24-runtime commit SHAs.
- Preserve the existing resource-safe CDN selection algorithm and explicit
  fail-open boundaries for malformed, compressed, unauthorized, or unknown data.

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
