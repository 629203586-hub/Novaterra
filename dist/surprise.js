/* The draw owns its timers; closing or restarting cannot reveal an old result. */
(() => {
  window.createSurpriseDraw = ({ places, random = Math.random,
    setTimeout: schedule = setTimeout, clearTimeout: unschedule = clearTimeout,
    onChange = () => {}, reducedMotion = () => false,
    spinDuration = 2600, revealDelay = 1000 } = {}) => {
    const openPlaces = (places || []).filter(p => p.ready && p.href).map(p => ({ ...p }));
    if (!openPlaces.length) throw new RangeError('A surprise needs an open destination.');
    const timers = new Set();
    let generation = 0, state = { phase: 'idle', index: null, place: null, turn: 0, duration: 0 };
    const getState = () => ({ ...state, place: state.place ? { ...state.place } : null });
    const emit = () => onChange(getState());
    function clearOwnedTimers() { timers.forEach(unschedule); timers.clear(); }
    function later(callback, delay, owner) {
      const id = schedule(() => { timers.delete(id); if (owner === generation) callback(); }, delay);
      timers.add(id);
    }
    function cancel() {
      generation++; clearOwnedTimers();
      state = { phase: 'idle', index: null, place: null, turn: 0, duration: 0 };
    }
    function finishSpin(owner) {
      if (owner !== generation || state.phase !== 'spinning') return;
      state.phase = 'waiting'; emit();
      if (owner === generation && state.phase === 'waiting') later(() => {
        state.phase = 'revealed'; emit();
      }, revealDelay, owner);
    }
    function start() {
      cancel(); const owner = generation, sample = Number(random());
      const index = Math.min(openPlaces.length - 1, Math.max(0, Math.floor((Number.isFinite(sample) ? sample : 0) * openPlaces.length)));
      const slice = 360 / openPlaces.length;
      state = { phase: 'spinning', index, place: openPlaces[index],
        turn: 5 * 360 + (360 - (index + .5) * slice) % 360,
        duration: reducedMotion() ? 0 : spinDuration };
      emit();
      if (owner === generation && state.phase === 'spinning') later(() => finishSpin(owner), state.duration, owner);
    }
    function skipSpin() {
      if (state.phase !== 'spinning') return;
      generation++; clearOwnedTimers(); finishSpin(generation);
    }
    return { start, cancel, skipSpin, getState };
  };
})();
