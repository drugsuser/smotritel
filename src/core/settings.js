// Player settings, saved in localStorage. Add new settings to DEFAULTS.
const KEY = 'smotritel.settings';
const DEFAULTS = { sens: 1.0 };
export const settings = Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY) || '{}'));
export const saveSettings = () => localStorage.setItem(KEY, JSON.stringify(settings));
