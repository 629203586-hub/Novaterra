import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../dist/likes.js', import.meta.url), 'utf8');

// A small browser boundary: real promises and Response objects, controllable
// network completion, and only the DOM surface used by the country-card UI.
class Element {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.dataset = {};
    this.attributes = new Map();
    this.classes = new Set();
    this.children = [];
    this.disabled = false;
    this._html = '';
    this._text = '';
    this.classList = {
      add: (...names) => names.forEach(name => this.classes.add(name)),
      remove: (...names) => names.forEach(name => this.classes.delete(name)),
      contains: name => this.classes.has(name),
      toggle: (name, force) => {
        const enabled = force ?? !this.classes.has(name);
        if (enabled) this.classes.add(name); else this.classes.delete(name);
        return enabled;
      },
    };
  }
  set className(value) { this.classes = new Set(value.split(/\s+/).filter(Boolean)); }
  get className() { return [...this.classes].join(' '); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  append(...elements) { this.children.push(...elements); }
  get lastElementChild() { return this.children.at(-1) ?? null; }
  set textContent(value) { this._text = String(value); this._html = ''; this.children = []; }
  get textContent() { return this.children.length ? this.children.map(child => child.textContent).join('') : this._text; }
  set innerHTML(value) {
    this._html = String(value);
    this._text = this._html.replace(/<[^>]+>/g, '');
    this.children = [...this._html.matchAll(/<span\b[^>]*>(.*?)<\/span>/gs)].map(match => {
      const child = new Element('span');
      child.textContent = match[1].replace(/<[^>]+>/g, '');
      return child;
    });
  }
  get innerHTML() { return this._html; }
  querySelector(selector) { return selector === '.like-count' ? this.count : null; }
  closest(selector) { return selector === '[data-like]' && this.dataset.like ? this : null; }
}

function harness({ locks = false } = {}) {
  const listeners = new Map(), requests = [], timers = new Map(), intervals = new Map(), channels = [], errors = [];
  const button = new Element('button');
  button.dataset = { like: 'japan', country: 'Japan' };
  button.count = new Element('span');
  const body = new Element('body');
  const on = (name, handler) => {
    const entries = listeners.get(name) ?? [];
    entries.push(handler); listeners.set(name, entries);
  };
  const document = {
    body, hidden: false, visibilityState: 'visible',
    createElement: tag => new Element(tag),
    querySelectorAll: selector => selector === '[data-like]' || selector === '[data-like="japan"]' ? [button] : [],
    addEventListener: on,
  };
  let nextTimer = 1, lockTail = Promise.resolve();
  const navigator = locks ? { locks: { request: (_name, callback) => {
    const next = lockTail.then(callback);
    lockTail = next.catch(() => {});
    return next;
  } } } : {};
  class BroadcastChannel {
    constructor(name) { this.name = name; this.sent = []; this.listeners = []; channels.push(this); }
    postMessage(message) { this.sent.push(structuredClone(message)); }
    addEventListener(name, listener) { if (name === 'message') this.listeners.push(listener); }
    receive(data) {
      this.onmessage?.({ data });
      this.listeners.forEach(listener => listener({ data }));
    }
    close() {}
  }
  const context = {
    document, navigator, BroadcastChannel, AbortController, DOMException, Intl,
    console, Promise, URL, queueMicrotask,
    setTimeout: (callback, delay) => { const id = nextTimer++; timers.set(id, { callback, delay }); return id; },
    clearTimeout: id => timers.delete(id),
    setInterval: (callback, delay) => { const id = nextTimer++; intervals.set(id, { callback, delay }); return id; },
    clearInterval: id => intervals.delete(id),
    requestAnimationFrame: callback => queueMicrotask(() => callback(0)),
    addEventListener: on,
    fetch: (url, options = {}) => new Promise((resolve, reject) => {
      const request = { url, method: options.method ?? 'GET', options, resolve, reject };
      requests.push(request);
      options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    }),
  };
  context.window = context;
  vm.runInNewContext(source, context, { filename: 'likes.js' });

  function emit(name, event = {}) {
    for (const listener of listeners.get(name) ?? []) {
      try { Promise.resolve(listener(event)).catch(error => errors.push(error)); }
      catch (error) { errors.push(error); }
    }
  }
  async function settle() {
    for (let i = 0; i < 5; i++) await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(errors, [], 'DOM event handlers must not reject uncaught');
  }
  function respond(index, data, status = 200, type = 'application/json') {
    assert.ok(requests[index], `Request ${index} exists`);
    requests[index].resolve(new Response(type === 'application/json' ? JSON.stringify(data) : data, {
      status, headers: { 'Content-Type': type },
    }));
  }
  function summary(count, liked) { return { places: { japan: { count, liked } } }; }
  async function initialize(count = 0, liked = false) {
    await settle();
    assert.equal(requests[0].method, 'GET');
    assert.equal(requests[0].url, '/api/likes');
    respond(0, summary(count, liked));
    await settle();
  }
  function click({ force = false } = {}) {
    if (!button.disabled || force) emit('click', { target: button, stopPropagation() {}, preventDefault() {} });
  }
  function rendered() {
    return { liked: button.getAttribute('aria-pressed') === 'true', count: (button.count.lastElementChild ?? button.count).textContent };
  }
  function refresh() { emit('visibilitychange'); }
  function poll() { for (const timer of intervals.values()) timer.callback(); }
  function broadcast() {
    const channel = channels.find(entry => entry.name === 'elsewhere-likes');
    assert.ok(channel, 'A tab can receive country-like changes');
    channel.receive({ type: 'changed' });
  }
  return { requests, respond, summary, initialize, settle, click, rendered, refresh, poll, broadcast, button, channels,
    status: () => body.children.find(element => element.getAttribute('role') === 'status')?.textContent ?? '' };
}

test('rapid clicks send one write and restore the enabled button after success', async () => {
  const h = harness();
  await h.initialize();
  h.click(); await h.settle();
  assert.equal(h.button.disabled, true, 'The pending action is visibly unavailable');
  h.click(); h.click({ force: true }); await h.settle();
  assert.equal(h.requests.length, 2);
  assert.equal(h.requests[1].method, 'PUT');
  assert.deepEqual(JSON.parse(h.requests[1].options.body), { liked: true });
  h.respond(1, { country: 'japan', count: 1, liked: true }); await h.settle();
  assert.deepEqual(h.rendered(), { count: '1', liked: true });
  assert.equal(h.button.disabled, false);
  assert.ok(h.channels.some(channel => channel.sent.some(message => message.type === 'changed')), 'Other tabs are notified after a saved like');
});

test('a failed cross-tab notification does not turn a saved like into an error', async () => {
  const h = harness();
  await h.initialize();
  h.channels[0].postMessage = () => { throw new Error('Broadcast channel unavailable'); };
  h.click(); await h.settle();
  h.respond(1, { country: 'japan', count: 1, liked: true }); await h.settle();
  assert.deepEqual(h.rendered(), { count: '1', liked: true });
  assert.equal(h.button.disabled, false);
  assert.equal(h.button.classList.contains('is-error'), false);
  assert.match(h.status(), /thank you/i);
});

test('expired visitor session is re-established once and retries the original desired state', async () => {
  const h = harness();
  await h.initialize(7, false);
  h.click(); await h.settle();
  h.respond(1, { code: 'SESSION_REQUIRED', error: 'Please enable cookies and try again.' }, 409); await h.settle();
  assert.equal(h.requests[2]?.method, 'GET');
  h.respond(2, h.summary(8, true)); await h.settle();
  assert.equal(h.requests[3]?.method, 'PUT');
  assert.deepEqual(JSON.parse(h.requests[1].options.body), { liked: true });
  assert.deepEqual(JSON.parse(h.requests[3].options.body), { liked: true }, 'Recovery must not invert a newer server state');
  h.respond(3, { country: 'japan', count: 8, liked: true }); await h.settle();
  assert.equal(h.requests.length, 4);
  assert.deepEqual(h.rendered(), { count: '8', liked: true });
  assert.equal(h.button.disabled, false);
});

test('blocked cookies stop after one session retry and expose an honest error', async () => {
  const h = harness();
  await h.initialize();
  h.click(); await h.settle();
  const noSession = { code: 'SESSION_REQUIRED', error: 'Please enable cookies and try again.' };
  h.respond(1, noSession, 409); await h.settle();
  h.respond(2, h.summary(0, false)); await h.settle();
  h.respond(3, noSession, 409); await h.settle();
  assert.equal(h.requests.length, 4, 'No unbounded session recovery loop');
  assert.deepEqual(h.rendered(), { count: '0', liked: false });
  assert.equal(h.button.disabled, false);
  assert.match(h.status(), /cookie/i);
});

test('an initial load failure can be retried by clicking the country like', async () => {
  const h = harness();
  await h.settle();
  h.respond(0, { error: 'Likes are temporarily unavailable.' }, 503); await h.settle();
  assert.equal(h.button.disabled, false);
  h.click(); await h.settle();
  assert.equal(h.requests[1]?.method, 'GET');
  h.respond(1, h.summary(4, false)); await h.settle();
  assert.equal(h.requests[2]?.method, 'PUT');
  h.respond(2, { country: 'japan', count: 5, liked: true }); await h.settle();
  assert.deepEqual(h.rendered(), { count: '5', liked: true });
  assert.equal(h.button.disabled, false);
});

test('a delayed older refresh cannot replace newer rendered likes', async () => {
  const h = harness();
  await h.initialize(1, false);
  h.poll(); await h.settle();
  h.refresh(); await h.settle();
  assert.equal(h.requests.length, 3);
  h.respond(2, h.summary(6, true)); await h.settle();
  assert.deepEqual(h.rendered(), { count: '6', liked: true });
  h.respond(1, h.summary(2, false)); await h.settle();
  assert.deepEqual(h.rendered(), { count: '6', liked: true });
});

test('a refresh begun before a write cannot overwrite the completed write', async () => {
  const h = harness();
  await h.initialize();
  h.poll(); await h.settle();
  h.click(); await h.settle();
  assert.equal(h.requests[2]?.method, 'PUT');
  h.respond(2, { country: 'japan', count: 1, liked: true }); await h.settle();
  h.respond(1, h.summary(0, false)); await h.settle();
  assert.deepEqual(h.rendered(), { count: '1', liked: true });
});

test('a cross-tab notification refreshes shared totals without creating a vote', async () => {
  const h = harness();
  await h.initialize();
  h.broadcast(); await h.settle();
  assert.equal(h.requests.length, 2);
  assert.equal(h.requests[1].method, 'GET');
  h.respond(1, h.summary(3, true)); await h.settle();
  assert.deepEqual(h.rendered(), { count: '3', liked: true });
  assert.ok(h.requests.every(request => request.method === 'GET'));
});

test('a cross-tab refresh arriving during a write is applied after that write', async () => {
  const h = harness();
  await h.initialize();
  h.click(); await h.settle();
  h.broadcast(); await h.settle();
  assert.equal(h.requests.length, 2, 'Do not race a read against the pending mutation');
  h.respond(1, { country: 'japan', count: 1, liked: true }); await h.settle();
  assert.equal(h.requests[2]?.method, 'GET', 'The deferred notification is not lost');
  h.respond(2, h.summary(3, true)); await h.settle();
  assert.deepEqual(h.rendered(), { count: '3', liked: true });
});

test('an HTML error response gives a useful message and preserves the last confirmed count', async () => {
  const h = harness();
  await h.initialize(2, false);
  h.click(); await h.settle();
  h.respond(1, '<html><body>Sign in</body></html>', 503, 'text/html'); await h.settle();
  assert.deepEqual(h.rendered(), { count: '2', liked: false });
  assert.equal(h.button.disabled, false);
  assert.match(h.status(), /try|unavailable|unable|connection|could not/i);
  assert.doesNotMatch(h.status(), /unexpected token|JSON|<html>/i);
});

test('when browser locks are available, session reads do not overlap', async () => {
  const h = harness({ locks: true });
  await h.settle();
  h.refresh(); await h.settle();
  assert.equal(h.requests.length, 1);
  h.respond(0, h.summary(0, false)); await h.settle();
  assert.equal(h.requests.length, 2);
  h.respond(1, h.summary(1, false)); await h.settle();
  assert.deepEqual(h.rendered(), { count: '1', liked: false });
});

