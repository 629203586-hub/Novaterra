/* Natural Earth atlas with orthographic projection and direct manipulation. */
(() => {
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const radians = Math.PI / 180;
  window.initWorldGlobe = ({ onSelect = () => {} } = {}) => {
    const stage = document.querySelector('.globe-stage');
    if (!stage || stage.dataset.initialized) return;
    stage.dataset.initialized = 'true';
    stage.innerHTML = `
      <div class="atlas-heading"><span><i></i> THE LITTLE ATLAS</span><button class="atlas-search-toggle" aria-label="Find a country or region" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg> Find a place</button></div>
      <canvas id="globe" tabindex="0" role="img" aria-label="Interactive globe. Drag to rotate. Scroll or pinch to zoom. Use arrow keys to rotate, plus and minus to zoom, and Enter to open the country at the center. Find a place offers a searchable list." aria-describedby="atlasHelp"></canvas>
      <div class="atlas-tooltip" hidden></div>
      <div class="atlas-loading" role="status">Unfolding the world…</div>
      <div class="atlas-finder" hidden>
        <label for="atlasSearch">Where would you like to wander?</label>
        <div class="atlas-search-row"><input id="atlasSearch" type="search" placeholder="Search countries & regions" autocomplete="off"><button class="atlas-search-close" aria-label="Close place finder">×</button></div>
        <select id="atlasPlaces" size="5" aria-label="Countries and regions"></select>
        <div class="atlas-search-bottom"><span class="atlas-result-count" role="status"></span><button class="atlas-go" type="button">Go to place ↗</button></div>
      </div>
      <div class="atlas-bottom"><div class="atlas-tools" role="group" aria-label="Globe controls"><button class="atlas-zoom-out" aria-label="Zoom out">−</button><output class="atlas-zoom-value" aria-label="Globe zoom">100%</output><button class="atlas-zoom-in" aria-label="Zoom in">+</button><span></span><button class="atlas-reset" aria-label="Reset globe view" title="Reset view"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1.7 8M4 4v6h6"/></svg></button></div><button class="atlas-place" aria-label="Explore Japan"><span><i></i> OPEN TO EXPLORE</span><strong>Japan <b>↗</b></strong></button></div>
      <div class="atlas-help" id="atlasHelp">Drag to rotate <span>·</span> Scroll or pinch to zoom <span>·</span> Click a place</div>
      <div class="atlas-announcement sr-only" aria-live="polite"></div>`;
    const el = s => stage.querySelector(s);
    const t = (key,values) => window.EL.t(key,values);
    // These two regions share Australia's ISO code; retain their distinct map names.
    const nameOf = feature => ['ATC','IOA'].includes(feature.properties.id) ? feature.properties.name : window.EL.countryName(feature.properties.code, feature.properties.name);
    let mapFailed=false;
    const canvas = el('#globe'), ctx = canvas.getContext('2d');
    const projection = d3.geoOrthographic().clipAngle(90).precision(.35);
    const path = d3.geoPath(projection, ctx);
    const graticule = d3.geoGraticule10();
    const sphere = { type: 'Sphere' };
    let features = [], selected = null, hover = null, W = 600, H = 510, baseRadius = 170;
    let longitude = 105, latitude = 20, zoom = 1, frame = 0;
    let pointerStart = null, moved = false, pinching = false, pinchState = null;
    let labelHits = [];
    const pointers = new Map();
    const finder = el('.atlas-finder'), search = el('#atlasSearch'), select = el('#atlasPlaces');
    const tooltip = el('.atlas-tooltip');
    const colors = { Asia: '#a0b38b', Europe: '#9cad82', Africa: '#b4b993', 'North America': '#a8b78e', 'South America': '#a3b68d', Oceania: '#b6bf97', Antarctica: '#e3e8d7', 'Seven seas (open ocean)': '#b6bf97' };
    const activeCodes = new Set(['JP', 'CN', 'FR', 'RU', 'GL', 'DE', 'US', 'CH', 'KR', 'MA', 'IS']);

    function updateProjection() {
      baseRadius = Math.min(W * .36, H * .335);
      projection.rotate([-longitude, -latitude]).translate([W / 2, H * .465]).scale(baseRadius * zoom);
    }
    function visible(lonlat, margin = 0) { return d3.geoDistance([longitude, latitude], lonlat) < Math.PI / 2 - margin; }
    function pointOnCanvas(point, margin = 0) { return point && point[0] > margin && point[0] < W - margin && point[1] > 53 + margin && point[1] < H - 92 - margin; }
    function scheduleDraw() { if (document.body.dataset.screen !== 'explore') return; if (!frame) frame = requestAnimationFrame(() => { frame = 0; draw(); }); }
    function drawLabels() {
      const boxes = []; labelHits = [];
      const candidates = features.filter(f => visible(f.properties.label, .19)).sort((a, b) => {
        const rank = f => f === selected ? -20 : activeCodes.has(f.properties.code) ? -10 : f.properties.rank;
        return rank(a) - rank(b);
      });
      for (const feature of candidates) {
        const props = feature.properties;
        const isActive = activeCodes.has(props.code), isSelected = feature === selected;
        // At a distance, give the larger names room. Zooming reveals smaller places.
        if (!isActive && !isSelected && props.rank > (zoom > 2 ? 8 : zoom > 1.4 ? 5 : 3)) continue;
        const p = projection(props.label);
        if (!pointOnCanvas(p, 8)) continue;
        const fontSize = isActive || isSelected ? 11 : zoom > 1.6 ? 10.5 : 9.5;
        ctx.font = `${isActive || isSelected ? 600 : 400} ${fontSize}px Arial, sans-serif`;
        const name = nameOf(feature);
        const width = ctx.measureText(name).width;
        const x = p[0], y = p[1] + (isActive ? 17 : 0);
        const rect = { l: x - width / 2 - 5, r: x + width / 2 + 5, t: y - 10, b: y + 5 };
        if (rect.l < 4 || rect.r > W - 4 || boxes.some(b => b.l < rect.r && b.r > rect.l && b.t < rect.b && b.b > rect.t)) continue;
        boxes.push(rect);
        labelHits.push({ feature, l: rect.l - 3, r: rect.r + 3, t: Math.min(rect.t, p[1] - 9), b: rect.b + 4 });
        if (isActive) {
          ctx.beginPath(); ctx.arc(p[0], p[1] - 2, ['JP', 'CN', 'FR', 'RU', 'GL', 'DE', 'US', 'CH', 'KR'].includes(props.code) ? 4.5 : 3, 0, 2 * Math.PI);
          ctx.fillStyle = ['JP', 'CN', 'FR', 'RU', 'GL', 'DE', 'US', 'CH', 'KR'].includes(props.code) ? '#d58f7d' : '#f8f7e9'; ctx.fill();
          ctx.strokeStyle = ['JP', 'CN', 'FR', 'RU', 'GL', 'DE', 'US', 'CH', 'KR'].includes(props.code) ? '#fffdf3' : '#61784e'; ctx.lineWidth = 1.4; ctx.stroke();
          if (['JP', 'CN', 'FR', 'RU', 'GL', 'DE', 'US', 'CH', 'KR'].includes(props.code)) { ctx.beginPath(); ctx.arc(p[0], p[1] - 2, 8.5, 0, Math.PI * 2); ctx.strokeStyle = '#fef9e3b0'; ctx.lineWidth = 1; ctx.stroke(); }
        }
        ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeStyle = '#e7eddaaa'; ctx.strokeText(name, x, y);
        ctx.fillStyle = isActive ? '#3a5140' : '#506747'; ctx.fillText(name, x, y);
      }
    }
    function draw() {
      updateProjection(); ctx.clearRect(0, 0, W, H);
      const [cx, cy] = projection.translate(), radius = projection.scale();
      if (zoom < 1.5) {
        ctx.save(); ctx.translate(cx, cy + radius + 20); ctx.scale(1, .16);
        const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * .8);
        shadow.addColorStop(0, '#596b3d24'); shadow.addColorStop(1, '#596b3d00');
        ctx.fillStyle = shadow; ctx.beginPath(); ctx.arc(0, 0, radius * .8, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.3); ctx.setLineDash([2, 7]); ctx.strokeStyle = '#a7b59588'; ctx.lineWidth = .6;
        ctx.beginPath(); ctx.ellipse(0, 0, radius * 1.16, radius * .68, 0, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
      }
      ctx.save(); ctx.beginPath(); path(sphere); ctx.clip();
      const ocean = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
      ocean.addColorStop(0, '#e1e9d7'); ocean.addColorStop(.5, '#d1ddc3'); ocean.addColorStop(1, '#b7c8a7');
      ctx.fillStyle = ocean; ctx.fillRect(0, 0, W, H);
      ctx.beginPath(); path(graticule); ctx.lineWidth = .6; ctx.strokeStyle = '#f7f8e8a0'; ctx.stroke();
      for (const feature of features) {
        ctx.beginPath(); path(feature);
        ctx.fillStyle = feature === hover ? '#d6b79b' : feature === selected ? '#b3c18e' : (colors[feature.properties.continent] || '#a7b68b');
        ctx.fill(); ctx.strokeStyle = feature === hover ? '#a67f64' : '#e1e8ce'; ctx.lineWidth = feature === hover ? 1.1 : .55; ctx.stroke();
      }
      const shade = ctx.createRadialGradient(cx - radius * .4, cy - radius * .45, radius * .1, cx - radius * .1, cy - radius * .15, radius * 1.25);
      shade.addColorStop(0, '#ffffe82e'); shade.addColorStop(.65, '#f1f4d707'); shade.addColorStop(1, '#3c513155');
      ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H); ctx.restore();
      ctx.beginPath(); path(sphere); ctx.strokeStyle = '#aebc9a'; ctx.lineWidth = .8; ctx.stroke();
      drawLabels();
    }
    function resize() {
      const b = canvas.getBoundingClientRect(); W = b.width; H = b.height;
      const dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); scheduleDraw();
    }
    function setZoom(value) {
      zoom = clamp(value, .8, 3.2);
      el('.atlas-zoom-value').textContent = `${Math.round(zoom * 100)}%`;
      el('.atlas-zoom-in').disabled = zoom >= 3.2;
      el('.atlas-zoom-out').disabled = zoom <= .8;
      hideTooltip(); scheduleDraw();
    }
    function canvasPoint(e) { const b = canvas.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; }
    function featureAt(point, withLabels = true) {
      if (withLabels) { const hit = labelHits.find(b => point[0] >= b.l && point[0] <= b.r && point[1] >= b.t && point[1] <= b.b); if (hit) return hit.feature; }
      const [cx, cy] = projection.translate();
      if (Math.hypot(point[0] - cx, point[1] - cy) > projection.scale()) return null;
      const ll = projection.invert(point); if (!ll || !ll.every(Number.isFinite)) return null;
      const [lon, lat] = ll;
      return features.find(f => {
        const [[minLon, minLat], [maxLon, maxLat]] = f.bounds;
        if (lat < minLat || lat > maxLat) return false;
        if (minLon <= maxLon ? lon < minLon || lon > maxLon : lon < minLon && lon > maxLon) return false;
        return d3.geoContains(f, ll);
      }) || null;
    }
    function hideTooltip() { tooltip.hidden = true; }
    function setHover(feature, point) {
      if (hover !== feature) { hover = feature; scheduleDraw(); }
      canvas.style.cursor = feature ? 'pointer' : 'grab';
      if (!feature) { hideTooltip(); return; }
      tooltip.textContent = `${nameOf(feature)}  ↗`;
      tooltip.hidden = false;
      tooltip.style.left = `${clamp(point[0], 100, W - 100)}px`;
      tooltip.style.top = `${clamp(point[1] - 33, 55, H - 100)}px`;
    }
    function setSelected(feature) {
      if (!feature) return;
      selected = feature;
      const p = feature.properties, button = el('.atlas-place');
      button.querySelector('span').innerHTML = ['JP', 'CN', 'FR', 'RU', 'GL', 'DE', 'US', 'CH', 'KR'].includes(p.code) ? `<i></i> ${t('openNow')}` : `<i></i> ${t('soon')}`;
      button.querySelector('strong').textContent = nameOf(feature) + ' ↗';
      button.setAttribute('aria-label', `${t('explore')} ${nameOf(feature)}`);
      el('.atlas-announcement').textContent = t('selected',{place:nameOf(feature)});
      scheduleDraw();
    }
    function activate(feature, focus = false) {
      if (!feature) return;
      setSelected(feature); hideTooltip();
      if (focus) { longitude = feature.properties.label[0]; latitude = clamp(feature.properties.label[1], -80, 80); setZoom(Math.max(zoom, 1.2)); }
      onSelect({ ...feature.properties });
    }
    function reset() {
      longitude = 105; latitude = 20; hover = null; setZoom(1);
      setSelected(features.find(f => f.properties.code === 'JP'));
      el('.atlas-announcement').textContent = t('resetGlobe');
    }
    el('.atlas-zoom-in').addEventListener('click', () => setZoom(zoom * 1.25));
    el('.atlas-zoom-out').addEventListener('click', () => setZoom(zoom / 1.25));
    el('.atlas-reset').addEventListener('click', reset);
    el('.atlas-place').addEventListener('click', () => activate(selected));
    canvas.addEventListener('wheel', e => { e.preventDefault(); setZoom(zoom * Math.exp(-e.deltaY * .0015)); }, { passive: false });
    canvas.addEventListener('pointerdown', e => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      canvas.focus({ preventScroll: true }); hideTooltip(); hover = null;
      pointers.set(e.pointerId, canvasPoint(e)); canvas.setPointerCapture(e.pointerId);
      if (pointers.size === 1) { pointerStart = { point: canvasPoint(e), lon: longitude, lat: latitude }; moved = false; pinching = false; }
      else if (pointers.size === 2) {
        pinching = true; moved = true;
        const pts = [...pointers.values()]; pinchState = { distance: Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]), zoom };
      }
      canvas.style.cursor = 'grabbing';
    });
    let hoverFrame = 0, hoverPoint;
    canvas.addEventListener('pointermove', e => {
      const point = canvasPoint(e);
      if (pointers.has(e.pointerId)) {
        pointers.set(e.pointerId, point);
        if (pointers.size >= 2 && pinchState) {
          const pts = [...pointers.values()]; const distance = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
          setZoom(pinchState.zoom * distance / Math.max(pinchState.distance, 1)); return;
        }
        if (pointerStart && !pinching) {
          const dx = point[0] - pointerStart.point[0], dy = point[1] - pointerStart.point[1];
          if (Math.hypot(dx, dy) > 5) moved = true;
          if (moved) { longitude = pointerStart.lon - dx * .35 / zoom; latitude = clamp(pointerStart.lat + dy * .28 / zoom, -85, 85); scheduleDraw(); }
        }
      } else if (e.pointerType === 'mouse') {
        hoverPoint = point;
        if (!hoverFrame) hoverFrame = requestAnimationFrame(() => { hoverFrame = 0; setHover(featureAt(hoverPoint), hoverPoint); });
      }
    });
    const endPointer = (e, cancelled = false) => {
      if (!pointers.has(e.pointerId)) return;
      const click = !cancelled && !moved && !pinching && pointers.size === 1;
      pointers.delete(e.pointerId);
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      if (pointers.size === 0) { pointerStart = null; pinchState = null; canvas.style.cursor = 'grab'; }
      else if (pointers.size === 1 && pinching) { pinching = false; pinchState = null; moved = true; pointerStart = { point: [...pointers.values()][0], lon: longitude, lat: latitude }; }
      if (click) activate(featureAt(canvasPoint(e)));
    };
    canvas.addEventListener('pointerup', e => endPointer(e));
    canvas.addEventListener('pointercancel', e => endPointer(e, true));
    canvas.addEventListener('lostpointercapture', e => { if (pointers.has(e.pointerId)) endPointer(e, true); });
    canvas.addEventListener('pointerleave', () => { if (!pointers.size) { hover = null; hideTooltip(); scheduleDraw(); } });
    canvas.addEventListener('keydown', e => {
      if (e.key === '+' || e.key === '=') setZoom(zoom * 1.25);
      else if (e.key === '-') setZoom(zoom / 1.25);
      else if (e.key === '0' || e.key === 'Home') reset();
      else if (e.key === 'ArrowLeft') longitude -= 10 / zoom;
      else if (e.key === 'ArrowRight') longitude += 10 / zoom;
      else if (e.key === 'ArrowUp') latitude = clamp(latitude + 8 / zoom, -85, 85);
      else if (e.key === 'ArrowDown') latitude = clamp(latitude - 8 / zoom, -85, 85);
      else if (e.key === 'Enter') { const atCenter = featureAt(projection.translate(), false); if (atCenter) activate(atCenter); }
      else return;
      e.preventDefault(); hideTooltip(); scheduleDraw();
    });
    const toggleFinder = (open, returnFocus = false) => {
      finder.hidden = !open; el('.atlas-search-toggle').setAttribute('aria-expanded', String(open));
      if (open) { renderOptions(); search.focus(); } else if (returnFocus) el('.atlas-search-toggle').focus();
    };
    let indexedLocale='', indexedFeatures=null, searchIndex=[], renderedQuery=null, renderedLocale='', renderedFeatures=null;
    function renderOptions() {
      const query = search.value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const locale=window.EL.locale;
      if (renderedQuery===query && renderedLocale===locale && renderedFeatures===features) return;
      if (indexedLocale!==locale || indexedFeatures!==features) {
        searchIndex=features.map(f=>({feature:f,text:`${nameOf(f)} ${f.properties.name} ${f.properties.nativeName||''} ${f.properties.aliases||''} ${f.properties.code} ${f.properties.continent}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()}));
        indexedLocale=locale;indexedFeatures=features;
      }
      const results=searchIndex.filter(entry=>entry.text.includes(query)).map(entry=>entry.feature);
      renderedQuery=query;renderedLocale=locale;renderedFeatures=features;
      select.replaceChildren(...results.map(f => new Option(nameOf(f), f.id)));
      select.size = 5;
      el('.atlas-result-count').textContent = t('placeCount',{count:results.length});
      el('.atlas-go').disabled = !results.length;
      if (results.length) select.selectedIndex = 0;
    }
    function goToChosen() { const f = features.find(f => f.id === select.value); if (f) { toggleFinder(false, true); activate(f, true); } }
    search.addEventListener('input', renderOptions);
    search.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { e.preventDefault(); select.focus(); } else if (e.key === 'Enter') { e.preventDefault(); goToChosen(); } });
    select.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); goToChosen(); } });
    select.addEventListener('dblclick', goToChosen);
    el('.atlas-go').addEventListener('click', goToChosen);
    el('.atlas-search-toggle').addEventListener('click', () => toggleFinder(finder.hidden));
    el('.atlas-search-close').addEventListener('click', () => toggleFinder(false, true));
    finder.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); toggleFinder(false, true); } });
    document.addEventListener('pointerdown', e => { if (!finder.hidden && !finder.contains(e.target) && !el('.atlas-search-toggle').contains(e.target)) toggleFinder(false); });
    function localize(){
      el('.atlas-heading>span').textContent=t('atlasLabel');
      const toggle=el('.atlas-search-toggle'),icon=toggle.querySelector('svg')?.outerHTML||'';
      toggle.innerHTML=icon+' '+t('findPlace');toggle.setAttribute('aria-label',t('findPlace'));
      el('.atlas-finder label').textContent=t('findQuestion');search.placeholder=t('searchPlaceholder');
      el('.atlas-search-close').setAttribute('aria-label',t('close'));select.setAttribute('aria-label',t('searchPlaceholder'));
      el('.atlas-go').textContent=t('goPlace')+' ↗';el('.atlas-help').textContent=t('globeHelp');canvas.setAttribute('aria-label',t('globeHelp'));
      for(const [selector,key]of[['.atlas-zoom-in','zoomIn'],['.atlas-zoom-out','zoomOut'],['.atlas-reset','resetGlobe']]){el(selector).setAttribute('aria-label',t(key));el(selector).title=t(key);}
      el('.atlas-tools').setAttribute('aria-label',t('atlasLabel'));el('.atlas-zoom-value').setAttribute('aria-label',t('atlasLabel'));
      if(mapFailed){el('.atlas-loading').innerHTML=t('globeRetry')+'<br><button type="button">'+t('retry')+'</button>';el('.atlas-loading button').addEventListener('click',()=>location.reload());}
      else if(!features.length)el('.atlas-loading').textContent=t('globeLoading');
      if(!finder.hidden)renderOptions();if(selected)setSelected(selected);hideTooltip();scheduleDraw();
    }
    document.addEventListener('languagechange',localize);
    document.addEventListener('screenchange',event=>{if(event.detail.screen==='explore'){scheduleDraw();setTimeout(resize,680);}});
    window.addEventListener('resize',resize);
    new ResizeObserver(resize).observe(canvas); resize();localize();

    fetch('assets/countries.json').then(r => { if (!r.ok) throw new Error('Map unavailable'); return r.json(); }).then(data => {
      features = data.features;
      for (const f of features) {
        // The open miniature is inspired by the inhabited west coast.
        if(f.properties.code==='GL'){f.properties.label=[-51.1,69.2];f.properties.nativeName='Kalaallit Nunaat';}
        if(f.properties.code==='DE'){f.properties.label=[10.18,49.38];f.properties.nativeName='Deutschland';f.properties.aliases='DEU Germany German Frühlingsdorf Spring Village';}
        if(f.properties.code==='US'){f.properties.label=[-104,35.3];f.properties.nativeName='United States';f.properties.aliases='USA US America United States Route 66 Last Stop 66';}
        if(f.properties.code==='CH'){f.properties.label=[7.75,46.02];f.properties.nativeName='Schweiz';f.properties.aliases='CHE Switzerland Swiss Schweiz Suisse Svizzera Zermatt Matterhorn Alpendorf Alpine Village';}
        if(f.properties.code==='KR'){f.properties.label=[126.978,37.5665];f.properties.nativeName='대한민국 · 서울';f.properties.aliases='KOR Korea South Korea Seoul 한국 대한민국 서울 首尔 首爾 ソウル Séoul';}
        // D3 spherical geometry expects clockwise exteriors and reverse-wound holes.
        const polygons = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
        for (const polygon of polygons) for (let i = 0; i < polygon.length; i++) {
          const area = d3.geoArea({ type: 'Polygon', coordinates: [polygon[i]] });
          if ((i === 0 && area > 2 * Math.PI) || (i > 0 && area < 2 * Math.PI)) polygon[i].reverse();
        }
        f.bounds = d3.geoBounds(f);
      }
      el('.atlas-loading').hidden = true;
      setSelected(features.find(f => f.properties.code === 'JP')); if(!finder.hidden)renderOptions(); scheduleDraw();
    }).catch(() => {
      mapFailed=true;localize();
      el('.atlas-place').hidden = true; el('.atlas-search-toggle').disabled = true;
    });
  };
})();
