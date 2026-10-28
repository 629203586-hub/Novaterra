import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../dist/switzerland.html',import.meta.url),'utf8');
const extract=name=>{const match=html.match(new RegExp(`// BEGIN ${name}\\n([\\s\\S]*?)\\n// END ${name}`));assert.ok(match,`missing ${name}`);return match[1];};
const terrain=html.match(/const ridgeHeights=(\[[^;]+\]);\n(function ridgeHeight[^\n]+)/);
assert.ok(terrain,'missing the actual terrain sampler');
const api=vm.runInNewContext(`const ridgeHeights=${terrain[1]};${terrain[2]};${extract('SKIER RIDE CLOCK')};${extract('SKIER RIDE PATH')};({ridgeHeight,advanceSkiRide,createSkiRidePath,skiRideProgress})`,{THREE:{MathUtils:{clamp:(n,a,b)=>Math.min(b,Math.max(a,n))}}});
const{advanceSkiRide,createSkiRidePath,skiRideProgress,ridgeHeight}=api;
const path=createSkiRidePath(ridgeHeight);
const advance=(initial,seconds,playing=true,hidden=false)=>{let state=initial;for(let i=0;i<Math.ceil(seconds/.02);i++)state=advanceSkiRide(state,.02,playing,hidden);return state;};
const close=(actual,expected,tolerance=1e-8)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} differs from ${expected}`);

test('ski ride clock enters, descends, arrives once and returns while preserving its snapshot',()=>{
 const snapshot={view:'lake',life:false,orbit:true};let state={stage:'entering',elapsed:0,snapshot};
 state=advance(state,1.3);assert.equal(state.stage,'descending');assert.strictEqual(state.snapshot,snapshot);
 state=advance(state,19);assert.equal(state.stage,'arrived');close(state.elapsed,18);
 const arrived=advanceSkiRide(state,.1);assert.equal(arrived.stage,'arrived');close(arrived.elapsed,18);
 state=advance({...state,stage:'returning',elapsed:0},.8,false);
 assert.equal(state.stage,'idle');close(state.elapsed,.75);assert.strictEqual(state.snapshot,snapshot);
});

test('pause and background visibility freeze all moving ride stages without changing the input',()=>{
 for(const stage of['entering','descending']){
  const initial={stage,elapsed:.4};const paused=advance(initial,3,false,false),hidden=advance(initial,3,true,true);
  assert.equal(paused.stage,stage);assert.equal(hidden.stage,stage);close(paused.elapsed,.4);close(hidden.elapsed,.4);close(initial.elapsed,.4);
  const resumed=advanceSkiRide(paused,.02,true,false);close(resumed.elapsed,.42);
 }
 const returning=advanceSkiRide({stage:'returning',elapsed:.4},.1,false,true);close(returning.elapsed,.4);
});

test('a replay starts a fresh entry clock and never inherits completed distance',()=>{
 const snapshot={view:'village'},completed={stage:'arrived',elapsed:18,snapshot};
 const replay={...completed,stage:'entering',elapsed:0};const first=advanceSkiRide(replay,.02);
 assert.equal(first.stage,'entering');close(first.elapsed,.02);assert.strictEqual(first.snapshot,snapshot);
 const descending=advance(replay,1.3);assert.equal(descending.stage,'descending');assert.ok(descending.elapsed<.2);
 close(skiRideProgress(descending.elapsed),0,.001);close(completed.elapsed,18);
});

test('ride route begins at the summit, follows the actual snow surface and stops at the landing',()=>{
 const start=path.sample(0),end=path.sample(1);close(start.x,-10);close(start.z,-12.5);assert.ok(start.groundY>13,'start must be on the high summit');
 close(end.x,-7.6);close(end.z,-4.25);close(end.groundY,.84);assert.ok(path.length>12&&path.length<22);
 for(let i=0;i<=1200;i++){
  const pose=path.sample(i/1200);close(pose.y-ridgeHeight(pose.x,pose.z),path.eyeHeight,.003);
  for(const value of[pose.x,pose.y,pose.z,pose.target.x,pose.target.y,pose.target.z,pose.heading,pose.pitch])assert.ok(Number.isFinite(value));
  assert.ok(pose.pitch>=-.850001&&pose.pitch<.1,'camera pitch is unstable or aims into the slope');
 }
});

test('look-ahead sightlines clear the snow and consecutive poses remain continuous',()=>{
 let previous=path.sample(0);
 for(let i=1;i<=1200;i++){
  const pose=path.sample(i/1200),step=Math.hypot(pose.x-previous.x,pose.y-previous.y,pose.z-previous.z);
  assert.ok(step<.04,'ride position jumps along the slope');
  assert.ok(Math.abs(pose.heading-previous.heading)<.035,'look direction snaps between samples');
  assert.ok(Math.abs(pose.pitch-previous.pitch)<.04,'camera pitch snaps between samples');
  for(let j=0;j<=20;j++){
   const u=j/20,x=pose.x+(pose.target.x-pose.x)*u,z=pose.z+(pose.target.z-pose.z)*u,y=pose.y+(pose.target.y-pose.y)*u;
   assert.ok(y-ridgeHeight(x,z)>.25,'camera sightline intersects the mountain');
  }
  previous=pose;
 }
});

test('ride timing accelerates and brakes continuously with zero speed at both endpoints',()=>{
 close(skiRideProgress(-5),0);close(skiRideProgress(0),0);close(skiRideProgress(18),1);close(skiRideProgress(30),1);
 let previous=0;for(let i=0;i<=1800;i++){const p=skiRideProgress(i*.01);assert.ok(p>=previous&&p>=0&&p<=1);previous=p;}
 const epsilon=.0001;assert.ok(skiRideProgress(epsilon)/epsilon<1e-6);assert.ok((1-skiRideProgress(18-epsilon))/epsilon<1e-6);
 for(const t of[18*.12,18*(1-.22)]){
  const left=(skiRideProgress(t)-skiRideProgress(t-epsilon))/epsilon,right=(skiRideProgress(t+epsilon)-skiRideProgress(t))/epsilon;
  close(left,right,1e-5);
 }
});
