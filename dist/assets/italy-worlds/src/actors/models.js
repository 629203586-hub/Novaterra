import * as THREE from '../../vendor/three/build/three.module.js';
export function createActors(ctx){
const {scene,M,mat,random,rr,pick,state,emissives}=ctx,clamp=THREE.MathUtils.clamp;const {geo}=ctx.batch;const labels=ctx.config.traffic.labels;
const {signMat}=ctx.signage;const dynamicParts=[],trafficRoots=[],people=[];
const clips=[new THREE.Plane(new THREE.Vector3(1,0,0),ctx.config.terrain.width/2),new THREE.Plane(new THREE.Vector3(-1,0,0),ctx.config.terrain.width/2),new THREE.Plane(new THREE.Vector3(0,0,1),ctx.config.terrain.depth/2),new THREE.Plane(new THREE.Vector3(0,0,-1),ctx.config.terrain.depth/2)];
function part(parent,kind,m,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){const mesh=new THREE.Mesh(geo[kind],m);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.rotation.set(rx,ry,rz);parent.add(mesh);dynamicParts.push(mesh);return mesh;}
function pivot(parent,x,y,z){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}

// ---------------------------------------------------------------- people palette
// Everything is shared through ctx.mat's cache, so this stays inside the same
// InstancedMesh bins the scene already uses instead of creating a material per
// villager. The list is deliberately bounded: 18 garments, 7 trousers, 6 hairs,
// 5 skins; patterns/hats/bags reuse those same materials.
const CLOTHES=['#bf604c','#d9c6a4','#365b73','#6e7b59','#404855','#d1b265','#91a4a1','#675b76','#c18d89','#73839b','#a1b0c1','#dfddd1','#263d53','#c96f4a','#7e8b5c','#d8a84e','#5f6f96','#b25b62'].map(c=>mat(c));
const TROUSERS=[M.dark,M.black,M.slate,M.maroon,M.iron,mat('#4a5a74'),mat('#6b5a45')];
const SKINS=[M.skin1,M.skin2,M.skin3,M.skin4,mat('#c99a74')];
const HAIRS=[M.hair,M.hair2,M.hair3,mat('#c9a45c'),mat('#8a4a30'),mat('#d8d5cc')];
const SHOES=[M.black,M.woodDark,M.dark];
const HATS=[M.dark,M.cream,M.woodLight,M.awningCream,M.maroon];
const ACCENTS=[M.trimWhite,M.cream,M.awningCream,M.trimLight,M.paintBlue,M.paintRed];

// Deterministic village casting: a few children, elders and café staff so the
// crowd reads as a borgo, not a uniform parade. Indices 0..3 are the crossers.
const CHILDREN={2:1,11:1,19:1,26:1},ELDERS={5:1,17:1,28:1},STAFF={20:1,25:1};
const GROUND_Y=.81,HIP_Y=.50,SEAT_TOP=1.265;

// Hair styles: 0 short, 1 bob, 2 long, 3 ponytail, 4 bun, 5 slick crop, 6 thin/bald.
function buildHair(head,style,hairMat,fringe=true){
 const R=(x,y,z,sx,sy,sz,rx=0,ry=0,rz=0)=>part(head,'round',hairMat,x,y,z,sx,sy,sz,rx,ry,rz);
 const B=(x,y,z,sx,sy,sz,rx=0,ry=0,rz=0)=>part(head,'box',hairMat,x,y,z,sx,sy,sz,rx,ry,rz);
 R(0,.178,-.028,.154,.132,.150);
 if(style===0){
  if(fringe)B(0,.188,.075,.235,.05,.105);
  for(const s of[-1,1])B(s*.13,.115,-.02,.055,.11,.16);
 }else if(style===1){
  B(0,.10,-.115,.27,.18,.075);
  for(const s of[-1,1])B(s*.14,.09,-.01,.055,.19,.19);
  if(fringe)B(0,.19,.072,.255,.055,.11);
 }else if(style===2){
  B(0,.02,-.125,.28,.30,.07);
  for(const s of[-1,1])B(s*.15,.08,.0,.055,.24,.19);
  if(fringe)B(0,.19,.072,.26,.06,.11);
 }else if(style===3){
  R(0,.10,-.17,.07,.115,.07);
  B(0,.155,-.135,.075,.035,.045);
  if(fringe)B(0,.19,.075,.23,.055,.10);
 }else if(style===4){
  R(0,.235,-.095,.08,.075,.08);
  for(const s of[-1,1])B(s*.13,.13,-.02,.05,.10,.15);
  if(fringe)B(0,.19,.072,.22,.05,.10);
 }else if(style===5){
  for(const s of[-1,1])B(s*.12,.145,.0,.05,.08,.14);
 }else{
  // thin/bald crown: only a low band at the back
  R(0,.125,-.13,.13,.075,.09);
  for(const s of[-1,1])B(s*.135,.07,-.045,.045,.06,.12);
 }
}
// Hats sit on the head group; kinds share a handful of kit colours.
function buildHat(head,kind,hatMat,bandMat,index){
 if(kind==='cap'){
  part(head,'round',hatMat,0,.238,.004,.152,.075,.150);
  part(head,'box',hatMat,0,.196,.132,.205,.022,.125);
 }else if(kind==='straw'){
  part(head,'round',hatMat,0,.205,0,.248,.020,.248);
  part(head,'round',hatMat,0,.262,-.01,.132,.085,.124);
  part(head,'box',bandMat,0,.232,0,.252,.028,.248);
 }else if(kind==='bucket'){
  part(head,'round',hatMat,0,.232,0,.154,.092,.150);
  part(head,'round',hatMat,0,.175,0,.202,.030,.202);
 }else if(kind==='beret'){
  part(head,'round',hatMat,-.012,.246,-.012,.176,.055,.166,0,0,.16);
  part(head,'box',bandMat,-.012,.214,-.012,.30,.022,.30);
 }else if(kind==='flat'){
  part(head,'round',hatMat,0,.228,-.008,.162,.058,.155);
  part(head,'box',hatMat,0,.194,.128,.185,.020,.105);
  part(head,'box',bandMat,0,.208,-.03,.245,.026,.22);
 }else if(kind==='scarf'){
  part(head,'round',hatMat,0,.172,-.022,.163,.140,.155);
  part(head,'box',hatMat,0,.085,-.148,.075,.065,.055);
 }
}

function character(index,opts={}){
 const mode=opts.mode||'walking';
 const child=!!CHILDREN[index],elder=!child&&!!ELDERS[index],staff=!child&&!elder&&!!STAFF[index];
 const height=child?rr(.82,.94):elder?rr(.97,1.06):rr(1.09,1.25);
 const bodyWidth=child?rr(.285,.345):elder?rr(.325,.395):rr(.305,.405);
 const skin=SKINS[(index*3+1)%SKINS.length];
 const shirt=CLOTHES[(index*5+2)%CLOTHES.length];
 const trousers=TROUSERS[(index*2+(child?2:0))%TROUSERS.length];
 const hairMat=elder?HAIRS[(index%2)?2:5]:child?HAIRS[(index*3)%4]:HAIRS[(index*5+1)%HAIRS.length];
 const shoe=SHOES[(index*3)%SHOES.length];
 const dress=!child&&!staff&&(index%9===1||index%9===4);
 const jacket=!child&&!elder&&!staff&&index%6===2;
 const shortSleeve=child||index%5===0;
 const shortLegs=child;
 const female=dress||index%4!==1;
 const walkAmp=child?1.12:elder?.52:female?.92:1;
 const root=new THREE.Group();scene.add(root);root.scale.setScalar(height);
 const body=pivot(root,0,0,0);

 // hips + torso: stacked boxes give a tapered silhouette without new geometry bins
 part(body,'box',trousers,0,.49,0,bodyWidth*.86,.16,.20);
 part(body,'box',trousers,0,.555,0,bodyWidth*.90,.05,.205);
 if(!dress){
  part(body,'box',shirt,0,.63,0,bodyWidth*.88,.14,.195);
  part(body,'box',shirt,0,.755,0,bodyWidth,.23,.205);
  part(body,'box',shirt,0,.872,0,bodyWidth*1.04,.075,.195);
 }else{
  part(body,'box',shirt,0,.60,0,bodyWidth*.86,.11,.195);
  part(body,'box',shirt,0,.745,0,bodyWidth*.98,.19,.205);
  part(body,'box',shirt,0,.865,0,bodyWidth*1.02,.075,.19);
  part(body,'box',shirt,0,.455,0,bodyWidth*.94,.30,.215);
  part(body,'box',shirt,0,.255,0,bodyWidth*1.20,.22,.245);
 }
 // neck + shoulders
 part(body,'cyl',skin,0,.925,0,.043,.075,.043);
 // shirt patterns (shared accent materials, so no extra bins)
 const hsl={};shirt.color.getHSL(hsl);
 const accent=hsl.l>.58?M.dark:M.trimWhite;
 if(index%4===0&&!dress)for(let k=0;k<3;k++)part(body,'box',accent,0,.675+k*.075,.002,bodyWidth*(k===1?1.0:.90),.022,.214);
 else if(index%4===2&&!dress)for(const s of[-1,1])part(body,'box',accent,s*bodyWidth*.15,.755,.108,.045,.21,.016);
 if(jacket){for(const s of[-1,1])part(body,'box',M.dark,s*(bodyWidth*.42),.80,.0,.055,.20,.19);part(body,'box',M.dark,0,.80,-.098,bodyWidth*.95,.20,.02);}
 if(index%7===3&&!child&&!dress)part(body,'box',M.iron,0,.545,0,bodyWidth*.9,.032,.21); // belt
 // scarf
 if(index%5===3&&!child&&mode!=='dining'){part(body,'box',accent,0,.925,.02,.135,.055,.15);part(body,'box',accent,0,.83,.115,.055,.17,.022);}
 // apron for the café staff
 if(staff){
  part(body,'box',M.trimWhite,0,.66,.107,bodyWidth*.80,.34,.022);
  part(body,'box',M.trimWhite,0,.552,0,bodyWidth*.92,.024,.215);
  for(const s of[-1,1])part(body,'box',M.trimWhite,s*bodyWidth*.22,.80,.10,.022,.16,.02);
 }
 // head
 const head=pivot(body,0,.95,0);
 part(head,'round',skin,0,.13,0,.145,.17,.142);
 part(head,'round',skin,0,.062,.048,.098,.072,.092);
 part(head,'round',skin,0,.118,.143,.024,.032,.030);
 for(const s of[-1,1])part(head,'round',skin,s*.148,.118,-.004,.028,.048,.030);
 for(const s of[-1,1])part(head,'box',M.black,s*.05,.144,.129,.026,.030,.014);
 for(const s of[-1,1])part(head,'box',hairMat,s*.052,.174,.130,.043,.012,.014);
 part(head,'box',M.maroon,0,.068,.139,.048,.012,.012);
 // hair
 const hairStyle=elder?6:child?(index%3):(index*3)%7;
 buildHair(head,hairStyle,hairMat,!(elder&&index%2));
 // hats: tourists, a few villagers, some elders
 let hatKind=null;
 if(mode==='taking-photo')hatKind=index%2?'bucket':'cap';
 else if(elder&&index%4===1)hatKind='flat';
 else if(child&&index%3===0)hatKind='cap';
 else if(!staff&&!elder&&index%5===2)hatKind=index%2?'straw':'cap';
 else if(dress&&index%4===0)hatKind='straw';
 else if(elder&&index%3===2)hatKind='scarf';
 const hatMat=hatKind==='scarf'?CLOTHES[(index*7+4)%CLOTHES.length]:HATS[(index*3+(child?1:0))%HATS.length];
 const bandMat=hatKind==='scarf'?M.awningCream:HATS[(index*5+2)%HATS.length];
 if(hatKind)buildHat(head,hatKind,hatMat,bandMat,index);
 const sunglasses=mode==='taking-photo'||(!child&&index%9===4)||(elder&&index%6===5);
 if(sunglasses)part(head,'box',M.black,0,.146,.138,.198,.034,.02);

 // arms: shoulder -> upper arm -> elbow -> forearm -> hand
 const arms=[],elbows=[];
 for(const side of[-1,1]){
  const upperMat=jacket?M.dark:shirt;
  const lowerMat=jacket?shirt:(shortSleeve?skin:shirt);
  const sh=pivot(body,side*(bodyWidth/2+.055),.862,0);
  part(sh,'box',upperMat,0,-.095,0,.088,.19,.105);
  const el=pivot(sh,0,-.19,0);
  part(el,'box',lowerMat,0,-.085,0,.076,.17,.090);
  part(el,'round',skin,0,-.188,.006,.050,.058,.045);
  arms.push(sh);elbows.push(el);
 }
 // legs: hip -> thigh -> knee -> calf -> shoe, so the walk/seated poses read
 const legs=[],knees=[];
 for(const side of[-1,1]){
  const hip=pivot(body,side*.088,HIP_Y,0);
  part(hip,'box',trousers,0,-.11,0,.120,.22,.140);
  const knee=pivot(hip,0,-.22,0);
  part(knee,'box',shortLegs?skin:trousers,0,-.095,0,.100,.19,.115);
  if(shortLegs)part(knee,'box',M.trimWhite,0,-.172,0,.104,.058,.118);
  part(knee,'box',shoe,0,-.235,.038,.125,.09,.235);
  part(knee,'box',M.dark,0,-.272,.012,.128,.022,.215);
  legs.push(hip);knees.push(knee);
 }

 // ---------------------------------------------------------------- accessories
 // prop names drive the activity poses in pose(); every prop is attached to a
 // hand (or the torso for bags) so it moves with the animation.
 let prop=null;
 if(mode==='taking-photo')prop='camera';
 else if(mode==='browsing')prop='tote';
 else if(mode==='waiting')prop=index%2?'newspaper':'phone';
 else if(mode==='dining')prop='cup';
 else if(mode==='socializing')prop=index%2?'cup':'handbag';
 else if(staff)prop='tray';
 else if(!elder){
  const k=index%7;
  if(k===1)prop='backpack';
  else if(k===3)prop='handbag';
  else if(k===5)prop='tote';
 }
 if(elder&&!prop)prop='newspaper';
 const bagMat=CLOTHES[(index*7+3)%CLOTHES.length];
 if(prop==='backpack'){
  part(body,'box',bagMat,0,.735,-.158,.23,.27,.115);
  part(body,'box',M.dark,0,.71,-.225,.17,.12,.03);
  for(const s of[-1,1])part(body,'box',M.iron,s*.085,.79,.108,.032,.25,.018);
 }else if(prop==='tote'){
  part(elbows[0],'box',bagMat,0,-.285,.012,.135,.16,.070);
  for(const s of[-1,1])part(elbows[0],'box',M.woodDark,s*.045,-.20,.012,.016,.09,.016);
 }else if(prop==='handbag'){
  part(elbows[1],'box',bagMat,0,-.272,.018,.135,.125,.065);
  part(elbows[1],'box',M.woodDark,0,-.205,.018,.095,.012,.012);
 }else if(prop==='camera'){
  part(elbows[0],'box',M.black,0,-.205,.052,.115,.075,.060);
  part(elbows[0],'cyl',M.iron,0,-.205,.090,.040,.045,.040,Math.PI/2);
  part(elbows[0],'box',M.iron,0,-.173,.055,.075,.018,.045);
  part(body,'box',M.iron,0,.88,.10,.012,.26,.012);
 }else if(prop==='newspaper'){
  part(elbows[0],'box',M.trimWhite,0,-.225,.035,.215,.018,.155);
  part(elbows[0],'box',M.dark,0,-.222,.035,.185,.020,.012);
 }else if(prop==='phone'){
  part(elbows[1],'box',M.black,0,-.200,.038,.052,.082,.016);
  part(elbows[1],'box',M.windowDark||M.iron,0,-.200,.048,.040,.062,.006);
 }else if(prop==='cup'){
  part(elbows[1],'cyl',M.trimWhite,0,-.205,.026,.028,.055,.028);
  part(elbows[1],'box',M.trimWhite,.032,-.205,.026,.02,.03,.012);
  part(elbows[1],'cyl',M.trimWhite,0,-.228,.026,.042,.010,.042);
 }else if(prop==='tray'){
  part(elbows[1],'box',M.metal,0,-.215,.045,.34,.020,.23);
  for(const dx of[-.09,.07])part(elbows[1],'cyl',M.trimWhite,dx,-.19,.03,.025,.05,.025);
 }else if(prop==='newspaper-walk'){
  part(elbows[0],'box',M.trimWhite,0,-.23,.03,.185,.016,.135);
 }
 const cane=elder;
 if(cane){
  part(elbows[1],'cyl',M.wood,0,-.435,.055,.015,.52,.015);
  part(elbows[1],'box',M.woodDark,0,-.178,.058,.095,.028,.028);
 }
 const p={root,body,head,arms,elbows,legs,knees,index,height,child,elder,staff,dress,prop,cane,walkAmp,
  hipY:HIP_Y,phase:rr(0,Math.PI*2),speed:rr(.48,.83)*(child?1.12:elder?.75:1),mode:'walking',
  wait:0,path:null,segment:0,progress:0,walkDistance:0,lane:0,baseLane:0,direction:1};
 people.push(p);return p;
}

// ---------------------------------------------------------------- animation
// One pose() drives every state; layout.activities modes are layered on top of a
// stable idle so people never freeze in a T-pose. `sitting` is kept for API
// compatibility (the simulation passes mode==='dining').
function pose(p,moving,dt,sitting=false){
 const t=state.pedTime,ph=p.phase,mode=p.mode||'walking';
 const B=p.body,H=p.head,[aL,aR]=p.arms,[eL,eR]=p.elbows,[lL,lR]=p.legs,[kL,kR]=p.knees;
 const amp=p.walkAmp;
 // base pose (idle hanging arms, straight legs)
 B.position.set(0,0,0);B.rotation.set(0,0,0);
 H.rotation.set(0,0,0);
 aL.rotation.set(-.03,0,-.08);aR.rotation.set(-.03,0,.08);
 eL.rotation.set(-.24,0,0);eR.rotation.set(-.24,0,0);
 lL.rotation.set(.01,0,0);lR.rotation.set(-.01,0,0);
 kL.rotation.set(.045,0,0);kR.rotation.set(.045,0,0);
 const gy=(ctx.layout&&ctx.layout.groundHeight)?ctx.layout.groundHeight(p.root.position.x,p.root.position.z):GROUND_Y-.01;
 let rootY=gy+.01;

 if(sitting||mode==='dining'){
  // seated at a café chair: hip level = seat top, thighs forward, calves down
  rootY=p.sittingRootY??(gy+SEAT_TOP-GROUND_Y-.02-HIP_Y*p.height);
  const sway=Math.sin(t*.42+ph);
  B.rotation.x=.02+sway*.012;B.rotation.z=Math.sin(t*.36+ph)*.018;
  lL.rotation.x=-1.48+Math.sin(t*.5+ph)*.022;lR.rotation.x=-1.48+Math.sin(t*.5+ph+1.4)*.022;
  kL.rotation.x=1.44;kR.rotation.x=1.44;
  aL.rotation.set(-.30,0,-.10);aR.rotation.set(-.30,0,.10);
  eL.rotation.x=-.82;eR.rotation.x=-.82;
  H.rotation.x=.10+sway*.05;H.rotation.y=Math.sin(t*.27+ph)*.32;H.rotation.z=-B.rotation.z;
  if(p.prop==='cup'){
   // lift the espresso every few seconds
   const sip=clamp((Math.sin(t*.38+ph*1.7)-.55)/.45,0,1);
   aR.rotation.x=-.30-1.02*sip;aR.rotation.z=.10+.18*sip;
   eR.rotation.x=-.82-1.35*sip;
   H.rotation.x=.10-.24*sip+sway*.04;
   H.rotation.y*=.5;
  }
 }else if(moving){
  const pulse=p.walkDistance*7.4+ph;
  const s=Math.sin(pulse),swing=.60*amp;
  lL.rotation.x=s*swing;lR.rotation.x=-s*swing;
  kL.rotation.x=.07+Math.max(0,-s)*.92*amp;kR.rotation.x=.07+Math.max(0,s)*.92*amp;
  const armSwing=.48*amp*(p.staff?.30:1)*(p.cane?.18:1);
  aL.rotation.x=-s*armSwing;aR.rotation.x=s*armSwing;
  aL.rotation.z=-.09;aR.rotation.z=.09;
  eL.rotation.x=-.22-Math.max(0,s)*.26*amp;eR.rotation.x=-.22-Math.max(0,-s)*.26*amp;
  B.rotation.x=.055*amp;B.rotation.y=-s*.05;B.rotation.z=s*.012;
  B.position.y=Math.abs(s)*.022*amp;
  H.rotation.x=-B.rotation.x*.7+.015;
  H.rotation.y=-B.rotation.y*1.1+Math.sin(t*.55+ph)*.05;
  H.rotation.z=-B.rotation.z*.9;
  if(p.staff&&p.prop==='tray'){aR.rotation.x=-1.05;aR.rotation.z=.24;eR.rotation.x=-1.25;}
 }else{
  // idle weight shift: hips drift, shoulders counter, head looks around
  const w=Math.sin(t*.55+ph),w2=Math.sin(t*1.1+ph*1.3);
  B.rotation.z=w*.030;B.rotation.x=.012+w2*.008;
  B.position.x=w*.013;B.position.y=w2*.006;
  lL.rotation.x=.015+w*.012;lR.rotation.x=-.015-w*.012;
  kL.rotation.x=.05;kR.rotation.x=.05;
  aL.rotation.x=-.02+Math.sin(t*.85+ph)*.05;
  aR.rotation.x=-.02+Math.sin(t*.85+ph+1.7)*.05;
  H.rotation.x=-.02-B.rotation.x*.6;H.rotation.y=Math.sin(t*.32+ph)*.28;H.rotation.z=-B.rotation.z*.8;

  if(mode==='waiting'){
   if(p.prop==='newspaper'){
    aL.rotation.set(-.58,0,-.16);aR.rotation.set(-.52,0,.16);
    eL.rotation.x=-1.38;eR.rotation.x=-1.28;
    H.rotation.x=.32;H.rotation.y=Math.sin(t*.22+ph)*.10;
   }else if(p.prop==='phone'){
    aR.rotation.set(-.60,0,.22);eR.rotation.x=-1.42;
    H.rotation.x=.22;H.rotation.y*=.35;
   }else{
    // hands clasped in front, occasional glance down the street
    aL.rotation.set(-.30,0,-.16);aR.rotation.set(-.30,0,.16);
    eL.rotation.x=-1.02;eR.rotation.x=-.96;
    H.rotation.y=Math.sin(t*.24+ph)*.38;
   }
  }else if(mode==='browsing'){
   B.rotation.x=.17+Math.sin(t*.6+ph)*.02;
   H.rotation.x=.16;
   aR.rotation.set(-.95+Math.sin(t*.72+ph)*.30,0,.14);eR.rotation.x=-.38;
   aL.rotation.set(-.06,0,-.08);eL.rotation.x=-.35;
   lL.rotation.x=.06;lR.rotation.x=.02;
  }else if(mode==='taking-photo'){
   const lift=Math.sin(t*.26+ph)*.03;
   aL.rotation.set(-1.30+lift,0,-.20);aR.rotation.set(-1.30+lift,0,.20);
   eL.rotation.x=-1.30;eR.rotation.x=-1.34;
   B.rotation.x=.055;H.rotation.x=.06;H.rotation.y+=Math.sin(t*.18+ph)*.10;
  }else if(mode==='socializing'){
   // one hand talks, the other rests; head turns with the conversation
   aR.rotation.set(-.52+Math.sin(t*1.35+ph)*.42,0,.30);eR.rotation.x=-.62-Math.sin(t*1.35+ph+1)*.30;
   aL.rotation.set(-.14+Math.sin(t*.72+ph)*.07,0,-.12);eL.rotation.x=-.36;
   B.rotation.y=Math.sin(t*.5+ph)*.06;
   H.rotation.y=Math.sin(t*.42+ph)*.30;H.rotation.x=-.02+Math.sin(t*.9+ph)*.05;
  }
 }
 // elder posture and cane (applied after the mode layers)
 if(p.elder){
  B.rotation.x+=.115;
  B.position.y-=.012;
  H.rotation.x-=.085;
  if(p.cane){
   aR.rotation.set(.03,0,.13);eR.rotation.set(-.06,0,0);
  }
 }
 p.root.position.y=rootY;
}

// ---------------------------------------------------------------- vehicles (unchanged)
const vehicleMaterials=new Map();function vm(m){if(!vehicleMaterials.has(m)){const clone=m.clone();clone.clippingPlanes=clips;clone.clipShadows=true;if(m.userData.nightEmission){clone.userData.nightEmission=m.userData.nightEmission;emissives.push(clone);}vehicleMaterials.set(m,clone);}return vehicleMaterials.get(m);}
function car(type,color,rider=true){const root=new THREE.Group();scene.add(root);trafficRoots.push(root);const wheels=[],bus=type==='bus',van=type==='van',scooter=type==='scooter',mini=type==='mini',police=type==='police',ape=type==='ape';const L=bus?4.6:ape?2.75:van?2.9:scooter?1.35:mini?2.30:police?2.55:2.6,W=bus?1.55:ape?1.16:van?1.34:scooter?.52:mini?1.08:police?1.14:1.14;
 const add=(kind,m,x,y,z,a,b,c,rx=0,ry=0,rz=0)=>part(root,kind,vm(m),x,y,z,a,b,c,rx,ry,rz);
 if(ape){
   // Piaggio Ape: rounded cab nose, single front wheel, ribbed cargo box behind.
   // One cab shell owns the nose; the box is a separate rear volume, not an overlay.
   const cabL=L*.42,boxL=L*.54;
   add('bevel',color,0,.70,cabL*.55,W,.96,cabL);            // cab
   add('bevel',color,0,1.22,cabL*.42,W*.94,.30,cabL*.72);   // cab roof crown
   add('cabin',M.glass,0,1.02,cabL*.86,W*.84,.52,cabL*.44);// windscreen face
   add('box',M.paintShadow,0,.34,cabL*1.06,W*.86,.10,cabL*.16); // chrome nose band
   add('round',M.lamp,0,.62,cabL*1.10,.11,.11,.055);        // single headlight
   for(const side of[-1,1])add('box',M.neonRed,side*W*.30,.56,cabL*1.09,.15,.09,.04);
   // ribbed cargo box: horizontal slats proud of the box face
   add('box',color,0,.86,-boxL*.46,W,1.06,boxL);
   for(let i=0;i<6;i++)for(const side of[-1,1])add('box',color,side*(W/2+.012),.44+i*.17,-boxL*.46,.024,.10,boxL*.94);
   add('box',color,0,1.42,-boxL*.46,W*.98,.16,boxL*.98);
   add('box',M.paintShadow,0,.36,-boxL*.46,W*.92,.14,boxL*.96);
   add('box',M.paintShadow,0,.62,-boxL*.98,W*.94,.62,.03);
   // front mudguard wrapping the single front wheel
   add('bevel',M.metal,0,.40,cabL*1.22,.30,.34,.52);
   add('round',M.black,0,.26,cabL*1.24,.19,.19,.07);
   // mirrors on stalks
   for(const side of[-1,1]){add('box',M.iron,side*(W*.56),1.06,cabL*.92,.03,.30,.03);add('box',M.black,side*(W*.60),1.22,cabL*.92,.12,.14,.03);}
 }
 else if(scooter){add('box',color,0,.55,0,.39,.52,.76);add('box',M.black,0,.84,-.2,.47,.12,.58);add('box',color,0,.65,.45,.49,.7,.16, .15);add('box',M.black,0,1.03,.49,.67,.05,.07);add('box',M.red,0,1.07,-.50,.62,.55,.52);add('round',M.lamp,0,.86,.57,.12,.10,.05);if(rider){add('box',M.jade,0,1.21,-.06,.36,.43,.24,.12);add('round',M.skin1,0,1.53,-.02,.14,.16,.14);add('round',M.red,0,1.64,-.035,.16,.10,.15);for(const side of[-1,1]){add('box',M.dark,side*.20,.77,.03,.12,.36,.38,0,0,side*.2);add('box',M.jade,side*.22,1.17,.20,.10,.30,.12,-.8);add('round',M.skin1,side*.22,1.06,.35,.05,.06,.05);}}}
 // Variant extensions: this generic shell owns the lower outer body.
 // A same-width RV/trailer shell would expose coplanar faces (Z-fighting).
 // Replace/narrow the underlying shell and clear trim by its nearest face;
 // see references/surface-depth-stability.md in the installed Skill.
 else if(mini||police){
   // Italian city-car shell: one rounded outer body only. Trim sits outside the
   // nearest body face (centre = W/2 + gap + thickness/2); no second same-width shell.
   add('bevel',color,0,.50,0,W,.70,L);
   add('bevel',color,0,.92,-L*.02,W*.96,.44,L*.86);
   add('cabin',M.glass,0,1.02,-.06,W*.88,.46,L*.60);
   add('bevel',color,0,1.27,-.10,W*.90,.10,L*.50);
   for(const side of[-1,1]){
    const fx=side*(W/2+.004+.016);
    add('box',color,fx,.66,.30,.032,.11,.14);
    add('box',M.metal,fx,.86,-.02,.024,.045,.20);
    add('box',M.black,fx,.56,L*.30,.026,.13,L*.20);
   }
   add('box',M.trimWhite,0,.36,L/2+.055,.34,.13,.02);
   add('box',M.trimWhite,0,.38,-L/2-.055,.34,.13,.02);
   add('bevel',M.paintShadow,0,.34,L/2+.01,W*.99,.075);
   add('bevel',M.paintShadow,0,.34,-L/2-.01,W*.99,.075);
   for(const side of[-1,1]){add('round',M.lamp,side*W*.32,.66,L/2+.045,.10,.10,.05);add('box',M.neonRed,side*W*.32,.62,-L/2-.045,.17,.13,.045);}
   if(police){
    add('box',M.iron,0,1.34,.05,.52,.05,.26);
    add('box',M.neonBlue,-.15,1.40,.05,.26,.10,.22);
    add('box',M.neonRed,.15,1.40,.05,.26,.10,.22);
    for(const side of[-1,1]){add('box',M.trimWhite,side*(W/2+.006),.62,0,.012,.17,L*.55);add('box',M.paintBlue,side*(W/2+.006),.30,0,.012,.13,L*.55);}
   }else{add('box',M.iron,0,1.33,-.30,.30,.05,.10);}
  }
  else{add('bevel',color,0,.49,0,W,.64,L);add('box',color,0,.40,L*.40,W*.92,.27,L*.25);add('box',M.black,0,.27,-L*.43,W*.78,.10,.07);if(bus){add('box',M.glass,0,1.14,0,W*.97,.82,L*.87);add('box',color,0,1.62,0,W*1.02,.16,L*.98);for(const side of[-1,1])for(let i=0;i<7;i++)add('box',color,side*(W/2+.008),1.14,-L*.35+i*L*.11,.045,.84,.055);add('box',M.dark,0,1.05,L/2+.02,W*.9,.61,.04);add('box',M.blue,0,.75,L/2+.04,W*.98,.19,.06);const tm=signMat(labels.route,'#1554b9','#e7f5ff');const ds=part(root,'plane',vm(tm),0,1.48,L/2+.05,1.05,.30,1);ds.userData.routeDisplay=true;for(const side of[-1,1]){part(root,'plane',vm(signMat(labels.bus,'#e0d6b7','#275781')),side*(W/2+.035),.64,0,2.3,.34,1,0,side*Math.PI/2);}add('box',M.white,0,1.75,-.5,.85,.19,1.1);}else if(van){add('box',color,0,1.02,-.35,W*.99,1.1,L*.62);add('box',M.glass,0,.93,L*.25,W*.85,.47,L*.27);add('box',color,0,1.26,L*.25,W*.95,.12,L*.34);for(const side of[-1,1])part(root,'plane',vm(signMat(labels.delivery,'#d7ded6','#53736b')),side*(W/2+.02),1.1,-.4,1.25,.40,1,0,side*Math.PI/2);}else{add('cabin',M.glass,0,.99,-.08,W*.84,.48,L*.53);add('bevel',color,0,1.25,-.13,W*.92,.12,L*.48);add('box',color,0,.69,-.03,W*.99,.12,L*.95);for(const side of[-1,1]){add('box',color,side*W*.52,.90,.31,.17,.12,.16);add('box',M.metal,side*W*.505,.66,-.19,.03,.045,.19);}if(type==='taxi'){add('box',M.cream,0,1.40,0,.45,.15,.25);}}
 for(const side of[-1,1]){add('box',M.lamp,side*W*.33,.55,L/2+.025,W*.17,.17,.045);add('box',M.neonRed,side*W*.33,.50,-L/2-.025,W*.17,.13,.045);}add('box',M.white,0,.35,L/2+.052,.31,.12,.02);}
 const wheelPositions=ape?[[0,L*.46],[-W*.52,-L*.28],[W*.52,-L*.28]]:scooter?[[0,-.48],[0,.48]]:(mini||police)?[[-W*.50,-L*.33],[W*.50,-L*.33],[-W*.50,L*.33],[W*.50,L*.33]]:[[-W*.50,-L*.30],[W*.50,-L*.30],[-W*.50,L*.30],[W*.50,L*.30]];
 for(const[x,z]of wheelPositions){const w=pivot(root,x,.25,z);part(w,'cyl',vm(M.black),0,0,0,bus?.30:scooter?.22:.25,.13,bus?.30:scooter?.22:.25,0,0,Math.PI/2);part(w,'cyl',vm(M.metal),x<0?-.075:.075,0,0,bus?.16:.13,.02,bus?.16:.13,0,0,Math.PI/2);wheels.push(w);}
 root.position.y=.66;return{root,wheels,length:L,width:W,type};}


 let batchTotal=0;
 function batch(){
 const dynamicBins=new Map();
for(const p of dynamicParts){const key=p.geometry.uuid+p.material.uuid;if(!dynamicBins.has(key))dynamicBins.set(key,{parts:[],geometry:p.geometry,material:p.material});dynamicBins.get(key).parts.push(p);p.visible=false;}
for(const b of dynamicBins.values()){b.mesh=new THREE.InstancedMesh(b.geometry,b.material,b.parts.length);b.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);b.mesh.frustumCulled=false;b.mesh.castShadow=!b.material.emissive?.getHex();scene.add(b.mesh);}
const hiddenMatrix=new THREE.Matrix4().makeScale(0,0,0);
function syncDynamic(){scene.updateMatrixWorld();for(const b of dynamicBins.values()){for(let i=0;i<b.parts.length;i++){const part=b.parts[i];let visible=part.userData.agentVisible!==false;for(let p=part.parent;p&&p!==scene;p=p.parent)if(!p.visible)visible=false;b.mesh.setMatrixAt(i,visible?part.matrixWorld:hiddenMatrix);}b.mesh.instanceMatrix.needsUpdate=true;}}

 batchTotal=dynamicBins.size;return syncDynamic;
 }
 return {character,pose,car,people,trafficRoots,batch,part,pivot,batchCount:()=>batchTotal};
}
