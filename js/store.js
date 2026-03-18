// Observable state store for AFL Training Planner

const _state = {
  playerCount: null,      // number | null
  category: null,         // category id string | null
  activeScreen: 'landing',// 'landing' | 'categories' | 'drills' | 'drillEditor'
  drills: [],             // merged drills (base + custom, minus deleted)
  baseDrills: [],         // raw drills from drills.json (never mutated)
  categories: [],         // all categories loaded from categories.json
  panelOpen: false,       // training plan panel open/closed
  activePlanId: null,     // id of the currently active plan
  plans: [],              // all plans (loaded + mutated, persisted to localStorage)
  selectedDrillId: null   // drill currently shown in diagram pane
};

const _subscribers = new Set();

export function getState() {
  return Object.freeze({ ..._state });
}

export function setState(patch) {
  Object.assign(_state, patch);
  const frozen = Object.freeze({ ..._state });
  _subscribers.forEach(fn => fn(frozen));
}

export function subscribe(fn) {
  _subscribers.add(fn);
  return () => _subscribers.delete(fn);
}
