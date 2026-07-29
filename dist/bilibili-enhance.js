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
    if (
      parsed.host === "api.vc.bilibili.com" &&
      /^\/search_svr\/v\d+\/Search\/recommend_words$/.test(path)
    ) {
      return "search-recommend-words";
    }
    if (
      parsed.host === "manga.bilibili.com" &&
      /^\/twirp\/comic\.v\d+\.Comic\/(?:Flash|ListFlash)$/.test(path)
    ) {
      return "manga-flash";
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
      case "/bilibili.app.interface.v1.Search/DefaultWords":
        return "grpc-search-default-words";
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
    if (endpoint === "grpc-search-default-words") {
      return Boolean(
        config.ads !== false &&
          config.searchPromotions !== false
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
    if (endpoint === "search-recommend-words") {
      return config.ads && config.searchPromotions
        ? replaceRootObject(body, {})
        : 0;
    }
    if (endpoint === "manga-flash") {
      return config.ads
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
      endpoint === "game-live-material" ||
      endpoint === "search-recommend-words" ||
      endpoint === "manga-flash"
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

  function transformEmptyKnownGrpcReply(input) {
    var original = toUint8Array(input) || new Uint8Array();
    return {
      body: original.length > 0 ? new Uint8Array() : original,
      changed: original.length > 0 ? 1 : 0,
      valid: true
    };
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
      case "grpc-search-default-words":
        return transformEmptyKnownGrpcReply(input);
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
        "manga-flash",
        "search-recommend-words",
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
