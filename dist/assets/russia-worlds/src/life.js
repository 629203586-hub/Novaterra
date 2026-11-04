import * as T from 'three';
import{createKit,seeded}from'./geometry.js';
// Pedestrian and traffic clocks retain the same pause / reduced-motion contract as Little Worlds.
export function createLife(scene,materials){
 const{M,mats}=materials,{rr}=seeded(1703);const dummy=new T.Object3D(),matrix=new T.Matrix4(),rig=new T.Object3D(),bone=new T.Object3D();
 const fabric=new T.MeshStandardMaterial({color:'#ffffff',roughness:1});fabric.name='Winter garment variants';mats.push(fabric);
 const N=20,actors=Array.from({length:N},(_,i)=>({i,phase:rr(0,6.28),height:i===8?.8:rr(.92,1.06),coat:new T.Color(['#314959','#946b59','#597575','#b18761','#744352','#333c50'][i%6])}));
 const parts={};function part(name,geometry,material,count=N){const mesh=new T.InstancedMesh(geometry,material,count);mesh.name=name;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;scene.add(mesh);parts[name]=mesh;return mesh;}
 const sphere=new T.SphereGeometry(1,14,10),cube=new T.BoxGeometry(1,1,1),cyl=new T.CylinderGeometry(.8,1,1,12);
 part('coats',cyl,fabric);part('coat lapels',cube,M.scarf,N*2);part('faces',sphere,M.skin);part('hats',sphere,M.fur);part('hat brims',cyl,M.fur);part('scarves',cyl,M.scarf);part('scarf tails',cube,M.scarf);part('arms',cyl,fabric,N*4);part('gloves',sphere,M.fur,N*2);part('trousers',cyl,M.fabric,N*2);part('boots',cube,M.rubber,N*2);part('eyes',sphere,M.dark,N*2);part('noses',sphere,M.skin);part('coat buttons',sphere,M.gold,N*3);
 function draw(name,i,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0,local=matrix){dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,rz);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();parts[name].setMatrixAt(i,local.clone().multiply(dummy.matrix));}
 const v=new T.Vector3();function segment(name,i,a,b,r,local=matrix){const av=new T.Vector3(...a),bv=new T.Vector3(...b);dummy.position.copy(av).add(bv).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());dummy.scale.set(r,new T.Vector3(...a).distanceTo(new T.Vector3(...b)),r);dummy.updateMatrix();parts[name].setMatrixAt(i,local.clone().multiply(dummy.matrix));}
 // Routes never cross the cathedral footprint, Kremlin wall, shopfronts or vehicle lanes.
 function pose(i,t){let x,z,heading,walking=i<14;
  if(i<6){const a=t*.095+i*Math.PI/3;x=-6.1+Math.sin(a)*1.0;z=-1.5+Math.cos(a)*6.0;heading=Math.atan2(Math.cos(a),-Math.sin(a)*6);}
  else if(i<10){const a=t*.085+(i-6)*Math.PI/2;x=9.6+Math.sin(a)*.55;z=-3.2+Math.cos(a)*4.7;heading=Math.atan2(Math.cos(a)*.55,-Math.sin(a)*4.7);}
  else if(i<14){const a=t*.1+(i-10)*Math.PI/2;x=-.5+Math.sin(a)*5;z=-7.6+Math.cos(a)*.6;heading=Math.atan2(Math.cos(a)*5,-Math.sin(a)*.6);}
  else{const p=[[-5.6,-8.5,Math.PI],[-4.7,-8.7,-2.4],[-4.3,-8.9,.6],[6.6,8,2.8],[7.5,7.8,-1.7],[-7.4,4.3,.7]][i-14];[x,z,heading]=p;}
  return{x,z,heading,walking};}
 function update(t){for(const a of actors){const i=a.i,p=pose(i,t),speed=p.walking?1:0,phase=t*4.25+a.phase,swing=Math.sin(phase)*.34*speed;rig.position.set(p.x,.68,p.z);rig.rotation.set(0,p.heading,Math.sin(t*1.2+a.phase)*.012);rig.scale.setScalar(a.height);rig.updateMatrix();matrix.copy(rig.matrix);
   draw('coats',i,0,.77,0,.225,.62,.155);parts.coats.setColorAt(i,a.coat);
   draw('faces',i,0,1.23,.005,.132,.163,.129);draw('hats',i,0,1.36,-.005,.145,.10,.14);draw('hat brims',i,0,1.31,0,.145,.055,.14);draw('scarves',i,0,1.055,.015,.18,.10,.15);draw('scarf tails',i,.08,.91,.17,.08,.28,.04,0,0,-.08);
   for(let j=0;j<3;j++)draw('coat buttons',i*3+j,0,.62+j*.13,.151,.015,.015,.015);
   for(const side of[-1,1]){const j=i*2+(side===1?1:0),s=swing*side;bone.position.set(side*.093,.5,0);bone.rotation.set(s,0,0);bone.scale.set(1,1,1);bone.updateMatrix();const leg=matrix.clone().multiply(bone.matrix);draw('trousers',j,0,-.18,0,.071,.36,.075,0,0,0,leg);draw('boots',j,0,-.43,.047,.133,.14,.26,0,0,0,leg);
    const handZ=-swing*side*.48+Math.sin(t*.9+a.phase)*.012;
    segment('arms',i*4+(side===1?2:0),[side*.2,.99,0],[side*.26,.79,handZ*.55],.079);segment('arms',i*4+(side===1?3:1),[side*.26,.79,handZ*.55],[side*.27,.6,handZ],.067);draw('gloves',j,side*.27,.58,handZ,.068,.084,.065);
    parts.arms.setColorAt(i*4+(side===1?2:0),a.coat);parts.arms.setColorAt(i*4+(side===1?3:1),a.coat);
    draw('eyes',j,side*.049,1.25,.123,.009,.009,.007);
   }draw('noses',i,0,1.21,.139,.027,.03,.033);
  }for(const mesh of Object.values(parts)){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}}
 const cars=[];
 function car(index,color,modern=false){const root=new T.Group();root.scale.setScalar(1.16);root.name=modern?'Civilian sedan':'Classic Lada-inspired sedan';scene.add(root);const kit=createKit(root),{box,round,cyl,rod,at}=kit;
  const paint=new T.MeshPhysicalMaterial({color,metalness:.22,roughness:.28,clearcoat:.6,clearcoatRoughness:.21});paint.name='Car enamel '+index;mats.push(paint);
  round(paint,0,.45,0,1.13,.45,2.55);round(paint,0,.76,-.12,1.0,.44,1.43);round(M.glass,0,.81,.34,.93,.31,.055,-.25);round(M.glass,0,.82,-.74,.91,.28,.048,.3);
  for(const s of[-1,1]){box(M.glass,s*.507,.83,-.16,.025,.28,1.0);box(paint,s*.53,.84,-.1,.035,.32,.065);rod(M.silver,[s*.524,.63,-.7],[s*.524,.63,.46],.012);round(paint,s*.64,.7,.42,.14,.075,.17);box(M.silver,s*.537,.63,-.36,.02,.025,.13);}
  round(paint,0,.55,.9,1.08,.2,.72);round(M.snow,0,1.0,-.15,.82,.02,1.12);box(M.silver,0,.3,1.31,1.12,.07,.09);box(M.silver,0,.29,-1.3,1.12,.07,.09);box(M.dark,0,.46,1.291,.48,.15,.024);
  for(let i=0;i<7;i++)box(M.silver,-.23+i*.077,.46,1.31,.025,.12,.023);
  for(const s of[-1,1]){if(modern)box(M.lamp,s*.4,.5,1.3,.24,.095,.027);else{const g=new T.CircleGeometry(.115,20);kit.add(g,M.lamp,s*.4,.47,1.29);g.dispose();}box(M.red,s*.42,.43,-1.292,.2,.11,.035);}
  const plate=materials.sign(index?'А 815 МК 77':'М 149 ОК 77','','#deded2','#293b43',512);box(plate,0,.27,1.365,.36,.09,.012);box(plate,0,.27,-1.365,.36,.09,.012);
  kit.flush();kit.dispose();const wheels=[];const prototype=new T.Group(),wk=createKit(prototype);const tg=new T.TorusGeometry(.215,.065,8,24);wk.add(tg,M.rubber,0,0,0,1,1,1,0,Math.PI/2);tg.dispose();wk.cyl(M.silver,0,0,0,.12,.055,.12,16);for(let j=0;j<6;j++)wk.box(M.silver,0,0,0,.06,.025,.23,j*Math.PI/3);wk.flush();wk.dispose();for(const x of[-.56,.56])for(const z of[-.82,.82]){const wheel=prototype.clone();wheel.position.set(x,.26,z);root.add(wheel);wheels.push(wheel);}cars.push({root,wheels,offset:index*20});
 }
 car(0,'#9a423b');car(1,'#ded7c4',true);car(2,'#3b515e',true);
 // Traffic stays on the exterior road, with wide turns outside the pedestrian square.
 const path=new T.CatmullRomCurve3([[-17,.48,9.6],[0,.48,9.6],[17,.48,9.6],[18.7,.48,10.3],[17,.48,11.2],[0,.48,11.2],[-17,.48,11.2],[-18.7,.48,10.3]].map(p=>new T.Vector3(...p)),true,'catmullrom',.25);
 function updateCars(t){cars.forEach((c,i)=>{const u=(t*.012+i/3)%1,p=path.getPointAt(u),v=path.getTangentAt(u);c.root.position.copy(p);c.root.rotation.y=Math.atan2(v.x,v.z);c.wheels.forEach(w=>w.rotation.x=-t*2.5);});}
 update(0);updateCars(0);
 return{update(t){update(t);updateCars(t);},actors,cars,route:pose};
}
