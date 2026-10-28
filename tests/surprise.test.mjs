import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../dist/surprise.js', import.meta.url), 'utf8');
const context = { window: {}, Math, RangeError, setTimeout, clearTimeout };
vm.runInNewContext(source, context, { filename: 'surprise.js' });
const createDraw = context.window.createSurpriseDraw;
const places = [
  { id: 'japan', ready: true, href: 'japan.html' },
  { id: 'preview', ready: false, href: 'preview.html' },
  { id: 'china', ready: true, href: 'china.html' },
  { id: 'unlinked', ready: true },
  { id: 'france', ready: true, href: 'france.html' },
  { id: 'russia', ready: true, href: 'russia.html' },
  { id: 'greenland', ready: true, href: 'greenland.html' },
  { id: 'germany', ready: true, href: 'germany.html' },
  { id: 'usa', ready: true, href: 'usa.html' },
  { id: 'switzerland', ready: true, href: 'switzerland.html' },
  { id: 'korea', ready: true, href: 'korea.html' },
];

// The clock retains canceled callbacks so tests can also simulate a callback
// that was queued immediately before its dialog was closed or replaced.
function clock() {
  let now = 0, next = 0;
  const pending = new Map(), callbacks = new Map();
  return {
    pending, callbacks,
    setTimeout(callback, delay) {
      const id = ++next;
      pending.set(id, { at: now + delay, callback });
      callbacks.set(id, callback);
      return id;
    },
    clearTimeout(id) { pending.delete(id); },
    tick(duration) {
      const end = now + duration;
      for (;;) {
        const nextEntry = [...pending].filter(([, item]) => item.at <= end)
          .sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
        if (!nextEntry) break;
        const [id, item] = nextEntry;
        pending.delete(id); now = item.at; item.callback();
      }
      now = end;
    },
  };
}

function harness(options = {}) {
  const timers = clock(), changes = [];
  const draw = createDraw({
    places, random: () => 0, reducedMotion: () => false,
    setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout,
    onChange: state => changes.push(state), ...options,
  });
  return { draw, timers, changes };
}

test('only open destinations can win, and the wheel stops with the winner at its pointer', () => {
  const expected = ['japan', 'china', 'france', 'russia', 'greenland', 'germany', 'usa', 'switzerland', 'korea'];
  expected.forEach((id, index) => {
    let calls = 0;
    const { draw } = harness({ random: () => { calls++; return (index + 0.5) / expected.length; } });
    draw.start();
    const state = draw.getState();
    assert.equal(state.place.id, id);
    assert.equal(state.index, index);
    assert.equal(calls, 1, 'A draw samples once, rather than changing its result while rendering');
    const centerAtPointer = (state.turn + (index + 0.5) * 360 / expected.length) % 360;
    assert.ok(Math.min(centerAtPointer, 360 - centerAtPointer) < 1e-8);
    draw.cancel();
  });
  assert.throws(() => createDraw({ places: [{ ready: false }] }), RangeError);
});

test('the draw spins, waits one full second on the closed card, then reveals', () => {
  const { draw, timers, changes } = harness();
  draw.start();
  assert.equal(draw.getState().phase, 'spinning');
  assert.equal(draw.getState().duration, 2600);
  timers.tick(2599);
  assert.equal(draw.getState().phase, 'spinning');
  timers.tick(1);
  assert.equal(draw.getState().phase, 'waiting');
  timers.tick(999);
  assert.equal(draw.getState().phase, 'waiting');
  timers.tick(1);
  assert.equal(draw.getState().phase, 'revealed');
  assert.deepEqual(changes.map(state => state.phase), ['spinning', 'waiting', 'revealed']);
  assert.equal(timers.pending.size, 0);
});

test('closing during either animated stage prevents late callbacks from changing the dialog', () => {
  for (const elapsed of [0, 2600]) {
    const { draw, timers, changes } = harness();
    draw.start(); timers.tick(elapsed);
    const queued = [...timers.callbacks.values()], count = changes.length;
    draw.cancel();
    assert.equal(draw.getState().phase, 'idle');
    assert.equal(timers.pending.size, 0);
    queued.forEach(callback => callback());
    timers.tick(10000);
    assert.equal(changes.length, count, 'Cancel must remain silent even if an old callback was already queued');
    assert.equal(draw.getState().phase, 'idle');
  }
});

test('a second draw owns its result and timers even if the first callback still fires', () => {
  const samples = [0, 0.99];
  const { draw, timers, changes } = harness({ random: () => samples.shift() });
  draw.start();
  const firstCallback = [...timers.callbacks.values()][0];
  timers.tick(500); draw.start();
  const count = changes.length;
  firstCallback();
  assert.equal(changes.length, count);
  assert.equal(draw.getState().place.id, 'korea');
  assert.equal(draw.getState().phase, 'spinning');
  assert.equal(timers.pending.size, 1);
  timers.tick(2600);
  assert.equal(draw.getState().phase, 'waiting');
  timers.tick(1000);
  assert.equal(draw.getState().place.id, 'korea');
  assert.equal(draw.getState().phase, 'revealed');
});

test('reduced motion removes the wheel animation but preserves the one-second card reveal', () => {
  const { draw, timers } = harness({ reducedMotion: () => true });
  draw.start();
  assert.equal(draw.getState().duration, 0);
  timers.tick(0);
  assert.equal(draw.getState().phase, 'waiting');
  timers.tick(999);
  assert.equal(draw.getState().phase, 'waiting');
  timers.tick(1);
  assert.equal(draw.getState().phase, 'revealed');
});

test('switching to reduced motion during a spin finishes only that stage', () => {
  const { draw, timers, changes } = harness();
  draw.start(); timers.tick(200);
  const oldCallback = [...timers.callbacks.values()][0];
  draw.skipSpin();
  assert.equal(draw.getState().phase, 'waiting');
  draw.skipSpin(); oldCallback();
  assert.deepEqual(changes.map(state => state.phase), ['spinning', 'waiting']);
  timers.tick(999);
  assert.equal(draw.getState().phase, 'waiting');
  timers.tick(1);
  assert.equal(draw.getState().phase, 'revealed');
});

test('closing reentrantly from a stage update leaves no delayed work behind', () => {
  for (const phase of ['spinning', 'waiting']) {
    const timers = clock(), changes = [];
    let draw;
    draw = createDraw({ places, random: () => 0, reducedMotion: () => false,
      setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout,
      onChange(state) { changes.push(state.phase); if (state.phase === phase) draw.cancel(); },
    });
    draw.start(); timers.tick(2600);
    assert.equal(draw.getState().phase, 'idle');
    assert.equal(timers.pending.size, 0);
    timers.tick(10000);
    assert.equal(changes.includes('revealed'), false);
  }
});

test('a renderer cannot mutate the controller phase through its state snapshot', () => {
  const { draw, timers } = harness();
  draw.start();
  const snapshot = draw.getState();
  snapshot.phase = 'revealed'; snapshot.index = 99;
  assert.equal(draw.getState().phase, 'spinning');
  assert.equal(draw.getState().index, 0);
  timers.tick(3600);
  assert.equal(draw.getState().phase, 'revealed');
});
