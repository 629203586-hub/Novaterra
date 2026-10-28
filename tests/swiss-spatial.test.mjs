import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../dist/switzerland.html',import.meta.url),'utf8');
const terrain=html.match(/const ridgeHeights=(\[[^;]+\]);\n(function ridgeHeight[^\n]+)/);
const ski=html.match(/\/\/ BEGIN SWISS SKI MOTION\n([\s\S]*?)\n\/\/ END SWISS SKI MOTION/);
const trees=html.match(/\/\/ BEGIN SWISS TREE CLEARANCE\n([\s\S]*?)\n\/\/ END SWISS TREE CLEARANCE/);
assert.ok(terrain&&ski&&trees,'expected terrain and animation helpers');
const ctx={THREE:{MathUtils:{clamp:(v,a,b)=>Math.min(b,Math.max(a,v))}}};
const {ridgeHeight,skiState,canPlaceConifer}=vm.runInNewContext(`const ridgeHeights=${terrain[1]};${terrain[2]};${ski[1]};${trees[1]};({ridgeHeight,skiState,canPlaceConifer})`,ctx);

test('terrain heights agree with points inside the rendered mountain triangles',()=>{
 const meshMatch=html.match(/const alpineRidgeMeshes=(\[[^;]+\]);/);
 assert.ok(meshMatch,'expected the rendered mountain geometry');
 const meshes=JSON.parse(meshMatch[1]);let checked=0;
 for(const positions of meshes)for(let i=0;i<positions.length;i+=9){
  const a=positions.slice(i,i+3),b=positions.slice(i+3,i+6),c=positions.slice(i+6,i+9);
  const area=(b[0]-a[0])*(c[2]-a[2])-(c[0]-a[0])*(b[2]-a[2]);
  if(Math.abs(area)<1e-9)continue;
  // Sample the actual mesh, independently of its grid dimensions or diagonal choice.
  const x=a[0]*.2+b[0]*.3+c[0]*.5,z=a[2]*.2+b[2]*.3+c[2]*.5;
  const expected=a[1]*.2+b[1]*.3+c[1]*.5;
  assert.ok(Math.abs(ridgeHeight(x,z)-expected)<.003,`terrain sampler leaves the mesh at ${x}, ${z}`);
  checked++;
 }
 assert.ok(checked>1000,'expected a complete mountain surface');
});

test('all chalet foundations have level ground below their footprint',()=>{
 const houses=[...html.matchAll(/chalet\(\{([^}]+)\}\)/g)].filter(([,settings])=>/(?:^|,)x:/.test(settings));
 assert.equal(houses.length,9,'expected all nine village chalets');
 for(const [,settings] of houses){
  const value=(name,fallback)=>{const match=settings.match(new RegExp(`(?:^|,)${name}:(-?[0-9.]+)`));return match?Number(match[1]):fallback;};
  const x=value('x'),z=value('z'),w=value('w',3.5)+.15,d=value('d',3)+.12,base=value('base',.83);
  for(const sx of[-1,0,1])for(const sz of[-1,0,1]){
   const px=x+sx*w/2,pz=z+sz*d/2;
   assert.ok(ridgeHeight(px,pz)<=base+.025,`mountain covers the chalet foundation at ${x}, ${z} (sample ${px}, ${pz})`);
  }
 }
});

test('swaying cable car bottom corners clear the mountain in both directions',()=>{
 const found=html.match(/const liftA=new THREE\.Vector3\(([^)]+)\),liftB=new THREE\.Vector3\(([^)]+)\),liftC=new THREE\.Vector3\(([^)]+)\)/);
 assert.ok(found);const[A,B,C]=found.slice(1).map(s=>s.split(',').map(Number));
 const dx=C[0]-A[0],dz=C[2]-A[2],length=Math.hypot(dx,dz),nx=-dz/length,nz=dx/length,heading=Math.atan2(dx,dz),cs=Math.cos(heading),sn=Math.sin(heading);
 // Dimensions include the cabin's scale and its lowest floor surface.
 const corners=[[0,0],[-.675,-.77625],[-.675,.77625],[.675,-.77625],[.675,.77625]];
 for(let i=0;i<=1000;i++){
  const u=i/1000,second=u>=.5,v=second?u*2-1:u*2,P=second?B:A,Q=second?C:B;
  const position=P.map((q,k)=>q*(1-v)+Q[k]*v);position[1]-=Math.sin(v*Math.PI)*.2;
  for(const lane of[-.9,.9])for(const sway of[-.03,.03])for(const[lx,lz]of corners){
   const ly=-2.03835,localX=lx*Math.cos(sway)-ly*Math.sin(sway),localY=lx*Math.sin(sway)+ly*Math.cos(sway);
   const x=position[0]+nx*lane+cs*localX+sn*lz,z=position[2]+nz*lane-sn*localX+cs*lz,bottom=position[1]+localY;
   assert.ok(bottom-ridgeHeight(x,z)>.15,`cabin meets the mountain at u=${u}, lane=${lane}, sway=${sway}`);
  }
 }
});

test('skiers stay visible until the ground and fade only after landing',()=>{
 for(const phase of [0,6.3,12.6])for(let i=0;i<2000;i++){
  const t=i*.01,st=skiState(t,phase,0);
  if(st.u<1 && ((t+phase)%20)>.61)assert.ok(st.opacity>.99,'skier vanished on slope');
  if(st.opacity<.99 && ((t+phase)%20)>1)assert.equal(st.landed,true,'fade began before landing');
  if(st.landed)assert.ok(Math.abs(ridgeHeight(st.x,st.z)-.84)<.001,'landing must reach ground');
 }
});

test('tree sites avoid mountain slopes and structures',()=>{
 assert.equal(canPlaceConifer(-10,-7,.8),false);
 assert.equal(canPlaceConifer(17,-12,.85),false);
 assert.equal(canPlaceConifer(1.1,-5,.8),false);
 assert.equal(canPlaceConifer(-18,11,.85),true);
});

test('cable cars clear chalet roofs and station shelters',()=>{
 const found=html.match(/const liftA=new THREE\.Vector3\(([^)]+)\),liftB=new THREE\.Vector3\(([^)]+)\),liftC=new THREE\.Vector3\(([^)]+)\)/);
 assert.ok(found);const [A,B,C]=found.slice(1).map(s=>s.split(',').map(Number));
 const dx=C[0]-A[0],dz=C[2]-A[2],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len,heading=Math.atan2(dx,dz),cs=Math.cos(heading),sn=Math.sin(heading);
 const houses=[[-7.6,6.35,4,3.2,3.05],[-2.7,2.2,3.3,2.8,2.5],[-13,-5,3.4,2.7,2.75],[-13,6.2,2.8,2.7,2.45],[-17,6.7,2.6,2.4,2.5],[-17.15,2,3.15,2.65,2.7],[-17.9,-6,2.6,2.4,2.65],[-17.95,-1.8,2.6,2.4,2.65],[17.4,-5.4,2.8,2.3,2.5]];
 for(let i=0;i<=1000;i++){
  const u=i/1000,second=u>=.5,v=second?(u-.5)*2:u*2,P=second?B:A,Q=second?C:B;
  const c=P.map((q,k)=>q*(1-v)+Q[k]*v);c[1]-=Math.sin(v*Math.PI)*.2;
  for(const lane of[-.9,.9]){
   const x=c[0]+nx*lane,z=c[2]+nz*lane,bottom=c[1]-2.06;
   for(const [bx,bz,w,d,h] of houses)if(Math.abs(x-bx)<w/2+1.05&&Math.abs(z-bz)<d/2+1.05)assert.ok(bottom>.83+h+w*.36+.2,`cabin intersects chalet at ${bx}, ${bz}`);
   const g=JSON.parse(html.match(/const stationGeometry=(\{[^;]+\});/)[1]);
   for(const station of [{a:A,platform:5.35},{a:C,platform:10.75}]){
    const sx=x-station.a[0],sz=z-station.a[2],localX=cs*sx-sn*sz,localZ=sn*sx+cs*sz,top=c[1]+.30;
    const structures=[{name:'ticket booth',x:g.boothX,w:g.bodyWidth,z:0,d:g.bodyDepth,low:station.platform+.04,high:station.platform+.89+g.bodyHeight/2},{name:'shelter roof',x:g.boothX,w:g.roofWidth,z:0,d:g.roofDepth,low:station.platform+g.roofY-g.roofHeight/2,high:station.platform+g.roofY+g.roofHeight/2},{name:'safety rail',x:g.railX,w:g.railWidth,z:0,d:g.railDepth,low:station.platform+.15,high:station.platform+1.15},{name:'flag pole',x:g.boothX,w:.07,z:0,d:.07,low:station.platform+1.95,high:station.platform+3.26}];
    for(const o of structures){const overlapX=Math.abs(localX-o.x)<.9+o.w/2,overlapZ=Math.abs(localZ-o.z)<1+o.d/2,overlapY=bottom<o.high&&top>o.low;assert.ok(!(overlapX&&overlapZ&&overlapY),`cabin meets ${o.name} at u=${u}, lane=${lane}`);}
   }
  }
 }
});


test('chalet plaster and timber facades meet without coplanar overlap',()=>{
 const lower=html.match(/box\(M\.cream,0,([^,]+),0,w,([^,]+),d,\[0,0,0\],b\)/);
 const upper=html.match(/box\(M\.wood,0,([^,]+),0,w,([^,]+),d,\[0,0,0\],b\)/);
 assert.ok(lower&&upper,'expected both structural wall volumes');
 for(const h of [2.45,2.5,2.65,2.75,3.05]){
  const evalAt=expr=>vm.runInNewContext(expr,{base:.83,h});
  const lowerTop=evalAt(lower[1])+evalAt(lower[2])/2;
  const upperBottom=evalAt(upper[1])-evalAt(upper[2])/2;
  assert.ok(Math.abs(lowerTop-upperBottom)<1e-9,'plaster/timber wall planes overlap or leave a gap');
 }
});


test('snow covers the complete mountain and a modeled reverse slope reaches the rear foothills',()=>{
 const meshes=JSON.parse(html.match(/const alpineRidgeMeshes=(\[[^;]+\]);/)[1]);
 assert.equal(meshes[0].length+meshes[1].length,0,'snow mountain contains exposed bare-material patches');
 let rearHeight=0,rearCount=0;
 for(const positions of meshes)for(let i=0;i<positions.length;i+=3){
  if(positions[i+2]<-19){rearHeight=Math.max(rearHeight,positions[i+1]);rearCount++;}
 }
 assert.ok(rearCount>1000&&rearHeight>1.5,'reverse mountain has been flattened or cut off');
});
