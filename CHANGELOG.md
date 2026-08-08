# Changelog

All notable changes to this project are documented here.

## [3.9.1] - 2026-08-08

- Fix the Bilibili iOS 9.6.1 empty-home regression by accepting ordinary AV
  cards with an explicit video type and any strong identity from AVID, BVID,
  `param`, a supported video URI, or nested player arguments. CID is auxiliary
  and known card types are positive evidence rather than a hard allowlist.
- Preserve the exclusion-first commercial and non-video checks without using
  ordinary titles as ad evidence. Unknown future card types remain eligible
  when they carry an explicit AV type and valid video identity.
- Add two bounded non-empty-feed fallbacks: first retain incomplete but evident
  AV cards, then remove only explicit commercial cards. If both would still
  empty a non-empty server response, return the original response and emit
  `feed-empty-fail-open` instead of writing `data.items=[]`.
- Limit refill to initial results containing one through five retained cards,
  canonicalize AVID/BVID/`param`/video-URI identities for deduplication, and
  preserve the first response on refill failure while completing exactly once.
- Add Bilibili 9.6.1 partial-identity, mixed-case BVID, unknown-card, title false
  positive, fallback, refill, cold/refresh/resume and single-completion
  regressions; regenerate every module, runtime, catalog and checksum.

## [3.9.0] - 2026-08-08

- Centralize reviewed JSON and gRPC metadata endpoints in one registry used by
  request guards, response classification, generated Shadowrocket matchers and
  MITM host generation, eliminating the previous matcher/classifier drift.
- Detect gRPC independently from endpoint recognition, add bounded unknown-RPC
  frame diagnostics, preserve multi-frame ordering, normalize changed gRPC
  headers and `grpc-status` for Bilibili engine variants, and negotiate only
  `gzip,identity` on volatile metadata requests.
- Harden the Bilibili iOS 9.6.1 home allowlist to require complete AV identity,
  remove commercial AV disguises and large banners through reviewed metadata,
  and filter Goofish/Taobao under-player operations only inside confirmed
  commercial/action containers. Ordinary titles containing advertising words
  remain untouched.
- Apply the same no-store request/response treatment to volatile Home, View,
  ViewProgress, RelatesFeed, ViewUnite, PlayPause, ViewEndPage and related Story
  methods so cached/304 responses cannot re-inject unfiltered UI after resume.
- Replace `BiliCDN.hostAuto.v8` with isolated `BiliCDN.hostAuto.v10` state. The
  selector now gates on representation bandwidth, then scores 64 KiB startup
  TTFB/throughput, 1 MiB sustained p25 throughput, failures and jitter; the
  configured switch threshold prevents flapping without pinning a merely
  acceptable current host forever.
- Add automatic hashed Wi-Fi/cellular profiles when Shadowrocket exposes network
  information, plus separate audio, normal-video and high-bitrate-video health
  buckets. Playback hot paths still perform zero probes and mediaRoutes v9 still
  applies only complete target-owned signed URLs.
- Rework the cron benchmark into a serial 45-second two-stage budget: all
  maintained candidates receive a 64 KiB exact-content startup check, then only
  the reference and two best challengers receive rotating 1 MiB sustained
  validation. Hosts with open circuits are skipped.
- Add Bilibili 9.6.1 JSON/gRPC, resume, Goofish action, compression, response
  header, diagnostic, scoring, threshold, network-profile and media-bucket
  regressions; regenerate all modules, runtimes, `modules.list` and checksums.

## [3.8.2] - 2026-08-04

- Remove Magic Reward recommendations that keep an ordinary `av` card type but
  disclose `魔力赏` / `魔力賞` only in reviewed promotional metadata such as a
  badge or recommendation reason. Ordinary video titles are still never used as
  commercial evidence.
- Recognize the Bilibili Magic Reward route family `mall-magic-c` inside reviewed
  gRPC commercial fields, closing pause, progress, and background-resume
  operation-card reinjection without intercepting the mall domain or changing
  account, order, payment, playback, and unknown fields.
- Add JSON false-positive and gRPC `ViewProgress` regressions for both paths and
  regenerate version-keyed Shadowrocket modules, scripts, and checksums.

## [3.8.1] - 2026-08-03

- Close the cached/preloaded-playback race found in the 2026-08-03
  PacketTunnel log: media requests could leave for cosov before the fresh
  PlayView response rewrite completed, causing about three seconds of low-rate
  traffic before the app retried the complete Akamai backup.
- Persist a bounded `BiliCDN.mediaRoutes.v9` map of the exact complete
  server-provided target URL selected for each media object. Entries are bound
  to path, signed expiry, request identity, representation profile, source and
  target hosts; they expire at least 30 seconds before the signature or after
  two hours, whichever is earlier, and are capped at 64 entries.
- Add a lightweight Shadowrocket `type=http-request` media runtime that catches
  cached or preloaded VOD `/upgcxcode/` GET/HEAD requests and applies only an
  exact matching v9 URL. It preserves Range and user-agent headers, performs no
  probing or signature synthesis, excludes live media, and requires no media
  CDN MITM.
- Generate and release `bilibili-cdn-route.js`; add cross-runtime key,
  signature-isolation, expiry/capacity, fail-open, module matcher, checksum and
  release-workflow regressions.

## [3.8.0] - 2026-08-03

- Move default CDN learning out of playback responses into a Shadowrocket
  `type=cron` runtime with `wake-system=1`. Legacy `nonblocking` now maps to
  `cron`; JSON, gRPC, and Story hot paths perform zero Range probes.
- Add bounded `BiliCDN.hostAuto.v8` host state, explicit network-profile
  isolation, p25 throughput/failure/jitter scoring, two-object validation,
  six-hour alias freshness, 24-hour stale fallback, and two-hour circuits.
- Cold-promote a complete server-provided Akamai backup immediately when no
  qualified host state exists, retaining the original primary as the first
  backup. Never synthesize an Akamai URL from another host's signed query.
- Add anonymous public-sample cron validation with serial 64 KiB prefix and
  rotating 1 MiB interior ranges, strict status/Range/length/hash/type checks,
  and an eight-second per-request hard deadline.
- Cover Bilibili 9.5.0 `/x/v2/feed/index/relate/story` in the request cache
  guard and the single filter-then-CDN Story runtime, including strict ordinary
  vertical-video filtering and no-store responses.
- Add `npm run benchmark:cdn` for redacted, repeatable per-host measurements;
  document the supplied PacketTunnel log's 23 approximately two-second Akamai
  fallback delays and the 16-host anonymous benchmark.

## [3.7.0] - 2026-08-01

- Add the Bilibili 9.5.0 Mine fields `vip_section_right` and
  `rework_v1.worst_creative`, plus the iPad section arrays, so VIP marketing
  and configured service entries are filtered on every fresh Mine response
  without touching account or entitlement data.
- Prefer verified stable Mine IDs and exact actions/URIs across current phone
  and tablet response variants. Unknown entries and unknown containers remain
  unchanged.
- Stop broad legacy URI fallbacks from crossing Mine options: default first
  upload/reward/energy filters can no longer remove creator, community,
  settings, or game entries whose own switches are off.
- Decode strict UTF-8 JSON supplied through Shadowrocket `bodyBytes`; this
  closes a response-representation bypass while malformed, compressed, and
  unknown bodies still fail open.
- Reset automatic learning to `safeAuto.v7`. Reduce the first nonblocking
  exploratory load from two 1 MiB requests to two 256 KiB requests, then
  require the second confirmation to compare the same 1 MiB interior range of
  the object. Selected routes rotate through interior ranges during health
  revalidation.
- Preserve HTTP 206, exact Range, total length, actual length, sample hash,
  content type, identity encoding, redirect, signed-query, representation,
  audio/video, object, family, fixed-mode, and live fail-open safeguards. A
  fast cached prefix can no longer promote a route whose interior bytes differ
  or whose sustained interior throughput is inadequate.
- Add regression coverage for the Mine 9.5.0 fields, JSON `bodyBytes`, 512 KiB
  total first exploration, interior confirmation/mismatch, rotating
  revalidation, and safe invalidation of v6 learned state.

## [3.6.0] - 2026-07-30

- Reset automatic learning to `safeAuto.v6` and increase paired media samples
  from 256 KiB to 1 MiB so a fast first packet cannot by itself promote a CDN
  with poor sustained throughput.
- Require a candidate to meet both the configured relative improvement and an
  absolute audio/video/segment throughput floor, including 1.35x headroom over
  a declared representation bandwidth.
- Revalidate selected routes after at most eight minutes and add a bounded,
  anonymized host-health circuit breaker. Hard failures back off immediately;
  two consecutive slow verified samples also pause that host across objects,
  without sharing media URLs, signatures, or selections.
- Keep cache misses and stale selections nonblocking and fail open to the
  server primary. Preserve exact object/hash/Range equivalence, alias-lane,
  audio/video, representation, codec, signed-query, fixed-mode, and live URL
  isolation.
- Remove the DNS-decommissioned `upos-sz-mirrorhwov.bilivideo.com` from fixed
  candidate guidance. Akamai remains eligible only when Bilibili supplied its
  complete signed URL for the current object; blind host substitution remains
  prohibited.
- Add exact, cache-safe handling for gRPC `Search/DefaultWords`, legacy
  `Search/recommend_words`, and manga `Comic/Flash`/`ListFlash` responses.
  Preserve ordinary search results and all unknown endpoints.
- Document current mall microfrontend findings and keep the whole membership
  shopping domain outside MITM because observed popups also carry account,
  seller-migration, and regulatory workflow data.
- Add regressions for sustained-throughput headroom, stale selection fallback,
  cross-object host circuit breaking, state privacy, new exact ad endpoints,
  module matcher coverage, and update-keyed distribution artifacts.

## [3.5.0] - 2026-07-30

- Route `/x/v2/feed/index/story` and `/story/cart` through one generated
  filter-then-CDN runtime so two Shadowrocket response scripts cannot race or
  overwrite one another. Strict Story filtering now requires a usable
  `vertical_av` identity and rejects commercial badges or deleted-state AV
  shells.
- Add exact cache protection and conservative known-container filtering for
  the asynchronous Story cart response. Unknown payloads remain untouched.
- Extend JSON search filtering and gRPC coverage from `SearchAll` to
  `SearchByType`; remove confirmed banner, game, purchase, CM, top-game, and
  nested `CardBusinessBadge` variants while preserving unknown wire bytes.
- Extend the exact live `getInfoByRoom` adapter to filter delayed commercial
  items only inside reviewed UI containers. Normal interaction widgets,
  playback, account, order, and payment data remain outside the matcher.
- Reset CDN learning to `safeAuto.v5` and bind every selection to the exact
  query-free media-object path in addition to media kind, representation,
  codec, network profile, family, and candidate set. A host learned for one
  video can no longer be applied to a different video with similar metadata.
- Preserve nonblocking first play, server-provided complete signed URLs,
  audio/video and alias-lane isolation, paired 256 KiB hash/length validation,
  live fail-open behavior, fixed-mode safety, and all existing UI switches.
- Add generated `bilibili-story.js` and smaller CDN-only
  `bilibili-story-cdn.js` release artifacts. Add regressions for disguised
  Story AVs, Story cart reinjection, JSON/gRPC search variants, delayed live
  popups, single-pipeline execution, CDN-only purity, and cross-object CDN
  isolation.

## [3.4.0] - 2026-07-29

- Target Bilibili iOS 9.5.0 (`build=90500100`) without changing the existing
  narrow endpoint matchers. Add exact JSON View carriers and current
  ViewUnite introduction module adapters while preserving unknown containers.
- Replace broad ViewProgress removal with endpoint-specific field filtering:
  remove activity/commercial `VideoGuide.material(1)` entries and, for
  ViewUnite only, promotional `DmResource.cards(3)` business types while
  preserving normal command DM, attention, follow/favorite cards, progress
  points, contract cards, Chronos, snapshots, and unknown wire bytes.
- Recognize 9.5.0 PlayPause requests and keep the conservative
  commercial-evidence filter instead of returning an unconditional empty
  Protobuf message.
- Enforce the current Home Feed AV card allowlist and perform at most one
  2.2-second, exact-URL, no-cache supplemental fetch when filtering leaves
  fewer than six unique videos. The supplemental response is independently
  filtered and failure never restores rejected cards.
- Add response-side no-store headers for mutable filtered UI responses so an
  ETag/304 or foreground restore cannot replace the filtered result with a
  stale local copy. Resource `Module/List` and diagnostic `myinfo` remain
  untouched.
- Expand Mine JSON matching to stable item/module/tab ID aliases and reviewed
  action/navigation wrappers before title fallback, while recursion remains
  limited to known UI containers and account data is preserved.
- Raise the bounded enhancement gRPC response limit from 1 MiB to 4 MiB and
  timeout from 8 to 10 seconds so large View/ViewUnite frames do not silently
  bypass the response handler.
- Reset CDN learning to `safeAuto.v4`, enlarge paired Range samples from
  64 KiB to 256 KiB, and score median sampled throughput before elapsed time,
  with failure-rate and jitter safeguards.
- Reuse only anonymized host performance across different objects of the same
  verified audio/video representation and current candidate set. Every
  promoted signed URL still comes from the current response and segments or
  unknown representations remain object-path isolated.
- Reduce the two-confirmation separation to the existing two-minute global
  probe interval, reject high jitter after the second sample, and revalidate a
  selected host at most once per 30 minutes without changing its configured
  6–72 hour selection TTL. A failed selected candidate is cleared for the next
  response while the current response retains the server primary as fallback.
- Keep default nonblocking first play and retain fixed-mode, hash/length
  equivalence, redirect/error-page rejection, signature-lane, live-URL,
  codec, quality, and audio/video safety boundaries.
- Add regressions for 9.5 JSON/gRPC carriers, background Mine wrappers,
  no-cache six-item refill, VideoGuide/DmResource field preservation, v4
  cross-object current-token reuse, 256 KiB throughput scoring, and generated
  module limits.

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
