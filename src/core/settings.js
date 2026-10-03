// Player settings, saved in localStorage. Add new settings to DEFAULTS.
const KEY = 'smotritel.settings';
const DEFAULTS = { sens: 1.0, volume: 0.8, showFps: false };
function load() { // corrupted / blocked storage must not kill the game
  try { const v = JSON.parse(localStorage.getItem(KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
}
export const settings = Object.assign({}, DEFAULTS, load());
export const saveSettings = () => { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch {} };
