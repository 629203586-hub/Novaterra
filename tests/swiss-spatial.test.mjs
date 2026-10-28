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

test('cable cars clear chalet roofs and cable runs underneath station roofs',()=>{
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
   for(const station of [{a:A,roof:5.15+3.75},{a:C,roof:10.75+2.64}]){
    const sx=x-station.a[0],sz=z-station.a[2],localX=cs*sx-sn*sz,localZ=sn*sx+cs*sz;
    if(Math.abs(localX)<3&&Math.abs(localZ)<1.85)assert.ok(c[1]+.18<station.roof-.08,'cable meets station roof');
   }
  }
 }
});
