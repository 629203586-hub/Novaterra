import * as T from 'three';
// Moscow revival vocabulary: carved brick, kokoshniki, hipped metal roofs and glazed medallions.
export function buildMoscowDetails(k,{M,sign}){
 const{box,round,cyl,ball,rod,ring,arch,archFill,at,add}=k;
 function crest(x,y,z,w,h){const s=new T.Shape();s.moveTo(-w/2,0);s.quadraticCurveTo(-w*.48,h*.45,-w*.17,h*.65);s.lineTo(0,h);s.lineTo(w*.17,h*.65);s.quadraticCurveTo(w*.48,h*.45,w/2,0);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:.13,bevelEnabled:false,curveSegments:16});add(g,M.white,x,y,z);g.dispose();const inshape=new T.Shape();inshape.moveTo(-w*.38,.04);inshape.quadraticCurveTo(-w*.35,h*.4,-w*.13,h*.56);inshape.lineTo(0,h*.81);inshape.lineTo(w*.13,h*.56);inshape.quadraticCurveTo(w*.35,h*.4,w*.38,.04);inshape.closePath();const f=new T.ExtrudeGeometry(inshape,{depth:.035,bevelEnabled:false,curveSegments:12});add(f,M.brick,x,y,z+.14);f.dispose();}
 function house(x,z,w,d,h,variant=0){at(x,.68,z,0,()=>{
  box(M.brick,0,h/2,0,w,h,d);box(M.white,0,.18,0,w+.15,.3,d+.17);for(const y of[.55,2.55,h-.1])box(M.trim,0,y,0,w+.16,.12,d+.16);
  // Complete side/back facades: the same masonry depth, varied bay counts, no blank rear wall.
  for(let face=0;face<4;face++)at(0,0,0,face*Math.PI/2,()=>{const width=face%2?d:w,depth=face%2?w:d,cols=Math.floor(width/1.18);
   for(let i=0;i<cols;i++){const xx=(i-(cols-1)/2)*1.17;for(const yy of[.8,2.8])if(yy<h-.6){archFill(M.dark,xx,yy,depth/2+.02,.53,1.07);archFill(M.window,xx,yy+.045,depth/2+.042,.42,.92);arch(M.white,xx,yy-.02,depth/2+.08,.74,1.23,.075,.13);crest(xx,yy+1.19,depth/2+.09,.91,.42);box(M.white,xx,yy-.08,depth/2+.1,.83,.1,.28);box(M.snow,xx,yy-.02,depth/2+.13,.86,.05,.28);box(M.trim,xx,yy+.42,depth/2+.1,.032,.9,.055);box(M.trim,xx,yy+.5,depth/2+.1,.48,.03,.055);}
    ring(M.white,xx,h-.52,depth/2+.12,.11,.025);const g=new T.CircleGeometry(.078,16);add(g,M.copper,xx,h-.52,depth/2+.125);g.dispose();
   }
   for(const s of[-1,1])for(let j=0;j<8;j++)box(j%2?M.brick:M.trim,s*(width/2-.11),.48+j*(h-.8)/8,depth/2+.075,.23,.13,.17);
   for(let xx=-width/2+.15;xx<width/2;xx+=.27)box(M.trim,xx,h-.02,depth/2+.1,.13,.18,.17);
  });
  // A broad hipped roof with seams; central front kokoshnik gable differs on each house.
  const hw=w/2+.2,hd=d/2+.2,rx=w*.23;
  const roof=new T.BufferGeometry();roof.setAttribute('position',new T.Float32BufferAttribute([-hw,0,-hd,hw,0,-hd,hw,0,hd,-hw,0,hd,-rx,1.25,0,rx,1.25,0],3));roof.setIndex([0,4,5,0,5,1,1,5,2,2,5,4,2,4,3,3,4,0]);roof.computeVertexNormals();add(roof,M.copper,0,h,0);add(roof,M.snow,0,h+.085,0,.95,.95,.93);roof.dispose();
  for(const side of[-1,1])for(const sx of[-1,1])rod(M.silver,[sx*rx,h+1.28,0],[sx*hw,h+.02,side*hd],.016);
  crest(0,h-.08,d/2+.05,variant?2.0:1.6,variant?1.45:1.1);archFill(M.dark,0,h+.12,d/2+.24,.44,.56);arch(M.white,0,h+.1,d/2+.28,.6,.72,.06,.07);
  // Snow remains on roof shoulders, revealing green seams and the characteristic roof shape.
  for(const s of[-1,1])box(M.snow,0,h+.06,s*(d/2+.08),w+.3,.08,.3);
  box(M.wood,0,.81,d/2+.09,.74,1.57,.10);arch(M.trim,0,.12,d/2+.15,.99,1.75,.09,.14);
  const name=sign(variant?'МОСКВА':'ЧАЙНАЯ',variant?'ГОРОДСКОЙ ДОМ':'ПРЯНИКИ · ГОРЯЧИЙ ЧАЙ','#553d34','#e9d9b7');box(name,0,2.41,d/2+.24,1.9,.32,.04);
  if(variant){for(const s of[-1,1]){cyl(M.brick,s*(w/2-.2),h+.5,0,.38,1.1,.34,8);cyl(M.copper,s*(w/2-.2),h+1.58,0,.45,1.2,.02,8);ball(M.gold,s*(w/2-.2),h+2.23,0,.08);}}
 });}
 house(-17,-10.7,4.6,3.9,4.6,1);house(-17,-4.9,4.4,3.6,3.9,0);house(-17,.1,4.5,3.8,4.0,1);house(6.4,-13.2,6,4.1,4.7,1);house(-1.2,-13.5,6,3.8,4.05,0);
 // White / blue / red flag, reserved to one civic location rather than scattering emblems.
 at(-13.1,.7,6.5,0,()=>{cyl(M.stone,0,.1,0,.25,.2,.22,16);rod(M.silver,[0,.2,0],[0,5.7,0],.035,12);ball(M.gold,0,5.76,0,.08);for(const [i,m]of[M.white,M.dome,M.red].entries()){if(i===1){const blue=new T.MeshStandardMaterial({color:'#325c9d',roughness:.8});blue.name='Russian flag blue';box(blue,.72,5.2-i*.24,0,1.43,.24,.018);}else box(m,.72,5.2-i*.24,0,1.43,.24,.018);}});
 // A compact vintage PAZ-inspired civilian coach, parked off the moving traffic route.
 at(-17,.69,4.25,Math.PI/2,()=>{
  box(M.road,0,-.01,0,2.05,.018,5.8);round(M.cream,0,1.14,0,1.46,1.72,4.55);round(M.red,0,.66,0,1.49,.39,4.57);round(M.copper,0,1.99,0,1.43,.17,4.55);round(M.snow,0,2.1,0,1.41,.055,4.4);
  for(const z of[-2.29,2.29]){box(M.glass,0,1.52,z,1.22,.63,.023);box(M.cream,0,1.51,z+.025,.07,.68,.04);box(M.silver,0,.46,z,1.42,.1,.1);for(const x of[-.54,.54]){const g=new T.CircleGeometry(.11,20);add(g,M.lamp,x,.82,z+.025);g.dispose();}}
  for(const s of[-1,1])for(let i=-2;i<=2;i++){box(M.glass,s*.739,1.5,i*.67,.025,.61,.55);box(M.trim,s*.76,1.18,i*.67,.035,.04,.57);}
  const route=sign('МОСКВА','ГОРОДСКОЙ МАРШРУТ','#e8ddbb','#243c46',512);box(route,0,1.96,2.31,.8,.21,.03);
  for(const x of[-.73,.73])for(const z of[-1.44,1.44]){const g=new T.TorusGeometry(.29,.08,8,24);add(g,M.rubber,x,.35,z,1,1,1,0,Math.PI/2);g.dispose();cyl(M.silver,x,.35,z,.15,.13,.15,16);}
  for(let i=-1;i<=1;i++)box(M.iron,0,1.94,i*.9,1.53,.035,.028);
 });
 const stop=sign('ОСТАНОВКА','МОСКВА · ЦЕНТР','#375578');at(-14,.69,5.2,0,()=>{rod(M.iron,[0,0,0],[0,2.4,0],.035);box(stop,0,2.2,0,.7,.52,.06);box(M.snow,0,2.49,0,.74,.045,.1);});
 // Monument inspired by Minin and Pozharsky: seated / standing bronze silhouettes on granite.
 at(-5.2,.69,6.5,0,()=>{
  box(M.stone,0,.25,0,2.1,.5,1.3);box(M.trim,0,.76,0,1.8,.52,1.1);box(M.snow,0,1.04,0,1.85,.06,1.15);
  for(const [x,sy]of[[-.4,1.15],[.42,.98]]){cyl(M.copper,x,sy+.48,0,.19,.75,.14,12);ball(M.copper,x,sy+.98,0,.14,.18,.14);for(const s of[-1,1]){rod(M.copper,[x+s*.1,sy+.2,0],[x+s*.12,1.04,.17],.065);rod(M.copper,[x+s*.16,sy+.7,0],[x+s*.28,sy+.4,.08],.057);}}
  rod(M.copper,[-.65,1.88,0],[-.97,2.44,.08],.055);rod(M.copper,[-.97,2.44,.08],[-1.13,2.51,.08],.043);
 });
}
