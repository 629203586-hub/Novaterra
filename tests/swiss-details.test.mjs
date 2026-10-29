import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../dist/assets/swiss-worlds/vendor/three/build/three.module.js';

const html=readFileSync(new URL('../dist/switzerland.html',import.meta.url),'utf8');
const terrace=JSON.parse(html.match(/const cafeTerraceLayout=(\{[^;]+\});/)[1]);

test('the blossom crown clears both café parasols with space to sway',()=>{
 const {x,z,scale}=terrace.blossom;
 // Ring centres extend .58 and their broadest crowns another .62 world units.
 const crownRadius=1.2*scale;
 for(const [px,pz]of terrace.parasols)
  assert.ok(Math.hypot(x-px,z-pz)>crownRadius+terrace.parasolRadius+.2,'blossom intersects the café umbrellas');
});

test('actual rental-gear geometry stays on level ground and clears the chalet entrance',()=>{
 const source=html.match(/\/\/ BEGIN SWISS SKI LODGE GEAR\n([\s\S]*?)\/\/ END SWISS SKI LODGE GEAR/)[1];
 const terrain=html.match(/const ridgeHeights=(\[[^;]+\]);\n(function ridgeHeight[^\n]+)/);
 const bounds=[];
 const put=(g,m,p=[0,0,0],r=[0,0,0],s=[1,1,1])=>{
  const object=new THREE.Object3D();object.position.set(...p);object.rotation.set(...r);object.scale.set(...s);object.updateMatrix();
  g.applyMatrix4(object.matrix);g.computeBoundingBox();bounds.push(g.boundingBox.clone());g.dispose();
 };
 const box=(m,x,y,z,w,h,d,r=[0,0,0])=>put(new THREE.BoxGeometry(w,h,d),m,[x,y,z],r);
 const rod=(m,a,b,r=.035)=>{
  const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),direction=B.clone().sub(A),g=new THREE.CylinderGeometry(r,r,direction.length(),6);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()));put(g,m,A.add(B).multiplyScalar(.5).toArray());
 };
 vm.runInNewContext(`const ridgeHeights=${terrain[1]};${terrain[2]};${source}`,{THREE,M:new Proxy({},{get:(_,key)=>key}),put,box,rod});
 assert.ok(bounds.length>30,'expected skis, snowboard, rack and boot bench');
 const doorway=new THREE.Box3(new THREE.Vector3(17.08,.84,-4.25),new THREE.Vector3(17.72,3,-2.8));
 for(const bound of bounds){
  assert.ok(bound.min.y>=.8399,'rental gear sinks into the ground');
  assert.ok(bound.min.z> -4.5,'rental gear enters the mountain slope');
  assert.ok(!bound.intersectsBox(doorway),'rental gear obstructs the lodge entrance');
 }
});
