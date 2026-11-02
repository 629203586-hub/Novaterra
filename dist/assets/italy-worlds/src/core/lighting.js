import * as THREE from '../../vendor/three/build/three.module.js';
import {createRandom} from './random.js';

// Lighting with named daylight presets (day / golden hour / night). Each preset
// drives sky, key + fill colour and intensity, hemisphere, exposure and bloom.
// Transitions lerp between two preset snapshots so switching never pops.
export function createLighting(ctx){
 const {scene,state,M,emissives,nightLights,streetLampBulb,streetLampDayColor,streetLampNightColor,windowNightColors}=ctx,cfg=ctx.config;
 const hemi=new THREE.HemisphereLight('#a3b9e5','#514357',1.05);scene.add(hemi);
 const key=new THREE.DirectionalLight('#abc9ef',1);
 key.position.set(-25,40,16);key.castShadow=cfg.visual.shadows;key.shadow.mapSize.set(2048,2048);
 const bound=Math.max(cfg.terrain.width,cfg.terrain.depth)*.8;
 Object.assign(key.shadow.camera,{left:-bound,right:bound,top:bound,bottom:-bound,near:1,far:140});
 key.shadow.bias=-.0006;key.shadow.normalBias=.03;key.shadow.radius=2.2;scene.add(key);
 const fill=new THREE.DirectionalLight('#f1b383',.65);fill.position.set(30,19,16);scene.add(fill);

 // Sky: a big inverted sphere with a three-stop vertical gradient. It always
 // sits behind the diorama from any orbit angle and blends through presets.
 const skyStops={day:['#7fa9c6','#bdd5d9','#ece8d4'],sunset:['#aabfce','#e9c7b3','#f8e3c5'],night:['#050a14','#0d1b2f','#22354c']};
 const skyGeo=new THREE.PlaneGeometry(2,2);
 const skyMat=new THREE.ShaderMaterial({side:THREE.FrontSide,depthWrite:false,depthTest:false,fog:false,
  uniforms:{cTop:{value:new THREE.Color(skyStops.day[0])},cMid:{value:new THREE.Color(skyStops.day[1])},cBot:{value:new THREE.Color(skyStops.day[2])},uH:{value:900}},
  vertexShader:'void main(){gl_Position=vec4(position.xy,1.0,1.0);}',
  fragmentShader:'uniform float uH;uniform vec3 cTop;uniform vec3 cMid;uniform vec3 cBot;void main(){float t=clamp(gl_FragCoord.y/uH,0.,1.);vec3 c=mix(cBot,cMid,smoothstep(0.,.55,t));c=mix(c,cTop,smoothstep(.45,1.,t));gl_FragColor=vec4(c,1.);}'});
 const skyMesh=new THREE.Mesh(skyGeo,skyMat);skyMesh.frustumCulled=false;skyMesh.renderOrder=-1000;skyMesh.matrixAutoUpdate=false;scene.add(skyMesh);
 let skyFrom=cfg.lighting.default&&skyStops[cfg.lighting.default]?cfg.lighting.default:'day',skyTo=skyFrom;
 function paintSky(t){
  const a=skyStops[skyFrom],b=skyStops[skyTo];
  const u=skyMat.uniforms;
  u.cTop.value.set(a[0]).lerp(new THREE.Color(b[0]),t);
  u.cMid.value.set(a[1]).lerp(new THREE.Color(b[1]),t);
  u.cBot.value.set(a[2]).lerp(new THREE.Color(b[2]),t);
 }
 paintSky(0);
 // low sun glow behind the hill: a soft billboard disc, sunset only
 const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=256;
 {const c=glowCanvas.getContext('2d');const g=c.createRadialGradient(128,128,4,128,128,128);
  g.addColorStop(0,'rgba(255,214,150,1)');g.addColorStop(.25,'rgba(255,168,92,.62)');g.addColorStop(.6,'rgba(255,138,72,.20)');g.addColorStop(1,'rgba(255,120,60,0)');
  c.fillStyle=g;c.fillRect(0,0,256,256);}
 const glowTex=new THREE.CanvasTexture(glowCanvas);glowTex.colorSpace=THREE.SRGBColorSpace;
 const glowMat=new THREE.SpriteMaterial({map:glowTex,color:'#ffd9a0',transparent:true,opacity:0,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending});
 const sunGlow=new THREE.Sprite(glowMat);sunGlow.position.set(-26,34,-72);sunGlow.scale.set(130,130,1);scene.add(sunGlow);
 function glowFor(name){return name==='sunset'?0.10:0;}
 let glowFrom=glowFor(cfg.lighting.default??'day'),glowTo=glowFrom;
 const dayFloor=new THREE.Color(cfg.lighting.dayFloor??'#9bafbc'),nightFloor=new THREE.Color(cfg.lighting.nightFloor??'#152944');
 let nightAmount=state.night?1:0;

 const presets=cfg.lighting.presets??null,presetNames=presets?Object.keys(presets):null;
 // 'sunset' is the warm evening beat; it shares the night mix with the night preset.
 const nightOf=name=>name==='night';
 function presetBlend(name){
  const p=presets?.[name]??{};
  return {
   sky:new THREE.Color(p.sky??(name==='night'?cfg.lighting.nightBackground:cfg.lighting.dayBackground)),
   exposure:Number.isFinite(p.exposure)?p.exposure:cfg.lighting.exposure,
   keyColor:new THREE.Color(p.key??'#fff2d6'),key:p.keyIntensity??2.5,
   fillColor:new THREE.Color(p.fill??'#f1b383'),fill:p.fillIntensity??.65,
   hemi:p.hemisphere??2.2,ground:new THREE.Color(p.ground??'#514357'),
   bloom:p.bloom??.24,
   sun:new THREE.Vector3(...(p.sun??[-40,55,26]))
  };
 }
 let blendFrom=presetBlend(presetNames?presetNames[0]:'day'),blendTo=blendFrom,blendT=1;
 function currentBlend(){
  const a=blendFrom,b=blendTo,t=blendT,L=THREE.MathUtils.lerp;
  return {sky:a.sky.clone().lerp(b.sky,t),exposure:L(a.exposure,b.exposure,t),keyColor:a.keyColor.clone().lerp(b.keyColor,t),key:L(a.key,b.key,t),fillColor:a.fillColor.clone().lerp(b.fillColor,t),fill:L(a.fill,b.fill,t),hemi:L(a.hemi,b.hemi,t),ground:a.ground.clone().lerp(b.ground,t),bloom:L(a.bloom,b.bloom,t),sun:a.sun.clone().lerp(b.sun,t)};
 }
 function setTime(preset){
  if(preset&&presets?.[preset]){
   blendFrom=currentBlend();blendTo=presetBlend(preset);blendT=0;
   skyFrom=skyTo;skyTo=skyStops[preset]?preset:'day';
   glowFrom=glowTo;glowTo=glowFor(preset);
   state.preset=preset;state.night=nightOf(preset);
   return preset;
  }
  state.night=nightOf(String(preset));state.preset=state.night?'night':'day';
  return state.preset;
 }

 const {rr}=createRandom(cfg.seed^0x7f4a7c15);let rain=null;
 if(cfg.weather.preset==='rain'){
  const positions=new Float32Array(cfg.weather.rainCount*3);
  for(let i=0;i<positions.length;i+=3){positions[i]=rr(-cfg.terrain.width/2,cfg.terrain.width/2);positions[i+1]=rr(1,24);positions[i+2]=rr(-cfg.terrain.depth/2,cfg.terrain.depth/2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(positions,3));
  rain=new THREE.Points(g,new THREE.PointsMaterial({color:'#b8d0dd',size:.06,transparent:true,opacity:.55,depthWrite:false}));scene.add(rain);
 }
 const distance=ctx.camera.position.distanceTo(ctx.controls.target),mist=cfg.weather.preset!=='clear';
 scene.fog.near=distance+(mist?-8:20);scene.fog.far=distance+(mist?75:140);

 function update(dt){
  const target=state.night?1:0;
  nightAmount=THREE.MathUtils.lerp(nightAmount,target,1-Math.exp(-dt*2.2));
  if(Math.abs(nightAmount-target)<.002)nightAmount=target;
  const n=nightAmount;
  if(blendT<1)blendT=Math.min(1,blendT+dt/1.1);
  const b=currentBlend();
  // Fog only ever touches the far side of the diorama: holding it further back
  // than the slab's diagonal keeps the world itself unfogged at every preset.
  const worldSpan=Math.hypot(cfg.terrain.width,cfg.terrain.depth);
  scene.fog.near=distance+worldSpan*.9;
  scene.fog.far=distance+worldSpan*1.9;
  scene.fog.color.copy(b.sky).lerp(new THREE.Color(cfg.lighting.nightBackground),n*.85);
  hemi.intensity=b.hemi;hemi.groundColor.copy(b.ground);
  key.intensity=b.key;key.color.copy(b.keyColor);key.position.copy(b.sun).multiplyScalar(1.35);
  fill.intensity=b.fill;fill.color.copy(b.fillColor);
  if(ctx.renderer)ctx.renderer.toneMappingExposure=b.exposure;
  paintSky(blendT);
  glowMat.opacity=THREE.MathUtils.lerp(glowFrom,glowTo,blendT);
  skyMat.uniforms.uH.value=ctx.renderer?.domElement?.height||900;
  for(const m of emissives)m.emissiveIntensity=m.userData.nightEmission*n;
  for(const[i,m]of[M.warm,M.warmDim].entries()){
   m.color.copy(M.windowDark.color).lerp(windowNightColors[i],n);
   m.emissiveIntensity=m.userData.nightEmission*n;
  }
  streetLampBulb.color.copy(streetLampDayColor).lerp(streetLampNightColor,n);
  streetLampBulb.emissiveIntensity=2.6*n;
  for(const{l,power}of nightLights)l.intensity=power*n*.24;
  ctx.signage.glowMat.opacity=.30*n;
  ctx.bloom.strength=(ctx.economy?.4:1)*(b.bloom*n);
  // The backdrop floor sits under the slab and reads as the "table" colour; give it
  // each preset's own floor tint so golden hour and night don't stay cool grey.
  if(ctx.floor){
   const presetFloor=presets?.[state.preset]?.floor;
   const targetFloor=presetFloor?new THREE.Color(presetFloor):dayFloor.clone().lerp(nightFloor,n);
   ctx.floor.userData.baseFloor??=ctx.floor.material.color.clone();
   ctx.floor.material.color.copy(ctx.floor.userData.baseFloor).lerp(targetFloor,.62);
  }
  if(rain&&!state.paused){
   const a=rain.geometry.attributes.position;
   for(let i=0;i<a.count;i++){
    let x=a.getX(i)+dt*cfg.weather.wind,y=a.getY(i)-dt*9;
    if(y<.8){y=24;x=rr(-cfg.terrain.width/2,cfg.terrain.width/2);}
    if(x>cfg.terrain.width/2)x=-cfg.terrain.width/2;
    a.setXYZ(i,x,y,a.getZ(i));
   }
   a.needsUpdate=true;
  }
 }

 state.preset=presetNames?(cfg.lighting.default&&presets?.[cfg.lighting.default]?cfg.lighting.default:presetNames[0]):'day';
 if(presetNames)setTime(state.preset);
 update(10);

 return {
  update,setTime,presets:presetNames,current:()=>state.preset,blend:b=>presetBlend(b),
  diagnostics:()=>({preset:state.preset,blendT,nightAmount,exposure:ctx.renderer?.toneMappingExposure,
   keyIntensity:key.intensity,keyColor:key.color.getHexString(),hemiIntensity:hemi.intensity,
   sky:'gradient',windowColor:M.warm.color.getHexString(),
   unlitColor:M.windowDark.color.getHexString(),windowEmission:M.warm.emissiveIntensity,
   bulbColor:streetLampBulb.color.getHexString(),bulbEmission:streetLampBulb.emissiveIntensity,
   bloom:ctx.bloom.strength,weather:cfg.weather.preset,rainPoints:rain?cfg.weather.rainCount:0})
 };
}
