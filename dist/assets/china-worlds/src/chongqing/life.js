import * as T from 'three';
/** Little Worlds actors inhabit the restored original Chongqing's authored elevations. */
export function createChongqingLife(ctx,layout,actors){
 const{state}=ctx,S=layout.scale;
 const people=layout.personSpecs.map((spec,i)=>{const p=actors.character(40+i);p.root.scale.multiplyScalar(S*.46);p.mode=i<24?'walking':i<42?'walking':'browsing';p.source=spec;p.root.position.set(spec.x*S,spec.y*S,spec.z*S);p.customDistance=0;p.customPrevious=null;return p;});
 const sync=actors.batch();
 function update(dt){layout.original.update(dt);const moving=state.people&&!state.paused;
  for(let i=0;i<people.length;i++){const p=people[i],spec=p.source;let x=spec.x,y=spec.y,z=spec.z,heading=Math.PI;
   if(i<24){const initial=(spec.y-2.78)/.135,phase=((initial+state.pedTime*.9*(i%2?-1:1))%78+78)%78,step=phase<39?phase:78-phase,up=(phase<39?1:-1)*(i%2?-1:1);x=-14.1+(i%2?.29:-.29);z=7.9-step*.24;y=2.78+step*.135;heading=up>0?Math.PI:0;}
   else if(i<42){const initial=Math.asin(T.MathUtils.clamp((spec.x+5)/11.8,-.995,.995)),a=(i%2?Math.PI-initial:initial)+state.pedTime*.025;x=-5+Math.sin(a)*11.8;z=8.93+Math.cos(a)*.035;y=2.68;heading=Math.atan2(Math.cos(a)*11.8,-Math.sin(a)*.035);}
   const next=new T.Vector3(x*S,y*S,z*S);if(p.customPrevious&&moving&&i<42)p.customDistance+=next.distanceTo(p.customPrevious);p.walkDistance=p.customDistance;actors.pose(p,moving&&i<42,dt);p.root.position.copy(next);
   if(!p.customPrevious)p.root.rotation.y=heading;else if(moving){const d=Math.atan2(Math.sin(heading-p.root.rotation.y),Math.cos(heading-p.root.rotation.y));p.root.rotation.y+=d*(1-Math.exp(-7*dt));}p.customPrevious=next;p.root.visible=state.peopleMode!=='hidden';
  }
 }
 function cycle(kind){const key=kind+'Mode',modes=['active','paused','hidden'];state[key]=modes[(modes.indexOf(state[key])+1)%3];state[kind]=state[key]==='active';return state[key];}
 update(0);sync();return{update,sync,cycle,people,upper:people,trainRoots:layout.original.trainCars,boats:layout.original.boats,call:()=>layout.original.call(),diagnostics:()=>({provenance:layout.provenance,trainPositions:layout.original.trainCars.map(r=>r.position.clone().multiplyScalar(S).toArray()),trainVisible:layout.original.trainCars.map(r=>r.visible),people:people.map(p=>({position:p.root.position.toArray(),visible:p.root.visible,mode:p.mode})),boatPositions:layout.original.boats.map(b=>b.group.position.clone().multiplyScalar(S).toArray()),peopleMode:state.peopleMode,trafficMode:state.trafficMode})};
}
