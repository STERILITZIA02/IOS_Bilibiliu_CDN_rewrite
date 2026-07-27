"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { gzipSync } = require("node:zlib");

const enhance = require("../src/bilibili-enhance.js");

const appRoot = "https://app.bilibili.com";
const apiRoot = "https://api.bilibili.com";

function bytes(...chunks) {
  return enhance.concatBytes(
    chunks.map((chunk) =>
      chunk instanceof Uint8Array
        ? chunk
        : new Uint8Array(chunk),
    ),
  );
}

function fieldTag(fieldNumber, wireType) {
  return enhance.encodeVarint(fieldNumber * 8 + wireType);
}

function varintField(fieldNumber, value) {
  return bytes(
    fieldTag(fieldNumber, 0),
    enhance.encodeVarint(value),
  );
}

function stringField(fieldNumber, value) {
  const body = new Uint8Array(Buffer.from(value, "utf8"));
  return bytes(
    fieldTag(fieldNumber, 2),
    enhance.encodeVarint(body.length),
    body,
  );
}

function messageField(fieldNumber, message) {
  return bytes(
    fieldTag(fieldNumber, 2),
    enhance.encodeVarint(message.length),
    message,
  );
}

function grpcFrame(payload, flag = 0) {
  const header = new Uint8Array(5);
  header[0] = flag;
  header[1] = Math.floor(payload.length / 0x1000000) & 0xff;
  header[2] = Math.floor(payload.length / 0x10000) & 0xff;
  header[3] = Math.floor(payload.length / 0x100) & 0xff;
  header[4] = payload.length & 0xff;
  return bytes(header, payload);
}

function grpcPayload(body) {
  const bytesValue = new Uint8Array(body);
  const length =
    bytesValue[1] * 0x1000000 +
    bytesValue[2] * 0x10000 +
    bytesValue[3] * 0x100 +
    bytesValue[4];
  assert.equal(bytesValue.length, length + 5);
  return bytesValue.slice(5);
}

function protoFields(input, fieldNumber, wireType) {
  return enhance
    .parseProtoFields(input)
    .filter(
      (field) =>
        field.fieldNumber === fieldNumber &&
        (wireType === undefined || field.wireType === wireType),
    );
}

function fieldPayload(input, field) {
  return new Uint8Array(input).slice(
    field.payloadStart,
    field.payloadEnd,
  );
}

function transform(url, fixture, argument) {
  const config = enhance.parseArgument(
    argument === undefined ? "" : argument,
  );
  return enhance.transformJsonText(
    JSON.stringify(fixture),
    url,
    config,
  );
}

test("parses independent enhancement switches and rejects malformed arguments", () => {
  assert.deepEqual(enhance.parseArgument(""), {
    ads: true,
    debug: false,
    homeFeedVideoOnly: true,
    liveShopping: true,
    searchPromotions: true,
    ui: true,
    videoOnlyRecommendations: true,
    vipPromotions: true,
    valid: true,
    ...enhance.UI_OPTION_DEFAULTS,
  });
  assert.deepEqual(
    enhance.parseArgument(
      "ads=false&homeFeedVideoOnly=0&videoOnlyRecommendations=0&ui=0&searchPromotions=off&liveShopping=no&vipPromotions=0&hideMineWallet=1&debug=1",
    ),
    {
      ads: false,
      debug: true,
      homeFeedVideoOnly: false,
      liveShopping: false,
      searchPromotions: false,
      ui: false,
      videoOnlyRecommendations: false,
      vipPromotions: false,
      valid: true,
      ...enhance.UI_OPTION_DEFAULTS,
      hideMineWallet: true,
    },
  );
  assert.equal(enhance.parseArgument('{"ads":').valid, false);
  assert.equal(enhance.parseArgument("ads=%").valid, false);
});

test("high-confidence promotion detection preserves ambiguous content", () => {
  assert.equal(
    enhance.isHighConfidencePromotion({
      creative_id: 123,
      title: "商业推广",
    }),
    true,
  );
  assert.equal(
    enhance.isHighConfidencePromotion({
      business_type: "promotion",
      title: "推广",
    }),
    true,
  );
  assert.equal(
    enhance.isHighConfidencePromotion({
      track_id: "track",
      button: { text: "立即购买" },
      uri: "https://mall.bilibili.com/item/1",
    }),
    true,
  );
  assert.equal(
    enhance.isHighConfidencePromotion({
      title: "纪录片：广告人的一天",
      uri: "bilibili://video/123",
    }),
    false,
  );
  assert.equal(
    enhance.isHighConfidencePromotion({
      card_type: "cm_v3",
      card_goto: "future_unknown",
    }),
    false,
  );
});

test("removes only high-confidence splash and feed advertisements", () => {
  const splash = transform(
    `${appRoot}/x/v2/splash/show`,
    {
      code: 0,
      data: {
        account: { id: 1 },
        event_list: [1],
        preload: [2],
        show: [3],
        unknown_future_field: { keep: true },
      },
    },
  );
  const splashBody = JSON.parse(splash.body);

  assert.equal(splash.changed, 4);
  assert.equal("account" in splashBody.data, false);
  assert.deepEqual(splashBody.data.unknown_future_field, { keep: true });

  const feed = transform(
    `${appRoot}/x/v2/feed/index?device=phone`,
    {
      code: 0,
      data: {
        items: [
          {
            card_type: "banner_v8",
            card_goto: "banner",
            banner_item: [
              { type: "ad", title: "广告" },
              { type: "activity", title: "正常活动" },
            ],
          },
          { card_type: "cm_v2", card_goto: "ad_player" },
          { card_type: "cm_v3", card_goto: "ad_future" },
          { card_type: "small_cover_v2", card_goto: "av" },
        ],
      },
    },
    '{"homeFeedVideoOnly":false}',
  );
  const feedBody = JSON.parse(feed.body);

  assert.equal(feed.changed, 3);
  assert.equal(feedBody.data.items.length, 2);
  assert.deepEqual(feedBody.data.items[0].banner_item, [
    { type: "activity", title: "正常活动" },
  ]);
  assert.equal(feedBody.data.items[1].card_goto, "av");
});

test("homepage refresh keeps exactly the first six verified ordinary AV cards", () => {
  const ordinary = (id, title = `普通视频 ${id}`) => ({
    card_type: "small_cover_v2",
    card_goto: "av",
    goto: "av",
    param: String(id),
    uri: `bilibili://video/${id}`,
    player_args: { aid: id, cid: id + 1000, type: "av" },
    title,
  });
  const fixture = {
    code: 0,
    data: {
      items: [
        ordinary(1),
        {
          card_type: "banner_v8",
          card_goto: "banner",
          banner_item: [
            { type: "ad", title: "广告横幅" },
            { type: "activity", title: "活动横幅" },
          ],
        },
        {
          ...ordinary(2),
          business_info: null,
          cm_mark: 0,
        },
        { card_type: "cm_v2", card_goto: "ad_inline_live" },
        {
          ...ordinary(20, "官方纪录片"),
          badge_info: { text: "纪录片" },
        },
        {
          ...ordinary(21, "官方综艺"),
          rcmd_reason_style: { text: "综艺" },
        },
        {
          card_type: "small_cover_v10",
          card_goto: "game",
          goto: "game",
          uri: "bilibili://game_center/home",
          title: "小游戏",
        },
        {
          ...ordinary(22, "应用下载"),
          uri: "bilibili://game_center/detail/22",
          desc_button: { text: "立即下载" },
        },
        {
          card_type: "small_cover_v2",
          card_goto: "ogv",
          goto: "ogv",
          season_id: 23,
          title: "影视",
        },
        {
          card_type: "small_cover_v9",
          card_goto: "live",
          goto: "live",
          room_id: 24,
          title: "直播",
        },
        ordinary(3, "广告人的一天"),
        {
          ...ordinary(25, "伪装成普通视频的商业卡"),
          business_info: { creative_id: 25 },
        },
        {
          card_type: "future_card",
          title: "未知推荐模块",
        },
        ordinary(4),
        ordinary(5),
        ordinary(6),
        ordinary(7),
        ordinary(8),
      ],
      config: {
        auto_refresh_time: 1200,
      },
      interest_choose: { keep: true },
    },
  };
  const result = transform(
    `${appRoot}/x/v2/feed/index?device=phone&pull=1`,
    fixture,
  );
  const output = JSON.parse(result.body);

  assert.equal(
    result.changed,
    fixture.data.items.length - 6,
  );
  assert.deepEqual(
    output.data.items.map((item) => item.title),
    [
      "普通视频 1",
      "普通视频 2",
      "广告人的一天",
      "普通视频 4",
      "普通视频 5",
      "普通视频 6",
    ],
  );
  assert.ok(
    output.data.items.every(
      (item) =>
        item.goto === "av" &&
        item.card_goto === "av" &&
        item.uri.startsWith("bilibili://video/"),
    ),
  );
  assert.deepEqual(output.data.config, { auto_refresh_time: 1200 });
  assert.deepEqual(output.data.interest_choose, { keep: true });

  const repeated = enhance.transformJsonText(
    result.body,
    `${appRoot}/x/v2/feed/index?device=phone&pull=1`,
    enhance.parseArgument(""),
  );
  assert.equal(repeated.changed, 0);
  assert.equal(repeated.body, result.body);

  const nextRefresh = transform(
    `${appRoot}/x/v2/feed/index?device=phone&pull=1&idx=2`,
    {
      code: 0,
      data: {
        items: [
          { card_type: "cm_double_v9", card_goto: "ad_inline_av" },
          ...Array.from(
            { length: 9 },
            (_, index) => ordinary(index + 101),
          ),
        ],
      },
    },
  );
  assert.deepEqual(
    JSON.parse(nextRefresh.body).data.items.map((item) => item.param),
    ["101", "102", "103", "104", "105", "106"],
  );

  const relaxed = transform(
    `${appRoot}/x/v2/feed/index?device=phone`,
    fixture,
    '{"homeFeedVideoOnly":false}',
  );
  const relaxedItems = JSON.parse(relaxed.body).data.items;
  assert.ok(relaxedItems.length > 6);
  assert.ok(
    relaxedItems.some((item) => item.title === "官方纪录片"),
  );
  assert.ok(
    relaxedItems.some((item) => item.title === "未知推荐模块"),
  );
  assert.ok(
    !relaxedItems.some(
      (item) => item.card_goto === "ad_inline_live",
    ),
  );

  const disabled = transform(
    `${appRoot}/x/v2/feed/index?device=phone`,
    fixture,
    '{"ads":false}',
  );
  assert.deepEqual(JSON.parse(disabled.body), fixture);
});

test("strict Story filtering keeps only ordinary vertical videos", () => {
  const result = transform(
    `${appRoot}/x/v2/feed/index/story`,
    {
      code: 0,
      data: {
        items: [
          { card_goto: "vertical_av", title: "正常视频" },
          { card_goto: "vertical_ad_picture" },
          { card_goto: "vertical_pgc", title: "正常番剧内容" },
          { card_goto: "future_type", ad_info: { source: "cm" } },
          { card_goto: "future_type", title: "未知结构" },
        ],
      },
    },
  );
  const output = JSON.parse(result.body);

  assert.equal(result.changed, 4);
  assert.deepEqual(
    output.data.items.map((item) => item.title),
    ["正常视频"],
  );

  const relaxed = transform(
    `${appRoot}/x/v2/feed/index/story`,
    {
      code: 0,
      data: {
        items: [
          { card_goto: "vertical_av", title: "正常视频" },
          { card_goto: "vertical_ad_picture" },
          { card_goto: "vertical_pgc", title: "大会员番剧" },
          { card_goto: "future_type", title: "未知结构" },
        ],
      },
    },
    '{"homeFeedVideoOnly":false}',
  );
  assert.deepEqual(
    JSON.parse(relaxed.body).data.items.map((item) => item.title),
    ["正常视频", "未知结构"],
  );
});

test("web homepage refresh uses the same six-video allowlist", () => {
  const video = (id) => ({
    goto: "av",
    bvid: `BV${id}xx`,
    cid: id + 100,
    uri: `https://www.bilibili.com/video/BV${id}xx`,
    title: `Web 视频 ${id}`,
  });
  const result = transform(
    `${apiRoot}/x/web-interface/wbi/index/top/feed/rcmd?ps=12`,
    {
      code: 0,
      data: {
        item: [
          video(1),
          { goto: "live", room_info: { room_id: 2 } },
          { goto: "ogv", ogv_info: { season_id: 3 } },
          {
            ...video(20),
            business_info: { creative_id: 20 },
          },
          video(2),
          video(3),
          video(4),
          video(5),
          video(6),
          video(7),
        ],
        side_bar_column: [{ goto: "ogv", title: "边栏" }],
      },
    },
  );
  const data = JSON.parse(result.body).data;

  assert.deepEqual(
    data.item.map((item) => item.title),
    [
      "Web 视频 1",
      "Web 视频 2",
      "Web 视频 3",
      "Web 视频 4",
      "Web 视频 5",
      "Web 视频 6",
    ],
  );
  assert.deepEqual(data.side_bar_column, [
    { goto: "ogv", title: "边栏" },
  ]);
});

test("search promotion and advertisement switches remain independent", () => {
  const fixture = {
    code: 0,
    data: [
      { type: "trending", title: "推广词" },
      { type: "history", title: "搜索历史" },
      { type: "ad", title: "广告" },
    ],
  };
  const promotionsOnly = transform(
    `${appRoot}/x/v2/search/square`,
    fixture,
    '{"ads":false,"searchPromotions":true}',
  );
  const adsOnly = transform(
    `${appRoot}/x/v2/search/square`,
    fixture,
    '{"ads":true,"searchPromotions":false}',
  );

  assert.deepEqual(
    JSON.parse(promotionsOnly.body).data.map((item) => item.type),
    ["history", "ad"],
  );
  assert.deepEqual(
    JSON.parse(adsOnly.body).data.map((item) => item.type),
    ["trending", "history"],
  );
});

test("removes only the requested navigation entries and compacts positions", () => {
  const result = transform(
    `${appRoot}/x/resource/show/tab/v2`,
    {
      code: 0,
      data: {
        tab: [
          { id: 1, name: "推荐", tab_id: "home", pos: 1 },
          {
            id: 136117,
            name: "新征程",
            tab_id: "165",
            uri: "bilibili://following/home_activity_tab/136117",
            pos: 2,
          },
          { id: 2, name: "热门", tab_id: "hot", pos: 3 },
          { id: 999, name: "未知新频道", tab_id: "future", pos: 4 },
        ],
        top: [
          {
            id: 222,
            name: "游戏中心",
            tab_id: "游戏中心Top",
            uri: "bilibili://game_center/home",
            pos: 1,
          },
          {
            id: 176,
            name: "消息",
            tab_id: "消息Top",
            uri: "bilibili://link/im_home",
            red_dot: 7,
            pos: 2,
          },
        ],
        bottom: [
          { id: 177, name: "首页", tab_id: "home", pos: 1 },
          {
            id: 670,
            name: "发布",
            tab_id: "publish",
            uri: "bilibili://uper/center_plus",
            pos: 2,
          },
          { id: 179, name: "关注", tab_id: "dynamic", pos: 3 },
          {
            id: 242,
            name: "会员购",
            tab_id: "会员购Bottom",
            uri: "bilibili://mall/home",
            pos: 4,
          },
          { id: 181, name: "我的", tab_id: "我的Bottom", pos: 5 },
        ],
      },
    },
  );
  const data = JSON.parse(result.body).data;

  assert.deepEqual(
    data.tab.map((item) => item.name),
    ["推荐", "热门", "未知新频道"],
  );
  assert.deepEqual(
    data.tab.map((item) => item.pos),
    [1, 2, 3],
  );
  assert.deepEqual(data.top.map((item) => item.name), ["消息"]);
  assert.equal(data.top[0].red_dot, 7);
  assert.deepEqual(
    data.bottom.map((item) => item.name),
    ["首页", "关注", "我的"],
  );
  assert.deepEqual(
    data.bottom.map((item) => item.pos),
    [1, 2, 3],
  );

  const selective = transform(
    `${appRoot}/x/resource/show/tab/v2`,
    {
      code: 0,
      data: {
        tab: [{
          id: 136117,
          name: "新征程",
          uri: "bilibili://following/home_activity_tab/136117",
          pos: 1,
        }],
        top: [{
          id: 222,
          name: "游戏中心",
          uri: "bilibili://game_center/home",
          pos: 1,
        }],
        bottom: [
          {
            id: 670,
            name: "发布",
            uri: "bilibili://uper/center_plus",
            pos: 1,
          },
          {
            id: 242,
            name: "会员购",
            uri: "bilibili://mall/home",
            pos: 2,
          },
        ],
      },
    },
    JSON.stringify({
      hideHomeGame: false,
      hideHomeJourney: false,
      hideBottomPublish: false,
      hideBottomMall: true,
    }),
  );
  const selectiveData = JSON.parse(selective.body).data;
  assert.deepEqual(selectiveData.top.map((item) => item.name), [
    "游戏中心",
  ]);
  assert.deepEqual(selectiveData.tab.map((item) => item.name), [
    "新征程",
  ]);
  assert.deepEqual(selectiveData.bottom.map((item) => item.name), [
    "发布",
  ]);
});

test("mine cleanup preserves account, membership, history, and unknown entries", () => {
  const result = transform(
    `${appRoot}/x/v2/account/mine`,
    {
      code: 0,
      data: {
        account: {
          mid: 123,
          name: "用户",
          vip: { status: 1, due_date: 1893456000 },
        },
        vip: {
          status: 1,
          due_date: 1893456000,
          label: { text: "年度大会员" },
        },
        vip_section: {
          title: "大会员",
          items: [{ title: "续费特惠" }],
        },
        vip_section_v2: {
          title: "大会员限时福利",
        },
        modular_vip_section: {
          modules: [{ title: "会员专享优惠" }],
        },
        vip_banners: [
          {
            image_url: "https://i0.hdslb.com/member-banner.png",
            uri: "https://account.bilibili.com/account/big",
          },
        ],
        marketing_banner: {
          title: "大会员暑期特惠",
          uri: "https://www.bilibili.com/blackboard/activity-vip",
        },
        vip_banner: {
          image_url: "https://i0.hdslb.com/vip-banner.png",
          uri: "https://account.bilibili.com/account/big",
        },
        sections_v2: [
          {
            title: "常用功能",
            items: [
              {
                id: 397,
                title: "历史记录",
                uri: "bilibili://user_center/history",
              },
              {
                id: 400,
                title: "我的课程",
                uri: "https://m.bilibili.com/cheese/mine",
              },
              {
                title: "我的课程",
              },
              {
                id: 1200,
                title: "未知新服务",
                uri: "bilibili://future/service",
              },
            ],
            button: {
              text: "发布你的第一个视频",
              url: "bilibili://uper/user_center/add_archive",
            },
          },
          {
            title: "营销服务",
            items: [
              {
                id: 401,
                title: "看视频免流量",
                uri: "bilibili://user_center/free_traffic",
              },
              {
                id: 990,
                title: "能量加油站",
                uri: "https://www.bilibili.com/blackboard/dynamic/306424",
              },
            ],
            button: {},
          },
        ],
      },
    },
  );
  const data = JSON.parse(result.body).data;

  assert.deepEqual(data.account, {
    mid: 123,
    name: "用户",
    vip: { status: 1, due_date: 1893456000 },
  });
  assert.deepEqual(data.vip, {
    status: 1,
    due_date: 1893456000,
    label: { text: "年度大会员" },
  });
  assert.equal("vip_section" in data, false);
  assert.equal("vip_section_v2" in data, false);
  assert.equal("modular_vip_section" in data, false);
  assert.deepEqual(data.vip_banners, []);
  assert.equal("marketing_banner" in data, false);
  assert.equal("vip_banner" in data, false);
  assert.equal(data.sections_v2.length, 1);
  assert.deepEqual(
    data.sections_v2[0].items.map((item) => item.title),
    ["历史记录", "我的课程", "未知新服务"],
  );
  assert.equal("button" in data.sections_v2[0], false);
});

test("Mine and More service toggles are independent and default-visible", () => {
  const fixture = {
    code: 0,
    data: {
      mid: 123,
      vip: { status: 1, due_date: 1893456000 },
      sections_v2: [{
        title: "我的服务",
        items: [
          {
            id: 404,
            title: "我的钱包",
            uri: "bilibili://bilipay/mine_wallet",
          },
          {
            id: 171,
            title: "创作中心",
            uri: "bilibili://uper/homevc",
          },
          {
            id: 407,
            title: "联系客服",
            uri: "bilibili://user_center/feedback",
          },
          {
            id: 410,
            title: "设置",
            uri: "bilibili://user_center/setting",
          },
          {
            id: 400,
            title: "我的课程",
            uri: "https://m.bilibili.com/cheese/mine",
          },
          {
            id: 9999,
            title: "未来新服务",
            uri: "bilibili://future/service",
          },
        ],
      }],
    },
  };

  const defaults = transform(
    `${appRoot}/x/v2/account/mine`,
    fixture,
  );
  assert.deepEqual(
    JSON.parse(defaults.body).data.sections_v2[0].items.map(
      (item) => item.title,
    ),
    ["我的钱包", "创作中心", "联系客服", "设置", "未来新服务"],
  );

  const customized = transform(
    `${appRoot}/x/v2/account/mine`,
    fixture,
    JSON.stringify({
      hideMineWallet: true,
      hideMoreSettings: true,
    }),
  );
  assert.deepEqual(
    JSON.parse(customized.body).data.sections_v2[0].items.map(
      (item) => item.title,
    ),
    ["创作中心", "联系客服", "未来新服务"],
  );

  const uiDisabled = transform(
    `${appRoot}/x/v2/account/mine`,
    fixture,
    JSON.stringify({
      ui: false,
      hideMineWallet: true,
      hideMoreSettings: true,
    }),
  );
  assert.deepEqual(JSON.parse(uiDisabled.body), fixture);
});

test("fresh Mine responses stay filtered after background resume", () => {
  const fixture = {
    code: 0,
    data: {
      mid: 123,
      vip: {
        status: 1,
        due_date: 1893456000,
      },
      vip_section: {
        title: "大会员",
        items: [{ title: "首月特惠" }],
      },
      vipSectionV2: {
        title: "会员福利横幅",
      },
      modularVipSection: {
        modules: [{ title: "续费领券" }],
      },
      sections_v2: [{
        title: "我的服务",
        items: [
          {
            id: 400,
            title: "我的课程",
            uri: "https://m.bilibili.com/cheese/mine",
          },
          {
            id: 397,
            title: "历史记录",
            uri: "bilibili://user_center/history",
          },
        ],
      }],
    },
  };

  for (let refresh = 0; refresh < 2; refresh += 1) {
    const result = transform(
      `${appRoot}/x/v2/account/mine?refresh=${refresh}`,
      fixture,
    );
    const data = JSON.parse(result.body).data;

    assert.ok(result.changed >= 4);
    assert.deepEqual(data.vip, fixture.data.vip);
    assert.equal("vip_section" in data, false);
    assert.equal("vipSectionV2" in data, false);
    assert.equal("modularVipSection" in data, false);
    assert.deepEqual(
      data.sections_v2[0].items.map((item) => item.title),
      ["历史记录"],
    );
  }

  const vipOnly = transform(
    `${appRoot}/x/v2/account/mine`,
    fixture,
    '{"ui":false}',
  );
  const vipOnlyData = JSON.parse(vipOnly.body).data;
  assert.equal("vip_section" in vipOnlyData, false);
  assert.equal("vipSectionV2" in vipOnlyData, false);
  assert.equal("modularVipSection" in vipOnlyData, false);
  assert.deepEqual(
    vipOnlyData.sections_v2[0].items.map((item) => item.title),
    ["我的课程", "历史记录"],
  );

  const uiOnly = transform(
    `${appRoot}/x/v2/account/mine`,
    fixture,
    '{"ads":false}',
  );
  const uiOnlyData = JSON.parse(uiOnly.body).data;
  assert.equal("vip_section" in uiOnlyData, true);
  assert.equal("vipSectionV2" in uiOnlyData, true);
  assert.equal("modularVipSection" in uiOnlyData, true);
  assert.deepEqual(
    uiOnlyData.sections_v2[0].items.map((item) => item.title),
    ["历史记录"],
  );

  const disabled = transform(
    `${appRoot}/x/v2/account/mine`,
    fixture,
    '{"ui":false,"vipPromotions":false}',
  );
  assert.deepEqual(JSON.parse(disabled.body), fixture);
});

test("VIP center cleanup removes only marketing overlays and banners", () => {
  const fixture = {
    code: 0,
    data: {
      user: {
        mid: 123,
        vip_status: 1,
        due_date: 1893456000,
      },
      wallet: { balance: 88 },
      privileges: [{ id: 1, enabled: true }],
      orders: [{ id: "order-1", amount: 25 }],
      payment: { channel: "apple" },
      banners: [{
        title: "大会员限时特惠",
        uri: "https://www.bilibili.com/blackboard/activity-vip",
      }],
      banner_list: [{
        title: "续费领券",
        uri: "https://account.bilibili.com/account/big",
      }],
      marketingBanners: [{
        title: "年度大会员",
        uri: "https://www.bilibili.com/blackboard/activity-vip",
      }],
      popup: {
        creative_id: 42,
        title: "续费优惠",
      },
      dialog: {
        title: "账号安全提示",
        uri: "bilibili://security/check",
      },
      future_payload: { keep: true },
    },
  };
  const result = transform(
    `${apiRoot}/x/vip/web/vip_center/combine`,
    fixture,
  );
  const data = JSON.parse(result.body).data;

  assert.deepEqual(data.banners, []);
  assert.deepEqual(data.banner_list, []);
  assert.deepEqual(data.marketingBanners, []);
  assert.equal("popup" in data, false);
  assert.deepEqual(data.dialog, fixture.data.dialog);
  assert.deepEqual(data.user, fixture.data.user);
  assert.deepEqual(data.wallet, fixture.data.wallet);
  assert.deepEqual(data.privileges, fixture.data.privileges);
  assert.deepEqual(data.orders, fixture.data.orders);
  assert.deepEqual(data.payment, fixture.data.payment);
  assert.deepEqual(data.future_payload, { keep: true });

  const repeated = enhance.transformJsonText(
    result.body,
    `${apiRoot}/x/vip/web/vip_center/combine`,
    enhance.parseArgument(""),
  );
  assert.equal(repeated.changed, 0);
  assert.equal(repeated.body, result.body);

  const disabled = transform(
    `${apiRoot}/x/vip/web/vip_center/combine`,
    fixture,
    '{"vipPromotions":false}',
  );
  assert.deepEqual(JSON.parse(disabled.body), fixture);
});

test("VIP ad-material responses are neutralized on every host", () => {
  const fixture = {
    code: 0,
    message: "0",
    ttl: 1,
    data: {
      materials: [{
        id: 42,
        title: "大会员限时优惠",
        image: "https://i0.hdslb.com/vip-ad.png",
      }],
    },
    trace_id: "keep-trace",
  };

  for (const url of [
    `${appRoot}/x/vip/ads/materials?position=mine`,
    "https://api.biliapi.net/x/vip/ads/materials?position=mine",
  ]) {
    const first = transform(url, fixture);
    const firstBody = JSON.parse(first.body);
    assert.equal(first.endpoint, "vip-materials");
    assert.equal(first.changed, 1);
    assert.equal(firstBody.data, null);
    assert.equal(firstBody.code, 0);
    assert.equal(firstBody.trace_id, "keep-trace");

    const repeated = enhance.transformJsonText(
      first.body,
      url,
      enhance.parseArgument(""),
    );
    assert.equal(repeated.changed, 0);
    assert.equal(repeated.body, first.body);
  }

  const disabled = transform(
    `${appRoot}/x/vip/ads/materials`,
    fixture,
    '{"vipPromotions":false}',
  );
  assert.deepEqual(JSON.parse(disabled.body), fixture);

  const adsDisabled = transform(
    `${appRoot}/x/vip/ads/materials`,
    fixture,
    '{"ads":false}',
  );
  assert.deepEqual(JSON.parse(adsDisabled.body), fixture);
});

test("dedicated activity, shopping, and game material APIs return empty safe shapes", () => {
  const fixtures = [
    {
      endpoint: `${appRoot}/x/resource/top/activity`,
      expected: { code: -404, data: null, message: "-404", ttl: 1 },
    },
    {
      endpoint: `${apiRoot}/x/resource/patch/tab/v2`,
      expected: { code: -404, data: null, message: "-404", ttl: 1 },
    },
    {
      endpoint: `${apiRoot}/pgc/activity/deliver/material/receive`,
      expected: {
        code: 0,
        data: {
          closeType: "close_win",
          container: [],
          showTime: "",
        },
        message: "success",
      },
    },
    {
      endpoint:
        "https://api.live.bilibili.com/xlive/e-commerce-interface/v1/ecommerce-user/get_shopping_info",
      expected: {},
    },
    {
      endpoint:
        "https://line3-h5-mobile-api.biligame.com/game/live/large_card_material",
      expected: { code: 0, message: "success" },
    },
  ];

  for (const fixture of fixtures) {
    const result = transform(
      fixture.endpoint,
      {
        code: 0,
        data: {
          creative_id: 123,
          image: "https://i0.hdslb.com/promotion.png",
          url: "bilibili://mall/activity",
        },
      },
    );
    assert.deepEqual(JSON.parse(result.body), fixture.expected);
    assert.equal(result.changed, 1);

    const repeated = enhance.transformJsonText(
      result.body,
      fixture.endpoint,
      enhance.parseArgument(""),
    );
    assert.equal(repeated.changed, 0);
  }

  const shoppingDisabled = transform(
    "https://api.live.bilibili.com/xlive/e-commerce-interface/v1/ecommerce-user/get_shopping_info",
    { code: 0, data: { shopping: true } },
    '{"liveShopping":false}',
  );
  assert.equal(shoppingDisabled.changed, 0);
});

test("JSON cleanup is idempotent across repeated refresh responses", () => {
  const url = `${appRoot}/x/v2/account/mine`;
  const first = enhance.transformJsonText(
    JSON.stringify({
      code: 0,
      data: {
        sections_v2: [{
          items: [
            {
              id: 400,
              title: "我的课程",
              uri: "https://m.bilibili.com/cheese/mine",
            },
            {
              id: 397,
              title: "历史记录",
              uri: "bilibili://user_center/history",
            },
          ],
        }],
      },
    }),
    url,
    enhance.parseArgument(""),
  );
  const second = enhance.transformJsonText(
    first.body,
    url,
    enhance.parseArgument(""),
  );

  assert.ok(first.changed > 0);
  assert.equal(second.changed, 0);
  assert.equal(second.body, first.body);
});

test("handles view, reply, PGC, web feed, and live ads conservatively", () => {
  const view = transform(
    `${appRoot}/x/v2/view?aid=1`,
    {
      code: 0,
      data: {
        cm: { source: "ad" },
        relates: [
          { aid: 1, goto: "av", title: "正常推荐" },
          { aid: 2, cm: { source: "ad" } },
        ],
      },
    },
  );
  assert.deepEqual(JSON.parse(view.body).data.relates, [
    { aid: 1, goto: "av", title: "正常推荐" },
  ]);

  const reply = transform(
    `${apiRoot}/x/v2/reply/main?oid=1`,
    {
      code: 0,
      data: {
        cm: { source: "ad" },
        top_replies: [
          { content: { message: "正常置顶评论", url: {} } },
          {
            content: {
              message: "商业链接 https://b23.tv/mall/abc",
              url: {},
            },
          },
        ],
      },
    },
  );
  assert.equal(JSON.parse(reply.body).data.top_replies.length, 1);

  const pgc = transform(
    `${apiRoot}/pgc/page/cinema/tab`,
    {
      code: 0,
      result: {
        modules: [
          {
            style: "banner_v2",
            items: [
              { title: "正常播放", link: "bilibili://video/1" },
              { title: "游戏推广", link: "bilibili://game_center/home" },
            ],
          },
          {
            style: "future_style",
            items: [{ title: "未知模块", link: "https://example.com" }],
          },
        ],
      },
    },
  );
  assert.equal(JSON.parse(pgc.body).result.modules[0].items.length, 1);

  const webFeed = transform(
    `${apiRoot}/x/web-interface/wbi/index/top/feed/rcmd`,
    {
      code: 0,
      data: {
        item: [
          {
            goto: "av",
            bvid: "BV1xx411c7mD",
            uri: "https://www.bilibili.com/video/BV1xx411c7mD",
            title: "正常视频",
          },
          { goto: "ad", title: "广告" },
        ],
      },
    },
  );
  assert.equal(JSON.parse(webFeed.body).data.item.length, 1);

  const live = transform(
    "https://api.live.bilibili.com/xlive/app-room/v1/index/getInfoByRoom",
    {
      code: 0,
      data: {
        activity_banner_info: { id: 1 },
        shopping_info: { is_show: 1, detail: { id: 2 } },
        new_tab_info: {
          outer_list: [
            { biz_id: 33, title: "购物" },
            { biz_id: 8, title: "正常互动" },
          ],
        },
        room_info: { room_id: 1 },
      },
    },
  );
  const liveData = JSON.parse(live.body).data;
  assert.equal("activity_banner_info" in liveData, false);
  assert.deepEqual(liveData.shopping_info, { is_show: 0 });
  assert.deepEqual(liveData.new_tab_info.outer_list, [
    { biz_id: 8, title: "正常互动" },
  ]);
  assert.deepEqual(liveData.room_info, { room_id: 1 });

  const liveShoppingDisabled = transform(
    "https://api.live.bilibili.com/xlive/app-room/v1/index/getInfoByRoom",
    {
      data: {
        activity_banner_info: { id: 1 },
        shopping_info: { is_show: 1 },
        new_tab_info: {
          outer_list: [{ biz_id: 33, title: "购物" }],
        },
      },
    },
    '{"ads":true,"liveShopping":false}',
  );
  const disabledData = JSON.parse(liveShoppingDisabled.body).data;
  assert.equal("activity_banner_info" in disabledData, false);
  assert.deepEqual(disabledData.shopping_info, { is_show: 1 });
  assert.deepEqual(disabledData.new_tab_info.outer_list, [
    { biz_id: 33, title: "购物" },
  ]);
});

test("view recommendations keep only ordinary videos by default", () => {
  const fixture = {
    code: 0,
    data: {
      cm: { source: "ad" },
      relates: [
        {
          aid: 1,
          bvid: "BV1xx411c7mD",
          goto: "av",
          title: "普通 UP 主视频",
          badge: "UP",
        },
        {
          aid: 2,
          title: "无法明确确认类型的旧版卡片",
        },
        {
          aid: 10,
          goto: "av",
          title: "普通 UP 主拍了一部纪录片",
        },
        {
          goto: "ogv",
          card_type_en: "documentary",
          badge: "纪录片",
          title: "纪录片",
        },
        {
          aid: 3,
          goto: "av",
          badge_info: { text: "综艺" },
          title: "综艺",
        },
        {
          goto: "bangumi",
          season_id: 1,
          title: "番剧",
        },
        {
          goto: "live",
          room_id: 1,
          title: "直播",
        },
        {
          goto: "game",
          title: "游戏",
        },
        {
          goto: "resource",
          title: "资源卡",
        },
        {
          goto: "special",
          title: "特殊卡",
        },
        {
          aid: 6,
          player_args: { type: "live" },
          title: "缺少 goto 的直播卡",
        },
        {
          aid: 7,
          uri: "bilibili://bangumi/season/1",
          title: "缺少 goto 的番剧卡",
        },
        {
          aid: 8,
          goto: "av",
          player_args: { type: "live" },
          title: "冲突标记的直播卡",
        },
        {
          aid: 9,
          goto: "av",
          uri: "bilibili://bangumi/season/2",
          title: "冲突标记的番剧卡",
        },
        {
          aid: 4,
          goto: "av",
          rcmd_reason: { content: "必火推荐" },
          title: "商业推荐",
        },
        {
          aid: 5,
          goto: "av",
          desc_button: { text: "立即下载" },
          title: "下载广告",
        },
        {
          title: "无法确认类型的卡片",
        },
      ],
    },
  };
  const strict = transform(
    `${appRoot}/x/v2/view?aid=1`,
    fixture,
  );
  assert.deepEqual(
    JSON.parse(strict.body).data.relates.map((item) => item.title),
    [
      "普通 UP 主视频",
      "普通 UP 主拍了一部纪录片",
    ],
  );
  const strictAgain = enhance.transformJsonText(
    strict.body,
    `${appRoot}/x/v2/view?aid=1`,
    enhance.parseArgument(""),
  );
  assert.equal(strictAgain.changed, 0);
  assert.equal(strictAgain.body, strict.body);

  const relaxed = transform(
    `${appRoot}/x/v2/view?aid=1`,
    fixture,
    '{"videoOnlyRecommendations":false}',
  );
  const relaxedTitles = JSON.parse(relaxed.body).data.relates.map(
    (item) => item.title,
  );
  assert.ok(relaxedTitles.includes("纪录片"));
  assert.ok(relaxedTitles.includes("综艺"));
  assert.ok(relaxedTitles.includes("直播"));
  assert.ok(relaxedTitles.includes("无法确认类型的卡片"));
  assert.ok(!relaxedTitles.includes("商业推荐"));
  assert.ok(!relaxedTitles.includes("下载广告"));
});

test("gRPC View v1 keeps only explicit AV relations by default", () => {
  const normalRelate = bytes(
    stringField(3, "normal-related-video"),
    stringField(7, "av"),
  );
  const specialRelate = bytes(
    stringField(3, "documentary-related-card"),
    stringField(7, "special"),
  );
  const adRelate = bytes(
    stringField(3, "commercial-related-card"),
    messageField(28, stringField(1, "type.googleapis.com/cm")),
  );
  const reply = bytes(
    messageField(10, normalRelate),
    messageField(10, specialRelate),
    messageField(10, adRelate),
    messageField(30, stringField(1, "cm-body")),
    messageField(31, stringField(1, "cm-config")),
    stringField(99, "unknown-field-must-stay"),
  );
  const result = enhance.transformGrpcBody(
    grpcFrame(reply),
    "https://grpc.biliapi.net/bilibili.app.view.v1.View/View",
    enhance.parseArgument(""),
  );
  const output = grpcPayload(result.body);
  const outputText = Buffer.from(output).toString("latin1");

  assert.equal(result.valid, true);
  assert.equal(result.changed, 4);
  assert.equal(protoFields(output, 10, 2).length, 1);
  assert.equal(protoFields(output, 30).length, 0);
  assert.equal(protoFields(output, 31).length, 0);
  assert.match(outputText, /normal-related-video/);
  assert.match(outputText, /unknown-field-must-stay/);
  assert.doesNotMatch(outputText, /documentary-related-card/);
  assert.doesNotMatch(outputText, /commercial-related-card/);

  const relaxed = enhance.transformGrpcBody(
    grpcFrame(reply),
    "https://grpc.biliapi.net/bilibili.app.view.v1.View/View",
    enhance.parseArgument('{"videoOnlyRecommendations":false}'),
  );
  const relaxedText = Buffer.from(grpcPayload(relaxed.body)).toString(
    "latin1",
  );
  assert.match(relaxedText, /normal-related-video/);
  assert.match(relaxedText, /documentary-related-card/);
  assert.doesNotMatch(relaxedText, /commercial-related-card/);
});

test("gRPC ViewUnite keeps only AV cards and filters promotion modules", () => {
  const card = (type, title, payloadField, extra) =>
    bytes(
      varintField(1, type),
      ...(payloadField
        ? [messageField(
            payloadField,
            stringField(1, `${title}-payload`),
          )]
        : []),
      messageField(
        12,
        bytes(
          stringField(1, title),
          ...(extra === "unique"
            ? [stringField(6, "promotion-id")]
            : []),
        ),
      ),
      ...(extra === "stock"
        ? [messageField(11, stringField(1, "stock"))]
        : []),
    );
  const relates = bytes(
    messageField(1, card(1, "normal-av", 2)),
    messageField(1, card(0, "unknown-card")),
    messageField(1, card(2, "bangumi-card", 3)),
    messageField(1, card(3, "resource-card", 4)),
    messageField(1, card(4, "game-promotion", 5)),
    messageField(1, card(5, "cm-promotion", 6)),
    messageField(1, card(6, "live-card", 7)),
    messageField(1, card(7, "ai-recommend-card", 9)),
    messageField(1, card(8, "bangumi-av-card", 8)),
    messageField(1, card(9, "bangumi-ugc-card", 13)),
    messageField(1, card(10, "special-card", 14)),
    messageField(1, card(11, "course-promotion")),
    messageField(1, card(1, "stock-promotion", 2, "stock")),
    messageField(1, card(1, "unique-promotion", 2, "unique")),
    messageField(1, card(1, "disguised-documentary", 3)),
    messageField(1, card(1, "disguised-live", 7)),
    messageField(1, card(1, "disguised-game-ad", 5)),
  );
  const module = bytes(
    varintField(1, 28),
    messageField(22, relates),
  );
  const introduction = bytes(
    messageField(2, module),
    messageField(
      2,
      bytes(varintField(1, 18), stringField(3, "activity-banner")),
    ),
    messageField(
      2,
      bytes(varintField(1, 29), stringField(3, "vip-banner")),
    ),
    messageField(
      2,
      bytes(varintField(1, 55), stringField(3, "up-goods")),
    ),
    messageField(
      2,
      bytes(varintField(1, 99), stringField(3, "future-module")),
    ),
  );
  const tabModule = bytes(
    varintField(1, 1),
    messageField(2, introduction),
  );
  const tab = messageField(1, tabModule);
  const reply = bytes(
    messageField(5, tab),
    messageField(7, stringField(1, "top-level-cm")),
    stringField(10, "unknown-report"),
  );
  const result = enhance.transformGrpcBody(
    grpcFrame(reply),
    "https://app.bilibili.com/bilibili.app.viewunite.v1.View/View",
    enhance.parseArgument(""),
  );
  const outputText = Buffer.from(grpcPayload(result.body)).toString(
    "latin1",
  );

  assert.equal(result.valid, true);
  assert.equal(result.changed, 20);
  assert.match(outputText, /normal-av/);
  assert.match(outputText, /unknown-report/);
  assert.match(outputText, /future-module/);
  assert.doesNotMatch(outputText, /game-promotion/);
  assert.doesNotMatch(outputText, /cm-promotion/);
  assert.doesNotMatch(outputText, /course-promotion/);
  assert.doesNotMatch(outputText, /unknown-card/);
  assert.doesNotMatch(outputText, /bangumi-card/);
  assert.doesNotMatch(outputText, /resource-card/);
  assert.doesNotMatch(outputText, /live-card/);
  assert.doesNotMatch(outputText, /ai-recommend-card/);
  assert.doesNotMatch(outputText, /bangumi-av-card/);
  assert.doesNotMatch(outputText, /bangumi-ugc-card/);
  assert.doesNotMatch(outputText, /special-card/);
  assert.doesNotMatch(outputText, /stock-promotion/);
  assert.doesNotMatch(outputText, /unique-promotion/);
  assert.doesNotMatch(outputText, /disguised-documentary/);
  assert.doesNotMatch(outputText, /disguised-live/);
  assert.doesNotMatch(outputText, /disguised-game-ad/);
  assert.doesNotMatch(outputText, /activity-banner/);
  assert.doesNotMatch(outputText, /vip-banner/);
  assert.doesNotMatch(outputText, /up-goods/);
  assert.doesNotMatch(outputText, /top-level-cm/);
  const repeated = enhance.transformGrpcBody(
    result.body,
    "https://app.bilibili.com/bilibili.app.viewunite.v1.View/View",
    enhance.parseArgument(""),
  );
  assert.equal(repeated.changed, 0);
  assert.deepEqual(Buffer.from(repeated.body), Buffer.from(result.body));

  const relaxed = enhance.transformGrpcBody(
    grpcFrame(reply),
    "https://app.bilibili.com/bilibili.app.viewunite.v1.View/View",
    enhance.parseArgument('{"videoOnlyRecommendations":false}'),
  );
  const relaxedText = Buffer.from(
    grpcPayload(relaxed.body),
  ).toString("latin1");
  assert.match(relaxedText, /bangumi-card/);
  assert.match(relaxedText, /resource-card/);
  assert.match(relaxedText, /live-card/);
  assert.match(relaxedText, /special-card/);
  assert.match(relaxedText, /disguised-documentary/);
  assert.match(relaxedText, /disguised-live/);
  assert.doesNotMatch(relaxedText, /game-promotion/);
  assert.doesNotMatch(relaxedText, /cm-promotion/);
  assert.doesNotMatch(relaxedText, /course-promotion/);
  assert.doesNotMatch(relaxedText, /stock-promotion/);
  assert.doesNotMatch(relaxedText, /unique-promotion/);
  assert.doesNotMatch(relaxedText, /disguised-game-ad/);

  const vipDisabled = enhance.transformGrpcBody(
    grpcFrame(reply),
    "https://app.bilibili.com/bilibili.app.viewunite.v1.View/View",
    enhance.parseArgument('{"vipPromotions":false}'),
  );
  const vipDisabledText = Buffer.from(
    grpcPayload(vipDisabled.body),
  ).toString("latin1");
  assert.match(vipDisabledText, /vip-banner/);
  assert.doesNotMatch(vipDisabledText, /activity-banner/);
  assert.doesNotMatch(vipDisabledText, /up-goods/);
});

test("gRPC RelatesFeed endpoints use the same ordinary-video allowlist", () => {
  const v1 = enhance.transformGrpcBody(
    grpcFrame(
      bytes(
        messageField(
          1,
          bytes(stringField(3, "v1-av"), stringField(7, "av")),
        ),
        messageField(
          1,
          bytes(stringField(3, "v1-special"), stringField(7, "special")),
        ),
      ),
    ),
    "https://grpc.biliapi.net/bilibili.app.view.v1.View/RelatesFeed",
    enhance.parseArgument(""),
  );
  const v1Text = Buffer.from(grpcPayload(v1.body)).toString("latin1");
  assert.match(v1Text, /v1-av/);
  assert.doesNotMatch(v1Text, /v1-special/);

  const uniteCard = (type, title) =>
    bytes(
      varintField(1, type),
      ...(type === 1
        ? [messageField(2, stringField(1, `${title}-payload`))]
        : [messageField(3, stringField(1, `${title}-payload`))]),
      messageField(12, stringField(1, title)),
    );
  const unite = enhance.transformGrpcBody(
    grpcFrame(
      bytes(
        messageField(1, uniteCard(1, "unite-av")),
        messageField(1, uniteCard(2, "unite-bangumi")),
      ),
    ),
    "https://app.bilibili.com/bilibili.app.viewunite.v1.View/RelatesFeed",
    enhance.parseArgument(""),
  );
  const uniteText = Buffer.from(
    grpcPayload(unite.body),
  ).toString("latin1");
  assert.match(uniteText, /unite-av/);
  assert.doesNotMatch(uniteText, /unite-bangumi/);
});

test("ViewProgress removes pause-time promotion containers after every resume", async () => {
  const legacyReply = bytes(
    messageField(
      1,
      bytes(
        messageField(1, stringField(1, "normal-attention-card")),
        messageField(3, stringField(1, "legacy-pause-ad")),
      ),
    ),
    messageField(2, stringField(1, "keep-legacy-chronos")),
    messageField(3, stringField(1, "keep-legacy-shot")),
    stringField(99, "keep-legacy-future-field"),
  );

  for (let resume = 0; resume < 2; resume += 1) {
    const legacy = enhance.transformGrpcBody(
      grpcFrame(legacyReply),
      "https://grpc.biliapi.net/bilibili.app.view.v1.View/ViewProgress",
      enhance.parseArgument(""),
    );
    const output = grpcPayload(legacy.body);
    const outputText = Buffer.from(output).toString("latin1");

    assert.equal(legacy.endpoint, "grpc-view-v1-progress");
    assert.equal(legacy.changed, 1);
    assert.equal(protoFields(output, 1, 2).length, 0);
    assert.match(outputText, /keep-legacy-chronos/);
    assert.match(outputText, /keep-legacy-shot/);
    assert.match(outputText, /keep-legacy-future-field/);
    assert.doesNotMatch(outputText, /legacy-pause-ad/);
  }

  const currentReply = bytes(
    messageField(1, stringField(1, "keep-current-video-guide")),
    messageField(2, stringField(1, "keep-current-chronos")),
    messageField(3, stringField(1, "keep-current-shot")),
    messageField(
      4,
      bytes(
        messageField(1, stringField(1, "normal-command-dm")),
        messageField(3, stringField(1, "current-pause-ad")),
      ),
    ),
    stringField(99, "keep-current-future-field"),
  );
  const current = await enhance.transformGrpcBodyAsync(
    grpcFrame(new Uint8Array(gzipSync(currentReply)), 1),
    "https://app.bilibili.com/bilibili.app.viewunite.v1.View/ViewProgress",
    enhance.parseArgument(""),
  );
  const currentOutput = grpcPayload(current.body);
  const currentText = Buffer.from(currentOutput).toString("latin1");

  assert.equal(current.endpoint, "grpc-view-unite-progress");
  assert.equal(current.valid, true);
  assert.equal(current.changed, 1);
  assert.equal(current.body[0], 0);
  assert.equal(protoFields(currentOutput, 4, 2).length, 0);
  assert.match(currentText, /keep-current-video-guide/);
  assert.match(currentText, /keep-current-chronos/);
  assert.match(currentText, /keep-current-shot/);
  assert.match(currentText, /keep-current-future-field/);
  assert.doesNotMatch(currentText, /current-pause-ad/);

  const repeated = enhance.transformGrpcBody(
    current.body,
    "https://app.bilibili.com/bilibili.app.viewunite.v1.View/ViewProgress",
    enhance.parseArgument(""),
  );
  assert.equal(repeated.changed, 0);
  assert.deepEqual(Buffer.from(repeated.body), Buffer.from(current.body));

  const disabled = enhance.transformGrpcBody(
    grpcFrame(legacyReply),
    "https://grpc.biliapi.net/bilibili.app.view.v1.View/ViewProgress",
    enhance.parseArgument('{"ads":false}'),
  );
  assert.equal(disabled.changed, 0);
  assert.deepEqual(
    Buffer.from(disabled.body),
    Buffer.from(grpcFrame(legacyReply)),
  );
});

test("9.4.0 PlayPause and ViewEndPage responses are neutralized before rendering", async () => {
  const pausePayload = bytes(
    messageField(1, stringField(1, "taobao-flash-sale-app")),
    messageField(2, stringField(1, "pause-commerce-card")),
  );
  for (const method of ["PlayPause", "ViewEndPage"]) {
    const result = await enhance.transformGrpcBodyAsync(
      grpcFrame(new Uint8Array(gzipSync(pausePayload)), 1),
      `https://grpc.biliapi.net/bilibili.app.viewunite.v1.View/${method}`,
      enhance.parseArgument(""),
    );
    assert.equal(result.valid, true);
    assert.equal(result.changed, 1);
    assert.equal(result.body.length, 5);
    assert.deepEqual(
      Array.from(result.body),
      [0, 0, 0, 0, 0],
    );

    const disabled = enhance.transformGrpcBody(
      grpcFrame(pausePayload),
      `https://app.bilibili.com/bilibili.app.viewunite.v1.View/${method}`,
      enhance.parseArgument('{"ads":false}'),
    );
    assert.equal(disabled.changed, 0);
    assert.match(
      Buffer.from(disabled.body).toString("latin1"),
      /taobao-flash-sale-app/,
    );
  }
});

test("Mine PubModule removes only asynchronous publishing guides after resume", () => {
  const publishingGuide = bytes(
    messageField(1, stringField(1, "first-video-and-reward-guide")),
    varintField(5, 1),
  );
  const ordinaryUgc = bytes(
    messageField(2, stringField(1, "published-video-card")),
    varintField(5, 2),
  );
  const reply = bytes(
    messageField(1, publishingGuide),
    messageField(1, ordinaryUgc),
  );
  const result = enhance.transformGrpcBody(
    grpcFrame(reply),
    "https://app.bilibili.com/bilibili.app.mine.v1.Mine/PubModule",
    enhance.parseArgument(""),
  );
  const output = grpcPayload(result.body);
  const text = Buffer.from(output).toString("latin1");

  assert.equal(result.endpoint, "grpc-mine-pub-module");
  assert.equal(result.changed, 1);
  assert.equal(protoFields(output, 1, 2).length, 1);
  assert.doesNotMatch(text, /first-video-and-reward-guide/);
  assert.match(text, /published-video-card/);

  const disabled = enhance.transformGrpcBody(
    grpcFrame(reply),
    "https://grpc.biliapi.net/bilibili.app.mine.v1.Mine/PubModule",
    enhance.parseArgument(
      '{"hideMineFirstVideo":false,"hideMineRewardPublish":false}',
    ),
  );
  assert.equal(disabled.changed, 0);
});

test("Popular fallback feed keeps exactly six explicit ordinary AV cards", () => {
  function popularCard(oneofField, gotoValue, aid, title, ad) {
    const base = bytes(
      stringField(2, gotoValue),
      stringField(3, gotoValue),
      stringField(4, String(aid)),
      messageField(10, varintField(2, aid)),
      ...(ad
        ? [messageField(12, stringField(1, "commercial"))]
        : []),
    );
    const container = bytes(
      messageField(1, base),
      stringField(5, title),
    );
    return messageField(oneofField, container);
  }

  const cards = [];
  for (let index = 1; index <= 8; index += 1) {
    cards.push(
      messageField(
        1,
        popularCard(
          index % 2 === 0 ? 2 : 1,
          "av",
          1000 + index,
          `ordinary-${index}`,
          false,
        ),
      ),
    );
  }
  cards.splice(
    1,
    0,
    messageField(
      1,
      popularCard(11, "av", 9001, "explicit-ad", true),
    ),
    messageField(
      1,
      popularCard(1, "live", 9002, "live-card", false),
    ),
    messageField(
      1,
      popularCard(1, "game", 9003, "game-card", false),
    ),
  );

  const input = grpcFrame(bytes(...cards));
  const result = enhance.transformGrpcBody(
    input,
    "https://grpc.biliapi.net/bilibili.app.show.v1.Popular/Index",
    enhance.parseArgument(""),
  );
  const output = grpcPayload(result.body);
  const text = Buffer.from(output).toString("latin1");

  assert.equal(result.endpoint, "grpc-popular");
  assert.equal(protoFields(output, 1, 2).length, 6);
  for (let index = 1; index <= 6; index += 1) {
    assert.match(text, new RegExp(`ordinary-${index}`));
  }
  assert.doesNotMatch(text, /ordinary-7|ordinary-8/);
  assert.doesNotMatch(text, /explicit-ad|live-card|game-card/);

  const disabled = enhance.transformGrpcBody(
    input,
    "https://app.bilibili.com/bilibili.app.show.v1.Popular/Index",
    enhance.parseArgument(
      '{"ads":false,"homeFeedVideoOnly":false}',
    ),
  );
  assert.equal(disabled.changed, 0);
  assert.deepEqual(Buffer.from(disabled.body), Buffer.from(input));
});

test("compressed first ViewUnite response removes the under-player ad and disguised cards", async () => {
  const card = (type, title, payloadField) =>
    bytes(
      varintField(1, type),
      messageField(payloadField, stringField(1, `${title}-payload`)),
      messageField(12, stringField(1, title)),
    );
  const relates = bytes(
    messageField(1, card(1, "ordinary-ugc-video", 2)),
    messageField(1, card(1, "documentary-disguised-as-av", 3)),
    messageField(1, card(1, "live-disguised-as-av", 7)),
    messageField(1, card(1, "game-ad-disguised-as-av", 5)),
  );
  const reply = bytes(
    messageField(
      5,
      messageField(
        1,
        bytes(
          varintField(1, 1),
          messageField(
            2,
            messageField(
              2,
              bytes(varintField(1, 28), messageField(22, relates)),
            ),
          ),
        ),
      ),
    ),
    messageField(7, stringField(1, "jd-under-player-ad")),
  );
  const compressedFrame = grpcFrame(
    new Uint8Array(gzipSync(reply)),
    1,
  );
  const result = await enhance.transformGrpcBodyAsync(
    compressedFrame,
    "https://app.bilibili.com/bilibili.app.viewunite.v1.View/View",
    enhance.parseArgument(""),
  );
  const outputText = Buffer.from(grpcPayload(result.body)).toString(
    "latin1",
  );

  assert.equal(result.valid, true);
  assert.equal(result.body[0], 0);
  assert.match(outputText, /ordinary-ugc-video/);
  assert.doesNotMatch(outputText, /jd-under-player-ad/);
  assert.doesNotMatch(outputText, /documentary-disguised-as-av/);
  assert.doesNotMatch(outputText, /live-disguised-as-av/);
  assert.doesNotMatch(outputText, /game-ad-disguised-as-av/);
});

test("gRPC dynamic, search, and reply filters use endpoint-specific fields", () => {
  const dynamicList = bytes(
    messageField(
      1,
      bytes(varintField(1, 2), stringField(6, "normal-dynamic")),
    ),
    messageField(
      1,
      bytes(varintField(1, 15), stringField(6, "ad-dynamic")),
    ),
  );
  const dynamic = enhance.transformGrpcBody(
    grpcFrame(messageField(1, dynamicList)),
    "https://grpc.biliapi.net/bilibili.app.dynamic.v2.Dynamic/DynAll",
    enhance.parseArgument(""),
  );
  const dynamicText = Buffer.from(
    grpcPayload(dynamic.body),
  ).toString("latin1");
  assert.match(dynamicText, /normal-dynamic/);
  assert.doesNotMatch(dynamicText, /ad-dynamic/);

  const searchReply = bytes(
    messageField(
      4,
      bytes(stringField(1, "normal-search"), messageField(37, new Uint8Array())),
    ),
    messageField(
      4,
      bytes(stringField(1, "cm-search"), messageField(25, new Uint8Array())),
    ),
    messageField(
      4,
      bytes(stringField(1, "game-search"), messageField(11, new Uint8Array())),
    ),
  );
  const search = enhance.transformGrpcBody(
    grpcFrame(searchReply),
    "https://grpc.biliapi.net/bilibili.polymer.app.search.v1.Search/SearchAll",
    enhance.parseArgument(""),
  );
  const searchText = Buffer.from(grpcPayload(search.body)).toString(
    "latin1",
  );
  assert.match(searchText, /normal-search/);
  assert.doesNotMatch(searchText, /cm-search/);
  assert.doesNotMatch(searchText, /game-search/);

  const normalContent = stringField(1, "normal pinned reply");
  const commercialContent = stringField(
    1,
    "buy https://b23.tv/mall/abc",
  );
  const replyMessage = bytes(
    messageField(11, stringField(1, "comment-cm")),
    messageField(14, messageField(12, normalContent)),
    messageField(14, messageField(12, commercialContent)),
  );
  const reply = enhance.transformGrpcBody(
    grpcFrame(replyMessage),
    "https://grpc.bilibili.com/bilibili.main.community.reply.v1.Reply/MainList",
    enhance.parseArgument(""),
  );
  const replyText = Buffer.from(grpcPayload(reply.body)).toString(
    "latin1",
  );
  assert.match(replyText, /normal pinned reply/);
  assert.doesNotMatch(replyText, /comment-cm/);
  assert.doesNotMatch(replyText, /b23\.tv\/mall/);
});

test("gRPC compressed, disabled, and malformed responses fail open", () => {
  const payload = messageField(30, stringField(1, "cm-body"));
  const compressed = grpcFrame(payload, 1);
  const disabled = enhance.transformGrpcBody(
    grpcFrame(payload),
    "https://grpc.biliapi.net/bilibili.app.view.v1.View/View",
    enhance.parseArgument('{"ads":false}'),
  );
  const compressedResult = enhance.transformGrpcBody(
    compressed,
    "https://grpc.biliapi.net/bilibili.app.view.v1.View/View",
    enhance.parseArgument(""),
  );
  const malformed = new Uint8Array([0, 0, 0, 0, 20, 8, 1]);
  const malformedResult = enhance.transformGrpcBody(
    malformed,
    "https://grpc.biliapi.net/bilibili.app.view.v1.View/View",
    enhance.parseArgument(""),
  );

  assert.equal(disabled.changed, 0);
  assert.deepEqual(Buffer.from(disabled.body), Buffer.from(grpcFrame(payload)));
  assert.equal(compressedResult.changed, 0);
  assert.deepEqual(
    Buffer.from(compressedResult.body),
    Buffer.from(compressed),
  );
  assert.equal(malformedResult.valid, false);
  assert.equal(malformedResult.changed, 0);
  assert.deepEqual(
    Buffer.from(malformedResult.body),
    Buffer.from(malformed),
  );
});

test("View v1 and TFInfo remove every known under-player marketing field", () => {
  const view = enhance.transformGrpcBody(
    grpcFrame(
      bytes(
        messageField(30, stringField(1, "cms")),
        messageField(31, stringField(1, "cm-config")),
        messageField(34, stringField(1, "carrier-panel")),
        messageField(41, stringField(1, "cm-ipad")),
        messageField(48, stringField(1, "legacy-under-player-cm")),
        stringField(99, "keep-view-field"),
      ),
    ),
    "https://grpc.biliapi.net/bilibili.app.view.v1.View/View",
    enhance.parseArgument(""),
  );
  const tfInfo = enhance.transformGrpcBody(
    grpcFrame(
      bytes(
        varintField(1, 123),
        messageField(2, stringField(1, "carrier-toast")),
        messageField(3, stringField(1, "carrier-custom-panel")),
        varintField(4, 1),
      ),
    ),
    "https://grpc.biliapi.net/bilibili.app.view.v1.View/TFInfo",
    enhance.parseArgument(""),
  );
  const viewText = Buffer.from(grpcPayload(view.body)).toString(
    "latin1",
  );
  const tfInfoText = Buffer.from(grpcPayload(tfInfo.body)).toString(
    "latin1",
  );

  assert.match(viewText, /keep-view-field/);
  assert.doesNotMatch(viewText, /cms|cm-config|carrier-panel|cm-ipad|legacy-under-player-cm/);
  assert.doesNotMatch(tfInfoText, /carrier-toast|carrier-custom-panel/);
  assert.equal(protoFields(grpcPayload(tfInfo.body), 1, 0).length, 1);
  assert.equal(protoFields(grpcPayload(tfInfo.body), 4, 0).length, 1);
});

test("unknown endpoints, malformed JSON, and disabled UI fail open", () => {
  const original = '{"data":{"keep":true}}';
  const unknown = enhance.transformJsonText(
    original,
    `${appRoot}/x/future/api`,
    enhance.parseArgument(""),
  );
  const malformed = enhance.transformJsonText(
    "<html>upstream error</html>",
    `${appRoot}/x/v2/feed/index`,
    enhance.parseArgument(""),
  );
  const disabled = enhance.transformJsonText(
    JSON.stringify({
      data: {
        top: [{
          id: 222,
          name: "游戏中心",
          uri: "bilibili://game_center/home",
        }],
      },
    }),
    `${appRoot}/x/resource/show/tab/v2`,
    enhance.parseArgument('{"ui":false}'),
  );

  assert.equal(unknown.valid, true);
  assert.equal(unknown.changed, 0);
  assert.equal(unknown.body, original);
  assert.equal(malformed.valid, false);
  assert.equal(malformed.body, "<html>upstream error</html>");
  assert.equal(disabled.changed, 0);
});

test("Shadowrocket entrypoint returns a changed body without leaking response data", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "src", "bilibili-enhance.js"),
    "utf8",
  );
  let completion;
  const context = {
    $argument: JSON.stringify({
      ads: true,
      debug: false,
      liveShopping: true,
      searchPromotions: true,
      ui: true,
    }),
    $done(value) {
      completion = value;
    },
    $request: {
      url: `${appRoot}/x/v2/feed/index`,
    },
    $response: {
      body: JSON.stringify({
        code: 0,
        data: {
          items: [
            { card_type: "cm_v2", card_goto: "ad_player" },
            {
              card_type: "small_cover_v2",
              card_goto: "av",
              goto: "av",
              param: "1",
              uri: "bilibili://video/1",
            },
          ],
        },
      }),
    },
    console,
  };

  vm.runInNewContext(source, context, {
    filename: "bilibili-enhance.js",
  });

  assert.ok(completion && typeof completion.body === "string");
  assert.equal(JSON.parse(completion.body).data.items.length, 1);
});

test("Shadowrocket binary entrypoint returns a valid rewritten gRPC frame", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "src", "bilibili-enhance.js"),
    "utf8",
  );
  let completion;
  const input = grpcFrame(
    bytes(
      messageField(30, stringField(1, "cm-body")),
      stringField(99, "keep-unknown"),
    ),
  );
  const context = {
    $argument: JSON.stringify({ ads: true, debug: false }),
    $done(value) {
      completion = value;
    },
    $request: {
      url: "https://grpc.biliapi.net/bilibili.app.view.v1.View/View",
    },
    $response: {
      body: input,
    },
    ArrayBuffer,
    console,
    Uint8Array,
  };

  vm.runInNewContext(source, context, {
    filename: "bilibili-enhance.js",
  });

  assert.ok(completion && completion.body instanceof Uint8Array);
  const outputText = Buffer.from(
    grpcPayload(completion.body),
  ).toString("latin1");
  assert.match(outputText, /keep-unknown/);
  assert.doesNotMatch(outputText, /cm-body/);
});

test("Shadowrocket first binary response reads bodyBytes and decodes gzip before completion", async () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "src", "bilibili-enhance.js"),
    "utf8",
  );
  const input = grpcFrame(
    new Uint8Array(
      gzipSync(
        bytes(
          messageField(30, stringField(1, "first-open-cm")),
          stringField(99, "first-open-content"),
        ),
      ),
    ),
    1,
  );
  let resolveCompletion;
  const completionPromise = new Promise((resolve) => {
    resolveCompletion = resolve;
  });
  const context = {
    $argument: JSON.stringify({ ads: true, debug: false }),
    $done(value) {
      resolveCompletion(value);
    },
    $request: {
      url: "https://grpc.biliapi.net/bilibili.app.view.v1.View/View",
    },
    $response: {
      bodyBytes: input.buffer.slice(
        input.byteOffset,
        input.byteOffset + input.byteLength,
      ),
    },
    ArrayBuffer,
    console,
    DecompressionStream,
    Promise,
    ReadableStream,
    Uint8Array,
  };

  vm.runInNewContext(source, context, {
    filename: "bilibili-enhance.js",
  });
  const completion = await completionPromise;

  assert.ok(completion && completion.body instanceof Uint8Array);
  assert.equal(completion.body[0], 0);
  const outputText = Buffer.from(
    grpcPayload(completion.body),
  ).toString("latin1");
  assert.match(outputText, /first-open-content/);
  assert.doesNotMatch(outputText, /first-open-cm/);
});
