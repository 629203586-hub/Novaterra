import * as THREE from '../../vendor/three/build/three.module.js';
// Terrain for the Italian hill town: a warm tufa "table" slab with sediment
// strata, stone-sett road surfaces and a soft contact shadow under the model.
export function createTerrain(ctx){
 const {M,mat,pick,random,rr}=ctx,{box,instance,ball,geometry}=ctx.batch;
 const geoPlane=new THREE.PlaneGeometry(1,1);geoPlane.rotateX(-Math.PI/2);
 const {thickness:h,surface,relief}=ctx.config.terrain;
 // First-edition masonry direction, backed by a closed solid instead of an open skirt.
 const top=.78,bottom=-4.0,w=68,d=64,baseZ=-4;
 const baseMaterial=mat('#8b7054');
 const baseGeometry=new THREE.BoxGeometry(w,top-bottom,d);
 const baseMesh=new THREE.Mesh(baseGeometry,baseMaterial);
 baseMesh.name='italy-solid-base';baseMesh.position.set(0,(top+bottom)/2,baseZ);
 baseMesh.castShadow=true;baseMesh.receiveShadow=true;ctx.scene.add(baseMesh);
 const strata=['#92734f','#a07c53','#b08b5f','#bea078','#c8af88'].map(c=>mat(c));
 // Split courses into fitted blocks; the backing mass fills all mortar joints and corners.
 function courses(length,side){
  const rows=9;
  for(let row=0;row<rows;row++){
   const y=bottom+.27+row*.50,level=Math.min(4,Math.floor(row*5/rows));
   let a=-length/2;
   for(let index=0;a<length/2-.04;index++){
    const desired=(row%2&&index===0?1.05:2.1)+.22*Math.sin(index*2.17+row*1.3+side);
    const span=Math.min(desired,length/2-a),cx=a+span/2;
    if(span>.07){const color=strata[Math.max(0,level-(index%5===0?1:0))];
     if(side<2)box(cx,y,baseZ+(side===0?-1:1)*(d/2+.035),span-.04,.45,.10,color);
     else box((side===2?-1:1)*(w/2+.035),y,baseZ+cx,.10,.45,span-.04,color);
    }
    a+=span;
   }
  }
 }
 courses(w,0);courses(w,1);courses(d,2);courses(d,3);
 // Crisp limestone coping and the original quiet grass/paved top.
 box(0,.64,baseZ,w+.16,.16,d+.16,M.trimStone);
 box(0,.755,baseZ,w-.12,.07,d-.12,M.tuscanGrass);
 for(const z of[baseZ-d/2,baseZ+d/2])box(0,.73,z,w+.22,.16,.20,M.trimWhiteStone);
 for(const x of[-w/2,w/2])box(x,.73,baseZ,.20,.16,d+.22,M.trimWhiteStone);
 // The moved rear houses keep a continuous filled stone terrace beneath them.
 box(0,4.49,-29.6,34.0,7.42,6.6,M.trimStone);
 box(0,8.18,-29.6,34.18,.12,6.78,M.stoneFlag);
 // This rear terrace has its own legible stone courses, rather than a texture blur.
 for(let row=0;row<12;row++)for(let col=0;col<19;col++){
  const x=-16.1+col*1.75;
  if(x+ .83<17)box(x,1.12+row*.58,-32.94,1.68,.51,.10,row%3?M.trimStone:M.trimLightStone);
 }

 function reliefPatch(x,z,pw,pd,amplitude=relief){
  const g=new THREE.PlaneGeometry(pw,pd,Math.max(2,Math.ceil(pw)),Math.max(2,Math.ceil(pd)));g.rotateX(-Math.PI/2);
  const a=g.attributes.position;for(let i=0;i<a.count;i++)a.setY(i,.79+random()*amplitude);g.computeVertexNormals();
  geometry(g,M.leafDark,new THREE.Matrix4().makeTranslation(x,0,z));g.dispose();
 }
 // ---- stone-sett road surface texture (warm grey Tuscan setts)
 const settTex=ctx.signage.textureCanvas(512,512,(c,ww,hh)=>{
  c.fillStyle='#8f8a7d';c.fillRect(0,0,ww,hh);
  const row=hh/16;
  for(let r=0;r<16;r++){
   const off=(r%2)*14;
   for(let x=-28;x<ww+28;x+=28){
    const g=150+Math.floor(random()*40);
    c.fillStyle=`rgb(${g+12},${g+2},${g-18})`;
    c.fillRect(x+off+1,r*row+1,26,row-2);
    c.strokeStyle='rgba(66,58,46,.45)';c.lineWidth=1.6;c.strokeRect(x+off,r*row,28,row);
    c.strokeStyle='rgba(255,248,232,.10)';c.lineWidth=1;c.strokeRect(x+off+1.4,r*row+1.4,25,row-2.8);
   }
  }
  for(let i=0;i<900;i++){c.fillStyle=`rgba(50,44,36,${(.03+random()*.05).toFixed(3)})`;c.fillRect(random()*ww,random()*hh,2,2);}
 });
 settTex.wrapS=settTex.wrapT=THREE.RepeatWrapping;
 function road(path,width=3.0){
  const positions=[],uv=[],n=Math.ceil(path.getLength()*3),points=[];
  for(let i=0;i<=n;i++){const u=i/n,p=path.getPointAt(u),t=path.getTangentAt(u),nx=-t.z,nz=t.x;points.push(p);for(const side of[-1,1]){positions.push(p.x+nx*width/2*side,.815,p.z+nz*width/2*side);uv.push(u*path.getLength()/2.2,side===1?1:0);}}
  const idx=[];for(let i=0;i<n;i++){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  const tex=settTex.clone();tex.needsUpdate=true;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  const m=new THREE.MeshStandardMaterial({color:'#c9c2b1',map:tex,roughness:.92,metalness:.05,side:THREE.DoubleSide});const mesh=new THREE.Mesh(g,m);mesh.receiveShadow=true;ctx.scene.add(mesh);
  return points.map(p=>[p.x,p.z]);
 }
 function crosswalk(x,z,length=3.1,width=2.4,rotation=0){ctx.batch.at(x,0,z,rotation,()=>{const count=6,stripe=width/(count*2-1);for(let i=0;i<count;i++)box(-width/2+stripe/2+i*stripe*2,.836,0,stripe,.018,length,M.trimWhite);});}
 // Steps: a run of shallow stone treads; returns the top height (for scenery built on top).
 function stairs(x,z,w,steps,rise=.16,run=.34,rot=0,y=.8){
  ctx.batch.at(x,y-.8,z,rot,()=>{for(let i=0;i<steps;i++)box(0,i*rise+rise/2,-i*run,w,rise+.02,run+.06,M.trimStone);});
  return y+steps*rise;
 }
 // Terrace platform: a paved level above the street with a stone retaining wall on its south edge.
 function terrace(x,z,w,d2,height,y=.8,wallDepth=.3){
  box(x,y+height-.08,z,w,.16,d2,M.stoneFlag);
  box(x,y+height/2,z+d2/2+wallDepth/2,w,height,wallDepth,M.trimStone);
  return y+height;
 }
 // Soft contact shadow under the slab; the sky is a gradient sphere in the scene.
 const tex=ctx.signage.textureCanvas(256,256,(c,ww,hh)=>{const g=c.createRadialGradient(128,128,40,128,128,128);g.addColorStop(0,'rgba(24,16,10,.46)');g.addColorStop(.5,'rgba(24,16,10,.20)');g.addColorStop(1,'rgba(24,16,10,0)');c.fillStyle=g;c.fillRect(0,0,ww,hh);});
 const contact=new THREE.Mesh(new THREE.PlaneGeometry(w*1.85,d*1.85),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.position.y=bottom-.1;ctx.scene.add(contact);
 return {road,crosswalk,reliefPatch,stairs,terrace};
}
export function makePath(segments,y=.84){
 const curve=new THREE.CurvePath(),v=p=>new THREE.Vector3(p[0],y,p[1]);
 for(const s of segments){if(s.length===2)curve.add(new THREE.LineCurve3(v(s[0]),v(s[1])));else if(s.length===4)curve.add(new THREE.CubicBezierCurve3(...s.map(v)));else throw new Error('Path segments require 2 line points or 4 cubic control points');}
 return curve;
}
export function distanceToPolyline(x,z,points){let distance=Infinity;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1],u=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));distance=Math.min(distance,Math.hypot(x-a[0]-u*dx,z-a[1]-u*dz));}return distance;}
