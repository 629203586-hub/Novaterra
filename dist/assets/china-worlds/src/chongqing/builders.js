import * as T from 'three';
export function createChongqingBuilders(ctx){
 const{M,mat,batch:b,signage,random}=ctx,{box,at,geometry,transform,geo,pipe,cyl,ball}=b;
 const plaster=mat('#eee0bf'),oak=mat('#735039'),trim=mat('#b68b59'),roof=mat('#4c5556'),edge=mat('#363f42'),sandstone=mat('#a49b86'),greenGlass=mat('#3f6b68'),aged=mat('#b8c6bc');
 const tiles=signage.textureCanvas(512,512,(c,w,h)=>{c.fillStyle='#85918a';c.fillRect(0,0,w,h);for(let x=0;x<w;x+=16){c.fillStyle=x%32?'#697c77':'#9aa396';c.fillRect(x,0,3,h);}for(let y=0;y<h;y+=32){c.fillStyle='#3a454454';c.fillRect(0,y,w,2);}for(let i=0;i<900;i++){c.fillStyle='#d5dbcb0d';c.fillRect(random()*w,random()*h,3,1);}});tiles.wrapS=tiles.wrapT=T.RepeatWrapping;tiles.repeat.set(2,1);const tileMat=mat('#d1d3c4',{map:tiles});
 const warmTiles=signage.textureCanvas(256,256,(c,w,h)=>{c.fillStyle='#fff0df';c.fillRect(0,0,w,h);for(let x=0;x<w;x+=12){c.fillStyle=x%24?'#d7b39a':'#f9dfc6';c.fillRect(x,0,2,h);}for(let y=0;y<h;y+=24){c.fillStyle='#80493a50';c.fillRect(0,y,w,1.5);}});warmTiles.wrapS=warmTiles.wrapT=T.RepeatWrapping;warmTiles.repeat.set(2,1);const warmTileMat=mat('#cf7459',{map:warmTiles});
 const grid=signage.textureCanvas(256,256,(c,w,h)=>{c.fillStyle='#ccbc9c';c.fillRect(0,0,w,h);c.strokeStyle='#6b604b38';c.lineWidth=2;for(let y=0;y<h;y+=32){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();for(let x=(y/32%2)*32;x<w;x+=64){c.beginPath();c.moveTo(x,y);c.lineTo(x,y+32);c.stroke();}}});grid.wrapS=grid.wrapT=T.RepeatWrapping;const stone=mat('#c2bfad',{map:grid});
 const glowLine=mat('#d8ac6d',{emissive:'#ffc373',emissiveIntensity:.68});glowLine.userData.architectural=true;
 function B(m,x,y,z,w,h,d,rot=0,outline=false){box(x,y,z,w,h,d,m,rot,outline);}
 function roofHeight(x,z,w,d,h){const u=Math.min(1,Math.abs(z)/(d/2));return h*Math.pow(1-u,.85)+.16*Math.pow(u,5)+.17*Math.pow(Math.abs(x)/(w/2),8)*Math.pow(u,3);}
 function roofAt(x,y,z,w,d,h=1.15,tone='slate'){const surface=tone==='warm'?warmTileMat:tileMat;
  at(x,y,z,0,()=>{const nx=16,nz=16,ps=[],uv=[],ix=[];
   for(let layer=0;layer<2;layer++)for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const xx=(i/nx-.5)*w,zz=(j/nz-.5)*d;ps.push(xx,roofHeight(xx,zz,w,d,h)-layer*.12,zz);uv.push(i/nx,j/nz);}const n=(nx+1)*(nz+1);
   for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;ix.push(a,a+1,a+nx+1,a+1,a+nx+2,a+nx+1);ix.push(n+a,n+a+nx+1,n+a+1,n+a+1,n+a+nx+1,n+a+nx+2);}
   for(let i=0;i<nx;i++)for(const j of[0,nz]){const a=j*(nx+1)+i;ix.push(a,a+n,a+1,a+1,a+n,a+n+1);}
   for(let j=0;j<nz;j++)for(const i of[0,nx]){const a=j*(nx+1)+i;ix.push(a,a+nx+1,a+n,a+nx+1,a+n+nx+1,a+n);}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(ps,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];g.setIndex(ix);g.computeVertexNormals();surface.side=T.DoubleSide;geometry(g,surface);g.dispose();
   for(const side of[-1,1]){const points=[];for(let i=0;i<=20;i++){const xx=(i/20-.5)*w;points.push(new T.Vector3(xx,roofHeight(xx,side*d/2,w,d,h)-.06,side*d/2));}const g=new T.TubeGeometry(new T.CatmullRomCurve3(points),24,.045,5,false);geometry(g,edge);g.dispose();}
   pipe([-w*.46,h+.08,0],[w*.46,h+.08,0],.065,edge);for(const side of[-1,1]){pipe([side*w*.44,h+.08,0],[side*w*.51,h+.32,0],.045,edge);ball(side*w*.51,h+.34,0,.06,.09,.06,edge);}
   // Brackets under the eaves have depth; their undersides remain readable from low angles.
   for(let xx=-w*.42;xx<w*.44;xx+=.8)for(const side of[-1,1]){B(oak,xx,-.1,side*d*.39,.1,.24,.4);B(trim,xx,-.18,side*d*.39,.4,.08,.22);B(oak,xx,-.28,side*d*.34,.12,.25,.2);}
  });
 }
 function balustrade(x,y,z,w){at(x,y,z,0,()=>{for(const yy of[.12,.68])B(oak,0,yy,0,w,.055,.055);for(let xx=-w/2;xx<=w/2;xx+=.26){B(trim,xx,.4,0,.035,.55,.035);if(Math.round(xx*10)%3===0)B(oak,xx,.4,.015,.16,.16,.03,Math.PI/4);}B(trim,0,.74,0,w+.06,.07,.10);});}
 function window(x,y,z,w,h,lit=true,lattice=false){B(oak,x,y,z,w+.18,h+.18,.11);B(lit?M.warm:M.windowDark,x,y,z+.065,w,h,.023);for(const side of[-1,1])B(trim,x+side*w/2,y,z+.091,.055,h+.13,.045);for(const side of[-1,1])B(trim,x,y+side*h/2,z+.093,w+.12,.06,.045);B(oak,x,y,z+.091,.035,h,.035);if(lattice){for(let yy=-h*.4;yy<h*.45;yy+=.2)B(oak,x,y+yy,z+.11,w,.025,.025);for(let xx=-w*.38;xx<w*.4;xx+=.18)B(oak,x+xx,y,z+.11,.02,h,.025);}}
 function lantern(x,y,z){pipe([x,y+.26,z],[x,y+.48,z],.012,oak);cyl(x,y,z,.15,.27,M.red);ball(x,y,z,.18,.19,.18,M.red);for(const dy of[-.19,.19])cyl(x,y+dy,z,.09,.04,M.cream);pipe([x,y-.2,z],[x,y-.38,z],.012,M.orange);}
 const houses=[];
 function stiltHouse(spec){const{x,y,z,w,d,floors=3,id='Hongya',roofTone='slate'}=spec,fh=1.65,h=floors*fh;
  at(x,y,z,0,()=>{
   for(const sx of[-1,1])for(const sz of[-1,1]){B(oak,sx*(w/2-.18),(y-.8)*-.5,sz*(d/2-.15),.19,y-.8,.19);pipe([sx*(w/2-.18),-.15,sz*(d/2-.15)],[sx*(w/2-.18)-sx*.9,-Math.min(1.7,y-.8),sz*(d/2-.15)],.07,oak);}
   B(plaster,0,h/2,0,w,h,d,0,true);
   for(let f=0;f<floors;f++){
    const yy=f*fh;B(oak,0,yy+.07,0,w+.08,.14,d+.08);B(trim,0,yy+1.48,0,w+.12,.12,d+.10);
    // Front and rear are fully authored; frame, glazing and rail occupy separated surfaces.
    for(const side of[-1,1])at(0,yy,side*d/2,side<0?Math.PI:0,()=>{
     for(let i=0;i<Math.max(2,Math.floor(w/1.1));i++){const n=Math.max(2,Math.floor(w/1.1)),xx=(i-(n-1)/2)*(w-.7)/n;window(xx,.84,.055,.65,1.0,(i+f)%4!==0,f===0);}
     for(let xx=-w/2+.14;xx<=w/2;xx+=w/Math.max(3,Math.round(w/1.2)))B(oak,xx,.77,.10,.11,1.6,.16);
     B(oak,0,.12,.38,w+.35,.14,.8);balustrade(0,.22,.77,w+.2);B(glowLine,0,.035,.79,w+.2,.035,.035);
    });
    for(const side of[-1,1])at(side*w/2,yy,0,side*Math.PI/2,()=>{for(const zz of[-d*.26,d*.26])window(zz,.85,.06,.54,.97,(f+(side>0?1:0))%3!==0);B(oak,0,.06,0,d+.1,.13,.18);});
    if(f<floors-1&&f%2===0)roofAt(0,yy+fh-.12,0,w+.85,d+1.3,.35);
   }
   for(const xx of[-w/2,w/2])B(oak,xx,h/2,0,.15,h,d+.1);
   roofAt(0,h+.03,0,w+.45,d+1.75,1.1+w*.045,roofTone);
   for(const xx of[-w*.39,w*.39])lantern(xx,h-.45,d/2+.8);
  });houses.push({...spec,height:h+1.5,footprint:[x-w/2-.6,z-d/2-.9,x+w/2+.6,z+d/2+.9]});ctx.obstacles.push({x,z,w:w/2+.65,d:d/2+.9,label:id});return h;
 }
 function tower(x,y,z,w,d,floors,color,label=''){
  const h=floors*1.1;at(x,y,z,0,()=>{
   B(mat(color),0,h/2,0,w,h,d,0,true);for(let f=0;f<floors;f++){const yy=.55+f*1.1;for(let face=0;face<4;face++)at(0,0,0,face*Math.PI/2,()=>{const width=face%2?d:w,depth=face%2?w:d,n=Math.floor(width/.85);for(let i=0;i<n;i++){const xx=(i-(n-1)/2)*.8;B(M.windowDark,xx,yy,depth/2+.022,.49,.59,.022);if((i+f)%5!==0)B((i+f)%4===0?M.warm:M.warmDim,xx,yy,depth/2+.037,.39,.48,.012);B(aged,xx,yy+.35,depth/2+.08,.59,.055,.17);}B(aged,0,yy+.49,depth/2+.03,width+.03,.06,.09);});}
   B(aged,0,h+.1,0,w+.16,.18,d+.16);B(M.stone,0,h+.35,0,w*.4,.4,d*.5);for(let i=0;i<2;i++){B(M.white,-w*.25+i*w*.5,h+.26,-d*.28,.5,.22,.43);for(let j=0;j<4;j++)B(M.iron,-w*.25+i*w*.5-.18+j*.11,h+.385,-d*.28,.026,.025,.35);}
   if(label)signage.sign(label,0,h*.6,d/2+.18,w*.7,.65,'#345558','#ecdfb9');
  });ctx.obstacles.push({x,z,w:w/2+.2,d:d/2+.2,label:'Masonry residence'});return h;
 }
 return{B,roofAt,balustrade,window,lantern,stiltHouse,tower,houses,plaster,oak,trim,roof,edge,stone,sandstone,greenGlass,aged,glowLine};
}
