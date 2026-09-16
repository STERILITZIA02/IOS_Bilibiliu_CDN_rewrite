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
    row("grpc-playerunite-ui-guard", GRPC_HOSTS, "/bilibili.app.playerunite.v1.Player/PlayViewUnite", "grpc", "grpc-playerunite-ui-guard", ["enhance"], true, true, false),

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
    row("dynamic-web-feed", API_HOSTS, "/x/polymer/web-dynamic/v1/feed/all", "json", "dynamic-web-feed", ["enhance"], true, true, true),
    row("pgc", API_HOSTS, "\\/pgc\\/page\\/(?:bangumi|cinema\\/tab)", "json", "pgc", ["enhance"], true, true, true, true),
    row("pgc-channel", API_HOSTS, "/pgc/page/channel", "json", "pgc-channel", ["enhance"], true, true, true),
    row("web-feed", API_HOSTS, "\\/x\\/web-interface\\/(?:wbi\\/)?index\\/top\\/feed\\/rcmd", "json", "web-feed", ["enhance"], true, true, true, true),
    row("reply", API_HOSTS, "/x/v2/reply/main", "json", "reply", ["enhance"], true, true, true),
    row("vip-center", API_HOSTS, "/x/vip/web/vip_center/combine", "json", "vip-center", ["enhance"], true, true, true),
    row("pgc-activity-material", API_HOSTS, "/pgc/activity/deliver/material/receive", "json", "pgc-activity-material", ["enhance"], true, true, true),
    row("live", ["api.live.bilibili.com"], "/xlive/app-room/v1/index/getInfoByRoom", "json", "live", ["enhance"], true, true, true),
    row("live-user", ["api.live.bilibili.com"], "/xlive/app-room/v1/index/getInfoByUser", "json", "live-user", ["enhance"], true, true, true),
    row("live-feed", ["api.live.bilibili.com"], "/xlive/app-interface/v2/index/feed", "json", "live-feed", ["enhance"], true, true, true),
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
    row("grpc-view-unite-ai-relate-async", GRPC_HOSTS, "/bilibili.app.viewunite.v1.View/AIRelateAsync", "grpc", "grpc-view-unite-ai-relate-async", ["enhance"], true, true, true),
    row("grpc-mine-pub-module", GRPC_HOSTS, "/bilibili.app.mine.v1.Mine/PubModule", "grpc", "grpc-mine-pub-module", ["enhance"], true, true, true),
    row("grpc-mine-device-feature", GRPC_HOSTS, "/bilibili.app.mine.v1.Mine/DeviceFeature", "grpc", "grpc-mine-device-feature", ["enhance"], true, true, true),
    row("grpc-resource-module-list", GRPC_HOSTS, "/bilibili.app.resource.v1.Module/List", "grpc", "grpc-resource-module-list", ["enhance"], true, true, true),
    row("grpc-popular", GRPC_HOSTS, "/bilibili.app.show.v1.Popular/Index", "grpc", "grpc-popular", ["enhance"], true, true, true),
    row("grpc-dynamic", GRPC_HOSTS, "/bilibili.app.dynamic.v2.Dynamic/DynAll", "grpc", "grpc-dynamic", ["enhance"], true, true, true),
    row("grpc-dynamic-video", GRPC_HOSTS, "/bilibili.app.dynamic.v2.Dynamic/DynVideo", "grpc", "grpc-dynamic-video", ["enhance"], true, true, true),
    row("grpc-dynamic-all-personal", GRPC_HOSTS, "/bilibili.app.dynamic.v2.Dynamic/DynAllPersonal", "grpc", "grpc-dynamic-personal", ["enhance"], true, true, true),
    row("grpc-dynamic-video-personal", GRPC_HOSTS, "/bilibili.app.dynamic.v2.Dynamic/DynVideoPersonal", "grpc", "grpc-dynamic-personal", ["enhance"], true, true, true),
    row("grpc-dm-view", GRPC_HOSTS, "/bilibili.community.service.dm.v1.DM/DmView", "grpc", "grpc-dm-view", ["enhance"], true, true, true),
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

"use strict";

(function (root) {
  var hasOwn = Object.prototype.hasOwnProperty;
  var gzipCodec = root.BiliGzip ||
    (typeof module !== "undefined" && module.exports ? require("./bilibili-gzip.js") : null);
  var endpointRegistry =
    typeof module !== "undefined" && module.exports
      ? require("./bilibili-endpoints.js")
      : root.BiliEndpointRegistry;
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
      uri: /^bilibili:\/\/uper\/user_center\/add_archive(?:[/?#]|$)/i,
      labelOnly: false
    },
    hideMineRewardPublish: {
      labels: ["有奖发布", "有奖活动"],
      ids: [174, 191, 422],
      uri: /(?:member\.bilibili\.com\/york\/(?:hot-activity|up-invitation|mission-center)|uper\/(?:user_center\/)?(?:reward|activity)|(?:reward|activity)[_/-]?(?:publish|upload))/i,
      labelOnly: false
    },
    hideMineCourse: {
      labels: ["我的课程"],
      ids: [386, 400, 794],
      uri: /(?:cheese|course)/i,
      labelOnly: false
    },
    hideMineFreeData: {
      labels: ["看视频免流量"],
      ids: [387, 401],
      uri: /(?:bilibili:\/\/main\/drawer\/freedata|free[_/-]?traffic|freedata|user_center\/free_traffic)/i,
      labelOnly: false
    },
    hideMineWorkshop: {
      labels: ["工房", "工房集市"],
      ids: [967],
      uri: /(?:workshop|mall-up_market|neul-next|up_market|market\/show)/i,
      labelOnly: true
    },
    hideMineEnergy: {
      labels: ["能量加油站"],
      ids: [989, 990],
      uri: /(?:306424|energy[_/-]?(?:station|center)?)/i,
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
      ids: [388, 402],
      uri: /(?:h5\/mall\/home|garb|dress|pendant)/i,
      labelOnly: false
    },
    hideMineWallet: {
      labels: ["我的钱包"],
      ids: [390, 404, 741],
      uri: /(?:bilipay\/mine_wallet|mine_wallet)/i,
      labelOnly: false
    },
    hideMineGameCenter: {
      labels: ["游戏中心", "我的游戏"],
      ids: [403, 874],
      uri: /game_center\/(?:user|list\?(?:[^#]*&)?fragment_name=played)/i,
      labelOnly: false
    },
    hideMineMallOrders: {
      labels: ["会员购订单", "会员购中心"],
      ids: [622, 624],
      uri: /(?:bilibili:\/\/mall\/mine|mall\/mine)/i,
      labelOnly: false
    },
    hideMineLive: {
      labels: ["我的直播"],
      ids: [406, 706, 710],
      uri: /(?:live-app-center|user_center\/live_center)/i,
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
      ids: [171, 190, 544],
      uri: /(?:(?:uper|upper)\/homevc|main\/drawer\/upper)/i,
      labelOnly: false
    },
    hideMineCommunityCenter: {
      labels: ["社区中心"],
      ids: [514, 517],
      uri: /blackboard\/dynamic\/169422/i,
      labelOnly: false
    },
    hideMoreCustomerService: {
      labels: ["联系客服"],
      ids: [395, 407],
      uri: /(?:customer-service|user_center\/feedback)/i,
      labelOnly: false
    },
    hideMoreListenVideo: {
      labels: ["听视频"],
      ids: [811, 812],
      uri: /bilibili:\/\/podcast/i,
      labelOnly: false
    },
    hideMoreTeenProtection: {
      labels: ["未成年人守护", "青少年守护"],
      ids: [963, 964],
      uri: /h5\/teenagers\/home/i,
      labelOnly: false
    },
    hideMoreSettings: {
      labels: ["设置"],
      ids: [410, 458, 764],
      uri: /(?:activity:\/\/main\/preference|user_center\/setting)/i,
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
    "vip_section_right",
    "modular_vip_section",
    "vipSection",
    "vipSectionV2",
    "vipSectionRight",
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
    ipad_more_sections: true,
    ipad_recommend_sections: true,
    ipad_sections: true,
    ipad_upper_sections: true,
    ipadMoreSections: true,
    ipadRecommendSections: true,
    ipadSections: true,
    ipadUpperSections: true,
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
    action: true,
    actions: true,
    activity_modules: true,
    activityModules: true,
    buttons: true,
    cards: true,
    commercial_modules: true,
    commercialModules: true,
    introduction: true,
    introduction_modules: true,
    introductionModules: true,
    introductions: true,
    items: true,
    module_list: true,
    moduleList: true,
    modules: true,
    operation_card: true,
    operation_cards: true,
    operationCard: true,
    operationCards: true,
    operation_area: true,
    operationArea: true,
    relates: true,
    relates_feed: true,
    relatesFeed: true,
    tab: true,
    tab_modules: true,
    tabModules: true,
    tabs: true,
    under_player_modules: true,
    underPlayerModules: true,
    view_modules: true,
    viewModules: true
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
    commercial_module: true,
    commercialModule: true,
    marketing_banner: true,
    marketingBanner: true,
    operation_card: true,
    operationCard: true,
    player_ad: true,
    playerAd: true,
    under_player_ad: true,
    underPlayerAd: true,
    under_player_banner: true,
    underPlayerBanner: true
  };
  var SEARCH_JSON_CONTAINER_KEYS = {
    blocks: true,
    cards: true,
    data: true,
    groups: true,
    item: true,
    items: true,
    list: true,
    modules: true,
    pages: true,
    result: true,
    rows: true,
    sections: true
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

  function appendBoundedMeta(meta, key, value, limit) {
    var normalized = String(value || "").trim().slice(0, 64);
    if (!isPlainObject(meta) || !normalized) {
      return;
    }
    if (!Array.isArray(meta[key])) {
      meta[key] = [];
    }
    if (
      meta[key].length < (limit || 12) &&
      !includes(meta[key], normalized)
    ) {
      meta[key].push(normalized);
    }
  }

  function recordMatchedPath(meta, path) {
    appendBoundedMeta(meta, "matchedPaths", path, 16);
  }

  function recordObservedTypes(meta, item) {
    var keys = [
      "card_type",
      "cardType",
      "card_goto",
      "cardGoto",
      "goto",
      "type",
      "business_type",
      "businessType",
      "biz_type",
      "bizType",
      "product_type",
      "productType"
    ];
    var index;
    var value;
    if (!isPlainObject(item)) {
      return;
    }
    for (index = 0; index < keys.length; index += 1) {
      value = item[keys[index]];
      if (
        (typeof value === "string" || typeof value === "number") &&
        String(value).trim()
      ) {
        appendBoundedMeta(
          meta,
          "observedTypes",
          keys[index] + ":" + String(value),
          16
        );
      }
    }
  }

  function recordRemoval(meta, count, path, reason) {
    if (!isPlainObject(meta) || !count) {
      return;
    }
    meta.removed = (Number(meta.removed) || 0) + count;
    recordMatchedPath(meta, path);
    if (reason) {
      meta.reason = reason;
    }
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
      homeFeedRefill: false,
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
    config.homeFeedRefill = parseBoolean(parsed.homeFeedRefill, config.homeFeedRefill);
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

  function classifyEndpoint(requestUrl) {
    var matched = endpointRegistry && endpointRegistry.classify
      ? endpointRegistry.classify(requestUrl, {
          runtime: "enhance",
          transport: "json",
          responseFilter: true
        }) || endpointRegistry.classify(requestUrl, {
          runtime: "story",
          transport: "json"
        })
      : null;
    return matched && matched.handler !== "grpc-diagnostic"
      ? matched.handler
      : "";
  }

  function classifyGrpcEndpoint(requestUrl) {
    var matched = endpointRegistry && endpointRegistry.classify
      ? endpointRegistry.classify(requestUrl, {
          runtime: "enhance",
          transport: "grpc",
          responseFilter: true
        })
      : null;
    return matched && matched.handler !== "grpc-diagnostic"
      ? matched.handler
      : "";
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
      endpoint === "grpc-view-unite-relates" ||
      endpoint === "grpc-view-unite-ai-relate-async"
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
      "ad_badge",
      "ad_tag_style",
      "ad_label",
      "badge",
      "badge_info",
      "badge_text",
      "cover_badge",
      "cover_badge_2",
      "corner_mark",
      "corner_mark_style",
      "commercial_label",
      "business_badge",
      "business_label",
      "card_business_badge",
      "bottom_rcmd_reason_style",
      "cover_right_text_1",
      "cover_right_text_content_description",
      "cover_left_text",
      "cover_right_text",
      "left_corner_mark_style",
      "left_cover_badge_style",
      "promotion_badge",
      "promotion_label",
      "rcmd_reason",
      "rcmd_reason_style",
      "rcmd_reason_style_v2",
      "reason",
      "right_cover_badge_style",
      "top_rcmd_reason_style",
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
        /(?:广告|创作推广|必火推广|必火推荐|小火箭|商业推广|魔力[赏賞])/.test(value)
      ) {
        return true;
      }
    }
    return false;
  }

  function isHomeFeedCommercialBadgeLabel(value) {
    var label = normalizeLabel(String(value || ""));
    return /^(?:广告|ad|创作推广|商业推广|魔力[赏賞])(?:[·•｜|:：-](?:\d+(?:\.\d+)?[万亿]?人(?:感兴趣|看过|围观|点击)|推荐|推广)?)?$/i.test(
      label
    );
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
      "businessInfo",
      "ad_badge",
      "adBadge",
      "ad_tag_style",
      "adTagStyle",
      "business_badge",
      "businessBadge",
      "commercial_label",
      "commercialLabel"
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
      "ad_badge",
      "adBadge",
      "ad_tag_style",
      "adTagStyle",
      "business",
      "business_badge",
      "businessBadge",
      "click",
      "click_info",
      "clickInfo",
      "card_business_badge",
      "cardBusinessBadge",
      "creative",
      "creative_info",
      "creativeInfo",
      "exposure",
      "exposure_info",
      "exposureInfo",
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
      /^(?:下载|立即下载|购买|立即购买|领取|立即领取|打开|立即打开|去看看|闲鱼集市)$/.test(
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
      /^(?:ad|cm|commercial|promotion|promote|creator_promotion|creative_promotion|business_promotion|native_ad|game_ad)$/i.test(
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

  function handleFeed(body, config, meta) {
    var data = body.data;
    var source;
    var kept = [];
    var fallback = [];
    var changes = 0;
    var index;
    var item;
    var before;
    var removed;
    var cardType;
    var commercialRemoved = 0;

    if (!isPlainObject(data) || !Array.isArray(data.items)) {
      return 0;
    }
    source = data.items;
    if (source.length === 0) {
      return 0;
    }
    for (index = 0; index < source.length; index += 1) {
      recordObservedTypes(meta, source[index]);
      if (hasExplicitHomeCommercialEvidence(source[index])) {
        commercialRemoved += 1;
      }
    }
    if (config.homeFeedVideoOnly !== false) {
      for (index = 0; index < source.length; index += 1) {
        if (
          isPlainHomeFeedVideo(source[index]) &&
          kept.length < HOME_FEED_VIDEO_LIMIT
        ) {
          kept.push(source[index]);
        }
      }
      if (kept.length === 0) {
        for (index = 0; index < source.length; index += 1) {
          if (
            isFallbackHomeFeedVideo(source[index]) &&
            fallback.length < HOME_FEED_VIDEO_LIMIT
          ) {
            fallback.push(source[index]);
          }
        }
        kept = fallback;
      }
      if (kept.length === 0) {
        for (index = 0; index < source.length; index += 1) {
          if (
            !hasExplicitHomeCommercialEvidence(source[index]) &&
            !hasExplicitHomeNonVideoEvidence(source[index]) &&
            kept.length < HOME_FEED_VIDEO_LIMIT
          ) {
            kept.push(source[index]);
          }
        }
      }
      if (kept.length === 0) {
        data.items = [];
        recordRemoval(
          meta,
          source.length,
          "data.items",
          "feed-all-commercial-blocked"
        );
        return source.length;
      }
      if (kept.length !== source.length) {
        data.items = kept;
        recordRemoval(
          meta,
          source.length - kept.length,
          "data.items",
          commercialRemoved > 0 ? "ios970-feed-ad-removed" : ""
        );
        return source.length - kept.length;
      }
      return 0;
    }
    for (index = 0; index < source.length; index += 1) {
      item = source[index];
      if (isHighConfidencePromotion(item)) {
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
      recordRemoval(
        meta,
        source.length - kept.length,
        "data.items",
        commercialRemoved > 0 ? "ios970-feed-ad-removed" : ""
      );
    }
    return changes;
  }

  function feedItemIdentities(item) {
    var nodes;
    var node;
    var value;
    var output = [];
    var index;
    var identity;
    if (!isPlainObject(item)) {
      return output;
    }
    nodes = homeVideoIdentityNodes(item);
    for (index = 0; index < nodes.length; index += 1) {
      node = nodes[index];
      if (!isPlainObject(node)) {
        continue;
      }
      value = positiveHomeVideoId(node.aid) || positiveHomeVideoId(node.avid);
      identity = value ? "aid:" + value : "";
      if (identity && !includes(output, identity)) {
        output.push(identity);
      }
      value = normalizedHomeBvid(node.bvid, true);
      identity = value ? "bvid:" + value.toUpperCase() : "";
      if (identity && !includes(output, identity)) {
        output.push(identity);
      }
      value = String(node.param || "").trim();
      identity = positiveHomeVideoId(value)
        ? "aid:" + positiveHomeVideoId(value)
        : normalizedHomeBvid(value, true)
          ? "bvid:" + normalizedHomeBvid(value, true).toUpperCase()
          : "";
      if (identity && !includes(output, identity)) {
        output.push(identity);
      }
      identity = homeVideoIdentityFromUri(objectLink(node));
      if (identity && !includes(output, identity)) {
        output.push(identity);
      }
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

  function filterKnownSearchJsonContainers(node, meta, path, depth) {
    var changes = 0;
    var keys;
    var index;
    var key;
    var value;
    var childPath;
    var removed;
    if (!isPlainObject(node) || depth > 8) {
      return 0;
    }
    keys = Object.keys(node);
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      if (!SEARCH_JSON_CONTAINER_KEYS[key]) {
        continue;
      }
      value = node[key];
      childPath = path ? path + "." + key : key;
      if (Array.isArray(value)) {
        value.forEach(function (item) {
          recordObservedTypes(meta, item);
        });
        removed = filterSearchArray(node, key);
        changes += removed;
        recordRemoval(
          meta,
          removed,
          childPath,
          "ios970-search-commercial-removed"
        );
        node[key].forEach(function (item) {
          if (isPlainObject(item)) {
            changes += filterKnownSearchJsonContainers(
              item,
              meta,
              childPath + "[]",
              depth + 1
            );
          }
        });
      } else if (isPlainObject(value)) {
        recordObservedTypes(meta, value);
        if (key !== "data" && isSearchPromotion(value)) {
          delete node[key];
          changes += 1;
          recordRemoval(
            meta,
            1,
            childPath,
            "ios970-search-commercial-removed"
          );
        } else {
          changes += filterKnownSearchJsonContainers(
            value,
            meta,
            childPath,
            depth + 1
          );
        }
      }
    }
    return changes;
  }

  function handleSearchResults(body, meta) {
    return filterKnownSearchJsonContainers(body, meta, "", 0);
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
    if (
      target.labelOnly !== true &&
      link &&
      target.uri.test(link)
    ) {
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

  function removeMineFirstVideoFallback(data, config) {
    var wrappers = ["rework_v1", "reworkV1"];
    var creativeKeys = ["worst_creative", "worstCreative"];
    var changes = 0;
    var index;
    var inner;
    var wrapper;
    if (
      !isPlainObject(data) ||
      !config ||
      config.ui === false ||
      config.hideMineFirstVideo !== true
    ) {
      return 0;
    }
    for (index = 0; index < wrappers.length; index += 1) {
      wrapper = data[wrappers[index]];
      if (!isPlainObject(wrapper)) {
        continue;
      }
      for (inner = 0; inner < creativeKeys.length; inner += 1) {
        if (hasOwn.call(wrapper, creativeKeys[inner])) {
          delete wrapper[creativeKeys[inner]];
          changes += 1;
        }
      }
    }
    return changes;
  }

  function handleMine(body, config) {
    var data = body.data;
    var changes = 0;
    if (!isPlainObject(data)) {
      return 0;
    }
    changes += removeMineFirstVideoFallback(data, config);
    changes += filterMineNode(data, 0, config, "");
    return changes;
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

  function homeVideoIdentityNodes(item) {
    return [
      item,
      item && item.player_args,
      item && item.playerArgs,
      item && item.archive,
      item && item.video,
      item && item.basic
    ];
  }

  function positiveHomeVideoId(value) {
    var number;
    if (typeof value !== "string" && typeof value !== "number") {
      return 0;
    }
    if (typeof value === "string" && !/^\d+$/.test(value.trim())) {
      return 0;
    }
    number = Number(value);
    return Number.isSafeInteger(number) && number > 0 ? number : 0;
  }

  function normalizedHomeBvid(value, allowRelaxed) {
    var bvid = String(value || "").trim();
    if (/^BV[0-9A-Za-z]{10}$/.test(bvid)) {
      return bvid;
    }
    return allowRelaxed && /^BV[0-9A-Za-z]{8,20}$/.test(bvid)
      ? bvid
      : "";
  }

  function homeVideoIdentityFromUri(value) {
    var uri = String(value || "").trim();
    var match = /^(?:bilibili:\/\/video\/|https?:\/\/(?:www|m)\.bilibili\.com\/video\/)(?:av)?(\d+)(?:[/?#]|$)/i.exec(
      uri
    );
    if (match && positiveHomeVideoId(match[1])) {
      return "aid:" + positiveHomeVideoId(match[1]);
    }
    match = /^(?:bilibili:\/\/video\/|https?:\/\/(?:www|m)\.bilibili\.com\/video\/)(BV[0-9A-Za-z]{8,20})(?:[/?#]|$)/i.exec(
      uri
    );
    return match ? "bvid:" + match[1].toUpperCase() : "";
  }

  function hasExplicitHomeAvType(item) {
    var playerArgs;
    var values;
    var index;
    if (!isPlainObject(item)) {
      return false;
    }
    if (HOME_FEED_AV_CARD_TYPES[String(item.card_type || "").toLowerCase()]) {
      return true;
    }
    values = [item.goto, item.card_goto, item.type];
    for (index = 0; index < values.length; index += 1) {
      if (includes(["av", "video"], String(values[index] || "").toLowerCase())) {
        return true;
      }
    }
    playerArgs = isPlainObject(item.player_args)
      ? item.player_args
      : isPlainObject(item.playerArgs)
        ? item.playerArgs
        : null;
    return (
      isPlainObject(playerArgs) &&
      includes(
        ["av", "video"],
        String(playerArgs.type || "").toLowerCase()
      )
    );
  }

  function hasExplicitHomeCommercialEvidence(item) {
    var marker;
    var keys = [
      "commercial",
      "commercial_info",
      "commercialInfo"
    ];
    var wrapperKeys = [
      "inline_data",
      "inlineData",
      "native_ad",
      "nativeAd",
      "business_data",
      "businessData"
    ];
    var index;
    var nested;
    if (!isPlainObject(item)) {
      return false;
    }
    if (
      isHighConfidencePromotion(item) ||
      hasCommercialAction(item) ||
      hasExplicitAdMarker(item)
    ) {
      return true;
    }
    marker = recommendationMarker(
      item,
      ["goto", "card_goto", "type", "card_type", "card_type_en"]
    );
    if (
      /(?:^|\|)(?:ad|cm|banner)(?:[_-][^|]*)?(?:\||$)/i.test(marker)
    ) {
      return true;
    }
    for (index = 0; index < keys.length; index += 1) {
      if (hasOwn.call(item, keys[index]) && hasMarkerValue(item[keys[index]])) {
        return true;
      }
    }
    for (index = 0; index < wrapperKeys.length; index += 1) {
      nested = item[wrapperKeys[index]];
      if (
        isPlainObject(nested) &&
        (
          isHighConfidencePromotion(nested) ||
          explicitCommercialLabel(nested) ||
          hasNestedCommercialEvidence(nested, 0)
        )
      ) {
        return true;
      }
    }
    return false;
  }

  function hasExplicitHomeNonVideoEvidence(item) {
    var marker;
    var labels;
    var uri;
    if (!isPlainObject(item)) {
      return false;
    }
    marker = recommendationMarker(
      item,
      ["goto", "card_goto", "type", "card_type", "card_type_en"]
    );
    if (
      /(?:^|\|)(?:ogv|pgc|bangumi|bangumi_av|bangumi_ugc|season|episode|live|game|resource|course|cheese|special|article|read|comic|audio|activity)(?:[_-][^|]*)?(?:\||$)/i.test(
        marker
      )
    ) {
      return true;
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
          "course_id",
          "courseId",
          "article_id",
          "articleId",
          "comic_id",
          "comicId",
          "activity_id",
          "activityId"
        ]
      )
    ) {
      return true;
    }
    labels = recommendationLabels(item);
    if (
      /(?:纪录片|综艺|番剧|国创|电影|电视剧|影视|直播|游戏|课程|课堂|专栏|文章|漫画|音频|播单|活动|documentary|variety|bangumi|ogv|pgc|live|game|course|cheese|special|article|comic|audio|activity)/i.test(
        labels
      )
    ) {
      return true;
    }
    uri = objectLink(item);
    return /^(?:bilibili:\/\/(?:live|bangumi|pgc|season|ep|game|cheese|course|article|read|comic|audio|activity)(?:[/?#]|$)|https?:\/\/(?:www\.)?bilibili\.com\/(?:bangumi|cheese|read|comic|audio|blackboard|festival)(?:[/?#]|$)|https?:\/\/live\.bilibili\.com(?:[/?#]|$))/i.test(
      uri
    );
  }

  function hasHomeVideoIdentity(item, allowCid) {
    var nodes;
    var index;
    var node;
    var param;
    var explicitAv;
    if (!isPlainObject(item)) {
      return false;
    }
    explicitAv = hasExplicitHomeAvType(item);
    nodes = homeVideoIdentityNodes(item);
    for (index = 0; index < nodes.length; index += 1) {
      node = nodes[index];
      if (!isPlainObject(node)) {
        continue;
      }
      if (
        positiveHomeVideoId(node.aid) ||
        positiveHomeVideoId(node.avid) ||
        normalizedHomeBvid(node.bvid, explicitAv) ||
        homeVideoIdentityFromUri(objectLink(node))
      ) {
        return true;
      }
      param = String(node.param || "").trim();
      if (
        positiveHomeVideoId(param) ||
        normalizedHomeBvid(param, explicitAv)
      ) {
        return true;
      }
      if (allowCid && positiveHomeVideoId(node.cid)) {
        return true;
      }
    }
    return false;
  }

  function isPlainHomeFeedVideo(item) {
    if (
      !isPlainObject(item) ||
      hasExplicitHomeCommercialEvidence(item) ||
      hasExplicitHomeNonVideoEvidence(item) ||
      !hasExplicitHomeAvType(item)
    ) {
      return false;
    }
    return hasHomeVideoIdentity(item, false);
  }

  function isFallbackHomeFeedVideo(item) {
    return Boolean(
      isPlainObject(item) &&
      !hasExplicitHomeCommercialEvidence(item) &&
      !hasExplicitHomeNonVideoEvidence(item) &&
      hasExplicitHomeAvType(item) &&
      hasHomeVideoIdentity(item, true)
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

  function isExplicitRelateProductCard(item) {
    var marker;
    var payloadKeys = [
      "commerce",
      "commerce_info",
      "commerceInfo",
      "goods",
      "goods_info",
      "goodsInfo",
      "mall",
      "mall_info",
      "mallInfo",
      "product",
      "product_info",
      "productInfo",
      "purchase",
      "purchase_info",
      "purchaseInfo"
    ];
    var index;
    if (!isPlainObject(item)) {
      return false;
    }
    marker = recommendationMarker(
      item,
      [
        "goto",
        "card_goto",
        "type",
        "card_type",
        "card_type_en",
        "business_type",
        "businessType",
        "biz_type",
        "bizType",
        "product_type",
        "productType"
      ]
    );
    if (
      /(?:^|\|)(?:product|goods|purchase|mall|member_mall|member_purchase|commerce)(?:[_-][^|]*)?(?:\||$)/i.test(
        marker
      )
    ) {
      return true;
    }
    for (index = 0; index < payloadKeys.length; index += 1) {
      if (
        hasOwn.call(item, payloadKeys[index]) &&
        hasMarkerValue(item[payloadKeys[index]])
      ) {
        return true;
      }
    }
    return false;
  }

  function handleView(body, config, meta) {
    var data = body.data;
    var changes = 0;
    var productRemoved = 0;
    var relateRemoved;
    if (!isPlainObject(data)) {
      return 0;
    }
    changes += deleteKnownViewAdKeys(data, config);
    if (Array.isArray(data.relates)) {
      data.relates.forEach(function (item) {
        recordObservedTypes(meta, item);
      });
    }
    relateRemoved = replaceFilteredArray(data, "relates", function (item) {
      if (isExplicitRelateProductCard(item)) {
        productRemoved += 1;
        return true;
      }
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
    changes += relateRemoved;
    if (productRemoved > 0) {
      recordRemoval(
        meta,
        productRemoved,
        "data.relates",
        "ios970-relate-product-removed"
      );
    } else if (relateRemoved > 0) {
      recordRemoval(meta, relateRemoved, "data.relates", "");
    }
    changes += filterKnownViewJsonContainers(
      data,
      config,
      0,
      meta,
      "data"
    );
    return changes;
  }

  function shouldRemoveViewJsonModule(item, config, isModuleCollection) {
    var moduleType;
    if (!isPlainObject(item)) {
      return false;
    }
    if (
      config.ads !== false &&
      (
        isHighConfidencePromotion(item) ||
        hasReviewedCommercialAction(item, 0) ||
        hasReviewedUnderPlayerAdLabel(item, 0)
      )
    ) {
      return true;
    }
    moduleType = Number(
      item.module_type !== undefined
        ? item.module_type
        : item.moduleType !== undefined
          ? item.moduleType
          : isModuleCollection ? item.type : undefined
    );
    if (config.ads !== false && isModuleCollection && item.type === "MERCHANDISE") {
      return true;
    }
    return (
      (
        config.ads !== false &&
        includes([18, 37, 55, 63], moduleType)
      ) ||
      (config.vipPromotions !== false && moduleType === 29)
    );
  }

  function isUnderPlayerAdLabel(value) {
    var label = normalizeLabel(String(value || ""));
    return /^(?:广告|ad)(?:[·•｜|:：-](?:\d+(?:\.\d+)?[万亿]?人(?:感兴趣|看过|围观|点击)|推荐|推广)?)?$/i.test(
      label
    );
  }

  function labelValueContainsUnderPlayerAd(value) {
    var text = knownLabelText(value, 0);
    var parts = text ? text.split("|") : [];
    var index;
    for (index = 0; index < parts.length; index += 1) {
      if (isUnderPlayerAdLabel(parts[index])) {
        return true;
      }
    }
    return false;
  }

  function hasReviewedUnderPlayerAdLabel(item, depth) {
    var wrapperKeys = [
      "card",
      "card_info",
      "cardInfo",
      "content",
      "metadata",
      "meta",
      "native_card",
      "nativeCard",
      "presentation"
    ];
    var labelKeys = [
      "ad_label",
      "adLabel",
      "badge",
      "badge_info",
      "badgeInfo",
      "badge_text",
      "badgeText",
      "label",
      "sub_title",
      "subTitle",
      "subtitle",
      "tag",
      "tags"
    ];
    var index;
    var nestedIndex;
    var value;
    if (!isPlainObject(item) || depth > 5) {
      return false;
    }
    for (index = 0; index < labelKeys.length; index += 1) {
      if (
        hasOwn.call(item, labelKeys[index]) &&
        labelValueContainsUnderPlayerAd(item[labelKeys[index]])
      ) {
        return true;
      }
    }
    for (index = 0; index < wrapperKeys.length; index += 1) {
      value = item[wrapperKeys[index]];
      if (Array.isArray(value)) {
        for (nestedIndex = 0; nestedIndex < value.length; nestedIndex += 1) {
          if (hasReviewedUnderPlayerAdLabel(value[nestedIndex], depth + 1)) {
            return true;
          }
        }
      } else if (
        isPlainObject(value) &&
        hasReviewedUnderPlayerAdLabel(value, depth + 1)
      ) {
        return true;
      }
    }
    return false;
  }

  function hasReviewedCommercialAction(item, depth) {
    var keys = [
      "action",
      "actions",
      "button",
      "buttons",
      "commercial_action",
      "commercialAction",
      "content",
      "jump",
      "marketing_action",
      "marketingAction",
      "operation_area",
      "operationArea",
      "operation_card",
      "operationCard",
      "under_player",
      "underPlayer"
    ];
    var index;
    var value;
    var nestedIndex;
    if (!isPlainObject(item) || depth > 5) {
      return false;
    }
    if (isCommercialUri(objectLink(item))) {
      return true;
    }
    for (index = 0; index < keys.length; index += 1) {
      if (!hasOwn.call(item, keys[index])) {
        continue;
      }
      value = item[keys[index]];
      if (Array.isArray(value)) {
        for (nestedIndex = 0; nestedIndex < value.length; nestedIndex += 1) {
          if (hasReviewedCommercialAction(value[nestedIndex], depth + 1)) {
            return true;
          }
        }
      } else if (isPlainObject(value)) {
        if (
          isCommercialUri(objectLink(value)) ||
          /闲鱼集市/.test(knownLabelText(value, 0)) ||
          hasReviewedCommercialAction(value, depth + 1)
        ) {
          return true;
        }
      }
    }
    return false;
  }

  function hasReviewedMarketplaceAction(item, depth) {
    var keys = [
      "action",
      "actions",
      "button",
      "buttons",
      "content",
      "jump",
      "operation_area",
      "operationArea",
      "operation_card",
      "operationCard",
      "under_player",
      "underPlayer"
    ];
    var index;
    var nestedIndex;
    var value;
    var link;
    if (!isPlainObject(item) || depth > 5) {
      return false;
    }
    link = objectLink(item);
    if (
      /(?:goofish\.com|2\.taobao\.com|market\.m\.taobao\.com|(?:taobao|fleamarket):\/\/)/i.test(
        link
      ) ||
      /闲鱼集市/.test(knownLabelText(item, 0))
    ) {
      return true;
    }
    for (index = 0; index < keys.length; index += 1) {
      value = item[keys[index]];
      if (Array.isArray(value)) {
        for (nestedIndex = 0; nestedIndex < value.length; nestedIndex += 1) {
          if (hasReviewedMarketplaceAction(value[nestedIndex], depth + 1)) {
            return true;
          }
        }
      } else if (
        isPlainObject(value) &&
        hasReviewedMarketplaceAction(value, depth + 1)
      ) {
        return true;
      }
    }
    return false;
  }

  function filterKnownViewJsonContainers(node, config, depth, meta, path) {
    var keys;
    var index;
    var key;
    var value;
    var changes = 0;
    var childPath;
    var removed;
    var marketplaceRemoved;
    var nativeAdRemoved;
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
      childPath = path ? path + "." + key : key;
      if (Array.isArray(value)) {
        marketplaceRemoved = 0;
        nativeAdRemoved = 0;
        value.forEach(function (item) {
          recordObservedTypes(meta, item);
        });
        removed = replaceFilteredArray(node, key, function (item) {
          var shouldRemove = shouldRemoveViewJsonModule(item, config,
            includes(["modules", "module_list", "moduleList", "introduction_modules", "introductionModules", "view_modules", "viewModules"], key));
          if (shouldRemove && hasReviewedMarketplaceAction(item, 0)) {
            marketplaceRemoved += 1;
          }
          if (shouldRemove && hasReviewedUnderPlayerAdLabel(item, 0)) {
            nativeAdRemoved += 1;
          }
          return shouldRemove;
        });
        changes += removed;
        recordRemoval(
          meta,
          removed,
          childPath,
          marketplaceRemoved > 0
            ? "ios970-view-xianyu-removed"
            : nativeAdRemoved > 0
              ? "ios970-view-under-player-ad-removed"
              : ""
        );
        node[key].forEach(function (item) {
          if (isPlainObject(item)) {
            changes += filterKnownViewJsonContainers(
              item,
              config,
              depth + 1,
              meta,
              childPath + "[]"
            );
          }
        });
      } else if (isPlainObject(value)) {
        if (shouldRemoveViewJsonModule(value, config)) {
          delete node[key];
          changes += 1;
          recordRemoval(
            meta,
            1,
            childPath,
            hasReviewedMarketplaceAction(value, 0)
              ? "ios970-view-xianyu-removed"
              : hasReviewedUnderPlayerAdLabel(value, 0)
                ? "ios970-view-under-player-ad-removed"
              : ""
          );
        } else {
          changes += filterKnownViewJsonContainers(
            value,
            config,
            depth + 1,
            meta,
            childPath
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
    return /(?:bilibili:\/\/(?:game_center|mall)\/|(?:taobao|fleamarket):\/\/|(?:^|\/\/)(?:www\.)?goofish\.com(?:[/:?#]|$)|(?:^|\/\/)2\.taobao\.com(?:[/:?#]|$)|(?:^|\/\/)market\.m\.taobao\.com(?:[/:?#]|$)|mall\.bilibili\.com\/|b23\.tv\/(?:cm|mall)(?:[/?#]|$))/i.test(
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

  function handlePgcChannel(body, meta) {
    var data = body.data;
    var changes = 0;
    var removedModules;
    if (!isPlainObject(data) || !Array.isArray(data.modules)) {
      return 0;
    }
    removedModules = replaceFilteredArray(data, "modules", function (moduleItem) {
      var removed;
      if (!isPlainObject(moduleItem) || moduleItem.type !== "BANNER" ||
        !isPlainObject(moduleItem.module_data)) {
        return false;
      }
      removed = replaceFilteredArray(moduleItem.module_data, "items", function (item) {
        return isPlainObject(item) && (
          isHighConfidencePromotion(item) || isCommercialUri(objectLink(item)) ||
          /^https?:\/\/www\.bilibili\.com\/blackboard\/era\//i.test(String(item.url || ""))
        );
      });
      changes += removed;
      if (removed) {
        recordRemoval(meta, removed, "data.modules[].module_data.items", "pgc-channel-commercial-banner");
      }
      return removed > 0 && moduleItem.module_data.items.length === 0;
    });
    return changes + removedModules;
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
    var commerceBizIds = [33, 36, 162, 186];
    if (!isPlainObject(data)) {
      return 0;
    }
    changes += deleteProperty(data, "activity_banner_info");
    changes += deleteProperty(data, "big_card_info");
    changes += deleteProperty(data, "function_card");
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
          return (
            isPlainObject(item) &&
            includes(commerceBizIds, Number(item.biz_id))
          );
        }
      );
    }
    if (
      config.liveShopping &&
      isPlainObject(data.new_tab_info) &&
      Array.isArray(data.new_tab_info.candidate_list)
    ) {
      changes += replaceFilteredArray(
        data.new_tab_info,
        "candidate_list",
        function (item) {
          return (
            isPlainObject(item) &&
            includes(commerceBizIds, Number(item.biz_id))
          );
        }
      );
    }
    if (
      config.liveShopping &&
      isPlainObject(data.new_tab_info) &&
      Array.isArray(data.new_tab_info.v2_outer_list)
    ) {
      data.new_tab_info.v2_outer_list.forEach(function (item) {
        var before;
        if (!isPlainObject(item) || !Array.isArray(item.indices)) {
          return;
        }
        before = item.indices.length;
        item.indices = item.indices.filter(function (value) {
          return !includes(commerceBizIds, Number(value));
        });
        changes += before - item.indices.length;
      });
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

  function handleLiveFeed(body, meta) {
    var data = body.data;
    var removed;
    if (!isPlainObject(data)) {
      return 0;
    }
    removed = replaceFilteredArray(data, "card_list", function (item) {
      return Boolean(
        isPlainObject(item) &&
        includes(
          ["banner_v2", "activity_card_v1"],
          String(item.card_type || "").toLowerCase()
        )
      );
    });
    recordRemoval(
      meta,
      removed,
      "data.card_list",
      "ios980-live-feed-promotion-removed"
    );
    return removed;
  }

  function handleLiveUser(body, meta) {
    var data = body.data;
    var changes = 0;
    if (!isPlainObject(data)) {
      return 0;
    }
    changes += deleteProperty(data, "play_together_info");
    changes += deleteProperty(data, "play_together_info_v2");
    changes += deleteProperty(data, "function_card");
    recordRemoval(
      meta,
      changes,
      "data",
      "ios980-live-user-interference-removed"
    );
    return changes;
  }

  function handleDynamicWebFeed(body, meta) {
    var data = body.data;
    var changes;
    if (!isPlainObject(data) || !Array.isArray(data.items)) {
      return 0;
    }
    changes = replaceFilteredArray(data, "items", function (item) {
      var evidence = {};
      recordObservedTypes(meta, item);
      if (!isPlainObject(item)) {
        return false;
      }
      // Empty JSON default objects are not an active advertisement. This
      // evidence projection never changes the server's ordinary card fields.
      Object.keys(item).forEach(function (key) {
        if (!isPlainObject(item[key]) || Object.keys(item[key]).length > 0) {
          evidence[key] = item[key];
        }
      });
      return hasExplicitAdMarker(evidence);
    });
    recordRemoval(meta, changes, "data.items", "ios990-dynamic-commercial-removed");
    data.items.forEach(function (item) {
      var dynamic = item && item.modules && item.modules.module_dynamic;
      var additional = dynamic && dynamic.additional;
      // Public web-dynamic schema: only the attached commerce card is removed.
      // A normal title/description (including product names) is never scanned.
      if (isPlainObject(additional) && additional.type === "ADDITIONAL_TYPE_GOODS") {
        dynamic.additional = null;
        changes += 1;
        recordRemoval(meta, 1, "data.items[].modules.module_dynamic.additional", "ios990-dynamic-goods-removed");
      }
    });
    return changes;
  }

  function transformObject(body, endpoint, config, meta) {
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
        return handleFeed(body, config, meta);
      case "story":
        return handleStory(body, config);
      case "story-cart":
        return handleStoryCart(body);
      case "search-results":
        return handleSearchResults(body, meta);
      case "view":
        return handleView(body, config, meta);
      case "dynamic-web-feed":
        return handleDynamicWebFeed(body, meta);
      case "reply":
        return handleReply(body);
      case "pgc":
        return handlePgc(body);
      case "pgc-channel":
        return handlePgcChannel(body, meta);
      case "web-feed":
        return handleWebFeed(body, config);
      case "live":
        return handleLive(body, config);
      case "live-feed":
        return handleLiveFeed(body, meta);
      case "live-user":
        return handleLiveUser(body, meta);
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
    var meta = {};
    var arrayCounts = [];
    var registryRow;
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
    registryRow = endpointRegistry && endpointRegistry.classify
      ? endpointRegistry.classify(requestUrl, {
          responseFilter: true,
          transport: "json"
        })
      : null;

    if (isPlainObject(parsed) && hasOwn.call(parsed, "code") && Number(parsed.code) !== 0) {
      return { body: original, changed: 0, endpoint: endpoint, reason: "api-error-response", valid: true };
    }

    try {
      changes = transformObject(parsed, endpoint, effectiveConfig, meta);
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
      matchedPaths: Array.isArray(meta.matchedPaths)
        ? meta.matchedPaths
        : [],
      observedTypes: Array.isArray(meta.observedTypes)
        ? meta.observedTypes
        : [],
      reason:
        meta.reason ||
        (changes > 0
          ? "changed"
          : (
              endpoint === "myinfo-diagnostic"
                ? "diagnostic-only"
                : registryRow && registryRow.volatile
                  ? "resume-fresh-response"
                  : "no-ad-fields"
            )),
      registryId: registryRow ? registryRow.id : "",
      removed: Number(meta.removed) || changes,
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

  function shortUtf8Field(input, fieldNumber, maximumLength) {
    var field = findProtoField(input, fieldNumber, 2);
    var payload;
    if (!field) {
      return null;
    }
    payload = protoPayload(input, field);
    if (
      !payload ||
      payload.length === 0 ||
      payload.length > (maximumLength || 256)
    ) {
      return null;
    }
    return decodeUtf8Strict(payload);
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

  function popularPresentationHasCommercialLabel(
    input,
    textFields,
    reasonStyleFields
  ) {
    var index;
    var field;
    var payload;
    for (index = 0; index < textFields.length; index += 1) {
      if (
        isHomeFeedCommercialBadgeLabel(
          shortUtf8Field(input, textFields[index], 128)
        )
      ) {
        return true;
      }
    }
    for (index = 0; index < reasonStyleFields.length; index += 1) {
      field = findProtoField(input, reasonStyleFields[index], 2);
      if (!field) {
        continue;
      }
      payload = protoPayload(input, field);
      if (
        isHomeFeedCommercialBadgeLabel(
          shortUtf8Field(payload, 1, 128)
        )
      ) {
        return true;
      }
    }
    return false;
  }

  function isPopularPresentationAd(input) {
    var bytes = toUint8Array(input);
    var small = findProtoField(bytes, 1, 2);
    var large = findProtoField(bytes, 2, 2);
    var container;
    if (!bytes || Boolean(small) === Boolean(large)) {
      return false;
    }
    container = protoPayload(bytes, small || large);
    return small
      ? popularPresentationHasCommercialLabel(
          container,
          [4, 13],
          [7, 9, 12]
        )
      : popularPresentationHasCommercialLabel(
          container,
          [7, 18, 21],
          [13, 14, 15, 16, 17]
        );
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
      (adInfo && adInfo.payloadEnd > adInfo.payloadStart) ||
      isPopularPresentationAd(bytes)
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
    return /(?:https?:\/\/(?:b23\.tv\/(?:cm|mall)(?:[/?#]|$)|(?:www\.)?goofish\.com(?:[/?#]|$)|2\.taobao\.com(?:[/?#]|$)|market\.m\.taobao\.com(?:[/?#]|$))|(?:taobao|fleamarket):\/\/)/i.test(
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
      var nested;
      if (
        config.ads !== false &&
        field.wireType === 2 &&
        includes([23, 30, 31, 34, 41, 48, 50], field.fieldNumber)
      ) {
        return { changed: 1, remove: true };
      }
      if (
        config.ads !== false &&
        field.fieldNumber === 4 &&
        field.wireType === 2
      ) {
        nested = rewriteProtoMessage(
          protoPayload(bytes, field),
          function (userField) {
            return userField.fieldNumber === 9 && userField.wireType === 2
              ? { changed: 1, remove: true }
              : null;
          }
        );
        if (!nested.valid) {
          return { invalid: true };
        }
        return nested.changed > 0
          ? { changed: nested.changed, payload: nested.body }
          : null;
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
    var materialText = shortUtf8Field(input, 2, 192);
    return (
      includes([1, 6], materialType) ||
      isUnderPlayerAdLabel(materialText) ||
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

  function commandDmExtraIsCommercial(value) {
    var parsed;
    var text;
    var goods;
    if (!value) {
      return false;
    }
    try {
      parsed = JSON.parse(value);
    } catch (error) {
      return false;
    }
    if (!isPlainObject(parsed)) {
      return false;
    }
    goods = parsed.goods || parsed.goods_info || parsed.goodsInfo;
    try {
      text = JSON.stringify(parsed);
    } catch (error) {
      return false;
    }
    return (
      ((isPlainObject(goods) && Object.keys(goods).length > 0) ||
        (Array.isArray(goods) && goods.length > 0)) ||
      /"(?:is_ad|is_commercial)"\s*:\s*(?:true|1)/i.test(text) ||
      /"(?:ad_info|ad_data|cm|commercial|mini_program|miniProgram|small_app|smallApp|applet)"\s*:/i.test(
        text
      ) ||
      /"(?:creative_id|ad_id|commercial_id|game_id|app_id|sales_type)"\s*:\s*(?:"[^"]+"|[1-9]\d*)/i.test(
        text
      ) ||
      /bilibili:\/\/(?:game_center|mall|smallapp|miniapp|applet|nativeact|following\/home_activity_tab)(?:[/?#]|$)/i.test(
        text
      )
    );
  }

  function isPromotionalCommandDm(input) {
    var command = shortUtf8Field(input, 4, 64);
    var extra = shortUtf8Field(input, 9, 8192);
    return Boolean(
      /^(?:#(?:AD|ACTIVITY|GAME|MINIAPP|RESERVE|REDIRECT)#)$/i.test(
        String(command || "")
      ) ||
      commandDmExtraIsCommercial(extra) ||
      bytesContainCommercialEvidence(input)
    );
  }

  function transformViewProgressDmResource(input) {
    var commands = filterRepeatedMessage(input, 1, function (command) {
      return isPromotionalCommandDm(command);
    });
    var cards;
    if (!commands.valid) {
      return commands;
    }
    cards = filterRepeatedMessage(commands.body, 3, function (card) {
      return isPromotionalOperationCard(card);
    });
    if (cards.valid) {
      cards.changed += commands.changed;
    }
    return cards;
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

  function transformDmView(input) {
    // DmViewReply.activity_meta(18), command(22).command_dms(1).
    // Do not touch subtitle, mask, ordinary danmaku, config, or qoe fields.
    var result = rewriteProtoMessage(input, function (field, bytes) {
      var nested;
      if (field.wireType !== 2) {
        return null;
      }
      if (field.fieldNumber === 18) {
        return { changed: 1, remove: true };
      }
      if (field.fieldNumber !== 22) {
        return null;
      }
      nested = filterRepeatedMessage(protoPayload(bytes, field), 1, isPromotionalCommandDm);
      if (!nested.valid) {
        return { invalid: true };
      }
      if (nested.changed > 0) {
        return nested.body.length === 0
          ? { changed: nested.changed, remove: true }
          : { changed: nested.changed, payload: nested.body };
      }
      return null;
    });
    result.reason = result.changed > 0 ? "ios990-dm-commercial-removed" : "no-ad-fields";
    result.schema = "dm-view-command-v1";
    return result;
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
    var utf8;
    var index;
    if (!bytes || bytes.length === 0 || bytes.length > 262144) {
      return false;
    }
    for (index = 0; index < bytes.length; index += 1) {
      text += bytes[index] >= 0x20 && bytes[index] <= 0x7e
        ? String.fromCharCode(bytes[index])
        : " ";
    }
    utf8 = decodeUtf8Strict(bytes);
    if (utf8) {
      text += " " + utf8;
    }
    return /(?:https?:\/\/(?:[^/\s]+\.)?(?:cm|ad)\.bili(?:bili)?\.(?:com|net)|(?:https?:\/\/|bilibili:\/\/|taobao:\/\/|fleamarket:\/\/)[^\s]{0,160}(?:goofish\.com|2\.taobao\.com|market\.m\.taobao\.com|taobao|tmall|jd\.com|pinduoduo|sponsor|commercial|creative|advert|mall-magic-c)|闲鱼集市|立即打开|(?:^|[^a-z0-9])(?:ad_info|ad_report|adver_id|creative_id|commercial_id|pause[-_]?(?:ad|commerce)|under[-_]?player[-_]?ad|flash[-_]?sale|mall[-_/]ad)(?:[^a-z0-9]|$))/i.test(
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
    var moduleType = smallVarintField(input, 1);
    var result = rewriteProtoMessage(
      input,
      function (field, bytes) {
        var nested;
        if (
          config.ads !== false &&
          moduleType === 3 &&
          field.fieldNumber === 5 &&
          field.wireType === 2
        ) {
          nested = rewriteProtoMessage(
            protoPayload(bytes, field),
            function (headlineField) {
              return headlineField.fieldNumber === 1 &&
                headlineField.wireType === 2
                ? { changed: 1, remove: true }
                : null;
            }
          );
          if (!nested.valid) {
            return { invalid: true };
          }
          return nested.changed > 0
            ? { changed: nested.changed, payload: nested.body }
            : null;
        }
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

  function isExcludedViewModule(moduleType, config) {
    return (
      (config.ads !== false && includes([18, 37, 55, 63], moduleType)) ||
      (moduleType === 29 && config.vipPromotions !== false)
    );
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
      if (isExcludedViewModule(moduleType, config)) {
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
      if (
        config.ads !== false &&
        field.fieldNumber === 3 &&
        field.wireType === 2
      ) {
        nested = rewriteProtoMessage(
          protoPayload(bytes, field),
          function (userField) {
            return userField.fieldNumber === 7 && userField.wireType === 2
              ? { changed: 1, remove: true }
              : null;
          }
        );
        if (!nested.valid) {
          return { invalid: true };
        }
        return nested.changed > 0
          ? { changed: nested.changed, payload: nested.body }
          : null;
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

  function transformViewUniteAsyncModule(input, config) {
    return rewriteProtoMessage(input, function (field, bytes) {
      var nested;
      if (field.fieldNumber !== 1 || field.wireType !== 2) {
        return null;
      }
      if (isExcludedViewModule(smallVarintField(protoPayload(bytes, field), 1), config)) {
        return { changed: 1, remove: true };
      }
      nested = transformViewUniteModule(
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

  function transformViewUniteAiRelateAsync(input, config) {
    var result = rewriteProtoMessage(input, function (field, bytes) {
      var nested;
      if (
        config.ads !== false &&
        field.fieldNumber === 1 &&
        field.wireType === 2
      ) {
        return { changed: 1, remove: true };
      }
      if (field.fieldNumber !== 2 || field.wireType !== 2) {
        return null;
      }
      nested = transformViewUniteAsyncModule(
        protoPayload(bytes, field),
        config
      );
      if (!nested.valid) {
        return { invalid: true };
      }
      if (nested.changed > 0 && nested.body.length === 0) {
        return { changed: nested.changed, remove: true };
      }
      return nested.changed > 0
        ? { changed: nested.changed, payload: nested.body }
        : null;
    });
    result.reason = result.changed > 0
      ? "ios980-ai-relate-async-commercial-removed"
      : "no-ad-fields";
    result.schema = "view-unite-ai-relate-async-v1";
    return result;
  }

  function dynamicItemIsAd(input) {
    var fields = parseProtoFields(input);
    var index;
    var moduleBytes;
    if (includes([15, 18], smallVarintField(input, 1))) {
      return true;
    }
    if (!fields) {
      return false;
    }
    for (index = 0; index < fields.length; index += 1) {
      if (fields[index].fieldNumber !== 3 || fields[index].wireType !== 2) {
        continue;
      }
      moduleBytes = protoPayload(input, fields[index]);
      // Module.module_ad(14) is an ad oneof, even for an AV-shaped card.
      if (findProtoField(moduleBytes, 14, 2)) {
        return true;
      }
    }
    return false;
  }

  function transformDynamicItem(input) {
    return rewriteProtoMessage(input, function (field, bytes) {
      var moduleBytes;
      var additional;
      var recommendation;
      if (field.fieldNumber !== 3 || field.wireType !== 2) {
        return null;
      }
      moduleBytes = protoPayload(bytes, field);
      additional = findProtoField(moduleBytes, 8, 2);
      if (additional) {
        additional = protoPayload(moduleBytes, additional);
        // AdditionalType.GOODS=2 / AdditionGoods oneof(3). Remove the whole
        // attached module, but keep the UP's video, prose, votes, and stats.
        if (smallVarintField(additional, 1) === 2 || findProtoField(additional, 3, 2)) {
          return { changed: 1, remove: true };
        }
      }
      recommendation = findProtoField(moduleBytes, 18, 2);
      if (recommendation && findProtoField(protoPayload(moduleBytes, recommendation), 6, 2)) {
        return { changed: 1, remove: true };
      }
      return null;
    });
  }

  function transformDynamicList(input) {
    return rewriteProtoMessage(input, function (field, bytes) {
      var item;
      var nested;
      if (field.fieldNumber !== 1 || field.wireType !== 2) {
        return null;
      }
      item = protoPayload(bytes, field);
      if (dynamicItemIsAd(item)) {
        return { changed: 1, remove: true };
      }
      nested = transformDynamicItem(item);
      if (!nested.valid) {
        return { invalid: true };
      }
      return nested.changed > 0 ? { changed: nested.changed, payload: nested.body } : null;
    });
  }

  function transformDynamic(input, personal) {
    if (personal) {
      return transformDynamicList(input);
    }
    var result = rewriteProtoMessage(input, function (field, bytes) {
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
    result.reason = result.changed > 0 ? "ios990-dynamic-commercial-removed" : "no-ad-fields";
    result.schema = "dynamic-v2-list";
    return result;
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
      if (
        field.fieldNumber === 28 &&
        field.wireType === 2 &&
        includes(
          [3, 5],
          smallVarintField(protoPayload(bytes, field), 1)
        )
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
      case "grpc-view-unite-ai-relate-async":
        return transformViewUniteAiRelateAsync(input, config);
      case "grpc-mine-pub-module":
        return transformMinePubModule(input, config);
      case "grpc-mine-device-feature":
        return transformDeviceFeature(input);
      case "grpc-resource-module-list":
        return transformResourceModuleList(input);
      case "grpc-popular":
        return transformPopular(input, config);
      case "grpc-dynamic":
      case "grpc-dynamic-video":
        return transformDynamic(input, false);
      case "grpc-dynamic-personal":
        return transformDynamic(input, true);
      case "grpc-dm-view":
        return transformDmView(input);
      case "grpc-search-all":
        return transformSearch(input, 4);
      case "grpc-search-by-type":
        return transformSearch(input, 6);
      case "grpc-search-default-words":
        return transformEmptyKnownGrpcReply(input);
      case "grpc-story-bottom-diversion":
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

  function grpcResponseHasError(context) {
    var status = headerValue(context && context.responseHeaders, "grpc-status");
    var trailerStatus = headerValue(context && context.responseTrailers, "grpc-status");
    var httpStatus = String(context && context.responseStatus || "").match(/(?:^|\s)(\d{3})(?:\s|$)/);
    return Boolean((status && status !== "0") || (trailerStatus && trailerStatus !== "0") ||
      (httpStatus && Number(httpStatus[1]) >= 400));
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
    if (grpcResponseHasError(context)) {
      return { body: original, changed: 0, endpoint: endpoint, frames: frames.length,
        reason: "grpc-error-response", valid: true };
    }
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
    var remaining = MAX_GRPC_DECOMPRESSED_BYTES;
    if (grpcResponseHasError(context)) {
      return Promise.resolve({ body: original, changed: 0, endpoint: endpoint, frames: frames.length,
        reason: "grpc-error-response", valid: true });
    }

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
    if (
      !grpcEndpointEnabled(endpoint, effectiveConfig) &&
      (endpoint || !effectiveConfig.debug)
    ) {
      return Promise.resolve({
        body: original,
        changed: 0,
        endpoint: endpoint,
        frames: frames.length,
        reason: endpoint ? "feature-disabled" : "endpoint-unmatched",
        valid: true
      });
    }

    // Share one output budget and decode serially to bound peak memory in JSC.
    tasks = Promise.resolve([]);
    frames.forEach(function (frame) {
      tasks = tasks.then(function (entries) {
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
            ? decompressGzip(payload, remaining)
            : Promise.resolve(payload);
        return payloadPromise.then(function (decoded) {
          remaining -= decoded.length;
          if (remaining < 0) {
            throw new Error("decompressed gRPC response is too large");
          }
          entries.push({
            decoded: decoded,
            frame: frame,
            result: transformGrpcPayload(
              decoded,
              endpoint,
              effectiveConfig,
              context
            )
          });
          return entries;
        });
      });
    });

    return tasks.then(
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
            (!endpoint ? "endpoint-unmatched" : "") ||
            Object.keys(reasons)[0] ||
            (changed > 0 ? "changed" : "no-ad-fields"),
          schema: Object.keys(schemas).join(","),
          topFields: protoPayloadTopFieldSummaryForLog(
            entries.map(function (value) { return value.decoded; })
          ),
          valid: true
        };
      },
      function (error) {
        return {
          body: original,
          changed: 0,
          endpoint: endpoint,
          frames: frames.length,
          reason:
            error && /unsupported/i.test(String(error.message || error))
              ? "unsupported-grpc-compression"
              : error && /too large/i.test(String(error.message || error))
                ? "grpc-size-limit"
                : "gzip-decode-failed",
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
    var length = 0;
    var index;
    var code;
    if (bytes) {
      return bytes.length;
    }
    if (typeof body !== "string") {
      return 0;
    }
    for (index = 0; index < body.length; index += 1) {
      code = body.charCodeAt(index);
      if (code >= 0xd800 && code <= 0xdbff && index + 1 < body.length &&
          body.charCodeAt(index + 1) >= 0xdc00 && body.charCodeAt(index + 1) <= 0xdfff) {
        length += 4;
        index += 1;
      } else {
        length += code < 0x80 ? 1 : code < 0x800 ? 2 : 3;
      }
    }
    return length;
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

  function grpcTopFieldSummaryForLog(body) {
    var parsed = parseGrpcFrames(body);
    var counts = {};
    var index;
    var fields;
    var fieldIndex;
    if (!parsed.valid) {
      return "invalid";
    }
    for (index = 0; index < parsed.frames.length; index += 1) {
      if (parsed.frames[index].flag !== 0) {
        continue;
      }
      fields = parseProtoFields(
        parsed.body.slice(
          parsed.frames[index].payloadStart,
          parsed.frames[index].end
        )
      );
      if (!fields) {
        continue;
      }
      for (fieldIndex = 0; fieldIndex < fields.length; fieldIndex += 1) {
        counts[fields[fieldIndex].fieldNumber] =
          (counts[fields[fieldIndex].fieldNumber] || 0) + 1;
      }
    }
    return Object.keys(counts)
      .sort(function (left, right) { return Number(left) - Number(right); })
      .slice(0, 24)
      .map(function (fieldNumber) {
        return fieldNumber + ":" + counts[fieldNumber];
      })
      .join("|") || "none";
  }

  function protoPayloadTopFieldSummaryForLog(payloads) {
    var counts = {};
    var index;
    var fields;
    var fieldIndex;
    if (!Array.isArray(payloads)) {
      return "none";
    }
    for (index = 0; index < payloads.length; index += 1) {
      fields = parseProtoFields(payloads[index]);
      if (!fields) {
        continue;
      }
      for (fieldIndex = 0; fieldIndex < fields.length; fieldIndex += 1) {
        counts[fields[fieldIndex].fieldNumber] =
          (counts[fields[fieldIndex].fieldNumber] || 0) + 1;
      }
    }
    return Object.keys(counts)
      .sort(function (left, right) { return Number(left) - Number(right); })
      .slice(0, 24)
      .map(function (fieldNumber) {
        return fieldNumber + ":" + counts[fieldNumber];
      })
      .join("|") || "none";
  }

  function appVersionForLog(headers) {
    var userAgent = headerValue(headers, "user-agent");
    var version = headerValue(headers, "x-bili-version");
    var build = headerValue(headers, "x-bili-build");
    var match;
    if (!version) {
      match = /(?:bili(?:bili)?|bili-(?:universal|inter|blue|hd))[^\d]{0,8}(\d{1,2}\.\d{1,2}\.\d{1,2}|\d{3,9})/i.exec(userAgent);
      version = match ? match[1] : "unknown";
    }
    if (!build) {
      match = /\bbuild[/: ]+(\d{3,12})/i.exec(userAgent);
      build = match ? match[1] : "unknown";
    }
    return "version=" + String(version || "unknown").slice(0, 32) +
      " build=" + String(build || "unknown").slice(0, 32);
  }

  function logDiagnostic(
    result,
    transport,
    body,
    responseHeaders,
    requestUrl,
    requestHeaders
  ) {
    var contentType = headerValue(responseHeaders, "content-type")
      .split(";")[0]
      .trim()
      .toLowerCase();
    var contentEncoding = headerValue(responseHeaders, "content-encoding") || "identity";
    var parsedUrl = endpointRegistry && endpointRegistry.parseRequestUrl
      ? endpointRegistry.parseRequestUrl(requestUrl)
      : null;
    var registryRow = endpointRegistry && endpointRegistry.classify
      ? endpointRegistry.classify(requestUrl, {
          responseFilter: true,
          transport: transport === "json" || transport === "grpc"
            ? transport
            : undefined
        })
      : null;
    var requestMethod =
      typeof $request !== "undefined" && $request
        ? String($request.method || "unknown").toUpperCase().slice(0, 12)
        : "unknown";
    var responseStatus =
      typeof $response !== "undefined" && $response
        ? String($response.statusCode || $response.status || "unknown").slice(0, 24)
        : "unknown";
    var responseTrailers = typeof $response !== "undefined" && $response ? $response.h2_trailers : null;
    var outputHeaders = transport === "grpc" ? normalizeGrpcResponseHeaders(
      responseHeaders,
      result.valid && result.changed > 0 ? result.body : body,
      result.valid && result.reason !== "grpc-error-response" ? requestHeaders : {},
      { bodyChanged: Boolean(result.valid && result.changed > 0), responseTrailers: responseTrailers }
    ) : null;
    safeLog(
      "host=" + (parsedUrl ? parsedUrl.host : "unknown") +
        " path=" + (parsedUrl ? parsedUrl.path : "unknown") +
        " registry=" +
        (result.registryId || (registryRow ? registryRow.id : "unmatched")) +
        " method=" +
        requestMethod +
        " status=" +
        responseStatus +
        " " + appVersionForLog(requestHeaders) +
        " handler=" +
        (result.endpoint || "unmatched") +
        " transport=" +
        transport +
        " contentType=" +
        (contentType || "unknown") +
        " contentEncoding=" +
        contentEncoding +
        " grpcEncoding=" +
        (headerValue(responseHeaders, "grpc-encoding") || "identity") +
        " grpcStatus=" +
        (headerValue(responseHeaders, "grpc-status") || "none") +
        " grpcStatusOut=" + (headerValue(outputHeaders, "grpc-status") || "none") +
        " trailersStatus=" + (headerValue(responseTrailers, "grpc-status") || "none") +
        " requestNoStore=" + (/\bno-store\b/i.test(headerValue(requestHeaders, "cache-control")) ? 1 : 0) +
        " mossEngine=" + (headerValue(requestHeaders, "x-bili-moss-engine-type") || "none").slice(0, 8) +
        " runtime=" + (root.__BILIFLOW_VERSION__ || "source") +
        " gzipCodec=" + (gzipCodec ? "bundled" : "host") +
        " writeBack=" + (result.valid && result.changed > 0 ? "body" : "headers-only") +
        " bodyBytes=" +
        bodyLengthForLog(body) +
        " outputBytes=" + bodyLengthForLog(result.valid && result.changed > 0 ? result.body : body) +
        " frames=" +
        (result.frames || 0) +
        (
          transport === "grpc"
            ? " frameFlags=" + grpcFrameSummaryForLog(body) +
              " topFields=" +
              (result.topFields || grpcTopFieldSummaryForLog(body))
            : ""
        ) +
        " changed=" +
        (result.changed || 0) +
        " removed=" +
        (result.removed || result.changed || 0) +
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
        (
          Array.isArray(result.matchedPaths) &&
          result.matchedPaths.length > 0
            ? " paths=" + result.matchedPaths.join("|")
            : ""
        ) +
        (
          Array.isArray(result.observedTypes) &&
          result.observedTypes.length > 0
            ? " types=" + result.observedTypes.join("|")
            : ""
        ) +
        " reason=" +
        (result.reason || (result.valid ? "no-op" : "fail-open"))
    );
  }

  function isVolatileJsonEndpoint(endpoint) {
    var index;
    var value;
    if (!endpointRegistry || !Array.isArray(endpointRegistry.REGISTRY)) {
      return false;
    }
    for (index = 0; index < endpointRegistry.REGISTRY.length; index += 1) {
      value = endpointRegistry.REGISTRY[index];
      if (
        value.transport === "json" &&
        value.handler === endpoint &&
        value.volatile
      ) {
        return true;
      }
    }
    return false;
  }

  function isVolatileGrpcEndpoint(endpoint) {
    var index;
    var value;
    if (!endpointRegistry || !Array.isArray(endpointRegistry.REGISTRY)) {
      return false;
    }
    for (index = 0; index < endpointRegistry.REGISTRY.length; index += 1) {
      value = endpointRegistry.REGISTRY[index];
      if (
        value.transport === "grpc" &&
        value.handler === endpoint &&
        value.volatile
      ) {
        return true;
      }
    }
    return false;
  }

  function isVolatileResponseUrl(requestUrl, transport) {
    var matched = endpointRegistry && endpointRegistry.classify
      ? endpointRegistry.classify(requestUrl, {
          responseFilter: true,
          transport: transport
        })
      : null;
    return Boolean(matched && matched.volatile);
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

  function deleteHeaderFrom(headers, name) {
    var keys = Object.keys(headers || {});
    var index;
    for (index = 0; index < keys.length; index += 1) {
      if (keys[index].toLowerCase() === String(name).toLowerCase()) {
        delete headers[keys[index]];
      }
    }
  }

  function setHeaderOn(headers, name, value) {
    deleteHeaderFrom(headers, name);
    headers[name] = value;
  }

  function normalizeGrpcResponseHeaders(headers, body, requestHeaders, options) {
    var output = {};
    var keys = isPlainObject(headers) ? Object.keys(headers) : [];
    var index;
    var key;
    var contentType = headerValue(headers, "content-type");
    var userAgent = headerValue(requestHeaders, "user-agent").toLowerCase();
    var mossEngine = headerValue(
      requestHeaders,
      "x-bili-moss-engine-type"
    );
    var grpcStatus = headerValue(headers, "grpc-status");
    var trailerStatus = headerValue(options && options.responseTrailers, "grpc-status");
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      if (!/^(?:age|cache-control|content-length|etag|expires|last-modified|pragma)$/i.test(key)) {
        output[key] = headers[key];
      }
    }
    setHeaderOn(
      output,
      "Content-Type",
      /^application\/grpc(?:\+proto)?(?:;|$)/i.test(contentType)
        ? contentType
        : "application/grpc"
    );
    setHeaderOn(output, "Cache-Control", "no-store, no-cache, must-revalidate");
    setHeaderOn(output, "Pragma", "no-cache");
    if (parseGrpcFrames(body).valid && !hasCompressedGrpcFrame(body)) {
      deleteHeaderFrom(output, "grpc-encoding");
    }
    if (options && options.bodyChanged) {
      deleteHeaderFrom(output, "content-encoding");
    }
    // Never replace a real RPC error with success. New overseas branding can
    // change the UA; use the engine with the reviewed legacy white-client exception.
    if ((!grpcStatus || grpcStatus === "0") && !trailerStatus) {
      if (/bili-inter\//i.test(userAgent) && !/bili-inter\/(?:[6-9]|\d{2,})\.\d+/i.test(userAgent)) {
        deleteHeaderFrom(output, "grpc-status");
      } else if (mossEngine === "1" || /bili-blue\//i.test(userAgent)) {
        setHeaderOn(output, "grpc-status", "0");
      }
    }
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

  function completionForGrpcResult(result, responseHeaders, requestHeaders, body) {
    var completion = {};
    var outputBody =
      result && result.valid && result.changed > 0
        ? result.body
        : body;
    if (result && result.valid && result.changed > 0) {
      completion.body = result.body;
    }
    completion.headers = normalizeGrpcResponseHeaders(
      responseHeaders,
      outputBody,
      result && result.valid && result.reason !== "grpc-error-response" ? requestHeaders : {},
      {
        bodyChanged: Boolean(result && result.valid && result.changed > 0),
        responseTrailers: typeof $response !== "undefined" && $response ? $response.h2_trailers : null
      }
    );
    if (typeof $response !== "undefined" && $response && $response.h2_trailers !== undefined) {
      completion.h2_trailers = $response.h2_trailers;
    }
    return completion;
  }

  function rawResponseBody(response) {
    if (!response) {
      return null;
    }
    if (response.bodyBytes !== undefined && response.bodyBytes !== null) {
      return response.bodyBytes;
    }
    return response.body;
  }

  function responseBodyForEndpoint(response, grpcEndpoint) {
    var body;
    var bytes;
    var decoded;
    if (!response) {
      return null;
    }
    if (
      grpcEndpoint &&
      response.bodyBytes !== undefined &&
      response.bodyBytes !== null
    ) {
      return response.bodyBytes;
    }
    body = response.body;
    if (!grpcEndpoint && typeof body !== "string") {
      bytes = toUint8Array(body);
      if (!bytes && response.bodyBytes !== undefined) {
        bytes = toUint8Array(response.bodyBytes);
      }
      if (bytes) {
        decoded = decodeUtf8Strict(bytes);
        return decoded === null ? null : decoded;
      }
    }
    return body;
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
    var rawBody;
    var response;
    var transport;
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
            : null,
        responseTrailers: typeof $response !== "undefined" && $response ? $response.h2_trailers : null,
        responseStatus: typeof $response !== "undefined" && $response ? $response.statusCode || $response.status : null
      };
      response = typeof $response !== "undefined" ? $response : null;
      rawBody = rawResponseBody(response);
      transport = endpointRegistry && endpointRegistry.detectTransport
        ? endpointRegistry.detectTransport({
            body: rawBody,
            contentType: headerValue(
              context.responseHeaders,
              "content-type"
            )
          })
        : (grpcEndpoint ? "grpc" : typeof rawBody === "string" ? "json" : "binary");
      if (
        grpcEndpoint &&
        (transport === "binary" || transport === "unknown")
      ) {
        transport = "grpc";
      }
      preventCaching =
        isVolatileResponseUrl(requestUrl, transport) ||
        isVolatileGrpcEndpoint(grpcEndpoint) ||
        isVolatileJsonEndpoint(endpoint);
      body = responseBodyForEndpoint(
        response,
        transport === "grpc"
      );
      if (transport === "grpc") {
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
                context.responseHeaders,
                requestUrl,
                context.requestHeaders
              );
            }
            if (
              asyncResult.valid &&
              asyncResult.changed > 0
            ) {
              $done(
                completionForGrpcResult(
                  asyncResult,
                  context.responseHeaders,
                  context.requestHeaders,
                  body
                )
              );
              return;
            }
            $done(
              completionForGrpcResult(
                asyncResult,
                context.responseHeaders,
                context.requestHeaders,
                body
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
              completionForGrpcResult(
                null,
                context.responseHeaders,
                context.requestHeaders,
                body
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
            context.responseHeaders,
            requestUrl,
            context.requestHeaders
          );
        }
        if (result.valid && result.changed > 0) {
          $done(
            completionForGrpcResult(
              result,
              context.responseHeaders,
              context.requestHeaders,
              body
            )
          );
          return;
        }
        $done(
          completionForGrpcResult(
            result,
            context.responseHeaders,
            context.requestHeaders,
            body
          )
        );
        return;
      }
      if (typeof body !== "string") {
        if (config.debug) {
          logDiagnostic(
            {
              changed: 0,
              endpoint: "",
              reason: transport === "binary"
                ? "unknown-binary"
                : "body-unavailable",
              valid: true
            },
            transport,
            body,
            context.responseHeaders,
            requestUrl,
            context.requestHeaders
          );
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
        config.ads &&
        config.homeFeedRefill &&
        String(typeof $request !== "undefined" && $request && $request.method || "GET").toUpperCase() === "GET" &&
        result.reason !== "api-error-response" &&
        endpoint === "feed" &&
        config.homeFeedVideoOnly !== false &&
        (
          filteredFeedLength(result) > 0 ||
          result.reason === "feed-all-commercial-blocked"
        ) &&
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
                context.responseHeaders,
                requestUrl,
                context.requestHeaders
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
          context.responseHeaders,
          requestUrl,
          context.requestHeaders
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
        transport === "grpc" && typeof $response !== "undefined" && $response
          ? {
              headers: normalizeGrpcResponseHeaders(
                $response.headers,
                rawBody,
                typeof $request !== "undefined" && $request
                  ? $request.headers
                  : null
              )
            }
          : preventCaching &&
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
    grpcTopFieldSummaryForLog: grpcTopFieldSummaryForLog,
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
    normalizeGrpcResponseHeaders: normalizeGrpcResponseHeaders,
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
