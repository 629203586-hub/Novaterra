import * as THREE from '../../vendor/three/build/three.module.js';
import {mergeGeometries} from '../../vendor/three/examples/jsm/utils/BufferGeometryUtils.js';

// ============================================================================
// VALLENUOVA — the hero car: one strolling Ferrari-style berlinetta, parked
// on the piazza. Written as a standalone module so the town stays untouched.
//
//   const car = createFerrari(ctx,{x:13.5,z:17.8,rot:.5});
//   layout.ferrari = car;
//
// Everything lathes/lofts around a single shared material set: body paint
// (MeshPhysicalMaterial + clearcoat + procedural PMREM environment), satin
// trim, carbon, chrome, dark glass, rubber, forged rim, brake hardware,
// leather/alcantara interior, and three emissive families. Geometry is built
// once in car-local space and merged per material, so the whole car costs a
// few dozen draw calls instead of hundreds.
//
// Car-local space: +Z is the nose, +Y up, origin at the ground between the
// wheels. The group is placed at y = groundY (.8, the town floor) so the
// tyres touch the paving.
// ============================================================================

const TAU = Math.PI * 2, HALF = Math.PI / 2;
const GROUND_Y = .8;
const OPEN_ANGLE = -1.06;              // driver door swings out ~61°

// ---------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------
const ENV_CACHE = new WeakMap();
let BADGE_TEX = null, PLATE_TEX = null;

function textureCanvas(w, h, paint) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// A warm golden-hour equirectangular sky, PMREM-filtered once per renderer.
// The car's clearcoat reads the horizon/sun in this map, so highlights roll
// off like paint instead of like plastic.
function envTexture(renderer) {
  if (!renderer) return null;
  if (ENV_CACHE.has(renderer)) return ENV_CACHE.get(renderer);
  const tex = textureCanvas(512, 256, (c, w, h) => {
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#9fb8ce');
    sky.addColorStop(.30, '#c3d3dc');
    sky.addColorStop(.44, '#e3d9c8');
    sky.addColorStop(.495, '#f5ead6');
    sky.addColorStop(.515, '#b5ada0');
    sky.addColorStop(.62, '#a19b90');
    sky.addColorStop(.8, '#8c8a83');
    sky.addColorStop(1, '#777b7c');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    // the low sun: a hot core with a wide warm bleed
    const sun = c.createRadialGradient(w * .30, h * .44, 2, w * .30, h * .44, 92);
    sun.addColorStop(0, '#ffedcb');
    sun.addColorStop(.08, '#ffd9a2');
    sun.addColorStop(.3, '#f4a465');
    sun.addColorStop(.7, 'rgba(255,146,80,.22)');
    sun.addColorStop(1, 'rgba(255,140,80,0)');
    c.fillStyle = sun; c.fillRect(0, 0, w, h);
    // the town's warm facade bounce along the horizon
    const bounce = c.createLinearGradient(0, h * .5, 0, h * .68);
    bounce.addColorStop(0, 'rgba(255,210,152,.20)');
    bounce.addColorStop(1, 'rgba(196,122,80,0)');
    c.fillStyle = bounce; c.fillRect(0, h * .5, w, h * .2);
    // a couple of soft cloud bands to break up the reflections
    c.fillStyle = 'rgba(255,232,200,.09)';
    c.beginPath(); c.ellipse(w * .62, h * .31, 120, 7, -.05, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,226,190,.055)';
    c.beginPath(); c.ellipse(w * .82, h * .37, 90, 5, .04, 0, TAU); c.fill();
  });
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const rt = pmrem.fromEquirectangular(tex);
  tex.dispose(); pmrem.dispose();
  ENV_CACHE.set(renderer, rt.texture);
  return rt.texture;
}

// the little shield on the nose (and the tail)
function badgeTexture() {
  if (BADGE_TEX) return BADGE_TEX;
  BADGE_TEX = textureCanvas(64, 80, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    // shield
    c.beginPath();
    c.moveTo(6, 7); c.lineTo(w - 6, 7); c.lineTo(w - 6, h * .55);
    c.quadraticCurveTo(w - 6, h * .82, w / 2, h - 4);
    c.quadraticCurveTo(6, h * .82, 6, h * .55);
    c.closePath();
    c.fillStyle = '#f2c73f'; c.fill();
    c.lineWidth = 4; c.strokeStyle = '#141414'; c.stroke();
    // the black stallion, reduced to a silhouette at badge scale
    c.fillStyle = '#141414';
    c.beginPath();
    c.moveTo(30, 26); c.lineTo(38, 22); c.lineTo(43, 27); c.lineTo(39, 31);
    c.lineTo(44, 34); c.lineTo(41, 39); c.lineTo(45, 44); c.lineTo(39, 46);
    c.lineTo(40, 55); c.lineTo(35, 50); c.lineTo(34, 60); c.lineTo(30, 52);
    c.lineTo(28, 59); c.lineTo(27, 49); c.lineTo(22, 55); c.lineTo(24, 43);
    c.lineTo(19, 44); c.lineTo(24, 36); c.lineTo(20, 33); c.lineTo(25, 29);
    c.closePath(); c.fill();
    // top bar
    c.fillStyle = '#141414'; c.fillRect(10, 3, w - 20, 4);
  });
  return BADGE_TEX;
}

function plateTexture() {
  if (PLATE_TEX) return PLATE_TEX;
  PLATE_TEX = textureCanvas(192, 48, (c, w, h) => {
    c.fillStyle = '#eee8d8'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#1b3f7a'; c.fillRect(0, 0, 16, h); c.fillRect(w - 16, 0, 16, h);
    c.fillStyle = '#e8e4d4';
    c.fillRect(3, 18, 10, 2); c.fillRect(3, 22, 10, 2);
    c.fillRect(w - 13, 18, 10, 2); c.fillRect(w - 13, 22, 10, 2);
    c.fillStyle = '#232a2e'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold 27px Arial, sans-serif';
    c.fillText('VN 73', w / 2, h / 2 + 1);
    c.font = 'bold 7px Arial, sans-serif'; c.fillStyle = '#5d6168';
    c.fillText('VALLENUOVA', w / 2, 10);
  });
  return PLATE_TEX;
}

// unit primitives shared by every part of the car
const UNIT = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 12, 1),
  cyl24: new THREE.CylinderGeometry(1, 1, 1, 24, 1),
  cylOpen: new THREE.CylinderGeometry(1, 1, 1, 24, 1, true),
  cylHalf: new THREE.CylinderGeometry(1, 1, 1, 16, 1, true, 0, Math.PI),
  ball: new THREE.SphereGeometry(1, 12, 8),
  torus: new THREE.TorusGeometry(1, .14, 6, 20),
  torusThin: new THREE.TorusGeometry(1, .052, 6, 24),
  torusArch: new THREE.TorusGeometry(1, .12, 8, 24, Math.PI),
  plane: new THREE.PlaneGeometry(1, 1),
  spoke: new THREE.CylinderGeometry(.012, .026, 1, 4, 1),
  ring: new THREE.RingGeometry(.78, 1, 30),
  ringHalf: new THREE.RingGeometry(.84, 1, 26, 1, 0, Math.PI),
  torusThinArch: new THREE.TorusGeometry(1, .052, 6, 26, Math.PI),
};

const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function M4(x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
  _e.set(rx, ry, rz); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx, sy, sz);
  return new THREE.Matrix4().compose(_p, _q, _s);
}
const cm = (p0, p1, p2, p3, t) => {
  const t2 = t * t, t3 = t2 * t;
  return .5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
};

// ---------------------------------------------------------------------------
// sculpted surfaces
// ---------------------------------------------------------------------------
// Lateral loft for the body: each station is a side profile, interpolated with
// a Catmull-Rom pass so the surface flows instead of showing its stations.
function bodyLoft(sections, sub = 2) {
  const keys = ['wTop', 'wMax', 'wLow', 'topY', 'shY', 'botY', 'crown'];
  const secs = [];
  for (let i = 0; i < sections.length; i++) {
    const a = sections[i];
    if (i === 0) { secs.push({...a}); continue; }
    const b = sections[i - 1];
    const p0 = sections[Math.max(0, i - 2)], p3 = sections[Math.min(sections.length - 1, i + 1)];
    for (let k = 1; k <= sub; k++) {
      const t = k / (sub + 1), s = {z: THREE.MathUtils.lerp(b.z, a.z, t)};
      for (const key of keys) s[key] = Math.max(.001, cm(p0[key], b[key], a[key], p3[key], t));
      secs.push(s);
    }
    secs.push({...a});
  }
  const ringOf = (s) => {
    const crown = s.crown;
    return [
      [0, s.topY + crown],
      [s.wTop * .52, s.topY + crown * .58],
      [s.wTop, s.topY],
      [s.wTop + (s.wMax - s.wTop) * .55, s.shY + (s.topY - s.shY) * .44],
      [s.wMax, s.shY],
      [s.wLow + (s.wMax - s.wLow) * .5, s.botY + (s.shY - s.botY) * .46],
      [s.wLow, s.botY + .035],
      [0, s.botY],
    ].concat([
      [-s.wLow, s.botY + .035],
      [-(s.wLow + (s.wMax - s.wLow) * .5), s.botY + (s.shY - s.botY) * .46],
      [-s.wMax, s.shY],
      [-(s.wTop + (s.wMax - s.wTop) * .55), s.shY + (s.topY - s.shY) * .44],
      [-s.wTop, s.topY],
      [-s.wTop * .52, s.topY + crown * .58],
    ]);
  };
  const rings = secs.map(ringOf), R = rings[0].length, n = rings.length;
  const pos = [], uv = [], idx = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < R; j++) {
      pos.push(rings[i][j][0], rings[i][j][1], secs[i].z);
      uv.push(j / R, i / (n - 1));
    }
  }
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < R; j++) {
      const a = i * R + j, b = i * R + (j + 1) % R, c = (i + 1) * R + (j + 1) % R, d = (i + 1) * R + j;
      const zMid=(secs[i].z+secs[i+1].z)/2;
      // Real cabin opening: the seats are not buried under the body surface.
      const cabinTop=zMid<.70&&zMid>-.87&&[0,1,12,13].includes(j);
      const driverAperture=zMid<.60&&zMid>-.60&&[2,3,4].includes(j);
      if(!cabinTop&&!driverAperture)idx.push(a,b,c,a,c,d);
    }
  }
  // close the nose (+z) and the tail (-z)
  for (const front of [true, false]) {
    const section = front ? secs[0] : secs[secs.length - 1];
    const rr = ringOf(section);
    let my = 0; for (const p of rr) my += p[1]; my /= rr.length;
    const ci = pos.length / 3;
    pos.push(0, my, section.z); uv.push(.5, .5);
    for (let j = 0; j < R; j++) {
      const p = rr[j], q = rr[(j + 1) % R];
      const pa = pos.length / 3; pos.push(p[0], p[1], section.z); uv.push(j / R, front ? 1 : 0);
      const pb = pos.length / 3; pos.push(q[0], q[1], section.z); uv.push((j + 1) / R, front ? 1 : 0);
      if (front) idx.push(ci, pb, pa); else idx.push(ci, pa, pb);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// A thin grid surface from rows of [x,y,z] points (front->back, left->right).
function gridGeo(rows, flip = false) {
  const R = rows.length, C = rows[0].length, pos = [], uv = [], idx = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const p = rows[r][c]; pos.push(p[0], p[1], p[2]); uv.push(c / (C - 1), 1 - r / (R - 1));
  }
  for (let r = 0; r < R - 1; r++) for (let c = 0; c < C - 1; c++) {
    const a = r * C + c, b = a + 1, cc = a + C + 1, d = a + C;
    if (!flip) idx.push(a, b, cc, a, cc, d); else idx.push(a, cc, b, a, d, cc);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ============================================================================
export function createFerrari(ctx, opts = {}) {
  const scene = ctx.scene;
  const o = {
    x: opts.x ?? 0, z: opts.z ?? 0, y: opts.y ?? GROUND_Y,
    rot: opts.rot ?? 0, scale: opts.scale ?? 1, color: opts.color ?? '#9e0f16',
  };
  const env = envTexture(ctx.renderer);

  // ------------------------------------------------------------------ paint & kit
  const paint = new THREE.MeshPhysicalMaterial({
    color: o.color, metalness: .22, roughness: .28,
    clearcoat: .75, clearcoatRoughness: .12, envMap: env, envMapIntensity: .65,
  });
  const paintDeep = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(o.color).multiplyScalar(.52), metalness: .5, roughness: .38,
    clearcoat: .8, clearcoatRoughness: .12, envMap: env, envMapIntensity: .75,
  });
  const trim = new THREE.MeshPhysicalMaterial({
    color: '#15171a', metalness: .35, roughness: .42,
    clearcoat: .7, clearcoatRoughness: .22, envMap: env, envMapIntensity: .8,
  });
  const carbon = new THREE.MeshPhysicalMaterial({
    color: '#1a1d21', metalness: .72, roughness: .3,
    clearcoat: 1, clearcoatRoughness: .1, envMap: env, envMapIntensity: 1.0,
  });
  const chrome = new THREE.MeshPhysicalMaterial({
    color: '#dfe4e8', metalness: 1, roughness: .13, envMap: env, envMapIntensity: 1.45,
  });
  const rim = new THREE.MeshPhysicalMaterial({
    color: '#9aa1a8', metalness: .96, roughness: .34,
    clearcoat: .5, clearcoatRoughness: .14, envMap: env, envMapIntensity: 1.15,
  });
  const darkMetal = new THREE.MeshPhysicalMaterial({
    color: '#3b4046', metalness: .9, roughness: .36, envMap: env, envMapIntensity: .9,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#080d12', metalness: .06, roughness: .10, transparent: true, opacity: .82,
    clearcoat: .5, clearcoatRoughness: .08, envMap: env, envMapIntensity: .34,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const rubber = new THREE.MeshPhysicalMaterial({
    color: '#15171a', metalness: .04, roughness: .84,
    clearcoat: .12, clearcoatRoughness: .7, envMap: env, envMapIntensity: .25,
  });
  const rubberEdge = new THREE.MeshPhysicalMaterial({
    color: '#232629', metalness: .05, roughness: .7, envMap: env, envMapIntensity: .3,
  });
  const disc = new THREE.MeshPhysicalMaterial({
    color: '#75797d', metalness: .92, roughness: .42, envMap: env, envMapIntensity: .9,
  });
  const caliper = new THREE.MeshPhysicalMaterial({
    color: '#c8102e', metalness: .25, roughness: .26,
    clearcoat: 1, clearcoatRoughness: .08, envMap: env, envMapIntensity: .9,
  });
  const leather = new THREE.MeshPhysicalMaterial({
    color: '#5a4536', metalness: .04, roughness: .55, envMap: env, envMapIntensity: .4,
    side: THREE.DoubleSide,
  });
  const leatherLight = new THREE.MeshPhysicalMaterial({
    color: '#8a705c', metalness: .04, roughness: .5, envMap: env, envMapIntensity: .4,
    side: THREE.DoubleSide,
  });
  const alcantara = new THREE.MeshPhysicalMaterial({
    color: '#34383e', metalness: .02, roughness: .9, envMap: env, envMapIntensity: .2,
    side: THREE.DoubleSide,
  });
  const stitch = new THREE.MeshPhysicalMaterial({
    color: '#a8322a', metalness: .1, roughness: .5, envMap: env, envMapIntensity: .3,
    side: THREE.DoubleSide,
  });
  const lensDark = new THREE.MeshPhysicalMaterial({
    color: '#20262c', metalness: .9, roughness: .08, envMap: env, envMapIntensity: 1.5,
  });
  const glowWhite = new THREE.MeshStandardMaterial({
    color: '#fff6e6', emissive: '#fff3dc', emissiveIntensity: 2.4, roughness: .3, metalness: .1,
  });
  const glowRed = new THREE.MeshStandardMaterial({
    color: '#6a0b0a', emissive: '#ff2a18', emissiveIntensity: 2.7, roughness: .35, metalness: .1,
  });
  const glowAmber = new THREE.MeshStandardMaterial({
    color: '#6b3a08', emissive: '#ffa42e', emissiveIntensity: 1.9, roughness: .35, metalness: .1,
  });
  const screen = new THREE.MeshStandardMaterial({
    color: '#10222c', emissive: '#1d4a5e', emissiveIntensity: .9, roughness: .25, metalness: .4,
  });
  const dialFace = new THREE.MeshStandardMaterial({
    color: '#d9d2c2', emissive: '#5d5a4c', emissiveIntensity: .25, roughness: .5, metalness: .2,
  });
  const badge = new THREE.MeshStandardMaterial({
    map: badgeTexture(), transparent: true, roughness: .32, metalness: .45, envMap: env, envMapIntensity: .8,
  });
  const plate = new THREE.MeshStandardMaterial({
    map: plateTexture(), roughness: .55, metalness: .15,
  });
  const shadowTex = textureCanvas(256, 256, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 6, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(20,12,9,.62)');
    g.addColorStop(.45, 'rgba(20,12,9,.42)');
    g.addColorStop(.78, 'rgba(20,12,9,.13)');
    g.addColorStop(1, 'rgba(20,12,9,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });

  // ------------------------------------------------------------------ bin plumbing
  const bins = new Map();
  function push(mat, geo, mx, target = bins) {
    const c = geo.clone();
    c.applyMatrix4(mx);
    if (!c.getAttribute('uv')) c.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(c.getAttribute('position').count * 2), 2));
    const arr = target.get(mat);
    if (arr) arr.push(c); else target.set(mat, [c]);
  }
  const box = (mat, x, y, z, w, h, d, rx = 0, ry = 0, rz = 0, target = bins) =>
    push(mat, UNIT.box, M4(x, y, z, w, h, d, rx, ry, rz), target);
  const cyl = (mat, x, y, z, r, h, rx = 0, ry = 0, rz = 0, target = bins, unit = UNIT.cyl) =>
    push(mat, unit, M4(x, y, z, r, h, r, rx, ry, rz), target);
  const ball = (mat, x, y, z, sx, sy, sz, target = bins) =>
    push(mat, UNIT.ball, M4(x, y, z, sx, sy, sz), target);
  const torus = (mat, x, y, z, r, rx = 0, ry = 0, rz = 0, target = bins, unit = UNIT.torus) =>
    push(mat, unit, M4(x, y, z, r, r, r, rx, ry, rz), target);
  const plane = (mat, x, y, z, w, h, rx = 0, ry = 0, rz = 0, target = bins) =>
    push(mat, UNIT.plane, M4(x, y, z, w, h, 1, rx, ry, rz), target);
  function beam(mat, a, b, w0, w1, target = bins) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const dir = B.clone().sub(A), len = dir.length();
    const g = new THREE.CylinderGeometry(w1, w0, len, 4, 1);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    push(mat, g, new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(.5), q, new THREE.Vector3(1, 1, 1)), target);
    g.dispose();
  }
  function flush(binMap, parent, pre) {
    for (const [m, gs] of binMap) {
      const ns = gs.map(g => g.index ? g.toNonIndexed() : g);
      if (pre) ns.forEach(g => g.applyMatrix4(pre));
      const merged = mergeGeometries(ns, false);
      gs.forEach(g => g.dispose());
      ns.forEach((g, i) => { if (g !== gs[i]) g.dispose(); });
      if (!merged) { console.warn('[ferrari] could not merge', m?.name || m); continue; }
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, m);
      mesh.castShadow = !m.transparent && !m.userData.noCast;
      mesh.receiveShadow = true;
      parent.add(mesh);
    }
    binMap.clear();
  }

  // ------------------------------------------------------------------ assembly roots
  const group = new THREE.Group();
  group.name = 'ferrari';
  group.position.set(o.x, o.y, o.z);
  group.rotation.y = o.rot;
  group.scale.setScalar(o.scale);
  group.userData.ferrari = true;

  const bodyRoot = new THREE.Group(); bodyRoot.name = 'ferrari-body'; group.add(bodyRoot);
  const doorPivot = new THREE.Group(); doorPivot.name = 'ferrari-door';
  const HINGE = {x: .90, z: .60};
  doorPivot.position.set(HINGE.x, 0, HINGE.z);
  group.add(doorPivot);
  const doorBins = new Map();
  const doorLocal = (mx) => new THREE.Matrix4().makeTranslation(-HINGE.x, 0, -HINGE.z).multiply(mx);

  // ==========================================================================
  // BODY — the big sculpted volume
  // ==========================================================================
  const sections = [
    {z: 2.25, wTop: .28, wMax: .34, wLow: .26, topY: .500, shY: .380, botY: .300, crown: .010},
    {z: 2.16, wTop: .46, wMax: .58, wLow: .48, topY: .530, shY: .395, botY: .240, crown: .016},
    {z: 2.02, wTop: .62, wMax: .74, wLow: .62, topY: .560, shY: .415, botY: .210, crown: .022},
    {z: 1.86, wTop: .72, wMax: .84, wLow: .70, topY: .600, shY: .440, botY: .190, crown: .026},
    {z: 1.66, wTop: .78, wMax: .88, wLow: .72, topY: .630, shY: .460, botY: .175, crown: .030},
    {z: 1.42, wTop: .80, wMax: .90, wLow: .73, topY: .660, shY: .490, botY: .170, crown: .032},
    {z: 1.16, wTop: .81, wMax: .91, wLow: .73, topY: .710, shY: .510, botY: .165, crown: .032},
    {z: 0.92, wTop: .82, wMax: .92, wLow: .73, topY: .770, shY: .550, botY: .160, crown: .030},
    {z: 0.58, wTop: .82, wMax: .93, wLow: .73, topY: .820, shY: .585, botY: .155, crown: .024},
    {z: 0.18, wTop: .81, wMax: .94, wLow: .73, topY: .855, shY: .600, botY: .150, crown: .020},
    {z: -.24, wTop: .81, wMax: .95, wLow: .73, topY: .875, shY: .605, botY: .150, crown: .018},
    {z: -.66, wTop: .80, wMax: .95, wLow: .73, topY: .885, shY: .600, botY: .152, crown: .016},
    {z: -1.08, wTop: .79, wMax: .94, wLow: .72, topY: .885, shY: .590, botY: .158, crown: .014},
    {z: -1.46, wTop: .77, wMax: .92, wLow: .70, topY: .878, shY: .575, botY: .168, crown: .012},
    {z: -1.82, wTop: .73, wMax: .88, wLow: .67, topY: .860, shY: .550, botY: .185, crown: .012},
    {z: -2.00, wTop: .72, wMax: .86, wLow: .66, topY: .902, shY: .540, botY: .195, crown: .010},
    {z: -2.14, wTop: .66, wMax: .80, wLow: .61, topY: .858, shY: .520, botY: .210, crown: .008},
    {z: -2.24, wTop: .56, wMax: .70, wLow: .53, topY: .760, shY: .470, botY: .240, crown: .006},
  ];
  push(paint, bodyLoft(sections, 2), new THREE.Matrix4());
  // approximate body surface queries (used for creases, seams and details)
  function bodyAt(z) {
    const n = sections.length;
    if (z >= sections[0].z) return sections[0];
    if (z <= sections[n - 1].z) return sections[n - 1];
    for (let i = 0; i < n - 1; i++) {
      const a = sections[i], b = sections[i + 1];
      if (z <= a.z && z >= b.z) {
        const t = (a.z - z) / (a.z - b.z), o = {};
        for (const k of Object.keys(a)) o[k] = a[k] + (b[k] - a[k]) * t;
        return o;
      }
    }
    return sections[0];
  }

  // haunches: a muscular rear blister and a front fender crown that blend out
  // of the tub, so the arches read as part of the body instead of floating
  for (const s of [-1, 1]) {
    ball(paint, s * .845, .625, -1.40, .135, .235, .62);
    ball(paint, s * .855, .470, -1.44, .115, .175, .58);
    ball(paint, s * .820, .520, 1.40, .125, .215, .48);
  }

  // carbon underbody and side skirts
  box(carbon, 0, .125, 0, 1.42, .06, 3.5);
  for (const s of [-1, 1]) {
    box(carbon, s * .885, .175, .02, .05, .085, 2.5);
    box(carbon, s * .90, .23, .02, .022, .035, 2.4);
  }

  // front splitter: one carbon blade tucked under the bumper, flicked up at
  // the corners so it never reads as a floating plank
  box(carbon, 0, .168, 2.055, 1.50, .034, .26, -.03, 0, 0);
  box(carbon, 0, .145, 2.12, 1.16, .022, .12, -.05, 0, 0);
  box(trim, 0, .196, 2.055, 1.28, .075, .15, -.06, 0, 0);
  for (const s of [-1, 1]) {
    box(carbon, s * .740, .185, 2.00, .18, .030, .22, .02, s * .16, .12);
    box(trim, s * .70, .175, 2.03, .024, .075, .22, 0, s * .16, 0);
  }

  // front intakes: two side scoops with strakes, plus the low centre mouth
  for (const s of [-1, 1]) {
    box(trim, s * .54, .375, 2.055, .38, .17, .14, .10, s * .17, 0);
    for (let i = 0; i < 3; i++) box(carbon, s * (.42 + i * .10), .385, 2.115, .024, .12, .035, .10, s * .17, 0);
    box(paint, s * .54, .478, 2.02, .40, .028, .16, .16, s * .17, 0);
    box(paint, s * .54, .288, 2.085, .36, .028, .13, .10, s * .17, 0);
  }
  box(trim, 0, .30, 2.125, .62, .12, .10, .16, 0, 0);
  for (let i = 0; i < 5; i++) box(carbon, -.24 + i * .12, .30, 2.16, .02, .10, .03, .16, 0, 0);

  // bonnet louvres: a dark recess with three body-colour slats per side
  for (const s of [-1, 1]) {
    box(trim, s * .40, .769, 1.02, .23, .020, .32, -.34, s * .10, 0);
    for (let i = 0; i < 3; i++) box(paint, s * (.325 + i * .065), .780, 1.04 - i * .015, .038, .012, .26, -.34, s * .10, 0);
  }
  // subtle bonnet creases flowing back from the badge
  for (const s of [-1, 1]) {
    let prev = null;
    for (const z of [1.95, 1.70, 1.45, 1.20, .98]) {
      const sec = bodyAt(z), f = Math.min(1, .30 / sec.wTop);
      const p = [s * .30, sec.topY + sec.crown * (1 - f * f) + .006, z];
      if (prev) beam(paint, prev, p, .010, .010);
      prev = p;
    }
  }
  // shoulder character line, front wheel to tail
  for (const s of [-1, 1]) {
    let prev = null;
    for (const z of [1.78, 1.52, 1.14, .74, .32, -.06, -.44, -.86, -1.24, -1.62, -1.90]) {
      const sec = bodyAt(z);
      const p = [s * (sec.wMax + .006), sec.shY + .006, z];
      if (prev) beam(paint, prev, p, .007, .007);
      prev = p;
    }
  }

  // ==========================================================================
  // LIGHTS
  // ==========================================================================
  for (const s of [-1, 1]) {
    // swept paint brow above an angular dark housing
    box(paint, s * .56, .588, 1.985, .44, .062, .22, .22, s * .19, 0);
    box(trim, s * .54, .552, 2.040, .40, .145, .15, .20, s * .20, 0);
    box(lensDark, s * .54, .556, 2.107, .34, .098, .028, .20, s * .20, 0);
    // one continuous DRL blade + twin projector lamps
    box(glowWhite, s * .54, .602, 2.120, .33, .011, .016, .20, s * .20, 0);
    for (let i = 0; i < 2; i++) {
      const px = s * (.44 + i * .20);
      cyl(chrome, px, .550, 2.116, .046, .022, HALF, 0, 0);
      cyl(lensDark, px, .551, 2.130, .036, .012, HALF, 0, 0);
      cyl(glowWhite, px, .551, 2.137, .019, .008, HALF, 0, 0);
    }
    box(glowAmber, s * .745, .492, 2.072, .045, .020, .018, .12, s * .2, 0);
    // carbon aero flick under the lamp
    box(carbon, s * .70, .378, 1.995, .16, .016, .13, .12, s * .18, 0);
  }
  // rear light bar + round lenses (sunk into the tail panel)
  box(trim, 0, .678, -2.234, 1.14, .155, .05);
  box(glowRed, 0, .700, -2.252, .98, .030, .012);
  box(glowRed, 0, .650, -2.252, .90, .016, .012);
  for (const s of [-1, 1]) {
    torus(chrome, s * .455, .678, -2.253, .078, 0, 0, 0);
    cyl(glowRed, s * .455, .678, -2.258, .062, .024, HALF, 0, 0, bins, UNIT.cyl24);
    cyl(lensDark, s * .455, .678, -2.268, .046, .01, HALF, 0, 0, bins, UNIT.cyl24);
    cyl(glowWhite, s * .285, .632, -2.250, .020, .01, HALF, 0, 0);
    cyl(glowAmber, s * .305, .733, -2.246, .018, .012, HALF, 0, 0);
  }

  // ==========================================================================
  // REAR — deck, louvres, wing, diffuser, quad pipes
  // ==========================================================================
  // engine cover louvres between the buttresses
  for (let i = 0; i < 7; i++) {
    const z = -.95 - i * .135;
    box(trim, 0, .905 - i * .004, z, .58 - i * .012, .022, .085, -.10, 0, 0);
  }
  box(paint, 0, .89, -1.19, .70, .03, .10, -.10, 0, 0);
  box(paint, 0, .875, -1.83, .74, .035, .12, .10, 0, 0);
  // carbon edge along the top of the integrated ducktail
  box(carbon, 0, .907, -2.006, 1.24, .016, .10, .08, 0, 0);
  box(carbon, 0, .878, -2.128, 1.18, .014, .06, -.04, 0, 0);
  // diffuser: a dark box with five fins, outlined in carbon
  box(trim, 0, .21, -2.04, 1.46, .17, .42);
  box(carbon, 0, .155, -2.00, 1.52, .035, .5);
  for (let i = -2; i <= 2; i++) {
    box(carbon, i * .28, .135, -2.045, .020, .125, .38, .05, 0, 0);
  }
  // quad exhausts in a dark tail recess
  box(trim, 0, .355, -2.238, .66, .215, .03);
  for (const s of [-1, 1]) for (let i = 0; i < 2; i++) {
    const x = s * (.17 + i * .14);
    cyl(chrome, x, .355, -2.245, .048, .12, HALF, 0, 0, bins, UNIT.cyl24);
    cyl(trim, x, .355, -2.302, .040, .034, HALF, 0, 0, bins, UNIT.cyl24);
    cyl(darkMetal, x, .355, -2.310, .031, .018, HALF, 0, 0, bins, UNIT.cyl24);
  }
  // rear mesh grille + plate
  box(trim, 0, .425, -2.242, .64, .135, .03);
  for (let i = 0; i < 9; i++) box(carbon, -.29 + i * .0725, .425, -2.257, .010, .13, .012);
  plane(plate, 0, .535, -2.248, .30, .082, 0, Math.PI, 0);
  plane(badge, 0, .775, -2.240, .075, .095, 0, Math.PI, 0);
  plane(badge, 0, .545, 2.256, .072, .092, -.22, 0, 0);

  // ==========================================================================
  // SIDE DETAIL — intakes, mirrors, seams, filler, fender vents
  // ==========================================================================
  for (const s of [-1, 1]) {
    // side intake behind the door: dark inset + strakes under a paint brow
    box(trim, s * .938, .640, -.68, .040, .205, .48, 0, s * .03, s * .04);
    for (let i = 0; i < 3; i++) box(carbon, s * .950, .600 + i * .056, -.70, .018, .026, .38, 0, s * .03, 0);
    box(paint, s * .944, .752, -.66, .042, .045, .56, 0, s * .03, .08);
    box(paint, s * .941, .525, -.66, .040, .040, .54, 0, s * .03, -.06);
    // side skirt lip highlight
    box(paint, s * .90, .235, .02, .022, .02, 2.36);
    // panel seams: door outline + hood + engine cover
    box(trim, s * .895, .57, .60, .012, .52, .012, 0, 0, 0);
    box(trim, s * .892, .57, -.585, .012, .52, .012, 0, 0, 0);
    box(trim, s * .868, .848, .01, .012, .012, 1.16, .06, 0, 0);
    // fender vent behind the front wheel
    for (let i = 0; i < 3; i++) box(trim, s * .925, .52 - i * .002, .90 - i * .075, .02, .07, .022, 0, s * .25, .2);
    // fuel filler
    cyl(chrome, s * .912, .77, -1.02, .035, .016, 0, 0, HALF);
    // prancing-shield badge on the front fender
    plane(badge, s * .903, .515, .88, .058, .072, 0, s * HALF, 0);
    // passenger door handle (the driver's lives on the pivoting door)
    if (s < 0) box(chrome, s * .918, .79, -.28, .022, .03, .14, 0, 0, 0);
  }

  // mirrors: stalk + head + glass, both sides
  const mirror = (s, target) => {
    const m = target || bins;
    beam(chrome, [s * .862, .888, .50], [s * .950, .936, .478], .015, .012, m);
    box(paint, s * .975, .950, .470, .095, .056, .135, 0, s * .34, 0, m);
    box(paint, s * 1.014, .944, .455, .036, .038, .072, 0, s * .34, 0, m);
    box(lensDark, s * .992, .949, .406, .082, .042, .012, 0, s * .34, 0, m);
    box(chrome, s * .980, .949, .418, .086, .006, .010, 0, s * .34, 0, m);
  };
  mirror(-1);   // passenger side; the driver mirror rides on the door below

  // ==========================================================================
  // COCKPIT — glasshouse, roof, interior
  // ==========================================================================
  // ---- canopy: one continuous tinted glasshouse lofted from the cowl to the
  // engine deck. The driver-door band of the side surface is routed into the
  // door's bin set, so the glass swings with the door while the rest of the
  // canopy stays put. A painted roof plate sits on top of it.
  const canopy = [
    {z: .845, wB: .815, yB: .792, wR: .700, yR: .905, yT: .930},
    {z: .700, wB: .815, yB: .805, wR: .668, yR: .960, yT: .982},
    {z: .600, wB: .815, yB: .818, wR: .640, yR: 1.010, yT: 1.034},
    {z: .430, wB: .812, yB: .834, wR: .600, yR: 1.078, yT: 1.104},
    {z: .270, wB: .810, yB: .845, wR: .566, yR: 1.116, yT: 1.140},
    {z: .020, wB: .808, yB: .862, wR: .552, yR: 1.130, yT: 1.152},
    {z: -.330, wB: .803, yB: .878, wR: .532, yR: 1.124, yT: 1.146},
    {z: -.600, wB: .800, yB: .886, wR: .505, yR: 1.108, yT: 1.128},
    {z: -.660, wB: .799, yB: .886, wR: .500, yR: 1.104, yT: 1.122},
    {z: -.860, wB: .797, yB: .886, wR: .480, yR: 1.020, yT: 1.034},
    {z: -1.060, wB: .792, yB: .885, wR: .500, yR: .945, yT: .956},
    {z: -1.180, wB: .790, yB: .884, wR: .560, yR: .905, yT: .912},
  ];
  const canopyRing = (st) => {
    const midX = st.wB * .94, midY = st.yB + (st.yR - st.yB) * .45;
    return [
      [0, st.yT],
      [st.wR * .52, st.yT - .004],
      [st.wR, st.yR],
      [midX, midY],
      [st.wB, st.yB],
      [0, st.yB],
      [-st.wB, st.yB],
      [-midX, midY],
      [-st.wR, st.yR],
      [-st.wR * .52, st.yT - .004],
    ];
  };
  const RING_N = 10;
  // canopyPoint(z,t,side): t=0 at the belt edge, t=1 at the roof edge
  function canopyStation(z) {
    let a = canopy[0], b = canopy[canopy.length - 1];
    if (z >= a.z) return a;
    if (z <= b.z) return b;
    for (let i = 0; i < canopy.length - 1; i++) {
      const s0 = canopy[i], s1 = canopy[i + 1];
      if (z <= s0.z && z >= s1.z) {
        const u = (s0.z - z) / (s0.z - s1.z);
        const o = {};
        for (const k of ['wB', 'yB', 'wR', 'yR', 'yT']) o[k] = s0[k] + (s1[k] - s0[k]) * u;
        return o;
      }
    }
    return a;
  }
  function canopyPoint(z, t, side) {
    const st = canopyStation(z);
    const t2 = t < .5 ? t * 2 : (t - .5) * 2;
    const belt = [st.wB, st.yB];
    const mid = [st.wB * .94, st.yB + (st.yR - st.yB) * .45];
    const roof = [st.wR, st.yR];
    let x, y;
    if (t < .5) { x = belt[0] + (mid[0] - belt[0]) * t2; y = belt[1] + (mid[1] - belt[1]) * t2; }
    else { x = mid[0] + (roof[0] - mid[0]) * t2; y = mid[1] + (roof[1] - mid[1]) * t2; }
    return [side * x, y];
  }
  function canopyTopPoint(st, u) {
    const t = Math.abs(u);
    const x = u * st.wR;
    let y;
    if (t <= .52) y = st.yT - .004 * (t / .52);
    else y = (st.yT - .004) + (st.yR - (st.yT - .004)) * ((t - .52) / .48);
    return [x, y];
  }
  // a painted band following the canopy surface (pillars, cant rails)
  function canopyBand(mat, zA, zB, tA, tB, halfT, off, side) {
    const N = 7, rows = [];
    for (let k = 0; k <= N; k++) {
      const u = k / N, z = THREE.MathUtils.lerp(zA, zB, u), tc = THREE.MathUtils.lerp(tA, tB, u);
      const p0 = canopyPoint(z, Math.max(0, tc - halfT), side);
      const p1 = canopyPoint(z, Math.min(1, tc + halfT), side);
      rows.push([[p0[0] + off, p0[1] + .004, z], [p1[0] + off, p1[1] + .004, z]]);
    }
    push(mat, gridGeo(rows, true), new THREE.Matrix4());
  }
  // a thin trim band across the canopy at a fixed z (window divider)
  function canopyEdgeBand(mat, z, side, halfZ, off) {
    const rows = [];
    for (const t of [0, .25, .5, .75, 1]) {
      const p = canopyPoint(z, t, side);
      rows.push([[p[0] + off, p[1], z - halfZ], [p[0] + off, p[1], z + halfZ]]);
    }
    push(mat, gridGeo(rows, side > 0), new THREE.Matrix4());
  }
  // build the canopy as an indexed grid so shading stays smooth, then split
  // its faces between the static body and the swinging driver door
  {
    const pos = [], uv = [], faceList = [];
    for (let i = 0; i < canopy.length; i++) {
      const ring = canopyRing(canopy[i]);
      for (let j = 0; j < RING_N; j++) {
        pos.push(ring[j][0], ring[j][1], canopy[i].z);
        uv.push(j / RING_N, i / (canopy.length - 1));
      }
    }
    const idx = [];
    for (let i = 0; i < canopy.length - 1; i++) {
      for (let j = 0; j < RING_N; j++) {
        const j2 = (j + 1) % RING_N;
        const a = i * RING_N + j, b = i * RING_N + j2, c = (i + 1) * RING_N + j2, d = (i + 1) * RING_N + j;
        const zMid = (canopy[i].z + canopy[i + 1].z) / 2;
        // One owner per surface: no glass floor or glass under the painted roof.
        if(j===4||j===5)continue;
        if([0,1,8,9].includes(j)&&zMid<.271&&zMid>-.661)continue;
        const driver = (j === 2 || j === 3) && zMid < .601 && zMid > -.601;
        faceList.push({a, b, c, d, target: driver ? 'door' : 'body'});
        idx.push(a, b, c, a, c, d);
      }
    }
    const master = new THREE.BufferGeometry();
    master.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    master.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    master.setIndex(idx);
    master.computeVertexNormals();
    const nrm = master.getAttribute('normal').array;
    for (const target of ['body', 'door']) {
      const P = [], N = [], U = [];
      for (const f of faceList) {
        if (f.target !== target) continue;
        for (const vi of [f.a, f.b, f.c, f.a, f.c, f.d]) {
          P.push(pos[vi * 3], pos[vi * 3 + 1], pos[vi * 3 + 2]);
          N.push(nrm[vi * 3], nrm[vi * 3 + 1], nrm[vi * 3 + 2]);
          U.push(uv[vi * 2], uv[vi * 2 + 1]);
        }
      }
      if (!P.length) continue;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
      push(glass, g, new THREE.Matrix4(), target === 'door' ? doorBins : bins);
      g.dispose();
    }
    master.dispose();
  }
  // painted roof plate (and the dark headliner just under it)
  {
    const rows = [];
    for (const st of [canopy[4], canopy[5], canopy[6], canopy[8]]) {
      const row = [];
      for (const u of [-1, -.66, -.33, 0, .33, .66, 1]) {
        const p = canopyTopPoint(st, u);
        row.push([p[0], p[1] + .024, st.z]);
      }
      rows.push(row);
    }
    push(paint, gridGeo(rows), new THREE.Matrix4());
    const rows2 = rows.map(r => r.map(p => [p[0] * .96, p[1] - .022, p[2]]));
    push(alcantara, gridGeo(rows2, true), new THREE.Matrix4());
  }
  // A-pillars and C-buttresses as flat painted panels hugging the canopy,
  // plus a cant rail along each roof edge and trims at the door-glass cuts
  for (const s of [-1, 1]) {
    canopyBand(trim, .845, .27, .04, .96, .052, .012, s);
    canopyBand(trim, -.66, -1.18, .96, .04, .060, .012, s);
    canopyBand(trim, .27, -.66, .905, .905, .072, .010, s);
    canopyEdgeBand(trim, .60, s, .010, .014);
    canopyEdgeBand(trim, -.60, s, .010, .014);
  }
  // roof rail, belt trim, cowl and wipers
  for (const s of [-1, 1]) {
    const belt = [[.84, 0], [.30, 0], [-.20, 0], [-.70, 0], [-1.16, 0]];
    for (let k = 0; k < belt.length - 1; k++) {
      const p0 = canopyPoint(belt[k][0], 0, s), p1 = canopyPoint(belt[k + 1][0], 0, s);
      beam(chrome, [p0[0], p0[1] + .004, belt[k][0]], [p1[0], p1[1] + .004, belt[k + 1][0]], .012, .012);
    }
    box(trim, s * .36, .800, .825, .62, .020, .17, -.44, 0, s * .02);
  }
  for (const s of [-1, 1]) box(trim, s * .21, .806, .780, .32, .010, .018, 0, s * .35, 0);
  // front cowl edge trim across the base of the screen
  box(trim, 0, .800, .838, 1.48, .018, .026, -.10, 0, 0);

  // ---- dashboard (dark top pad, body-colour dash face)
  box(alcantara, 0, .862, .665, 1.25, .070, .27, 0, 0, 0);
  box(leather, 0, .800, .70, 1.22, .10, .18, 0, 0, 0);
  box(trim, 0, .878, .80, 1.20, .02, .10, -.20, 0, 0);
  // centre console + tunnel
  box(leather, 0, .52, -.12, .20, .18, 1.20);
  box(leather, 0, .70, .10, .26, .16, .86, .06, 0, 0);
  box(alcantara, 0, .60, -.62, 1.02, .04, .34);
  // centre screen + vents
  box(trim, 0, .778, .52, .24, .11, .03, -.2, 0, 0);
  plane(screen, 0, .79, .548, .20, .085, -.2, 0, 0);
  for (const s of [-1, 1]) {
    box(trim, s * .34, .83, .58, .16, .035, .02, -.1, 0, 0);
    for (let i = 0; i < 3; i++) box(chrome, s * (.28 + i * .06), .83, .57, .008, .03, .01);
  }
  // instrument binnacle + three dials (facing the driver, -z)
  box(leather, .375, .948, .585, .38, .075, .22, -.22, 0, 0);
  box(trim, .375, .945, .605, .34, .085, .02, -.22, 0, 0);
  for (let i = -1; i <= 1; i++) {
    const x = .375 + i * .105;
    torus(chrome, x, .948, .585, .052, 0, 0, 0);
    cyl(dialFace, x, .948, .594, .044, .012, 0, 0, 0);
    box(trim, x, .948, .600, .003, .026, .004, HALF, 0, 0);
  }
  // steering wheel + column
  {
    const sx = .375, sy = .925, sz = .445, tilt = Math.PI + .34;
    torus(leather, sx, sy, sz, .123, tilt, 0, 0, bins, UNIT.torus);
    for (let i = 0; i < 3; i++) {
      const a = i * TAU / 3 + .5;
      const dx = Math.cos(a) * .06, dy = Math.sin(a) * .06;
      box(alcantara, sx + dx, sy + dy * Math.cos(tilt), sz + dy * Math.sin(tilt), .025, .10, .022, tilt, 0, a);
    }
    cyl(chrome, sx, sy, sz + .02, .038, .02, tilt, 0, 0);
    cyl(leather, sx, sy, sz + .03, .052, .03, tilt, 0, 0);
    beam(darkMetal, [sx, .86, .53], [sx, sy - .02, sz + .03], .024, .02);
    cyl(stitch, sx, sy, sz + .045, .014, .006, tilt, 0, 0);
  }
  // bucket seats
  for (const s of [-1, 1]) {
    const sx = s * .375, sz = .015;
    box(leatherLight, sx, .555, sz, .42, .11, .54, 0, 0, 0);
    box(leatherLight, sx, .585, sz + .10, .36, .05, .32);
    for (const b of [-1, 1]) box(leather, sx + b * .195, .60, sz, .07, .16, .52, 0, 0, b * .12);
    box(leatherLight, sx, .755, sz - .19, .40, .40, .115, -.26, 0, 0);
    for (const b of [-1, 1]) box(leather, sx + b * .205, .74, sz - .18, .065, .34, .10, -.26, 0, b * .10);
    box(leatherLight, sx, .965, sz - .235, .24, .14, .10, -.18, 0, 0);
    for (const b of [-1, 1]) box(leather, sx + b * .145, .755, sz - .235, .055, .30, .075, -.32, 0, 0);
    // harness slots
    for (const b of [-1, 1]) box(stitch, sx + b * .06, .83, sz - .258, .022, .075, .02, -.26, 0, 0);
    // seat base stitching
    box(stitch, sx, .615, sz + .255, .30, .01, .012);
  }
  // rear shelf / bulkhead
  box(alcantara, 0, .69, -.72, .98, .05, .22);
  box(leather, 0, .60, -.80, 1.0, .18, .10);

  // ---- rear view mirror
  beam(trim, [0, 1.075, .28], [0, 1.05, .40], .016, .014);
  box(trim, 0, 1.045, .425, .16, .045, .03);

  // ==========================================================================
  // DOOR — driver side (+x): skin, card, glass, mirror, hardware
  // ==========================================================================
  // aperture recess (visible when the door is open)
  {
    const rows = [];
    for (const [z, x] of [[.58, .845], [.30, .878], [-.10, .890], [-.42, .875], [-.58, .850]]) {
      rows.push([[x, .40, z], [x, .57, z], [x, .70, z], [x, .82, z]]);
    }
    // build as rows(across height) x cols(along z) instead
    const rr = [];
    for (const [y, x] of [[.38, .818], [.52, .872], [.66, .888], [.80, .868], [.855, .838]]) {
      const row = [];
      for (const [z, f] of [[.58, .94], [.28, .98], [-.10, 1], [-.42, .985], [-.58, .95]]) row.push([x * f + .004, y, z]);
      rr.push(row);
    }
    // Keep the doorway empty instead of stacking a second side panel.
    // sill + frame trim
    box(chrome, .845, .352, .02, .03, .022, 1.14, 0, 0, 0);
    box(trim, .845, .85, .02, .02, .014, 1.16, 0, 0, 0);
    box(trim, .848, .60, .585, .03, .50, .016);
    box(trim, .848, .60, -.585, .03, .50, .016);
    box(stitch, .852, .60, .62, .008, .46, .006);
    // a little leather pull-cup, so the aperture has depth
    box(leather, .80, .68, -.34, .10, .10, .16);
    box(trim, .762, .74, -.05, .02, .03, .10);
    // warm ambient strip under the screen, seen through the glass
    box(glowWhite, 0, .872, .695, .58, .006, .018);
  }

  // door skin: follows the body surface, 12 mm proud so the shutline reads.
  // Built in car space, re-based on the hinge by flush().
  {
    const rr = [];
    for (const [y, x] of [[.36, .835], [.47, .895], [.58, .943], [.68, .923], [.79, .870], [.855, .838]]) {
      const row = [];
      for (const [z, f] of [[.60, .982], [.30, .994], [-.10, 1], [-.42, .994], [-.58, .980]]) {
        row.push([x * f + .012, y, z]);
      }
      rr.push(row);
    }
    push(paint, gridGeo(rr), new THREE.Matrix4(), doorBins);
    // door perimeter thickness / edge band
    box(paint, .930, .615, .60, .05, .50, .024, 0, 0, 0, doorBins);
    box(paint, .925, .615, -.58, .05, .50, .024, 0, 0, 0, doorBins);
    box(paint, .878, .368, .01, .06, .026, 1.17, 0, 0, 0, doorBins);
    box(paint, .862, .852, .01, .05, .024, 1.17, 0, 0, 0, doorBins);
    // door card (inner) + armrest + speaker + handle + red stitch
    box(leather, .848, .62, -.02, .022, .44, 1.04, 0, 0, 0, doorBins);
    box(leather, .800, .505, -.02, .075, .10, .72, 0, 0, 0, doorBins);
    box(alcantara, .760, .72, .02, .030, .18, .78, 0, 0, 0, doorBins);
    cyl(chrome, .806, .52, -.34, .072, .012, 0, 0, HALF, doorBins);
    cyl(trim, .798, .52, -.34, .058, .014, 0, 0, HALF, doorBins, UNIT.cyl24);
    box(chrome, .845, .78, -.30, .018, .03, .13, 0, 0, 0, doorBins);
    box(trim, .812, .70, .10, .03, .03, .24, 0, 0, 0, doorBins);
    box(stitch, .836, .62, -.02, .010, .010, .98, 0, 0, 0, doorBins);
    // mirror lives on the door; its glass is part of the canopy above
    box(chrome, .806, .878, .0, .012, .012, 1.16, .02, 0, 0, doorBins);
    beam(chrome, [.858, .892, .50], [.944, .938, .478], .015, .012, doorBins);
    box(paint, .968, .952, .470, .095, .056, .135, 0, .34, 0, doorBins);
    box(paint, 1.006, .946, .455, .036, .038, .072, 0, .34, 0, doorBins);
    box(lensDark, .985, .951, .406, .082, .042, .012, 0, .34, 0, doorBins);
    box(chrome, .973, .951, .418, .086, .006, .010, 0, .34, 0, doorBins);
    // door handle outside
    box(chrome, .943, .788, -.28, .022, .03, .14, 0, 0, 0, doorBins);
  }
  flush(doorBins, doorPivot, doorLocal(new THREE.Matrix4()));

  // ==========================================================================
  // WHEELS
  // ==========================================================================
  function buildWheelGeometry() {
    const wb = new Map();
    const wbox = (m, x, y, z, w, h, d, rx = 0, ry = 0, rz = 0) =>
      push(m, UNIT.box, M4(x, y, z, w, h, d, rx, ry, rz), wb);
    const wcyl = (m, x, y, z, r, h, rx = 0, ry = 0, rz = 0, unit = UNIT.cyl24) =>
      push(m, unit, M4(x, y, z, r, h, r, rx, ry, rz), wb);
    const R_TIRE = .328, W_TIRE = .285, R_RIM = .262;
    const WHEEL_Y = .341;

    // tyre: open carcass (so the forged rim shows through), rounded sidewalls
    // and a flat sidewall face around the rim opening
    wcyl(rubber, 0, 0, 0, R_TIRE, W_TIRE, 0, 0, HALF, UNIT.cylOpen);
    for (const s of [-1, 1]) {
      push(rubberEdge, UNIT.torus, M4(s * .120, 0, 0, R_TIRE - .030, R_TIRE - .030, .130, 0, HALF, 0), wb);
      push(rubber, UNIT.ring, M4(s * .1425, 0, 0, R_TIRE, R_TIRE, R_TIRE, 0, s * HALF, 0), wb);
    }
    for (const x of [-.09, 0, .09]) wcyl(trim, x, 0, 0, R_TIRE + .006, .014, 0, 0, HALF, UNIT.cylOpen);
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * TAU;
      for (const s of [-1, 1]) {
        wbox(rubberEdge, 0, Math.cos(a) * (R_TIRE + .007), Math.sin(a) * (R_TIRE + .007), .078, .016, .070, a, 0, 0);
        wbox(trim, s * .080, Math.cos(a + .13) * (R_TIRE + .005), Math.sin(a + .13) * (R_TIRE + .005), .004, .013, .046, a + .13, 0, 0);
      }
    }
    // rim barrel + lip + backing
    wcyl(darkMetal, -.015, 0, 0, R_RIM - .004, .215, 0, 0, HALF, UNIT.cylOpen);
    wcyl(trim, -.115, 0, 0, R_RIM - .02, .02, 0, 0, HALF);
    push(rim, UNIT.torusThin, M4(.108, 0, 0, R_RIM, R_RIM, R_RIM, 0, HALF, 0), wb);
    push(chrome, UNIT.torusThin, M4(.116, 0, 0, R_RIM - .004, R_RIM - .004, R_RIM - .004, 0, HALF, 0), wb);
    // ten spokes: five forged twin-spokes
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * TAU + .32;
      for (const [off, rad, len, xf] of [[0, .160, .210, .062], [.10, .152, .190, .048]]) {
        const ang = a + off;
        const g = new THREE.CylinderGeometry(.011, .026, len, 4, 1);
        const sc = M4(xf, Math.cos(ang) * rad, Math.sin(ang) * rad, 1, 1, 1, ang, 0, 0);
        push(rim, g, off ? M4(0, 0, 0, .66, .95, .66).premultiply(sc) : sc, wb);
        g.dispose();
      }
    }
    // hub, centre cap, nuts
    wcyl(rim, .055, 0, 0, .085, .06, 0, 0, HALF);
    wcyl(chrome, .098, 0, 0, .045, .022, 0, 0, HALF);
    wcyl(paintDeep, .113, 0, 0, .030, .008, 0, 0, HALF);
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * TAU + .32;
      wcyl(chrome, .082, Math.cos(a) * .062, Math.sin(a) * .062, .009, .03, HALF, 0, 0, UNIT.cyl);
    }
    // brake disc + drilled holes + hat
    wcyl(disc, -.005, 0, 0, .178, .024, 0, 0, HALF, UNIT.cyl24);
    wcyl(darkMetal, -.005, 0, 0, .070, .05, 0, 0, HALF);
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU;
      wcyl(trim, .010, Math.cos(a) * .128, Math.sin(a) * .128, .013, .012, HALF, 0, 0, UNIT.cyl);
    }
    // caliper (top-rear of the disc) with a chrome edge
    const ca = 2.35;
    wbox(caliper, -.004, Math.cos(ca) * .168, Math.sin(ca) * .168, .06, .085, .17, ca, 0, 0);
    wbox(chrome, .028, Math.cos(ca) * .168, Math.sin(ca) * .168, .012, .062, .13, ca, 0, 0);
    wbox(trim, .030, Math.cos(ca) * .208, Math.sin(ca) * .208, .012, .02, .11, ca, 0, 0);
    // wheel bearing / suspension, visible through the spokes
    wcyl(darkMetal, -.16, 0, 0, .05, .12, 0, 0, HALF);
    wcyl(trim, .02, -.11, .09, .028, .14, .4, 0, 0);

    // flush wheel bins into one spin group
    const spin = new THREE.Group();
    for (const [m, gs] of wb) {
      const ns = gs.map(g => g.index ? g.toNonIndexed() : g);
      const merged = mergeGeometries(ns, false);
      gs.forEach(g => g.dispose());
      ns.forEach((g, i) => { if (g !== gs[i]) g.dispose(); });
      const mesh = new THREE.Mesh(merged, m);
      mesh.castShadow = true; mesh.receiveShadow = true;
      spin.add(mesh);
    }
    return spin;
  }
  const wheelSpin = buildWheelGeometry();
  const wheels = [];
  for (const axle of [1, -1]) {
    for (const side of [-1, 1]) {
      const steer = new THREE.Group();
      steer.position.set(side * .800, .341, axle > 0 ? 1.42 : -1.46);
      steer.rotation.y = side < 0 ? Math.PI : 0;
      const spin = new THREE.Group();
      for (const m of wheelSpin.children) spin.add(new THREE.Mesh(m.geometry, m.material));
      steer.add(spin);
      group.add(steer);
      wheels.push({steer, spin, side, front: axle > 0});
    }
  }
  // wheel arches: a painted crown wrapping over the tyre, a dark arch gap
  // plate behind it and a flat painted lip at the outer edge
  for (const axle of [1, -1]) {
    for (const side of [-1, 1]) {
      const z = axle > 0 ? 1.42 : -1.46;
      // painted fender crown over the tyre (thin, so it reads as sheet metal)
      push(paint, UNIT.cylHalf, M4(side * .885, .341, z, .392, .160, .392, 0, 0, HALF));
      // dark arch gap (flat half-annulus behind the tyre face)
      push(trim, UNIT.ringHalf, M4(side * .922, .341, z, .399, .399, .399, 0, HALF, 0));
      // slim painted arch lip at the outer edge
      push(paint, UNIT.torusThinArch, M4(side * .952, .341, z, .393, .393, .30, 0, HALF, 0));
      // wheel-well liner inboard
      push(trim, UNIT.cylHalf, M4(side * .765, .341, z, .370, .30, .370, 0, 0, HALF));
      // suspension spring + damper behind the wheel
      cyl(darkMetal, side * .66, .44, z, .032, .28, 0, 0, side * .18);
      for (let i = 0; i < 5; i++) torus(darkMetal, side * .66, .295 + i * .042, z + .02, .050, 0, 0, 0, bins, UNIT.torus);
      // brake duct
      box(carbon, side * .58, .24, z + .20, .10, .06, .16, .3, 0, 0);
    }
  }

  // ==========================================================================
  // FINAL ASSEMBLY
  // ==========================================================================
  flush(bins, bodyRoot);

  // contact shadow under the car (kept in-scene by the model, so grounding is
  // correct in town; the inspection mode simply checks it already exists)
  const contactMat = new THREE.MeshBasicMaterial({
    map: shadowTex, transparent: true, opacity: .82, depthWrite: false, toneMapped: false,
  });
  const contactShadow = new THREE.Mesh(UNIT.plane, contactMat);
  contactShadow.rotation.x = -HALF;
  contactShadow.scale.set(2.55, 5.1, 1);
  contactShadow.position.set(0, .012, 0);
  contactShadow.renderOrder = 2;
  contactShadow.userData.contactShadow = true;
  group.add(contactShadow);

  // keep the group in the scene (the Lead's ctx.scene.add is then harmless)
  if (!group.parent) scene.add(group);

  // ------------------------------------------------------------------ door motion
  let doorAngle = 0, doorT = 1, doorFrom = 0, doorTo = 0, doorDur = .68;
  function doorTarget(v) { doorFrom = doorAngle; doorTo = v; doorT = 0; }
  function doorUpdate(dt) {
    if (doorT >= 1) return;
    doorT = Math.min(1, doorT + dt / doorDur);
    const s = doorT * doorT * (3 - 2 * doorT);
    doorAngle = doorFrom + (doorTo - doorFrom) * s;
    doorPivot.rotation.y = doorAngle;
  }
  doorPivot.rotation.y = 0;

  // ------------------------------------------------------------------ hotspots
  const HOT_LOCAL = {
    wheels: new THREE.Vector3(.93, .34, 1.42),
    interior: new THREE.Vector3(.28, .95, -.02),
    engine: new THREE.Vector3(0, .98, -1.40),
    rear: new THREE.Vector3(0, .72, -2.20),
    lights: new THREE.Vector3(.55, .60, 2.03),
  };
  const hotspots = {};
  function syncHotspots() {
    group.updateWorldMatrix(true, false);
    for (const k of Object.keys(HOT_LOCAL)) {
      const v = hotspots[k] || new THREE.Vector3();
      v.copy(HOT_LOCAL[k]);
      group.localToWorld(v);
      hotspots[k] = v;
    }
  }
  syncHotspots();

  const dims = {length: 4.5 * o.scale, width: 2.0 * o.scale, height: 1.17 * o.scale};

  // expose a couple of door meshes for the inspection raycast
  const doorMeshes = doorPivot.children.filter(m => m.isMesh);
  const doorPivotApi = {
    node: doorPivot,
    meshes: doorMeshes,
    mesh: doorMeshes[0] || doorPivot,
    open: () => doorTarget(OPEN_ANGLE),
    close: () => doorTarget(0),
    toggle: () => doorTarget(doorTo === 0 ? OPEN_ANGLE : 0),
    get isOpen() { return doorTo !== 0; },
    update: doorUpdate,
    get angle() { return doorAngle; },
  };

  const api = {
    group,
    body: bodyRoot,
    doorPivot: doorPivotApi,
    hotspots,
    syncHotspots,
    dims,
    wheels,
    materials: {paint, paintDeep, trim, carbon, chrome, rim, darkMetal, glass, rubber, disc, caliper, leather, glowWhite, glowRed, glowAmber},
    contactShadow,
    steer: (a) => { for (const w of wheels) if (w.front) w.steer.rotation.y = (w.side < 0 ? Math.PI : 0) + a; },
    update: (dt) => { doorUpdate(dt); },
    dispose: () => {
      group.removeFromParent();
      const geos = new Set(); group.traverse(obj => { if (obj.geometry) geos.add(obj.geometry); });
      geos.forEach(g => g.dispose());
      for (const m of Object.values(api.materials)) m.dispose?.();
      contactMat.dispose(); shadowTex.dispose();
      badgeTexture().dispose?.(); plateTexture().dispose?.();
    },
  };
  return api;
}
