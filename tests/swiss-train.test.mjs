import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../dist/switzerland.html',import.meta.url),'utf8');
const section=html.match(/\/\/ BEGIN SWISS TRAIN MOTION\n([\s\S]*?)\n\/\/ END SWISS TRAIN MOTION/);
assert.ok(section,'train motion should be present');
const position=vm.runInNewContext(`${section[1]};trainPosition`);

test('Swiss mountain train stays on its track and reverses smoothly at both ends',()=>{
  const quarter=Math.PI/(2*.105),period=quarter*4;
  assert.ok(Math.abs(position(quarter)-10.6)<1e-9);
  assert.ok(Math.abs(position(quarter*3)+10.6)<1e-9);
  for(let t=0;t<=period;t+=.03){
    assert.ok(Math.abs(position(t))<=10.600001);
    assert.ok(Math.abs(position(t+period)-position(t))<1e-9);
  }
  for(const t of [quarter,quarter*3]){
    assert.ok(Math.abs(position(t-.02)-position(t+.02))<1e-9);
  }
});
