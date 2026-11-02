import * as THREE from '../../vendor/three/build/three.module.js';
// Italian street furniture and planting on top of the Starter's prop conventions.
// Everything is merged through ctx.batch, so a function can be called as often as
// the layout needs: foliage goes through the shared instanced ball pool, timber and
// ironwork merge into one static mesh per material.
export function createItalianProps(ctx){
 const {M,random,rr,pick,streetLampBulb}=ctx;const {box,cyl,ball,pipe,at,geometry,geo,transform,instance}=ctx.batch;const {warmPool}=ctx.signage;
 const level=.8;

 // ------------------------------------------------------------------ shared tints
 // Only the Mediterranean accents the shared palette is missing. Each ctx.mat()
 // call is cached, so every prop here shares two or three extra materials at most.
 const leafSilver=ctx.mat('#8f9a74');       // olive/rosemary silver-green
 const leafCypressDeep=ctx.mat('#2b3d27');  // shaded cypress olive
 const lavenderBloom=ctx.mat('#8e7fb2');    // lavender / wisteria purple
 const lavenderHi=ctx.mat('#b2a5cc');       // sunlit purple highlight
 const rippleGeo=new THREE.TorusGeometry(1,.020,5,26);

 // --------------------------------------------------------------- cypress / pine
 // Slim Lombardy cypress: seven overlapping layers, each with two asymmetric side
 // lobes, so the column silhouette stays narrow but never reads as a clean stack.
 function cypress(x,z,s=1,y=level){
  cyl(x,y+s*.36,z,.05*s,.70*s,M.wood);
  cyl(x,y+s*.05,z,.11*s,.10*s,M.woodDark);
  const rings=7,tipBase=y+s*2.80;
  for(let i=0;i<rings;i++){
   const t=i/(rings-1);
   const cy=y+s*(.66+t*2.06);
   const rad=(.325-.245*t)*s,hh=(.80-.15*t)*s;
   const a=random()*Math.PI*2;
   geometry(geo.cone,i%3===1?M.leafCypress:(i%2?leafCypressDeep:M.leafPine),transform(x,cy,z,rad,hh,rad,0,a*.6,0));
   for(const dir of[-1,1]){
    const aa=a+dir*(1.5+random()*.55);
    geometry(geo.cone,i%2?leafCypressDeep:M.leafCypress,
     transform(x+Math.cos(aa)*rad*.50,cy-hh*.14,z+Math.sin(aa)*rad*.50,rad*.44,hh*.58,rad*.44,0,aa,0));
   }
  }
  // crown: three narrowing cones so the top tapers to a soft point
  for(let k=0;k<3;k++){
   const tr=(.085-.022*k)*s;
   geometry(geo.cone,k===2?leafCypressDeep:M.leafCypress,
    transform(x+rr(-.015,.015)*s,tipBase+k*.16*s,z+rr(-.015,.015)*s,tr,(.28-.04*k)*s,tr,0,random()*Math.PI*2,0));
  }
 }
 // Stone-pine (pino marittimo): tall bare trunk, flat wide umbrella crown.
 function pine(x,z,s=1,y=level){
  const trunk=y+s*2.3;cyl(x,y+s*1.15,z,.075*s,2.3*s,M.wood);
  pipe([x,y+s*2.2,z],[x+s*.30,y+s*2.9,z+s*.12],.05*s,M.wood);
  pipe([x,y+s*2.1,z],[x-s*.28,y+s*2.8,z-s*.16],.045*s,M.wood);
  for(let i=0;i<8;i++){
   const a=i*2.1,r=rr(.18,.98)*s;
   ball(x+Math.cos(a)*r,trunk+rr(.22,.58)*s,z+Math.sin(a)*r*1.05,rr(.95,1.42)*s,rr(.26,.40)*s,rr(.95,1.38)*s,
    pick([M.leafPine,M.leafOlive,M.leafDark,leafCypressDeep]));
  }
  ball(x,trunk+s*.58,z,1.08*s,.30*s,1.02*s,M.leafPine);
  ball(x+s*.30,trunk+s*.22,z-s*.20,.55*s,.22*s,.52*s,M.leafOlive);
 }
 function treeIfClear(x,z,s=1,kind='cypress'){
  const crown=kind==='pine'?1.9*s:.7*s;
  if(ctx.obstacles.some(b=>Math.hypot(Math.max(Math.abs(x-b.x)-b.w,0),Math.max(Math.abs(z-b.z)-b.d,0))<crown))return false;
  if(kind==='pine')pine(x,z,s);else cypress(x,z,s);
  ctx.obstacles.push({x,z,w:.26*s,d:.26*s,label:kind+' trunk'});return true;
 }

 // --------------------------------------------------------------- piazza planting
 // Clipped bay/rosemary hedge in a stone planter.
 function hedge(x,z,w=1.4,d=.62,rot=0,y=level){
  ctx.obstacles.push({x,z,w:Math.abs(Math.cos(rot))*w/2+Math.abs(Math.sin(rot))*d/2+.1,d:Math.abs(Math.sin(rot))*w/2+Math.abs(Math.cos(rot))*d/2+.1,label:'hedge'});
  at(x,y,z,rot,()=>{
   box(0,.14,0,w,.28,d,M.trimStone);
   box(0,.30,0,w-.12,.06,d-.12,M.soilWarm);
   const n=Math.ceil(w/.20);
   for(let i=0;i<n;i++)ball(-w/2+.11+i*(w-.22)/(n-1),.47,rr(-.03,.03),.17,.21,.16,i%3?M.leafOlive:M.leafVine);
   // a few sprigs poke above the clipped line so it reads hand-kept, not noise
   for(let i=0;i<Math.round(w*2);i++)ball(rr(-w/2+.1,w/2-.1),.62,rr(-d*.22,d*.22),.09,.13,.08,i%2?leafSilver:M.leafVine);
  });
 }
 function planter(x,z,r=.42,y=level){
  ctx.obstacles.push({x,z,w:r+.12,d:r+.12,label:'planter'});
  cyl(x,y+.06,z,r*.86,.12,M.terracottaDark);
  cyl(x,y+.26,z,r,.44,M.terracotta);
  cyl(x,y+.49,z,r+.03,.07,M.terracotta);
  cyl(x,y+.53,z,r-.05,.03,M.soilWarm);
  for(let i=0;i<4;i++)ball(x+rr(-r*.5,r*.5),y+.74,z+rr(-r*.5,r*.5),.22,.24,.20,i%2?M.leafOlive:leafSilver);
  for(let i=0;i<3;i++)ball(x+rr(-r*.5,r*.5),y+.82,z+rr(-r*.5,r*.5),.10,.10,.09,i%2?M.bougainvillea:M.paintRed);
 }
 function bench(x,z,rot=0,y=level){
  ctx.obstacles.push({x,z,w:Math.abs(Math.cos(rot))*.95+Math.abs(Math.sin(rot))*.28,d:Math.abs(Math.sin(rot))*.95+Math.abs(Math.cos(rot))*.28,label:'bench'});
  at(x,y,z,rot,()=>{
   for(let i=0;i<3;i++)box(0,.52,0,1.9,.07,.16,M.woodLight);
   for(let i=0;i<2;i++)box(0,.74+i*.02,-.24,1.9,.13,.06,M.wood);
   for(const xx of[-.78,.78]){box(xx,.26,0,.10,.52,.46,M.iron);box(xx,.80,-.24,.08,.62,.06,M.iron);}
  });
 }
 // Tuscan piazza lamp: slender post with a lantern head.
 function lamp(x,z,rot=0,y=level){
  ctx.obstacles.push({x,z,w:.22,d:.22,label:'lamp'});
  at(x,y,z,rot,()=>{
   cyl(0,.10,0,.20,.20,M.iron);
   cyl(0,1.55,0,.085,3.0,M.iron);
   cyl(0,3.06,0,.13,.10,M.brass);
   box(0,3.30,0,.46,.06,.46,M.iron);
   for(const dx of[-.19,.19])for(const dz of[-.19,.19])box(dx,3.58,dz,.035,.52,.035,M.iron);
   box(0,3.58,0,.40,.52,.40,streetLampBulb);
   cyl(0,3.90,0,.30,.16,M.iron);
   ball(0,4.00,0,.10,.10,.10,M.brass);
  });
  warmPool(x,z,3.4,3.4);
 }
 // Fountain in a stone basin (the piazza centre). Tiered: octagonal steps, a wide
 // lower pool, a carved pedestal with spouts, then two smaller basins and a bronze
 // pinecone finial, so the silhouette reads at the default camera distance.
 function fountain(x,z,r=2.4,y=level){
  ctx.obstacles.push({x,z,w:r+.62,d:r+.62,label:'fountain'});
  cyl(x,y+.05,z,r+.52,.10,M.trimStone);
  cyl(x,y+.13,z,r+.34,.07,M.trimWhiteStone);
  // lower basin drum, coping and water sheet
  cyl(x,y+.34,z,r,.52,M.trimStone);
  cyl(x,y+.62,z,r+.05,.10,M.trimWhiteStone);
  cyl(x,y+.66,z,r-.12,.06,M.water);
  geometry(rippleGeo,M.waterLight,transform(x,y+.70,z,r*.62,1,r*.62,Math.PI/2,0,0));
  geometry(rippleGeo,M.waterLight,transform(x,y+.70,z,r*.92,1,r*.92,Math.PI/2,0,0));
  // central pedestal
  cyl(x,y+.96,z,.54,.22,M.trimWhiteStone);
  cyl(x,y+1.32,z,.30,1.10,M.trimWhiteStone);
  cyl(x,y+1.90,z,.52,.16,M.trimWhiteStone);
  // middle basin + water ring
  cyl(x,y+2.02,z,.76,.20,M.trimWhiteStone);
  cyl(x,y+2.13,z,.64,.05,M.water);
  geometry(rippleGeo,M.waterLight,transform(x,y+2.17,z,.50,1,.50,Math.PI/2,0,0));
  // upper column, top basin, bronze pinecone finial
  cyl(x,y+2.34,z,.17,.56,M.trimWhiteStone);
  cyl(x,y+2.62,z,.42,.16,M.trimWhiteStone);
  cyl(x,y+2.71,z,.33,.05,M.water);
  ball(x,y+2.92,z,.15,.19,.15,M.bronze);
  geometry(geo.cone,M.bronze,transform(x,y+3.08,z,.10,.18,.10));
  ball(x,y+3.20,z,.05,.06,.05,M.brass);
  // four carved spouts on the pedestal throwing thin water into the big pool
  for(let i=0;i<4;i++){
   const a=i*Math.PI/2+.35;
   ball(x+Math.cos(a)*.30,y+1.72,z+Math.sin(a)*.30,.14,.12,.14,M.marbleWhite);
   pipe([x+Math.cos(a)*.30,y+1.74,z+Math.sin(a)*.30],[x+Math.cos(a)*.58,y+1.78,z+Math.sin(a)*.58],.045,M.marbleWhite);
   ball(x+Math.cos(a)*.62,y+1.76,z+Math.sin(a)*.62,.09,.09,.09,M.marbleWhite);
   pipe([x+Math.cos(a)*.64,y+1.70,z+Math.sin(a)*.64],[x+Math.cos(a)*1.02,y+.70,z+Math.sin(a)*1.02],.016,M.waterLight);
  }
  // two bronze dolphins arcing water from the middle basin
  for(const a of[.9,2.25]){
   pipe([x+Math.cos(a)*.20,y+2.02,z+Math.sin(a)*.20],[x+Math.cos(a)*.58,y+2.22,z+Math.sin(a)*.58],.05,M.bronze);
   ball(x+Math.cos(a)*.62,y+2.24,z+Math.sin(a)*.62,.10,.08,.10,M.bronze);
   pipe([x+Math.cos(a)*.66,y+2.18,z+Math.sin(a)*.66],[x+Math.cos(a)*.98,y+.72,z+Math.sin(a)*.98],.018,M.waterLight);
  }
  // stone bollards on the outer step
  for(let i=0;i<4;i++){
   const a=i*Math.PI/2+.78;
   cyl(x+Math.cos(a)*(r+.48),y+.14,z+Math.sin(a)*(r+.48),.09,.24,M.trimWhiteStone);
   ball(x+Math.cos(a)*(r+.48),y+.28,z+Math.sin(a)*(r+.48),.09,.10,.09,M.trimStone);
  }
 }
 // Wisteria ladder over a shop doorway / pergola beam, with hanging racemes.
 function pergola(x,z,w,d,rot=0,y=level){
  at(x,y,z,rot,()=>{
   for(const sx of[-w/2,w/2])for(const sz of[-d/2,d/2])box(sx,.95,sz,.10,1.9,.10,M.wood);
   for(const sz of[-d/2,d/2])box(0,1.92,sz,w+.24,.10,.10,M.wood);
   for(let i=0;i<=6;i++)box(-w/2+w*i/6,2.04,0,.06,.10,d+.20,M.wood);
   // twisting wisteria stems running along the top beams
   for(const sz of[-d/2*.7,d/2*.7]){
    let px=-w/2+.3;
    for(let s2=0;s2<4;s2++){
     const nx=px+(w-.6)/4,ny=2.08+Math.sin(s2*2.1)*.05;
     pipe([px,ny,sz],[nx,ny+Math.cos(s2*1.7)*.05,sz],.022,M.woodDark);
     px=nx;
    }
   }
   // dense but flat leafy canopy: overlapping clumps, only a few blossoms
   for(let i=0;i<26;i++){
    const px=rr(-w/2,w/2),pz=rr(-d/2-.05,d/2+.05);
    const m=i===7||i===19?M.bougainvillea:(i%3===0?M.leafDark:(i%2?M.leafVine:leafSilver));
    ball(px,2.16+rr(-.05,.10),pz,rr(.22,.34),rr(.13,.20),rr(.22,.32),m);
   }
   // short wisteria racemes hanging under the canopy
   for(let i=0;i<7;i++){
    const px=rr(-w/2+.2,w/2-.2),pz=rr(-d/2,d/2),drop=rr(.30,.55);
    for(let k=0;k<4;k++){
     const t=k/3;
     ball(px+rr(-.04,.04),2.06-drop*t,pz+rr(-.03,.03),.06-t*.012,.09,.05,k%2?lavenderBloom:lavenderHi);
    }
   }
  });
 }
 // Bunting strings across the piazza.
 function bunting(from,to,y=4.2,sag=.55){
  const a=new THREE.Vector3(from[0],y,from[1]),b=new THREE.Vector3(to[0],y,to[1]);
  const mid=a.clone().add(b).multiplyScalar(.5);mid.y-=sag;
  const curve=new THREE.QuadraticBezierCurve3(a,mid,b);
  const pts=curve.getPoints(14);
  for(let i=1;i<pts.length;i++)pipe([pts[i-1].x,pts[i-1].y,pts[i-1].z],[pts[i].x,pts[i].y,pts[i].z],.012,M.iron);
  for(let i=1;i<13;i++){
   const p=pts[i];const m=i%3===0?M.awningCream:i%3===1?M.awningRose:M.paintGreen;
   geometry(geo.cone,m,transform(p.x,p.y-.16,p.z,.13,.30,.13,Math.PI,0,0));
  }
 }
 // A parked Vespa used as decoration; the moving ones come from the actor factory.
 function vespaParked(x,z,rot=0,color=M.paintBlue,y=level){ at(x,y,z,rot,()=>{
  for(const zz of[-.42,.42]){cyl(0,.26,zz,.22,.11,M.black,0,Math.PI/2);cyl(0,.26,zz,.10,.13,M.metal,0,Math.PI/2);}
  box(0,.52,-.10,.34,.42,.70,color);
  box(0,.60,.30,.30,.50,.16,color);
  box(0,.82,-.34,.40,.12,.46,M.wood);
  box(0,1.02,.40,.52,.05,.06,M.iron);
  ball(0,.82,.52,.10,.10,.06,M.lamp);
 }); }


 // ---------------------------------------------- Mediterranean belvedere planting
 // Olive tree: low gnarled trunk, airy silver-green canopy with real gaps between
 // the clumps, plus bare twigs poking out. Height ~2.4 world units at s=1.
 function oliveTree(x,z,s=1,y=level){
  ctx.obstacles.push({x,z,w:.34*s+.1,d:.34*s+.1,label:'olive'});
  // twisted, knotted trunk from three short leaning segments
  let bx=x,bz=z,by=y;
  for(let i=0;i<3;i++){
   const a=random()*Math.PI*2,len=rr(.30,.40)*s;
   const nx=bx+Math.cos(a)*len*.62,nz=bz+Math.sin(a)*len*.62,ny=by+len;
   pipe([bx,by,bz],[nx,ny,nz],(.145-.032*i)*s,M.wood);
   ball(nx,ny-.02*s,nz,rr(.13,.17)*s,rr(.10,.13)*s,rr(.13,.17)*s,M.woodDark);
   bx=nx;bz=nz;by=ny;
  }
  // four or five gnarled main branches
  const nb=4+Math.floor(random()*2);
  for(let i=0;i<nb;i++){
   const a=i*2.4+rr(-.5,.5),reach=rr(.5,.95)*s,lift=rr(.30,.55)*s;
   pipe([bx,by,bz],[bx+Math.cos(a)*reach,by+lift,bz+Math.sin(a)*reach],.05*s,M.wood);
  }
  // airy canopy: many small clumps, mostly silver, with deliberate gaps
  const mats=[leafSilver,M.leafOlive,leafSilver,M.leafPine,leafSilver,M.leafDark];
  for(let i=0;i<13;i++){
   const a=random()*Math.PI*2,r=rr(.18,1.02)*s;
   const cy=by+rr(.18,.66)*s+(1-r/(1.2*s))*.10*s;
   ball(bx+Math.cos(a)*r,cy,bz+Math.sin(a)*r*.86,rr(.26,.46)*s,rr(.18,.30)*s,rr(.26,.46)*s,mats[i%mats.length]);
  }
  // a couple of bare twigs out of the canopy for character
  for(let i=0;i<2;i++){
   const a=random()*Math.PI*2;
   pipe([bx,by+.30*s,bz],[bx+Math.cos(a)*1.05*s,by+.72*s,bz+Math.sin(a)*1.05*s],.018*s,M.woodDark);
  }
  cyl(x,y+.03,z,.30*s,.06,M.soilWarm);
 }
 function lemonTree(x,z,s=1,y=level){
  ctx.obstacles.push({x,z,w:.28*s+.1,d:.28*s+.1,label:'lemon tree'});
  cyl(x,y+.52*s,z,.075*s,1.05*s,M.wood);
  const top=y+1.02*s;
  for(let i=0;i<3;i++){
   const a=i*2.1+.3;
   pipe([x,y+.68*s,z],[x+Math.cos(a)*.42*s,top+.18*s,z+Math.sin(a)*.42*s],.045*s,M.wood);
  }
  // rounded citrus canopy, a little denser than the olive
  for(let i=0;i<11;i++){
   const a=random()*Math.PI*2,r=rr(.10,.62)*s;
   ball(x+Math.cos(a)*r,top+rr(.10,.72)*s,z+Math.sin(a)*r*.86,rr(.28,.42)*s,rr(.22,.34)*s,rr(.28,.42)*s,
    i%4===0?M.leafOlive:i%2?M.leafVine:M.leafDark);
  }
  for(let i=0;i<7;i++){
   const a=random()*Math.PI*2,r=rr(.35,.80)*s;
   ball(x+Math.cos(a)*r,top+rr(.05,.55)*s,z+Math.sin(a)*r,rr(.075,.095)*s,rr(.10,.12)*s,rr(.075,.095)*s,M.paintYellow);
  }
  for(let i=0;i<2;i++)ball(x+rr(-.55,.55)*s,y+.06,z+rr(-.55,.55)*s,.09,.08,.09,M.paintYellow);
 }
 // Low lavender rows: grey-green mounds with upright purple spikes. n clumps.
 function lavender(x,z,n=5,y=level){
  const row=(n-1)*.40;
  ctx.obstacles.push({x,z,w:row/2+.22,d:.36,label:'lavender'});
  for(let i=0;i<n;i++){
   const cx=x-row/2+i*.40+rr(-.05,.05),cz=z+rr(-.13,.13);
   ball(cx,y+.14,cz,.20,.13,.17,leafSilver);
   ball(cx+rr(-.09,.09),y+.18,cz+rr(-.08,.08),.14,.10,.13,i%2?M.leafOlive:leafSilver);
   const spikes=6+Math.floor(random()*3);
   for(let k=0;k<spikes;k++){
    const a=random()*Math.PI*2,r=random()*.17,h=rr(.12,.22);
    instance('cone',k%3===0?lavenderHi:lavenderBloom,
     cx+Math.cos(a)*r,y+.28+h*.5,cz+Math.sin(a)*r,.021,h,.021,random()*3,rr(-.16,.16));
   }
  }
 }
 // Low silvery rosemary: rounded grey-green mounds with upright sprigs, plus the
 // odd tiny blue flower. n bushes.
 function rosemary(x,z,n=4,y=level){
  const row=(n-1)*.42;
  ctx.obstacles.push({x,z,w:row/2+.22,d:.40,label:'rosemary'});
  for(let i=0;i<n;i++){
   const cx=x-row/2+i*.42+rr(-.05,.05),cz=z+rr(-.13,.13);
   ball(cx,y+.16,cz,.22,.15,.19,M.leafOlive);
   ball(cx+rr(-.10,.10),y+.20,cz+rr(-.09,.09),.15,.11,.14,leafSilver);
   const sprigs=8+Math.floor(random()*4);
   for(let k=0;k<sprigs;k++){
    const a=random()*Math.PI*2,r=random()*.19,h=rr(.18,.32);
    instance('cone',k%4===0?M.leafOlive:leafSilver,cx+Math.cos(a)*r,y+.28+h*.5,cz+Math.sin(a)*r,.022,h,.022,random()*3,rr(-.10,.10));
    if(k===0)instance('cone',lavenderBloom,cx+Math.cos(a)*r*.7,y+.30+h*.5,cz+Math.sin(a)*r*.7,.014,h*.50,.014,0,0);
   }
  }
 }
 // Climbing ivy on a wall face. Local frame: the wall plane faces +Z, the vine
 // spans w along local X and grows from the wall base (y) up to h. Ascending
 // tendrils carry overlapping leaf patches (not bead strings), with a rooted mass
 // at the base, a crown spilling over the top edge and a few loose ends.
 function vineWall(x,z,rot=0,w=2.4,h=2.6,y=level){
  at(x,y,z,rot,()=>{
   const stems=Math.max(3,Math.round(w/.65)),cols=[];
   for(let c=0;c<stems;c++){
    const cx=-w/2+w*(c+.5)/stems+rr(-.08,.08);
    cols.push(cx);
    const top=h*(.55+random()*.40);
    let px=cx,py=.04,pz=.04;
    const segs=5;
    for(let s2=0;s2<segs;s2++){
     const nx=cx+Math.sin((s2+1)*1.05+c*1.7)*.10,ny=.04+(top-.04)*(s2+1)/segs,nz=.04+rr(0,.02);
     pipe([px,py,pz],[nx,ny,nz],.018,M.woodDark);
     px=nx;py=ny;pz=nz;
    }
    // overlapping leaf patches: broken ivy cover, not a line of beads
    for(let p=0;p<2;p++){
     const t=.16+random()*.70,cy=.12+t*top,cx2=cx+rr(-.20,.20),rad=rr(.14,.24);
     for(let k=0;k<4;k++){
      const a=random()*Math.PI*2,r=Math.sqrt(random())*rad;
      ball(cx2+Math.cos(a)*r,cy+Math.sin(a)*r*.8,.055+rr(0,.05),
       rr(.13,.20),rr(.11,.17),.055,
       k%4===0?M.leafDark:(k%2?M.leafVine:M.leafOlive));
     }
    }
    // leaves right on the tendril
    for(let k=0;k<5;k++){
     const t=random(),ly=.10+t*top;
     ball(cx+Math.sin(t*6.1+c)*.12+rr(-.10,.10),ly,.05+rr(0,.05),
      rr(.10,.16),rr(.09,.14),.05,k%3===0?M.leafOlive:M.leafVine);
    }
    // side tendrils branching off the main stem
    for(let b=0;b<2;b++){
     const ya=top*rr(.30,.75),xa=cx+rr(-.06,.06);
     const dir=b?1:-1,len=rr(.22,.46);
     pipe([xa,ya,.05],[xa+dir*len*.6,ya+.18,.06],.012,M.leafDark);
     pipe([xa+dir*len*.6,ya+.18,.06],[xa+dir*len,ya+.34,.065],.010,M.leafDark);
     ball(xa+dir*len,ya+.38,.065,.11,.10,.05,b?M.leafOlive:M.leafDark);
    }
   }
   // low runners connecting the stems just above the ground
   for(let c=0;c<cols.length-1;c++)pipe([cols[c],.24,.05],[cols[c+1],.34,.05],.010,M.leafDark);
   // rooted mass along the base
   const baseN=Math.max(4,Math.round(w/.30));
   for(let i=0;i<baseN;i++){
    ball(-w/2+.14+i*(w-.28)/Math.max(1,baseN-1),.15,.055,.21,.14,.10,i%2?M.leafVine:M.leafDark);
   }
   // crown spilling over the top edge
   const crownN=Math.max(3,Math.round(w/.36));
   for(let i=0;i<crownN;i++){
    ball(-w/2+.16+i*(w-.32)/Math.max(1,crownN-1),h+rr(-.08,.08),.06,.24,.17,.12,i%2?M.leafOlive:M.leafVine);
   }
   // a few dangling tendril ends reading as fresh growth
   for(let i=0;i<4;i++){
    const dx=rr(-w/2+.2,w/2-.2);
    pipe([dx,h-.12,.06],[dx+rr(-.08,.08),h-.60,.07],.010,M.leafDark);
    ball(dx+rr(-.05,.05),h-.64,.07,.11,.13,.05,M.leafVine);
   }
  });
 }
 // Bougainvillea / geranium bush: leafy core with a shell of papery blossoms.
 function flowerBush(x,z,s=1,kind='bougainvillea',y=level){
  ctx.obstacles.push({x,z,w:.36*s+.10,d:.36*s+.10,label:'flower bush'});
  for(let i=0;i<8;i++){
   const a=random()*Math.PI*2,r=random()*.24*s;
   ball(x+Math.cos(a)*r,y+rr(.16,.44)*s,z+Math.sin(a)*r,rr(.20,.30)*s,rr(.18,.26)*s,rr(.20,.30)*s,
    i%2?M.leafVine:M.leafDark);
  }
  // a little woody base so it doesn't float
  cyl(x,y+.14,z,.055*s,.28*s,M.woodDark);
  for(let i=0;i<2;i++){
   const a=random()*Math.PI*2;
   pipe([x,y+.16,z],[x+Math.cos(a)*.22*s,y+.44*s,z+Math.sin(a)*.22*s],.022*s,M.woodDark);
  }
  const nf=kind==='geranium'?11:13;
  for(let i=0;i<nf;i++){
   const a=random()*Math.PI*2,r=rr(.14,.42)*s;
   const m=kind==='geranium'?(i%3?M.paintRed:M.bougainvillea):(i%4===0?lavenderHi:M.bougainvillea);
   ball(x+Math.cos(a)*r,y+rr(.34,.74)*s,z+Math.sin(a)*r*.9,rr(.11,.19)*s,rr(.09,.15)*s,rr(.11,.19)*s,m);
  }
  // trailing stems over the ground
  for(let i=0;i<3;i++){
   const a=random()*Math.PI*2;
   pipe([x,y+.30*s,z],[x+Math.cos(a)*.45*s,y+.08,z+Math.sin(a)*.45*s],.016*s,M.leafVine);
   ball(x+Math.cos(a)*.46*s,y+.08,z+Math.sin(a)*.46*s,.07*s,.05*s,.06*s,M.leafVine);
  }
 }

 // Stone balustrade along the belvedere edge: rail, piers and turned balusters.
 function balustrade(x1,z1,x2,z2,y=level,height=1.02){
  const dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz),rot=-Math.atan2(dz,dx);
  const mx=(x1+x2)/2,mz=(z1+z2)/2;
  ctx.obstacles.push({x:mx,z:mz,w:Math.abs(dx)/2+.3,d:Math.abs(dz)/2+.3,label:'balustrade'});
  at(mx,y,mz,rot,()=>{
   box(0,.12,0,len,.20,.34,M.trimStone);
   box(0,height+.05,0,len,.14,.28,M.trimWhiteStone);
   const bays=Math.max(1,Math.round(len/2.3));
   for(let i=0;i<=bays;i++){
    const bx=-len/2+i*(len/bays);
    box(bx,.52,0,.22,height-.16,.24,M.trimStone);
    ball(bx,height+.16,0,.16,.13,.16,M.trimWhiteStone);
   }
   const count=Math.floor(len/.44);
   for(let i=0;i<count;i++){
    const bx=-len/2+(i+.5)*(len/count);
    cyl(bx,.46,0,.075,.62,M.trimLightStone);
    ball(bx,.20,0,.10,.10,.10,M.trimLightStone);
   }
   // recessed panels between the piers so the run has relief from the side
   for(let i=0;i<bays;i++){
    const bx=-len/2+(i+.5)*(len/bays);
    box(bx,.66,0,len/bays-.30,.30,.03,M.trimDark);
   }
  });
 }
 function stoneBench(x,z,rot=0,y=level){
  ctx.obstacles.push({x,z,w:.95,d:.36,label:'stone bench'});
  at(x,y,z,rot,()=>{
   box(0,.46,0,1.8,.14,.48,M.trimWhiteStone);
   for(const sx of[-.66,.66])box(sx,.22,0,.24,.44,.36,M.trimStone);
   box(0,.55,-.20,1.8,.10,.10,M.trimStone);
   for(const sx of[-.72,.72])box(sx,.52,.16,.14,.16,.12,M.trimWhiteStone);
  });
 }

 // Bicycle leaning against a wall or standing on the piazza.
 function bicycle(x,z,rot=0,color=M.paintBlue,y=level){
  ctx.obstacles.push({x,z,w:.55,d:.16,label:'bicycle'});
  at(x,y,z,rot,()=>{
   for(const zz of[-.52,.52]){cyl(0,.34,zz,.34,.035,M.black,Math.PI/2);cyl(0,.34,zz,.30,.02,M.iron,Math.PI/2);}
   pipe([0,.37,-.52],[0,.72,-.08],.022,color);pipe([0,.37,.52],[0,.72,-.08],.022,color);
   pipe([0,.37,.52],[0,.42,.12],.022,color);pipe([0,.72,-.08],[0,.56,.20],.022,color);
   box(0,.56,.20,.06,.05,.44,color);
   box(0,.78,-.12,.10,.04,.26,M.wood);
   pipe([0,.72,-.08],[0,.93,.06],.02,M.iron);
   box(0,.95,.06,.46,.03,.03,M.iron);
   box(0,.99,.10,.22,.04,.18,M.woodLight);
   for(const sx of[-.20,.20])box(sx,.34,.52,.035,.34,.035,M.iron);
   // wicker basket on the handlebars
   box(0,1.06,-.20,.24,.18,.20,M.woodLight);
   ball(0,1.13,-.20,.11,.06,.09,M.leafVine);
  });
 }
 // A-frame menu board with two painted faces.
 function menuBoard(x,z,rot=0,y=level){
  ctx.obstacles.push({x,z,w:.42,d:.28,label:'menu'});
  const menuMat=ctx.signage&&ctx.signage.signMat?ctx.signage.signMat('MENU','#2e3b33','#efe6cf'):null;
  at(x,y,z,rot,()=>{
   for(const s2 of[-1,1]){
    box(0,.62,s2*.10,.62,1.10,.045,M.woodDark,0,0,s2*.14);
    if(menuMat)geometry(geo.plane,menuMat,transform(0,.66,s2*.125,.48,.72,1,s2*-.14,.0,0));
    else box(0,.66,s2*.125,.42,.60,.01,M.archDark);
   }
   for(const sx of[-.26,.26])box(sx,.03,0,.05,.06,.34,M.wood);
   // chalk line under the word
   box(0,.38,.128,.30,.012,.006,M.trimLight);
   box(0,.30,.128,.26,.012,.006,M.trimLight);
  });
 }

 // ------------------------------------------------------------- street furniture
 // Small iron/wood Italian street bin: timber slat body, iron hoops and lid.
 function trashBin(x,z,rot=0,y=level){
  ctx.obstacles.push({x,z,w:.27,d:.27,label:'bin'});
  at(x,y,z,rot,()=>{
   box(0,.30,0,.42,.54,.42,M.woodDark);
   for(const s2 of[-1,1]){
    for(let k=0;k<4;k++){
     const yy=.13+k*.11;
     box(0,yy,s2*.216,.40,.095,.028,(k+s2)%2?M.wood:M.woodLight);
     box(s2*.216,yy,0,.028,.095,.40,(k+s2)%2?M.wood:M.woodLight);
    }
   }
   for(const yy of[.12,.50])cyl(0,yy,0,.235,.05,M.iron);
   cyl(0,.64,0,.24,.09,M.iron);
   box(0,.70,0,.44,.02,.20,M.archDark);
   ball(0,.76,0,.055,.05,.055,M.iron);
   box(0,.03,0,.30,.06,.30,M.iron);
  });
 }
 // Wrought-iron wall lantern: bracket, four-post lantern, warm glass. The glass
 // uses the shared emissive lamp material, so it reads at night without a light.
 // Local frame: plate against the wall at the origin, lantern hangs out along +Z.
 function wallLamp(x,y,z,rot=0){
  at(x,y,z,rot,()=>{
   box(0,0,-.02,.24,.40,.05,M.iron);
   for(const dy of[-.14,.14])box(0,dy,-.01,.07,.07,.05,M.iron);
   pipe([0,.12,.02],[0,.24,.42],.034,M.iron);
   pipe([0,.24,.42],[0,.20,.62],.022,M.iron);
   pipe([0,.12,.07],[0,.18,.32],.017,M.iron);
   pipe([0,.02,.16],[0,-.02,.30],.016,M.iron);
   box(0,-.04,.60,.34,.035,.34,M.iron);
   for(const dx of[-.13,.13])for(const dz of[-.13,.13])box(dx,.18,.60+dz,.026,.40,.026,M.iron);
   box(0,.18,.60,.28,.36,.28,streetLampBulb);
   geometry(geo.cone,M.iron,transform(0,.44,.60,.30,.22,.30));
   ball(0,.58,.60,.04,.055,.04,M.brass);
   ball(0,-.10,.60,.035,.025,.035,M.brass);
  });
 }
 // Aged wall posters: a timber notice board with overlapping faded manifestos.
 function posterBoard(x,y,z,rot=0,w=1.0,h=.72){
  at(x,y,z,rot,()=>{
   box(0,0,.02,w+.10,h+.10,.05,M.woodDark);
   box(0,0,.046,w,h,.02,M.woodLight);
   const posters=[
    [-w*.30,h*.20,w*.34,h*.56,M.cream,-.07],
    [w*.04,h*.24,w*.26,h*.42,M.trimWhite,.03],
    [-w*.04,-h*.24,w*.40,h*.30,M.cream,.05],
    [w*.31,-h*.10,w*.22,h*.46,M.trimLight,.08]
   ];
   for(const[px,py,pw,ph,pm,pr]of posters){
    geometry(geo.box,pm,transform(px,py,.059,pw,ph,.012,0,0,pr));
    for(let l=0;l<3;l++)geometry(geo.box,M.paintShadow,transform(px,py+ph*.24-l*.085,.067,pw*.62,.016,.006,0,0,pr));
    for(let l=0;l<2;l++)geometry(geo.box,M.paintShadow,transform(px,py-ph*.20-l*.07,.067,pw*.40,.012,.006,0,0,pr));
   }
   // a torn corner showing the board underneath
   geometry(geo.box,M.trimStone,transform(-w*.44,h*.33,.063,w*.10,h*.14,.012,0,0,.42));
   box(0,h/2+.08,.03,.10,.05,.05,M.iron);
   box(0,-h/2-.08,.03,.10,.05,.05,M.iron);
  });
 }
 // Firewood stacked against a wall: four courses of rough logs, cut ends out.
 function woodStack(x,z,rot=0,y=level){
  const c=Math.abs(Math.cos(rot)),s=Math.abs(Math.sin(rot));
  ctx.obstacles.push({x,z,w:.52*c+.30*s,d:.52*s+.30*c,label:'wood stack'});
  at(x,y,z,rot,()=>{
   for(let r=0;r<4;r++){
    const yy=.15+r*.145,per=5;
    for(let i=0;i<per;i++){
     if(r%2===0&&i===per-1&&r>1)continue;
     const len=rr(.78,.92),rad=rr(.062,.078);
     const px=-.40+i*.20+(r%2?.05:-.05)+rr(-.012,.012);
     const pz=rr(-.05,.05),rz=Math.PI/2+rr(-.025,.025);
     cyl(px,yy,pz,rad,len,r%2?M.wood:M.woodLight,0,rz);
     cyl(px+len/2+.011,yy,pz,rad*.93,.02,r%2?M.woodLight:M.wood,0,rz);
    }
   }
   // two loose logs leaning on the pile
   for(let i=0;i<2;i++){
    const a=rr(-.35,.35);
    pipe([-.44+i*.20,.12,.26],[.10+i*.16,.66,.30],.065,i?M.woodDark:M.wood);
   }
  });
 }
 // Window flower box: terracotta trough, geraniums and trailing ivy.
 function flowerBox(x,y,z,w=1.0,rot=0){
  at(x,y,z,rot,()=>{
   for(const sx of[-w/2+.16,w/2-.16]){
    box(sx,-.20,.06,.06,.05,.24,M.iron);
    pipe([sx,-.08,.03],[sx,-.28,.24],.016,M.iron);
   }
   box(0,0,.12,w,.24,.26,M.terracotta);
   box(0,.14,.12,w+.05,.05,.30,M.terracottaDark);
   box(0,.17,.12,w-.10,.03,.22,M.soilWarm);
   const n=Math.max(3,Math.round(w/.16));
   for(let i=0;i<n;i++){
    const px=-w/2+.10+i*(w-.20)/(n-1);
    ball(px,.30,.12,.10,.12,.10,i%3?M.leafVine:M.leafOlive);
    if(i%2===0)ball(px,.43,.13,.07,.09,.07,i%4?M.paintRed:M.bougainvillea);
   }
   for(let i=0;i<3;i++){
    const px=-w/2+.2+i*(w-.4)/2;
    for(let k=0;k<3;k++)ball(px+rr(-.04,.04),.18-k*.085,.27+rr(-.02,.02),.07,.08,.05,M.leafVine);
   }
  });
 }
 // A small flock of ground pigeons. n birds, scattered in a loose cluster.
 function pigeons(x,z,n=3,y=level){
  for(let i=0;i<n;i++){
   const a=random()*Math.PI*2,r=Math.sqrt(random())*.55;
   const px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r,rot=random()*Math.PI*2;
   at(px,y,pz,rot,()=>{
    const grey=i%4===0?M.trimWhite:M.metal;
    ball(0,.09,0,.085,.070,.125,grey);
    ball(0,.165,.080,.052,.055,.050,i%3?M.stoneLight:M.metal);
    geometry(geo.cone,M.paintYellow,transform(0,.155,.128,.018,.048,.018,Math.PI/2,0,0));
    geometry(geo.box,grey,transform(0,.105,-.105,.095,.020,.115,-.32,0,0));
    for(const sx of[-.028,.028])cyl(sx,.035,0,.008,.07,M.paintYellow);
    if(i%2===0)for(const sx of[-.055,.055])ball(sx,.085,-.02,.040,.055,.060,grey);
   });
  }
 }
 // Blue "P" parking plate on a slim post, with a white glyph built from boxes.
 function parkingSign(x,z,rot=0,y=level){
  ctx.obstacles.push({x,z,w:.18,d:.18,label:'parking sign'});
  at(x,y,z,rot,()=>{
   cyl(0,.02,0,.10,.06,M.iron);
   cyl(0,.92,0,.035,1.84,M.zinc);
   box(0,1.92,-.012,.52,.62,.032,M.trimWhite);
   box(0,1.92,.020,.46,.56,.022,M.paintBlue);
   // "P": stem, bowl top and bowl bottom, proud of the plate
   box(-.055,1.92,.035,.055,.34,.012,M.trimWhite);
   box(.020,2.055,.035,.16,.055,.012,M.trimWhite);
   box(.020,1.925,.035,.16,.055,.012,M.trimWhite);
   box(.100,1.990,.035,.055,.13,.012,M.trimWhite);
  });
 }
 // White marble street-name plate ("VIA ..."), text painted through the shared
 // sign texture helper when it is available.
 function streetSignPlate(x,y,z,rot=0,text='VIA DEL BORGO'){
  const sm=ctx.signage&&ctx.signage.signMat?ctx.signage.signMat(text,'#ece9dd','#33465e'):null;
  at(x,y,z,rot,()=>{
   box(0,0,-.024,1.08,.38,.05,M.trimWhiteStone);
   box(0,0,-.006,.98,.30,.022,M.trimLight);
   if(sm)geometry(geo.plane,sm,transform(0,0,.016,.92,.25,1));
   else box(0,0,.012,.88,.21,.012,M.paintBlue);
   for(const sx of[-.45,.45])box(sx,0,.026,.055,.44,.07,M.iron);
   // little stone corbels under the plate
   for(const sx of[-.30,.30])box(sx,-.20,.0,.10,.07,.12,M.trimStone);
  });
 }

 // ------------------------------------------------------------------- market stand
 // Italian market stall: timber frame, pitched striped canvas with a scalloped
 // valance, a cloth-draped counter with produce crates and baskets, hanging garlic
 // and chillies, and a small chalkboard. ~2.2 x 1.6 footprint.
 function marketStand(x,z,rot=0,color=M.awningRose,opts={}){
  const legacy=opts===true||(opts&&opts.legacy===true);
  ctx.obstacles.push({x,z,w:1.14,d:.82,label:'market stand'});
  at(x,level,z,rot,()=>{
   if(legacy){
    // The original flat-canopy stall, kept so older layouts can opt back in.
    for(const dx of[-.95,.95])for(const dz of[-.6,.6])box(dx,.95,dz,.07,1.9,.07,M.wood);
    box(0,1.98,0,2.2,.10,1.5,M.awningCream);
    box(0,1.52,0,2.0,.10,1.3,M.woodLight);
    for(let i=0;i<5;i++)ball(-.8+i*.4,1.68,rr(-.3,.3),.12,.13,.12,i%2?M.leafOlive:M.orange);
    for(let i=0;i<6;i++){const px=-1.1+i/5*2.2;box(px,1.78,.78,.30,.34,.03,i%2?M.awningCream:color);}
    return;
   }
   // four timber posts + head beams
   for(const dx of[-1.02,1.02])for(const dz of[-.68,.68])box(dx,.96,dz,.07,1.92,.07,M.wood);
   for(const dz of[-.68,.68])box(0,1.90,dz,2.18,.09,.09,M.wood);
   for(const dx of[-1.02,1.02])box(dx,1.90,0,.09,.09,1.44,M.wood);
   // pitched canvas roof: two slabs meeting at a ridge, cream stripes on top
   for(const side of[-1,1]){
    geometry(geo.box,color,transform(0,2.15,side*.36,2.26,.05,.80,side*.40,0,0));
    for(let s2=0;s2<5;s2++){
     const sx=-.96+s2*.48;
     geometry(geo.box,M.awningCream,transform(sx,2.196,side*.36,.20,.012,.78,side*.40,0,0));
    }
    // scalloped valance on the long eaves
    box(0,1.99,side*.74,2.26,.26,.02,color);
    for(let s2=0;s2<6;s2++)box(-1.02+s2*.408,1.99,side*.752,.22,.24,.02,M.awningCream);
    box(0,1.90,side*.70,2.30,.06,.06,M.woodDark);
   }
   box(0,2.30,0,2.34,.06,.10,M.awningCream);
   // counter with a striped cloth falling over the front
   box(0,.78,0,2.16,.08,.98,M.woodLight);
   box(0,.58,-.46,2.12,.36,.03,color);
   for(let s2=0;s2<4;s2++)box(-.80+s2*.53,.58,-.472,.18,.34,.02,M.awningCream);
   for(const dx of[-.98,.98])box(dx,.40,-.42,.06,.72,.06,M.wood);
   // produce crates on the counter: tomatoes, lemons, greens, oranges
   for(const[cx,cm]of[[-.70,M.woodDark],[-.08,M.wood],[.54,M.woodDark]]){
    box(cx,.96,0,.44,.26,.40,cm);
    box(cx,1.10,0,.40,.04,.36,M.wood);
    for(let i=0;i<4;i++)ball(cx+rr(-.14,.14),1.17,rr(-.13,.13),.085,.080,.085,
     pick([M.paintRed,M.paintYellow,M.orange,M.leafVine]));
   }
   // two woven baskets at the counter ends
   for(const[bx,bm]of[[-.96,M.woodLight],[.96,M.woodLight]]){
    cyl(bx,1.02,0,.16,.18,bm);
    for(let i=0;i<3;i++)ball(bx+rr(-.09,.09),1.14,rr(-.09,.09),.075,.070,.075,pick([M.paintRed,M.paintYellow,M.leafVine]));
   }
   // hanging strings under the front eave: garlic, chillies, salami
   for(const[hx,kind]of[[-.78,0],[-.26,1],[.26,0],[.78,1]]){
    pipe([hx,1.98,.58],[hx,1.90,.58],.008,M.iron);
    if(kind){
     for(let k=0;k<3;k++)ball(hx,1.82-k*.105,.58,.048,.068,.048,M.trimWhite);
    }else{
     for(let k=0;k<3;k++)ball(hx,1.82-k*.115,.58,.045,.075,.045,k===2?M.maroon:M.paintRed);
    }
   }
   // ground crates, a sack of flour and a few loose lemons
   box(-1.18,.15,.62,.36,.30,.32,M.woodDark);
   ball(-1.18,.36,.62,.15,.10,.13,M.leafVine);
   ball(1.20,.14,.60,.22,.12,.18,M.cream);
   for(let i=0;i<3;i++)ball(1.02+rr(-.10,.10),.05,rr(.42,.66),.08,.07,.08,M.paintYellow);
   // small chalkboard leaning on the counter end
   box(.90,.88,-.52,.50,.34,.03,M.woodDark);
   const chalk=ctx.signage&&ctx.signage.signMat?ctx.signage.signMat('MERCATO','#2f3a33','#efe6cf'):null;
   if(chalk)geometry(geo.plane,chalk,transform(.90,.88,-.504,.42,.26,1));
   for(const sx of[-.14,.14])box(.90+sx,.14,-.30,.035,.24,.035,M.wood);
  });
 }
 function marketStandLegacy(x,z,rot=0,color=M.awningRose){
  return marketStand(x,z,rot,color,{legacy:true});
 }

 // ------------------------------------------------------------------ cafe / spill
 // Café umbrella + round table + two chairs: the piazza's lived-in detail. The
 // parasol is striped and the table is set, so it reads at close camera range.
 function cafeSet(x,z,rot=0,color=M.awningCream,y=level){
  ctx.obstacles.push({x,z,w:1.15,d:1.15,label:'cafe set'});
  at(x,y,z,rot,()=>{
   // Table height matches the seated characters: chair seat .465 local, table top
   // .735 local (~1.6x seat), i.e. world ~1.5 at level .8. The old 1.44 tabletop
   // floated above standing diners' heads.
   cyl(0,.36,0,.045,.72,M.iron);
   cyl(0,.735,0,.40,.045,M.trimWhite);
   cyl(0,.755,0,.34,.02,M.cream);
   // place settings: two cups, saucers and a small menu card
   for(const[dx,dz]of[[-.14,.10],[.13,-.09]]){
    cyl(dx,.765,dz,.075,.012,M.trimWhite);
    cyl(dx,.790,dz,.042,.06,M.trimWhite);
    cyl(dx,.822,dz,.026,.05,M.cream);
   }
   geometry(geo.box,M.trimLight,transform(.02,.80,-.16,.10,.012,.15,0,.35,0));
   for(const s2 of[-1,1]){
    const cz=s2*.62;
    box(0,.44,cz,.34,.05,.32,M.woodLight);
    for(const sx of[-1,1])for(const sz of[-1,1])box(sx*.13,.24,cz+sz*.12,.04,.42,.04,M.iron);
    box(0,.63,cz+s2*.15,.34,.40,.04,M.woodLight);
   }
   // striped parasol: eight coloured gores, cream gores between them, iron ribs
   // underneath so the canopy reads as stretched fabric, not a floating disc
   cyl(0,1.55,0,.035,2.5,M.wood);
   const goreAlt=color===M.awningCream?M.trimLight:M.awningCream;
   for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2;
    geometry(geo.cone,color,transform(Math.cos(a)*.55,2.55,Math.sin(a)*.55,.72,.10,1.15,0,-a,0));
    const b=(i+.5)/8*Math.PI*2;
    geometry(geo.cone,goreAlt,transform(Math.cos(b)*.56,2.55,Math.sin(b)*.56,.72,.10,1.16,0,-b,0));
    pipe([0,2.45,0],[Math.cos(a+.39)*1.24,2.47,Math.sin(a+.39)*1.24],.012,M.iron);
   }
   geometry(geo.cone,color,transform(0,2.78,0,.16,.20,.16));
   ball(0,2.94,0,.09,.12,.09,M.brass);
  });
 }
 // A café-style wall awning used over an arcade bay.
 function awning(x,y,z,w,rot=0,color=M.awningRose){
  at(x,y,z,rot,()=>{
   const d=.95;
   geometry(geo.box,color,transform(0,0,d*.42,w,.05,d,0,0,0));
   for(let i=0;i<5;i++)box(-w/2+w*(i+.5)/5,.026,d*.42,w*.10,.02,d,M.awningCream);
   box(0,-.22,d*.86,w,.26,.03,color);
   for(let i=0;i<5;i++)box(-w/2+w*(i+.5)/5,-.22,d*.875,w*.10,.24,.02,M.awningCream);
  });
 }
 // Laundry strung between two facades: small colour flags of daily life.
 function laundry(a,b,y=3.4,sag=.5){
  const A=new THREE.Vector3(a[0],a[1],a[2]),B=new THREE.Vector3(b[0],b[1],b[2]);
  const mid=A.clone().add(B).multiplyScalar(.5);mid.y-=sag;
  const curve=new THREE.QuadraticBezierCurve3(A,mid,B),pts=curve.getPoints(18);
  for(let i=1;i<pts.length;i++)pipe([pts[i-1].x,pts[i-1].y,pts[i-1].z],[pts[i].x,pts[i].y,pts[i].z],.010,M.iron);
  const cloth=[M.trimWhite,M.paintBlue,M.awningRose,M.cream,M.paintGreen,M.trimLight];
  for(let i=3;i<pts.length-2;i+=2){
   const p=pts[i];const m=cloth[i%cloth.length];
   geometry(geo.box,m,transform(p.x,p.y-.30,p.z,rr(.22,.34),rr(.34,.52),.02,0,rr(-.15,.15),rr(-.05,.05)));
  }
 }
 // A catenary of warm bulbs over the piazza; reads as a line of tiny lights at night.
 function stringLights(a,b,y=4.8,sag=.7){
  const A=new THREE.Vector3(a[0],a[1],a[2]),B=new THREE.Vector3(b[0],b[1],b[2]);
  const mid=A.clone().add(B).multiplyScalar(.5);mid.y-=sag;
  const curve=new THREE.QuadraticBezierCurve3(A,mid,B),pts=curve.getPoints(26);
  for(let i=1;i<pts.length;i++)pipe([pts[i-1].x,pts[i-1].y,pts[i-1].z],[pts[i].x,pts[i].y,pts[i].z],.010,M.iron);
  for(let i=1;i<pts.length-1;i+=1){
   const p=pts[i];ball(p.x,p.y-.07,p.z,.055,.07,.055,M.lamp);
  }
 }
 function cat(x,z,rot=0,y=level,color=M.woodDark){ at(x,y,z,rot,()=>{
  ball(0,.20,0,.24,.16,.13,color);ball(0,.30,.20,.14,.14,.12,color);
  for(const sx of[-.1,.1])geometry(geo.cone,color,transform(sx,.42,.19,.07,.10,.05));
  cyl(0,.16,-.3,.025,.34,color,Math.PI/2.3);
 }); }
 // Potted lemon tree for a doorway: terracotta pot, stake, fruit and a few flowers.
 function lemonPot(x,z,y=level){
  ctx.obstacles.push({x,z,w:.42,d:.42,label:'lemon pot'});
  cyl(x,y+.05,z,.40,.10,M.terracottaDark);
  cyl(x,y+.30,z,.30,.42,M.terracotta);
  cyl(x,y+.53,z,.34,.07,M.terracotta);
  cyl(x,y+.565,z,.29,.03,M.soilWarm);
  cyl(x,y+.58,z,.035,.95,M.wood);
  for(let i=0;i<3;i++){
   const a=i*2.1;
   pipe([x,y+.98,z],[x+Math.cos(a)*.28,y+1.48,z+Math.sin(a)*.28],.04,M.wood);
  }
  for(const[dx,dz,sc]of[[0,0,1.0],[-.28,.14,.78],[.26,-.16,.82],[.05,.26,.70],[.30,.18,.62]]){
   ball(x+dx,y+1.30+sc*.22,z+dz,.32*sc,.34*sc,.32*sc,dx===0?M.leafOlive:M.leafVine);
  }
  for(const[dx,dz]of[[-.20,.18],[.20,.14],[.06,-.24],[-.26,-.10],[.30,-.02],[.02,.30],[-.10,.02]]){
   ball(x+dx,y+1.26,z+dz,.09,.105,.09,M.paintYellow);
  }
  for(let i=0;i<3;i++)ball(x+rr(-.45,.45),y+1.45,z+rr(-.4,.4),.03,.03,.03,M.trimWhite);
 }
 // Market spill: stacked timber crates of produce and barrels.
 function crates(x,z,rot=0,y=level){
  ctx.obstacles.push({x,z,w:.75,d:.55,label:'crates'});
  at(x,y,z,rot,()=>{
   box(0,.24,0,.72,.48,.52,M.wood);
   for(const sz of[-.17,.17]){
    box(0,.36,sz,.74,.06,.05,M.woodDark);
    box(0,.14,sz,.74,.06,.05,M.woodDark);
   }
   for(const sx of[-.335,.335])for(const sz of[-.24,.24])box(sx,.24,sz,.05,.48,.05,M.woodDark);
   // second crate, offset, with slat ends
   box(-.04,.62,.02,.62,.28,.44,M.woodLight);
   for(const sz of[-.19,.19])box(-.04,.70,sz,.64,.05,.04,M.wood);
   // produce spilling over the top
   const fruit=[M.paintRed,M.paintYellow,M.paintYellow,M.orange,M.leafVine,M.paintRed,M.leafOlive];
   for(let i=0;i<7;i++)ball(-.30+i*.095,.78+rr(-.02,.04),rr(-.13,.13),.075,.070,.075,fruit[i]);
   // side crate of greens with a melon on top
   box(.32,.18,.34,.34,.34,.34,M.woodDark);
   ball(.32,.39,.34,.15,.12,.15,M.leafVine);
   ball(.29,.47,.31,.105,.10,.105,M.green);
   // two loose lemons on the paving
   ball(.10,.06,.40,.075,.065,.075,M.paintYellow);
   ball(-.14,.06,.42,.070,.060,.070,M.paintYellow);
  });
 }
 function barrel(x,z,y=level){
  ctx.obstacles.push({x,z,w:.40,d:.40,label:'barrel'});
  cyl(x,y+.42,z,.32,.84,M.wood);
  for(let i=0;i<8;i++){
   const a=i/8*Math.PI*2;
   box(x+Math.cos(a)*.322,y+.42,z+Math.sin(a)*.322,.035,.80,.05,M.woodDark,-a);
  }
  for(const yy of[.18,.42,.66])cyl(x,y+yy,z,.34,.045,M.iron);
  cyl(x,y+.86,z,.30,.04,M.woodDark);
  cyl(x,y+.90,z,.05,.05,M.iron);
 }
 // A small roadside shrine (aedicula): stone columns, an arched niche and a cross.
 function aedicula(x,z,rot=0,y=level){
  ctx.obstacles.push({x,z,w:.8,d:.6,label:'aedicula'});
  at(x,y,z,rot,()=>{
   box(0,.12,0,1.30,.24,.72,M.trimStone);
   box(0,.30,0,1.16,.14,.60,M.trimWhiteStone);
   for(const sx of[-.42,.42]){cyl(sx,.92,0,.10,1.16,M.trimWhiteStone);box(sx,1.54,0,.28,.12,.28,M.trimStone);}
   box(0,1.02,-.10,.74,1.42,.16,M.trimLightStone);
   box(0,1.06,-.02,.46,1.16,.10,M.archDark);
   // little Madonna in the niche
   cyl(0,1.20,-.04,.07,.42,M.marbleWhite);ball(0,1.50,-.04,.12,.14,.10,M.marbleWhite);
   box(0,1.30,-.05,.16,.26,.04,M.paintBlue);
   // arched head, cornice and pediment
   for(let k=0;k<7;k++){const a=Math.PI*k/6;box(Math.cos(a)*.34,1.84+Math.sin(a)*.34,-.02,.16,.14,.22,M.trimWhiteStone,0,0,a-Math.PI/2);}
   box(0,2.30,-.02,1.06,.14,.48,M.trimStone);
   geometry(geo.box,M.terracotta,transform(0,2.52,-.02,1.14,.14,.60,0,0,0));
   geometry(geo.box,M.terracottaDark,transform(0,2.64,-.02,1.02,.10,.46));
   box(0,2.92,-.02,.05,.44,.05,M.iron);box(0,3.02,-.02,.26,.05,.05,M.iron);
   // a small vase of flowers at the base
   cyl(.34,.36,.22,.10,.20,M.terracotta);
   for(let i=0;i<3;i++)ball(.34+rr(-.05,.05),.50,z*0+.22+rr(-.05,.05),.06,.08,.06,i%2?M.bougainvillea:M.trimWhite);
  });
 }

 return {cypress,pine,treeIfClear,hedge,planter,bench,lamp,fountain,pergola,bunting,vespaParked,
  oliveTree,lemonTree,lavender,rosemary,vineWall,flowerBush,
  balustrade,stoneBench,bicycle,menuBoard,cafeSet,awning,laundry,stringLights,cat,lemonPot,
  crates,barrel,aedicula,trashBin,wallLamp,posterBoard,woodStack,flowerBox,pigeons,
  parkingSign,streetSignPlate,marketStand,marketStandLegacy};
}
