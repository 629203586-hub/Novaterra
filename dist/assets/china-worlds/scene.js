import * as THREE from 'three';
import {mergeGeometries}from'three/addons/utils/BufferGeometryUtils.js';
export function buildScene(ctx){
 const S=1.45,scene=new THREE.Group();scene.name='Restored original Chongqing';scene.scale.setScalar(S);ctx.scene.add(scene);
 const worldScale=new THREE.Matrix4().makeScale(S,S,S),camera=ctx.camera,gradient=ctx.gradient,mobile=ctx.economy;
 let seed=270197;const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;},rnd=(a,b)=>a+(b-a)*random();
 let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const toon=(color,extra={})=>ctx.mat(color,extra),noOutline=m=>{m.userData.outlineParameters={visible:false};return m;};
 function texture(w,h,paint){return ctx.signage.textureCanvas(w,h,paint);}
const concreteTex=texture(256,256,(c,w,h)=>{c.fillStyle='#ebe4cd';c.fillRect(0,0,w,h);for(let i=0;i<2200;i++){c.fillStyle=i%2?'#c7c5b844':'#ffffff77';c.fillRect(rnd(0,w),rnd(0,h),rnd(1,3),rnd(1,3));}c.strokeStyle='#b4b7a244';for(let y=0;y<h;y+=32){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}});
const roofTex=texture(128,128,(c,w,h)=>{c.fillStyle='#ffffff';c.fillRect(0,0,w,h);c.strokeStyle='#5b302c44';c.lineWidth=3;for(let x=0;x<=w;x+=16){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}for(let y=0;y<h;y+=24){c.fillStyle='#ffffff33';c.fillRect(0,y,w,4);}});roofTex.wrapS=roofTex.wrapT=THREE.RepeatWrapping;roofTex.repeat.set(2,2);
const grassTex=texture(256,256,(c,w,h)=>{c.fillStyle='#8db373';c.fillRect(0,0,w,h);for(let i=0;i<1600;i++){c.fillStyle=i%2?'#b2cb8555':'#557f6144';c.fillRect(rnd(0,w),rnd(0,h),2,4);}});grassTex.wrapS=grassTex.wrapT=THREE.RepeatWrapping;grassTex.repeat.set(6,6);
const M={rock:toon('#728b83'),rockLight:toon('#92a393'),earth:toon('#acb79c'),grass:toon('#ffffff',{map:grassTex}),concrete:toon('#ffffff',{map:concreteTex}),sand:toon('#e1c990'),cream:toon('#f5e9cc'),white:toon('#fff5dd'),wood:toon('#76523d'),woodLight:toon('#bc8151'),red:toon('#c94d37'),roof:toon('#b44d36',{map:roofTex,side:THREE.DoubleSide}),roofTeal:toon('#3e7168',{map:roofTex,side:THREE.DoubleSide}),dark:toon('#304e51'),road:toon('#778b86'),metal:toon('#8ca9a4'),blue:toon('#328fa2'),yellow:toon('#f0bc51'),leaf:toon('#55966d'),leafLight:toon('#91bb78'),maple:toon('#d67a48'),skin:toon('#edc190'),glass:toon('#457c82'),warm:toon('#f5d598',{emissive:'#ffb34c',emissiveIntensity:.12}),neon:toon('#ffd67d',{emissive:'#ff952d',emissiveIntensity:.2})};
ctx.M={...ctx.M,...M};M.neon.userData.nightEmission=2.25;M.warm.userData.nightEmission=.82;ctx.windowNightColors[0].copy(M.warm.color);
const heritageWindow=toon('#f1d39b',{emissive:'#ffb451',emissiveIntensity:1.7});heritageWindow.userData.architectural=true;
const lanternMaterial=toon('#c44d32',{emissive:'#ff7535',emissiveIntensity:1.0});lanternMaterial.userData.architectural=true;
noOutline(M.warm);noOutline(M.neon);noOutline(M.glass);
const buckets=new Map(),staticRoot=new THREE.Group();scene.add(staticRoot);const personSpecs=[],buildingSpecs=[];
const dummy=new THREE.Object3D();
function put(g,m,pos=[0,0,0],rot=[0,0,0],scale=[1,1,1],b=buckets){if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));dummy.position.set(...pos);dummy.rotation.set(...rot);dummy.scale.set(...scale);dummy.updateMatrix();if(b===buckets){ctx.batch.geometry(g,m,worldScale.clone().multiply(dummy.matrix));g.dispose();return;}g.applyMatrix4(dummy.matrix);if(!b.has(m))b.set(m,[]);b.get(m).push(g);}
function box(m,x,y,z,w,h,d,rot=[0,0,0],b=buckets){put(new THREE.BoxGeometry(w,h,d),m,[x,y,z],rot,[1,1,1],b);}
function cyl(m,x,y,z,r,h,rt=r,seg=8,rot=[0,0,0],b=buckets){put(new THREE.CylinderGeometry(rt,r,h,seg),m,[x,y,z],rot,[1,1,1],b);}
function blob(m,x,y,z,sx,sy,sz,detail=0,b=buckets){put(new THREE.IcosahedronGeometry(1,detail),m,[x,y,z],[rnd(-.2,.2),rnd(0,6.28),rnd(-.2,.2)],[sx,sy,sz],b);}
function rod(m,a,b,r=.045,bucket=buckets){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A),g=new THREE.CylinderGeometry(r,r,d.length(),5);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));put(g,m,A.add(B).multiplyScalar(.5).toArray(),[0,0,0],[1,1,1],bucket);}
function bake(b,parent){for(const [m,geos] of b){const g=mergeGeometries(geos,false);if(!g)throw new Error('Could not assemble city');const mesh=new THREE.Mesh(g,m);mesh.castShadow=m!==M.warm&&m!==M.neon;mesh.receiveShadow=true;parent.add(mesh);geos.forEach(g=>g.dispose());}b.clear();return parent;}
function slab(points,bottom,height,mat,bevel=.2){const shape=new THREE.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();put(new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:1,steps:1,curveSegments:2}),mat,[0,bottom,0],[-Math.PI/2,0,0]);}
function instances(geo,mat,transforms,parent=scene){const mesh=new THREE.InstancedMesh(geo,mat,transforms.length);transforms.forEach((p,i)=>{dummy.position.set(...p.p);dummy.rotation.set(...(p.r||[0,0,0]));dummy.scale.set(...(p.s||[1,1,1]));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);if(p.color)mesh.setColorAt(i,new THREE.Color(p.color));});mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=mat!==M.warm;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
const glowPositions=[];const addGlow=(x,y,z)=>glowPositions.push(x,y,z);

// One painted sign atlas: shop fronts, bilingual wayfinding and miniature posters.
const atlasCanvas=document.createElement('canvas');atlasCanvas.width=2048;atlasCanvas.height=1024;const ac=atlasCanvas.getContext('2d');const tiles={};let tileCount=0;
function tile(name,zh,en,bg,fg='#fff1c7'){const n=tileCount++,x=n%4*512,y=Math.floor(n/4)*256;tiles[name]={x,y};ac.fillStyle=bg;ac.fillRect(x,y,512,256);ac.strokeStyle=fg;ac.lineWidth=3;ac.strokeRect(x+14,y+14,484,228);ac.textAlign='center';ac.textBaseline='middle';ac.fillStyle=fg;ac.font='bold 76px "PingFang SC","Microsoft YaHei",sans-serif';ac.fillText(zh,x+256,y+105,460);ac.font='20px Arial,sans-serif';ac.fillText(en,x+256,y+198,460);}
tile('liziba','李 子 坝','LIZIBA  •  LINE 2','#1d6768');tile('noodles','重庆小面','CHONGQING NOODLES','#b8422d');tile('hotpot','重庆火锅','HOT POT  •  WARM COMPANY','#8e3029');tile('tea','茶 馆','TEA & SLOW AFTERNOONS','#436c59');tile('store','便利店','OPEN DAILY','#e2c68c','#315e5a');tile('city','山 城','THE MOUNTAIN CITY','#324f58');tile('welcome','欢迎来到重庆','WELCOME TO CHONGQING','#b44935');tile('arrival','列车即将到站','NEXT TRAIN  •  00:01','#1d3841','#efc978');tile('food','烤串 · 包子','SKEWERS  /  STEAMED BUNS','#dfb86f','#68472d');tile('fruit','鲜 果','FRESH FROM THE HILLS','#4f7d60');tile('poster','慢 慢 走','TAKE THE SLOW WAY','#f0ddbb','#745842');tile('cq','重 庆','RIVERS MEET. STORIES BEGIN.','#23666c');tile('road','朝天门  ↗','CHAOTIANMEN','#427d6b');tile('drinks','清 凉','COLD DRINKS','#4e8b96');tile('flag','★','', '#cc3930','#ffe177');tile('menu','面  ¥12   茶  ¥8','LOCAL FLAVOURS','#f2d9a5','#5f4b36');
const atlasTex=new THREE.CanvasTexture(atlasCanvas);atlasTex.colorSpace=THREE.SRGBColorSpace;atlasTex.anisotropy=4;const signMat=noOutline(toon('#ffffff',{map:atlasTex,emissiveMap:atlasTex,emissive:'#ffffff',emissiveIntensity:.07,side:THREE.DoubleSide}));
function sign(name,x,y,z,w,h,rot=[0,0,0],b=buckets){const t=tiles[name],g=new THREE.PlaneGeometry(w,h),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(t.x+3+uv.getX(i)*506)/2048,1-(t.y+3+(1-uv.getY(i))*250)/1024);put(g,signMat,[x,y,z],rot,[1,1,1],b);}

// Two rivers frame a stepped peninsula cut from a floating piece of mountain.
const outline=[[-23,-17],[15,-17],[23,-10],[23,13],[17,18],[-18,18],[-24,11],[-24,-11]];
slab(outline,-3.5,2.6,M.rock,.65);slab(outline,-.9,.42,M.rockLight,.35);
const waterTex=texture(512,512,(c,w,h)=>{c.fillStyle='#428d92';c.fillRect(0,0,w,h);for(let i=0;i<700;i++){c.strokeStyle=i%3?'#b4e1bf42':'#205d7730';c.lineWidth=rnd(.5,2);c.beginPath();let x=rnd(0,w),y=rnd(0,h);c.moveTo(x,y);c.quadraticCurveTo(x+10,y-3,x+rnd(15,35),y);c.stroke();}});waterTex.wrapS=waterTex.wrapT=THREE.RepeatWrapping;waterTex.repeat.set(4,3);
const waterMat=noOutline(toon('#ffffff',{map:waterTex,emissive:'#3b9297',emissiveIntensity:.12}));
const waterShape=new THREE.Shape();outline.forEach(([x,z],i)=>i?waterShape.lineTo(x,-z):waterShape.moveTo(x,-z));waterShape.closePath();const waterGeo=new THREE.ShapeGeometry(waterShape,1);waterGeo.rotateX(-Math.PI/2);const waterUV=waterGeo.attributes.uv;for(let i=0;i<waterUV.count;i++)waterUV.setXY(i,(waterUV.getX(i)+24)/48,(waterUV.getY(i)+18)/36);const water=new THREE.Mesh(waterGeo,waterMat);water.position.y=.08;water.receiveShadow=true;water.visible=false;scene.add(water);
const land=[[-22,-15],[-4,-15],[6,-11],[11,-5],[10,5],[5,9],[-18,9],[-22,5]];
slab(land,0,2.2,M.rockLight,.28);slab(land,2.2,.22,M.grass,.15);
slab([[-21,-13],[-5,-13],[5,-9],[7,-2],[2,3],[-17,3],[-21,-2]],2.4,2.9,M.rock,.3);
slab([[-21,-13],[-5,-13],[5,-9],[7,-2],[2,3],[-17,3],[-21,-2]],5.3,.2,M.grass,.18);
slab([[-18,-13],[-5,-13],[3,-8],[1,-4],[-17,-4],[-20,-7]],5.5,2,M.earth,.22);
slab([[15,-15],[21,-12],[21,-4],[18,-2],[13,-6]],0,3.2,M.rockLight,.25);slab([[15,-15],[21,-12],[21,-4],[18,-2],[13,-6]],3.2,.2,M.grass,.2);
for(let i=0;i<55;i++){let x=rnd(-20,9),z=i<36?8.5:rnd(-14,4);if(i>=36)x=-21.5;box(i%3?M.rock:M.earth,x,rnd(.2,1.8),z,rnd(.5,2),rnd(.25,.6),rnd(.3,.7));}
for(const p of [[-19,7,-10,4.8,6,4.4],[-15,8,-12,4.8,6.3,3.5],[-21,4,-4,3,5,3],[14,4,-12,3,6,3]])blob(M.leaf,...p,1);
for(let i=0;i<17;i++)blob(i%2?M.rock:M.leaf,-20+rnd(-1,4),rnd(5,10),rnd(-13,-7),rnd(1,2.3),rnd(1,3),rnd(.8,1.8),0);
// River promenade and retaining masonry.
box(M.concrete,-5,2.5,8.65,26,.3,1.2);box(M.wood,-4,.38,10.3,5,.25,1.5);for(const x of[-6,-2])for(const z of[9.8,10.8])cyl(M.wood,x,-.15,z,.12,1.2);
for(let x=-17;x<8;x+=.65){box(M.rock,x,1.1,9,.56,.28,.16);rod(M.woodLight,[x,2.65,9.12],[x,3.15,9.12],.04);}rod(M.woodLight,[-17,3.15,9.12],[8,3.15,9.12],.045);

// Curved tiled roofs, timber galleries, and golden eaves.
function roof(x,y,z,w,d,h=1,teal=false){const nx=10,nz=8,vs=[],uv=[],indices=[];for(let iz=0;iz<=nz;iz++)for(let ix=0;ix<=nx;ix++){const a=ix/nx*2-1,b=iz/nz*2-1;vs.push(x+a*w/2,y+h*(1-Math.abs(b))+.24*Math.pow(Math.abs(a),4)+.19*Math.pow(Math.abs(b),6),z+b*d/2);uv.push(ix/nx,iz/nz);}for(let iz=0;iz<nz;iz++)for(let ix=0;ix<nx;ix++){let a=iz*(nx+1)+ix,b=a+nx+1;indices.push(a,b,a+1,b,b+1,a+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();put(g,teal?M.roofTeal:M.roof);rod(M.woodLight,[x-w/2,y+h+.22,z],[x+w/2,y+h+.22,z],.065);for(const s of[-1,1]){rod(M.neon,[x-w/2,y+.22,z+s*d/2],[x+w/2,y+.22,z+s*d/2],.025);addGlow(x,y+.2,z+s*d/2);}}
const windowTransforms=[],treeTrunks=[],treeLeaves=[],lanternData=[];
function lantern(x,y,z,s=.2){lanternData.push({x,y,z,s,phase:rnd(0,6.28)});rod(M.wood,[x,y+.35,z],[x,y+.65,z],.018);addGlow(x,y,z);}
function railing(x,y,z,w){rod(M.woodLight,[x-w/2,y+.52,z],[x+w/2,y+.52,z],.045);for(let a=-w/2;a<=w/2;a+=.4){box(M.woodLight,x+a,y+.27,z,.045,.5,.045);if(a<w/2-.2)rod(M.woodLight,[x+a,y+.12,z],[x+a+.35,y+.43,z],.018);}}
function heritage(x,y,z,w=3,d=2.3,levels=1,name='tea'){buildingSpecs.push({kind:'heritage',x,y,z,w,d,h:levels*1.76+1.0});box(M.wood,x,y+.88*levels,z,w,1.76*levels,d);for(let floor=0;floor<levels;floor++){let fy=y+floor*1.76;box(M.sand,x,fy+.82,z+d/2+.01,w-.28,1.3,.08);for(const dx of[-w*.35,0,w*.35]){box(M.wood,x+dx,fy+.85,z+d/2+.1,.1,1.7,.13);for(let ix=0;ix<3;ix++){box(heritageWindow,x+dx+(ix-1)*.15,fy+1.05,z+d/2+.12,.11,.54,.025);}box(M.wood,x+dx,fy+1.08,z+d/2+.15,.58,.045,.04);}
box(M.woodLight,x,fy+.06,z+d/2+.32,w+.5,.16,.8);railing(x,fy+.14,z+d/2+.7,w+.4);for(const dx of[-w*.42,w*.42]){box(M.red,x+dx,fy+.87,z+d/2+.42,.12,1.6,.12);lantern(x+dx,fy+1.4,z+d/2+.55,.17);}roof(x,fy+1.75,z,w+.7,d+.65,.65,(Math.floor(Math.abs(x)*1.7)+floor)%4===0);}
if(name)sign(name,x,y+.72,z+d/2+.2,w*.67,.58);for(const dx of[-w*.4,w*.4])rod(M.wood,[x+dx,2.45,z+d/2],[x+dx,y,z+d/2],.09);}
for(let r=0;r<3;r++){const yy=2.8+r*2.4,zz=6.15-r*1.85;for(let k=0;k<5;k++){let xx=-9.7+k*3.1+r*.25;heritage(xx,yy,zz,2.65,2.2,1,['hotpot','noodles','tea','store','city'][(k+r)%5]);}}
heritage(4.8,3,4.8,2.8,2.2,3,'welcome');heritage(-11.5,5.5,2.5,2.4,2.2,2,'tea');
// A pavilion looks out toward the meeting of the rivers.
box(M.concrete,8.1,2.65,5.7,2.4,.3,2.6);for(const dx of[-.8,.8])for(const dz of[-.85,.85])cyl(M.red,8.1+dx,3.65,5.7+dz,.085,2);roof(8.1,4.7,5.7,2.8,3,.85,true);railing(8.1,2.8,7,2.4);
// Dense residential towers; panes are one instanced mesh across the whole city.
function tower(x,base,z,w,d,h,style=0){buildingSpecs.push({kind:'tower',x,y:base,z,w,d,h});const mat=style===1?M.blue:style===2?M.cream:M.concrete;box(mat,x,base+h/2,z,w,h,d);box(M.concrete,x,base+h+.08,z,w+.18,.2,d+.18);for(let yy=base+.7;yy<base+h-.25;yy+=.85){for(let xx=-w/2+.3;xx<w/2-.15;xx+=.56){windowTransforms.push({p:[x+xx,yy,z+d/2+.025],s:[.27,.42,.035],color:random()<.35?'#658b8d':'#f1cb81'});if(style===0&&Math.round(yy*10)%3===0){box(M.concrete,x+xx,yy-.25,z+d/2+.17,.41,.08,.36);box(M.metal,x+xx,yy-.05,z+d/2+.34,.4,.06,.04);}}for(let zz=-d/2+.3;zz<d/2-.2;zz+=.55)windowTransforms.push({p:[x+w/2+.02,yy,z+zz],s:[.035,.42,.27],color:random()<.35?'#588189':'#efcf93'});}
for(let k=0;k<2;k++){cyl(M.metal,x-w*.25+k*w*.45,base+h+.42,z,.27,.62);cyl(M.concrete,x-w*.25+k*w*.45,base+h+.75,z,.3,.08);}box(M.dark,x,base+h+.2,z-d*.32,w*.3,.25,.45);
if(style===0){for(let i=0;i<4;i++)box(M.cream,x+w/2+.12,base+1.5+i*1.8,z,.22,.3,.45);rod(M.dark,[x-.65,base+h+.3,z+.3],[x+.65,base+h+.3,z+.3],.022);for(let i=0;i<3;i++)box(i%2?M.red:M.white,x-.4+i*.35,base+h+.12,z+.3,.21,.35,.025);put(new THREE.SphereGeometry(.25,8,4,0,Math.PI*2,0,Math.PI*.5),M.metal,[x+.5,base+h+.5,z-.3],[.7,0,.3]);}}
for(const t of[[-13,7.6,-8,2.4,2.4,5.5,0],[-10,7.6,-10,2.5,2.3,7.6,0],[-7,7.6,-10,2,2.3,10,0],[-3.8,7.6,-9,2.2,2.2,12,1],[-.4,7.6,-7.7,2.3,2.4,14,1],[3.2,5.7,-6.8,2.1,2.3,13,2],[6.2,4.7,-5.5,2,2.2,10,1],[-16,5.6,-4,2,2,6,0],[18,3.5,-10,2.5,2.5,9,0],[18.2,3.5,-5.8,2,2.4,5.7,0]])tower(...t);
// Chaotianmen's rising towers and a small sky conservatory.
for(const [x,z,h]of[[8,-3,12],[10,-.5,14],[8,2,10],[5.4,-2.7,11]]){tower(x,2.6,z,1.65,1.8,h,1);for(const dx of[-.7,.7])rod(M.neon,[x+dx,2.7,z+.93],[x+dx,2.6+h,z+.93],.025);}
box(M.metal,8.8,13,-1.5,5.8,.65,1.55,[0,.54,0]);box(M.glass,8.8,13.4,-1.5,5.7,.6,1.45,[0,.54,0]);box(M.neon,8.8,13.03,-.8,5.7,.06,.04,[0,.54,0]);
// The Liziba building has a genuine open passage through its lower floors.
tower(-5.5,11.05,-.03,4.8,3.35,7.3,0);for(const z of[-1.45,1.45])box(M.concrete,-5.5,7.3,z,4.85,7.5,.45);box(M.concrete,-5.5,8.6,0,4.85,.35,3.35);box(M.dark,-5.5,10.25,-1.69,4.3,1.5,.05);sign('poster',-5.5,13.3,1.69,1.8,1.1);

// Roads and monorail follow continuous curves instead of disconnected blocks.
function path(points,closed=false){return new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed,'catmullrom',.15);}
function ribbon(curve,width,material,segments=90,offset=0){const vs=[],uv=[],ix=[];for(let i=0;i<=segments;i++){const p=curve.getPointAt(i/segments),t=curve.getTangentAt(i/segments),n=new THREE.Vector3(-t.z,0,t.x).normalize().multiplyScalar(width/2);for(const s of[-1,1]){vs.push(p.x+n.x*s,p.y+offset,p.z+n.z*s);uv.push((s+1)/2,i/segments*14);}}for(let i=0;i<segments;i++){let k=i*2;ix.push(k,k+1,k+2,k+1,k+3,k+2);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();put(g,material);}
function guardrails(curve,width,material=M.metal,segments=70,height=.38){let prev=[null,null];for(let i=0;i<=segments;i++){const p=curve.getPointAt(i/segments),t=curve.getTangentAt(i/segments);for(let j=0;j<2;j++){const s=j?1:-1,a=[p.x-t.z*width/2*s,p.y+height,p.z+t.x*width/2*s];if(prev[j])rod(material,prev[j],a,.035);if(i%2===0)rod(material,[a[0],p.y,a[2]],a,.035);prev[j]=a;}}}
const roadTex=texture(128,512,(c,w,h)=>{c.fillStyle='#788d86';c.fillRect(0,0,w,h);c.fillStyle='#e5d9ad';c.fillRect(8,0,2,h);c.fillRect(w-10,0,2,h);for(let y=0;y<h;y+=90)c.fillRect(w/2-2,y,4,43);});roadTex.wrapT=THREE.RepeatWrapping;const roadMat=toon('#ffffff',{map:roadTex,side:THREE.DoubleSide});
const roadA=path([[-23,3.6,5],[-18,4.4,4],[-13,5.8,2.8],[-7,6.2,1.7],[0,6.2,0],[7,5.8,-2],[12,4.8,-6],[19,3.8,-9]]);
const roadB=path([[-20,6.2,-8],[-17,6.1,-5],[-13,6.1,-2],[-10,5.1,1],[-9,3.1,6],[-14,2.8,8]]);
const bridgePath=path([[6.5,3.35,7.7],[11,3.75,7],[17,3.75,3],[22,3.35,0]]);
for(const [c,w]of[[roadA,1.65],[roadB,1.4],[bridgePath,1.9]]){ribbon(c,w+.18,M.concrete,80,-.18);ribbon(c,w,roadMat);guardrails(c,w+.08);for(let i=0;i<10;i++){const p=c.getPointAt((i+.3)/10);cyl(M.concrete,p.x,(p.y-.35)/2,p.z,.17,p.y-.35);}}
// Red suspension bridge, cables, hangers, and a necklace of lights.
const bridgeTowers=[.24,.74];for(const u of bridgeTowers){const p=bridgePath.getPointAt(u),t=bridgePath.getTangentAt(u),n=new THREE.Vector3(-t.z,0,t.x);for(const side of[-1,1]){const x=p.x+n.x*1.3*side,z=p.z+n.z*1.3*side;box(M.red,x,5.5,z,.3,9.8,.35);box(M.neon,x,8.5,z+.18,.07,3,.04);}rod(M.red,[p.x-n.x*1.3,9.4,p.z-n.z*1.3],[p.x+n.x*1.3,9.4,p.z+n.z*1.3],.18);rod(M.red,[p.x-n.x*1.3,4.5,p.z-n.z*1.3],[p.x+n.x*1.3,4.5,p.z+n.z*1.3],.12);}
for(const side of[-1,1]){let last=null;for(let i=0;i<=48;i++){const u=i/48,p=bridgePath.getPointAt(u),t=bridgePath.getTangentAt(u);let h;if(u<.24)h=4.1+6*u/.24;else if(u>.74)h=10.1-6*(u-.74)/.26;else h=5.3+4.8*Math.pow((u-.49)/.25,2);const a=[p.x-t.z*1.25*side,h,p.z+t.x*1.25*side];if(last)rod(M.red,last,a,.055);if(i%2===0){rod(M.cream,[a[0],p.y+.1,a[2]],a,.025);addGlow(a[0],p.y+.28,a[2]);}last=a;}}
// A small river crossing on the upper branch.
const smallBridge=path([[9,3,-9],[14,3.4,-9],[18,3.5,-10]]);ribbon(smallBridge,1.35,roadMat,24);guardrails(smallBridge,1.4);for(let x=10;x<17;x+=2)cyl(M.concrete,x,1.5,-9,.17,3);
const trainPath=path([[-22,9.6,-6],[-18,9.6,-1.8],[-13,9.6,-.1],[-8,9.6,0],[-3,9.6,0],[5.85,9.6,0],[6.05,9.6,4.4],[10.8,9.6,5.1],[13.3,9.6,0],[14,9.6,-11]]);
ribbon(trainPath,1.15,M.concrete,120,-.3);ribbon(trainPath,.47,M.metal,120,-.05);guardrails(trainPath,.9,M.cream,110,.02);
function insideXZ(x,z,poly){let yes=false;for(let a=0,b=poly.length-1;a<poly.length;b=a++){const A=poly[a],B=poly[b];if(((A[1]>z)!==(B[1]>z))&&x<(B[0]-A[0])*(z-A[1])/(B[1]-A[1])+A[0])yes=!yes;}return yes;}
function groundAt(x,z){let y=-.4;if(insideXZ(x,z,land))y=2.42;if(insideXZ(x,z,[[-21,-13],[-5,-13],[5,-9],[7,-2],[2,3],[-17,3],[-21,-2]]))y=5.5;if(insideXZ(x,z,[[-18,-13],[-5,-13],[3,-8],[1,-4],[-17,-4],[-20,-7]]))y=7.5;if(insideXZ(x,z,[[15,-15],[21,-12],[21,-4],[18,-2],[13,-6]]))y=3.4;return y;}
for(let i=1;i<22;i++){const p=trainPath.getPointAt(i/23);const occupied=buildingSpecs.some(b=>Math.abs(p.x-b.x)<b.w/2+.28&&Math.abs(p.z-b.z)<b.d/2+.28&&b.y<9.6&&b.y+b.h>3.3);if(!occupied){const base=groundAt(p.x,p.z),top=9.1;cyl(M.concrete,p.x,(base+top)/2,p.z,.17,top-base);box(M.concrete,p.x,9.1,p.z,1.3,.22,.7);}}
function tunnel(p,t){const b=new Map(),g=new THREE.Group();box(M.rock,0,0,0,3,3,1.3,[0,0,0],b);box(M.dark,0,-.2,.67,1.55,1.8,.035,[0,0,0],b);put(new THREE.CylinderGeometry(.8,.8,.035,16,1,false,0,Math.PI),M.dark,[0,.65,.7],[Math.PI/2,0,0],[1,1,1],b);box(M.concrete,0,-1.13,.8,1.65,.15,1,[0,0,0],b);bake(b,g);g.position.copy(p);g.position.y+=.4;g.rotation.y=Math.atan2(t.x,t.z);scene.add(g);}
tunnel(trainPath.getPointAt(.055),trainPath.getTangentAt(.055));tunnel(trainPath.getPointAt(.94),trainPath.getTangentAt(.94).negate());
// Liziba platform: station roof, tactile strip, gates, seats, route board.
box(M.concrete,-12.2,9.25,1.25,5.8,.35,1.8);box(M.yellow,-12.2,9.45,.48,5.6,.04,.12);for(let x=-14.7;x<-9.5;x+=.23)box(M.yellow,x,9.46,.72,.2,.035,.2);
for(const x of[-14.6,-12.2,-9.8]){box(M.cream,x,10.25,2,.09,1.8,.09);box(M.cream,x,10.25,.85,.09,1.8,.09);}box(M.roofTeal,-12.2,11.2,2.0,6.3,.2,1.05,[0,0,.015]);box(M.neon,-12.2,11.05,2.35,5.9,.045,.045);sign('liziba',-12.2,10.48,2.08,2.65,.75);sign('arrival',-10.2,10.7,2.12,1.15,.48);
for(let x=-14.5;x<-13;x+=.5){box(M.blue,x,9.75,1.7,.32,.12,.35);box(M.blue,x,9.95,1.87,.32,.3,.06);rod(M.dark,[x,9.4,1.7],[x,9.7,1.7],.04);}for(let x=-10.4;x<-9.5;x+=.35){box(M.metal,x,9.7,1.5,.16,.5,.45);box(M.glass,x+.12,9.9,1.5,.12,.25,.02);}railing(-12.2,9.4,2.13,5.5);
for(let i=0;i<23;i++)box(M.concrete,-15.3,5.5+i*.17,2.4-i*.12,1,.18,.35);

// The stair street climbs beside the old town, with tiny everyday details.
for(let i=0;i<40;i++){const z=7.9-i*.24,y=2.65+i*.135;box(M.concrete,-14.1,y,z,1.45,.2,.28);if(i%5===0){rod(M.wood,[-14.92,y,z],[-14.92,y+.65,z],.035);rod(M.wood,[-13.28,y,z],[-13.28,y+.65,z],.035);}}
rod(M.wood,[-14.92,3.3,7.9],[-14.92,8.6,-1.5],.04);rod(M.wood,[-13.28,3.3,7.9],[-13.28,8.6,-1.5],.04);
for(let i=0;i<4;i++)heritage(-16.3,2.8+i*1.1,6.7-i*2.1,2.1,1.8,1,['noodles','store','tea','fruit'][i]);
const steamSources=[];
function table(x,y,z){cyl(M.woodLight,x,y+.45,z,.39,.1);cyl(M.dark,x,y+.2,z,.07,.45);cyl(M.dark,x,y+.54,z,.18,.09);cyl(M.red,x,y+.6,z,.15,.025);steamSources.push([x,y+.65,z]);for(const [dx,dz]of[[.6,0],[-.6,0],[0,.6]]){cyl(M.red,x+dx,y+.22,z+dz,.17,.09);for(const s of[-1,1])rod(M.red,[x+dx+s*.1,y,z+dz],[x+dx+s*.1,y+.2,z+dz],.028);}}
for(let i=0;i<3;i++)table(-8+i*2.1,2.7,7.95);
function stall(x,y,z,name){box(M.woodLight,x,y+.45,z,1.3,.9,.7);box(M.cream,x,y+.93,z,1.4,.1,.85);for(const dx of[-.6,.6])rod(M.red,[x+dx,y,z],[x+dx,y+1.8,z],.04);box(M.red,x,y+1.85,z,1.6,.12,1.1,[.14,0,0]);sign(name,x,y+.47,z+.36,1.1,.58);sign('menu',x+.8,y+.5,z,.4,.6,[0,-.2,0]);for(let k=0;k<5;k++){cyl(name==='food'?M.cream:M.yellow,x-.45+k*.21,y+1.03,z,.075,.08);if(name==='food')rod(M.wood,[x-.45+k*.21,y+1.05,z-.13],[x-.45+k*.21,y+1.05,z+.15],.015);}steamSources.push([x,y+1.1,z]);}
stall(-17.8,2.65,8,'food');stall(-12.2,2.65,8,'fruit');stall(2.8,2.65,8,'noodles');
for(let i=0;i<3;i++){let z=6-i*2.1,y=5+i*1.1;rod(M.dark,[-17.4,y,z],[-12.9,y,z],.015);for(let j=0;j<7;j++)lantern(-17.2+j*.66,y-.1-Math.sin(j/6*Math.PI)*.35,z,.15);}
function person(x,y,z,k=0){personSpecs.push({x,y,z,k});}
for(let i=0;i<24;i++){const step=Math.floor(rnd(0,39));person(-14.1+rnd(-.45,.45),2.78+step*.135,7.9-step*.24,i);}for(let i=0;i<18;i++)person(rnd(-17,7),2.68,rnd(8.1,8.75),i);for(let i=0;i<6;i++)person(-14.1+i*.65,9.46,1.45,i);
// Trees are instanced, including pines, bamboo groves and Chinese maples.
function tree(x,y,z,s=1,type=0){treeTrunks.push({p:[x,y+s*.65,z],s:[.09*s,1.3*s,.09*s]});if(type===1){for(let i=0;i<3;i++)treeLeaves.push({p:[x,y+s*(1+i*.35),z],s:[s*(.7-i*.13),s*.55,s*(.7-i*.13)],color:'#3e7b63'});}else for(let i=0;i<3;i++)treeLeaves.push({p:[x+rnd(-.25,.25)*s,y+s*(1.3+i*.2),z+rnd(-.3,.3)*s],s:[s*.65,s*.6,s*.6],color:type===2?'#ce7449':i%2?'#8cb76c':'#56986e'});}
for(let i=0;i<45;i++)tree(rnd(-21,-17),2.6,rnd(-1,7.5),rnd(.7,1.2),i%5===0?2:0);for(let i=0;i<40;i++)tree(rnd(-19,-7),7.7,rnd(-14,-11),rnd(.8,1.3),1);for(let i=0;i<12;i++)tree(rnd(14,20),3.5,rnd(-14,-12),rnd(.7,1),0);for(const p of[[-11,5.5,-3],[-8,5.5,-3],[2,5.5,-3],[7,2.6,6.5],[5,2.6,8.2],[-18,2.7,6]])tree(...p,1.1,2);
for(let i=0;i<22;i++){let x=rnd(-20,-18.3),z=rnd(1,4),h=rnd(1,2.6);rod(M.leaf,[x,2.6,z],[x,2.6+h,z],.035);for(let j=0;j<3;j++)blob(M.leafLight,x+.2,3+h-j*.35,z,.3,.1,.15,0);}
for(const [x,y,z]of[[-19,2.6,5],[-17.5,5.6,-1],[7.6,2.6,7]]){box(M.woodLight,x,y+.4,z,1,.1,.4);box(M.woodLight,x,y+.65,z-.16,1,.4,.06);for(const dx of[-.4,.4])box(M.dark,x+dx,y+.2,z,.06,.4,.25);}
// Street lighting, utility lines, bicycles, traffic lights and civic flags.
const pointLights=[];
function streetLamp(x,y,z){rod(M.dark,[x,y,z],[x,y+1.5,z],.038);box(M.roofTeal,x,y+1.65,z,.4,.1,.4);box(M.neon,x,y+1.48,z,.22,.26,.22);addGlow(x,y+1.45,z);}
for(let x=-17;x<9;x+=2.5)streetLamp(x,2.7,8.98);for(let i=0;i<10;i++){const p=roadA.getPointAt((i+.3)/11);streetLamp(p.x,p.y,p.z+.95);}
for(const p of[[-6,5,7],[-12,10,1.6],[3,5,6.8],[16,6,4]]){const l=new THREE.PointLight('#ff9f48',0,8,2);l.position.set(...p);pointLights.push(l);}
for(let i=0;i<4;i++){let x=-18+i*2.6,z=4-i*.7,y=6;rod(M.wood,[x,2.7,z],[x,y,z],.055);rod(M.dark,[x-.4,y-.15,z],[x+.4,y-.15,z],.035);if(i<3){for(const o of[-.25,.25]){const curve=path([[x+o,y-.12,z],[x+1.3+o,y-.45,z-.35],[x+2.6+o,y-.12,z-.7]]);put(new THREE.TubeGeometry(curve,10,.012,3,false),M.dark);}}}
for(const [x,y,z]of[[-10.5,2.7,8.8],[1.8,2.7,8.7],[-17.3,5.7,1]]){box(M.red,x,y+.5,z,.5,1,.36);sign('drinks',x,y+.55,z+.19,.43,.85);}
function bicycle(x,y,z){for(const dx of[-.22,.22]){put(new THREE.TorusGeometry(.15,.022,4,10),M.dark,[x+dx,y+.16,z]);}rod(M.blue,[x-.22,y+.16,z],[x+.08,y+.4,z],.026);rod(M.blue,[x+.08,y+.4,z],[x+.22,y+.16,z],.025);rod(M.dark,[x+.08,y+.4,z],[x+.18,y+.52,z],.024);box(M.dark,x-.08,y+.4,z,.15,.04,.08);}
for(let i=0;i<5;i++)bicycle(-1.5+i*.8,2.66,8.85);
for(let i=0;i<3;i++){const x=-16.8+i*.6,y=2.65,z=8.8;for(const dx of[-.17,.17])put(new THREE.TorusGeometry(.11,.035,4,8),M.dark,[x+dx,y+.12,z]);box(i%2?M.yellow:M.blue,x,y+.28,z,.43,.22,.23);box(M.dark,x,y+.43,z,.26,.06,.21);rod(M.dark,[x+.16,y+.3,z],[x+.18,y+.65,z],.025);box(M.white,x-.22,y+.53,z,.28,.27,.28);}
rod(M.red,[-13.1,6.8,1],[-13.1,8.1,1],.035);put(new THREE.CircleGeometry(.25,16),M.red,[-13.1,8.1,1]);put(new THREE.CircleGeometry(.21,16),M.metal,[-13.1,8.1,1.012]);

for(const [x,y,z]of[[-17,4.5,4.6],[4.3,6.3,-1]]){rod(M.dark,[x,y,z],[x,y+1.3,z],.04);box(M.dark,x,y+1.25,z,.18,.48,.15);blob(M.red,x,y+1.36,z+.09,.05,.05,.02);blob(M.leafLight,x,y+1.15,z+.09,.05,.05,.02);for(let k=0;k<5;k++)box(M.cream,x+.5+k*.16,y+.03,z,.09,.015,1.1);}
sign('road',-.2,7.6,1,1.6,.7);rod(M.metal,[-1,6.2,1],[-1,8,1],.04);
const flagTex=texture(256,170,(c,w,h)=>{c.fillStyle='#d84432';c.fillRect(0,0,w,h);function star(x,y,r){c.fillStyle='#ffdc68';c.beginPath();for(let i=0;i<10;i++){let a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.4:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();c.fill();}star(45,45,22);for(const [x,y]of[[80,20],[96,39],[94,63],[78,80]])star(x,y,7);});const flagMat=toon('#ffffff',{map:flagTex,side:THREE.DoubleSide});for(const [x,y,z]of[[-14.9,9.4,1.8],[6.8,2.7,5.5]]){rod(M.metal,[x,y,z],[x,y+1.8,z],.025);put(new THREE.PlaneGeometry(.65,.43),flagMat,[x+.32,y+1.5,z]);}
// LED canvas is shared by two skyline facades and updated at a gentle 4 fps.
const ledCanvas=document.createElement('canvas');ledCanvas.width=128;ledCanvas.height=256;const lc=ledCanvas.getContext('2d'),ledTex=new THREE.CanvasTexture(ledCanvas);ledTex.colorSpace=THREE.SRGBColorSpace;const ledMat=noOutline(new THREE.MeshBasicMaterial({map:ledTex}));
for(const [x,y,z,w,h]of[[-.4,14,-6.47,1.65,8.6],[-3.8,13,-7.87,1.6,7]])put(new THREE.PlaneGeometry(w,h),ledMat,[x,y,z]);
function paintLED(t,lit){lc.fillStyle=lit?'#193d55':'#437e83';lc.fillRect(0,0,128,256);if(lit){for(let y=0;y<256;y+=8)for(let x=0;x<128;x+=8){const a=.25+.65*(.5+.5*Math.sin(y*.045+x*.04-t*.55));lc.fillStyle=`rgba(${Math.round(100+130*a)},${Math.round(160+55*a)},${Math.round(190-70*a)},${a})`;lc.fillRect(x,y,5,5);}lc.fillStyle='#ffe0a2';lc.font='bold 48px "PingFang SC",sans-serif';lc.textAlign='center';lc.fillText('重',64,114);lc.fillText('庆',64,172);}ledTex.needsUpdate=true;}

bake(buckets,staticRoot);
instances(new THREE.BoxGeometry(1,1,1),M.warm,windowTransforms);
instances(new THREE.CylinderGeometry(.8,1,1,5),M.wood,treeTrunks);
instances(new THREE.IcosahedronGeometry(1,0),M.leaf,treeLeaves);
const lanternMesh=instances(new THREE.SphereGeometry(1,8,6),lanternMaterial,lanternData.map(l=>({p:[l.x,l.y,l.z],s:[l.s,l.s*1.25,l.s]})));
const lanternCaps=instances(new THREE.CylinderGeometry(1,1,1,6),M.yellow,lanternData.flatMap(l=>[-1,1].map(s=>({p:[l.x,l.y+s*l.s*1.2,l.z],s:[l.s*.5,l.s*.2,l.s*.5]}))));
const glowTex=texture(64,64,(c,w,h)=>{const g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'#fff6cd');g.addColorStop(.2,'#ffd581ac');g.addColorStop(1,'#ff9a3400');c.fillStyle=g;c.fillRect(0,0,w,h);});
const glowGeo=new THREE.BufferGeometry();glowGeo.setAttribute('position',new THREE.Float32BufferAttribute(glowPositions,3));const glowMat=noOutline(new THREE.PointsMaterial({map:glowTex,color:'#ffbc65',size:.46,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false}));const glows=new THREE.Points(glowGeo,glowMat);scene.add(glows);

// Two individually aligned cars follow the same route, then vanish inside the tunnels.
function makeTrainCar(){const b=new Map(),g=new THREE.Group();box(M.white,0,.43,0,1.83,.68,.7,[0,0,0],b);box(M.blue,0,.25,0,1.87,.17,.72,[0,0,0],b);box(M.cream,0,.8,0,1.7,.12,.61,[0,0,0],b);box(M.dark,0,.07,0,1.5,.18,.48,[0,0,0],b);for(const side of[-1,1]){for(let i=0;i<4;i++)box(M.glass,-.62+i*.42,.52,side*.357,.29,.29,.025,[0,0,0],b);box(M.dark,0,.4,side*.37,.025,.5,.02,[0,0,0],b);}box(M.glass,.93,.53,0,.015,.34,.55,[0,0,0],b);for(const z of[-.22,.22])box(M.neon,.95,.29,z,.025,.09,.12,[0,0,0],b);bake(b,g);scene.add(g);return g;}
const trainCars=[makeTrainCar(),makeTrainCar()],trainLength=trainPath.getLength();let trainPhase=2,trainState='';let stationU=.3,bestStop=Infinity;for(let i=0;i<=1000;i++){const p=trainPath.getPointAt(i/1000),d=(p.x+11.1)**2+p.z*p.z;if(d<bestStop){bestStop=d;stationU=i/1000;}}
function trainU(phase){if(phase<9){const a=phase/9;return .04+(stationU-.04)*(1-(1-a)*(1-a));}if(phase<13)return stationU;if(phase<29){const a=(phase-13)/16;return stationU+(1.02-stationU)*(a*a*(2-a));}return 1.05;}
function updateTrain(){const lead=trainU(trainPhase);trainCars.forEach((car,i)=>{const u=lead-i*2.02/trainLength;car.visible=u>.06&&u<.94;if(u<0||u>1)return;const p=trainPath.getPointAt(u),t=trainPath.getTangentAt(u);car.position.copy(p);car.rotation.y=Math.atan2(-t.z,t.x);});const state=trainPhase<9?'A monorail is on its way to Liziba.':trainPhase<13?'Liziba Station · A little pause in the city.':trainPhase<29?'Next stop: through the mountain city.':'The next monorail will be here soon.';if(state!==trainState){trainState=state;document.querySelector('#status').textContent=state;}}
// Traffic uses one instanced mesh per component, not per vehicle.
const trafficPaths=[roadA,roadB,bridgePath,smallBridge];const traffic=Array.from({length:24},(_,i)=>({curve:trafficPaths[i%4],u:random(),speed:rnd(.018,.034)*(i%2?1:-1),color:i%5===0?'#efbc48':i%4===0?'#bf5945':i%3===0?'#619b9a':'#f1e5c8',bus:i%9===0}));
const carBodies=new THREE.InstancedMesh(new THREE.BoxGeometry(.65,.25,.34),M.white,traffic.length),carRoofs=new THREE.InstancedMesh(new THREE.BoxGeometry(.33,.19,.3),M.glass,traffic.length),carWheels=new THREE.InstancedMesh(new THREE.BoxGeometry(.12,.15,.4),M.dark,traffic.length*2),headlights=new THREE.InstancedMesh(new THREE.BoxGeometry(.02,.06,.08),M.neon,traffic.length*2),tailMat=noOutline(toon('#d84532',{emissive:'#ff3322',emissiveIntensity:1})),taillights=new THREE.InstancedMesh(new THREE.BoxGeometry(.02,.055,.08),tailMat,traffic.length*2);[carBodies,carRoofs,carWheels,headlights,taillights].forEach(m=>{m.castShadow=false;m.frustumCulled=false;scene.add(m);});traffic.forEach((v,i)=>carBodies.setColorAt(i,new THREE.Color(v.color)));
function placeInstance(mesh,i,p,t,y,dx=0,dz=0,sx=1){const angle=Math.atan2(-t.z,t.x);dummy.position.set(p.x+t.x*dx-t.z*dz,p.y+y,p.z+t.z*dx+t.x*dz);dummy.rotation.set(0,angle,0);dummy.scale.set(sx,1,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}
function updateTraffic(dt){traffic.forEach((v,i)=>{v.u=(v.u+dt*v.speed+1)%1;const p=v.curve.getPointAt(v.u),t=v.curve.getTangentAt(v.u);const lane=v.speed>0?.36:-.36;p.x-=t.z*lane;p.z+=t.x*lane;if(v.speed<0)t.negate();const scale=v.bus?1.7:1;placeInstance(carBodies,i,p,t,.22,0,0,scale);placeInstance(carRoofs,i,p,t,.42,0,0,scale);for(let j=0;j<2;j++){placeInstance(carWheels,i*2+j,p,t,.12,(j?1:-1)*.21*scale);placeInstance(headlights,i*2+j,p,t,.25,.335*scale,(j?1:-1)*.11);placeInstance(taillights,i*2+j,p,t,.24,-.335*scale,(j?1:-1)*.11);}});[carBodies,carRoofs,carWheels,headlights,taillights].forEach(m=>m.instanceMatrix.needsUpdate=true);}
// Sightseeing boats and expanding, low-poly wakes on each river.
const boatPaths=[path([[-20,.2,13],[-8,.2,14.4],[6,.2,14],[18,.2,11],[18,.2,7],[10,.2,11],[-5,.2,11],[-18,.2,11]],true),path([[12,.2,-14],[11.5,.2,-8],[13,.2,-1],[16,.2,3],[18,.2,0],[16,.2,-7]],true)];
const boatReflections=new THREE.Group();scene.add(boatReflections);const boats=[];for(let i=0;i<4;i++){const b=new Map(),g=new THREE.Group();box(M.white,0,.27,0,1.85,.35,.62,[0,0,0],b);box(M.red,0,.07,0,1.75,.14,.58,[0,0,0],b);box(M.cream,-.1,.6,0,1.25,.38,.48,[0,0,0],b);box(M.roofTeal,-.1,.82,0,1.4,.1,.6,[0,0,0],b);for(const side of[-1,1])for(let k=0;k<5;k++)box(M.warm,-.6+k*.25,.61,side*.25,.15,.2,.025,[0,0,0],b);box(M.neon,.9,.4,0,.06,.08,.1,[0,0,0],b);bake(b,g);scene.add(g);const wake=new THREE.Mesh(new THREE.RingGeometry(.45,.49,16,1,Math.PI*.55,Math.PI*.9),noOutline(new THREE.MeshBasicMaterial({color:'#d2ead2',transparent:true,opacity:.5,side:THREE.DoubleSide,depthWrite:false})));wake.rotation.x=-Math.PI/2;scene.add(wake);const reflection=new THREE.Mesh(new THREE.PlaneGeometry(1.9,.9),noOutline(new THREE.MeshBasicMaterial({map:glowTex,color:'#ffd281',transparent:true,opacity:.3,depthWrite:false,blending:THREE.AdditiveBlending})));reflection.rotation.x=-Math.PI/2;boatReflections.add(reflection);boats.push({group:g,wake,reflection,curve:boatPaths[i%2],u:i/4,speed:.017+i*.002});}
function updateBoats(dt,t){boats.forEach((b,i)=>{b.u=((b.u+dt*b.speed)%1+1)%1;const p=b.curve.getPointAt(b.u),tan=b.curve.getTangentAt(b.u);b.group.position.copy(p);b.group.position.y+=Math.sin(t*1.3+i)*.025;b.group.rotation.y=Math.atan2(-tan.z,tan.x);b.wake.position.set(p.x-tan.x*1.1,.115,p.z-tan.z*1.1);b.wake.rotation.z=-b.group.rotation.y+Math.PI/2;b.wake.scale.setScalar(1.1+Math.sin(t*2+i)*.12);b.reflection.position.set(p.x,.12,p.z+.45);b.reflection.rotation.z=-b.group.rotation.y;});}
// 500 instanced leaves/petals and mist flecks; reduced-motion mode draws only 60.
const particleData=Array.from({length:500},(_,i)=>({x:rnd(-22,21),y:rnd(2.5,20),z:rnd(-15,13),size:rnd(.025,.075),speed:rnd(.08,.3),phase:rnd(0,6.28),kind:i%7}));
const particleMat=noOutline(new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.4,depthWrite:false,side:THREE.DoubleSide})),particles=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),particleMat,500);particles.frustumCulled=false;scene.add(particles);particleData.forEach((p,i)=>particles.setColorAt(i,new THREE.Color(p.kind===0?'#cf5f48':p.kind===1?'#9abf6b':'#f1edcd')));
function updateParticles(t){particles.count=reduced?60:500;for(let i=0;i<particles.count;i++){const p=particleData[i],tt=reduced?0:t;dummy.position.set(p.x+Math.sin(tt*.12+p.phase)*1.1,p.kind<2?2.5+(p.y-tt*p.speed+300)%17:p.y+Math.sin(tt*.15+p.phase)*.5,p.z+Math.cos(tt*.1+p.phase)*.5);dummy.quaternion.copy(camera.quaternion);dummy.scale.setScalar(p.size);dummy.updateMatrix();particles.setMatrixAt(i,dummy.matrix);}particles.instanceMatrix.needsUpdate=true;}
const steamCount=steamSources.length*7,steamData=Array.from({length:steamCount},(_,i)=>({source:steamSources[i%steamSources.length],phase:random(),speed:rnd(.1,.2)}));
const steamMat=noOutline(new THREE.MeshBasicMaterial({map:glowTex,color:'#fff1d7',transparent:true,opacity:.3,depthWrite:false,side:THREE.DoubleSide})),steam=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),steamMat,steamCount);steam.frustumCulled=false;scene.add(steam);
function updateSteam(t){steamData.forEach((p,i)=>{const q=(p.phase+(reduced?0:t)*p.speed)%1;dummy.position.set(p.source[0]+Math.sin(q*5+i)*q*.18,p.source[1]+q*1.5,p.source[2]+q*.15);dummy.quaternion.copy(camera.quaternion);dummy.scale.setScalar(.12+Math.sin(q*Math.PI)*.48);dummy.updateMatrix();steam.setMatrixAt(i,dummy.matrix);});steam.instanceMatrix.needsUpdate=true;}
// Soft cloud layers are flat alpha sprites, never expensive volumetric ray marching.
const mistGeo=new THREE.BufferGeometry(),mistBase=[];for(let i=0;i<12;i++)mistBase.push(rnd(-22,22),rnd(3,15),rnd(-16,5));mistGeo.setAttribute('position',new THREE.Float32BufferAttribute(mistBase,3));const mistMat=noOutline(new THREE.PointsMaterial({map:glowTex,color:'#e3eddf',size:7,transparent:true,opacity:.075,depthWrite:false})),mist=new THREE.Points(mistGeo,mistMat);scene.add(mist);


 // Fill the water rim down to the solid original foundation without a duplicate top face.
 const bank=[];for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length];bank.push(a[0],-.48,a[1],b[0],-.48,b[1],a[0],.08,a[1],a[0],.08,a[1],b[0],-.48,b[1],b[0],.08,b[1]);}const bankGeo=new THREE.BufferGeometry();bankGeo.setAttribute('position',new THREE.Float32BufferAttribute(bank,3));bankGeo.computeVertexNormals();ctx.batch.geometry(bankGeo,M.blue,worldScale);bankGeo.dispose();
 let trainClock=2,ledTick=-1;
 function update(dt){
  reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const state=ctx.state,moving=!state.paused;
  if(moving)trainClock=(trainClock+dt)%32;trainPhase=trainClock;updateTrain();
  updateTraffic(moving&&state.traffic?dt:0);[carBodies,carRoofs,carWheels].forEach(o=>o.visible=state.trafficMode!=='hidden');
  headlights.visible=taillights.visible=state.trafficMode!=='hidden'&&state.timeMode==='night'&&state.lightsOn;
  updateBoats(moving?dt:0,state.time);boatReflections.visible=false;
  glows.visible=state.timeMode!=='day'&&state.lightsOn;glowMat.opacity=(state.timeMode==='sunset'?.16:.26)*(state.lightsOn?1:0);
  if(!reduced&&moving){lanternData.forEach((l,i)=>{const angle=Math.sin(state.time*.7+l.phase)*.065,dx=Math.sin(angle)*.25;dummy.position.set(l.x+dx,l.y,l.z);dummy.rotation.set(0,0,angle);dummy.scale.set(l.s,l.s*1.25,l.s);dummy.updateMatrix();lanternMesh.setMatrixAt(i,dummy.matrix);for(let j=0;j<2;j++){dummy.position.set(l.x+dx,l.y+(j?1:-1)*l.s*1.2,l.z);dummy.scale.set(l.s*.5,l.s*.2,l.s*.5);dummy.updateMatrix();lanternCaps.setMatrixAt(i*2+j,dummy.matrix);}});lanternMesh.instanceMatrix.needsUpdate=true;lanternCaps.instanceMatrix.needsUpdate=true;}
  particles.visible=false;updateSteam(state.time);steam.visible=!reduced;mist.visible=state.fogOn;mist.position.x=Math.sin(state.time*.04)*.8;mistMat.color.set(state.timeMode==='night'?'#8998bd':'#e3eddf');
  const tick=Math.floor(state.time*4);if(tick!==ledTick){paintLED(state.time,state.timeMode!=='day'&&state.lightsOn);ledTick=tick;}
 }
 return{scale:S,root:scene,personSpecs,buildingSpecs,materials:M,heritageWindow,lanternMaterial,
  water:{center:[-.5*S,.5*S],level:.08*S,width:47*S,depth:35*S,outline:outline.map(([x,z])=>[x*S,z*S])},
  station:{x:-5.5*S,z:0,opening:{bottom:8.9*S,top:11.05*S,halfDepth:1.225*S}},
  track:trainPath,roads:trafficPaths,original:{update,call(){trainClock=1;},trainCars,boats,traffic,heritageWindow,glows},
  provenance:{originalSha:'fc00b1232f0546cd0c894c6e1ae0f8867eafc64c1b0869779f57282ac5ee7f77',terrainHeight:7.5*S,scale:S,heritageBlocks:buildingSpecs.filter(b=>b.kind==='heritage').length,towers:buildingSpecs.filter(b=>b.kind==='tower').length}
 };
}
