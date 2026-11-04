import * as T from 'three';
import {seeded} from './geometry.js';
import{buildMoscowDetails}from'./moscow-details.js';
export function buildEnvironment(k,materials){
 const {M,sign}=materials,{box,round,ball,cyl,rod,arch,archFill,at,add,ring}=k,{rr,random}=seeded(1491);const lamps=[];
 // Closed solid base: no transparent underside or open terrain shells.
 round(M.stoneDark,0,-.6,0,41.6,1.6,34.8);box(M.stone,0,.18,0,42,.32,35.2);box(M.snow,0,.49,-3.3,41.7,.29,28.3);
 box(M.pave,0,.653,-3.7,39.8,.036,26.8);box(M.road,0,.42,10.4,41.4,.1,3.6);
 for(const z of[8.55,12.25]){box(M.stone,0,.58,z,41.8,.35,.28);box(M.snow,0,.78,z,41.8,.065,.32);}
 for(let x=-19;x<20;x+=1.45)box(M.trim,x,.48,10.4,.7,.012,.065);
 // A real peripheral river strip, separated by road, embankment and railings.
 box(M.stoneDark,0,.26,15.1,41.5,.18,4.25);
 for(let x=-20.5;x<21;x+=.9){box(M.stone,x,.28,12.65,.85,.76,.46);box(M.snow,x,.68,12.65,.9,.055,.53);}
 for(let x=-20;x<=20;x+=.72){cyl(M.iron,x,1.15,12.72,.032,1,.032,8);for(const z of[12.69,12.76])rod(M.iron,[x-.22,.93,z],[x+.22,1.3,z],.014);}
 for(const y of[.91,1.57])rod(M.iron,[-20.4,y,12.72],[20.4,y,12.72],.034,10);
 // Granite masonry courses on all exposed base faces, larger blocks at corners.
 for(const z of[-17.65,17.65])for(let row=0;row<4;row++)for(let x=-20.7+(row%2)*.6;x<21;x+=1.45)box(M.stone,x,-.9+row*.28,z,1.39,.25,.045);
 for(const x of[-21,21])for(let row=0;row<4;row++)for(let z=-17.5+(row%2)*.6;z<17.5;z+=1.45)box(M.stone,x,-.9+row*.28,z,.045,.25,1.39);
 // Uneven drifting at edges, away from pedestrian and vehicle routes.
 for(let i=0;i<42;i++){const x=rr(-20,20),z=i%2?-15.9:8.05;ball(M.snow,x,.66,z,rr(.35,.9),rr(.09,.23),rr(.15,.4));}
 // Snow fine surface inset areas rather than a blank white sheet over paving.
 for(let i=0;i<34;i++){const x=rr(-8.7,10),z=rr(-14,7.8);if(x>-4&&x<8&&z>-.8)continue;ball(M.snow,x,.667,z,rr(.15,.65),.009,rr(.1,.42));}
 // Small paired footprints remain low-contrast and embedded in pedestrian routes.
 for(let i=0;i<70;i++){const z=-12+i*.28,x=-5.85+Math.sin(i*.1)*.25;for(const s of[-1,1])round(M.stone,x+s*.075,.678,z+s*.1,.07,.008,.15,0,.1);}
 function bench(x,z,rot){at(x,.68,z,rot,()=>{for(let i=0;i<5;i++)box(M.wood,0,.47,-.21+i*.105,1.5,.07,.077);for(let i=0;i<3;i++)box(M.wood,0,.72+i*.14,-.29,1.5,.09,.065,.13);for(const sx of[-.56,.56]){rod(M.iron,[sx,.05,-.2],[sx,.99,-.29],.033);rod(M.iron,[sx,.03,.2],[sx,.46,.13],.035);rod(M.iron,[sx,.59,-.18],[sx,.59,.24],.028);rod(M.iron,[sx,.42,.22],[sx,.61,.22],.025);}box(M.snow,0,.99,-.29,1.5,.035,.13);for(const x of[-.62,.62])box(M.snow,x,.515,0,.22,.023,.5);});}
 function lamp(x,z){at(x,.69,z,0,()=>{cyl(M.iron,0,.09,0,.2,.18,.17,12);cyl(M.iron,0,.45,0,.12,.75,.065,12);cyl(M.iron,0,1.9,0,.05,2.5,.045,12);for(const y of[.85,2.6])cyl(M.gold,0,y,0,.08,.075,.08,12);for(const s of[-1,1]){const ps=[new T.Vector3(0,2.9,0),new T.Vector3(s*.28,3.2,0),new T.Vector3(s*.55,3.1,0)];const g=new T.TubeGeometry(new T.CatmullRomCurve3(ps),14,.028,6,false);add(g,M.iron);g.dispose();const xx=s*.55;box(M.lamp,xx,2.94,0,.21,.38,.21);for(const dx of[-.12,.12])for(const zz of[-.12,.12])rod(M.iron,[xx+dx,2.72,zz],[xx+dx*.8,3.14,zz*.8],.014);cyl(M.iron,xx,3.23,0,.23,.18,0,4,Math.PI/4);cyl(M.iron,xx,2.71,0,.17,.07,.17,4,Math.PI/4);ball(M.snow,xx,3.25,0,.19,.04,.19);lamps.push([x+xx,3.62,z]);}});}
 for(const p of[[-8.8,-11],[-8.8,3],[-6,8.15],[8.8,8.15],[17.8,8.1],[-17,8.15],[10.5,-10],[10.5,-2]])lamp(...p);
 for(const p of[[-7.8,5.4,Math.PI/2],[-7.8,-7.3,Math.PI/2],[9.9,-7,-Math.PI/2],[9.5,5.3,-Math.PI/2],[-18,7.4,0],[16.8,7.4,0]])bench(...p);
 // Bare deciduous trees: branched silhouettes with snow on real upper branches.
 function tree(x,z,h,seed){at(x,.7,z,seed,()=>{rod(M.white,[0,0,0],[.06,h,0],.09,10);for(let j=0;j<10;j++)box(M.wood,Math.sin(j*2)*.07,.2+j*h/11,.08,.08,.025,.014,0,0,.15);for(let b=0;b<8;b++){const a=b*2.4+seed,y=h*(.4+b*.065),len=h*(.35-b*.02),end=[Math.sin(a)*len,y+len*.58,Math.cos(a)*len];rod(M.wood,[0,y,0],end,.043-b*.003,7);rod(M.snow,[0,y+.036,0],[end[0],end[1]+.033,end[2]],.025,6);for(const s of[-1,1]){const tip=[end[0]+Math.sin(a+s*.8)*len*.48,end[1]+len*.45,end[2]+Math.cos(a+s*.8)*len*.48];rod(M.wood,end,tip,.018,6);rod(M.snow,[end[0],end[1]+.02,end[2]],[tip[0],tip[1]+.02,tip[2]],.012,5);}}for(let i=0;i<6;i++)ball(M.snow,rr(-.32,.32),.02,rr(-.32,.32),rr(.14,.35),.07,rr(.1,.3));});}
 for(const p of[[-19.5,7.0,3.7,.6],[-15.7,7.4,3.4,.9],[18,6.4,3.6,.2],[19,-11,4.4,1],[-7.5,-13.6,3.8,.4],[8.9,-14.6,3.6,.8]])tree(...p);
 // Side street houses: Moscow plaster, metal standing-seam roofs, classical stone trim.
 buildMoscowDetails(k,materials);
 // Tea kiosk / pavilion at a square edge, with samovar, blini and glass cups.
 const teaSign=sign('ЧАЙ · БЛИНЫ','ГОРЯЧИЙ ЧАЙ У ПЛОЩАДИ');
 at(-5.0,.69,-10.1,0,()=>{
  box(M.wood,0,.9,0,2.8,1.8,1.6);box(M.trim,0,.16,0,2.98,.22,1.8);for(const x of[-1.35,1.35])box(M.copper,x,1.08,.88,.13,2.15,.13);box(M.dark,0,1.55,.82,2.4,.83,.045);box(M.wood,0,1.12,1.02,3.0,.12,.55);
  box(M.copper,0,2.25,0,3.25,.19,2.0);box(M.snow,0,2.37,0,3.25,.06,2.0);box(teaSign,0,2.02,1.04,2.5,.48,.05);
  cyl(M.gold,-.5,1.47,1.01,.18,.45,.12,24);ball(M.gold,-.5,1.5,1.01,.2,.23,.2);cyl(M.gold,-.5,1.82,1.01,.085,.23,.085,16);cyl(M.gold,-.5,1.97,1.01,.12,.06,.12,16);for(const s of[-1,1])ring(M.gold,-.5+s*.22,1.59,1.01,.09,.017);rod(M.gold,[-.5,1.41,1.18],[-.5,1.41,1.33],.028);cyl(M.gold,-.5,1.36,1.3,.04,.09,.04,12);
  for(let i=0;i<7;i++)cyl(i%2?M.gold:M.trim,.45,1.2+i*.025,1,.18,.025,.18,24);
  for(const x of[.02,.88]){cyl(M.silver,x,1.29,1.06,.065,.17,.065,16);ring(M.silver,x+.09,1.3,1.06,.048,.011);cyl(M.wood,x,1.38,1.06,.055,.009,.055,16);}
 });
 // Granite street information, bins, restrained Russian flag on an administrative facade.
 const info=sign('КРАСНАЯ ПЛОЩАДЬ','RED SQUARE  ·  МОСКВА');at(-6.9,.69,7.7,.05,()=>{for(const x of[-.7,.7])cyl(M.iron,x,.65,0,.035,1.3,.035,8);box(info,0,1.22,0,1.75,.48,.07);box(M.snow,0,1.49,0,1.8,.04,.14);});
 for(const [x,z]of[[-7.4,4.8],[9.7,4.4],[11,-9]]){cyl(M.iron,x,1.05,z,.17,.7,.17,16);cyl(M.snow,x,1.43,z,.19,.045,.19,16);}
 for(let x=-8;x<=8;x+=2.3) {cyl(M.iron,x,.93,8.1,.07,.5,.07,12);ball(M.iron,x,1.2,8.1,.09);}
 return{lamps,river:{width:41.4,depth:4.3,x:0,z:15.0,level:.4},teaPosition:[-5.5,2.65,-9.1]};
}
