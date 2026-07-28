# Changelog

All notable changes to this project are documented here.

## [3.3.0] - 2026-07-28

- Repair matcher/classifier drift so all four splash endpoints, `myinfo`,
  VIP material/report, `Mine/DeviceFeature`, and resource `Module/List` reach
  their intended runtime adapter instead of being silently skipped.
- Replace the previous broad pause/end-page neutralization with conservative
  field-level handling: `PlayPause` removes only fields carrying explicit
  commercial evidence, while `ViewEndPage` filters verified
  `ViewEndPageCard.relate(1)` cards and preserves ordinary AV and unknown wire
  fields.
- Return distinct, idempotent success contracts for each splash endpoint and
  for VIP material retrieval versus material reporting; clear creative keep
  IDs and hashes without forcing network failure or retry loops.
- Expand request-side cache protection to splash, feed/story, view,
  mine/mine-ipad/myinfo, and VIP material/report requests so cold start,
  refresh, pagination, and foreground resume each receive a fresh response
  that traverses the response filter.
- Make Mine target matching prefer stable IDs, actions, exact schemes, and
  known containers before Chinese-title fallback; keep `DeviceFeature` and
  `Module/List` diagnostic-only until a captured fixture proves a safe action
  mutation.
- Add default nonblocking CDN learning: a verified cache is applied
  immediately, while a cache miss returns the current server response without
  waiting for two Range probes. Add explicit `blocking` and cache-only `off`
  modes plus an idempotent reset token.
- Require paired probes to prove identical Range bounds, total length, actual
  sample length, sample hash, and compatible media type, while rejecting
  compression, redirects, and HTML/JSON/XML/error bodies before any candidate
  can be confirmed.
- Isolate cached choices by audio/video, DASH/segment, quality, codec,
  representation, network profile, object, candidate set, and JSON alias
  lane; never copy a signed camelCase URL into a snake_case lane or reuse a
  token from a previous response.
- Split exact gRPC media adapters for app PlayURL, PlayerUnite, PGC v1, PGC
  v2, and Cheese/PUGV. PGC v2 no longer guesses an unsupported field-9
  lossless-audio path; unsafe uint64 values and unknown wire bytes are
  preserved.
- Harden fixed mode so it can only promote a complete target-host URL already
  present in every current alias lane. A missing or mismatched target fails
  open instead of synthesizing a host or breaking a signed media object.
- Align the published 6–72 hour interval with the runtime TTL, serialize
  probe locks/tokens for concurrent invocations, reset corrupt state safely,
  and expose sanitized probe/cache/script-time diagnostics.
- Add regressions for endpoint contracts, delayed reinjection paths,
  multi-frame/gzip/bodyBytes behavior, unknown-schema pass-through,
  nonblocking first play, pair equivalence, alias-signature isolation,
  adapter paths, state reset, TTL, and fixed-mode fallback.

## [3.2.0] - 2026-07-28

- Target Bilibili iOS 9.4.0 build
  `58ece148439d6782b1e6f9a9a37e82a1fd0db236` and neutralize the dedicated
  `viewunite.v1.View/PlayPause` and `ViewEndPage` gRPC responses before their
  pause/end-page commercial cards can render.
- Filter asynchronous `mine.v1.Mine/PubModule` publishing guides while
  preserving real UGC and opus cards, and add an exact request-side cache guard
  for Home Feed, Story, and Mine so background resume cannot reuse a
  conditional unfiltered response.
- Add the `show.v1.Popular/Index` fallback stream to the strict Home allowlist,
  retaining at most the first six cards that have both an explicit AV type and
  a concrete video identity.
- Neutralize the reviewed dedicated top/patch activity, PGC material, live
  shopping, and Biligame live-card APIs with endpoint-specific empty response
  shapes instead of broad domain blocking.
- Read CDN gRPC responses from Shadowrocket `bodyBytes`, decode bounded
  gzip-compressed frames, and cover legacy PGC v1 plus Cheese/PUGV `PlayView`
  services in addition to PlayerUnite, app PlayURL, and PGC v2.
- Increase the globally throttled validation sample from 16 KiB to 64 KiB for a
  less RTT-dominated comparison while retaining the two-confirmation,
  ten-minute separation, per-resource stickiness, and fail-open behavior.
- Reject fixed-mode hosts outside reviewed Bilibili media suffixes, add
  `acgvideo.com` media compatibility, and keep live URLs and signed query
  strings untouched.
- Permit shared-provider hosts in fixed mode only when they are an exact
  reviewed candidate; arbitrary Akamai/Kingsoft/other shared-CDN subdomains
  cannot receive signed playback URLs.
- Make the published switch-threshold range match the runtime safety bound
  (10–80%) and fail the build if numeric catalog defaults or limits drift from
  the CDN script.
- Record the 2026-07-28 interoperability audit at `kokoryh/Sparkle` commit
  `a26c3412a760fb8d7d4d1bcc124d126e19d630e5`, `fmz200/wool_scripts`
  commit `edbfac44522ef7f05718122ba95919bf2a1bdecc`,
  `app2smile/rules` commit
  `df6366a7024e0b3f0aa3510c5b791eea6f3cba89`,
  `BiliUniverse/ADBlock` commit
  `43b07841fa55ba77e29d478cab0be44c8b49a3c2`,
  `BiliUniverse/Redirect` commit
  `7e446284790953ad690fee5fa21afe78f00232f5`, and
  `pskdje/bilibili-API-collect` commit
  `271b123a083698bf576101c21f534b3418768a43`.

## [3.1.1] - 2026-07-27

- Intercept both legacy `view.v1.View/ViewProgress` and current
  `viewunite.v1.View/ViewProgress` gRPC responses so pause-time operation
  containers are removed on every fresh foreground/background-resume response,
  including bounded gzip frames.
- Remove the reviewed `vip_section`, `vip_section_v2`, and
  `modular_vip_section` Mine-page containers (plus their JSON camel-case
  equivalents) while preserving real membership status, expiry, labels, and
  account data.
- Propagate parent banner context through nested Mine-page arrays so a member
  marketing card cannot reappear merely because it moved into a banner list.
- Neutralize the dedicated `/x/vip/ads/materials` response on both app and API
  hosts when member-marketing filtering is enabled.
- Add independent fresh-response, background-resume, compressed gRPC,
  idempotence, disabled-option, host-coverage, and account-preservation
  regressions.
- Record the 2026-07-27 interoperability audit at `kokoryh/Sparkle` commit
  `a26c3412a760fb8d7d4d1bcc124d126e19d630e5`, `fmz200/wool_scripts`
  commit `edbfac44522ef7f05718122ba95919bf2a1bdecc`, and
  `pskdje/bilibili-API-collect` commit
  `cfc5fddcc8a94b74d91970bb5b4eaeb349addc47`.

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
