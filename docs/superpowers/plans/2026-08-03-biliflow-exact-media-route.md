# BiliFlow Exact Media Route Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the cached/preloaded PlayView race seen in the 2026-08-03 PacketTunnel log by redirecting escaped slow VOD requests to the exact, still-valid signed CDN URL already supplied for the same media object.

**Architecture:** Keep the existing response-time JSON/gRPC reordering, but persist a bounded v9 route table containing only complete selected URLs from the current server response. Add a small JSC request runtime that performs a synchronous persistent lookup for plain HTTP(S) `/upgcxcode/` requests and rewrites only when object path, expiry, playback transaction, account/device binding, network profile, and source-host membership match. Do not probe, synthesize an Akamai URL, copy a signature between hosts, or add media hosts to MITM.

**Tech Stack:** ES5-compatible JavaScript for Shadowrocket JSC/WebView, Node.js 22 test runner, generated `.sgmodule` artifacts, Vite/React customizer, GitHub Actions/Releases, OpenAI Sites.

---

### Task 1: Lock the PacketTunnel race into failing tests

**Files:**

- Create: `test/bilibili-cdn-route.test.js`
- Modify: `test/module.test.js`

- [ ] **Step 1: Write the failing response-to-request handoff test**

Create fresh primary and Akamai URLs with the same path and binding fields but different host-bound signatures:

```js
const deadline = Math.floor(now / 1000) + 3600;
const primary = `http://${sourceHost}${path}?deadline=${deadline}&oi=1&trid=txnU&mid=2&buvid=device&upsig=primary&bvc=vod`;
const target = `http://${akamaiHost}${path}?deadline=${deadline}&oi=1&trid=txnU&mid=2&buvid=device&upsig=target&hdnts=exp=${deadline}~hmac=exact&bvc=vod`;
const response = await processSafeAutoResponse(fixture(primary, target), services);
assert.equal(JSON.parse(response.body).data.dash.video[0].base_url, target);
assert.equal(storage[cdn.MEDIA_ROUTE_STATE_KEY].includes(target), true);
const routed = route.selectMediaRequest(primary, config, services);
assert.equal(routed.url, target);
```

- [ ] **Step 2: Add fail-open tests**

Assert no rewrite for a different `trid`, different path, expired target, target-host request, POST, live URL, unknown host, absent persistence, invalid JSON state, and fixed/off mode. Assert `Range` and user-agent headers survive while an existing `Host`/`:authority` is updated to the exact target authority.

- [ ] **Step 3: Add the generated-module contract test**

Require exactly one line named `Bilibili CDN Cached Media Route`, with `type=http-request`, `requires-body=0`, `timeout=2`, `engine=jsc`, a versioned `bilibili-cdn-route.js` path, and a pattern that matches logged cosov/Akamai `/upgcxcode/` URLs but excludes live and API URLs. Keep media hosts absent from `[MITM]`.

- [ ] **Step 4: Run the focused tests and observe failure**

Run:

```bash
node --test --experimental-test-isolation=none test/bilibili-cdn-route.test.js test/module.test.js
```

Expected: FAIL because `src/bilibili-cdn-route.js`, `MEDIA_ROUTE_STATE_KEY`, route persistence, and the module request line do not yet exist.

### Task 2: Persist bounded exact signed routes on valid playback responses

**Files:**

- Modify: `src/bilibili-cdn.js`
- Test: `test/bilibili-cdn-route.test.js`

- [ ] **Step 1: Add the v9 route-state contract**

Define:

```js
var MEDIA_ROUTE_STATE_KEY = "BiliCDN.mediaRoutes.v9";
var MEDIA_ROUTE_STATE_VERSION = 9;
var MEDIA_ROUTE_CAPACITY = 64;
var MEDIA_ROUTE_EXPIRY_SAFETY_MS = 30 * 1000;
var MEDIA_ROUTE_MAX_TTL_MS = 2 * 60 * 60 * 1000;
```

Implement `mediaRouteBindingForUrl(url, networkProfile)` using the query-free media path plus normalized `deadline/exp`, `trid`, `mid`, `oi`, and `buvid`. Require a signed expiry and at least one playback/device binding; hash the canonical value with `stableHash("m", ...)`.

- [ ] **Step 2: Sanitize and prune route state**

Implement `createEmptyMediaRouteState`, `sanitizeMediaRouteState`, `loadMediaRouteState`, and `saveMediaRouteState`. Accept only v9, valid `m2_` keys, exact Bilibili VOD target URLs whose recomputed key matches, 64 recent entries, a maximum 2-hour TTL, and target/source hosts already present in the descriptor. Remove expired entries before serialization.

- [ ] **Step 3: Persist only exact selected candidates**

Implement `persistPreparedMediaRoutes(services, descriptors, config, now)` so an entry is written only when:

```js
descriptor.selectedUrl &&
!descriptor.selectedAlias &&
candidateIdForUrl(descriptor.selectedUrl) !== descriptor.primaryId &&
descriptor.candidateById[candidateIdForUrl(descriptor.selectedUrl)] === descriptor.selectedUrl
```

Require primary and target bindings to produce the same key, record all server-provided source hosts, and store the complete target URL unchanged. Merge into the latest store once per valid response.

- [ ] **Step 4: Attach persistence after successful JSON/gRPC preparation**

Call `persistPreparedMediaRoutes` from `processHostAutoResponse` only after `prepared.valid`. Add `routesStored` to debug results without delaying `$done` with probes or network calls. Export the route constants/helpers for tests.

- [ ] **Step 5: Run the response-side tests**

Run:

```bash
node --test --experimental-test-isolation=none test/bilibili-cdn-route.test.js test/bilibili-cdn.test.js
```

Expected: route persistence tests pass; request-runtime tests still fail because the lightweight script is absent.

### Task 3: Add the lightweight request-time exact route runtime

**Files:**

- Create: `src/bilibili-cdn-route.js`
- Test: `test/bilibili-cdn-route.test.js`

- [ ] **Step 1: Implement the compatible read-only selector**

Duplicate only the small deterministic URL/query/hash contract needed to read `BiliCDN.mediaRoutes.v9`. `selectMediaRequest(requestUrl, method, headers, config, services)` must synchronously return unchanged unless the request is GET/HEAD Bilibili VOD, auto mode is enabled, the state entry is fresh, source host is listed, and the stored target recomputes to the same route key.

- [ ] **Step 2: Preserve request semantics**

On a match return the stored URL byte-for-byte. Copy all request headers, preserve `Range`, `User-Agent`, and cookies, and update only existing case-insensitive `Host` and `:authority` fields to the stored target authority. On any exception call `$done({})`.

- [ ] **Step 3: Add bounded diagnostics**

When debug is enabled, log only `changed`, source host, target host, and reason. Never log the signed query or complete URL.

- [ ] **Step 4: Run the route suite**

Run:

```bash
node --test --experimental-test-isolation=none test/bilibili-cdn-route.test.js
```

Expected: PASS, including the VM Shadowrocket entrypoint test.

### Task 4: Generate and validate Shadowrocket distribution artifacts

**Files:**

- Modify: `scripts/build.mjs`
- Modify: `.github/workflows/release.yml`
- Modify: `test/module.test.js`
- Generate: `dist/bilibili-cdn-route.js`
- Generate: `dist/Bilibili.CDN.Switcher.sgmodule`
- Generate: `dist/Bilibili.CDN.Enhanced.sgmodule`
- Generate: `dist/Bilibili.CDN.sgmodule`
- Generate: `dist/SHA256SUMS.txt`

- [ ] **Step 1: Add the narrow request rule and artifact**

Read `src/bilibili-cdn-route.js`, emit `dist/bilibili-cdn-route.js`, and prepend this logical line to both CDN variants:

```text
Bilibili CDN Cached Media Route = type=http-request,pattern=<Bilibili media hosts + /upgcxcode/>,requires-body=0,timeout=2,engine=jsc,script-path=<versioned dist/bilibili-cdn-route.js>,argument=<network arguments>
```

- [ ] **Step 2: Add the artifact to GitHub Release uploads and checksum tests**

Include `dist/bilibili-cdn-route.js` in `release.yml` and every explicit generated-artifact list in `test/module.test.js`.

- [ ] **Step 3: Build and run focused module tests**

Run:

```bash
npm run build
node --test --experimental-test-isolation=none test/module.test.js test/bilibili-cdn-route.test.js
```

Expected: PASS and both module variants contain exactly one media request route without adding any media MITM hostname.

### Task 5: Version, document, and verify the regression fix

**Files:**

- Modify: `package.json`
- Modify: `site/package.json`
- Modify: `site/package-lock.json`
- Modify: `CHANGELOG.md`
- Modify: `README.md`
- Modify: `docs/V3_ARCHITECTURE.md`
- Modify: `docs/DEVICE_ACCEPTANCE.md`
- Modify: `site/app/Customizer.tsx`

- [ ] **Step 1: Bump all live surfaces to 3.8.1**

Update package, site, module, runtime query, customizer copy, and acceptance text from 3.8.0 to 3.8.1 while retaining the historical v3.8.0 audit/plan unchanged.

- [ ] **Step 2: Document the evidence and behavior**

Add a changelog entry explaining that logged media started 0–5 ms before PlayView while fresh interception correctly selected Akamai; document the v9 exact signed route cache, 64-entry/expiry bounds, zero-probe request path, and no-media-MITM design.

- [ ] **Step 3: Run complete verification**

Run:

```bash
npm run check:all
npm run smoke:auto
git diff --check
```

Expected: all core/site tests pass, generated outputs are current, smoke output selects a complete server-provided route, and no whitespace errors are reported.

- [ ] **Step 4: Review the final diff and commit**

Run `git status --short`, `git diff --stat`, and inspect every changed source/test/module/document. Commit with `fix: route cached bilibili media to exact signed cdn` only after verification.

### Task 6: Synchronize all approved distribution channels

**Files:**

- Git branch/tag: `main`, `v3.8.1`
- GitHub Release: `v3.8.1`
- Sites project: `appgprj_6a659482e858819190f0229f2f58ac51`

- [ ] **Step 1: Push the verified commit and signed release tag**

Push `main`, create/push `v3.8.1`, and wait for CI/release workflows. Verify GitHub raw module/runtime URLs return 3.8.1 content and the release contains every checksummed artifact.

- [ ] **Step 2: Publish the same source snapshot to BiliFlow Sites**

Package the validated `site/` source with the Sites helper, save a new project version, deploy it publicly, and verify the public customizer renders 3.8.1 and emits a module URL whose returned module contains `Bilibili CDN Cached Media Route`.

- [ ] **Step 3: Report real-device acceptance instructions**

Ask the user to update/recompile the Shadowrocket module, force-close Bilibili once to clear already-open media sockets, then reproduce horizontal and vertical opens/seeks. The next PacketTunnel log should show escaped cosov `/upgcxcode/` requests being rewritten before upstream connection, without a 3-second cosov-to-Akamai fallback.

---

## Self-review

- Spec coverage: response race, horizontal/vertical playback, seek/reopen, background persistence, no hot-path probes, ad-enhanced and CDN-only variants, GitHub Release, and Sites are each covered.
- Placeholder scan: no TBD/TODO/"similar to" steps remain.
- Type consistency: both runtimes use `BiliCDN.mediaRoutes.v9`, `m2_` route keys, normalized `networkProfile`, exact target URLs, and the same expiry/binding fields.
