import * as THREE from '../../vendor/three/build/three.module.js';

// ============================================================================
// VALLENUOVA — FERRARI INSPECTION
// A self-contained, cinematic inspection mode for the parked hero car. It
// injects its own style/DOM (no edits to index.html/styles.css), only shows
// its entry button when the player's orbit target is near the car, and uses
// the existing orthographic camera + OrbitControls as the interface.
//
//   const inspection = createFerrariInspection(ctx, world.layout.ferrari);
//   ctx.start(dt => { lighting.update(dt); inspection.update(dt); });
//   // call inspection.update AFTER lighting.update so the exposure lift wins
// ============================================================================

const HALF = Math.PI / 2;
const BODY_CLASS = 'ferrari-inspect';
const GLOBAL_ACTIVE = 'inspection-active';
const STYLE_ID = 'ferrari-inspection-style';
const ORBIT_RADIUS = 18;
const MIN_CAMERA_Y = 7.05;

const STYLE = `
.fi-root{position:fixed;inset:0;z-index:16;pointer-events:none;font-family:Arial,Helvetica,sans-serif;color:#f4f0e9}
.fi-root button{font:inherit;color:inherit;font-family:inherit}
.fi-root svg{display:block}
/* ---- entry button ---- */
.fi-btn{position:fixed;right:30px;bottom:172px;display:inline-flex;align-items:center;gap:11px;padding:12px 19px 12px 15px;border-radius:15px;border:1px solid #d7e2f136;background:#14223bcc;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 10px 40px #0003;cursor:pointer;pointer-events:auto;opacity:0;visibility:hidden;transform:translateY(9px);transition:opacity .45s,transform .45s,background .25s,border-color .25s,visibility .45s}
.fi-root.fi-near .fi-btn{opacity:1;visibility:visible;transform:none}
.fi-btn:hover{background:#1d3152e6;border-color:#8fb4e04d}
.fi-btn svg{width:27px;height:22px;stroke:#e8c79a;fill:none;stroke-width:1.25;stroke-linejoin:round;stroke-linecap:round}
.fi-btn .fi-btn-txt{display:flex;flex-direction:column;gap:3px;text-align:left}
.fi-btn b{font-size:10px;font-weight:400;letter-spacing:2.2px;color:#f2ead9}
.fi-btn small{font-size:7.5px;letter-spacing:1.5px;color:#a9b8cc}
body[data-time=day] .fi-btn{background:#f7f1e4ee;border-color:#4a3f2b26;box-shadow:0 10px 34px #3a2f1f1f}
body[data-time=day] .fi-btn:hover{background:#fffaf0;border-color:#8b6a3f4d}
body[data-time=day] .fi-btn svg{stroke:#8b5a33}
body[data-time=day] .fi-btn b{color:#2f3f36}
body[data-time=day] .fi-btn small{color:#7d7060}
body.ferrari-inspect .fi-btn{opacity:0!important;visibility:hidden!important;transform:translateY(9px)!important}
/* ---- inspection overlay ---- */
.fi-overlay{position:fixed;inset:0;pointer-events:none;opacity:0;transition:opacity .55s ease}
.fi-root.fi-active .fi-overlay{opacity:1}
.fi-title{position:absolute;left:30px;top:25px;min-width:212px;padding:15px 20px 14px;border-radius:15px;border:1px solid #d7e2f12b;background:#14223bd9;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 12px 40px #0003;pointer-events:auto}
.fi-kicker{font-size:8px;letter-spacing:2.8px;color:#e0b375;margin-bottom:7px}
.fi-title h2{font:400 21px/1 Georgia,'Times New Roman',serif;letter-spacing:1.2px;margin:0;color:#fff4e4}
.fi-title h2 i{font-style:normal;color:#c9945b;padding:0 3px}
.fi-title h2 b{font-weight:400;font-size:.72em;letter-spacing:2.4px;color:#e8dcc8;vertical-align:1px}
.fi-meta{margin-top:9px;display:flex;align-items:center;gap:7px;font-size:8px;letter-spacing:1.4px;color:#b3c0d3;white-space:nowrap}
.fi-meta s{text-decoration:none;opacity:.45}
.fi-back{position:absolute;right:30px;top:25px;display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border-radius:999px;border:1px solid #d7e2f12b;background:#14223bcc;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);font-size:9.5px;letter-spacing:1.8px;cursor:pointer;pointer-events:auto;color:#e9efe8;transition:background .25s,border-color .25s,color .25s}
.fi-back:hover{background:#1d3152e6;border-color:#8fb4e04d;color:#fff}
.fi-back i{font-style:normal;font-size:13px;line-height:1;opacity:.85}
.fi-chips{position:absolute;left:50%;bottom:32px;transform:translateX(-50%);display:flex;align-items:center;gap:4px;padding:6px;border-radius:15px;border:1px solid #d7e2f12b;background:#14223b8f;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 10px 36px #0003;pointer-events:auto}
.fi-chip{border:1px solid transparent;border-radius:9px;background:none;color:#bdc9db;padding:10px 16px;font-size:9px;letter-spacing:1.9px;cursor:pointer;transition:background .22s,color .22s,border-color .22s}
.fi-chip:hover{background:#93b2dd14;color:#f3f7fb}
.fi-chip[aria-pressed=true]{background:#c47a3f2e;border-color:#f0b0703d;color:#ffdcb0}
.fi-hint{position:absolute;left:30px;bottom:32px;display:flex;align-items:center;gap:9px;font-size:8.5px;letter-spacing:1.5px;color:#c3cede;padding:10px 15px;border-radius:999px;border:1px solid #d7e2f126;background:#14223b99;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
.fi-hint i{width:5px;height:5px;border-radius:50%;background:#f2c78a;box-shadow:0 0 8px #f2c78a66;font-style:normal}
.fi-vignette{position:fixed;inset:0;pointer-events:none;opacity:0;transition:opacity .7s ease;background:radial-gradient(ellipse at 50% 47%,transparent 42%,rgba(7,10,17,.46) 100%)}
.fi-root.fi-active .fi-vignette{opacity:1}
/* day-time skin, matching the town's daylight toolbar */
body[data-time=day] .fi-title,body[data-time=day] .fi-chips,body[data-time=day] .fi-back{background:#f7f1e4ee;border-color:#4a3f2b26;box-shadow:0 12px 34px #3a2f1f1a}
body[data-time=day] .fi-title h2{color:#2f3f36}
body[data-time=day] .fi-title h2 i{color:#a9673a}
body[data-time=day] .fi-title h2 b{color:#4a5a4c}
body[data-time=day] .fi-kicker{color:#8b5a33}
body[data-time=day] .fi-meta{color:#6b5a44}
body[data-time=day] .fi-back{color:#2f3f36}
body[data-time=day] .fi-back:hover{background:#fffaf0;color:#1f2f28}
body[data-time=day] .fi-chip{color:#4b5a4f}
body[data-time=day] .fi-chip:hover{background:#8b6a3f12;color:#26382c}
body[data-time=day] .fi-chip[aria-pressed=true]{background:#eacda380;border-color:#b98a4e55;color:#5a3b1f}
body[data-time=day] .fi-hint{color:#5f5140;background:#f7f1e4d9;border-color:#4a3f2b26}
body[data-time=day] .fi-vignette{background:radial-gradient(ellipse at 50% 47%,transparent 48%,rgba(58,44,26,.28) 100%)}
/* fade the town shell while inspecting */
body.ferrari-inspect .top,body.ferrari-inspect .title,body.ferrari-inspect .toolbar,body.ferrari-inspect .notes,body.ferrari-inspect .whole,body.ferrari-inspect .caption,body.ferrari-inspect .hint{opacity:0!important;pointer-events:none!important;transition:opacity .4s ease}
body.ferrari-inspect #city canvas{cursor:default}
@media(max-width:1100px){.fi-btn{bottom:156px}}
@media(max-width:700px){
 .fi-btn{right:16px;bottom:100px;padding:10px 14px 10px 12px;gap:8px}
 .fi-btn b{font-size:9px;letter-spacing:1.7px}
 .fi-btn small{font-size:7px;letter-spacing:1px}
 .fi-title{left:16px;top:16px;padding:12px 15px;min-width:0}
 .fi-title h2{font-size:17px}
 .fi-kicker{font-size:7px;letter-spacing:2px;margin-bottom:5px}
 .fi-meta{font-size:7px;gap:5px}
 .fi-back{right:16px;top:16px;padding:9px 13px;font-size:8.5px;letter-spacing:1.3px}
 .fi-chips{left:14px;right:14px;bottom:16px;transform:none;justify-content:space-between;gap:2px;padding:5px}
 .fi-chip{flex:1;padding:9px 2px;font-size:7.5px;letter-spacing:1px;text-align:center}
 .fi-hint{display:none}
}
@media(prefers-reduced-motion:reduce){.fi-root .fi-btn,.fi-root .fi-overlay,.fi-root .fi-vignette,body.ferrari-inspect .top,body.ferrari-inspect .toolbar{transition:none!important}}
`;

const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp = THREE.MathUtils.clamp;

// camera framing per hotspot, in car-local space
const VIEWS = {
  wheels: {anchor: new THREE.Vector3(.93, .34, 1.42), dir: new THREE.Vector3(.62, .40, .68), zoom: 2.7},
  interior: {anchor: new THREE.Vector3(.28, .95, -.02), dir: new THREE.Vector3(.30, .80, .52), zoom: 2.9},
  engine: {anchor: new THREE.Vector3(0, .98, -1.40), dir: new THREE.Vector3(.34, .62, -.70), zoom: 2.3},
  rear: {anchor: new THREE.Vector3(0, .72, -2.20), dir: new THREE.Vector3(.28, .48, -.83), zoom: 2.0},
  lights: {anchor: new THREE.Vector3(.55, .60, 2.03), dir: new THREE.Vector3(.58, .44, .78), zoom: 3.1},
};
const INITIAL_DIR = new THREE.Vector3(.55, .50, 1.00);

export function createFerrariInspection(ctx, ferrari, opts = {}) {
  const camera = ctx.camera, controls = ctx.controls, renderer = ctx.renderer, scene = ctx.scene;
  const car = ferrari;
  if (!car || !car.group) throw new Error('createFerrariInspection needs the object returned by createFerrari');
  const proximity = opts.proximity ?? 20;

  // ---------------------------------------------------------------- injected UI
  let styleEl = document.getElementById(STYLE_ID);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = STYLE;
    document.head.appendChild(styleEl);
  }
  const root = document.createElement('div');
  root.className = 'fi-root';
  root.innerHTML = `
    <button class="fi-btn" type="button" aria-label="Inspect the Ferrari">
      <svg viewBox="0 0 28 22" aria-hidden="true">
        <path d="M2 13.4h2.1l1.5-3.9c.35-.9 1.2-1.5 2.2-1.5h9.8c1 0 1.9.5 2.4 1.4l2.1 3.6h2.9"/>
        <path d="M7.3 10.4h13.2"/>
        <path d="M2.2 13.4c-.6 0-1 .5-1 1.1v1.6c0 .7.5 1.2 1.2 1.2h1"/>
        <path d="M25.8 13.4c.6 0 1 .5 1 1.1v1.6c0 .7-.5 1.2-1.2 1.2h-1"/>
        <circle cx="8" cy="15.4" r="2.1"/><circle cx="20" cy="15.4" r="2.1"/>
      </svg>
      <span class="fi-btn-txt"><b>INSPECT FERRARI</b><small>VEHICLE MODE</small></span>
    </button>
    <div class="fi-overlay" aria-hidden="true" inert>
      <div class="fi-title">
        <div class="fi-kicker">VEHICLE INSPECTION</div>
        <h2>FERRARI <i>·</i> <b>INSPECTION</b></h2>
        <div class="fi-meta"><span>ROSSO CORSA</span><s>·</s><span>MID ENGINE</span><s>·</s><span>TWO SEATS</span></div>
      </div>
      <button class="fi-back" type="button"><i>←</i> BACK TO TOWN</button>
      <div class="fi-chips" role="group" aria-label="Inspect a part of the car">
        <button class="fi-chip" type="button" data-hotspot="wheels" aria-pressed="false">WHEELS</button>
        <button class="fi-chip" type="button" data-hotspot="interior" aria-pressed="false">INTERIOR</button>
        <button class="fi-chip" type="button" data-hotspot="engine" aria-pressed="false">ENGINE</button>
        <button class="fi-chip" type="button" data-hotspot="rear" aria-pressed="false">REAR</button>
        <button class="fi-chip" type="button" data-hotspot="lights" aria-pressed="false">LIGHTS</button>
        <button class="fi-chip fi-door-control" type="button" aria-pressed="false">OPEN DOOR</button>
      </div>
      <div class="fi-hint"><i></i> DRAG TO ORBIT · SCROLL TO ZOOM · ESC TO EXIT</div>
      <div class="fi-vignette"></div>
    </div>`;
  document.body.appendChild(root);
  const btn = root.querySelector('.fi-btn');
  const overlay = root.querySelector('.fi-overlay');
  const backBtn = root.querySelector('.fi-back');
  const hintEl = root.querySelector('.fi-hint');
  const chips = [...root.querySelectorAll('.fi-chip[data-hotspot]')];
  const doorButton=root.querySelector('.fi-door-control');
  doorButton.addEventListener('click',()=>car.doorPivot.toggle());

  // ---------------------------------------------------------------- state
  const state = {
    mode: 'idle',            // idle | entering | active | exiting
    tween: null,
    saved: null,
    baseZoom: 8,
    minZoom: 5,
    maxZoom: 30,
    fill: null,
    contact: null,
    near: false,
    otherActive: false,
  };
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), carPos = new THREE.Vector3(), carCenter = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function refreshCar() {
    car.syncHotspots?.();
    car.group.updateWorldMatrix(true, false);
    car.group.getWorldPosition(carPos);
    tmp.set(0, .52, 0);
    carCenter.copy(car.group.localToWorld(tmp));
  }
  refreshCar();

  function computeBaseZoom() {
    const h = camera.top - camera.bottom, w = camera.right - camera.left;
    return clamp(Math.min(h * .36 / 2.45, w * .47 / 4.4), 3.2, 26);
  }

  function viewFor(dirLocal, anchorLocal) {
    car.group.updateWorldMatrix(true, false);
    const target = car.group.localToWorld(anchorLocal.clone());
    const dir = dirLocal.clone().normalize().applyQuaternion(car.group.quaternion);
    const pos = target.clone().addScaledVector(dir, ORBIT_RADIUS);
    if (pos.y < MIN_CAMERA_Y + .15) pos.y = MIN_CAMERA_Y + .15;
    if (target.y < 1.05) target.y = 1.05;
    return {pos, target};
  }

  // ---------------------------------------------------------------- transitions
  function startTween(to, dur, after) {
    state.tween = {
      fromPos: camera.position.clone(),
      fromTarget: controls.target.clone(),
      fromZoom: camera.zoom,
      toPos: to.pos.clone(),
      toTarget: to.target.clone(),
      toZoom: to.zoom,
      t: 0, dur: Math.max(.15, dur), after,
    };
    controls.enabled = false;
    controls.autoRotate = false;
  }
  function stepTween(dt) {
    const tw = state.tween;
    if (!tw) return;
    tw.t = Math.min(1, tw.t + dt / tw.dur);
    const s = easeInOut(tw.t);
    camera.position.lerpVectors(tw.fromPos, tw.toPos, s);
    controls.target.lerpVectors(tw.fromTarget, tw.toTarget, s);
    camera.zoom = THREE.MathUtils.lerp(tw.fromZoom, tw.toZoom, s);
    camera.updateProjectionMatrix();
    if (tw.t >= 1) {
      state.tween = null;
      tw.after?.();
    }
  }
  function clearChips() {
    for (const c of chips) c.setAttribute('aria-pressed', 'false');
  }

  // ---------------------------------------------------------------- lighting add-ons
  function addFillLight() {
    if (state.fill) return;
    const l = new THREE.PointLight('#ffc38a', 26, 12, 1.7);
    refreshCar();
    l.position.copy(carCenter).add(tmp.set(1.1, 3.0, 1.6));
    scene.add(l);
    state.fill = l;
  }
  function removeFillLight() {
    if (!state.fill) return;
    state.fill.removeFromParent();
    state.fill.dispose?.();
    state.fill = null;
  }
  function ensureContactShadow() {
    if (car.contactShadow && car.contactShadow.parent) return;
    if (state.contact) return;
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const rad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    rad.addColorStop(0, 'rgba(18,12,9,.55)'); rad.addColorStop(.55, 'rgba(18,12,9,.3)');
    rad.addColorStop(1, 'rgba(18,12,9,0)');
    g.fillStyle = rad; g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.MeshBasicMaterial({map: tex, transparent: true, depthWrite: false, toneMapped: false});
    const holder = new THREE.Group();
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    plane.rotation.x = -HALF;
    plane.scale.set((car.dims?.width ?? 2) * 1.35, (car.dims?.length ?? 4.5) * 1.12, 1);
    holder.add(plane);
    refreshCar();
    holder.position.set(carPos.x, carPos.y + .011, carPos.z);
    holder.rotation.y = car.group.rotation.y;
    scene.add(holder);
    state.contact = holder;
    state.contactTex = tex; state.contactMat = mat;
  }
  function removeContactShadow() {
    if (!state.contact) return;
    state.contact.removeFromParent();
    state.contact.traverse(o => o.geometry?.dispose());
    state.contactMat?.dispose(); state.contactTex?.dispose();
    state.contact = null; state.contactMat = null; state.contactTex = null;
  }

  // ---------------------------------------------------------------- enter / exit
  function enter() {
    if (state.mode !== 'idle') return;
    if (document.body.classList.contains(GLOBAL_ACTIVE)) return;
    refreshCar();
    state.baseZoom = computeBaseZoom();
    state.minZoom = state.baseZoom * .62;
    state.maxZoom = state.baseZoom * 3.9;
    state.saved = {
      pos: camera.position.clone(),
      target: controls.target.clone(),
      zoom: camera.zoom,
      enableDamping: controls.enableDamping,
      dampingFactor: controls.dampingFactor,
      enablePan: controls.enablePan,
      minZoom: controls.minZoom,
      maxZoom: controls.maxZoom,
      minPolarAngle: controls.minPolarAngle,
      maxPolarAngle: controls.maxPolarAngle,
      cursor: controls.cursor.clone(),
      maxTargetRadius: controls.maxTargetRadius,
      orbit: ctx.state?.orbit ?? false,
      exposure: renderer?.toneMappingExposure ?? 1,
      bloom: ctx.bloom?.strength ?? 0,
      doorOpen: !!car.doorPivot?.isOpen,
    };
    // take the orbit over: target follows the car, no panning, no auto-orbit
    controls.cursor.copy(carCenter);
    controls.maxTargetRadius = Infinity;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = .08;
    controls.minPolarAngle = .30;
    controls.maxPolarAngle = 1.24;
    controls.minZoom = .01; controls.maxZoom = 100;   // wide during the tween
    ctx.state && (ctx.state.orbit = false);
    controls.autoRotate = false;
    state.mode = 'entering';
    state.otherActive = false;
    document.body.classList.add(BODY_CLASS);
    document.body.classList.add(GLOBAL_ACTIVE);
    root.classList.add('fi-active');
    overlay.setAttribute('aria-hidden', 'false');overlay.inert=false;document.querySelectorAll('.world-header,.world-notes,.viewpoints,.toolbar-wrap,.title').forEach(el=>el.inert=true);
    addFillLight();
    ensureContactShadow();
    clearChips();
    hintEl.textContent = '';
    hintEl.innerHTML = '<i></i> DRAG TO ORBIT · SCROLL TO ZOOM · ESC TO EXIT';
    const view = viewFor(INITIAL_DIR, tmp2.set(0, .52, 0));
    startTween({pos: view.pos, target: view.target, zoom: state.baseZoom}, 1.5, () => {
      if (state.mode !== 'entering') return;
      state.mode = 'active';
      controls.minZoom = state.minZoom;
      controls.maxZoom = state.maxZoom;
      controls.enabled = true;
      controls.update();
    });
  }

  function exit() {
    if (state.mode === 'idle' || state.mode === 'exiting') return;
    const saved = state.saved;
    if (!saved) { hardReset(); return; }
    state.mode = 'exiting';
    document.body.classList.remove(BODY_CLASS);
    document.body.classList.remove(GLOBAL_ACTIVE);
    root.classList.remove('fi-active');
    overlay.setAttribute('aria-hidden', 'true');overlay.inert=true;document.querySelectorAll('.world-header,.world-notes,.viewpoints,.toolbar-wrap,.title').forEach(el=>el.inert=false);
    controls.minZoom = .01; controls.maxZoom = 100;   // wide during the tween
    car.doorPivot?.close();
    startTween({pos: saved.pos, target: saved.target, zoom: saved.zoom}, 1.25, () => finishExit(false));
  }

  function finishExit(instant) {
    const s = state.saved;
    if (s) {
      camera.position.copy(s.pos);
      controls.target.copy(s.target);
      camera.zoom = s.zoom;
      camera.updateProjectionMatrix();
      controls.enableDamping = s.enableDamping;
      controls.dampingFactor = s.dampingFactor;
      controls.enablePan = s.enablePan;
      controls.minZoom = s.minZoom;
      controls.maxZoom = s.maxZoom;
      controls.minPolarAngle = s.minPolarAngle;
      controls.maxPolarAngle = s.maxPolarAngle;
      controls.cursor.copy(s.cursor);
      controls.maxTargetRadius = s.maxTargetRadius;
      if (ctx.state) ctx.state.orbit = s.orbit;
      if (renderer) renderer.toneMappingExposure = s.exposure;
      if (ctx.bloom) ctx.bloom.strength = s.bloom;
    }
    if (instant) {
      document.body.classList.remove(BODY_CLASS);
      document.body.classList.remove(GLOBAL_ACTIVE);
      root.classList.remove('fi-active');
      overlay.setAttribute('aria-hidden', 'true');overlay.inert=true;document.querySelectorAll('.world-header,.world-notes,.viewpoints,.toolbar-wrap,.title').forEach(el=>el.inert=false);
    }
    state.mode = 'idle';
    state.saved = null;
    state.tween = null;
    controls.enabled = true;
    controls.autoRotate = false;
    removeFillLight();
    removeContactShadow();
    clearChips();
    if (renderer?.domElement) renderer.domElement.style.cursor = '';
  }
  function hardReset() { state.saved = null; finishExit(true); }

  // ---------------------------------------------------------------- hotspot fly-to
  function focus(key) {
    if (state.mode !== 'active') return;
    const v = VIEWS[key];
    if (!v) return;
    refreshCar();
    const target = car.group.localToWorld(v.anchor.clone());
    const dir = v.dir.clone().normalize().applyQuaternion(car.group.quaternion);
    const pos = target.clone().addScaledVector(dir, ORBIT_RADIUS);
    if (pos.y < MIN_CAMERA_Y + .15) pos.y = MIN_CAMERA_Y + .15;
    if (target.y < 1.05) target.y = 1.05;
    const zoom = clamp(state.baseZoom * v.zoom, state.minZoom, state.maxZoom);
    for (const c of chips) c.setAttribute('aria-pressed', String(c.dataset.hotspot === key));
    startTween({pos, target, zoom}, 1.0, () => {
      if (state.mode !== 'active') return;
      controls.enabled = true;
    });
  }

  // ---------------------------------------------------------------- interaction
  let downX = 0, downY = 0, downT = 0;
  const canvas = renderer?.domElement;
  function pointerNdc(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    return ndc;
  }
  function doorHit(e) {
    if (!canvas || state.mode !== 'active' || state.tween) return false;
    raycaster.setFromCamera(pointerNdc(e), camera);
    return raycaster.intersectObject(car.doorPivot.node, true).length > 0;
  }
  function onPointerDown(e) {
    if (state.mode !== 'active') return;
    downX = e.clientX; downY = e.clientY; downT = performance.now();
  }
  function onPointerUp(e) {
    if (state.mode !== 'active') return;
    if (e.button !== undefined && e.button !== 0) return;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 7) return;
    if (performance.now() - downT > 520) return;
    if (doorHit(e)) {
      car.doorPivot.toggle();
      clearChips();
      hintEl.innerHTML = car.doorPivot.isOpen
        ? '<i></i> DOOR OPEN · CLICK AGAIN TO CLOSE · ESC TO EXIT'
        : '<i></i> DRAG TO ORBIT · SCROLL TO ZOOM · ESC TO EXIT';
    }
  }
  function onPointerMove(e) {
    if (!canvas) return;
    if (state.mode !== 'active') { if (canvas.style.cursor) canvas.style.cursor = ''; return; }
    canvas.style.cursor = doorHit(e) ? 'pointer' : '';
  }
  function onKey(e) {
    if (state.mode === 'idle') return;
    if (e.key === 'Escape' || e.code === 'Escape') {
      e.preventDefault(); e.stopImmediatePropagation(); exit(); return;
    }
    // swallow the town shortcuts while the inspection camera owns the view
    if (['1', '2', '3', 'r', 'R', ' '].includes(e.key)) {
      e.stopImmediatePropagation();
      if (e.code === 'Space') e.preventDefault();
    }
  }
  function onOrbitStart() {
    if (state.mode !== 'active') return;
    clearChips();
  }
  function otherInspectionActive() {
    return document.body.classList.contains(GLOBAL_ACTIVE) && state.mode === 'idle';
  }

  btn.addEventListener('click', enter);
  backBtn.addEventListener('click', exit);
  for (const chip of chips) chip.addEventListener('click', () => focus(chip.dataset.hotspot));
  canvas?.addEventListener('pointerdown', onPointerDown);
  canvas?.addEventListener('pointerup', onPointerUp);
  canvas?.addEventListener('pointermove', onPointerMove);
  window.addEventListener('keydown', onKey, true);
  controls.addEventListener?.('start', onOrbitStart);

  // ---------------------------------------------------------------- per-frame
  function update(dt) {
    refreshCar();
    car.doorPivot?.update(dt);
    doorButton.textContent=car.doorPivot.isOpen?'CLOSE DOOR':'OPEN DOOR';
    doorButton.setAttribute('aria-pressed',String(car.doorPivot.isOpen));

    if (state.mode !== 'idle' && state.saved) {
      // lift the exposure and bloom a touch while the car is the subject. This
      // runs after lighting.update() so the cinematic grade sticks for the
      // frame; it is restored on exit.
      if (renderer) renderer.toneMappingExposure = state.saved.exposure * 1.045;
      if (ctx.bloom) ctx.bloom.strength = state.saved.bloom + .09;
    }

    if (state.tween) stepTween(dt);

    // proximity entry button
    const near = state.mode === 'idle'
      && !otherInspectionActive()
      && controls.target.distanceTo(carPos) < proximity;
    if (near !== state.near) {
      state.near = near;
      root.classList.toggle('fi-near', near);
    }
  }

  function dispose() {
    if (state.mode !== 'idle') finishExit(true);
    removeFillLight(); removeContactShadow();
    window.removeEventListener('keydown', onKey, true);
    controls.removeEventListener?.('start', onOrbitStart);
    canvas?.removeEventListener('pointerdown', onPointerDown);
    canvas?.removeEventListener('pointerup', onPointerUp);
    canvas?.removeEventListener('pointermove', onPointerMove);
    root.remove();
    if (styleEl && styleEl.parentNode) styleEl.remove();
    document.body.classList.remove(BODY_CLASS);
    document.body.classList.remove(GLOBAL_ACTIVE);
  }

  return {
    enter, exit, update, dispose,
    focus,
    isActive: () => state.mode !== 'idle',
    get mode() { return state.mode; },
    debug: () => ({mode: state.mode, baseZoom: state.baseZoom, minZoom: state.minZoom, maxZoom: state.maxZoom, near: state.near,
      camera: camera.position.toArray(), target: controls.target.toArray(), zoom: camera.zoom}),
  };
}
