import * as T from 'three';
// Photograph-derived proportions; artistic compression, not a surveyed replica.
export const CATHEDRAL={x:2,z:2.2,radius:6.2,height:14.3};
export function buildLandmarks(k,{M,sign,canvas,mats}){
 const {box,round,ball,cyl,rod,ring,arch,archFill,at,scaled,add}=k;
 function cross(x,y,z,s=1){rod(M.gold,[x,y,z],[x,y+1.05*s,z],.026*s,10);rod(M.gold,[x-.27*s,y+.7*s,z],[x+.27*s,y+.7*s,z],.024*s,10);rod(M.gold,[x-.15*s,y+.93*s,z],[x+.15*s,y+.93*s,z],.018*s,8);rod(M.gold,[x-.15*s,y+.24*s,z],[x+.15*s,y+.34*s,z],.018*s,8);ball(M.gold,x,y,z,.07*s);}
 function band(x,y,z,r,h=.1,m=M.white,n=8){cyl(m,x,y,z,r,h,r,n,Math.PI/8);}
 function window(x,y,z,w,h,ornate=true){archFill(M.dark,x,y,z,w,h);arch(M.trim,x,y-.02,z+.026,w+.12,h+.1,.065,.085);if(ornate){arch(M.white,x,y-.03,z+.11,w+.3,h+.23,.05,.06);box(M.white,x,y-.05,z+.09,w+.38,.075,.2);rod(M.iron,[x,y+.05,z+.045],[x,y+h-.12,z+.045],.012);}}
 // Smooth double-curved onion shell with real ribs and colored enamel segments.
 function onion(x,y,z,r,h,style,c1,c2,twist=.55){
  const N=96,H=44,pos=[],col=[],uv=[],idx=[],a=new T.Color(c1),b=new T.Color(c2),snow=new T.Color('#dce8eb');
  function shape(v){return .005+.52*(1-v)+.65*Math.pow(Math.sin(Math.PI*v),.83);}
  for(let j=0;j<=H;j++){const v=j/H;for(let i=0;i<=N;i++){const u=i/N,theta=u*Math.PI*2,phase=u*12+v*twist*3;let ripple=1+.038*Math.cos(phase*Math.PI*2);let radius=r*shape(v)*ripple;pos.push(x+radius*Math.cos(theta),y+v*h,z+radius*Math.sin(theta));let c;
   if(style==='zigzag')c=(Math.floor(v*12+Math.abs((u*12%1)*2-1)*.7)%2)?a:b;
   else if(style==='diamond')c=(Math.floor(u*16+v*10)+Math.floor(u*16-v*10))%2?a:b;
   else c=(phase%1+.99)%1<.54?a:b;
   const cc=c.clone();if(v>.43&&v<.83&&Math.cos(phase*Math.PI*2)>.88&&Math.sin(theta+.6)>.25)cc.lerp(snow,.63);col.push(cc.r,cc.g,cc.b);uv.push(u,v);
  }}
  for(let j=0;j<H;j++)for(let i=0;i<N;i++){const q=j*(N+1)+i;idx.push(q,q+N+1,q+1,q+1,q+N+1,q+N+2);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();add(g,M.dome);g.dispose();
  // Applied raised seams follow the dome rather than floating above a spherical proxy.
  for(let seam=0;seam<12;seam++){const ps=[];for(let j=0;j<=36;j++){const v=j/36,theta=(seam/12-v*twist*3/12)*Math.PI*2,ra=r*shape(v)*1.04;ps.push(new T.Vector3(x+ra*Math.cos(theta),y+v*h,z+ra*Math.sin(theta)));}const g=new T.TubeGeometry(new T.CatmullRomCurve3(ps),42,.017,4,false);add(g,style==='diamond'?M.gold:M.trim);g.dispose();}
  if(style==='diamond'){
   const colors=[c1,c2].map(color=>{const m=new T.MeshStandardMaterial({color,metalness:.4,roughness:.38});m.name='Raised enamel '+color;mats.push(m);return m;});
   for(let row=1;row<9;row++)for(let i=0;i<20;i++){
    const v=.12+row*.079,theta=(i+(row%2)*.5)/20*Math.PI*2,ra=r*shape(v),rise=(shape(Math.min(.999,v+.005))-shape(v))/.005*r/h;
    const normal=new T.Vector3(Math.cos(theta),-rise,Math.sin(theta)).normalize(),g=new T.ConeGeometry(r*.12*Math.sin(v*Math.PI)+.035,.055,4,1);
    g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),normal));add(g,colors[(row+i)%2],x+ra*Math.cos(theta),y+v*h,z+ra*Math.sin(theta));g.dispose();
   }
  }
  band(x,y-.04,z,r*.58,.1,M.gold,48);cyl(M.gold,x,y+h+.055,z,.045,.18,.035,12);cross(x,y+h+.14,z,.66);
 }
 function kokoshnik(x,y,z,w,h,rot=0){at(x,y,z,rot,()=>{archFill(M.copper,0,0,0,w,h,.09);arch(M.white,0,-.02,.08,w,h,.05,.07);archFill(M.brick,0,.06,.17,w*.72,h*.72,.04);arch(M.trim,0,.05,.21,w*.75,h*.76,.034,.025);});}
 function chapel(x,z,r,base,drum,h,style,c1,c2,twist){
  // Octagonal stepped volume, with properly radial window recesses on every elevation.
  band(x,base/2+.9,z,r*.88,base,M.brick);for(const [y,ra] of[[.94,r*.98],[base+.9,r*.98],[base+1.13,r*.88]])band(x,y,z,ra,.14);
  for(let f=0;f<8;f++){const angle=f*Math.PI/4;at(x,0,z,angle,()=>{box(M.trim,-r*.26,1.25+base*.45,r*.826,.045,base*.67,.06);box(M.trim,r*.26,1.25+base*.45,r*.826,.045,base*.67,.06);window(0,1.35,r*.826,.27,base*.42,false);});}
  // Raised triangular panels and deep brick-to-stone relief at chapel shoulders.
  for(let f=0;f<8;f++)at(x,0,z,f*Math.PI/4,()=>{
   const face=r*.826,lo=1.5,hi=base+.62;
   rod(M.trim,[-r*.33,lo,face+.025],[0,hi,face+.025],.028);rod(M.trim,[0,hi,face+.025],[r*.33,lo,face+.025],.028);
   arch(M.trim,0,base+.55,face+.035,r*.57,.45,.035,.035);
   for(const yy of[1.05,base+.73])box(M.trim,0,yy,face+.035,r*.75,.045,.055);
  });
  const shoulder=base+1.22;
  for(let f=0;f<8;f++){const a=f*Math.PI/4;kokoshnik(x+Math.sin(a)*r*.85,shoulder,z+Math.cos(a)*r*.85,r*.77,.68,a);}
  band(x,shoulder+drum*.5+.38,z,r*.63,drum,M.brick);band(x,shoulder+.43,z,r*.73,.12,M.trim);band(x,shoulder+drum+.39,z,r*.77,.14,M.white);
  for(let f=0;f<8;f++)at(x,0,z,f*Math.PI/4,()=>{window(0,shoulder+.7,r*.59,.18,drum*.68,false);box(M.white,r*.24,shoulder+drum*.5+.4,r*.59,.045,drum*.9,.04);});
  for(let f=0;f<24;f++){const a=f*Math.PI/12;ball(M.gold,x+Math.sin(a)*r*.72,shoulder+drum+.5,z+Math.cos(a)*r*.72,.035);}
  onion(x,shoulder+drum+.5,z,r,h,style,c1,c2,twist);
 }
 at(CATHEDRAL.x,0,CATHEDRAL.z,0,()=>scaled(1.10,.96,1.02,()=>{
  box(M.stone,0,.78,0,10.8,.45,9.4);box(M.snow,0,1.015,0,10.95,.035,9.55);
  box(M.brick,0,2.05,0,7.8,2.1,6.5);for(const y of[1.16,1.38,2.77,3.05])box(M.white,0,y,0,8.0,.11,6.68);
  // Gallery: recessed windows and blind arcades around all four sides.
  for(const [z,rot] of[[3.3,0],[-3.3,Math.PI]])at(0,0,z,rot,()=>{for(let i=-3;i<=3;i++){window(i*1.03,1.55,.015,.38,.84);arch(M.trim,i*1.03,2.65,.06,.67,.55,.055,.06);}for(let i=-4;i<=4;i++)box(M.trim,i*.93,2.05,.04,.065,1.85,.11);});
  for(const s of[-1,1])at(s*3.95,0,0,s*Math.PI/2,()=>{for(let i=-2;i<=2;i++)window(i*1.04,1.5,.02,.38,.83);});
  // Main central octagonal tower with three nested tiers of kokoshniki.
  band(0,4.4,0,1.83,3.1,M.brick);for(const y of[3.0,3.28,5.73])band(0,y,0,1.94,.13);
  for(let f=0;f<8;f++)at(0,0,0,f*Math.PI/4,()=>{window(0,3.6,1.71,.33,1.4);for(const x of[-.6,.6])box(M.white,x,4.7,1.71,.07,2.1,.085);});
  for(let tier=0;tier<3;tier++)for(let f=0;f<8;f++){const a=f*Math.PI/4,ra=1.65-tier*.26;kokoshnik(Math.sin(a)*ra,5.65+tier*.63,Math.cos(a)*ra,1.25-tier*.18,.95-tier*.11,a);}
  band(0,7.75,0,1.08,1.1,M.brick);band(0,8.25,0,1.22,.16,M.white);
  const tentBottom=8.37,tentH=4.05;
  cyl(M.brick,0,tentBottom+tentH/2,0,1.3,tentH,.15,8,Math.PI/8);
  for(let f=0;f<8;f++){const a=f*Math.PI/4+Math.PI/8;rod(M.trim,[Math.sin(a)*1.32,tentBottom,Math.cos(a)*1.32],[Math.sin(a)*.14,tentBottom+tentH,Math.cos(a)*.14],.045);}
  // Raised glazed diamond tiles spiral up each facet of the central tent.
  for(let row=0;row<15;row++){const u=(row+.4)/15,r=1.3*(1-u)+.15*u;for(let f=0;f<8;f++)at(0,tentBottom+u*tentH,0,f*Math.PI/4,()=>{box(row%3?M.copper:M.gold,0,0,r*1.055,.22*(1-u)+.035,.22*(1-u)+.035,.055,0,0,Math.PI/4);});}
  band(0,12.45,0,.19,.27,M.gold,24);onion(0,12.57,0,.45,.95,'spiral','#dcb664','#c39539',.1);
  // Eight independent chapels; asymmetric silhouettes and authentic color families.
  chapel(-3.15,0,1.62,3.05,1.05,3.3,'spiral','#286b4e','#c8ac63',.65);
  chapel(3.15,0,1.60,2.95,1.1,3.25,'spiral','#305c84','#ece1bd',.4);
  chapel(0,3.05,1.48,3.1,1.0,3.15,'zigzag','#b64039','#efe1be',0);
  chapel(0,-2.95,1.5,3.55,1.05,3.1,'diamond','#22665b','#ba6c43',.15);
  chapel(-2.65,2.55,1.06,2.3,.8,2.3,'spiral','#3e7859','#ceb269',.7);
  chapel(2.65,2.55,1.08,2.2,.8,2.2,'diamond','#267c78','#d3ac42',.1);
  chapel(-2.65,-2.5,1.05,2.5,.85,2.3,'zigzag','#a73536','#356a55',0);
  chapel(2.65,-2.5,1.08,2.65,.85,2.3,'spiral','#ce8948','#38836b',.6);
  // Covered entrance, layered arcade roof, sculptural stairway and handrail.
  at(-3.1,0,4.05,0,()=>{
   box(M.brick,0,1.7,0,2.35,1.45,1.42);window(0,1.1,.735,.96,1.4);arch(M.white,0,1.08,.79,1.4,1.67,.14,.18);
   cyl(M.copper,0,3.14,0,1.55,1.6,.04,4,Math.PI/4);for(const s of[-1,1])rod(M.trim,[s*1.13,2.36,.74],[0,3.94,0],.045);
   for(let i=0;i<7;i++)box(M.stone,0,.63+i*.09,1.72-i*.16,1.72,.15,.23);
   for(const s of[-1,1]){rod(M.iron,[s*.87,.97,1.85],[s*.87,1.61,.78],.025);for(let i=0;i<4;i++)rod(M.iron,[s*.87,.7+i*.13,1.8-i*.3],[s*.87,1.0+i*.13,1.8-i*.3],.018);}
  });
  // Snow owns upward ledges; it does not blanket or intersect entire facades.
  for(const y of[1.24,2.85,3.14])box(M.snow,0,y,0,8.07,.035,6.76);
  // Separate east-side tented bell tower, not an unrelated landmark.
  at(5,0,-1.8,0,()=>{band(0,1.95,0,.78,2.3,M.brick);band(0,5,0,.9,.16);for(let f=0;f<8;f++)at(0,0,0,f*Math.PI/4,()=>window(0,4.3,.73,.35,.74));cyl(M.copper,0,6.75,0,1.04,3.3,.06,8,Math.PI/8);for(let f=0;f<8;f++){const a=f*Math.PI/4;rod(M.white,[Math.sin(a),5.1,Math.cos(a)],[0,8.4,0],.035);}onion(0,8.4,0,.2,.5,'spiral','#c19a42','#d6ba70',0);});
 }));
 // Western Kremlin wall with deep swallow-tail merlons, continuous snow caps.
 for(const [a,b]of[[-15,-5.4],[-2.4,7.7]]){
  const len=b-a,z=(a+b)/2;box(M.brickDark,-11,2.6,z,1.04,3.95,len);box(M.trim,-10.43,1.25,z,.08,.12,len);box(M.brickDark,-11,4.55,z,1.22,.18,len);box(M.snow,-11,4.66,z,1.23,.055,len);
  for(let zz=a+.3;zz<b;zz+=.75){for(const sx of[-.3,.3]){box(M.brickDark,-11+sx,4.99,zz,.36,.65,.43,0,0,sx>0?-.18:.18);box(M.snow,-11+sx,5.32,zz,.37,.045,.44,0,0,sx>0?-.18:.18);}}
  for(let zz=a+.8;zz<b;zz+=1.5)box(M.brickDark,-10.37,2.5,zz,.15,3.75,.15);
 }
 function spire(x,z,scale=1){at(x,0,z,0,()=>{
  const w=3.0;box(M.brickDark,0,3.35,0,w,5.55,w);for(const y of[.8,5.4,5.8,8.4,8.7])box(M.white,0,y,0,w+.2,.13,w+.2);
  for(let f=0;f<4;f++)at(0,0,0,f*Math.PI/2,()=>{
   archFill(M.dark,0,.66,1.53,1.3,2.4);arch(M.trim,0,.66,1.56,1.47,2.55,.13,.13);
   for(const x of[-1.25,1.25])box(M.trim,x,3.1,1.57,.14,4.85,.12);
   window(0,3.7,1.54,.44,1.1);for(const x of[-.92,.92])window(x,4,1.54,.24,.8,false);
  });
  box(M.brickDark,0,7.2,0,2.75,2.6,2.75);
  const clock=canvas(512,512,c=>{c.fillStyle='#15272c';c.fillRect(0,0,512,512);c.strokeStyle='#d7bc74';c.lineWidth=12;c.beginPath();c.arc(256,256,239,0,Math.PI*2);c.stroke();c.fillStyle='#e0c887';c.textAlign='center';c.textBaseline='middle';c.font='34px Georgia';const nums=['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];for(let i=0;i<12;i++){const a=i*Math.PI/6;c.fillText(nums[i],256+Math.sin(a)*190,256-Math.cos(a)*190);}c.strokeStyle='#e8ca77';c.lineCap='round';c.lineWidth=8;c.beginPath();c.moveTo(256,256);c.lineTo(350,175);c.moveTo(256,256);c.lineTo(217,123);c.stroke();c.beginPath();c.arc(256,256,12,0,7);c.fill();});const clockMat=new T.MeshStandardMaterial({map:clock,roughness:.56,emissive:'#dbb45b',emissiveMap:clock,emissiveIntensity:.14});clockMat.name='Spasskaya clock';
  for(let f=0;f<4;f++)at(0,0,0,f*Math.PI/2,()=>{const g=new T.CircleGeometry(1.03,64);add(g,clockMat,0,7.2,1.39);g.dispose();ring(M.gold,0,7.2,1.405,1.05,.045);kokoshnik(0,8.18,1.41,2.5,.8);});
  band(0,9.4,0,1.25,1.3,M.brickDark);for(let f=0;f<8;f++)at(0,0,0,f*Math.PI/4,()=>{window(0,9,.99,.36,.75);});
  band(0,10.1,0,1.4,.18,M.white);cyl(M.copper,0,12.4,0,1.4,4.5,.1,8,Math.PI/8);
  for(let f=0;f<8;f++){const a=f*Math.PI/4;rod(M.trim,[Math.sin(a)*1.42,10.1,Math.cos(a)*1.42],[Math.sin(a)*.1,14.65,Math.cos(a)*.1],.04);for(let row=0;row<4;row++){const y=10.3+row*.6,r=1.4-(y-10.1)/4.5*1.3;ball(M.white,Math.sin(a)*r,y,Math.cos(a)*r,.045);}}
  for(const x of[-1.32,1.32])for(const z of[-1.32,1.32]){cyl(M.white,x,9.4,z,.15,1.4,.075,8);cyl(M.copper,x,10.4,z,.24,.8,0,8);}
  rod(M.gold,[0,14.6,0],[0,15.3,0],.045);const s=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?.18:.43;const x=Math.sin(a)*r,y=Math.cos(a)*r;i?s.lineTo(x,y):s.moveTo(x,y);}s.closePath();const star=new T.ExtrudeGeometry(s,{depth:.07,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:1});add(star,M.red,0,15.5,0);star.dispose();
 });}
 spire(-11,-3.9);
 // Representative GUM east facade: compressed length, preserved bay rhythm and neo-Russian roofs.
 const gumSign=sign('ГУМ','ВЕРХНИЕ ТОРГОВЫЕ РЯДЫ · 1893','#c4ad87','#2e454b');
 at(13.4,.61,-4.4,-Math.PI/2,()=>{
  box(M.trim,0,3.2,0,18.9,6.4,3.7);box(M.stone,0,.23,0,19.1,.46,4.0);
  for(const y of[.62,2.3,4.15,5.9,6.45])box(M.white,0,y,.0,19.15,.14,3.95);
  for(let bay=-6;bay<=6;bay++){
   const x=bay*1.36;for(const y of[.65,2.66,4.45]){
    archFill(M.dark,x,y,1.87,.79,1.38);archFill(M.window,x,y+.045,1.895,.62,1.2);arch(M.trim,x,y-.02,1.94,1.04,1.62,.11,.13);arch(M.white,x,y+.07,2.06,.84,1.42,.034,.025);
    for(const sx of[-.49,.49]){cyl(M.white,x+sx,y+.5,2.0,.055,1.0,.055,10);box(M.trim,x+sx,y+.08,2.0,.18,.12,.18);}box(M.white,x,y-.06,2,.98,.095,.28);box(M.iron,x,y+.54,1.956,.025,1.0,.025);box(M.iron,x,y+.7,1.956,.62,.025,.025);
   }
   box(M.trim,x+.63,3.15,1.98,.16,6.1,.18);box(M.white,x+.63,5.95,2.06,.24,.17,.31);
   kokoshnik(x,6.45,1.9,1.18,.78);box(M.snow,x,6.48,1.92,1.16,.045,.35);
  }
  // Roofs and complete rear elevation; all-orbit views remain finished.
  box(M.roof,0,6.7,0,19.3,.17,4.2);box(M.snow,0,6.81,0,19.1,.055,3.5);
  for(const x of[-8.1,0,8.1]){
   box(M.trim,x,6.9,0,1.9,1.15,3.9);for(const zz of[-1.97,1.97])window(x,6.55,zz, .7,.9);
   cyl(M.roof,x,8.1,0,1.65,1.8,.1,4,Math.PI/4);cyl(M.copper,x,9.3,0,.16,.8,.035,12);ball(M.gold,x,9.75,0,.1);
  }
  for(let i=-5;i<=5;i++)at(i*1.6,0,-1.9,Math.PI,()=>{for(const y of[.8,2.8,4.6])window(0,y,.01,.55,1.1,false);});
  box(M.trim,0,5.65,2.2,3.1,.8,.16);box(gumSign,0,5.65,2.29,2.9,.71,.02);
  // A projecting monumental entrance with concentric carved archivolts.
  archFill(M.dark,0,.25,2.18,2.1,3.85,.07);
  for(let layer=0;layer<4;layer++)arch(layer%2?M.white:M.trim,0,.23,2.28+layer*.055,2.25+layer*.24,3.99+layer*.20,.075,.06);
  box(M.window,0,1.7,2.28,1.45,2.25,.05);box(M.iron,0,1.7,2.32,.07,2.25,.06);
  for(const x of[-1.6,1.6]){box(M.trim,x,2.4,2.27,.21,4.8,.27);for(const yy of[.55,2.5,4.7])box(M.white,x,yy,2.3,.35,.13,.39);}
  for(let i=-14;i<=14;i++){box(M.trim,i*.63,6.21,2.06,.2,.25,.2);ball(M.white,i*.63,6.34,2.15,.067);}
  for(let i=-6;i<=6;i++){const x=i*1.36;for(const y of[2.45,4.34]){box(M.trim,x,y,2.12,.34,.19,.08,0,0,Math.PI/4);for(const xx of[-.48,.48])ball(M.white,x+xx,y,2.12,.054);}}
  // Small shop signs and facade light cornices.
  const shop=sign('ГАСТРОНОМЪ','КОФЕ · ШОКОЛАД','#354b42');for(const x of[-5.45,5.45])box(shop,x,2.28,2.12,2.25,.32,.03);
 });
 return{cathedral:CATHEDRAL,clockMaterial:null};
}
