const CUSTOM_KEY  = 'afl_custom_drills';
const DELETED_KEY = 'afl_deleted_drills';

export function loadCustomDrills() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_KEY)) || []; }
  catch { return []; }
}

export function saveCustomDrill(drill) {
  const all = loadCustomDrills();
  const idx = all.findIndex(d => d.id === drill.id);
  if (idx >= 0) all[idx] = drill; else all.push(drill);
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(all));
}

export function removeCustomDrill(id) {
  const all = loadCustomDrills().filter(d => d.id !== id);
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(all));
}

export function loadDeletedIds() {
  try { return JSON.parse(localStorage.getItem(DELETED_KEY)) || []; }
  catch { return []; }
}

export function markDeleted(id) {
  const ids = new Set(loadDeletedIds());
  ids.add(id);
  localStorage.setItem(DELETED_KEY, JSON.stringify([...ids]));
}

// Merge base JSON drills with custom overrides, filtering deleted
export function mergeWithBase(baseDrills, customDrills) {
  const deleted = new Set(loadDeletedIds());
  const map = new Map(baseDrills.filter(d => !deleted.has(d.id)).map(d => [d.id, d]));
  customDrills.filter(d => !deleted.has(d.id)).forEach(d => map.set(d.id, d));
  return Array.from(map.values());
}
