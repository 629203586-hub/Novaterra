import * as T from 'three';
export function createChongqingLife(ctx,layout,actors){
 const{M,mat,state,scene}=ctx,{part}=actors;
 const carRoots=[],trainWheels=[],trainPaint=mat('#e1e3d7'),trainGreen=mat('#408c63'),trainGlass=mat('#263e46');
 for(let car=0;car<3;car++){
  const root=new T.Group();root.name='Line 2 monorail car '+car;scene.add(root);carRoots.push(root);
  const p=(kind,m,x,y,z,w,h,d,rx=0,ry=0,rz=0)=>part(root,kind,m,x,y,z,w,h,d,rx,ry,rz);
  p('bevel',trainPaint,0,.96,0,1.34,1.36,3.25);p('box',M.dark,0,.26,0,.85,.20,2.7);
  for(const side of[-1,1]){p('box',trainGreen,side*.68,.64,0,.035,.17,2.96);for(let i=-2;i<=2;i++){p('box',trainGlass,side*.686,1.13,i*.54,.024,.49,.44);p('box',M.metal,side*.705,.95,i*.54,.023,.045,.45);}for(const z of[-.54,.54]){p('box',trainPaint,side*.712,1.1,z,.034,.94,.055);p('box',M.metal,side*.72,.65,z,.02,.03,.28);}}
  p('bevel',M.white,0,1.71,0,1.31,.17,3.1);p('box',M.stoneLight,0,1.85,-.3,.69,.16,.95);
  for(const z of[-1.57,1.57]){p('box',trainGreen,0,1.03,z,1.15,1.08,.11);p('box',trainGlass,0,1.21,z*1.035,.92,.55,.026,.10);for(const x of[-.4,.4])p('box',M.lamp,x,.72,z*1.045,.11,.10,.025);}
  for(const z of[-.94,.94]){const wheel=new T.Group();wheel.position.set(0,.18,z);root.add(wheel);for(const s of[-1,1])part(wheel,'cyl',M.black,s*.28,0,0,.13,.12,.13,0,0,Math.PI/2);trainWheels.push(wheel);}
 }
 const upper=[];for(let i=0;i<4;i++){const p=actors.character(40+i);p.mode='browsing';p.root.scale.multiplyScalar(.83);upper.push(p);}
 const boats=[];
 for(let i=0;i<2;i++){
  const root=new T.Group();root.name='Jialing river cruise';scene.add(root);boats.push(root);const p=(kind,m,x,y,z,w,h,d,rx=0,ry=0,rz=0)=>part(root,kind,m,x,y,z,w,h,d,rx,ry,rz);
  p('bevel',M.dark,0,.13,0,1.83,.65,5.7);p('bevel',M.woodLight,0,.48,0,2.04,.13,5.9);p('box',M.white,0,.92,-.05,1.47,.8,4.5);for(const s of[-1,1]){for(let j=-3;j<=3;j++)p('box',M.warm,s*.75,1.0,j*.54,.025,.39,.42);p('box',M.maroon,s*.79,.68,0,.09,.12,4.8);for(let j=-4;j<=4;j++)p('cyl',M.cream,s*.96,.78,j*.58,.022,.47,.022);p('box',M.cream,s*.96,1.02,0,.04,.04,5.7);}
  p('bevel',M.maroon,0,1.42,0,1.75,.16,4.9);p('box',M.cream,0,1.7,-.8,1.28,.52,1.2);p('box',M.glass,0,1.75,-.18,1.0,.28,.035);p('bevel',M.maroon,0,2.0,-.8,1.5,.12,1.5);p('cyl',M.iron,0,2.3,-.9,.025,.6,.025);p('box',M.red,.19,2.45,-.9,.36,.23,.018);
 }
 let trainTime=0,boost=0,monorail=true;const length=layout.track.getLength(),stationDistance=9;
 const boatCurve=new T.CatmullRomCurve3([[-25,.03,16],[-7,.03,16.7],[12,.03,18.5],[15,.03,20],[-7,.03,20.5],[-25,.03,19.2]].map(p=>new T.Vector3(...p)),true,'catmullrom',.25);
 function update(dt){if(!state.paused&&monorail){trainTime+=dt*(boost>0?1.45:1);boost=Math.max(0,boost-dt);}const phase=trainTime%40,u=Math.max(0,Math.min(1,(phase-4)/36)),ease=u-Math.sin(u*Math.PI*2)/(Math.PI*2),distance=stationDistance+length*ease;
  for(let i=0;i<3;i++){const d=((distance+(i-1)*3.43)%length+length)%length,p=layout.track.getPointAt(d/length),v=layout.track.getTangentAt(d/length);carRoots[i].position.set(p.x,9.65,p.z);carRoots[i].rotation.y=Math.atan2(v.x,v.z);}trainWheels.forEach(w=>w.rotation.x=-trainTime*2.1);
  for(let i=0;i<boats.length;i++){const u=((state.time*.0068+i*.51)%1+1)%1,p=boatCurve.getPointAt(u),v=boatCurve.getTangentAt(u);boats[i].position.copy(p);boats[i].position.y=.03+Math.sin(state.time*.68+i)*.028;boats[i].rotation.set(Math.sin(state.time*.43+i)*.012,Math.atan2(v.x,v.z),Math.sin(state.time*.56+i)*.018);}
  for(let i=0;i<upper.length;i++){const p=upper[i],a=state.pedTime*.15+i*Math.PI/2;actors.pose(p,state.people&&!state.paused,dt);p.root.position.set(-1+Math.sin(a)*5.4,2.31,2.88);p.root.rotation.y=Math.cos(a)>0?Math.PI/2:-Math.PI/2;p.walkDistance=state.pedTime*.43+i*.7;p.root.visible=state.peopleMode!=='hidden';}
 }
 update(0);return{update,trainRoots:carRoots,boats,upper,call(){boost=9;monorail=true;},toggle(){monorail=!monorail;return monorail;},diagnostics:()=>({trainTime,trainPositions:carRoots.map(r=>r.position.toArray()),stationOpening:layout.station.opening,boatPositions:boats.map(r=>r.position.toArray()),monorail})};
}
