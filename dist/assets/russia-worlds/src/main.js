import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {createKit} from './geometry.js';
import {createMaterials} from './materials.js';
import {buildLandmarks,CATHEDRAL} from './landmarks.js';
import {buildEnvironment} from './environment.js';
import {createAtmosphere} from './atmosphere.js';
import {createLife} from './life.js';
const q=matchMedia('(prefers-reduced-motion: reduce)'),economy=innerWidth<700||(navigator.hardwareConcurrency||8)<=4;
let reduced=q.matches,disposed=false,lost=false,raf=0,last=performance.now(),flight=null,hold=0;
const state={mode:'golden',paused:false,orbit:!reduced,snow:!reduced,time:0,snowTime:0,quality:economy?'mobile':'high'};
const canvas=document.querySelector('#view');
const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,economy?1.25:1.65));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.info.autoReset=false;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(36,innerWidth/innerHeight,.25,260),controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;controls.dampingFactor=.065;controls.minDistance=21;controls.maxDistance=100;controls.minPolarAngle=.35;controls.maxPolarAngle=Math.PI*.455;controls.maxTargetRadius=9;controls.screenSpacePanning=false;controls.autoRotateSpeed=.12;controls.cursor.set(0,4,0);
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));const bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.085,.35,1.2);bloom.enabled=!economy;composer.addPass(bloom);composer.addPass(new OutputPass());
const materials=createMaterials(renderer),staticRoot=new T.Group();staticRoot.name='Moscow architectural district';scene.add(staticRoot);
const kit=createKit(staticRoot);const environment=buildEnvironment(kit,materials),landmarks=buildLandmarks(kit,materials);const staticStats=kit.flush();kit.dispose();
const ctx={scene,renderer,camera,economy};const atmosphere=createAtmosphere(ctx,materials,environment),life=createLife(scene,materials);
// A ground contact atlas complements directional shadows, keeping deep recesses grounded.
const contactTex=materials.canvas(128,128,(c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,2,w/2,h/2,w/2);g.addColorStop(0,'#19263866');g.addColorStop(.65,'#19263828');g.addColorStop(1,'#19263800');c.fillStyle=g;c.fillRect(0,0,w,h);});const contactMat=new T.MeshBasicMaterial({map:contactTex,transparent:true,depthWrite:false,opacity:.36});materials.mats.push(contactMat);const contacts=new T.InstancedMesh(new T.PlaneGeometry(1,1),contactMat,5),d=new T.Object3D();[[1.4,3.2,12,11],[-11,-3.9,5,5],[13.4,-4.4,6,22],[-5,-10,4.5,3.5],[-17,.1,6,5]].forEach(([x,z,w,h],i)=>{d.position.set(x,.678,z);d.rotation.set(-Math.PI/2,0,0);d.scale.set(w,h,1);d.updateMatrix();contacts.setMatrixAt(i,d.matrix);});scene.add(contacts);
const presets={overview:{p:[-38,33,56],t:[0,3.0,-.1]},kremlin:{p:[18,17,30],t:[-9,6,-3.9]},riverside:{p:[31,12,34],t:[1,1,10]},cathedral:{p:[19,17,30],t:[CATHEDRAL.x,8,CATHEDRAL.z]}};
function homePose(){
 const v=presets.overview,p=new T.Vector3(...v.p),t=new T.Vector3(...v.t),aspect=innerWidth/innerHeight;
 if(aspect>=.85)return{p,t};
 const test=camera.clone();test.clearViewOffset();test.aspect=aspect;test.updateProjectionMatrix();const corners=[];
 for(const x of[-21,21])for(const z of[-17.7,17.7])for(const y of[-1.4,.8])corners.push(new T.Vector3(x,y,z));
 corners.push(new T.Vector3(CATHEDRAL.x,CATHEDRAL.height,CATHEDRAL.z),new T.Vector3(-11,16,-3.9),new T.Vector3(13.4,11,-13));
 for(let attempt=0;attempt<5;attempt++){test.position.copy(p);test.lookAt(t);test.updateMatrixWorld();let fit=1;for(const c of corners){const q=c.clone().project(test);fit=Math.max(fit,Math.abs(q.x)/1.02,q.y/(aspect<.85?.54:.66),-q.y/(aspect<.85?.42:.67));}if(fit<=1.001)break;p.sub(t).multiplyScalar(Math.min(2.4,fit*1.01)).add(t);}
 return{p,t};
}
function stopMomentum(){const p=camera.position.clone(),t=controls.target.clone(),damp=controls.enableDamping;controls.autoRotate=false;controls.enableDamping=false;controls.update();controls.enableDamping=damp;camera.position.copy(p);controls.target.copy(t);controls.update();}
function orbit(on){state.orbit=on&&!reduced;if(!state.orbit)stopMomentum();document.querySelector('#orbit').setAttribute('aria-pressed',String(state.orbit));}
function fly(p,t,duration=1.45){stopMomentum();hold=performance.now()+5000;flight={p0:camera.position.clone(),p1:p.clone(),t0:controls.target.clone(),t1:t.clone(),start:performance.now(),duration:reduced?0:duration};if(reduced){camera.position.copy(p);controls.target.copy(t);flight=null;controls.update();}}
function preset(name){const v=presets[name],pose=name==='overview'?homePose():{p:new T.Vector3(...v.p),t:new T.Vector3(...v.t)};orbit(false);fly(pose.p,pose.t);document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));}
function UI(){const light=document.querySelector('#light');light.querySelector('span').textContent=state.mode==='blue'?'Blue hour':'Golden hour';light.setAttribute('aria-label',state.mode==='blue'?'Switch to golden hour':'Switch to blue hour');light.setAttribute('aria-pressed',String(state.mode==='blue'));document.body.classList.toggle('night',state.mode==='blue');document.body.dataset.time=state.mode==='blue'?'night':'sunset';document.querySelector('#snow span').textContent=state.snow?'Snow on':'Snow off';document.querySelector('#snow').setAttribute('aria-pressed',String(state.snow));document.querySelector('#pause').setAttribute('aria-pressed',String(state.paused));document.querySelector('#pause span').textContent=state.paused?'Play':'Pause';document.querySelector('#pause').setAttribute('aria-label',state.paused?'Resume scene animation':'Pause scene animation');document.querySelector('#status').textContent=state.paused?'A moment held still.':state.mode==='blue'?'Blue hour. The city lights come on.':'Winter sun on brick. Quiet snow on stone.';}
document.querySelector('#light').addEventListener('click',()=>{state.mode=state.mode==='golden'?'blue':'golden';UI();});document.querySelector('#orbit').addEventListener('click',()=>orbit(!state.orbit));document.querySelector('#snow').addEventListener('click',()=>{state.snow=!state.snow;UI();});document.querySelector('#pause').addEventListener('click',()=>{state.paused=!state.paused;UI();});document.querySelector('#reset').addEventListener('click',()=>preset('overview'));document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>preset(b.dataset.view)));
const start=()=>{flight=null;hold=performance.now()+9000;};controls.addEventListener('start',start);addEventListener('keydown',onKey);
function onKey(e){if(e.key==='Home'&&e.target===canvas)preset('overview');}
function onReduce(e){reduced=e.matches;if(reduced){orbit(false);state.paused=true;state.snow=false;UI();}}q.addEventListener('change',onReduce);
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h);composer.setSize(w,h);controls.maxDistance=w/h<.85?260:110;camera.aspect=w/h;camera.fov=w/h<.85?40:T.MathUtils.radToDeg(2*Math.atan(Math.tan(T.MathUtils.degToRad(36)/2)/1.10));camera.far=w/h<.85?360:260;camera.setViewOffset(w,h,0,h*(w/h<.85?.04:.025),w,h);camera.updateProjectionMatrix();{const{p,t}=homePose();camera.position.copy(p);controls.target.copy(t);flight=null;controls.update();}scene.fog.near=camera.position.distanceTo(controls.target)+20;scene.fog.far=scene.fog.near+100;}
addEventListener('resize',resize);const onLost=e=>{e.preventDefault();lost=true;document.querySelector('#status').textContent='Graphics paused. Restoring the scene…';},onRestore=()=>{lost=false;UI();};canvas.addEventListener('webglcontextlost',onLost);canvas.addEventListener('webglcontextrestored',onRestore);
let frames=0,frameTime=0,slow=0,stats={};function animate(now){if(disposed)return;raf=requestAnimationFrame(animate);const raw=(now-last)/1000,dt=Math.min(.05,Math.max(0,raw));last=now;if(document.hidden||lost)return;
 if(!state.paused&&!reduced){state.time+=dt;if(state.snow)state.snowTime+=dt;life.update(state.time);}else if(!state.paused&&state.snow)state.snowTime+=dt;
 atmosphere.update(dt,state);
 if(flight){const u=Math.min(1,(now-flight.start)/1000/Math.max(.001,flight.duration)),s=u*u*u*(u*(u*6-15)+10);camera.position.lerpVectors(flight.p0,flight.p1,s);controls.target.lerpVectors(flight.t0,flight.t1,s);if(u>=1)flight=null;}
 controls.autoRotate=state.orbit&&!state.paused&&!reduced&&!flight&&now>hold;controls.update(dt);controls.target.y=T.MathUtils.clamp(controls.target.y,1,12);camera.position.y=Math.max(3,camera.position.y);
 renderer.info.reset();composer.render();stats={calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures,geometries:renderer.info.memory.geometries};frames++;frameTime+=raw;if(frameTime>4){const fps=frames/frameTime;if(fps<25&&state.quality==='high'&&++slow>1){renderer.setPixelRatio(1.1);composer.setPixelRatio(1.1);bloom.enabled=false;state.quality='adaptive';}stats.fps=fps;frames=0;frameTime=0;}
}
resize();orbit(!reduced);if(reduced)state.paused=true;UI();atmosphere.update(10,state);life.update(0);controls.update();renderer.compile(scene,camera);composer.render();window.__sceneReady=true;
window.littleWorld={ready:true,scene,camera,controls,state,focus:preset,diagnostics:()=>({...stats,static:staticStats,renderer:'Three.js 0.180 · WebGL2',...atmosphere.diagnostics(),flight:Boolean(flight),people:life.actors.length,vehicles:life.cars.length,camera:camera.position.toArray(),target:controls.target.toArray(),quality:state.quality,reducedMotion:reduced}),dispose};
function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);removeEventListener('resize',resize);removeEventListener('keydown',onKey);q.removeEventListener('change',onReduce);controls.removeEventListener('start',start);controls.dispose();atmosphere.dispose();const gs=new Set(),ms=new Set(),ts=new Set();scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);for(const m of(Array.isArray(o.material)?o.material:[o.material]).filter(Boolean)){ms.add(m);for(const v of Object.values(m))if(v?.isTexture)ts.add(v);}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose());composer.dispose();renderer.dispose();}
addEventListener('pagehide',e=>{if(!e.persisted)dispose();});requestAnimationFrame(animate);
