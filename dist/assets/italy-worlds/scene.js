import * as THREE from './vendor/three/build/three.module.js';
import {makePath} from './src/world/terrain.js';
import {createCountryside} from './src/world/countryside.js';

// VALLENUOVA — an Italian hill town in miniature.
// Lower town and its stone gate sit on the valley road; the piazza and its cafés
// hold the middle terrace; the church, bell tower and upper lanes climb the hill.
// Layout is authored here; the reusable systems stay in src/.
export function buildScene(ctx){
 const {M,rr,pick}=ctx;
 const {box,cyl,ball,pipe,at,geometry,geo,transform}=ctx.batch;
 const props=ctx.italianProps, arch=ctx.italianArch, sign=ctx.signage, ter=ctx.terrain;
 const {width:W,depth:D}=ctx.config.terrain;
 const L=.8, CORE=2.4;

 // ================================================================ streets
 const mainZ=D*.39, mainW=3.0;                    // the narrow valley road
 const mainCurve=makePath([[[-W*.48,mainZ-.9],[-W*.17,mainZ+.9],[W*.17,mainZ+.7],[W*.48,mainZ-.8]]]);
 const roadPoints=ter.road(mainCurve,mainW);
 const laneX=W*.365, laneW=2.6;                   // the lane up to the old town
 const laneCurve=makePath([[[laneX-.5,D*.48],[laneX+.6,14.5],[laneX,10.0],[laneX,7.2]]]);
 const lanePoints=ter.road(laneCurve,laneW);
 const allRoad=[...roadPoints,...lanePoints];
 // crossing stripes
 for(const cx of[-6.0,3.0])ter.crosswalk(cx,mainZ+.55,mainW+.2,2.2,0);
 // road edge lines and stop line by the gate
 for(const sz of[-1,1])for(const[x0,x1]of[[-W*.46,-2.6],[-0.6,W*.46]])box((x0+x1)/2,.838,mainZ+sz*(mainW/2-.16),x1-x0,.012,.10,M.trimWhite);
 box(-1.6,.838,mainZ,2.0,.012,.22,M.trimWhite);
 for(const[mx,mz]of[[-12.0,mainZ-.7],[6.4,mainZ+.6],[17.2,mainZ-.5]])cyl(mx,.842,mz,.30,.014,M.iron);
 for(const[px,pz2,w2,d2]of[[-3.4,mainZ,1.1,1.0],[14.8,mainZ,1.4,1.2]])box(px,.836,pz2,w2,.008,d2,ctx.mat('#6f6a5e'));
 // verge planting along the road outside the gate
 props.lavender?.(-9.6,mainZ-mainW/2-1.0,5);props.rosemary?.(8.6,mainZ-mainW/2-.9,4);
 props.parkingSign?.(-13.6,mainZ-mainW/2-.9,.1);props.trashBin?.(4.0,mainZ+mainW/2+.9);
 ter.crosswalk(laneX,16.2,laneW+.2,2.0,Math.PI/2);

 // ================================================================ terraces & levels
 // Upper old town terrace, with a stone retaining wall above the north houses.
 const upperY=6.8;
 ter.terrace(0,-20.3,W*.92,8.4,6.0,.8);
 // a second, higher shoulder of houses behind the first terrace
 // West hillside garden terrace with two villas.
 ter.terrace(-27.2,-6.0,6.8,12.6,.75,.8);
 // Church plinth, three steps down to the piazza.
 box(-17,4.3+.16,-11.2,10.6,.32,9.8,M.stoneFlag);
 for(let i=0;i<4;i++)box(-17,4.4-i*.17,-6.35+i*.02,7.0,.17,.36,M.trimStone);
 // Retaining walls and the two staircase alleys up to the old town.
 for(const[wx,wz,ww,wd]of[[-6.2,-15.55,7.4,.44],[8.8,-15.55,8.2,.44]]){
  box(wx,5.55,wz,ww,2.5,.44,M.trimStone);box(wx,6.8,wz,ww,.16,.62,M.trimWhiteStone);
  for(let bx=wx-ww/2+1.0;bx<wx+ww/2;bx+=2.4)box(bx,5.55,wz+.28,.46,2.5,.5,M.trimStone);
 }
 // second tier retaining wall high behind the old town
 box(0,6.8+.60,-24.7,W*.86,1.2,.4,M.trimStone);box(0,6.8+1.24,-24.7,W*.86,.12,.5,M.trimWhiteStone);

 // ================================================================ piazza paving
 ctx.batch.at(0,CORE,0,0,()=>{
 const pz=1.4, pw=24.2, pd=16.8;
 const paveW=1024,paveH=Math.round(1024*pd/pw),sc=paveW/pw;
 const paveTex=sign.textureCanvas(paveW,paveH,(c,w,h)=>{
  const cx=w/2,cy=h/2,maxR=Math.hypot(w,h)/2;
  c.fillStyle='#b1a996';c.fillRect(0,0,w,h);
  // irregular Tuscan flagstone courses
  for(let r=0;r<Math.ceil(h/(.85*sc));r++){
   const off=(r%2)*sc*.55,rowH=.86*sc;
   for(let x=-2*sc;x<w+2*sc;x+=sc*(1.18+((r*7)%3)*.14)){
    const shade=162+Math.floor(((r*13+Math.floor(x))%19))*2;
    c.fillStyle=`rgb(${shade+16},${shade+5},${shade-17})`;
    c.fillRect(x+off+1.2,r*rowH+1.2,sc*(1.02+((r*5)%3)*.14),rowH-2.4);
    c.strokeStyle='rgba(74,64,50,.42)';c.lineWidth=1.7;c.strokeRect(x+off,r*rowH,sc*(1.08+((r*5)%3)*.14),rowH);
   }
  }
  // fan medallion beneath the fountain
  c.save();c.translate(cx,cy);
  for(let ring=0;ring<7;ring++){const rr0=(1.05+ring*1.05)*sc,seg=11+ring*3;
   for(let i=0;i<seg;i++){const a0=i/seg*Math.PI*2,a1=(i+1)/seg*Math.PI*2;
    c.beginPath();c.moveTo(Math.cos(a0)*rr0,Math.sin(a0)*rr0);c.arc(0,0,rr0+1.04*sc,a0,a1);c.closePath();
    c.fillStyle=ring%2?'rgba(255,250,236,.11)':'rgba(72,62,48,.07)';c.fill();
    c.strokeStyle='rgba(72,62,48,.32)';c.lineWidth=Math.max(1.2,sc*.04);c.stroke();
   }
  }
  c.beginPath();c.arc(0,0,3.0*sc,0,Math.PI*2);c.strokeStyle='rgba(90,78,58,.5)';c.lineWidth=sc*.12;c.stroke();
  c.restore();
  c.strokeStyle='rgba(80,68,50,.30)';c.lineWidth=sc*1.5;c.strokeRect(sc*.8,sc*.8,w-sc*1.6,h-sc*1.6);
  c.strokeStyle='rgba(255,250,236,.14)';c.lineWidth=sc*.14;c.strokeRect(sc*1.7,sc*1.7,w-sc*3.4,h-sc*3.4);
  for(let i=0;i<1800;i++){c.fillStyle=`rgba(${60+Math.random()*60|0},${54+Math.random()*50|0},${42+Math.random()*40|0},${(.03+Math.random()*.05).toFixed(3)})`;c.fillRect(Math.random()*w,Math.random()*h,sc*(.03+Math.random()*.09),sc*(.03+Math.random()*.09));}
  for(let i=0;i<10;i++){c.beginPath();c.ellipse(Math.random()*w,Math.random()*h,sc*(.4+Math.random()*1.4),sc*(.3+Math.random()*.9),Math.random()*3,0,Math.PI*2);c.fillStyle=`rgba(255,250,236,${(.02+Math.random()*.04).toFixed(3)})`;c.fill();}
  for(const[gx,gy]of[[sc*2.4,h-sc*3.2],[w-sc*3.4,sc*2.6]]){c.fillStyle='#6c665a';c.fillRect(gx,gy,sc*.95,sc*.55);for(let k=0;k<5;k++){c.fillStyle='#4a463d';c.fillRect(gx+sc*.08+k*sc*.17,gy+sc*.07,sc*.07,sc*.40);}}
 });
 const paveMat=ctx.mat('#ffffff',{map:paveTex});
 box(0,L-.006,pz,pw,.03,pd,paveMat);
 for(const s of[-1,1]){box(0,L+.04,pz+s*pd/2,pw+.26,.16,.24,M.trimStone);box(s*pw/2,L+.04,pz,.24,.16,pd+.26,M.trimStone);}
 props.fountain(0,pz,2.15);

 });

 // the piazza terrace itself: a solid stone bench above the lower town
 const coreStone=arch.surface('stone','#cdb48e');
 box(0,.8+CORE/2,1.5,25.0,CORE,17.0,coreStone);
 box(0,.8+CORE+.02,1.5,25.2,.10,17.2,M.trimWhiteStone);
 // south retaining wall: buttresses, blind arches, a vaulted stair portal
 box(0,.8+CORE*.52,10.05,25.2,CORE*1.04,.34,coreStone);
 for(let bx=-11;bx<=11;bx+=3.2){box(bx,.8+CORE*.55,10.24,.5,CORE*1.1,.42,coreStone);}
 for(const bx of[-8.6,-5.4,-2.2,6.2,9.4]){
  // blind arch niches with weathered stone surrounds
  box(bx,.8+CORE*.50,10.24,1.6,1.75,.10,M.archDark);
  for(let k=0;k<7;k++){const a=Math.PI*k/6;box(bx+Math.cos(a)*.9,.8+CORE*.82+Math.sin(a)*.9,10.30,.24,.20,.22,M.trimWhiteStone,0,0,a-Math.PI/2);}
  box(bx,1.05,10.30,1.1,1.9,.08,M.trimLightStone);
  box(bx,.92,10.28,2.1,.24,.20,M.trimStone);
 }
 // ---- switchback cart road: three stone-stepped legs zig-zag up to the piazza
 function stepRun(x0,z0,x1,z1,width,steps,y0,y1){
  const dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz),ang=Math.atan2(dx,dz);
  const dy=(y1-y0)/steps, ux=dx/len, uz=dz/len, nx=uz, nz=-ux;
  for(let i=0;i<steps;i++){
   const t=(i+.5)/steps, x=x0+dx*t, z=z0+dz*t, y=y0+dy*(i+.5);
   at(x,y,z,-ang,()=>{
    box(0,0,0,.66,.18,width,M.trimStone);
    box(0,.10,0,.52,.05,width-.18,M.stoneFlag);
   });
   if(i%2===0){
    for(const sd of[-1,1]){
     const px=x+nx*sd*(width/2+.16), pz=z+nz*sd*(width/2+.16);
     at(px,y+.38,pz,-ang,()=>{
      box(0,0,0,.44,.76,.17,M.trimStone);
      box(0,.42,0,.52,.07,.24,M.trimWhiteStone);
     });
     at(x+nx*sd*(width/2-.24),y+.105,z+nz*sd*(width/2-.24),-ang,()=>box(0,0,0,.46,.04,.26,M.trimWhiteStone));
    }
   }
  }
 }
 function landing(cx,cz,w,d,y){
  box(cx,y-.08,cz,w,.16,d,M.trimStone);
  box(cx,y+.01,cz,w+.12,.05,d+.12,M.stoneFlag);
  // low parapet around the outer edge of the hairpin
  box(cx,y+.28,cz+d/2,w,.55,.18,M.trimStone);
  box(cx,y+.56,cz+d/2,w+.06,.07,.24,M.trimWhiteStone);
  for(const sx of[-w/2,w/2])box(cx+sx,y+.28,cz,.18,.55,d,M.trimStone);
 }
 stepRun(-2.0,22.9, 9.6,19.3, 3.4, 20, .80,1.85);
 landing(10.6,18.0,3.4,2.8,1.85);
 stepRun(10.4,17.2, -8.2,15.8, 3.4, 26, 1.85,2.65);
 landing(-9.6,14.6,3.2,2.7,2.65);
 stepRun(-8.6,13.8, -3.6,11.0, 3.2, 10, 2.65,3.20);
 landing(-3.4,10.4,3.2,2.2,3.20);
 // lamps, cypress and a shrine mark the hairpins
 props.lamp(-2.4,22.0,.3);props.lamp(12.2,18.0,-1.6,1.85);props.lamp(-11.2,14.6,1.6,2.65);
 props.cypress(-10.8,17.6,1.0);props.cypress(12.8,15.0,.9);
 props.planter(11.6,19.6,.36);props.planter(-10.8,16.0,.36);
 // side steps from the piazza down to the west / east shop benches
 for(let i=0;i<3;i++)box(-13.0-i*.32,.8+CORE*.5-i*.14,-2.0,3.0,.16,.34,M.trimStone,0,0,0);
 for(let i=0;i<4;i++)box(12.3+i*.32,.8+CORE*.45-i*.13,0.6,2.8,.15,.34,M.trimStone);
 // bollards and a lamp at the street mouth
 for(const bx of[-4.6,1.4]){cyl(bx,.8+.42,22.6,.07,.84,M.iron);ball(bx,.8+.90,22.6,.10,.10,.10,M.brass);}
 props.lamp(-5.0,22.0,.4);
 props.vineWall?.(-7.4,1.0,0,3.6,2.2);props.vineWall?.(4.2,1.0,0,4.0,2.4);

 // ================================================================ hillside terraces
 // The town climbs the slope as solid stone-held terraces: each row of houses
 // sits on its own bench, linked by stairs, with the piazza as the main terrace.
 function terracePad(x,z,w,d,h,base=.8,faces='s'){
  // solid stone body so the terrace reads as a hill bench, not a floating slab
  box(x,base+h/2,z,w,h,d,M.trimStone);
  box(x,base+h-.06,z,w+.14,.14,d+.14,M.trimWhiteStone);
  box(x,base+h-.16,z,w+.10,.06,d+.10,M.stoneFlag);
  if(faces.includes('s'))box(x,base+h*.55,z+d/2+.02,w,h*1.1,.30,M.trimStone);
  if(faces.includes('n'))box(x,base+h*.55,z-d/2-.02,w,h*1.1,.30,M.trimStone);
  if(faces.includes('e'))box(x+w/2+.02,base+h*.55,z,.30,h*1.1,d,M.trimStone);
  if(faces.includes('w'))box(x-w/2-.02,base+h*.55,z,.30,h*1.1,d,M.trimStone);
  return base+h;
 }
 // big bench under the north row + church
 const yN=terracePad(-1.4,-11.7,42.0,8.2,3.50,.8,'s');
 // west café bench
 const yW=terracePad(-17.8,2.4,8.0,12.4,2.00,.8,'e');
 // east shop bench
 const yE=terracePad(16.4,0.6,8.6,17.6,2.20,.8,'w');
 // market lane bench
 const yM=terracePad(-19.8,11.4,15.6,7.0,1.90,.8,'es');
 // café lane bench (east of the piazza)
 const yL=terracePad(16.6,12.0,10.4,8.4,1.70,.8,'wn');
 // upper old town bench is the existing high terrace at y=6.8

 // stone stair flights up to the benches
 function flight(cx,cz,width,dir,n,rise,run,y0=.8){
  const absRise=Math.abs(rise);
  for(let i=0;i<n;i++){
   const dx=dir==='e'?run:dir==='w'?-run:0, dz=dir==='s'?run:dir==='n'?-run:0;
   box(cx+dx*i,y0+rise*i-absRise/2,cz+dz*i,dir==='e'||dir==='w'?.36:width,absRise+.02,dir==='n'||dir==='s'?.36:width,M.trimStone);
   if(i%2===0)box(cx+dx*i,y0+rise*i+.10,cz+dz*i+.001,(dir==='e'||dir==='w')?.36:width,absRise*.9,(dir==='n'||dir==='s')?.36:width,M.stoneFlag);
  }
 }
 // piazza -> north bench
 flight(-7.0,-6.55,3.4,'n',7,.157,.32,3.2);
 flight(4.0,-6.55,3.4,'n',7,.157,.32,3.2);
 // piazza -> west café bench
 flight(-13.65,3.0,3.0,'w',3,-.14,.34,3.2);
 // piazza -> east shop bench
 flight(12.35,1.0,2.8,'e',2,-.10,.32,3.2);
 // market lane bench
 flight(-12.35,12.0,2.8,'w',3,-.17,.32,3.2);
 // café lane bench
 flight(12.3,16.0,2.8,'e',4,-.175,.32,3.2);
 // north bench -> upper old town (long curved flight up the hill)
 flight(-1.5,-14.55,2.2,'n',15,.167,.32,4.3);
 flight(14.2,-14.55,2.8,'n',15,.167,.32,4.3);
 // a switchback ramp curling up the west side
 flight(-14.4,-1.4,2.4,'w',12,.167,.32,.8);
 box(-17.4,2.85,-3.6,3.6,.18,2.4,M.trimStone);
 flight(-17.4,-4.9,2.4,'n',3,.15,.32,2.9);

 // ================================================================ buildings// ================================================================ buildings
 const buildings=[];
 const B=(b)=>{buildings.push(b);return b;};
 // ---- north side of the piazza (fronts face +z / south)
 B(arch.palazzo({id:'albergo',x:-6.6,z:-11.6,y:yN,w:8.0,d:7.0,floors:3,color:'#e8d3a8',finish:'plaster',label:'ALBERGO',roof:'terrace',shutterColor:M.shutterGreen,french:true,signColor:'#5b2a1e',awningColor:M.awningRose}));
 B(arch.casa({id:'casa-rosa',x:2.7,z:-11.2,y:yN,w:6.2,d:6.2,floors:2,color:'#eccfc0',finish:'plaster',label:''}));
 B(arch.casa({id:'casa-crema',x:10.0,z:-11.3,y:yN,w:5.4,d:5.8,floors:2,color:'#f0e6cf',finish:'plaster',label:''}));
 // ---- the church and its bell tower (west of the piazza)
 if(arch.church){
  at(0,yN-.8,0,0,()=>{B(arch.church({id:'chiesa',x:-17,z:-11.2,w:8.4,d:9.0,h:12.5,color:'#d8c7a4',tower:'#cbb894'}));});
 }else{
  B(arch.palazzo({id:'chiesa',x:-17,z:-11.2,w:9,d:8.4,floors:2,color:'#d8c7a4',label:'CHIESA',ground:'arch',roof:'hipped'}));
  B(arch.campanile({id:'campanile',x:-21.4,z:-13.4,size:2.9,height:21,color:'#cbb894'}));
 }
 // ---- east side of the piazza (fronts face -x)
 B(arch.palazzo({id:'enoteca',x:15.6,z:-3.6,y:yE,w:5.4,d:5.6,floors:2,rot:-Math.PI/2,color:'#e3cba6',label:'ENOTECA',roof:'hipped',shutterColor:M.shutterBrown,french:true}));
 B(arch.casa({id:'alimentari',x:15.4,z:3.1,y:yE,w:5.0,d:5.2,floors:2,rot:-Math.PI/2,color:'#f1e5c8',finish:'stucco',label:'ALIMENTARI',door:M.woodDark}));
 B(arch.casa({id:'farmacia',x:16.6,z:9.3,y:yE,w:4.4,d:5.4,floors:2,rot:-Math.PI/2,color:'#e7d6c0',finish:'plaster',label:'FARMACIA'}));
 // ---- west side of the piazza: café and trattoria (fronts face +x, into the sun)
 B(arch.palazzo({id:'caffe',x:-16.0,z:5.5,y:yW,w:6.2,d:4.4,floors:2,rot:Math.PI/2,color:'#ecd6ad',finish:'plaster',label:'CAFFÈ OLIVA',roof:'terrace',shutterColor:M.shutterGreen,french:true,signColor:'#6d2a20',awningColor:M.awningRose}));
 B(arch.palazzo({id:'trattoria',x:-16.2,z:-2.1,y:yW,w:6.2,d:4.4,floors:3,rot:Math.PI/2,color:'#d99a7c',finish:'plaster',label:'TRATTORIA',roof:'hipped',shutterColor:M.shutterBrown,french:true,signColor:'#54341c',awningColor:M.awningGreen}));
 // ---- market lane (south-west): buildings face the lane at z≈10.8-13.5
 B(arch.casa({id:'forno',x:-22.6,z:8.6,y:yM,w:5.8,d:4.4,floors:2,color:'#e8d2ac',finish:'stucco',label:'FORNO',door:M.woodDark}));
 B(arch.palazzo({id:'mercato',x:-22.6,z:15.6,y:yM,w:6.4,d:4.2,floors:3,rot:Math.PI,color:'#dcc5a0',label:'MERCATO',ground:'shop',roof:'hipped',shutterColor:M.shutterBrown,awningColor:M.awningGreen,signColor:'#3f4a30'}));
 B(arch.casa({id:'casa-ovest',x:-15.7,z:15.7,y:yM,w:4.2,d:3.2,floors:2,rot:Math.PI,color:'#eed3b8',finish:'plaster'}));
 B(arch.casa({id:'casa-ovest-2',x:-29.0,z:11.7,y:yM,w:3.5,d:3.0,floors:3,rot:-Math.PI/2,color:'#d7ccb8',finish:'stone'}));
 // ---- lower town: low garden walls (foreground kept open for the car view)
 box(-21.0,.8+.45,23.4,9.0,.9,.4,M.trimStone);
 for(const cx of[-18.6,-15.0,-11.6]){props.cypress(cx,23.6,.9);}
 B(arch.casa({id:'casa-approdo',x:-16.4,z:21.9,w:4.4,d:3.2,floors:1,rot:Math.PI,color:'#e6d0ac',finish:'plaster'}));
 B(arch.casa({id:'casa-approdo-2',x:15.8,z:22.0,w:4.4,d:3.2,floors:1,rot:Math.PI,color:'#e0c4a2',finish:'stucco'}));
 // ---- upper old town on the terrace
 for(const[ux,uz,uw,uf,col]of[[-8,-21.4,5.6,3,'#e2c9a4'],[-1.1,-21.8,5.0,4,'#d9b58c'],[5.8,-21.5,5.8,3,'#e6cfae'],[12.8,-21.6,5.2,4,'#e0b79c']]){
  B(arch.casa({id:'upper-'+ux,x:ux,z:uz,y:upperY,w:uw,d:4.6,floors:uf,color:col,finish:'plaster',rot:Math.PI}));
 }
 // back row of the old town, higher and simpler, reading as layered rooftops
 for(const[ux,uz,uw,uf,col]of[[-14.0,-23.3,4.6,3,'#dcc2a0'],[-7.8,-23.5,4.4,4,'#e4d0b0'],[-1.6,-23.6,4.6,4,'#d9b78f'],[4.2,-23.4,4.4,3,'#e8d8bc'],[10.2,-23.2,4.8,4,'#dfc09a']]){
  B(arch.casa({id:'upper2-'+ux,x:ux,z:uz-6.2,y:upperY+1.4,w:uw,d:3.2,floors:uf,color:col,finish:'plaster',rot:Math.PI}));
 }
 // ---- east lane houses, closing the street wall on the lane
 B(arch.palazzo({id:'casa-lane-1',x:27.9,z:-6.4,w:5.4,d:4.4,floors:3,rot:-Math.PI/2,color:'#efe6d0',finish:'plaster',label:''}));
 B(arch.casa({id:'casa-lane-2',x:28.4,z:0.2,w:4.8,d:4.0,floors:2,rot:-Math.PI/2,color:'#e9cfc2',finish:'stucco'}));
 B(arch.casa({id:'casa-lane-3',x:28.6,z:6.6,w:5.0,d:4.2,floors:3,rot:-Math.PI/2,color:'#ecd6ad',finish:'stone'}));
 // ---- east hillside villa and olive terrace
 B(arch.casa({id:'villa-est',x:20.0,z:-13.3,y:.8,w:5.0,d:4.2,floors:2,rot:-Math.PI/2,color:'#e3c8a6',finish:'stucco'}));
 for(const[wx,wz,ww,wd]of[[30.2,-2,0.4,18],[23.8,20.2,8.2,0.36]]){box(wx,.8+.24,wz,ww,.48,wd,M.trimStone);box(wx,.8+.52,wz,ww,.08,wd,M.trimWhiteStone);}
 for(const[x,z,s]of[[27.0,8.6,1.0],[29.0,-6.6,.9],[26.0,15.8,1.05]])props.oliveTree?.(x,z,s,.8);
 props.cypress(29.8,17.6,1.15);
 // ---- hillside villas on the west terrace
 B(arch.casa({id:'villa-1',x:-27.2,z:-9.4,y:1.55,w:4.6,d:4.0,floors:2,rot:Math.PI/2,color:'#e0cda8',finish:'stucco'}));
 B(arch.casa({id:'villa-2',x:-27.4,z:-2.6,y:1.55,w:4.4,d:3.8,floors:2,rot:Math.PI/2,color:'#dab69a',finish:'plaster'}));

 // ================================================================ gate + arches
 // ---- stone town gate over the valley road at the lower town entrance
 const gateX=-1.6, gN=mainZ-mainW/2-.85, gS=mainZ+mainW/2+.85;
 const gateStone=arch.surface('stone','#d3b891');
 for(const gz of[gN,gS]){
  box(gateX,2.3,gz,1.35,4.6,1.35,gateStone);
  box(gateX,.55,gz,1.65,.30,1.65,M.trimWhiteStone);
  box(gateX,4.45,gz,1.70,.26,1.70,M.trimWhiteStone);
  for(let i=0;i<3;i++)box(gateX,4.72+i*.16,gz,1.55-i*.38,.18,1.55-i*.38,M.terracotta);
  ball(gateX,5.28,gz,.16,.18,.16,M.trimWhiteStone);
  // tiny arrow-slit window in each tower
  box(gateX,3.1,gz+ (gz<mainZ? .69:-.69),.16,.62,.04,M.archDark);
 }
 for(let k=0;k<11;k++){const a=Math.PI*k/10;box(gateX,4.05+Math.sin(a)*1.55,mainZ+Math.cos(a)*1.55,.95,.46,.46,M.trimStone,0,0,a-Math.PI/2);}
 box(gateX,5.55,mainZ,1.1,.34,3.9,M.terracottaDark);
 box(gateX,4.25,mainZ,1.65,.66,.16,M.trimWhiteStone);
 geometry(geo.plane,sign.signMat('VALLENUOVA','#45573f','#f2e7c8'),transform(gateX,4.25,mainZ+mainW/2+.02,1.50,.46,1,0,Math.PI,0));
 // gate lanterns
 for(const gz of[gN,gS]){pipe([gateX,.8+3.4,gz],[gateX,.8+3.4,gz+(gz<mainZ?1.1:-1.1)],.03,M.iron);ball(gateX,.8+3.20,gz+(gz<mainZ?1.1:-1.1),.11,.14,.11,M.lamp);}
 // low town walls running away from the gate along the road
 for(const bx of[-5.6,2.6]){cyl(bx,.8+.44,gS+.55,.07,.88,M.iron);ball(bx,.8+.94,gS+.55,.10,.10,.10,M.brass);}
 props.lamp(-5.4,mainZ+mainW/2+2.1,Math.PI);
 // foreground: grass banks, dry-stone edging and planting below the road
 for(const[bx,bz,bw,bd2]of[[-19.5,22.6,9.0,3.4],[9.0,22.4,8.0,3.0]])
  ctx.batch.geometry(new THREE.BoxGeometry(1,1,1),M.tuscanGrass,new THREE.Matrix4().makeTranslation(bx,.785,bz).multiply(new THREE.Matrix4().makeScale(bw,.05,bd2)));
 props.lavender?.(-19.0,21.4,6);props.lavender?.(9.4,21.2,5);props.rosemary?.(-23.4,21.8,5);
 props.oliveTree?.(-23.6,20.8,.9);props.oliveTree?.(24.0,20.2,1.0);
 // approach to the gate: cypress pair and lavender beds below the town wall
 for(const[cx,cz]of[[-6.2,gS+2.3],[3.4,gS+2.2],[-9.8,gS+2.4]])props.cypress(cx,cz,1.0);
 props.lavender?.(gateX-3.6,gS+2.4,5);props.lavender?.(gateX+3.6,gS+2.4,4);
 props.oliveTree?.(-13.8,gS+2.6,.85);props.oliveTree?.(18.2,24.4,.9);
 box(gateX,.84,gS+2.9,8.4,.10,1.6,ctx.mat('#b3ab99'));
 box(gateX-5.0,.8+.42,gS+3.7,4.2,.84,.4,M.trimStone);
 box(gateX+5.0,.8+.42,gS+3.7,4.2,.84,.4,M.trimStone);
 props.bench(-4.6,gS+2.6,0);props.bench(1.4,gS+2.6,Math.PI);
 // stone well in the east courtyard
 at(21.8,.8,2.6,0,()=>{
  cyl(0,.45,0,.72,.9,M.trimStone);cyl(0,.92,0,.60,.10,M.trimWhiteStone);cyl(0,.86,0,.52,.06,M.water);
  for(const sx of[-.62,.62]){box(sx,1.55,0,.14,1.35,.14,M.iron);}
  geometry(geo.box,M.iron,transform(0,2.22,0,1.42,.10,.10,0,0,0));
  cyl(0,1.95,0,.05,.42,M.iron);cyl(0,1.90,0,.22,.28,M.wood);
  box(0,1.52,0,.04,.42,.04,M.iron);cyl(0,1.28,0,.14,.26,M.wood);
 });
 // bollards and a lamp by the gate
 // Alley arch between the hotel and the pink house, seen from the piazza.
 for(const ax of[-2.75,-.25]){box(ax,5.8,-8.05,.55,4.6,.9,M.trimStone);box(ax,4.4,-8.05,.78,.22,.55,M.trimWhiteStone);}
 for(let k=0;k<9;k++){const a=Math.PI*k/8;box(-1.5,7.85+Math.sin(a)*1.22,-8.05,.52,.34,.30,M.trimStone,0,0,a-Math.PI/2);}
 box(-1.5,9.12,-8.05,2.5,.24,.95,M.terracottaDark);
 // small arched passage at the church alley as well
 for(const ax of[-11.05,-12.15])box(ax,2.2,-9.0,.42,4.4,.7,M.trimStone);
 for(let k=0;k<7;k++){const a=Math.PI*k/6;box(-11.6,4.1+Math.sin(a)*.55,-9.0,.4,.26,.24,M.trimStone,0,0,a-Math.PI/2);}

 // ================================================================ town floor
 // A warm stone apron under the denser streets; the hill grass shows outside it.
 const floorTex=sign.textureCanvas(512,512,(c,w,h)=>{
  c.fillStyle='#8f8878';c.fillRect(0,0,w,h);
  const row=h/18;
  for(let r=0;r<18;r++){
   const off=(r%2)*16;
   for(let x=-32;x<w+32;x+=32){
    const g=126+Math.floor(((r*11+x)%23))*2;
    c.fillStyle=`rgb(${g+14},${g+4},${g-16})`;
    c.fillRect(x+off+1.5,r*row+1.5,29,row-3);
    c.strokeStyle='rgba(58,50,40,.50)';c.lineWidth=2;c.strokeRect(x+off,r*row,32,row);
    c.strokeStyle='rgba(255,246,228,.10)';c.lineWidth=1;c.strokeRect(x+off+1.6,r*row+1.6,28,row-3.2);
   }
  }
  for(let i=0;i<1200;i++){c.fillStyle=`rgba(40,34,26,${(.03+Math.random()*.05).toFixed(3)})`;c.fillRect(Math.random()*w,Math.random()*h,2,2);}
  for(let i=0;i<7;i++){c.beginPath();c.ellipse(Math.random()*w,Math.random()*h,20+Math.random()*60,12+Math.random()*40,Math.random()*3,0,Math.PI*2);c.fillStyle=`rgba(255,248,232,${(.015+Math.random()*.025).toFixed(3)})`;c.fill();}
 });
 floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;floorTex.repeat.set(13,11);
 const floorMat=ctx.mat('#cfc7b4',{map:floorTex});
 box(0,L-.02,2.2,40.0,.02,33.5,floorMat);
 // stone paths out to the church forecourt and the eastern lane
 box(-12.6,L-.01,-2.6,3.2,.02,9.0,floorMat);
 box(21.6,L-.01,8.0,3.0,.02,14.0,floorMat);
 // low stone garden walls along the east and west hill edges
 for(const[wx,wz,ww,wd]of[[23.6,14.6,0.4,7.0],[-23.8,10.0,0.4,10.0],[-23.8,-13.0,0.4,6.0]]){
  box(wx,.8+.26,wz,ww,.52,wd,M.trimStone);box(wx,.8+.55,wz,ww+.06,.06,wd+.06,M.trimWhiteStone);
 }
 // limonaia (little lemon house) in the east garden
 at(28.6,0.8,13.0,-Math.PI/2,()=>{
  box(0,1.3,0,4.6,2.6,3.2,ctx.italianArch.surface('plaster','#e3d2ae'));
  box(0,2.68,0,4.9,.20,3.5,M.terracottaDark);
  for(let i=0;i<3;i++)box(-1.4+i*1.4,2.86,0,4.6-i*.3,.24,3.3-i*.3,M.terracotta);
  box(0,0.06,1.62,4.6,.12,.18,M.trimStone);
  for(const sx of[-1.2,-.3,.6,1.5])box(sx,1.15,1.63,.36,.9,.06,M.windowDark);
 });
 // west garden: pergola over the path and a small toolshed
 props.pergola(-27.6,6.4,4.4,2.4,Math.PI/2);
 props.lemonTree?.(28.4,4.6,1.0,.8);

 // ---- lower town wall along the valley road, broken by the gate
 for(const[wz,ww]of[[mainZ+mainW/2+1.6,10.0],[-1,-1]]){
  if(ww<0)continue;
 }
 for(const[wx,ww]of[[-22.0,18.0],[12.0,20.0]]){
  box(wx,.8+.55,mainZ+mainW/2+1.55,ww,1.1,.55,M.trimStone);
  box(wx,.8+1.12,mainZ+mainW/2+1.55,ww+.06,.10,.65,M.trimWhiteStone);
 }
 for(const[wx,ww]of[[-22.0,18.0],[10.6,22.0]]){
  box(wx,.8+.42,mainZ-mainW/2-1.55,ww,.84,.45,M.trimStone);
 }
 // gate forecourt: bollards, scooter and crates by the lower town
 props.vespaParked(7.0,mainZ+mainW/2+1.2,1.3,M.paintBlue);
 props.vespaParked(-8.8,mainZ+mainW/2+1.1,-1.2,M.paintYellow);
 props.crates?.(-14.4,mainZ+mainW/2+2.2,.3);
 props.oliveTree?.(24.2,mainZ+mainW/2+2.8,1.0,.8);
 props.cypress(-27.6,mainZ+mainW/2+2.0,1.1);
 props.lamp(-11.2,mainZ+mainW/2+1.2,Math.PI);props.lamp(12.4,mainZ+mainW/2+1.2,Math.PI);

 // church forecourt: a quiet stone apron west of the piazza
 box(-17,4.32,-4.2,9.6,.06,3.6,ctx.mat('#b2ab98'));
 props.lamp(-21.2,4.3,-3.0,0);props.lamp(-12.8,4.3,-3.0,0);
 props.bench(-20.2,4.3,-3.4);props.bench(-13.8,4.3,-3.4);
 props.planter(-21.4,4.3,-5.2,.42);props.planter(-12.6,4.3,-5.2,.42);
 // Removed two inverted cypresses (negative scale from swapped arguments).
 for(let i=0;i<60;i++)ctx.random(); // Preserve the original layout of later details.
 props.laundry([-21.2,7.6,-7.8],[-13.4,7.7,-7.8],4.0,.4);

 // cypress ridge and garden on the highest terrace: the hill-town silhouette
 for(const[cx,cs]of[[-22.4,2.0],[-17.0,1.7],[-11.6,2.1],[-4.8,1.6],[2.2,2.0],[9.0,1.7],[16.0,2.1],[22.6,1.8]]){
  props.cypress(cx,-24.4,cs,6.8);
 }
 for(const[cx]of[[-19.6],[-6.4],[6.8],[18.4]])props.oliveTree?.(cx,-22.2,.8,6.8);
 props.pergola(-19.2,-20.8,3.4,2.0,0,6.8);
 // hanging lamps and vines on the piazza facades
 if(props.wallLamp){
  props.wallLamp(-13.9,3.5,2.6,Math.PI/2);props.wallLamp(-13.9,3.5,6.4,Math.PI/2);
  props.wallLamp(-0.4,3.4,-8.0,0);props.wallLamp(7.8,3.4,-8.0,0);
  props.wallLamp(12.9,3.5,4.0,-Math.PI/2);
 }

 // ================================================================ planting
 for(const[x,z,s,k]of[[-23.6,-6.4,1.35,'cypress'],[-13.2,-16.4,1.15,'cypress'],[14.2,-16.2,1.2,'cypress'],
   [-25.8,3.4,1.1,'cypress'],[24.6,-7.6,1.05,'pine'],[28.6,3.2,1.0,'cypress'],[-12.2,-5.2,.85,'pine']]){
  props.treeIfClear(x,z,s,k);
 }
 for(const[x,z,s]of[[-25.6,-18.6,1.2],[-19.8,-19.6,1.0],[17.8,-20.2,1.1],[23.4,-19.4,.95],[28.8,12.8,1.05],[-29.6,-16.8,1.0]]){
  props.oliveTree?.(x,z,s,1.55);
 }
 props.balustrade(-11.6,9.35,-4.4,9.35);props.balustrade(4.4,9.35,11.6,9.35);
 props.lamp(-1.4,9.55,0);props.lamp(-7.4,9.55,0);props.lamp(5.2,9.55,0);
 props.planter(-11.4,8.0);props.planter(11.8,8.2);props.planter(-11.9,-5.2);props.planter(12.2,-5.0);
 props.lemonPot?.(-9.2,9.4);props.lemonPot?.(9.8,9.3);props.lemonPot?.(-13.6,10.2);
 props.vineWall?.(-23.6,1.6,Math.PI/2,4.8,3.0);
 props.vineWall?.(-13.1,-10.6,0,4.4,3.0);
 props.vineWall?.(12.9,9.6,Math.PI,4.6,3.2);
 props.lavender?.(-11.8,8.9,4);props.lavender?.(12.0,9.0,3);props.rosemary?.(-17.2,10.4,5);
 // east hillside garden: olive grove, lavender and cypress along the walls
 for(const[x,z,s2]of[[25.2,10.6,1.0],[28.2,8.4,.95],[27.0,-4.2,1.05],[30.0,3.0,.9],[25.6,-2.0,.8]])props.oliveTree?.(x,z,s2,.8);
 props.lavender?.(26.0,12.0,6);props.lavender?.(29.2,10.4,5);props.rosemary?.(25.6,5.4,4);
 props.cypress(24.4,16.4,1.05);props.cypress(30.0,17.0,.95);props.cypress(25.0,-7.0,.9);
 props.lavender?.(-25.4,1.4,5);props.rosemary?.(-28.8,0.2,4);props.cypress(-30.0,-13.0,1.0);
 props.flowerBush?.(-24.6,3.6,1.0,'bougainvillea');props.flowerBush?.(-25.2,8.4,.9,'geranium');
 for(const[x,z]of[[-29.4,9.8],[-26.4,12.6]])props.oliveTree?.(x,z,1.0,.8);

 const GH=(x,z)=>(x>-12.2&&x<12.2&&z>-7.6&&z<10.1)?3.2:(z>-16.0&&z<-7.6&&x>-22.4&&x<20.6)?4.3:(x>-21.8&&x<-13.7&&z>-3.9&&z<8.7)?2.8:(x>12.1&&x<20.8&&z>-8.3&&z<9.5)?3.0:(x>-27.6&&x<-12.0&&z>7.8&&z<15.0)?2.7:(x>11.4&&x<21.9&&z>7.7&&z<16.4)?2.5:.8;
 ctx.batch.at(0,CORE,0,0,()=>{
 // ================================================================ piazza life
 const cafeSets=[[-6.4,7.4,.25,M.awningRose],[-2.4,8.3,-.2,M.awningCream],[3.6,7.8,.35,M.awningCream],[8.0,6.2,-.4,M.awningRose]];
 for(const[tx,tz,rot,col]of cafeSets)props.cafeSet?.(tx,tz,rot,col);
 props.cafeSet?.(12.6,12.4,Math.PI/2,M.awningCream);
 props.cafeSet?.(19.4,11.8,.6,M.awningRose);
 props.bench(-4.4,3.8,Math.PI/2);props.bench(4.6,3.8,-Math.PI/2);props.bench(-1.2,-2.6,0);props.bench(2.0,-2.8,Math.PI);
 if(props.stoneBench){props.stoneBench(-9.6,7.0,0);props.stoneBench(9.6,3.4,Math.PI);}
 props.menuBoard?.(-7.6,10.2,.1);props.menuBoard?.(4.8,10.3,-.2);props.menuBoard?.(-17.8,10.6,.2);
 props.bicycle?.(-9.2,10.4,.2,M.paintBlue);props.bicycle?.(10.2,10.6,-.4,M.paintGreen);props.bicycle?.(19.2,10.8,.3,M.paintRed);
 props.vespaParked(-10.4,2.2,-.3,M.paintBlue);props.vespaParked(10.8,2.8,.2,M.paintRed);props.vespaParked(19.8,11.2,1.2,M.paintYellow);
 props.crates?.(7.4,10.8,.25);props.crates?.(-18.8,11.0,-.3);props.barrel?.(9.2,10.6);props.barrel?.(-16.8,11.2);
 props.trashBin?.(-11.6,10.4);props.trashBin?.(12.0,10.2);props.trashBin?.(19.6,9.0);
 props.cat?.(12.8,4.4,2.2);props.cat?.(-12.4,2.2,-1.4);
 props.pigeons?.(3.0,1.2,5);props.pigeons?.(-2.6,5.4,4);
 // bunting and warm bulb strings over the piazza
 props.bunting([-10.8,-6.5],[10.8,-6.5],5.0,.75);
 props.bunting([-10.2,9.6],[10.4,9.6],4.7,.6);
 props.stringLights([-8.0,4.8,-6.4],[-7.0,5.0,9.8]);
 props.stringLights([0.2,4.9,-6.4],[1.0,5.0,9.8]);
 props.stringLights([8.0,4.8,-6.4],[9.0,5.0,9.8]);
 // laundry over the lanes and between the upper houses
 props.laundry([11.2,9.8,4.4],[13.2,14.4,4.5]);
 props.laundry([-15.2,10.6,4.2],[-14.2,13.4,4.2]);
 props.laundry([-6.8,4.2,-19.0],[0.2,4.3,-19.2]);
 // aedicula at the market lane corner
 props.aedicula?.(-25.4,13.6,Math.PI/2);

 // ================================================================ small-town detail
 // stone drainage channels across the piazza
 for(const dz of[-2.6,5.6])box(0,L+.012,1.4+dz,21.6,.014,.26,M.pavingDark);
 // bollards marking the pedestrian piazza
 for(const[bx,bz]of[[-11.6,-6.2],[11.8,-6.2],[-11.5,9.2],[11.5,9.2],[-6.2,10.4],[6.8,10.5]]){
  cyl(bx,L+.34,bz,.075,.68,M.iron);ball(bx,L+.70,bz,.10,.10,.10,M.brass);
 }
 // newsstand kiosk on the east side of the piazza
 at(10.6,.8,-1.2,-.35,()=>{
  box(0,1.28,0,2.5,2.55,1.8,ctx.mat('#3f5f4c'));
  box(0,2.62,0,2.8,.14,2.1,M.awningCream);
  box(0,2.76,0,2.5,.10,1.9,M.awningGreen);
  box(0,1.55,1.0,2.1,1.1,.10,M.windowDark);
  for(let i=0;i<4;i++)box(-.75+i*.5,1.55,1.06,.34,.7,.05,i%2?M.warmDim:M.cream);
  box(0,.55,1.02,2.2,.7,.10,M.awningStripe);
  for(let i=0;i<3;i++)box(-.7+i*.7,.95,1.06,.4,.4,.05,M.trimWhite);
  box(1.05,2.15,.0,.28,.55,.28,M.lamp);
  for(const sd of[-1,1])ball(sd*1.25,2.9,0,.07,.07,.07,M.iron);
 });
 ctx.obstacles.push({x:10.6,z:-1.2,w:1.5,d:1.1,label:'kiosk'});
 // ceramic street signs on corners
 if(props.streetSignPlate){
  props.streetSignPlate(-13.75,3.3,7.4,Math.PI/2,'VIA DEL BORGO');
  props.streetSignPlate(12.72,3.3,2.0,-Math.PI/2,'VIA DELLA PIAZZA');
  props.streetSignPlate(-2.2,3.2,-7.95,0,'VICOLO DEL CAMPANILE');
  props.streetSignPlate(15.6,3.2,11.8,Math.PI,'VIA DELLA FONTE');
 }
 // cast-iron drinking fountain and a bicycle rack by the north side
 at(-9.6,.8,5.6,0,()=>{
  cyl(0,.55,0,.10,.9,M.iron);cyl(0,1.02,0,.22,.10,M.iron);ball(0,1.10,0,.10,.10,.10,M.brass);
  box(.16,.86,0,.20,.06,.06,M.iron);cyl(.26,.72,0,.03,.10,M.brass);
  cyl(0,.38,0,.30,.06,M.trimStone);
 });
 for(const rx of[-1.0,0,1.0])box(-6.6+rx,.40,4.0,.06,.8,.06,M.iron);
 props.bicycle(-6.6,4.0,.3,M.paintBlue);props.bicycle(-5.7,4.0,.15,M.paintRed);

 // ================================================================ furniture
 for(const[x,z,rot]of[[-10.8,-5.2,0],[10.4,-5.0,0],[-10.4,8.8,0],[10.6,8.8,0],[-7.0,11.4,0],[6.8,11.5,0],[24.6,6.2,-.2],[-17.4,12.2,0],[-12.6,14.4,0]]){
  props.lamp(x,z,rot);
 }
 sign.shopLight(-13.6,2.8,4.4,26);sign.shopLight(-13.8,2.8,-2.6,22);sign.shopLight(-20.0,2.8,6.4,20);sign.shopLight(13.2,2.8,3.0,18);
 // projecting shop signs (fronts: café/trattoria face -z, enoteca/farmacia face -x, albergo +z)
 sign.projectingSign('CAFFÈ',-13.55,4.6,6.2,.75,1.15,'#6d2a20','#f6dbaf',Math.PI/2);
 sign.projectingSign('TRATTORIA',-13.75,4.7,-4.4,.85,1.2,'#4c3a24','#f6dbaf',Math.PI/2);
 sign.projectingSign('FARMACIA',13.85,4.7,7.6,.7,1.1,'#2f5240','#f2ead7',-Math.PI/2);
 sign.projectingSign('ALBERGO',-2.6,5.6,-7.95,.8,1.3,'#4a3a26','#f6dbaf',0);
 sign.outlineNeon('APERTO',-13.62,4.25,1.2,1.5,.42,'#ffd08a',Math.PI/2);
 // market stalls along the market lane
 for(const[sx,sz,c]of[[-16.4,12.0,M.awningGreen],[-18.4,12.2,M.awningRose],[-20.4,12.4,M.awningCream]]){
  if(props.marketStand)props.marketStand(sx,sz,.05,c);
  else at(sx,L,sz,0,()=>{for(const dx of[-.95,.95])for(const dz of[-.6,.6])box(dx,.95,dz,.07,1.9,.07,M.wood);box(0,1.98,0,2.2,.10,1.5,M.awningCream);});
 }
 // market lane wine barrels, crates and a wood stack by the forno
 props.woodStack?.(-20.8,9.4,.2);props.trashBin?.(-13.2,9.6);props.posterBoard?.(-13.5,2.2,4.4,Math.PI/2);
 props.streetSignPlate?.(-13.5,3.2,-1.4,Math.PI/2,'VIA DEL BORGO');
 props.parkingSign?.(23.0,17.4,.2);props.wallLamp?.(-13.55,3.4,5.4,Math.PI/2);
 // south bank: lavender and rosemary spilling down to the valley road
 props.lavender?.(-8.0,15.6,5);props.lavender?.(1.0,15.7,4);props.rosemary?.(7.4,15.6,5);
 props.cypress(-10.8,16.8,1.0);props.oliveTree?.(10.6,16.6,.85);
 // warm night light pools
 for(const[x,z]of[[-10.8,-5.2],[10.4,-5.0],[-10.4,8.8],[10.6,8.8],[-7.0,11.4],[6.8,11.5],[24.6,6.2],[-17.4,12.2]])sign.shopLight(x,3.0,z,14);
 sign.shopLight(-13.6,3.0,4.4,12);sign.shopLight(-13.8,3.0,-2.6,10);sign.shopLight(-17.4,4.6,-6.2,24);

 props.balustrade(-11.6,9.35,-4.4,9.35);props.balustrade(4.4,9.35,11.6,9.35);
 props.lamp(-1.4,9.55,0);props.lamp(-7.4,9.55,0);props.lamp(5.2,9.55,0);
 props.planter(-11.4,8.0);props.planter(11.8,8.2);props.planter(-11.9,-5.2);props.planter(12.2,-5.0);
 props.lemonPot?.(-9.2,9.4);props.lemonPot?.(9.8,9.3);props.lemonPot?.(-13.6,10.2);
 props.lavender?.(-11.8,8.9,4);props.lavender?.(12.0,9.0,3);props.rosemary?.(-17.2,10.4,5);
  });

 // ================================================================ parked cars
 const parked=[
  {type:'mini',x:-17.6,z:22.4,rot:Math.PI/2,color:M.paintBlue},
  {type:'mini',x:-21.2,z:22.4,rot:Math.PI/2,color:M.paintRed},
  {type:'van',x:27.6,z:22.4,rot:Math.PI/2,color:M.paintWhite},
  {type:'mini',x:29.4,z:19.2,rot:Math.PI,color:M.paintGreen},
  {type:'ape',x:26.2,z:13.4,rot:0,color:M.paintGreen},
  {type:'van',x:-26.4,z:12.6,rot:Math.PI/2,color:M.cream},
  {type:'mini',x:26.8,z:6.2,rot:0,color:M.paintYellow}
 ];
 for(const c of parked)ctx.obstacles.push({x:c.x,z:c.z,w:1.4,d:1.8,label:'parked car'});

 // ================================================================ Ferrari parking
 // Parked naturally against the east side of the piazza, by the enoteca.
 const carSpot={x:-6.6,z:-1.3,rot:.55};
 box(carSpot.x,3.25,carSpot.z,2.8,.04,5.0,ctx.mat('#beb6a5'),carSpot.rot);

 // ================================================================ navigation // ================================================================ navigation // ================================================================ navigation // ================================================================ navigation // ================================================================ navigation // ================================================================ navigation // ================================================================ navigation
 const footRoutes=[
  [[-9.4,8.2],[9.6,8.4],[10.2,1.0],[9.4,-5.0],[-9.6,-4.8],[-10.4,1.4]],
  [[-10.4,7.6],[-11.6,9.2],[-13.6,10.6],[-16.8,11.4],[-20.6,11.6],[-24.6,11.8],[-25.4,10.4],[-21.0,9.4],[-15.6,8.4]],
  [[11.8,9.8],[13.4,11.6],[16.6,11.8],[19.8,11.6],[21.0,8.8]],
  [[-9.0,16.8],[7.0,16.8]]
 ];
 const activities=[
  {x:-6.247,z:8.001,mode:'dining'},{x:-2.277,z:7.692,mode:'dining'},{x:3.813,z:8.382,mode:'dining'},{x:8.241,z:5.629,mode:'dining'},
  {x:2.5,z:1.9,mode:'waiting'},{x:-2.5,z:2.0,mode:'waiting'},
  {x:-15.2,z:10.9,mode:'browsing'},{x:-19.4,z:11.2,mode:'browsing'},
  {x:-3.6,z:4.6,mode:'socializing'},{x:5.4,z:4.8,mode:'socializing'},{x:-9.8,z:6.4,mode:'socializing'},
  {x:0.4,z:5.4,mode:'taking-photo',target:[0,1.4]},{x:-1.4,z:-0.6,mode:'taking-photo',target:[-17,-6.6]}
 ];
 // ================================================================ countryside
 let countryside=null;
 try{ countryside=createCountryside(ctx); }catch(error){ console.error('countryside failed',error); }

 return {buildings:buildings.filter(Boolean),parked,countryside,groundHeight:GH,roadPoints:allRoad,roadWidth:mainW,
  lanes:[{id:'main',entry:'main',axis:'MAIN',curve:mainCurve,stopPoint:[laneX+40,mainZ],exitDistance:10},
         {id:'lane',entry:'lane',axis:'LANE',curve:laneCurve,stopPoint:[laneX,8.4],exitDistance:6}],
  junction:{x:laneX,z:mainZ,w:laneW/2+.7,d:mainW/2+.7},
  footRoutes,
  crossings:[{a:[-6.0,mainZ-mainW/2-.5],b:[-6.0,mainZ+mainW/2+.5]},{a:[3.0,mainZ-mainW/2-.5],b:[3.0,mainZ+mainW/2+.5]},{a:[laneX-laneW/2-.5,16.2],b:[laneX+laneW/2+.5,16.2]}],
  activities,
  signals:[{x:laneX+laneW/2+.5,z:mainZ-mainW/2-.45,axis:'MAIN',rotation:Math.PI},{x:laneX-laneW/2-.5,z:mainZ+mainW/2+.45,axis:'LANE',rotation:0}]};
}
