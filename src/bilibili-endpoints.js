"use strict";

(function (root) {
  var hasOwn = Object.prototype.hasOwnProperty;
  var APP_HOSTS = ["app.bilibili.com", "app.biliapi.net"];
  var API_HOSTS = ["api.bilibili.com", "api.biliapi.net"];
  var GRPC_HOSTS = [
    "app.bilibili.com",
    "app.biliapi.net",
    "grpc.bilibili.com",
    "grpc.biliapi.net"
  ];

  function row(
    id,
    hosts,
    path,
    transport,
    handler,
    runtimes,
    volatile,
    requestGuard,
    responseFilter,
    pattern
  ) {
    var value = {
      handler: handler,
      hosts: hosts,
      id: id,
      requestGuard: Boolean(requestGuard),
      responseFilter: Boolean(responseFilter),
      runtimes: runtimes,
      transport: transport,
      volatile: Boolean(volatile)
    };
    if (pattern) {
      value.pathPattern = path;
    } else {
      value.path = path;
    }
    return value;
  }

  var REGISTRY = [
    row("cdn-json-playurl", ["api.bilibili.com", "api.biliapi.net", "app.bilibili.com", "app.biliapi.net", "interface.bilibili.com"], "\\/(?:x\\/(?:player\\/(?:wbi\\/)?playurl(?:v2)?|v2\\/playurl)|pgc\\/player\\/(?:api\\/playurl(?:proj)?|web\\/(?:v2\\/)?playurl(?:\\/html5)?)|pugv\\/player\\/(?:api|web)\\/playurl|v2\\/playurl)", "json", "cdn", ["cdn"], false, false, true, true),
    row("cdn-grpc-playurl", GRPC_HOSTS, "\\/(?:bilibili\\.app\\.playerunite\\.v1\\.Player\\/PlayViewUnite|bilibili\\.app\\.playurl\\.v1\\.PlayURL\\/PlayView|bilibili\\.(?:pgc\\.gateway\\.player\\.(?:v1|v2)|cheese\\.gateway\\.player\\.v1)\\.PlayURL\\/PlayView)", "grpc", "cdn", ["cdn"], false, false, true, true),

    row("vip-materials", APP_HOSTS.concat(API_HOSTS), "/x/vip/ads/materials", "json", "vip-materials", ["enhance"], true, true, true),
    row("vip-material-report", APP_HOSTS.concat(API_HOSTS), "/x/vip/ads/material/report", "json", "vip-material-report", ["enhance"], true, true, true),
    row("resource-promotion", APP_HOSTS.concat(API_HOSTS), "\\/x\\/resource\\/(?:top\\/activity|patch\\/tab(?:\\/v2)?)", "json", "resource-promotion", ["enhance"], true, true, true, true),
    row("splash-list", APP_HOSTS, "/x/v2/splash/list", "json", "splash-list", ["enhance"], true, true, true),
    row("splash-show", APP_HOSTS, "/x/v2/splash/show", "json", "splash-show", ["enhance"], true, true, true),
    row("splash-event-list2", APP_HOSTS, "/x/v2/splash/event/list2", "json", "splash-event-list2", ["enhance"], true, true, true),
    row("splash-brand-list", APP_HOSTS, "/x/v2/splash/brand/list", "json", "splash-brand-list", ["enhance"], true, true, true),
    row("feed", APP_HOSTS, "/x/v2/feed/index", "json", "feed", ["enhance"], true, true, true),
    row("story", APP_HOSTS, "/x/v2/feed/index/story", "json", "story", ["story"], true, true, true),
    row("story-cart", APP_HOSTS, "/x/v2/feed/index/story/cart", "json", "story-cart", ["story"], true, true, true),
    row("story-relate", APP_HOSTS, "/x/v2/feed/index/relate/story", "json", "story", ["story"], true, true, true),
    row("search-square", APP_HOSTS, "/x/v2/search/square", "json", "search-square", ["enhance"], true, true, true),
    row("search-results", APP_HOSTS, "\\/x\\/v2\\/search(?:\\/type)?", "json", "search-results", ["enhance"], true, true, true, true),
    row("navigation", APP_HOSTS, "/x/resource/show/tab/v2", "json", "navigation", ["enhance"], true, true, true),
    row("mine", APP_HOSTS, "\\/x\\/v2\\/account\\/mine(?:\\/ipad)?", "json", "mine", ["enhance"], true, true, true, true),
    row("myinfo-diagnostic", APP_HOSTS, "/x/v2/account/myinfo", "json", "myinfo-diagnostic", ["enhance"], true, true, true),
    row("view", APP_HOSTS, "/x/v2/view", "json", "view", ["enhance"], true, true, true),
    row("pgc", API_HOSTS, "\\/pgc\\/page\\/(?:bangumi|cinema\\/tab)", "json", "pgc", ["enhance"], true, true, true, true),
    row("web-feed", API_HOSTS, "\\/x\\/web-interface\\/(?:wbi\\/)?index\\/top\\/feed\\/rcmd", "json", "web-feed", ["enhance"], true, true, true, true),
    row("reply", API_HOSTS, "/x/v2/reply/main", "json", "reply", ["enhance"], true, true, true),
    row("vip-center", API_HOSTS, "/x/vip/web/vip_center/combine", "json", "vip-center", ["enhance"], true, true, true),
    row("pgc-activity-material", API_HOSTS, "/pgc/activity/deliver/material/receive", "json", "pgc-activity-material", ["enhance"], true, true, true),
    row("live", ["api.live.bilibili.com"], "/xlive/app-room/v1/index/getInfoByRoom", "json", "live", ["enhance"], true, true, true),
    row("live-shopping-material", ["api.live.bilibili.com"], "/xlive/e-commerce-interface/v1/ecommerce-user/get_shopping_info", "json", "live-shopping-material", ["enhance"], true, true, true),
    row("game-live-material", ["line3-h5-mobile-api.biligame.com"], "/game/live/large_card_material", "json", "game-live-material", ["enhance"], true, true, true),
    row("search-recommend-words", ["api.vc.bilibili.com"], "\\/search_svr\\/v\\d+\\/Search\\/recommend_words", "json", "search-recommend-words", ["enhance"], true, true, true, true),
    row("manga-flash", ["manga.bilibili.com"], "\\/twirp\\/comic\\.v\\d+\\.Comic\\/(?:Flash|ListFlash)", "json", "manga-flash", ["enhance"], true, true, true, true),

    row("grpc-view-v1", GRPC_HOSTS, "/bilibili.app.view.v1.View/View", "grpc", "grpc-view-v1", ["enhance"], true, true, true),
    row("grpc-view-v1-progress", GRPC_HOSTS, "/bilibili.app.view.v1.View/ViewProgress", "grpc", "grpc-view-v1-progress", ["enhance"], true, true, true),
    row("grpc-view-v1-relates", GRPC_HOSTS, "/bilibili.app.view.v1.View/RelatesFeed", "grpc", "grpc-view-v1-relates", ["enhance"], true, true, true),
    row("grpc-view-v1-tfinfo", GRPC_HOSTS, "/bilibili.app.view.v1.View/TFInfo", "grpc", "grpc-view-v1-tfinfo", ["enhance"], true, true, true),
    row("grpc-view-unite", GRPC_HOSTS, "/bilibili.app.viewunite.v1.View/View", "grpc", "grpc-view-unite", ["enhance"], true, true, true),
    row("grpc-view-unite-progress", GRPC_HOSTS, "/bilibili.app.viewunite.v1.View/ViewProgress", "grpc", "grpc-view-unite-progress", ["enhance"], true, true, true),
    row("grpc-view-unite-play-pause", GRPC_HOSTS, "/bilibili.app.viewunite.v1.View/PlayPause", "grpc", "grpc-view-unite-play-pause", ["enhance"], true, true, true),
    row("grpc-view-unite-end-page", GRPC_HOSTS, "/bilibili.app.viewunite.v1.View/ViewEndPage", "grpc", "grpc-view-unite-end-page", ["enhance"], true, true, true),
    row("grpc-view-unite-relates", GRPC_HOSTS, "/bilibili.app.viewunite.v1.View/RelatesFeed", "grpc", "grpc-view-unite-relates", ["enhance"], true, true, true),
    row("grpc-mine-pub-module", GRPC_HOSTS, "/bilibili.app.mine.v1.Mine/PubModule", "grpc", "grpc-mine-pub-module", ["enhance"], true, true, true),
    row("grpc-mine-device-feature", GRPC_HOSTS, "/bilibili.app.mine.v1.Mine/DeviceFeature", "grpc", "grpc-mine-device-feature", ["enhance"], true, true, true),
    row("grpc-resource-module-list", GRPC_HOSTS, "/bilibili.app.resource.v1.Module/List", "grpc", "grpc-resource-module-list", ["enhance"], true, true, true),
    row("grpc-popular", GRPC_HOSTS, "/bilibili.app.show.v1.Popular/Index", "grpc", "grpc-popular", ["enhance"], true, true, true),
    row("grpc-dynamic", GRPC_HOSTS, "/bilibili.app.dynamic.v2.Dynamic/DynAll", "grpc", "grpc-dynamic", ["enhance"], true, true, true),
    row("grpc-search-all", GRPC_HOSTS, "/bilibili.polymer.app.search.v1.Search/SearchAll", "grpc", "grpc-search-all", ["enhance"], true, true, true),
    row("grpc-search-by-type", GRPC_HOSTS, "/bilibili.polymer.app.search.v1.Search/SearchByType", "grpc", "grpc-search-by-type", ["enhance"], true, true, true),
    row("grpc-search-default-words", GRPC_HOSTS, "/bilibili.app.interface.v1.Search/DefaultWords", "grpc", "grpc-search-default-words", ["enhance"], true, true, true),
    row("grpc-reply", GRPC_HOSTS, "/bilibili.main.community.reply.v1.Reply/MainList", "grpc", "grpc-reply", ["enhance"], true, true, true),
    row("grpc-story-bottom-diversion", GRPC_HOSTS, "/bilibili.app.story.v1.Story/BottomDiversionEntrance", "grpc", "grpc-story-bottom-diversion", ["enhance"], true, true, true),
    row("grpc-metadata-diagnostic", GRPC_HOSTS, "\\/bilibili\\.app\\.(?:view|viewunite|show|story|home|card|feed)\\.[A-Za-z0-9_.]+\\/[A-Za-z0-9_]+", "grpc", "grpc-diagnostic", ["enhance"], true, true, true, true)
  ];

  function parseRequestUrl(requestUrl) {
    var match = /^https?:\/\/([^/?#]+)(\/[^?#]*)?/i.exec(String(requestUrl || ""));
    if (!match) {
      return null;
    }
    return {
      host: String(match[1]).replace(/:\d+$/, "").toLowerCase(),
      path: match[2] || "/"
    };
  }

  function matchesRow(value, parsed) {
    if (!parsed || value.hosts.indexOf(parsed.host) === -1) {
      return false;
    }
    if (value.path) {
      return parsed.path === value.path;
    }
    try {
      return new RegExp("^(?:" + value.pathPattern + ")$").test(parsed.path);
    } catch (error) {
      return false;
    }
  }

  function classify(requestUrl, options) {
    var parsed = parseRequestUrl(requestUrl);
    var index;
    var value;
    options = options || {};
    for (index = 0; index < REGISTRY.length; index += 1) {
      value = REGISTRY[index];
      if (options.transport && value.transport !== options.transport) {
        continue;
      }
      if (options.runtime && value.runtimes.indexOf(options.runtime) === -1) {
        continue;
      }
      if (options.requestGuard === true && value.requestGuard !== true) {
        continue;
      }
      if (options.responseFilter === true && value.responseFilter !== true) {
        continue;
      }
      if (matchesRow(value, parsed)) {
        return value;
      }
    }
    return null;
  }

  function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\//g, "\\/");
  }

  function rowPattern(value) {
    var hosts = value.hosts.map(escapeRegex).join("|");
    var path = value.path ? escapeRegex(value.path) : value.pathPattern;
    return "(?:(?:" + hosts + ")(?::\\d+)?" + path + ")";
  }

  function optionMatches(value, options) {
    if (options.transport && value.transport !== options.transport) {
      return false;
    }
    if (options.runtime && value.runtimes.indexOf(options.runtime) === -1) {
      return false;
    }
    if (options.requestGuard === true && value.requestGuard !== true) {
      return false;
    }
    if (options.responseFilter === true && value.responseFilter !== true) {
      return false;
    }
    if (options.handler && value.handler !== options.handler) {
      return false;
    }
    return true;
  }

  function matcherPattern(options) {
    var rows = REGISTRY.filter(function (value) {
      return optionMatches(value, options || {});
    });
    if (rows.length === 0) {
      return "(?!)";
    }
    return "^https?:\\/\\/(?:" + rows.map(rowPattern).join("|") + ")(?:\\?|$)";
  }

  function toBytes(value) {
    if (typeof Uint8Array !== "undefined" && value instanceof Uint8Array) {
      return value;
    }
    if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) {
      return new Uint8Array(value);
    }
    if (value && value.buffer && typeof value.byteOffset === "number" && typeof value.byteLength === "number") {
      try {
        return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  function isGrpcFramedBody(body) {
    var bytes = toBytes(body);
    var offset = 0;
    var length;
    if (!bytes || bytes.length < 5) {
      return false;
    }
    while (offset < bytes.length) {
      if (offset + 5 > bytes.length || (bytes[offset] !== 0 && bytes[offset] !== 1)) {
        return false;
      }
      length = bytes[offset + 1] * 0x1000000 + bytes[offset + 2] * 0x10000 + bytes[offset + 3] * 0x100 + bytes[offset + 4];
      offset += 5 + length;
      if (offset > bytes.length) {
        return false;
      }
    }
    return offset === bytes.length;
  }

  function detectTransport(context) {
    var contentType = String(context && context.contentType || "").split(";")[0].trim().toLowerCase();
    var body = context && context.body;
    if (/^application\/grpc(?:\+proto)?$/.test(contentType)) {
      return "grpc";
    }
    if (isGrpcFramedBody(body)) {
      return "grpc";
    }
    if (typeof body === "string") {
      return "json";
    }
    if (toBytes(body)) {
      return "binary";
    }
    return "unknown";
  }

  function validateRegistry() {
    var seen = {};
    var index;
    var value;
    for (index = 0; index < REGISTRY.length; index += 1) {
      value = REGISTRY[index];
      if (!value || seen[value.id] || !/^[a-z0-9-]+$/.test(value.id) || !Array.isArray(value.hosts) || value.hosts.length === 0 || (!value.path && !value.pathPattern) || (value.transport !== "json" && value.transport !== "grpc") || typeof value.handler !== "string" || typeof value.volatile !== "boolean" || typeof value.requestGuard !== "boolean" || typeof value.responseFilter !== "boolean") {
        return false;
      }
      seen[value.id] = true;
    }
    return true;
  }

  var api = {
    REGISTRY: REGISTRY,
    classify: classify,
    detectTransport: detectTransport,
    isGrpcFramedBody: isGrpcFramedBody,
    matcherPattern: matcherPattern,
    parseRequestUrl: parseRequestUrl,
    validateRegistry: validateRegistry
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.BiliEndpointRegistry = api;
  }
})(this);
