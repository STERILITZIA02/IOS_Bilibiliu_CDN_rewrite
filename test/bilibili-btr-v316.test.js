"use strict";
const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const btr = require("../src/bilibili-btr.js");
const KiB = 1024, MiB = 1024 * KiB;
const host = "upos-sz-mirrorcosov.bilivideo.com";
const url = `http://${host}/upgcxcode/10/20/30/30_qe1-1-30066.m4s?deadline=2000000000&upsig=SYNTHETIC`;
const config = extra => btr.parseArgument(`enabled=true${extra ? "&" + extra : ""}`);
const request = (address = url, size = 2 * MiB) => ({ url: address, method: "GET", headers: {
  Range: `bytes=1024-${1024 + size - 1}`, "User-Agent": "Bilibili Freedoooooom/MarkII"
} });
function environment({ delay = 2, store = new Map() } = {}) {
  const calls = [];
  let active = 0, peak = 0;
  const services = { now: Date.now, network: "test-network", cancellable: true,
    pause: async () => {}, read: key => store.get(key), write: (v, k) => { store.set(k, v); return true; },
    request(options, done) {
      const range = btr.byteRange(options.headers.Range), call = { ...options, at: Date.now(), range };
      calls.push(call); active++; peak = Math.max(active, peak);
      const timer = setTimeout(() => {
        active--; call.finished = Date.now();
        const body = Uint8Array.from({length: range.length}, (_, i) => (range.start + i) % 251);
        done(null, { status: 206, url: options.url, headers: { "Content-Type": "video/mp4", ETag: '"version"',
          "Content-Range": `bytes ${range.start}-${range.end}/${64 * MiB}`, "Content-Length": String(range.length) }, body });
      }, typeof delay === "function" ? delay(call) : delay);
      return { cancel() { clearTimeout(timer); active--; } };
    }
  };
  return { services, calls, store, peak: () => peak };
}

test("v3.16 accepts HTTP/80 and HTTPS/443 without rewriting scheme or signatures", async () => {
  for (const address of [url, url.replace(host, host + ":80"), url.replace("http:", "https:"), url.replace("http:", "https:").replace(host, host + ":443")]) {
    const env = environment();
    const req = request(address); req.headers.Host = new URL(address).host;
    const result = await btr.accelerate(req, config("threads=2"), env.services);
    assert.equal(result.action, "respond", address);
    assert.ok(env.calls.every(c => c.url === address));
    assert.ok(result.response.body.every((v, i) => v === (1024 + i) % 251));
  }
  for (const address of [url.replace(host, host + ":443"), url.replace("http:", "https:").replace(host, host + ":80"), url.replace(host, host + ":4483")]) {
    assert.equal(btr.planRequest(request(address), config()), null);
  }
});

test("v3.16 generated matcher reaches both protocols and preserves host/path boundaries", () => {
  const text = fs.readFileSync(path.join(__dirname, "../dist/Bilibili.BTR.Experimental.sgmodule"), "utf8");
  const matcher = new RegExp(text.match(/pattern=(.*?),binary-body-mode=/)[1]);
  for (const address of [url, url.replace(host,host + ":80"), url.replace("http:","https:"), url.replace("http:","https:").replace(host,host + ":443")]) assert.equal(matcher.test(address), true, address);
  for (const address of [url.replace(host,host + ".evil.test"), url.replace("/upgcxcode/","/appstaticboss/"),url.replace(host,host + ":4483")]) assert.equal(matcher.test(address),false);
});

test("empty binary request bodies do not silently disqualify native media GETs", () => {
  const req = request(url.replace("http:", "https:"));
  req.bodyBytes = new Uint8Array();
  assert.ok(btr.planRequest(req, config()));
  req.bodyBytes = new Uint8Array([1]);
  assert.equal(btr.planRequest(req, config()), null);
});

test("default-port canonicalization is accepted but protocol, path and query changes are not", () => {
  const range = {start:0,end:262143,length:262144};
  const result = {status:206,url:url.replace("://", "://").replace(host,host + ":80"),headers:{
    "Content-Range":`bytes 0-262143/${MiB}`,"Content-Type":"video/mp4",ETag:'"v"'},body:new Uint8Array(262144)};
  assert.doesNotThrow(()=>btr.validate(result,range,url,null));
  for(const address of [url.replace("http:","https:"), url + "&new=1",url.replace("30_qe1","31_qe1")]) {
    assert.throws(()=>btr.validate({...result,url:address},range,url,null));
  }
});

test("available slots refill while an earlier slow chunk is still downloading", async () => {
  const env = environment({delay: c => c.range.start === 1024 + 64 * KiB ? 180 : 8});
  const result = await btr.accelerate(request(url.replace("http:","https:"),3 * MiB), config("threads=2"), env.services);
  assert.equal(result.action,"respond");
  const slow = env.calls[1], replacement = env.calls[3];
  assert.ok(replacement.at < slow.finished, `${replacement.at} should precede ${slow.finished}`);
  assert.ok(env.peak() <= 2);
});

test("automatic trials persist across short-lived script contexts and recover after cooldown", () => {
  const cfg = config();
  const sample = {bytes: MiB, elapsedMs: 500, saturated:true, usedThreads:2};
  const first = btr.controller(cfg,{},1000);
  first.observe(sample,1500);
  const second = btr.controller(cfg,first.snapshot(),1600);
  second.observe(sample,2100);
  assert.equal(second.threads(),3);
  const third = btr.controller(cfg,second.snapshot(),2200);
  assert.equal(third.threads(),3);
  third.observe({...sample,usedThreads:3},2700);
  assert.equal(third.threads(),2,"no gain rolls back");
  third.observe(sample,100000);
  third.observe(sample,101000);
  assert.equal(third.threads(),3,"expired cooldown must not permanently pin the ceiling");
  const expired=btr.controller(cfg,third.snapshot(),140000);
  assert.equal(expired.threads(),2,"an unmeasurable trial cannot stay elevated forever");
});

test("large ranges can increase actual concurrency within the same invocation", async () => {
  const env=environment({delay:180});
  const result=await btr.accelerate(request(url,8*MiB),config("maxMiB=8"),env.services);
  assert.equal(result.action,"respond");
  assert.ok(result.stats.threads.includes(3));
  assert.ok(env.peak()>=3 && env.peak()<=8);
});

test("upstream weighted scheduling gives every verified route work and favors measured throughput", () => {
  const routes=[{url:"fast",speed:9,failures:0,measured:true},{url:"medium",speed:3,failures:0,measured:true},{url:"slow",speed:1,failures:0,measured:true}];
  const pick=btr.routePicker(routes), counts={fast:0,medium:0,slow:0};
  for(let i=0;i<130;i++)counts[pick().url]++;
  assert.ok(counts.fast > counts.medium*2);
  assert.ok(counts.medium > counts.slow*2);
  assert.ok(counts.slow > 0);
  routes[0].failures=2;
  for(let i=0;i<20;i++)assert.notEqual(pick().url,"fast");
});

test("default diagnostics are throttled and exclude internal requests, private values and offsets", () => {
  const store=new Map(), logs=[]; let at=100000;
  const services={now:()=>at,read:k=>store.get(k),write:(v,k)=>{store.set(k,v);return true;}};
  const root={__BILIFLOW_VERSION__:"3.16.0",console:{log:v=>logs.push(v)}};
  const req=request();
  for(let i=0;i<10;i++)btr.recordDiagnostic(root,services,config(),req,{reason:"range-open"});
  assert.equal(logs.length,1);
  btr.recordDiagnostic(root,services,config(),req,{reason:"internal"});
  at+=30001;
  btr.recordDiagnostic(root,services,config(),req,{reason:"accelerated",stats:{peak:3,deliveredBytes:MiB}});
  assert.equal(logs.length,2);
  assert.match(logs[1],/"range-open":9/);
  assert.ok(logs.every(l=>!l.includes("SYNTHETIC")&&!l.includes("upsig")&&!l.includes(host)));
});

test("native bodyBytes takes precedence over a text callback payload", async () => {
  const binary=new Uint8Array([0,255,128,1]); let emptySentinel=false;
  const services=btr.createShadowrocketServices({$httpClient:{get(options,cb){
    cb(null,{statusCode:206,headers:{},bodyBytes:emptySentinel?new ArrayBuffer(0):binary.buffer},emptySentinel?binary:"not binary");
  }}});
  const result=await new Promise(resolve=>services.request({url,headers:{},timeoutMs:1000},(error,response)=>resolve(response)));
  assert.deepEqual(result.body,binary);
  emptySentinel=true;
  const second=await new Promise(resolve=>services.request({url,headers:{},timeoutMs:1000},(error,response)=>resolve(response)));
  assert.deepEqual(second.body,binary,"an empty optional field cannot hide actual callback bytes");
});

test("HTTP and HTTPS preserve separate adaptive network evidence", async () => {
  const store=new Map();
  const http=environment({store,delay:90});
  await btr.accelerate(request(url,4*MiB),config(),http.services);
  const https=environment({store});
  const result=await btr.accelerate(request(url.replace("http:","https:"),4*MiB),config(),https.services);
  assert.equal(result.action,"respond");
  assert.equal(result.stats.threads[0],2);
});

test("eligibility diagnostics explain skipped ranges without exposing URL or query", () => {
  const req = request(); req.headers.Range = "bytes=1024-";
  assert.equal(btr.requestReason(req,config()),"range-open");
  req.headers.Range = "bytes=1024-2047";
  assert.equal(btr.requestReason(req,config()),"range-small");
  req.headers.Range = "bytes=1024-2098175"; req.headers.Authorization = "private";
  assert.equal(btr.requestReason(req,config()),"protected-headers");
});

test("new runtime produces a bounded default summary for an unaccelerated HTTP request", async () => {
  const logs=[],store=new Map(),completed=[];
  const req=request(); req.headers.Range="bytes=0-";
  const context={Uint8Array,ArrayBuffer,setTimeout,clearTimeout,__BILIFLOW_VERSION__:"3.16.0",
    $request:req,$argument:"enabled=true",$persistentStore:{read:k=>store.get(k),write:(v,k)=>{store.set(k,v);return true;}},
    $httpClient:{get(){assert.fail("open-ended stream must remain native");}},
    console:{log:value=>logs.push(value)},$done:value=>completed.push(value)};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,"../src/bilibili-btr.js"),"utf8"),context);
  await new Promise(resolve=>setTimeout(resolve,5));
  assert.equal(completed.length,1);
  assert.ok(logs.some(line=>line.includes("[BiliBTR]") && line.includes("range-open")));
  assert.ok(logs.every(line=>!line.includes("SYNTHETIC")&&!line.includes("upgcxcode")));
});
