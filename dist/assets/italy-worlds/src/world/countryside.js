import * as THREE from '../../vendor/three/build/three.module.js';

// ============================================================================
// VALLENUOVA — the Italian countryside around the hill town.
//
// Terraced vineyards, olive groves, cypress lines, dry-stone walls, dirt tracks,
// stone farmhouses with terracotta roofs, a limonaia, a capanna, walled kitchen
// gardens, lavender and rosemary, hay and layered terraced hillocks. Everything
// is authored through ctx.batch so it merges into the town's static batches (no
// per-prop meshes and no new heavy materials — only MeshToonMaterial tints
// through ctx.mat).
//
// Authored against the current town in scene.js:
//   • valley floor (walkable)        y = 0.80
//   • upper old-town terrace         y = 4.55   (scene.js upperY)
//     platform footprint             x = -29.4..29.4, z = -24.5..-16.1
//   • town core (this module keeps out)
//                                    x = -24..24, z = -16..20
//   • the highest-terrace ridge (z < -22), its cypress line and the back-row
//     houses belong to scene.js — this module only dresses the two empty ends
//     of that terrace (z ≈ -21.6..-16.4), the ground band below its east/west
//     retaining walls, and the road-end rims of the slab.
//
// Composition: a vineyard + hill farm on the NE end of the top terrace, an
// olive terraces + farmhouse + capanna on the NW end, a casale and rim track
// below the NE hill wall, a walled orto by the west villas, cypress lines,
// aedicula and terraced hillocks framing the slab edges. Clusters with clear
// negative space, not a carpet of props.
// ============================================================================

export function createCountryside(ctx){
 const {M,mat,rr,pick,random}=ctx;
 const {box,cyl,instance,at,geometry,geo,transform,pipe}=ctx.batch;
 const props=ctx.italianProps, arch=ctx.italianArch;

 // ---- levels (keep in sync with scene.js) --------------------------------
 const GROUND=.8;      // valley floor walkable level
 const PLATFORM=6.8;  // upper old-town terrace (scene.js upperY)

 // ---- shared material tints (one merged batch per material at flush) ------
 const stone1=mat('#cbb490');   // sun-bleached dry-stone
 const stone2=mat('#b9a077');
 const stone3=mat('#d7c4a0');
 const stone4=mat('#a68c66');   // shaded stone
 const grass1=mat('#7f9350');   // hillside grass
 const grass2=mat('#90a15b');   // sunlit grass
 const grass3=mat('#a3ad6b');   // dry summer fringe
 const hayMat=mat('#c9ab63');
 const soil1=mat('#8a6445');    // turned earth
 const soil2=mat('#75513a');
 const dirt=mat('#b99b6e');     // compacted track
 const dirt2=mat('#c8ae82');    // pale wheel-worn centre
 const vineA=mat('#5b7a34');
 const vineB=mat('#729044');
 const vineC=mat('#87994e');
 const oliveB=mat('#7d8b4d');
 const oliveC=mat('#97a56c');
 const lavenderMat=mat('#9a8ab8');
 const flowerPink=M.blossom, flowerGold=M.paintYellow;

 // ---- one-off helper geometries (cloned per use, merged on flush) ---------
 const flatGeo=new THREE.PlaneGeometry(1,1);flatGeo.rotateX(-Math.PI/2);
 const leafGeo=new THREE.IcosahedronGeometry(1,0);            // 20 tris
 const discGeo=new THREE.CylinderGeometry(1,1,1,10,1,false);
 const ringGeo=new THREE.CylinderGeometry(1,1,1,10,1,true);

 // ---------------------------------------------------------------- helpers
 function blob(x,y,z,sx,sy,sz,m){geometry(leafGeo,m,transform(x,y,z,sx,sy,sz,0,random()*6.283,0));}
 function tuft(x,y,z,s=1,m=null){
  const mm=m||pick([grass1,grass2,grass3,M.tuscanGrass]);
  blob(x+rr(-.05,.05),y+.06*s,z+rr(-.05,.05),.19*s,.13*s,.19*s,mm);
  blob(x+rr(-.17,.17)*s,y+.03*s,z+rr(-.15,.15)*s,.13*s,.09*s,.14*s,mm);
 }
 function rock(x,y,z,s=1,m=null){
  geometry(leafGeo,m||pick([stone1,stone2,stone4]),
   transform(x+rr(-.06,.06),y+.16*s,z+rr(-.06,.06),s,.55*s,s*.82,rr(-.20,.20),random()*6.283,rr(-.22,.22)));
 }
 // flat ground-colour patch (2 triangles): breaks up grass / paving
 function groundPatch(x,z,sx,sz,m,y=GROUND-.006){
  geometry(flatGeo,m,transform(x,y,z,sx,1,sz,0,random()*6.283,0));
 }

 // Irregular dry-stone wall. Local axis = X, base at y, uneven cap course.
 // opts.gaps = [[from,to],...] local-X intervals left open (field gates, steps).
 function wall(x,y,z,rot,len,h=.5,thick=.42,opts={}){
  const gaps=opts.gaps||[];
  const skip=(a,b)=>gaps.some(g=>a<g[1]&&b>g[0]);
  at(x,y,z,rot,()=>{
   const courses=Math.max(2,Math.round(h/.20));
   const ch=h/courses;
   for(let c=0;c<courses;c++){
    let s=-len/2+rr(.04,.16);
    while(s<len/2-.10){
     const cw=rr(.40,.76);
     if(!skip(s,s+cw)){
      const cxm=Math.min(s+cw,len/2)-cw/2;
      instance('box',pick([stone1,stone2,stone3,stone1,stone4]),
       cxm,ch*(c+.5)+rr(-.012,.012),(random()-.5)*.08,
       cw,ch*rr(.84,1.06),thick*rr(.84,1.16),rr(-.06,.06),rr(-.05,.05));
     }
     s+=cw+rr(.02,.07);
    }
   }
   if(opts.cap!==false){
    let s=-len/2+.04;
    while(s<len/2){
     const cw=rr(.40,.68);
     if(!skip(s,s+cw))instance('box',pick([stone3,stone1,stone2]),
      s+cw/2,h+rr(.02,.06),(random()-.5)*.13,
      cw,rr(.07,.12),thick*rr(.70,.96),rr(-.05,.05),rr(-.05,.05));
     s+=cw+rr(.05,.13);
    }
   }
  });
 }

 // Bigger-block masonry retaining wall for the tall hill terrace ends.
 function retaining(x,y,z,rot,len,h){
  at(x,y,z,rot,()=>{
   const courses=Math.max(3,Math.round(h/.56));
   const ch=h/courses;
   for(let c=0;c<courses;c++){
    let s=-len/2+rr(.05,.25);
    while(s<len/2-.15){
     const cw=rr(.68,1.22);
     instance('box',pick([stone1,stone2,stone4,stone3,stone2]),
      s+cw/2,ch*(c+.5)+rr(-.02,.02),(random()-.5)*.10,
      cw,ch*rr(.88,1.02),rr(.44,.62),rr(-.04,.04),rr(-.03,.03));
     s+=cw+rr(.02,.06);
    }
   }
   let s=-len/2+.10;
   while(s<len/2){
    const cw=rr(.55,.85);
    instance('box',stone3,s+cw/2,h+.06,rr(-.04,.04),cw,.14,rr(.48,.60),0,0);
    s+=cw+rr(.03,.08);
   }
   // a few proud stones catch the low sun and break the vertical face
   for(let i=0;i<Math.round(len*.9);i++){
    const yy=rr(h*.14,h*.86);
    instance('box',pick([stone1,stone3]),rr(-len/2+.2,len/2-.2),yy,rr(-.28,-.18),
     rr(.34,.6),rr(.22,.4),rr(.16,.26),rr(-.1,.1),rr(-.08,.08));
   }
  });
 }

 // Narrow compacted-earth farm track with stone edging and pale wheel ruts.
 function track(points,width=.88,y=GROUND+.012){
  for(let i=1;i<points.length;i++){
   const [x1,z1]=points[i-1],[x2,z2]=points[i];
   const dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz);
   if(len<.02)continue;
   const rot=Math.atan2(dx,dz),mx=(x1+x2)/2,mz=(z1+z2)/2;
   box(mx,y,mz,width,.018,len+.08,dirt,rot);
   box(mx,y+.012,mz,width*.70,.012,len+.02,dirt2,rot);
   const px=-dz/len,pz=dx/len;
   for(let t=.22;t<len;t+=.52){
    const cx=x1+dx*t/len,cz=z1+dz*t/len;
    for(const side of[-1,1]){
     if(random()<.72)instance('box',pick([stone1,stone2,stone3]),
      cx+px*side*(width/2+.07),y+.024,cz+pz*side*(width/2+.07),
      rr(.18,.30),rr(.05,.09),rr(.10,.16),rot+rr(-.25,.25),rr(-.10,.10));
    }
   }
  }
 }

 // Row of vines: raised bed, dry-stone edging, posts, two wires, gnarled trunks,
 // grape clusters and a continuous leafy wall along the row.
 function vineRow(x,y,z,len,rot=0){
  at(x,y,z,rot,()=>{
   box(0,.05,0,len,.10,.60,soil1);
   box(0,.104,0,len-.16,.012,.42,soil2);
   for(let s=-len/2+.18;s<len/2;s+=.55){
    instance('box',pick([stone1,stone3,stone2]),s,.052,-.33,rr(.32,.48),.10,rr(.10,.15),rr(-.12,.12),0);
    instance('box',pick([stone1,stone3,stone2]),s,.052,.33,rr(.32,.48),.10,rr(.10,.15),rr(-.12,.12),0);
   }
   const np=Math.max(2,Math.round(len/1.2));
   for(let p=0;p<=np;p++)cyl(-len/2+p*len/np,.43,0,.032,.86,M.woodDark);
   box(0,.47,0,len,.018,.018,M.iron);
   box(0,.69,0,len,.016,.016,M.iron);
   const nv=Math.max(3,Math.round(len/.9));
   for(let v=0;v<nv;v++){
    const vx=-len/2+.30+v*(len-.60)/Math.max(1,nv-1)+rr(-.07,.07),vz=rr(-.08,.08);
    pipe([vx+.02,.02,vz],[vx+rr(-.07,.07),.30,vz+rr(-.04,.04)],.055,M.wood);
    pipe([vx+rr(-.07,.07),.28,vz],[vx+rr(-.17,.17),.62,vz+rr(-.11,.11)],.034,M.woodDark);
    if(random()<.55)blob(vx+rr(-.12,.12),.34+rr(0,.15),vz+.07,.07,.11,.07,M.grape);
    blob(vx+rr(-.15,.15),.55+rr(-.05,.08),vz+rr(-.14,.14),.16,.13,.15,pick([vineA,vineB]));
   }
   for(let s=-len/2+.20;s<len/2;s+=.40){
    blob(s+rr(-.05,.05),.58+rr(-.07,.07),rr(-.18,.18),
     rr(.20,.30),rr(.16,.24),rr(.18,.28),pick([vineA,vineB,vineB,vineC,M.leafVine,M.leafOlive]));
   }
   for(let i=0;i<3;i++)blob(rr(-len/2+.3,len/2-.3),.42,rr(-.20,.20),.16,.14,.15,pick([vineA,vineB]));
  });
 }

 // Silver-green olive, lighter than ctx.italianProps.oliveTree (used a lot).
 function cheapOlive(x,y,z,s=1){
  at(x,y,z,random()*6.283,()=>{
   cyl(0,.05,0,.26*s,.10*s,M.soilWarm);
   let px=0,pz=0,py=.04*s;
   for(let i=0;i<2;i++){
    const a=random()*6.283,l=rr(.24,.36)*s;
    const nx=px+Math.cos(a)*l*.6,nz=pz+Math.sin(a)*l*.6,ny=py+l;
    pipe([px,py,pz],[nx,ny,nz],(.115-.030*i)*s,M.wood);
    px=nx;pz=nz;py=ny;
   }
   const mats=[M.leafOlive,oliveB,oliveC,M.leafOlive];
   const nb=3+Math.floor(random()*2);
   for(let i=0;i<nb;i++){
    const a=random()*6.283,r=rr(.12,.60)*s;
    blob(px+Math.cos(a)*r*.9,py+rr(.10,.46)*s,pz+Math.sin(a)*r*.9,
     rr(.28,.44)*s,rr(.18,.26)*s,rr(.26,.40)*s,mats[i%mats.length]);
   }
   if(random()<.5)blob(px+rr(-.2,.2),py+rr(.4,.6)*s,pz+rr(-.2,.2),.12*s,.10*s,.12*s,M.leafOlive);
  });
 }

 // A line of cypress. list = [[x,z,scale],...]; base level y.
 function cypresses(list,y=GROUND){
  for(const c of list)props.cypress(c[0],c[1],c[2]??1,y);
 }

 // Terraced hillock: stacked low stone-faced tiers capped with grass.
 function hillMound(x,z,r,h,y=GROUND,opts={}){
  const tiers=opts.tiers??2;
  let cy=y;
  for(let t=0;t<tiers;t++){
   const rad=r*(1-t*.30),th=h/tiers;
   geometry(ringGeo,pick([stone1,stone2,stone3]),
    transform(x+rr(-.06,.06),cy+th/2,z+rr(-.06,.06),rad,th,rad*.94,0,random()*6.283,0));
   cy+=th;
   geometry(discGeo,t===tiers-1?grass2:grass1,
    transform(x,cy+.008,z,rad*.97,.10,rad*.90,0,random()*6.283,0));
  }
  for(let i=0;i<Math.round(r*8);i++){
   const a=random()*6.283,rad=rr(.92,1.14)*r;
   tuft(x+Math.cos(a)*rad,y,z+Math.sin(a)*rad*.94,rr(.7,1.1));
  }
  for(let i=0;i<Math.round(r*3);i++){
   const a=random()*6.283;
   rock(x+Math.cos(a)*r*1.02,y,z+Math.sin(a)*r*.96,rr(.5,.9));
  }
  return cy;
 }

 // Small stone hut with a hipped terracotta roof (capanna / tool shed).
 function stoneHut(x,y,z,rot,w,d,h,opts={}){
  const wallMat=arch.surface('stone',opts.color||'#dcc9a4');
  at(x,y,z,rot,()=>{
   box(0,h/2,0,w,h,d,wallMat,0,true);
   box(0,.12,0,w+.10,.24,d+.10,M.trimStone);
   arch.tiledRoof({x:0,y:h+.04,z:0,w,d,over:.34,pitch:.30,hip:true,detail:.5,tint:opts.tint??1});
   box(0,1.02,d/2+.02,.78,1.94,.08,opts.door||M.woodDoor);
   box(0,2.02,d/2+.05,1.00,.14,.10,M.trimLight);
   box(0,2.13,d/2+.03,.58,.10,.08,M.trimWhiteStone);
   box(0,.05,d/2+.16,.84,.10,.26,M.trimStone);
   box(w/2+.02,1.34,0,.04,.56,.62,M.windowDark);
   box(w/2+.05,1.34,0,.04,.08,.74,M.trimStone);
  });
  ctx.obstacles.push({x,z,w:w/2+.30,d:d/2+.30,label:'countryside hut'});
 }

 // Open-fronted limonaia: stone back/sides, three piers, shallow tiled lean-to.
 function limonaia(x,y,z,rot){
  const wallMat=arch.surface('stone','#d8c7a2');
  at(x,y,z,rot,()=>{
   box(0,.98,-.84,2.60,1.96,.26,wallMat,0,true);
   box(-1.18,.98,0,.24,1.96,1.72,wallMat,0,true);
   box(1.18,.98,0,.24,1.96,1.72,wallMat,0,true);
   for(const px of[-1.06,0,1.06])box(px,.94,.80,.22,1.88,.20,wallMat);
   box(0,1.90,.80,2.52,.14,.30,M.trimLight);
   box(0,.07,.06,2.50,.14,1.80,M.trimStone);
   arch.tiledRoof({x:0,y:2.01,z:0,w:2.84,d:2.04,over:.30,pitch:.22,hip:true,detail:.55,tint:3});
   box(-.72,.28,.52,1.10,.10,.34,M.trimStone);
   for(const sx of[-1.02,-.34,.34,1.02]){
    cyl(sx,.30,.10,.16,.34,M.terracottaDark);
    cyl(sx,.48,.10,.19,.14,M.terracotta);
    blob(sx,.66,.10,.13,.12,.13,pick([M.leafVine,M.leafOlive]));
   }
  });
  ctx.obstacles.push({x,z,w:1.75,d:1.45,label:'limonaia'});
 }

 // Courtyard well with an iron arch.
 function stoneWell(x,y,z){
  cyl(x,y+.05,z,.62,.10,M.trimStone);
  cyl(x,y+.29,z,.50,.42,M.trimStone);
  cyl(x,y+.53,z,.55,.08,M.trimWhiteStone);
  cyl(x,y+.50,z,.42,.04,M.water);
  for(const sx of[-.44,.44])box(x+sx,y+1.02,z,.09,.94,.09,M.iron);
  box(x,y+1.48,z,.98,.07,.09,M.iron);
  cyl(x,y+1.34,z,.05,.30,M.iron);
  cyl(x,y+1.28,z,.17,.22,M.wood);
  pipe([x,y+1.27,z],[x,y+1.05,z],.011,M.iron);
  cyl(x,y+.98,z,.10,.17,M.wood);
  ctx.obstacles.push({x,z,w:.8,d:.8,label:'well'});
 }

 // Small roadside shrine (aedicula) with a niche and a little tiled roof.
 function shrine(x,y,z,rot){
  at(x,y,z,rot,()=>{
   box(0,.14,0,.90,.28,.64,M.trimStone);
   box(0,.46,0,.46,.38,.38,M.trimStone);
   box(0,1.10,0,.66,1.00,.42,arch.surface('plaster','#e9ddc2'));
   box(0,1.32,.22,.34,.52,.07,M.archDark);
   blob(0,1.32,.24,.09,.13,.05,M.marbleWhite);
   box(0,1.66,0,.80,.10,.56,M.trimWhiteStone);
   for(let i=0;i<3;i++)box(0,1.74,.16-i*.16,.78-.06*i,.06,.18,M.terracotta);
   cyl(0,1.52,0,.032,.34,M.iron);
   box(0,1.73,0,.16,.045,.045,M.iron);
   box(-.30,.42,.24,.14,.06,.22,M.terracottaDark);
   blob(-.30,.52,.24,.10,.10,.10,pick([flowerPink,flowerGold]));
  });
  ctx.obstacles.push({x,z,w:.5,d:.4,label:'shrine'});
 }

 function hayBale(x,y,z,rot=0){
  at(x,y,z,rot,()=>{
   cyl(0,.34,0,.47,.94,hayMat,Math.PI/2,0);
   for(const s of[-.20,.20])cyl(0,.34,s,.48,.035,M.woodDark,Math.PI/2,0);
  });
  ctx.obstacles.push({x,z,w:.55,d:.50,label:'hay bale'});
 }

 function pot(x,y,z,s=1,flower=true){
  cyl(x,y+.10*s,z,.20*s,.20*s,M.terracottaDark);
  cyl(x,y+.28*s,z,.23*s,.16*s,M.terracotta);
  cyl(x,y+.365*s,z,.22*s,.03*s,M.soilWarm);
  if(flower)for(let i=0;i<3;i++)blob(x+rr(-.12,.12)*s,y+.47*s+rr(0,.12)*s,z+rr(-.12,.12)*s,
   rr(.10,.16)*s,rr(.10,.16)*s,rr(.10,.16)*s,pick([flowerPink,flowerGold,M.leafOlive,lavenderMat]));
 }

 function vegPlot(x,y,z,rot,w,d){
  at(x,y,z,rot,()=>{
   box(0,.06,0,w,.12,d,soil1);
   for(let r=0;r<3;r++){
    const rz=-d/2+d*(r+.5)/3;
    for(let s=-w/2+.18;s<w/2;s+=.40)
     blob(s+rr(-.03,.03),.15+rr(-.02,.03),rz+rr(-.04,.04),.13,.12,.13,pick([M.leaf,M.leafVine,M.leaf2]));
   }
  });
 }

 function courtyard(x,y,z,w,d){box(x,y+.02,z,w,.04,d,M.paving);}

 // ============================================================ NE TERRACE END
 // y = PLATFORM. Vineyard + hill farm on the empty east end of the top terrace.
 // Leaves z < -21.6 to scene.js's ridge garden.
 groundPatch(22.35,-19.78,13.70,6.75,grass1,PLATFORM+.004);
 groundPatch(17.40,-18.10,6.60,2.10,grass3,PLATFORM+.006);
 groundPatch(26.10,-20.60,4.80,1.40,grass2,PLATFORM+.007);
 // -- three vine rows following the terrace contour
 vineRow(17.90,PLATFORM,-21.00,5.40,0);
 vineRow(17.90,PLATFORM,-19.90,5.40,0);
 vineRow(17.90,PLATFORM,-18.80,5.40,-.03);
 // low stone risers between the rows: the plot reads as stacked terraces
 wall(18.10,PLATFORM+.10,-21.45,0,4.80,.22,.30,{cap:false});
 wall(18.10,PLATFORM+.10,-20.35,0,4.80,.22,.30,{cap:false});
 // -- limonaia at the east end of the plot
 limonaia(22.50,PLATFORM,-17.70,-.05);
 props.lemonPot?.(21.15,-16.95,PLATFORM);
 props.lemonPot?.(23.80,-16.90,PLATFORM);
 // -- hill farm (podere-est)
 arch.casa({id:'podere-est',x:26.0,z:-19.30,y:PLATFORM,w:4.2,d:3.2,floors:2,color:'#dec9a0',finish:'stone',rot:0});
 courtyard(25.9,PLATFORM,-17.35,5.2,1.50);
 props.pergola?.(25.4,-17.35,2.20,1.15,0,PLATFORM);
 props.woodStack?.(28.20,-17.45,.35,PLATFORM);
 props.crates?.(24.15,-16.95,.15,PLATFORM);
 props.barrel?.(23.50,-17.05,PLATFORM);
 stoneWell(28.55,PLATFORM,-17.15);
 hayBale(26.80,PLATFORM,-17.80,.20);
 hayBale(26.40,PLATFORM,-17.95,-.30);
 pot(27.90,PLATFORM,-16.75,.85);pot(22.90,PLATFORM,-17.30,.80);
 cheapOlive(22.40,PLATFORM,-21.05,1.05);
 hayBale(16.35,PLATFORM,-17.80,.15);
 hayBale(17.05,PLATFORM,-17.62,-.35);
 pot(19.05,PLATFORM,-17.55,.78);
 props.oliveTree?.(26.60,-21.30,.95,PLATFORM);
 // -- dirt track from the x=14.4 stair landing along the terrace lip
 track([[15.00,PLATFORM,-16.92],[17.30,-17.22],[19.60,-17.22],[21.20,-17.08]],.90,PLATFORM+.012);
 // seat and a stone trough where the old-town steps arrive on the terrace
 box(16.05,PLATFORM+.23,-17.62,.90,.40,.34,M.trimStone);
 box(16.05,PLATFORM+.45,-17.62,.96,.08,.40,M.trimWhiteStone);
 box(15.15,PLATFORM+.20,-17.35,.52,.36,.46,M.trimStone);
 cyl(15.15,PLATFORM+.40,-17.35,.30,.06,M.water);
 // -- dry-stone field walls along the south lip (left open at the stair landing)
 wall(19.40,PLATFORM,-16.55,0,4.40,.42,.40);
 wall(25.90,PLATFORM,-16.55,0,6.20,.44,.40,{gaps:[[-3.1,-2.3]]});
 // -- tall masonry retaining wall under the terrace east edge
 retaining(29.40,GROUND,-20.30,Math.PI/2,8.10,3.72);
 cypresses([[15.60,-17.90,1.05]],PLATFORM);
 props.lavender?.(19.60,-16.85,4,PLATFORM);
 props.rosemary?.(27.70,-16.85,3,PLATFORM);
 // planting spilling over the terrace lip and down the big hill wall
 for(let x=15.7;x<29.2;x+=.78)
  blob(x+rr(-.22,.22),PLATFORM+rr(-.16,.06),-16.12+rr(-.06,.04),
   rr(.26,.44),rr(.18,.30),rr(.20,.32),pick([M.leafOlive,M.leafVine,M.leafDark,oliveB,oliveC]));
 for(const x of[16.4,18.1,19.9,21.6,23.4,25.1,26.8,28.5]){
  const y0=PLATFORM-rr(.2,.5);
  blob(x+rr(-.1,.1),y0,-15.84+rr(-.02,.03),rr(.24,.36),rr(.18,.30),rr(.10,.15),pick([M.leafVine,M.leafDark,M.leafOlive]));
  blob(x+rr(-.15,.15),y0-rr(.22,.55),-15.83+rr(-.02,.03),rr(.16,.26),rr(.20,.34),rr(.10,.14),pick([M.leafDark,M.leafVine]));
 }
 cypresses([[28.85,-22.30,1.02],[28.85,-20.20,1.12],[28.85,-18.10,.96]],PLATFORM);
 // -- hillock + cypress at the foot of the hill wall (outer rim)
 const neTop=hillMound(30.55,-20.85,1.30,1.80,GROUND,{tiers:2});
 cypresses([[30.15,-21.40,1.02],[30.88,-20.32,.90]],neTop);
 cheapOlive(29.95,neTop,-22.15,.82);

 // ============================================================ NW TERRACE END
 // y = PLATFORM. Olive terraces + farmhouse + capanna on the west end.
 groundPatch(-22.90,-19.78,12.60,6.75,grass1,PLATFORM+.004);
 groundPatch(-25.60,-18.00,5.20,2.05,grass3,PLATFORM+.006);
 groundPatch(-25.30,-21.40,3.20,1.50,grass2,PLATFORM+.007);
 arch.casa({id:'podere-ovest',x:-27.0,z:-19.20,y:PLATFORM,w:3.8,d:3.0,floors:2,color:'#ddc7a0',finish:'stone',rot:0});
 // -- stone capanna tucked against the back of the olive terrace
 stoneHut(-23.70,PLATFORM,-21.55,-.08,2.10,1.80,2.05,{color:'#d6c39c',tint:2});
 pot(-22.55,PLATFORM,-20.55,.8);pot(-24.80,PLATFORM,-20.50,.75,false);
 // -- olive grove, loose rows (scene.js keeps its own trees along the ridge)
 props.oliveTree?.(-24.40,-20.60,1.05,PLATFORM);
 cheapOlive(-22.00,PLATFORM,-20.70,1.00);
 cheapOlive(-24.60,PLATFORM,-18.80,.92);
 props.oliveTree?.(-21.60,-18.90,1.10,PLATFORM);
 cheapOlive(-18.40,PLATFORM,-18.80,.95);
 props.oliveTree?.(-16.90,-19.10,.90,PLATFORM);
 cheapOlive(-16.90,PLATFORM,-22.40,.85);
 // -- low stone riser through the olive terraces
 wall(-24.80,PLATFORM+.10,-19.95,0,7.60,.22,.30,{cap:false});
 hayBale(-18.05,PLATFORM,-17.70,.25);
 box(-20.60,PLATFORM+.23,-17.62,.90,.40,.34,M.trimStone);
 box(-20.60,PLATFORM+.45,-17.62,.96,.08,.40,M.trimWhiteStone);
 pot(-17.55,PLATFORM,-17.40,.78);pot(-21.60,PLATFORM,-17.30,.72,false);
 // -- track along the south lip of the terrace
 track([[-16.60,PLATFORM,-16.95],[-19.40,-17.20],[-22.40,-17.15],[-25.40,-17.10],[-26.60,-17.00]],.88,PLATFORM+.012);
 // -- dry-stone field walls along the south lip
 wall(-19.60,PLATFORM,-16.55,0,4.80,.42,.40,{gaps:[[1.55,2.35]]});
 wall(-26.40,PLATFORM,-16.55,0,4.40,.44,.40);
 // -- tall masonry retaining wall under the terrace west edge
 retaining(-29.40,GROUND,-20.30,Math.PI/2,8.10,3.72);
 stoneWell(-25.90,PLATFORM,-21.30);
 props.lavender?.(-23.10,-16.85,3,PLATFORM);
 cypresses([[-17.00,-17.90,1.00]],PLATFORM);
 // planting spilling over the terrace lip and down the big hill wall
 for(let x=-29.1;x<-16.6;x+=.80)
  blob(x+rr(-.22,.22),PLATFORM+rr(-.16,.06),-16.12+rr(-.06,.04),
   rr(.26,.44),rr(.18,.30),rr(.20,.32),pick([M.leafOlive,M.leafVine,M.leafDark,oliveB,oliveC]));
 for(const x of[-17.4,-19.1,-20.8,-22.5,-24.2,-25.9,-27.6,-29.0]){
  const y0=PLATFORM-rr(.2,.5);
  blob(x+rr(-.1,.1),y0,-15.84+rr(-.02,.03),rr(.24,.36),rr(.18,.30),rr(.10,.15),pick([M.leafVine,M.leafDark,M.leafOlive]));
  blob(x+rr(-.15,.15),y0-rr(.22,.55),-15.83+rr(-.02,.03),rr(.16,.26),rr(.20,.34),rr(.10,.14),pick([M.leafDark,M.leafVine]));
 }
 cypresses([[-28.85,-22.30,1.00],[-28.85,-20.20,1.10],[-28.85,-18.10,.95]],PLATFORM);
 // -- walled kitchen garden on the ground strip below the west terrace
 wall(-27.20,GROUND,-15.35,0,6.20,.52,.42,{gaps:[[-1.1,-.35]]});
 vegPlot(-28.60,GROUND,-14.40,.05,1.80,.80);
 vegPlot(-26.40,GROUND,-14.10,-.10,1.90,.80);
 vegPlot(-25.10,GROUND,-14.70,.15,1.50,.70);
 props.lavender?.(-29.20,-14.90,3,GROUND);
 props.rosemary?.(-24.55,-14.30,3,GROUND);
 cheapOlive(-29.00,GROUND,-15.55,.85);
 pot(-24.30,GROUND,-13.90,.8);
 // -- hillock + cypress at the foot of the hill wall on the outer rim
 const nwTop=hillMound(-30.55,-20.85,1.30,1.80,GROUND,{tiers:2});
 cypresses([[-30.15,-21.40,1.02],[-30.92,-20.32,.90]],nwTop);
 cheapOlive(-29.95,nwTop,-22.15,.82);

 // ============================================================ EAST CASALE
 // Ground band below the north hill wall, east side: farm + rim track.
 arch.casa({id:'casale-est',x:27.4,z:-13.70,y:GROUND,w:4.2,d:3.0,floors:2,color:'#e4d0a8',finish:'stone',rot:0});
 courtyard(28.50,GROUND,-11.40,4.60,2.30);
 props.pergola?.(28.95,-11.30,2.20,1.20,0,GROUND);
 props.woodStack?.(26.20,-11.20,.10,GROUND);
 props.crates?.(29.90,-10.60,.20,GROUND);
 props.barrel?.(25.70,-11.00,GROUND);
 hayBale(26.40,GROUND,-10.35,-.15);
 pot(30.40,GROUND,-11.90,.85);pot(25.20,GROUND,-10.40,.80);
 cheapOlive(30.40,GROUND,-10.60,.90);
 track([[30.40,GROUND,-10.45],[30.90,-9.60],[30.90,-5.00],[30.90,-.60],[30.90,3.90],[30.62,7.60],[30.57,8.95]],.86,GROUND+.012);
 cypresses([[31.56,-8.40,1.00],[31.56,-5.00,1.10],[31.56,-1.60,.95],[31.60,4.30,.90]],GROUND);
 // stone field gate at the end of the track
 for(const gx of[30.10,31.04]){
  box(gx,GROUND+.46,9.30,.34,.92,.34,stone1);
  box(gx,GROUND+.98,9.30,.46,.12,.46,stone3);
 }

 // ============================================================ WEST RIM
 // cypress line, aedicula and terraced hillocks framing the road end.
 cypresses([[-31.22,13.00,1.05],[-31.22,15.30,1.15],[-31.22,17.60,1.18],[-31.20,19.70,.98]],GROUND);
 shrine(-31.05,GROUND,11.60,Math.PI/2);
 wall(-31.55,GROUND,17.60,Math.PI/2,7.40,.46,.38,{gaps:[[-1.3,-.5]]});
 const wTop=hillMound(-30.75,5.30,1.18,1.55,GROUND,{tiers:2});
 cypresses([[-30.45,4.85,.95]],wTop);
 cheapOlive(-31.05,wTop,5.95,.85);
 // south-west corner behind the lower town: a last cypress group / hay meadow
 const swTop=hillMound(-30.80,22.80,1.15,1.45,GROUND,{tiers:2});
 cypresses([[-30.55,22.35,1.10],[-30.95,23.35,.95]],swTop);
 hayBale(-28.90,GROUND,24.15,.45);
 pot(-29.80,GROUND,23.90,.8);
 props.lavender?.(-30.20,19.90,3,GROUND);
 // tall cypresses framing the south-west foreground (clear of the Ferrari lay-by)
 cypresses([[-16.15,23.20,1.25],[-8.35,22.30,1.05],[-6.35,23.10,1.10]],GROUND);
 // a little stone-edged farm track leading from the west field edge toward the gate
 track([[-8.40,GROUND,23.95],[-6.80,23.90],[-5.00,23.55],[-3.50,23.00],[-2.50,22.50]],.80,GROUND+.012);
 hayBale(-7.95,GROUND,24.45,.25);
 pot(-8.05,GROUND,21.95,.78);
 // low dry-stone field edging beyond the track (west of the lay-by)
 wall(-8.40,GROUND,24.78,0,1.80,.34,.30,{gaps:[[.35,1.10]]});

 // ============================================================ FIELD DRESSING
 // Grass / dry-earth variation on the field edges (2 tris each).
 groundPatch(-28.60,15.40,3.40,2.60,grass3);
 groundPatch(-27.80,9.80,3.00,2.20,grass2);
 groundPatch(-31.00,7.80,1.90,2.60,grass3);
 groundPatch(30.40,2.20,1.20,4.20,grass3);
 groundPatch(31.05,-13.90,1.30,2.20,grass3);
 groundPatch(-27.60,-13.20,2.60,1.40,grass2);
 // rough boulders, dry tufts and wildflowers on the safe field fringes
 for(let i=0;i<16;i++)rock(rr(29.7,31.7),GROUND,rr(-24.2,-16.6),rr(.4,.75));
 for(let i=0;i<14;i++)rock(rr(-31.7,-29.7),GROUND,rr(-24.2,-16.6),rr(.4,.75));
 for(let i=0;i<10;i++)rock(rr(-31.7,-30.0),GROUND,rr(-10.8,12.0),rr(.35,.6));
 for(let i=0;i<10;i++)rock(rr(31.0,31.85),GROUND,rr(-10.8,7.0),rr(.30,.55));
 for(let i=0;i<20;i++)tuft(rr(29.8,31.8),GROUND,rr(-24.2,-16.5),rr(.7,1.1));
 for(let i=0;i<18;i++)tuft(rr(-31.8,-29.8),GROUND,rr(-24.2,-16.5),rr(.7,1.1));
 for(let i=0;i<12;i++)tuft(rr(-31.8,-30.1),GROUND,rr(-11.0,12.0),rr(.6,1.0));
 for(let i=0;i<12;i++)tuft(rr(31.1,31.85),GROUND,rr(-10.8,8.0),rr(.6,1.0));
 for(let i=0;i<16;i++){
  const east=random()<.5;
  const px=east?rr(24.6,31.4):rr(-31.4,-24.6);
  const pz=rr(-15.6,-11.4);
  blob(px,GROUND+.10,pz,.045,.05,.045,pick([flowerPink,flowerGold,lavenderMat,M.trimWhite]));
 }

 return {
  plots:['vineyard-nord-est','olive-terrace-nord-ovest','orto-ovest','casale-est','limonaia','capanna'],
  houses:['podere-est','podere-ovest','casale-est'],
  tracks:4,
  platform:{x0:-29.4,x1:29.4,z0:-24.5,z1:-15.8,y:PLATFORM}
 };
}
