import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const html=await readFile(new URL('../dist/switzerland.html',import.meta.url),'utf8');
const code=html.split('// BEGIN CABLEWAY MOTION')[1].split('// END CABLEWAY MOTION')[0];
const scope={};vm.runInNewContext(code,scope);
const state=t=>scope.liftState(t);
test('Swiss gondolas reach both stations, pause briefly and travel back down',()=>{
 const up=Array.from({length:25},(_,i)=>state(-3.8+i*.5));
 assert.ok(Math.abs(up[0].u)<1e-10);assert.ok(Math.abs(up.at(-1).u-1)<1e-10);
 for(let i=1;i<up.length;i++)assert.ok(up[i].u>up[i-1].u);
 assert.equal(state(9).direction,'boarding');assert.equal(state(9).u,1);
 const down=Array.from({length:25},(_,i)=>state(10.2+i*.5));
 assert.ok(Math.abs(down[0].u-1)<1e-10);assert.ok(Math.abs(down.at(-1).u)<1e-10);
 for(let i=1;i<down.length;i++)assert.ok(down[i].u<down[i-1].u);
 assert.equal(state(23).direction,'boarding');assert.equal(state(23).u,0);
});
test('the Swiss cableway loop remains continuous, bounded and periodic across reversals',()=>{
 let previous=state(-30).u;
 for(let i=0;i<=9000;i++){
  const t=-30+i*.01,{u}=state(t);
  assert.ok(u>=0&&u<=1,`Cabin leaves cable at ${t}`);
  assert.ok(Math.abs(u-previous)<.001,`Cabin teleports at ${t}`);
  assert.ok(Math.abs(u-state(t+28).u)<1e-10);
  previous=u;
 }
});
