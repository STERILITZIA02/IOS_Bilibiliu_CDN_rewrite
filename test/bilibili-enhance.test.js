"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

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
    liveShopping: true,
    searchPromotions: true,
    ui: true,
    vipPromotions: true,
    valid: true,
    ...enhance.UI_OPTION_DEFAULTS,
  });
  assert.deepEqual(
    enhance.parseArgument(
      "ads=false&ui=0&searchPromotions=off&liveShopping=no&vipPromotions=0&hideMineWallet=1&debug=1",
    ),
    {
      ads: false,
      debug: true,
      liveShopping: false,
      searchPromotions: false,
      ui: false,
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
  );
  const feedBody = JSON.parse(feed.body);

  assert.equal(feed.changed, 3);
  assert.equal(feedBody.data.items.length, 2);
  assert.deepEqual(feedBody.data.items[0].banner_item, [
    { type: "activity", title: "正常活动" },
  ]);
  assert.equal(feedBody.data.items[1].card_goto, "av");
});

test("filters Story advertisements while preserving unknown and premium cards", () => {
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

  assert.equal(result.changed, 2);
  assert.deepEqual(
    output.data.items.map((item) => item.title),
    ["正常视频", "正常番剧内容", "未知结构"],
  );
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
        marketing_banner: {
          title: "大会员暑期特惠",
          uri: "https://www.bilibili.com/blackboard/activity-vip",
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
  assert.equal("marketing_banner" in data, false);
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
  assert.equal("popup" in data, false);
  assert.deepEqual(data.dialog, fixture.data.dialog);
  assert.deepEqual(data.user, fixture.data.user);
  assert.deepEqual(data.wallet, fixture.data.wallet);
  assert.deepEqual(data.privileges, fixture.data.privileges);
  assert.deepEqual(data.orders, fixture.data.orders);
  assert.deepEqual(data.payment, fixture.data.payment);
  assert.deepEqual(data.future_payload, { keep: true });

  const disabled = transform(
    `${apiRoot}/x/vip/web/vip_center/combine`,
    fixture,
    '{"vipPromotions":false}',
  );
  assert.deepEqual(JSON.parse(disabled.body), fixture);
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
          { aid: 1, title: "正常推荐" },
          { aid: 2, cm: { source: "ad" } },
        ],
      },
    },
  );
  assert.deepEqual(JSON.parse(view.body).data.relates, [
    { aid: 1, title: "正常推荐" },
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
          { goto: "av", title: "正常视频" },
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

test("gRPC View v1 removes only explicit CM fields and related CM cards", () => {
  const normalRelate = bytes(
    stringField(3, "normal-related-video"),
    stringField(7, "av"),
  );
  const adRelate = bytes(
    stringField(3, "commercial-related-card"),
    messageField(28, stringField(1, "type.googleapis.com/cm")),
  );
  const reply = bytes(
    messageField(10, normalRelate),
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
  assert.equal(result.changed, 3);
  assert.equal(protoFields(output, 10, 2).length, 1);
  assert.equal(protoFields(output, 30).length, 0);
  assert.equal(protoFields(output, 31).length, 0);
  assert.match(outputText, /normal-related-video/);
  assert.match(outputText, /unknown-field-must-stay/);
  assert.doesNotMatch(outputText, /commercial-related-card/);
});

test("gRPC ViewUnite filters reviewed promotion cards and modules", () => {
  const card = (type, title, extra) =>
    bytes(
      varintField(1, type),
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
    messageField(1, card(1, "normal-av")),
    messageField(1, card(4, "game-promotion")),
    messageField(1, card(5, "cm-promotion")),
    messageField(1, card(11, "course-promotion")),
    messageField(1, card(1, "stock-promotion", "stock")),
    messageField(1, card(1, "unique-promotion", "unique")),
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
  assert.equal(result.changed, 9);
  assert.match(outputText, /normal-av/);
  assert.match(outputText, /unknown-report/);
  assert.match(outputText, /future-module/);
  assert.doesNotMatch(outputText, /game-promotion/);
  assert.doesNotMatch(outputText, /cm-promotion/);
  assert.doesNotMatch(outputText, /course-promotion/);
  assert.doesNotMatch(outputText, /stock-promotion/);
  assert.doesNotMatch(outputText, /unique-promotion/);
  assert.doesNotMatch(outputText, /activity-banner/);
  assert.doesNotMatch(outputText, /vip-banner/);
  assert.doesNotMatch(outputText, /up-goods/);
  assert.doesNotMatch(outputText, /top-level-cm/);

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
            { card_type: "small_cover_v2", card_goto: "av" },
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
