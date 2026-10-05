const KEYS = {
  theme: "hpc-study-theme",
  completed: "hpc-study-completed",
  last: "hpc-study-last"
};

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export const state = {
  completed: readJSON(KEYS.completed, {}),
  last: (() => {
    try { return localStorage.getItem(KEYS.last) || ""; }
    catch { return ""; }
  })()
};

export function setLast(id) {
  state.last = id;
  try { localStorage.setItem(KEYS.last, id); } catch {}
}

export function isCompleted(id) {
  return Boolean(state.completed[id]);
}

export function toggleCompleted(id) {
  state.completed[id] = !state.completed[id];
  try { localStorage.setItem(KEYS.completed, JSON.stringify(state.completed)); } catch {}
  return state.completed[id];
}

export function completedCount() {
  return Object.values(state.completed).filter(Boolean).length;
}

export function readTheme() {
  try { return localStorage.getItem(KEYS.theme) === "dark" ? "dark" : "light"; }
  catch { return "light"; }
}

export function writeTheme(theme) {
  try { localStorage.setItem(KEYS.theme, theme); } catch {}
}
