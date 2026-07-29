/* HASBoot: the reel intro. An isometric Macintosh on a dotted plane;
   floppies fly in and slot home, the machine squashes on each hit, the
   bar steps up, then the camera dives into the screen and dissolves to
   black. Plays once per visit over the reel while Vimeo loads under it
   (wired in os.js; desktop only). Click skips; reduced motion skips all.
   Palette matches the site tokens (paper/ink/desk), software-rendered
   into a 480px buffer and scaled up pixelated.

   HASBoot.mount(canvas, { res:480, aspect:16/9, zoom:true, loop:false,
                           hold:340, fadeOut:true, onDone:fn })
   fadeOut adds .gone to the canvas when done (CSS owns the fade). */
var HASBoot = (function () {
"use strict";

/* ---------- font ---------- */
var RAW={
"A":"01110,10001,10001,11111,10001,10001,10001","B":"11110,10001,10001,11110,10001,10001,11110",
"C":"01110,10001,10000,10000,10000,10001,01110","D":"11110,10001,10001,10001,10001,10001,11110",
"E":"11111,10000,10000,11110,10000,10000,11111","F":"11111,10000,10000,11110,10000,10000,10000",
"G":"01110,10001,10000,10111,10001,10001,01111","H":"10001,10001,10001,11111,10001,10001,10001",
"I":"11111,00100,00100,00100,00100,00100,11111","J":"00111,00010,00010,00010,00010,10010,01100",
"K":"10001,10010,10100,11000,10100,10010,10001","L":"10000,10000,10000,10000,10000,10000,11111",
"M":"10001,11011,10101,10101,10001,10001,10001","N":"10001,11001,10101,10101,10011,10001,10001",
"O":"01110,10001,10001,10001,10001,10001,01110","P":"11110,10001,10001,11110,10000,10000,10000",
"Q":"01110,10001,10001,10001,10101,10010,01101","R":"11110,10001,10001,11110,10100,10010,10001",
"S":"01111,10000,10000,01110,00001,00001,11110","T":"11111,00100,00100,00100,00100,00100,00100",
"U":"10001,10001,10001,10001,10001,10001,01110","V":"10001,10001,10001,10001,10001,01010,00100",
"W":"10001,10001,10001,10101,10101,11011,10001","X":"10001,10001,01010,00100,01010,10001,10001",
"Y":"10001,10001,01010,00100,00100,00100,00100","Z":"11111,00001,00010,00100,01000,10000,11111",
"0":"01110,10001,10011,10101,11001,10001,01110","1":"00100,01100,00100,00100,00100,00100,01110",
"2":"01110,10001,00001,00010,00100,01000,11111","3":"11111,00010,00100,00010,00001,10001,01110",
"4":"00010,00110,01010,10010,11111,00010,00010","5":"11111,10000,11110,00001,00001,10001,01110",
"6":"00110,01000,10000,11110,10001,10001,01110","7":"11111,00001,00010,00100,01000,01000,01000",
"8":"01110,10001,10001,01110,10001,10001,01110","9":"01110,10001,10001,01111,00001,00010,01100",
" ":"00000,00000,00000,00000,00000,00000,00000",".":"00000,00000,00000,00000,00000,01100,01100",
"-":"00000,00000,00000,01110,00000,00000,00000","!":"00100,00100,00100,00100,00100,00000,00100",
"/":"00001,00001,00010,00100,01000,10000,10000",":":"00000,01100,01100,00000,01100,01100,00000"
};
var F={};for(var fk in RAW)F[fk]=RAW[fk].split(",");

/* ---------- palette (site tokens: paper #f4f2ec, ink #111, desk #c8c4b8) ---------- */
function C(h){var r=(h>>16)&255,g=(h>>8)&255,b=h&255;return (0xFF000000|(b<<16)|(g<<8)|r)|0;}
var BG=C(0xf4f2ec), DOT=C(0xc8c4b8), SHDW=C(0xd9d5c8),
    TOP_L=C(0xf2efe8), TOP_M=C(0xe3e0d7), TOP_E=C(0xcac7bc),
    FR_H=C(0xdedbd2), FR_B=C(0xcac7bc), FR_M=C(0xb6b3a8), FR_D=C(0x8f8c82),
    FR_E=C(0xa19e94),
    SD_L=C(0x9f9c92), SD_D=C(0x8a877e), SD_K=C(0x6f6c64),
    INK=C(0x2a2922), RIM=C(0x57544a), SCR=C(0xece9df), SCR_G=C(0xf8f6ef),
    FACE=C(0x111111), BASE_T=C(0xb6b3a8), BASE_F=C(0x8f8c82),
    TRACK=C(0xc8c4b8), FILL=C(0x111111), TEXT=C(0x111111), TEXT2=C(0x76736a),
    FL_K=C(0x2a2822), FL_B=C(0x4a4740), FL_S=C(0xa8a49a), BLACK=C(0x000000);
var LABELS=[C(0xdcc9a2),C(0xc4d6cc),C(0xd8c2ca),C(0xc2c8dc),C(0xd4d0bb),C(0xc7d7c2)];

/* ---------- world ---------- */
var BX=1,BY=1,BZ=3,BW=16,BD=24,BH=38;      /* the machine */
var SLOT={x:BX+BW,y:BY+6.5,z:BZ+7};
var ITEMS=["SPAWNING PARTICLES","WAKING 3D MODELS","TUNING AUDIO","WARMING UNREAL SHOTS","ALIGNING UI PIXELS","LOOPING UNITY SIMS"];
var N=ITEMS.length;

var TL={drop:120,dropDur:520,first:820,gap:400,flight:420,insert:210,
        rest:600,zoom:0,zoomDur:880};
TL.lastInsert=TL.first+(N-1)*TL.gap+TL.flight;
TL.zoom=TL.lastInsert+TL.insert+TL.rest;
var ZEND=TL.zoom+TL.zoomDur;

var BAYER=[0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,
 12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,
 3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,
 15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21];

function cl(v){return v<0?0:v>1?1:v;}
function lerp(a,b,t){return a+(b-a)*t;}
function easeOut(p){return 1-Math.pow(1-cl(p),3);}
function easeIn(p){p=cl(p);return p*p*p;}
function bounce(p){ /* drop with a settle */
  p=cl(p);
  return 1-Math.pow(2,-9*p)*Math.abs(Math.cos(p*Math.PI*2.1));
}
function spring(dt,dur){
  if(dt<0||dt>dur)return 0;
  return Math.sin(dt/dur*Math.PI*2.6)*Math.exp(-dt/(dur*0.34));
}

/* ===================================================================== */
function mount(canvas,opts){
  opts=opts||{};
  var ctx=canvas.getContext("2d",{alpha:false});
  var res=opts.res||480,aspect=opts.aspect||16/9;
  var doZoom=opts.zoom!==false,loop=!!opts.loop;
  var hold=opts.hold===undefined?340:opts.hold;
  var fadeOut=opts.fadeOut!==false,onDone=opts.onDone||null;
  var W=res,H=Math.round(res/aspect),img,u32;
  var END=doZoom?ZEND:TL.zoom+400;
  /* t advances by clamped frame deltas, not wall clock: a hidden tab
     (rAF suspended) pauses the show instead of skipping past it */
  var mode="boot",t=0,lastTs=null,raf=null,fired=false;
  var S=1,OX=0,OY=0;
  var RM=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function alloc(){
    W=res;H=Math.round(res/aspect);
    canvas.width=W;canvas.height=H;
    img=ctx.createImageData(W,H);
    u32=new Uint32Array(img.data.buffer);
  }
  alloc();

  /* ---------- 2D helpers ---------- */
  function solid(x,y,w,h,c){
    var x0=Math.max(0,Math.round(x)),y0=Math.max(0,Math.round(y));
    var x1=Math.min(W,Math.round(x+w)),y1=Math.min(H,Math.round(y+h));
    for(var yy=y0;yy<y1;yy++){var r=yy*W;for(var xx=x0;xx<x1;xx++)u32[r+xx]=c;}
  }
  function put(x,y,c){x|=0;y|=0;if(x>=0&&x<W&&y>=0&&y<H)u32[y*W+x]=c;}
  function glyph(str,x,y,s,c){
    s=s||1;str=String(str).toUpperCase();
    var cx=x,i,r,k,g,ox,oy;
    for(i=0;i<str.length;i++){
      g=F[str[i]];
      if(g)for(r=0;r<7;r++)for(k=0;k<5;k++)
        if(g[r][k]==="1")for(oy=0;oy<s;oy++)for(ox=0;ox<s;ox++)put(cx+k*s+ox,y+r*s+oy,c);
      cx+=6*s;
    }
  }
  function twid(str,s){return str.length*6*s-s;}

  /* ---------- iso ---------- */
  function sxOf(x,y){return OX+(x-y)*2*S;}
  function syOf(x,y,z){return OY+((x+y)-2*z)*S;}

  function isoBox(bx,by,bz,bw,bd,bh,samp,clipX){
    var minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9,i,X,Y,Z,sx,sy;
    for(i=0;i<8;i++){
      X=(i&1)?bx+bw:bx;Y=(i&2)?by+bd:by;Z=(i&4)?bz+bh:bz;
      sx=sxOf(X,Y);sy=syOf(X,Y,Z);
      if(sx<minX)minX=sx;if(sx>maxX)maxX=sx;
      if(sy<minY)minY=sy;if(sy>maxY)maxY=sy;
    }
    var x0=Math.max(0,Math.floor(minX)),x1=Math.min(W-1,Math.ceil(maxX));
    var y0=Math.max(0,Math.floor(minY)),y1=Math.min(H-1,Math.ceil(maxY));
    if(x0>x1||y0>y1)return;
    var xr=bx+bw,yl=by+bd,zt=bz+bh,inv2S=1/(2*S),invS=1/S;
    for(var py=y0;py<=y1;py++){
      var b=(py+0.5-OY)*invS,row=py*W;
      for(var px=x0;px<=x1;px++){
        var a=(px+0.5-OX)*inv2S,bd_=-1e9,bc=0,d,c,q,r;
        /* top */
        q=(a+b+2*zt)/2;r=(b+2*zt-a)/2;
        if(q>=bx&&q<xr&&r>=by&&r<yl){
          d=q+r+zt;
          if(d>bd_&&(clipX===undefined||q>=clipX)){c=samp(0,q-bx,r-by);if(c!==0){bd_=d;bc=c;}}
        }
        /* front (+x) */
        r=xr-a;q=(2*xr-a-b)/2;
        if(r>=by&&r<yl&&q>=bz&&q<zt){
          d=xr+r+q;
          if(d>bd_&&(clipX===undefined||xr>=clipX)){c=samp(1,r-by,q-bz);if(c!==0){bd_=d;bc=c;}}
        }
        /* side (+y) */
        q=a+yl;r=(a+2*yl-b)/2;
        if(q>=bx&&q<xr&&r>=bz&&r<zt){
          d=q+yl+r;
          if(d>bd_&&(clipX===undefined||q>=clipX)){c=samp(2,q-bx,r-bz);if(c!==0){bd_=d;bc=c;}}
        }
        if(bc!==0)u32[row+px]=bc;
      }
    }
  }

  /* ground plane patch, dithered */
  function ground(gx,gy,gw,gd,col,dith){
    var minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9,i,X,Y,sx,sy;
    for(i=0;i<4;i++){
      X=(i&1)?gx+gw:gx;Y=(i&2)?gy+gd:gy;
      sx=sxOf(X,Y);sy=syOf(X,Y,0);
      if(sx<minX)minX=sx;if(sx>maxX)maxX=sx;
      if(sy<minY)minY=sy;if(sy>maxY)maxY=sy;
    }
    var x0=Math.max(0,Math.floor(minX)),x1=Math.min(W-1,Math.ceil(maxX));
    var y0=Math.max(0,Math.floor(minY)),y1=Math.min(H-1,Math.ceil(maxY));
    for(var py=y0;py<=y1;py++){
      var b=(py+0.5-OY)/S,row=py*W;
      for(var px=x0;px<=x1;px++){
        var a=(px+0.5-OX)/(2*S);
        var x=(a+b)/2,y=(b-a)/2;
        if(x<gx||x>=gx+gw||y<gy||y>=gy+gd)continue;
        if(dith&&((px+py)&1))continue;
        u32[row+px]=col;
      }
    }
  }

  /* ---------- textures ---------- */
  var expr=0,eyeDX=0;
  function facePix(u,v){
    var lx=4+eyeDX,rx=10+eyeDX;
    if(expr===2){ if(v===4&&((u>=lx-1&&u<=lx+2)||(u>=rx-1&&u<=rx+2)))return 1; }
    else if(expr===1||expr===3){
      if(v===3&&((u>=lx&&u<=lx+1)||(u>=rx&&u<=rx+1)))return 1;
      if(v===4&&(u===lx-1||u===lx+2||u===rx-1||u===rx+2))return 1;
    } else if((v===3||v===4)&&((u>=lx&&u<=lx+1)||(u>=rx&&u<=rx+1)))return 1;
    if(u>=7&&u<=8&&v>=6&&v<=7)return 1;
    if(u>=6&&u<=8&&v===8)return 1;
    if(expr===3){
      if(v===10&&u>=3&&u<=12)return 1;
      if(v===11&&(u===3||u===12))return 1;
      if(v===12&&u>=4&&u<=11)return 1;
      return 0;
    }
    if(v===10&&((u>=3&&u<=4)||(u>=11&&u<=12)))return 1;
    if(v===11&&((u>=4&&u<=5)||(u>=10&&u<=11)))return 1;
    if(v===12&&u>=6&&u<=9)return 1;
    return 0;
  }
  var screenDark=0;   /* 0 = live, 1 = black, for the dive */
  function macSamp(face,u,v){
    u=Math.floor(u);v=Math.floor(v);
    if(face===0){                                    /* top */
      if(u<=0||u>=BW-1||v<=0||v>=BD-1)return TOP_E;
      if(v>=BD-3)return TOP_M;
      if(u>=3&&u<=BW-4&&v>=4&&v<=BD-6&&(v%3===0))return TOP_M;
      return u<3?TOP_M:TOP_L;
    }
    if(face===2){                                    /* flank */
      if(v>=BH-1)return SD_L;
      if(v<=0||u<=0)return SD_K;
      if(u>=BW-1)return SD_L;
      if(v>=BH-9&&v<=BH-4&&u>=3&&u<=BW-4&&((u-3)%3===0))return SD_K;
      if(v<=3)return SD_K;
      return v>BH-13?SD_L:SD_D;
    }
    var m=BD-1-u;                                    /* front, mirrored */
    if(v>=BH-2)return FR_H;
    if(m>=2&&m<=21&&v>=18&&v<=35){
      if(m>=4&&m<=19&&v>=20&&v<=33){
        if(screenDark>0.5)return BLACK;
        var fu=m-4,fv=33-v;
        if(facePix(fu,fv))return FACE;
        if(fu<=3&&fv<=2&&fu+fv<=3)return SCR_G;
        return SCR;
      }
      if(m>=3&&m<=20&&v>=19&&v<=34)return RIM;
      return INK;
    }
    if(m>=12&&m<=21&&v>=6&&v<=8)return INK;
    if(m>=12&&m<=21&&v===5)return FR_H;
    if(m>=3&&m<=4&&v>=6&&v<=7)return FR_D;
    if(m>=3&&m<=8&&v===2)return FR_M;
    if(v<=0||m<=0||m>=BD-1)return FR_E;
    return v>BH-6?FR_H:(v<5?FR_M:FR_B);
  }
  function baseSamp(face){
    return face===0?BASE_T:(face===1?BASE_F:C(0x76767f));
  }
  var flopLabel=LABELS[0];
  function flopSamp(face,u,v){
    u=Math.floor(u);v=Math.floor(v);
    if(face!==0)return face===1?FL_K:FL_B;
    if(u===0||u===7||v===0||v===7)return FL_K;
    if(v>=1&&v<=2&&u>=2&&u<=5)return FL_S;
    if(v>=4&&v<=6&&u>=1&&u<=6)return flopLabel;
    return FL_B;
  }

  /* ---------- floppies ---------- */
  function flopState(i,t){
    var st=TL.first+i*TL.gap;
    var p=(t-st)/TL.flight;
    if(p<0)return null;
    if(p>1+TL.insert/TL.flight)return null;
    var e=easeOut(Math.min(1,p));
    var x=lerp(SLOT.x+34,SLOT.x+5,e);
    var y=lerp(SLOT.y-26,SLOT.y-5,e);
    var z=lerp(SLOT.z+30,SLOT.z-1,e)+Math.sin(cl(p)*Math.PI)*7;
    if(p>1){                                  /* slide home */
      var q=(p-1)*TL.flight/TL.insert;
      x=lerp(SLOT.x+5,SLOT.x-9,easeIn(q));
    }
    return {x:x,y:y,z:z,i:i,landed:p>1};
  }

  /* ---------- frame ---------- */
  function frame(t){
    if(doZoom&&t>=ZEND){solid(0,0,W,H,BLACK);return;}

    var base=Math.max(1,Math.round(H/270));
    S=base;
    var zoomP=doZoom?cl((t-TL.zoom)/TL.zoomDur):0;
    if(zoomP>0)S=base*(1+easeIn(zoomP)*26);

    /* squash from every insert, plus the drop */
    var sq=0,i;
    for(i=0;i<N;i++)sq+=spring(t-(TL.first+i*TL.gap+TL.flight),420)*(i===N-1?1.5:1);
    var drop=t<TL.drop?0:bounce((t-TL.drop)/TL.dropDur);
    var lift=(1-drop)*44;
    var hop=Math.max(0,-sq)*3;
    var bh=BH*(1-sq*0.10), bw=BW*(1+sq*0.05), bd=BD*(1+sq*0.05);
    var bz=BZ+lift+hop;
    var bob=Math.sin(t/900)*0.6;
    bz+=bob;

    /* layout derived from the actual silhouette */
    var sxMin=(BX-(BY+BD))*2, sxMax=((BX+BW)-BY)*2;
    var syMin=(BX+BY)-2*(BZ+BH), syMax=(BX+BW+1)+(BY+BD+1);
    var blockH=(syMax-syMin)*base;
    var cs=Math.max(1,Math.round(H/150)), is=Math.max(1,Math.round(H/280));
    var gapA=Math.round(H*0.062), gapB=Math.round(H*0.042), gapC=Math.round(H*0.040);
    var barH2=Math.max(3,Math.round(H*0.017));
    var totalH=blockH+gapA+7*cs+gapB+barH2+gapC+7*is;
    var blockTop=Math.round((H-totalH)/2);
    OX=Math.round(W/2-(sxMin+sxMax)/2*base);
    OY=Math.round(blockTop-syMin*base);
    var scrCx=BX+BW, scrCy=BY+11.5, scrCz=BZ+26.5;
    if(zoomP>0){
      OX=Math.round(W/2-(scrCx-scrCy)*2*S);
      OY=Math.round(H/2-((scrCx+scrCy)-2*scrCz)*S);
    }

    solid(0,0,W,H,BG);

    /* dotted ground */
    if(S<=base*2){
      var step=5;
      for(var gx=-90;gx<=90;gx+=step)for(var gy=-90;gy<=90;gy+=step){
        var px=sxOf(gx,gy),py=syOf(gx,gy,0);
        if(px>=0&&px<W&&py>=0&&py<H)u32[(py|0)*W+(px|0)]=DOT;
      }
    }

    /* contact shadow, tighter when it is in the air */
    var spread=1+ (1-drop)*3;
    ground(BX-2-spread,BY-2-spread,bw+4+spread*2,bd+4+spread*2,SHDW,true);

    /* base plinth stays down */
    if(drop>0.02)isoBox(BX-1,BY-1,0,bw+2,bd+2,3,baseSamp);

    /* expression + eye tracking */
    expr=0;eyeDX=0;
    if(t>TL.lastInsert+120)expr=3;
    else if((t%2900)<130&&t>1400)expr=2;
    for(i=0;i<N;i++){
      var f=flopState(i,t);
      if(f&&!f.landed){
        eyeDX=f.y<SLOT.y-14?1:0;
        if(t-(TL.first+i*TL.gap+TL.flight)>-90)expr=1;
      }
    }
    screenDark=zoomP>0.34?1:0;

    /* the machine */
    isoBox(BX,BY,bz,bw,bd,bh,macSamp);

    /* floppies */
    for(i=0;i<N;i++){
      var fl=flopState(i,t);
      if(!fl)continue;
      flopLabel=LABELS[i%LABELS.length];
      if(!fl.landed)ground(fl.x-1,fl.y-1,8,8,SHDW,true);
      isoBox(fl.x,fl.y,fl.z,8,8,1,flopSamp,fl.landed?BX+bw:undefined);
    }

    if(zoomP>0){
      /* dissolve everything to black */
      var f2=cl((zoomP-0.30)/0.70);
      for(var py2=0;py2<H;py2++){
        var row=py2*W,dr=(py2&7)*8;
        for(var px2=0;px2<W;px2++)
          if(f2*64>BAYER[dr+(px2&7)])u32[row+px2]=BLACK;
      }
      return;
    }

    /* ---- ui ---- */
    var loaded=0;
    for(i=0;i<N;i++){
      var it=TL.first+i*TL.gap+TL.flight+TL.insert;
      if(t>=it)loaded++;
      else if(t>it-TL.insert)loaded+=cl((t-(it-TL.insert))/TL.insert);
    }
    var p=cl(loaded/N);

    var cap="LOADING SANTIZO SHOWREEL 2026";
    var cy=blockTop+blockH+gapA;
    glyph(cap,Math.round((W-twid(cap,cs))/2),cy,cs,TEXT);

    var bw2=Math.round(W*0.42),bx2=Math.round((W-bw2)/2),by2=cy+7*cs+gapB;
    var bh2=barH2;
    solid(bx2,by2,bw2,bh2,TRACK);
    var fw=Math.round(bw2*p);
    if(fw>0)solid(bx2,by2,fw,bh2,FILL);
    for(var d=0;d<bh2*2&&fw+d<bw2;d++)
      for(var yy=0;yy<bh2;yy++)if(((bx2+fw+d+by2+yy)&1)===0)put(bx2+fw+d,by2+yy,FILL);

    var item=t<TL.first?"STRETCHING VERTICES":
      (p>=1?"READY":ITEMS[Math.min(N-1,Math.floor(loaded))]);
    glyph(item,Math.round((W-twid(item,is))/2),by2+bh2+gapC,is,TEXT2);
  }

  /* ---------- loop ---------- */
  function finish(){
    if(fired)return;
    fired=true;mode="done";
    if(fadeOut)canvas.classList.add("gone");
    if(onDone)onDone();
    canvas.dispatchEvent(new CustomEvent("has:boot-complete",{bubbles:true}));
  }
  function tick(ts){
    if(lastTs!==null){var dt=ts-lastTs;t+=dt>100?100:dt;}
    lastTs=ts;
    if(loop&&t>END+500)t=0;
    frame(t);
    ctx.putImageData(img,0,0);
    if(!loop&&t>=END+hold&&!fired)finish();
    if(fired&&t>END+hold+900){raf=null;return;}
    raf=requestAnimationFrame(tick);
  }
  canvas.addEventListener("click",function(){if(!fired)t=END+hold;});
  if(RM)t=END;
  raf=requestAnimationFrame(tick);

  return {
    mode:function(){return mode;},
    skip:function(){if(!fired)t=END+hold;},
    replay:function(){fired=false;mode="boot";t=0;lastTs=null;
      canvas.classList.remove("gone");if(!raf)raf=requestAnimationFrame(tick);},
    setRes:function(r){res=r;alloc();},
    destroy:function(){if(raf)cancelAnimationFrame(raf);}
  };
}
return {mount:mount};
})();
