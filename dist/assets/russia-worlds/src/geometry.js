import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from './RoundedBoxGeometry.js';
// Retained Little Worlds batching contract: one static draw per material, animated roots separate.
export function createKit(parent){
 const bins=new Map(),base={box:new T.BoxGeometry(1,1,1),round:new RoundedBoxGeometry(1,1,1,2,.08),ball:new T.SphereGeometry(1,16,10)},o=new T.Object3D();let frame=new T.Matrix4();
 function add(g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0){o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.scale.set(sx,sy,sz);o.updateMatrix();let c=g.index?g.toNonIndexed():g.clone();c.applyMatrix4(frame.clone().multiply(o.matrix));if(!c.attributes.uv)c.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(c.attributes.position.count*2),2));if(m.name.includes('brick')){const ps=c.attributes.position,ns=c.attributes.normal,uv=c.attributes.uv;for(let i=0;i<ps.count;i++){const nx=Math.abs(ns.getX(i)),nz=Math.abs(ns.getZ(i));uv.setXY(i,(nx>nz?ps.getZ(i):ps.getX(i))/8,ps.getY(i)/4);}}if(!m.vertexColors)c.deleteAttribute('color');if(!bins.has(m))bins.set(m,[]);bins.get(m).push(c);}
 function at(x,y,z,r,fn){const old=frame;o.position.set(x,y,z);o.rotation.set(0,r,0);o.scale.set(1,1,1);o.updateMatrix();frame=old.clone().multiply(o.matrix);try{fn();}finally{frame=old;}}
 const box=(m,x,y,z,w,h,d,rx=0,ry=0,rz=0)=>add(base.box,m,x,y,z,w,h,d,rx,ry,rz);
 const round=(m,x,y,z,w,h,d,rx=0,ry=0,rz=0)=>add(base.round,m,x,y,z,w,h,d,rx,ry,rz);
 const ball=(m,x,y,z,sx,sy=sx,sz=sx)=>add(base.ball,m,x,y,z,sx,sy,sz);
 function cyl(m,x,y,z,r,h,rt=r,n=24,ry=0){const g=new T.CylinderGeometry(rt,r,h,n);add(g,m,x,y,z,1,1,1,0,ry);g.dispose();}
 function rod(m,a,b,r=.025,n=8){const p=new T.Vector3(...a),q=new T.Vector3(...b),d=q.clone().sub(p),g=new T.CylinderGeometry(r,r,d.length(),n);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()));const c=p.add(q).multiplyScalar(.5);add(g,m,...c);g.dispose();}
 function ring(m,x,y,z,r,t=.035,rot=0,n=48){const g=new T.TorusGeometry(r,t,6,n);add(g,m,x,y,z,1,1,1,rot);g.dispose();}
 function arch(m,x,y,z,w,h,thick=.08,depth=.08){const r=w/2,s=new T.Shape();s.moveTo(-r,0);s.lineTo(-r,h-r);s.absarc(0,h-r,r,Math.PI,0,true);s.lineTo(r,0);s.lineTo(r-thick,0);s.lineTo(r-thick,h-r);s.absarc(0,h-r,r-thick,0,Math.PI,false);s.lineTo(-r+thick,0);s.closePath();const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:16});add(g,m,x,y,z);g.dispose();}
 function archFill(m,x,y,z,w,h,depth=.025){const r=w/2,s=new T.Shape();s.moveTo(-r,0);s.lineTo(-r,h-r);s.absarc(0,h-r,r,Math.PI,0,true);s.lineTo(r,0);s.closePath();const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:16});add(g,m,x,y,z);g.dispose();}
 function scaled(sx,sy,sz,fn){const old=frame;frame=frame.clone().multiply(new T.Matrix4().makeScale(sx,sy,sz));try{fn();}finally{frame=old;}}
 function flush(){let triangles=0;for(const [m,gs]of bins){const g=mergeGeometries(gs,false);if(!g)throw Error('Moscow batch failed: '+m.name);const mesh=new T.Mesh(g,m);mesh.name='Moscow · '+m.name;mesh.castShadow=m.userData.castShadow!==false;mesh.receiveShadow=true;mesh.geometry.computeBoundingSphere();parent.add(mesh);triangles+=g.attributes.position.count/3;gs.forEach(g=>g.dispose());}const count=bins.size;bins.clear();return{calls:count,triangles};}
 function dispose(){Object.values(base).forEach(g=>g.dispose());}
 return{add,at,scaled,box,round,ball,cyl,rod,ring,arch,archFill,flush,dispose};
}
export function seeded(seed=81504){let n=seed;const random=()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296);return{random,rr:(a,b)=>a+(b-a)*random()};}
