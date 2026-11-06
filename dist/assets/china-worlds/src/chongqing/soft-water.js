import * as THREE from 'three';

/** Horizontal calm water. Adapt scale/palette/proxy selection to the actual place. */
export function createSoftWater({
  scene, renderer, camera, center = [0, 0], level = 0, width, depth, outline,
  reflectionSources = [], lights = [], selectTriangle = () => true,
  minTriangleArea = .006, waveAmplitude = .009, waveUnit = 1,
  reflectionStrength = .25, reflectionGrazing = .42, distortion = .0015,
  reflectionBlur = 1.5, targetScale = .5, targetCap = 640,
  waterColor = '#497e7d', skyColor = '#afcbd1',
} = {}) {
  if (!scene || !renderer || !camera || !(width > 0 && depth > 0 && waveUnit > 0))
    throw new Error('Soft water requires scene, renderer, camera, positive dimensions and waveUnit.');
  const diagnostics = {shaderCompatible: true, captures: 0, proxyMeshes: 0,
    proxyTriangles: 0, captureCalls: 0, width: 0, height: 0, omitted: [], error: null};
  const target = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true,
  });
  target.texture.generateMipmaps = false;
  const uniforms = {
    vpTime: {value: 0}, vpAmplitude: {value: waveAmplitude}, vpUnit: {value: waveUnit},
    vpSky: {value: new THREE.Color(skyColor)}, vpReflection: {value: target.texture},
    vpMatrix: {value: new THREE.Matrix4()}, vpTexel: {value: new THREE.Vector2(1, 1)},
    vpStrength: {value: reflectionStrength}, vpGrazing: {value: reflectionGrazing},
    vpDistortion: {value: distortion}, vpBlur: {value: reflectionBlur}, vpReady: {value: 0},
  };
  const material = new THREE.MeshPhongMaterial({color: waterColor, emissive:'#388c91',emissiveIntensity:.11,specular: '#263c3c', shininess: 45});
  material.userData.outlineParameters = {visible: false};
  material.onBeforeCompile = shader => {
    if (!shader.vertexShader.includes('#include <beginnormal_vertex>') ||
        !shader.vertexShader.includes('#include <begin_vertex>') ||
        !shader.fragmentShader.includes('#include <opaque_fragment>')) {
      diagnostics.shaderCompatible = false;
      diagnostics.error = 'Shader chunks differ; using unmodified smooth Phong water.';
      return;
    }
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = `uniform float vpTime, vpAmplitude, vpUnit;
      uniform mat4 vpMatrix; varying vec4 vpProjected;\n` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `
      #include <beginnormal_vertex>
      vec3 wp=position/vpUnit;
      float wa=wp.z*1.35+wp.x*1.7+vpTime*.48;
      float wb=wp.z*3.6-wp.x*2.8+vpTime*.77;
      float wc=wp.z*7.1+wp.x*4.2+vpTime*1.05;
      float slope=vpAmplitude/vpUnit;
      objectNormal=normalize(vec3(-slope*(1.7*cos(wa)-.3333*2.8*cos(wb)+.1333*4.2*cos(wc)),
        1.0,-slope*(1.35*cos(wa)+.3333*3.6*cos(wb)+.1333*7.1*cos(wc))));`);
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      transformed.y+=vpAmplitude*(sin(wa)+.3333*sin(wb)+.1333*sin(wc));
      vpProjected=vpMatrix*modelMatrix*vec4(transformed,1.0);`);
    shader.fragmentShader = `uniform float vpTime, vpStrength, vpGrazing, vpDistortion, vpBlur, vpReady;
      uniform vec3 vpSky; uniform sampler2D vpReflection; uniform vec2 vpTexel;
      varying vec4 vpProjected;\n` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      float grazing=pow(1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0),3.0);
      outgoingLight=mix(outgoingLight,vpSky,.09+.16*grazing);
      if(vpReady>.5 && vpProjected.w>0.0){
        vec2 uv=vpProjected.xy/vpProjected.w;
        vec2 bend=vec2(sin(uv.y*125.0+vpTime*.62),cos(uv.x*90.0+vpTime*.41))*vpDistortion;
        vec2 blur=vpTexel*vpBlur;
        vec4 r=(texture2D(vpReflection,uv+bend)*2.0+
          texture2D(vpReflection,uv+bend+vec2(blur.x,0.0))+
          texture2D(vpReflection,uv+bend-vec2(blur.x,0.0))+
          texture2D(vpReflection,uv+bend+vec2(0.0,blur.y))+
          texture2D(vpReflection,uv+bend-vec2(0.0,blur.y)))/6.0;
        float inside=step(0.0,uv.x)*step(uv.x,1.0)*step(0.0,uv.y)*step(uv.y,1.0);
        outgoingLight=mix(outgoingLight,r.rgb/max(r.a,.001),
          clamp(r.a*(vpStrength+vpGrazing*grazing)*inside,0.0,1.0));
      }
      #include <opaque_fragment>`);
  };
  material.customProgramCacheKey = () => 'vance-soft-water-v1';
  const geometry = new THREE.PlaneGeometry(width, depth,
    Math.min(96, Math.max(16, Math.ceil(width / waveUnit * 7))),
    Math.min(192, Math.max(32, Math.ceil(depth / waveUnit * 7))));
  geometry.rotateX(-Math.PI / 2);
  // Keep the animated river inside the actual clipped diorama footprint.
  if(outline){const attr=geometry.attributes.position;for(let i=0;i<attr.count;i++){const x=attr.getX(i)+center[0],z=attr.getZ(i)+center[1];let inside=false;for(let a=0,b=outline.length-1;a<outline.length;b=a++){const A=outline[a],B=outline[b];if(((A[1]>z)!==(B[1]>z))&&x<(B[0]-A[0])*(z-A[1])/(B[1]-A[1])+A[0])inside=!inside;}if(!inside){let best=Infinity,bx=x,bz=z;for(let a=0;a<outline.length;a++){const A=outline[a],B=outline[(a+1)%outline.length],dx=B[0]-A[0],dz=B[1]-A[1],u=Math.max(0,Math.min(1,((x-A[0])*dx+(z-A[1])*dz)/(dx*dx+dz*dz))),xx=A[0]+u*dx,zz=A[1]+u*dz,d=(x-xx)**2+(z-zz)**2;if(d<best){best=d;bx=xx;bz=zz;}}attr.setXYZ(i,bx-center[0],attr.getY(i),bz-center[1]);}}attr.needsUpdate=true;}
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(center[0], level, center[1]); mesh.receiveShadow = true;
  mesh.frustumCulled = false; scene.add(mesh);
  const reflectedScene = new THREE.Scene(), root = new THREE.Group();
  root.position.y = 2 * level; root.scale.y = -1; reflectedScene.add(root);
  const mirroredLights = lights.map(source => {
    const mirror = source.clone(); mirror.castShadow = false;
    if (source.isDirectionalLight || source.isSpotLight) {
      mirror.target = new THREE.Object3D(); reflectedScene.add(mirror.target);
    }
    reflectedScene.add(mirror); return {source, mirror};
  });
  const bias = new THREE.Matrix4().set(.5,0,0,.5, 0,.5,0,.5, 0,0,.5,.5, 0,0,0,1);
  const lastProjection = new THREE.Matrix4(), lastView = new THREE.Matrix4();
  let dirty = true, disposed = false, lastLightKey = '';
  const size = new THREE.Vector2(), position = new THREE.Vector3(), aim = new THREE.Vector3();
  function rebuildReflections() {
    for (const child of [...root.children]) { root.remove(child); child.geometry.dispose(); }
    diagnostics.proxyTriangles = 0; diagnostics.omitted = [];
    const sources = new Set();
    for (const item of reflectionSources) item.traverse(o => {if (o.isMesh && o !== mesh) sources.add(o);});
    for (const source of sources) {
      if (source.isInstancedMesh || source.isSkinnedMesh || Array.isArray(source.material)) {
        diagnostics.omitted.push(source.name || source.type); continue;
      }
      let visible = true;
      for (let ancestor=source;ancestor;ancestor=ancestor.parent) if(!ancestor.visible){visible=false;break;}
      if (!visible || source.material.transparent) continue;
      source.updateWorldMatrix(true, false);
      const input = source.geometry.index ? source.geometry.toNonIndexed() : source.geometry.clone();
      input.applyMatrix4(source.matrixWorld);
      if (!input.attributes.normal) input.computeVertexNormals();
      const at = input.attributes, values = {position: [], normal: [], uv: []};
      const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
      for (let i = 0; i < at.position.count; i += 3) {
        a.fromBufferAttribute(at.position,i); b.fromBufferAttribute(at.position,i+1); c.fromBufferAttribute(at.position,i+2);
        const minY = Math.min(a.y,b.y,c.y), centroid = a.clone().add(b).add(c).multiplyScalar(1/3);
        const area = b.clone().sub(a).cross(c.clone().sub(a)).length() * .5;
        if (minY < level + .02 || area < minTriangleArea || !selectTriangle({centroid,minY,area,source})) continue;
        for (let j=i;j<i+3;j++) for (const key of Object.keys(values)) {
          const n = key === 'uv' ? 2 : 3;
          for (let k=0;k<n;k++) values[key].push(at[key] ? at[key].array[j*n+k] : 0);
        }
        diagnostics.proxyTriangles++;
      }
      input.dispose();
      if (!values.position.length) continue;
      const g = new THREE.BufferGeometry();
      for (const [key,data] of Object.entries(values)) g.setAttribute(key,new THREE.Float32BufferAttribute(data,key==='uv'?2:3));
      root.add(new THREE.Mesh(g,source.material)); // Borrow materials, never dispose them here.
    }
    diagnostics.proxyMeshes = root.children.length; dirty = true;
  }
  function syncLights() {
    const state = [];
    for (const {source,mirror} of mirroredLights) {
      source.getWorldPosition(position); mirror.position.copy(position);
      mirror.position.y = source.isHemisphereLight ? -position.y : 2*level-position.y;
      mirror.color.copy(source.color); mirror.intensity = source.intensity; mirror.visible = source.visible;
      if (source.isHemisphereLight) mirror.groundColor.copy(source.groundColor);
      if (source.isDirectionalLight || source.isSpotLight) {
        source.target.getWorldPosition(aim); mirror.target.position.copy(aim); mirror.target.position.y=2*level-aim.y;
      }
      if (source.isPointLight || source.isSpotLight) {mirror.distance=source.distance;mirror.decay=source.decay;}
      if (source.isSpotLight) {mirror.angle=source.angle;mirror.penumbra=source.penumbra;}
      state.push(mirror.position.toArray(),mirror.color.getHex(),mirror.intensity,mirror.visible,
        mirror.groundColor?.getHex(),mirror.target?.position.toArray(),mirror.distance,mirror.decay,mirror.angle,mirror.penumbra);
    }
    // Borrowed room materials can change without a light object changing.
    for(const m of new Set(root.children.map(o=>o.material)))
      state.push(m.color?.getHex(),m.emissive?.getHex(),m.emissiveIntensity,m.opacity,m.visible);
    const key=JSON.stringify(state); if(key!==lastLightKey){dirty=true;lastLightKey=key;}
  }
  function capture({force=false}={}) {
    if(disposed || !diagnostics.shaderCompatible) return false;
    renderer.getSize(size);
    const w=Math.max(32,Math.min(targetCap,Math.round(size.x*targetScale)));
    const h=Math.max(32,Math.round(w*size.y/Math.max(1,size.x)));
    if(w!==diagnostics.width || h!==diagnostics.height){target.setSize(w,h);diagnostics.width=w;diagnostics.height=h;uniforms.vpTexel.value.set(1/w,1/h);dirty=true;}
    camera.updateMatrixWorld(); syncLights();
    if(!lastProjection.equals(camera.projectionMatrix)||!lastView.equals(camera.matrixWorldInverse))dirty=true;
    if(!dirty&&!force)return false;
    const previous={target:renderer.getRenderTarget(),color:renderer.getClearColor(new THREE.Color()),
      alpha:renderer.getClearAlpha(),shadow:renderer.shadowMap.autoUpdate,
      viewport:renderer.getViewport(new THREE.Vector4()),scissor:renderer.getScissor(new THREE.Vector4()),
      scissorTest:renderer.getScissorTest(),xr:renderer.xr.enabled};
    try {
      renderer.xr.enabled=false;renderer.shadowMap.autoUpdate=false;renderer.setRenderTarget(target);
      renderer.setScissorTest(false);renderer.setClearColor(0,0);renderer.clear();renderer.render(reflectedScene,camera);
      diagnostics.captureCalls=renderer.info.render.calls;diagnostics.captures++;diagnostics.error=null;
      uniforms.vpMatrix.value.copy(bias).multiply(camera.projectionMatrix).multiply(camera.matrixWorldInverse);
      uniforms.vpReady.value=1;lastProjection.copy(camera.projectionMatrix);lastView.copy(camera.matrixWorldInverse);dirty=false;
      return true;
    } catch(error) {uniforms.vpReady.value=0;diagnostics.error=String(error);return false;}
    finally {
      renderer.setRenderTarget(previous.target);renderer.setClearColor(previous.color,previous.alpha);
      renderer.setViewport(previous.viewport);renderer.setScissor(previous.scissor);renderer.setScissorTest(previous.scissorTest);
      renderer.shadowMap.autoUpdate=previous.shadow;renderer.xr.enabled=previous.xr;
    }
  }
  const restored=()=>{dirty=true;uniforms.vpReady.value=0;};
  renderer.domElement.addEventListener('webglcontextrestored',restored);
  rebuildReflections();
  return {mesh,material,update({time,waterColor,skyColor}={}) {
    if(Number.isFinite(time))uniforms.vpTime.value=time;
    if(waterColor!==undefined)material.color.set(waterColor);
    if(skyColor!==undefined)uniforms.vpSky.value.set(skyColor);
  },capture,rebuildReflections,invalidate(){dirty=true;},diagnostics:()=>({...diagnostics,waterTime:uniforms.vpTime.value}),
  dispose(){if(disposed)return;disposed=true;renderer.domElement.removeEventListener('webglcontextrestored',restored);
    scene.remove(mesh);geometry.dispose();material.dispose();target.dispose();for(const o of root.children)o.geometry.dispose();}
  };
}
