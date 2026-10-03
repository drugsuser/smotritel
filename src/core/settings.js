// Player settings, saved in localStorage. Add new settings to DEFAULTS.
const KEY = 'smotritel.settings';
const DEFAULTS = { sens: 1.0, volume: 0.8, showFps: false, speed: 2.125, steps: 1.25 }; // speed/steps: TEMP tuning sliders
export const settings = Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY) || '{}'));
export const saveSettings = () => localStorage.setItem(KEY, JSON.stringify(settings));
