(() => {
  const state = new Map(), pending = new Set(), failed = new Set();
  let initialRequest, generation = 0, loadSequence = 0, statusTimer, refreshQueued = false;
  const status = document.createElement('div');
  status.className = 'likes-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  document.body.append(status);
  const l = (key,values,fallback) => window.EL?.t(key,values) ?? fallback;
  const format = n => new Intl.NumberFormat(window.EL?.locale || 'en-US').format(n);
  const countLabel = n => window.EL && !(window.EL.locale==='en' && n===1) ? l('likeCount',{count:format(n)},'') : `${format(n)} ${n===1?'like':'likes'}`;

  function notify(message) {
    status.textContent = message;
    status.classList.add('show');
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => status.classList.remove('show'), 4500);
  }
  async function request(url, options = {}) {
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, {credentials: 'same-origin', cache: 'no-store', ...options, signal: controller.signal});
      let data;
      try { data = await response.json(); }
      catch { throw new Error(l('connectError',{},'Likes could not connect. Please try again.')); }
      if (!response.ok) {
        const error = new Error(window.EL ? l('saveError',{},'Could not save your like. Please try again.') : data.error || 'Could not save your like. Please try again.');
        error.status = response.status;
        error.code = data.code;
        throw error;
      }
      return data;
    } finally { clearTimeout(timeout); }
  }
  function paint(button, animate = false) {
    const id = button.dataset.like, item = state.get(id), saving = pending.has(id), unavailable = failed.has(id);
    const count = button.querySelector('.like-count');
    button.disabled = saving;
    button.classList.toggle('is-loading', !item && !unavailable);
    button.classList.toggle('is-error', unavailable);
    button.setAttribute('aria-busy', String(saving));
    button.setAttribute('aria-pressed', String(Boolean(item?.liked)));
    const action = l(item?.liked?'unlike':'like',{},item?.liked?'Unlike':'Like'), name = button.dataset.country;
    button.setAttribute('aria-label', saving ? l('savingLike',{place:name},`Saving your like for ${name}`) : item
      ? `${action} ${name}. ${countLabel(item.count)}`
      : `${l('like',{},'Like')} ${name}. ${l(unavailable?'likesUnavailable':'loadingLikes',{},unavailable?'Likes unavailable. Click to retry':'Loading likes')}`);
    button.title = saving ? l('saving',{},'Saving your like…') : unavailable ? l('connectError',{},'Could not connect. Click to retry.') : item?.liked ? l('likeUndo',{},'You liked this world. Click to undo.') : l('likeSend',{},'Send this world a little love');
    const next = item ? format(item.count) : '—', previous = count.dataset.value;
    if (previous !== next) {
      count.innerHTML = animate && previous && previous !== '—'
        ? `<span class="like-count-old">${previous}</span><span class="like-count-new">${next}</span>`
        : `<span>${next}</span>`;
      count.dataset.value = next;
    }
    if (animate && item?.liked) {
      button.classList.remove('is-popping');
      requestAnimationFrame(() => button.classList.add('is-popping'));
      setTimeout(() => button.classList.remove('is-popping'), 700);
    }
  }
  function refreshButtons() { document.querySelectorAll('[data-like]').forEach(button => paint(button)); }
  window.refreshLikeButtons = refreshButtons;

  // The lock also covers first loads in other tabs, so their Set-Cookie responses
  // cannot create competing visitor identities. Older browsers fall back to cookies.
  function sessionRead() {
    const read = () => request('/api/likes');
    return navigator.locks?.request ? navigator.locks.request('elsewhere-likes-session', read) : read();
  }
  async function load() {
    const sequence = ++loadSequence, version = generation;
    const data = await sessionRead();
    if (sequence !== loadSequence || version !== generation) return;
    for (const [id, item] of Object.entries(data.places)) {
      if (!pending.has(id)) { state.set(id, item); failed.delete(id); }
      // Initial reads are allowed to supply the state needed by a waiting click.
      else if (!state.has(id)) state.set(id, item);
    }
    refreshButtons();
  }
  function initialize(force = false) {
    if (force) initialRequest = null;
    if (!initialRequest) initialRequest = load().catch(error => { initialRequest = null; throw error; });
    return initialRequest;
  }
  function refresh() {
    if (document.hidden || pending.size) { refreshQueued = true; return; }
    refreshQueued = false;
    load().catch(() => {});
  }
  let channel;
  try {
    if (typeof BroadcastChannel === 'function') {
      channel = new BroadcastChannel('elsewhere-likes');
      channel.addEventListener('message', event => { if (event.data?.type === 'changed') refresh(); });
    }
  } catch { /* Storage events provide a fallback. */ }
  window.addEventListener('storage', event => { if (event.key === 'elsewhere-likes-updated') refresh(); });
  function broadcast() {
    try {
      if (channel) channel.postMessage({type: 'changed'});
      else localStorage.setItem('elsewhere-likes-updated', `${Date.now()}:${Math.random()}`);
    } catch { /* A failed tab notification must not undo a saved vote. Periodic reads still work. */ }
  }
  async function save(id, desired) {
    const put = () => request(`/api/likes/${encodeURIComponent(id)}`, {
      method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({liked: desired})
    });
    try { return await put(); }
    catch (error) {
      if (error.status !== 409 || error.code !== 'SESSION_REQUIRED') throw error;
      await initialize(true);
      return put(); // Retry the same absolute state once; never add an extra vote.
    }
  }
  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-like]');
    if (!button) return;
    event.stopPropagation();
    const id = button.dataset.like;
    if (pending.has(id)) return;
    pending.add(id);
    failed.delete(id);
    refreshButtons();
    try {
      await initialize();
      if (!state.has(id)) await load();
      if (!state.has(id)) throw new Error(l('connectError',{},'Likes could not load. Please try again.'));
      const desired = !state.get(id).liked;
      generation++;
      const result = await save(id, desired);
      state.set(id, {count: result.count, liked: result.liked});
      failed.delete(id);
      document.querySelectorAll(`[data-like="${id}"]`).forEach(b => paint(b, true));
      broadcast();
      notify(result.liked ? l('likeThanks',{place:button.dataset.country},`A little love for ${button.dataset.country}. Thank you!`) : l('likeRemoved',{},'Your like has been removed.'));
    } catch (error) {
      failed.add(id);
      notify(error.name === 'AbortError' ? l('slowConnection',{},'The connection is taking a little longer. Please try again.') : error.message);
    } finally {
      pending.delete(id);
      refreshButtons();
      if (refreshQueued && !pending.size) refresh();
    }
  });
  initialize().catch(() => {
    document.querySelectorAll('[data-like]').forEach(button => failed.add(button.dataset.like));
    refreshButtons();
  });
  document.addEventListener('languagechange',refreshButtons);
  setInterval(refresh, 10000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.addEventListener('pageshow', event => { if (event.persisted) refresh(); });
})();
