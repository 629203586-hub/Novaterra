import bpy, math, random, json
from pathlib import Path
OUT = Path(__file__).resolve().parent
from mathutils import Vector, noise
random.seed(1729)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
nx,nz=70,34
verts=[]
for j in range(nz+1):
 z=-16.4+11.9*j/nz
 for i in range(nx+1):
  x=-20.4+40.8*i/nx
  bound=20.4 if z>=-13 else 17+(z+17)*.8
  x=max(-bound,min(bound,x))
  front=(max(0,min(1,(-4.5-z)/4.8)))**1.5
  back=max(0,min(1,(z+16.4)/1.9))
  peaks=[(-9.0,-12.7,7.5,4.2,17.0),(3.8,-13.7,6.1,4.1,13.6),(13.7,-11.6,6.0,4.4,10.5)]
  matterhorn=18.8*max(0,1-(abs(x+8.7)/9.5+abs(z+12.3)/6.9)*.78)
  height=max(matterhorn,*[h*math.exp(-((x-px)/sx)**2-((z-pz)/sz)**2) for px,pz,sx,sz,h in peaks[1:]])
  grain=noise.fractal(Vector((x*.24,z*.24,3.5)),1.0,2.0,3)*.55+noise.noise_vector(Vector((x*.38,z*.38,1.1))).x*.18
  ridge=max(0,height*(1+grain*.16))*front*back
  verts.append((round(x,3),round(z,3),round(.84+ridge,3)))
faces=[]; mats=[]
for j in range(nz):
 for i in range(nx):
  a=j*(nx+1)+i;b=a+1;c=a+nx+1;d=c+1
  for face in ([(a,c,b),(b,c,d)] if (i+j)%2==0 else [(a,c,d),(a,d,b)]):
   faces.append(face)
   h=sum(verts[v][2] for v in face)/3
   edge=10.1+math.sin(i*.22+j*.18)*.38
   fx=sum(verts[v][0] for v in face)/3; fz=sum(verts[v][1] for v in face)/3
   u=max(0,min(1,(fz+11)/6.75));center=-9.25+1.65*u+.12*math.sin(u*math.pi*4)
   piste=(-11.05<=fz<=-4.5 and abs(fx-center)<1.25)
   mats.append(2 if piste or h>edge else 0)
mesh=bpy.data.meshes.new('Alpine ridge sculpt');mesh.from_pydata(verts,[],faces);mesh.update()
obj=bpy.data.objects.new('Swiss Alpine ridges',mesh);bpy.context.collection.objects.link(obj)
for name,col in [('rock',(0.49,.58,.60,1)),('rock shadow',(.39,.49,.53,1)),('snow',(.91,.97,.98,1)),('snow blue shadow',(.69,.83,.88,1))]:
 mat=bpy.data.materials.new(name);mat.diffuse_color=col;mesh.materials.append(mat)
for poly,index in zip(mesh.polygons,mats):poly.material_index=index
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'matterhorn-cleared.blend'))
bins=[[] for _ in range(4)]
for f,idx in zip(faces,mats):
 for k in f:
  x,z,y=verts[k];bins[idx].extend([x,y,z])
with open(str(OUT / 'matterhorn-cleared-ridges.json'),'w') as f:json.dump(bins,f,separators=(',',':'))
with open(str(OUT / 'matterhorn-cleared-heights.json'),'w') as f:json.dump([v[2] for v in verts],f,separators=(',',':'))
print('RIDGES',len(verts),len(faces),'MAX',max(v[2] for v in verts))
