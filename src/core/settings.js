// Player settings, saved in localStorage. Add new settings to DEFAULTS.
const KEY = 'smotritel.settings';
const DEFAULTS = { sens: 1.0, volume: 0.8, showFps: false, renderScale: 1.0 };
function load() { // corrupted / blocked storage must not kill the game
  try { const v = JSON.parse(localStorage.getItem(KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
}
// Saved values are not trusted: wrong type / NaN / out of range -> default or clamped.
// Ranges match the sliders in index.html. Unknown keys are dropped.
const RANGES = { sens: [0.1, 3], volume: [0, 1.5], renderScale: [0.5, 1] };
function clean(saved) {
  const out = { ...DEFAULTS };
  for (const k in DEFAULTS) {
    const v = saved[k], d = DEFAULTS[k];
    if (typeof d === 'boolean') { if (typeof v === 'boolean') out[k] = v; continue; }
    const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
    if (!Number.isFinite(n)) continue;
    const r = RANGES[k]; out[k] = r ? Math.min(r[1], Math.max(r[0], n)) : n;
  }
  return out;
}
export const settings = clean(load());
export const saveSettings = () => { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch {} };
