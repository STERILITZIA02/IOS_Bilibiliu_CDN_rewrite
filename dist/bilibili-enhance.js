"use strict";

(function (root) {
  var hasOwn = Object.prototype.hasOwnProperty;

  var APP_HOSTS = [
    "app.bilibili.com",
    "app.biliapi.net"
  ];
  var API_HOSTS = [
    "api.bilibili.com",
    "api.biliapi.net"
  ];
  var FEED_AD_CARD_TYPES = {
    cm_v1: ["ad_web_s", "ad_av", "ad_web_gif"],
    cm_v2: [
      "ad_web_s",
      "ad_av",
      "ad_web_gif",
      "ad_player",
      "ad_inline_3d",
      "ad_inline_eggs",
      "ad_inline_live"
    ],
    cm_double_v9: ["ad_inline_av"],
    small_cover_v10: ["game"]
  };
  var STORY_AD_TYPES = [
    "vertical_ad_av",
    "vertical_ad_picture",
    "vertical_ad_live"
  ];
  var MINE_TARGETS = {
    "大会员暑期特惠": {
      ids: [],
      uri: /(?:vip|member|summer|blackboard|activity|promotion)/i
    },
    "会员中心营销横幅": {
      ids: [],
      uri: /(?:vip|member|mall|blackboard|activity|promotion)/i
    },
    "发布你的第一个视频": {
      ids: [],
      uri: /(?:uper|upload|member\.bilibili|creative)/i
    },
    "有奖发布": {
      ids: [],
      uri: /(?:uper|upload|york|reward|activity|member\.bilibili)/i
    },
    "我的课程": {
      ids: [400, 794],
      uri: /(?:cheese|course)/i
    },
    "看视频免流量": {
      ids: [401],
      uri: /(?:free[_/-]?traffic|user_center\/free_traffic|traffic)/i
    },
    "工房": {
      ids: [],
      uri: /(?:workshop|mall|market|show)/i
    },
    "能量加油站": {
      ids: [990],
      uri: /(?:306424|energy|blackboard)/i
    },
    "BW乐园": {
      ids: [],
      uri: /(?:\bbw\b|blackboard|activity)/i
    },
    "B萌投票": {
      ids: [],
      uri: /(?:bmoe|vote|blackboard|activity)/i
    }
  };

  function isObject(value) {
    return value !== null && typeof value === "object";
  }

  function isPlainObject(value) {
    return isObject(value) && !Array.isArray(value);
  }

  function includes(list, value) {
    return list.indexOf(value) !== -1;
  }

  function parseBoolean(value, fallback) {
    var normalized;
    if (typeof value === "boolean") {
      return value;
    }
    if (value === 1 || value === 0) {
      return value === 1;
    }
    if (typeof value !== "string") {
      return fallback;
    }
    normalized = value.toLowerCase().trim();
    if (includes(["true", "1", "yes", "on"], normalized)) {
      return true;
    }
    if (includes(["false", "0", "no", "off"], normalized)) {
      return false;
    }
    return fallback;
  }

  function parseKeyValueArgument(raw) {
    var result = {};
    var parts = String(raw || "").split("&");
    var index;
    var pair;
    var separator;
    var key;
    var value;

    for (index = 0; index < parts.length; index += 1) {
      pair = parts[index];
      if (!pair) {
        continue;
      }
      separator = pair.indexOf("=");
      key = separator === -1 ? pair : pair.slice(0, separator);
      value = separator === -1 ? "" : pair.slice(separator + 1);
      key = decodeURIComponent(key);
      value = decodeURIComponent(value);
      result[key] = value;
    }
    return result;
  }

  function parseArgument(raw) {
    var config = {
      ads: true,
      debug: false,
      liveShopping: true,
      searchPromotions: true,
      ui: true,
      valid: true
    };
    var parsed;

    if (typeof raw !== "string" || raw.trim() === "") {
      return config;
    }

    try {
      parsed =
        raw.trim().charAt(0) === "{"
          ? JSON.parse(raw)
          : parseKeyValueArgument(raw);
    } catch (error) {
      config.valid = false;
      return config;
    }

    if (!isPlainObject(parsed)) {
      config.valid = false;
      return config;
    }

    config.ads = parseBoolean(parsed.ads, config.ads);
    config.ui = parseBoolean(parsed.ui, config.ui);
    config.searchPromotions = parseBoolean(
      parsed.searchPromotions,
      config.searchPromotions
    );
    config.liveShopping = parseBoolean(
      parsed.liveShopping,
      config.liveShopping
    );
    config.debug = parseBoolean(parsed.debug, config.debug);
    return config;
  }

  function parseRequestUrl(requestUrl) {
    var match = /^https?:\/\/([^/?#]+)(\/[^?#]*)?/i.exec(
      String(requestUrl || "")
    );
    if (!match) {
      return null;
    }
    return {
      host: String(match[1]).toLowerCase(),
      path: match[2] || "/"
    };
  }

  function classifyEndpoint(requestUrl) {
    var parsed = parseRequestUrl(requestUrl);
    var path;
    if (!parsed) {
      return "";
    }
    path = parsed.path;

    if (includes(APP_HOSTS, parsed.host)) {
      if (
        /^\/x\/v2\/splash\/(?:brand\/list|event\/list2|list|show)$/.test(
          path
        )
      ) {
        return "splash";
      }
      if (path === "/x/v2/feed/index") {
        return "feed";
      }
      if (path === "/x/v2/feed/index/story") {
        return "story";
      }
      if (path === "/x/v2/search/square") {
        return "search-square";
      }
      if (/^\/x\/v2\/search(?:\/type)?$/.test(path)) {
        return "search-results";
      }
      if (path === "/x/resource/show/tab/v2") {
        return "navigation";
      }
      if (/^\/x\/v2\/account\/mine(?:\/ipad)?$/.test(path)) {
        return "mine";
      }
      if (path === "/x/v2/view") {
        return "view";
      }
    }

    if (includes(API_HOSTS, parsed.host)) {
      if (
        path === "/pgc/page/bangumi" ||
        path === "/pgc/page/cinema/tab"
      ) {
        return "pgc";
      }
      if (
        /^\/x\/web-interface\/(?:wbi\/)?index\/top\/feed\/rcmd$/.test(
          path
        )
      ) {
        return "web-feed";
      }
      if (path === "/x/v2/reply/main") {
        return "reply";
      }
    }

    if (
      parsed.host === "api.live.bilibili.com" &&
      path === "/xlive/app-room/v1/index/getInfoByRoom"
    ) {
      return "live";
    }
    return "";
  }

  function classifyGrpcEndpoint(requestUrl) {
    var parsed = parseRequestUrl(requestUrl);
    var allowedHost;
    if (!parsed) {
      return "";
    }
    allowedHost = includes(
      [
        "app.bilibili.com",
        "app.biliapi.net",
        "grpc.bilibili.com",
        "grpc.biliapi.net"
      ],
      parsed.host
    );
    if (!allowedHost) {
      return "";
    }
    switch (parsed.path) {
      case "/bilibili.app.view.v1.View/View":
        return "grpc-view-v1";
      case "/bilibili.app.view.v1.View/RelatesFeed":
        return "grpc-view-v1-relates";
      case "/bilibili.app.viewunite.v1.View/View":
        return "grpc-view-unite";
      case "/bilibili.app.viewunite.v1.View/RelatesFeed":
        return "grpc-view-unite-relates";
      case "/bilibili.app.dynamic.v2.Dynamic/DynAll":
        return "grpc-dynamic";
      case "/bilibili.polymer.app.search.v1.Search/SearchAll":
        return "grpc-search";
      case "/bilibili.main.community.reply.v1.Reply/MainList":
        return "grpc-reply";
      default:
        return "";
    }
  }

  function deleteProperty(object, key) {
    if (!isObject(object) || !hasOwn.call(object, key)) {
      return 0;
    }
    delete object[key];
    return 1;
  }

  function replaceFilteredArray(parent, key, shouldRemove) {
    var source;
    var kept = [];
    var removed = 0;
    var index;

    if (!isObject(parent) || !Array.isArray(parent[key])) {
      return 0;
    }
    source = parent[key];
    for (index = 0; index < source.length; index += 1) {
      if (shouldRemove(source[index], index)) {
        removed += 1;
      } else {
        kept.push(source[index]);
      }
    }
    if (removed > 0) {
      parent[key] = kept;
    }
    return removed;
  }

  function hasExplicitAdMarker(item) {
    var adInfo;
    if (!isPlainObject(item)) {
      return false;
    }
    if (item.is_ad === true || item.is_ad === 1) {
      return true;
    }
    if (item.goto === "ad" || item.type === "ad") {
      return true;
    }
    if (hasOwn.call(item, "ad_info")) {
      adInfo = item.ad_info;
      if (
        adInfo !== null &&
        adInfo !== false &&
        adInfo !== 0 &&
        adInfo !== ""
      ) {
        return true;
      }
    }
    return isFeedAdCard(item);
  }

  function isFeedAdCard(item) {
    var cardType;
    var cardGoto;
    var allowed;
    if (!isPlainObject(item)) {
      return false;
    }
    cardType = String(item.card_type || "");
    cardGoto = String(item.card_goto || "");
    allowed = FEED_AD_CARD_TYPES[cardType];
    return Array.isArray(allowed) && includes(allowed, cardGoto);
  }

  function handleSplash(body) {
    var changes = 0;
    var keys = ["account", "event_list", "preload", "show"];
    var index;
    if (!isPlainObject(body.data)) {
      return 0;
    }
    for (index = 0; index < keys.length; index += 1) {
      changes += deleteProperty(body.data, keys[index]);
    }
    return changes;
  }

  function handleFeed(body) {
    var data = body.data;
    var source;
    var kept = [];
    var changes = 0;
    var index;
    var item;
    var before;
    var removed;
    var cardType;

    if (!isPlainObject(data) || !Array.isArray(data.items)) {
      return 0;
    }
    source = data.items;
    for (index = 0; index < source.length; index += 1) {
      item = source[index];
      if (isFeedAdCard(item)) {
        changes += 1;
        continue;
      }

      cardType = isPlainObject(item)
        ? String(item.card_type || "")
        : "";
      if (
        isPlainObject(item) &&
        includes(["banner_v8", "banner_ipad_v8"], cardType) &&
        item.card_goto === "banner" &&
        Array.isArray(item.banner_item)
      ) {
        before = item.banner_item.length;
        removed = replaceFilteredArray(
          item,
          "banner_item",
          function (banner) {
            return isPlainObject(banner) && banner.type === "ad";
          }
        );
        changes += removed;
        if (before > 0 && item.banner_item.length === 0) {
          changes += 1;
          continue;
        }
      }
      kept.push(item);
    }
    if (kept.length !== source.length) {
      data.items = kept;
    }
    return changes;
  }

  function handleStory(body) {
    if (!isPlainObject(body.data)) {
      return 0;
    }
    return replaceFilteredArray(body.data, "items", function (item) {
      if (!isPlainObject(item)) {
        return false;
      }
      return (
        hasExplicitAdMarker(item) ||
        includes(STORY_AD_TYPES, String(item.card_goto || ""))
      );
    });
  }

  function handleSearchSquare(body, config) {
    var changes = 0;
    var data = body.data;
    if (!Array.isArray(data)) {
      return 0;
    }
    if (config.searchPromotions) {
      changes += replaceFilteredArray(body, "data", function (item) {
        return isPlainObject(item) && item.type === "trending";
      });
    }
    if (config.ads) {
      changes += replaceFilteredArray(body, "data", hasExplicitAdMarker);
    }
    return changes;
  }

  function filterSearchArray(parent, key) {
    return replaceFilteredArray(parent, key, hasExplicitAdMarker);
  }

  function handleSearchResults(body) {
    var changes = 0;
    var data = body.data;
    if (Array.isArray(data)) {
      return replaceFilteredArray(body, "data", hasExplicitAdMarker);
    }
    if (!isPlainObject(data)) {
      return 0;
    }
    changes += filterSearchArray(data, "items");
    changes += filterSearchArray(data, "item");
    changes += filterSearchArray(data, "result");
    if (Array.isArray(data.result)) {
      data.result.forEach(function (group) {
        if (isPlainObject(group)) {
          changes += filterSearchArray(group, "items");
          changes += filterSearchArray(group, "data");
        }
      });
    }
    return changes;
  }

  function normalizeLabel(value) {
    return typeof value === "string"
      ? value.replace(/\s+/g, "").trim()
      : "";
  }

  function objectLabels(item) {
    var keys = ["title", "name", "text", "label"];
    var labels = [];
    var index;
    var normalized;
    if (!isPlainObject(item)) {
      return labels;
    }
    for (index = 0; index < keys.length; index += 1) {
      normalized = normalizeLabel(item[keys[index]]);
      if (normalized && !includes(labels, normalized)) {
        labels.push(normalized);
      }
    }
    return labels;
  }

  function objectLink(item) {
    var keys = [
      "uri",
      "url",
      "link",
      "blink",
      "jump_url",
      "jumpUrl",
      "scheme"
    ];
    var index;
    if (!isPlainObject(item)) {
      return "";
    }
    for (index = 0; index < keys.length; index += 1) {
      if (typeof item[keys[index]] === "string" && item[keys[index]]) {
        return item[keys[index]];
      }
    }
    return "";
  }

  function matchesNavigationItem(item, target) {
    var name;
    var uri;
    var id;
    var tabId;
    if (!isPlainObject(item)) {
      return false;
    }
    name = normalizeLabel(item.name || item.title);
    uri = String(item.uri || item.url || "");
    id = Number(item.id);
    tabId = String(item.tab_id || "");

    if (target === "game") {
      return (
        name === "游戏中心" &&
        (
          id === 222 ||
          tabId === "游戏中心Top" ||
          /^bilibili:\/\/game_center\/home\/?$/i.test(uri)
        )
      );
    }
    if (target === "journey") {
      return (
        name === "新征程" &&
        (
          id === 136117 ||
          tabId === "165" ||
          /\/136117(?:[/?#]|$)/.test(uri)
        )
      );
    }
    if (target === "publish") {
      return (
        name === "发布" &&
        (
          id === 670 ||
          tabId === "publish" ||
          /^bilibili:\/\/uper\/center_plus(?:[/?#]|$)/i.test(uri)
        )
      );
    }
    if (target === "mall") {
      return (
        name === "会员购" &&
        (
          id === 242 ||
          tabId === "会员购Bottom" ||
          /^bilibili:\/\/mall\/home\/?$/i.test(uri)
        )
      );
    }
    return false;
  }

  function normalizePositions(items) {
    var index;
    var changes = 0;
    if (!Array.isArray(items)) {
      return 0;
    }
    for (index = 0; index < items.length; index += 1) {
      if (
        isPlainObject(items[index]) &&
        hasOwn.call(items[index], "pos") &&
        items[index].pos !== index + 1
      ) {
        items[index].pos = index + 1;
        changes += 1;
      }
    }
    return changes;
  }

  function filterNavigation(parent, key, target) {
    var removed = replaceFilteredArray(parent, key, function (item) {
      return matchesNavigationItem(item, target);
    });
    if (removed > 0) {
      return removed + normalizePositions(parent[key]);
    }
    return 0;
  }

  function handleNavigation(body) {
    var data = body.data;
    var changes = 0;
    if (!isPlainObject(data)) {
      return 0;
    }
    changes += filterNavigation(data, "top", "game");
    changes += filterNavigation(data, "tab", "journey");
    changes += filterNavigation(data, "bottom", "publish");
    changes += filterNavigation(data, "bottom", "mall");
    return changes;
  }

  function matchesMineTarget(item) {
    var labels = objectLabels(item);
    var link = objectLink(item);
    var id = Number(item && item.id);
    var index;
    var label;
    var target;
    if (!isPlainObject(item)) {
      return false;
    }
    for (index = 0; index < labels.length; index += 1) {
      label = labels[index];
      target = MINE_TARGETS[label];
      if (!target) {
        continue;
      }
      if (includes(target.ids, id)) {
        return true;
      }
      if (link && target.uri.test(link)) {
        return true;
      }
      if (
        hasOwn.call(item, "id") &&
        item.id !== null &&
        String(item.id) !== ""
      ) {
        return true;
      }
      if (hasExplicitAdMarker(item)) {
        return true;
      }
    }
    return false;
  }

  function isEmptyMineGroup(item) {
    var button;
    if (
      !isPlainObject(item) ||
      !Array.isArray(item.items) ||
      item.items.length !== 0
    ) {
      return false;
    }
    button = item.button;
    if (
      isPlainObject(button) &&
      Object.keys(button).length > 0
    ) {
      return false;
    }
    return (
      hasOwn.call(item, "title") ||
      hasOwn.call(item, "up_title") ||
      hasOwn.call(item, "style")
    );
  }

  function filterMineNode(node, depth) {
    var changes = 0;
    var kept;
    var index;
    var value;
    var keys;
    var key;

    if (!isObject(node) || depth > 16) {
      return 0;
    }
    if (Array.isArray(node)) {
      kept = [];
      for (index = 0; index < node.length; index += 1) {
        value = node[index];
        if (matchesMineTarget(value)) {
          changes += 1;
          continue;
        }
        changes += filterMineNode(value, depth + 1);
        if (isEmptyMineGroup(value)) {
          changes += 1;
          continue;
        }
        kept.push(value);
      }
      if (kept.length !== node.length) {
        node.length = 0;
        for (index = 0; index < kept.length; index += 1) {
          node.push(kept[index]);
        }
      }
      return changes;
    }

    keys = Object.keys(node);
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      value = node[key];
      if (matchesMineTarget(value)) {
        delete node[key];
        changes += 1;
        continue;
      }
      changes += filterMineNode(value, depth + 1);
    }
    return changes;
  }

  function handleMine(body) {
    return isPlainObject(body.data)
      ? filterMineNode(body.data, 0)
      : 0;
  }

  function handleView(body) {
    var data = body.data;
    var changes = 0;
    if (!isPlainObject(data)) {
      return 0;
    }
    changes += deleteProperty(data, "cm");
    changes += deleteProperty(data, "cms");
    changes += deleteProperty(data, "cm_config");
    changes += deleteProperty(data, "cm_ipad");
    changes += replaceFilteredArray(data, "relates", function (item) {
      return (
        isPlainObject(item) &&
        (
          hasExplicitAdMarker(item) ||
          (
            hasOwn.call(item, "cm") &&
            item.cm !== null &&
            item.cm !== false
          )
        )
      );
    });
    return changes;
  }

  function handleReply(body) {
    var data = body.data;
    var changes = 0;
    var shortCommercialLink = /https?:\/\/b23\.tv\/(?:cm|mall)(?:[/?#]|$)/i;
    if (!isPlainObject(data)) {
      return 0;
    }
    changes += deleteProperty(data, "cm");
    changes += replaceFilteredArray(data, "top_replies", function (reply) {
      var content;
      var message;
      var urls;
      if (!isPlainObject(reply) || !isPlainObject(reply.content)) {
        return false;
      }
      content = reply.content;
      message = typeof content.message === "string"
        ? content.message
        : "";
      urls = isPlainObject(content.url)
        ? Object.keys(content.url)
        : [];
      return (
        shortCommercialLink.test(message) ||
        urls.some(function (url) {
          return shortCommercialLink.test(url);
        })
      );
    });
    return changes;
  }

  function isCommercialUri(value) {
    return /(?:bilibili:\/\/(?:game_center|mall)\/|mall\.bilibili\.com\/|b23\.tv\/(?:cm|mall)(?:[/?#]|$))/i.test(
      String(value || "")
    );
  }

  function handlePgc(body) {
    var result = body.result;
    var changes = 0;
    if (!isPlainObject(result) || !Array.isArray(result.modules)) {
      return 0;
    }
    result.modules.forEach(function (moduleItem) {
      var style;
      if (!isPlainObject(moduleItem)) {
        return;
      }
      style = String(moduleItem.style || "");
      if (
        Array.isArray(moduleItem.items) &&
        /^banner/i.test(style)
      ) {
        changes += replaceFilteredArray(
          moduleItem,
          "items",
          function (item) {
            return (
              hasExplicitAdMarker(item) ||
              isCommercialUri(objectLink(item))
            );
          }
        );
      }
    });
    return changes;
  }

  function handleWebFeed(body) {
    if (!isPlainObject(body.data)) {
      return 0;
    }
    return replaceFilteredArray(body.data, "item", function (item) {
      return isPlainObject(item) && item.goto === "ad";
    });
  }

  function handleLive(body, config) {
    var data = body.data;
    var changes = 0;
    if (!isPlainObject(data)) {
      return 0;
    }
    changes += deleteProperty(data, "activity_banner_info");
    if (config.liveShopping && isPlainObject(data.shopping_info)) {
      if (
        data.shopping_info.is_show !== 0 ||
        Object.keys(data.shopping_info).length !== 1
      ) {
        data.shopping_info = { is_show: 0 };
        changes += 1;
      }
    }
    if (
      config.liveShopping &&
      isPlainObject(data.new_tab_info) &&
      Array.isArray(data.new_tab_info.outer_list)
    ) {
      changes += replaceFilteredArray(
        data.new_tab_info,
        "outer_list",
        function (item) {
          return isPlainObject(item) && Number(item.biz_id) === 33;
        }
      );
    }
    return changes;
  }

  function transformObject(body, endpoint, config) {
    if (!isPlainObject(body)) {
      return 0;
    }
    if (endpoint === "navigation") {
      return config.ui ? handleNavigation(body) : 0;
    }
    if (endpoint === "mine") {
      return config.ui ? handleMine(body) : 0;
    }
    if (endpoint === "search-square") {
      return handleSearchSquare(body, config);
    }
    if (!config.ads) {
      return 0;
    }
    switch (endpoint) {
      case "splash":
        return handleSplash(body);
      case "feed":
        return handleFeed(body);
      case "story":
        return handleStory(body);
      case "search-results":
        return handleSearchResults(body);
      case "view":
        return handleView(body);
      case "reply":
        return handleReply(body);
      case "pgc":
        return handlePgc(body);
      case "web-feed":
        return handleWebFeed(body);
      case "live":
        return handleLive(body, config);
      default:
        return 0;
    }
  }

  function transformJsonText(bodyText, requestUrl, config) {
    var original =
      typeof bodyText === "string" ? bodyText : "";
    var parsed;
    var endpoint;
    var changes;
    var effectiveConfig = config || parseArgument("");

    try {
      parsed = JSON.parse(original);
    } catch (error) {
      return {
        body: original,
        changed: 0,
        endpoint: "",
        valid: false
      };
    }

    endpoint = classifyEndpoint(requestUrl);
    if (!endpoint) {
      return {
        body: original,
        changed: 0,
        endpoint: "",
        valid: true
      };
    }

    try {
      changes = transformObject(parsed, endpoint, effectiveConfig);
    } catch (error) {
      return {
        body: original,
        changed: 0,
        endpoint: endpoint,
        valid: false
      };
    }
    return {
      body: changes > 0 ? JSON.stringify(parsed) : original,
      changed: changes,
      endpoint: endpoint,
      valid: true
    };
  }

  function isByteView(value) {
    return (
      typeof ArrayBuffer !== "undefined" &&
      (
        value instanceof ArrayBuffer ||
        (
          typeof ArrayBuffer.isView === "function" &&
          ArrayBuffer.isView(value)
        )
      )
    );
  }

  function toUint8Array(value) {
    if (
      typeof Uint8Array !== "undefined" &&
      value instanceof Uint8Array
    ) {
      return value;
    }
    if (
      typeof ArrayBuffer !== "undefined" &&
      value instanceof ArrayBuffer
    ) {
      return new Uint8Array(value);
    }
    if (
      value &&
      typeof ArrayBuffer !== "undefined" &&
      value.buffer instanceof ArrayBuffer &&
      typeof value.byteOffset === "number" &&
      typeof value.byteLength === "number"
    ) {
      return new Uint8Array(
        value.buffer,
        value.byteOffset,
        value.byteLength
      );
    }
    return null;
  }

  function concatBytes(chunks) {
    var total = 0;
    var output;
    var offset = 0;
    var index;
    for (index = 0; index < chunks.length; index += 1) {
      total += chunks[index].length;
    }
    output = new Uint8Array(total);
    for (index = 0; index < chunks.length; index += 1) {
      output.set(chunks[index], offset);
      offset += chunks[index].length;
    }
    return output;
  }

  function encodeVarint(value) {
    var remaining = Math.floor(Number(value));
    var output = [];
    if (!Number.isFinite(remaining) || remaining < 0) {
      return null;
    }
    do {
      output.push((remaining % 128) | (remaining >= 128 ? 128 : 0));
      remaining = Math.floor(remaining / 128);
    } while (remaining > 0);
    return new Uint8Array(output);
  }

  function readVarint(bytes, start) {
    var value = 0;
    var multiplier = 1;
    var offset = start;
    var count = 0;
    var byte;
    while (offset < bytes.length && count < 10) {
      byte = bytes[offset];
      value += (byte & 0x7f) * multiplier;
      offset += 1;
      count += 1;
      if ((byte & 0x80) === 0) {
        return {
          next: offset,
          value: value
        };
      }
      multiplier *= 128;
    }
    return null;
  }

  function parseProtoFields(input) {
    var bytes = toUint8Array(input);
    var fields = [];
    var offset = 0;
    var tag;
    var fieldNumber;
    var wireType;
    var field;
    var length;
    var value;
    var end;
    if (!bytes) {
      return null;
    }
    while (offset < bytes.length) {
      tag = readVarint(bytes, offset);
      if (!tag || !Number.isSafeInteger(tag.value)) {
        return null;
      }
      fieldNumber = Math.floor(tag.value / 8);
      wireType = tag.value % 8;
      if (fieldNumber <= 0) {
        return null;
      }
      field = {
        end: 0,
        fieldNumber: fieldNumber,
        payloadEnd: 0,
        payloadStart: 0,
        scalar: null,
        start: offset,
        tagEnd: tag.next,
        wireType: wireType
      };
      if (wireType === 0) {
        value = readVarint(bytes, tag.next);
        if (!value) {
          return null;
        }
        field.scalar = value.value;
        end = value.next;
      } else if (wireType === 1) {
        end = tag.next + 8;
      } else if (wireType === 2) {
        length = readVarint(bytes, tag.next);
        if (
          !length ||
          !Number.isSafeInteger(length.value) ||
          length.value < 0
        ) {
          return null;
        }
        field.payloadStart = length.next;
        field.payloadEnd = length.next + length.value;
        end = field.payloadEnd;
      } else if (wireType === 5) {
        end = tag.next + 4;
      } else {
        return null;
      }
      if (end > bytes.length || end < tag.next) {
        return null;
      }
      field.end = end;
      fields.push(field);
      offset = end;
    }
    return fields;
  }

  function protoPayload(bytes, field) {
    return bytes.slice(field.payloadStart, field.payloadEnd);
  }

  function rewriteProtoMessage(input, visitor) {
    var bytes = toUint8Array(input);
    var fields = parseProtoFields(bytes);
    var chunks = [];
    var changes = 0;
    var index;
    var field;
    var action;
    var encodedLength;
    if (!bytes || !fields) {
      return {
        body: bytes || new Uint8Array(),
        changed: 0,
        valid: false
      };
    }
    for (index = 0; index < fields.length; index += 1) {
      field = fields[index];
      action = visitor(field, bytes);
      if (action && action.invalid) {
        return {
          body: bytes,
          changed: 0,
          valid: false
        };
      }
      if (action && action.remove) {
        changes += action.changed || 1;
        continue;
      }
      if (
        action &&
        action.payload &&
        field.wireType === 2
      ) {
        encodedLength = encodeVarint(action.payload.length);
        if (!encodedLength) {
          return {
            body: bytes,
            changed: 0,
            valid: false
          };
        }
        chunks.push(bytes.slice(field.start, field.tagEnd));
        chunks.push(encodedLength);
        chunks.push(action.payload);
        changes += action.changed || 1;
        continue;
      }
      chunks.push(bytes.slice(field.start, field.end));
    }
    return {
      body: changes > 0 ? concatBytes(chunks) : bytes,
      changed: changes,
      valid: true
    };
  }

  function findProtoField(input, fieldNumber, wireType) {
    var bytes = toUint8Array(input);
    var fields = parseProtoFields(bytes);
    var index;
    if (!bytes || !fields) {
      return null;
    }
    for (index = 0; index < fields.length; index += 1) {
      if (
        fields[index].fieldNumber === fieldNumber &&
        (
          wireType === undefined ||
          fields[index].wireType === wireType
        )
      ) {
        return fields[index];
      }
    }
    return null;
  }

  function countProtoFields(input, fieldNumber, wireType) {
    var fields = parseProtoFields(input);
    var count = 0;
    var index;
    if (!fields) {
      return -1;
    }
    for (index = 0; index < fields.length; index += 1) {
      if (
        fields[index].fieldNumber === fieldNumber &&
        (
          wireType === undefined ||
          fields[index].wireType === wireType
        )
      ) {
        count += 1;
      }
    }
    return count;
  }

  function smallVarintField(input, fieldNumber) {
    var field = findProtoField(input, fieldNumber, 0);
    return field ? field.scalar : null;
  }

  function bytesContainCommercialLink(input) {
    var bytes = toUint8Array(input);
    var text = "";
    var index;
    if (!bytes || bytes.length > 65536) {
      return false;
    }
    for (index = 0; index < bytes.length; index += 1) {
      text += String.fromCharCode(bytes[index]);
    }
    return /https?:\/\/b23\.tv\/(?:cm|mall)(?:[/?#]|$)/i.test(
      text
    );
  }

  function isViewV1RelateAd(input) {
    return Boolean(findProtoField(input, 28, 2));
  }

  function isViewUniteRelateAd(input) {
    var bytes = toUint8Array(input);
    var type = smallVarintField(bytes, 1);
    var stock = findProtoField(bytes, 11, 2);
    var basic = findProtoField(bytes, 12, 2);
    var unique;
    if (type === 4 || type === 5) {
      return true;
    }
    if (stock && stock.payloadEnd > stock.payloadStart) {
      return true;
    }
    if (basic) {
      unique = findProtoField(protoPayload(bytes, basic), 6, 2);
      if (unique && unique.payloadEnd > unique.payloadStart) {
        return true;
      }
    }
    return false;
  }

  function filterRepeatedMessage(
    input,
    fieldNumber,
    shouldRemove
  ) {
    return rewriteProtoMessage(input, function (field, bytes) {
      var payload;
      if (
        field.fieldNumber !== fieldNumber ||
        field.wireType !== 2
      ) {
        return null;
      }
      payload = protoPayload(bytes, field);
      return shouldRemove(payload)
        ? { changed: 1, remove: true }
        : null;
    });
  }

  function transformViewV1(input, relatesOnly) {
    if (relatesOnly) {
      return filterRepeatedMessage(input, 1, isViewV1RelateAd);
    }
    return rewriteProtoMessage(input, function (field, bytes) {
      if (
        field.wireType === 2 &&
        includes([30, 31, 41, 48], field.fieldNumber)
      ) {
        return { changed: 1, remove: true };
      }
      if (
        field.fieldNumber === 10 &&
        field.wireType === 2 &&
        isViewV1RelateAd(protoPayload(bytes, field))
      ) {
        return { changed: 1, remove: true };
      }
      return null;
    });
  }

  function transformViewUniteRelates(input) {
    return filterRepeatedMessage(
      input,
      1,
      isViewUniteRelateAd
    );
  }

  function transformViewUniteModule(input) {
    var hadRelates = Boolean(findProtoField(input, 22, 2));
    var result = rewriteProtoMessage(
      input,
      function (field, bytes) {
        var nested;
        if (
          field.fieldNumber !== 22 ||
          field.wireType !== 2
        ) {
          return null;
        }
        nested = transformViewUniteRelates(
          protoPayload(bytes, field)
        );
        if (!nested.valid) {
          return { invalid: true };
        }
        return nested.changed > 0
          ? {
              changed: nested.changed,
              payload: nested.body
            }
          : null;
      }
    );
    var relates;
    var empty = false;
    if (!result.valid) {
      return result;
    }
    if (hadRelates && result.changed > 0) {
      relates = findProtoField(result.body, 22, 2);
      empty =
        relates &&
        countProtoFields(
          protoPayload(result.body, relates),
          1,
          2
        ) === 0;
    }
    result.empty = Boolean(empty);
    return result;
  }

  function transformViewUniteIntroduction(input) {
    var result = rewriteProtoMessage(input, function (field, bytes) {
      var nested;
      if (
        field.fieldNumber !== 2 ||
        field.wireType !== 2
      ) {
        return null;
      }
      nested = transformViewUniteModule(
        protoPayload(bytes, field)
      );
      if (!nested.valid) {
        return { invalid: true };
      }
      if (nested.changed === 0) {
        return null;
      }
      if (nested.empty) {
        return {
          changed: nested.changed + 1,
          remove: true
        };
      }
      return {
        changed: nested.changed,
        payload: nested.body
      };
    });
    if (result.valid) {
      result.empty =
        countProtoFields(result.body, 2, 2) === 0;
    }
    return result;
  }

  function transformViewUniteTabModule(input) {
    var result = rewriteProtoMessage(input, function (field, bytes) {
      var nested;
      if (
        field.fieldNumber !== 2 ||
        field.wireType !== 2
      ) {
        return null;
      }
      nested = transformViewUniteIntroduction(
        protoPayload(bytes, field)
      );
      if (!nested.valid) {
        return { invalid: true };
      }
      if (nested.changed > 0 && nested.empty) {
        return {
          changed: nested.changed + 1,
          remove: true
        };
      }
      return nested.changed > 0
        ? { changed: nested.changed, payload: nested.body }
        : null;
    });
    if (result.valid) {
      result.empty =
        countProtoFields(result.body, 2, 2) +
          countProtoFields(result.body, 3, 2) +
          countProtoFields(result.body, 4, 2) ===
        0;
    }
    return result;
  }

  function transformViewUniteTab(input) {
    return rewriteProtoMessage(input, function (field, bytes) {
      var nested;
      if (
        field.fieldNumber !== 1 ||
        field.wireType !== 2
      ) {
        return null;
      }
      nested = transformViewUniteTabModule(
        protoPayload(bytes, field)
      );
      if (!nested.valid) {
        return { invalid: true };
      }
      if (nested.changed > 0 && nested.empty) {
        return {
          changed: nested.changed + 1,
          remove: true
        };
      }
      return nested.changed > 0
        ? { changed: nested.changed, payload: nested.body }
        : null;
    });
  }

  function transformViewUnite(input, relatesOnly) {
    if (relatesOnly) {
      return transformViewUniteRelates(input);
    }
    return rewriteProtoMessage(input, function (field, bytes) {
      var nested;
      if (field.fieldNumber === 7 && field.wireType === 2) {
        return { changed: 1, remove: true };
      }
      if (field.fieldNumber !== 5 || field.wireType !== 2) {
        return null;
      }
      nested = transformViewUniteTab(
        protoPayload(bytes, field)
      );
      if (!nested.valid) {
        return { invalid: true };
      }
      return nested.changed > 0
        ? { changed: nested.changed, payload: nested.body }
        : null;
    });
  }

  function transformDynamicList(input) {
    return filterRepeatedMessage(input, 1, function (item) {
      return smallVarintField(item, 1) === 15;
    });
  }

  function transformDynamic(input) {
    return rewriteProtoMessage(input, function (field, bytes) {
      var nested;
      if (
        field.fieldNumber !== 1 ||
        field.wireType !== 2
      ) {
        return null;
      }
      nested = transformDynamicList(protoPayload(bytes, field));
      if (!nested.valid) {
        return { invalid: true };
      }
      return nested.changed > 0
        ? { changed: nested.changed, payload: nested.body }
        : null;
    });
  }

  function isSearchAd(input) {
    return Boolean(
      findProtoField(input, 25, 2) ||
      findProtoField(input, 11, 2)
    );
  }

  function transformSearch(input) {
    return filterRepeatedMessage(input, 4, isSearchAd);
  }

  function isCommercialTopReply(input) {
    var bytes = toUint8Array(input);
    var content = findProtoField(bytes, 12, 2);
    var contentBytes;
    var fields;
    var index;
    var entry;
    var key;
    if (!content) {
      return false;
    }
    contentBytes = protoPayload(bytes, content);
    fields = parseProtoFields(contentBytes);
    if (!fields) {
      return false;
    }
    for (index = 0; index < fields.length; index += 1) {
      if (
        fields[index].wireType === 2 &&
        fields[index].fieldNumber === 1 &&
        bytesContainCommercialLink(
          protoPayload(contentBytes, fields[index])
        )
      ) {
        return true;
      }
      if (
        fields[index].wireType === 2 &&
        fields[index].fieldNumber === 5
      ) {
        entry = protoPayload(contentBytes, fields[index]);
        key = findProtoField(entry, 1, 2);
        if (
          key &&
          bytesContainCommercialLink(protoPayload(entry, key))
        ) {
          return true;
        }
      }
    }
    return false;
  }

  function transformReply(input) {
    return rewriteProtoMessage(input, function (field, bytes) {
      if (field.fieldNumber === 11 && field.wireType === 2) {
        return { changed: 1, remove: true };
      }
      if (
        field.fieldNumber === 14 &&
        field.wireType === 2 &&
        isCommercialTopReply(protoPayload(bytes, field))
      ) {
        return { changed: 1, remove: true };
      }
      return null;
    });
  }

  function transformGrpcPayload(input, endpoint) {
    switch (endpoint) {
      case "grpc-view-v1":
        return transformViewV1(input, false);
      case "grpc-view-v1-relates":
        return transformViewV1(input, true);
      case "grpc-view-unite":
        return transformViewUnite(input, false);
      case "grpc-view-unite-relates":
        return transformViewUnite(input, true);
      case "grpc-dynamic":
        return transformDynamic(input);
      case "grpc-search":
        return transformSearch(input);
      case "grpc-reply":
        return transformReply(input);
      default:
        return {
          body: toUint8Array(input) || new Uint8Array(),
          changed: 0,
          valid: true
        };
    }
  }

  function grpcHeader(flag, length) {
    var header = new Uint8Array(5);
    header[0] = flag;
    header[1] = Math.floor(length / 0x1000000) & 0xff;
    header[2] = Math.floor(length / 0x10000) & 0xff;
    header[3] = Math.floor(length / 0x100) & 0xff;
    header[4] = length & 0xff;
    return header;
  }

  function transformGrpcBody(body, requestUrl, config) {
    var original = toUint8Array(body);
    var endpoint = classifyGrpcEndpoint(requestUrl);
    var effectiveConfig = config || parseArgument("");
    var chunks = [];
    var offset = 0;
    var changed = 0;
    var flag;
    var length;
    var end;
    var payload;
    var result;
    if (!original || original.length < 5) {
      return {
        body: original || new Uint8Array(),
        changed: 0,
        endpoint: endpoint,
        valid: false
      };
    }
    if (!endpoint || !effectiveConfig.ads) {
      return {
        body: original,
        changed: 0,
        endpoint: endpoint,
        valid: true
      };
    }
    while (offset < original.length) {
      if (offset + 5 > original.length) {
        return {
          body: original,
          changed: 0,
          endpoint: endpoint,
          valid: false
        };
      }
      flag = original[offset];
      length =
        original[offset + 1] * 0x1000000 +
        original[offset + 2] * 0x10000 +
        original[offset + 3] * 0x100 +
        original[offset + 4];
      end = offset + 5 + length;
      if (end > original.length || end < offset + 5) {
        return {
          body: original,
          changed: 0,
          endpoint: endpoint,
          valid: false
        };
      }
      if (flag !== 0) {
        chunks.push(original.slice(offset, end));
        offset = end;
        continue;
      }
      payload = original.slice(offset + 5, end);
      result = transformGrpcPayload(payload, endpoint);
      if (!result.valid) {
        return {
          body: original,
          changed: 0,
          endpoint: endpoint,
          valid: false
        };
      }
      if (result.changed > 0) {
        chunks.push(grpcHeader(0, result.body.length));
        chunks.push(result.body);
        changed += result.changed;
      } else {
        chunks.push(original.slice(offset, end));
      }
      offset = end;
    }
    return {
      body: changed > 0 ? concatBytes(chunks) : original,
      changed: changed,
      endpoint: endpoint,
      valid: true
    };
  }

  function safeLog(message) {
    if (
      typeof console !== "undefined" &&
      console &&
      typeof console.log === "function"
    ) {
      console.log("[BiliEnhance] " + String(message));
    }
  }

  function runShadowrocket() {
    var config;
    var body;
    var requestUrl;
    var result;
    var grpcEndpoint;
    try {
      config = parseArgument(
        typeof $argument === "string" ? $argument : ""
      );
      if (!config.valid) {
        safeLog("invalid module argument; response left unchanged");
        $done({});
        return;
      }
      body =
        typeof $response !== "undefined" && $response
          ? $response.body
          : null;
      requestUrl =
        typeof $request !== "undefined" && $request
          ? String($request.url || "")
          : "";
      grpcEndpoint = classifyGrpcEndpoint(requestUrl);
      if (isByteView(body) || grpcEndpoint) {
        result = transformGrpcBody(body, requestUrl, config);
        if (result.valid && result.changed > 0) {
          if (config.debug) {
            safeLog(
              result.endpoint + " removed " +
                result.changed + " Protobuf field/item(s)"
            );
          }
          $done({ body: result.body });
          return;
        }
        if (config.debug && !result.valid) {
          safeLog("unsupported gRPC response left unchanged");
        }
        $done({});
        return;
      }
      if (typeof body !== "string") {
        if (config.debug) {
          safeLog("non-text response left unchanged");
        }
        $done({});
        return;
      }
      result = transformJsonText(body, requestUrl, config);
      if (result.valid && result.changed > 0) {
        if (config.debug) {
          safeLog(
            result.endpoint + " removed/updated " +
              result.changed + " item(s)"
          );
        }
        $done({ body: result.body });
        return;
      }
      if (config.debug && !result.valid) {
        safeLog("unsupported JSON response left unchanged");
      }
      $done({});
    } catch (error) {
      safeLog(
        "error; response left unchanged: " +
          (
            error && error.message
              ? error.message
              : String(error)
          )
      );
      $done({});
    }
  }

  var api = {
    classifyEndpoint: classifyEndpoint,
    classifyGrpcEndpoint: classifyGrpcEndpoint,
    concatBytes: concatBytes,
    encodeVarint: encodeVarint,
    handleFeed: handleFeed,
    handleMine: handleMine,
    handleNavigation: handleNavigation,
    hasExplicitAdMarker: hasExplicitAdMarker,
    isFeedAdCard: isFeedAdCard,
    matchesMineTarget: matchesMineTarget,
    matchesNavigationItem: matchesNavigationItem,
    parseArgument: parseArgument,
    parseProtoFields: parseProtoFields,
    readVarint: readVarint,
    runShadowrocket: runShadowrocket,
    transformGrpcBody: transformGrpcBody,
    transformGrpcPayload: transformGrpcPayload,
    transformJsonText: transformJsonText
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.BiliEnhance = api;
  }

  if (
    typeof $done === "function" &&
    typeof $response !== "undefined"
  ) {
    runShadowrocket();
  }
})(this);
