import * as T from 'three';
export function createChongqingLighting(ctx){
 const{scene,state,M,renderer,emissives,streetLampBulb,streetLampDayColor,streetLampNightColor,windowNightColors,nightLights}=ctx;
 const hemi=new T.HemisphereLight('#bed4dc','#777461',1.15);scene.add(hemi);
 const sun=new T.DirectionalLight('#ffe8c2',2.6);sun.position.set(-30,48,24);sun.target.position.set(0,5,0);sun.castShadow=true;sun.shadow.mapSize.set(ctx.economy?1024:2048,ctx.economy?1024:2048);Object.assign(sun.shadow.camera,{left:-45,right:45,top:40,bottom:-38,near:1,far:160});sun.shadow.bias=-.00018;sun.shadow.normalBias=.035;sun.shadow.radius=3;scene.add(sun,sun.target);
 const fill=new T.DirectionalLight('#a2bfcd',.4);fill.position.set(30,22,-20);scene.add(fill);
 const local=[[-6,5.2,3.2],[8,6,3.2],[-17,11,-6],[-7,1.8,9.4]].map(([x,y,z])=>{const l=new T.PointLight('#ffc080',4,6,2);l.position.set(x,y,z);scene.add(l);nightLights.push({l,power:4});return l;});
 const sky=document.createElement('canvas');sky.width=16;sky.height=256;const painter=sky.getContext('2d'),skyTexture=new T.CanvasTexture(sky);skyTexture.colorSpace=T.SRGBColorSpace;scene.background=skyTexture;
 const modes={day:{top:'#96cfd7',bottom:'#e1e9d0',sun:'#fff0d3',key:2.6,hemi:2.0,exposure:1.05,lamps:0,water:'#247f8a',pos:[-28,48,28]},sunset:{top:'#bfd1d1',bottom:'#e8d8b9',sun:'#ffd1a3',key:2.8,hemi:1.1,exposure:1.04,lamps:.48,water:'#628d88',pos:[-37,21,30]},night:{top:'#14273d',bottom:'#53697a',sun:'#a9bfe3',key:.56,hemi:.77,exposure:1.14,lamps:1,water:'#284856',pos:[-28,46,24]}};
 let blend=state.timeMode==='night'?1:0,sunset=state.timeMode==='sunset'?1:0,lastSky='';const C=x=>new T.Color(x),lerp=(key)=>T.MathUtils.lerp(T.MathUtils.lerp(modes.day[key],modes.night[key],blend),modes.sunset[key],sunset),color=(key)=>C(modes.day[key]).lerp(C(modes.night[key]),blend).lerp(C(modes.sunset[key]),sunset);
 function update(dt){blend=T.MathUtils.damp(blend,state.timeMode==='night'?1:0,2.3,dt);sunset=T.MathUtils.damp(sunset,state.timeMode==='sunset'?1:0,2.3,dt);const top=color('top'),bottom=color('bottom'),finger=top.getHexString()+bottom.getHexString();if(finger!==lastSky){const g=painter.createLinearGradient(0,0,0,256);g.addColorStop(0,'#'+top.getHexString());g.addColorStop(1,'#'+bottom.getHexString());painter.fillStyle=g;painter.fillRect(0,0,16,256);skyTexture.needsUpdate=true;lastSky=finger;}
  sun.color.copy(color('sun'));sun.intensity=lerp('key');hemi.intensity=lerp('hemi');hemi.color.set('#bed1d7').lerp(C('#8ba6c9'),blend);hemi.groundColor.set('#7c7562').lerp(C('#414759'),blend);const p=new T.Vector3(...modes.day.pos).lerp(new T.Vector3(...modes.night.pos),blend).lerp(new T.Vector3(...modes.sunset.pos),sunset);sun.position.copy(p);fill.intensity=.35+.1*blend;renderer.toneMappingExposure=lerp('exposure');
  const lamps=lerp('lamps')*(state.lightsOn?1:0);for(const m of emissives)m.emissiveIntensity=(m.userData.nightEmission??1)*lamps*(m.userData.architectural?.65:m.userData.signage?.56:.8);
  for(let i=0;i<2;i++){const m=[M.warm,M.warmDim][i];m.color.copy(C(i?'#86aaa2':'#d6c397')).lerp(windowNightColors[i],lamps*.86);m.emissiveIntensity=m.userData.nightEmission*lamps*.8;}
  streetLampBulb.color.copy(streetLampDayColor).lerp(streetLampNightColor,lamps);streetLampBulb.emissiveIntensity=1.6*lamps;for(const{l,power}of nightLights)l.intensity=power*lamps;ctx.signage.glowMat.opacity=.1*lamps;ctx.bloom.strength=(ctx.economy?.10:.16)*lamps;ctx.bloom.threshold=1.18;ctx.bloom.radius=.35;
  scene.fog.color.copy(bottom);const d=ctx.camera.position.distanceTo(ctx.controls.target);scene.fog.near=d+(state.fogOn?-3:35);scene.fog.far=d+(state.fogOn?80:190);
  return{waterColor:color('water'),skyColor:bottom};
 }
 update(10);return{update,lights:[hemi,sun,fill,...local],diagnostics:()=>({timeMode:state.timeMode,windowEmission:M.warm.emissiveIntensity,gradientSteps:ctx.gradient.image.width,shadowMap:sun.shadow.mapSize.x,nightBlend:blend,sunsetBlend:sunset}),dispose(){skyTexture.dispose();}};
}
