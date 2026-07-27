import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
const { default: worker } = await import(workerUrl.href);

const environment = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};
const context = {
  waitUntil() {},
  passThroughOnException() {},
};

function request(path) {
  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html, application/json" },
    }),
    environment,
    context,
  );
}

test("server-renders the complete BiliFlow customizer", async () => {
  const response = await request("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>BiliFlow · Shadowrocket 模块定制器<\/title>/);
  assert.match(html, /你的 Bilibili/);
  assert.match(html, /CDN \+ Enhanced/);
  assert.match(html, /仅 CDN Switcher/);
  assert.match(html, /播放页只保留普通视频/);
  assert.match(html, /一键安装到 Shadowrocket/);
  assert.match(html, /明确的安全边界/);
  assert.doesNotMatch(html, /Your site is taking shape|SkeletonPreview/);
});

test("catalog and custom module routes use only fixed repository sources", async () => {
  const originalFetch = globalThis.fetch;
  const catalog = await readFile(
    new URL("../../dist/module-options.json", import.meta.url),
    "utf8",
  );
  const enhanced = await readFile(
    new URL("../../dist/Bilibili.CDN.Enhanced.sgmodule", import.meta.url),
    "utf8",
  );
  const cdn = await readFile(
    new URL("../../dist/Bilibili.CDN.Switcher.sgmodule", import.meta.url),
    "utf8",
  );
  const fetchedUrls = [];

  globalThis.fetch = async (input) => {
    const url = String(input);
    fetchedUrls.push(url);
    if (url.endsWith("/dist/module-options.json")) {
      return new Response(catalog, {
        headers: { "content-type": "application/json" },
      });
    }
    if (url.endsWith("/dist/Bilibili.CDN.Enhanced.sgmodule")) {
      return new Response(enhanced);
    }
    if (url.endsWith("/dist/Bilibili.CDN.Switcher.sgmodule")) {
      return new Response(cdn);
    }
    return new Response("Not found", { status: 404 });
  };

  try {
    const catalogResponse = await request("/api/catalog");
    assert.equal(catalogResponse.status, 200);
    const catalogPayload = await catalogResponse.json();
    assert.equal(catalogPayload.source, "repository");
    assert.equal(catalogPayload.catalog.schemaVersion, 1);

    const enhancedResponse = await request(
      "/module.sgmodule?variant=enhanced&homeFeedVideoOnly=true&videoOnlyRecommendations=true&hideMineWallet=true&hideMoreSettings=true&intervalHours=24",
    );
    assert.equal(enhancedResponse.status, 200);
    assert.match(
      enhancedResponse.headers.get("content-type") ?? "",
      /^text\/plain\b/i,
    );
    assert.equal(
      enhancedResponse.headers.get("cache-control"),
      "no-store",
    );
    const enhancedText = await enhancedResponse.text();
    assert.match(enhancedText, /隐藏我的钱包:true/);
    assert.match(enhancedText, /隐藏设置:true/);
    assert.match(enhancedText, /首页推荐6个普通视频:true/);
    assert.match(enhancedText, /推荐仅普通视频:true/);
    assert.match(enhancedText, /测速间隔:24/);
    assert.match(enhancedText, /Bilibili Enhance JSON/);

    const cdnResponse = await request(
      "/module.sgmodule?variant=cdn&cdn=auto&routingPolicy=DIRECT&pcdnPolicy=REJECT&networkProfile=cellular&intervalHours=12&switchThreshold=20&debug=false",
    );
    assert.equal(cdnResponse.status, 200);
    const cdnText = await cdnResponse.text();
    assert.match(cdnText, /PCDN策略:REJECT/);
    assert.match(cdnText, /网络档案:cellular/);
    assert.doesNotMatch(cdnText, /Bilibili Enhance/);

    const reviewedFixedResponse = await request(
      "/module.sgmodule?variant=cdn&cdn=upos-hz-mirrorakam.akamaized.net",
    );
    assert.equal(reviewedFixedResponse.status, 200);
    assert.match(
      await reviewedFixedResponse.text(),
      /CDN:upos-hz-mirrorakam\.akamaized\.net/,
    );

    assert.ok(fetchedUrls.length >= 7);
    assert.ok(
      fetchedUrls.every((url) =>
        url.startsWith(
          "https://raw.githubusercontent.com/STERILITZIA02/IOS_Bilibiliu_CDN_rewrite/main/",
        ),
      ),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
test("custom module route rejects unknown and injection-style parameters", async () => {
  const originalFetch = globalThis.fetch;
  const catalog = await readFile(
    new URL("../../dist/module-options.json", import.meta.url),
    "utf8",
  );
  globalThis.fetch = async () =>
    new Response(catalog, {
      headers: { "content-type": "application/json" },
    });
  try {
    const unknown = await request(
      "/module.sgmodule?variant=cdn&source=https%3A%2F%2Fevil.example",
    );
    assert.equal(unknown.status, 400);

    const injection = await request(
      "/module.sgmodule?variant=cdn&routingPolicy=DIRECT%0A%5BMITM%5D",
    );
    assert.equal(injection.status, 400);

    const unrelatedAkamaiHost = await request(
      "/module.sgmodule?variant=cdn&cdn=unrelated.akamaized.net",
    );
    assert.equal(unrelatedAkamaiHost.status, 400);

    const unreviewedAkamaiHost = await request(
      "/module.sgmodule?variant=cdn&cdn=upos-unreviewed.akamaized.net",
    );
    assert.equal(unreviewedAkamaiHost.status, 400);

    const sharedProviderHost = await request(
      "/module.sgmodule?variant=cdn&cdn=evil.ksyungslb.com",
    );
    assert.equal(sharedProviderHost.status, 400);

    const duplicate = await request(
      "/module.sgmodule?variant=cdn&intervalHours=12&intervalHours=24",
    );
    assert.equal(duplicate.status, 400);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("custom module generation uses the reviewed bundle during repository outage and fails closed on drift", async () => {
  const originalFetch = globalThis.fetch;
  const catalog = await readFile(
    new URL("../../dist/module-options.json", import.meta.url),
    "utf8",
  );
  const enhanced = await readFile(
    new URL("../../dist/Bilibili.CDN.Enhanced.sgmodule", import.meta.url),
    "utf8",
  );

  try {
    globalThis.fetch = async (input) =>
      String(input).endsWith("/dist/module-options.json")
        ? new Response("Unavailable", { status: 503 })
        : new Response(enhanced);
    const outage = await request("/module.sgmodule?variant=enhanced");
    assert.equal(outage.status, 200);
    assert.equal(
      outage.headers.get("x-bilibili-module-snapshot"),
      "bundled",
    );
    assert.match(await outage.text(), /Bilibili Enhance JSON/);

    globalThis.fetch = async (input) => {
      const url = String(input);
      if (url.endsWith("/dist/module-options.json")) {
        return new Response(catalog);
      }
      return new Response(
        enhanced.replace(
          /^#!arguments=(.+)$/m,
          "#!arguments=$1,未审核参数:true",
        ),
      );
    };
    const drift = await request("/module.sgmodule?variant=enhanced");
    assert.equal(drift.status, 502);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
