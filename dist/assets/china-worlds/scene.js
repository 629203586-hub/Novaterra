import * as T from 'three';
import{makePath}from'./src/world/terrain.js';
import{createChongqingBuilders}from'./src/chongqing/builders.js';
export function buildScene(ctx){
 const{M,mat,batch:b,signage,props,rr}=ctx,{box,at,geometry,transform,geo,pipe,cyl,ball}=b,q=createChongqingBuilders(ctx),{B,roofAt,balustrade,window,lantern,stiltHouse,tower,oak,trim,stone,aged}=q;ctx.chongqing=q;
 const base=mat('#728d87'),earth=mat('#a9b49b'),green=mat('#8aaa75');
 const outline=[[-32,-19],[-28,-23],[27,-23],[32,-17],[32,18],[27,23],[-27,23],[-32,18]];
 function slab(points,bottom,height,m,bevel=.16){const sh=new T.Shape();for(const [i,[x,z]]of points.entries())i?sh.lineTo(x,-z):sh.moveTo(x,-z);sh.closePath();const g=new T.ExtrudeGeometry(sh,{depth:height,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:1,steps:1});geometry(g,m,transform(0,bottom,0,1,1,1,-Math.PI/2));g.dispose();}
 slab(outline,-3.2,2.5,base,.28);slab(outline,-.72,.35,earth,.18);
 const peninsula=[[-27,-21],[-18,-22],[-3,-21],[5,-19],[18,-21],[27,-17],[28,-7],[26,-2],[23,0],[23,9.9],[-28.8,9.9],[-31.6,8],[-31.6,4.0],[-28,-12]];
 slab(peninsula,.08,.65,q.sandstone,.10);slab(peninsula,.73,.07,green,.08);
 // Cliff terraces are broad, connected landforms. Their stepped front is covered by the galleries.
 const high=[[-26,-21],[-4,-21],[5,-19],[21,-21],[21.7,-17],[21.7,-10],[20,-8],[16,-10],[12,-9],[-14,-9],[-14,-12],[-26,-12]];
 // Closed three-ring cliff: broad foot, broken middle ledge, exact planted top.
 function cliff(points){const rings=[{y:.8,spread:.075},{y:3.5,spread:.045},{y:6.28,spread:0}],ps=[],ix=[],n=points.length;for(const r of rings)for(const [x,z]of points)ps.push(x*(1+r.spread),r.y,-15+(z+15)*(1+r.spread));for(let ring=0;ring<2;ring++)for(let j=0;j<n;j++){const a=ring*n+j,c=ring*n+(j+1)%n;ix.push(a,a+n,c,c,a+n,c+n);}const cap=T.ShapeUtils.triangulateShape(points.map(([x,z])=>new T.Vector2(x,-z)),[]);for(const t of cap){ix.push(...t.map(i=>2*n+i));ix.push(t[2],t[1],t[0]);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(ps,3));g.setIndex(ix);g.computeVertexNormals();geometry(g,base);g.dispose();}
 cliff(high);slab(high,6.28,.07,green,.06);
 const middle=[[-26,-12],[-14,-12],[-14,-9],[15,-9],[17,-5],[16,-2],[-14,-2],[-17,-5],[-26,-5]];
 slab(middle,.8,2.42,q.sandstone,.13);slab(middle,3.22,.06,green,.07);
 // The bridge approach sits on a lower shoulder, separated from the tower foundations.
 const shoulder=[[21.65,-18.5],[25.5,-17],[27,-13],[27,-6],[23,-5],[21.65,-9]];
 slab(shoulder,.8,3.78,base,.10);slab(shoulder,4.58,.06,green,.07);
 function inside(x,z,points){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],c=points[j];if((a[1]>z)!==(c[1]>z)&&x<(c[0]-a[0])*(z-a[1])/(c[1]-a[1])+a[0])yes=!yes;}return yes;}
 function ground(x,z){return inside(x,z,high)?6.35:inside(x,z,shoulder)?4.64:inside(x,z,middle)?3.28:inside(x,z,peninsula)?.8:-.32;}
 // The Hongya cliff rises behind each continuous roof terrace, not through the balconies.
 B(q.sandstone,1,1.47,-.4,27,1.34,3.7);B(q.sandstone,-2.1,2.82,-4.0,20.0,4.04,3.6);B(q.sandstone,-2.1,4.2,-7.5,20.0,6.8,3.6);
 // Low quay masonry with a capped walk, away from the road surface.
 B(stone,-3,.35,10.16,57,.7,.22);B(aged,-3,.79,10.14,57,.12,.32);
 // River road; pedestrians have a physically separate promenade on the water side.
 const road=mat('#57666b');B(road,-3.3,.80,6,55.4,.065,4.2);
 for(const z of[3.85,8.17]){B(M.stoneLight,-3.3,.9,z,55.4,.19,.18);B(aged,-3.3,1.005,z,55.4,.035,.22);}
 for(let x=-30;x<24;x+=1.9)B(M.cream,x,.842,6.0,.8,.009,.055);
 // Hongyadong: three heights of stilted blocks rather than repeated flat roof boxes.
 const hongya=[];for(let row=0;row<3;row++)for(let i=0;i<(row===0?4:3);i++){const x=-8.4+i*6.25+(row===1?.3:0),y=2.2+row*2.7,z=.65-row*3.6,w=[5.4,5.6,5.5,5.25][i],d=3.0,floors=row===0&&i===3?3:row===2&&i===1?2:1;const h={x,y,z,w,d,floors};hongya.push(h);stiltHouse({...h,roofTone:row<2?'warm':'slate',id:'Hongyadong '+row+' / '+i});}
 // The taller right-hand front pavilion has its own clear footprint.
 B(oak,1,2.11,2.78,26,.18,1.15);balustrade(1,2.25,3.32,26);B(q.glowLine,1,2.02,3.37,26,.035,.035);
 for(let row=1;row<3;row++){const yy=2.2+row*2.7,zz=3.0-row*3.6;B(oak,-2.1,yy-.10,zz,19.4,.18,1.1);balustrade(-2.1,yy+.04,zz+.52,19.4);}
 // Shops, framed lattice screens, red lanterns, roofs and real horizontal walkway gaps.
 signage.sign('洪崖洞',-2.15,9.8,-4.7,3.7,.95,'#4a3b2e','#e8c484',false,false,'HONGYADONG');
 const shopNames=['山城老火锅','重庆小面','手工茶馆','巴渝食集'];for(let i=0;i<4;i++){const x=-8.4+i*6.4;signage.sign(shopNames[i],x,3.35,2.23,2.95,.56,i%2?'#315c56':'#813c2b','#f2dcb0');for(const dx of[-1.9,1.9])lantern(x+dx,3.6,2.65);}
 // Two public stair links have treads, landings and handrails at the actual elevations.
 function stairs(x,z,from,to,count,dir=1){const run=.24,dh=(to-from)/count;for(let i=0;i<count;i++)B(stone,x,from+(i+.5)*dh,z-dir*i*run,1.45,dh,.28);for(const side of[-1,1]){pipe([x+side*.65,from-.08,z],[x+side*.65,to-.08,z-dir*(count-1)*run],.06,M.iron);pipe([x+side*.77,from+.7,z+.1],[x+side*.77,to+.7,z-dir*count*run],.028,M.iron);for(let i=0;i<=count;i+=3)pipe([x+side*.77,from+i*dh,z-dir*i*run],[x+side*.77,from+i*dh+.7,z-dir*i*run],.025,M.iron);}}
 stairs(-12.3,3.6,.85,2.2,8);stairs(16.2,3,.85,6.35,28);stairs(8.9,-1.5,2.2,7.6,26);B(oak,8.4,7.51,-7.8,2.6,.18,1.1);balustrade(8.4,7.6,-8.3,2.6);
 // Liziba: separated lower and upper masses leave an actual open train corridor.
 const station={x:-19,z:-6.6,deck:9.55,opening:{bottom:9.68,top:12.35,halfDepth:1.22},width:7.6,depth:5.4};
 B(stone,station.x,4.75,station.z,8,3.05,5.8);B(mat('#d6be91'),station.x,7.9,station.z,7.6,3.3,5.4);
 for(const side of[-1,1])B(mat('#d2be99'),station.x,10.95,station.z+side*2.5,7.6,2.8,.4);
 tower(station.x,12.35,station.z,7.6,5.4,7,'#c2d6c8');
 for(const side of[-1,1])at(station.x+side*3.82,0,station.z,side*Math.PI/2,()=>{for(const s of[-1,1])B(mat('#ce9c73'),s*2.12,10.95,0,1.08,2.8,.11);B(M.cream,0,12.27,0,5.44,.15,.15);signage.sign('李子坝站',1.9,10.9,.16,.65,1.9,'#d5bd8f','#2e7674',0,true);});
 for(let face=0;face<4;face++)at(station.x,0,station.z,face*Math.PI/2,()=>{const width=face%2?station.depth:station.width,depth=face%2?station.width:station.depth;for(const yy of[6.9,8.15])for(let xx=-width/2+.75;xx<width/2-.45;xx+=1.3){window(xx,yy,depth/2+.065,.62,.73,false);B(aged,xx,yy-.45,depth/2+.16,.78,.07,.3);}B(mat('#bc6b52'),-width/2+.22,9.3,depth/2+.04,.18,5.4,.06);});
 signage.sign('李子坝 · LIZIBA',station.x,8.35,station.z+2.8,4,.65,'#316359','#efe7cf');
 // Guideway is a complete rounded circuit on the left terrace; the station lies on its straight front.
 const track=makePath([
 [[-28,-6.6],[-16,-6.6]], [[-16,-6.6],[-12.5,-6.6],[-12.5,-17.7],[-16,-17.7]], [[-16,-17.7],[-28,-17.7]], [[-28,-17.7],[-31,-17.7],[-31,-6.6],[-28,-6.6]]
 ],9.5);const trackPoints=track.getSpacedPoints(180);
 for(let i=0;i<trackPoints.length-1;i++){const a=trackPoints[i],c=trackPoints[i+1],len=a.distanceTo(c),mid=a.clone().add(c).multiplyScalar(.5),yaw=Math.atan2(c.x-a.x,c.z-a.z);B(M.concrete,mid.x,9.47,mid.z,.48,.42,len+.01,yaw);B(M.metal,mid.x,9.72,mid.z,.18,.065,len+.01,yaw);}
 for(let u=0;u<1;u+=.07){const p=track.getPointAt(u);if(Math.abs(p.x-station.x)<4.7&&Math.abs(p.z-station.z)<3)continue;const floor=ground(p.x,p.z);B(M.concrete,p.x,(9.26+floor)/2,p.z,.45,9.26-floor,.50);B(M.concrete,p.x,9.15,p.z,1.25,.22,.7);}
 // Backstreet housing deliberately varies height and roof equipment.
 tower(-8.0,6.4,-14.0,3.4,3.2,9,'#d6d3b6');tower(-1.9,6.4,-17.0,3.4,3.2,13,'#88a9a1');tower(2.8,6.4,-16.0,3.2,3.2,16,'#7ba6a5');tower(6.3,6.4,-16.3,2.7,2.8,10,'#d6d4b7');
 // Raffles-inspired skyline: four slender uprights joined by one arched glazed Crystal.
 const towers=[];for(const [i,x]of[9,12.1,15.2,18.3].entries()){const y=6.4,h=[12.5,17.2,17.2,12.5][i],w=2.45,d=3.3,z=-17.6;B(aged,x,y+h/2,z,w,h,d,0,true);for(let f=0;f<Math.floor(h/.5);f++){const yy=y+.25+f*.5;for(const zz of[-d/2-.021,d/2+.021])B((f+i)%6?q.greenGlass:M.warmDim,x,yy,z+zz,w*.84,.34,.024);for(const s of[-1,1])B(q.greenGlass,x+s*(w/2+.02),yy,z,.028,.34,d*.86);B(aged,x,yy+.22,z,w+.03,.06,d+.03);}for(const sx of[-.95,.95])B(aged,x+sx,y+h/2,z+d/2+.055,.10,h,.10);B(aged,x,y+h+.1,z,w+.15,.18,d+.15);towers.push({x,z,h});}
 const crystalGeo=new T.CylinderGeometry(.85,.85,12.5,24,1,false).rotateZ(Math.PI/2);geometry(crystalGeo,q.greenGlass,transform(13.65,19.8,-17.6,1,1,1));crystalGeo.dispose();
 for(let x=7.4;x<20;x+=.48){const g=new T.TorusGeometry(.87,.018,4,24);geometry(g,aged,transform(x,19.8,-17.6,1,1,1,0,Math.PI/2));g.dispose();}
 // Red Qiansimen-inspired cable-stayed bridge and abutments outside the city square.
 const bridgeRed=mat('#a94e3d'),bridgeGlow=mat('#bb7050',{emissive:'#e98148',emissiveIntensity:.55});bridgeGlow.userData.architectural=true;
 B(M.stone,25,2.05,21.4,4.8,4.5,2.5);B(aged,25,4.35,21.4,5.0,.10,2.7);B(M.concrete,25,2.1,-5.5,4.2,4.0,2);B(M.concrete,25,4.35,8,4,.5,29);B(mat('#5f6867'),25,4.64,8,3.6,.08,29);
 B(M.concrete,25,4.35,-10.1,4,.5,7.2);B(mat('#5f6867'),25,4.64,-10.1,3.6,.08,7.2);B(aged,24,4.64,-15,4.8,.08,3.4);
 for(const side of[-1,1]){B(M.cream,25+side*1.95,4.78,-10.1,.18,.28,7.2);}
 for(let z=-6;z<=22;z+=1.4)B(M.cream,25,4.688,z,.06,.009,.55);
 for(const side of[-1,1]){B(bridgeRed,25+side*1.86,4.76,8,.11,.24,29);B(bridgeGlow,25+side*1.91,4.87,8,.025,.025,29);for(let z=-6;z<22;z+=1.5)B(bridgeRed,25+side*1.87,5.12,z,.055,.6,.055);}
 for(const z of[5.5]){for(const side of[-1,1]){pipe([25+side*1.63,.1,z],[25+side*1.28,9.3,z],.30,bridgeRed);pipe([25+side*1.28,9.3,z],[25+side*.35,16.8,z],.27,bridgeRed);pipe([25+side*.35,16.8,z],[25,17.3,z],.18,bridgeRed);for(let step=1;step<10;step++){const cableZ=z+(step%2?1:-1)*Math.ceil(step/2)*2.8;pipe([25+side*.63,14.8-step*.16,z],[25+side*1.68,4.82,cableZ],.018,aged);}}B(bridgeRed,25,7.1,z,3.2,.3,.42);}
 // Street life props remain human-scaled and leave two clear walking lanes.
 for(let x=-27;x<25;x+=5.7){props.lamp(x,9.9);if(x<18){props.bench(x,9.65,Math.PI);}}
 for(let x=-28.8;x<=22.5;x+=1.1){B(M.iron,x,1.3,10.3,.045,1,.045);B(M.iron,x,1.15,10.3,.9,.035,.045);}B(M.iron,-3.1,1.82,10.3,51.5,.06,.065);
 const trees=[];for(const [x,z,requestedScale]of[[-23,-19,1.05],[-13,-17.5,.85],[24,-15,.75],[-27.3,1,1.05],[-26.8,3.6,1],[-24.8,-3.5,1.1],[-15,-9.6,.7],[-25.3,-19,.9],[-14.2,-19,.9],[-10.8,-20,.8]]){const y=ground(x,z),nearTrack=Math.min(...trackPoints.map(p=>Math.hypot(p.x-x,p.z-z)));let scale=requestedScale;if(nearTrack<1.95*scale+.9)scale=Math.min(scale,(9.05-y)/3.6);if(y>0&&scale>.25&&!ctx.obstacles.some(o=>Math.hypot(Math.max(Math.abs(x-o.x)-o.w,0),Math.max(Math.abs(z-o.z)-o.d,0))<scale*1.75)){trees.push({x,y,z,scale});at(x,y,z,0,()=>props.tree(0,0,scale,false,.02));}}
 // Irregular rocky terraces and trailing shrubs articulate the exposed back and side cliffs.
 for(const [points,ledgeY,ledgeH]of[[[[-26,-21],[-4,-21],[5,-19],[21,-21],[21.7,-17]],1.6,1.5],[[[-26,-21],[-26,-12]],1.3,1.3]]){
  for(let edge=0;edge<points.length-1;edge++){const a=points[edge],c=points[edge+1],dx=c[0]-a[0],dz=c[1]-a[1],len=Math.hypot(dx,dz),nx=dz/len,nz=-dx/len;for(let d=.4;d<len;d+=1.2){const x=a[0]+dx*d/len,z=a[1]+dz*d/len,hh=ledgeH+rr(-.24,.24);B(q.sandstone,x+nx*.25,ledgeY,z+nz*.25,1.1,hh,.65,Math.atan2(-dz,dx));if(rr(0,1)>.52){const yy=rr(2.1,4.8),r=rr(.45,.95);ball(x+nx*.45,yy,z+nz*.45,r,.50,.42,M.leafDark);ball(x+nx*.42+.35,yy+.19,z+nz*.42,.51,.35,.31,M.leaf);}}}
 }
 // Hotpot terrace: brass pot, red oil, bowls, stools and chopsticks in geometry.
 at(10,2.2,2.75,0,()=>{for(const x of[-.6,.6]){cyl(x,.55,0,.43,.08,oak);cyl(x,.29,0,.05,.5,M.iron);cyl(x,.65,0,.20,.16,M.cream);cyl(x,.74,0,.17,.015,M.red);for(const s of[-1,1]){B(M.woodLight,x+s*.21,.63,.22,.025,.018,.25,Math.PI/6);cyl(x+s*.22,.62,-.2,.07,.055,M.white);B(oak,x+s*.7,.23,0,.3,.46,.3);}}});
 signage.sign('重庆 · CHONGQING',-6.8,1.75,10.32,3.25,.55,'#31524d','#f0dfbd');
 // River cruise jetty, with a coherent access ramp rather than floating props.
 B(oak,-17,.65,12.5,2.5,.22,4.4);B(M.woodLight,-17,.8,12.5,2.4,.07,4.4);for(const x of[-18.1,-15.9])for(const z of[11,14])cyl(x,.24,z,.09,.85,M.iron);
 const roadCurve=makePath([[[-29,5.0],[19,5.0]],[[19,5.0],[21,5.0],[21,7.0],[19,7.0]],[[19,7.0],[-29,7.0]],[[-29,7.0],[-31,7.0],[-31,5.0],[-29,5.0]]],.82);
 return{ground,peninsula,high,shoulder,trees,buildings:[...q.houses,{id:'Liziba',...station},...towers],station,track,hongya,water:{center:[0,0],level:.03,width:63.7,depth:45.5,outline:outline.map(([x,z])=>[x*.99,z*.99])},roadPoints:roadCurve.getSpacedPoints(80).map(p=>[p.x,p.z]),roadWidth:1.5,footRoutes:[[[-28,8.7],[19,8.7],[19,9.1],[-28,9.1]]],crossings:[],activities:[{x:-22,z:9.2,mode:'taking-photo'},{x:-21,z:9.4,mode:'socializing'},{x:2,z:9.3,mode:'taking-photo'}],lanes:[{id:'RIVER',entry:'RIVER',axis:'LOOP',curve:roadCurve,stopPoint:[17,5],exitDistance:4}],junction:{x:19,z:6,w:2,d:2},signals:[]};
}
