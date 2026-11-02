import * as THREE from '../../vendor/three/build/three.module.js';
import {distanceToPolyline} from '../world/terrain.js';
export function createSimulation(ctx,layout,actors){
const {state,scene,mat,M,random,rr,pick}=ctx,clamp=THREE.MathUtils.clamp,cfg=ctx.config;
const {people,trafficRoots,character,pose,car}=actors;
function signalPart(parent,kind,m,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){return actors.part(parent,kind,m,x,y,z,sx,sy,sz,rx,ry,rz);}
function routePoint(p,progress=p.progress){const a=p.path[p.segment],b=p.path[(p.segment+p.direction+p.path.length)%p.path.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz)||1;return{x:a[0]+dx*progress,z:a[1]+dz*progress,dx:dx/length,dz:dz/length,length};}

// ---------------------------------------------------------------- activity zones
// Authored layout.activities drive settled behaviour. Positions are walked into
// the ground plane, nudged out of registered prop footprints and faced at the
// thing they care about (fountain, stall, table, group) unless layout supplies
// yaw/rotation. Nothing here is random: every mode reads the same authored data.
const GROUND_Y=.81,SEAT_TOP=1.265;
const gh=(x,z)=>((ctx.layout&&ctx.layout.groundHeight)?ctx.layout.groundHeight(x,z):GROUND_Y-.01);
const ACTIVITY_MODES={dining:1,waiting:1,browsing:1,socializing:1,'taking-photo':1};
function yawTo(x,z,tx,tz){return Math.atan2(tx-x,tz-z);}
function nearestObstacle(x,z,re,maxDist=Infinity){let best=null,bestD=Infinity;for(const o of ctx.obstacles){if(!o||!re.test(o.label||''))continue;const d=Math.hypot(x-o.x,z-o.z);if(d<bestD&&d<maxDist){bestD=d;best=o;}}return best;}
// Push a standing spot out of prop/bench/car footprints (half extents are w,d).
function nudgeStanding(x,z,pad=.14){
 const bx=cfg.terrain.width/2-1,bz=cfg.terrain.depth/2-1;let px=clamp(x,-bx,bx),pz=clamp(z,-bz,bz);
 for(let pass=0;pass<4;pass++){
  let moved=false;
  for(const o of ctx.obstacles){
   if(!o||!isFinite(o.w)||!isFinite(o.d)||o.w>6||o.d>6)continue;
   const hw=o.w+pad,hd=o.d+pad,dx=px-o.x,dz=pz-o.z;
   if(Math.abs(dx)<hw&&Math.abs(dz)<hd){
    const ox=hw-Math.abs(dx),oz=hd-Math.abs(dz);
    if(ox<=oz)px=o.x+Math.sign(dx||1)*hw;else pz=o.z+Math.sign(dz||1)*hd;
    moved=true;
   }
  }
  if(!moved)break;
 }
 return{x:clamp(px,-bx,bx),z:clamp(pz,-bz,bz)};
}
function activityTarget(a,x,z){
 if(Array.isArray(a.target)&&a.target.length>=2&&isFinite(a.target[0])&&isFinite(a.target[1]))return{x:+a.target[0],z:+a.target[1]};
 if(Array.isArray(a.lookAt)&&a.lookAt.length>=2)return{x:+a.lookAt[0],z:+a.lookAt[1]};
 if(a.mode==='waiting')return nearestObstacle(x,z,/fountain/i)||{x:0,z:1.4};
 if(a.mode==='browsing')return nearestObstacle(x,z,/market|stall|stand/i);
 if(a.mode==='taking-photo'){const f=nearestObstacle(x,z,/fountain/i,9);return f||{x:0,z:1.4};}
 return null;
}
function resolveActivity(a){
 if(!a||!ACTIVITY_MODES[a.mode])return null;
 const x=+a.x,z=+a.z;if(!isFinite(x)||!isFinite(z))return null;
 if(a.mode==='dining'){
  // x,z is the chair seat. Face the table; never nudge a diner off the chair.
  let yaw=a.yaw??a.rotation;
  if(yaw==null){const t=nearestObstacle(x,z,/cafe set|cafe table|table/i);yaw=t?yawTo(x,z,t.x,t.z):Math.PI;}
  return{x,z,yaw,sitting:true};
 }
 const p=nudgeStanding(x,z,.15);
 let yaw=a.yaw??a.rotation;
 if(yaw==null){
  const t=activityTarget(a,p.x,p.z);
  yaw=t?yawTo(p.x,p.z,t.x,t.z):(a.mode==='browsing'?Math.PI/2:Math.PI);
 }
 return{x:p.x,z:p.z,yaw,sitting:false};
}
function bindActivity(p,a){
 const r=resolveActivity(a);if(!r)return false;
 p.activity=a;p.mode=a.mode;p.zone={x:r.x,z:r.z,yaw:r.yaw};
 p.root.position.set(r.x,gh(r.x,r.z)+.01,r.z);
 p.root.rotation.y=r.yaw;
 if(a.mode==='dining'){
  const seatTop=isFinite(a.seatY)?+a.seatY:gh(r.x,r.z)+SEAT_TOP-GROUND_Y;
  p.sittingRootY=seatTop-.02-p.hipY*p.height;
  p.root.position.y=p.sittingRootY;
 }
 return true;
}
// Socialising is a group behaviour: members of a group form a loose ring and
// face its middle, so pairs/trios read as conversation instead of people
// staring at nothing. A `group` field overrides the proximity cluster.
function setupSocialGroups(){
 const socials=people.filter(p=>p.zone&&p.mode==='socializing');
 if(!socials.length)return;
 const groups=new Map();
 for(const p of socials){
  const key=p.activity&&p.activity.group!=null?String(p.activity.group):'piazza';
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(p);
 }
 for(const members of groups.values()){
  const cx=members.reduce((s,p)=>s+p.zone.x,0)/members.length;
  const cz=members.reduce((s,p)=>s+p.zone.z,0)/members.length;
  members.forEach((p,i)=>{
   if(members.length<2){
    // a lone socialiser leans into the nearest landmark and gestures
    const f=nearestObstacle(p.zone.x,p.zone.z,/fountain/i)||{x:cx,z:cz+3};
    p.zone.yaw=yawTo(p.zone.x,p.zone.z,f.x,f.z);
    p.root.rotation.y=p.zone.yaw;p.baseYaw=p.zone.yaw;p.soloSocial=true;return;
   }
   const ang=i/members.length*Math.PI*2+Math.PI*.5;
   const spot=nudgeStanding(cx+Math.cos(ang)*.60,cz+Math.sin(ang)*.60,.12);
   p.zone.x=spot.x;p.zone.z=spot.z;
   p.root.position.set(spot.x,gh(spot.x,spot.z)+.01,spot.z);
   p.zone.yaw=yawTo(spot.x,spot.z,cx,cz);
   p.root.rotation.y=p.zone.yaw;p.baseYaw=p.zone.yaw;p.socialGroup={cx,cz};
  });
 }
}

// ---------------------------------------------------------------- navigation
function pedestrianSpace(x,z,r=.18){
 if(Math.abs(x)>cfg.terrain.width/2-.5||Math.abs(z)>cfg.terrain.depth/2-.5)return false;
 if(distanceToPolyline(x,z,layout.roadPoints)<layout.roadWidth/2+r)return false;
 return !ctx.obstacles.some(b=>Math.abs(x-b.x)<b.w+r&&Math.abs(z-b.z)<b.d+r);
}
function assignRoute(p,route,offset){
 p.path=route.map(a=>[...a]);if(p.index%2)p.path.reverse();p.direction=1;p.lane=.25+(p.index%3)*.005;p.baseLane=p.lane;p.blockedTime=0;
 const lengths=p.path.map((a,i)=>{const b=p.path[(i+1)%p.path.length];return Math.hypot(b[0]-a[0],b[1]-a[1]);}),total=lengths.reduce((a,b)=>a+b,0);
 const start=((p.index*.61803398875)%1)*total;
 for(let attempt=0;attempt<80;attempt++){
  let distance=(start+attempt*.79)%total;p.segment=0;while(distance>lengths[p.segment]&&p.segment<lengths.length-1){distance-=lengths[p.segment++];}p.progress=distance/(lengths[p.segment]||1);
  const q=routePoint(p),x=q.x+q.dz*p.lane,z=q.z-q.dx*p.lane;
  if(pedestrianSpace(x,z)&&people.every(o=>o===p||Math.hypot(x-o.root.position.x,z-o.root.position.z)>.72)){p.root.position.set(x,gh(x,z)+.01,z);p.root.rotation.y=Math.atan2(q.dx,q.dz);return true;}
 }
 p.spawnFailed=true;p.root.visible=false;return false;
}

const crossers=[];
const count=ctx.economy?Math.min(cfg.people.count,cfg.people.economyCount):cfg.people.count;
const crossingCount=count>=4&&layout.crossings.length?Math.min(layout.crossings.length*2,Math.floor(count*.25)):0;
for(let i=0;i<crossingCount;i++){
 const p=character(i),path=layout.crossings[Math.floor(i/2)%layout.crossings.length];
 p.mode='crossing-wait';p.cross={a:[...path.a],b:[...path.b],u:0,active:false,cycle:-1,delay:(i%2)*.37,speed:1.65*cfg.people.speedScale};
 if(i%2)[p.cross.a,p.cross.b]=[p.cross.b,p.cross.a];const a=p.cross.a,b=p.cross.b,len=Math.hypot(b[0]-a[0],b[1]-a[1]);
 p.root.position.set(a[0]+(b[1]-a[1])/len*.18,gh(a[0],a[1])+.01,a[1]-(b[0]-a[0])/len*.18);crossers.push(p);
}
const activities=Array.isArray(layout.activities)?layout.activities:[];
let activityCount=0;
for(let i=crossingCount;i<count;i++){
 const activity=count>=10?activities[activityCount]:null;
 if(activity)activityCount++;
 const p=activity?character(i,{mode:activity.mode}):character(i);
 p.speed*=cfg.people.speedScale;
 if(!(activity&&bindActivity(p,activity)))assignRoute(p,layout.footRoutes[i%layout.footRoutes.length],0);
}
// walkers that follow an unbound activity still get a route
for(const p of people){if(!p.zone&&!p.cross&&!p.path)assignRoute(p,layout.footRoutes[p.index%layout.footRoutes.length],0);}
setupSocialGroups();

const paths=layout.lanes.map(lane=>{
 const length=lane.curve.getLength();let u=0,best=Infinity;
 for(let i=0;i<=2000;i++){const p=lane.curve.getPointAt(i/2000),d=Math.hypot(p.x-lane.stopPoint[0],p.z-lane.stopPoint[1]);if(d<best){best=d;u=i/2000;}}
 return {...lane,length,stopBase:lane.stopBase??u*length,exitDistance:lane.exitDistance??9};
});
const vehicles=[];
for(let i=0;i<cfg.traffic.count;i++){
 // Italian traffic mix: Ape delivery trike, Fiat 500, Vespa or the local navetta.
 const fleet=cfg.traffic.fleet??['ape','mini','scooter','mini','bus'];
 const path=paths[i%paths.length],type=fleet[i%fleet.length],model=car(type,pick([M.paintBlue,M.paintYellow,M.paintGreen,M.paintWhite,M.cream,M.paintRed]));
 const s=path.length*(i+.15)/cfg.traffic.count,p=path.curve.getPointAt(s/path.length),t=path.curve.getTangentAt(s/path.length);
 model.root.position.copy(p);model.root.rotation.y=Math.atan2(t.x,t.z);
 vehicles.push({...model,path,s,speed:0,maxSpeed:(type==='bus'?2.0:type==='ape'?1.9:type==='scooter'?2.9:rr(2.2,2.7))*cfg.traffic.speedScale,dwell:0,busServed:false,committed:s>path.stopBase-model.length/2-.25,lap:0,travel:0,mode:'driving'});
}
// Parked vehicles from the authored layout: static colour on the piazza edge.
const parkedVehicles=[];
for(const spot of (layout.parked??[])){
 const model=car(spot.type,spot.color??pick([M.paintBlue,M.paintYellow,M.paintGreen,M.paintWhite,M.cream,M.paintRed]));
 model.root.position.set(spot.x,.66,spot.z);model.root.rotation.y=spot.rot??0;
 model.root.scale.setScalar(1.12);
 parkedVehicles.push(model);
}
for(const v of vehicles)v.root.scale.setScalar(1.12);
const signalPlan=cfg.traffic.signalPlan;
function crossingBusy(){return state.peopleMode!=='hidden'&&crossers.some(p=>p.root.visible&&p.cross.active);}
function junctionBusy(){const j=layout.junction;return state.trafficMode!=='hidden'&&vehicles.some(v=>{const a=v.root.rotation.y,rx=Math.abs(Math.sin(a))*v.length/2+Math.abs(Math.cos(a))*v.width/2,rz=Math.abs(Math.cos(a))*v.length/2+Math.abs(Math.sin(a))*v.width/2;return v.root.visible&&v.committed&&Math.abs(v.root.position.x-j.x)<j.w+rx&&Math.abs(v.root.position.z-j.z)<j.d+rz;});}
const junctionController={index:0,elapsed:0,cycle:0};
function signalAt(){if(!cfg.traffic.signals)return{stage:'ALL',phase:'ALL',walk:true,elapsed:1,remaining:Infinity,cycle:Math.floor(state.time/8)};const [stage,duration]=signalPlan[junctionController.index];return{stage,phase:stage.includes('CLEAR')?'CLEAR':stage,elapsed:junctionController.elapsed,remaining:Math.max(0,duration-junctionController.elapsed),cycle:junctionController.cycle,c:junctionController.elapsed,walk:stage==='PED'};}
function advanceSignal(dt){
 if(!cfg.traffic.signals)return;
 junctionController.elapsed+=dt;const [stage,duration]=signalPlan[junctionController.index];
 if(junctionController.elapsed<duration)return;
 if(stage.endsWith('_CLEAR')&&stage!=='PED_CLEAR'){if(junctionBusy()||crossingBusy())return;}
 if(stage==='PED_CLEAR'&&crossingBusy())return;
 junctionController.index=(junctionController.index+1)%signalPlan.length;junctionController.elapsed=0;if(junctionController.index===0)junctionController.cycle++;
}
const redLamp=mat('#641b16',{emissive:'#f42f15',emissiveIntensity:2.3}),greenLamp=mat('#0a654d',{emissive:'#43c68a',emissiveIntensity:2.0}),amberLamp=mat('#9b661d',{emissive:'#ffb22b',emissiveIntensity:2.0});
const signalMeshes=[];
function trafficSignal(x,z,axis,rot=0){const g=new THREE.Group();g.position.set(x,.8,z);g.rotation.y=rot;scene.add(g);signalPart(g,'cyl',M.iron,0,2.5,0,.055,5,.055);signalPart(g,'box',M.iron,.8,4.85,0,1.8,.07,.07);signalPart(g,'box',M.black,1.2,4.65,0,1.05,.40,.35);const lamps=[];for(let i=0;i<3;i++)lamps.push(signalPart(g,'round',[redLamp,amberLamp,greenLamp][i],.88+i*.31,4.66,.19,.105,.105,.05));signalPart(g,'box',M.black,.14,1.7,.06,.30,.5,.17);const walk=signalPart(g,'box',greenLamp,.14,1.72,.16,.10,.23,.025),dontWalk=signalPart(g,'box',redLamp,.14,1.72,.16,.10,.23,.025);signalMeshes.push({axis,lamps,walk,dontWalk});}
if(cfg.traffic.signals)for(const s of layout.signals)trafficSignal(s.x,s.z,s.axis,s.rotation??0);
function updateSignals(sig){for(const s of signalMeshes){const green=(sig.phase===s.axis||sig.phase==='ALL'),amber=sig.phase===s.axis+'_AMBER';s.lamps[0].scale.set(green||amber?.055:.105,green||amber?.055:.105,.05);s.lamps[1].scale.set(amber?.105:.05,amber?.105:.05,.05);s.lamps[2].scale.set(green?.105:.05,green?.105:.05,.05);s.lamps[0].userData.agentVisible=!green&&!amber;s.lamps[1].userData.agentVisible=amber;s.lamps[2].userData.agentVisible=green;s.walk.userData.agentVisible=sig.walk;s.dontWalk.userData.agentVisible=!sig.walk;}}

const pendingRestoration={traffic:false,people:false};
function prepareAgentRestore(kind){pendingRestoration[kind]=kind==='traffic'?crossingBusy():junctionBusy();if(pendingRestoration[kind])state[kind]=false;}
let busWaiting=false;
function updateCars(dt,sig){
 const pedestrianOccupied=crossingBusy()||pendingRestoration.people;busWaiting=false;
 for(const v of vehicles){
  let target=v.maxSpeed,hardLimit=Infinity;const stop=v.path.stopBase-v.length/2-.25,green=sig.phase===v.path.axis||sig.phase==='ALL';
  v.mode='driving';
  // A vehicle may cross its stop line only on green; committed traffic clears it.
  if(!v.committed&&(!green||pedestrianOccupied)){
   hardLimit=stop;const gap=Math.max(0,stop-v.s);target=Math.min(target,Math.sqrt(2*3.6*gap));v.mode=gap<.15?'red-light':'braking';
  }
  if(v.type==='bus'&&v.path.busStop!=null&&!v.busServed){
   const stopS=v.path.busStop;hardLimit=Math.min(hardLimit,stopS);target=Math.min(target,Math.sqrt(Math.max(0,6*(stopS-v.s))));
   if(v.s>=stopS-.03){v.s=stopS;v.dwell+=dt;target=0;v.mode='bus-stop';busWaiting=true;if(v.dwell>=3.6){v.busServed=true;v.dwell=0;}}
  }
  const point=v.root.position,forward=v.path.curve.getTangentAt(clamp(v.s/v.path.length,0,1));let allowedStep=Infinity;
  for(const other of vehicles){if(other===v)continue;
   const ox=other.root.position.x-point.x,oz=other.root.position.z-point.z,ahead=ox*forward.x+oz*forward.z,side=Math.abs(ox*forward.z-oz*forward.x);
   if(ahead<=0||side>=(v.width+other.width)*.5+.13)continue;
   const otherForward=other.path.curve.getTangentAt(clamp(other.s/other.path.length,0,1)),alignment=Math.abs(forward.dot(otherForward));
   const frontRadius=other.length*.5*alignment+other.width*.5*(1-alignment),gap=ahead-v.length*.5-frontRadius-.65;
   if(gap<7){target=Math.min(target,Math.sqrt(Math.max(0,7.6*gap)));allowedStep=Math.min(allowedStep,Math.max(0,gap));if(gap<.3)v.mode='queue';}
  }
  // Do not enter an intersection whose exit lane is already backed up.
  if(!v.committed&&green&&v.s>stop-3){
   const exitU=clamp((stop+v.length+v.path.exitDistance)/v.path.length,0,1),exit=v.path.curve.getPointAt(exitU),exitDirection=v.path.curve.getTangentAt(exitU);
   if(vehicles.some(o=>{if(o===v||o.speed>=.1)return false;const dx=o.root.position.x-exit.x,dz=o.root.position.z-exit.z;return Math.abs(dx*exitDirection.x+dz*exitDirection.z)<(v.length+o.length)*.5+.6&&Math.abs(dx*exitDirection.z-dz*exitDirection.x)<(v.width+o.width)*.5+.15;})){hardLimit=Math.min(hardLimit,stop);target=Math.min(target,Math.sqrt(Math.max(0,7.2*(stop-v.s))));v.mode='exit-blocked';}
  }
  const accel=target>v.speed?1.45:4.6;v.speed+=clamp(target-v.speed,-accel*dt,accel*dt);
  const step=Math.min(v.speed*dt,allowedStep,Math.max(0,hardLimit-v.s));
  if(!v.committed&&green&&!pedestrianOccupied&&v.s+step>stop+.0001)v.committed=true;
  v.s+=step;v.travel+=step;
  if(v.s>v.path.length+.05){
   const entrance=v.path.curve.getPointAt(0),entryDirection=v.path.curve.getTangentAt(0);
   if(vehicles.some(o=>{if(o===v)return false;const d=o.root.position.clone().sub(entrance);return Math.abs(d.dot(entryDirection))<(v.length+o.length)*.5+1&&Math.abs(d.x*entryDirection.z-d.z*entryDirection.x)<(v.width+o.width)*.5+.25;})){v.s=v.path.length+.1;v.speed=0;v.mode='entry-wait';continue;}
   v.lap++;v.path=paths.find(p=>p.id===v.path.next?.[v.lap%v.path.next.length])??v.path;v.s=0;v.speed=0;v.busServed=false;v.dwell=0;v.committed=false;
  }
  const u=clamp(v.s/v.path.length,0,1),p=v.path.curve.getPointAt(u),tangent=v.path.curve.getTangentAt(u);v.root.position.copy(p);v.root.rotation.y=Math.atan2(tangent.x,tangent.z);v.wheels.forEach(w=>w.rotation.x=v.travel/.25);if(v.s>=v.path.length)v.s=v.path.length+.1;
 }
}
function walkCandidate(p,advance,lane){
 let segment=p.segment,progress=p.progress,distance=advance;const n=p.path.length;
 for(let i=0;i<n;i++){const a=p.path[segment],b=p.path[(segment+p.direction+n)%n],length=Math.hypot(b[0]-a[0],b[1]-a[1])||1,remaining=(1-progress)*length;
  if(distance<=remaining){progress+=distance/length;const dx=(b[0]-a[0])/length,dz=(b[1]-a[1])/length;return{x:a[0]+(b[0]-a[0])*progress+dz*lane,z:a[1]+(b[1]-a[1])*progress-dx*lane,dx,dz,segment,progress};}
  distance-=remaining;segment=(segment+p.direction+n)%n;progress=0;
 }
 return null;
}
// Activity agents hold their authored spot; they still sway/talk/sip through
// pose() and social groups face each other. Return value says whether the agent
// moved this frame (walk cycle vs idle animation).
function updateZone(p,dt){
 if(p.mode==='socializing'&&p.socialGroup){
  // a very slow conversational sway keeps the ring from looking frozen
  const s=Math.sin(state.pedTime*.35+p.phase)*.02;
  p.root.rotation.y=p.baseYaw+s;
 }
 return false;
}
function updatePeople(dt,sig){
 const crossingAllowed=sig.walk&&sig.elapsed<2.1&&!junctionBusy()&&!pendingRestoration.traffic;
 for(const p of people){let moving=false;
  if(p.cross){const c=p.cross;
   if(!c.active&&c.cycle!==sig.cycle&&crossingAllowed&&sig.elapsed>c.delay){c.active=true;c.cycle=sig.cycle;c.u=0;p.mode='crossing';}
   if(c.active){const dx=c.b[0]-c.a[0],dz=c.b[1]-c.a[1],len=Math.hypot(dx,dz),lateral=.18;
    c.u=Math.min(1,c.u+dt*c.speed/len);p.root.position.x=c.a[0]+dx*c.u+dz/len*lateral;p.root.position.z=c.a[1]+dz*c.u-dx/len*lateral;p.root.rotation.y=Math.atan2(dx,dz);p.walkDistance+=dt*c.speed;moving=true;
    if(c.u===1){c.active=false;[c.a,c.b]=[c.b,c.a];p.mode='crossing-wait';}
   }
  }else if(p.path){
   const q=routePoint(p);let speed=p.speed,targetLane=p.baseLane;
   for(const other of people){if(other===p)continue;const dx=other.root.position.x-p.root.position.x,dz=other.root.position.z-p.root.position.z,ahead=dx*q.dx+dz*q.dz,side=dx*q.dz-dz*q.dx;
    if(ahead>0&&ahead<1.05&&Math.abs(side)<.48){
     const alignment=Math.cos(other.root.rotation.y-p.root.rotation.y),passLane=-p.baseLane,pass=walkCandidate(p,speed*dt,passLane);
     if(alignment>.35&&pass&&pedestrianSpace(pass.x,pass.z)&&people.every(o=>o===p||Math.hypot(pass.x-o.root.position.x,pass.z-o.root.position.z)>.45))targetLane=passLane;
     const gap=Math.hypot(dx,dz)-.57;if(Math.abs(side)<.38)speed=Math.min(speed,Math.max(0,gap*1.7));
    }
   }
   const lane=THREE.MathUtils.lerp(p.lane,targetLane,1-Math.exp(-dt*4)),distance=speed*dt;
   let next=walkCandidate(p,distance,lane),chosenLane=lane;
   if(!next||!pedestrianSpace(next.x,next.z)){next=null;for(const alternative of[p.baseLane,.08,0,-.15,.29]){const tryPoint=walkCandidate(p,distance,alternative);if(tryPoint&&pedestrianSpace(tryPoint.x,tryPoint.z)){next=tryPoint;chosenLane=alternative;break;}}}
   const overlaps=next&&people.some(o=>o!==p&&Math.hypot(next.x-o.root.position.x,next.z-o.root.position.z)<.40);
   if(next&&!overlaps){p.segment=next.segment;p.progress=next.progress;p.lane=chosenLane;const travelled=Math.hypot(next.x-p.root.position.x,next.z-p.root.position.z);p.root.position.x=next.x;p.root.position.z=next.z;p.root.rotation.y=Math.atan2(next.dx,next.dz);p.walkDistance+=travelled;moving=travelled>.0001;p.mode=moving?'walking':'waiting';p.blockedTime=moving?0:p.blockedTime+dt;}
   else{p.blockedTime+=dt;p.mode='waiting';}
   // A blocked walker turns back instead of growing a stationary single-file queue.
   if(p.blockedTime>1.4+(p.index%4)*.25){p.segment=(p.segment+p.direction+p.path.length)%p.path.length;p.direction*=-1;p.progress=1-p.progress;p.lane=-p.lane;p.blockedTime=0;}
  }else if(p.zone){moving=updateZone(p,dt);}
  pose(p,moving,dt,p.mode==='dining');
 }
}


const syncDynamic=actors.batch();let signal=signalAt();updateSignals(signal);for(const p of people)pose(p,false,0,p.mode==='dining');syncDynamic();
function update(dt){
 if(pendingRestoration.traffic&&!crossingBusy()){pendingRestoration.traffic=false;state.traffic=state.trafficMode==='active';}
 if(pendingRestoration.people&&!junctionBusy()){pendingRestoration.people=false;state.people=state.peopleMode==='active';}
 for(const root of trafficRoots)root.visible=state.trafficMode!=='hidden'&&!pendingRestoration.traffic;
 for(const p of people)p.root.visible=!p.spawnFailed&&state.peopleMode!=='hidden'&&!pendingRestoration.people;
 if(!state.paused)advanceSignal(dt);signal=signalAt();
 if(!state.paused){if(state.traffic)updateCars(dt,signal);if(state.people)updatePeople(dt,signal);}
 updateSignals(signal);syncDynamic();
}
function cycle(kind){const old=state[kind+'Mode'],modes=['active','paused','hidden'];pendingRestoration[kind]=false;state[kind+'Mode']=modes[(modes.indexOf(old)+1)%3];state[kind]=state[kind+'Mode']==='active';if(old==='hidden')prepareAgentRestore(kind);update(0);return state[kind+'Mode'];}
function diagnostics(){return {signal:{...signal},pendingRestoration:{...pendingRestoration},people:people.map(p=>({id:p.index,mode:p.mode,position:p.root.position.toArray(),visible:p.root.visible,spawnFailed:!!p.spawnFailed,activity:p.zone?{mode:p.activity?p.activity.mode:null,x:p.zone.x,z:p.zone.z,yaw:p.zone.yaw}:null})),vehicles:vehicles.map(v=>({type:v.type,position:v.root.position.toArray(),speed:v.speed,heading:v.root.rotation.y,mode:v.mode,s:v.s,lap:v.lap,committed:v.committed,visible:v.root.visible})),dynamicBatches:actors.batchCount()};}
return {update,cycle,diagnostics,people,vehicles};
}
