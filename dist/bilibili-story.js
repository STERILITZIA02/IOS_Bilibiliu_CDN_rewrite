"use strict";
this.__BILIFLOW_COMBINED__ = true;
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
    "vertical_ad_live",
    "vertical_pgc"
  ];
  var HOME_FEED_VIDEO_LIMIT = 6;
  var HOME_FEED_AV_CARD_TYPES = {
    large_cover_single_v9: true,
    large_cover_v1: true,
    small_cover_v2: true
  };
  var FEED_REFILL_HEADER = "X-BiliFlow-Refill";
  var FEED_REFILL_TIMEOUT_MS = 2200;
  var UI_OPTION_DEFAULTS = {
    hideHomeGame: true,
    hideHomeJourney: true,
    hideBottomPublish: true,
    hideBottomMall: true,
    hideMineFirstVideo: true,
    hideMineRewardPublish: true,
    hideMineCourse: true,
    hideMineFreeData: true,
    hideMineWorkshop: true,
    hideMineEnergy: true,
    hideMineBwPark: true,
    hideMineBmoe: true,
    hideMinePersonalDress: false,
    hideMineWallet: false,
    hideMineGameCenter: false,
    hideMineMallOrders: false,
    hideMineLive: false,
    hideMinePromotion: false,
    hideMineCreatorCenter: false,
    hideMineCommunityCenter: false,
    hideMoreCustomerService: false,
    hideMoreListenVideo: false,
    hideMoreTeenProtection: false,
    hideMoreSettings: false
  };
  var MINE_TARGETS = {
    hideMineFirstVideo: {
      labels: ["发布你的第一个视频"],
      ids: [],
      uri: /(?:uper|upload|member\.bilibili|creative)/i,
      labelOnly: true
    },
    hideMineRewardPublish: {
      labels: ["有奖发布", "有奖活动"],
      ids: [174],
      uri: /(?:uper|upload|york|reward|activity|member\.bilibili)/i,
      labelOnly: false
    },
    hideMineCourse: {
      labels: ["我的课程"],
      ids: [400, 794],
      uri: /(?:cheese|course)/i,
      labelOnly: false
    },
    hideMineFreeData: {
      labels: ["看视频免流量"],
      ids: [401],
      uri: /(?:free[_/-]?traffic|user_center\/free_traffic|traffic)/i,
      labelOnly: false
    },
    hideMineWorkshop: {
      labels: ["工房", "工房集市"],
      ids: [],
      uri: /(?:workshop|mall-up_market|up_market|market\/show)/i,
      labelOnly: true
    },
    hideMineEnergy: {
      labels: ["能量加油站"],
      ids: [990],
      uri: /(?:306424|energy|blackboard)/i,
      labelOnly: false
    },
    hideMineBwPark: {
      labels: ["BW乐园"],
      ids: [],
      uri: /(?:\bbw\b|blackboard|activity)/i,
      labelOnly: true
    },
    hideMineBmoe: {
      labels: ["B萌投票"],
      ids: [],
      uri: /(?:bmoe|vote|blackboard|activity)/i,
      labelOnly: true
    },
    hideMinePersonalDress: {
      labels: ["个性装扮"],
      ids: [402],
      uri: /(?:h5\/mall\/home|garb|dress|pendant)/i,
      labelOnly: false
    },
    hideMineWallet: {
      labels: ["我的钱包"],
      ids: [404, 741],
      uri: /(?:bilipay\/mine_wallet|mine_wallet)/i,
      labelOnly: false
    },
    hideMineGameCenter: {
      labels: ["游戏中心"],
      ids: [403],
      uri: /game_center\/user/i,
      labelOnly: false
    },
    hideMineMallOrders: {
      labels: ["会员购订单", "会员购中心"],
      ids: [622],
      uri: /(?:bilibili:\/\/mall\/mine|mall\/mine)/i,
      labelOnly: false
    },
    hideMineLive: {
      labels: ["我的直播"],
      ids: [710],
      uri: /live-app-center/i,
      labelOnly: false
    },
    hideMinePromotion: {
      labels: ["必火推广"],
      ids: [],
      uri: /(?:cm|promotion|promote|commercial)/i,
      labelOnly: true
    },
    hideMineCreatorCenter: {
      labels: ["创作中心"],
      ids: [171, 544],
      uri: /(?:uper|upper)\/homevc/i,
      labelOnly: false
    },
    hideMineCommunityCenter: {
      labels: ["社区中心"],
      ids: [514],
      uri: /blackboard\/dynamic\/169422/i,
      labelOnly: false
    },
    hideMoreCustomerService: {
      labels: ["联系客服"],
      ids: [407],
      uri: /user_center\/feedback/i,
      labelOnly: false
    },
    hideMoreListenVideo: {
      labels: ["听视频"],
      ids: [812],
      uri: /bilibili:\/\/podcast/i,
      labelOnly: false
    },
    hideMoreTeenProtection: {
      labels: ["未成年人守护", "青少年守护"],
      ids: [964],
      uri: /h5\/teenagers\/home/i,
      labelOnly: false
    },
    hideMoreSettings: {
      labels: ["设置"],
      ids: [410],
      uri: /user_center\/setting/i,
      labelOnly: false
    }
  };
  var VIP_OVERLAY_KEYS = [
    "popup",
    "popups",
    "dialog",
    "dialogs",
    "floating_layer",
    "floating_layers",
    "floatingLayer",
    "floatingLayers",
    "marketing_popup",
    "marketing_popups",
    "marketingPopup",
    "marketingPopups",
    "marketing_dialog",
    "marketing_dialogs"
  ];
  var VIP_BANNER_KEYS = [
    "banners",
    "banner_list",
    "bannerList",
    "marketing_banners",
    "marketingBanners",
    "vip_banners",
    "vipBanners",
    "promotion_banners",
    "promotionBanners"
  ];
  var MINE_VIP_PROMOTION_KEYS = [
    "vip_section",
    "vip_section_v2",
    "modular_vip_section",
    "vipSection",
    "vipSectionV2",
    "modularVipSection"
  ];
  var MINE_UI_CONTAINER_KEYS = {
    action: true,
    banner: true,
    banner_info: true,
    bannerInfo: true,
    block_list: true,
    blockList: true,
    blocks: true,
    button: true,
    buttons: true,
    card_list: true,
    cardList: true,
    cards: true,
    children: true,
    common_op_item: true,
    commonOpItem: true,
    entries: true,
    group_list: true,
    groupList: true,
    groups: true,
    item: true,
    items: true,
    jump: true,
    list: true,
    menu_items: true,
    menuItems: true,
    module_list: true,
    moduleList: true,
    modules: true,
    more_sections: true,
    moreSections: true,
    navigation: true,
    rows: true,
    section: true,
    section_v2: true,
    sectionV2: true,
    section_list: true,
    sectionList: true,
    sections: true,
    sections_v2: true,
    service_list: true,
    serviceList: true,
    services: true
  };
  var MINE_MATCH_WRAPPER_KEYS = [
    "action",
    "common_op_item",
    "commonOpItem",
    "jump",
    "navigation"
  ];
  var VIEW_JSON_CONTAINER_KEYS = {
    cards: true,
    introduction: true,
    introduction_modules: true,
    introductionModules: true,
    introductions: true,
    items: true,
    module_list: true,
    moduleList: true,
    modules: true,
    relates: true,
    relates_feed: true,
    relatesFeed: true,
    tab: true,
    tab_modules: true,
    tabModules: true,
    tabs: true
  };
  var VIEW_JSON_AD_KEYS = {
    ad_info: true,
    ad_modules: true,
    adInfo: true,
    adModules: true,
    cm: true,
    cm_config: true,
    cm_ipad: true,
    cms: true,
    commercial_info: true,
    commercialInfo: true,
    player_ad: true,
    playerAd: true,
    under_player_ad: true,
    underPlayerAd: true
  };
  var MAX_GRPC_DECOMPRESSED_BYTES = 4 * 1024 * 1024;

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
      homeFeedVideoOnly: true,
      liveShopping: true,
      searchPromotions: true,
      ui: true,
      videoOnlyRecommendations: true,
      vipPromotions: true,
      valid: true
    };
    var parsed;
    var optionKey;

    for (optionKey in UI_OPTION_DEFAULTS) {
      if (hasOwn.call(UI_OPTION_DEFAULTS, optionKey)) {
        config[optionKey] = UI_OPTION_DEFAULTS[optionKey];
      }
    }

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
    config.homeFeedVideoOnly = parseBoolean(
      parsed.homeFeedVideoOnly,
      config.homeFeedVideoOnly
    );
    config.videoOnlyRecommendations = parseBoolean(
      parsed.videoOnlyRecommendations,
      config.videoOnlyRecommendations
    );
    config.ui = parseBoolean(parsed.ui, config.ui);
    config.searchPromotions = parseBoolean(
      parsed.searchPromotions,
      config.searchPromotions
    );
    config.liveShopping = parseBoolean(
      parsed.liveShopping,
      config.liveShopping
    );
    config.vipPromotions = parseBoolean(
      parsed.vipPromotions,
      config.vipPromotions
    );
    for (optionKey in UI_OPTION_DEFAULTS) {
      if (hasOwn.call(UI_OPTION_DEFAULTS, optionKey)) {
        config[optionKey] = parseBoolean(
          parsed[optionKey],
          config[optionKey]
        );
      }
    }
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

    if (
      (
        includes(APP_HOSTS, parsed.host) ||
        includes(API_HOSTS, parsed.host)
      ) &&
      (
        path === "/x/vip/ads/materials" ||
        path === "/x/vip/ads/material/report"
      )
    ) {
      return path === "/x/vip/ads/materials"
        ? "vip-materials"
        : "vip-material-report";
    }
    if (
      (
        includes(APP_HOSTS, parsed.host) ||
        includes(API_HOSTS, parsed.host)
      ) &&
      /^\/x\/resource\/(?:top\/activity|patch\/tab(?:\/v2)?)$/.test(
        path
      )
    ) {
      return "resource-promotion";
    }

    if (includes(APP_HOSTS, parsed.host)) {
      if (path === "/x/v2/splash/list") {
        return "splash-list";
      }
      if (path === "/x/v2/splash/show") {
        return "splash-show";
      }
      if (path === "/x/v2/splash/event/list2") {
        return "splash-event-list2";
      }
      if (path === "/x/v2/splash/brand/list") {
        return "splash-brand-list";
      }
      if (path === "/x/v2/feed/index") {
        return "feed";
      }
      if (path === "/x/v2/feed/index/story") {
        return "story";
      }
      if (path === "/x/v2/feed/index/story/cart") {
        return "story-cart";
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
      if (path === "/x/v2/account/myinfo") {
        return "myinfo-diagnostic";
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
      if (path === "/x/vip/web/vip_center/combine") {
        return "vip-center";
      }
      if (path === "/pgc/activity/deliver/material/receive") {
        return "pgc-activity-material";
      }
    }

    if (
      parsed.host === "api.live.bilibili.com" &&
      path === "/xlive/app-room/v1/index/getInfoByRoom"
    ) {
      return "live";
    }
    if (
      parsed.host === "api.live.bilibili.com" &&
      path ===
        "/xlive/e-commerce-interface/v1/ecommerce-user/get_shopping_info"
    ) {
      return "live-shopping-material";
    }
    if (
      parsed.host === "line3-h5-mobile-api.biligame.com" &&
      path === "/game/live/large_card_material"
    ) {
      return "game-live-material";
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
      case "/bilibili.app.view.v1.View/ViewProgress":
        return "grpc-view-v1-progress";
      case "/bilibili.app.view.v1.View/RelatesFeed":
        return "grpc-view-v1-relates";
      case "/bilibili.app.view.v1.View/TFInfo":
        return "grpc-view-v1-tfinfo";
      case "/bilibili.app.viewunite.v1.View/View":
        return "grpc-view-unite";
      case "/bilibili.app.viewunite.v1.View/ViewProgress":
        return "grpc-view-unite-progress";
      case "/bilibili.app.viewunite.v1.View/PlayPause":
        return "grpc-view-unite-play-pause";
      case "/bilibili.app.viewunite.v1.View/ViewEndPage":
        return "grpc-view-unite-end-page";
      case "/bilibili.app.viewunite.v1.View/RelatesFeed":
        return "grpc-view-unite-relates";
      case "/bilibili.app.mine.v1.Mine/PubModule":
        return "grpc-mine-pub-module";
      case "/bilibili.app.mine.v1.Mine/DeviceFeature":
        return "grpc-mine-device-feature";
      case "/bilibili.app.resource.v1.Module/List":
        return "grpc-resource-module-list";
      case "/bilibili.app.show.v1.Popular/Index":
        return "grpc-popular";
      case "/bilibili.app.dynamic.v2.Dynamic/DynAll":
        return "grpc-dynamic";
      case "/bilibili.polymer.app.search.v1.Search/SearchAll":
        return "grpc-search-all";
      case "/bilibili.polymer.app.search.v1.Search/SearchByType":
        return "grpc-search-by-type";
      case "/bilibili.main.community.reply.v1.Reply/MainList":
        return "grpc-reply";
      default:
        return "";
    }
  }

  function isPauseAdEndpoint(endpoint) {
    return endpoint === "grpc-view-unite-play-pause";
  }

  function grpcEndpointEnabled(endpoint, config) {
    if (!endpoint || !config) {
      return false;
    }
    if (isPauseAdEndpoint(endpoint)) {
      return config.ads !== false;
    }
    if (endpoint === "grpc-popular") {
      return (
        config.ads !== false ||
        config.homeFeedVideoOnly !== false
      );
    }
    if (endpoint === "grpc-mine-pub-module") {
      return Boolean(
        config.ui !== false &&
          (
            config.hideMineFirstVideo ||
            config.hideMineRewardPublish
          )
      );
    }
    if (endpoint === "grpc-mine-device-feature") {
      return Boolean(config.ui !== false || config.ads !== false);
    }
    if (endpoint === "grpc-resource-module-list") {
      return true;
    }
    if (
      endpoint === "grpc-view-v1" ||
      endpoint === "grpc-view-v1-relates" ||
      endpoint === "grpc-view-unite" ||
      endpoint === "grpc-view-unite-relates"
    ) {
      return (
        config.ads !== false ||
        config.videoOnlyRecommendations !== false
      );
    }
    return config.ads !== false;
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

  function hasMarkerValue(value) {
    if (
      value === null ||
      value === undefined ||
      value === false ||
      value === 0 ||
      value === ""
    ) {
      return false;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return true;
  }

  function knownLabelText(value, depth) {
    var keys = [
      "content",
      "desc",
      "label",
      "name",
      "text",
      "title",
      "value"
    ];
    var parts = [];
    var index;
    var nested;
    if (depth > 3 || value === null || value === undefined) {
      return "";
    }
    if (typeof value === "string" || typeof value === "number") {
      return normalizeLabel(String(value));
    }
    if (Array.isArray(value)) {
      for (index = 0; index < value.length; index += 1) {
        nested = knownLabelText(value[index], depth + 1);
        if (nested) {
          parts.push(nested);
        }
      }
      return parts.join("|");
    }
    if (!isPlainObject(value)) {
      return "";
    }
    for (index = 0; index < keys.length; index += 1) {
      if (hasOwn.call(value, keys[index])) {
        nested = knownLabelText(value[keys[index]], depth + 1);
        if (nested) {
          parts.push(nested);
        }
      }
    }
    return parts.join("|");
  }

  function explicitCommercialLabel(item) {
    var keys = [
      "ad_tag",
      "ad_label",
      "badge",
      "badge_info",
      "badge_text",
      "corner_mark",
      "rcmd_reason",
      "rcmd_reason_style",
      "reason",
      "source_name"
    ];
    var index;
    var value;
    if (!isPlainObject(item)) {
      return false;
    }
    for (index = 0; index < keys.length; index += 1) {
      value = knownLabelText(item[keys[index]], 0);
      if (
        /(?:广告|必火推广|必火推荐|小火箭|商业推广)/.test(value)
      ) {
        return true;
      }
    }
    return false;
  }

  function hasExplicitAdMarker(item) {
    var adInfo;
    var markerKeys = [
      "ad_cb",
      "creative_id",
      "creativeId",
      "creative_ids",
      "creativeIds",
      "ad_id",
      "adId",
      "adver_id",
      "adverId",
      "ad_source",
      "adSource",
      "cm_mark",
      "cmMark",
      "commercial_id",
      "commercialId",
      "commercial_mark",
      "commercialMark",
      "ad_data",
      "adData",
      "ad_type",
      "adType",
      "cm_info",
      "cmInfo",
      "card_business_badge",
      "cardBusinessBadge",
      "commercial_button",
      "commercialButton",
      "business_info",
      "businessInfo"
    ];
    var index;
    if (!isPlainObject(item)) {
      return false;
    }
    if (
      item.is_ad === true ||
      item.is_ad === 1 ||
      item.is_commercial === true ||
      item.is_commercial === 1
    ) {
      return true;
    }
    if (item.goto === "ad" || item.type === "ad") {
      return true;
    }
    if (
      item.goto === "cm" ||
      item.card_goto === "cm" ||
      /^ad(?:_|$)/i.test(String(item.card_goto || ""))
    ) {
      return true;
    }
    for (index = 0; index < markerKeys.length; index += 1) {
      if (
        hasOwn.call(item, markerKeys[index]) &&
        hasMarkerValue(item[markerKeys[index]])
      ) {
        return true;
      }
    }
    if (
      hasOwn.call(item, "cm") &&
      hasMarkerValue(item.cm)
    ) {
      return true;
    }
    if (hasOwn.call(item, "ad_info")) {
      adInfo = item.ad_info;
      if (hasMarkerValue(adInfo)) {
        return true;
      }
    }
    if (
      hasOwn.call(item, "adInfo") &&
      hasMarkerValue(item.adInfo)
    ) {
      return true;
    }
    return (
      isFeedAdCard(item) ||
      explicitCommercialLabel(item) ||
      hasNestedCommercialEvidence(item, 0)
    );
  }

  function hasCommercialTracking(item) {
    var keys = [
      "track_id",
      "trackId",
      "track_params",
      "trackParams",
      "show_url",
      "showUrl",
      "click_url",
      "clickUrl",
      "exposure_url",
      "exposureUrl"
    ];
    var index;
    if (!isPlainObject(item)) {
      return false;
    }
    for (index = 0; index < keys.length; index += 1) {
      if (
        hasOwn.call(item, keys[index]) &&
        hasMarkerValue(item[keys[index]])
      ) {
        return true;
      }
    }
    return false;
  }

  function hasNestedCommercialEvidence(item, depth) {
    var keys = [
      "ad",
      "ad_data",
      "adData",
      "ad_info",
      "adInfo",
      "cm",
      "cm_info",
      "cmInfo",
      "commercial",
      "commercial_button",
      "commercialButton",
      "commercial_info",
      "commercialInfo",
      "card_business_badge",
      "cardBusinessBadge",
      "creative",
      "creative_info",
      "creativeInfo",
      "tracking",
      "tracking_info",
      "trackingInfo"
    ];
    var index;
    var nested;
    if (!isPlainObject(item) || depth > 3) {
      return false;
    }
    for (index = 0; index < keys.length; index += 1) {
      if (!hasOwn.call(item, keys[index])) {
        continue;
      }
      nested = item[keys[index]];
      if (!hasMarkerValue(nested)) {
        continue;
      }
      if (
        keys[index] === "ad" ||
        keys[index] === "ad_data" ||
        keys[index] === "adData" ||
        keys[index] === "ad_info" ||
        keys[index] === "adInfo" ||
        keys[index] === "cm" ||
        keys[index] === "cm_info" ||
        keys[index] === "cmInfo" ||
        keys[index] === "card_business_badge" ||
        keys[index] === "cardBusinessBadge"
      ) {
        return true;
      }
      if (
        isPlainObject(nested) &&
        (
          nested.is_ad === true ||
          nested.is_ad === 1 ||
          hasAnyMarker(
            nested,
            [
              "ad_id",
              "adId",
              "creative_id",
              "creativeId",
              "commercial_id",
              "commercialId",
              "show_url",
              "showUrl",
              "click_url",
              "clickUrl",
              "exposure_url",
              "exposureUrl"
            ]
          )
        )
      ) {
        return true;
      }
      if (
        isPlainObject(nested) &&
        hasNestedCommercialEvidence(nested, depth + 1)
      ) {
        return true;
      }
    }
    return false;
  }

  function hasCommercialAction(item) {
    var button;
    var text;
    var link;
    if (!isPlainObject(item)) {
      return false;
    }
    button = isPlainObject(item.button)
      ? item.button
      : isPlainObject(item.desc_button)
        ? item.desc_button
        : null;
    text = button
      ? normalizeLabel(
          button.text ||
          button.title ||
          button.name ||
          button.desc
        )
      : "";
    link = objectLink(item);
    return (
      /^(?:下载|立即下载|购买|立即购买|领取|立即领取|打开|去看看)$/.test(
        text
      ) ||
      isCommercialUri(link)
    );
  }

  function isHighConfidencePromotion(item) {
    var businessType;
    if (!isPlainObject(item)) {
      return false;
    }
    if (hasExplicitAdMarker(item)) {
      return true;
    }
    businessType = String(
      item.business_type ||
      item.businessType ||
      item.biz_type ||
      item.bizType ||
      item.source_type ||
      ""
    );
    if (
      /^(?:ad|cm|commercial|promotion|promote|game_ad)$/i.test(
        businessType
      )
    ) {
      return true;
    }
    return hasCommercialTracking(item) && hasCommercialAction(item);
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

  function emptySplashData(endpoint) {
    var data = {};
    if (endpoint === "splash-list") {
      data.account = null;
      data.event_list = [];
      data.list = [];
      data.preload = [];
      data.show = [];
    } else if (endpoint === "splash-show") {
      data.account = null;
      data.preload = [];
      data.show = [];
    } else if (endpoint === "splash-event-list2") {
      data.event_list = [];
      data.list = [];
      data.preload = [];
    } else if (endpoint === "splash-brand-list") {
      data.account = null;
      data.brand_list = [];
      data.list = [];
      data.preload = [];
      data.splash_list = [];
    }
    return data;
  }

  function clearPresentSplashState(data) {
    var emptyArrayKeys = [
      "client_keep_ids",
      "creative_keep_ids",
      "keep_ids",
      "loaded_creative_list",
      "query_list"
    ];
    var emptyStringKeys = [
      "new_splash_hash",
      "show_hash"
    ];
    var changes = 0;
    var index;
    var key;
    for (index = 0; index < emptyArrayKeys.length; index += 1) {
      key = emptyArrayKeys[index];
      if (
        hasOwn.call(data, key) &&
        (
          !Array.isArray(data[key]) ||
          data[key].length > 0
        )
      ) {
        data[key] = [];
        changes += 1;
      }
    }
    for (index = 0; index < emptyStringKeys.length; index += 1) {
      key = emptyStringKeys[index];
      if (
        hasOwn.call(data, key) &&
        data[key] !== ""
      ) {
        data[key] = "";
        changes += 1;
      }
    }
    return changes;
  }

  function applyKnownJsonFields(target, replacement) {
    var keys;
    var index;
    var key;
    var changes = 0;
    if (!isPlainObject(target) || !isPlainObject(replacement)) {
      return 0;
    }
    keys = Object.keys(replacement);
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      if (
        JSON.stringify(target[key]) !==
        JSON.stringify(replacement[key])
      ) {
        target[key] = replacement[key];
        changes += 1;
      }
    }
    return changes;
  }

  function handleSplash(body, endpoint) {
    var changes = 0;
    if (!isPlainObject(body.data)) {
      return 0;
    }
    changes += applyKnownJsonFields(body, {
      code: 0,
      message: "0",
      ttl: 1
    });
    changes += applyKnownJsonFields(
      body.data,
      emptySplashData(endpoint)
    );
    changes += clearPresentSplashState(body.data);
    return changes > 0 ? 1 : 0;
  }

  function handleFeed(body, config) {
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
      if (isHighConfidencePromotion(item)) {
        changes += 1;
        continue;
      }
      if (config.homeFeedVideoOnly !== false) {
        if (
          !isPlainHomeFeedVideo(item) ||
          kept.length >= HOME_FEED_VIDEO_LIMIT
        ) {
          changes += 1;
          continue;
        }
        kept.push(item);
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
            return (
              isPlainObject(banner) &&
              (
                banner.type === "ad" ||
                isHighConfidencePromotion(banner)
              )
            );
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

  function feedItemIdentities(item) {
    var playerArgs;
    var value;
    var keys = ["bvid", "aid", "avid", "cid", "param"];
    var output = [];
    var index;
    if (!isPlainObject(item)) {
      return output;
    }
    for (index = 0; index < keys.length; index += 1) {
      value = item[keys[index]];
      if (
        (typeof value === "string" || typeof value === "number") &&
        String(value).trim()
      ) {
        output.push(keys[index] + ":" + String(value).trim());
      }
    }
    playerArgs = isPlainObject(item.player_args)
      ? item.player_args
      : isPlainObject(item.playerArgs)
        ? item.playerArgs
        : null;
    if (playerArgs) {
      for (index = 0; index < keys.length; index += 1) {
        value = playerArgs[keys[index]];
        if (
        (typeof value === "string" || typeof value === "number") &&
        String(value).trim()
      ) {
          output.push(
            "player:" + keys[index] + ":" + String(value).trim()
          );
        }
      }
    }
    value = objectLink(item);
    if (value) {
      output.push("uri:" + value);
    }
    return output;
  }

  function feedItemIdentity(item) {
    var identities = feedItemIdentities(item);
    return identities.length > 0 ? identities[0] : "";
  }

  function markFeedIdentities(seen, item) {
    var identities = feedItemIdentities(item);
    var index;
    for (index = 0; index < identities.length; index += 1) {
      seen[identities[index]] = true;
    }
  }

  function hasSeenFeedIdentity(seen, item) {
    var identities = feedItemIdentities(item);
    var index;
    if (identities.length === 0) {
      return true;
    }
    for (index = 0; index < identities.length; index += 1) {
      if (seen[identities[index]]) {
        return true;
      }
    }
    return false;
  }

  function filteredFeedLength(result) {
    var parsed;
    try {
      parsed = JSON.parse(result && result.body);
    } catch (error) {
      return -1;
    }
    return (
      isPlainObject(parsed) &&
      isPlainObject(parsed.data) &&
      Array.isArray(parsed.data.items)
    )
      ? parsed.data.items.length
      : -1;
  }

  function mergeFilteredFeedResults(primaryResult, refillResult) {
    var primary;
    var refill;
    var seen = {};
    var items;
    var source;
    var index;
    var appended = 0;

    if (
      !primaryResult ||
      !primaryResult.valid ||
      !refillResult ||
      !refillResult.valid
    ) {
      return primaryResult;
    }
    try {
      primary = JSON.parse(primaryResult.body);
      refill = JSON.parse(refillResult.body);
    } catch (error) {
      return primaryResult;
    }
    if (
      !isPlainObject(primary.data) ||
      !Array.isArray(primary.data.items) ||
      !isPlainObject(refill.data) ||
      !Array.isArray(refill.data.items)
    ) {
      return primaryResult;
    }
    items = primary.data.items;
    source = refill.data.items;
    for (index = 0; index < items.length; index += 1) {
      markFeedIdentities(seen, items[index]);
    }
    for (
      index = 0;
      index < source.length && items.length < HOME_FEED_VIDEO_LIMIT;
      index += 1
    ) {
      if (!isPlainHomeFeedVideo(source[index])) {
        continue;
      }
      if (hasSeenFeedIdentity(seen, source[index])) {
        continue;
      }
      markFeedIdentities(seen, source[index]);
      items.push(source[index]);
      appended += 1;
    }
    if (appended === 0) {
      return primaryResult;
    }
    return {
      arrayCounts: ["items:" + items.length],
      body: JSON.stringify(primary),
      changed: primaryResult.changed + appended,
      endpoint: primaryResult.endpoint,
      hitType: primaryResult.hitType || "feed-filter",
      reason:
        items.length === HOME_FEED_VIDEO_LIMIT
          ? "changed-refilled-six"
          : "changed-refill-partial",
      topKeys: primaryResult.topKeys || [],
      valid: true
    };
  }

  function hasUnavailableVideoState(item) {
    var nodes;
    var index;
    var node;
    var state;
    if (!isPlainObject(item)) {
      return false;
    }
    if (
      item.is_deleted === true ||
      item.is_deleted === 1 ||
      item.deleted === true ||
      item.deleted === 1 ||
      item.is_available === false ||
      item.is_available === 0 ||
      item.available === false ||
      item.available === 0
    ) {
      return true;
    }
    nodes = [
      item,
      item.archive,
      item.basic,
      item.video,
      item.player_args,
      item.playerArgs
    ];
    for (index = 0; index < nodes.length; index += 1) {
      node = nodes[index];
      if (!isPlainObject(node) || !hasOwn.call(node, "state")) {
        continue;
      }
      state = Number(node.state);
      if (Number.isFinite(state) && state < 0) {
        return true;
      }
    }
    return false;
  }

  function isPlainStoryVideo(item) {
    return Boolean(
      isPlainObject(item) &&
      String(item.card_goto || "").toLowerCase() === "vertical_av" &&
      !hasUnavailableVideoState(item) &&
      !isHighConfidencePromotion(item) &&
      !hasCommercialAction(item) &&
      isPlainVideoRecommendation(item) &&
      hasOrdinaryVideoIdentity(item)
    );
  }

  function handleStory(body, config) {
    if (!isPlainObject(body.data)) {
      return 0;
    }
    return replaceFilteredArray(body.data, "items", function (item) {
      if (!isPlainObject(item)) {
        return false;
      }
      return (
        isHighConfidencePromotion(item) ||
        includes(STORY_AD_TYPES, String(item.card_goto || "")) ||
        (
          config.homeFeedVideoOnly !== false &&
          !isPlainStoryVideo(item)
        )
      );
    });
  }

  function shouldRemoveCommercialUiItem(item, includeCommercialLinks) {
    return Boolean(
      isPlainObject(item) &&
      (
        isHighConfidencePromotion(item) ||
        (
          includeCommercialLinks &&
          isCommercialUri(objectLink(item))
        )
      )
    );
  }

  function filterKnownCommercialUiContainers(
    node,
    depth,
    includeCommercialLinks
  ) {
    var containerKeys = {
      banners: true,
      cards: true,
      items: true,
      list: true,
      modules: true,
      popups: true,
      widgets: true
    };
    var keys;
    var index;
    var key;
    var value;
    var changes = 0;
    if (!isPlainObject(node) || depth > 6) {
      return 0;
    }
    keys = Object.keys(node);
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      if (!containerKeys[key]) {
        continue;
      }
      value = node[key];
      if (Array.isArray(value)) {
        changes += replaceFilteredArray(node, key, function (item) {
          return shouldRemoveCommercialUiItem(
            item,
            includeCommercialLinks
          );
        });
        node[key].forEach(function (item) {
          if (isPlainObject(item)) {
            changes += filterKnownCommercialUiContainers(
              item,
              depth + 1,
              includeCommercialLinks
            );
          }
        });
      } else if (isPlainObject(value)) {
        if (
          shouldRemoveCommercialUiItem(
            value,
            includeCommercialLinks
          )
        ) {
          delete node[key];
          changes += 1;
        } else {
          changes += filterKnownCommercialUiContainers(
            value,
            depth + 1,
            includeCommercialLinks
          );
        }
      }
    }
    return changes;
  }

  function deleteKnownCommercialPayloads(node) {
    var keys = [
      "ad",
      "ad_data",
      "adData",
      "ad_info",
      "adInfo",
      "cm",
      "cm_info",
      "cmInfo",
      "commercial",
      "commercial_info",
      "commercialInfo",
      "creative",
      "creative_info",
      "creativeInfo",
      "promotion"
    ];
    var index;
    var changes = 0;
    if (!isPlainObject(node)) {
      return 0;
    }
    for (index = 0; index < keys.length; index += 1) {
      if (
        hasOwn.call(node, keys[index]) &&
        hasMarkerValue(node[keys[index]])
      ) {
        delete node[keys[index]];
        changes += 1;
      }
    }
    return changes;
  }

  function handleStoryCart(body) {
    var data = isPlainObject(body.data) ? body.data : null;
    var changes = 0;
    if (!data) {
      return 0;
    }
    changes += deleteKnownCommercialPayloads(data);
    changes += filterKnownCommercialUiContainers(data, 0, true);
    return changes;
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
      changes += replaceFilteredArray(
        body,
        "data",
        isHighConfidencePromotion
      );
    }
    return changes;
  }

  function isSearchPromotion(item) {
    var directKeys = [
      "ad",
      "ad_info",
      "adInfo",
      "banner",
      "cm",
      "game",
      "purchase",
      "promotion",
      "top_game",
      "topGame"
    ];
    var marker;
    var index;
    if (!isPlainObject(item)) {
      return false;
    }
    if (isHighConfidencePromotion(item)) {
      return true;
    }
    for (index = 0; index < directKeys.length; index += 1) {
      if (
        hasOwn.call(item, directKeys[index]) &&
        hasMarkerValue(item[directKeys[index]])
      ) {
        return true;
      }
    }
    marker = recommendationMarker(
      item,
      ["goto", "card_goto", "type", "card_type", "card_type_en"]
    );
    return (
      /(?:^|\|)(?:ad|banner|cm|commercial|game_ad|purchase|promotion|top_game)(?:\||$)/i.test(
        marker
      ) ||
      hasMarkerValue(item.card_business_badge) ||
      hasMarkerValue(item.cardBusinessBadge) ||
      isCommercialUri(objectLink(item))
    );
  }

  function filterSearchArray(parent, key) {
    return replaceFilteredArray(
      parent,
      key,
      isSearchPromotion
    );
  }

  function handleSearchResults(body) {
    var changes = 0;
    var data = body.data;
    if (Array.isArray(data)) {
      return replaceFilteredArray(
        body,
        "data",
        isSearchPromotion
      );
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
        id === 222 ||
        tabId === "游戏中心Top" ||
        /^bilibili:\/\/game_center\/home\/?$/i.test(uri) ||
        name === "游戏中心"
      );
    }
    if (target === "journey") {
      return (
        id === 136117 ||
        tabId === "165" ||
        /\/136117(?:[/?#]|$)/.test(uri) ||
        name === "新征程"
      );
    }
    if (target === "publish") {
      return (
        id === 670 ||
        tabId === "publish" ||
        /^bilibili:\/\/uper\/center_plus(?:[/?#]|$)/i.test(uri) ||
        name === "发布"
      );
    }
    if (target === "mall") {
      return (
        id === 242 ||
        tabId === "会员购Bottom" ||
        /^bilibili:\/\/mall\/home\/?$/i.test(uri) ||
        name === "会员购"
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

  function handleNavigation(body, config) {
    var data = body.data;
    var changes = 0;
    if (!isPlainObject(data)) {
      return 0;
    }
    if (config.hideHomeGame) {
      changes += filterNavigation(data, "top", "game");
    }
    if (config.hideHomeJourney) {
      changes += filterNavigation(data, "tab", "journey");
    }
    if (config.hideBottomPublish) {
      changes += filterNavigation(data, "bottom", "publish");
    }
    if (config.hideBottomMall) {
      changes += filterNavigation(data, "bottom", "mall");
    }
    return changes;
  }

  function mineObjectIds(item) {
    var keys = [
      "id",
      "item_id",
      "itemId",
      "module_id",
      "moduleId",
      "tab_id",
      "tabId"
    ];
    var output = [];
    var index;
    var value;
    if (!isPlainObject(item)) {
      return output;
    }
    for (index = 0; index < keys.length; index += 1) {
      value = Number(item[keys[index]]);
      if (Number.isFinite(value) && !includes(output, value)) {
        output.push(value);
      }
    }
    return output;
  }

  function mineMatchCandidates(item) {
    var output = [];
    var index;
    var nested;
    if (!isPlainObject(item)) {
      return output;
    }
    output.push(item);
    for (index = 0; index < MINE_MATCH_WRAPPER_KEYS.length; index += 1) {
      nested = item[MINE_MATCH_WRAPPER_KEYS[index]];
      if (isPlainObject(nested) && !includes(output, nested)) {
        output.push(nested);
      }
    }
    return output;
  }

  function matchesMineTargetDirect(item, optionKey) {
    var labels = objectLabels(item);
    var link = objectLink(item);
    var ids = mineObjectIds(item);
    var target = MINE_TARGETS[optionKey];
    var index;
    var targetIndex;
    var labelMatched = false;
    if (!isPlainObject(item)) {
      return false;
    }
    if (!target) {
      return false;
    }
    for (index = 0; index < ids.length; index += 1) {
      if (includes(target.ids, ids[index])) {
        return true;
      }
    }
    if (link && target.uri.test(link)) {
      return true;
    }
    for (index = 0; index < labels.length; index += 1) {
      for (
        targetIndex = 0;
        targetIndex < target.labels.length;
        targetIndex += 1
      ) {
        if (
          labels[index] ===
          normalizeLabel(target.labels[targetIndex])
        ) {
          labelMatched = true;
          break;
        }
      }
      if (labelMatched) {
        break;
      }
    }
    return labelMatched;
  }

  function matchesMineTarget(item, optionKey) {
    var candidates = mineMatchCandidates(item);
    var index;
    for (index = 0; index < candidates.length; index += 1) {
      if (matchesMineTargetDirect(candidates[index], optionKey)) {
        return true;
      }
    }
    return false;
  }

  function configuredMineTarget(item, config) {
    var optionKey;
    if (!config.ui) {
      return "";
    }
    for (optionKey in MINE_TARGETS) {
      if (
        hasOwn.call(MINE_TARGETS, optionKey) &&
        config[optionKey] === true &&
        matchesMineTarget(item, optionKey)
      ) {
        return optionKey;
      }
    }
    return "";
  }

  function hasBannerVisual(item) {
    var keys = [
      "image",
      "image_url",
      "imageUrl",
      "banner",
      "background",
      "background_image",
      "backgroundImage"
    ];
    var index;
    if (!isPlainObject(item)) {
      return false;
    }
    for (index = 0; index < keys.length; index += 1) {
      if (
        hasOwn.call(item, keys[index]) &&
        hasMarkerValue(item[keys[index]])
      ) {
        return true;
      }
    }
    return false;
  }

  function isMineMarketingBanner(item, contextKey) {
    var labels;
    var link;
    var type;
    var marketingLabel;
    var bannerContext;
    if (!isPlainObject(item)) {
      return false;
    }
    labels = objectLabels(item).join("|");
    link = objectLink(item);
    type = String(
      item.module_type ||
      item.moduleType ||
      item.business_type ||
      item.businessType ||
      item.type ||
      item.style ||
      ""
    );
    marketingLabel =
      /(?:大会员|会员中心).*(?:特惠|优惠|券包|年卡|折扣|促销|营销|活动)|会员中心营销横幅/.test(
        labels
      );
    bannerContext =
      /(?:^|[_-])(?:marketing|promotion|campaign|activity|vip|member)(?:[_-])?banner(?:s)?(?:$|[_-])/i.test(
        String(contextKey || "")
      ) ||
      /^(?:marketing|promotion|activity|vip|member)[_-]?banner$/i.test(
        type
      );
    return (
      hasExplicitAdMarker(item) ||
      (
        marketingLabel &&
        (
          bannerContext ||
          (
            /(?:vip|member|summer|blackboard|activity|promotion|coupon|account\/big)/i.test(
              link
            ) &&
            (
              hasBannerVisual(item) ||
              /(?:banner|marketing|promotion|activity)/i.test(type)
            )
          )
        )
      ) ||
      (
        bannerContext &&
        hasBannerVisual(item) &&
        /(?:vip|member|big[_-]?point|coupon|privilege|promotion|blackboard\/activity|account\/big)/i.test(
          link
        )
      )
    );
  }

  function shouldRemoveMineItem(item, config, contextKey) {
    var candidates = mineMatchCandidates(item);
    var index;
    if (config.ads && config.vipPromotions) {
      for (index = 0; index < candidates.length; index += 1) {
        if (isMineMarketingBanner(candidates[index], contextKey)) {
          return true;
        }
      }
    }
    return Boolean(
      config.ui && configuredMineTarget(item, config)
    );
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

  function filterMineNode(node, depth, config, contextKey) {
    var changes = 0;
    var kept;
    var index;
    var value;
    var keys;
    var key;

    if (!isObject(node) || depth > 10) {
      return 0;
    }
    if (Array.isArray(node)) {
      kept = [];
      for (index = 0; index < node.length; index += 1) {
        value = node[index];
        if (shouldRemoveMineItem(value, config, contextKey)) {
          changes += 1;
          continue;
        }
        changes += filterMineNode(
          value,
          depth + 1,
          config,
          contextKey
        );
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
      if (
        config.ads &&
        config.vipPromotions &&
        includes(MINE_VIP_PROMOTION_KEYS, key)
      ) {
        delete node[key];
        changes += 1;
        continue;
      }
      if (
        (
          MINE_UI_CONTAINER_KEYS[key] ||
          includes(VIP_BANNER_KEYS, key) ||
          /^(?:marketing|promotion|activity|vip|member)[_-]?banner(?:s)?$/i.test(
            key
          )
        ) &&
        shouldRemoveMineItem(value, config, key)
      ) {
        delete node[key];
        changes += 1;
        continue;
      }
      if (
        MINE_UI_CONTAINER_KEYS[key] ||
        includes(VIP_BANNER_KEYS, key) ||
        /^(?:marketing|promotion|activity|vip|member)[_-]?banner(?:s)?$/i.test(
          key
        )
      ) {
        changes += filterMineNode(value, depth + 1, config, key);
      }
    }
    return changes;
  }

  function handleMine(body, config) {
    return isPlainObject(body.data)
      ? filterMineNode(body.data, 0, config, "")
      : 0;
  }

  function handleVipMaterials(body, config) {
    if (
      !config.ads ||
      !config.vipPromotions ||
      !isPlainObject(body.data)
    ) {
      return 0;
    }
    var changes = applyKnownJsonFields(body, {
      code: 0,
      message: "0",
      ttl: 1
    });
    changes += applyKnownJsonFields(body.data, {
      list: [],
      list_v2: [],
      materials: [],
      vip_login_coupon: {
        exp: false,
        login_layer: null,
        report: {}
      }
    });
    return changes > 0 ? 1 : 0;
  }

  function handleVipMaterialReport(body, config) {
    if (!config.ads || !config.vipPromotions) {
      return 0;
    }
    return applyKnownJsonFields(body, {
      code: 0,
      message: "0",
      ttl: 1
    }) > 0
      ? 1
      : 0;
  }

  function replaceRootObject(body, replacement) {
    var keys;
    var replacementKeys;
    var index;
    if (!isPlainObject(body) || !isPlainObject(replacement)) {
      return 0;
    }
    if (JSON.stringify(body) === JSON.stringify(replacement)) {
      return 0;
    }
    keys = Object.keys(body);
    for (index = 0; index < keys.length; index += 1) {
      delete body[keys[index]];
    }
    replacementKeys = Object.keys(replacement);
    for (index = 0; index < replacementKeys.length; index += 1) {
      body[replacementKeys[index]] = replacement[replacementKeys[index]];
    }
    return 1;
  }

  function handleDedicatedPromotion(body, endpoint, config) {
    if (endpoint === "live-shopping-material") {
      return config.liveShopping
        ? replaceRootObject(body, {})
        : 0;
    }
    if (!config.ads) {
      return 0;
    }
    if (endpoint === "resource-promotion") {
      return replaceRootObject(body, {
        code: -404,
        data: null,
        message: "-404",
        ttl: 1
      });
    }
    if (endpoint === "game-live-material") {
      return replaceRootObject(body, {
        code: 0,
        message: "success"
      });
    }
    if (endpoint === "pgc-activity-material") {
      return replaceRootObject(body, {
        code: 0,
        data: {
          closeType: "close_win",
          container: [],
          showTime: ""
        },
        message: "success"
      });
    }
    return 0;
  }

  function vipOverlayHasMarketingMarker(value) {
    var index;
    if (Array.isArray(value)) {
      for (index = 0; index < value.length; index += 1) {
        if (vipOverlayHasMarketingMarker(value[index])) {
          return true;
        }
      }
      return false;
    }
    if (!isPlainObject(value)) {
      return false;
    }
    return (
      isHighConfidencePromotion(value) ||
      isMineMarketingBanner(value)
    );
  }

  function handleVipCenter(body, config) {
    var data = body.data;
    var changes = 0;
    var index;
    var key;
    if (
      !config.ads ||
      !config.vipPromotions ||
      !isPlainObject(data)
    ) {
      return 0;
    }
    for (index = 0; index < VIP_BANNER_KEYS.length; index += 1) {
      key = VIP_BANNER_KEYS[index];
      if (Array.isArray(data[key]) && data[key].length > 0) {
        data[key] = [];
        changes += 1;
      }
    }
    for (index = 0; index < VIP_OVERLAY_KEYS.length; index += 1) {
      key = VIP_OVERLAY_KEYS[index];
      if (
        hasOwn.call(data, key) &&
        (
          /^marketing/i.test(key) ||
          vipOverlayHasMarketingMarker(data[key])
        )
      ) {
        delete data[key];
        changes += 1;
      }
    }
    return changes;
  }

  function hasAnyMarker(item, keys) {
    var index;
    if (!isPlainObject(item)) {
      return false;
    }
    for (index = 0; index < keys.length; index += 1) {
      if (
        hasOwn.call(item, keys[index]) &&
        hasMarkerValue(item[keys[index]])
      ) {
        return true;
      }
    }
    return false;
  }

  function recommendationMarker(item, keys) {
    var values = [];
    var index;
    var value;
    if (!isPlainObject(item)) {
      return "";
    }
    for (index = 0; index < keys.length; index += 1) {
      value = item[keys[index]];
      if (typeof value === "string" || typeof value === "number") {
        values.push(String(value).toLowerCase().trim());
      }
    }
    return values.join("|");
  }

  function recommendationLabels(item) {
    var keys = [
      "badge",
      "badge_info",
      "badge_text",
      "card_type",
      "card_type_en",
      "corner_mark",
      "new_ep",
      "rcmd_reason",
      "rcmd_reason_style",
      "reason",
      "style"
    ];
    var labels = [];
    var index;
    var label;
    if (!isPlainObject(item)) {
      return "";
    }
    for (index = 0; index < keys.length; index += 1) {
      label = knownLabelText(item[keys[index]], 0);
      if (label) {
        labels.push(label);
      }
    }
    return labels.join("|");
  }

  function isPlainVideoRecommendation(item) {
    var marker;
    var labels;
    var uri;
    var playerType;
    var explicitAv;
    if (!isPlainObject(item)) {
      return false;
    }
    if (
      isHighConfidencePromotion(item) ||
      hasCommercialAction(item)
    ) {
      return false;
    }

    marker = recommendationMarker(
      item,
      ["goto", "card_goto", "type", "card_type", "card_type_en"]
    );
    if (
      /(?:^|\|)(?:ad|cm|ogv|pgc|bangumi|bangumi_av|bangumi_ugc|season|episode|live|game|resource|course|cheese|special|article|comic|audio|activity|banner|movie|tv|documentary|variety)(?:\||$)/i.test(
        marker
      )
    ) {
      return false;
    }

    if (
      hasAnyMarker(
        item,
        [
          "season_id",
          "seasonId",
          "ep_id",
          "epId",
          "epid",
          "season_type",
          "seasonType",
          "new_ep",
          "newEp",
          "pgc_info",
          "pgcInfo",
          "ogv_info",
          "ogvInfo",
          "live_info",
          "liveInfo",
          "room_id",
          "roomId",
          "game_info",
          "gameInfo",
          "resource_id",
          "resourceId",
          "course_id",
          "courseId"
        ]
      )
    ) {
      return false;
    }

    labels = recommendationLabels(item);
    if (
      /(?:纪录片|综艺|番剧|国创|电影|电视剧|影视|直播|游戏|课程|课堂|专栏|文章|漫画|音频|播单|活动|广告|必火推荐|必火推广|documentary|variety|bangumi|ogv|pgc|live|game|course|cheese|special|article|comic|audio|activity)/i.test(
        labels
      )
    ) {
      return false;
    }

    explicitAv =
      includes(
        ["av", "video", "vertical_av"],
        String(item.goto || "").toLowerCase()
      ) ||
      includes(
        ["av", "video", "vertical_av"],
        String(item.card_goto || "").toLowerCase()
      ) ||
      includes(
        ["av", "video", "vertical_av"],
        String(item.type || "").toLowerCase()
      );
    playerType =
      isPlainObject(item.player_args) &&
      (
        typeof item.player_args.type === "string" ||
        typeof item.player_args.type === "number"
      )
        ? String(item.player_args.type).toLowerCase()
        : "";
    if (
      playerType &&
      playerType !== "av" &&
      playerType !== "video"
    ) {
      return false;
    }
    uri = objectLink(item);
    if (
      /^(?:bilibili:\/\/(?:live|bangumi|pgc|season|ep|game|cheese|course|article|read|comic|audio|activity|mall)(?:[/?#]|$)|https?:\/\/(?:www\.)?bilibili\.com\/(?:bangumi|cheese|read|comic|audio|blackboard|festival)(?:[/?#]|$)|https?:\/\/live\.bilibili\.com(?:[/?#]|$))/i.test(
        uri
      )
    ) {
      return false;
    }
    if (explicitAv) {
      return true;
    }
    if (playerType === "av" || playerType === "video") {
      return true;
    }
    if (
      /^(?:bilibili:\/\/video\/|https?:\/\/(?:www\.)?bilibili\.com\/video\/)/i.test(
        uri
      )
    ) {
      return true;
    }
    return false;
  }

  function hasOrdinaryVideoIdentity(item) {
    var playerArgs;
    var param;
    var uri;
    if (!isPlainObject(item)) {
      return false;
    }
    uri = objectLink(item);
    if (
      /^(?:bilibili:\/\/video\/|https?:\/\/(?:www\.)?bilibili\.com\/video\/)/i.test(
        uri
      )
    ) {
      return true;
    }
    if (
      hasAnyMarker(item, ["aid", "avid", "bvid", "cid"])
    ) {
      return true;
    }
    param = String(item.param || "").trim();
    if (/^(?:\d+|BV[0-9A-Za-z]+)$/.test(param)) {
      return true;
    }
    playerArgs = isPlainObject(item.player_args)
      ? item.player_args
      : isPlainObject(item.playerArgs)
        ? item.playerArgs
        : null;
    return (
      isPlainObject(playerArgs) &&
      hasAnyMarker(playerArgs, ["aid", "avid", "bvid", "cid"])
    );
  }

  function isPlainHomeFeedVideo(item, requireKnownCardType) {
    var cardType;
    var cardGoto;
    var gotoValue;
    if (
      !isPlainVideoRecommendation(item) ||
      !hasOrdinaryVideoIdentity(item)
    ) {
      return false;
    }
    cardType = String(item.card_type || "").toLowerCase();
    if (
      requireKnownCardType !== false &&
      !HOME_FEED_AV_CARD_TYPES[cardType]
    ) {
      return false;
    }
    cardGoto = String(item.card_goto || "").toLowerCase();
    gotoValue = String(item.goto || "").toLowerCase();
    return (
      includes(["av", "video"], cardGoto) ||
      includes(["av", "video"], gotoValue)
    );
  }

  function deleteKnownViewAdKeys(node, config) {
    var keys;
    var index;
    var key;
    var changes = 0;
    if (!isPlainObject(node) || config.ads === false) {
      return 0;
    }
    keys = Object.keys(node);
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      if (VIEW_JSON_AD_KEYS[key]) {
        delete node[key];
        changes += 1;
      }
    }
    return changes;
  }

  function handleView(body, config) {
    var data = body.data;
    var changes = 0;
    if (!isPlainObject(data)) {
      return 0;
    }
    changes += deleteKnownViewAdKeys(data, config);
    changes += replaceFilteredArray(data, "relates", function (item) {
      if (
        config.videoOnlyRecommendations !== false &&
        (
          !isPlainVideoRecommendation(item) ||
          !hasOrdinaryVideoIdentity(item)
        )
      ) {
        return true;
      }
      return (
        isPlainObject(item) &&
        (
          isHighConfidencePromotion(item) ||
          hasCommercialAction(item) ||
          (
            hasOwn.call(item, "cm") &&
            item.cm !== null &&
            item.cm !== false
          )
        )
      );
    });
    changes += filterKnownViewJsonContainers(data, config, 0);
    return changes;
  }

  function shouldRemoveViewJsonModule(item, config) {
    var moduleType;
    if (!isPlainObject(item)) {
      return false;
    }
    if (
      config.ads !== false &&
      isHighConfidencePromotion(item)
    ) {
      return true;
    }
    moduleType = Number(
      item.module_type !== undefined
        ? item.module_type
        : item.moduleType
    );
    return (
      (
        config.ads !== false &&
        includes([18, 37, 55, 63], moduleType)
      ) ||
      (config.vipPromotions !== false && moduleType === 29)
    );
  }

  function filterKnownViewJsonContainers(node, config, depth) {
    var keys;
    var index;
    var key;
    var value;
    var changes = 0;
    if (!isPlainObject(node) || depth > 8) {
      return 0;
    }
    changes += deleteKnownViewAdKeys(node, config);
    keys = Object.keys(node);
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      if (!VIEW_JSON_CONTAINER_KEYS[key]) {
        continue;
      }
      value = node[key];
      if (Array.isArray(value)) {
        changes += replaceFilteredArray(node, key, function (item) {
          return shouldRemoveViewJsonModule(item, config);
        });
        node[key].forEach(function (item) {
          if (isPlainObject(item)) {
            changes += filterKnownViewJsonContainers(
              item,
              config,
              depth + 1
            );
          }
        });
      } else if (isPlainObject(value)) {
        if (shouldRemoveViewJsonModule(value, config)) {
          delete node[key];
          changes += 1;
        } else {
          changes += filterKnownViewJsonContainers(
            value,
            config,
            depth + 1
          );
        }
      }
    }
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
              isHighConfidencePromotion(item) ||
              isCommercialUri(objectLink(item))
            );
          }
        );
      }
    });
    return changes;
  }

  function handleWebFeed(body, config) {
    var data = body.data;
    var source;
    var kept = [];
    var changes = 0;
    var index;
    var item;
    if (!isPlainObject(body.data)) {
      return 0;
    }
    if (!Array.isArray(data.item)) {
      return 0;
    }
    source = data.item;
    for (index = 0; index < source.length; index += 1) {
      item = source[index];
      if (
        isHighConfidencePromotion(item) ||
        (
          config.homeFeedVideoOnly !== false &&
          (
            !isPlainHomeFeedVideo(item, false) ||
            kept.length >= HOME_FEED_VIDEO_LIMIT
          )
        )
      ) {
        changes += 1;
        continue;
      }
      kept.push(item);
    }
    if (kept.length !== source.length) {
      data.item = kept;
    }
    return changes;
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
    if (config.ads !== false || config.liveShopping) {
      changes += filterKnownCommercialUiContainers(
        data,
        0,
        Boolean(config.liveShopping)
      );
    }
    return changes;
  }

  function transformObject(body, endpoint, config) {
    if (!isPlainObject(body)) {
      return 0;
    }
    if (endpoint === "navigation") {
      return config.ui ? handleNavigation(body, config) : 0;
    }
    if (endpoint === "mine") {
      return config.ui || (config.ads && config.vipPromotions)
        ? handleMine(body, config)
        : 0;
    }
    if (endpoint === "vip-center") {
      return handleVipCenter(body, config);
    }
    if (endpoint === "vip-materials") {
      return handleVipMaterials(body, config);
    }
    if (endpoint === "vip-material-report") {
      return handleVipMaterialReport(body, config);
    }
    if (endpoint === "myinfo-diagnostic") {
      return 0;
    }
    if (
      endpoint === "resource-promotion" ||
      endpoint === "pgc-activity-material" ||
      endpoint === "live-shopping-material" ||
      endpoint === "game-live-material"
    ) {
      return handleDedicatedPromotion(body, endpoint, config);
    }
    if (endpoint === "search-square") {
      return handleSearchSquare(body, config);
    }
    if (!config.ads) {
      return 0;
    }
    switch (endpoint) {
      case "splash-list":
      case "splash-show":
      case "splash-event-list2":
      case "splash-brand-list":
        return handleSplash(body, endpoint);
      case "feed":
        return handleFeed(body, config);
      case "story":
        return handleStory(body, config);
      case "story-cart":
        return handleStoryCart(body);
      case "search-results":
        return handleSearchResults(body);
      case "view":
        return handleView(body, config);
      case "reply":
        return handleReply(body);
      case "pgc":
        return handlePgc(body);
      case "web-feed":
        return handleWebFeed(body, config);
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
    var data;
    var arrayCounts = [];
    var effectiveConfig = config || parseArgument("");

    try {
      parsed = JSON.parse(original);
    } catch (error) {
      return {
        body: original,
        changed: 0,
        endpoint: "",
        reason: "invalid-json",
        valid: false
      };
    }

    endpoint = classifyEndpoint(requestUrl);
    if (!endpoint) {
      return {
        body: original,
        changed: 0,
        endpoint: "",
        reason: "endpoint-unmatched",
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
        reason: "handler-error",
        valid: false
      };
    }
    data = isPlainObject(parsed.data) ? parsed.data : null;
    if (data) {
      [
        "items",
        "list",
        "list_v2",
        "cards",
        "relates",
        "sections",
        "sections_v2"
      ].forEach(function (key) {
        if (Array.isArray(data[key])) {
          arrayCounts.push(key + ":" + data[key].length);
        }
      });
    }
    return {
      arrayCounts: arrayCounts,
      body: changes > 0 ? JSON.stringify(parsed) : original,
      changed: changes,
      endpoint: endpoint,
      hitType: changes > 0 ? endpoint + "-filter" : "",
      reason:
        changes > 0
          ? "changed"
          : (
              endpoint === "myinfo-diagnostic"
                ? "diagnostic-only"
                : "no-ad-fields"
            ),
      topKeys: Object.keys(parsed).slice(0, 12),
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
    var contribution;
    var safe = true;
    while (offset < bytes.length && count < 10) {
      byte = bytes[offset];
      if (safe) {
        contribution = (byte & 0x7f) * multiplier;
        if (
          !Number.isSafeInteger(contribution) ||
          value > Number.MAX_SAFE_INTEGER - contribution
        ) {
          safe = false;
        } else {
          value += contribution;
        }
      }
      offset += 1;
      count += 1;
      if ((byte & 0x80) === 0) {
        return {
          next: offset,
          safe: safe,
          value: safe ? value : null
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
      if (!tag || !tag.safe || !Number.isSafeInteger(tag.value)) {
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
        scalarSafe: true,
        start: offset,
        tagEnd: tag.next,
        wireType: wireType
      };
      if (wireType === 0) {
        value = readVarint(bytes, tag.next);
        if (!value) {
          return null;
        }
        field.scalar = value.safe ? value.value : null;
        field.scalarSafe = value.safe;
        end = value.next;
      } else if (wireType === 1) {
        end = tag.next + 8;
      } else if (wireType === 2) {
        length = readVarint(bytes, tag.next);
        if (
          !length ||
          !length.safe ||
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

  function shortAsciiField(input, fieldNumber) {
    var field = findProtoField(input, fieldNumber, 2);
    var payload;
    var text = "";
    var index;
    if (!field) {
      return null;
    }
    payload = protoPayload(input, field);
    if (!payload || payload.length === 0 || payload.length > 64) {
      return null;
    }
    for (index = 0; index < payload.length; index += 1) {
      if (payload[index] < 0x20 || payload[index] > 0x7e) {
        return null;
      }
      text += String.fromCharCode(payload[index]);
    }
    return text.toLowerCase();
  }

  function positiveVarintField(input, fieldNumber) {
    var field = findProtoField(input, fieldNumber, 0);
    return Boolean(field && field.scalar > 0);
  }

  function popularCardBase(input) {
    var bytes = toUint8Array(input);
    var small = findProtoField(bytes, 1, 2);
    var large = findProtoField(bytes, 2, 2);
    var container;
    var base;
    if (!bytes || Boolean(small) === Boolean(large)) {
      return null;
    }
    container = protoPayload(bytes, small || large);
    base = findProtoField(container, 1, 2);
    return base ? protoPayload(container, base) : null;
  }

  function isPopularCardAd(input) {
    var bytes = toUint8Array(input);
    var base;
    var adInfo;
    if (!bytes) {
      return false;
    }
    if (findProtoField(bytes, 11, 2)) {
      return true;
    }
    base = popularCardBase(bytes);
    if (!base) {
      return false;
    }
    adInfo = findProtoField(base, 12, 2);
    return Boolean(
      adInfo && adInfo.payloadEnd > adInfo.payloadStart
    );
  }

  function isExplicitPopularAv(input) {
    var base = popularCardBase(input);
    var cardGoto;
    var gotoValue;
    var param;
    var uri;
    var args;
    var playerArgs;
    var identity = false;
    if (!base || isPopularCardAd(input)) {
      return false;
    }
    cardGoto = shortAsciiField(base, 2);
    gotoValue = shortAsciiField(base, 3);
    if (
      cardGoto &&
      cardGoto !== "av" &&
      cardGoto !== "video"
    ) {
      return false;
    }
    if (
      gotoValue &&
      gotoValue !== "av" &&
      gotoValue !== "video"
    ) {
      return false;
    }
    if (
      cardGoto !== "av" &&
      cardGoto !== "video" &&
      gotoValue !== "av" &&
      gotoValue !== "video"
    ) {
      return false;
    }

    param = shortAsciiField(base, 4);
    uri = shortAsciiField(base, 7);
    if (param && /^(?:\d+|bv[0-9a-z]+)$/i.test(param)) {
      identity = true;
    }
    if (
      uri &&
      /^(?:bilibili:\/\/video\/|https?:\/\/(?:www\.)?bilibili\.com\/video\/)/i.test(
        uri
      )
    ) {
      identity = true;
    }
    args = findProtoField(base, 9, 2);
    if (
      args &&
      positiveVarintField(protoPayload(base, args), 11)
    ) {
      identity = true;
    }
    playerArgs = findProtoField(base, 10, 2);
    if (
      playerArgs &&
      positiveVarintField(protoPayload(base, playerArgs), 2)
    ) {
      identity = true;
    }
    return identity;
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

  function isExplicitViewV1Av(input) {
    var param;
    var uri;
    if (shortAsciiField(input, 7) !== "av") {
      return false;
    }
    if (positiveVarintField(input, 1)) {
      return true;
    }
    param = shortAsciiField(input, 8);
    if (param && /^(?:\d+|bv[0-9a-z]+)$/i.test(param)) {
      return true;
    }
    uri = shortAsciiField(input, 9);
    return Boolean(
      uri &&
      /^(?:bilibili:\/\/video\/|https?:\/\/(?:www\.)?bilibili\.com\/video\/)/i.test(
        uri
      )
    );
  }

  function shouldRemoveViewV1Relate(input, config) {
    if (
      config.ads !== false &&
      isViewV1RelateAd(input)
    ) {
      return true;
    }
    return (
      config.videoOnlyRecommendations !== false &&
      !isExplicitViewV1Av(input)
    );
  }

  function isViewUniteRelateAd(input) {
    var bytes = toUint8Array(input);
    var type = smallVarintField(bytes, 1);
    var game = findProtoField(bytes, 5, 2);
    var cm = findProtoField(bytes, 6, 2);
    var stock = findProtoField(bytes, 11, 2);
    var basic = findProtoField(bytes, 12, 2);
    var unique;
    if (
      type === 4 ||
      type === 5 ||
      type === 11 ||
      game ||
      cm
    ) {
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

  function isExplicitViewUniteAv(input) {
    var bytes = toUint8Array(input);
    var nonAvPayloadFields = [3, 4, 5, 6, 7, 8, 9, 13, 14];
    var index;
    if (
      !bytes ||
      smallVarintField(bytes, 1) !== 1 ||
      !findProtoField(bytes, 2, 2)
    ) {
      return false;
    }
    for (index = 0; index < nonAvPayloadFields.length; index += 1) {
      if (findProtoField(bytes, nonAvPayloadFields[index], 2)) {
        return false;
      }
    }
    return true;
  }

  function shouldRemoveViewUniteRelate(input, config) {
    if (
      config.ads !== false &&
      isViewUniteRelateAd(input)
    ) {
      return true;
    }
    return (
      config.videoOnlyRecommendations !== false &&
      !isExplicitViewUniteAv(input)
    );
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

  function transformViewV1(input, relatesOnly, config) {
    if (relatesOnly) {
      return filterRepeatedMessage(input, 1, function (relate) {
        return shouldRemoveViewV1Relate(relate, config);
      });
    }
    return rewriteProtoMessage(input, function (field, bytes) {
      if (
        config.ads !== false &&
        field.wireType === 2 &&
        includes([30, 31, 34, 41, 48], field.fieldNumber)
      ) {
        return { changed: 1, remove: true };
      }
      if (
        field.fieldNumber === 10 &&
        field.wireType === 2 &&
        shouldRemoveViewV1Relate(
          protoPayload(bytes, field),
          config
        )
      ) {
        return { changed: 1, remove: true };
      }
      return null;
    });
  }

  function isPromotionalVideoGuideMaterial(input) {
    var materialType = smallVarintField(input, 4);
    return (
      includes([1, 6], materialType) ||
      bytesContainCommercialEvidence(input)
    );
  }

  function transformVideoGuideCommercialFields(input) {
    return rewriteProtoMessage(input, function (field, bytes) {
      if (
        field.wireType !== 2 ||
        !includes([1, 4], field.fieldNumber)
      ) {
        return null;
      }
      if (
        field.fieldNumber === 1
          ? isPromotionalVideoGuideMaterial(
              protoPayload(bytes, field)
            )
          : bytesContainCommercialEvidence(
              protoPayload(bytes, field)
            )
      ) {
        return { changed: 1, remove: true };
      }
      return null;
    });
  }

  function isPromotionalOperationCard(input) {
    var businessType = smallVarintField(input, 5);
    return (
      includes([2, 3, 5], businessType) ||
      bytesContainCommercialEvidence(input)
    );
  }

  function transformViewProgressDmResource(input) {
    return filterRepeatedMessage(input, 3, function (card) {
      return isPromotionalOperationCard(card);
    });
  }

  function transformViewProgressFields(input, includeDmResource) {
    var result = rewriteProtoMessage(input, function (field, bytes) {
      var nested;
      if (field.wireType !== 2) {
        return null;
      }
      if (field.fieldNumber === 1) {
        nested = transformVideoGuideCommercialFields(
          protoPayload(bytes, field)
        );
      } else if (
        includeDmResource &&
        field.fieldNumber === 4
      ) {
        nested = transformViewProgressDmResource(
          protoPayload(bytes, field)
        );
      } else {
        return null;
      }
      if (!nested.valid) {
        return { invalid: true };
      }
      return nested.changed > 0
        ? { changed: nested.changed, payload: nested.body }
        : null;
    });
    result.reason =
      result.changed > 0
        ? "view-progress-commercial-fields-removed"
        : "no-ad-fields";
    result.schema = includeDmResource
      ? "view-unite-progress-video-guide-dm-v1"
      : "view-v1-progress-video-guide-v1";
    return result;
  }

  function transformViewV1Progress(input) {
    return transformViewProgressFields(input, false);
  }

  function transformViewV1TfInfo(input) {
    return rewriteProtoMessage(input, function (field) {
      if (
        field.wireType === 2 &&
        includes([2, 3], field.fieldNumber)
      ) {
        return { changed: 1, remove: true };
      }
      return null;
    });
  }

  function transformViewUniteProgress(input) {
    return transformViewProgressFields(input, true);
  }

  function contextHeaderText(context) {
    var headers = context && context.requestHeaders;
    var keys;
    var index;
    var output = [];
    if (!isPlainObject(headers)) {
      return "";
    }
    keys = Object.keys(headers);
    for (index = 0; index < keys.length; index += 1) {
      if (
        /^(?:user-agent|x-bili-(?:build|version))$/i.test(keys[index]) &&
        typeof headers[keys[index]] === "string" &&
        headers[keys[index]].length <= 512
      ) {
        output.push(headers[keys[index]]);
      }
    }
    return output.join(" ").toLowerCase();
  }

  function isSupportedIos940Build(context) {
    var text = contextHeaderText(context);
    return Boolean(
      context &&
      (
        context.assumeIos940 === true ||
        context.assumeIos950 === true ||
        /58ece148439d6782b1e6f9a9a37e82a1fd0db236/i.test(text) ||
        /(?:bili(?:bili)?|bili-universal)[^;\r\n]{0,40}(?:9\.[45]\.0|9400\d{2,}|9500\d{2,}|90500100)/i.test(
          text
        ) ||
        /(?:build|version)[=:/ _-]*(?:9\.[45]\.0|9400\d{2,}|9500\d{2,}|90500100)/i.test(
          text
        )
      )
    );
  }

  function bytesContainCommercialEvidence(input) {
    var bytes = toUint8Array(input);
    var text = "";
    var index;
    if (!bytes || bytes.length === 0 || bytes.length > 262144) {
      return false;
    }
    for (index = 0; index < bytes.length; index += 1) {
      text += bytes[index] >= 0x20 && bytes[index] <= 0x7e
        ? String.fromCharCode(bytes[index])
        : " ";
    }
    return /(?:https?:\/\/(?:[^/\s]+\.)?(?:cm|ad)\.bili(?:bili)?\.(?:com|net)|(?:https?:\/\/|bilibili:\/\/)[^\s]{0,160}(?:taobao|tmall|jd\.com|pinduoduo|sponsor|commercial|creative|advert)|(?:^|[^a-z0-9])(?:ad_info|ad_report|adver_id|creative_id|commercial_id|pause[-_]?(?:ad|commerce)|under[-_]?player[-_]?ad|flash[-_]?sale|mall[-_/]ad)(?:[^a-z0-9]|$))/i.test(
      text
    );
  }

  function transformPlayPause(input, context) {
    var bytes = toUint8Array(input) || new Uint8Array();
    var fields = parseProtoFields(bytes);
    var result;
    if (!fields || fields.length === 0) {
      return {
        body: bytes,
        changed: 0,
        reason: "schema-unrecognized",
        schema: "play-pause-unknown",
        valid: true
      };
    }
    result = rewriteProtoMessage(bytes, function (field, message) {
      return bytesContainCommercialEvidence(
        protoPayload(message, field)
      )
        ? { changed: 1, remove: true }
        : null;
    });
    result.reason =
      result.changed > 0 ? "commercial-fields-removed" : "no-ad-fields";
    result.schema = isSupportedIos940Build(context)
      ? "play-pause-ios-9.4-9.5-commercial-fields"
      : "play-pause-commercial-evidence-v1";
    return result;
  }

  function transformViewEndPage(input, config) {
    var result = filterRepeatedMessage(input, 1, function (card) {
      var relate = findProtoField(card, 1, 2);
      if (!relate) {
        return false;
      }
      return shouldRemoveViewUniteRelate(
        protoPayload(card, relate),
        config
      );
    });
    result.reason =
      result.changed > 0 ? "relates-filtered" : "no-ad-fields";
    result.schema = "view-end-page-relates-v1";
    return result;
  }

  function decodeUtf8Strict(input) {
    var bytes = toUint8Array(input);
    var output = "";
    var index = 0;
    var first;
    var second;
    var third;
    var fourth;
    var codePoint;
    if (!bytes) {
      return null;
    }
    while (index < bytes.length) {
      first = bytes[index];
      if (first <= 0x7f) {
        output += String.fromCharCode(first);
        index += 1;
        continue;
      }
      if (first >= 0xc2 && first <= 0xdf) {
        if (index + 1 >= bytes.length) {
          return null;
        }
        second = bytes[index + 1];
        if ((second & 0xc0) !== 0x80) {
          return null;
        }
        output += String.fromCharCode(
          ((first & 0x1f) << 6) | (second & 0x3f)
        );
        index += 2;
        continue;
      }
      if (first >= 0xe0 && first <= 0xef) {
        if (index + 2 >= bytes.length) {
          return null;
        }
        second = bytes[index + 1];
        third = bytes[index + 2];
        if (
          (second & 0xc0) !== 0x80 ||
          (third & 0xc0) !== 0x80 ||
          (first === 0xe0 && second < 0xa0) ||
          (first === 0xed && second >= 0xa0)
        ) {
          return null;
        }
        output += String.fromCharCode(
          ((first & 0x0f) << 12) |
          ((second & 0x3f) << 6) |
          (third & 0x3f)
        );
        index += 3;
        continue;
      }
      if (first >= 0xf0 && first <= 0xf4) {
        if (index + 3 >= bytes.length) {
          return null;
        }
        second = bytes[index + 1];
        third = bytes[index + 2];
        fourth = bytes[index + 3];
        if (
          (second & 0xc0) !== 0x80 ||
          (third & 0xc0) !== 0x80 ||
          (fourth & 0xc0) !== 0x80 ||
          (first === 0xf0 && second < 0x90) ||
          (first === 0xf4 && second >= 0x90)
        ) {
          return null;
        }
        codePoint =
          ((first & 0x07) << 18) |
          ((second & 0x3f) << 12) |
          ((third & 0x3f) << 6) |
          (fourth & 0x3f);
        codePoint -= 0x10000;
        output += String.fromCharCode(
          0xd800 + (codePoint >> 10),
          0xdc00 + (codePoint & 0x3ff)
        );
        index += 4;
        continue;
      }
      return null;
    }
    return output;
  }

  function transformDeviceFeature(input) {
    var bytes = toUint8Array(input) || new Uint8Array();
    var fields = parseProtoFields(bytes);
    var field;
    var text;
    if (!fields) {
      return {
        body: bytes,
        changed: 0,
        reason: "schema-unrecognized",
        schema: "device-feature-unknown",
        valid: true
      };
    }
    field = findProtoField(bytes, 1, 2);
    if (!field) {
      return {
        body: bytes,
        changed: 0,
        reason: "action-data-absent",
        schema: "device-feature-action-data-v1",
        valid: true
      };
    }
    text = decodeUtf8Strict(protoPayload(bytes, field));
    if (text === null) {
      return {
        body: bytes,
        changed: 0,
        reason: "invalid-utf8",
        schema: "device-feature-action-data-v1",
        valid: true
      };
    }
    try {
      JSON.parse(text);
    } catch (error) {
      return {
        body: bytes,
        changed: 0,
        reason: "action-data-not-json",
        schema: "device-feature-action-data-v1",
        valid: true
      };
    }
    return {
      body: bytes,
      changed: 0,
      reason: "no-verified-action",
      schema: "device-feature-action-data-v1",
      valid: true
    };
  }

  function transformResourceModuleList(input) {
    var bytes = toUint8Array(input) || new Uint8Array();
    return {
      body: bytes,
      changed: 0,
      reason: parseProtoFields(bytes)
        ? "diagnostic-only"
        : "schema-unrecognized",
      schema: "resource-module-list-v1",
      valid: true
    };
  }

  function transformMinePubModule(input, config) {
    if (
      !config ||
      config.ui === false ||
      (
        !config.hideMineFirstVideo &&
        !config.hideMineRewardPublish
      )
    ) {
      return {
        body: toUint8Array(input) || new Uint8Array(),
        changed: 0,
        valid: true
      };
    }
    return filterRepeatedMessage(input, 1, function (pubCard) {
      return Boolean(
        findProtoField(pubCard, 1, 2) ||
        smallVarintField(pubCard, 5) === 1
      );
    });
  }

  function transformPopular(input, config) {
    var keptVideos = 0;
    var strict =
      !config || config.homeFeedVideoOnly !== false;
    return rewriteProtoMessage(input, function (field, bytes) {
      var card;
      var remove;
      if (
        field.fieldNumber !== 1 ||
        field.wireType !== 2
      ) {
        return null;
      }
      card = protoPayload(bytes, field);
      remove = strict
        ? (
            !isExplicitPopularAv(card) ||
            keptVideos >= HOME_FEED_VIDEO_LIMIT
          )
        : (
            config &&
            config.ads !== false &&
            isPopularCardAd(card)
          );
      if (remove) {
        return { changed: 1, remove: true };
      }
      if (strict) {
        keptVideos += 1;
      }
      return null;
    });
  }

  function transformViewUniteRelates(input, config) {
    return filterRepeatedMessage(
      input,
      1,
      function (relate) {
        return shouldRemoveViewUniteRelate(relate, config);
      }
    );
  }

  function transformViewUniteModule(input, config) {
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
          protoPayload(bytes, field),
          config
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

  function transformViewUniteIntroduction(input, config) {
    var result = rewriteProtoMessage(input, function (field, bytes) {
      var nested;
      var payload;
      var moduleType;
      if (
        field.fieldNumber !== 2 ||
        field.wireType !== 2
      ) {
        return null;
      }
      payload = protoPayload(bytes, field);
      moduleType = smallVarintField(payload, 1);
      if (
        (
          config.ads !== false &&
          includes([18, 37, 55, 63], moduleType)
        ) ||
        (moduleType === 29 && config.vipPromotions !== false)
      ) {
        return { changed: 1, remove: true };
      }
      nested = transformViewUniteModule(
        payload,
        config
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

  function transformViewUniteTabModule(input, config) {
    var result = rewriteProtoMessage(input, function (field, bytes) {
      var nested;
      if (
        field.fieldNumber !== 2 ||
        field.wireType !== 2
      ) {
        return null;
      }
      nested = transformViewUniteIntroduction(
        protoPayload(bytes, field),
        config
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

  function transformViewUniteTab(input, config) {
    return rewriteProtoMessage(input, function (field, bytes) {
      var nested;
      if (
        field.fieldNumber !== 1 ||
        field.wireType !== 2
      ) {
        return null;
      }
      nested = transformViewUniteTabModule(
        protoPayload(bytes, field),
        config
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

  function transformViewUnite(input, relatesOnly, config) {
    if (relatesOnly) {
      return transformViewUniteRelates(input, config);
    }
    return rewriteProtoMessage(input, function (field, bytes) {
      var nested;
      if (
        config.ads !== false &&
        field.fieldNumber === 7 &&
        field.wireType === 2
      ) {
        return { changed: 1, remove: true };
      }
      if (field.fieldNumber !== 5 || field.wireType !== 2) {
        return null;
      }
      nested = transformViewUniteTab(
        protoPayload(bytes, field),
        config
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

  function hasNestedProtoMessageField(input, outerNumber, innerNumber) {
    var outer = findProtoField(input, outerNumber, 2);
    return Boolean(
      outer &&
      findProtoField(protoPayload(input, outer), innerNumber, 2)
    );
  }

  function isSearchAd(input) {
    return Boolean(
      findProtoField(input, 9, 2) ||
      findProtoField(input, 11, 2) ||
      findProtoField(input, 12, 2) ||
      findProtoField(input, 25, 2) ||
      findProtoField(input, 29, 2) ||
      hasNestedProtoMessageField(input, 7, 4) ||
      hasNestedProtoMessageField(input, 26, 7) ||
      hasNestedProtoMessageField(input, 31, 3) ||
      hasNestedProtoMessageField(input, 37, 7)
    );
  }

  function transformSearch(input, itemFieldNumber) {
    return filterRepeatedMessage(
      input,
      itemFieldNumber,
      isSearchAd
    );
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

  function transformGrpcPayload(input, endpoint, config, context) {
    config = config || parseArgument("");
    switch (endpoint) {
      case "grpc-view-v1":
        return transformViewV1(input, false, config);
      case "grpc-view-v1-progress":
        return transformViewV1Progress(input);
      case "grpc-view-v1-relates":
        return transformViewV1(input, true, config);
      case "grpc-view-v1-tfinfo":
        return transformViewV1TfInfo(input);
      case "grpc-view-unite":
        return transformViewUnite(input, false, config);
      case "grpc-view-unite-progress":
        return transformViewUniteProgress(input);
      case "grpc-view-unite-play-pause":
        return transformPlayPause(input, context);
      case "grpc-view-unite-end-page":
        return transformViewEndPage(input, config);
      case "grpc-view-unite-relates":
        return transformViewUnite(input, true, config);
      case "grpc-mine-pub-module":
        return transformMinePubModule(input, config);
      case "grpc-mine-device-feature":
        return transformDeviceFeature(input);
      case "grpc-resource-module-list":
        return transformResourceModuleList(input);
      case "grpc-popular":
        return transformPopular(input, config);
      case "grpc-dynamic":
        return transformDynamic(input);
      case "grpc-search-all":
        return transformSearch(input, 4);
      case "grpc-search-by-type":
        return transformSearch(input, 6);
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

  function parseGrpcFrames(body) {
    var original = toUint8Array(body);
    var frames = [];
    var offset = 0;
    var flag;
    var length;
    var end;
    if (!original || original.length < 5) {
      return {
        body: original || new Uint8Array(),
        frames: frames,
        valid: false
      };
    }
    while (offset < original.length) {
      if (offset + 5 > original.length) {
        return {
          body: original,
          frames: [],
          valid: false
        };
      }
      flag = original[offset];
      if (flag !== 0 && flag !== 1) {
        return {
          body: original,
          frames: [],
          valid: false
        };
      }
      length =
        original[offset + 1] * 0x1000000 +
        original[offset + 2] * 0x10000 +
        original[offset + 3] * 0x100 +
        original[offset + 4];
      end = offset + 5 + length;
      if (end > original.length || end < offset + 5) {
        return {
          body: original,
          frames: [],
          valid: false
        };
      }
      frames.push({
        end: end,
        flag: flag,
        payloadStart: offset + 5,
        start: offset
      });
      offset = end;
    }
    return {
      body: original,
      frames: frames,
      valid: true
    };
  }

  function hasCompressedGrpcFrame(body) {
    var parsed = parseGrpcFrames(body);
    var index;
    if (!parsed.valid) {
      return false;
    }
    for (index = 0; index < parsed.frames.length; index += 1) {
      if (parsed.frames[index].flag === 1) {
        return true;
      }
    }
    return false;
  }

  function headerValue(headers, name) {
    var keys;
    var index;
    var value;
    if (!isPlainObject(headers)) {
      return "";
    }
    keys = Object.keys(headers);
    for (index = 0; index < keys.length; index += 1) {
      if (keys[index].toLowerCase() === name.toLowerCase()) {
        value = headers[keys[index]];
        return value === undefined || value === null
          ? ""
          : String(value);
      }
    }
    return "";
  }

  function grpcEncodingForContext(context) {
    return headerValue(
      context && context.responseHeaders,
      "grpc-encoding"
    )
      .split(",")[0]
      .trim()
      .toLowerCase();
  }

  function isSupportedGzipPayload(payload, context) {
    var bytes = toUint8Array(payload);
    var encoding = grpcEncodingForContext(context);
    if (
      encoding &&
      encoding !== "gzip" &&
      encoding !== "x-gzip"
    ) {
      return false;
    }
    return Boolean(
      bytes &&
      bytes.length >= 2 &&
      bytes[0] === 0x1f &&
      bytes[1] === 0x8b
    );
  }

  function decompressGzip(input) {
    var bytes = toUint8Array(input);
    var output;
    var stream;
    var reader;
    var chunks = [];
    var total = 0;

    if (!bytes) {
      return Promise.reject(new Error("invalid gzip input"));
    }
    if (
      typeof $utils !== "undefined" &&
      $utils &&
      typeof $utils.ungzip === "function"
    ) {
      try {
        output = toUint8Array($utils.ungzip(bytes));
        if (
          !output ||
          output.length > MAX_GRPC_DECOMPRESSED_BYTES
        ) {
          throw new Error("decompressed gRPC message is too large");
        }
        return Promise.resolve(output);
      } catch (error) {
        return Promise.reject(error);
      }
    }
    if (
      typeof DecompressionStream !== "function" ||
      typeof ReadableStream !== "function"
    ) {
      return Promise.reject(
        new Error("gzip decompression is unavailable")
      );
    }
    try {
      stream = new ReadableStream({
        start: function (controller) {
          controller.enqueue(bytes);
          controller.close();
        }
      }).pipeThrough(new DecompressionStream("gzip"));
      reader = stream.getReader();
    } catch (error) {
      return Promise.reject(error);
    }

    function readNext() {
      return reader.read().then(function (entry) {
        var chunk;
        if (entry.done) {
          return concatBytes(chunks);
        }
        chunk = toUint8Array(entry.value);
        if (!chunk) {
          throw new Error("invalid decompressed gRPC chunk");
        }
        total += chunk.length;
        if (total > MAX_GRPC_DECOMPRESSED_BYTES) {
          try {
            reader.cancel();
          } catch (error) {
            // The size guard is authoritative even if cancellation fails.
          }
          throw new Error("decompressed gRPC message is too large");
        }
        chunks.push(chunk);
        return readNext();
      });
    }

    return readNext();
  }

  function transformGrpcBody(body, requestUrl, config, context) {
    var parsed = parseGrpcFrames(body);
    var original = parsed.body;
    var frames = parsed.frames;
    var endpoint = classifyGrpcEndpoint(requestUrl);
    var effectiveConfig = config || parseArgument("");
    var chunks = [];
    var changed = 0;
    var index;
    var frame;
    var payload;
    var result;
    var reasons = {};
    var schemas = {};
    if (!parsed.valid) {
      return {
        body: original,
        changed: 0,
        endpoint: endpoint,
        frames: 0,
        reason: "malformed-grpc",
        valid: false
      };
    }
    if (!grpcEndpointEnabled(endpoint, effectiveConfig)) {
      return {
        body: original,
        changed: 0,
        endpoint: endpoint,
        frames: frames.length,
        reason: endpoint ? "feature-disabled" : "endpoint-unmatched",
        valid: true
      };
    }
    for (index = 0; index < frames.length; index += 1) {
      frame = frames[index];
      if (frame.flag === 1) {
        chunks.push(original.slice(frame.start, frame.end));
        continue;
      }
      payload = original.slice(frame.payloadStart, frame.end);
      result = transformGrpcPayload(
        payload,
        endpoint,
        effectiveConfig,
        context
      );
      if (result.reason) {
        reasons[result.reason] = true;
      }
      if (result.schema) {
        schemas[result.schema] = true;
      }
      if (!result.valid) {
        return {
            body: original,
            changed: 0,
            endpoint: endpoint,
            frames: frames.length,
            reason: result.reason || "schema-unrecognized",
            valid: false
        };
      }
      if (result.changed > 0) {
        chunks.push(grpcHeader(0, result.body.length));
        chunks.push(result.body);
        changed += result.changed;
      } else {
        chunks.push(original.slice(frame.start, frame.end));
      }
    }
    return {
      body: changed > 0 ? concatBytes(chunks) : original,
      changed: changed,
      endpoint: endpoint,
      frames: frames.length,
      hitType: changed > 0 ? endpoint + "-filter" : "",
      reason:
        Object.keys(reasons)[0] ||
        (changed > 0 ? "changed" : "no-ad-fields"),
      schema: Object.keys(schemas).join(","),
      valid: true
    };
  }

  function transformGrpcBodyAsync(body, requestUrl, config, context) {
    var parsed = parseGrpcFrames(body);
    var original = parsed.body;
    var frames = parsed.frames;
    var endpoint = classifyGrpcEndpoint(requestUrl);
    var effectiveConfig = config || parseArgument("");
    var tasks;

    if (!parsed.valid) {
      return Promise.resolve({
        body: original,
        changed: 0,
        endpoint: endpoint,
        frames: 0,
        reason: "malformed-grpc",
        valid: false
      });
    }
    if (!grpcEndpointEnabled(endpoint, effectiveConfig)) {
      return Promise.resolve({
        body: original,
        changed: 0,
        endpoint: endpoint,
        frames: frames.length,
        reason: endpoint ? "feature-disabled" : "endpoint-unmatched",
        valid: true
      });
    }

    tasks = frames.map(function (frame) {
      var payload = original.slice(frame.payloadStart, frame.end);
      if (
        frame.flag === 1 &&
        !isSupportedGzipPayload(payload, context)
      ) {
        return Promise.reject(
          new Error("unsupported gRPC compression encoding")
        );
      }
      var payloadPromise =
        frame.flag === 1
          ? decompressGzip(payload)
          : Promise.resolve(payload);
      return payloadPromise.then(function (decoded) {
        return {
          frame: frame,
          result: transformGrpcPayload(
            decoded,
            endpoint,
            effectiveConfig,
            context
          )
        };
      });
    });

    return Promise.all(tasks).then(
      function (entries) {
        var chunks = [];
        var changed = 0;
        var index;
        var entry;
        var reasons = {};
        var schemas = {};
        for (index = 0; index < entries.length; index += 1) {
          entry = entries[index];
          if (entry.result.reason) {
            reasons[entry.result.reason] = true;
          }
          if (entry.result.schema) {
            schemas[entry.result.schema] = true;
          }
          if (!entry.result.valid) {
            return {
              body: original,
              changed: 0,
              endpoint: endpoint,
              frames: frames.length,
              reason:
                entry.result.reason || "schema-unrecognized",
              valid: false
            };
          }
          if (entry.result.changed > 0) {
            chunks.push(grpcHeader(0, entry.result.body.length));
            chunks.push(entry.result.body);
            changed += entry.result.changed;
          } else {
            chunks.push(
              original.slice(entry.frame.start, entry.frame.end)
            );
          }
        }
        return {
          body: changed > 0 ? concatBytes(chunks) : original,
          changed: changed,
          endpoint: endpoint,
          frames: frames.length,
          hitType: changed > 0 ? endpoint + "-filter" : "",
          reason:
            Object.keys(reasons)[0] ||
            (changed > 0 ? "changed" : "no-ad-fields"),
          schema: Object.keys(schemas).join(","),
          valid: true
        };
      },
      function () {
        return {
          body: original,
          changed: 0,
          endpoint: endpoint,
          frames: frames.length,
          reason: "gzip-decode-failed",
          valid: false
        };
      }
    );
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

  function bodyLengthForLog(body) {
    var bytes = toUint8Array(body);
    if (bytes) {
      return bytes.length;
    }
    return typeof body === "string" ? body.length : 0;
  }

  function grpcFrameSummaryForLog(body) {
    var parsed = parseGrpcFrames(body);
    if (!parsed.valid) {
      return "invalid";
    }
    return parsed.frames
      .slice(0, 8)
      .map(function (frame) {
        return (
          String(frame.flag) +
          ":" +
          String(frame.end - frame.payloadStart)
        );
      })
      .join("|");
  }

  function logDiagnostic(result, transport, body, responseHeaders) {
    var contentType = headerValue(responseHeaders, "content-type")
      .split(";")[0]
      .trim()
      .toLowerCase();
    safeLog(
      "endpoint=" +
        (result.endpoint || "unmatched") +
        " transport=" +
        transport +
        " contentType=" +
        (contentType || "unknown") +
        " bodyBytes=" +
        bodyLengthForLog(body) +
        " frames=" +
        (result.frames || 0) +
        (
          transport === "grpc"
            ? " frameFlags=" + grpcFrameSummaryForLog(body)
            : ""
        ) +
        " changed=" +
        (result.changed || 0) +
        " schema=" +
        (result.schema || "none") +
        " hit=" +
        (result.hitType || "none") +
        (
          Array.isArray(result.topKeys) && result.topKeys.length > 0
            ? " topKeys=" + result.topKeys.join(",")
            : ""
        ) +
        (
          Array.isArray(result.arrayCounts) &&
          result.arrayCounts.length > 0
            ? " arrays=" + result.arrayCounts.join(",")
            : ""
        ) +
        " reason=" +
        (result.reason || (result.valid ? "no-op" : "fail-open"))
    );
  }

  function isVolatileJsonEndpoint(endpoint) {
    return includes(
      [
        "feed",
        "mine",
        "splash-list",
        "splash-show",
        "splash-event-list2",
        "splash-brand-list",
        "story",
        "story-cart",
        "view",
        "vip-materials",
        "vip-material-report"
      ],
      endpoint
    );
  }

  function isVolatileGrpcEndpoint(endpoint) {
    return Boolean(
      endpoint && endpoint !== "grpc-resource-module-list"
    );
  }

  function noStoreResponseHeaders(headers) {
    var output = {};
    var keys = isPlainObject(headers) ? Object.keys(headers) : [];
    var index;
    var key;
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      if (
        !/^(?:age|cache-control|content-length|etag|expires|last-modified|pragma)$/i.test(
          key
        )
      ) {
        output[key] = headers[key];
      }
    }
    output["Cache-Control"] = "no-store, no-cache, must-revalidate";
    output.Pragma = "no-cache";
    output.Expires = "0";
    return output;
  }

  function completionForResult(result, responseHeaders, noStore) {
    var completion = {};
    if (result && result.valid && result.changed > 0) {
      completion.body = result.body;
    }
    if (noStore) {
      completion.headers = noStoreResponseHeaders(responseHeaders);
    }
    return completion;
  }

  function feedRefillHeaders(headers) {
    var output = {};
    var keys = isPlainObject(headers) ? Object.keys(headers) : [];
    var index;
    var key;
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      if (
        !/^(?:content-length|if-match|if-modified-since|if-none-match|if-range|range)$/i.test(
          key
        )
      ) {
        output[key] = headers[key];
      }
    }
    output["Accept-Encoding"] = "identity";
    output["Cache-Control"] = "no-cache";
    output.Pragma = "no-cache";
    output[FEED_REFILL_HEADER] = "1";
    return output;
  }

  function fetchFeedRefill(requestUrl, requestHeaders, callback) {
    var client =
      typeof $httpClient !== "undefined" ? $httpClient : null;
    var completed = false;
    var timer = null;

    function complete(body) {
      if (completed) {
        return;
      }
      completed = true;
      if (timer !== null && typeof clearTimeout === "function") {
        clearTimeout(timer);
      }
      callback(typeof body === "string" ? body : "");
    }

    if (!client || typeof client.get !== "function") {
      complete("");
      return;
    }
    if (typeof setTimeout === "function") {
      timer = setTimeout(function () {
        complete("");
      }, FEED_REFILL_TIMEOUT_MS + 250);
    }
    try {
      client.get(
        {
          "auto-redirect": false,
          headers: feedRefillHeaders(requestHeaders),
          timeout: Math.max(
            1,
            Math.ceil(FEED_REFILL_TIMEOUT_MS / 1000)
          ),
          url: requestUrl
        },
        function (error, response, data) {
          var status = Number(
            response && (response.statusCode || response.status)
          );
          var body =
            typeof data === "string"
              ? data
              : response && typeof response.body === "string"
                ? response.body
                : "";
          if (
            error ||
            !Number.isFinite(status) ||
            status < 200 ||
            status >= 300
          ) {
            complete("");
            return;
          }
          complete(body);
        }
      );
    } catch (error) {
      complete("");
    }
  }

  function runShadowrocket() {
    var config;
    var body;
    var requestUrl;
    var result;
    var endpoint;
    var grpcEndpoint;
    var context;
    var preventCaching;
    try {
      config = parseArgument(
        typeof $argument === "string" ? $argument : ""
      );
      if (!config.valid) {
        safeLog("invalid module argument; response left unchanged");
        $done({});
        return;
      }
      requestUrl =
        typeof $request !== "undefined" && $request
          ? String($request.url || "")
          : "";
      endpoint = classifyEndpoint(requestUrl);
      grpcEndpoint = classifyGrpcEndpoint(requestUrl);
      context = {
        requestHeaders:
          typeof $request !== "undefined" && $request
            ? $request.headers
            : null,
        responseHeaders:
          typeof $response !== "undefined" && $response
            ? $response.headers
            : null
      };
      preventCaching =
        isVolatileGrpcEndpoint(grpcEndpoint) ||
        isVolatileJsonEndpoint(endpoint);
      body =
        grpcEndpoint &&
        typeof $response !== "undefined" &&
        $response &&
        $response.bodyBytes !== undefined &&
        $response.bodyBytes !== null
          ? $response.bodyBytes
          : (
              typeof $response !== "undefined" && $response
                ? $response.body
                : null
            );
      if (isByteView(body) || grpcEndpoint) {
        if (hasCompressedGrpcFrame(body)) {
          transformGrpcBodyAsync(
            body,
            requestUrl,
            config,
            context
          ).then(function (asyncResult) {
            if (config.debug) {
              logDiagnostic(
                asyncResult,
                "grpc",
                body,
                context.responseHeaders
              );
            }
            if (
              asyncResult.valid &&
              asyncResult.changed > 0
            ) {
              $done(
                completionForResult(
                  asyncResult,
                  context.responseHeaders,
                  preventCaching
                )
              );
              return;
            }
            $done(
              completionForResult(
                asyncResult,
                context.responseHeaders,
                preventCaching
              )
            );
          }, function (error) {
            safeLog(
              "compressed gRPC error; response left unchanged: " +
                (
                  error && error.message
                    ? error.message
                    : String(error)
                )
            );
            $done(
              completionForResult(
                null,
                context.responseHeaders,
                preventCaching
              )
            );
          });
          return;
        }
        result = transformGrpcBody(body, requestUrl, config, context);
        if (config.debug) {
          logDiagnostic(
            result,
            "grpc",
            body,
            context.responseHeaders
          );
        }
        if (result.valid && result.changed > 0) {
          $done(
            completionForResult(
              result,
              context.responseHeaders,
              preventCaching
            )
          );
          return;
        }
        $done(
          completionForResult(
            result,
            context.responseHeaders,
            preventCaching
          )
        );
        return;
      }
      if (typeof body !== "string") {
        if (config.debug) {
          safeLog("non-text response left unchanged");
        }
        $done(
          completionForResult(
            null,
            context.responseHeaders,
            preventCaching
          )
        );
        return;
      }
      result = transformJsonText(body, requestUrl, config);
      if (
        result.valid &&
        endpoint === "feed" &&
        config.homeFeedVideoOnly !== false &&
        filteredFeedLength(result) >= 0 &&
        filteredFeedLength(result) < HOME_FEED_VIDEO_LIMIT &&
        headerValue(context.requestHeaders, FEED_REFILL_HEADER) !== "1"
      ) {
        fetchFeedRefill(
          requestUrl,
          context.requestHeaders,
          function (refillBody) {
            var refillResult;
            var merged = result;
            if (refillBody) {
              refillResult = transformJsonText(
                refillBody,
                requestUrl,
                config
              );
              merged = mergeFilteredFeedResults(result, refillResult);
            }
            if (config.debug) {
              logDiagnostic(
                merged,
                "json",
                body,
                context.responseHeaders
              );
            }
            $done(
              completionForResult(
                merged,
                context.responseHeaders,
                true
              )
            );
          }
        );
        return;
      }
      if (config.debug) {
        logDiagnostic(
          result,
          "json",
          body,
          context.responseHeaders
        );
      }
      if (result.valid && result.changed > 0) {
        $done(
          completionForResult(
            result,
            context.responseHeaders,
            preventCaching
          )
        );
        return;
      }
      $done(
        completionForResult(
          result,
          context.responseHeaders,
          preventCaching
        )
      );
    } catch (error) {
      safeLog(
        "error; response left unchanged: " +
          (
            error && error.message
              ? error.message
              : String(error)
          )
      );
      $done(
        preventCaching &&
        typeof $response !== "undefined" &&
        $response
          ? {
              headers: noStoreResponseHeaders($response.headers)
            }
          : {}
      );
    }
  }

  var api = {
    MINE_TARGETS: MINE_TARGETS,
    UI_OPTION_DEFAULTS: UI_OPTION_DEFAULTS,
    classifyEndpoint: classifyEndpoint,
    classifyGrpcEndpoint: classifyGrpcEndpoint,
    concatBytes: concatBytes,
    encodeVarint: encodeVarint,
    feedItemIdentity: feedItemIdentity,
    feedItemIdentities: feedItemIdentities,
    grpcFrameSummaryForLog: grpcFrameSummaryForLog,
    handleFeed: handleFeed,
    handleMine: handleMine,
    handleNavigation: handleNavigation,
    handleVipCenter: handleVipCenter,
    handleVipMaterialReport: handleVipMaterialReport,
    handleVipMaterials: handleVipMaterials,
    hasExplicitAdMarker: hasExplicitAdMarker,
    isHighConfidencePromotion: isHighConfidencePromotion,
    isPlainHomeFeedVideo: isPlainHomeFeedVideo,
    isMineMarketingBanner: isMineMarketingBanner,
    isFeedAdCard: isFeedAdCard,
    isExplicitPopularAv: isExplicitPopularAv,
    isSupportedIos940Build: isSupportedIos940Build,
    matchesMineTarget: matchesMineTarget,
    matchesNavigationItem: matchesNavigationItem,
    mergeFilteredFeedResults: mergeFilteredFeedResults,
    noStoreResponseHeaders: noStoreResponseHeaders,
    parseArgument: parseArgument,
    parseProtoFields: parseProtoFields,
    readVarint: readVarint,
    runShadowrocket: runShadowrocket,
    transformGrpcBody: transformGrpcBody,
    transformGrpcBodyAsync: transformGrpcBodyAsync,
    transformGrpcPayload: transformGrpcPayload,
    transformMinePubModule: transformMinePubModule,
    transformDeviceFeature: transformDeviceFeature,
    transformPlayPause: transformPlayPause,
    transformPopular: transformPopular,
    transformViewEndPage: transformViewEndPage,
    transformJsonText: transformJsonText
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.BiliEnhance = api;
  }

  if (
    typeof $done === "function" &&
    typeof $response !== "undefined" &&
    root.__BILIFLOW_COMBINED__ !== true
  ) {
    runShadowrocket();
  }
})(this);

/*
 * Bilibili CDN Switcher v5 for Shadowrocket
 *
 * Default auto mode is deliberately conservative:
 * - it only considers the primary and backup URLs returned for one media item;
 * - it validates a small byte range before persisting a choice;
 * - it isolates choices by resource, representation, codec, media kind,
 *   candidate set, and an explicit network profile;
 * - it never stores signed query strings or rewrites media response bodies.
 *
 * Fixed-host mode remains available as an explicit compatibility option.
 * Live URLs are never rewritten because their signatures are bound to
 * server-selected CDN metadata.
 */
(function (root) {
  "use strict";

  var NAME = "BiliCDN";
  var DEFAULT_CDN = "upos-sz-mirrorali.bilivideo.com";
  var AUTO_STATE_KEY = "BiliCDN.safeAuto.v5";
  var DEFAULT_AUTO_INTERVAL_HOURS = 12;
  var DEFAULT_SWITCH_THRESHOLD = 20;
  var RUNTIME_OPTION_LIMITS = {
    intervalHours: {
      defaultValue: DEFAULT_AUTO_INTERVAL_HOURS,
      maximum: 72,
      minimum: 6
    },
    switchThreshold: {
      defaultValue: DEFAULT_SWITCH_THRESHOLD,
      maximum: 80,
      minimum: 10
    }
  };
  var AUTO_CACHE_CAPACITY = 64;
  var AUTO_CONFIRM_DELAY_MS = 2 * 60 * 1000;
  var AUTO_EXPLORE_DELAY_MS = 30 * 60 * 1000;
  var AUTO_GLOBAL_PROBE_GAP_MS = 2 * 60 * 1000;
  var AUTO_LOCK_MS = 10 * 1000;
  var AUTO_PROBE_TIMEOUT_MS = 5000;
  var AUTO_RANGE_END = 262143;
  var AUTO_RETRY_MS = 30 * 60 * 1000;
  var AUTO_SELECTED_REVALIDATE_MS = 30 * 60 * 1000;
  var MAX_GRPC_DECOMPRESSED_BYTES = 4 * 1024 * 1024;
  var MAX_PROTO_DEPTH = 32;
  var MAX_URL_BYTES = 65536;
  var MAX_JSON_DEPTH = 64;
  var AUTO_SCORE_SAMPLE_LIMIT = 5;

  /*
   * This list is documentation and fixed-mode input guidance only. Safe auto
   * mode never injects these hosts into a server-provided candidate set.
   */
  var FIXED_CDN_CANDIDATES = [
    "upos-sz-mirrorali.bilivideo.com",
    "upos-sz-mirrorcos.bilivideo.com",
    "upos-sz-mirrorhw.bilivideo.com",
    "upos-sz-mirroraliov.bilivideo.com",
    "upos-sz-mirrorcosov.bilivideo.com",
    "upos-sz-mirrorhwov.bilivideo.com",
    "cn-hk-eq-01-01.bilivideo.com",
    "cn-hk-eq-01-03.bilivideo.com",
    "cn-hk-eq-01-09.bilivideo.com",
    "cn-hk-eq-01-10.bilivideo.com",
    "cn-hk-eq-01-12.bilivideo.com",
    "cn-hk-eq-01-13.bilivideo.com",
    "cn-hk-eq-01-14.bilivideo.com",
    "cn-jxnc-cmcc-bcache-06.bilivideo.com",
    "upos-hz-mirrorakam.akamaized.net",
    "upos-sz-mirroralib.bilivideo.com",
    "upos-sz-mirrorbos.bilivideo.com"
  ];

  var PRIMARY_URL_KEYS = {
    baseUrl: true,
    base_url: true,
    url: true
  };
  var BACKUP_URL_KEYS = {
    backupUrl: true,
    backup_url: true
  };
  var MEDIA_SUFFIXES = [
    "acgvideo.com",
    "bilivideo.com",
    "bilivideo.cn",
    "bilivideo.net",
    "bilibilivideo.com",
    "ourdvsss.com",
    "ksyungslb.com",
    "00cdn.com"
  ];
  var FIXED_MEDIA_SUFFIXES = [
    "acgvideo.com",
    "bilivideo.com",
    "bilivideo.cn",
    "bilivideo.net",
    "bilibilivideo.com"
  ];
  var JSON_METADATA_KEYS = [
    "id",
    "quality",
    "codecid",
    "codec",
    "codecs",
    "mimeType",
    "mime_type",
    "audio_id",
    "frame_rate",
    "frameRate",
    "width",
    "height"
  ];
  /*
   * Verified against the public PlayView/PlayViewUnite schemas. Every method
   * currently matched by the module wraps VodInfo/VideoInfo in reply field 1.
   * Only these paths may be decoded as media messages; arbitrary
   * length-delimited fields are never recursively guessed.
   */
  var PLAYVIEW_MEDIA_PATHS = [
    [1, 5, 2],
    [1, 5, 3, 1],
    [1, 6],
    [1, 7, 2],
    [1, 9, 2]
  ];
  var PGC_V2_MEDIA_PATHS = [
    [1, 5, 2],
    [1, 5, 3, 1],
    [1, 6],
    [1, 7, 2]
  ];
  var GRPC_MEDIA_PATHS = {
    "app-playurl-v1": PLAYVIEW_MEDIA_PATHS,
    "playerunite-v1": PLAYVIEW_MEDIA_PATHS,
    "pgc-v1": PLAYVIEW_MEDIA_PATHS,
    "pgc-v2": PGC_V2_MEDIA_PATHS,
    "cheese-v1": PLAYVIEW_MEDIA_PATHS,
    /* Backward-compatible utility adapter; runtime classification is specific. */
    "playview-v1": PLAYVIEW_MEDIA_PATHS
  };

  function isObject(value) {
    return value !== null && typeof value === "object";
  }

  function classifyGrpcAdapter(requestUrl) {
    var value = typeof requestUrl === "string" ? requestUrl : "";
    if (
      /\/bilibili\.app\.playerunite\.v1\.Player\/PlayViewUnite(?:\?|$)/i.test(
        value
      )
    ) {
      return "playerunite-v1";
    }
    if (
      /\/bilibili\.app\.playurl\.v1\.PlayURL\/PlayView(?:\?|$)/i.test(value)
    ) {
      return "app-playurl-v1";
    }
    if (
      /\/bilibili\.pgc\.gateway\.player\.v2\.PlayURL\/PlayView(?:\?|$)/i.test(
        value
      )
    ) {
      return "pgc-v2";
    }
    if (
      /\/bilibili\.pgc\.gateway\.player\.v1\.PlayURL\/PlayView(?:\?|$)/i.test(
        value
      )
    ) {
      return "pgc-v1";
    }
    if (
      /\/bilibili\.cheese\.gateway\.player\.v1\.PlayURL\/PlayView(?:\?|$)/i.test(
        value
      )
    ) {
      return "cheese-v1";
    }
    return "";
  }

  function protoPathState(adapter, path) {
    var paths = GRPC_MEDIA_PATHS[adapter] || [];
    var exact = false;
    var prefix = false;
    var index;
    var inner;
    var matches;
    for (index = 0; index < paths.length; index += 1) {
      if (path.length > paths[index].length) {
        continue;
      }
      matches = true;
      for (inner = 0; inner < path.length; inner += 1) {
        if (path[inner] !== paths[index][inner]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        prefix = true;
        if (path.length === paths[index].length) {
          exact = true;
        }
      }
    }
    return { exact: exact, prefix: prefix };
  }

  function isByteView(value) {
    return (
      typeof ArrayBuffer !== "undefined" &&
      (value instanceof ArrayBuffer ||
        (typeof ArrayBuffer.isView === "function" &&
          ArrayBuffer.isView(value)))
    );
  }

  function toUint8Array(value) {
    if (typeof Uint8Array !== "undefined" && value instanceof Uint8Array) {
      return value;
    }
    if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) {
      return new Uint8Array(value);
    }
    if (
      value &&
      typeof ArrayBuffer !== "undefined" &&
      value.buffer instanceof ArrayBuffer &&
      typeof value.byteOffset === "number" &&
      typeof value.byteLength === "number"
    ) {
      return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    }
    return null;
  }

  function parseBoolean(value) {
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number") {
      return value !== 0;
    }
    if (typeof value === "string") {
      return /^(?:1|true|yes|on)$/i.test(value.trim());
    }
    return false;
  }

  function boundedNumber(value, fallback, minimum, maximum) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.min(maximum, Math.max(minimum, parsed));
  }

  function isValidHostname(hostname) {
    var labels;
    var index;

    if (
      typeof hostname !== "string" ||
      hostname.length < 3 ||
      hostname.length > 253 ||
      hostname.indexOf(".") === -1 ||
      /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)
    ) {
      return false;
    }

    labels = hostname.split(".");
    for (index = 0; index < labels.length; index += 1) {
      if (
        !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(labels[index])
      ) {
        return false;
      }
    }
    return true;
  }

  function normalizeCdnHost(value) {
    var host;
    var match;

    if (typeof value !== "string") {
      return null;
    }

    host = value.trim().toLowerCase();
    if (/^(?:off|none|false|0)$/i.test(host)) {
      return "";
    }

    match = /^(?:https?:\/\/)?([^\/?#]+)\/?$/i.exec(host);
    if (!match || match[1].indexOf("@") !== -1 || match[1].indexOf(":") !== -1) {
      return null;
    }

    host = match[1].replace(/\.$/, "");
    return (
      isValidHostname(host) &&
      isAllowedFixedCdnHost(host)
    )
      ? host
      : null;
  }

  function applyCdnSetting(config, value) {
    var raw;
    var normalized;

    if (typeof value !== "string") {
      config.valid = false;
      config.cdnHost = null;
      config.auto = false;
      return;
    }

    raw = value.trim();
    if (/^auto$/i.test(raw)) {
      config.auto = true;
      config.cdnHost = null;
      return;
    }

    normalized = normalizeCdnHost(raw);
    config.auto = false;
    if (normalized === null) {
      config.valid = false;
      config.cdnHost = null;
    } else {
      config.cdnHost = normalized;
    }
  }

  function normalizeNetworkProfile(value) {
    var profile =
      typeof value === "string" ? value.trim().toLowerCase() : "";
    if (!profile) {
      return "auto";
    }
    return /^[a-z0-9][a-z0-9_-]{0,31}$/.test(profile)
      ? profile
      : "auto";
  }

  function normalizeProbeMode(value) {
    var mode =
      typeof value === "string" ? value.trim().toLowerCase() : "";
    return mode === "blocking" || mode === "off"
      ? mode
      : "nonblocking";
  }

  function normalizeResetToken(value) {
    var token =
      typeof value === "string" ? value.trim().toLowerCase() : "";
    return /^[a-z0-9][a-z0-9_-]{0,31}$/.test(token) ? token : "";
  }

  function parseArgument(argument) {
    var config = {
      auto: true,
      cdnHost: null,
      debug: false,
      intervalHours: DEFAULT_AUTO_INTERVAL_HOURS,
      networkProfile: "auto",
      probeMode: "nonblocking",
      resetToken: "",
      switchThreshold: DEFAULT_SWITCH_THRESHOLD,
      valid: true
    };
    var raw;
    var parsed;
    var pairs;
    var index;
    var splitAt;
    var key;
    var value;
    var decodedKey;
    var decodedValue;

    if (typeof argument !== "string" || argument.trim() === "") {
      return config;
    }

    raw = argument.trim();
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      parsed = null;
    }

    if (isObject(parsed) && !Array.isArray(parsed)) {
      if (Object.prototype.hasOwnProperty.call(parsed, "cdn")) {
        applyCdnSetting(config, String(parsed.cdn));
      }
      config.debug = parseBoolean(parsed.debug);
      config.networkProfile = normalizeNetworkProfile(
        parsed.networkProfile || parsed.profile
      );
      config.probeMode = normalizeProbeMode(
        parsed.probeMode || parsed.probes
      );
      config.resetToken = normalizeResetToken(parsed.resetToken);
      config.intervalHours = boundedNumber(
        parsed.intervalHours,
        DEFAULT_AUTO_INTERVAL_HOURS,
        RUNTIME_OPTION_LIMITS.intervalHours.minimum,
        RUNTIME_OPTION_LIMITS.intervalHours.maximum
      );
      config.switchThreshold = boundedNumber(
        parsed.switchThreshold,
        DEFAULT_SWITCH_THRESHOLD,
        RUNTIME_OPTION_LIMITS.switchThreshold.minimum,
        RUNTIME_OPTION_LIMITS.switchThreshold.maximum
      );
      return config;
    }

    pairs = raw.split(/[&,]/);
    for (index = 0; index < pairs.length; index += 1) {
      splitAt = pairs[index].indexOf("=");
      if (splitAt === -1) {
        continue;
      }
      try {
        decodedKey = decodeURIComponent(pairs[index].slice(0, splitAt));
        decodedValue = decodeURIComponent(pairs[index].slice(splitAt + 1));
      } catch (error) {
        config.valid = false;
        config.cdnHost = null;
        return config;
      }
      key = decodedKey.trim().toLowerCase();
      value = decodedValue.trim();
      if (key === "cdn") {
        applyCdnSetting(config, value);
      } else if (key === "debug") {
        config.debug = parseBoolean(value);
      } else if (key === "networkprofile" || key === "profile") {
        config.networkProfile = normalizeNetworkProfile(value);
      } else if (key === "probemode" || key === "probes") {
        config.probeMode = normalizeProbeMode(value);
      } else if (key === "resettoken") {
        config.resetToken = normalizeResetToken(value);
      } else if (key === "intervalhours" || key === "interval") {
        config.intervalHours = boundedNumber(
          value,
          DEFAULT_AUTO_INTERVAL_HOURS,
          RUNTIME_OPTION_LIMITS.intervalHours.minimum,
          RUNTIME_OPTION_LIMITS.intervalHours.maximum
        );
      } else if (key === "switchthreshold" || key === "threshold") {
        config.switchThreshold = boundedNumber(
          value,
          DEFAULT_SWITCH_THRESHOLD,
          RUNTIME_OPTION_LIMITS.switchThreshold.minimum,
          RUNTIME_OPTION_LIMITS.switchThreshold.maximum
        );
      }
    }
    return config;
  }

  function hostnameMatchesSuffix(hostname, suffix) {
    return (
      hostname === suffix ||
      hostname.slice(-(suffix.length + 1)) === "." + suffix
    );
  }

  function isBilibiliMediaHost(hostname) {
    var index;

    hostname = String(hostname || "").toLowerCase();
    for (index = 0; index < MEDIA_SUFFIXES.length; index += 1) {
      if (hostnameMatchesSuffix(hostname, MEDIA_SUFFIXES[index])) {
        return true;
      }
    }
    return (
      /^upos-[a-z0-9-]+\.akamaized\.net$/i.test(hostname) ||
      /^uposdash-[a-z0-9-]+\.yfcdn\.net$/i.test(hostname)
    );
  }

  function isAllowedFixedCdnHost(hostname) {
    var index;

    hostname = String(hostname || "").toLowerCase();
    if (FIXED_CDN_CANDIDATES.indexOf(hostname) !== -1) {
      return true;
    }
    for (index = 0; index < FIXED_MEDIA_SUFFIXES.length; index += 1) {
      if (hostnameMatchesSuffix(hostname, FIXED_MEDIA_SUFFIXES[index])) {
        return true;
      }
    }
    return false;
  }

  function parseHttpUrl(value) {
    var match;
    var authority;
    var hostname;
    var remainder;
    var queryAt;

    if (typeof value !== "string") {
      return null;
    }
    match = /^(https?):\/\/([^\/?#]+)([^#]*)$/i.exec(value);
    if (!match) {
      return null;
    }

    authority = match[2];
    if (authority.indexOf("@") !== -1) {
      return null;
    }
    hostname = authority.replace(/:\d+$/, "").toLowerCase();
    remainder = match[3] || "/";
    queryAt = remainder.indexOf("?");

    return {
      authority: authority,
      hostname: hostname,
      path: queryAt === -1 ? remainder : remainder.slice(0, queryAt),
      query: queryAt === -1 ? "" : remainder.slice(queryAt),
      remainder: remainder,
      scheme: match[1].toLowerCase()
    };
  }

  function isVodMediaUrl(value) {
    var parsed = parseHttpUrl(value);
    var lowerRemainder;

    if (!parsed || !isBilibiliMediaHost(parsed.hostname)) {
      return false;
    }
    lowerRemainder = parsed.remainder.toLowerCase();
    return (
      /^\/upgcxcode\//.test(lowerRemainder) ||
      /(?:[?&])bvc=vod(?:&|$)/.test(lowerRemainder)
    );
  }

  function rewriteVodUrl(value, cdnHost) {
    var parsed;

    if (!cdnHost || !isVodMediaUrl(value)) {
      return value;
    }
    parsed = parseHttpUrl(value);
    if (!parsed || parsed.hostname === cdnHost) {
      return value;
    }
    return parsed.scheme + "://" + cdnHost + parsed.remainder;
  }

  function rewriteJsonValue(value, config, state, depth) {
    var index;
    var keys;
    var key;
    var rewritten;

    if (depth > MAX_JSON_DEPTH || value === null) {
      return;
    }
    if (Array.isArray(value)) {
      for (index = 0; index < value.length; index += 1) {
        rewriteJsonValue(value[index], config, state, depth + 1);
      }
      return;
    }
    if (!isObject(value)) {
      return;
    }

    keys = Object.keys(value);
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      if (PRIMARY_URL_KEYS[key] && typeof value[key] === "string") {
        rewritten = rewriteVodUrl(value[key], config.cdnHost);
        if (rewritten !== value[key]) {
          value[key] = rewritten;
          state.changed += 1;
        }
      } else {
        rewriteJsonValue(value[key], config, state, depth + 1);
      }
    }
  }

  function jsonAliasLanes(value) {
    var mappings = [
      ["baseUrl", "backupUrl"],
      ["base_url", "backup_url"]
    ];
    var lanes = [];
    var coveredPrimary = {};
    var primaryCount = 0;
    var index;
    var primaryKey;
    var backupKey;
    var primaryUrl;
    var backups;

    Object.keys(PRIMARY_URL_KEYS).forEach(function (key) {
      if (typeof value[key] === "string" && isVodMediaUrl(value[key])) {
        primaryCount += 1;
      }
    });
    for (index = 0; index < mappings.length; index += 1) {
      primaryKey = mappings[index][0];
      backupKey = mappings[index][1];
      primaryUrl = value[primaryKey];
      backups = arrayOfVodUrls(value[backupKey]);
      if (
        typeof primaryUrl === "string" &&
        isVodMediaUrl(primaryUrl) &&
        backups.length > 0
      ) {
        lanes.push({
          backupKey: backupKey,
          backups: backups,
          primaryId: candidateIdForUrl(primaryUrl),
          primaryKey: primaryKey,
          primaryUrl: primaryUrl
        });
        coveredPrimary[primaryKey] = true;
      }
    }
    if (typeof value.url === "string" && isVodMediaUrl(value.url)) {
      backupKey =
        !coveredPrimary.base_url && Array.isArray(value.backup_url)
          ? "backup_url"
          : !coveredPrimary.baseUrl && Array.isArray(value.backupUrl)
            ? "backupUrl"
            : "";
      backups = backupKey ? arrayOfVodUrls(value[backupKey]) : [];
      if (backups.length > 0) {
        lanes.push({
          backupKey: backupKey,
          backups: backups,
          primaryId: candidateIdForUrl(value.url),
          primaryKey: "url",
          primaryUrl: value.url
        });
        coveredPrimary.url = true;
      }
    }
    if (lanes.length === 0 || Object.keys(coveredPrimary).length !== primaryCount) {
      return null;
    }
    for (index = 1; index < lanes.length; index += 1) {
      if (lanes[index].primaryId !== lanes[0].primaryId) {
        return null;
      }
    }
    return lanes;
  }

  function laneUrlForCandidate(lane, candidateId) {
    var index;
    if (lane.primaryId === candidateId) {
      return lane.primaryUrl;
    }
    for (index = 0; index < lane.backups.length; index += 1) {
      if (candidateIdForUrl(lane.backups[index]) === candidateId) {
        return lane.backups[index];
      }
    }
    return "";
  }

  function rotateJsonAliasLane(value, lane, selectedId) {
    var selectedUrl = laneUrlForCandidate(lane, selectedId);
    var array = value[lane.backupKey];
    var next = [lane.primaryUrl];
    var index;
    var item;
    var itemId;
    var changed = 0;
    if (!selectedUrl || selectedId === lane.primaryId) {
      return 0;
    }
    if (value[lane.primaryKey] !== selectedUrl) {
      value[lane.primaryKey] = selectedUrl;
      changed += 1;
    }
    for (index = 0; index < array.length; index += 1) {
      item = array[index];
      itemId = typeof item === "string" ? candidateIdForUrl(item) : null;
      if (itemId === selectedId || itemId === lane.primaryId) {
        continue;
      }
      next.push(item);
    }
    if (JSON.stringify(next) !== JSON.stringify(array)) {
      value[lane.backupKey] = next;
      changed += 1;
    }
    return changed;
  }

  function fixedCandidateOnCurrentObject(value, cdnHost) {
    var lanes = jsonAliasLanes(value);
    var selectedId = "";
    var index;
    var inner;
    var parsed;
    var candidateId;
    var changed = 0;
    if (!lanes) {
      return 0;
    }
    for (index = 0; index < lanes.length; index += 1) {
      candidateId = "";
      for (inner = 0; inner < lanes[index].backups.length; inner += 1) {
        parsed = parseHttpUrl(lanes[index].backups[inner]);
        if (parsed && parsed.hostname === cdnHost) {
          candidateId = candidateIdForUrl(lanes[index].backups[inner]);
          break;
        }
      }
      if (!candidateId || (selectedId && selectedId !== candidateId)) {
        return 0;
      }
      selectedId = candidateId;
    }
    if (!selectedId || selectedId === lanes[0].primaryId) {
      return 0;
    }
    for (index = 0; index < lanes.length; index += 1) {
      if (!laneUrlForCandidate(lanes[index], selectedId)) {
        return 0;
      }
    }
    for (index = 0; index < lanes.length; index += 1) {
      changed += rotateJsonAliasLane(value, lanes[index], selectedId);
    }
    return changed;
  }

  function walkSafeFixedJson(value, config, depth) {
    var changed = 0;
    var keys;
    var index;
    var key;
    if (depth > MAX_JSON_DEPTH || value === null) {
      return 0;
    }
    if (Array.isArray(value)) {
      for (index = 0; index < value.length; index += 1) {
        changed += walkSafeFixedJson(value[index], config, depth + 1);
      }
      return changed;
    }
    if (!isObject(value)) {
      return 0;
    }
    changed += fixedCandidateOnCurrentObject(value, config.cdnHost);
    keys = Object.keys(value);
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      if (!PRIMARY_URL_KEYS[key] && !BACKUP_URL_KEYS[key]) {
        changed += walkSafeFixedJson(value[key], config, depth + 1);
      }
    }
    return changed;
  }

  function transformJsonText(text, config) {
    var input = typeof text === "string" ? text : "";
    var parsed;
    var state = { changed: 0 };

    if (!config || !config.valid || !config.cdnHost || input === "") {
      return { body: input, changed: 0, valid: Boolean(config && config.valid) };
    }
    try {
      parsed = JSON.parse(input.replace(/^\uFEFF/, ""));
    } catch (error) {
      return { body: input, changed: 0, valid: false };
    }

    state.changed = walkSafeFixedJson(parsed, config, 0);
    return {
      body: state.changed > 0 ? JSON.stringify(parsed) : input,
      changed: state.changed,
      valid: true
    };
  }

  function readVarint(bytes, offset) {
    var value = 0;
    var shift = 0;
    var position = offset;
    var current;
    var contribution;
    var safe = true;

    while (position < bytes.length && position - offset < 10) {
      current = bytes[position];
      if (safe) {
        contribution = (current & 0x7f) * Math.pow(2, shift);
        if (
          !Number.isSafeInteger(contribution) ||
          value > Number.MAX_SAFE_INTEGER - contribution
        ) {
          safe = false;
        } else {
          value += contribution;
        }
      }
      position += 1;
      if ((current & 0x80) === 0) {
        return {
          end: position,
          safe: safe,
          value: safe ? value : null
        };
      }
      shift += 7;
    }
    return null;
  }

  function encodeVarint(value) {
    var output = [];
    var current = value;

    if (!Number.isSafeInteger(current) || current < 0) {
      throw new Error("Cannot encode invalid varint");
    }
    do {
      if (current >= 128) {
        output.push((current % 128) | 0x80);
        current = Math.floor(current / 128);
      } else {
        output.push(current);
        current = 0;
      }
    } while (current > 0);
    return new Uint8Array(output);
  }

  function concatBytes(chunks, totalLength) {
    var output;
    var offset = 0;
    var index;
    var chunk;

    if (typeof totalLength !== "number") {
      totalLength = 0;
      for (index = 0; index < chunks.length; index += 1) {
        totalLength += chunks[index].length;
      }
    }
    output = new Uint8Array(totalLength);
    for (index = 0; index < chunks.length; index += 1) {
      chunk = chunks[index];
      output.set(chunk, offset);
      offset += chunk.length;
    }
    return output;
  }

  function asciiBytesToString(bytes) {
    var output = "";
    var index;
    var batch = [];

    if (!bytes || bytes.length > MAX_URL_BYTES) {
      return null;
    }
    for (index = 0; index < bytes.length; index += 1) {
      if (bytes[index] > 0x7f || bytes[index] === 0) {
        return null;
      }
      batch.push(bytes[index]);
      if (batch.length === 4096) {
        output += String.fromCharCode.apply(null, batch);
        batch = [];
      }
    }
    if (batch.length > 0) {
      output += String.fromCharCode.apply(null, batch);
    }
    return output;
  }

  function asciiStringToBytes(value) {
    var output = new Uint8Array(value.length);
    var index;
    for (index = 0; index < value.length; index += 1) {
      output[index] = value.charCodeAt(index);
    }
    return output;
  }

  function printableAsciiBytesToString(bytes) {
    var text = asciiBytesToString(bytes);
    var index;
    if (text === null) {
      return null;
    }
    for (index = 0; index < bytes.length; index += 1) {
      if (bytes[index] < 0x20 || bytes[index] > 0x7e) {
        return null;
      }
    }
    return text;
  }

  function manualPrimaryFieldForProto(bytes) {
    var fields = parseProtoFields(bytes);
    var representationId;
    if (!fields) {
      return 0;
    }
    if (
      protoUrlsForField(fields, 1).length === 1 &&
      protoUrlsForField(fields, 2).length > 0
    ) {
      return 1;
    }
    representationId = firstProtoVarint(fields, 1);
    if (
      representationId !== null &&
      protoUrlsForField(fields, 2).length === 1 &&
      protoUrlsForField(fields, 3).length > 0
    ) {
      return 2;
    }
    if (
      protoUrlsForField(fields, 4).length === 1 &&
      protoUrlsForField(fields, 5).length > 0
    ) {
      return 4;
    }
    if (protoUrlsForField(fields, 1).length === 1) {
      return 1;
    }
    if (
      representationId !== null &&
      protoUrlsForField(fields, 2).length === 1
    ) {
      return 2;
    }
    if (protoUrlsForField(fields, 4).length === 1) {
      return 4;
    }
    return 0;
  }

  function transformLengthDelimited(payload, config, depth) {
    var nested;

    if (depth >= MAX_PROTO_DEPTH || payload.length === 0) {
      return { bytes: payload, changed: 0, valid: true };
    }
    nested = transformProtoMessage(payload, config, depth + 1);
    if (nested.valid && nested.changed > 0) {
      return nested;
    }
    return { bytes: payload, changed: 0, valid: true };
  }

  function transformProtoMessage(bytes, config, depth) {
    var offset = 0;
    var chunks = [];
    var changed = 0;
    var tagStart;
    var tag;
    var fieldNumber;
    var wireType;
    var valueInfo;
    var lengthInfo;
    var payloadStart;
    var payloadEnd;
    var payload;
    var transformed;
    var text;
    var rewritten;
    var primaryField = manualPrimaryFieldForProto(bytes);

    if (!bytes || bytes.length === 0) {
      return { bytes: bytes, changed: 0, valid: true };
    }

    while (offset < bytes.length) {
      tagStart = offset;
      tag = readVarint(bytes, offset);
      if (!tag || !tag.safe || tag.value === 0) {
        return { bytes: bytes, changed: 0, valid: false };
      }
      fieldNumber = Math.floor(tag.value / 8);
      wireType = tag.value % 8;
      if (fieldNumber < 1) {
        return { bytes: bytes, changed: 0, valid: false };
      }
      offset = tag.end;

      if (wireType === 0) {
        valueInfo = readVarint(bytes, offset);
        if (!valueInfo) {
          return { bytes: bytes, changed: 0, valid: false };
        }
        offset = valueInfo.end;
        chunks.push(bytes.subarray(tagStart, offset));
      } else if (wireType === 1) {
        if (offset + 8 > bytes.length) {
          return { bytes: bytes, changed: 0, valid: false };
        }
        offset += 8;
        chunks.push(bytes.subarray(tagStart, offset));
      } else if (wireType === 2) {
        lengthInfo = readVarint(bytes, offset);
        if (
          !lengthInfo ||
          !lengthInfo.safe ||
          lengthInfo.value > bytes.length - lengthInfo.end
        ) {
          return { bytes: bytes, changed: 0, valid: false };
        }
        payloadStart = lengthInfo.end;
        payloadEnd = payloadStart + lengthInfo.value;
        payload = bytes.subarray(payloadStart, payloadEnd);
        text =
          payload.length <= MAX_URL_BYTES
            ? printableAsciiBytesToString(payload)
            : null;
        if (
          fieldNumber === primaryField &&
          text &&
          isVodMediaUrl(text)
        ) {
          rewritten = rewriteVodUrl(text, config.cdnHost);
          transformed =
            rewritten !== text
              ? {
                  bytes: asciiStringToBytes(rewritten),
                  changed: 1,
                  valid: true
                }
              : { bytes: payload, changed: 0, valid: true };
        } else {
          transformed = transformLengthDelimited(payload, config, depth);
        }
        if (transformed.changed > 0) {
          chunks.push(bytes.subarray(tagStart, tag.end));
          chunks.push(encodeVarint(transformed.bytes.length));
          chunks.push(transformed.bytes);
          changed += transformed.changed;
        } else {
          chunks.push(bytes.subarray(tagStart, payloadEnd));
        }
        offset = payloadEnd;
      } else if (wireType === 5) {
        if (offset + 4 > bytes.length) {
          return { bytes: bytes, changed: 0, valid: false };
        }
        offset += 4;
        chunks.push(bytes.subarray(tagStart, offset));
      } else {
        return { bytes: bytes, changed: 0, valid: false };
      }
    }
    return {
      bytes: changed > 0 ? concatBytes(chunks) : bytes,
      changed: changed,
      valid: true
    };
  }

  function fixedProtoLayout(fields, cdnHost) {
    var layouts = [
      { backupField: 2, primaryField: 1 },
      { backupField: 3, primaryField: 2, requiresId: true },
      { backupField: 5, primaryField: 4 }
    ];
    var layout;
    var primaryUrls;
    var backupUrls;
    var index;
    var inner;
    var parsed;
    for (index = 0; index < layouts.length; index += 1) {
      layout = layouts[index];
      if (
        layout.requiresId &&
        firstProtoVarint(fields, 1) === null
      ) {
        continue;
      }
      primaryUrls = protoUrlsForField(fields, layout.primaryField);
      backupUrls = protoUrlsForField(fields, layout.backupField);
      if (primaryUrls.length !== 1 || backupUrls.length === 0) {
        continue;
      }
      for (inner = 0; inner < backupUrls.length; inner += 1) {
        parsed = parseHttpUrl(backupUrls[inner]);
        if (parsed && parsed.hostname === cdnHost) {
          return {
            backupField: layout.backupField,
            primaryField: layout.primaryField,
            primaryId: candidateIdForUrl(primaryUrls[0]),
            primaryUrl: primaryUrls[0],
            targetId: candidateIdForUrl(backupUrls[inner]),
            targetUrl: backupUrls[inner]
          };
        }
      }
      parsed = parseHttpUrl(primaryUrls[0]);
      if (parsed && parsed.hostname === cdnHost) {
        return null;
      }
    }
    return null;
  }

  function transformSafeFixedProtoMessage(bytes, config, depth, path) {
    var fields;
    var layout;
    var chunks = [];
    var changed = 0;
    var index;
    var field;
    var nextPayload;
    var nextChanges;
    var nested;
    var fieldId;
    var pathState;
    var childPath;
    path = Array.isArray(path) ? path : [];
    if (!bytes || depth > MAX_PROTO_DEPTH) {
      return { bytes: bytes, changed: 0, valid: false };
    }
    fields = parseProtoFields(bytes);
    if (!fields) {
      return { bytes: bytes, changed: 0, valid: false };
    }
    pathState = protoPathState(config.grpcAdapter, path);
    if (!pathState.prefix) {
      return { bytes: bytes, changed: 0, valid: true };
    }
    layout = pathState.exact
      ? fixedProtoLayout(fields, config.cdnHost)
      : null;
    for (index = 0; index < fields.length; index += 1) {
      field = fields[index];
      nextPayload = null;
      nextChanges = 0;
      if (field.wireType === 2) {
        fieldId = field.text ? candidateIdForUrl(field.text) : null;
        if (
          layout &&
          field.fieldNumber === layout.primaryField &&
          fieldId === layout.primaryId
        ) {
          nextPayload = asciiStringToBytes(layout.targetUrl);
          nextChanges = 1;
        } else if (
          layout &&
          field.fieldNumber === layout.backupField &&
          fieldId === layout.targetId
        ) {
          nextPayload = asciiStringToBytes(layout.primaryUrl);
          nextChanges = 1;
        } else if (!field.text && field.payload.length > 0) {
          childPath = path.concat([field.fieldNumber]);
          if (!protoPathState(config.grpcAdapter, childPath).prefix) {
            chunks.push(bytes.subarray(field.rawStart, field.end));
            continue;
          }
          nested = transformSafeFixedProtoMessage(
            field.payload,
            config,
            depth + 1,
            childPath
          );
          if (nested.valid && nested.changed > 0) {
            nextPayload = nested.bytes;
            nextChanges = nested.changed;
          }
        }
      }
      if (nextPayload) {
        chunks.push(bytes.subarray(field.rawStart, field.tagEnd));
        chunks.push(encodeVarint(nextPayload.length));
        chunks.push(nextPayload);
        changed += nextChanges;
      } else {
        chunks.push(bytes.subarray(field.rawStart, field.end));
      }
    }
    return {
      bytes: changed > 0 ? concatBytes(chunks) : bytes,
      changed: changed,
      valid: true
    };
  }

  function readUint32Be(bytes, offset) {
    return (
      bytes[offset] * 0x1000000 +
      bytes[offset + 1] * 0x10000 +
      bytes[offset + 2] * 0x100 +
      bytes[offset + 3]
    );
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

  function parseGrpcFrames(input) {
    var bytes = toUint8Array(input);
    var frames = [];
    var offset = 0;
    var flag;
    var length;
    var end;
    if (!bytes || bytes.length < 5) {
      return {
        body: bytes || new Uint8Array(),
        frames: frames,
        valid: false
      };
    }
    while (offset < bytes.length) {
      if (offset + 5 > bytes.length) {
        return { body: bytes, frames: [], valid: false };
      }
      flag = bytes[offset];
      length = readUint32Be(bytes, offset + 1);
      end = offset + 5 + length;
      if (
        (flag !== 0 && flag !== 1) ||
        end > bytes.length ||
        end < offset + 5
      ) {
        return { body: bytes, frames: [], valid: false };
      }
      frames.push({
        end: end,
        flag: flag,
        payloadStart: offset + 5,
        start: offset
      });
      offset = end;
    }
    return { body: bytes, frames: frames, valid: true };
  }

  function hasCompressedGrpcFrame(input) {
    var parsed = parseGrpcFrames(input);
    var index;
    if (!parsed.valid) {
      return false;
    }
    for (index = 0; index < parsed.frames.length; index += 1) {
      if (parsed.frames[index].flag === 1) {
        return true;
      }
    }
    return false;
  }

  function decompressGzip(input) {
    var bytes = toUint8Array(input);
    var output;
    var stream;
    var reader;
    var chunks = [];
    var total = 0;

    if (!bytes) {
      return Promise.reject(new Error("invalid gzip input"));
    }
    if (
      typeof $utils !== "undefined" &&
      $utils &&
      typeof $utils.ungzip === "function"
    ) {
      try {
        output = toUint8Array($utils.ungzip(bytes));
        if (
          !output ||
          output.length > MAX_GRPC_DECOMPRESSED_BYTES
        ) {
          throw new Error("decompressed gRPC message is too large");
        }
        return Promise.resolve(output);
      } catch (error) {
        return Promise.reject(error);
      }
    }
    if (
      typeof DecompressionStream !== "function" ||
      typeof ReadableStream !== "function"
    ) {
      return Promise.reject(
        new Error("gzip decompression is unavailable")
      );
    }
    try {
      stream = new ReadableStream({
        start: function (controller) {
          controller.enqueue(bytes);
          controller.close();
        }
      }).pipeThrough(new DecompressionStream("gzip"));
      reader = stream.getReader();
    } catch (error) {
      return Promise.reject(error);
    }

    function readNext() {
      return reader.read().then(function (entry) {
        var chunk;
        if (entry.done) {
          return concatBytes(chunks);
        }
        chunk = toUint8Array(entry.value);
        if (!chunk) {
          throw new Error("invalid decompressed gRPC chunk");
        }
        total += chunk.length;
        if (total > MAX_GRPC_DECOMPRESSED_BYTES) {
          try {
            reader.cancel();
          } catch (error) {
            // The size guard is authoritative even if cancellation fails.
          }
          throw new Error("decompressed gRPC message is too large");
        }
        chunks.push(chunk);
        return readNext();
      });
    }

    return readNext();
  }

  function grpcEncodingFromHeaders(headers) {
    var keys;
    var index;
    if (!isObject(headers) || Array.isArray(headers)) {
      return "";
    }
    keys = Object.keys(headers);
    for (index = 0; index < keys.length; index += 1) {
      if (String(keys[index]).toLowerCase() === "grpc-encoding") {
        return String(headers[keys[index]] || "").trim().toLowerCase();
      }
    }
    return "";
  }

  function hasGzipMagic(bytes) {
    return Boolean(
      bytes &&
        bytes.length >= 2 &&
        bytes[0] === 0x1f &&
        bytes[1] === 0x8b
    );
  }

  function decompressGrpcFrames(input, grpcEncoding) {
    var parsed = parseGrpcFrames(input);
    var original = parsed.body;
    var total = 0;
    var tasks;
    var encoding =
      typeof grpcEncoding === "string"
        ? grpcEncoding.trim().toLowerCase()
        : "";
    var compressedFrames;
    if (!parsed.valid) {
      return Promise.resolve({
        body: original,
        changed: false,
        reason: "invalid-framing",
        valid: false
      });
    }
    if (!hasCompressedGrpcFrame(original)) {
      return Promise.resolve({
        body: original,
        changed: false,
        reason: "not-compressed",
        valid: true
      });
    }
    if (encoding && encoding !== "gzip" && encoding !== "x-gzip") {
      return Promise.resolve({
        body: original,
        changed: false,
        reason: "unsupported-grpc-encoding",
        valid: false
      });
    }
    compressedFrames = parsed.frames.filter(function (frame) {
      return frame.flag === 1;
    });
    if (
      compressedFrames.some(function (frame) {
        return !hasGzipMagic(original.slice(frame.payloadStart, frame.end));
      })
    ) {
      return Promise.resolve({
        body: original,
        changed: false,
        reason: "compression-mismatch",
        valid: false
      });
    }
    tasks = parsed.frames.map(function (frame) {
      var payload = original.slice(frame.payloadStart, frame.end);
      return (
        frame.flag === 1
          ? decompressGzip(payload)
          : Promise.resolve(payload)
      ).then(function (decoded) {
        total += decoded.length;
        if (total > MAX_GRPC_DECOMPRESSED_BYTES) {
          throw new Error("decompressed gRPC response is too large");
        }
        return decoded;
      });
    });
    return Promise.all(tasks).then(
      function (payloads) {
        var chunks = [];
        var index;
        for (index = 0; index < payloads.length; index += 1) {
          chunks.push(grpcHeader(0, payloads[index].length));
          chunks.push(payloads[index]);
        }
        return {
          body: concatBytes(chunks),
          changed: true,
          reason: "gzip-decoded",
          valid: true
        };
      },
      function () {
        return {
          body: original,
          changed: false,
          reason: "gzip-decode-failed",
          valid: false
        };
      }
    );
  }

  function transformGrpcBody(input, config) {
    var bytes = toUint8Array(input);
    var offset = 0;
    var chunks = [];
    var changed = 0;
    var frames = 0;
    var flag;
    var length;
    var frameEnd;
    var payload;
    var transformed;
    var raw;

    if (!bytes || !config || !config.valid || !config.cdnHost) {
      return {
        body: bytes || input,
        changed: 0,
        valid: Boolean(bytes && config && config.valid)
      };
    }

    while (offset + 5 <= bytes.length) {
      flag = bytes[offset];
      length = readUint32Be(bytes, offset + 1);
      frameEnd = offset + 5 + length;
      if ((flag !== 0 && flag !== 1) || frameEnd > bytes.length) {
        frames = 0;
        break;
      }
      frames += 1;
      payload = bytes.subarray(offset + 5, frameEnd);
      transformed =
        flag === 0
          ? transformSafeFixedProtoMessage(payload, config, 0, [])
          : { bytes: payload, changed: 0, valid: true };

      if (!transformed.valid) {
        return { body: bytes, changed: 0, valid: false };
      }
      if (transformed.changed > 0) {
        chunks.push(grpcHeader(flag, transformed.bytes.length));
        chunks.push(transformed.bytes);
        changed += transformed.changed;
      } else {
        chunks.push(bytes.subarray(offset, frameEnd));
      }
      offset = frameEnd;
    }

    if (frames > 0 && offset === bytes.length) {
      return {
        body: changed > 0 ? concatBytes(chunks) : bytes,
        changed: changed,
        valid: true
      };
    }
    if (bytes.length >= 5 && (bytes[0] === 0 || bytes[0] === 1)) {
      return { body: bytes, changed: 0, valid: false };
    }

    raw = transformSafeFixedProtoMessage(bytes, config, 0, []);
    return {
      body: raw.changed > 0 ? raw.bytes : bytes,
      changed: raw.changed,
      valid: raw.valid
    };
  }

  function imul32(left, right) {
    var leftHigh;
    var leftLow;
    var rightHigh;
    var rightLow;

    if (typeof Math.imul === "function") {
      return Math.imul(left, right);
    }
    leftHigh = (left >>> 16) & 0xffff;
    leftLow = left & 0xffff;
    rightHigh = (right >>> 16) & 0xffff;
    rightLow = right & 0xffff;
    return (
      (leftLow * rightLow +
        (((leftHigh * rightLow + leftLow * rightHigh) & 0xffff) << 16)) |
      0
    );
  }

  function hex32(value) {
    return ("00000000" + (value >>> 0).toString(16)).slice(-8);
  }

  function stableHash(prefix, value) {
    var text = String(value);
    var hashes = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35];
    var primes = [0x01000193, 0x27d4eb2d, 0x165667b1, 0x1b873593];
    var index;
    var lane;
    var code;

    for (index = 0; index < text.length; index += 1) {
      code = text.charCodeAt(index);
      for (lane = 0; lane < hashes.length; lane += 1) {
        hashes[lane] ^= code + lane * 257;
        hashes[lane] = imul32(hashes[lane], primes[lane]);
        hashes[lane] ^= hashes[lane] >>> 13;
      }
    }
    return (
      prefix +
      "2_" +
      hex32(hashes[0]) +
      hex32(hashes[1]) +
      hex32(hashes[2]) +
      hex32(hashes[3])
    );
  }

  function queryFreeCandidateFingerprint(url) {
    var parsed = parseHttpUrl(url);
    if (!parsed || !isVodMediaUrl(url)) {
      return null;
    }
    return (
      parsed.scheme +
      "://" +
      parsed.authority.toLowerCase() +
      parsed.path
    );
  }

  function candidateIdForUrl(url) {
    var parsed = parseHttpUrl(url);
    if (!parsed || !isVodMediaUrl(url)) {
      return null;
    }
    return stableHash(
      "c",
      parsed.scheme + "://" + parsed.authority.toLowerCase()
    );
  }

  function candidateFamilyForUrl(url) {
    var parsed = parseHttpUrl(url);
    var hostname;
    if (!parsed) {
      return "invalid";
    }
    hostname = parsed.hostname;
    if (hostnameMatchesSuffix(hostname, "mcdn.bilivideo.cn")) {
      return "mcdn";
    }
    if (
      hostname.indexOf("pcdn") !== -1 ||
      hostnameMatchesSuffix(hostname, "onethingpcs.com")
    ) {
      return "pcdn";
    }
    return "standard";
  }

  function stableScalar(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
    if (typeof value === "boolean") {
      return value ? "1" : "0";
    }
    if (typeof value === "string" && value.length <= 128) {
      return value;
    }
    return "";
  }

  function jsonMetadataSignature(value) {
    var output = [];
    var index;
    var key;
    var scalar;

    for (index = 0; index < JSON_METADATA_KEYS.length; index += 1) {
      key = JSON_METADATA_KEYS[index];
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        scalar = stableScalar(value[key]);
        if (scalar !== "") {
          output.push(key + "=" + scalar);
        }
      }
    }
    return output.join("&");
  }

  function buildMediaDescriptor(format, kind, primaryUrl, backupUrls, metadata) {
    var primaryParsed = parseHttpUrl(primaryUrl);
    var primaryFamily = candidateFamilyForUrl(primaryUrl);
    var candidates = [];
    var candidateById = {};
    var candidateIds = [];
    var index;
    var url;
    var candidateId;
    var sortedIds;
    var candidateSetHash;
    var resourceMaterial;
    var reusableRepresentation;

    if (!primaryParsed || !isVodMediaUrl(primaryUrl)) {
      return null;
    }
    candidates.push({ id: candidateIdForUrl(primaryUrl), url: primaryUrl });
    candidateById[candidates[0].id] = primaryUrl;
    candidateIds.push(candidates[0].id);

    for (index = 0; index < backupUrls.length; index += 1) {
      url = backupUrls[index];
      candidateId = candidateIdForUrl(url);
      if (
        candidateId &&
        candidateFamilyForUrl(url) === primaryFamily &&
        !candidateById[candidateId]
      ) {
        candidateById[candidateId] = url;
        candidateIds.push(candidateId);
        candidates.push({ id: candidateId, url: url });
      }
    }
    if (candidates.length < 2) {
      return null;
    }

    sortedIds = candidateIds.slice().sort();
    candidateSetHash = stableHash("s", sortedIds.join("|"));
    /*
     * A representation signature is not a media-object identity. Reusing a
     * selected host across two videos that happen to share quality/codec can
     * route the next signed object through a candidate that was never
     * validated for it. Always bind learned state to the exact query-free
     * media path while still including representation metadata.
     */
    reusableRepresentation = false;
    resourceMaterial = [
      format,
      kind || "unknown",
      primaryFamily,
      "object:" + primaryParsed.path,
      metadata || "",
      candidateSetHash
    ].join("\u0000");

    return {
      candidateById: candidateById,
      candidateIds: candidateIds,
      candidates: candidates,
      candidateSetHash: candidateSetHash,
      family: primaryFamily,
      format: format,
      keyMaterial: resourceMaterial,
      kind: kind || "unknown",
      primaryId: candidates[0].id,
      primaryUrl: primaryUrl,
      reusableRepresentation: reusableRepresentation
    };
  }

  function descriptorResourceKey(descriptor, config) {
    return stableHash(
      "r",
      normalizeNetworkProfile(config && config.networkProfile) +
        "\u0000" +
        descriptor.keyMaterial
    );
  }

  function selectedUrlForDescriptor(descriptor, config, state, now) {
    var key = descriptorResourceKey(descriptor, config);
    var entry = state.entries[key];
    var selectedUrl;

    descriptor.resourceKey = key;
    if (
      !entry ||
      entry.candidateSetHash !== descriptor.candidateSetHash ||
      !entry.candidateId ||
      entry.candidateId === descriptor.primaryId ||
      entry.expiresAt <= now ||
      entry.validatedAt <= 0
    ) {
      return null;
    }
    selectedUrl = descriptor.candidateById[entry.candidateId];
    return selectedUrl || null;
  }

  function arrayOfVodUrls(value) {
    var output = [];
    var index;
    if (!Array.isArray(value)) {
      return output;
    }
    for (index = 0; index < value.length; index += 1) {
      if (typeof value[index] === "string" && isVodMediaUrl(value[index])) {
        output.push(value[index]);
      }
    }
    return output;
  }

  function intersectBackupLists(lists) {
    var output;
    var allowed;
    var index;
    var inner;
    var candidateId;

    if (lists.length === 0) {
      return [];
    }
    output = lists[0].slice();
    for (index = 1; index < lists.length; index += 1) {
      allowed = {};
      for (inner = 0; inner < lists[index].length; inner += 1) {
        candidateId = candidateIdForUrl(lists[index][inner]);
        if (candidateId) {
          allowed[candidateId] = true;
        }
      }
      output = output.filter(function (url) {
        return Boolean(allowed[candidateIdForUrl(url)]);
      });
    }
    return output;
  }

  function detectJsonMediaObject(value, kind, config, state, now) {
    var lanes = jsonAliasLanes(value);
    var backupLists = [];
    var index;
    var descriptor;
    var selectedUrl;
    var selectedId;
    var changed = 0;

    if (!lanes) {
      return null;
    }
    for (index = 0; index < lanes.length; index += 1) {
      backupLists.push(lanes[index].backups);
    }

    descriptor = buildMediaDescriptor(
      "json",
      kind,
      lanes[0].primaryUrl,
      intersectBackupLists(backupLists),
      jsonMetadataSignature(value)
    );
    if (!descriptor) {
      return null;
    }
    descriptor.resourceKey = descriptorResourceKey(descriptor, config);
    selectedUrl = selectedUrlForDescriptor(
      descriptor,
      config,
      state,
      now
    );
    descriptor.selectedUrl = selectedUrl;

    if (!selectedUrl) {
      return { changed: 0, descriptor: descriptor };
    }
    selectedId = candidateIdForUrl(selectedUrl);
    for (index = 0; index < lanes.length; index += 1) {
      if (!laneUrlForCandidate(lanes[index], selectedId)) {
        return { changed: 0, descriptor: descriptor };
      }
    }
    for (index = 0; index < lanes.length; index += 1) {
      changed += rotateJsonAliasLane(value, lanes[index], selectedId);
    }
    return { changed: changed, descriptor: descriptor };
  }

  function jsonChildKind(key, currentKind) {
    var lower = String(key || "").toLowerCase();
    if (
      lower === "video" ||
      lower === "videos" ||
      lower === "dash_video"
    ) {
      return "video";
    }
    if (
      lower === "audio" ||
      lower === "audios" ||
      lower === "dash_audio" ||
      lower === "dolby" ||
      lower === "flac"
    ) {
      return "audio";
    }
    if (
      lower === "durl" ||
      lower === "segment" ||
      lower === "segments"
    ) {
      return "segment";
    }
    return currentKind || "unknown";
  }

  function walkSafeJson(value, kind, config, state, now, descriptors, depth) {
    var detected;
    var keys;
    var index;
    var key;
    var changed = 0;

    if (depth > MAX_JSON_DEPTH || value === null) {
      return 0;
    }
    if (Array.isArray(value)) {
      for (index = 0; index < value.length; index += 1) {
        changed += walkSafeJson(
          value[index],
          kind,
          config,
          state,
          now,
          descriptors,
          depth + 1
        );
      }
      return changed;
    }
    if (!isObject(value)) {
      return 0;
    }

    detected = detectJsonMediaObject(value, kind, config, state, now);
    if (detected) {
      descriptors.push(detected.descriptor);
      changed += detected.changed;
    }

    keys = Object.keys(value);
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      if (!PRIMARY_URL_KEYS[key] && !BACKUP_URL_KEYS[key]) {
        changed += walkSafeJson(
          value[key],
          jsonChildKind(key, kind),
          config,
          state,
          now,
          descriptors,
          depth + 1
        );
      }
    }
    return changed;
  }

  function prepareSafeJson(text, config, state, now) {
    var input = typeof text === "string" ? text : "";
    var parsed;
    var descriptors = [];
    var changed;

    if (!input) {
      return { body: input, changed: 0, descriptors: descriptors, valid: true };
    }
    try {
      parsed = JSON.parse(input.replace(/^\uFEFF/, ""));
    } catch (error) {
      return { body: input, changed: 0, descriptors: descriptors, valid: false };
    }

    changed = walkSafeJson(
      parsed,
      "unknown",
      config,
      state,
      now,
      descriptors,
      0
    );
    return {
      body: changed > 0 ? JSON.stringify(parsed) : input,
      changed: changed,
      descriptors: descriptors,
      valid: true
    };
  }

  function createEmptyAutoState() {
    return {
      entries: {},
      lastProbeAt: 0,
      lockTokens: {},
      locks: {},
      resetToken: "",
      version: 5
    };
  }

  function boundedInteger(value, fallback, minimum, maximum) {
    return Math.floor(boundedNumber(value, fallback, minimum, maximum));
  }

  function median(values) {
    var sorted;
    var middle;
    if (!Array.isArray(values) || values.length === 0) {
      return 0;
    }
    sorted = values.slice().sort(function (left, right) {
      return left - right;
    });
    middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
  }

  function summarizeProbeSamples(samples) {
    var successful = samples.filter(function (sample) {
      return sample.ok;
    });
    var elapsed = successful.map(function (sample) {
      return sample.elapsedMs;
    });
    var throughput = successful.map(function (sample) {
      return sample.throughputKbps;
    });
    var medianMs = median(elapsed);
    var deviations = elapsed.map(function (value) {
      return Math.abs(value - medianMs);
    });
    return {
      failureRate: samples.length === 0
        ? 0
        : (samples.length - successful.length) / samples.length,
      jitterMs: median(deviations),
      medianMs: medianMs,
      medianThroughputKbps: median(throughput),
      sampleCount: samples.length,
      successCount: successful.length
    };
  }

  function sanitizeProbeSample(value) {
    if (!isObject(value) || Array.isArray(value)) {
      return null;
    }
    return {
      at: boundedNumber(value.at, 0, 0, 9e15),
      elapsedMs: boundedNumber(value.elapsedMs, 0, 0, 60000),
      ok: Boolean(value.ok),
      reason:
        typeof value.reason === "string"
          ? value.reason.slice(0, 48)
          : "",
      status: boundedInteger(value.status, 0, 0, 999),
      throughputKbps: boundedNumber(
        value.throughputKbps,
        0,
        0,
        100000000
      )
    };
  }

  function sanitizeScoreMap(value) {
    var output = {};
    var keys;
    var index;
    var key;
    var score;
    var samples;
    var sample;
    var inner;

    if (!isObject(value) || Array.isArray(value)) {
      return output;
    }
    keys = Object.keys(value).slice(0, 12);
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      score = value[key];
      if (
        /^c2_[0-9a-f]{32}$/.test(key) &&
        isObject(score) &&
        !Array.isArray(score)
      ) {
        samples = [];
        if (Array.isArray(score.samples)) {
          for (
            inner = Math.max(
              0,
              score.samples.length - AUTO_SCORE_SAMPLE_LIMIT
            );
            inner < score.samples.length;
            inner += 1
          ) {
            sample = sanitizeProbeSample(score.samples[inner]);
            if (sample) {
              samples.push(sample);
            }
          }
        } else {
          sample = sanitizeProbeSample(score);
          if (sample) {
            samples.push(sample);
          }
        }
        output[key] = {
          metrics: summarizeProbeSamples(samples),
          samples: samples
        };
      }
    }
    return output;
  }

  function sanitizeAutoEntry(value) {
    var entry = {
      candidateCursor: 0,
      candidateId: null,
      candidateSetHash: null,
      expiresAt: 0,
      failureCount: 0,
      lastFailureAt: 0,
      lastUsedAt: 0,
      nextProbeAt: 0,
      pendingCandidateId: null,
      pendingSince: 0,
      pendingSuccesses: 0,
      scores: {},
      selectedAt: 0,
      successCount: 0,
      validatedAt: 0
    };

    if (!isObject(value) || Array.isArray(value)) {
      return entry;
    }
    if (/^c2_[0-9a-f]{32}$/.test(value.candidateId || "")) {
      entry.candidateId = value.candidateId;
    }
    if (/^s2_[0-9a-f]{32}$/.test(value.candidateSetHash || "")) {
      entry.candidateSetHash = value.candidateSetHash;
    }
    if (/^c2_[0-9a-f]{32}$/.test(value.pendingCandidateId || "")) {
      entry.pendingCandidateId = value.pendingCandidateId;
    }
    entry.candidateCursor = boundedInteger(
      value.candidateCursor,
      0,
      0,
      1000000
    );
    entry.expiresAt = boundedNumber(value.expiresAt, 0, 0, 9e15);
    entry.failureCount = boundedInteger(value.failureCount, 0, 0, 1000000);
    entry.lastFailureAt = boundedNumber(value.lastFailureAt, 0, 0, 9e15);
    entry.lastUsedAt = boundedNumber(value.lastUsedAt, 0, 0, 9e15);
    entry.nextProbeAt = boundedNumber(value.nextProbeAt, 0, 0, 9e15);
    entry.pendingSince = boundedNumber(value.pendingSince, 0, 0, 9e15);
    entry.pendingSuccesses = boundedInteger(
      value.pendingSuccesses,
      0,
      0,
      2
    );
    entry.scores = sanitizeScoreMap(value.scores);
    entry.selectedAt = boundedNumber(value.selectedAt, 0, 0, 9e15);
    entry.successCount = boundedInteger(value.successCount, 0, 0, 1000000);
    entry.validatedAt = boundedNumber(value.validatedAt, 0, 0, 9e15);
    return entry;
  }

  function loadAutoState(services) {
    var state = createEmptyAutoState();
    var raw;
    var parsed;
    var keys;
    var index;
    var key;
    var lockUntil;
    var lockToken;

    try {
      raw = services.read(AUTO_STATE_KEY);
      parsed = raw ? JSON.parse(raw) : null;
    } catch (error) {
      parsed = null;
    }
    if (!isObject(parsed) || parsed.version !== 5) {
      return state;
    }

    state.lastProbeAt = boundedNumber(parsed.lastProbeAt, 0, 0, 9e15);
    state.resetToken = normalizeResetToken(parsed.resetToken);
    if (isObject(parsed.entries) && !Array.isArray(parsed.entries)) {
      keys = Object.keys(parsed.entries).slice(0, AUTO_CACHE_CAPACITY * 2);
      for (index = 0; index < keys.length; index += 1) {
        key = keys[index];
        if (/^r2_[0-9a-f]{32}$/.test(key)) {
          state.entries[key] = sanitizeAutoEntry(parsed.entries[key]);
        }
      }
    }
    if (isObject(parsed.locks) && !Array.isArray(parsed.locks)) {
      keys = Object.keys(parsed.locks).slice(0, AUTO_CACHE_CAPACITY * 2);
      for (index = 0; index < keys.length; index += 1) {
        key = keys[index];
        lockUntil = boundedNumber(parsed.locks[key], 0, 0, 9e15);
        if (/^r2_[0-9a-f]{32}$/.test(key) && lockUntil > 0) {
          state.locks[key] = lockUntil;
          if (
            isObject(parsed.lockTokens) &&
            !Array.isArray(parsed.lockTokens)
          ) {
            lockToken =
              typeof parsed.lockTokens[key] === "string"
                ? parsed.lockTokens[key]
                : "";
            if (/^l2_[0-9a-f]{32}$/.test(lockToken)) {
              state.lockTokens[key] = lockToken;
            }
          }
        }
      }
    }
    pruneAutoState(state, 0);
    return state;
  }

  function pruneAutoState(state, now) {
    var keys = Object.keys(state.entries);
    var lockKeys = Object.keys(state.locks);
    var removeCount;
    var index;

    for (index = 0; index < lockKeys.length; index += 1) {
      if (state.locks[lockKeys[index]] <= now) {
        delete state.locks[lockKeys[index]];
        delete state.lockTokens[lockKeys[index]];
      }
    }
    if (keys.length <= AUTO_CACHE_CAPACITY) {
      return;
    }
    keys.sort(function (left, right) {
      return (
        (state.entries[left].lastUsedAt || 0) -
        (state.entries[right].lastUsedAt || 0)
      );
    });
    removeCount = keys.length - AUTO_CACHE_CAPACITY;
    for (index = 0; index < removeCount; index += 1) {
      delete state.entries[keys[index]];
      delete state.locks[keys[index]];
      delete state.lockTokens[keys[index]];
    }
  }

  function saveAutoState(services, state, now) {
    try {
      pruneAutoState(state, now);
      return Boolean(
        services.write(JSON.stringify(state), AUTO_STATE_KEY)
      );
    } catch (error) {
      return false;
    }
  }

  function resetAutoEntryForDescriptor(entry, descriptor) {
    entry.candidateId = null;
    entry.candidateSetHash = descriptor.candidateSetHash;
    entry.expiresAt = 0;
    entry.failureCount = 0;
    entry.lastFailureAt = 0;
    entry.nextProbeAt = 0;
    entry.pendingCandidateId = null;
    entry.pendingSince = 0;
    entry.pendingSuccesses = 0;
    entry.scores = {};
    entry.selectedAt = 0;
    entry.successCount = 0;
    entry.validatedAt = 0;
  }

  function ttlForConfig(config) {
    return (
      boundedNumber(
        config && config.intervalHours,
        DEFAULT_AUTO_INTERVAL_HOURS,
        RUNTIME_OPTION_LIMITS.intervalHours.minimum,
        RUNTIME_OPTION_LIMITS.intervalHours.maximum
      ) *
      60 *
      60 *
      1000
    );
  }

  function applyResetToken(services, state, config, now) {
    var token = normalizeResetToken(config && config.resetToken);
    var reset;
    if (!token || state.resetToken === token) {
      return state;
    }
    reset = createEmptyAutoState();
    reset.resetToken = token;
    saveAutoState(services, reset, now);
    return reset;
  }

  function hasStateServices(services) {
    return Boolean(
      services &&
        services.persistent !== false &&
        typeof services.now === "function" &&
        typeof services.read === "function" &&
        typeof services.write === "function"
    );
  }

  function hasSafeServices(services) {
    return Boolean(
      hasStateServices(services) && typeof services.probe === "function"
    );
  }

  function findProbeDescriptor(descriptors, state, now) {
    var index;
    var descriptor;
    var entry;

    if (state.lastProbeAt + AUTO_GLOBAL_PROBE_GAP_MS > now) {
      return null;
    }
    for (index = 0; index < descriptors.length; index += 1) {
      descriptor = descriptors[index];
      if (!descriptor || descriptor.candidates.length < 2) {
        continue;
      }
      if (state.locks[descriptor.resourceKey] > now) {
        continue;
      }
      entry = state.entries[descriptor.resourceKey];
      if (
        !entry ||
        entry.candidateSetHash !== descriptor.candidateSetHash ||
        entry.nextProbeAt <= now
      ) {
        return descriptor;
      }
    }
    return null;
  }

  function chooseAlternativeCandidate(descriptor, entry) {
    var backupCandidates = descriptor.candidates.slice(1);
    var index;

    if (entry.candidateId) {
      for (index = 0; index < backupCandidates.length; index += 1) {
        if (backupCandidates[index].id === entry.candidateId) {
          return backupCandidates[index];
        }
      }
    }
    if (entry.pendingCandidateId) {
      for (index = 0; index < backupCandidates.length; index += 1) {
        if (backupCandidates[index].id === entry.pendingCandidateId) {
          return backupCandidates[index];
        }
      }
    }
    return backupCandidates[
      entry.candidateCursor % backupCandidates.length
    ];
  }

  function parseProtoFields(bytes) {
    var fields = [];
    var offset = 0;
    var tagStart;
    var tag;
    var fieldNumber;
    var wireType;
    var valueInfo;
    var lengthInfo;
    var payloadStart;
    var payloadEnd;
    var payload;
    var text;

    if (!bytes || bytes.length === 0) {
      return fields;
    }
    while (offset < bytes.length) {
      tagStart = offset;
      tag = readVarint(bytes, offset);
      if (!tag || !tag.safe || tag.value === 0) {
        return null;
      }
      fieldNumber = Math.floor(tag.value / 8);
      wireType = tag.value % 8;
      if (fieldNumber < 1 || fieldNumber > 536870911) {
        return null;
      }
      offset = tag.end;

      if (wireType === 0) {
        valueInfo = readVarint(bytes, offset);
        if (!valueInfo) {
          return null;
        }
        offset = valueInfo.end;
        fields.push({
          end: offset,
          fieldNumber: fieldNumber,
          rawStart: tagStart,
          tagEnd: tag.end,
          value: valueInfo.safe ? valueInfo.value : null,
          valueSafe: valueInfo.safe,
          wireType: wireType
        });
      } else if (wireType === 1) {
        if (offset + 8 > bytes.length) {
          return null;
        }
        offset += 8;
        fields.push({
          end: offset,
          fieldNumber: fieldNumber,
          rawStart: tagStart,
          tagEnd: tag.end,
          wireType: wireType
        });
      } else if (wireType === 2) {
        lengthInfo = readVarint(bytes, offset);
        if (
          !lengthInfo ||
          !lengthInfo.safe ||
          lengthInfo.value > bytes.length - lengthInfo.end
        ) {
          return null;
        }
        payloadStart = lengthInfo.end;
        payloadEnd = payloadStart + lengthInfo.value;
        payload = bytes.subarray(payloadStart, payloadEnd);
        text =
          payload.length <= MAX_URL_BYTES
            ? printableAsciiBytesToString(payload)
            : null;
        fields.push({
          end: payloadEnd,
          fieldNumber: fieldNumber,
          payload: payload,
          rawStart: tagStart,
          tagEnd: tag.end,
          text: text,
          wireType: wireType
        });
        offset = payloadEnd;
      } else if (wireType === 5) {
        if (offset + 4 > bytes.length) {
          return null;
        }
        offset += 4;
        fields.push({
          end: offset,
          fieldNumber: fieldNumber,
          rawStart: tagStart,
          tagEnd: tag.end,
          wireType: wireType
        });
      } else {
        return null;
      }
    }
    return fields;
  }

  function protoUrlsForField(fields, fieldNumber) {
    var output = [];
    var index;
    for (index = 0; index < fields.length; index += 1) {
      if (
        fields[index].fieldNumber === fieldNumber &&
        fields[index].wireType === 2 &&
        fields[index].text &&
        isVodMediaUrl(fields[index].text)
      ) {
        output.push(fields[index].text);
      }
    }
    return output;
  }

  function firstProtoVarint(fields, fieldNumber) {
    var index;
    for (index = 0; index < fields.length; index += 1) {
      if (
        fields[index].fieldNumber === fieldNumber &&
        fields[index].wireType === 0 &&
        fields[index].valueSafe !== false
      ) {
        return fields[index].value;
      }
    }
    return null;
  }

  function detectProtoMedia(fields, config, state, now) {
    var primaryUrls;
    var backupUrls;
    var primaryField;
    var backupField;
    var kind;
    var representationId;
    var stableMetadata = "";
    var descriptor;

    primaryUrls = protoUrlsForField(fields, 1);
    backupUrls = protoUrlsForField(fields, 2);
    if (primaryUrls.length === 1 && backupUrls.length > 0) {
      primaryField = 1;
      backupField = 2;
      kind = "video";
    } else {
      primaryUrls = protoUrlsForField(fields, 2);
      backupUrls = protoUrlsForField(fields, 3);
      representationId = firstProtoVarint(fields, 1);
      if (
        representationId !== null &&
        primaryUrls.length === 1 &&
        backupUrls.length > 0
      ) {
        primaryField = 2;
        backupField = 3;
        if (representationId >= 30000) {
          kind = "audio";
        } else if (representationId <= 200) {
          kind = "video";
        } else {
          kind = "unknown";
        }
        if (kind === "video" || kind === "audio") {
          stableMetadata = "representation=" + representationId;
        }
      } else {
        primaryUrls = protoUrlsForField(fields, 4);
        backupUrls = protoUrlsForField(fields, 5);
        if (primaryUrls.length === 1 && backupUrls.length > 0) {
          primaryField = 4;
          backupField = 5;
          kind = "segment";
        } else {
          return null;
        }
      }
    }

    descriptor = buildMediaDescriptor(
      "proto",
      kind,
      primaryUrls[0],
      backupUrls,
      stableMetadata
    );
    if (!descriptor) {
      return null;
    }
    descriptor.backupField = backupField;
    descriptor.primaryField = primaryField;
    descriptor.resourceKey = descriptorResourceKey(descriptor, config);
    descriptor.selectedUrl = selectedUrlForDescriptor(
      descriptor,
      config,
      state,
      now
    );
    return descriptor;
  }

  function transformDirectProtoField(field, descriptor) {
    var fieldId;
    var selectedId;

    if (
      !descriptor ||
      !descriptor.selectedUrl ||
      field.wireType !== 2 ||
      !field.text
    ) {
      return null;
    }
    fieldId = candidateIdForUrl(field.text);
    selectedId = candidateIdForUrl(descriptor.selectedUrl);
    if (
      field.fieldNumber === descriptor.primaryField &&
      fieldId === descriptor.primaryId
    ) {
      return asciiStringToBytes(descriptor.selectedUrl);
    }
    if (
      field.fieldNumber === descriptor.backupField &&
      fieldId === selectedId
    ) {
      return asciiStringToBytes(descriptor.primaryUrl);
    }
    return null;
  }

  function walkSafeProtoMessage(
    bytes,
    config,
    state,
    now,
    descriptors,
    depth,
    path
  ) {
    var fields;
    var descriptor;
    var chunks = [];
    var changed = 0;
    var index;
    var field;
    var directPayload;
    var nested;
    var nextPayload;
    var nextChanges;
    var childPath;
    var pathState;
    path = Array.isArray(path) ? path : [];

    if (!bytes || depth > MAX_PROTO_DEPTH) {
      return { bytes: bytes, changed: 0, valid: false };
    }
    fields = parseProtoFields(bytes);
    if (!fields) {
      return { bytes: bytes, changed: 0, valid: false };
    }

    pathState = protoPathState(config.grpcAdapter, path);
    if (!pathState.prefix) {
      return { bytes: bytes, changed: 0, valid: true };
    }
    descriptor = pathState.exact
      ? detectProtoMedia(fields, config, state, now)
      : null;
    if (descriptor) {
      descriptors.push(descriptor);
    }
    for (index = 0; index < fields.length; index += 1) {
      field = fields[index];
      nextPayload = null;
      nextChanges = 0;

      if (field.wireType === 2) {
        directPayload = transformDirectProtoField(field, descriptor);
        if (directPayload) {
          nextPayload = directPayload;
          nextChanges = 1;
        } else if (
          !field.text &&
          depth < MAX_PROTO_DEPTH &&
          field.payload.length > 0
        ) {
          childPath = path.concat([field.fieldNumber]);
          if (!protoPathState(config.grpcAdapter, childPath).prefix) {
            chunks.push(bytes.subarray(field.rawStart, field.end));
            continue;
          }
          nested = walkSafeProtoMessage(
            field.payload,
            config,
            state,
            now,
            descriptors,
            depth + 1,
            childPath
          );
          if (nested.valid && nested.changed > 0) {
            nextPayload = nested.bytes;
            nextChanges = nested.changed;
          }
        }
      }

      if (nextPayload) {
        chunks.push(bytes.subarray(field.rawStart, field.tagEnd));
        chunks.push(encodeVarint(nextPayload.length));
        chunks.push(nextPayload);
        changed += nextChanges;
      } else {
        chunks.push(bytes.subarray(field.rawStart, field.end));
      }
    }
    return {
      bytes: changed > 0 ? concatBytes(chunks) : bytes,
      changed: changed,
      valid: true
    };
  }

  function prepareSafeGrpc(input, config, state, now) {
    var bytes = toUint8Array(input);
    var descriptors = [];
    var offset = 0;
    var chunks = [];
    var changed = 0;
    var frames = 0;
    var flag;
    var length;
    var frameEnd;
    var transformed;

    if (!bytes) {
      return {
        body: input,
        changed: 0,
        descriptors: descriptors,
        valid: false
      };
    }

    while (offset + 5 <= bytes.length) {
      flag = bytes[offset];
      length = readUint32Be(bytes, offset + 1);
      frameEnd = offset + 5 + length;
      if ((flag !== 0 && flag !== 1) || frameEnd > bytes.length) {
        frames = 0;
        break;
      }
      frames += 1;
      if (flag === 0) {
        transformed = walkSafeProtoMessage(
          bytes.subarray(offset + 5, frameEnd),
          config,
          state,
          now,
          descriptors,
          0,
          []
        );
        if (!transformed.valid) {
          return {
            body: bytes,
            changed: 0,
            descriptors: [],
            valid: false
          };
        }
      } else {
        transformed = {
          bytes: bytes.subarray(offset + 5, frameEnd),
          changed: 0,
          valid: true
        };
      }

      if (transformed.changed > 0) {
        chunks.push(grpcHeader(flag, transformed.bytes.length));
        chunks.push(transformed.bytes);
        changed += transformed.changed;
      } else {
        chunks.push(bytes.subarray(offset, frameEnd));
      }
      offset = frameEnd;
    }

    if (frames > 0 && offset === bytes.length) {
      return {
        body: changed > 0 ? concatBytes(chunks) : bytes,
        changed: changed,
        descriptors: descriptors,
        valid: true
      };
    }
    if (bytes.length >= 5 && (bytes[0] === 0 || bytes[0] === 1)) {
      return {
        body: bytes,
        changed: 0,
        descriptors: [],
        valid: false
      };
    }

    transformed = walkSafeProtoMessage(
      bytes,
      config,
      state,
      now,
      descriptors,
      0,
      []
    );
    return {
      body: transformed.changed > 0 ? transformed.bytes : bytes,
      changed: transformed.changed,
      descriptors: transformed.valid ? descriptors : [],
      valid: transformed.valid
    };
  }

  function findFirstJsonVodUrl(text) {
    var config = parseArgument("cdn=auto");
    var prepared = prepareSafeJson(
      text,
      config,
      createEmptyAutoState(),
      0
    );
    return prepared.descriptors.length > 0
      ? prepared.descriptors[0].primaryUrl
      : null;
  }

  function findFirstGrpcVodUrl(input) {
    var config = parseArgument("cdn=auto");
    config.grpcAdapter = "app-playurl-v1";
    var prepared = prepareSafeGrpc(
      input,
      config,
      createEmptyAutoState(),
      0
    );
    return prepared.descriptors.length > 0
      ? prepared.descriptors[0].primaryUrl
      : null;
  }

  function headerValue(headers, name) {
    var keys;
    var index;
    var value;

    if (!isObject(headers)) {
      return "";
    }
    keys = Object.keys(headers);
    for (index = 0; index < keys.length; index += 1) {
      if (keys[index].toLowerCase() === name.toLowerCase()) {
        value = headers[keys[index]];
        if (Array.isArray(value)) {
          return value.join(",");
        }
        return value === undefined || value === null ? "" : String(value);
      }
    }
    return "";
  }

  function bodyByteLength(body) {
    var bytes = toUint8Array(body);
    if (bytes) {
      return bytes.length;
    }
    if (typeof body === "string") {
      return body.length;
    }
    return -1;
  }

  function bodyAsciiPrefix(body, maximum) {
    var bytes = toUint8Array(body);
    var output = "";
    var index;
    var code;

    if (typeof body === "string") {
      return body.slice(0, maximum);
    }
    if (!bytes) {
      return "";
    }
    for (index = 0; index < bytes.length && index < maximum; index += 1) {
      code = bytes[index];
      output += code >= 0x20 && code <= 0x7e ? String.fromCharCode(code) : ".";
    }
    return output;
  }

  function probeBodyHash(body) {
    var bytes = toUint8Array(body);
    var hashes = [
      0x811c9dc5,
      0x9e3779b1,
      0x85ebca6b,
      0xc2b2ae35
    ];
    var primes = [0x01000193, 0x27d4eb2d, 0x165667b1, 0x9e3779b1];
    var index;
    var lane;
    var code;
    if (!bytes && typeof body !== "string") {
      return "";
    }
    for (
      index = 0;
      index < (bytes ? bytes.length : body.length);
      index += 1
    ) {
      code = bytes ? bytes[index] : body.charCodeAt(index) & 0xff;
      for (lane = 0; lane < hashes.length; lane += 1) {
        hashes[lane] ^= code + lane * 257;
        hashes[lane] = imul32(hashes[lane], primes[lane]);
        hashes[lane] ^= hashes[lane] >>> 13;
      }
    }
    return (
      "h2_" +
      hex32(hashes[0]) +
      hex32(hashes[1]) +
      hex32(hashes[2]) +
      hex32(hashes[3])
    );
  }

  function probeContentClass(contentType) {
    if (/^video\//.test(contentType)) {
      return "video";
    }
    if (/^audio\//.test(contentType)) {
      return "audio";
    }
    return "binary";
  }

  function validateProbeResponse(result, expectedUrl) {
    var status = Number(
      result && (result.statusCode || result.status)
    );
    var headers = result && result.headers;
    var contentRange = headerValue(headers, "content-range");
    var contentType = headerValue(headers, "content-type").toLowerCase();
    var contentEncoding = headerValue(headers, "content-encoding").toLowerCase();
    var contentLengthHeader = headerValue(headers, "content-length");
    var rangeMatch;
    var rangeStart;
    var rangeEnd;
    var totalLength;
    var expectedLength;
    var contentLength;
    var actualLength;
    var prefix;
    var finalUrl;

    if (!result || result.error || status !== 206) {
      return { ok: false, reason: "status", status: Number.isFinite(status) ? status : 0 };
    }
    if (
      !(
        /^video\//.test(contentType) ||
        /^audio\//.test(contentType) ||
        /^(?:application\/octet-stream|application\/binary|binary\/octet-stream)(?:;|$)/.test(
          contentType
        )
      )
    ) {
      return { ok: false, reason: "content-type", status: status };
    }
    if (contentEncoding && contentEncoding !== "identity") {
      return { ok: false, reason: "content-encoding", status: status };
    }

    rangeMatch = /^bytes\s+(\d+)-(\d+)\/(\d+)$/i.exec(
      contentRange.trim()
    );
    if (!rangeMatch) {
      return { ok: false, reason: "content-range", status: status };
    }
    rangeStart = Number(rangeMatch[1]);
    rangeEnd = Number(rangeMatch[2]);
    totalLength = Number(rangeMatch[3]);
    if (
      rangeStart !== 0 ||
      !Number.isSafeInteger(rangeEnd) ||
      !Number.isSafeInteger(totalLength) ||
      rangeEnd < 0 ||
      rangeEnd > AUTO_RANGE_END ||
      totalLength <= rangeEnd
    ) {
      return { ok: false, reason: "range-size", status: status };
    }
    expectedLength = rangeEnd + 1;
    actualLength = bodyByteLength(result.body);
    if (actualLength !== expectedLength) {
      return { ok: false, reason: "body-size", status: status };
    }
    if (contentLengthHeader !== "") {
      contentLength = Number(contentLengthHeader);
      if (
        !Number.isSafeInteger(contentLength) ||
        contentLength !== expectedLength
      ) {
        return { ok: false, reason: "content-length", status: status };
      }
    }

    prefix = bodyAsciiPrefix(result.body, 96)
      .replace(/^\s+/, "")
      .toLowerCase();
    if (
      /^(?:<|[\{\[])/.test(prefix) ||
      /(?:<!doctype|<html|accessdenied|nosuchkey|invalidargument|error\s*[:=])/.test(
        prefix
      )
    ) {
      return { ok: false, reason: "error-body", status: status };
    }

    finalUrl =
      typeof result.url === "string"
        ? result.url
        : result.response &&
            typeof result.response.url === "string"
          ? result.response.url
          : "";
    if (
      finalUrl &&
      queryFreeCandidateFingerprint(finalUrl) !==
        queryFreeCandidateFingerprint(expectedUrl)
    ) {
      return { ok: false, reason: "redirect", status: status };
    }
    return {
      bodyLength: actualLength,
      contentClass: probeContentClass(contentType),
      ok: true,
      rangeEnd: rangeEnd,
      rangeStart: rangeStart,
      reason: "validated",
      sampleHash: probeBodyHash(result.body),
      status: status,
      totalLength: totalLength
    };
  }

  function normalizeProbeResult(result, candidate) {
    var validation = validateProbeResponse(result || {}, candidate.url);
    var elapsedMs = boundedNumber(
      result && result.elapsedMs,
      AUTO_PROBE_TIMEOUT_MS,
      1,
      60000
    );
    return {
      bodyLength: validation.bodyLength || 0,
      candidateId: candidate.id,
      contentClass: validation.contentClass || "",
      elapsedMs: Math.round(elapsedMs),
      ok: validation.ok,
      rangeEnd:
        Number.isSafeInteger(validation.rangeEnd)
          ? validation.rangeEnd
          : -1,
      rangeStart:
        Number.isSafeInteger(validation.rangeStart)
          ? validation.rangeStart
          : -1,
      reason: validation.reason,
      sampleHash: validation.sampleHash || "",
      status: validation.status,
      throughputKbps: validation.ok
        ? Math.round(
            ((validation.bodyLength || 0) * 8) / elapsedMs
          )
        : 0,
      totalLength:
        Number.isSafeInteger(validation.totalLength)
          ? validation.totalLength
          : 0
    };
  }

  function probePairEquivalent(primaryResult, alternativeResult) {
    if (!primaryResult.ok || !alternativeResult.ok) {
      return false;
    }
    if (
      primaryResult.rangeStart !== alternativeResult.rangeStart ||
      primaryResult.rangeEnd !== alternativeResult.rangeEnd ||
      primaryResult.totalLength !== alternativeResult.totalLength ||
      primaryResult.bodyLength !== alternativeResult.bodyLength ||
      !primaryResult.sampleHash ||
      primaryResult.sampleHash !== alternativeResult.sampleHash
    ) {
      return false;
    }
    return (
      primaryResult.contentClass === alternativeResult.contentClass ||
      primaryResult.contentClass === "binary" ||
      alternativeResult.contentClass === "binary"
    );
  }

  function recordProbeScore(entry, result, now) {
    var score = entry.scores[result.candidateId];
    var samples =
      score && Array.isArray(score.samples)
        ? score.samples.slice()
        : [];
    samples.push({
      at: now,
      elapsedMs: result.elapsedMs,
      ok: result.ok,
      reason: result.reason,
      status: result.status,
      throughputKbps: result.throughputKbps || 0
    });
    if (samples.length > AUTO_SCORE_SAMPLE_LIMIT) {
      samples = samples.slice(-AUTO_SCORE_SAMPLE_LIMIT);
    }
    entry.scores[result.candidateId] = {
      metrics: summarizeProbeSamples(samples),
      samples: samples
    };
  }

  function alternativeQualifies(
    primaryResult,
    alternativeResult,
    config,
    entry
  ) {
    var gain;
    var primaryScore;
    var alternativeScore;
    var primaryElapsed = primaryResult.elapsedMs;
    var alternativeElapsed = alternativeResult.elapsedMs;
    var primaryThroughput = primaryResult.throughputKbps || 0;
    var alternativeThroughput = alternativeResult.throughputKbps || 0;
    var threshold = boundedNumber(
      config && config.switchThreshold,
      DEFAULT_SWITCH_THRESHOLD,
      RUNTIME_OPTION_LIMITS.switchThreshold.minimum,
      RUNTIME_OPTION_LIMITS.switchThreshold.maximum
    );

    if (!alternativeResult.ok) {
      return false;
    }
    if (!primaryResult.ok) {
      return false;
    }
    primaryScore =
      entry &&
      entry.scores &&
      entry.scores[primaryResult.candidateId];
    alternativeScore =
      entry &&
      entry.scores &&
      entry.scores[alternativeResult.candidateId];
    if (
      primaryScore &&
      primaryScore.metrics &&
      primaryScore.metrics.successCount > 0
    ) {
      primaryElapsed = primaryScore.metrics.medianMs;
      primaryThroughput =
        primaryScore.metrics.medianThroughputKbps ||
        primaryThroughput;
    }
    if (
      alternativeScore &&
      alternativeScore.metrics &&
      alternativeScore.metrics.successCount > 0
    ) {
      alternativeElapsed = alternativeScore.metrics.medianMs;
      alternativeThroughput =
        alternativeScore.metrics.medianThroughputKbps ||
        alternativeThroughput;
      if (
        (
          alternativeScore.metrics.sampleCount >= 3 &&
          alternativeScore.metrics.failureRate > 0.34
        ) ||
        (
          alternativeScore.metrics.successCount >= 2 &&
          alternativeScore.metrics.medianMs > 0 &&
          alternativeScore.metrics.jitterMs /
              alternativeScore.metrics.medianMs >
            0.5
        )
      ) {
        return false;
      }
    }
    gain =
      primaryThroughput > 0 && alternativeThroughput > 0
        ? (
            (alternativeThroughput - primaryThroughput) /
            primaryThroughput
          ) * 100
        : (
            (primaryElapsed - alternativeElapsed) /
            primaryElapsed
          ) * 100;
    return gain >= threshold;
  }

  function clearPendingCandidate(entry) {
    entry.pendingCandidateId = null;
    entry.pendingSince = 0;
    entry.pendingSuccesses = 0;
  }

  function clearSelectedCandidate(entry) {
    entry.candidateId = null;
    entry.expiresAt = 0;
    entry.selectedAt = 0;
    entry.validatedAt = 0;
  }

  function nextSelectedProbeAt(now, expiresAt) {
    return Math.min(
      expiresAt,
      now + AUTO_SELECTED_REVALIDATE_MS
    );
  }

  function updateEntryAfterProbe(
    entry,
    descriptor,
    primaryResult,
    alternativeResult,
    config,
    now
  ) {
    var equivalent = probePairEquivalent(
      primaryResult,
      alternativeResult
    );
    var qualifies;
    var wasSelected =
      entry.candidateId === alternativeResult.candidateId;
    var expiredSelection =
      wasSelected && entry.expiresAt <= now;
    var reason;

    entry.lastUsedAt = now;
    recordProbeScore(entry, primaryResult, now);
    recordProbeScore(entry, alternativeResult, now);
    qualifies =
      equivalent &&
      alternativeQualifies(
        primaryResult,
        alternativeResult,
        config,
        entry
      );

    if (!alternativeResult.ok) {
      if (wasSelected) {
        clearSelectedCandidate(entry);
      }
      clearPendingCandidate(entry);
      entry.failureCount += 1;
      entry.lastFailureAt = now;
      entry.candidateCursor += 1;
      entry.nextProbeAt = now + AUTO_RETRY_MS;
      return wasSelected ? "selected-failed" : "alternative-failed";
    }

    if (!primaryResult.ok) {
      clearPendingCandidate(entry);
      entry.failureCount += 1;
      entry.lastFailureAt = now;
      entry.candidateCursor += 1;
      entry.nextProbeAt = now + AUTO_RETRY_MS;
      return "primary-failed";
    }

    if (!equivalent) {
      if (wasSelected) {
        clearSelectedCandidate(entry);
      }
      clearPendingCandidate(entry);
      entry.failureCount += 1;
      entry.lastFailureAt = now;
      entry.candidateCursor += 1;
      entry.nextProbeAt = now + AUTO_RETRY_MS;
      return primaryResult.ok && alternativeResult.ok
        ? "object-mismatch"
        : "pair-unverified";
    }

    if (wasSelected) {
      entry.successCount += 1;
      entry.failureCount = 0;
      entry.validatedAt = now;
      if (!expiredSelection) {
        entry.nextProbeAt = nextSelectedProbeAt(
          now,
          entry.expiresAt
        );
        return "selected-validated";
      }
      if (qualifies) {
        entry.selectedAt = now;
        entry.expiresAt = now + ttlForConfig(config);
        entry.nextProbeAt = nextSelectedProbeAt(
          now,
          entry.expiresAt
        );
        return "selected-renewed";
      }

      clearSelectedCandidate(entry);
      clearPendingCandidate(entry);
      entry.candidateCursor += 1;
      entry.nextProbeAt = now + AUTO_EXPLORE_DELAY_MS;
      return "selected-no-longer-preferred";
    }

    if (qualifies) {
      if (
        entry.pendingCandidateId === alternativeResult.candidateId &&
        entry.pendingSuccesses >= 1 &&
        now - entry.pendingSince >= AUTO_CONFIRM_DELAY_MS
      ) {
        entry.pendingSuccesses = 2;
        entry.candidateId = alternativeResult.candidateId;
        entry.selectedAt = now;
        entry.validatedAt = now;
        entry.expiresAt = now + ttlForConfig(config);
        entry.successCount += 1;
        entry.failureCount = 0;
        clearPendingCandidate(entry);
        entry.nextProbeAt = nextSelectedProbeAt(
          now,
          entry.expiresAt
        );
        return "alternative-confirmed";
      }

      if (entry.pendingCandidateId !== alternativeResult.candidateId) {
        entry.pendingCandidateId = alternativeResult.candidateId;
        entry.pendingSince = now;
        entry.pendingSuccesses = 1;
      }
      entry.nextProbeAt = entry.pendingSince + AUTO_CONFIRM_DELAY_MS;
      return "alternative-pending";
    }

    reason = alternativeResult.ok
      ? "alternative-not-faster"
      : "alternative-failed";
    if (!alternativeResult.ok) {
      entry.failureCount += 1;
      entry.lastFailureAt = now;
    }
    clearPendingCandidate(entry);
    entry.candidateCursor += 1;
    entry.nextProbeAt =
      now +
      (alternativeResult.ok ? AUTO_EXPLORE_DELAY_MS : AUTO_RETRY_MS);
    return reason;
  }

  function processSafeAutoResponse(
    input,
    binary,
    config,
    services,
    callback
  ) {
    var original = input;
    var now;
    var state;
    var prepared;
    var descriptor;
    var entry;
    var primaryCandidate;
    var alternativeCandidate;
    var results = {};
    var finished = false;
    var callbackDelivered = false;
    var claimedLockUntil = 0;
    var claimedLockToken = "";

    function deliver(result) {
      var descriptors;
      var families = {};
      var candidateCount = 0;
      var index;
      var candidate;
      var probeRows = [];
      if (callbackDelivered) {
        return;
      }
      descriptors =
        prepared && Array.isArray(prepared.descriptors)
          ? prepared.descriptors
          : [];
      for (index = 0; index < descriptors.length; index += 1) {
        candidateCount += Array.isArray(descriptors[index].candidates)
          ? descriptors[index].candidates.length
          : 0;
        if (descriptors[index].family) {
          families[descriptors[index].family] = true;
        }
      }
      [primaryCandidate, alternativeCandidate].forEach(function (item, lane) {
        candidate = item && results[item.id];
        if (candidate) {
          probeRows.push(
            String(lane) +
              ":" +
              String(candidate.status || 0) +
              "/" +
              String(candidate.elapsedMs || 0) +
              "ms/" +
              String(candidate.throughputKbps || 0) +
              "kbps/" +
              String(candidate.reason || "unknown")
          );
        }
      });
      result.candidateCount = candidateCount;
      result.candidateFamilies = Object.keys(families).join(",") || "none";
      result.probeSummary =
        probeRows.join(";") ||
        ((result.probeCount || 0) > 0 ? "started" : "none");
      callbackDelivered = true;
      callback(result);
    }

    if (typeof callback !== "function") {
      return;
    }
    if (!config || !config.valid || !config.auto || !hasStateServices(services)) {
      deliver({
        body: original,
        changed: 0,
        descriptors: 0,
        probed: false,
        reason: "services-unavailable",
        valid: Boolean(config && config.valid)
      });
      return;
    }

    now = services.now();
    state = applyResetToken(
      services,
      loadAutoState(services),
      config,
      now
    );
    prepared = binary
      ? prepareSafeGrpc(input, config, state, now)
      : prepareSafeJson(
          typeof input === "string" ? input : "",
          config,
          state,
          now
        );
    if (!prepared.valid) {
      deliver({
        body: original,
        changed: 0,
        descriptors: 0,
        probed: false,
        reason: "unsupported-response",
        valid: false
      });
      return;
    }

    /*
     * Cache application is always independent from probing. "off" is a
     * deterministic cache-only mode, while a runtime without $httpClient can
     * still reuse an already verified selection.
     */
    if (config.probeMode === "off" || !hasSafeServices(services)) {
      deliver({
        body: prepared.body,
        changed: prepared.changed,
        descriptors: prepared.descriptors.length,
        probed: false,
        probeCount: 0,
        reason:
          config.probeMode === "off"
            ? "probe-disabled"
            : "probe-unavailable",
        scriptElapsedMs: Math.max(0, services.now() - now),
        valid: true
      });
      return;
    }

    /*
     * Re-read immediately before claiming a probe. Response parsing can take
     * time, and another script invocation may have claimed the global slot or
     * this resource while the current body was being inspected.
     */
    state = applyResetToken(
      services,
      loadAutoState(services),
      config,
      services.now()
    );
    descriptor = findProbeDescriptor(prepared.descriptors, state, now);
    if (!descriptor) {
      deliver({
        body: prepared.body,
        changed: prepared.changed,
        descriptors: prepared.descriptors.length,
        probed: false,
        probeCount: 0,
        reason: "cache-or-throttle",
        scriptElapsedMs: Math.max(0, services.now() - now),
        valid: true
      });
      return;
    }

    entry = state.entries[descriptor.resourceKey];
    if (!entry) {
      entry = sanitizeAutoEntry(null);
      state.entries[descriptor.resourceKey] = entry;
    }
    if (entry.candidateSetHash !== descriptor.candidateSetHash) {
      resetAutoEntryForDescriptor(entry, descriptor);
    }
    entry.lastUsedAt = now;
    primaryCandidate = descriptor.candidates[0];
    alternativeCandidate = chooseAlternativeCandidate(descriptor, entry);
    if (!alternativeCandidate) {
      deliver({
        body: prepared.body,
        changed: prepared.changed,
        descriptors: prepared.descriptors.length,
        probed: false,
        probeCount: 0,
        reason: "no-alternative",
        scriptElapsedMs: Math.max(0, services.now() - now),
        valid: true
      });
      return;
    }

    claimedLockUntil = now + AUTO_LOCK_MS;
    claimedLockToken = stableHash(
      "l",
      descriptor.resourceKey +
        "|" +
        now +
        "|" +
        String(Math.random())
    );
    state.locks[descriptor.resourceKey] = claimedLockUntil;
    state.lockTokens[descriptor.resourceKey] = claimedLockToken;
    state.lastProbeAt = now;
    if (!saveAutoState(services, state, now)) {
      deliver({
        body: prepared.body,
        changed: prepared.changed,
        descriptors: prepared.descriptors.length,
        probed: false,
        probeCount: 0,
        reason: "state-write-failed",
        scriptElapsedMs: Math.max(0, services.now() - now),
        valid: true
      });
      return;
    }

    function finishIfComplete() {
      var latestState;
      var latestEntry;
      var completedAt;
      var updateReason;

      if (
        finished ||
        !results[primaryCandidate.id] ||
        !results[alternativeCandidate.id]
      ) {
        return;
      }
      finished = true;
      completedAt = services.now();
      latestState = loadAutoState(services);
      if (
        latestState.locks[descriptor.resourceKey] !== claimedLockUntil ||
        latestState.lockTokens[descriptor.resourceKey] !== claimedLockToken
      ) {
        if (config.probeMode === "blocking") {
          deliver({
            body: prepared.body,
            changed: prepared.changed,
            descriptors: prepared.descriptors.length,
            probed: true,
            probeCount: 2,
            reason: "stale-probe",
            scriptElapsedMs: Math.max(0, completedAt - now),
            valid: true
          });
        }
        return;
      }
      latestEntry = latestState.entries[descriptor.resourceKey];
      if (!latestEntry) {
        latestEntry = sanitizeAutoEntry(null);
        latestState.entries[descriptor.resourceKey] = latestEntry;
      }
      if (latestEntry.candidateSetHash !== descriptor.candidateSetHash) {
        resetAutoEntryForDescriptor(latestEntry, descriptor);
      }
      updateReason = updateEntryAfterProbe(
        latestEntry,
        descriptor,
        results[primaryCandidate.id],
        results[alternativeCandidate.id],
        config,
        completedAt
      );
      if (latestState.locks[descriptor.resourceKey] === claimedLockUntil) {
        delete latestState.locks[descriptor.resourceKey];
        delete latestState.lockTokens[descriptor.resourceKey];
      }
      saveAutoState(services, latestState, completedAt);
      if (config.probeMode === "blocking") {
        deliver({
          body: prepared.body,
          changed: prepared.changed,
          descriptors: prepared.descriptors.length,
          probed: true,
          probeCount: 2,
          reason: updateReason,
          scriptElapsedMs: Math.max(0, completedAt - now),
          valid: true
        });
      }
    }

    function receive(candidate, result) {
      if (finished || results[candidate.id]) {
        return;
      }
      results[candidate.id] = normalizeProbeResult(result, candidate);
      finishIfComplete();
    }

    [primaryCandidate, alternativeCandidate].forEach(function (candidate) {
      try {
        services.probe(
          candidate,
          AUTO_PROBE_TIMEOUT_MS,
          function (result) {
            receive(candidate, result);
          }
        );
      } catch (error) {
        receive(candidate, {
          body: "",
          elapsedMs: AUTO_PROBE_TIMEOUT_MS,
          error: true,
          headers: {},
          status: 0
        });
      }
    });

    /*
     * The default path never waits for Range probes. Shadowrocket may keep the
     * best-effort callbacks alive after $done(); if it does not, the lock
     * expires and no unverified state is ever applied. Users can explicitly
     * opt into "blocking" for a deterministic learning run.
     */
    if (config.probeMode !== "blocking") {
      deliver({
        body: prepared.body,
        changed: prepared.changed,
        descriptors: prepared.descriptors.length,
        probed: true,
        probeCount: 2,
        reason: "probe-started-nonblocking",
        scriptElapsedMs: Math.max(0, services.now() - now),
        valid: true
      });
    }
  }

  function createShadowrocketServices() {
    var storeAvailable =
      typeof $persistentStore !== "undefined" &&
      $persistentStore &&
      typeof $persistentStore.read === "function" &&
      typeof $persistentStore.write === "function";

    return {
      now: function () {
        return Date.now();
      },
      persistent: Boolean(storeAvailable),
      read: function (key) {
        return storeAvailable ? $persistentStore.read(key) : null;
      },
      write: function (value, key) {
        return storeAvailable
          ? $persistentStore.write(value, key)
          : false;
      },
      probe: function (candidate, timeoutMs, callback) {
        var client =
          typeof $httpClient !== "undefined" ? $httpClient : null;
        var started = Date.now();
        var completed = false;
        var timer = null;
        var request = {
          "auto-redirect": false,
          "binary-mode": true,
          headers: {
            "Accept-Encoding": "identity",
            Range: "bytes=0-" + AUTO_RANGE_END,
            Referer: "https://www.bilibili.com/",
            "User-Agent":
              "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X)"
          },
          timeout: Math.max(1, Math.ceil(timeoutMs / 1000)),
          url: candidate.url
        };

        function complete(error, response, data) {
          var status;
          if (completed) {
            return;
          }
          completed = true;
          if (timer !== null && typeof clearTimeout === "function") {
            clearTimeout(timer);
          }
          status = Number(
            response && (response.statusCode || response.status)
          );
          callback({
            body:
              data !== undefined
                ? data
                : response && response.body !== undefined
                  ? response.body
                  : "",
            elapsedMs: Math.max(1, Date.now() - started),
            error: Boolean(error),
            headers: (response && response.headers) || {},
            status: Number.isFinite(status) ? status : 0,
            url:
              response && typeof response.url === "string"
                ? response.url
                : ""
          });
        }

        if (!client || typeof client.get !== "function") {
          complete(true, null, "");
          return;
        }
        if (typeof setTimeout === "function") {
          timer = setTimeout(function () {
            complete(true, null, "");
          }, timeoutMs + 250);
        }
        try {
          client.get(request, complete);
        } catch (error) {
          complete(true, null, "");
        }
      }
    };
  }

  function safeLog(message) {
    if (
      typeof console !== "undefined" &&
      console &&
      typeof console.log === "function"
    ) {
      console.log("[" + NAME + "] " + message);
    }
  }

  function finishManualShadowrocketResponse(config, body, binary) {
    var result;

    try {
      if (!config.cdnHost) {
        if (config.debug) {
          safeLog("fixed CDN rewrite disabled");
        }
        $done({});
        return;
      }

      result = binary
        ? transformGrpcBody(body, config)
        : transformJsonText(
            typeof body === "string" ? body : "",
            config
          );
      if (result.valid && result.changed > 0) {
        if (config.debug) {
          safeLog(
            "fixed mode rewrote " +
              result.changed +
              (binary ? " Protobuf" : " JSON") +
              " URL(s)"
          );
        }
        $done({ body: result.body });
      } else {
        if (config.debug && !result.valid) {
          safeLog("unsupported response; left unchanged");
        }
        $done({});
      }
    } catch (error) {
      safeLog(
        "fixed mode error; response left unchanged: " +
          (error && error.message ? error.message : String(error))
      );
      $done({});
    }
  }

  function finishAutoShadowrocketResponse(
    config,
    body,
    binary,
    services
  ) {
    processSafeAutoResponse(
      body,
      binary,
      config,
      services,
      function (result) {
        try {
          if (config.debug) {
            safeLog(
              "safe auto: " +
                result.reason +
                ", descriptors=" +
                result.descriptors +
                ", changed=" +
                result.changed +
                ", probes=" +
                (result.probeCount || 0) +
                ", candidates=" +
                (result.candidateCount || 0) +
                ", families=" +
                (result.candidateFamilies || "none") +
                ", probe_summary=" +
                (result.probeSummary || "none") +
                ", elapsed_ms=" +
                (result.scriptElapsedMs || 0)
            );
          }
          if (result.valid && result.changed > 0) {
            $done({ body: result.body });
          } else {
            $done({});
          }
        } catch (error) {
          safeLog(
            "safe auto callback error; response left unchanged: " +
              (error && error.message
                ? error.message
                : String(error))
          );
          $done({});
        }
      }
    );
  }

  function processShadowrocketBody(config, body, binary) {
    if (!config.auto) {
      finishManualShadowrocketResponse(config, body, binary);
      return;
    }
    finishAutoShadowrocketResponse(
      config,
      body,
      binary,
      createShadowrocketServices()
    );
  }

  function runShadowrocket() {
    var config;
    var requestUrl;
    var body;
    var binary;
    var grpcResponse;
    var grpcEncoding;

    try {
      config = parseArgument(
        typeof $argument === "string" ? $argument : ""
      );
      if (!config.valid) {
        safeLog("invalid CDN argument; response left unchanged");
        $done({});
        return;
      }
      if (!config.auto && !config.cdnHost) {
        if (config.debug) {
          safeLog("CDN rewrite disabled");
        }
        $done({});
        return;
      }

      requestUrl =
        typeof $request !== "undefined" && $request && $request.url
          ? String($request.url)
          : "";
      config.grpcAdapter = classifyGrpcAdapter(requestUrl);
      grpcResponse = Boolean(config.grpcAdapter);
      body =
        typeof $response !== "undefined" && $response
          ? (
              grpcResponse &&
              $response.bodyBytes !== undefined &&
              $response.bodyBytes !== null
                ? $response.bodyBytes
                : $response.body
            )
          : null;
      binary = isByteView(body) || grpcResponse;

      if (binary && hasCompressedGrpcFrame(body)) {
        grpcEncoding = grpcEncodingFromHeaders(
          typeof $response !== "undefined" && $response
            ? $response.headers
            : null
        );
        decompressGrpcFrames(body, grpcEncoding).then(function (decoded) {
          if (!decoded.valid) {
            if (config.debug) {
              safeLog(
                "compressed gRPC response could not be decoded; reason=" +
                  decoded.reason
              );
            }
            $done({});
            return;
          }
          processShadowrocketBody(config, decoded.body, true);
        }, function (error) {
          if (config.debug) {
            safeLog(
              "compressed gRPC error; response left unchanged: " +
                (
                  error && error.message
                    ? error.message
                    : String(error)
                )
            );
          }
          $done({});
        });
        return;
      }
      processShadowrocketBody(config, body, binary);
    } catch (error) {
      safeLog(
        "error; response left unchanged: " +
          (error && error.message ? error.message : String(error))
      );
      $done({});
    }
  }

  var api = {
    AUTO_CACHE_CAPACITY: AUTO_CACHE_CAPACITY,
    FIXED_CDN_CANDIDATES: FIXED_CDN_CANDIDATES,
    AUTO_CONFIRM_DELAY_MS: AUTO_CONFIRM_DELAY_MS,
    AUTO_GLOBAL_PROBE_GAP_MS: AUTO_GLOBAL_PROBE_GAP_MS,
    AUTO_RANGE_END: AUTO_RANGE_END,
    AUTO_SELECTED_REVALIDATE_MS: AUTO_SELECTED_REVALIDATE_MS,
    AUTO_STATE_KEY: AUTO_STATE_KEY,
    DEFAULT_CDN: DEFAULT_CDN,
    RUNTIME_OPTION_LIMITS: RUNTIME_OPTION_LIMITS,
    asciiBytesToString: asciiBytesToString,
    asciiStringToBytes: asciiStringToBytes,
    alternativeQualifies: alternativeQualifies,
    buildMediaDescriptor: buildMediaDescriptor,
    candidateFamilyForUrl: candidateFamilyForUrl,
    candidateIdForUrl: candidateIdForUrl,
    concatBytes: concatBytes,
    createEmptyAutoState: createEmptyAutoState,
    createShadowrocketServices: createShadowrocketServices,
    descriptorResourceKey: descriptorResourceKey,
    decompressGrpcFrames: decompressGrpcFrames,
    encodeVarint: encodeVarint,
    findFirstGrpcVodUrl: findFirstGrpcVodUrl,
    findFirstJsonVodUrl: findFirstJsonVodUrl,
    isBilibiliMediaHost: isBilibiliMediaHost,
    isAllowedFixedCdnHost: isAllowedFixedCdnHost,
    isVodMediaUrl: isVodMediaUrl,
    hasCompressedGrpcFrame: hasCompressedGrpcFrame,
    loadAutoState: loadAutoState,
    normalizeCdnHost: normalizeCdnHost,
    normalizeNetworkProfile: normalizeNetworkProfile,
    parseArgument: parseArgument,
    prepareSafeGrpc: prepareSafeGrpc,
    prepareSafeJson: prepareSafeJson,
    processSafeAutoResponse: processSafeAutoResponse,
    queryFreeCandidateFingerprint: queryFreeCandidateFingerprint,
    readVarint: readVarint,
    rewriteVodUrl: rewriteVodUrl,
    runShadowrocket: runShadowrocket,
    stableHash: stableHash,
    transformGrpcBody: transformGrpcBody,
    transformJsonText: transformJsonText,
    transformProtoMessage: transformProtoMessage,
    updateEntryAfterProbe: updateEntryAfterProbe,
    validateProbeResponse: validateProbeResponse
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.BiliCdnSwitcher = api;
  }

  if (
    typeof $done === "function" &&
    typeof $response !== "undefined" &&
    root.__BILIFLOW_COMBINED__ !== true
  ) {
    runShadowrocket();
  }
})(this);

(function (root) {
  "use strict";

  function noStoreHeaders() {
    var headers =
      typeof $response !== "undefined" && $response
        ? $response.headers
        : null;
    return root.BiliEnhance.noStoreResponseHeaders(headers);
  }

  function complete(body, changed) {
    var result = { headers: noStoreHeaders() };
    if (changed > 0 && typeof body === "string") {
      result.body = body;
    }
    $done(result);
  }

  function enhancementEnabled(rawArgument) {
    return /"enhanceStory"\s*:\s*true/.test(
      String(rawArgument || "")
    );
  }

  function run() {
    var rawArgument =
      typeof $argument === "string" ? $argument : "";
    var original =
      typeof $response !== "undefined" &&
      $response &&
      typeof $response.body === "string"
        ? $response.body
        : "";
    var requestUrl =
      typeof $request !== "undefined" && $request
        ? String($request.url || "")
        : "";
    var working = original;
    var enhanceChanges = 0;
    var enhanceConfig;
    var enhanceResult;
    var cdnConfig;
    var fixedResult;

    if (!root.BiliEnhance || !root.BiliCdnSwitcher) {
      complete(original, 0);
      return;
    }

    if (enhancementEnabled(rawArgument)) {
      enhanceConfig = root.BiliEnhance.parseArgument(rawArgument);
      if (enhanceConfig.valid) {
        enhanceResult = root.BiliEnhance.transformJsonText(
          original,
          requestUrl,
          enhanceConfig
        );
        if (enhanceResult.valid && enhanceResult.changed > 0) {
          working = enhanceResult.body;
          enhanceChanges = enhanceResult.changed;
        }
      }
    }

    cdnConfig = root.BiliCdnSwitcher.parseArgument(rawArgument);
    if (!cdnConfig.valid || (!cdnConfig.auto && !cdnConfig.cdnHost)) {
      complete(working, enhanceChanges);
      return;
    }
    cdnConfig.grpcAdapter = "";
    if (cdnConfig.auto) {
      root.BiliCdnSwitcher.processSafeAutoResponse(
        working,
        false,
        cdnConfig,
        root.BiliCdnSwitcher.createShadowrocketServices(),
        function (cdnResult) {
          var cdnChanges =
            cdnResult && cdnResult.valid
              ? Number(cdnResult.changed || 0)
              : 0;
          complete(
            cdnChanges > 0 ? cdnResult.body : working,
            enhanceChanges + cdnChanges
          );
        }
      );
      return;
    }
    fixedResult = root.BiliCdnSwitcher.transformJsonText(
      working,
      cdnConfig
    );
    complete(
      fixedResult.valid && fixedResult.changed > 0
        ? fixedResult.body
        : working,
      enhanceChanges +
        (
          fixedResult.valid
            ? Number(fixedResult.changed || 0)
            : 0
        )
    );
  }

  try {
    run();
  } catch (error) {
    complete(
      typeof $response !== "undefined" &&
      $response &&
      typeof $response.body === "string"
        ? $response.body
        : "",
      0
    );
  }
})(this);