// Shared mutable game state.
export const state = { paused: true, started: false };
export const keys = {};
addEventListener('keydown', (e) => keys[e.code] = true);
addEventListener('keyup', (e) => keys[e.code] = false);
export const $ = (id) => document.getElementById(id);
