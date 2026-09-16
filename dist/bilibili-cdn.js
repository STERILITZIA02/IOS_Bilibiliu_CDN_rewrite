this.__BILIFLOW_VERSION__ = "3.13.0";
/* fflate 0.8.3
MIT License

Copyright (c) 2026 Arjun Barrett

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/
!function(f){typeof module!='undefined'&&typeof exports=='object'?module.exports=f():typeof define!='undefined'&&define.amd?define(f):(typeof self!='undefined'?self:this).fflate=f()}(function(){var _e={};"use strict";_e.deflate=zt,_e.deflateSync=kt,_e.inflate=At,_e.inflateSync=Tt,_e.gzip=It,_e.compress=It,_e.gzipSync=Ut,_e.compressSync=Ut,_e.gunzip=Zt,_e.gunzipSync=qt,_e.zlib=Lt,_e.zlibSync=Bt,_e.unzlib=Nt,_e.unzlibSync=Pt,_e.gzip=It,_e.compress=It,_e.decompress=Jt,_e.decompressSync=Kt,_e.strToU8=nn,_e.strFromU8=rn,_e.zip=dn,_e.zipSync=gn,_e.unzip=zn,_e.unzipSync=kn;var t=(typeof module!='undefined'&&typeof exports=='object'?function(_f){"use strict";var e,r,t,n=";var __w=require('worker_threads');__w.parentPort.on('message',function(m){onmessage({data:m})}),postMessage=function(m,t){__w.parentPort.postMessage(m,t)},close=process.exit;self=global";try{e=require("worker_threads"),r=e.Worker,t=e.isMarkedAsUntransferable}catch(e){}exports.default=r?function(e,o,a,s,u){var i=!1,l=new r(e+n,{eval:!0}).on("error",function(e){return u(e,null)}).on("message",function(e){return u(null,e)}).on("exit",function(e){e&&!i&&u(Error("exited with code "+e),null)});return t&&(s=s.filter(function(e){return!t(e)})),l.postMessage(a,s),l.terminate=function(){return i=!0,r.prototype.terminate.call(l)},l}:function(e,r,t,n,o){setImmediate(function(){return o(Error("async operations unsupported - update to Node 12+ (or Node 10-11 with the --experimental-worker CLI flag)"),null)});var a=function(){};return{terminate:a,postMessage:a}};return _f}:function(_f){"use strict";var e={};_f.default=function(r,t,s,a,n){var o=new Worker(e[t]||(e[t]=URL.createObjectURL(new Blob([r+';addEventListener("error",function(e){e=e.error;postMessage({$e$:[e.message,e.code,e.stack]})})'],{type:"text/javascript"}))));return o.onmessage=function(e){var r=e.data,t=r.$e$;if(t){var s=Error(t[0]);s.code=t[1],s.stack=t[2],n(s,null)}else n(null,r)},o.postMessage(s,a),o};return _f})({}),n=Uint8Array,r=Uint16Array,i=Int32Array,e=new n([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),o=new n([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),s=new n([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),a=function(t,n){for(var e=new r(31),o=0;o<31;++o)e[o]=n+=1<<t[o-1];var s=new i(e[30]);for(o=1;o<30;++o)for(var a=e[o];a<e[o+1];++a)s[a]=a-e[o]<<5|o;return{b:e,r:s}},u=a(e,2),h=u.b,f=u.r;h[28]=258,f[258]=28;for(var c=a(o,0),l=c.b,p=c.r,v=new r(32768),d=0;d<32768;++d){var g=(43690&d)>>1|(21845&d)<<1;v[d]=((65280&(g=(61680&(g=(52428&g)>>2|(13107&g)<<2))>>4|(3855&g)<<4))>>8|(255&g)<<8)>>1}var y=function(t,n,i){for(var e=t.length,o=0,s=new r(n);o<e;++o)t[o]&&++s[t[o]-1];var a,u=new r(n);for(o=1;o<n;++o)u[o]=u[o-1]+s[o-1]<<1;if(i){a=new r(1<<n);var h=15-n;for(o=0;o<e;++o)if(t[o])for(var f=o<<4|t[o],c=n-t[o],l=u[t[o]-1]++<<c,p=l|(1<<c)-1;l<=p;++l)a[v[l]>>h]=f}else for(a=new r(e),o=0;o<e;++o)t[o]&&(a[o]=v[u[t[o]-1]++]>>15-t[o]);return a},m=new n(288);for(d=0;d<144;++d)m[d]=8;for(d=144;d<256;++d)m[d]=9;for(d=256;d<280;++d)m[d]=7;for(d=280;d<288;++d)m[d]=8;var b=new n(32);for(d=0;d<32;++d)b[d]=5;var w=y(m,9,0),x=y(m,9,1),z=y(b,5,0),k=y(b,5,1),M=function(t){for(var n=t[0],r=1;r<t.length;++r)t[r]>n&&(n=t[r]);return n},S=function(t,n,r){var i=n/8|0;return(t[i]|t[i+1]<<8)>>(7&n)&r},A=function(t,n){var r=n/8|0;return(t[r]|t[r+1]<<8|t[r+2]<<16)>>(7&n)},T=function(t){return(t+7)/8|0},D=function(t,r,i){return(null==r||r<0)&&(r=0),(null==i||i>t.length)&&(i=t.length),new n(t.subarray(r,i))};_e.FlateErrorCode={UnexpectedEOF:0,InvalidBlockType:1,InvalidLengthLiteral:2,InvalidDistance:3,StreamFinished:4,NoStreamHandler:5,InvalidHeader:6,NoCallback:7,InvalidUTF8:8,ExtraFieldTooLong:9,InvalidDate:10,FilenameTooLong:11,StreamFinishing:12,InvalidZipData:13,UnknownCompressionMethod:14};var C=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],I=function(t,n,r){var i=Error(n||C[t]);if(i.code=t,Error.captureStackTrace&&Error.captureStackTrace(i,I),!r)throw i;return i},U=function(t,r,i,a){var u=t.length,f=a?a.length:0;if(!u||r.f&&!r.l)return i||new n(0);var c=!i,p=c||2!=r.i,v=r.i;c&&(i=new n(3*u));var d=function(t){var r=i.length;if(t>r){var e=new n(Math.max(2*r,t));e.set(i),i=e}},g=r.f||0,m=r.p||0,b=r.b||0,w=r.l,z=r.d,C=r.m,U=r.n,F=8*u;do{if(!w){g=S(t,m,1);var E=S(t,m+1,3);if(m+=3,!E){var Z=t[(Y=T(m)+4)-4]|t[Y-3]<<8,q=Y+Z;if(q>u){v&&I(0);break}p&&d(b+Z),i.set(t.subarray(Y,q),b),r.b=b+=Z,r.p=m=8*q,r.f=g;continue}if(1==E)w=x,z=k,C=9,U=5;else if(2==E){var O=S(t,m,31)+257,G=S(t,m+10,15)+4,L=O+S(t,m+5,31)+1;m+=14;for(var B=new n(L),H=new n(19),j=0;j<G;++j)H[s[j]]=S(t,m+3*j,7);m+=3*G;var N=M(H),P=(1<<N)-1,V=y(H,N,1);for(j=0;j<L;){var Y,J=V[S(t,m,P)];if(m+=15&J,(Y=J>>4)<16)B[j++]=Y;else{var K=0,Q=0;for(16==Y?(Q=3+S(t,m,3),m+=2,K=B[j-1]):17==Y?(Q=3+S(t,m,7),m+=3):18==Y&&(Q=11+S(t,m,127),m+=7);Q--;)B[j++]=K}}var R=B.subarray(0,O),W=B.subarray(O);C=M(R),U=M(W),w=y(R,C,1),z=y(W,U,1)}else I(1);if(m>F){v&&I(0);break}}p&&d(b+131072);for(var X=(1<<C)-1,$=(1<<U)-1,_=m;;_=m){var tt=(K=w[A(t,m)&X])>>4;if((m+=15&K)>F){v&&I(0);break}if(K||I(2),tt<256)i[b++]=tt;else{if(256==tt){_=m,w=null;break}var nt=tt-254;tt>264&&(nt=S(t,m,(1<<(et=e[j=tt-257]))-1)+h[j],m+=et);var rt=z[A(t,m)&$],it=rt>>4;if(rt||I(3),m+=15&rt,W=l[it],it>3){var et=o[it];W+=A(t,m)&(1<<et)-1,m+=et}if(m>F){v&&I(0);break}p&&d(b+131072);var ot=b+nt;if(b<W){var st=f-W,at=Math.min(W,ot);for(st+b<0&&I(3);b<at;++b)i[b]=a[st+b]}for(;b<ot;++b)i[b]=i[b-W]}}r.l=w,r.p=_,r.b=b,r.f=g,w&&(g=1,r.m=C,r.d=z,r.n=U)}while(!g);return b!=i.length&&c?D(i,0,b):i.subarray(0,b)},F=function(t,n,r){var i=n/8|0;t[i]|=r<<=7&n,t[i+1]|=r>>8},E=function(t,n,r){var i=n/8|0;t[i]|=r<<=7&n,t[i+1]|=r>>8,t[i+2]|=r>>16},Z=function(t,i){for(var e=[],o=0;o<t.length;++o)t[o]&&e.push({s:o,f:t[o]});var s=e.length,a=e.slice();if(!s)return{t:j,l:0};if(1==s){var u=new n(e[0].s+1);return u[e[0].s]=1,{t:u,l:1}}e.sort(function(t,n){return t.f-n.f}),e.push({s:-1,f:25001});var h=e[0],f=e[1],c=0,l=1,p=2;for(e[0]={s:-1,f:h.f+f.f,l:h,r:f};l!=s-1;)h=e[e[c].f<e[p].f?c++:p++],f=e[c!=l&&e[c].f<e[p].f?c++:p++],e[l++]={s:-1,f:h.f+f.f,l:h,r:f};var v=a[0].s;for(o=1;o<s;++o)a[o].s>v&&(v=a[o].s);var d=new r(v+1),g=q(e[l-1],d,0);if(g>i){o=0;var y=0,m=g-i,b=1<<m;for(a.sort(function(t,n){return d[n.s]-d[t.s]||t.f-n.f});o<s;++o){var w=a[o].s;if(!(d[w]>i))break;y+=b-(1<<g-d[w]),d[w]=i}for(y>>=m;y>0;){var x=a[o].s;d[x]<i?y-=1<<i-d[x]++-1:++o}for(;o>=0&&y;--o){var z=a[o].s;d[z]==i&&(--d[z],++y)}g=i}return{t:new n(d),l:g}},q=function(t,n,r){return-1==t.s?Math.max(q(t.l,n,r+1),q(t.r,n,r+1)):n[t.s]=r},O=function(t){for(var n=t.length;n&&!t[--n];);for(var i=new r(++n),e=0,o=t[0],s=1,a=function(t){i[e++]=t},u=1;u<=n;++u)if(t[u]==o&&u!=n)++s;else{if(!o&&s>2){for(;s>138;s-=138)a(32754);s>2&&(a(s>10?s-11<<5|28690:s-3<<5|12305),s=0)}else if(s>3){for(a(o),--s;s>6;s-=6)a(8304);s>2&&(a(s-3<<5|8208),s=0)}for(;s--;)a(o);s=1,o=t[u]}return{c:i.subarray(0,e),n:n}},G=function(t,n){for(var r=0,i=0;i<n.length;++i)r+=t[i]*n[i];return r},L=function(t,n,r){var i=r.length,e=T(n+2);t[e]=255&i,t[e+1]=i>>8,t[e+2]=255^t[e],t[e+3]=255^t[e+1];for(var o=0;o<i;++o)t[e+o+4]=r[o];return 8*(e+4+i)},B=function(t,n,i,a,u,h,f,c,l,p,v){F(n,v++,i),++u[256];for(var d=Z(u,15),g=d.t,x=d.l,k=Z(h,15),M=k.t,S=k.l,A=O(g),T=A.c,D=A.n,C=O(M),I=C.c,U=C.n,q=new r(19),B=0;B<T.length;++B)++q[31&T[B]];for(B=0;B<I.length;++B)++q[31&I[B]];for(var H=Z(q,7),j=H.t,N=H.l,P=19;P>4&&!j[s[P-1]];--P);var V,Y,J,K,Q=p+5<<3,R=G(u,m)+G(h,b)+f,W=G(u,g)+G(h,M)+f+14+3*P+G(q,j)+2*q[16]+3*q[17]+7*q[18];if(l>=0&&Q<=R&&Q<=W)return L(n,v,t.subarray(l,l+p));if(F(n,v,1+(W<R)),v+=2,W<R){V=y(g,x,0),Y=g,J=y(M,S,0),K=M;var X=y(j,N,0);for(F(n,v,D-257),F(n,v+5,U-1),F(n,v+10,P-4),v+=14,B=0;B<P;++B)F(n,v+3*B,j[s[B]]);v+=3*P;for(var $=[T,I],_=0;_<2;++_){var tt=$[_];for(B=0;B<tt.length;++B)F(n,v,X[rt=31&tt[B]]),v+=j[rt],rt>15&&(F(n,v,tt[B]>>5&127),v+=tt[B]>>12)}}else V=w,Y=m,J=z,K=b;for(B=0;B<c;++B){var nt=a[B];if(nt>255){var rt;E(n,v,V[257+(rt=nt>>18&31)]),v+=Y[rt+257],rt>7&&(F(n,v,nt>>23&31),v+=e[rt]);var it=31&nt;E(n,v,J[it]),v+=K[it],it>3&&(E(n,v,nt>>5&8191),v+=o[it])}else E(n,v,V[nt]),v+=Y[nt]}return E(n,v,V[256]),v+Y[256]},H=new i([65540,131080,131088,131104,262176,1048704,1048832,2114560,2117632]),j=new n(0),N=function(t,s,a,u,h,c){var l=c.z||t.length,v=new n(u+l+5*(1+Math.ceil(l/7e3))+h),d=v.subarray(u,v.length-h),g=c.l,y=7&(c.r||0);if(s){y&&(d[0]=c.r>>3);for(var m=H[s-1],b=m>>13,w=8191&m,x=(1<<a)-1,z=c.p||new r(32768),k=c.h||new r(x+1),M=Math.ceil(a/3),S=2*M,A=function(n){return(t[n]^t[n+1]<<M^t[n+2]<<S)&x},C=new i(25e3),I=new r(288),U=new r(32),F=0,E=0,Z=c.i||0,q=0,O=c.w||0,G=0;Z+2<l;++Z){var j=A(Z),N=32767&Z,P=k[j];if(z[N]=P,k[j]=N,O<=Z){var V=l-Z;if((F>7e3||q>24576)&&(V>423||!g)){y=B(t,d,0,C,I,U,E,q,G,Z-G,y),q=F=E=0,G=Z;for(var Y=0;Y<286;++Y)I[Y]=0;for(Y=0;Y<30;++Y)U[Y]=0}var J=2,K=0,Q=w,R=N-P&32767;if(V>2&&j==A(Z-R))for(var W=Math.min(b,V)-1,X=Math.min(32767,Z),$=Math.min(258,V);R<=X&&--Q&&N!=P;){if(t[Z+J]==t[Z+J-R]){for(var _=0;_<$&&t[Z+_]==t[Z+_-R];++_);if(_>J){if(J=_,K=R,_>W)break;var tt=Math.min(R,_-2),nt=0;for(Y=0;Y<tt;++Y){var rt=Z-R+Y&32767,it=rt-z[rt]&32767;it>nt&&(nt=it,P=rt)}}}R+=(N=P)-(P=z[N])&32767}if(K){C[q++]=268435456|f[J]<<18|p[K];var et=31&f[J],ot=31&p[K];E+=e[et]+o[ot],++I[257+et],++U[ot],O=Z+J,++F}else C[q++]=t[Z],++I[t[Z]]}}for(Z=Math.max(Z,O);Z<l;++Z)C[q++]=t[Z],++I[t[Z]];y=B(t,d,g,C,I,U,E,q,G,Z-G,y),g||(c.r=7&y|d[y/8|0]<<3,y-=7,c.h=k,c.p=z,c.i=Z,c.w=O)}else{for(Z=c.w||0;Z<l+g;Z+=65535){var st=Z+65535;st>=l&&(d[y/8|0]=g,st=l),y=L(d,y+1,t.subarray(Z,st))}c.i=l}return D(v,0,u+T(y)+h)},P=function(){for(var t=new Int32Array(256),n=0;n<256;++n){for(var r=n,i=9;--i;)r=(1&r&&-306674912)^r>>>1;t[n]=r}return t}(),V=function(){var t=-1;return{p:function(n){for(var r=t,i=0;i<n.length;++i)r=P[255&r^n[i]]^r>>>8;t=r},d:function(){return~t}}},Y=function(){var t=1,n=0;return{p:function(r){for(var i=t,e=n,o=0|r.length,s=0;s!=o;){for(var a=Math.min(s+2655,o);s<a;++s)e+=i+=r[s];i=(65535&i)+15*(i>>16),e=(65535&e)+15*(e>>16)}t=i,n=e},d:function(){return(255&(t%=65521))<<24|(65280&t)<<8|(255&(n%=65521))<<8|n>>8}}},J=function(t,r,i,e,o){if(!o&&(o={l:1},r.dictionary)){var s=r.dictionary.subarray(-32768),a=new n(s.length+t.length);a.set(s),a.set(t,s.length),t=a,o.w=s.length}return N(t,null==r.level?6:r.level,null==r.mem?o.l?Math.ceil(1.5*Math.max(8,Math.min(13,Math.log(t.length)))):20:12+r.mem,i,e,o)},K=function(t,n){var r={};for(var i in t)r[i]=t[i];for(var i in n)r[i]=n[i];return r},Q=function(t,n,r){for(var i=t(),e=""+t,o=e.slice(e.indexOf("[")+1,e.lastIndexOf("]")).replace(/\s+/g,"").split(","),s=0;s<i.length;++s){var a=i[s],u=o[s];if("function"==typeof a){n+=";"+u+"=";var h=""+a;if(a.prototype)if(-1!=h.indexOf("[native code]")){var f=h.indexOf(" ",8)+1;n+=h.slice(f,h.indexOf("(",f))}else for(var c in n+=h,a.prototype)n+=";"+u+".prototype."+c+"="+a.prototype[c];else n+=h}else r[u]=a}return n},R=[],W=function(t){var n=[];for(var r in t)t[r].buffer&&n.push((t[r]=new t[r].constructor(t[r])).buffer);return n},X=function(n,r,i,e){if(!R[i]){for(var o="",s={},a=n.length-1,u=0;u<a;++u)o=Q(n[u],o,s);R[i]={c:Q(n[a],o,s),e:s}}var h=K({},R[i].e);return(0,t.default)(R[i].c+";onmessage=function(e){for(var k in e.data)self[k]=e.data[k];onmessage="+r+"}",i,h,W(h),e)},$=function(){return[n,r,i,e,o,s,h,l,x,k,v,C,y,M,S,A,T,D,I,U,Tt,et,ot]},_=function(){return[n,r,i,e,o,s,f,p,w,m,z,b,v,H,j,y,F,E,Z,q,O,G,L,B,T,D,N,J,kt,et]},tt=function(){return[pt,gt,lt,V,P]},nt=function(){return[vt,dt]},rt=function(){return[yt,lt,Y]},it=function(){return[mt]},et=function(t){return postMessage(t,[t.buffer])},ot=function(t){return t&&{out:t.size&&new n(t.size),dictionary:t.dictionary}},st=function(t,n,r,i,e,o){var s=X(r,i,e,function(t,n){s.terminate(),o(t,n)});return s.postMessage([t,n],n.consume?[t.buffer]:[]),function(){s.terminate()}},at=function(t){return t.ondata=function(t,n){return postMessage([t,n],[t.buffer])},function(n){n.data[0]?(t.push(n.data[0],n.data[1]),postMessage([n.data[0].length])):t.flush(n.data[1])}},ut=function(t,n,r,i,e,o,s){var a,u=X(t,i,e,function(t,r){t?(u.terminate(),n.ondata.call(n,t)):Array.isArray(r)?1==r.length?(n.queuedSize-=r[0],n.ondrain&&n.ondrain(r[0])):(r[1]&&u.terminate(),n.ondata.call(n,t,r[0],r[1])):s(r)});u.postMessage(r),n.queuedSize=0,n.push=function(t,r){n.ondata||I(5),a&&n.ondata(I(4,0,1),null,!!r),n.queuedSize+=t.length,u.postMessage([t,a=r],t.buffer instanceof ArrayBuffer?[t.buffer]:[])},n.terminate=function(){u.terminate()},o&&(n.flush=function(t){u.postMessage([0,t])})},ht=function(t,n){return t[n]|t[n+1]<<8},ft=function(t,n){return(t[n]|t[n+1]<<8|t[n+2]<<16|t[n+3]<<24)>>>0},ct=function(t,n){return ft(t,n)+4294967296*ft(t,n+4)},lt=function(t,n,r){for(;r;++n)t[n]=r,r>>>=8},pt=function(t,n){var r=n.filename;if(t[0]=31,t[1]=139,t[2]=8,t[8]=n.level<2?4:9==n.level?2:0,t[9]=3,0!=n.mtime&&lt(t,4,Math.floor(new Date(n.mtime||Date.now())/1e3)),r){t[3]=8;for(var i=0;i<=r.length;++i)t[i+10]=r.charCodeAt(i)}},vt=function(t){31==t[0]&&139==t[1]&&8==t[2]||I(6,"invalid gzip data");var n=t[3],r=10;4&n&&(r+=2+(t[10]|t[11]<<8));for(var i=(n>>3&1)+(n>>4&1);i>0;i-=!t[r++]);return r+(2&n)},dt=function(t){var n=t.length;return(t[n-4]|t[n-3]<<8|t[n-2]<<16|t[n-1]<<24)>>>0},gt=function(t){return 10+(t.filename?t.filename.length+1:0)},yt=function(t,n){var r=n.level,i=0==r?0:r<6?1:9==r?3:2;if(t[0]=120,t[1]=i<<6|(n.dictionary&&32),t[1]|=31-(t[0]<<8|t[1])%31,n.dictionary){var e=Y();e.p(n.dictionary),lt(t,2,e.d())}},mt=function(t,n){return(8!=(15&t[0])||t[0]>>4>7||(t[0]<<8|t[1])%31)&&I(6,"invalid zlib data"),(t[1]>>5&1)==+!n&&I(6,"invalid zlib data: "+(32&t[1]?"need":"unexpected")+" dictionary"),2+(t[1]>>3&4)};function bt(t,n){return"function"==typeof t&&(n=t,t={}),this.ondata=n,t}var wt=function(){function t(t,r){if("function"==typeof t&&(r=t,t={}),this.ondata=r,this.o=t||{},this.s={l:0,i:32768,w:32768,z:32768},this.b=new n(98304),this.o.dictionary){var i=this.o.dictionary.subarray(-32768);this.b.set(i,32768-i.length),this.s.i=32768-i.length}}return t.prototype.p=function(t,n){this.ondata(J(t,this.o,0,0,this.s),n)},t.prototype.push=function(t,r){this.ondata||I(5),this.s.l&&I(4);var i=t.length+this.s.z;if(i>this.b.length){if(i>2*this.b.length-32768){var e=new n(-32768&i);e.set(this.b.subarray(0,this.s.z)),this.b=e}var o=this.b.length-this.s.z;this.b.set(t.subarray(0,o),this.s.z),this.s.z=this.b.length,this.p(this.b,!1),this.b.set(this.b.subarray(-32768)),this.b.set(t.subarray(o),32768),this.s.z=t.length-o+32768,this.s.i=32766,this.s.w=32768}else this.b.set(t,this.s.z),this.s.z+=t.length;this.s.l=1&r,(this.s.z>this.s.w+8191||r)&&(this.p(this.b,r||!1),this.s.w=this.s.i,this.s.i-=2),r&&(this.s=this.o={},this.b=j)},t.prototype.flush=function(t){if(this.ondata||I(5),this.s.l&&I(4),this.p(this.b,!1),this.s.w=this.s.i,this.s.i-=2,t){var r=new n(6);r[0]=this.s.r>>3;var i=L(r,this.s.r,j);this.s.r=0,this.ondata(r.subarray(0,i>>3),!1)}},t}();_e.Deflate=wt;var xt=function(){return function(t,n){ut([_,function(){return[at,wt]}],this,bt.call(this,t,n),function(t){var n=new wt(t.data);onmessage=at(n)},6,1)}}();function zt(t,n,r){return r||(r=n,n={}),"function"!=typeof r&&I(7),st(t,n,[_],function(t){return et(kt(t.data[0],t.data[1]))},0,r)}function kt(t,n){return J(t,n||{},0,0)}_e.AsyncDeflate=xt;var Mt=function(){function t(t,r){"function"==typeof t&&(r=t,t={}),this.ondata=r;var i=t&&t.dictionary&&t.dictionary.subarray(-32768);this.s={i:0,b:i?i.length:0},this.o=new n(32768),this.p=new n(0),i&&this.o.set(i)}return t.prototype.e=function(t){if(this.ondata||I(5),this.d&&I(4),this.p.length){if(t.length){var r=new n(this.p.length+t.length);r.set(this.p),r.set(t,this.p.length),this.p=r}}else this.p=t},t.prototype.c=function(t){this.s.i=+(this.d=t||!1);var n=this.s.b,r=U(this.p,this.s,this.o);this.ondata(D(r,n,this.s.b),this.d),this.o=D(r,this.s.b-32768),this.s.b=this.o.length,this.p=D(this.p,this.s.p/8|0),this.s.p&=7},t.prototype.push=function(t,n){this.e(t),this.c(n)},t}();_e.Inflate=Mt;var St=function(){return function(t,n){ut([$,function(){return[at,Mt]}],this,bt.call(this,t,n),function(t){var n=new Mt(t.data);onmessage=at(n)},7,0)}}();function At(t,n,r){return r||(r=n,n={}),"function"!=typeof r&&I(7),st(t,n,[$],function(t){return et(Tt(t.data[0],ot(t.data[1])))},1,r)}function Tt(t,n){return U(t,{i:2},n&&n.out,n&&n.dictionary)}_e.AsyncInflate=St;var Dt=function(){function t(t,n){this.c=V(),this.l=0,this.v=1,wt.call(this,t,n)}return t.prototype.push=function(t,n){this.c.p(t),this.l+=t.length,wt.prototype.push.call(this,t,n)},t.prototype.p=function(t,n){var r=J(t,this.o,this.v&&gt(this.o),n&&8,this.s);this.v&&(pt(r,this.o),this.v=0),n&&(lt(r,r.length-8,this.c.d()),lt(r,r.length-4,this.l)),this.ondata(r,n)},t.prototype.flush=function(t){wt.prototype.flush.call(this,t)},t}();_e.Gzip=Dt,_e.Compress=Dt;var Ct=function(){return function(t,n){ut([_,tt,function(){return[at,wt,Dt]}],this,bt.call(this,t,n),function(t){var n=new Dt(t.data);onmessage=at(n)},8,1)}}();function It(t,n,r){return r||(r=n,n={}),"function"!=typeof r&&I(7),st(t,n,[_,tt,function(){return[Ut]}],function(t){return et(Ut(t.data[0],t.data[1]))},2,r)}function Ut(t,n){n||(n={});var r=V(),i=t.length;r.p(t);var e=J(t,n,gt(n),8),o=e.length;return pt(e,n),lt(e,o-8,r.d()),lt(e,o-4,i),e}_e.AsyncGzip=Ct,_e.AsyncCompress=Ct;var Ft=function(){function t(t,n){this.v=1,this.r=0,Mt.call(this,t,n)}return t.prototype.push=function(t,r){if(Mt.prototype.e.call(this,t),this.r+=t.length,this.v){var i=this.p.subarray(this.v-1),e=i.length>3?vt(i):4;if(e>i.length){if(!r)return}else this.v>1&&this.onmember&&this.onmember(this.r-i.length);this.p=i.subarray(e),this.v=0}Mt.prototype.c.call(this,0),this.s.f&&!this.s.l?(this.v=T(this.s.p)+9,this.s={i:0},this.o=new n(0),this.push(new n(0),r)):r&&Mt.prototype.c.call(this,r)},t}();_e.Gunzip=Ft;var Et=function(){return function(t,n){var r=this;ut([$,nt,function(){return[at,Mt,Ft]}],this,bt.call(this,t,n),function(t){var n=new Ft(t.data);n.onmember=function(t){return postMessage(t)},onmessage=at(n)},9,0,function(t){return r.onmember&&r.onmember(t)})}}();function Zt(t,n,r){return r||(r=n,n={}),"function"!=typeof r&&I(7),st(t,n,[$,nt,function(){return[qt]}],function(t){return et(qt(t.data[0],t.data[1]))},3,r)}function qt(t,r){var i=vt(t);return i+8>t.length&&I(6,"invalid gzip data"),U(t.subarray(i,-8),{i:2},r&&r.out||new n(dt(t)),r&&r.dictionary)}_e.AsyncGunzip=Et;var Ot=function(){function t(t,n){this.c=Y(),this.v=1,wt.call(this,t,n)}return t.prototype.push=function(t,n){this.c.p(t),wt.prototype.push.call(this,t,n)},t.prototype.p=function(t,n){var r=J(t,this.o,this.v&&(this.o.dictionary?6:2),n&&4,this.s);this.v&&(yt(r,this.o),this.v=0),n&&lt(r,r.length-4,this.c.d()),this.ondata(r,n)},t.prototype.flush=function(t){wt.prototype.flush.call(this,t)},t}();_e.Zlib=Ot;var Gt=function(){return function(t,n){ut([_,rt,function(){return[at,wt,Ot]}],this,bt.call(this,t,n),function(t){var n=new Ot(t.data);onmessage=at(n)},10,1)}}();function Lt(t,n,r){return r||(r=n,n={}),"function"!=typeof r&&I(7),st(t,n,[_,rt,function(){return[Bt]}],function(t){return et(Bt(t.data[0],t.data[1]))},4,r)}function Bt(t,n){n||(n={});var r=Y();r.p(t);var i=J(t,n,n.dictionary?6:2,4);return yt(i,n),lt(i,i.length-4,r.d()),i}_e.AsyncZlib=Gt;var Ht=function(){function t(t,n){Mt.call(this,t,n),this.v=t&&t.dictionary?2:1}return t.prototype.push=function(t,n){if(Mt.prototype.e.call(this,t),this.v){if(this.p.length<6&&!n)return;this.p=this.p.subarray(mt(this.p,this.v-1)),this.v=0}n&&(this.p.length<4&&I(6,"invalid zlib data"),this.p=this.p.subarray(0,-4)),Mt.prototype.c.call(this,n)},t}();_e.Unzlib=Ht;var jt=function(){return function(t,n){ut([$,it,function(){return[at,Mt,Ht]}],this,bt.call(this,t,n),function(t){var n=new Ht(t.data);onmessage=at(n)},11,0)}}();function Nt(t,n,r){return r||(r=n,n={}),"function"!=typeof r&&I(7),st(t,n,[$,it,function(){return[Pt]}],function(t){return et(Pt(t.data[0],ot(t.data[1])))},5,r)}function Pt(t,n){return U(t.subarray(mt(t,n&&n.dictionary),-4),{i:2},n&&n.out,n&&n.dictionary)}_e.AsyncUnzlib=jt;var Vt=function(){function t(t,n){this.o=bt.call(this,t,n)||{},this.G=Ft,this.I=Mt,this.Z=Ht}return t.prototype.i=function(){var t=this;this.s.ondata=function(n,r){t.ondata(n,r)}},t.prototype.push=function(t,r){if(this.ondata||I(5),this.s)this.s.push(t,r);else{if(this.p&&this.p.length){var i=new n(this.p.length+t.length);i.set(this.p),i.set(t,this.p.length)}else this.p=t;this.p.length>2&&(this.s=31==this.p[0]&&139==this.p[1]&&8==this.p[2]?new this.G(this.o):8!=(15&this.p[0])||this.p[0]>>4>7||(this.p[0]<<8|this.p[1])%31?new this.I(this.o):new this.Z(this.o),this.i(),this.s.push(this.p,r),this.p=null)}},t}();_e.Decompress=Vt;var Yt=function(){function t(t,n){Vt.call(this,t,n),this.queuedSize=0,this.G=Et,this.I=St,this.Z=jt}return t.prototype.i=function(){var t=this;this.s.ondata=function(n,r,i){t.ondata(n,r,i)},this.s.ondrain=function(n){t.queuedSize-=n,t.ondrain&&t.ondrain(n)}},t.prototype.push=function(t,n){this.queuedSize+=t.length,Vt.prototype.push.call(this,t,n)},t}();function Jt(t,n,r){return r||(r=n,n={}),"function"!=typeof r&&I(7),31==t[0]&&139==t[1]&&8==t[2]?Zt(t,n,r):8!=(15&t[0])||t[0]>>4>7||(t[0]<<8|t[1])%31?At(t,n,r):Nt(t,n,r)}function Kt(t,n){return 31==t[0]&&139==t[1]&&8==t[2]?qt(t,n):8!=(15&t[0])||t[0]>>4>7||(t[0]<<8|t[1])%31?Tt(t,n):Pt(t,n)}_e.AsyncDecompress=Yt;var Qt=function(t,r,i,e){for(var o in t){var s=t[o],a=r+o,u=e;Array.isArray(s)&&(u=K(e,s[1]),s=s[0]),ArrayBuffer.isView(s)?i[a]=[s,u]:(i[a+="/"]=[new n(0),u],Qt(s,a,i,e))}},Rt="undefined"!=typeof TextEncoder&&new TextEncoder,Wt="undefined"!=typeof TextDecoder&&new TextDecoder,Xt=0;try{Wt.decode(j,{stream:!0}),Xt=1}catch(t){}var $t=function(t){for(var n="",r=0;;){var i=t[r++],e=(i>127)+(i>223)+(i>239);if(r+e>t.length)return{s:n,r:D(t,r-1)};e?3==e?(i=((15&i)<<18|(63&t[r++])<<12|(63&t[r++])<<6|63&t[r++])-65536,n+=String.fromCharCode(55296|i>>10,56320|1023&i)):n+=String.fromCharCode(1&e?(31&i)<<6|63&t[r++]:(15&i)<<12|(63&t[r++])<<6|63&t[r++]):n+=String.fromCharCode(i)}},_t=function(){function t(t){this.ondata=t,Xt?this.t=new TextDecoder:this.p=j}return t.prototype.push=function(t,r){if(this.ondata||I(5),r=!!r,this.t)return this.ondata(this.t.decode(t,{stream:!0}),r),void(r&&(this.t.decode().length&&I(8),this.t=null));this.p||I(4);var i=new n(this.p.length+t.length);i.set(this.p),i.set(t,this.p.length);var e=$t(i),o=e.s,s=e.r;r?(s.length&&I(8),this.p=null):this.p=s,this.ondata(o,r)},t}();_e.DecodeUTF8=_t;var tn=function(){function t(t){this.ondata=t}return t.prototype.push=function(t,n){this.ondata||I(5),this.d&&I(4),this.ondata(nn(t),this.d=n||!1)},t}();function nn(t,r){if(r){for(var i=new n(t.length),e=0;e<t.length;++e)i[e]=t.charCodeAt(e);return i}if(Rt)return Rt.encode(t);var o=t.length,s=new n(t.length+(t.length>>1)),a=0,u=function(t){s[a++]=t};for(e=0;e<o;++e){if(a+5>s.length){var h=new n(a+8+(o-e<<1));h.set(s),s=h}var f=t.charCodeAt(e);f<128||r?u(f):f<2048?(u(192|f>>6),u(128|63&f)):f>55295&&f<57344?(u(240|(f=65536+(1047552&f)|1023&t.charCodeAt(++e))>>18),u(128|f>>12&63),u(128|f>>6&63),u(128|63&f)):(u(224|f>>12),u(128|f>>6&63),u(128|63&f))}return D(s,0,a)}function rn(t,n){if(n){for(var r="",i=0;i<t.length;i+=16384)r+=String.fromCharCode.apply(null,t.subarray(i,i+16384));return r}if(Wt)return Wt.decode(t);var e=$t(t),o=e.s;return(r=e.r).length&&I(8),o}_e.EncodeUTF8=tn;var en=function(t){return 1==t?3:t<6?2:9==t?1:0},on=function(t,n){return n+30+ht(t,n+26)+ht(t,n+28)},sn=function(t,n,r){var i=ht(t,n+28),e=ht(t,n+30),o=rn(t.subarray(n+46,n+46+i),!(2048&ht(t,n+8))),s=n+46+i,a=an(t,s,e,r,ft(t,n+20),ft(t,n+24),ft(t,n+42)),u=a[0],h=a[1],f=a[2];return[ht(t,n+10),u,h,o,s+e+ht(t,n+32),f]},an=function(t,n,r,i,e,o,s){var a=4294967295==e,u=4294967295==o,h=4294967295==s,f=n+r;if(i&&a+u+h){for(;n+4<f;n+=4+ht(t,n+2))if(1==ht(t,n))return[a?ct(t,n+4+8*u):e,u?ct(t,n+4):o,h?ct(t,n+4+8*(u+a)):s,1];i<2&&I(13)}return[e,o,s,0]},un=function(t){var n=0;if(t)for(var r in t){var i=t[r].length;i>65535&&I(9),n+=i+4}return n},hn=function(t,n,r,i,e,o,s,a){var u=i.length,h=r.extra,f=a&&a.length,c=un(h);lt(t,n,null!=s?33639248:67324752),n+=4,null!=s&&(t[n++]=20,t[n++]=r.os),t[n]=20,n+=2,t[n++]=r.flag<<1|(o<0&&8),t[n++]=e&&8,t[n++]=255&r.compression,t[n++]=r.compression>>8;var l=new Date(null==r.mtime?Date.now():r.mtime),p=l.getFullYear()-1980;if((p<0||p>119)&&I(10),lt(t,n,p<<25|l.getMonth()+1<<21|l.getDate()<<16|l.getHours()<<11|l.getMinutes()<<5|l.getSeconds()>>1),n+=4,-1!=o&&(lt(t,n,r.crc),lt(t,n+4,o<0?-o-2:o),lt(t,n+8,r.size)),lt(t,n+12,u),lt(t,n+14,c),n+=16,null!=s&&(lt(t,n,f),lt(t,n+6,r.attrs),lt(t,n+10,s),n+=14),t.set(i,n),n+=u,c)for(var v in h){var d=h[v],g=d.length;lt(t,n,+v),lt(t,n+2,g),t.set(d,n+4),n+=4+g}return f&&(t.set(a,n),n+=f),n},fn=function(t,n,r,i,e){lt(t,n,101010256),lt(t,n+8,r),lt(t,n+10,r),lt(t,n+12,i),lt(t,n+16,e)},cn=function(){function t(t){this.filename=t,this.c=V(),this.size=0,this.compression=0}return t.prototype.process=function(t,n){this.ondata(null,t,n)},t.prototype.push=function(t,n){this.ondata||I(5),this.c.p(t),this.size+=t.length,n&&(this.crc=this.c.d()),this.process(t,n||!1)},t}();_e.ZipPassThrough=cn;var ln=function(){function t(t,n){var r=this;n||(n={}),cn.call(this,t),this.d=new wt(n,function(t,n){r.ondata(null,t,n)}),this.compression=8,this.flag=en(n.level)}return t.prototype.process=function(t,n){try{this.d.push(t,n)}catch(t){this.ondata(t,null,n)}},t.prototype.push=function(t,n){cn.prototype.push.call(this,t,n)},t}();_e.ZipDeflate=ln;var pn=function(){function t(t,n){var r=this;n||(n={}),cn.call(this,t),this.d=new xt(n,function(t,n,i){r.ondata(t,n,i)}),this.compression=8,this.flag=en(n.level),this.terminate=this.d.terminate}return t.prototype.process=function(t,n){this.d.push(t,n)},t.prototype.push=function(t,n){cn.prototype.push.call(this,t,n)},t}();_e.AsyncZipDeflate=pn;var vn=function(){function t(t){this.ondata=t,this.u=[],this.d=1}return t.prototype.add=function(t){var r=this;if(this.ondata||I(5),2&this.d)this.ondata(I(4+8*(1&this.d),0,1),null,!1);else{var i=nn(t.filename),e=i.length,o=t.comment,s=o&&nn(o),a=e!=t.filename.length||s&&o.length!=s.length,u=e+un(t.extra)+30;e>65535&&this.ondata(I(11,0,1),null,!1);var h=new n(u);hn(h,0,t,i,a,-1);var f=[h],c=function(){for(var t=0,n=f;t<n.length;t++)r.ondata(null,n[t],!1);f=[]},l=this.d;this.d=0;var p=this.u.length,v=K(t,{f:i,u:a,o:s,t:function(){t.terminate&&t.terminate()},r:function(){if(c(),l){var t=r.u[p+1];t?t.r():r.d=1}l=1}}),d=0;t.ondata=function(i,e,o){if(i)r.ondata(i,e,o),r.terminate();else if(d+=e.length,f.push(e),o){var s=new n(16);lt(s,0,134695760),lt(s,4,t.crc),lt(s,8,d),lt(s,12,t.size),f.push(s),v.c=d,v.b=u+d+16,v.crc=t.crc,v.size=t.size,l&&v.r(),l=1}else l&&c()},this.u.push(v)}},t.prototype.end=function(){var t=this;2&this.d?this.ondata(I(4+8*(1&this.d),0,1),null,!0):(this.d?this.e():this.u.push({r:function(){1&t.d&&(t.u.splice(-1,1),t.e())},t:function(){}}),this.d=3)},t.prototype.e=function(){for(var t=0,r=0,i=0,e=0,o=this.u;e<o.length;e++)i+=46+(h=o[e]).f.length+un(h.extra)+(h.o?h.o.length:0);for(var s=new n(i+22),a=0,u=this.u;a<u.length;a++){var h;hn(s,t,h=u[a],h.f,h.u,-h.c-2,r,h.o),t+=46+h.f.length+un(h.extra)+(h.o?h.o.length:0),r+=h.b}fn(s,t,this.u.length,i,r),this.ondata(null,s,!0),this.d=2},t.prototype.terminate=function(){for(var t=0,n=this.u;t<n.length;t++)n[t].t();this.d=2},t}();function dn(t,r,i){i||(i=r,r={}),"function"!=typeof i&&I(7);var e={};Qt(t,"",e,r);var o=Object.keys(e),s=o.length,a=0,u=0,h=s,f=Array(s),c=[],l=function(){for(var t=0;t<c.length;++t)c[t]()},p=function(t,n){xn(function(){i(t,n)})};xn(function(){p=i});var v=function(){var t=new n(u+22),r=a,i=u-a;u=0;for(var e=0;e<h;++e){var o=f[e];try{var s=o.c.length;hn(t,u,o,o.f,o.u,s);var c=30+o.f.length+un(o.extra),l=u+c;t.set(o.c,l),hn(t,a,o,o.f,o.u,s,u,o.m),a+=16+c+(o.m?o.m.length:0),u=l+s}catch(t){return p(t,null)}}fn(t,a,f.length,i,r),p(null,t)};s||v();for(var d=function(t){var n=o[t],r=e[n],i=r[0],h=r[1],d=V(),g=i.length;d.p(i);var y=nn(n),m=y.length,b=h.comment,w=b&&nn(b),x=w&&w.length,z=un(h.extra),k=0==h.level?0:8,M=function(r,i){if(r)l(),p(r,null);else{var e=i.length;f[t]=K(h,{size:g,crc:d.d(),c:i,f:y,m:w,u:m!=n.length||w&&b.length!=x,compression:k}),a+=30+m+z+e,u+=76+2*(m+z)+(x||0)+e,--s||v()}};if(m>65535&&M(I(11,0,1),null),k)if(g<16e4)try{M(null,kt(i,h))}catch(t){M(t,null)}else c.push(zt(i,h,M));else M(null,i)},g=0;g<h;++g)d(g);return l}function gn(t,r){r||(r={});var i={},e=[];Qt(t,"",i,r);var o=0,s=0;for(var a in i){var u=i[a],h=u[0],f=u[1],c=0==f.level?0:8,l=(M=nn(a)).length,p=f.comment,v=p&&nn(p),d=v&&v.length,g=un(f.extra);l>65535&&I(11);var y=c?kt(h,f):h,m=y.length,b=V();b.p(h),e.push(K(f,{size:h.length,crc:b.d(),c:y,f:M,m:v,u:l!=a.length||v&&p.length!=d,o:o,compression:c})),o+=30+l+g+m,s+=76+2*(l+g)+(d||0)+m}for(var w=new n(s+22),x=o,z=s-o,k=0;k<e.length;++k){var M;hn(w,(M=e[k]).o,M,M.f,M.u,M.c.length);var S=30+M.f.length+un(M.extra);w.set(M.c,M.o+S),hn(w,o,M,M.f,M.u,M.c.length,M.o,M.m),o+=16+S+(M.m?M.m.length:0)}return fn(w,o,e.length,z,x),w}_e.Zip=vn;var yn=function(){function t(){}return t.prototype.push=function(t,n){this.ondata(null,t,n)},t.compression=0,t}();_e.UnzipPassThrough=yn;var mn=function(){function t(){var t=this;this.i=new Mt(function(n,r){t.ondata(null,n,r)})}return t.prototype.push=function(t,n){try{this.i.push(t,n)}catch(t){this.ondata(t,null,n)}},t.compression=8,t}();_e.UnzipInflate=mn;var bn=function(){function t(t,n){var r=this;n<32e4?this.i=new Mt(function(t,n){r.ondata(null,t,n)}):(this.i=new St(function(t,n,i){r.ondata(t,n,i)}),this.terminate=this.i.terminate)}return t.prototype.push=function(t,n){this.i.terminate&&(t=D(t,0)),this.i.push(t,n)},t.compression=8,t}();_e.AsyncUnzipInflate=bn;var wn=function(){function t(t){this.onfile=t,this.k=[],this.o={0:yn},this.p=j}return t.prototype.push=function(t,r){var i=this;if(this.onfile||I(5),this.p||I(4),this.c>0){var e=Math.min(this.c,t.length),o=t.subarray(0,e);if(this.c-=e,this.d?this.d.push(o,!this.c):this.k[0].push(o),(t=t.subarray(e)).length)return this.push(t,r)}else{var s=0,a=0,u=void 0,h=void 0;this.p.length?t.length?((h=new n(this.p.length+t.length)).set(this.p),h.set(t,this.p.length)):h=this.p:h=t;for(var f=h.length,c=this.c,l=c&&this.d,p=function(){var t=ft(h,a);if(67324752==t){s=1,u=a,v.d=null,v.c=0;var n=ht(h,a+6),r=ht(h,a+8),e=2048&n,o=8&n,l=ht(h,a+26),p=ht(h,a+28);if(f>a+30+l+p){var d=[];v.k.unshift(d),s=2;var g,y=ft(h,a+18),m=ft(h,a+22),b=rn(h.subarray(a+30,a+=30+l),!e),w=an(h,a,p,2,y,m,0),x=w[0],z=w[1];o&&(x=-1-w[3]),a+=p,v.c=x;var k={name:b,compression:r,start:function(){if(k.ondata||I(5),x){var t=i.o[r];t||k.ondata(I(14,"unknown compression type "+r,1),null,!1),(g=x<0?new t(b):new t(b,x,z)).ondata=function(t,n,r){k.ondata(t,n,r)};for(var n=0,e=d;n<e.length;n++)g.push(e[n],!1);i.k[0]==d&&i.c?i.d=g:g.push(j,!0)}else k.ondata(null,j,!0)},terminate:function(){g&&g.terminate&&g.terminate()}};x>=0&&(k.size=x,k.originalSize=z),v.onfile(k)}return"break"}if(c){if(134695760==t)return u=a+=12+(-2==c&&8),s=3,v.c=0,"break";if(33639248==t)return u=a-=4,s=3,v.c=0,"break"}},v=this;a<f-4&&"break"!==p();++a);if(this.p=j,c<0){var d=h.subarray(0,s?u-12-(-2==c&&8)-(134695760==ft(h,u-16)&&4):a);l?l.push(d,!!s):this.k[+(2==s)].push(d)}if(2&s)return this.push(h.subarray(a),r);this.p=h.subarray(a)}r&&(this.c&&I(13),this.p=null)},t.prototype.register=function(t){this.o[t.compression]=t},t}();_e.Unzip=wn;var xn="function"==typeof queueMicrotask?queueMicrotask:"function"==typeof setTimeout?setTimeout:function(t){t()};function zn(t,r,i){i||(i=r,r={}),"function"!=typeof i&&I(7);var e=[],o=function(){for(var t=0;t<e.length;++t)e[t]()},s={},a=function(t,n){xn(function(){i(t,n)})};xn(function(){a=i});for(var u=t.length-22;101010256!=ft(t,u);--u)if(!u||t.length-u>65558)return a(I(13,0,1),null),o;var h=ht(t,u+8);if(h){var f=h,c=ft(t,u+16),l=117853008==ft(t,u-20);if(l){var p=ft(t,u-12);(l=101075792==ft(t,p))&&(f=h=ft(t,p+32),c=ft(t,p+48))}for(var v=r&&r.filter,d=function(r){var i=sn(t,c,l),u=i[0],f=i[1],p=i[2],d=i[3],g=i[4],y=on(t,i[5]);c=g;var m=function(t,n){t?(o(),a(t,null)):(n&&(s[d]=n),--h||a(null,s))};if(!v||v({name:d,size:f,originalSize:p,compression:u}))if(u)if(8==u){var b=t.subarray(y,y+f);if(p<524288||f>.8*p)try{m(null,Tt(b,{out:new n(p)}))}catch(t){m(t,null)}else e.push(At(b,{size:p},m))}else m(I(14,"unknown compression type "+u,1),null);else m(null,D(t,y,y+f));else m(null,null)},g=0;g<f;++g)d()}else a(null,{});return o}function kn(t,r){for(var i={},e=t.length-22;101010256!=ft(t,e);--e)(!e||t.length-e>65558)&&I(13);var o=ht(t,e+8);if(!o)return{};var s=ft(t,e+16),a=117853008==ft(t,e-20);if(a){var u=ft(t,e-12);(a=101075792==ft(t,u))&&(o=ft(t,u+32),s=ft(t,u+48))}for(var h=r&&r.filter,f=0;f<o;++f){var c=sn(t,s,a),l=c[0],p=c[1],v=c[2],d=c[3],g=c[4],y=on(t,c[5]);s=g,h&&!h({name:d,size:p,originalSize:v,compression:l})||(l?8==l?i[d]=Tt(t.subarray(y,y+p),{out:new n(v)}):I(14,"unknown compression type "+l):i[d]=D(t,y,y+p))}return i}return _e});
"use strict";

// Bundled at build time; no downloads, browser streams, or Worker are needed.
(function (root) {
  var codec = typeof module !== "undefined" && module.exports
    ? require("fflate")
    : root.fflate;
  var crcTable;

  function crcUpdate(crc, bytes) {
    var index;
    var bit;
    var value;
    if (!crcTable) {
      crcTable = new Uint32Array(256);
      for (index = 0; index < 256; index += 1) {
        value = index;
        for (bit = 0; bit < 8; bit += 1) {
          value = value & 1 ? 0xedb88320 ^ value >>> 1 : value >>> 1;
        }
        crcTable[index] = value;
      }
    }
    for (index = 0; index < bytes.length; index += 1) {
      crc = crcTable[(crc ^ bytes[index]) & 255] ^ crc >>> 8;
    }
    return crc;
  }

  function uint32(bytes, offset) {
    return (bytes[offset] | bytes[offset + 1] << 8 |
      bytes[offset + 2] << 16 | bytes[offset + 3] << 24) >>> 0;
  }

  function validateHeader(bytes) {
    var flags = bytes[3];
    var offset = 10;
    var footer = bytes.length - 8;
    var index;
    if (bytes.length < 18 || bytes[0] !== 31 || bytes[1] !== 139 || bytes[2] !== 8 || flags & 224) {
      throw new Error("invalid gzip header");
    }
    if (flags & 4) {
      if (offset + 2 > footer) {
        throw new Error("truncated gzip extra");
      }
      offset += 2 + (bytes[offset] | bytes[offset + 1] << 8);
    }
    for (index = 0; index < 2; index += 1) {
      if (flags & (index === 0 ? 8 : 16)) {
        while (offset < footer && bytes[offset] !== 0) {
          offset += 1;
        }
        offset += 1;
      }
    }
    if (flags & 2) {
      if (offset + 2 > footer ||
          ((crcUpdate(-1, bytes.subarray(0, offset)) ^ -1) & 65535) !==
          (bytes[offset] | bytes[offset + 1] << 8)) {
        throw new Error("invalid gzip header checksum");
      }
      offset += 2;
    }
    if (offset >= footer) {
      throw new Error("truncated gzip header");
    }
  }

  function ungzip(bytes, limit) {
    var expected;
    var total = 0;
    var crc = -1;
    var chunks = [];
    var stream;
    var offset;
    var output;
    var index;
    if (!codec || !codec.Gunzip || !(bytes instanceof Uint8Array) ||
        !(limit >= 0) || limit > 4 * 1024 * 1024) {
      throw new Error("invalid gzip input or limit");
    }
    validateHeader(bytes);
    expected = uint32(bytes, bytes.length - 4);
    if (expected > limit) {
      throw new Error("decompressed gRPC message is too large");
    }
    stream = new codec.Gunzip(function (chunk) {
      total += chunk.length;
      if (total > limit || total > expected) {
        throw new Error("decompressed gRPC message is too large");
      }
      crc = crcUpdate(crc, chunk);
      if (chunk.length) {
        chunks.push(chunk);
      }
    });
    // A gRPC frame is a single compressed message. Unexpected extra members
    // are not partially decoded: the caller will keep the original response.
    stream.onmember = function () {
      throw new Error("multiple gzip members in one gRPC frame");
    };
    // Limit each inflate step as well as total output, even if ISIZE is forged.
    for (offset = 0; offset < bytes.length; offset += 1024) {
      stream.push(bytes.subarray(offset, offset + 1024), offset + 1024 >= bytes.length);
    }
    if (total !== expected || ((crc ^ -1) >>> 0) !== uint32(bytes, bytes.length - 8)) {
      throw new Error("invalid gzip length or checksum");
    }
    output = new Uint8Array(total);
    offset = 0;
    for (index = 0; index < chunks.length; index += 1) {
      output.set(chunks[index], offset);
      offset += chunks[index].length;
    }
    return output;
  }

  var api = { ungzip: ungzip };
  root.BiliGzip = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(this);

/*
 * Bilibili CDN Switcher v10 for Shadowrocket
 *
 * Default auto mode performs no network probes on playback responses. It reads
 * bounded host-level state produced by the background cron benchmark. It only
 * promotes complete URLs supplied for the same media path. Without evidence,
 * the server primary and the player's own retry/seek decisions are preserved.
 *
 * Fixed-host mode remains available as an explicit compatibility option.
 * Live URLs are never rewritten because their signatures are bound to
 * server-selected CDN metadata.
 */
(function (root) {
  "use strict";

  var gzipCodec = root.BiliGzip ||
    (typeof module !== "undefined" && module.exports ? require("./bilibili-gzip.js") : null);
  var NAME = "BiliCDN";
  var DEFAULT_CDN = "upos-sz-mirrorali.bilivideo.com";
  var AUTO_STATE_KEY = "BiliCDN.safeAuto.v7";
  var HOST_AUTO_STATE_KEY = "BiliCDN.hostAuto.v10";
  var HOST_AUTO_STATE_VERSION = 10;
  var MEDIA_ROUTE_STATE_KEY = "BiliCDN.mediaRoutes.v9";
  var MEDIA_ROUTE_STATE_VERSION = 9;
  var PLAYBACK_ACTIVITY_KEY = "BiliCDN.playbackActivity.v1";
  var PLAYBACK_PROBE_PAUSE_MS = 3 * 60 * 1000;
  var DEFAULT_AUTO_INTERVAL_HOURS = 2;
  var DEFAULT_SWITCH_THRESHOLD = 20;
  var RUNTIME_OPTION_LIMITS = {
    intervalHours: {
      defaultValue: DEFAULT_AUTO_INTERVAL_HOURS,
      maximum: 72,
      minimum: 2
    },
    switchThreshold: {
      defaultValue: DEFAULT_SWITCH_THRESHOLD,
      maximum: 80,
      minimum: 10
    }
  };
  var AUTO_CACHE_CAPACITY = 64;
  var MEDIA_ROUTE_CAPACITY = 64;
  var MEDIA_ROUTE_EXPIRY_SAFETY_MS = 30 * 1000;
  var MEDIA_ROUTE_MAX_TTL_MS = 2 * 60 * 60 * 1000;
  var MEDIA_ROUTE_MAX_URL_BYTES = 8192;
  var AUTO_HOST_CAPACITY = 48;
  var AUTO_CONFIRM_DELAY_MS = 2 * 60 * 1000;
  var AUTO_EXPLORE_DELAY_MS = 30 * 60 * 1000;
  var AUTO_GLOBAL_PROBE_GAP_MS = 2 * 60 * 1000;
  var AUTO_HOST_BACKOFF_BASE_MS = 15 * 60 * 1000;
  var AUTO_HOST_BACKOFF_MAX_MS = 2 * 60 * 60 * 1000;
  var AUTO_LOCK_MS = 10 * 1000;
  var AUTO_PROBE_TIMEOUT_MS = 5000;
  var AUTO_EXPLORE_RANGE_END = 262143;
  var AUTO_RANGE_END = 1048575;
  var AUTO_SAMPLE_ALIGNMENT = 65536;
  var AUTO_INTERIOR_SAMPLE_FRACTIONS = [0.5, 0.25, 0.75];
  var AUTO_RETRY_MS = 30 * 60 * 1000;
  var AUTO_SELECTED_REVALIDATE_MS = 8 * 60 * 1000;
  var MAX_GRPC_DECOMPRESSED_BYTES = 4 * 1024 * 1024;
  var MAX_PROTO_DEPTH = 32;
  var MAX_URL_BYTES = 65536;
  var MAX_JSON_DEPTH = 64;
  var AUTO_SCORE_SAMPLE_LIMIT = 5;
  var AUTO_HOST_SCORE_SAMPLE_LIMIT = 8;
  var AUTO_MIN_AUDIO_THROUGHPUT_KBPS = 256;
  var AUTO_MIN_SEGMENT_THROUGHPUT_KBPS = 1500;
  var AUTO_MIN_VIDEO_THROUGHPUT_KBPS = 2500;
  var AUTO_REPRESENTATION_HEADROOM = 1.35;
  var HOST_PROFILE_CAPACITY = 4;
  var HOST_AUTO_CAPACITY = 16;
  var HOST_SAMPLE_CAPACITY = 8;
  var HOST_OBJECT_CAPACITY = 4;
  var HOST_ALIAS_FRESH_MS = 6 * 60 * 60 * 1000;
  var HOST_STATE_STALE_MS = 24 * 60 * 60 * 1000;
  var HOST_CIRCUIT_OPEN_MS = 2 * 60 * 60 * 1000;
  var HOST_MIN_OBJECTS = 2;
  var HOST_MAX_FAILURE_RATE = 0.25;
  var HOST_MAX_JITTER_RATIO = 0.65;
  var HOST_MIN_THROUGHPUT_KBPS = 10000;
  var HOST_REPRESENTATION_HEADROOM = 1.8;
  var HOST_MEDIA_BUCKETS = ["audio", "normal-video", "high-bitrate-video"];
  var HIGH_BITRATE_REQUIRED_KBPS = 8000;

  /*
   * Maintained examples for fixed-mode configuration. Automatic selection and
   * background benchmarking only use complete URLs from the current response.
   */
  var FIXED_CDN_CANDIDATES = [
    "upos-sz-mirrorali.bilivideo.com",
    "upos-sz-mirrorcos.bilivideo.com",
    "upos-sz-mirrorhw.bilivideo.com",
    "upos-sz-mirroraliov.bilivideo.com",
    "upos-sz-mirrorcosov.bilivideo.com",
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
    "height",
    "bandwidth"
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

  function normalizedNetworkType(value) {
    var type = typeof value === "string" ? value.trim().toLowerCase() : "";
    if (/^(?:wifi|wi-fi|wlan)$/.test(type)) {
      return "wifi";
    }
    if (/^(?:cell|cellular|mobile|wwan|4g|5g|lte)$/.test(type)) {
      return "cellular";
    }
    return "";
  }

  function resolveRuntimeNetworkProfile(configuredProfile, services) {
    var configured = normalizeNetworkProfile(configuredProfile);
    var info;
    var type;
    var identifier;
    var hash;
    if (configured !== "auto") {
      return configured;
    }
    try {
      info = services && typeof services.networkInfo === "function"
        ? services.networkInfo()
        : null;
    } catch (error) {
      info = null;
    }
    if (!isObject(info) || Array.isArray(info)) {
      return "auto";
    }
    type = normalizedNetworkType(info.type);
    if (!type) {
      return "auto";
    }
    identifier = typeof info.identifier === "string"
      ? info.identifier.trim()
      : "";
    if (!identifier) {
      return type;
    }
    hash = stableHash("n", type + "\u0000" + identifier);
    return type + "_" + hash.slice(-16);
  }

  function normalizeProbeMode(value) {
    var mode =
      typeof value === "string" ? value.trim().toLowerCase() : "";
    return mode === "blocking" || mode === "off" ? mode : "cron";
  }

  function normalizeResetToken(value) {
    var token =
      typeof value === "string" ? value.trim().toLowerCase() : "";
    return /^[a-z0-9][a-z0-9_-]{0,31}$/.test(token) ? token : "";
  }

  function parseArgument(argument) {
    var config = {
      ads: false,
      auto: true,
      cdnHost: null,
      debug: false,
      intervalHours: DEFAULT_AUTO_INTERVAL_HOURS,
      networkProfile: "auto",
      probeMode: "cron",
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
      config.ads = parseBoolean(parsed.ads);
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
      } else if (key === "ads") {
        config.ads = parseBoolean(value);
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

  function replaceVodHostname(value, cdnHost) {
    var parsed;
    var portMatch;
    if (
      FIXED_CDN_CANDIDATES.indexOf(String(cdnHost || "").toLowerCase()) === -1 ||
      !isVodMediaUrl(value)
    ) {
      return "";
    }
    parsed = parseHttpUrl(value);
    if (!parsed) {
      return "";
    }
    portMatch = /:(\d+)$/.exec(parsed.authority);
    return (
      parsed.scheme +
      "://" +
      String(cdnHost).toLowerCase() +
      (portMatch ? ":" + portMatch[1] : "") +
      parsed.remainder
    );
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

  function rotateJsonAliasLaneToUrl(value, lane, selectedUrl) {
    var selectedId = candidateIdForUrl(selectedUrl);
    var array = value[lane.backupKey];
    var next = [lane.primaryUrl];
    var seen = {};
    var index;
    var item;
    var itemId;
    var changed = 0;
    if (!selectedId || selectedId === lane.primaryId || !isVodMediaUrl(selectedUrl)) {
      return 0;
    }
    seen[lane.primaryUrl] = true;
    if (value[lane.primaryKey] !== selectedUrl) {
      value[lane.primaryKey] = selectedUrl;
      changed += 1;
    }
    for (index = 0; index < array.length; index += 1) {
      item = array[index];
      itemId = typeof item === "string" ? candidateIdForUrl(item) : null;
      if (
        itemId === selectedId ||
        itemId === lane.primaryId ||
        seen[item]
      ) {
        continue;
      }
      seen[item] = true;
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
        if (parsed && parsed.hostname === cdnHost &&
          sameMediaObject(lanes[index].primaryUrl, lanes[index].backups[inner])) {
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
        if (parsed && parsed.hostname === cdnHost && sameMediaObject(primaryUrls[0], backupUrls[inner])) {
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

  function decompressGzip(input, limit) {
    var bytes = toUint8Array(input);
    var output;
    var stream;
    var reader;
    var chunks = [];
    var total = 0;
    limit = limit === undefined ? MAX_GRPC_DECOMPRESSED_BYTES : limit;

    if (!bytes) {
      return Promise.reject(new Error("invalid gzip input"));
    }
    if (gzipCodec) {
      try {
        return Promise.resolve(gzipCodec.ungzip(bytes, limit));
      } catch (error) {
        return Promise.reject(error);
      }
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
          output.length > limit
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
        if (total > limit) {
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
    tasks = Promise.resolve([]);
    parsed.frames.forEach(function (frame) {
      tasks = tasks.then(function (payloads) {
        var payload = original.slice(frame.payloadStart, frame.end);
        return (
          frame.flag === 1
            ? decompressGzip(payload, MAX_GRPC_DECOMPRESSED_BYTES - total)
            : Promise.resolve(payload)
        ).then(function (decoded) {
          total += decoded.length;
          if (total > MAX_GRPC_DECOMPRESSED_BYTES) {
            throw new Error("decompressed gRPC response is too large");
          }
          payloads.push(decoded);
          return payloads;
        });
      });
    });
    return tasks.then(
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

  function decodeMediaQueryValue(value) {
    try {
      return decodeURIComponent(String(value || "").replace(/\+/g, "%20"));
    } catch (error) {
      return "";
    }
  }

  function mediaRouteQueryValues(parsed) {
    var allowed = {
      buvid: true,
      deadline: true,
      exp: true,
      expires: true,
      hdnts: true,
      mid: true,
      oi: true,
      trid: true
    };
    var output = {};
    var query = parsed && typeof parsed.query === "string"
      ? parsed.query.replace(/^\?/, "")
      : "";
    var pairs;
    var index;
    var splitAt;
    var key;
    var value;
    if (!query || query.length > MEDIA_ROUTE_MAX_URL_BYTES) {
      return output;
    }
    pairs = query.split("&");
    for (index = 0; index < pairs.length; index += 1) {
      splitAt = pairs[index].indexOf("=");
      key = decodeMediaQueryValue(
        splitAt === -1 ? pairs[index] : pairs[index].slice(0, splitAt)
      ).toLowerCase();
      if (!allowed[key] || Object.prototype.hasOwnProperty.call(output, key)) {
        continue;
      }
      value = decodeMediaQueryValue(
        splitAt === -1 ? "" : pairs[index].slice(splitAt + 1)
      );
      if (value.length <= 512) {
        output[key] = value;
      }
    }
    return output;
  }

  function unixExpiryMilliseconds(value) {
    var text = String(value || "").trim();
    var parsed;
    if (!/^\d{9,13}$/.test(text)) {
      return 0;
    }
    parsed = Number(text);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
      return 0;
    }
    return parsed < 100000000000 ? parsed * 1000 : parsed;
  }

  function signedMediaExpiryMilliseconds(values) {
    var expiry = unixExpiryMilliseconds(
      values && (values.deadline || values.expires || values.exp)
    );
    var hdntsMatch;
    if (expiry > 0) {
      return expiry;
    }
    hdntsMatch = /(?:^|~)exp=(\d{9,13})(?:~|$)/i.exec(
      String(values && values.hdnts || "")
    );
    return hdntsMatch ? unixExpiryMilliseconds(hdntsMatch[1]) : 0;
  }

  function boundedMediaBindingValue(value) {
    value = typeof value === "string" ? value : "";
    return value.length <= 256 ? value : "";
  }

  function mediaRouteKeyForUrl(url, networkProfile) {
    var parsed;
    var values;
    var signedExpiresAt;
    var transaction;
    var member;
    var originIp;
    var device;
    var material;
    if (typeof url !== "string" || url.length > MEDIA_ROUTE_MAX_URL_BYTES) {
      return null;
    }
    parsed = parseHttpUrl(url);
    if (!parsed || !isVodMediaUrl(url)) {
      return null;
    }
    values = mediaRouteQueryValues(parsed);
    signedExpiresAt = signedMediaExpiryMilliseconds(values);
    transaction = boundedMediaBindingValue(values.trid);
    member = boundedMediaBindingValue(values.mid);
    originIp = boundedMediaBindingValue(values.oi);
    device = boundedMediaBindingValue(values.buvid);
    if (
      signedExpiresAt <= MEDIA_ROUTE_EXPIRY_SAFETY_MS ||
      (!transaction && !(member && originIp) && !device)
    ) {
      return null;
    }
    material = [
      normalizeNetworkProfile(networkProfile),
      parsed.path,
      String(signedExpiresAt),
      transaction,
      member,
      originIp,
      device
    ].join("\u0000");
    return {
      authority: parsed.authority,
      expiresAt: signedExpiresAt - MEDIA_ROUTE_EXPIRY_SAFETY_MS,
      hostname: parsed.hostname,
      key: stableHash("m", material),
      path: parsed.path,
      signedExpiresAt: signedExpiresAt
    };
  }

  function createEmptyMediaRouteState() {
    return { entries: {}, version: MEDIA_ROUTE_STATE_VERSION };
  }

  function sanitizeMediaRouteSourceHosts(value) {
    var output = [];
    var seen = {};
    var index;
    var hostname;
    if (!Array.isArray(value)) {
      return output;
    }
    for (index = 0; index < value.length && output.length < 16; index += 1) {
      hostname = String(value[index] || "").toLowerCase();
      if (
        !seen[hostname] &&
        isValidHostname(hostname) &&
        isBilibiliMediaHost(hostname)
      ) {
        seen[hostname] = true;
        output.push(hostname);
      }
    }
    return output;
  }

  function sanitizeMediaRouteEntry(key, value, now) {
    var networkProfile;
    var targetUrl;
    var binding;
    var target;
    var targetHost;
    var sourceHosts;
    var expiresAt;
    if (!isObject(value) || Array.isArray(value)) {
      return null;
    }
    networkProfile = normalizeNetworkProfile(value.networkProfile);
    targetUrl = typeof value.targetUrl === "string" ? value.targetUrl : "";
    if (!targetUrl || targetUrl.length > MEDIA_ROUTE_MAX_URL_BYTES) {
      return null;
    }
    binding = mediaRouteKeyForUrl(targetUrl, networkProfile);
    target = parseHttpUrl(targetUrl);
    targetHost = String(value.targetHost || "").toLowerCase();
    sourceHosts = sanitizeMediaRouteSourceHosts(value.sourceHosts);
    if (
      !binding ||
      binding.key !== key ||
      !target ||
      target.hostname !== targetHost ||
      !isBilibiliMediaHost(targetHost) ||
      sourceHosts.length === 0 ||
      sourceHosts.indexOf(targetHost) === -1
    ) {
      return null;
    }
    expiresAt = Math.min(
      boundedNumber(value.expiresAt, 0, 0, 9e15),
      binding.expiresAt,
      boundedNumber(now, 0, 0, 9e15) + MEDIA_ROUTE_MAX_TTL_MS
    );
    if (expiresAt <= now) {
      return null;
    }
    return {
      expiresAt: expiresAt,
      networkProfile: networkProfile,
      observedAt: boundedNumber(value.observedAt, 0, 0, 9e15),
      sourceHosts: sourceHosts,
      targetHost: targetHost,
      targetUrl: targetUrl
    };
  }

  function sanitizeMediaRouteState(value, now) {
    var state = createEmptyMediaRouteState();
    var rows = [];
    var keys;
    var index;
    var key;
    var entry;
    now = boundedNumber(now, 0, 0, 9e15);
    if (
      !isObject(value) ||
      Array.isArray(value) ||
      value.version !== MEDIA_ROUTE_STATE_VERSION ||
      !isObject(value.entries) ||
      Array.isArray(value.entries)
    ) {
      return state;
    }
    keys = Object.keys(value.entries).slice(0, MEDIA_ROUTE_CAPACITY * 4);
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      if (!/^m2_[0-9a-f]{32}$/.test(key)) {
        continue;
      }
      entry = sanitizeMediaRouteEntry(key, value.entries[key], now);
      if (entry) {
        rows.push({ entry: entry, key: key });
      }
    }
    rows.sort(function (left, right) {
      return right.entry.observedAt - left.entry.observedAt;
    });
    for (
      index = 0;
      index < rows.length && index < MEDIA_ROUTE_CAPACITY;
      index += 1
    ) {
      state.entries[rows[index].key] = rows[index].entry;
    }
    return state;
  }

  function loadMediaRouteState(services, now) {
    var raw;
    var parsed;
    try {
      raw = services && typeof services.read === "function"
        ? services.read(MEDIA_ROUTE_STATE_KEY)
        : null;
      parsed = raw ? JSON.parse(raw) : null;
    } catch (error) {
      parsed = null;
    }
    return sanitizeMediaRouteState(parsed, now);
  }

  function saveMediaRouteState(services, state, now) {
    try {
      return Boolean(
        services &&
        typeof services.write === "function" &&
        services.write(
          JSON.stringify(sanitizeMediaRouteState(state, now)),
          MEDIA_ROUTE_STATE_KEY
        )
      );
    } catch (error) {
      return false;
    }
  }

  function mediaRouteForDescriptor(descriptor, config, now) {
    var selectedId;
    var primaryBinding;
    var targetBinding;
    var target;
    var sourceHosts = [];
    var seenHosts = {};
    var index;
    var candidate;
    var candidateBinding;
    var candidateParsed;
    var expiresAt;
    if (
      !descriptor ||
      !descriptor.selectedUrl ||
      descriptor.selectedAlias ||
      !descriptor.candidateById
    ) {
      return null;
    }
    selectedId = candidateIdForUrl(descriptor.selectedUrl);
    if (
      !selectedId ||
      selectedId === descriptor.primaryId ||
      descriptor.candidateById[selectedId] !== descriptor.selectedUrl
    ) {
      return null;
    }
    primaryBinding = mediaRouteKeyForUrl(
      descriptor.primaryUrl,
      config && config.networkProfile
    );
    targetBinding = mediaRouteKeyForUrl(
      descriptor.selectedUrl,
      config && config.networkProfile
    );
    target = parseHttpUrl(descriptor.selectedUrl);
    if (
      !primaryBinding ||
      !targetBinding ||
      primaryBinding.key !== targetBinding.key ||
      !target
    ) {
      return null;
    }
    for (index = 0; index < descriptor.candidates.length; index += 1) {
      candidate = descriptor.candidates[index];
      candidateBinding = mediaRouteKeyForUrl(
        candidate && candidate.url,
        config && config.networkProfile
      );
      candidateParsed = parseHttpUrl(candidate && candidate.url);
      if (
        candidateBinding &&
        candidateBinding.key === primaryBinding.key &&
        candidateParsed &&
        !seenHosts[candidateParsed.hostname]
      ) {
        seenHosts[candidateParsed.hostname] = true;
        sourceHosts.push(candidateParsed.hostname);
      }
    }
    if (sourceHosts.length < 2 || sourceHosts.indexOf(target.hostname) === -1) {
      return null;
    }
    expiresAt = Math.min(
      primaryBinding.expiresAt,
      targetBinding.expiresAt,
      now + MEDIA_ROUTE_MAX_TTL_MS
    );
    if (expiresAt <= now) {
      return null;
    }
    return {
      entry: {
        expiresAt: expiresAt,
        networkProfile: normalizeNetworkProfile(config && config.networkProfile),
        observedAt: now,
        sourceHosts: sourceHosts,
        targetHost: target.hostname,
        targetUrl: descriptor.selectedUrl
      },
      key: primaryBinding.key
    };
  }

  function persistPreparedMediaRoutes(services, descriptors, config, now) {
    var state;
    var routes = [];
    var revoked = [];
    var binding;
    var changed = false;
    var index;
    var route;
    if (
      !config ||
      !config.auto ||
      !hasStateServices(services) ||
      !Array.isArray(descriptors)
    ) {
      return 0;
    }
    for (index = 0; index < descriptors.length; index += 1) {
      route = mediaRouteForDescriptor(descriptors[index], config, now);
      if (route) {
        routes.push(route);
      } else {
        binding = mediaRouteKeyForUrl(descriptors[index].primaryUrl, config.networkProfile);
        if (binding) {
          revoked.push(binding.key);
        }
      }
    }
    if (routes.length === 0 && revoked.length === 0) {
      return 0;
    }
    state = loadMediaRouteState(services, now);
    for (index = 0; index < revoked.length; index += 1) {
      if (state.entries[revoked[index]]) {
        delete state.entries[revoked[index]];
        changed = true;
      }
    }
    for (index = 0; index < routes.length; index += 1) {
      state.entries[routes[index].key] = routes[index].entry;
    }
    return (changed || routes.length > 0) && saveMediaRouteState(services, state, now) ? routes.length : 0;
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

  function requiredThroughputKbps(kind, bandwidthBitsPerSecond) {
    var bandwidth = boundedNumber(
      bandwidthBitsPerSecond,
      0,
      0,
      1000000000
    );
    var representationFloor =
      bandwidth > 0
        ? Math.ceil((bandwidth / 1000) * AUTO_REPRESENTATION_HEADROOM)
        : 0;
    if (kind === "audio") {
      return Math.max(AUTO_MIN_AUDIO_THROUGHPUT_KBPS, representationFloor);
    }
    if (kind === "segment") {
      return Math.max(AUTO_MIN_SEGMENT_THROUGHPUT_KBPS, representationFloor);
    }
    return Math.max(AUTO_MIN_VIDEO_THROUGHPUT_KBPS, representationFloor);
  }

  function mediaBucketForDescriptor(descriptor) {
    var kind = String(descriptor && descriptor.kind || "").toLowerCase();
    var required = boundedNumber(
      descriptor && descriptor.requiredKbps,
      0,
      0,
      100000000
    );
    var bandwidth = boundedNumber(
      descriptor && descriptor.bandwidthBitsPerSecond,
      0,
      0,
      1000000000
    );
    var quality = boundedNumber(descriptor && descriptor.quality, 0, 0, 1000);
    var codecid = boundedNumber(descriptor && descriptor.codecid, 0, 0, 1000);
    if (kind === "audio") {
      return "audio";
    }
    return (
      required >= HIGH_BITRATE_REQUIRED_KBPS ||
      bandwidth >= 5500000 ||
      quality >= 112 ||
      (
        quality >= 80 &&
        (codecid === 12 || codecid === 13) &&
        bandwidth >= 4000000
      )
    )
      ? "high-bitrate-video"
      : "normal-video";
  }

  function metadataNumber(metadata, keys) {
    var text = typeof metadata === "string" ? metadata : "";
    var index;
    var match;
    for (index = 0; index < keys.length; index += 1) {
      match = new RegExp("(?:^|&)" + keys[index] + "=([0-9]+)(?:&|$)").exec(text);
      if (match) {
        return boundedNumber(match[1], 0, 0, 1000000000);
      }
    }
    return 0;
  }

  function sameMediaObject(primaryUrl, candidateUrl) {
    var primary = parseHttpUrl(primaryUrl);
    var candidate = parseHttpUrl(candidateUrl);
    return Boolean(primary && candidate && isVodMediaUrl(primaryUrl) &&
      isVodMediaUrl(candidateUrl) && primary.path === candidate.path);
  }

  function buildMediaDescriptor(
    format,
    kind,
    primaryUrl,
    backupUrls,
    metadata,
    bandwidthBitsPerSecond
  ) {
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
        sameMediaObject(primaryUrl, url) &&
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
      codecid: metadataNumber(metadata, ["codecid"]),
      family: primaryFamily,
      format: format,
      keyMaterial: resourceMaterial,
      kind: kind || "unknown",
      bandwidthBitsPerSecond: boundedNumber(
        bandwidthBitsPerSecond,
        0,
        0,
        1000000000
      ),
      metadata: metadata || "",
      primaryId: candidates[0].id,
      primaryUrl: primaryUrl,
      quality: metadataNumber(metadata, ["quality", "id"]),
      requiredKbps: requiredThroughputKbps(
        kind || "unknown",
        bandwidthBitsPerSecond
      ),
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

  function isHostCircuitOpen(state, candidateId, now) {
    var health =
      state &&
      state.hosts &&
      /^c2_[0-9a-f]{32}$/.test(candidateId || "")
        ? state.hosts[candidateId]
        : null;
    return Boolean(health && health.openUntil > now);
  }

  function descriptorCandidateForHost(descriptor, hostname) {
    var index;
    var parsed;
    for (index = 0; index < descriptor.candidates.length; index += 1) {
      parsed = parseHttpUrl(descriptor.candidates[index].url);
      if (parsed && parsed.hostname === hostname) {
        return descriptor.candidates[index].url;
      }
    }
    return "";
  }

  function selectHostUrlForDescriptor(descriptor, config, now) {
    var stableHost = selectStableHost(
      config && config.hostAutoState,
      config,
      descriptor,
      now
    );
    var primary = parseHttpUrl(descriptor.primaryUrl);
    var exactUrl;

    descriptor.selectedHost = "";
    descriptor.selectionSource = "server-primary";
    if (stableHost) {
      descriptor.selectedHost = stableHost;
      if (primary && primary.hostname === stableHost) {
        descriptor.selectionSource = "host-state-primary";
        return null;
      }
      exactUrl = descriptorCandidateForHost(descriptor, stableHost);
      if (exactUrl) {
        descriptor.selectionSource = "host-state";
        return exactUrl;
      }
    }
    return null;
  }

  function hostUsableForDescriptor(hostname, descriptor) {
    // Benchmark descriptors rank hosts before a playback candidate set exists.
    if (!descriptor || !descriptor.primaryUrl) {
      return true;
    }
    var primary = parseHttpUrl(descriptor.primaryUrl);
    return Boolean(
      (primary && primary.hostname === hostname) ||
      descriptorCandidateForHost(descriptor, hostname)
    );
  }

  function selectedUrlForDescriptor(descriptor, config, state, now) {
    var key = descriptorResourceKey(descriptor, config);
    var entry = state.entries[key];
    var selectedUrl;

    descriptor.resourceKey = key;
    if (
      config &&
      config.hostAutoState &&
      config.hostAutoState.version === HOST_AUTO_STATE_VERSION
    ) {
      return selectHostUrlForDescriptor(descriptor, config, now);
    }
    if (
      !entry ||
      entry.candidateSetHash !== descriptor.candidateSetHash ||
      !entry.candidateId ||
      entry.candidateId === descriptor.primaryId ||
      entry.expiresAt <= now ||
      entry.validatedAt <= 0 ||
      isHostCircuitOpen(state, entry.candidateId, now) ||
      (
        config &&
        config.probeMode !== "off" &&
        entry.validatedAt + AUTO_SELECTED_REVALIDATE_MS <= now
      )
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
    var laneSelectedUrl;
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
      jsonMetadataSignature(value),
      value.bandwidth
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
      laneSelectedUrl = laneUrlForCandidate(lanes[index], selectedId);
      if (!laneSelectedUrl) {
        return { changed: 0, descriptor: descriptor };
      }
    }
    for (index = 0; index < lanes.length; index += 1) {
      laneSelectedUrl = laneUrlForCandidate(lanes[index], selectedId);
      changed += rotateJsonAliasLaneToUrl(
        value,
        lanes[index],
        laneSelectedUrl
      );
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
      hosts: {},
      lastProbeAt: 0,
      lockTokens: {},
      locks: {},
      resetToken: "",
      version: 7
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

  function percentile25(values) {
    var sorted;
    var index;
    if (!Array.isArray(values) || values.length === 0) {
      return 0;
    }
    sorted = values.slice().sort(function (left, right) {
      return left - right;
    });
    index = Math.floor((sorted.length - 1) * 0.25);
    return sorted[index];
  }

  function createEmptyHostAutoState() {
    return {
      lock: null,
      profiles: {},
      resetToken: "",
      version: HOST_AUTO_STATE_VERSION
    };
  }

  function sanitizeHostObjectId(value) {
    return /^o2_[0-9a-f]{32}$/.test(value || "") ? value : "";
  }

  function sanitizeHostBenchmarkSample(value) {
    var objectId;
    var phase;
    var bucket;
    if (!isObject(value) || Array.isArray(value)) {
      return null;
    }
    objectId = sanitizeHostObjectId(value.objectId);
    phase = /^(?:startup|sustained)$/.test(String(value.phase || ""))
      ? String(value.phase)
      : "combined";
    bucket = HOST_MEDIA_BUCKETS.indexOf(String(value.bucket || "")) !== -1
      ? String(value.bucket)
      : "normal-video";
    return {
      at: boundedNumber(value.at, 0, 0, 9e15),
      bucket: bucket,
      elapsedMs: boundedNumber(value.elapsedMs, 0, 0, 60000),
      objectId: objectId,
      ok: Boolean(value.ok),
      phase: phase,
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
      ),
      ttfbMs: boundedNumber(value.ttfbMs, 0, 0, 60000)
    };
  }

  function summarizeHostSamples(samples) {
    var successful = samples.filter(function (sample) {
      return sample.ok;
    });
    var startup = successful.filter(function (sample) {
      return sample.phase === "startup" || sample.phase === "combined";
    });
    var sustained = successful.filter(function (sample) {
      return sample.phase === "sustained" || sample.phase === "combined";
    });
    function distinctObjects(rows) {
      var seen = {};
      rows.forEach(function (sample) {
        if (sample.objectId) {
          seen[sample.objectId] = true;
        }
      });
      return Object.keys(seen).length;
    }
    var startupThroughput = startup.map(function (sample) {
      return sample.throughputKbps;
    });
    var sustainedThroughput = sustained.map(function (sample) {
      return sample.throughputKbps;
    });
    var ttfb = startup.map(function (sample) {
      return sample.ttfbMs;
    });
    var medianTtfbMs = median(ttfb);
    var ttfbDeviations = ttfb.map(function (value) {
      return Math.abs(value - medianTtfbMs);
    });
    var medianSustained = median(sustainedThroughput);
    var throughputDeviations = sustainedThroughput.map(function (value) {
      return Math.abs(value - medianSustained);
    });
    var ttfbJitter = medianTtfbMs > 0
      ? median(ttfbDeviations) / medianTtfbMs
      : 0;
    var throughputJitter = medianSustained > 0
      ? median(throughputDeviations) / medianSustained
      : 0;
    var p25Sustained = percentile25(sustainedThroughput);
    return {
      failureRate:
        samples.length === 0
          ? 0
          : (samples.length - successful.length) / samples.length,
      jitterRatio: Math.max(ttfbJitter, throughputJitter),
      lastSuccessAt: successful.reduce(function (latest, sample) {
        return Math.max(latest, sample.at || 0);
      }, 0),
      medianStartupThroughputKbps: median(startupThroughput),
      medianStartupTtfbMs: medianTtfbMs,
      medianSustainedThroughputKbps: medianSustained,
      medianThroughputKbps: medianSustained,
      medianTtfbMs: medianTtfbMs,
      objectCount: distinctObjects(sustained),
      p25StartupThroughputKbps: percentile25(startupThroughput),
      p25SustainedThroughputKbps: p25Sustained,
      p25ThroughputKbps: p25Sustained,
      sampleCount: samples.length,
      startupSuccessCount: startup.length,
      startupObjectCount: distinctObjects(startup),
      successCount: successful.length,
      sustainedObjectCount: distinctObjects(sustained),
      sustainedSuccessCount: sustained.length
    };
  }

  function createEmptyHostBucket() {
    return {
      lastSuccessAt: 0,
      metrics: summarizeHostSamples([]),
      objects: [],
      samples: []
    };
  }

  function sanitizeHostBucket(value, bucketName) {
    var bucket = createEmptyHostBucket();
    var seenObjects = {};
    var index;
    var objectId;
    var sample;
    if (!isObject(value) || Array.isArray(value)) {
      return bucket;
    }
    if (Array.isArray(value.objects)) {
      for (
        index = Math.max(0, value.objects.length - HOST_OBJECT_CAPACITY);
        index < value.objects.length;
        index += 1
      ) {
        objectId = sanitizeHostObjectId(value.objects[index]);
        if (objectId && !seenObjects[objectId]) {
          seenObjects[objectId] = true;
          bucket.objects.push(objectId);
        }
      }
    }
    if (Array.isArray(value.samples)) {
      for (
        index = Math.max(0, value.samples.length - HOST_SAMPLE_CAPACITY);
        index < value.samples.length;
        index += 1
      ) {
        sample = sanitizeHostBenchmarkSample(value.samples[index]);
        if (!sample || sample.bucket !== bucketName) {
          continue;
        }
        bucket.samples.push(sample);
        if (
          sample.ok &&
          sample.objectId &&
          (sample.phase === "sustained" || sample.phase === "combined") &&
          !seenObjects[sample.objectId]
        ) {
          seenObjects[sample.objectId] = true;
          bucket.objects.push(sample.objectId);
          if (bucket.objects.length > HOST_OBJECT_CAPACITY) {
            delete seenObjects[bucket.objects.shift()];
          }
        }
      }
    }
    bucket.lastSuccessAt = Math.max(
      boundedNumber(value.lastSuccessAt, 0, 0, 9e15),
      bucket.samples.reduce(function (latest, row) {
        return row.ok ? Math.max(latest, row.at || 0) : latest;
      }, 0)
    );
    bucket.objects = bucket.objects.slice(-HOST_OBJECT_CAPACITY);
    bucket.metrics = summarizeHostSamples(bucket.samples);
    return bucket;
  }

  function sanitizeHostAutoHealth(value) {
    var health = {
      buckets: {},
      failureStreak: 0,
      lastFailureAt: 0,
      lastSuccessAt: 0,
      lastUsedAt: 0,
      metrics: summarizeHostSamples([]),
      objects: [],
      openUntil: 0,
      samples: []
    };
    var index;
    var sample;
    var bucketName;
    var bucketInput;
    var directBuckets = {};

    if (!isObject(value) || Array.isArray(value)) {
      for (index = 0; index < HOST_MEDIA_BUCKETS.length; index += 1) {
        health.buckets[HOST_MEDIA_BUCKETS[index]] = createEmptyHostBucket();
      }
      return health;
    }
    if (Array.isArray(value.samples)) {
      for (index = 0; index < value.samples.length; index += 1) {
        sample = sanitizeHostBenchmarkSample(value.samples[index]);
        if (sample) {
          if (!directBuckets[sample.bucket]) {
            directBuckets[sample.bucket] = { objects: [], samples: [] };
          }
          directBuckets[sample.bucket].samples.push(sample);
        }
      }
      if (Array.isArray(value.objects)) {
        if (!directBuckets["normal-video"]) {
          directBuckets["normal-video"] = { objects: [], samples: [] };
        }
        directBuckets["normal-video"].objects = value.objects;
      }
    }
    for (index = 0; index < HOST_MEDIA_BUCKETS.length; index += 1) {
      bucketName = HOST_MEDIA_BUCKETS[index];
      bucketInput = value.buckets && value.buckets[bucketName]
        ? value.buckets[bucketName]
        : directBuckets[bucketName];
      health.buckets[bucketName] = sanitizeHostBucket(bucketInput, bucketName);
    }
    health.failureStreak = boundedInteger(
      value.failureStreak,
      0,
      0,
      HOST_SAMPLE_CAPACITY
    );
    health.lastFailureAt = boundedNumber(value.lastFailureAt, 0, 0, 9e15);
    health.lastSuccessAt = boundedNumber(value.lastSuccessAt, 0, 0, 9e15);
    health.lastUsedAt = boundedNumber(value.lastUsedAt, 0, 0, 9e15);
    health.openUntil = boundedNumber(value.openUntil, 0, 0, 9e15);
    for (index = 0; index < HOST_MEDIA_BUCKETS.length; index += 1) {
      health.lastSuccessAt = Math.max(
        health.lastSuccessAt,
        health.buckets[HOST_MEDIA_BUCKETS[index]].lastSuccessAt
      );
    }
    health.samples = health.buckets["normal-video"].samples;
    health.objects = health.buckets["normal-video"].objects;
    health.metrics = health.buckets["normal-video"].metrics;
    return health;
  }

  function sanitizeHostProfile(value) {
    var profile = {
      challengerCursor: 0,
      learningRuns: 0,
      hosts: {},
      lastRunAt: 0,
      nextRunAt: 0,
      pendingHost: "",
      rangeCursor: 0,
      sampleCursor: 0,
      selectedAt: 0,
      selectedHost: ""
    };
    var hostRows = [];
    var keys;
    var index;
    var hostname;
    var health;

    if (!isObject(value) || Array.isArray(value)) {
      return profile;
    }
    profile.challengerCursor = boundedInteger(
      value.challengerCursor,
      0,
      0,
      1000000
    );
    profile.lastRunAt = boundedNumber(value.lastRunAt, 0, 0, 9e15);
    profile.learningRuns = boundedInteger(value.learningRuns, 0, 0, 6);
    profile.nextRunAt = boundedNumber(value.nextRunAt, 0, 0, 9e15);
    hostname = String(value.pendingHost || "").toLowerCase();
    if (isValidHostname(hostname) && isBilibiliMediaHost(hostname)) {
      profile.pendingHost = hostname;
    }
    profile.rangeCursor = boundedInteger(value.rangeCursor, 0, 0, 1000000);
    profile.sampleCursor = boundedInteger(value.sampleCursor, 0, 0, 1000000);
    profile.selectedAt = boundedNumber(value.selectedAt, 0, 0, 9e15);
    hostname = String(value.selectedHost || "").toLowerCase();
    if (isValidHostname(hostname) && isBilibiliMediaHost(hostname)) {
      profile.selectedHost = hostname;
    }
    if (isObject(value.hosts) && !Array.isArray(value.hosts)) {
      keys = Object.keys(value.hosts);
      for (index = 0; index < keys.length; index += 1) {
        hostname = String(keys[index] || "").toLowerCase();
        if (!isValidHostname(hostname) || !isBilibiliMediaHost(hostname)) {
          continue;
        }
        health = sanitizeHostAutoHealth(value.hosts[keys[index]]);
        hostRows.push({ health: health, hostname: hostname });
      }
    }
    hostRows.sort(function (left, right) {
      return right.health.lastUsedAt - left.health.lastUsedAt;
    });
    for (
      index = 0;
      index < hostRows.length && index < HOST_AUTO_CAPACITY;
      index += 1
    ) {
      profile.hosts[hostRows[index].hostname] = hostRows[index].health;
    }
    return profile;
  }

  function sanitizeHostAutoState(value, now) {
    var state = createEmptyHostAutoState();
    var profileRows = [];
    var keys;
    var index;
    var profileName;
    var profile;
    var lock;

    if (
      !isObject(value) ||
      Array.isArray(value) ||
      value.version !== HOST_AUTO_STATE_VERSION
    ) {
      return state;
    }
    state.resetToken = normalizeResetToken(value.resetToken);
    if (isObject(value.profiles) && !Array.isArray(value.profiles)) {
      keys = Object.keys(value.profiles);
      for (index = 0; index < keys.length; index += 1) {
        profileName = normalizeNetworkProfile(keys[index]);
        if (profileName !== keys[index]) {
          continue;
        }
        profile = sanitizeHostProfile(value.profiles[keys[index]]);
        profileRows.push({ name: profileName, profile: profile });
      }
    }
    profileRows.sort(function (left, right) {
      return Math.max(right.profile.lastRunAt, right.profile.selectedAt) -
        Math.max(left.profile.lastRunAt, left.profile.selectedAt);
    });
    for (
      index = 0;
      index < profileRows.length && index < HOST_PROFILE_CAPACITY;
      index += 1
    ) {
      state.profiles[profileRows[index].name] = profileRows[index].profile;
    }
    lock = value.lock;
    if (
      isObject(lock) &&
      !Array.isArray(lock) &&
      typeof lock.token === "string" &&
      /^[a-z0-9_-]{1,64}$/i.test(lock.token) &&
      boundedNumber(lock.expiresAt, 0, 0, 9e15) > boundedNumber(now, 0, 0, 9e15)
    ) {
      state.lock = {
        createdAt: boundedNumber(lock.createdAt, 0, 0, 9e15),
        expiresAt: boundedNumber(lock.expiresAt, 0, 0, 9e15),
        token: lock.token
      };
    }
    return state;
  }

  function loadHostAutoState(services) {
    var raw;
    var parsed;
    var now =
      services && typeof services.now === "function" ? services.now() : 0;
    try {
      raw = services && typeof services.read === "function"
        ? services.read(HOST_AUTO_STATE_KEY)
        : null;
      parsed = raw ? JSON.parse(raw) : null;
    } catch (error) {
      parsed = null;
    }
    return sanitizeHostAutoState(parsed, now);
  }

  function saveHostAutoState(services, state, now) {
    try {
      return Boolean(
        services &&
        typeof services.write === "function" &&
        services.write(
          JSON.stringify(sanitizeHostAutoState(state, now)),
          HOST_AUTO_STATE_KEY
        )
      );
    } catch (error) {
      return false;
    }
  }

  function ensureHostProfile(state, networkProfile) {
    var profileName = normalizeNetworkProfile(networkProfile);
    var profile;
    var rows;
    var index;
    if (!isObject(state.profiles) || Array.isArray(state.profiles)) {
      state.profiles = {};
    }
    profile = state.profiles[profileName];
    if (!profile) {
      profile = sanitizeHostProfile(null);
      state.profiles[profileName] = profile;
    }
    rows = Object.keys(state.profiles);
    if (rows.length > HOST_PROFILE_CAPACITY) {
      rows.sort(function (left, right) {
        var leftProfile = state.profiles[left];
        var rightProfile = state.profiles[right];
        return Math.max(rightProfile.lastRunAt, rightProfile.selectedAt) -
          Math.max(leftProfile.lastRunAt, leftProfile.selectedAt);
      });
      for (index = HOST_PROFILE_CAPACITY; index < rows.length; index += 1) {
        if (rows[index] !== profileName) {
          delete state.profiles[rows[index]];
        }
      }
    }
    return profile;
  }

  function recordHostSample(
    state,
    networkProfile,
    hostname,
    value,
    now
  ) {
    var profile;
    var health;
    var sample;
    var recentFailures = 0;
    var index;
    hostname = String(hostname || "").toLowerCase();
    if (
      !isObject(state) ||
      state.version !== HOST_AUTO_STATE_VERSION ||
      !isValidHostname(hostname) ||
      !isBilibiliMediaHost(hostname)
    ) {
      return null;
    }
    sample = sanitizeHostBenchmarkSample(value);
    if (!sample) {
      return null;
    }
    if (!sample.at) {
      sample.at = boundedNumber(now, 0, 0, 9e15);
    }
    profile = ensureHostProfile(state, networkProfile);
    health = sanitizeHostAutoHealth(profile.hosts[hostname]);
    var bucket = health.buckets[sample.bucket];
    bucket.samples.push(sample);
    if (bucket.samples.length > HOST_SAMPLE_CAPACITY) {
      bucket.samples = bucket.samples.slice(-HOST_SAMPLE_CAPACITY);
    }
    health.lastUsedAt = sample.at;
    if (sample.ok) {
      health.failureStreak = 0;
      health.lastSuccessAt = sample.at;
      bucket.lastSuccessAt = sample.at;
      health.openUntil = 0;
      if (
        sample.objectId &&
        (sample.phase === "sustained" || sample.phase === "combined") &&
        bucket.objects.indexOf(sample.objectId) === -1
      ) {
        bucket.objects.push(sample.objectId);
        if (bucket.objects.length > HOST_OBJECT_CAPACITY) {
          bucket.objects = bucket.objects.slice(-HOST_OBJECT_CAPACITY);
        }
      }
    } else {
      health.failureStreak = Math.min(
        HOST_SAMPLE_CAPACITY,
        health.failureStreak + 1
      );
      health.lastFailureAt = sample.at;
      for (
        index = Math.max(0, bucket.samples.length - 4);
        index < bucket.samples.length;
        index += 1
      ) {
        if (!bucket.samples[index].ok) {
          recentFailures += 1;
        }
      }
      if (health.failureStreak >= 2 || recentFailures >= 2) {
        health.openUntil = Math.max(
          health.openUntil,
          sample.at + HOST_CIRCUIT_OPEN_MS
        );
      }
    }
    bucket.metrics = summarizeHostSamples(bucket.samples);
    health.buckets[sample.bucket] = bucket;
    health.samples = health.buckets["normal-video"].samples;
    health.objects = health.buckets["normal-video"].objects;
    health.metrics = health.buckets["normal-video"].metrics;
    profile.hosts[hostname] = health;
    return health;
  }

  function hostBucketHealth(health, descriptor, now) {
    var name = mediaBucketForDescriptor(descriptor);
    var bucket = health && health.buckets ? health.buckets[name] : null;
    var samples;
    var metrics;
    if (!bucket || !Number.isFinite(now) || !Array.isArray(bucket.samples)) {
      return bucket;
    }
    samples = bucket.samples.filter(function (sample) {
      return sample.at > 0 && sample.at <= now && sample.at + HOST_ALIAS_FRESH_MS >= now;
    });
    if (samples.length === bucket.samples.length) {
      return bucket;
    }
    metrics = summarizeHostSamples(samples);
    return { samples: samples, metrics: metrics, lastSuccessAt: metrics.lastSuccessAt };
  }

  function requiredHostThroughputKbps(descriptor) {
    var bucket = mediaBucketForDescriptor(descriptor);
    var representation = Math.ceil(
      Math.max(0, descriptor && descriptor.requiredKbps || 0) *
        HOST_REPRESENTATION_HEADROOM
    );
    if (bucket === "audio") {
      return Math.max(512, representation);
    }
    if (bucket === "high-bitrate-video") {
      return Math.max(HOST_MIN_THROUGHPUT_KBPS, representation);
    }
    return Math.max(3000, representation);
  }

  function stableHostScore(health, descriptor, now) {
    var bucket = hostBucketHealth(health, descriptor, now);
    var metrics = bucket && bucket.metrics;
    var required = requiredHostThroughputKbps(descriptor);
    var startupMargin;
    var sustainedMargin;
    var latencyScore;
    var rawScore;
    if (!metrics) {
      return -1;
    }
    startupMargin = Math.min(
      3,
      (metrics.p25StartupThroughputKbps || 0) / Math.max(1, required)
    );
    sustainedMargin = Math.min(
      3,
      (metrics.p25SustainedThroughputKbps || 0) / Math.max(1, required)
    );
    latencyScore = 1000 / (100 + Math.max(1, metrics.medianStartupTtfbMs || 60000));
    rawScore =
      latencyScore * 5.5 +
      (startupMargin / 3) * 20 +
      (sustainedMargin / 3) * 25;
    return rawScore *
      Math.max(0, 1 - (metrics.failureRate || 0)) /
      Math.max(1, 1 + (metrics.jitterRatio || 0));
  }

  function hostEligibleForDescriptor(health, descriptor, now) {
    var bucket = hostBucketHealth(health, descriptor, now);
    var metrics = bucket && bucket.metrics;
    var required = requiredHostThroughputKbps(descriptor);
    return Boolean(
      health &&
      bucket &&
      metrics &&
      health.openUntil <= now &&
      bucket.lastSuccessAt > 0 &&
      bucket.lastSuccessAt + HOST_ALIAS_FRESH_MS >= now &&
      metrics.objectCount >= HOST_MIN_OBJECTS &&
      metrics.startupObjectCount >= HOST_MIN_OBJECTS &&
      metrics.sustainedObjectCount >= HOST_MIN_OBJECTS &&
      metrics.startupSuccessCount >= HOST_MIN_OBJECTS &&
      metrics.sustainedSuccessCount >= HOST_MIN_OBJECTS &&
      metrics.failureRate <= HOST_MAX_FAILURE_RATE &&
      metrics.jitterRatio <= HOST_MAX_JITTER_RATIO &&
      // A 64 KiB burst includes handshake/RTT; only sustained ranges gate bitrate.
      metrics.p25SustainedThroughputKbps >= required
    );
  }

  function selectStableHost(state, config, descriptor, now) {
    var profileName = normalizeNetworkProfile(
      config && config.networkProfile
    );
    var profile =
      state && state.version === HOST_AUTO_STATE_VERSION && state.profiles
        ? state.profiles[profileName]
        : null;
    var selected;
    var keys;
    var index;
    var hostname;
    var score;
    var bestHost = "";
    var bestScore = -1;
    var selectedScore = -1;
    var selectedEligible = false;
    var threshold;
    if (!profile) {
      return "";
    }
    if (
      profile.lastRunAt > 0 &&
      profile.lastRunAt + HOST_STATE_STALE_MS < now
    ) {
      return "";
    }
    selected = String(profile.selectedHost || "").toLowerCase();
    if (descriptor && descriptor.primaryUrl) {
      selected = parseHttpUrl(descriptor.primaryUrl).hostname;
    }
    selectedEligible = Boolean(
      isBilibiliMediaHost(selected) &&
      hostUsableForDescriptor(selected, descriptor) &&
      hostEligibleForDescriptor(profile.hosts[selected], descriptor, now)
    );
    if (selectedEligible) {
      selectedScore = stableHostScore(profile.hosts[selected], descriptor, now);
    }
    keys = Object.keys(profile.hosts || {});
    for (index = 0; index < keys.length; index += 1) {
      hostname = keys[index];
      if (
        !isBilibiliMediaHost(hostname) ||
        !hostUsableForDescriptor(hostname, descriptor) ||
        !hostEligibleForDescriptor(profile.hosts[hostname], descriptor, now)
      ) {
        continue;
      }
      score = stableHostScore(profile.hosts[hostname], descriptor, now);
      if (score > bestScore) {
        bestScore = score;
        bestHost = hostname;
      }
    }
    if (!selectedEligible) {
      return bestHost;
    }
    if (!bestHost || bestHost === selected) {
      return selected;
    }
    threshold = boundedNumber(
      config && config.switchThreshold,
      DEFAULT_SWITCH_THRESHOLD,
      RUNTIME_OPTION_LIMITS.switchThreshold.minimum,
      RUNTIME_OPTION_LIMITS.switchThreshold.maximum
    );
    if (bestScore >= selectedScore * (1 + threshold / 100)) {
      return bestHost;
    }
    return selected;
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
      objectLength: 0,
      pendingCandidateId: null,
      pendingSince: 0,
      pendingSuccesses: 0,
      sampleCursor: 0,
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
    entry.objectLength = boundedNumber(
      value.objectLength,
      0,
      0,
      Number.MAX_SAFE_INTEGER
    );
    entry.pendingSince = boundedNumber(value.pendingSince, 0, 0, 9e15);
    entry.pendingSuccesses = boundedInteger(
      value.pendingSuccesses,
      0,
      0,
      2
    );
    entry.sampleCursor = boundedInteger(
      value.sampleCursor,
      0,
      0,
      1000000
    );
    entry.scores = sanitizeScoreMap(value.scores);
    entry.selectedAt = boundedNumber(value.selectedAt, 0, 0, 9e15);
    entry.successCount = boundedInteger(value.successCount, 0, 0, 1000000);
    entry.validatedAt = boundedNumber(value.validatedAt, 0, 0, 9e15);
    return entry;
  }

  function sanitizeHostHealth(value) {
    var health = {
      failureStreak: 0,
      lastFailureAt: 0,
      lastSuccessAt: 0,
      lastUsedAt: 0,
      metrics: summarizeProbeSamples([]),
      openUntil: 0,
      samples: [],
      slowStreak: 0
    };
    var samples = [];
    var index;
    var sample;

    if (!isObject(value) || Array.isArray(value)) {
      return health;
    }
    if (Array.isArray(value.samples)) {
      for (
        index = Math.max(
          0,
          value.samples.length - AUTO_HOST_SCORE_SAMPLE_LIMIT
        );
        index < value.samples.length;
        index += 1
      ) {
        sample = sanitizeProbeSample(value.samples[index]);
        if (sample) {
          samples.push(sample);
        }
      }
    }
    health.failureStreak = boundedInteger(
      value.failureStreak,
      0,
      0,
      16
    );
    health.lastFailureAt = boundedNumber(
      value.lastFailureAt,
      0,
      0,
      9e15
    );
    health.lastSuccessAt = boundedNumber(
      value.lastSuccessAt,
      0,
      0,
      9e15
    );
    health.lastUsedAt = boundedNumber(value.lastUsedAt, 0, 0, 9e15);
    health.openUntil = boundedNumber(value.openUntil, 0, 0, 9e15);
    health.samples = samples;
    health.metrics = summarizeProbeSamples(samples);
    health.slowStreak = boundedInteger(value.slowStreak, 0, 0, 2);
    return health;
  }

  function sanitizeHostMap(value) {
    var output = {};
    var keys;
    var index;
    var key;
    if (!isObject(value) || Array.isArray(value)) {
      return output;
    }
    keys = Object.keys(value).slice(0, AUTO_HOST_CAPACITY * 2);
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      if (/^c2_[0-9a-f]{32}$/.test(key)) {
        output[key] = sanitizeHostHealth(value[key]);
      }
    }
    return output;
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
    if (!isObject(parsed) || parsed.version !== 7) {
      return state;
    }

    state.lastProbeAt = boundedNumber(parsed.lastProbeAt, 0, 0, 9e15);
    state.resetToken = normalizeResetToken(parsed.resetToken);
    state.hosts = sanitizeHostMap(parsed.hosts);
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
    var hostKeys = Object.keys(state.hosts || {});
    var lockKeys = Object.keys(state.locks);
    var removeCount;
    var index;

    for (index = 0; index < lockKeys.length; index += 1) {
      if (state.locks[lockKeys[index]] <= now) {
        delete state.locks[lockKeys[index]];
        delete state.lockTokens[lockKeys[index]];
      }
    }
    if (hostKeys.length > AUTO_HOST_CAPACITY) {
      hostKeys.sort(function (left, right) {
        return (
          (state.hosts[left].lastUsedAt || 0) -
          (state.hosts[right].lastUsedAt || 0)
        );
      });
      removeCount = hostKeys.length - AUTO_HOST_CAPACITY;
      for (index = 0; index < removeCount; index += 1) {
        delete state.hosts[hostKeys[index]];
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
    entry.objectLength = 0;
    entry.pendingCandidateId = null;
    entry.pendingSince = 0;
    entry.pendingSuccesses = 0;
    entry.sampleCursor = 0;
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
        entry.nextProbeAt <= now ||
        (
          entry.candidateId &&
          (
            isHostCircuitOpen(state, entry.candidateId, now) ||
            entry.validatedAt + AUTO_SELECTED_REVALIDATE_MS <= now
          )
        )
      ) {
        return descriptor;
      }
    }
    return null;
  }

  function hostPreferenceScore(state, candidateId) {
    var health =
      state && state.hosts
        ? state.hosts[candidateId]
        : null;
    var metrics = health && health.metrics;
    if (!metrics || metrics.successCount < 2) {
      return -1;
    }
    return (
      (metrics.medianThroughputKbps || 0) *
      Math.max(0, 1 - (metrics.failureRate || 0)) /
      Math.max(1, 1 + (metrics.jitterMs || 0) / 100)
    );
  }

  function chooseAlternativeCandidate(descriptor, entry, state, now) {
    var backupCandidates = descriptor.candidates.slice(1);
    var eligible = [];
    var preferred = null;
    var preferredScore = -1;
    var score;
    var index;

    if (entry.candidateId) {
      for (index = 0; index < backupCandidates.length; index += 1) {
        if (
          backupCandidates[index].id === entry.candidateId &&
          !isHostCircuitOpen(state, backupCandidates[index].id, now)
        ) {
          return backupCandidates[index];
        }
      }
    }
    if (entry.pendingCandidateId) {
      for (index = 0; index < backupCandidates.length; index += 1) {
        if (
          backupCandidates[index].id === entry.pendingCandidateId &&
          !isHostCircuitOpen(state, backupCandidates[index].id, now)
        ) {
          return backupCandidates[index];
        }
      }
    }
    for (index = 0; index < backupCandidates.length; index += 1) {
      if (!isHostCircuitOpen(state, backupCandidates[index].id, now)) {
        eligible.push(backupCandidates[index]);
        score = hostPreferenceScore(state, backupCandidates[index].id);
        if (score > preferredScore) {
          preferredScore = score;
          preferred = backupCandidates[index];
        }
      }
    }
    if (preferred) {
      return preferred;
    }
    return eligible.length > 0
      ? eligible[entry.candidateCursor % eligible.length]
      : null;
  }

  function probeRangeForEntry(entry) {
    var deepSample = Boolean(
      entry &&
      (
        entry.candidateId ||
        (
          entry.pendingCandidateId &&
          entry.pendingSuccesses >= 1
        )
      )
    );
    var sampleEnd = deepSample
      ? AUTO_RANGE_END
      : AUTO_EXPLORE_RANGE_END;
    var sampleLength = sampleEnd + 1;
    var totalLength = boundedInteger(
      entry && entry.objectLength,
      0,
      0,
      Number.MAX_SAFE_INTEGER
    );
    var maximumStart;
    var fraction;
    var start = 0;
    var end;

    if (
      deepSample &&
      totalLength > sampleLength + AUTO_SAMPLE_ALIGNMENT
    ) {
      maximumStart = totalLength - sampleLength;
      fraction = AUTO_INTERIOR_SAMPLE_FRACTIONS[
        (entry.sampleCursor || 0) %
          AUTO_INTERIOR_SAMPLE_FRACTIONS.length
      ];
      start = Math.floor(
        (maximumStart * fraction) / AUTO_SAMPLE_ALIGNMENT
      ) * AUTO_SAMPLE_ALIGNMENT;
      start = Math.max(
        AUTO_SAMPLE_ALIGNMENT,
        Math.min(start, maximumStart)
      );
    }
    end = start + sampleLength - 1;
    if (totalLength > 0) {
      end = Math.min(end, totalLength - 1);
    }
    return {
      end: end,
      phase: deepSample ? "confirm" : "explore",
      start: start
    };
  }

  function candidateWithProbeRange(candidate, range) {
    return {
      id: candidate.id,
      probeRange: range,
      url: candidate.url
    };
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

  function removeLengthDelimitedProtoFields(input, fieldNumbers) {
    var bytes = toUint8Array(input);
    var fields = parseProtoFields(bytes);
    var chunks = [];
    var changed = 0;
    var index;
    var field;
    if (!bytes || !fields) {
      return { bytes: bytes || input, changed: 0, valid: false };
    }
    for (index = 0; index < fields.length; index += 1) {
      field = fields[index];
      if (
        field.wireType === 2 &&
        fieldNumbers.indexOf(field.fieldNumber) !== -1
      ) {
        changed += 1;
        continue;
      }
      chunks.push(bytes.subarray(field.rawStart, field.end));
    }
    return {
      bytes: changed > 0 ? concatBytes(chunks) : bytes,
      changed: changed,
      valid: true
    };
  }

  function stripPlayerPromotionPayload(input, config) {
    var bytes = toUint8Array(input);
    var fields = parseProtoFields(bytes);
    var chunks = [];
    var changed = 0;
    var index;
    var field;
    var nested;
    if (
      !bytes ||
      !fields ||
      !config ||
      config.ads !== true ||
      config.grpcAdapter !== "playerunite-v1"
    ) {
      return {
        bytes: bytes || input,
        changed: 0,
        valid: Boolean(bytes && fields)
      };
    }
    for (index = 0; index < fields.length; index += 1) {
      field = fields[index];
      if (field.fieldNumber !== 9 || field.wireType !== 2) {
        chunks.push(bytes.subarray(field.rawStart, field.end));
        continue;
      }
      nested = removeLengthDelimitedProtoFields(field.payload, [1, 2, 3]);
      if (!nested.valid) {
        return { bytes: bytes, changed: 0, valid: false };
      }
      if (nested.changed === 0) {
        chunks.push(bytes.subarray(field.rawStart, field.end));
        continue;
      }
      changed += nested.changed;
      if (nested.bytes.length === 0) {
        changed += 1;
        continue;
      }
      chunks.push(bytes.subarray(field.rawStart, field.tagEnd));
      chunks.push(encodeVarint(nested.bytes.length));
      chunks.push(nested.bytes);
    }
    return {
      bytes: changed > 0 ? concatBytes(chunks) : bytes,
      changed: changed,
      valid: true
    };
  }

  function stripPlayerPromotionsFromGrpcBody(input, config) {
    var bytes = toUint8Array(input);
    var offset = 0;
    var chunks = [];
    var changed = 0;
    var frames = 0;
    var flag;
    var length;
    var frameEnd;
    var transformed;
    var raw;
    if (!bytes) {
      return { body: input, changed: 0, valid: false };
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
      transformed = flag === 0
        ? stripPlayerPromotionPayload(
            bytes.subarray(offset + 5, frameEnd),
            config
          )
        : {
            bytes: bytes.subarray(offset + 5, frameEnd),
            changed: 0,
            valid: true
          };
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
    raw = stripPlayerPromotionPayload(bytes, config);
    return {
      body: raw.changed > 0 ? raw.bytes : bytes,
      changed: raw.changed,
      valid: raw.valid
    };
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
    var bandwidth = 0;
    var stableMetadata = "";
    var descriptor;

    primaryUrls = protoUrlsForField(fields, 1);
    backupUrls = protoUrlsForField(fields, 2);
    if (primaryUrls.length === 1 && backupUrls.length > 0) {
      primaryField = 1;
      backupField = 2;
      kind = "video";
      bandwidth = firstProtoVarint(fields, 3) || 0;
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
        bandwidth = firstProtoVarint(fields, 4) || 0;
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
      stableMetadata,
      bandwidth
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

  function validateProbeResponse(result, expectedUrl, expectedRange) {
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
    var requestedStart = boundedInteger(
      expectedRange && expectedRange.start,
      0,
      0,
      Number.MAX_SAFE_INTEGER
    );
    var requestedEnd = boundedInteger(
      expectedRange && expectedRange.end,
      AUTO_RANGE_END,
      requestedStart,
      Number.MAX_SAFE_INTEGER
    );
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
      rangeStart !== requestedStart ||
      !Number.isSafeInteger(rangeEnd) ||
      !Number.isSafeInteger(totalLength) ||
      rangeEnd < rangeStart ||
      rangeEnd > requestedEnd ||
      totalLength <= rangeEnd
    ) {
      return { ok: false, reason: "range-size", status: status };
    }
    if (
      rangeEnd < requestedEnd &&
      totalLength !== rangeEnd + 1
    ) {
      return { ok: false, reason: "range-truncated", status: status };
    }
    expectedLength = rangeEnd - rangeStart + 1;
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
    var validation = validateProbeResponse(
      result || {},
      candidate.url,
      candidate.probeRange
    );
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

  function hostBackoffMs(failureStreak) {
    return Math.min(
      AUTO_HOST_BACKOFF_MAX_MS,
      AUTO_HOST_BACKOFF_BASE_MS *
        Math.pow(2, Math.max(0, Math.min(3, failureStreak - 1)))
    );
  }

  function recordHostProbe(state, result, descriptor, now, verdict) {
    var health;
    var samples;
    var sufficient;
    if (
      !state ||
      !result ||
      !/^c2_[0-9a-f]{32}$/.test(result.candidateId || "") ||
      verdict === "neutral"
    ) {
      return;
    }
    if (!isObject(state.hosts) || Array.isArray(state.hosts)) {
      state.hosts = {};
    }
    health = sanitizeHostHealth(state.hosts[result.candidateId]);
    samples = health.samples.slice();
    samples.push({
      at: now,
      elapsedMs: result.elapsedMs,
      ok: verdict === "verified",
      reason:
        verdict === "mismatch"
          ? "object-mismatch"
          : result.reason,
      status: result.status,
      throughputKbps: result.throughputKbps || 0
    });
    if (samples.length > AUTO_HOST_SCORE_SAMPLE_LIMIT) {
      samples = samples.slice(-AUTO_HOST_SCORE_SAMPLE_LIMIT);
    }
    health.samples = samples;
    health.metrics = summarizeProbeSamples(samples);
    health.lastUsedAt = now;

    if (verdict !== "verified") {
      health.failureStreak = Math.min(16, health.failureStreak + 1);
      health.slowStreak = 0;
      health.lastFailureAt = now;
      health.openUntil = Math.max(
        health.openUntil,
        now + hostBackoffMs(health.failureStreak)
      );
      state.hosts[result.candidateId] = health;
      return;
    }

    health.lastSuccessAt = now;
    health.failureStreak = 0;
    sufficient =
      (result.throughputKbps || 0) >=
      Math.max(1, descriptor.requiredKbps || 0);
    if (sufficient) {
      health.slowStreak = 0;
      health.openUntil = 0;
    } else {
      health.slowStreak = Math.min(2, health.slowStreak + 1);
      if (health.slowStreak >= 2) {
        health.lastFailureAt = now;
        health.openUntil = Math.max(
          health.openUntil,
          now + AUTO_HOST_BACKOFF_BASE_MS
        );
      }
    }
    state.hosts[result.candidateId] = health;
  }

  function alternativeQualifies(
    primaryResult,
    alternativeResult,
    config,
    entry,
    descriptor
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
    if (
      descriptor &&
      (alternativeResult.throughputKbps || 0) <
        Math.max(1, descriptor.requiredKbps || 0)
    ) {
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

  function applyHostResetToken(services, state, config, now) {
    var token = normalizeResetToken(config && config.resetToken);
    var reset;
    if (!token || state.resetToken === token) {
      return state;
    }
    reset = createEmptyHostAutoState();
    reset.resetToken = token;
    if (hasStateServices(services)) {
      saveHostAutoState(services, reset, now);
    }
    return reset;
  }

  function playbackActivityAt(services, profile, now) {
    try {
      var raw = services && typeof services.read === "function" ? services.read(PLAYBACK_ACTIVITY_KEY) : null;
      var activity = raw && raw.length <= 256 ? JSON.parse(raw) : null;
      return activity && activity.profile === profile && Number.isFinite(activity.at) &&
        activity.at > 0 && activity.at <= now ? activity.at : 0;
    } catch (error) {
      return 0;
    }
  }

  function playbackRecentlyActive(services, profile, now) {
    var at = playbackActivityAt(services, profile, now);
    return at > 0 && now - at < PLAYBACK_PROBE_PAUSE_MS;
  }

  function markPlaybackActivity(services, profile, now) {
    var previous = playbackActivityAt(services, profile, now);
    if (!hasStateServices(services) || (previous > 0 && now - previous < 30000)) {
      return;
    }
    try {
      services.write(JSON.stringify({ at: now, profile: profile }), PLAYBACK_ACTIVITY_KEY);
    } catch (error) {
      // Activity recording is optional and never holds a playback response.
    }
  }

  function processHostAutoResponse(
    input,
    binary,
    config,
    services,
    callback
  ) {
    var original = input;
    var now =
      services && typeof services.now === "function"
        ? services.now()
        : Date.now();
    var state = hasStateServices(services)
      ? loadHostAutoState(services)
      : createEmptyHostAutoState();
    var hotConfig = {};
    var keys;
    var index;
    var prepared;
    var reason = "server-primary";
    var families = {};
    var candidateCount = 0;
    var routesStored = 0;

    if (typeof callback !== "function") {
      return;
    }
    if (!config || !config.valid || !config.auto) {
      callback({
        body: original,
        candidateCount: 0,
        candidateFamilies: "none",
        changed: 0,
        descriptors: 0,
        probed: false,
        probeCount: 0,
        probeSummary: "none",
        reason: "invalid-config",
        routesStored: 0,
        scriptElapsedMs: 0,
        valid: Boolean(config && config.valid)
      });
      return;
    }
    state = applyHostResetToken(services, state, config, now);
    keys = Object.keys(config);
    for (index = 0; index < keys.length; index += 1) {
      hotConfig[keys[index]] = config[keys[index]];
    }
    hotConfig.hostAutoState = state;
    hotConfig.networkProfile = resolveRuntimeNetworkProfile(
      config.networkProfile,
      services
    );
    prepared = binary
      ? prepareSafeGrpc(input, hotConfig, createEmptyAutoState(), now)
      : prepareSafeJson(
          typeof input === "string" ? input : "",
          hotConfig,
          createEmptyAutoState(),
          now
        );
    if (!prepared.valid) {
      callback({
        body: original,
        candidateCount: 0,
        candidateFamilies: "none",
        changed: 0,
        descriptors: 0,
        probed: false,
        probeCount: 0,
        probeSummary: "none",
        reason: "unsupported-response",
        routesStored: 0,
        scriptElapsedMs: Math.max(0, (
          services && typeof services.now === "function"
            ? services.now()
            : now
        ) - now),
        valid: false
      });
      return;
    }
    for (index = 0; index < prepared.descriptors.length; index += 1) {
      candidateCount += prepared.descriptors[index].candidates.length;
      families[prepared.descriptors[index].family] = true;
      if (/^host-state/.test(prepared.descriptors[index].selectionSource || "")) {
        reason = "host-auto-selected";
      }
    }
    // Never route media requests from a saved URL. Player fallback/Range requests
    // must remain independent, including when a recent background winner stalls.
    if (prepared.descriptors.length > 0) {
      markPlaybackActivity(services, hotConfig.networkProfile, now);
    }
    callback({
      body: prepared.body,
      candidateCount: candidateCount,
      candidateFamilies: Object.keys(families).join(",") || "none",
      changed: prepared.changed,
      descriptors: prepared.descriptors.length,
      probed: false,
      probeCount: 0,
      probeSummary: "none",
      reason: reason,
      routesStored: routesStored,
      scriptElapsedMs: Math.max(0, (
        services && typeof services.now === "function"
          ? services.now()
          : now
      ) - now),
      valid: true
    });
  }

  function nextSelectedProbeAt(now, expiresAt) {
    return Math.min(
      expiresAt,
      now + AUTO_SELECTED_REVALIDATE_MS
    );
  }

  function updateEntryAfterProbe(
    state,
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
    recordHostProbe(
      state,
      alternativeResult,
      descriptor,
      now,
      !alternativeResult.ok
        ? "failure"
        : (
            !primaryResult.ok
              ? "neutral"
              : (equivalent ? "verified" : "mismatch")
          )
    );
    if (equivalent) {
      entry.objectLength = primaryResult.totalLength;
      if (
        primaryResult.rangeStart > 0 ||
        primaryResult.bodyLength > AUTO_EXPLORE_RANGE_END + 1
      ) {
        entry.sampleCursor += 1;
      }
    }
    qualifies =
      equivalent &&
      alternativeQualifies(
        primaryResult,
        alternativeResult,
        config,
        entry,
        descriptor
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
    var probeRange;
    var primaryCandidate;
    var alternativeCandidate;
    var results = {};
    var finished = false;
    var callbackDelivered = false;
    var claimedLockUntil = 0;
    var claimedLockToken = "";

    if (
      config &&
      config.auto &&
      config.valid &&
      config.probeMode !== "blocking"
    ) {
      processHostAutoResponse(
        input,
        binary,
        config,
        services,
        callback
      );
      return;
    }

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
              String((item.probeRange && item.probeRange.phase) || "unknown") +
              ":" +
              String((item.probeRange && item.probeRange.start) || 0) +
              "-" +
              String((item.probeRange && item.probeRange.end) || 0) +
              "/" +
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
    alternativeCandidate = chooseAlternativeCandidate(
      descriptor,
      entry,
      state,
      now
    );
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
    probeRange = probeRangeForEntry(entry);
    primaryCandidate = candidateWithProbeRange(
      descriptor.candidates[0],
      probeRange
    );
    alternativeCandidate = candidateWithProbeRange(
      alternativeCandidate,
      probeRange
    );

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
        latestState,
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
      networkInfo: function () {
        var network = typeof $network !== "undefined" ? $network : null;
        var wifi;
        var cellular;
        if (!network || typeof network !== "object") {
          return null;
        }
        wifi = network.wifi;
        if (wifi && typeof wifi === "object") {
          return {
            identifier: String(wifi.ssid || wifi.bssid || ""),
            type: "wifi"
          };
        }
        cellular = network.cellular;
        if (cellular && typeof cellular === "object") {
          return {
            identifier: String(
              cellular.carrier || cellular.radio || cellular.network || ""
            ),
            type: "cellular"
          };
        }
        return null;
      },
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
        var rangeStart = boundedInteger(
          candidate && candidate.probeRange && candidate.probeRange.start,
          0,
          0,
          Number.MAX_SAFE_INTEGER
        );
        var rangeEnd = boundedInteger(
          candidate && candidate.probeRange && candidate.probeRange.end,
          AUTO_RANGE_END,
          rangeStart,
          Number.MAX_SAFE_INTEGER
        );
        var request = {
          "auto-redirect": false,
          "binary-mode": true,
          headers: {
            "Accept-Encoding": "identity",
            Range: "bytes=" + rangeStart + "-" + rangeEnd,
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

  function normalizePlayerPromotionHeaders(bodyChanged) {
    var responseHeaders =
      typeof $response !== "undefined" && $response
        ? $response.headers
        : null;
    var requestHeaders =
      typeof $request !== "undefined" && $request
        ? $request.headers
        : null;
    var output = {};
    var keys = isObject(responseHeaders) ? Object.keys(responseHeaders) : [];
    var index;
    var key;
    var contentType = headerValue(responseHeaders, "content-type");
    var userAgent = headerValue(requestHeaders, "user-agent").toLowerCase();
    var mossEngine = headerValue(requestHeaders, "x-bili-moss-engine-type");
    var grpcStatus = headerValue(responseHeaders, "grpc-status");
    var trailerStatus = headerValue(
      typeof $response !== "undefined" && $response ? $response.h2_trailers : null,
      "grpc-status"
    );
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      if (
        !/^(?:age|cache-control|content-length|content-type|etag|expires|last-modified|pragma)$/i.test(
          key
        ) &&
        !(
          bodyChanged &&
          /^(?:grpc-encoding|content-encoding)$/i.test(key)
        )
      ) {
        output[key] = responseHeaders[key];
      }
    }
    output["Content-Type"] = /^application\/grpc(?:\+proto)?(?:;|$)/i.test(
      contentType
    )
      ? contentType
      : "application/grpc";
    output["Cache-Control"] = "no-store, no-cache, must-revalidate";
    output.Pragma = "no-cache";
    output.Expires = "0";
    if ((!grpcStatus || grpcStatus === "0") && !trailerStatus && !shadowrocketGrpcError()) {
      if (/bili-inter\//i.test(userAgent) && !/bili-inter\/(?:[6-9]|\d{2,})\.\d+/i.test(userAgent)) {
        for (index = 0; index < keys.length; index += 1) {
          if (keys[index].toLowerCase() === "grpc-status") {
            delete output[keys[index]];
          }
        }
      } else if (mossEngine === "1" || /bili-blue\//i.test(userAgent)) {
        for (index = 0; index < keys.length; index += 1) {
          if (keys[index].toLowerCase() === "grpc-status") {
            delete output[keys[index]];
          }
        }
        output["grpc-status"] = "0";
      }
    }
    return output;
  }

  function completeShadowrocketResponse(config, body, changed) {
    var completion = {};
    if (changed > 0) {
      completion.body = body;
    }
    if (config && config.playerPromotionGuarded === true) {
      completion.headers = normalizePlayerPromotionHeaders(changed > 0);
      if (typeof $response !== "undefined" && $response && $response.h2_trailers !== undefined) {
        completion.h2_trailers = $response.h2_trailers;
      }
      if (config.debug) {
        safeLog("runtime=" + (root.__BILIFLOW_VERSION__ || "source") +
          " handler=player-unite-ui transport=grpc changed=" + (config.playerPromotionChanges || 0) +
          " writeBack=" + (changed > 0 ? "body" : "headers-only") +
          " grpcStatusOut=" + (headerValue(completion.headers, "grpc-status") || "none") +
          " gzipCodec=" + (gzipCodec ? "bundled" : "host"));
      }
    }
    $done(completion);
  }

  function finishManualShadowrocketResponse(
    config,
    body,
    binary,
    baseChanges
  ) {
    var result;

    try {
      if (!config.cdnHost) {
        if (config.debug) {
          safeLog("fixed CDN rewrite disabled");
        }
        completeShadowrocketResponse(config, body, baseChanges);
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
        completeShadowrocketResponse(
          config,
          result.body,
          baseChanges + result.changed
        );
      } else {
        if (config.debug && !result.valid) {
          safeLog("unsupported response; left unchanged");
        }
        completeShadowrocketResponse(config, body, baseChanges);
      }
    } catch (error) {
      safeLog(
        "fixed mode error; response left unchanged: " +
          (error && error.message ? error.message : String(error))
      );
      completeShadowrocketResponse(config, body, baseChanges);
    }
  }

  function finishAutoShadowrocketResponse(
    config,
    body,
    binary,
    services,
    baseChanges
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
                ", routes=" +
                (result.routesStored || 0) +
                ", probe_summary=" +
                (result.probeSummary || "none") +
                ", elapsed_ms=" +
                (result.scriptElapsedMs || 0)
            );
          }
          if (result.valid && result.changed > 0) {
            completeShadowrocketResponse(
              config,
              result.body,
              baseChanges + result.changed
            );
          } else {
            completeShadowrocketResponse(config, body, baseChanges);
          }
        } catch (error) {
          safeLog(
            "safe auto callback error; response left unchanged: " +
              (error && error.message
                ? error.message
                : String(error))
          );
          completeShadowrocketResponse(config, body, baseChanges);
        }
      }
    );
  }

  function processShadowrocketBody(config, body, binary) {
    var working = body;
    var promotionResult;
    var baseChanges = 0;
    config.playerPromotionChanges = 0;
    config.playerPromotionGuarded = false;
    if (
      binary &&
      config.ads === true &&
      config.grpcAdapter === "playerunite-v1"
    ) {
      config.playerPromotionGuarded = true;
      promotionResult = stripPlayerPromotionsFromGrpcBody(body, config);
      if (promotionResult.valid && promotionResult.changed > 0) {
        working = promotionResult.body;
        baseChanges = promotionResult.changed;
        config.playerPromotionChanges = promotionResult.changed;
      }
    }
    if (!config.auto) {
      finishManualShadowrocketResponse(
        config,
        working,
        binary,
        baseChanges
      );
      return;
    }
    finishAutoShadowrocketResponse(
      config,
      working,
      binary,
      createShadowrocketServices(),
      baseChanges
    );
  }

  function shadowrocketGrpcError() {
    var response = typeof $response !== "undefined" && $response ? $response : {};
    var status = headerValue(response.headers, "grpc-status");
    var trailer = headerValue(response.h2_trailers, "grpc-status");
    var http = String(response.statusCode || response.status || "").match(/(?:^|\s)(\d{3})(?:\s|$)/);
    return Boolean((status && status !== "0") || (trailer && trailer !== "0") || (http && Number(http[1]) >= 400));
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
      requestUrl =
        typeof $request !== "undefined" && $request && $request.url
          ? String($request.url)
          : "";
      if (
        typeof $request !== "undefined" &&
        $request &&
        headerValue($request.headers, "x-bilicdn-background") === "1"
      ) {
        $done({});
        return;
      }
      config.grpcAdapter = classifyGrpcAdapter(requestUrl);
      grpcResponse = Boolean(config.grpcAdapter);
      config.playerPromotionGuarded = config.ads === true && config.grpcAdapter === "playerunite-v1";
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

      if (grpcResponse && shadowrocketGrpcError()) {
        if (config.debug) {
          safeLog("reason=grpc-error-response; body and error status preserved");
        }
        completeShadowrocketResponse(config, body, 0);
        return;
      }

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
            completeShadowrocketResponse(config, body, 0);
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
          completeShadowrocketResponse(config, body, 0);
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
    AUTO_EXPLORE_RANGE_END: AUTO_EXPLORE_RANGE_END,
    AUTO_HOST_BACKOFF_BASE_MS: AUTO_HOST_BACKOFF_BASE_MS,
    AUTO_HOST_CAPACITY: AUTO_HOST_CAPACITY,
    FIXED_CDN_CANDIDATES: FIXED_CDN_CANDIDATES,
    AUTO_CONFIRM_DELAY_MS: AUTO_CONFIRM_DELAY_MS,
    AUTO_GLOBAL_PROBE_GAP_MS: AUTO_GLOBAL_PROBE_GAP_MS,
    AUTO_RANGE_END: AUTO_RANGE_END,
    AUTO_SELECTED_REVALIDATE_MS: AUTO_SELECTED_REVALIDATE_MS,
    AUTO_STATE_KEY: AUTO_STATE_KEY,
    HOST_ALIAS_FRESH_MS: HOST_ALIAS_FRESH_MS,
    HOST_AUTO_STATE_KEY: HOST_AUTO_STATE_KEY,
    HOST_AUTO_STATE_VERSION: HOST_AUTO_STATE_VERSION,
    HOST_STATE_STALE_MS: HOST_STATE_STALE_MS,
    MEDIA_ROUTE_CAPACITY: MEDIA_ROUTE_CAPACITY,
    MEDIA_ROUTE_EXPIRY_SAFETY_MS: MEDIA_ROUTE_EXPIRY_SAFETY_MS,
    MEDIA_ROUTE_MAX_TTL_MS: MEDIA_ROUTE_MAX_TTL_MS,
    MEDIA_ROUTE_STATE_KEY: MEDIA_ROUTE_STATE_KEY,
    PLAYBACK_ACTIVITY_KEY: PLAYBACK_ACTIVITY_KEY,
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
    createEmptyHostAutoState: createEmptyHostAutoState,
    createEmptyMediaRouteState: createEmptyMediaRouteState,
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
    loadHostAutoState: loadHostAutoState,
    loadMediaRouteState: loadMediaRouteState,
    mediaBucketForDescriptor: mediaBucketForDescriptor,
    mediaRouteKeyForUrl: mediaRouteKeyForUrl,
    normalizeCdnHost: normalizeCdnHost,
    normalizeNetworkProfile: normalizeNetworkProfile,
    parseArgument: parseArgument,
    prepareSafeGrpc: prepareSafeGrpc,
    prepareSafeJson: prepareSafeJson,
    probeRangeForEntry: probeRangeForEntry,
    probeBodyHash: probeBodyHash,
    processSafeAutoResponse: processSafeAutoResponse,
    persistPreparedMediaRoutes: persistPreparedMediaRoutes,
    playbackRecentlyActive: playbackRecentlyActive,
    recordHostSample: recordHostSample,
    queryFreeCandidateFingerprint: queryFreeCandidateFingerprint,
    readVarint: readVarint,
    requiredThroughputKbps: requiredThroughputKbps,
    resolveRuntimeNetworkProfile: resolveRuntimeNetworkProfile,
    rewriteVodUrl: rewriteVodUrl,
    replaceVodHostname: replaceVodHostname,
    runShadowrocket: runShadowrocket,
    stableHash: stableHash,
    sanitizeHostAutoState: sanitizeHostAutoState,
    sanitizeMediaRouteState: sanitizeMediaRouteState,
    sameMediaObject: sameMediaObject,
    saveHostAutoState: saveHostAutoState,
    selectStableHost: selectStableHost,
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
