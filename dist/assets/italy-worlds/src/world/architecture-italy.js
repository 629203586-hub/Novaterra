import * as THREE from '../../vendor/three/build/three.module.js';
import {roomRandomScore} from '../core/random.js';

// Italian street architecture built on the Starter's batching kit.
// Every function here composes the shared primitives (box/cyl/geometry); part
// meshes are not instanced because they are static and get merged on flush().
//
// Public surface (scene integration):
//   palazzo(spec)  campanile(spec)  casa(spec)  trullo(spec)
//   church(spec)   bellTower(spec)  tiledRoof(spec)
//   windowUnit(x,y,z,w,h,rot,opts)  cornice(x,y,z,len,theta,m,h,reach)
//   shopfront(x,y,z,w,rot,label,opts)  surface(kind,color)
export function createItalianArchitecture(ctx){
 const {M,mat,random,rr}=ctx;
 const {textureCanvas,signMat}=ctx.signage;
 const {box,cyl,ball,pipe,at,geometry,geo,transform}=ctx.batch;
 const surfaces=new Map();
 const seed=ctx.config.seed;
 const LIT_RATE=(ctx.config.lighting&&ctx.config.lighting.windowLitRate)||0.7;
 const FONT=(ctx.config.visual&&ctx.config.visual.fontFamily)||'serif';

 // ---------- shared helper geometries (custom, so triangle counts stay low) ----------
 const circleGeo=new THREE.CircleGeometry(1,20);
 const circleHalfGeo=new THREE.CircleGeometry(1,14,0,Math.PI);
 const tileGeo=new THREE.CylinderGeometry(1,1,1,6,1,false);   // eave tile / rib
 const clockGeo=new THREE.CylinderGeometry(1,1,1,24,1,false); // round dial
 const _up=new THREE.Vector3(0,1,0),_o=new THREE.Object3D(),_va=new THREE.Vector3(),_vb=new THREE.Vector3();

 function hash01(str){
  let h=2166136261>>>0;
  for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}
  return ((h>>>0)%10007)/10007;
 }
 const H=(id)=>hash01(String(id)+'|'+seed);
 function litFor(id,f,i){return roomRandomScore(`${seed}:${id}:${f}:${i}`)<LIT_RATE;}

 // ---------- surface textures (one shared material per finish) ----------
 function surface(kind,color){
  const key=kind+color;
  if(surfaces.has(key))return surfaces.get(key);
  const t=textureCanvas(512,512,(c,w,h)=>{
   if(kind==='roofTile'){
    // Neutral base + rib/course shading; the material colour does the tinting.
    // UV-mapped by world size on roof panels, so ribs land at ~0.28 world units.
    c.fillStyle='#f4ebdf';c.fillRect(0,0,w,h);
    const ribs=8,courses=6,rw=w/ribs,ch=h/courses;
    for(let cy=0;cy<courses;cy++){
     const y=cy*ch,off=cy%2?rw*.5:0;
     c.fillStyle='rgba(58,30,20,.15)';c.fillRect(0,y+ch-3,w,3);
     c.fillStyle='rgba(255,250,240,.22)';c.fillRect(0,y,w,2);
     for(let rx=-1;rx<=ribs;rx++){
      const x=rx*rw+off;
      const g=c.createLinearGradient(x,0,x+rw,0);
      g.addColorStop(0,'rgba(255,250,242,.36)');
      g.addColorStop(.30,'rgba(255,250,242,.05)');
      g.addColorStop(.62,'rgba(56,28,18,.10)');
      g.addColorStop(.93,'rgba(56,28,18,.32)');
      g.addColorStop(1,'rgba(255,250,242,.16)');
      c.fillStyle=g;c.fillRect(x,y+1,rw,ch-4);
     }
    }
    for(let i=0;i<360;i++){c.fillStyle=`rgba(${random()>.55?'255,246,230':'72,44,30'},${rr(.03,.09).toFixed(3)})`;c.beginPath();c.arc(rr(0,w),rr(0,h),rr(2,9),0,6.283);c.fill();}
    for(let i=0;i<22;i++){c.fillStyle='rgba(255,246,224,.07)';c.fillRect(rr(0,w),rr(0,h),rr(4,16),rr(2,5));}
    return;
   }
   c.fillStyle=color;c.fillRect(0,0,w,h);
   if(kind==='plaster'||kind==='stucco'){
    // Warm Mediterranean stucco: soft blotches plus faint relief shadows.
    for(let i=0;i<520;i++){const r=rr(6,42);c.fillStyle=`rgba(${random()>.5?'255,250,238':'96,74,54'},${rr(.02,.055).toFixed(3)})`;c.beginPath();c.arc(rr(0,w),rr(0,h),r,0,Math.PI*2);c.fill();}
    for(let i=0;i<160;i++){c.fillStyle='rgba(80,60,44,.05)';c.fillRect(rr(0,w),rr(0,h),rr(1,3),rr(1,3));}
    for(let i=0;i<4;i++){const x0=rr(0,w),y0=rr(0,h*.5);c.strokeStyle='rgba(92,70,52,.10)';c.lineWidth=1.1;c.beginPath();c.moveTo(x0,y0);c.lineTo(x0+rr(-14,14),y0+rr(18,60));c.lineTo(x0+rr(-20,20),y0+rr(58,110));c.stroke();}
   }else if(kind==='stone'){
    // Istrian stone / tufa blocks: long courses, slightly uneven tones.
    const row=54;for(let y=0;y<h+row;y+=row){
     const offset=(y/row)%2?52:0;
     for(let x=-140;x<w+140;x+=104){
      c.fillStyle=`rgba(${random()>.5?'255,248,232':'104,92,74'},${rr(.03,.10).toFixed(3)})`;
      c.fillRect(x+offset+2,y+2,100,row-4);
      c.strokeStyle='rgba(88,78,62,.30)';c.lineWidth=2.4;c.strokeRect(x+offset,y,104,row);
      c.strokeStyle='rgba(255,250,238,.14)';c.lineWidth=1;c.strokeRect(x+offset+2.5,y+2.5,99,row-5);
     }
    }
    for(let i=0;i<300;i++){c.fillStyle='rgba(70,60,48,.05)';c.fillRect(rr(0,w),rr(0,h),rr(1,4),rr(1,4));}
   }else if(kind==='brick'){
    const row=26;for(let y=0;y<h;y+=row)for(let x=-48;x<w;x+=44){
     const xx=x+((y/row)%2?22:0);
     c.fillStyle=`rgba(255,236,208,${rr(.02,.09).toFixed(3)})`;c.fillRect(xx+2,y+2,40,row-4);
     c.strokeStyle='rgba(208,190,164,.55)';c.lineWidth=2;c.strokeRect(xx,y,44,row);
    }
   }
   // Vertical weathering streaks under sills and parapets.
   for(let i=0;i<7;i++){const xx=rr(0,w),yy=rr(0,h);const g=c.createLinearGradient(0,yy,0,yy+180);g.addColorStop(0,'rgba(78,62,46,.10)');g.addColorStop(1,'rgba(78,62,46,0)');c.fillStyle=g;c.fillRect(xx,yy,rr(4,18),180);}
  });
  t.wrapS=t.wrapT=THREE.RepeatWrapping;
  const m=mat(color,{map:t});
  m.userData.surfaceKind=kind;
  surfaces.set(key,m);return m;
 }

 // ---------- material palette ----------
 const TILE=[surface('roofTile','#b4643f'),surface('roofTile','#c47a52'),surface('roofTile','#a85a39'),surface('roofTile','#cd8a60')];
 const tileDark=mat('#8a4a32');
 const STONE_T=[M.trimStone,M.trimLightStone,M.trimWhiteStone,M.trimDark];
 let clockMat=null,roseMat=null;
 function clockMaterial(){
  if(clockMat)return clockMat;
  const t=textureCanvas(256,256,(c,w,h)=>{
   const cx=w/2,cy=h/2;
   c.fillStyle='#cdbf9e';c.fillRect(0,0,w,h);
   c.beginPath();c.arc(cx,cy,w*.495,0,6.283);c.fillStyle='#2b2822';c.fill();
   c.beginPath();c.arc(cx,cy,w*.455,0,6.283);c.fillStyle='#f2ecd9';c.fill();
   c.beginPath();c.arc(cx,cy,w*.455,0,6.283);c.strokeStyle='#b08a4a';c.lineWidth=w*.016;c.stroke();
   for(let i=0;i<60;i++){const a=i/60*6.283,r0=i%5?w*.395:w*.365,r1=w*.435;c.strokeStyle=i%5?'#5a5140':'#2f2a22';c.lineWidth=i%5?2:5;c.beginPath();c.moveTo(cx+Math.cos(a)*r0,cy+Math.sin(a)*r0);c.lineTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);c.stroke();}
   c.fillStyle='#2a241c';c.textAlign='center';c.textBaseline='middle';c.font=`700 ${w*.075}px ${FONT}`;
   const roman=['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
   for(let i=0;i<12;i++){const a=i/12*6.283-Math.PI/2;c.fillText(roman[i],cx+Math.cos(a)*w*.315,cy+Math.sin(a)*w*.315);}
   const hand=(ang,len,wd)=>{c.strokeStyle='#1e1a14';c.lineWidth=wd;c.lineCap='round';c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(ang)*len,cy+Math.sin(ang)*len);c.stroke();};
   hand(-Math.PI/3,w*.20,w*.032);hand(Math.PI/6,w*.29,w*.022);
   c.beginPath();c.arc(cx,cy,w*.027,0,6.283);c.fillStyle='#1e1a14';c.fill();
  });
  // night emission: the dial glows warm, the stone bezel stays dark
  const lit=textureCanvas(256,256,(c,w,h)=>{
   const cx=w/2,cy=h/2;
   c.fillStyle='#000000';c.fillRect(0,0,w,h);
   c.beginPath();c.arc(cx,cy,w*.452,0,6.283);c.fillStyle='#ffd98f';c.fill();
   for(let i=0;i<12;i++){const a=i/12*6.283-Math.PI/2,r=w*.30;c.fillStyle='#4a3718';c.textAlign='center';c.textBaseline='middle';c.font=`700 ${w*.075}px ${FONT}`;c.fillText(['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'][i],cx+Math.cos(a)*r,cy+Math.sin(a)*r);}
   const hd=(ang,len,wd)=>{c.strokeStyle='#3a2b10';c.lineWidth=wd;c.lineCap='round';c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(ang)*len,cy+Math.sin(ang)*len);c.stroke();};
   hd(-Math.PI/3,w*.20,w*.032);hd(Math.PI/6,w*.29,w*.022);
  });
  clockMat=mat('#ffffff',{map:t,emissive:'#ffffff',emissiveMap:lit,emissiveIntensity:.85});
  clockMat.userData.nightEmission=.85;clockMat.userData.surfaceKind='clock';return clockMat;
 }
 function roseMaterial(){
  if(roseMat)return roseMat;
  const t=textureCanvas(256,256,(c,w,h)=>{
   const cx=w/2,cy=h/2,R=w*.5;
   c.fillStyle='#c9bb9b';c.fillRect(0,0,w,h);
   // dark aperture with leaded glass panes
   c.beginPath();c.arc(cx,cy,R*.98,0,6.283);c.fillStyle='#1c2326';c.fill();
   const cols=['#c9853f','#8f3f2c','#d8b25e','#2f5566','#b5652f','#7a3a52'];
   for(let ring=0;ring<3;ring++){
    const r0=R*(.30+ring*.22),r1=R*(.52+ring*.22),seg=12+ring*6;
    for(let i=0;i<seg;i++){
     const a0=i/seg*6.283,a1=(i+1)/seg*6.283;
     c.beginPath();c.moveTo(cx+Math.cos(a0)*r0,cy+Math.sin(a0)*r0);
     c.arc(cx,cy,r1,a0,a1);c.arc(cx,cy,r0,a1,a0,true);c.closePath();
     c.fillStyle=cols[(i+ring*3)%cols.length];c.globalAlpha=.92;c.fill();c.globalAlpha=1;
     c.strokeStyle='#15191a';c.lineWidth=w*.012;c.stroke();
    }
   }
   // lead tracery: radial spokes + two rings + centre boss
   c.strokeStyle='#141a1b';c.lineWidth=w*.018;
   for(let i=0;i<12;i++){const a=i/12*6.283;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(a)*R*.96,cy+Math.sin(a)*R*.96);c.stroke();}
   for(const rr2 of[.34,.56,.78]){c.beginPath();c.arc(cx,cy,R*rr2,0,6.283);c.lineWidth=w*.014;c.stroke();}
   c.beginPath();c.arc(cx,cy,R*.98,0,6.283);c.strokeStyle='#3a3b33';c.lineWidth=w*.03;c.stroke();
   c.beginPath();c.arc(cx,cy,w*.045,0,6.283);c.fillStyle='#d8b25e';c.fill();
  });
  roseMat=mat('#ffffff',{map:t,emissive:'#ffffff',emissiveMap:t,emissiveIntensity:.30});
  roseMat.userData.nightEmission=.30;roseMat.userData.surfaceKind='rose';return roseMat;
 }

 // ---------- geometry helpers ----------
 // Box with world-scaled UVs (texture tile ≈ uvScale world units per face).
 function boxUV(x,y,z,w,h,d,m,uvScale=2.7){
  const g=new THREE.BoxGeometry(w,h,d);
  const uv=g.attributes.uv;
  const du=[d,d,w,w,w,w],dv=[h,h,d,d,h,h];
  for(let f=0;f<6;f++)for(let i=0;i<4;i++){const k=f*4+i;uv.setXY(k,uv.getX(k)*du[f]/uvScale,uv.getY(k)*dv[f]/uvScale);}
  geometry(g,m,transform(x,y,z,1,1,1));g.dispose();
 }
 // One cylinder from a to b in the current frame (cheap half-round tile strut).
 function strut(g,a,b,r,m){
  _va.set(a[0],a[1],a[2]);_vb.set(b[0],b[1],b[2]);
  const dir=_vb.clone().sub(_va),len=dir.length();if(len<1e-4)return;
  _o.position.copy(_va).add(_vb).multiplyScalar(.5);
  _o.quaternion.setFromUnitVectors(_up,dir.normalize());
  _o.scale.set(r,len,r);_o.updateMatrix();
  geometry(g,m,transform(0,0,0,1,1,1).multiply(_o.matrix));
 }
 function triPanel(a,b,c,m,uvA,uvB,uvC){
  const e1=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],e2=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
  const ny=e1[2]*e2[0]-e1[0]*e2[2];
  if(ny<0){const t=b;b=c;c=t;const tu=uvB;uvB=uvC;uvC=tu;}
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute([...a,...b,...c],3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute((uvA?.length===6?uvA:[...(uvA||[0,0]),...(uvB||[1,0]),...(uvC||[.5,1])]),2));
  g.setIndex([0,1,2]);g.computeVertexNormals();
  geometry(g,m);g.dispose();
 }
 function quadPanel(a,b,c,d,m,uvs){
  const e1=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],e2=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
  const ny=e1[2]*e2[0]-e1[0]*e2[2];
  let P=[a,b,c,d],U=uvs;
  if(ny<0){P=[a,d,c,b];U=[uvs[0],uvs[1],uvs[6],uvs[7],uvs[4],uvs[5],uvs[2],uvs[3]];}
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute([...P[0],...P[1],...P[2],...P[3]],3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
  g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();
  geometry(g,m);g.dispose();
 }
 // Double-sided triangle, for gable walls / solid infill.
 function triWall(a,b,c,m){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute([...a,...b,...c,...a,...c,...b],3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,.5,1,0,0,.5,1,1,0],2));
  g.computeVertexNormals();
  geometry(g,m);g.dispose();
 }
 // Solid extruded triangle (portfolio-worthy gable mass).
 function gablePrism(w,rise,depth,m){
  const shape=new THREE.Shape();
  shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(0,rise);shape.closePath();
  const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false});
  geometry(g,m,transform(0,0,0,1,1,1));g.dispose();
 }
 // Arched opening fill: rectangle + semicircular head, facing +Z in local frame.
 function archFill(w,h,mat4,z){
  const r=w/2,spring=h-r;
  box(0,spring/2,z,w,spring,.07,mat4);
  geometry(circleHalfGeo,mat4,transform(0,spring,z,r,r,1));
 }
 function archRing(w,h,z,m,thick=.09){
  const r=w/2,spring=h-r,rad=r+thick;
  for(let k=0;k<9;k++){
   const a=Math.PI*k/8;
   geometry(geo.box,m,transform(Math.cos(a)*rad,spring+Math.sin(a)*rad,z,.23,.20,.13,0,0,a-Math.PI/2));
  }
 }

 // ---------- ornament vocabulary ----------
 // Small cross-section cornice running along a wall. theta=0 runs along X and
 // faces +Z; theta=PI/2 runs along Z and faces +X.
 function cornice(x,y,z,len,theta,m=M.trimStone,height=.30,reach=.24){
  at(x,y,z,theta||0,()=>{
   box(0,.04,reach*.36,len,height*.55,reach*.72,m);
   box(0,-height*.30,reach*.50,len,height*.34,reach,m);
   box(0,height*.36,reach*.20,len,height*.16,reach*.40,m);
  });
 }
 function chimney(x,y,z,s=1){
  box(x,y+.52*s,z,.50*s,1.05*s,.50*s,M.trimStone);
  box(x,y+.04*s,z,.58*s,.20*s,.58*s,M.trimDark);
  box(x,y+1.10*s,z,.72*s,.14*s,.72*s,M.terracottaDark);
  box(x,y+1.20*s,z,.56*s,.10*s,.56*s,M.terracotta);
  const n=random()>.45?2:1;
  for(let i=0;i<n;i++){
   const px=x+(i-(n-1)/2)*.23*s;
   cyl(px,y+1.42*s,z,.095*s,.34*s,M.terracotta);
   cyl(px,y+1.60*s,z,.062*s,.05*s,M.archDark);
  }
 }
 function antenna(x,y,z,h=2.0){
  pipe([x,y,z],[x,y+h,z],.022,M.iron);
  for(let k=0;k<3;k++){const ly=y+h*(.55+k*.14);box(x,ly,z,.52/(k*.6+1),.022,.022,M.iron);}
  box(x,y+h-.10,z,.02,.02,.34,M.iron);
  ball(x,y+h,z,.035,.045,.035,M.iron);
 }
 function wallLamp(x,y,z,rot){
  at(x,y,z,rot||0,()=>{
   pipe([0,0,0],[0,.24,.30],.032,M.iron);
   pipe([0,.24,.30],[0,.30,.46],.028,M.iron);
   box(0,.30,.52,.20,.05,.20,M.iron);
   cyl(0,.20,.52,.115,.20,M.lamp);
   box(0,.30,.52,.20,.05,.20,M.iron);
   cyl(0,.06,.52,.05,.10,M.iron);
  });
 }
 // Terracotta window box with dense Mediterranean greenery + a few blooms.
 function flowerBox(x,y,z,w,rot){
  at(x,y,z,rot||0,()=>{
   box(0,0,0,w,.19,.22,M.terracottaDark);
   box(0,.10,0,w*.97,.05,.20,M.terracotta);
   const n=Math.max(2,Math.round(w/.26));
   for(let i=0;i<n;i++){
    const px=-w/2+.13+i*(w-.26)/(n-1||1);
    ball(px,.17+rr(-.03,.05),rr(-.07,.07),.11,.13,.10,random()>.5?M.leafOlive:M.leaf);
    if(random()>.45)ball(px+rr(-.06,.06),.24+rr(0,.06),rr(-.06,.06),.045,.05,.045,random()>.5?M.blossom:M.blossom2);
   }
  });
 }
 // Wrought-iron balcony on corbels, with an optional flower box.
 function balcony(x,y,z,w,rot,opts){
  const o=opts||{};
  at(x,y,z,rot||0,()=>{
   const bw=w+.40,rh=.60;
   box(0,-.08,.27,bw,.10,.52,M.trimStone);
   box(0,-.17,.27,bw-.04,.09,.46,M.trimStone);
   for(const sx of[-.34,0,.34]){
    const cx=sx*bw;
    box(cx,-.30,.18,.17,.24,.40,M.trimStone);
    box(cx,-.40,.10,.13,.16,.26,M.trimStone);
   }
   box(0,rh,.50,bw,.035,.04,M.iron);
   box(0,.07,.50,bw,.028,.028,M.iron);
   const nb=Math.max(5,Math.round(bw/.165));
   for(let i=0;i<=nb;i++){const px=-bw/2+i*bw/nb;box(px,rh*.52,.50,.020,rh*.92,.020,M.iron);}
   // little scrolled motifs on the uprights
   for(const sx of[-1,1]){cyl(sx*(bw/2-.11),rh*.42,.50,.070,.018,M.iron,Math.PI/2);}
   for(const sx of[-1,1])box(sx*bw/2,rh*.52,.27,.022,rh*.92,.50,M.iron);
   if(o.flowers!==false)flowerBox(0,-.02,.37,bw*.44,0);
  });
 }
 // Alternating exposed-stone quoins on a building corner. Local frame of the
 // building (dx/dz are corner signs).
 function quoinCorner(w,d,dx,dz,baseY,height,m){
  const rows=Math.max(2,Math.floor((height-baseY)/.44));
  for(let r=0;r<rows;r++){
   const y=baseY+.22+r*.44;
   const mm=STONE_T[(r+Math.round(hash01('q'+(dx+3)*(dz+7))*4))%STONE_T.length];
   if(r%2===0)box(dx*(w/2-.24),y,dz*(d/2+.035),.62,.38,.15,mm||m);
   else box(dx*(w/2+.035),y,dz*(d/2-.24),.15,.38,.62,mm||m);
  }
 }
 // Zinc downpipe with hopper head, brackets and a bottom elbow.
 function downpipe(x,z,y0,y1,rot){
  at(x,y0,z,rot||0,()=>{
   const len=Math.max(.4,y1-y0);
   pipe([0,0,0],[0,len,0],.052,M.zinc);
   for(let k=1;k<Math.max(1,Math.floor(len/2.6));k++)box(0,len*k/Math.max(1,Math.floor(len/2.6)),.02,.11,.055,.13,M.iron);
   box(0,len-.02,0,.24,.26,.17,M.zinc);
   box(0,len+.06,-.03,.30,.10,.22,M.zinc);
   pipe([0,0,0],[0,-.20,.20],.052,M.zinc);
  });
 }
 // Rooftop wooden altana (roof terrace pergola) — a classic Italian silhouette.
 function altana(x,y,z,w,d,rot){
  at(x,y,z,rot||0,()=>{
   const postH=1.45;
   for(const sx of[-1,1])for(const sz of[-1,1])box(sx*(w/2-.1),postH/2,sz*(d/2-.1),.10,postH,.10,M.wood);
   for(const sx of[-1,1])box(sx*(w/2-.1),postH+.05,0,.12,.12,d,M.woodLight);
   const n=Math.max(4,Math.round(d/.42));
   for(let i=0;i<=n;i++){const zz=-d/2+i*d/n;box(0,postH+.16,zz,w,.07,.10,M.woodLight);}
   box(0,postH+.06,0,w,.10,.10,M.wood);
   // a couple of vine balls on the beams
   for(let i=0;i<3;i++)ball(rr(-w*.40,w*.40),postH+.24,rr(-d*.35,d*.35),.16,.13,.16,i%2?M.leafVine:M.leafOlive);
  });
 }
 function clothesline(x,y,z,len,rot){
  at(x,y,z,rot||0,()=>{
   pipe([-len/2,0,0],[len/2,0,0],.012,M.iron);
   const cols=[M.paintWhite,M.awningCream,M.paintBlue,M.shutterBrown,M.paintRed];
   for(let i=0;i<4;i++){
    const px=-len/2+len*(i+.6)/5,c=cols[i%cols.length];
    box(px,-.30,0,.34,.50,.015,c);
    if(i===1)box(px+.10,-.38,0,.16,.20,.016,c);
   }
  });
 }

 // ---------- tiled roof ----------
 // Real 4-plane tiled roof. spec:
 //  {x,y,z,rot,w,d,over=.52,pitch=.46,hip=true,ridge:'x'|'z',rise,detail=1,tint=0,gableMat}
 // w is along local X, d along local Z. Returns the ridge rise.
 function tiledRoof(spec){
  const s=spec||{};
  const x=s.x||0,y=s.y||0,z=s.z||0,rot=s.rot||0;
  const w=s.w||6,d=s.d||5,over=s.over!=null?s.over:.52,pitch=s.pitch!=null?s.pitch:.46;
  const hip=s.hip!==false;
  const hw=w/2+over,hd=d/2+over;
  const alongX=s.ridge==='x'?true:s.ridge==='z'?false:hw>=hd;
  const span=alongX?hd:hw,long=alongX?hw:hd;
  // Hip ridges are usually longer than a perfect 45-degree hip, so the roof
  // reads as a proper 4-plane hip rather than a flat-topped pyramid.
  const rl=hip?(s.pyramid?0:Math.max(long-span*.58,long*.24)):long;
  const rise=s.rise!=null?s.rise:pitch*span;
  const slope=Math.hypot(span,rise);
  const detail=s.detail!=null?s.detail:1;
  const tintN=((s.tint||0)%4+4)%4;
  const A=TILE[tintN],B=TILE[(tintN+1)%4],C=TILE[(tintN+2)%4];
  const U=2.3; // world units per texture repeat
  at(x,y,z,rot,()=>{
   const eaveStep=detail>=1?.34:.55;
   const tileR=.075+Math.min(.022,w*.0035);
   // ---- slopes ----
   if(alongX){
    if(rl>.08){
     quadPanel([-hw,0,hd],[hw,0,hd],[rl,rise,0],[-rl,rise,0],A,[0,0,2*hw/U,0,(rl+hw)/U,slope/U,(hw-rl)/U,slope/U]);
     quadPanel([hw,0,-hd],[-hw,0,-hd],[-rl,rise,0],[rl,rise,0],B,[0,0,2*hw/U,0,(rl+hw)/U,slope/U,(hw-rl)/U,slope/U]);
     if(hip){
      const sslope=Math.hypot(hw-rl,rise);
      triPanel([hw,0,hd],[hw,0,-hd],[rl,rise,0],C,[0,0,2*hd/U,0,hd/U,sslope/U]);
      triPanel([-hw,0,-hd],[-hw,0,hd],[-rl,rise,0],C,[0,0,2*hd/U,0,hd/U,sslope/U]);
     }
    }else{
     triPanel([-hw,0,hd],[hw,0,hd],[0,rise,0],A,[0,0,2*hw/U,0,hw/U,slope/U]);
     triPanel([hw,0,-hd],[-hw,0,-hd],[0,rise,0],B,[0,0,2*hw/U,0,hw/U,slope/U]);
     triPanel([hw,0,hd],[hw,0,-hd],[0,rise,0],C,[0,0,2*hd/U,0,hd/U,slope/U]);
     triPanel([-hw,0,-hd],[-hw,0,hd],[0,rise,0],C,[0,0,2*hd/U,0,hd/U,slope/U]);
    }
    if(!hip&&s.gableMat){
     triWall([w/2,0,-d/2],[w/2,0,d/2],[w/2,rise,0],s.gableMat);
     triWall([-w/2,0,d/2],[-w/2,0,-d/2],[-w/2,rise,0],s.gableMat);
    }
   }else{
    if(rl>.08){
     quadPanel([hw,0,hd],[hw,0,-hd],[0,rise,-rl],[0,rise,rl],A,[0,0,2*hd/U,0,hd/U,slope/U,hd/U,slope/U]);
     quadPanel([-hw,0,-hd],[-hw,0,hd],[0,rise,rl],[0,rise,-rl],B,[0,0,2*hd/U,0,hd/U,slope/U,hd/U,slope/U]);
     if(hip){
      const sslope=Math.hypot(hd-rl,rise);
      triPanel([-hw,0,hd],[hw,0,hd],[0,rise,rl],C,[0,0,2*hw/U,0,hw/U,sslope/U]);
      triPanel([hw,0,-hd],[-hw,0,-hd],[0,rise,-rl],C,[0,0,2*hw/U,0,hw/U,sslope/U]);
     }
    }else{
     triPanel([hw,0,hd],[hw,0,-hd],[0,rise,0],A,[0,0,2*hd/U,0,hd/U,slope/U]);
     triPanel([-hw,0,-hd],[-hw,0,hd],[0,rise,0],B,[0,0,2*hd/U,0,hd/U,slope/U]);
     triPanel([-hw,0,hd],[hw,0,hd],[0,rise,0],C,[0,0,2*hw/U,0,hw/U,slope/U]);
     triPanel([hw,0,-hd],[-hw,0,-hd],[0,rise,0],C,[0,0,2*hw/U,0,hw/U,slope/U]);
    }
    if(!hip&&s.gableMat){
     triWall([-w/2,0,d/2],[w/2,0,d/2],[0,rise,d/2],s.gableMat);
     triWall([w/2,0,-d/2],[-w/2,0,-d/2],[0,rise,-d/2],s.gableMat);
    }
   }
   // ---- eave fascia + shadow line ----
   box(0,-.14,hd-.03,2*hw-.02,.22,.12,M.terracottaDark);
   box(0,-.14,-hd+.03,2*hw-.02,.22,.12,M.terracottaDark);
   box(hw-.03,-.14,0,.12,.22,2*hd-.02,M.terracottaDark);
   box(-hw+.03,-.14,0,.12,.22,2*hd-.02,M.terracottaDark);
   box(0,-.05,0,2*hw-.08,.06,2*hd-.08,M.trimDark);
   // ---- romanella eave tile row (round tile ends along every eave) ----
   for(let t=-hw+eaveStep*.5;t<=hw;t+=eaveStep){
    const m=random()>.55?A:B;
    strut(tileGeo,[t,-.02,hd+.03],[t,-.09,hd+.32],tileR,m);
    strut(tileGeo,[t,-.02,-hd-.03],[t,-.09,-hd-.32],tileR,random()>.55?A:C);
   }
   if(detail>=.8){
    for(let t=-hd+eaveStep*.5;t<=hd;t+=eaveStep){
     strut(tileGeo,[hw+.03,-.02,t],[hw+.32,-.09,t],tileR,random()>.55?A:B);
     strut(tileGeo,[-hw-.03,-.02,t],[-hw-.32,-.09,t],tileR,random()>.55?A:C);
    }
   }
   // ---- gutter along the front and back eaves ----
   strut(geo.cyl,[-hw,-.055,hd+.17],[hw,-.055,hd+.17],.048,M.zinc);
   strut(geo.cyl,[-hw,-.055,-hd-.17],[hw,-.055,-hd-.17],.048,M.zinc);
   // ---- ridge tiles ----
   if(rl>.10){
    const segs=Math.max(2,Math.ceil(2*rl/.72));
    for(let i=0;i<segs;i++){
     const a0=-rl+2*rl*i/segs,a1=-rl+2*rl*(i+1)/segs;
     strut(tileGeo,alongX?[a0-.02,rise+.04,0]:[0,rise+.04,a0-.02],
                   alongX?[a1+.02,rise+.04,0]:[0,rise+.04,a1+.02],.105,i%2?C:B);
    }
   }
   // ---- hip edge tiles ----
   if(hip&&rl>.12){
    for(const sx of[-1,1])for(const sz of[-1,1]){
     const c0=alongX?[sx*hw,-.01,sz*hd]:[sx*hw,-.01,sz*hd];
     const c1=alongX?[sx*rl,rise+.02,0]:[0,rise+.02,sz*rl];
     const mx=(c0[0]+c1[0])/2,my=(c0[1]+c1[1])/2,mz=(c0[2]+c1[2])/2;
     strut(tileGeo,[c0[0],c0[1],c0[2]],[mx,my,mz],.095,C);
     strut(tileGeo,[mx,my,mz],[c1[0],c1[1],c1[2]],.088,random()>.5?B:C);
    }
   }
   // ---- tile course shadow lines on the big slopes ----
   if(detail>=1){
    for(let k=0;k<3;k++){
     const f=.30+k*.24;
     if(alongX){
      const ax=hw-f*(hw-rl),yy=rise*f+.03;
      for(const sz of[-1,1]){const zz=sz*hd*(1-f);strut(tileGeo,[-ax,yy,zz],[ax,yy,zz],.030,tileDark);}
     }else{
      const az=hd-f*(hd-rl),yy=rise*f+.03;
      for(const sx of[-1,1]){const xx=sx*hw*(1-f);strut(tileGeo,[xx,yy,-az],[xx,yy,az],.030,tileDark);}
     }
    }
   }
  });
  return rise;
 }

 // ---------- windows / shopfronts ----------
 // Window with deep reveal, stone surround, shutters, curtain hint and options
 // for wrought-iron balconies, awnings, flower boxes and a wall lamp.
 function windowUnit(x,y,z,w,h,rot,opts){
  const o=opts||{};
  const lit=!!o.lit,shutters=o.shutters!==false,arch=!!o.arch,iron=!!o.iron,awning=!!o.awning;
  const french=!!o.french,curtains=o.curtains!==false,flowers=!!o.flowers;
  const shutterColor=o.shutterColor||M.shutterGreen;
  const awningColor=o.awningColor||M.awningRose;
  const frame=o.frame||M.trimLight;
  at(x,y,z,rot||0,()=>{
   // deep recess: cavity, reveal cheeks, glass
   box(0,0,-.11,w+.34,h+.34,.12,M.paintShadow);
   box(0,0,-.045,w+.18,h+.18,.07,M.trimDark);
   box(0,0,.008,w,h,.035,lit?M.warmDim:M.windowDark);
   // glazing bars + inner frame
   box(0,0,.030,.042,h*.94,.02,M.trimWhite);
   box(0,h*.13,.030,w*.92,.035,.02,M.trimWhite);
   box(0,-h*.20,.030,w*.92,.03,.02,M.trimWhite);
   if(lit){box(-w*.26,.02,.034,w*.26,h*.72,.012,M.sand);}
   if(curtains){for(const sx of[-1,1])box(sx*(w*.355),h*.05,.037,w*.20,h*.72,.012,M.trimWhite);box(0,h*.35,.036,w*.84,.15,.012,M.trimLight);}
   if(flowers&&!french&&!iron)flowerBox(0,-h/2-.145,.16,w*.72,0);
   // stone surround
   for(const sx of[-1,1])box(sx*(w/2+.055),0,.045,.115,h+.16,.10,frame);
   box(0,h/2+.075,.045,w+.32,.125,.10,frame);
   box(0,-h/2-.068,.10,w+.30,.115,.26,M.trimStone);
   box(0,-h/2-.135,.015,w+.20,.075,.12,M.trimDark);
   // keystone + arch head
   if(arch){
    for(let k=0;k<7;k++){const a=Math.PI*k/6;geometry(geo.box,M.trimLightStone,transform(Math.cos(a)*(w/2+.06),h/2+Math.sin(a)*(w*.30),.06,.20,.14,.11,0,0,a-Math.PI/2));}
    box(0,h/2+w*.31,.07,w*.30,.16,.08,M.trimWhiteStone);
   }
   if(shutters){
    for(const side of[-1,1]){
     const sw=w*.50;
     box(side*(w/2+sw/2+.045),0,.050,sw,h*.99,.05,shutterColor);
     // louvre hint: three recessed bands, kept proud of the shutter face
     for(const k of[-.30,0,.30])box(side*(w/2+sw/2+.045),h*k*.95,.076,sw*.78,.030,.012,M.paintShadow);
     // hinges + latch
     box(side*(w/2+sw+.02),h*.22,.062,.03,.12,.03,M.iron);
     box(side*(w/2+sw+.02),-h*.22,.062,.03,.12,.03,M.iron);
    }
   }
   if(french){
    const bw=w+.34;
    box(0,-h/2-.20,.17,bw,.06,.36,M.trimStone);
    for(let i=0;i<=6;i++)box(-bw/2+i*bw/6,-h/2-.06,.31,.016,.26,.016,M.iron);
    box(0,-h/2+.06,.31,bw+.04,.024,.024,M.iron);
    if(flowers)flowerBox(0,-h/2-.02,.32,Math.min(bw*.6,1.1),0);
   }
   if(iron)balcony(0,-h/2-.12,.02,w,0,{flowers:flowers});
   if(awning){
    const aw=w+.20;
    geometry(geo.box,awningColor,transform(0,h/2+.15,.24,aw,.03,.66,0,0,0));
    for(const sx of[-.30,0,.30])box(sx*aw,h/2+.167,.24,aw*.15,.012,.64,M.awningCream);
    box(0,h/2+.02,.56,aw,.20,.018,awningColor);
    for(const sx of[-.30,0,.30])box(sx*aw,h/2+.02,.572,aw*.15,.18,.010,M.awningCream);
    for(const side of[-1,1])box(side*(aw/2+.008),h/2+.08,.24,.016,.26,.64,awningColor);
   }
   if(o.lamp)wallLamp(0,-h/2-.34,.02,0);
  });
 }

 // Ristorante shopfront: glazed front, timber door, awning, menu board, planters.
 function shopfront(x,y,z,w,rot,label,opts){
  const o=opts||{};
  const awningColor=o.awningColor||M.awningRose,signColor=o.signColor||'#7a2a22',tableColor=M.cream;
  at(x,y,z,rot||0,()=>{
   box(0,1.10,-.05,w,2.30,.14,M.paintShadow);
   const gw=w*.56,dw=w*.20;
   const gx=-w/2+gw/2+.10;
   // shop window: warm interior with shelf silhouettes
   box(gx,1.22,.055,gw,1.72,.04,M.warmDim);
   box(gx,1.30,.080,gw*.88,.90,.015,M.warmDim);
   for(let s=0;s<2;s++)box(gx,.78+s*.36,.085,gw*.84,.05,.02,M.woodDark);
   for(let i=0;i<5;i++)ball(gx-gw*.34+i*gw*.17,1.02+random()*.5,.095,.09,.12,.08,i%2?M.cream:M.orange);
   for(let i=1;i<3;i++)box(gx-gw/2+gw*i/3,1.22,.075,.055,1.72,.02,M.woodDark);
   box(gx,2.10,.078,gw,.06,.03,M.woodDark);
   // timber door
   const dx=w/2-dw/2-.14;
   box(dx,1.10,.06,dw,2.14,.06,M.woodDoor);
   box(dx,1.36,.095,dw*.62,.70,.02,M.warmDim);
   for(const k of[-.30,.30])box(dx+k*dw*.30,1.36,.112,dw*.16,.62,.02,M.woodDark);
   box(dx-dw*.30,1.06,.098,.05,.13,.03,M.brass);
   // sign band above the glazing
   box(0,2.52,.10,w*.92,.44,.08,M.signFrameIt);
   geometry(geo.plane,signMat(label,signColor,'#f5e2b6'),transform(0,2.52,.145,w*.86,.36,1));
   // awning + scalloped valance
   geometry(geo.box,awningColor,transform(0,2.95,.40,w,.035,.92,0,0,0));
   for(const sx of[-.26,0,.26])box(sx*w,2.968,.40,w*.13,.014,.90,M.awningCream);
   box(0,2.75,.86,w,.30,.022,awningColor);
   for(const sx of[-.26,0,.26])box(sx*w,2.75,.873,w*.13,.28,.012,M.awningCream);
   for(const side of[-1,1])box(side*(w/2+.01),2.84,.40,.02,.32,.90,awningColor);
   // hanging lantern over the door
   pipe([dx,2.78,.30],[dx,2.62,.30],.016,M.iron);
   cyl(dx,2.48,.30,.10,.20,M.lamp);
   box(dx,2.62,.30,.14,.05,.14,M.iron);
   // pavement bistro set: two chairs and a small round table
   if(o.tables!==false){
    for(const t of[[-.18,.92],[.24,.92]]){
     const tx=w*.5*t[0],tz=t[1];
     cyl(tx,1.18,tz,.035,.72,M.iron);
     cyl(tx,1.55,tz,.22,.035,tableColor);
     box(tx,1.02,tz,.34,.03,.30,M.iron);
     for(const a of[0,1,2]){const ang=a*Math.PI*2/3;box(tx+Math.cos(ang)*.20,.96,tz+Math.sin(ang)*.20,.06,.6,.06,M.iron);if(a===0)box(tx+Math.cos(ang)*.20,1.30,tz+Math.sin(ang)*.20,.22,.24,.05,M.iron);}
    }
   }
  });
 }

 // ---------- palazzo (the main street building) ----------
 function palazzo(spec){
  const s=spec||{};
  const id=s.id||'palazzo',x=s.x||0,z=s.z||0,w=s.w||7,d=s.d||6,floors=s.floors||3;
  const color=s.color||'#d9c4a0',finish=s.finish||'plaster',rot=s.rot||0,y=s.y!=null?s.y:.8;
  const ground=s.ground||'shop',label=s.label||'CASA',signColor=s.signColor||'#7a2a22';
  const awningColor=s.awningColor||M.awningRose,shutterColor=s.shutterColor||M.shutterGreen;
  const french=s.french!==false;
  const hh=H(id);
  const fh=2.86+hh*.26,groundH=3.72+H(id+'g')*.26;
  const h=groundH+(floors-1)*fh;
  const wall=surface(finish,color);
  const roofSpec=s.roof;
  const style=roofSpec==='terrace'?'terrace':(roofSpec==='gabled'||roofSpec==='gable')?'gable':'hip';
  const topSet=(floors>=3&&hh>.54)?(.55+H(id+'s')*.40):0;
  const setH=topSet?groundH+(floors-2)*fh:h;
  const deckMat=surface('roofTile','#b4643f');
  const hasQuoins=hh>.46,hasLamp=hh>.38;
  const bays=Math.max(1,Math.round(w/3.0)),bw=w/bays;
  const pitch=.38+hh*.20;
  at(x,y,z,rot,()=>{
   if(y>.82)box(0,-(y-.78)/2,0,w,y-.78,d,M.trimStone);
   // ---- mass (top floor may step back, giving an irregular silhouette) ----
   if(topSet){
    box(0,setH/2,0,w,setH,d,wall,0,true);
    const d2=d-topSet;
    box(0,setH+(h-setH)/2,-topSet/2,w,h-setH,d2,wall);
    // tiled cotto deck on the exposed ledge + iron railing
    boxUV(0,setH+.055,d/2-topSet/2,w-.04,.11,topSet-.04,deckMat,2.3);
    const bwid=w-.2;
    box(0,setH+.20,d/2+.02,bwid,.04,.04,M.iron);
    for(let i=0;i<=Math.round(bwid/.22);i++)box(-bwid/2+i*bwid/Math.round(bwid/.22),setH+.42,d/2+.02,.02,.44,.02,M.iron);
   }else{
    box(0,h/2,0,w,h,d,wall,0,true);
   }
   // plinth (basamento) — slightly proud of the wall
   box(0,.22,0,w+.10,.44,d+.10,M.trimStone);
   box(0,.48,0,w+.05,.10,d+.05,M.trimDark);
   // string courses
   cornice(0,groundH,d/2+.02,w+.16,0,M.trimStone,.26,.20);
   if(topSet){
    cornice(0,setH+.04,d/2+.02,w+.22,0,M.trimStone,.20,.18);
   }else if(floors>1){
    cornice(0,groundH+fh,d/2+.02,w+.12,0,M.trimStone,.16,.14);
   }
   // ---- exposed stone quoins ----
   if(hasQuoins){
    // front corners stop under a stepped-back top floor; back corners run full height
    quoinCorner(w,d,1,1,0,topSet?setH:h,M.trimStone);
    quoinCorner(w,d,-1,-1,0,h,M.trimStone);
   }
   // ---- roof ----
   const roofZ=topSet?-topSet/2:0,roofD=topSet?d-topSet:d;
   let rise=0;
   if(style==='terrace'){
    // flat roof terrace: clear the top cornice, add a tiled parapet cap
    cornice(0,h-.14,roofZ+(roofD/2)+.02,w+.26,0,M.trimStone,.30,.30);
    for(const zz of[roofZ-roofD/2+.06,roofZ+roofD/2-.06])box(0,h+.24,zz,w+.18,.40,.12,M.trimStone);
    for(const xx of[-w/2+.06,w/2-.06])box(xx,h+.24,roofZ,.12,.40,roofD+.18,M.trimStone);
    // parapet coping (pale stone) so the roof edge is not a flat slab
    for(const zz of[roofZ-roofD/2+.06,roofZ+roofD/2-.06])box(0,h+.45,zz,w+.24,.07,.18,M.trimWhiteStone);
    for(const xx of[-w/2+.06,w/2-.06])box(xx,h+.45,roofZ,.18,.07,roofD+.24,M.trimWhiteStone);
    // tiled cotto deck
    boxUV(0,h+.03,roofZ,w-.10,.07,roofD-.10,deckMat,2.3);
    // pergola / altana on some palazzi
    if(hh>.52)altana(-w*.18,h+.42,roofZ-roofD*.18,Math.min(3.2,w*.45),Math.min(2.0,roofD*.4),0);
    // roof garden: terracotta pots, lemon trees and planters
    const potN=Math.max(2,Math.floor(w/1.9));
    for(let i=0;i<potN;i++){
     const px=-w/2+.85+i*(w-1.7)/(potN-1||1);
     if(hh>.5&&i===1)continue;
     cyl(px,h+.30,roofZ+roofD*.30,.20,.34,M.terracotta);
     ball(px,h+.62,roofZ+roofD*.30,.26,.30,.26,i%2?M.leafOlive:M.leaf);
     if(i%3===0)ball(px+.10,h+.80,roofZ+roofD*.30,.16,.14,.16,M.leaf);
    }
    for(let i=0;i<2;i++)cyl(-w/2+.8+i*1.1,h+.24,roofZ-roofD*.28,.17,.28,M.terracottaDark);
    if(hh>.44)clothesline(w*.10,h+1.55,roofZ+roofD*.36,1.6,0);
    chimney(w*.34,h+.02,roofZ-roofD*.34,.85);
    if(hh>.4)chimney(-w*.26,h+.02,roofZ+roofD*.24,.72);
    if(hh>.5)antenna(-w*.30,h+.05,roofZ-roofD*.20,2.0+hh);
   }else{
    // stone cornice under the eaves, then the tiled roof
    cornice(0,h-.10,d/2+.02,w+.20,0,M.trimStone,.22,.18);
    cornice(0,h-.10,-d/2-.02,w+.20,Math.PI,M.trimStone,.22,.18);
    cornice(w/2+.02,h-.10,roofZ,d+.18,Math.PI/2,M.trimStone,.22,.18);
    cornice(-w/2-.02,h-.10,roofZ,d+.18,-Math.PI/2,M.trimStone,.22,.18);
    rise=tiledRoof({x:0,y:h,z:roofZ,rot:0,w,d:roofD,over:.34,pitch,hip:style==='hip',ridge:null,tint:Math.floor(hh*10),gableMat:style==='gable'?wall:null,detail:1});
    // chimney(s) near the ridge + occasional antenna
    chimney(w*.06,h+rise*.92,roofZ, .95);
    if(hh>.42)chimney(-w*.20,h+rise*.62,roofZ-roofD*.20,.78);
    if(hh>.55)antenna(-w*.34,h+rise*.75,roofZ+roofD*.18,2.1+hh);
   }
   // ---- ground floor ----
   for(let i=0;i<bays;i++){
    const bx=-w/2+bw*(i+.5);
    if(ground==='shop'&&i===Math.floor(bays/2))continue;
    if(ground==='arch'){
     const aw=bw*.66,ah=2.85;
     box(bx,ah/2,.06,aw,ah,.10,M.archDark);
     box(bx,ah/2,.13,aw*.16,ah,.04,M.woodDoor);
     box(bx,ah,.10,aw+.34,.26,.16,M.trimStone);
     box(bx,ah+.28,.10,aw*.58,.16,.14,M.trimStone);
     box(bx-.20,ah+.20,.10,aw*.22,.12,.14,M.trimStone);
     box(bx+.20,ah+.20,.10,aw*.22,.12,.14,M.trimStone);
     box(bx,ah+.46,.10,aw*.30,.12,.12,M.trimWhiteStone);
    }else{
     windowUnit(bx,1.95,d/2+.02,Math.min(1.35,bw*.42),1.75,0,{lit:litFor(id,'g',i),shutters:i%2===1,shutterColor,french:false});
    }
   }
   if(ground==='shop')shopfront(0,0,d/2+.02,w*.62,0,label,{awningColor,signColor});
   // ---- upper floors ----
   for(let f=1;f<floors;f++){
    const isTop=topSet&&f===floors-1;
    const yy=isTop?setH+(h-setH)/2:groundH+(f-.5)*fh;
    const fz=isTop?d/2-topSet+.02:d/2+.02;
    for(let i=0;i<bays;i++){
     const bx=-w/2+bw*(i+.5);
     const lit=litFor(id,f,i);
     const wantBalc=(!isTop&&f===1&&(i%3===1))||(f>=2&&((i+f+Math.round(hh*7))%4===1));
     const wantFlowers=hh>.5&&(i%2===0);
     windowUnit(bx,yy,fz,Math.min(1.42,bw*.44),1.62,0,{lit,shutters:i%2===0,shutterColor,french:french&&f===1&&!wantBalc,iron:wantBalc,flowers:wantFlowers,awning:f===1&&i%3===1&&!wantBalc,awningColor});
     // rear facade: simpler, still shuttered
     windowUnit(bx,yy,-d/2-.02,Math.min(1.3,bw*.40),1.5,Math.PI,{lit:litFor(id,f,'b'+i),shutters:true,shutterColor});
    }
    // side windows (only where depth allows)
    const ns=Math.max(1,Math.floor(d/3.4));
    for(let i=0;i<ns;i++){
     const zz=-d/2+(i+.5)*d/ns;
     const litR=litFor(id,f,'r'+i),litL=litFor(id,f,'l'+i);
     windowUnit(w/2+.02,yy,zz,1.05,1.44,Math.PI/2,{lit:litR,shutters:false,flowers:hh>.55&&i===0});
     windowUnit(-w/2-.02,yy,zz,1.05,1.44,-Math.PI/2,{lit:litL,shutters:false});
    }
    // pilasters at the corners of the piano nobile
    if(f===1&&!isTop)for(const side of[-1,1])box(side*(w/2-.02),yy,d/2+.03,.20,fh*.92,.10,M.trimLight);
   }
   // downpipes at the outward corners, with hoppers and elbows
   for(const side of[-1,1])downpipe(side*(w/2-.16),d/2+.10,.55,h-.25,0);
   // balcony under the first-floor windows: continuous stone slab
   if(floors>1&&w>5&&!topSet)box(0,groundH-.30,d/2+.16,w*.96,.16,.34,M.trimStone);
   // wall lamps flanking the shopfront
   if(hasLamp){
    wallLamp(-w*.30,groundH-.30,d/2+.04,0);
    if(w>6.2)wallLamp(w*.30,groundH-.30,d/2+.04,0);
   }
   // lantern over the entrance
   box(0,groundH-.62,d/2+.10,.42,.10,.10,M.iron);
   if(label&&label!=='CASA'){
    box(0,groundH-.86,d/2+.10,w*.52,.34,.07,M.signFrameIt);
    geometry(geo.plane,signMat(label,signColor,'#f3e2bd'),transform(0,groundH-.86,d/2+.135,w*.46,.26,1));
   }
  });
  const c=Math.abs(Math.cos(rot)),sn=Math.abs(Math.sin(rot));
  ctx.obstacles.push({x,z,w:w/2*c+(d+topSet)/2*sn+.25,d:(d+topSet)/2*c+w/2*sn+.25,label:id});
  return {id,height:h+y,width:w,depth:d,floors};
 }

 // ---------- casa (small village house) ----------
 function casa(spec){
  const s=spec||{};
  const id=s.id||'casa',x=s.x||0,z=s.z||0,w=s.w||4.4,d=s.d||5,floors=s.floors||2;
  const color=s.color||'#e2cdaa',finish=s.finish||'stucco',rot=s.rot||0,y=s.y!=null?s.y:.8;
  const label=s.label||'',door=s.door||M.woodDoor;
  const hh=H(id);
  const fh=2.82+hh*.24,groundH=3.05+H(id+'g')*.24;
  const h=groundH+(floors-1)*fh;
  const wall=surface(finish,color);
  const roofSpec=s.roof;
  const style=roofSpec==='terrace'?'terrace':(roofSpec==='gabled'||roofSpec==='gable'||roofSpec==='pitched')?'gable':'hip';
  const pitch=.40+hh*.24;
  const deckMat=surface('roofTile','#b4643f');
  const bays=Math.max(1,Math.round(w/2.6)),bw=w/bays;
  const hasQuoins=hh>.55;
  at(x,y,z,rot,()=>{
   if(y>.82)box(0,-(y-.78)/2,0,w,y-.78,d,M.trimStone);
   box(0,h/2,0,w,h,d,wall,0,true);
   box(0,.16,0,w+.08,.32,d+.08,M.trimStone);
   cornice(0,groundH,d/2+.02,w+.12,0,M.trimStone,.18,.16);
   // exposed stone quoins on some houses
   if(hasQuoins)quoinCorner(w,d,1,1,0,h-.3,M.trimStone);
   // ---- ground floor ----
   for(let i=0;i<bays;i++){
    const bx=-w/2+bw*(i+.5);
    if(i===Math.floor(bays/2)){
     // timber/arched door with stone surround and a shallow step
     box(bx,1.10,d/2+.03,.92,2.10,.09,door);
     box(bx+.16,1.12,d/2+.09,.05,.14,.04,M.brass);
     for(const sx of[-1,1])box(bx+sx*.52,1.10,d/2+.055,.10,2.20,.10,M.trimStone);
     box(bx,2.28,d/2+.06,1.24,.20,.14,M.trimLight);
     box(bx,2.40,d/2+.05,.72,.12,.10,M.trimWhiteStone);
     box(bx,.05,d/2+.28,.98,.10,.32,M.trimStone);
     if(hh>.5)flowerBox(bx+.10,2.52,d/2+.14,.62,0);
    }else windowUnit(bx,1.70,d/2+.02,Math.min(1.05,bw*.44),1.30,0,{lit:litFor(id,'g',i),shutters:true,shutterColor:M.shutterBrown,french:false,flowers:hh>.6&&i===0});
   }
   // ---- upper floors ----
   for(let f=1;f<floors;f++){
    const yy=groundH+(f-.5)*fh;
    for(let i=0;i<bays;i++){
     const wantBalc=(f===floors-1&&hh>.62&&i===0);
     windowUnit(-w/2+bw*(i+.5),yy,d/2+.02,Math.min(1.10,bw*.46),1.40,0,{lit:litFor(id,f,i),shutters:i%2===0,shutterColor:M.shutterBrown,french:f===1&&i%2===1&&!wantBalc,iron:wantBalc,flowers:hh>.45&&i%2===1});
    }
    for(const side of[-1,1])windowUnit(side*(w/2+.02),yy,0,1.0,1.35,side*Math.PI/2,{lit:litFor(id,f,'s'+side),shutters:false});
   }
   // ---- rear elevation: rarely the "back" in a hill town — give it windows,
   //      a back door and a drainpipe so the backs are not blank slabs ----
   {
    const nb=Math.max(1,Math.floor(bays/2)+1);
    for(let f=0;f<floors;f++){
     const yy=f===0?1.70:groundH+(f-.5)*fh;
     for(let i=0;i<nb;i++){
      const bx=-w/2+bw*((i+.5)*bays/nb);
      windowUnit(bx,yy,-d/2-.02,Math.min(1.02,bw*.40),f===0?1.25:1.32,Math.PI,{lit:litFor(id,'rb'+f,i),shutters:f>0,shutterColor:M.shutterBrown});
     }
    }
    if(hh>.40){
     box(w*.22,1.10,-d/2-.03,.88,2.05,.09,door);
     box(w*.22,2.26,-d/2-.05,1.14,.18,.12,M.trimLight);
     box(w*.22,.05,-d/2-.24,.94,.10,.30,M.trimStone);
    }
    downpipe(-w/2+.16,-d/2-.09,.4,h-.16,Math.PI);
   }
   // ---- roof ----
   let ridge=0;
   if(style==='terrace'){
    for(const zz of[-d/2+.06,d/2-.06])box(0,h+.22,zz,w+.16,.36,.11,M.trimStone);
    for(const xx of[-w/2+.06,w/2-.06])box(xx,h+.22,0,.11,.36,d+.16,M.trimStone);
    for(const zz of[-d/2+.06,d/2-.06])box(0,h+.42,zz,w+.22,.07,.16,M.trimWhiteStone);
    for(const xx of[-w/2+.06,w/2-.06])box(xx,h+.42,0,.16,.07,d+.22,M.trimWhiteStone);
    boxUV(0,h+.03,0,w-.08,.07,d-.08,deckMat,2.3);
    for(let i=0;i<Math.max(1,Math.floor(w/2.4));i++){const px=-w/2+.8+i*1.6;cyl(px,h+.25,-d*.22,.16,.28,M.terracotta);ball(px,h+.52,-d*.22,.22,.22,.22,i%2?M.leafOlive:M.leaf);}
    chimney(w*.28,h+.02,-d*.26,.7);
    if(hh>.5)antenna(-w*.30,h+.04,d*.22,1.7+hh);
   }else{
    cornice(0,h-.09,d/2+.02,w+.16,0,M.trimStone,.18,.15);
    cornice(0,h-.09,-d/2-.02,w+.16,Math.PI,M.trimStone,.18,.15);
    ridge=tiledRoof({x:0,y:h,z:0,rot:0,w,d,over:.34,pitch,hip:style==='hip',tint:Math.floor(hh*10),gableMat:style==='gable'?wall:null,detail:1});
    chimney(w*.26,h+ridge*.70,0,.72);
    if(hh>.55)antenna(-w*.30,h+ridge*.55,0,1.6+hh);
   }
   // drainpipe + occasional wall lamp
   downpipe(w/2-.14,d/2+.09,.4,h-.16,0);
   if(hh>.6)wallLamp(-w*.30,groundH-.30,d/2+.04,0);
   if(label){
    box(0,groundH-.36,d/2+.09,w*.52,.34,.07,M.signFrameIt);
    geometry(geo.plane,signMat(label,'#6b4a2c','#f3e2bd'),transform(0,groundH-.36,d/2+.135,w*.46,.26,1));
   }
  });
  const c=Math.abs(Math.cos(rot)),sn=Math.abs(Math.sin(rot));
  ctx.obstacles.push({x,z,w:w/2*c+d/2*sn+.22,d:d/2*c+w/2*sn+.22,label:id});
  return {id,height:h+y,width:w,depth:d,floors};
 }

 // ---------- trullo (Alberobello dry-stone cone roof) ----------
 function trullo(spec){
  const s=spec||{};
  const id=s.id||'trullo',x=s.x||0,z=s.z||0,r=s.r||1.6,height=s.height||2.9,y=s.y!=null?s.y:.8;
  const wall=surface('stone',s.color||'#e6e0d0');
  at(x,y,z,0,()=>{
   box(0,.10,0,r*2.06,.20,r*2.06,M.stoneFlag);
   cyl(0,height/2+.1,0,r,height,wall);
   cyl(0,height+.10,0,r+.06,.20,M.trimWhiteStone);
   // Dry-stone cone: broad grey courses stepping inward, tapering to a point.
   const coneH=r*1.55,rings=8;
   for(let i=0;i<rings;i++){
    const t=i/rings,rad=r*1.02*(1-t*.96);
    cyl(0,height+.20+coneH*(i+.5)/rings,0,rad,coneH/rings+.03,i%2?M.stoneRoof:M.stoneRoofLight);
   }
   const apex=height+.20+coneH;
   cyl(0,apex+.10,0,.055,.30,M.trimWhite);
   ball(0,apex+.30,0,.13,.15,.13,M.trimWhite);
   // whitewashed triangular gable over the door + the painted roof symbol
   const gy=height+.18;
   box(0,gy+.10,r*.72,.78,.22,.06,M.trimWhite);
   geometry(geo.box,M.trimWhite,transform(0,gy+.28,r*.70,.56,.26,.05,0,0,0));
   for(const a of[.5,-.5])box(0,height+coneH*.42,r*.60,.05,coneH*.34,.02,M.trimWhite,0,0,a);
   box(0,height+coneH*.30,r*.66,.26,.05,.02,M.trimWhite);
   // arched door with a white surround and a step
   box(0,.72,r+.03,.68,1.34,.09,M.archDark);
   box(0,1.44,r+.03,.86,.16,.12,M.trimWhite);
   for(const sx of[-.44,.44])box(sx,.72,r+.04,.10,1.40,.10,M.trimWhite);
   box(0,.04,r+.10,.92,.10,.40,M.trimWhite);
   box(0,.70,r+.13,.16,.16,.03,M.brass);
   // tiny square window
   box(r*.52,height*.70,r*.40,.28,.30,.07,M.windowDark);
   box(r*.52,height*.70+.19,r*.40,.34,.06,.09,M.trimWhite);
  });
  ctx.obstacles.push({x,z,w:r+.35,d:r+.35,label:id});
  return {id,height:height+2.4,width:r*2,depth:r*2};
 }

 // ---------- bell tower / campanile ----------
 function bellTower(spec){
  const s=spec||{};
  const id=s.id||'campanile',x=s.x||0,z=s.z||0,rot=s.rot||0,y=s.y!=null?s.y:.8;
  const size=s.size||2.9,height=s.height||18.5,color=s.color||'#d5c39e';
  const showClock=s.clock!==false,showBells=s.bells!==false;
  const wall=surface('stone',color);
  const belfryH=Math.max(3.1,size*1.18);
  const belfryBase=height-belfryH;
  const capRise=size*(s.capRise!=null?s.capRise:.62);
  const crossH=.95;
  at(x,y,z,rot,()=>{
   const hw=size/2;
   // plinth
   box(0,.15,0,size+.36,.30,size+.36,M.trimStone,0,true);
   box(0,.38,0,size+.20,.16,size+.20,M.trimDark);
   // shaft: stacked boxes so the stone courses repeat naturally up the tower
   const baseY=.50,shaftH=Math.max(2,belfryBase-.50);
   const segs=Math.max(3,Math.round(shaftH/3.1)),sh=shaftH/segs;
   for(let i=0;i<segs;i++)box(0,baseY+sh*(i+.5),0,size,sh,size,wall,0,i===0||i===segs-1);
   // corner pilasters
   for(const sx of[-1,1])for(const sz of[-1,1]){
    box(sx*(hw-.14),baseY+shaftH/2,sz*(hw-.14),.30,shaftH,.30,M.trimLightStone);
    box(sx*(hw-.14),belfryBase-.17,sz*(hw-.14),.38,.22,.38,M.trimWhiteStone);
    box(sx*(hw-.14),baseY+.17,sz*(hw-.14),.38,.24,.38,M.trimStone);
   }
   // string courses
   for(const f of[.34,.68])for(let face=0;face<4;face++)cornice(0,baseY+shaftH*f,0,size+.22,face*Math.PI/2,M.trimStone,.18,.16);
   // slim arched vents on the shaft
   for(let face=0;face<4;face++){
    at(0,baseY+shaftH*.50,0,face*Math.PI/2,()=>{
     box(0,0,hw+.015,.52,1.60,.08,M.paintShadow);
     box(0,.86,hw+.035,.78,.18,.13,M.trimStone);
     box(0,-.86,hw+.035,.84,.15,.13,M.trimStone);
     for(const sx of[-1,1])box(sx*.33,0,hw+.035,.11,1.72,.09,M.trimLightStone);
     for(let k=0;k<4;k++)box(0,-.54+k*.36,hw+.05,.42,.055,.055,M.woodDark);
    });
   }
   // clock faces on all four elevations
   if(showClock)for(let face=0;face<4;face++){
    at(0,belfryBase-.78,0,face*Math.PI/2,()=>{
     geometry(clockGeo,M.trimStone,transform(0,0,hw+.02,.80,.10,.80,Math.PI/2,0,0));
     geometry(clockGeo,M.trimWhiteStone,transform(0,0,hw+.05,.72,.06,.72,Math.PI/2,0,0));
     geometry(clockGeo,clockMaterial(),transform(0,0,hw+.085,.66,.05,.66,Math.PI/2,0,0));
    });
   }
   // belfry: corner piers, arched openings with bells and louvers
   const by0=belfryBase,by1=height;
   box(0,(by0+by1)/2,0,size-.52,belfryH*.86,size-.52,M.paintShadow); // dark interior
   for(const sx of[-1,1])for(const sz of[-1,1])box(sx*(hw-.18),(by0+by1)/2,sz*(hw-.18),.42,belfryH,.42,M.trimLightStone);
   const opW=size*.58,opR=opW/2,sill=by0+.46,archTop=by1-.40,spring=archTop-opR;
   for(let face=0;face<4;face++){
    at(0,0,0,face*Math.PI/2,()=>{
     // wall panel with a true arched cut-out (clean silhouette from every side)
     const shape=new THREE.Shape();
     const half=size/2;
     shape.moveTo(-half,0);shape.lineTo(half,0);shape.lineTo(half,belfryH);shape.lineTo(-half,belfryH);shape.closePath();
     const hole=new THREE.Path();
     hole.moveTo(-opR,sill-by0);
     hole.lineTo(opR,sill-by0);
     hole.lineTo(opR,spring-by0);
     hole.absarc(0,spring-by0,opR,0,Math.PI,false);
     hole.lineTo(-opR,sill-by0);
     shape.holes.push(hole);
     const panel=new THREE.ExtrudeGeometry(shape,{depth:.22,bevelEnabled:false,curveSegments:12});
     geometry(panel,M.trimLightStone,transform(0,by0,hw-.22));
     panel.dispose();
     // voussoir ring proud of the opening
     for(let k=0;k<9;k++){
      const a=Math.PI*k/8;
      geometry(geo.box,(k===4?M.trimWhiteStone:M.trimStone),transform(Math.cos(a)*(opR+.10),spring+Math.sin(a)*(opR+.10),hw+.03,.26,.19,.13,0,0,a-Math.PI/2));
     }
     // impost + sill blocks
     for(const sx of[-1,1])box(sx*(opR+.06),spring-.02,hw+.03,.26,.15,.15,M.trimWhiteStone);
     box(0,sill-.10,hw+.03,opW+.34,.20,.16,M.trimStone);
     // louvered slats + the bell
     for(let k=0;k<4;k++)box(0,sill+.30+k*.34,hw-.34,opW*.88,.075,.09,M.woodDark);
     if(showBells){
      box(0,spring-.36,hw-.42,opW*.70,.15,.15,M.woodDark);
      geometry(geo.cone,M.bronze,transform(0,spring-.62,hw-.42,size*.15,size*.30,size*.15));
      ball(0,spring-.80,hw-.42,.065,.075,.065,M.brass);
     }
    });
   }
   // top cornice + corbels
   for(let face=0;face<4;face++){
    cornice(0,by1-.16,0,size+.36,face*Math.PI/2,M.trimStone,.26,.28);
    at(0,by1-.52,0,face*Math.PI/2,()=>{
     for(const sx of[-.34,0,.34])box(sx*(size)*.9,-.30,hw+.10,.20,.30,.26,M.trimStone);
    });
   }
   // parapet + corner pinnacles
   for(const sx of[-1,1])for(const sz of[-1,1]){
    box(sx*hw,by1+.10,sz*hw,.46,.28,.46,M.trimStone);
    geometry(geo.cone,M.trimWhiteStone,transform(sx*hw,by1+.72,sz*hw,.21,.95,.21));
    ball(sx*hw,by1+1.22,sz*hw,.095,.115,.095,M.brass);
   }
   // tiled pyramidal cap
   tiledRoof({x:0,y:height,z:0,rot:0,w:size*1.0,d:size*1.0,over:.16,hip:true,pyramid:true,detail:.75,rise:capRise,tint:2});
   // finial + cross
   const fy=height+capRise;
   ball(0,fy+.10,0,.19,.21,.19,M.brass);
   pipe([0,fy+.10,0],[0,fy+.10+crossH,0],.043,M.iron);
   box(0,fy+crossH*.64,0,.60,.055,.055,M.iron);
   box(0,fy+crossH*.78,0,.34,.045,.045,M.iron);
   ball(0,fy+crossH+.05,0,.055,.055,.055,M.brass);
  });
  const c=Math.abs(Math.cos(rot)),sn=Math.abs(Math.sin(rot));
  ctx.obstacles.push({x,z,w:size/2*(c+sn)+.28,d:size/2*(c+sn)+.28,label:id});
  return {id,height:y+height+capRise+crossH,width:size,depth:size};
 }
 function campanile(spec){return bellTower(spec);}

 // ---------- church: stone landmark with attached bell tower ----------
 // church({id,x,z,w,d,h,color,tower}) — front facade faces +Z at z+d/2.
 function church(spec){
  const s=spec||{};
  const id=s.id||'chiesa',x=s.x||0,z=s.z||0,rot=s.rot||0,y=s.y!=null?s.y:.8;
  const w=s.w!=null?s.w:(s.width!=null?s.width:8.4);
  const dep=s.d!=null?s.d:(s.depth!=null?s.depth:9.0);
  const h=s.h!=null?s.h:(s.height!=null?s.height:12.5);
  const color=s.color||'#d8c7a4';
  const towerColor=(typeof s.tower==='string'&&s.tower)||s.towerColor||'#cbb894';
  const base=.16;
  const stone=surface('stone',color);
  const dressing=surface('plaster','#e6dcc4');
  const stoneTrim=surface('stone','#c9b998');
  const roofPitch=.54,roofOver=.55;
  const roofRise=roofPitch*(w/2+roofOver);
  const apex=h+roofRise;
  const fw=w+.7;
  // tower sits on the WEST/BACK corner, inside the scene's 12.4 x 10 envelope
  const ts=s.towerSize||Math.max(2.6,w*.35);
  const towerCap=ts*.62;
  const towerCross=.95;
  const th=s.towerHeight!=null?s.towerHeight:Math.max(15,(s.towerTotal||24)-towerCap-towerCross);
  const lx=-(w/2+ts/2-.24),lz=-(dep/2-ts/2+.24);
  const cosr=Math.cos(rot),sinr=Math.sin(rot);
  const tx=x+lx*cosr+lz*sinr,tz=z-lx*sinr+lz*cosr;
  const fz=dep/2; // structural facade plane (local +Z face)
  const sideChapels=w>6;

  at(x,y,z,rot,()=>{
   // ---- plinth / threshold (structural mass stays inside the scene slot) ----
   boxUV(0,base/2,0,w+.9,base,dep+.06,stoneTrim,2.4);
   box(0,base+.05,fz-.10,w*.60,.10,.20,M.trimStone);
   // ---- nave body ----
   boxUV(0,(base+h)/2,0,w,h-base,dep,stone,2.7);
   // ---- gabled tiled roof (ridge front-to-back) ----
   tiledRoof({x:0,y:h+.02,z:0,rot:0,w,d:dep,over:roofOver,hip:false,ridge:'z',tint:1,detail:1});
   // side eaves cornice
   cornice(w/2+.03,h-.06,0,dep+.24,Math.PI/2,M.trimStone,.32,.28);
   cornice(-w/2-.03,h-.06,0,dep+.24,-Math.PI/2,M.trimStone,.32,.28);
   cornice(0,h-.06,-fz-.02,w+.42,Math.PI,M.trimStone,.30,.26);
   // back gable infill above the apse
   triWall([-w/2,0,-fz],[w/2,0,-fz],[0,roofRise,-fz],stone);
   // ---- decorative facade plane (trim sits proud of it) ----
   boxUV(0,(base+h)/2,4.36,fw,h-base,.24,dressing,2.7);
   // string course + entablature + dentils
   box(0,base+.54,4.55,fw+.22,.20,.26,M.trimStone);
   box(0,h-.34,4.55,fw+.34,.40,.30,M.trimStone);
   for(let i=0;i<Math.round(fw/.55);i++){
    const px=-fw/2+.28+i*.55;
    box(px,h-.62,4.52,.18,.14,.13,i%2?M.trimWhiteStone:M.trimLightStone);
   }
   // pilasters: edges + portal flanks
   const pxs=[-(fw/2-.30),-(w*.20),w*.20,(fw/2-.30)];
   for(const px of pxs){
    box(px,(base+h)/2,4.56,.44,h-base,.30,M.trimLightStone);
    box(px,h-.64,4.58,.62,.34,.34,M.trimWhiteStone);
    box(px,base+.30,4.58,.62,.38,.34,M.trimStone);
   }
   // gable mass (front and back, reaching the roof edge so the eaves never
   // expose a dark cavity over the facade) + raking cornices + apex cross
   const gFront=fz+roofOver-.02;
   {
    const g=new THREE.Shape();
    g.moveTo(-fw/2,0);g.lineTo(fw/2,0);g.lineTo(0,roofRise);g.closePath();
    const eg=new THREE.ExtrudeGeometry(g,{depth:gFront-4.30,bevelEnabled:false});
    geometry(eg,dressing,transform(0,h,4.30));
    eg.dispose();
    const eg2=new THREE.ExtrudeGeometry(g,{depth:gFront-4.30,bevelEnabled:false});
    geometry(eg2,dressing,transform(0,h,-gFront));
    eg2.dispose();
   }
   const slopeL=Math.hypot(fw/2,roofRise),ang=Math.atan2(roofRise,fw/2);
   for(const side of[-1,1]){
    geometry(geo.box,M.trimStone,transform(side*fw*.25,h+roofRise/2,gFront-.10,slopeL,.24,.30,0,0,-side*ang));
   }
   box(0,h+.02,gFront-.12,fw+.24,.24,.32,M.trimStone);
   // oculus in the gable: the one facade ornament that clears the rooflines
   {
    const oy=h+roofRise*.42,oz=gFront+.015;
    geometry(circleGeo,M.trimStone,transform(0,oy,oz,.74,.74,1));
    geometry(circleGeo,roseMaterial(),transform(0,oy,oz+.02,.56,.56,1));
    for(let k=0;k<12;k++){
     const a=k/12*Math.PI*2;
     geometry(geo.box,(k%2?M.trimWhiteStone:M.trimStone),transform(Math.cos(a)*.64,oy+Math.sin(a)*.64,oz+.03,.15,.13,.10,0,0,a));
    }
    box(0,oy-.80,oz+.03,1.05,.13,.16,M.trimStone);
   }
   // cross finial on the apex
   pipe([0,h+roofRise+.06,gFront-.16],[0,h+roofRise+1.05,gFront-.16],.045,M.iron);
   box(0,h+roofRise+.75,gFront-.16,.52,.055,.055,M.iron);
   ball(0,h+roofRise+.06,gFront-.16,.15,.17,.15,M.brass);
   // ---- rose window ----
   const ry=base+(h-base)*.60;
   geometry(circleGeo,M.trimStone,transform(0,ry,4.515,1.18,1.18,1));
   geometry(circleGeo,roseMaterial(),transform(0,ry,4.540,1.02,1.02,1));
   for(let k=0;k<18;k++){
    const a=k/18*Math.PI*2;
    geometry(geo.box,(k%2?M.trimLightStone:M.trimStone),transform(Math.cos(a)*1.10,ry+Math.sin(a)*1.10,4.560,.20,.17,.15,0,0,a));
   }
   box(0,ry+1.26,4.52,1.5,.16,.20,M.trimWhiteStone);
   // ---- portal: recessed arch, timber doors, stone surround, pediment ----
   const pw=2.35,ph=4.45,pr=pw/2,spring=ph-pr;
   box(0,base+spring/2,4.42,pw,spring,.14,M.archDark);
   geometry(circleHalfGeo,M.archDark,transform(0,base+spring,4.425,pr,pr,1));
   // timber double door, battens, studs, ring handles
   for(const side of[-1,1]){
    box(side*pw*.235,base+1.55,4.48,pw*.45,3.02,.10,M.woodDoor);
    for(const k of[-.62,.62])box(side*pw*.235,base+1.55+k,4.54,pw*.38,.10,.03,M.woodDark);
    for(let st=0;st<3;st++)for(let sl=0;sl<2;sl++)ball(side*pw*.235+(sl-.5)*pw*.24,base+.65+st*.98,4.545,.035,.035,.02,M.brass);
    cyl(side*pw*.10,base+1.55,4.55,.07,.02,M.brass,Math.PI/2);
   }
   box(0,base+1.55,4.49,.07,3.02,.12,M.woodDark);
   // stone jambs + voussoir arch
   for(const side of[-1,1]){
    for(let k=0;k<5;k++)box(side*(pw/2+.16),base+.42+k*.86,4.52,.34,.78,.24,STONE_T[(k+1)%STONE_T.length]);
    box(side*(pw/2+.16),base+spring+.06,4.53,.34,.36,.26,M.trimWhiteStone);
   }
   archRing(pw,ph,4.54,M.trimStone,.13);
   // hood + small triangular pediment over the portal
   box(0,base+ph+.28,4.53,pw+.9,.22,.28,M.trimStone);
   {
    const g2=new THREE.Shape();
    g2.moveTo(-(pw+.55)/2,0);g2.lineTo((pw+.55)/2,0);g2.lineTo(0,.62);g2.closePath();
    const eg=new THREE.ExtrudeGeometry(g2,{depth:.26,bevelEnabled:false});
    geometry(eg,dressing,transform(0,base+ph+.38,4.38));
    eg.dispose();
   }
   // dedication plaque (optional)
   if(s.label){
    box(0,base+ph+1.22,4.50,Math.min(4.6,w*.62),.58,.12,M.trimStone);
    geometry(geo.plane,signMat(s.label,s.signColor||'#4c3a24','#f3e2bd'),transform(0,base+ph+1.22,4.575,Math.min(4.1,w*.56),.40,1));
   }
   // ---- side elevations: pilasters, arched windows, buttress caps ----
   for(const side of[-1,1]){
    const sx=side*(w/2+.10);
    for(let i=0;i<3;i++){
     const zz=-dep*.34+i*dep*.34;
     box(sx,(base+h)/2,zz,.34,h-base,.36,M.trimStone);
     box(sx,h-.60,zz,.46,.34,.48,M.trimWhiteStone);
     box(sx,base+.40,zz,.46,.44,.48,M.trimStone);
    }
    for(const zz of[-dep*.19,dep*.19]){
     const wy=base+h*.40;
     at(side*(w/2+.02),wy,zz,side*Math.PI/2,()=>{
      const ww=1.12,wh=2.42,sp=wh-ww/2;
      box(0,sp/2,-.02,ww,sp,.10,M.paintShadow);
      box(0,sp/2,.015,ww*.94,sp*.94,.06,M.windowDark);
      archFill(ww,wh,M.windowDark,.02);
      if(H(id+'sw'+zz)>.4)geometry(circleHalfGeo,M.warmDim,transform(0,sp,.035,ww*.30,ww*.30,1));
      for(const j of[-1,1])box(j*(ww/2+.07),sp/2,.04,.13,sp+.06,.11,M.trimStone);
      archRing(ww,wh,.04,M.trimStone,.10);
      box(0,-.09,.10,ww+.36,.16,.24,M.trimStone);
      box(0,-.18,.035,ww+.26,.07,.11,M.trimDark);
     });
    }
   }
   // ---- side chapels (west side, ahead of the tower) ----
   if(sideChapels){
    for(const cz of[-.40,1.90]){
     const cw=1.30,cl=1.80,cH=4.30,cx=-(w/2+cw/2-.14);
     box(cx,cH/2,cz,cw,cH,cl,stone,0,true);
     box(cx,cH+.05,cz,cw+.18,.13,cl+.18,M.trimStone);
     tiledRoof({x:cx,y:cH+.13,z:cz,w:cw,d:cl,over:.26,hip:true,ridge:'z',detail:.5,tint:3});
     at(cx-cw/2-.02,cH*.40,cz,-Math.PI/2,()=>{
      const ww=.82,wh=1.90,sp=wh-ww/2;
      box(0,sp/2,.015,ww*.94,sp*.94,.06,M.windowDark);
      archFill(ww,wh,M.windowDark,.02);
      for(const j of[-1,1])box(j*(ww/2+.06),sp/2,.04,.11,sp+.04,.10,M.trimStone);
      archRing(ww,wh,.04,M.trimStone,.09);
      box(0,-.08,.09,ww+.30,.14,.20,M.trimStone);
     });
    }
   }
   // ---- apse: shallow polygonal end (stays inside the scene envelope) ----
   const apseH=h*.50;
   geometry(geo.cyl,stone,transform(0,apseH/2+.02,-fz+.18,2.05,apseH,.62));
   geometry(geo.cyl,M.trimStone,transform(0,apseH+.04,-fz+.18,2.16,.22,.70));
   ball(0,apseH+.16,-fz+.18,2.05,.80,.66,M.stoneRoof);
   // apse lantern
   cyl(0,apseH+1.64,-fz+.18,.22,.34,M.trimWhite);
   geometry(geo.cone,M.terracotta,transform(0,apseH+1.99,-fz+.18,.30,.34,.30));
   pipe([0,apseH+2.14,-fz+.18],[0,apseH+2.62,-fz+.18],.028,M.iron);
   box(0,apseH+2.44,-fz+.18,.28,.035,.035,M.iron);
   // apse blind arcade: shallow pilaster strips proud of the rounded end
   for(let k=-2;k<=2;k++){
    box(k*.72,apseH*.50,-fz-.42,.46,apseH*.66,.11,M.trimStone);
    box(k*.72,apseH*.86,-fz-.45,.62,.13,.15,M.trimWhiteStone);
   }
   // ---- sacristy: low annex tucked behind the nave, inside the slot ----
   const sacZ=-dep/2-.10,sacX=w*.30,sacH=2.9;
   box(sacX,sacH/2,sacZ,2.1,sacH,1.15,dressing,0,true);
   box(sacX,sacH+.04,sacZ,2.28,.12,1.30,M.trimStone);
   tiledRoof({x:sacX,y:sacH+.15,z:sacZ,w:2.1,d:1.15,over:.26,hip:true,detail:.5,tint:0});
   box(sacX+1.06,1.15,sacZ-.10,.12,1.5,.70,M.woodDoor);
  });
  // attached bell tower (west/back corner)
  const towerInfo=bellTower({id:id+'-torre',x:tx,z:tz,size:ts,height:th,color:towerColor,rot,y,clock:true});
  // footprint obstacles: nave + the west chapel pair (tower registers itself)
  const c=Math.abs(cosr),sn=Math.abs(sinr);
  ctx.obstacles.push({x,z,w:(w/2*c+(dep/2+.40)*sn)+.25,d:((dep/2+.40)*c+w/2*sn)+.25,label:id});
  {
   const chLx=-(w/2+1.30/2-.14),chLz=.75;
   const ox=x+chLx*cosr+chLz*sinr,oz=z-chLx*sinr+chLz*cosr;
   ctx.obstacles.push({x:ox,z:oz,w:.90*c+2.10*sn,d:2.10*c+.90*sn,label:id+'-chapels'});
  }
  return {id,height:y+Math.max(apex,towerInfo.height-y),width:fw,depth:dep,tower:towerInfo};
 }

 return {palazzo,campanile,trullo,casa,windowUnit,cornice,shopfront,surface,church,bellTower,tiledRoof,flowerBox};
}
