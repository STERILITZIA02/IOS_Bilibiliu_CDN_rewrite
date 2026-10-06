// Offline scheduling experiment: synthetic immutable bytes, modeled RTT and slow pieces.
// Optional --baseline=/absolute/path/to/old-runtime.cjs compares an earlier revision.
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
const require = createRequire(import.meta.url);
const current = require("../src/bilibili-btr.js");
const baselinePath = process.argv.find(arg => arg.startsWith("--baseline="))?.slice(11);
const variants = baselinePath ? [["baseline",require(resolve(baselinePath))],["current",current]] : [["current",current]];
const KiB=1024, MiB=1024*KiB, length=4*MiB;
const url="https://upos-sz-mirrorcosov.bilivideo.com/upgcxcode/10/20/30/video.m4s?test=synthetic";
const expected=Buffer.alloc(length);
for(let i=0;i<length;i++) expected[i]=(i+1024)%251;
const digest=body=>createHash("sha256").update(body).digest("hex");
const expectedHash=digest(expected);
const results=[];
for(const scenario of ["high-rtt","one-slow-piece"]) {
  for(let round=0;round<3;round++) {
    for(const [name,api] of round%2 ? variants.toReversed() : variants) {
      const store=new Map(); let active=0,peak=0,requests=0;
      const services={now:Date.now,network:"simulation",cancellable:true,pause:async()=>{},read:k=>store.get(k),write:(v,k)=>{store.set(k,v);return true;},
        request(options,callback){
          const range=api.byteRange(options.headers.Range);
          active++; peak=Math.max(peak,active); requests++;
          const delay=scenario==="high-rtt" ? 80+range.length/(4*MiB)*1000 : range.start===1024+64*KiB ? 350 : 25+range.length/(8*MiB)*1000;
          let live=true;
          const timer=setTimeout(()=>{
            if(!live)return; live=false; active--;
            const body=Uint8Array.from({length:range.length},(_,i)=>(range.start+i)%251);
            callback(null,{status:206,url:options.url,headers:{"Content-Type":"video/mp4",ETag:'"same-version"',"Content-Range":`bytes ${range.start}-${range.end}/${64*MiB}`,"Content-Length":String(range.length)},body});
          },delay);
          return {cancel(){if(live){live=false;active--;clearTimeout(timer);}}};
        }};
      const started=performance.now();
      const result=await api.accelerate({url,method:"GET",headers:{Range:`bytes=1024-${1024+length-1}`}},api.parseArgument("enabled=true&threads=2&budgetMs=15000"),services);
      const elapsedMs=Math.round(performance.now()-started);
      if(result.action!=="respond" || digest(result.response.body)!==expectedHash)throw new Error(`${name} ${scenario}: bytes differ or fail-open`);
      results.push({scenario,variant:name,round,elapsedMs,requests,peak,byteIdentical:true});
    }
  }
}
const summary=[];
for(const scenario of ["high-rtt","one-slow-piece"])for(const [name]of variants){
  const rows=results.filter(r=>r.scenario===scenario&&r.variant===name).sort((a,b)=>a.elapsedMs-b.elapsedMs);
  summary.push({scenario,variant:name,medianMs:rows[1].elapsedMs,requests:rows[1].requests,peak:rows[1].peak});
}
console.log(JSON.stringify({kind:"offline-simulation",bytesPerRun:length,rounds:3,summary,results,note:"Modeled network, not device or real CDN performance."},null,2));
